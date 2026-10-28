import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase, friendlyError } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { usePackages } from "../../lib/usePackages";
import { goalLabel, REPORT_REASONS, ugx } from "../../lib/config";
import { fmtDate, fmtDateTime } from "../../lib/format";
import { Alert, Avatar, Modal, Spinner, StatusBadge } from "../../components/ui";
import AdminShell from "./AdminShell";

interface MemberRow {
  id: string; display_name: string; full_name: string; email: string; phone: string; age: number; gender: string; district: string;
  relationship_goal: string | null; profile_completed: boolean; is_paused: boolean; is_deactivated: boolean; is_suspended: boolean;
  suspended_reason: string | null; email_confirmed: boolean; tier: string | null; last_seen_at: string | null; created_at: string; reports_against: number;
}
interface ReportRow {
  id: string; reason: string; details: string | null; status: string; created_at: string; reporter_name: string | null; reported_name: string | null;
  reported_user_id: string; reported_suspended: boolean; has_message: boolean; prior_reports: number; resolution_note: string | null;
}
type Detail = MemberRow & {
  bio: string | null; town: string | null; photos: string[]; date_of_birth: string; interests: string[]; blocked_by_count: number;
  subscriptions: { id: string; tier: string; package_code: string; starts_at: string; expires_at: string; status: string }[];
  payments: { id: string; package_name: string; amount_ugx: number; status: string; transaction_ref: string; created_at: string }[];
};

const reasonLabel = (r: string) => REPORT_REASONS.find((x) => x.value === r)?.label ?? r;

export default function AdminMembers() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "reports" ? "reports" : "members";
  return (
    <AdminShell title="Members & reports">
      <div className="mb-5 flex gap-2">
        {(["members", "reports"] as const).map((t) => (
          <button key={t} onClick={() => setParams(t === "reports" ? { tab: t } : {})}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold capitalize ${tab === t ? "bg-plum-800 text-white" : "bg-white text-plum-800 ring-1 ring-plum-200"}`}>{t}</button>
        ))}
      </div>
      {tab === "members" ? <Members /> : <Reports />}
    </AdminShell>
  );
}

function Members() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [rows, setRows] = useState<MemberRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setRows(null);
    const { data, error } = await supabase.rpc("admin_search_members", { p_search: search || null, p_filter: filter, p_limit: 100 });
    if (error) setErr(friendlyError(error));
    setRows((data ?? []) as MemberRow[]);
  }, [search, filter]);
  useEffect(() => { load(); }, [filter]);

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        {["all", "reported", "suspended", "diamond"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${filter === f ? "bg-plum-100 text-plum-900" : "text-slate-600"}`}>{f}</button>
        ))}
        <form className="flex w-full gap-2 sm:ml-auto sm:w-auto" onSubmit={(e) => { e.preventDefault(); load(); }}>
          <input className="input sm:w-60" placeholder="Name, email, phone, district" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search members" />
          <button className="btn-outline">Search</button>
        </form>
      </div>
      {err && <Alert kind="error">{err}</Alert>}
      {!rows ? <Spinner /> : (
        <>
        <div className="space-y-3 md:hidden">
          {rows.map((m) => (
            <button key={m.id} onClick={() => setOpenId(m.id)} className="card block w-full p-4 text-left">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold">{m.display_name}, {m.age} <span className="font-normal text-slate-500">· {m.district}</span></p>
                <span className="text-xs capitalize text-plum-800">{m.tier ?? "no plan"}</span>
              </div>
              <p className="truncate text-xs text-slate-500">{m.email} · {m.phone}</p>
              <p className="mt-1 text-xs">{m.is_suspended ? <span className="font-bold text-red-700">Suspended</span> : m.is_deactivated ? "Deactivated" : m.is_paused ? "Paused" : m.profile_completed ? "Active" : "Incomplete profile"}
                {m.reports_against > 0 && <span className="ml-2 font-bold text-red-700">{m.reports_against} report(s)</span>}</p>
            </button>
          ))}
          {rows.length === 0 && <p className="card p-6 text-center text-slate-500">No members found.</p>}
        </div>
        <div className="card hidden overflow-x-auto md:block">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-plum-50 text-xs uppercase text-slate-500"><tr><th className="p-3">Member</th><th>Contact</th><th>Age</th><th>District</th><th>Membership</th><th>Status</th><th>Reports</th><th>Joined</th><th /></tr></thead>
            <tbody className="divide-y divide-plum-50">
              {rows.map((m) => (
                <tr key={m.id}>
                  <td className="p-3"><strong>{m.display_name}</strong><br /><span className="text-xs text-slate-500">{m.full_name}</span></td>
                  <td className="text-xs">{m.email}{!m.email_confirmed && <span className="ml-1 text-gold-700">(unverified)</span>}<br />{m.phone}</td>
                  <td>{m.age}</td><td>{m.district}</td>
                  <td className="capitalize">{m.tier ?? "—"}</td>
                  <td className="text-xs">{m.is_suspended ? <span className="font-bold text-red-700">Suspended</span> : m.is_deactivated ? "Deactivated" : m.is_paused ? "Paused" : m.profile_completed ? "Active" : "Incomplete"}</td>
                  <td>{m.reports_against > 0 ? <span className="font-bold text-red-700">{m.reports_against}</span> : 0}</td>
                  <td className="text-xs">{fmtDate(m.created_at)}</td>
                  <td className="pr-3"><button className="btn-outline btn-sm" onClick={() => setOpenId(m.id)}>Review</button></td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={9} className="p-6 text-center text-slate-500">No members found.</td></tr>}
            </tbody>
          </table>
        </div>
        </>
      )}
      {openId && <MemberDetail id={openId} onClose={() => setOpenId(null)} onChanged={load} />}
    </>
  );
}

