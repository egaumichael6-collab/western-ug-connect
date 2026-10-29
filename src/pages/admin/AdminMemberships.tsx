import { useCallback, useEffect, useState } from "react";
import { supabase, friendlyError } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { usePackages } from "../../lib/usePackages";
import { ugx } from "../../lib/config";
import { fmtDateTime } from "../../lib/format";
import { Alert, Modal, Spinner, StatusBadge } from "../../components/ui";
import AdminShell from "./AdminShell";

const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

interface Sub { id: string; user_id: string; member_name: string; member_email: string; package_code: string; tier: string; starts_at: string; expires_at: string; state: string; revoke_reason: string | null }

export default function AdminMemberships() {
  const { role } = useAuth();
  const { packages } = usePackages();
  const [pkgState, setPkgState] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState("active");
  const [tier, setTier] = useState("");
  const [rows, setRows] = useState<Sub[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [edit, setEdit] = useState<Sub | null>(null);
  const [newExp, setNewExp] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => { if (packages) setPkgState(Object.fromEntries(packages.map((p) => [p.code, p.is_active]))); }, [packages]);
  const load = useCallback(async () => {
    setRows(null);
    const { data, error } = await supabase.rpc("admin_list_subscriptions", { p_filter: filter, p_tier: tier || null });
    if (error) setErr(friendlyError(error));
    setRows((data ?? []) as Sub[]);
  }, [filter, tier]);
  useEffect(() => { load(); }, [load]);

  async function togglePkg(code: string) {
    const next = !pkgState[code];
    const { error } = await supabase.rpc("admin_set_package_active", { p_code: code, p_active: next });
    if (error) return setErr(friendlyError(error));
    setPkgState({ ...pkgState, [code]: next });
  }

  async function saveCorrection() {
    if (!edit) return;
    const { error } = await supabase.rpc("admin_correct_subscription", { p_sub: edit.id, p_new_expires: new Date(newExp).toISOString(), p_note: note });
    if (error) return setErr(friendlyError(error));
    setEdit(null); load();
  }

  if (role !== "admin") return <AdminShell title="Memberships"><Alert kind="error">Administrators only.</Alert></AdminShell>;
  return (
    <AdminShell title="Memberships">
      {err && <div className="mb-4"><Alert kind="error">{err}</Alert></div>}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-bold">Package availability</h2>
        <p className="mb-3 text-sm text-slate-600">Turning a package off hides it from new buyers. Existing memberships and payment records are not affected. Prices are fixed in the database migration.</p>
        <div className="grid gap-3 md:grid-cols-3">
          {packages?.map((p) => (
            <div key={p.code} className="card flex items-center justify-between gap-3 p-4">
              <div><p className="font-semibold">{p.name}</p><p className="text-xs text-slate-500">{ugx(p.price_ugx)} · {p.duration_days} days</p></div>
              <button className={pkgState[p.code] ? "btn-outline btn-sm" : "btn-primary btn-sm"} onClick={() => togglePkg(p.code)}>{pkgState[p.code] ? "Disable" : "Enable"}</button>
            </div>
          ))}
        </div>
      </section>

      <div className="mb-4 flex flex-wrap gap-2">
        {["active", "expired", "revoked", "all"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3.5 py-1.5 text-sm font-semibold capitalize ${filter === f ? "bg-plum-800 text-white" : "bg-white text-plum-800 ring-1 ring-plum-200"}`}>{f}</button>
        ))}
        <select className="input w-full sm:ml-auto sm:w-40" value={tier} onChange={(e) => setTier(e.target.value)} aria-label="Tier">
          <option value="">All tiers</option><option value="bronze">Silver / Gold</option><option value="campus">Juicy University Babes</option><option value="diamond">Diamond</option>
        </select>
      </div>
      {!rows ? <Spinner /> : (
        <>
        <div className="space-y-3 md:hidden">
          {rows.map((s) => (
            <div key={s.id} className="card p-4 text-sm">
              <div className="flex items-start justify-between gap-2"><p className="font-semibold">{s.member_name} <span className="font-normal text-slate-500">· {s.package_code}</span></p><StatusBadge status={s.state} /></div>
              <p className="mt-1 text-xs text-slate-500">{fmtDateTime(s.starts_at)} → {fmtDateTime(s.expires_at)}</p>
              {s.state !== "revoked" && <button className="btn-outline btn-sm mt-2" onClick={() => { setEdit(s); setNewExp(toLocalInput(s.expires_at)); setNote(""); }}>Correct</button>}
            </div>
          ))}
          {rows.length === 0 && <p className="card p-6 text-center text-slate-500">No memberships.</p>}
        </div>
        <div className="card hidden overflow-x-auto md:block">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-plum-50 text-xs uppercase text-slate-500"><tr><th className="p-3">Member</th><th>Package</th><th>Starts</th><th>Expires</th><th>Status</th><th /></tr></thead>
            <tbody className="divide-y divide-plum-50">
              {rows.map((s) => (
                <tr key={s.id}>
                  <td className="p-3">{s.member_name}<br /><span className="text-xs text-slate-500">{s.member_email}</span></td>
                  <td>{s.package_code}</td><td>{fmtDateTime(s.starts_at)}</td><td>{fmtDateTime(s.expires_at)}</td>
                  <td><StatusBadge status={s.state} /></td>
                  <td className="pr-3">{s.state !== "revoked" && <button className="btn-outline btn-sm" onClick={() => { setEdit(s); setNewExp(toLocalInput(s.expires_at)); setNote(""); }}>Correct</button>}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-slate-500">No memberships.</td></tr>}
            </tbody>
          </table>
        </div>
        </>
      )}
      <Modal open={!!edit} onClose={() => setEdit(null)} title="Correct membership expiry">
        <p className="text-sm text-slate-600">Use only for approved corrections (e.g. service outage compensation). The change is logged and the member is notified. For refunds use Payment verification.</p>
        <label className="label mt-3" htmlFor="ce-d">New expiry (your local time)</label>
        <input id="ce-d" type="datetime-local" className="input" value={newExp} onChange={(e) => setNewExp(e.target.value)} />
        <label className="label mt-3" htmlFor="ce-n">Reason (required)</label>
        <input id="ce-n" className="input" value={note} onChange={(e) => setNote(e.target.value)} />
        <button className="btn-primary mt-4 w-full" disabled={!note.trim() || !newExp} onClick={saveCorrection}>Save correction</button>
      </Modal>
    </AdminShell>
  );
}
