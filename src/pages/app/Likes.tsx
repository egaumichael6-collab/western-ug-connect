import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase, friendlyError } from "../../lib/supabase";
import { usePageMeta } from "../../lib/usePageMeta";
import type { MemberCard } from "../../lib/types";
import ProfileCard from "../../components/ProfileCard";
import { Alert, EmptyState, PageHeader, Spinner } from "../../components/ui";
import { timeAgo } from "../../lib/format";

type Row = Partial<MemberCard> & { at: string; request_id?: string; message?: string | null; status?: string };
interface Inbox { can_view: boolean; likes: Row[]; incoming: Row[]; outgoing: Row[] }

export default function Likes() {
  usePageMeta("Likes & requests", undefined, { noindex: true });
  const [tab, setTab] = useState<"likes" | "incoming" | "outgoing" | "saved">("incoming");
  const [inbox, setInbox] = useState<Inbox | null>(null);
  const [saved, setSaved] = useState<MemberCard[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [{ data, error }, fav] = await Promise.all([supabase.rpc("my_inbox"), supabase.rpc("my_favorites")]);
    if (error) setErr(friendlyError(error));
    setInbox((data as Inbox) ?? { can_view: false, likes: [], incoming: [], outgoing: [] });
    setSaved((fav.data ?? []) as MemberCard[]);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function respond(id: string, accept: boolean) {
    setErr(null);
    const { data, error } = await supabase.rpc("respond_connection_request", { p_request: id, p_accept: accept });
    if (error) return setErr(friendlyError(error));
    setFlash((data as { matched?: boolean })?.matched ? "Accepted — you're matched! Say hello in Messages." : "Request declined.");
    load();
  }

  if (!inbox) return <Spinner />;
  const tabs = [
    { k: "incoming", label: "Requests", n: inbox.incoming.length },
    { k: "likes", label: "Liked you", n: inbox.likes.length },
    { k: "outgoing", label: "Sent", n: inbox.outgoing.length },
    { k: "saved", label: "Saved", n: saved.length },
  ] as const;
  const locked = !inbox.can_view && (tab === "likes" || tab === "incoming");
  const list: Row[] = tab === "saved" ? (saved as unknown as Row[]) : inbox[tab];

  return (
    <div>
      <PageHeader title="Likes & connection requests" subtitle="See who is interested in you, and the people you've reached out to." />
      <div className="mb-5 flex flex-wrap gap-2" role="tablist">
        {tabs.map((t) => (
          <button key={t.k} role="tab" aria-selected={tab === t.k} onClick={() => setTab(t.k)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === t.k ? "bg-plum-800 text-white" : "bg-white text-plum-800 ring-1 ring-plum-200"}`}>
            {t.label} {t.n > 0 && <span className="ml-1 rounded-full bg-gold-400 px-1.5 text-xs text-plum-950">{t.n}</span>}
          </button>
        ))}
      </div>
      {flash && <div className="mb-4"><Alert kind="success">{flash}</Alert></div>}
      {err && <div className="mb-4"><Alert kind="error">{err}</Alert></div>}

      {locked ? (
        list.length === 0 ? (
          <EmptyState title="Nothing here yet">When members like you or send a request, it will appear here.</EmptyState>
        ) : (
          <div className="card p-8 text-center">
            <p className="font-display text-4xl font-bold text-plum-900">{list.length}</p>
            <p className="mt-1 text-slate-700">{tab === "likes" ? `member${list.length === 1 ? "" : "s"} liked your profile` : `connection request${list.length === 1 ? "" : "s"} waiting`} — most recent {timeAgo(list[0].at)}.</p>
            <p className="mt-2 text-sm text-slate-500">Activate a membership to see who they are and respond.</p>
            <Link to="/memberships" className="btn-gold mt-5">Explore Memberships</Link>
          </div>
        )
      ) : list.length === 0 ? (
        <EmptyState title="Nothing here yet" action={<Link to="/app/discover" className="btn-primary">Discover members</Link>}>
          {tab === "saved" ? "Tap ☆ Save on a profile to keep it here." : "Start by exploring profiles and expressing interest."}
        </EmptyState>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {list.map((r) => (
            <ProfileCard key={(r.request_id as string) ?? r.id} m={r as MemberCard} footer={
              tab === "incoming" ? (
                <div className="space-y-2">
                  {r.message && <p className="rounded-lg bg-plum-50 p-2 text-xs italic text-slate-700">"{r.message}"</p>}
                  <div className="flex gap-1.5">
                    <button className="btn-primary btn-sm flex-1" onClick={() => respond(r.request_id!, true)}>Accept</button>
                    <button className="btn-outline btn-sm flex-1" onClick={() => respond(r.request_id!, false)}>Decline</button>
                  </div>
                </div>
              ) : tab === "outgoing" ? (
                <p className="text-xs text-slate-500">{r.status === "declined" ? "Declined" : `Sent ${timeAgo(r.at)}`}</p>
              ) : tab === "likes" ? (
                <p className="text-xs text-slate-500">Liked you {timeAgo(r.at)}</p>
              ) : null
            } />
          ))}
        </div>
      )}
    </div>
  );
}
