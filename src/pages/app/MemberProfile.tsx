import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase, friendlyError, isMembershipError } from "../../lib/supabase";
import { usePageMeta } from "../../lib/usePageMeta";
import { useAuth } from "../../context/AuthContext";
import { goalLabel, LIFESTYLE_FIELDS } from "../../lib/config";
import { timeAgo, fmtDate } from "../../lib/format";
import { Alert, Avatar, MembershipPrompt, Modal, Spinner } from "../../components/ui";
import { BlockButton, ReportDialog } from "../../components/ReportBlock";
import type { MemberCard } from "../../lib/types";

type Full = MemberCard & {
  photos: string[]; photos_hidden: boolean; lifestyle: Record<string, string>; is_matched: boolean;
  conversation_id: string | null; match_id: string | null; they_liked_me: boolean; last_active: string | null; member_since: string; university?: string | null;
  request: { id: string; status: string; outgoing: boolean } | null; bio: string | null;
};

export default function MemberProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [m, setM] = useState<Full | null>(null);
  const [state, setState] = useState<"loading" | "locked" | "error" | "ok">("loading");
  const [err, setErr] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [photo, setPhoto] = useState(0);
  const [reqOpen, setReqOpen] = useState(false);
  const [reqMsg, setReqMsg] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  usePageMeta(m ? m.display_name : "Member profile", undefined, { noindex: true });

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc("get_member_profile", { p_id: id });
    if (error) {
      if (isMembershipError(error)) return setState("locked");
      setErr(friendlyError(error));
      return setState("error");
    }
    setM(data as Full);
    setState("ok");
  }, [id]);
  useEffect(() => { load(); }, [load]);

  async function act(fn: () => PromiseLike<{ data: unknown; error: unknown }>, onOk?: (d: unknown) => void) {
    setBusy(true); setErr(null);
    const { data, error } = await fn();
    setBusy(false);
    if (error) return setErr(friendlyError(error));
    onOk?.(data);
    load();
  }

  if (state === "loading") return <Spinner />;
  if (state === "locked") return <MembershipPrompt />;
  if (state === "error" || !m) return <Alert kind="error">{err ?? "This profile is not available."}</Alert>;
  const self = m.id === user?.id;
  const lifestyle = LIFESTYLE_FIELDS.filter((f) => m.lifestyle?.[f.key]);

  return (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.1fr_1fr]">
      <div>
        <div className="card overflow-hidden">
          <div className="relative aspect-[4/5] bg-plum-100 [&>*]:!h-full [&>*]:!w-full">
            {m.photos.length > 0 ? (
              <Avatar key={m.photos[photo]} path={m.photos[photo]} name={m.display_name} size={600} rounded="rounded-none" />
            ) : (
              <div className="flex items-center justify-center p-8 text-center text-sm text-plum-800">
                {m.photos_hidden ? `${m.display_name} shares photos with matches only.` : "No photos yet."}
              </div>
            )}
          </div>
          {m.photos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto p-3">
              {m.photos.map((p, i) => (
                <button key={p} onClick={() => setPhoto(i)} aria-label={`Photo ${i + 1}`} className={`rounded-lg ring-2 ${i === photo ? "ring-gold-500" : "ring-transparent"}`}>
                  <Avatar path={p} name={m.display_name} size={64} rounded="rounded-lg" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            {m.display_name}, {m.age}
            {m.online && <span className="h-3 w-3 rounded-full bg-emerald-500" title="Online now" />}
          </h1>
          <p className="mt-1 text-slate-600">{m.gender === "woman" ? "Woman" : "Man"} · {m.town ? `${m.town}, ` : ""}{m.district}</p>
          {m.university && <p className="mt-1 inline-block rounded-full bg-fuchsia-50 px-2.5 py-0.5 text-xs font-semibold text-fuchsia-800 ring-1 ring-fuchsia-200">🎓 {m.university}</p>}
          <p className="mt-1 text-xs text-slate-500">
            {m.last_active && !m.online ? `Active ${timeAgo(m.last_active)} · ` : ""}Member since {fmtDate(m.member_since)}
          </p>
          <span className="chip mt-3">{goalLabel(m.relationship_goal)}</span>
        </div>

        {flash && <Alert kind="success">{flash}</Alert>}
        {err && <Alert kind="error">{err}</Alert>}
        {m.they_liked_me && !m.is_matched && <Alert kind="info">{m.display_name} likes you! Like them back to match.</Alert>}

        {!self && (
          <div className="flex flex-wrap gap-2">
            {m.is_matched ? (
              <>
                <span className="chip bg-emerald-100 text-emerald-800">You're matched 💜</span>
                {m.conversation_id && <Link to={`/app/messages/${m.conversation_id}`} className="btn-primary">Send a message</Link>}
              </>
            ) : (
              <>
                <button className={m.i_liked ? "btn-outline" : "btn-primary"} disabled={busy}
                  onClick={() => act(() => (m.i_liked ? supabase.rpc("unlike_member", { p_id: m.id }) : supabase.rpc("like_member", { p_id: m.id })),
                    (d) => { if ((d as { matched?: boolean } | null)?.matched) setFlash(`It's a match! You can now message ${m.display_name}.`); })}>
                  {m.i_liked ? "♥ Liked" : "♡ Like"}
                </button>
                {m.request?.outgoing && m.request.status === "pending" ? (
                  <button className="btn-outline" disabled={busy} onClick={() => act(() => supabase.rpc("cancel_connection_request", { p_request: m.request!.id }))}>Cancel request</button>
                ) : m.request && !m.request.outgoing && m.request.status === "pending" ? (
                  <button className="btn-gold" disabled={busy} onClick={() => act(() => supabase.rpc("respond_connection_request", { p_request: m.request!.id, p_accept: true }))}>Accept their request</button>
                ) : m.request?.status === "declined" && m.request.outgoing ? null : (
                  <button className="btn-gold" onClick={() => setReqOpen(true)}>Send connection request</button>
                )}
              </>
            )}
            <button className="btn-ghost" disabled={busy} onClick={() => act(() => supabase.rpc("toggle_favorite", { p_id: m.id }))}>{m.is_favorite ? "★ Saved" : "☆ Save"}</button>
          </div>
        )}

        {m.bio && <section className="card p-5"><h2 className="mb-2 text-base font-bold">About me</h2><p className="whitespace-pre-line text-sm text-slate-700">{m.bio}</p></section>}
        {m.interests?.length > 0 && (
          <section className="card p-5"><h2 className="mb-2 text-base font-bold">Interests</h2>
            <div className="flex flex-wrap gap-1.5">{m.interests.map((i) => <span key={i} className="chip">{i}</span>)}</div></section>
        )}
        {lifestyle.length > 0 && (
          <section className="card p-5"><h2 className="mb-2 text-base font-bold">Lifestyle</h2>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              {lifestyle.map((f) => <div key={f.key}><dt className="text-xs text-slate-500">{f.label}</dt><dd className="font-medium">{m.lifestyle[f.key]}</dd></div>)}
            </dl></section>
        )}

        {!self && (
          <div className="flex gap-2 border-t border-plum-100 pt-4">
            <button className="btn-outline btn-sm" onClick={() => setReportOpen(true)}>Report</button>
            <BlockButton userId={m.id} name={m.display_name} onDone={() => nav("/app/discover")} />
            {m.is_matched && <button className="btn-ghost btn-sm" onClick={async () => {
              if (!window.confirm(`Unmatch ${m.display_name}? Your conversation will close.`)) return;
              if (m.match_id) act(() => supabase.rpc("unmatch", { p_match: m.match_id }));
            }}>Unmatch</button>}
          </div>
        )}
      </div>

      <Modal open={reqOpen} onClose={() => setReqOpen(false)} title={`Connect with ${m.display_name}`}>
        <label className="label" htmlFor="req-msg">Add a short, friendly note (optional)</label>
        <textarea id="req-msg" className="input min-h-24" maxLength={300} value={reqMsg} onChange={(e) => setReqMsg(e.target.value)}
          placeholder="Hi! I enjoyed reading your profile…" />
        <p className="mt-1 text-xs text-slate-500">{reqMsg.length}/300 · Never include phone numbers or ask for money.</p>
        <button className="btn-primary mt-4 w-full" disabled={busy} onClick={() => act(
          () => supabase.rpc("send_connection_request", { p_id: m.id, p_message: reqMsg || null }),
          (d) => { setReqOpen(false); setReqMsg(""); setFlash((d as { matched?: boolean })?.matched ? `It's a match! You can now message ${m.display_name}.` : "Connection request sent."); },
        )}>Send request</button>
      </Modal>
      <ReportDialog open={reportOpen} onClose={() => setReportOpen(false)} userId={m.id} name={m.display_name} />
    </div>
  );
}
