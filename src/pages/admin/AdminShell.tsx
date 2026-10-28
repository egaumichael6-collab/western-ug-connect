import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "../../lib/supabase";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { usePageMeta } from "../../lib/usePageMeta";

export default function AdminShell({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  usePageMeta(`Admin · ${title}`, undefined, { noindex: true });
  const { role } = useAuth();
  const [pending, setPending] = useState(0);
  useEffect(() => {
    if (role !== "admin") return;
    const count = () => supabase.from("payment_submissions").select("id", { count: "exact", head: true }).eq("status", "pending")
      .then(({ count: c }) => setPending(c ?? 0));
    count();
    const ch = supabase.channel("admin-pending-badge")
      .on("postgres_changes", { event: "*", schema: "public", table: "payment_submissions" }, () => count())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [role]);
  const links = [
    { to: "/admin", label: "Overview", end: true, admin: false },
    { to: "/admin/payments", label: "Payment verification", admin: true },
    { to: "/admin/members", label: "Members & reports", admin: false },
    { to: "/admin/memberships", label: "Memberships", admin: true },
  ].filter((l) => !l.admin || role === "admin");
  return (
    <div className="container-page py-8">
      <div className="-mx-4 mb-6 flex items-center gap-2 overflow-x-auto border-b border-plum-100 px-4 pb-3 sm:mx-0 sm:px-0">
        <span className="mr-2 shrink-0 rounded-full bg-plum-900 px-3 py-1 text-xs font-bold tracking-wider text-gold-300">{role?.toUpperCase()}</span>
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end}
            className={({ isActive }) => `shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium ${isActive ? "bg-plum-800 text-white" : "text-plum-800 hover:bg-plum-100"}`}>
            {l.label}
            {l.to === "/admin/payments" && pending > 0 && <span className="ml-1.5 rounded-full bg-rose-accent px-1.5 text-xs font-bold text-white">{pending}</span>}
          </NavLink>
        ))}
      </div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {action}
      </div>
      {children}
    </div>
  );
}
