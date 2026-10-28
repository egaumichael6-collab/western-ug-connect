import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, friendlyError } from "../../lib/supabase";
import { usePageMeta } from "../../lib/usePageMeta";
import { useAuth } from "../../context/AuthContext";
import { fmtDate } from "../../lib/format";
import { Alert, Modal, PageHeader, Spinner } from "../../components/ui";

export default function Settings() {
  usePageMeta("Settings", undefined, { noindex: true });
  const { user, profile, refreshProfile, signOut } = useAuth();
  const nav = useNavigate();
  const [msg, setMsg] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [blocked, setBlocked] = useState<{ id: string; display_name: string; blocked_at: string }[]>([]);
  const [pw, setPw] = useState({ a: "", b: "" });
  const [contact, setContact] = useState({ full_name: "", phone: "" });
  const [delOpen, setDelOpen] = useState(false);
  const [delText, setDelText] = useState("");
  const [delBusy, setDelBusy] = useState(false);

  useEffect(() => { supabase.rpc("my_blocked").then(({ data }) => setBlocked((data ?? []) as typeof blocked)); }, []);
  useEffect(() => { if (profile) setContact({ full_name: profile.full_name, phone: profile.phone }); }, [profile]);
  if (!profile || !user) return <Spinner />;

  async function update(fields: Record<string, unknown>, ok: string) {
    const { error } = await supabase.from("profiles").update(fields).eq("id", user!.id);
    if (error) return setMsg({ kind: "error", text: friendlyError(error) });
    await refreshProfile();
    setMsg({ kind: "success", text: ok });
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault();
    if (pw.a.length < 8 || !/[A-Za-z]/.test(pw.a) || !/[0-9]/.test(pw.a)) return setMsg({ kind: "error", text: "Use at least 8 characters with letters and numbers." });
    if (pw.a !== pw.b) return setMsg({ kind: "error", text: "Passwords do not match." });
    const { error } = await supabase.auth.updateUser({ password: pw.a });
    if (error) return setMsg({ kind: "error", text: friendlyError(error) });
    setPw({ a: "", b: "" });
    setMsg({ kind: "success", text: "Password changed." });
  }

  async function deleteAccount() {
    setDelBusy(true);
    const { error } = await supabase.functions.invoke("delete-account", { body: { confirm: delText } });
    setDelBusy(false);
    if (error) return setMsg({ kind: "error", text: "We couldn't delete your account. Please try again or contact us." });
    await signOut();
    nav("/?deleted=1", { replace: true });
  }

  const Toggle = ({ label, desc, on, onChange }: { label: string; desc: string; on: boolean; onChange: (v: boolean) => void }) => (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-3">
      <span><span className="block text-sm font-semibold">{label}</span><span className="block text-xs text-slate-500">{desc}</span></span>
      <input type="checkbox" role="switch" className="mt-1 h-5 w-5 accent-plum-800" checked={on} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Settings" subtitle={`Signed in as ${user.email}`} />
      {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}

      <section className="card divide-y divide-plum-50 px-6 py-2">
        <h2 className="py-3 text-lg font-bold">Privacy & visibility</h2>
        <Toggle label="Show my town" desc="Otherwise members only see your district." on={profile.show_town} onChange={(v) => update({ show_town: v }, "Saved.")} />
        <Toggle label="Show when I'm online" desc="Shows a green dot and 'last active' to members." on={profile.show_online} onChange={(v) => update({ show_online: v }, "Saved.")} />
        <Toggle label="Photos for matches only" desc="Members you haven't matched with see your profile without photos."
          on={profile.photo_visibility === "matches"} onChange={(v) => update({ photo_visibility: v ? "matches" : "members" }, "Saved.")} />
      </section>

      <section className="card space-y-3 p-6">
        <h2 className="text-lg font-bold">Account status</h2>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-plum-50 p-4">
          <div><p className="text-sm font-semibold">{profile.is_paused ? "Profile paused" : "Profile visible"}</p>
            <p className="text-xs text-slate-500">Pausing hides you from Discover. Existing matches can still message you.</p></div>
          <button className="btn-outline btn-sm" onClick={() => update({ is_paused: !profile.is_paused }, profile.is_paused ? "Your profile is visible again." : "Your profile is paused.")}>
            {profile.is_paused ? "Un-pause" : "Pause"}</button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-plum-50 p-4">
          <div><p className="text-sm font-semibold">{profile.is_deactivated ? "Account deactivated" : "Deactivate account"}</p>
            <p className="text-xs text-slate-500">Hides your profile and closes chats to new messages. Reactivate any time.</p></div>
          <button className="btn-outline btn-sm" onClick={() => update({ is_deactivated: !profile.is_deactivated }, profile.is_deactivated ? "Welcome back! Your account is active." : "Your account is deactivated.")}>
            {profile.is_deactivated ? "Reactivate" : "Deactivate"}</button>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-bold">Private contact details</h2>
        <p className="text-xs text-slate-500">Never shown to other members. Date of birth ({fmtDate(profile.date_of_birth)}) can only be corrected by contacting us.</p>
        <form className="mt-3 grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault();
          const phone = contact.phone.replace(/[\s-]/g, "");
          if (!/^\+?[0-9]{9,15}$/.test(phone)) return setMsg({ kind: "error", text: "Enter a valid phone number." });
          update({ full_name: contact.full_name.trim(), phone }, "Contact details saved."); }}>
          <div><label className="label" htmlFor="s-fn">Full name</label><input id="s-fn" className="input" value={contact.full_name} onChange={(e) => setContact({ ...contact, full_name: e.target.value })} /></div>
          <div><label className="label" htmlFor="s-ph">Phone</label><input id="s-ph" className="input" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} /></div>
          <button className="btn-outline sm:col-span-2 sm:justify-self-start">Save details</button>
        </form>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-bold">Change password</h2>
        <form className="mt-3 grid gap-3 sm:grid-cols-2" onSubmit={changePassword}>
          <div><label className="label" htmlFor="s-p1">New password</label><input id="s-p1" type="password" autoComplete="new-password" className="input" value={pw.a} onChange={(e) => setPw({ ...pw, a: e.target.value })} /></div>
          <div><label className="label" htmlFor="s-p2">Confirm</label><input id="s-p2" type="password" autoComplete="new-password" className="input" value={pw.b} onChange={(e) => setPw({ ...pw, b: e.target.value })} /></div>
          <button className="btn-outline sm:col-span-2 sm:justify-self-start">Update password</button>
        </form>
        <button className="btn-ghost btn-sm mt-4" onClick={async () => { await supabase.auth.signOut({ scope: "global" }); nav("/login"); }}>Log out of all devices</button>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-bold">Blocked members</h2>
        {blocked.length === 0 ? <p className="mt-2 text-sm text-slate-500">You haven't blocked anyone.</p> : (
          <ul className="mt-3 divide-y divide-plum-50">
            {blocked.map((b) => (
              <li key={b.id} className="flex items-center justify-between py-2 text-sm">
                <span>{b.display_name} <span className="text-xs text-slate-400">· {fmtDate(b.blocked_at)}</span></span>
                <button className="btn-ghost btn-sm" onClick={async () => { await supabase.rpc("unblock_user", { p_id: b.id }); setBlocked(blocked.filter((x) => x.id !== b.id)); }}>Unblock</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card border-red-200 p-6">
        <h2 className="text-lg font-bold text-red-800">Delete account</h2>
        <p className="mt-1 text-sm text-slate-600">Permanently deletes your profile, photos, likes, matches and messages. Any remaining membership time is lost. A minimal payment record without your contact details is kept for accounting.</p>
        <button className="btn-danger mt-4" onClick={() => setDelOpen(true)}>Delete my account</button>
      </section>

      <Modal open={delOpen} onClose={() => setDelOpen(false)} title="Delete your account permanently?">
        <p className="text-sm text-slate-600">This cannot be undone. Type <strong>DELETE</strong> to confirm.</p>
        <input className="input mt-3" value={delText} onChange={(e) => setDelText(e.target.value)} aria-label="Type DELETE to confirm" />
        <button className="btn-danger mt-4 w-full" disabled={delText !== "DELETE" || delBusy} onClick={deleteAccount}>{delBusy ? "Deleting…" : "Delete forever"}</button>
      </Modal>
    </div>
  );
}
