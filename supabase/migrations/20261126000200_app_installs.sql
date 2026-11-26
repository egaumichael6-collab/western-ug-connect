-- =====================================================================
-- WESTERN UG CONNECT — which members installed the app (home-screen web app)
-- Recorded when a signed-in member installs the app, or opens it from the
-- home screen. Only admins/staff can read it.
-- =====================================================================

create table if not exists public.app_installs (
  user_id         uuid primary key references public.profiles (id) on delete cascade,
  platform        text not null default 'unknown' check (platform in ('android', 'ios', 'desktop', 'unknown')),
  installed_at    timestamptz not null default now(),
  last_opened_at  timestamptz,
  opens           int not null default 0
);
alter table public.app_installs enable row level security; -- no policies: only the functions below touch it
create index if not exists app_installs_installed_idx on public.app_installs (installed_at desc);

-- Called by the website for the signed-in member. p_event: 'installed' or 'opened'.
create or replace function public.record_app_use(p_event text, p_platform text default 'unknown')
returns void language plpgsql security definer
set search_path = public, pg_temp
as $$
declare v_platform text := case when p_platform in ('android', 'ios', 'desktop') then p_platform else 'unknown' end;
begin
  if auth.uid() is null or p_event not in ('installed', 'opened') then return; end if;
  if not exists (select 1 from public.profiles where id = auth.uid()) then return; end if;
  insert into public.app_installs as a (user_id, platform, installed_at, last_opened_at, opens)
  values (auth.uid(), v_platform, now(),
          case when p_event = 'opened' then now() end,
          case when p_event = 'opened' then 1 else 0 end)
  on conflict (user_id) do update set
    platform = case when excluded.platform <> 'unknown' then excluded.platform else a.platform end,
    last_opened_at = case when p_event = 'opened' then now() else a.last_opened_at end,
    opens = a.opens + case when p_event = 'opened' then 1 else 0 end;
end $$;

-- Admin list: members who have the app, newest first.
create or replace function public.admin_app_installs(p_limit int default 200)
returns jsonb language plpgsql stable security definer
set search_path = public, pg_temp
as $$
begin
  perform public.assert_staff();
  return jsonb_build_object(
    'total', (select count(*) from public.app_installs),
    'android', (select count(*) from public.app_installs where platform = 'android'),
    'ios', (select count(*) from public.app_installs where platform = 'ios'),
    'last_7_days', (select count(*) from public.app_installs where installed_at > now() - interval '7 days'),
    'members', coalesce((
      select jsonb_agg(x order by x.installed_at desc) from (
        select p.id, p.display_name, p.gender, p.district, a.platform, a.installed_at, a.last_opened_at, a.opens
        from public.app_installs a join public.profiles p on p.id = a.user_id
        order by a.installed_at desc
        limit greatest(1, least(coalesce(p_limit, 200), 1000))
      ) x), '[]'::jsonb)
  );
end $$;

revoke execute on function public.record_app_use(text, text) from public, anon;
revoke execute on function public.admin_app_installs(int) from public, anon;
grant execute on function public.record_app_use(text, text) to authenticated;
grant execute on function public.admin_app_installs(int) to authenticated;

select 'app_installs ready' as status, count(*) as rows from public.app_installs;
