import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase, friendlyError } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { ugx } from "../../lib/config";
import { fmtDateTime } from "../../lib/format";
import { Alert, Spinner } from "../../components/ui";
import AdminShell from "./AdminShell";

interface Overview {
  total_members: number; completed_profiles: number; active_members: number; suspended_members: number;
  active_subscriptions: number; active_bronze: number; active_campus?: number; active_diamond: number; expired_subscriptions: number;
  pending_payments: number; approved_payments: number; approved_revenue_ugx: number; open_reports: number; new_contact_messages: number;
  recent_registrations: { id: string; display_name: string; district: string; gender: string; created_at: string; profile_completed: boolean }[];
}
interface Audit { id: number; action: string; entity_type: string; entity_id: string; actor_email: string | null; created_at: string; details: Record<string, unknown> }
interface ContactMsg { id: string; name: string; email: string; subject: string; message: string; created_at: string; status: string }

export default function AdminDashboard() {
  const { role } = useAuth();
  const [o, setO] = useState<Overview | null>(null);
  const [audit, setAudit] = useState<Audit[]>([]);
  const [contacts, setContacts] = useState<ContactMsg[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const loadContacts = () => supabase.rpc("admin_contact_messages", { p_status: "new" }).then(({ data }) => setContacts((data ?? []) as ContactMsg[]));
  useEffect(() => {
    supabase.rpc("admin_overview").then(({ data, error }) => { if (error) setErr(friendlyError(error)); setO(data as Overview); });
    if (role === "admin") supabase.rpc("admin_audit_log", { p_limit: 25 }).then(({ data }) => setAudit((data ?? []) as Audit[]));
    loadContacts();
  }, [role]);

  if (err) return <AdminShell title="Overview"><Alert kind="error">{err}</Alert></AdminShell>;
  if (!o) return <AdminShell title="Overview"><Spinner /></AdminShell>;

  const stats: [string, string | number, string?, string?][] = [
    ["Registered members", o.total_members, `${o.completed_profiles} completed profiles`],
    ["Active members (30 days)", o.active_members, `${o.suspended_members} suspended`],
    ["Active subscriptions", o.active_subscriptions, `${o.active_bronze} Silver/Gold · ${o.active_campus ?? 0} Uni Babes · ${o.active_diamond} Diamond members`],
    ["Pending payments", o.pending_payments, "Awaiting verification", "/admin/payments"],
    ["Confirmed payments", o.approved_payments, ugx(o.approved_revenue_ugx) + " verified"],
    ["Expired subscriptions", o.expired_subscriptions],
    ["Open reports", o.open_reports, "Moderation queue", "/admin/members?tab=reports"],
    ["New contact messages", o.new_contact_messages],
  ];

  return (
    <AdminShell title="Overview">
      {role === "admin" && o.pending_payments > 0 && (
        <Link to="/admin/payments" className="mb-5 flex items-center justify-between gap-3 rounded-2xl bg-gold-400 p-4 font-semibold text-plum-950 shadow-sm">
          <span>⏳ {o.pending_payments} payment{o.pending_payments > 1 ? "s" : ""} waiting for activation</span>
          <span className="rounded-full bg-plum-950 px-3 py-1 text-sm text-gold-300">Verify now →</span>
        </Link>
      )}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map(([label, value, sub, link]) => {
          const body = (
            <div className={`card h-full p-4 sm:p-5 ${link && Number(value) > 0 ? "ring-2 ring-gold-400" : ""}`}>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">{label}</p>
              <p className="mt-1 font-display text-2xl font-bold text-plum-900 sm:text-3xl">{value}</p>
              {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
            </div>
          );
          return link && (role === "admin" || !link.includes("payments")) ? <Link key={label} to={link}>{body}</Link> : <div key={label}>{body}</div>;
        })}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-3 text-lg font-bold">Recent registrations</h2>
          <ul className="divide-y divide-plum-50 text-sm">
            {o.recent_registrations.map((r) => (
              <li key={r.id} className="flex justify-between gap-2 py-2">
                <span><strong>{r.display_name}</strong> · {r.gender} · {r.district}{!r.profile_completed && <span className="ml-1 text-xs text-gold-700">(incomplete)</span>}</span>
                <span className="text-xs text-slate-500">{fmtDateTime(r.created_at)}</span>
              </li>
            ))}
            {o.recent_registrations.length === 0 && <li className="py-2 text-slate-500">No members yet.</li>}
          </ul>
        </section>

        <section className="card p-5">
          <h2 className="mb-3 text-lg font-bold">Contact messages</h2>
          {contacts.length === 0 ? <p className="text-sm text-slate-500">No new messages.</p> : (
            <ul className="space-y-3 text-sm">
              {contacts.map((c) => (
                <li key={c.id} className="rounded-xl bg-plum-50 p-3">
                  <p className="font-semibold">{c.subject}</p>
                  <p className="text-xs text-slate-500">{c.name} · <a href={`mailto:${c.email}`} className="underline">{c.email}</a> · {fmtDateTime(c.created_at)}</p>
                  <p className="mt-1 whitespace-pre-wrap text-slate-700">{c.message}</p>
                  <button className="btn-outline btn-sm mt-2" onClick={async () => { await supabase.rpc("admin_mark_contact_handled", { p_id: c.id }); loadContacts(); }}>Mark handled</button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {role === "admin" && (
        <section className="card mt-6 overflow-x-auto p-5">
          <h2 className="mb-3 text-lg font-bold">Audit log (latest 25)</h2>
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500"><tr><th className="py-2">When</th><th>Who</th><th>Action</th><th>Record</th></tr></thead>
            <tbody className="divide-y divide-plum-50">
              {audit.map((a) => (
                <tr key={a.id}><td className="py-2 pr-3 whitespace-nowrap">{fmtDateTime(a.created_at)}</td><td className="pr-3">{a.actor_email ?? "system / member"}</td>
                  <td className="pr-3 font-mono text-xs">{a.action}</td><td className="font-mono text-xs text-slate-500">{a.entity_type} {a.entity_id?.slice(0, 8)}</td></tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </AdminShell>
  );
}
