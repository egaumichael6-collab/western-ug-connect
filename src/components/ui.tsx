import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { signedPhotoUrl } from "../lib/supabase";

export function Spinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-plum-700" role="status" aria-live="polite">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-plum-200 border-t-plum-700" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function Alert({ kind = "info", children }: { kind?: "info" | "error" | "success" | "warn"; children: ReactNode }) {
  const styles = {
    info: "border-plum-200 bg-plum-50 text-plum-900",
    error: "border-red-200 bg-red-50 text-red-800",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    warn: "border-gold-300 bg-gold-50 text-gold-700",
  }[kind];
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${styles}`} role={kind === "error" ? "alert" : "status"}>
      {children}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-3 text-4xl" aria-hidden>💜</div>
      <h2 className="text-lg font-bold">{title}</h2>
      {children && <p className="mt-1 max-w-md text-sm text-slate-600">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function MembershipPrompt({ diamond = false, count }: { diamond?: boolean; count?: number | null }) {
  return (
    <div className="card overflow-hidden">
      <div className="bg-gradient-to-br from-plum-900 to-plum-700 px-6 py-10 text-center text-white">
        <p className="text-xs font-semibold tracking-[0.25em] text-gold-300">{diamond ? "DIAMOND MEMBERS" : "MEMBERS ONLY"}</p>
        <h2 className="mt-2 text-2xl font-bold text-white">
          {diamond ? "Diamond profiles need a Diamond membership" : "Activate a membership to start connecting"}
        </h2>
        {typeof count === "number" && (
          <p className="mt-2 text-plum-100">
            {count === 0
              ? "No members match these filters yet — the community is growing every day."
              : `${count} real member${count === 1 ? "" : "s"} currently match${count === 1 ? "es" : ""} these filters.`}
          </p>
        )}
        <Link to="/memberships" className="btn-gold mt-6">Explore Memberships</Link>
      </div>
    </div>
  );
}

export function Avatar({ path, name, size = 56, rounded = "rounded-full" }: { path?: string | null; name: string; size?: number; rounded?: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    signedPhotoUrl(path).then((u) => live && setSrc(u));
    return () => { live = false; };
  }, [path]);
  const initials = name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();
  return src ? (
    <img src={src} alt={`Photo of ${name}`} width={size} height={size} loading="lazy"
      className={`${rounded} shrink-0 object-cover`} style={{ width: size, height: size }} />
  ) : (
    <div className={`${rounded} flex shrink-0 items-center justify-center bg-gradient-to-br from-plum-200 to-gold-100 font-bold text-plum-800`}
      style={{ width: size, height: size, fontSize: size / 2.8 }} aria-label={name}>
      {initials}
    </div>
  );
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-plum-950/50 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="rounded-full p-1 text-slate-500 hover:bg-slate-100" aria-label="Close">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-gold-100 text-gold-700",
    approved: "bg-emerald-100 text-emerald-800",
    active: "bg-emerald-100 text-emerald-800",
    scheduled: "bg-sky-100 text-sky-800",
    rejected: "bg-red-100 text-red-800",
    revoked: "bg-red-100 text-red-800",
    refunded: "bg-slate-200 text-slate-700",
    expired: "bg-slate-200 text-slate-700",
    open: "bg-red-100 text-red-800",
    reviewing: "bg-gold-100 text-gold-700",
    resolved: "bg-emerald-100 text-emerald-800",
    dismissed: "bg-slate-200 text-slate-700",
  };
  const label = status === "pending" ? "Pending verification" : status.charAt(0).toUpperCase() + status.slice(1);
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${map[status] ?? "bg-slate-100"}`}>{label}</span>;
}
