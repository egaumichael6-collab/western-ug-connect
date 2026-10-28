import { useState } from "react";
import { supabase, friendlyError } from "../lib/supabase";
import { REPORT_REASONS } from "../lib/config";
import { Alert, Modal } from "./ui";

export function ReportDialog({ open, onClose, userId, name, messageId }: {
  open: boolean; onClose: () => void; userId: string; name: string; messageId?: string;
}) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [alsoBlock, setAlsoBlock] = useState(true);
  const [state, setState] = useState<{ busy?: boolean; ok?: boolean; err?: string }>({});

  async function submit() {
    if (!reason) return setState({ err: "Choose a reason." });
    setState({ busy: true });
    const { error } = await supabase.rpc("report_user", { p_user: userId, p_reason: reason, p_details: details || null, p_message: messageId ?? null });
    if (error) return setState({ err: friendlyError(error) });
    if (alsoBlock) await supabase.rpc("block_user", { p_id: userId });
    setState({ ok: true });
  }

  return (
    <Modal open={open} onClose={onClose} title={messageId ? "Report this message" : `Report ${name}`}>
      {state.ok ? (
        <div className="space-y-4">
          <Alert kind="success">Thank you. Our moderators will review this report. {alsoBlock && `${name} can no longer contact you.`}</Alert>
          <button className="btn-primary w-full" onClick={() => { onClose(); if (alsoBlock) window.location.assign("/app/matches"); }}>Done</button>
        </div>
      ) : (
        <div className="space-y-4">
          {state.err && <Alert kind="error">{state.err}</Alert>}
          <p className="text-sm text-slate-600">Reports are confidential. {messageId ? "A moderator will be able to read only this message." : ""}</p>
          <fieldset className="space-y-2">
            <legend className="label">What's wrong?</legend>
            {REPORT_REASONS.map((r) => (
              <label key={r.value} className="flex items-center gap-2 text-sm">
                <input type="radio" name="reason" value={r.value} checked={reason === r.value} onChange={() => setReason(r.value)} className="accent-plum-800" />
                {r.label}
              </label>
            ))}
          </fieldset>
          <div><label className="label" htmlFor="rep-d">Details (optional)</label>
            <textarea id="rep-d" className="input" maxLength={1000} value={details} onChange={(e) => setDetails(e.target.value)} /></div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={alsoBlock} onChange={(e) => setAlsoBlock(e.target.checked)} className="accent-plum-800" /> Also block {name}
          </label>
          <button className="btn-danger w-full" onClick={submit} disabled={state.busy}>{state.busy ? "Sending…" : "Send report"}</button>
        </div>
      )}
    </Modal>
  );
}

export function BlockButton({ userId, name, onDone, className = "btn-outline btn-sm" }: { userId: string; name: string; onDone?: () => void; className?: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <button className={className} disabled={busy} onClick={async () => {
      if (!window.confirm(`Block ${name}? They won't be able to see you or contact you, and any match will end.`)) return;
      setBusy(true);
      const { error } = await supabase.rpc("block_user", { p_id: userId });
      setBusy(false);
      if (error) return window.alert(friendlyError(error));
      onDone?.();
    }}>Block</button>
  );
}
