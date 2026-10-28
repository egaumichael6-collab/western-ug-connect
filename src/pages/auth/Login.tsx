import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase, friendlyError } from "../../lib/supabase";
import { usePageMeta } from "../../lib/usePageMeta";
import { Alert } from "../../components/ui";

export default function Login({ admin = false }: { admin?: boolean }) {
  usePageMeta(admin ? "Administrator login" : "Log in", undefined, { noindex: true });
  const [params] = useSearchParams();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resent, setResent] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) return setErr(friendlyError(error));
    const next = params.get("next");
    nav(admin ? "/admin" : next && next.startsWith("/") && !next.startsWith("//") ? next : "/app/discover", { replace: true });
  }

  async function resend() {
    if (!email) return setErr("Enter your email address first.");
    const { error } = await supabase.auth.resend({ type: "signup", email: email.trim(), options: { emailRedirectTo: `${window.location.origin}/login?verified=1` } });
    if (error) return setErr(friendlyError(error));
    setResent(true);
  }

  return (
    <div className="container-page max-w-md py-16">
      <h1 className="text-3xl font-bold">{admin ? "Administrator login" : "Welcome back"}</h1>
      {!admin && <p className="mt-1 text-slate-600">New here? <Link to="/register" className="font-semibold text-plum-800 underline">Create an account</Link></p>}
      <form onSubmit={submit} className="card mt-6 space-y-4 p-6">
        {params.get("verified") && <Alert kind="success">Your email is verified. You can log in now.</Alert>}
        {params.get("reset") && <Alert kind="success">Password updated. Log in with your new password.</Alert>}
        {admin && <Alert kind="info">Restricted area. Access is checked on the server for every action.</Alert>}
        {err && <Alert kind="error">{err}</Alert>}
        {resent && <Alert kind="success">Verification email sent again. Check your inbox and spam folder.</Alert>}
        <div><label className="label" htmlFor="l-email">Email</label>
          <input id="l-email" type="email" className="input" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div><label className="label" htmlFor="l-pass">Password</label>
          <input id="l-pass" type="password" className="input" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <button className="btn-primary w-full py-3" disabled={busy}>{busy ? "Logging in…" : "Log in"}</button>
        <div className="flex flex-wrap justify-between gap-2 text-sm">
          <Link to="/forgot-password" className="text-plum-800 underline">Forgot password?</Link>
          {err?.includes("confirm your email") && <button type="button" onClick={resend} className="text-plum-800 underline">Resend verification email</button>}
        </div>
      </form>
    </div>
  );
}