function MemberDetail({ id, onClose, onChanged }: { id: string; onClose: () => void; onChanged: () => void }) {
  const { role } = useAuth();
  const { packages } = usePackages();
  const [d, setD] = useState<Detail | null>(null);
  const [reason, setReason] = useState("");
  const [act, setAct] = useState({ pkg: "bronze_30", network: "mtn", ref: "", phone: "" });
  const [actMsg, setActMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const load = useCallback(() => {
    supabase.rpc("admin_get_member", { p_id: id }).then(({ data, error }) => { if (error) setErr(friendlyError(error)); setD(data as Detail); });
  }, [id]);
  useEffect(() => { load(); }, [load]);

  async function suspend(on: boolean) {
    if (!reason.trim()) return setErr("Enter a reason. It is shown to the member and saved in the audit log.");
    const { error } = await supabase.rpc("admin_set_suspension", { p_id: id, p_suspend: on, p_reason: reason });
    if (error) return setErr(friendlyError(error));
    setReason(""); setErr(null); load(); onChanged();
  }

  async function activate() {
    const pkg = packages?.find((p) => p.code === act.pkg);
    if (!pkg) return;
    if (!window.confirm(`Activate ${pkg.name} for ${d?.display_name}?\n\nConfirm you can see ${act.network.toUpperCase()} transaction ${act.ref} for ${ugx(pkg.price_ugx)} in your mobile money messages.`)) return;
    setErr(null); setActMsg(null);
    const { data, error } = await supabase.rpc("admin_activate_membership", {
      p_user: id, p_package: act.pkg, p_network: act.network, p_transaction_ref: act.ref,
      p_payer_phone: act.phone || d?.phone, p_received_amount: pkg.price_ugx, p_note: "Activated from member page",
    });
    if (error) return setErr(friendlyError(error));
    setActMsg(`Activated until ${fmtDateTime((data as { expires_at: string }).expires_at)}.`);
    setAct({ ...act, ref: "" });
    load(); onChanged();
  }

  return (
    <Modal open onClose={onClose} title="Member review">
      {!d ? (err ? <Alert kind="error">{err}</Alert> : <Spinner />) : (
        <div className="space-y-4 text-sm">
          <div className="flex gap-3">
            {d.photos.slice(0, 4).map((p) => <Avatar key={p} path={p} name={d.display_name} size={72} rounded="rounded-lg" />)}
          </div>
          <dl className="grid grid-cols-2 gap-2">
            <div><dt className="text-xs text-slate-500">Display / full name</dt><dd className="font-semibold">{d.display_name} / {d.full_name}</dd></div>
            <div><dt className="text-xs text-slate-500">Age · DOB</dt><dd>{d.age} · {fmtDate(d.date_of_birth)}</dd></div>
            <div><dt className="text-xs text-slate-500">Email</dt><dd>{d.email}</dd></div>
            <div><dt className="text-xs text-slate-500">Phone</dt><dd>{d.phone}</dd></div>
            <div><dt className="text-xs text-slate-500">Location</dt><dd>{d.town ? `${d.town}, ` : ""}{d.district}</dd></div>
            <div><dt className="text-xs text-slate-500">Goal</dt><dd>{goalLabel(d.relationship_goal)}</dd></div>
            <div><dt className="text-xs text-slate-500">Blocked by</dt><dd>{d.blocked_by_count} member(s)</dd></div>
            <div><dt className="text-xs text-slate-500">Last seen</dt><dd>{fmtDateTime(d.last_seen_at)}</dd></div>
          </dl>
          {d.bio && <p className="rounded-xl bg-plum-50 p-3 text-slate-700">{d.bio}</p>}
          {d.subscriptions.length > 0 && (
            <div><p className="label">Memberships</p>
              {d.subscriptions.map((s) => <p key={s.id} className="text-xs">{s.package_code}: {fmtDate(s.starts_at)} → {fmtDate(s.expires_at)} ({s.status})</p>)}</div>
          )}
          {d.payments.length > 0 && (
            <div><p className="label">Payments</p>
              {d.payments.map((p) => <p key={p.id} className="text-xs">{fmtDate(p.created_at)} · {p.package_name} · {ugx(p.amount_ugx)} · <span className="font-mono">{p.transaction_ref}</span> · {p.status}</p>)}</div>
          )}
          {err && <Alert kind="error">{err}</Alert>}
          {role === "admin" && (
            <div className="space-y-2 rounded-xl border border-gold-300 bg-gold-50 p-4">
              <p className="font-semibold text-plum-950">Activate membership with a transaction ID</p>
              <p className="text-xs text-slate-600">Use when this member paid but couldn't submit the ID. Current membership: <strong className="capitalize">{d.tier ?? "none"}</strong>.</p>
              {actMsg && <Alert kind="success">{actMsg}</Alert>}
              <div className="grid grid-cols-2 gap-2">
                <select className="input col-span-2" value={act.pkg} onChange={(e) => setAct({ ...act, pkg: e.target.value })} aria-label="Package">
                  {packages?.map((p) => <option key={p.code} value={p.code}>{p.name} — {ugx(p.price_ugx)}</option>)}
                </select>
                <select className="input" value={act.network} onChange={(e) => setAct({ ...act, network: e.target.value })} aria-label="Network">
                  <option value="mtn">MTN</option><option value="airtel">Airtel</option>
                </select>
                <input className="input" placeholder={`Paid from (${d.phone})`} value={act.phone} onChange={(e) => setAct({ ...act, phone: e.target.value })} aria-label="Paid from" />
                <input className="input col-span-2 font-mono uppercase" placeholder="Transaction ID" value={act.ref} onChange={(e) => setAct({ ...act, ref: e.target.value })} aria-label="Transaction ID" />
              </div>
              <button className="btn-primary w-full" disabled={act.ref.replace(/[^A-Za-z0-9]/g, "").length < 6} onClick={activate}>Activate now</button>
            </div>
          )}
          <div className="space-y-2 border-t border-plum-100 pt-4">
            {d.is_suspended && <Alert kind="warn">Suspended: {d.suspended_reason}</Alert>}
            <label className="label" htmlFor="susp-r">{d.is_suspended ? "Reason for reactivating" : "Reason for suspension"} (shown to member, logged)</label>
            <input id="susp-r" className="input" value={reason} onChange={(e) => setReason(e.target.value)} />
            {d.is_suspended
              ? <button className="btn-primary" onClick={() => suspend(false)}>Reactivate account</button>
              : <button className="btn-danger" onClick={() => suspend(true)}>Suspend account</button>}
          </div>
        </div>
      )}
    </Modal>
  );
}

function Reports() {
  const [status, setStatus] = useState("open");
  const [rows, setRows] = useState<ReportRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<Record<string, { body: string; sent_at: string; sender: string }>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [member, setMember] = useState<string | null>(null);

  const load = useCallback(async () => {
    setRows(null);
    const { data, error } = await supabase.rpc("admin_list_reports", { p_status: status });
    if (error) setErr(friendlyError(error));
    setRows((data ?? []) as ReportRow[]);
  }, [status]);
  useEffect(() => { load(); }, [load]);

  async function viewMessage(id: string) {
    if (!window.confirm("Moderation access: you will see ONLY the reported message. This access is recorded in the audit log. Continue?")) return;
    const { data, error } = await supabase.rpc("admin_get_reported_message", { p_report: id });
    if (error) return setErr(friendlyError(error));
    setMsg({ ...msg, [id]: data as { body: string; sent_at: string; sender: string } });
  }

  async function setReport(id: string, s: string) {
    const { error } = await supabase.rpc("admin_update_report", { p_report: id, p_status: s, p_note: notes[id] || null });
    if (error) return setErr(friendlyError(error));
    load();
  }

  return (
    <>
      <div className="mb-4 flex gap-2">
        {["open", "resolved", "dismissed", "all"].map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${status === s ? "bg-plum-100 text-plum-900" : "text-slate-600"}`}>{s}</button>
        ))}
      </div>
      <Alert kind="info">Moderation process: review the report and the member's history; view the specific reported message only when needed; suspend for serious or repeated violations; record what you decided.</Alert>
      {err && <div className="mt-3"><Alert kind="error">{err}</Alert></div>}
      {!rows ? <Spinner /> : rows.length === 0 ? <p className="card mt-4 p-8 text-center text-slate-500">No reports in this view.</p> : (
        <div className="mt-4 space-y-3">
          {rows.map((r) => (
            <div key={r.id} className="card p-5 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{reasonLabel(r.reason)} — against <button className="underline" onClick={() => setMember(r.reported_user_id)}>{r.reported_name ?? "deleted member"}</button>
                    {r.reported_suspended && <span className="ml-2 text-xs font-bold text-red-700">SUSPENDED</span>}</p>
                  <p className="text-xs text-slate-500">Reported by {r.reporter_name ?? "deleted member"} · {fmtDateTime(r.created_at)} · {r.prior_reports} other report(s) against this member</p>
                </div>
                <StatusBadge status={r.status} />
              </div>
              {r.details && <p className="mt-2 rounded-lg bg-plum-50 p-3">{r.details}</p>}
              {r.has_message && (msg[r.id] ? (
                <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-3"><p className="text-xs text-red-700">Reported message from {msg[r.id].sender}, {fmtDateTime(msg[r.id].sent_at)}:</p><p className="mt-1 whitespace-pre-wrap">{msg[r.id].body}</p></div>
              ) : <button className="btn-outline btn-sm mt-2" onClick={() => viewMessage(r.id)}>View reported message</button>)}
              {r.resolution_note && <p className="mt-2 text-xs text-slate-600">Resolution: {r.resolution_note}</p>}
              {(r.status === "open" || r.status === "reviewing") && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <input className="input max-w-sm" placeholder="Decision note" value={notes[r.id] ?? ""} onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })} aria-label="Decision note" />
                  <button className="btn-primary btn-sm" onClick={() => setReport(r.id, "resolved")}>Resolve</button>
                  <button className="btn-outline btn-sm" onClick={() => setReport(r.id, "dismissed")}>Dismiss</button>
                  {r.status === "open" && <button className="btn-ghost btn-sm" onClick={() => setReport(r.id, "reviewing")}>Mark reviewing</button>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {member && <MemberDetail id={member} onClose={() => setMember(null)} onChanged={load} />}
    </>
  );
}
