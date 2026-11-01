import { useCallback, useEffect, useState } from "react";
import { supabase, friendlyError, signedPhotoUrl } from "../../lib/supabase";
import { fmtDateTime } from "../../lib/format";
import { Alert, Avatar, EmptyState, Spinner } from "../../components/ui";
import AdminShell from "./AdminShell";

interface Row {
  id: string; display_name: string; full_name: string; age: number; gender: string; district: string;
  status: string; note: string | null; gesture: string | null; selfie: string | null;
  submitted_at: string | null; verified_at: string | null; created_at: string;
  photos: string[]; approved_photos: string[]; pending_photos: string[];
}

const FILTERS = [
  { v: "pending", l: "Selfies to check" },
  { v: "photos", l: "New photos" },
  { v: "rejected", l: "Rejected" },
  { v: "unverified", l: "Not started" },
  { v: "approved", l: "Verified" },
];
const REASONS = [
  "The selfie does not match your profile photos.",
  "Your face is not clear in the selfie — use good light and face the camera.",
  "You did not do the gesture shown on screen.",
  "Your profile photos must be real photos of you (no celebrities, cartoons, group or edited photos).",
];

function Selfie({ path }: { path: string | null }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => { let live = true; if (path) signedPhotoUrl(path, "verification-selfies").then((u) => live && setUrl(u)); return () => { live = false; }; }, [path]);
  if (!path) return <div className="flex aspect-[3/4] items-center justify-center rounded-xl bg-slate-100 text-xs text-slate-500">No selfie</div>;
  return url ? <a href={url} target="_blank" rel="noreferrer"><img src={url} alt="Verification selfie" className="aspect-[3/4] w-full rounded-xl object-cover" /></a>
    : <div className="aspect-[3/4] animate-pulse rounded-xl bg-slate-100" />;
}

