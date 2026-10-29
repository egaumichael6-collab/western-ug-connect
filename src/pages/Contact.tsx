import { useState, type FormEvent } from "react";
import { usePageMeta } from "../lib/usePageMeta";
import { supabase, friendlyError } from "../lib/supabase";
import { PAYMENT_NUMBER_DISPLAY, SUPPORT_EMAIL, WHATSAPP_DISPLAY, whatsappLink } from "../lib/config";
import { useAuth } from "../context/AuthContext";
import { Alert } from "../components/ui";

export default function Contact() {
  usePageMeta("Contact us", "Get in touch with the WESTERN UG CONNECT team about your account, payments or safety concerns.");
  const { user, profile } = useAuth();
  const [form, setForm] = useState({ name: profile?.display_name ?? "", email: user?.email ?? "", subject: "", message: "", website: "" });
  const [state, setState] = useState<{ busy?: boolean; ok?: boolean; err?: string }>({});

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (form.website) return; // honeypot: bots fill hidden fields
    setState({ busy: true });
    const { error } = await supabase.rpc("submit_contact_message", {
      p_name: form.name, p_email: form.email, p_subject: form.subject, p_message: form.message,
    });
    if (error) return setState({ err: friendlyError(error.message.includes("check constraint") ? "Please check every field: message must be at least 10 characters and the email valid." : error) });
    setState({ ok: true });
    setForm({ ...form, subject: "", message: "" });
  }

  return (
    <div className="container-page grid gap-10 py-12 lg:grid-cols-[1fr_1.3fr]">
      <div>
        <h1 className="text-4xl font-bold">Contact us</h1>
        <p className="mt-3 text-slate-600">Questions about your account, a payment, or someone's behaviour? Send us a message and our team will reply by email.</p>
        <div className="card mt-6 space-y-3 p-5 text-sm">
          {SUPPORT_EMAIL && <p><span className="font-semibold">Email:</span> <a className="text-plum-800 underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></p>}
          <p><span className="font-semibold">Payments number (Mobile Money):</span> {PAYMENT_NUMBER_DISPLAY}</p>
          <p><span className="font-semibold">Help on WhatsApp:</span> <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="font-semibold text-plum-800 underline">{WHATSAPP_DISPLAY}</a></p>
          <p className="text-slate-600">For payment questions include your transaction ID. Never send us your PIN or password.</p>
          <p className="text-slate-600">Emergency? Call the Uganda Police on 999 or 112.</p>
        </div>
      </div>
      <form onSubmit={submit} className="card space-y-4 p-6" noValidate={false}>
        {state.ok && <Alert kind="success">Thank you — your message was sent. We'll reply by email.</Alert>}
        {state.err && <Alert kind="error">{state.err}</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label" htmlFor="c-name">Your name</label>
            <input id="c-name" className="input" required minLength={2} maxLength={80} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="label" htmlFor="c-email">Email</label>
            <input id="c-email" type="email" className="input" required maxLength={254} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        </div>
        <div><label className="label" htmlFor="c-subject">Subject</label>
          <input id="c-subject" className="input" required minLength={2} maxLength={120} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
        <div><label className="label" htmlFor="c-msg">Message</label>
          <textarea id="c-msg" className="input min-h-36" required minLength={10} maxLength={3000} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></div>
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} aria-hidden="true" />
        <button className="btn-primary w-full" disabled={state.busy}>{state.busy ? "Sending…" : "Send message"}</button>
      </form>
    </div>
  );
}
