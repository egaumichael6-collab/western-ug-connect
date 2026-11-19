import type { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Spinner } from "./ui";

/** Logged-in members only. Sends new members to finish their profile first. */
export function RequireAuth() {
  const { loading, user, profile } = useAuth();
  const loc = useLocation();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname)}`} replace />;
  const allowedBeforeProfile = ["/app/profile/edit", "/app/settings", "/app/notifications", "/app/subscription", "/app/payments", "/app/checkout", "/app/pay"];
  if (profile && !profile.profile_completed && !allowedBeforeProfile.some((p) => loc.pathname.startsWith(p))) {
    return <Navigate to="/app/profile/edit?welcome=1" replace />;
  }
  return <div className="container-page py-8"><Outlet /></div>;
}

/** Staff only. The server re-checks the role on every admin function call. */
export function RequireStaff({ children }: { children?: ReactNode }) {
  const { loading, user, role } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/admin/login" replace />;
  if (!role) return <Navigate to="/" replace />;
  return <>{children ?? <Outlet />}</>;
}

export function GuestOnly({ children }: { children: ReactNode }) {
  const { loading, user } = useAuth();
  if (loading) return <Spinner />;
  if (user) return <Navigate to="/app/discover" replace />;
  return <>{children}</>;
}
