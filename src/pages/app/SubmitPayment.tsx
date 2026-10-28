import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase, friendlyError } from "../../lib/supabase";
import { usePageMeta } from "../../lib/usePageMeta";
import { usePackages } from "../../lib/usePackages";
import { useAuth } from "../../context/AuthContext";
import { PAYMENT_NUMBER, PAYMENT_NUMBER_DISPLAY, PAYMENT_NUMBER_LOCAL, ugx } from "../../lib/config";
import { compressImage } from "../../lib/images";
import { Alert, Spinner } from "../../components/ui";

/** One page: pay by MTN/Airtel, then type the transaction ID. Used for /app/checkout/:code and /app/pay/:code. */
export default function PayAndActivate() {
  usePageMeta("Pay & activate", undefined, { noindex: true });
  const { code } = useParams();
  const { packages } = usePackages();
  const { user, profile } = useAuth();
  const [f, setF] = useState({ network: "", ref: "", phone: profile?.phone ?? "", note: "" });
  const [file, setFile] = useState<File | null>(null);
  const [showMore, setShowMore] = useState(false);
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  if (!packages) return <Spinner />;
  const p = packages.find((x) => x.code === code);
  if (!p || !p.is_active) return <Alert kind="error">This package is not available. <Link to="/memberships" className="underline">See packages</Link></Alert>;
  const diamond = p.tier === "diamond";

  const copy = async () => {
    try { await navigator.clipboard.writeText(PAYMENT_NUMBER_LOCAL.replace(/\s/g, "")); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ }
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!f.network) return setErr("Tap MTN or Airtel — the network you paid with.");
    if (f.ref.replace(/[^A-Za-z0-9]/g, "").length < 6) return setErr("Type the full transaction ID exactly as it appears in your SMS.");
    if (!/^\+?[0-9]{9,15}$/.test(f.phone.replace(/[\s-]/g, ""))) return setErr("Enter the phone number you paid from, e.g. 0772123456.");
    setBusy(true);
    let receiptPath: string | null = null;
    try {
      if (file) {
        let blob: Blob = file;
        let ext = "pdf";
        if (file.type === "application/pdf") {
          if (file.size > 5 * 1024 * 1024) throw new Error("The PDF must be smaller than 5 MB.");
        } else if (["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
          blob = await compressImage(file, 1600, 0.85);
          ext = blob.type === "image/webp" ? "webp" : "jpg";
        } else throw new Error("The screenshot must be a JPG, PNG or WebP image, or a PDF.");
        receiptPath = `${user!.id}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("payment-receipts").upload(receiptPath, blob, { contentType: blob.type || file.type });
        if (error) throw error;
      }
      // Only the package code is sent; the server sets the amount and duration.
      const { error } = await supabase.rpc("submit_payment", {
        p_package: p!.code, p_network: f.network, p_transaction_ref: f.ref.trim(),
        p_payer_phone: f.phone.replace(/[\s-]/g, ""), p_receipt_path: receiptPath, p_note: f.note || null,
      });
      if (error) throw error;
      setDone(true);
      window.scrollTo({ top: 0 });
    } catch (e2) {
      setErr(friendlyError(e2));
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg">
        <div className="card p-6 text-center sm:p-8">
          <div className="text-5xl" aria-hidden>✅</div>
          <h1 className="mt-4 text-2xl font-bold">Transaction ID received</h1>
          <p className="mt-3 text-slate-600">
            Our admin is checking <strong className="font-mono">{f.ref.trim().toUpperCase()}</strong> now. Your {p.name} will be
            activated as soon as it's confirmed — usually within minutes. You'll get a notification.
          </p>
          <p className="mt-3 text-sm text-slate-500">Until then your status is "Pending verification".</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link to="/app/payments" className="btn-primary">Check status</Link>
            <Link to="/app/discover" className="btn-outline">Back to Discover</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      {/* Package summary */}
      <div className={`rounded-2xl p-5 ${diamond ? "bg-gradient-to-br from-plum-950 to-plum-800 text-white" : "card"}`}>
        <p className={`text-xs font-bold tracking-[0.2em] ${diamond ? "text-gold-300" : "text-gold-600"}`}>YOUR PACKAGE</p>
        <h1 className={`mt-1 text-xl font-bold sm:text-2xl ${diamond ? "text-white" : ""}`}>{p.name}</h1>
        <div className="mt-3 flex items-end justify-between gap-3">
          <p className="font-display text-3xl font-bold">{ugx(p.price_ugx)}</p>
          <p className="text-sm opacity-80">{p.duration_days} days</p>
        </div>
        <Link to="/memberships" className={`mt-2 inline-block text-xs underline ${diamond ? "text-plum-200" : "text-plum-700"}`}>Change package</Link>
      </div>

      {/* Step 1 */}
      <section className="card p-5">
        <h2 className="flex items-center gap-2 text-lg font-bold"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-gold-400 text-sm text-plum-950">1</span> Send the money</h2>
        <div className="mt-4 rounded-2xl border-2 border-gold-400 bg-gold-50 p-4 text-center">
          <p className="text-sm text-gold-700">Send exactly <strong>{ugx(p.price_ugx)}</strong> to</p>
          <a href={`tel:${PAYMENT_NUMBER}`} className="mt-1 block font-display text-3xl font-bold tracking-wide text-plum-950">{PAYMENT_NUMBER_LOCAL}</a>
          <p className="text-xs text-slate-500">({PAYMENT_NUMBER_DISPLAY})</p>
          <button type="button" onClick={copy} className="btn-outline btn-sm mt-3">{copied ? "Copied ✓" : "Copy number"}</button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <a href="tel:*165%23" className="rounded-xl bg-[#ffcc00] p-3 text-center font-semibold text-black">
            MTN MoMo<br /><span className="font-mono text-lg">*165#</span>
          </a>
          <a href="tel:*185%23" className="rounded-xl bg-[#e40000] p-3 text-center font-semibold text-white">
            Airtel Money<br /><span className="font-mono text-lg">*185#</span>
          </a>
        </div>
        <p className="mt-3 text-xs text-slate-500">Dial, choose <strong>Send Money</strong>, enter {PAYMENT_NUMBER_LOCAL} and {p.price_ugx.toLocaleString()}, then enter your PIN <strong>on your own phone only</strong>. Keep the SMS you receive.</p>
      </section>

      {/* Step 2 */}
      <form onSubmit={submit} className="card space-y-4 p-5">
        <h2 className="flex items-center gap-2 text-lg font-bold"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-gold-400 text-sm text-plum-950">2</span> Enter your transaction ID</h2>
        {err && <Alert kind="error">{err}</Alert>}
        <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Network you paid with">
          {[["mtn", "MTN"], ["airtel", "Airtel"]].map(([v, l]) => (
            <label key={v} className={`flex min-h-12 cursor-pointer items-center justify-center rounded-xl border-2 text-base font-semibold ${f.network === v ? "border-plum-700 bg-plum-50 text-plum-900" : "border-slate-200"}`}>
              <input type="radio" name="network" value={v} className="sr-only" checked={f.network === v} onChange={() => setF({ ...f, network: v })} />{l}
            </label>
          ))}
        </div>
        <div>
          <label className="label" htmlFor="sp-ref">Transaction ID from the SMS</label>
          <input id="sp-ref" className="input h-12 text-center font-mono text-lg uppercase tracking-wider" maxLength={40} required
            inputMode="text" autoCapitalize="characters" autoComplete="off" spellCheck={false} placeholder="e.g. 12345678901"
            value={f.ref} onChange={(e) => setF({ ...f, ref: e.target.value })} />
          <p className="mt-1 text-xs text-slate-500">Look for "ID", "TID", "Trans ID" or "Ref" in the confirmation SMS. Each ID works once only.</p>
        </div>
        <div>
          <label className="label" htmlFor="sp-phone">Number you paid from</label>
          <input id="sp-phone" type="tel" inputMode="tel" className="input h-12" required value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
        </div>
        <button type="button" className="text-sm text-plum-800 underline" onClick={() => setShowMore(!showMore)} aria-expanded={showMore}>
          {showMore ? "Hide extras" : "Add a screenshot or note (optional)"}
        </button>
        {showMore && (
          <div className="space-y-3">
            <div><label className="label" htmlFor="sp-file">Screenshot of the SMS</label>
              <input id="sp-file" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="block w-full text-sm" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></div>
            <div><label className="label" htmlFor="sp-note">Note</label>
              <input id="sp-note" className="input" maxLength={300} placeholder="e.g. Paid from my brother's number" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></div>
          </div>
        )}
        <button className="btn-primary h-12 w-full text-base" disabled={busy}>{busy ? "Sending…" : "Activate my membership"}</button>
        <p className="text-center text-xs text-slate-500">We never ask for your PIN or SMS codes. Your membership starts after our admin confirms the ID.</p>
      </form>
    </div>
  );
}
