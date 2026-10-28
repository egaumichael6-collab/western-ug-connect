import { useCallback, useEffect, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase, friendlyError } from "../../lib/supabase";
import { usePageMeta } from "../../lib/usePageMeta";
import { useAuth } from "../../context/AuthContext";
import type { MemberCard, Message } from "../../lib/types";
import { Alert, Avatar, EmptyState, MembershipPrompt, Spinner } from "../../components/ui";
import { BlockButton, ReportDialog } from "../../components/ReportBlock";
import { fmtDate, fmtTime, timeAgo } from "../../lib/format";

type Conv = MemberCard & { conversation_id: string; last_message_at: string | null; unread: number; preview: string | null; active: boolean };
const PAGE = 30;

export default function Messages() {
  usePageMeta("Messages", undefined, { noindex: true });
  const { conversationId } = useParams();
  const { tier } = useAuth();
  const [convs, setConvs] = useState<Conv[] | null>(null);

  const loadConvs = useCallback(async () => {
    const { data } = await supabase.rpc("my_conversations");
    setConvs((data ?? []) as Conv[]);
  }, []);
  useEffect(() => { loadConvs(); }, [loadConvs, conversationId]);

  // refresh list when a new message notification arrives
  useEffect(() => {
    const ch = supabase.channel("conv-list")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => loadConvs())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [loadConvs]);

  if (convs === null) return <Spinner />;
  const current = convs.find((c) => c.conversation_id === conversationId);

  return (
    <div className="card grid h-[calc(100dvh-12rem)] min-h-[420px] lg:h-[calc(100dvh-10rem)] overflow-hidden md:grid-cols-[320px_1fr]">
      <aside className={`${conversationId ? "hidden md:flex" : "flex"} flex-col border-r border-plum-100`}>
        <h1 className="border-b border-plum-100 px-4 py-3 text-lg font-bold">Messages</h1>
        {!tier && <p className="bg-gold-50 px-4 py-2 text-xs text-gold-700">Your membership is not active — you can see your conversations but not read or send messages. <Link to="/memberships" className="underline">Renew</Link></p>}
        <ul className="flex-1 overflow-y-auto">
          {convs.length === 0 && <li className="p-6 text-center text-sm text-slate-500">No conversations yet. When you match with someone, you can chat here.</li>}
          {convs.map((c) => (
            <li key={c.conversation_id}>
              <Link to={`/app/messages/${c.conversation_id}`}
                className={`flex items-center gap-3 px-4 py-3 hover:bg-plum-50 ${c.conversation_id === conversationId ? "bg-plum-50" : ""}`}>
                <Avatar path={c.photo} name={c.display_name} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="flex justify-between gap-2 text-sm font-semibold">
                    <span className="truncate">{c.display_name}</span>
                    <span className="shrink-0 text-[11px] font-normal text-slate-400">{timeAgo(c.last_message_at)}</span>
                  </p>
                  <p className={`truncate text-xs ${c.unread ? "font-semibold text-plum-900" : "text-slate-500"}`}>
                    {!c.active ? "Conversation closed" : c.preview ?? (c.last_message_at ? "New message" : "Say hello 👋")}
                  </p>
                </div>
                {c.unread > 0 && <span className="rounded-full bg-rose-accent px-1.5 text-[11px] font-bold text-white">{c.unread}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </aside>
      <section className={`${conversationId ? "flex" : "hidden md:flex"} min-h-0 flex-col`}>
        {conversationId && current ? (
          <Thread key={conversationId} conv={current} onChange={loadConvs} />
        ) : conversationId ? (
          <div className="p-6"><Alert kind="error">Conversation not found.</Alert></div>
        ) : (
          <div className="flex flex-1 items-center justify-center p-6"><EmptyState title="Select a conversation">Choose a match on the left to start chatting.</EmptyState></div>
        )}
      </section>
    </div>
  );
}

function Thread({ conv, onChange }: { conv: Conv; onChange: () => void }) {
  const { user, tier } = useAuth();
  const nav = useNavigate();
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [hasOlder, setHasOlder] = useState(false);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [report, setReport] = useState<string | null | undefined>(undefined);
  const scroller = useRef<HTMLDivElement>(null);
  const stickBottom = useRef(true);
  const cid = conv.conversation_id;

  const markRead = useCallback(() => { supabase.rpc("mark_conversation_read", { p_conv: cid }).then(() => onChange()); }, [cid, onChange]);

  useEffect(() => {
    if (!tier) { setLoading(false); return; }
    (async () => {
      const { data, error } = await supabase.from("messages").select("*").eq("conversation_id", cid)
        .order("created_at", { ascending: false }).limit(PAGE);
      if (error) setErr(friendlyError(error));
      const rows = ((data ?? []) as Message[]).reverse();
      setMsgs(rows);
      setHasOlder(rows.length === PAGE);
      setLoading(false);
      markRead();
    })();
    const ch = supabase.channel(`thread-${cid}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${cid}` }, (payload) => {
        const m = payload.new as Message;
        setMsgs((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
        if (m.sender_id !== user?.id) markRead();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages", filter: `conversation_id=eq.${cid}` }, (payload) => {
        const m = payload.new as Message;
        setMsgs((prev) => prev.map((x) => (x.id === m.id ? { ...x, read_at: m.read_at } : x)));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [cid, tier, user?.id, markRead]);

  useLayoutEffect(() => {
    const el = scroller.current;
    if (el && stickBottom.current) el.scrollTop = el.scrollHeight;
  }, [msgs]);

  async function loadOlder() {
    const el = scroller.current;
    const prevHeight = el?.scrollHeight ?? 0;
    stickBottom.current = false;
    const { data } = await supabase.from("messages").select("*").eq("conversation_id", cid)
      .lt("created_at", msgs[0].created_at).order("created_at", { ascending: false }).limit(PAGE);
    const rows = ((data ?? []) as Message[]).reverse();
    setHasOlder(rows.length === PAGE);
    setMsgs((prev) => [...rows, ...prev]);
    requestAnimationFrame(() => { if (el) el.scrollTop = el.scrollHeight - prevHeight; stickBottom.current = true; });
  }

  async function send(e: FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setSending(true); setErr(null);
    const { data, error } = await supabase.from("messages").insert({ conversation_id: cid, body }).select().single();
    setSending(false);
    if (error) {
      return setErr(error.code === "42501" || error.message.includes("row-level security")
        ? "You can't send messages in this conversation. Your membership may have expired, or the match has ended."
        : friendlyError(error));
    }
    setText("");
    stickBottom.current = true;
    setMsgs((prev) => (prev.some((x) => x.id === (data as Message).id) ? prev : [...prev, data as Message]));
  }

  let lastDay = "";
  return (
    <>
      <header className="flex items-center gap-3 border-b border-plum-100 px-4 py-2.5">
        <button className="md:hidden" onClick={() => nav("/app/messages")} aria-label="Back to conversations">←</button>
        <Link to={`/app/members/${conv.id}`} className="flex min-w-0 flex-1 items-center gap-3">
          <Avatar path={conv.photo} name={conv.display_name} size={38} />
          <div className="min-w-0">
            <p className="truncate font-semibold">{conv.display_name}, {conv.age}</p>
            <p className="text-xs text-slate-500">{conv.online ? "Online now" : conv.district}</p>
          </div>
        </Link>
        <button className="btn-ghost btn-sm" onClick={() => setReport(null)}>Report</button>
        <BlockButton userId={conv.id} name={conv.display_name} className="btn-ghost btn-sm" onDone={() => { onChange(); nav("/app/messages"); }} />
      </header>

      {!tier ? (
        <div className="p-6"><MembershipPrompt /></div>
      ) : (
        <>
          <div ref={scroller} className="flex-1 space-y-1.5 overflow-y-auto bg-plum-50/40 px-4 py-4" aria-live="polite">
            {hasOlder && <div className="pb-2 text-center"><button className="btn-outline btn-sm" onClick={loadOlder}>Load earlier messages</button></div>}
            {loading && <Spinner />}
            {!loading && msgs.length === 0 && (
              <p className="py-10 text-center text-sm text-slate-500">You matched with {conv.display_name}! Start with something from their profile. Keep it kind, and never send money.</p>
            )}
            {msgs.map((m) => {
              const mine = m.sender_id === user?.id;
              const day = fmtDate(m.created_at);
              const showDay = day !== lastDay;
              lastDay = day;
              return (
                <div key={m.id}>
                  {showDay && <p className="my-3 text-center text-[11px] font-semibold text-slate-400">{day}</p>}
                  <div className={`group flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${mine ? "rounded-br-sm bg-plum-800 text-white" : "rounded-bl-sm bg-white text-slate-800"}`}>
                      <p className="whitespace-pre-wrap break-words">{m.body}</p>
                      <p className={`mt-0.5 flex items-center justify-end gap-1 text-[10px] ${mine ? "text-plum-200" : "text-slate-400"}`}>
                        {fmtTime(m.created_at)}
                        {mine && <span title={m.read_at ? "Read" : "Sent"}>{m.read_at ? "✓✓ Read" : "✓"}</span>}
                      </p>
                    </div>
                    {!mine && (
                      <button className="ml-1 self-center text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 focus:opacity-100" onClick={() => setReport(m.id)}>Report</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {err && <div className="px-4 pt-2"><Alert kind="error">{err}</Alert></div>}
          {conv.active ? (
            <form onSubmit={send} className="flex items-end gap-2 border-t border-plum-100 p-3">
              <label htmlFor="msg-input" className="sr-only">Message</label>
              <textarea id="msg-input" rows={1} maxLength={2000} className="input max-h-32 min-h-11 resize-none" placeholder="Write a message…"
                value={text} onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(e as unknown as FormEvent); } }} />
              <button className="btn-primary" disabled={sending || !text.trim()}>Send</button>
            </form>
          ) : (
            <p className="border-t border-plum-100 p-4 text-center text-sm text-slate-500">This conversation is closed.</p>
          )}
        </>
      )}
      <ReportDialog open={report !== undefined} onClose={() => setReport(undefined)} userId={conv.id} name={conv.display_name} messageId={report ?? undefined} />
    </>
  );
}
