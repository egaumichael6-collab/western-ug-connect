import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { supabase, friendlyError, isMembershipError } from "../../lib/supabase";
import { usePageMeta } from "../../lib/usePageMeta";
import { useAuth } from "../../context/AuthContext";
import { GENDERS, GOALS, ALL_DISTRICTS, type Gender } from "../../lib/config";
import type { MemberCard } from "../../lib/types";
import ProfileCard from "../../components/ProfileCard";
import { Alert, EmptyState, MembershipPrompt, PageHeader, Spinner } from "../../components/ui";

const PAGE = 24;

export default function Discover() {
  usePageMeta("Discover members", undefined, { noindex: true });
  const { tier, profile } = useAuth();
  const [mode, setMode] = useState<"standard" | "diamond">(profile?.relationship_goal === "sugar_dating" && tier === "diamond" ? "diamond" : "standard");
  const [filters, setFilters] = useState({ gender: "" as Gender | "", min: 18, max: 70, district: "", goal: "", interest: "" });
  const [applied, setApplied] = useState(filters);
  const [items, setItems] = useState<MemberCard[]>([]);
  const [offset, setOffset] = useState(0);
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [locked, setLocked] = useState<{ count: number | null } | null>(null);

  const load = useCallback(async (reset: boolean) => {
    setLoading(true);
    setErr(null);
    const off = reset ? 0 : offset;
    const { data, error } = await supabase.rpc("discover_members", {
      p_mode: mode, p_gender: applied.gender || null, p_min_age: applied.min, p_max_age: applied.max,
      p_district: applied.district || null, p_goal: (mode === "standard" && applied.goal) || null,
      p_interest: applied.interest || null, p_limit: PAGE, p_offset: off,
    });
    if (error) {
      if (isMembershipError(error)) {
        const { data: count } = await supabase.rpc("count_matching_members", {
          p_mode: mode, p_gender: applied.gender || null, p_district: applied.district || null,
        });
        setLocked({ count: typeof count === "number" ? count : null });
      } else setErr(friendlyError(error));
      setItems([]);
      setLoading(false);
      return;
    }
    setLocked(null);
    const rows = (data ?? []) as MemberCard[];
    setItems((prev) => (reset ? rows : [...prev, ...rows]));
    setOffset(off + rows.length);
    setMore(rows.length === PAGE);
    setLoading(false);
  }, [mode, applied, offset]);

  useEffect(() => { load(true); }, [mode, applied, tier]);

  const submit = (e: FormEvent) => { e.preventDefault(); setApplied({ ...filters }); };

  return (
    <div>
      <PageHeader title="Discover members" subtitle="Real members only — browse, filter and open a profile to connect."
        action={<Link to="/app/recommendations" className="btn-outline">See recommendations</Link>} />

      <div className="mb-4 inline-flex rounded-full border border-plum-200 bg-white p-1" role="tablist" aria-label="Category">
        <button role="tab" aria-selected={mode === "standard"} onClick={() => setMode("standard")}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold ${mode === "standard" ? "bg-plum-800 text-white" : "text-plum-800"}`}>Relationships</button>
        <button role="tab" aria-selected={mode === "diamond"} onClick={() => setMode("diamond")}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold ${mode === "diamond" ? "bg-plum-950 text-gold-300" : "text-plum-800"}`}>◆ Diamond</button>
      </div>

      <form onSubmit={submit} className="card mb-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6">
        <div><label className="label" htmlFor="f-g">Show</label>
          <select id="f-g" className="input" value={filters.gender} onChange={(e) => setFilters({ ...filters, gender: e.target.value as Gender | "" })}>
            <option value="">Everyone</option>{GENDERS.map((g) => <option key={g.value} value={g.value}>{g.label}s</option>)}
          </select></div>
        <div className="grid grid-cols-2 gap-2">
          <div><label className="label" htmlFor="f-min">Age from</label>
            <input id="f-min" type="number" min={18} max={99} className="input" value={filters.min} onChange={(e) => setFilters({ ...filters, min: Number(e.target.value) || 18 })} /></div>
          <div><label className="label" htmlFor="f-max">to</label>
            <input id="f-max" type="number" min={18} max={99} className="input" value={filters.max} onChange={(e) => setFilters({ ...filters, max: Number(e.target.value) || 99 })} /></div>
        </div>
        <div><label className="label" htmlFor="f-d">District</label>
          <select id="f-d" className="input" value={filters.district} onChange={(e) => setFilters({ ...filters, district: e.target.value })}>
            <option value="">All districts</option>{ALL_DISTRICTS.map((d) => <option key={d}>{d}</option>)}
          </select></div>
        {mode === "standard" && (
          <div><label className="label" htmlFor="f-goal">Looking for</label>
            <select id="f-goal" className="input" value={filters.goal} onChange={(e) => setFilters({ ...filters, goal: e.target.value })}>
              <option value="">Any goal</option>{GOALS.filter((g) => g.value !== "sugar_dating").map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select></div>
        )}
        <div><label className="label" htmlFor="f-i">Interest</label>
          <input id="f-i" className="input" placeholder="e.g. Music" value={filters.interest} onChange={(e) => setFilters({ ...filters, interest: e.target.value })} /></div>
        <div className="flex items-end"><button className="btn-primary w-full">Search</button></div>
      </form>

      {err && <Alert kind="error">{err}</Alert>}
      {locked ? (
        <MembershipPrompt diamond={mode === "diamond"} count={locked.count} />
      ) : loading && items.length === 0 ? (
        <Spinner label="Finding members…" />
      ) : items.length === 0 ? (
        <EmptyState title="No members match these filters yet">Try widening the age range or choosing "All districts". New members join every day.</EmptyState>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {items.map((m) => <ProfileCard key={m.id} m={m} />)}
          </div>
          {more && (
            <div className="mt-8 text-center">
              <button className="btn-outline" disabled={loading} onClick={() => load(false)}>{loading ? "Loading…" : "Load more"}</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
