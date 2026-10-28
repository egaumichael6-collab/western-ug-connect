import { useCallback, useEffect, useState } from "react";
import { supabase, friendlyError, signedPhotoUrl } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import type { Payment } from "../../lib/types";
import { PAYMENT_NUMBER_DISPLAY, ugx } from "../../lib/config";
import { fmtDateTime } from "../../lib/format";
import { Alert, Modal, Spinner, StatusBadge } from "../../components/ui";
import AdminShell from "./AdminShell";

type Row = Payment & { member_name: string | null; member_full_name: string | null; member_phone: string | null; member_email: string | null; reviewer_email: string | null; ref_used_before: boolean };
interface Hist { id: string; decision: string; note: string | null; received_amount_ugx: number | null; admin_email: string | null; created_at: string }

export default function AdminPayments() {
  const { role } = useAuth();
  const [status, setStatus] = useState("pending");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [sel, setSel] = useState<Row | null>(null);
  const [mode, setMode] = useState<"approve" | "reject" | "refund" | "reopen" | null>(null);
  const [note, setNote] = useState("");
  const [received, setReceived] = useState("");
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hist, setHist] = useState<Hist[]>([]);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  const load = useCallback(async () => {
    setRows(null);
    const { data, error } = await supabase.rpc("admin_list_payments", { p_status: status, p_search: search || null, p_limit: 100 });
    if (error) setErr(friendlyError(error));
    setRows((data ?? []) as Row[]);
  }, [status, search]);
  useEffect(() => { load(); }, [status]); // search runs on submit

  // New submissions and changes appear instantly, no refresh needed
  useEffect(() => {
    const ch = supabase.channel("admin-payments")
      .on("postgres_changes", { event: "*", schema: "public", table: "payment_submissions" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  async function quickApprove(r: Row) {
    const ok = window.confirm(
      `Approve ${r.member_name ?? "member"}?\n\nOnly continue if you can see ${r.network.toUpperCase()} transaction ${r.transaction_ref} for at least ${ugx(r.amount_ugx)} in your mobile money messages.`);
    if (!ok) return;
    setErr(null);
    const { error } = await supabase.rpc("admin_review_payment", { p_payment: r.id, p_approve: true, p_note: "Quick approve", p_received_amount: r.amount_ugx });
    if (error) return setErr(friendlyError(error));
    setFlash(`Activated ${r.package_name} for ${r.member_name}.`);
    load();
  }

  async function open(r: Row, preset: typeof mode = null) {
    setSel(r); setMode(preset); setNote(""); setReceived(String(r.amount_ugx)); setChecked(false); setErr(null); setReceiptUrl(null);
    const [{ data }, url] = await Promise.all([
      supabase.rpc("admin_payment_history", { p_payment: r.id }),
      r.receipt_path ? signedPhotoUrl(r.receipt_path, "payment-receipts") : Promise.resolve(null),
    ]);
    setHist((data ?? []) as Hist[]);
    setReceiptUrl(url);
  }

  async function decide() {
    if (!sel || !mode) return;
    setBusy(true); setErr(null);
    let res;
    if (mode === "approve") res = await supabase.rpc("admin_review_payment", { p_payment: sel.id, p_approve: true, p_note: note || null, p_received_amount: Number(received) });
    else if (mode === "reject") res = await supabase.rpc("admin_review_payment", { p_payment: sel.id, p_approve: false, p_note: note, p_received_amount: received ? Number(received) : null });
    else if (mode === "refund") res = await supabase.rpc("admin_refund_payment", { p_payment: sel.id, p_note: note });
    else res = await supabase.rpc("admin_reopen_payment", { p_payment: sel.id, p_note: note });
    setBusy(false);
    if (res.error) return setErr(friendlyError(res.error));
    setFlash(mode === "approve" ? `Approved — ${sel.package_name} activated for ${sel.member_name}.` : mode === "reject" ? "Payment rejected; the member has been told why." : mode === "refund" ? "Refund recorded and membership ended." : "Payment re-opened for review.");
    setSel(null);
    load();
  }

  if (role !== "admin") return <AdminShell title="Payment verification"><Alert kind="error">Only administrators can verify payments.</Alert></AdminShell>;

  return (
    <AdminShell title="Payment verification">
      <Alert kind="info">
        For every pending payment, open your mobile money statement or SMS for <strong>{PAYMENT_NUMBER_DISPLAY}</strong> and find the transaction ID.
        Approve only if the ID exists, the sender matches, and the amount you actually received is at least the package price.
      </Alert>
      <div className="my-5 flex flex-wrap items-center gap-2">
        {["pending", "approved", "rejected", "refunded", "all"].map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={`rounded-full px-3.5 py-1.5 text-sm font-semibold capitalize ${status === s ? "bg-plum-800 text-white" : "bg-white text-plum-800 ring-1 ring-plum-200"}`}>{s}</button>
        ))}
        <form className="flex w-full gap-2 sm:ml-auto sm:w-auto" onSubmit={(e) => { e.preventDefault(); load(); }}>
          <input className="input sm:w-56" placeholder="Search ID, phone, name, email" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search payments" />
          <button className="btn-outline">Search</button>
        </form>
      </div>
      {flash && <div className="mb-4"><Alert kind="success">{flash}</Alert></div>}
      {err && !sel && <div className="mb-4"><Alert kind="error">{err}</Alert></div>}

      {!rows ? <Spinner /> : rows.length === 0 ? <p className="card p-8 text-center text-slate-500">{status === "pending" ? "All caught up — no payments waiting." : `No ${status === "all" ? "" : status} payments.`}</p> : (
        <div className="space-y-3">
          {rows.map((r) => (
            <article key={r.id} className={`card p-4 ${r.status === "pending" ? "border-gold-300" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold">{r.member_name ?? <em className="text-slate-400">deleted member</em>} <span className="font-normal text-slate-500">· {r.package_name}</span></p>
                  <p className="truncate text-xs text-slate-500">{r.member_email} · submitted {fmtDateTime(r.created_at)}</p>
                </div>
                <StatusBadge status={r.status} />
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
                <div><dt className="text-xs text-slate-500">Amount due</dt><dd className="font-bold">{ugx(r.amount_ugx)}</dd></div>
                <div><dt className="text-xs text-slate-500">Network</dt><dd className="font-semibold uppercase">{r.network}</dd></div>
                <div className="col-span-2"><dt className="text-xs text-slate-500">Transaction ID</dt>
                  <dd className="break-all font-mono text-base font-bold">{r.transaction_ref}
                    {r.ref_used_before && <span className="ml-1 rounded bg-red-100 px-1 text-[10px] font-bold text-red-700">SEEN BEFORE</span>}</dd></div>
                <div className="col-span-2 sm:col-span-4"><dt className="text-xs text-slate-500">Paid from</dt><dd>{r.payer_phone}{r.receipt_path ? " · screenshot attached" : ""}{r.user_note ? ` · "${r.user_note}"` : ""}</dd></div>
              </dl>
              <div className="mt-3 flex flex-wrap gap-2">
                {r.status === "pending" && <>
                  <button className="btn-primary flex-1 sm:flex-none" onClick={() => quickApprove(r)}>✓ Approve &amp; activate</button>
                  <button className="btn-outline" onClick={() => open(r, "reject")}>Reject</button>
                </>}
                <button className="btn-ghost" onClick={() => open(r)}>Details</button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal open={!!sel} onClose={() => setSel(null)} title="Payment details">
        {sel && (
          <div className="space-y-4 text-sm">
            <dl className="grid grid-cols-2 gap-3 rounded-xl bg-plum-50 p-4">
              <div><dt className="text-xs text-slate-500">Member</dt><dd className="font-semibold">{sel.member_name} ({sel.member_full_name})</dd></div>
              <div><dt className="text-xs text-slate-500">Account phone</dt><dd>{sel.member_phone}</dd></div>
              <div><dt className="text-xs text-slate-500">Package</dt><dd className="font-semibold">{sel.package_name}</dd></div>
              <div><dt className="text-xs text-slate-500">Expected amount</dt><dd className="font-semibold">{ugx(sel.amount_ugx)}</dd></div>
              <div><dt className="text-xs text-slate-500">Network</dt><dd className="uppercase">{sel.network}</dd></div>
              <div><dt className="text-xs text-slate-500">Paid from</dt><dd>{sel.payer_phone}</dd></div>
              <div className="col-span-2"><dt className="text-xs text-slate-500">Transaction ID</dt><dd className="font-mono text-lg font-bold">{sel.transaction_ref}</dd></div>
              {sel.user_note && <div className="col-span-2"><dt className="text-xs text-slate-500">Member note</dt><dd>{sel.user_note}</dd></div>}
              {sel.review_note && <div className="col-span-2"><dt className="text-xs text-slate-500">Review note</dt><dd>{sel.review_note}</dd></div>}
            </dl>
            {sel.ref_used_before && <Alert kind="warn">This transaction ID also appears on another submission. Check the history before approving.</Alert>}
            {sel.receipt_path && (
              <div>
                <p className="label">Uploaded receipt (supporting evidence only)</p>
                {receiptUrl ? (sel.receipt_path.endsWith(".pdf")
                  ? <a href={receiptUrl} target="_blank" rel="noreferrer" className="btn-outline btn-sm">Open PDF</a>
                  : <a href={receiptUrl} target="_blank" rel="noreferrer"><img src={receiptUrl} alt="Payment receipt" className="max-h-72 rounded-lg border" /></a>) : <p className="text-slate-500">Loading…</p>}
              </div>
            )}
            {hist.length > 0 && (
              <div>
                <p className="label">Verification history</p>
                <ul className="space-y-1 text-xs text-slate-600">
                  {hist.map((h) => <li key={h.id}>{fmtDateTime(h.created_at)} — <strong>{h.decision}</strong> by {h.admin_email ?? "admin"}{h.received_amount_ugx ? ` (received ${ugx(h.received_amount_ugx)})` : ""}{h.note ? `: ${h.note}` : ""}</li>)}
                </ul>
              </div>
            )}

            {err && <Alert kind="error">{err}</Alert>}
            {!mode ? (
              <div className="flex flex-wrap gap-2 border-t border-plum-100 pt-4">
                {sel.status === "pending" && <>
                  <button className="btn-primary" onClick={() => setMode("approve")}>Approve & activate</button>
                  <button className="btn-danger" onClick={() => setMode("reject")}>Reject</button>
                </>}
                {sel.status === "approved" && <button className="btn-outline" onClick={() => setMode("refund")}>Record refund</button>}
                {sel.status === "rejected" && <button className="btn-outline" onClick={() => setMode("reopen")}>Re-open</button>}
              </div>
            ) : (
              <div className="space-y-3 border-t border-plum-100 pt-4">
                {(mode === "approve" || mode === "reject") && (
                  <div><label className="label" htmlFor="ap-recv">Amount actually received in mobile money (UGX){mode === "reject" && " — optional"}</label>
                    <input id="ap-recv" type="number" min={0} className="input" value={received} onChange={(e) => setReceived(e.target.value)} /></div>
                )}
                <div><label className="label" htmlFor="ap-note">{mode === "approve" ? "Internal note (optional)" : mode === "reject" ? "Reason shown to the member (required)" : mode === "refund" ? "Refund reason and mobile money refund ID (required)" : "Why re-open? (required)"}</label>
                  <textarea id="ap-note" className="input" value={note} onChange={(e) => setNote(e.target.value)}
                    placeholder={mode === "reject" ? "e.g. Transaction ID not found in our records — please check the SMS." : ""} /></div>
                {mode === "approve" && (
                  <label className="flex items-start gap-2 rounded-xl bg-gold-50 p-3">
                    <input type="checkbox" className="mt-0.5 accent-plum-800" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
                    <span>I found transaction <strong className="font-mono">{sel.transaction_ref}</strong> in the mobile money records for {PAYMENT_NUMBER_DISPLAY} and the amount received is correct.</span>
                  </label>
                )}
                <div className="flex gap-2">
                  <button className={mode === "approve" ? "btn-primary" : mode === "reject" ? "btn-danger" : "btn-outline"} disabled={busy || (mode === "approve" && !checked) || (mode !== "approve" && !note.trim())} onClick={decide}>
                    {busy ? "Saving…" : `Confirm ${mode}`}
                  </button>
                  <button className="btn-ghost" onClick={() => setMode(null)}>Back</button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </AdminShell>
  );
}
