import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { supabase, friendlyError } from "../../lib/supabase";
import { usePageMeta } from "../../lib/usePageMeta";
import { GENDERS, WESTERN_DISTRICTS, OTHER_DISTRICTS } from "../../lib/config";
import { ageFromDob } from "../../lib/format";
import { Alert } from "../../components/ui";

const maxDob = (() => { const d = new Date(); d.setFullYear(d.getFullYear() - 18); return d.toISOString().slice(0, 10); })();

export default function Register() {
  usePageMeta("Join WESTERN UG CONNECT", "Create your free account and start your journey to true love.", { noindex: true });
  const [f, setF] = useState({
    full_name: "", display_name: "", email: "", phone: "", password: "", confirm: "",
    date_of_birth: "", gender: "", district: "", town: "", agree: false, adult: false,
  });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  function validate(): string | null {
    if (f.full_name.trim().length < 2) return "Enter your full name.";
    if (f.display_name.trim().length < 2) return "Choose a display name (at least 2 characters).";
    const phone = f.phone.replace(/[\s-]/g, "");
    if (!/^\+?[0-9]{9,15}$/.test(phone)) return "Enter a valid phone number, e.g. 0772 123456 or +256772123456.";
    if (!f.date_of_birth) return "Enter your date of birth.";
    if (ageFromDob(f.date_of_birth) < 18) return "You must be 18 or older to join WESTERN UG CONNECT.";
    if (ageFromDob(f.date_of_birth) > 100) return "Please enter a valid date of birth.";
    if (!f.gender) return "Select your gender.";
    if (!f.district) return "Select your district.";
    if (f.password.length < 8 || !/[A-Za-z]/.test(f.password) || !/[0-9]/.test(f.password))
      return "Use a password of at least 8 characters with letters and numbers.";
    if (f.password !== f.confirm) return "The passwords do not match.";
    if (!f.adult || !f.agree) return "Please confirm you are 18+ and accept the terms.";
    return null;
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const v = validate();
    if (v) return setErr(v);
    setErr(null);
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: f.email.trim(),
      password: f.password,
      options: {
        emailRedirectTo: `${window.location.origin}/login?verified=1`,
        data: {
          full_name: f.full_name.trim(), display_name: f.display_name.trim(), phone: f.phone.replace(/[\s-]/g, ""),
          date_of_birth: f.date_of_birth, gender: f.gender, district: f.district, town: f.town.trim(),
        },
      },
    });
    setBusy(false);
    if (error) return setErr(friendlyError(error));
    setSentTo(f.email.trim());
  }

  if (sentTo) {
    return (
      <div className="container-page max-w-lg py-16">
        <div className="card p-8 text-center">
          <div className="text-5xl" aria-hidden>📩</div>
          <h1 className="mt-4 text-2xl font-bold">Check your email</h1>
          <p className="mt-2 text-slate-600">We sent a verification link to <strong>{sentTo}</strong>. Click it to activate your account, then log in.</p>
          <p className="mt-4 text-sm text-slate-500">Can't find it? Check your spam folder. If you already have an account with this email, use "Forgot password" instead.</p>
          <Link to="/login" className="btn-primary mt-6">Go to login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page max-w-2xl py-12">
      <h1 className="text-3xl font-bold">Create your account</h1>
      <p className="mt-1 text-slate-600">Free to join. Already a member? <Link to="/login" className="font-semibold text-plum-800 underline">Log in</Link></p>
      <form onSubmit={submit} className="card mt-6 space-y-5 p-6 sm:p-8" noValidate>
        {err && <Alert kind="error">{err}</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label" htmlFor="r-full">Full name <span className="text-xs text-slate-500">(private)</span></label>
            <input id="r-full" className="input" autoComplete="name" value={f.full_name} onChange={set("full_name")} required /></div>
          <div><label className="label" htmlFor="r-display">Display name <span className="text-xs text-slate-500">(shown to members)</span></label>
            <input id="r-display" className="input" maxLength={40} value={f.display_name} onChange={set("display_name")} required /></div>
          <div><label className="label" htmlFor="r-email">Email</label>
            <input id="r-email" type="email" className="input" autoComplete="email" value={f.email} onChange={set("email")} required /></div>
          <div><label className="label" htmlFor="r-phone">Phone number <span className="text-xs text-slate-500">(private)</span></label>
            <input id="r-phone" type="tel" className="input" autoComplete="tel" placeholder="0772 123456" value={f.phone} onChange={set("phone")} required /></div>
          <div><label className="label" htmlFor="r-dob">Date of birth</label>
            <input id="r-dob" type="date" className="input" max={maxDob} value={f.date_of_birth} onChange={set("date_of_birth")} required />
            <p className="mt-1 text-xs text-slate-500">Members see your age, never your birth date.</p></div>
          <div><label className="label" htmlFor="r-gender">I am a</label>
            <select id="r-gender" className="input" value={f.gender} onChange={set("gender")} required>
              <option value="">Select…</option>
              {GENDERS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select></div>
          <div><label className="label" htmlFor="r-district">District</label>
            <select id="r-district" className="input" value={f.district} onChange={set("district")} required>
              <option value="">Select…</option>
              <optgroup label="Western Uganda">{WESTERN_DISTRICTS.map((d) => <option key={d}>{d}</option>)}</optgroup>
              <optgroup label="Rest of Uganda">{OTHER_DISTRICTS.map((d) => <option key={d}>{d}</option>)}</optgroup>
            </select></div>
          <div><label className="label" htmlFor="r-town">Town / area <span className="text-xs text-slate-500">(optional)</span></label>
            <input id="r-town" className="input" maxLength={60} placeholder="e.g. Kakoba" value={f.town} onChange={set("town")} /></div>
          <div><label className="label" htmlFor="r-pass">Password</label>
            <input id="r-pass" type="password" className="input" autoComplete="new-password" value={f.password} onChange={set("password")} required /></div>
          <div><label className="label" htmlFor="r-pass2">Confirm password</label>
            <input id="r-pass2" type="password" className="input" autoComplete="new-password" value={f.confirm} onChange={set("confirm")} required /></div>
        </div>
        <div className="space-y-3 rounded-xl bg-plum-50 p-4 text-sm">
          <label className="flex items-start gap-3">
            <input type="checkbox" className="mt-0.5 h-4 w-4 accent-plum-800" checked={f.adult} onChange={(e) => setF({ ...f, adult: e.target.checked })} />
            <span>I confirm I am 18 years or older.</span>
          </label>
          <label className="flex items-start gap-3">
            <input type="checkbox" className="mt-0.5 h-4 w-4 accent-plum-800" checked={f.agree} onChange={(e) => setF({ ...f, agree: e.target.checked })} />
            <span>I agree to the <Link to="/terms" className="underline" target="_blank">Terms</Link>, <Link to="/guidelines" className="underline" target="_blank">Community Guidelines</Link> and
              consent to my data being processed as described in the <Link to="/privacy" className="underline" target="_blank">Privacy Policy</Link>.</span>
          </label>
        </div>
        <button className="btn-primary w-full py-3" disabled={busy}>{busy ? "Creating account…" : "Create account"}</button>
        <p className="text-center text-xs text-slate-500">Your full name, phone and email are never shown to other members.</p>
      </form>
    </div>
  );
}
