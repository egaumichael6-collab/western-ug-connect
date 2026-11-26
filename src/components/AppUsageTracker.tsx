import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { clearPendingInstall, hasPendingInstall, isStandalone, simplePlatform } from "../lib/pwa";

/**
 * Tells the admin dashboard which signed-in members have the app:
 * when they install it, and each time they open it from their home screen.
 */
export default function AppUsageTracker() {
  const { user } = useAuth();
  const uid = user?.id;
  useEffect(() => {
    if (!uid) return;
    const platform = simplePlatform();
    if (hasPendingInstall()) {
      supabase.rpc("record_app_use", { p_event: "installed", p_platform: platform }).then(({ error }) => { if (!error) clearPendingInstall(); });
    }
    if (isStandalone()) {
      const key = `wugc_app_open_${uid}`;
      let seen = false;
      try { seen = sessionStorage.getItem(key) === "1"; } catch { /* ignore */ }
      if (!seen) {
        supabase.rpc("record_app_use", { p_event: "opened", p_platform: platform }).then(({ error }) => {
          if (!error) { try { sessionStorage.setItem(key, "1"); } catch { /* ignore */ } }
        });
      }
    }
  }, [uid]);
  return null;
}
