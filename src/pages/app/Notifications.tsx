import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { usePageMeta } from "../../lib/usePageMeta";
import { useAuth } from "../../context/AuthContext";
import type { Notification } from "../../lib/types";
import { timeAgo } from "../../lib/format";
import { EmptyState, PageHeader, Spinner } from "../../components/ui";

const icons: Record<string, string> = {
  welcome: "👋", email_verified: "✅", like: "💜", connection_request: "🤝", match: "💞", message: "💬",
  payment_pending: "⏳", payment_approved: "🎉", payment_rejected: "⚠️", payment_refunded: "↩️",
  subscription_expiring: "⌛", subscription_expired: "📅", subscription_corrected: "🛠️", security: "🔒", admin_payment: "💰",
};

export default function Notifications() {
  usePageMeta("Notifications", undefined, { noindex: true });
  const { user, refreshUnread } = useAuth();
  const [items, setItems] = useState<Notification[] | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100);
    setItems((data ?? []) as Notification[]);
  }, [user]);
  useEffect(() => { load(); }, [load]);

  async function markAll() {
    if (!user) return;
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", user.id).is("read_at", null);
    await load(); refreshUnread();
  }
  async function markOne(n: Notification) {
    if (n.read_at) return;
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", n.id);
    refreshUnread();
  }

  if (!items) return <Spinner />;
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Notifications" action={items.some((n) => !n.read_at) && <button className="btn-outline btn-sm" onClick={markAll}>Mark all as read</button>} />
      {items.length === 0 ? <EmptyState title="You're all caught up" /> : (
        <ul className="card divide-y divide-plum-50">
          {items.map((n) => {
            const inner = (
              <div className={`flex gap-3 p-4 ${n.read_at ? "" : "bg-plum-50/70"}`}>
                <span className="text-xl" aria-hidden>{icons[n.type] ?? "🔔"}</span>
                <div className="flex-1">
                  <p className={`text-sm ${n.read_at ? "" : "font-semibold"}`}>{n.title}</p>
                  {n.body && <p className="text-sm text-slate-600">{n.body}</p>}
                  <p className="mt-1 text-xs text-slate-400">{timeAgo(n.created_at)}</p>
                </div>
                {!n.read_at && <span className="mt-1.5 h-2 w-2 rounded-full bg-rose-accent" aria-label="Unread" />}
              </div>
            );
            return <li key={n.id}>{n.link ? <Link to={n.link} onClick={() => markOne(n)}>{inner}</Link> : <button className="w-full text-left" onClick={() => markOne(n)}>{inner}</button>}</li>;
          })}
        </ul>
      )}
    </div>
  );
}
