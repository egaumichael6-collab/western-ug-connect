import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { Profile } from "../lib/types";
import type { Tier } from "../lib/config";

interface AuthState {
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  tier: Tier | null; // highest active membership tier, from the server
  role: "admin" | "moderator" | null;
  unread: number;
  refreshProfile: () => Promise<void>;
  refreshTier: () => Promise<void>;
  refreshUnread: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tier, setTier] = useState<Tier | null>(null);
  const [role, setRole] = useState<"admin" | "moderator" | null>(null);
  const [unread, setUnread] = useState(0);
  const userId = session?.user.id ?? null;

  const refreshProfile = useCallback(async () => {
    if (!userId) return setProfile(null);
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    setProfile((data as Profile) ?? null);
  }, [userId]);

  const refreshTier = useCallback(async () => {
    if (!userId) return setTier(null);
    const { data } = await supabase.rpc("my_tier");
    setTier((data as Tier | null) ?? null);
  }, [userId]);

  const refreshUnread = useCallback(async () => {
    if (!userId) return setUnread(0);
    const { count } = await supabase
      .from("notifications").select("id", { count: "exact", head: true })
      .eq("user_id", userId).is("read_at", null);
    setUnread(count ?? 0);
  }, [userId]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) {
      setProfile(null); setTier(null); setRole(null); setUnread(0);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const [{ data: p }, { data: t }, { data: r }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase.rpc("my_tier"),
        supabase.from("admin_roles").select("role").eq("user_id", userId).maybeSingle(),
      ]);
      if (cancelled) return;
      setProfile((p as Profile) ?? null);
      setTier((t as Tier | null) ?? null);
      setRole((r?.role as "admin" | "moderator") ?? null);
      setLoading(false);
    })();
    refreshUnread();
    supabase.rpc("touch_presence");
    const presence = window.setInterval(() => supabase.rpc("touch_presence"), 120_000);

    // live notification badge
    const channel = supabase
      .channel(`notif-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => { refreshUnread(); refreshTier(); })
      .subscribe();
    return () => {
      cancelled = true;
      window.clearInterval(presence);
      supabase.removeChannel(channel);
    };
  }, [userId, refreshUnread, refreshTier]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
  }, []);

  const value = useMemo<AuthState>(() => ({
    loading, session, user: session?.user ?? null, profile, tier, role, unread,
    refreshProfile, refreshTier, refreshUnread, signOut,
  }), [loading, session, profile, tier, role, unread, refreshProfile, refreshTier, refreshUnread, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
