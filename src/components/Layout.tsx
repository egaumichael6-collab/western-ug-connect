import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Logo } from "./Logo";
import { PAYMENT_NUMBER_DISPLAY, WHATSAPP_DISPLAY, whatsappLink } from "../lib/config";
import seo from "../data/seo-pages.json";

const TOWNS = seo.towns;

const publicLinks = [
  { to: "/about", label: "About" },
  { to: "/memberships", label: "Memberships" },
  { to: "/safety", label: "Safety" },
  { to: "/faq", label: "FAQ" },
];
const appLinks = [
  { to: "/app/discover", label: "Discover" },
  { to: "/app/recommendations", label: "For You" },
  { to: "/app/likes", label: "Likes" },
  { to: "/app/matches", label: "Matches" },
  { to: "/app/messages", label: "Messages" },
];

function Navbar() {
  const { user, profile, tier, role, unread, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const nav = useNavigate();
  useEffect(() => setOpen(false), [loc.pathname]);
  const links = user ? appLinks : publicLinks;
  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `rounded-full px-3 py-2 text-sm font-medium transition ${isActive ? "bg-plum-100 text-plum-900" : "text-slate-700 hover:text-plum-800"}`;

  return (
    <header className="sticky top-0 z-40 border-b border-plum-100 bg-white/90 backdrop-blur">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:rounded focus:bg-white focus:px-3 focus:py-2">
        Skip to content
      </a>
      <div className="container-page flex h-16 items-center justify-between gap-3">
        <Link to={user ? "/app/discover" : "/"} aria-label="WESTERN UG CONNECT home"><Logo /></Link>
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {links.map((l) => <NavLink key={l.to} to={l.to} className={linkCls}>{l.label}</NavLink>)}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link to="/app/notifications" className="relative rounded-full p-2 text-plum-800 hover:bg-plum-100" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                {unread > 0 && <span className="absolute -right-0.5 -top-0.5 min-w-5 rounded-full bg-rose-accent px-1 text-center text-[10px] font-bold leading-5 text-white">{unread > 99 ? "99+" : unread}</span>}
              </Link>
              <div className="relative hidden sm:block">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-plum-100 py-1 pl-3 pr-2 text-sm font-medium text-plum-900 hover:bg-plum-50">
                    {profile?.display_name ?? "Account"}
                    {tier && <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${tier === "diamond" ? "bg-plum-900 text-gold-300" : tier === "campus" ? "bg-fuchsia-100 text-fuchsia-800" : "bg-gold-100 text-gold-700"}`}>{tier === "diamond" ? "Diamond" : tier === "campus" ? "Uni Babes" : "Member"}</span>}
                  </summary>
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-plum-100 bg-white p-1.5 shadow-lg">
                    {[["/app/profile/edit", "Edit profile"], ["/app/subscription", "My subscription"], ["/app/payments", "Payment history"],
                      ["/app/settings", "Settings"], ["/memberships", "Memberships"], ["/safety", "Safety Centre"]].map(([to, l]) => (
                      <Link key={to} to={to} className="block rounded-lg px-3 py-2 text-sm hover:bg-plum-50">{l}</Link>
                    ))}
                    {role && <Link to="/admin" className="block rounded-lg px-3 py-2 text-sm font-semibold text-plum-800 hover:bg-plum-50">Admin dashboard</Link>}
                    <button onClick={async () => { await signOut(); nav("/"); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50">Log out</button>
                  </div>
                </details>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost hidden sm:inline-flex">Log in</Link>
              <Link to="/register" className="btn-primary">Join Now</Link>
            </>
          )}
          <button className="rounded-full p-2 text-plum-900 hover:bg-plum-100 lg:hidden" onClick={() => setOpen(!open)}
            aria-expanded={open} aria-controls="mobile-menu" aria-label="Menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-menu" className="border-t border-plum-100 bg-white lg:hidden" aria-label="Mobile">
          <div className="container-page grid gap-1 py-3">
            {!user && links.map((l) => <NavLink key={l.to} to={l.to} className={linkCls}>{l.label}</NavLink>)}
            {user ? (
              <>
                {[["/app/profile/edit", "Edit profile"], ["/app/subscription", "My subscription"], ["/app/payments", "Payment history"],
                  ["/app/settings", "Settings"], ["/memberships", "Memberships"], ["/safety", "Safety Centre"]].map(([to, l]) => (
                  <NavLink key={to} to={to} className={linkCls}>{l}</NavLink>
                ))}
                {role && <NavLink to="/admin" className={linkCls}>Admin dashboard</NavLink>}
                <button onClick={async () => { await signOut(); nav("/"); }} className="rounded-full px-3 py-2 text-left text-sm font-medium text-red-700">Log out</button>
              </>
            ) : (
              <NavLink to="/login" className={linkCls}>Log in</NavLink>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-20 bg-plum-950 text-plum-100">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo stacked />
          <p className="mt-4 text-sm text-plum-200">Your Journey to True Love Starts Here. A respectful dating community for single adults (18+) in Western Uganda and across Uganda.</p>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold tracking-wider text-gold-300">EXPLORE</h2>
          <ul className="space-y-2 text-sm">
            {[["/about", "About us"], ["/memberships", "Memberships"], ["/dating-in-uganda", "Dating in Uganda"], ["/sugar-mummy-uganda", "Find a sugar mummy"], ["/sugar-daddy-uganda", "Find a sugar daddy"], ["/faq", "FAQ"], ["/contact", "Contact us"]].map(([to, l]) => (
              <li key={to}><Link to={to} className="hover:text-white">{l}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold tracking-wider text-gold-300">TRUST &amp; SAFETY</h2>
          <ul className="space-y-2 text-sm">
            {[["/safety", "Safety Centre"], ["/guidelines", "Community guidelines"], ["/privacy", "Privacy policy"], ["/terms", "Terms & conditions"]].map(([to, l]) => (
              <li key={to}><Link to={to} className="hover:text-white">{l}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold tracking-wider text-gold-300">MEMBERSHIP PAYMENTS</h2>
          <p className="text-sm">Official mobile money number:</p>
          <p className="mt-1 font-display text-xl font-bold text-gold-300">{PAYMENT_NUMBER_DISPLAY}</p>
          <p className="mt-2 text-xs text-plum-300">We will never ask for your PIN, password or verification codes. Only pay to this number.</p>
          <p className="mt-4 text-sm">Need help? <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="font-semibold text-gold-300 underline">WhatsApp {WHATSAPP_DISPLAY}</a></p>
        </div>
      </div>
      <div className="border-t border-plum-900">
        <nav aria-label="Dating by town" className="container-page py-6">
          <h2 className="mb-3 text-sm font-semibold tracking-wider text-gold-300">DATING ACROSS UGANDA</h2>
          <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            {TOWNS.map((t) => (
              <li key={t.slug}><Link to={`/dating/${t.slug}`} className="hover:text-white">Dating in {t.name}</Link></li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-plum-900">
        <p className="container-page py-5 text-xs text-plum-300">© {new Date().getFullYear()} WESTERN UG CONNECT. Adults 18+ only.</p>
      </div>
    </footer>
  );
}

const icons: Record<string, string> = {
  "/app/discover": "M21 21l-4.3-4.3M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14z",
  "/app/recommendations": "M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z",
  "/app/likes": "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z",
  "/app/matches": "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8",
  "/app/messages": "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
};

/** Thumb-reachable navigation for signed-in members on phones */
function BottomNav() {
  return (
    <nav aria-label="Member" className="fixed inset-x-0 bottom-0 z-40 border-t border-plum-100 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <ul className="grid grid-cols-5">
        {appLinks.map((l) => (
          <li key={l.to}>
            <NavLink to={l.to} className={({ isActive }) => `flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${isActive ? "text-plum-800" : "text-slate-500"}`}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={icons[l.to]} /></svg>
              {l.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function Layout() {
  const { profile, user } = useAuth();
  return (
    <div className={`flex min-h-screen flex-col ${user ? "pb-16 lg:pb-0" : ""}`}>
      <Navbar />
      {profile?.is_suspended && (
        <div className="bg-red-700 px-4 py-2 text-center text-sm text-white">
          Your account is suspended{profile.suspended_reason ? `: ${profile.suspended_reason}` : ""}. <Link to="/contact" className="underline">Contact us</Link>
        </div>
      )}
      <main id="main" className="flex-1"><Outlet /></main>
      <Footer />
      {user && <BottomNav />}
      <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" aria-label={`Chat with us on WhatsApp ${WHATSAPP_DISPLAY}`}
        className={`fixed right-4 z-50 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-semibold text-white shadow-lg hover:brightness-95 ${user ? "bottom-20 lg:bottom-6" : "bottom-6"}`}>
        <svg width="22" height="22" viewBox="0 0 32 32" fill="currentColor" aria-hidden><path d="M16 3C9 3 3.3 8.6 3.3 15.6c0 2.4.7 4.7 1.9 6.7L3 29l6.9-2.2c1.9 1 4 1.6 6.1 1.6 7 0 12.7-5.6 12.7-12.6S23 3 16 3zm0 23c-1.9 0-3.8-.5-5.4-1.5l-.4-.2-4.1 1.3 1.3-4-.3-.4c-1.1-1.7-1.7-3.6-1.7-5.6C5.4 9.8 10.1 5.2 16 5.2s10.6 4.6 10.6 10.4S21.9 26 16 26zm5.8-7.8c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.2-1.3-.5-2.5-1.6-.9-.8-1.6-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.5-.6c.2-.2.2-.4.3-.6.1-.2 0-.4 0-.6l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.2-1.2 2.9s1.2 3.3 1.4 3.6c.2.2 2.4 3.7 5.8 5.1.8.4 1.5.6 2 .7.8.3 1.6.2 2.2.1.7-.1 1.9-.8 2.2-1.5.3-.8.3-1.4.2-1.5-.1-.2-.3-.3-.6-.4z"/></svg>
        <span className="hidden sm:inline">Help on WhatsApp</span>
      </a>
    </div>
  );
}