export default function AdminVerifications() {
  const [filter, setFilter] = useState("pending");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setRows(null);
    const { data, error } = await supabase.rpc("admin_list_verifications", { p_filter: filter, p_limit: 100 });
    if (error) setErr(friendlyError(error));
    setRows((data ?? []) as Row[]);
  }, [filter]);
  useEffect(() => { load(); }, [load]);

  async function decide(r: Row, approve: boolean) {
    const note = (notes[r.id] ?? "").trim();
    if (!approve && !note) return setErr("Choose or write a reason before rejecting.");
    setBusy(r.id); setErr(null);
    const { error } = await supabase.rpc("admin_review_verification", { p_user: r.id, p_approve: approve, p_note: approve ? null : note });
    setBusy(null);
    if (error) return setErr(friendlyError(error));
    setFlash(approve ? `${r.display_name} is verified and now visible.` : `${r.display_name} was asked to try again.`);
    load();
  }

  async function photos(r: Row, approve: string[], reject: string[]) {
    setBusy(r.id); setErr(null);
    const { error } = await supabase.rpc("admin_review_photos", { p_user: r.id, p_approve: approve, p_reject: reject, p_note: notes[r.id] || null });
    setBusy(null);
    if (error) return setErr(friendlyError(error));
    setFlash(`Photos updated for ${r.display_name}.`);
    load();
  }

  return (
    <AdminShell title="Face & photo checks">
      <p className="-mt-3 mb-5 max-w-3xl text-sm text-slate-600">
        Approve only when the live selfie clearly shows the same person as the profile photos, doing the gesture shown. Members stay hidden until approved.
        New photos added by verified members stay hidden until you approve them here.
      </p>
      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button key={f.v} onClick={() => setFilter(f.v)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${filter === f.v ? "bg-plum-800 text-white" : "border border-plum-200 text-plum-800 hover:bg-plum-50"}`}>{f.l}</button>
        ))}
      </div>
      {err && <div className="mb-4"><Alert kind="error">{err}</Alert></div>}
      {flash && <div className="mb-4"><Alert kind="success">{flash}</Alert></div>}
      {!rows ? <Spinner /> : rows.length === 0 ? <EmptyState title="Nothing to review here">New items appear as members send them.</EmptyState> : (
        <div className="space-y-5">
          {rows.map((r) => (
            <article key={r.id} className="card p-4 sm:p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-lg font-bold">{r.display_name} <span className="text-sm font-normal text-slate-500">({r.full_name}) · {r.age} · {r.gender} · {r.district}</span></h2>
                <span className="text-xs text-slate-500">{r.submitted_at ? `Sent ${fmtDateTime(r.submitted_at)}` : `Joined ${fmtDateTime(r.created_at)}`}</span>
              </div>

              {filter === "photos" ? (
                <>
                  <p className="mt-3 text-xs font-semibold text-slate-500">NEW PHOTOS AWAITING REVIEW</p>
                  <div className="mt-2 flex flex-wrap gap-3">
                    {r.pending_photos.map((p) => (
                      <div key={p} className="w-28">
                        <Avatar path={p} name={r.display_name} size={112} rounded="rounded-xl" />
                        <div className="mt-1 flex gap-1">
                          <button className="flex-1 rounded bg-emerald-600 py-1 text-xs font-semibold text-white" disabled={busy === r.id} onClick={() => photos(r, [p], [])}>Approve</button>
                          <button className="flex-1 rounded bg-red-600 py-1 text-xs font-semibold text-white" disabled={busy === r.id} onClick={() => photos(r, [], [p])}>Remove</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-xs font-semibold text-slate-500">ALREADY APPROVED</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {r.approved_photos.map((p) => <Avatar key={p} path={p} name={r.display_name} size={64} rounded="rounded-lg" />)}
                  </div>
                  <input className="input mt-3" placeholder="Optional message if you remove a photo" value={notes[r.id] ?? ""} onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })} />
                  <button className="btn-primary mt-3" disabled={busy === r.id} onClick={() => photos(r, r.pending_photos, [])}>Approve all new photos</button>
                </>
              ) : (
                <div className="mt-4 grid gap-4 sm:grid-cols-[180px_1fr]">
                  <div>
                    <p className="mb-1 text-xs font-semibold text-slate-500">LIVE SELFIE</p>
                    <Selfie path={r.selfie} />
                    {r.gesture && <p className="mt-2 rounded-lg bg-gold-50 p-2 text-xs text-plum-950"><strong>Asked to:</strong> {r.gesture}</p>}
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-semibold text-slate-500">PROFILE PHOTOS</p>
                    <div className="flex flex-wrap gap-2">
                      {r.photos.length ? r.photos.map((p) => <Avatar key={p} path={p} name={r.display_name} size={110} rounded="rounded-xl" />)
                        : <p className="text-sm text-red-700">No photos — cannot be approved.</p>}
                    </div>
                    {r.note && <p className="mt-3 text-xs text-slate-600"><strong>Last note:</strong> {r.note}</p>}
                    {r.status !== "approved" && (
                      <>
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {REASONS.map((x) => (
                            <button key={x} onClick={() => setNotes({ ...notes, [r.id]: x })}
                              className="rounded-full border border-plum-100 px-2.5 py-1 text-left text-xs text-slate-700 hover:bg-plum-50">{x}</button>
                          ))}
                        </div>
                        <textarea className="input mt-2 min-h-16" placeholder="Reason (shown to the member if you reject)" value={notes[r.id] ?? ""}
                          onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })} />
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button className="btn bg-emerald-600 px-5 text-white hover:bg-emerald-700" disabled={busy === r.id || !r.selfie || !r.photos.length} onClick={() => decide(r, true)}>✓ Approve — same real person</button>
                          <button className="btn bg-red-600 px-5 text-white hover:bg-red-700" disabled={busy === r.id} onClick={() => decide(r, false)}>Reject</button>
                        </div>
                      </>
                    )}
                    {r.status === "approved" && r.verified_at && <p className="mt-3 text-sm text-emerald-700">Verified {fmtDateTime(r.verified_at)}</p>}
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
