import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase, friendlyError } from "../../lib/supabase";
import { usePageMeta } from "../../lib/usePageMeta";
import { Alert, Spinner } from "../../components/ui";

export default function ResetPassword() {
  usePageMeta("Choose a new password", undefined, { noindex: true });
  const nav = useNavigate();
  const [ready, setReady] = useState<boolean | null>(null);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // The recovery link signs the user in temporarily (PASSWORD_RECOVERY event / session from the URL)
    const { data } = supabase.auth.onAuthStateChange((evt, session) => {
      if (evt === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    const t = window.setTimeout(async () => {
      const { data: s } = await supabase.auth.getSession();
      setReady(Boolean(s.session));
    }, 1500);
    return () => { data.subscription.unsubscribe(); window.clearTimeout(t); };
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (pw.length < 8 || !/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) return setErr("Use at least 8 characters with letters and numbers.");
    if (pw !== pw2) return setErr("The passwords do not match.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) { setBusy(false); return setErr(friendlyError(error)); }
    await supabase.auth.signOut({ scope: "global" });
    nav("/login?reset=1", { replace: true });
  }

  if (ready === null) return <Spinner label="Checking your reset link…" />;
  if (!ready) {
    return (
      <div className="container-page max-w-md py-16">
        <Alert kind="error">This reset link is invalid or has expired.</Alert>
        <Link to="/forgot-password" className="btn-primary mt-4">Request a new link</Link>
      </div>
    );
  }
  return (
    <div className="container-page max-w-md py-16">
      <h1 className="text-3xl font-bold">Choose a new password</h1>
      <form onSubmit={submit} className="card mt-6 space-y-4 p-6">
        {err && <Alert kind="error">{err}</Alert>}
        <div><label className="label" htmlFor="rp-1">New password</label>
          <input id="rp-1" type="password" className="input" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} required /></div>
        <div><label className="label" htmlFor="rp-2">Confirm new password</label>
          <input id="rp-2" type="password" className="input" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} required /></div>
        <button className="btn-primary w-full" disabled={busy}>{busy ? "Saving…" : "Save new password"}</button>
        <p className="text-xs text-slate-500">For your security you'll be signed out of all devices.</p>
      </form>
    </div>
  );
}
