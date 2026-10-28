import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase, friendlyError, isMembershipError } from "../../lib/supabase";
import { usePageMeta } from "../../lib/usePageMeta";
import { useAuth } from "../../context/AuthContext";
import type { MemberCard } from "../../lib/types";
import ProfileCard from "../../components/ProfileCard";
import { Alert, EmptyState, MembershipPrompt, PageHeader, Spinner } from "../../components/ui";

export default function Recommendations() {
  usePageMeta("Recommended for you", undefined, { noindex: true });
  const { tier } = useAuth();
  const [items, setItems] = useState<MemberCard[] | null>(null);
  const [locked, setLocked] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    supabase.rpc("recommended_members", { p_limit: 24 }).then(({ data, error }) => {
      if (error) {
        if (isMembershipError(error)) setLocked(true);
        else setErr(friendlyError(error));
        setItems([]);
      } else setItems((data ?? []) as MemberCard[]);
    });
  }, [tier]);

  return (
    <div>
      <PageHeader title="Recommended for you"
        subtitle="Suggestions are based only on what you and other members have stated: age preferences, location, relationship goals and shared interests. We list the reasons for each one — no hidden 'compatibility scores'."
        action={<Link to="/app/profile/edit" className="btn-outline">Update preferences</Link>} />
      {err && <Alert kind="error">{err}</Alert>}
      {locked ? <MembershipPrompt /> : items === null ? <Spinner label="Finding compatible members…" /> : items.length === 0 ? (
        <EmptyState title="No strong matches yet" action={<Link to="/app/discover" className="btn-primary">Browse all members</Link>}>
          We only recommend members who fit your preferences and theirs. Try widening your age range or preferred districts.
        </EmptyState>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {items.map((m) => <ProfileCard key={m.id} m={m} />)}
        </div>
      )}
    </div>
  );
}
