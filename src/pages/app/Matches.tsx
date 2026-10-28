import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase, friendlyError } from "../../lib/supabase";
import { usePageMeta } from "../../lib/usePageMeta";
import type { MemberCard } from "../../lib/types";
import ProfileCard from "../../components/ProfileCard";
import { Alert, EmptyState, PageHeader, Spinner } from "../../components/ui";
import { fmtDate } from "../../lib/format";

type MatchRow = MemberCard & { match_id: string; matched_at: string; conversation_id: string | null; unread: number };

export default function Matches() {
  usePageMeta("My matches", undefined, { noindex: true });
  const [items, setItems] = useState<MatchRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    supabase.rpc("my_matches").then(({ data, error }) => {
      if (error) setErr(friendlyError(error));
      setItems((data ?? []) as MatchRow[]);
    });
  }, []);

  return (
    <div>
      <PageHeader title="My matches" subtitle="Mutual connections — you both said yes." />
      {err && <Alert kind="error">{err}</Alert>}
      {items === null ? <Spinner /> : items.length === 0 ? (
        <EmptyState title="No matches yet" action={<Link to="/app/recommendations" className="btn-primary">See recommendations</Link>}>
          Like profiles or send connection requests. When someone likes you back, you'll match here.
        </EmptyState>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {items.map((m) => (
            <ProfileCard key={m.match_id} m={m} footer={
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-500">Matched {fmtDate(m.matched_at)}</span>
                {m.conversation_id && (
                  <Link to={`/app/messages/${m.conversation_id}`} className="btn-primary btn-sm">
                    Chat{m.unread > 0 && <span className="rounded-full bg-gold-400 px-1.5 text-plum-950">{m.unread}</span>}
                  </Link>
                )}
              </div>
            } />
          ))}
        </div>
      )}
    </div>
  );
}
