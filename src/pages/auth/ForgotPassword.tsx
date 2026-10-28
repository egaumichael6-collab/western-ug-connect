import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { supabase, friendlyError } from "../../lib/supabase";
import { usePageMeta } from "../../lib/usePageMeta";
import { Alert } from "../../components/ui";

export default function ForgotPassword() {
  usePageMeta("Reset your password", undefined, { noindex: true });
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
    setBusy(false);
    // Same message whether or not the address exists (prevents account discovery)
    if (error && !error.message.toLowerCase().includes("user")) return setErr(friendlyError(error));
    setSent(true);
  }

  return (
    <div className="container-page max-w-md py-16">
      <h1 className="text-3xl font-bold">Forgot your password?</h1>
      <form onSubmit={submit} className="card mt-6 space-y-4 p-6">
        {sent ? (
          <Alert kind="success">If an account exists for {email}, a reset link is on its way. The link expires after a short time.</Alert>
        ) : (
          <>
            {err && <Alert kind="error">{err}</Alert>}
            <p className="text-sm text-slate-600">Enter your email and we'll send you a link to choose a new password.</p>
            <div><label className="label" htmlFor="fp-email">Email</label>
              <input id="fp-email" type="email" className="input" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <button className="btn-primary w-full" disabled={busy}>{busy ? "Sending…" : "Send reset link"}</button>
          </>
        )}
        <Link to="/login" className="block text-center text-sm text-plum-800 underline">Back to login</Link>
      </form>
    </div>
  );
}
