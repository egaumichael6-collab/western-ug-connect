import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase, friendlyError } from "../../lib/supabase";
import { usePageMeta } from "../../lib/usePageMeta";
import type { SubscriptionRow } from "../../lib/types";
import type { Tier } from "../../lib/config";
import { daysLeft, fmtDateTime } from "../../lib/format";
import { Alert, EmptyState, PageHeader, Spinner, StatusBadge } from "../../components/ui";

interface Status { active_tier: Tier | null; subscriptions: SubscriptionRow[]; pending_payments: number }

export default function MySubscription() {
  usePageMeta("My subscription", undefined, { noindex: true });
  const [s, setS] = useState<Status | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    supabase.rpc("my_subscription_status").then(({ data, error }) => {
      if (error) setErr(friendlyError(error));
      setS((data as Status) ?? { active_tier: null, subscriptions: [], pending_payments: 0 });
    });
  }, []);

  if (!s) return <Spinner />;
  const current = s.subscriptions.filter((x) => x.status === "active");
  const upcoming = s.subscriptions.filter((x) => x.status === "scheduled");

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="My subscription" action={<Link to="/memberships" className="btn-primary">{s.active_tier ? "Renew or upgrade" : "Get a membership"}</Link>} />
      {err && <Alert kind="error">{err}</Alert>}
      {s.pending_payments > 0 && (
        <div className="mb-5"><Alert kind="warn">You have {s.pending_payments} payment{s.pending_payments > 1 ? "s" : ""} pending verification. Your membership starts once we confirm it. <Link to="/app/payments" className="underline">View status</Link></Alert></div>
      )}

      {current.length === 0 ? (
        <EmptyState title="No active membership" action={<Link to="/memberships" className="btn-gold">Explore Memberships</Link>}>
          You can keep your profile for free. A membership lets you view profiles, match and send messages.
        </EmptyState>
      ) : (
        current.map((c) => (
          <div key={c.id} className={`mb-4 rounded-3xl p-6 ${c.tier === "diamond" ? "bg-gradient-to-br from-plum-950 to-plum-800 text-white" : "card"}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className={`text-xs font-bold tracking-[0.25em] ${c.tier === "diamond" ? "text-gold-300" : "text-gold-600"}`}>CURRENT PACKAGE</p>
                <h2 className={`mt-1 text-2xl font-bold ${c.tier === "diamond" ? "text-white" : ""}`}>{c.package_name}</h2>
              </div>
              <StatusBadge status="active" />
            </div>
            <dl className="mt-5 grid gap-4 sm:grid-cols-3">
              <div><dt className="text-xs opacity-70">Activated</dt><dd className="font-semibold">{fmtDateTime(c.starts_at)}</dd></div>
              <div><dt className="text-xs opacity-70">Expires</dt><dd className="font-semibold">{fmtDateTime(c.expires_at)}</dd></div>
              <div><dt className="text-xs opacity-70">Time left</dt><dd className="font-display text-2xl font-bold">{daysLeft(c.expires_at)} days</dd></div>
            </dl>
          </div>
        ))
      )}

      {upcoming.length > 0 && (
        <div className="mt-6 card p-5">
          <h2 className="text-lg font-bold">Starting after your current membership</h2>
          {upcoming.map((u) => <p key={u.id} className="mt-2 text-sm">{u.package_name}: {fmtDateTime(u.starts_at)} → {fmtDateTime(u.expires_at)}</p>)}
        </div>
      )}

      {s.subscriptions.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-lg font-bold">Membership history</h2>
          <div className="card divide-y divide-plum-50">
            {s.subscriptions.map((x) => (
              <div key={x.id} className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
                <div><p className="font-semibold">{x.package_name}</p><p className="text-xs text-slate-500">{fmtDateTime(x.starts_at)} → {fmtDateTime(x.expires_at)}</p></div>
                <StatusBadge status={x.status} />
              </div>
            ))}
          </div>
        </div>
      )}
      <p className="mt-6 text-xs text-slate-500">Times are shown in East Africa Time. Memberships end automatically at the expiry time — there is no automatic charge.</p>
    </div>
  );
}
