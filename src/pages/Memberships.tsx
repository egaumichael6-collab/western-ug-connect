import { Link } from "react-router-dom";
import { usePageMeta } from "../lib/usePageMeta";
import { usePackages } from "../lib/usePackages";
import { useAuth } from "../context/AuthContext";
import { PAYMENT_NUMBER_DISPLAY, ugx } from "../lib/config";
import { Alert, Spinner } from "../components/ui";

export default function Memberships() {
  usePageMeta("Membership packages", "Bronze 14 days UGX 10,000 · Bronze 30 days UGX 15,000 · Diamond 30 days UGX 25,000. Pay by MTN or Airtel Mobile Money.");
  const { packages, error } = usePackages();
  const { user, tier } = useAuth();

  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold tracking-[0.25em] text-gold-600">MEMBERSHIPS</p>
        <h1 className="mt-2 text-4xl font-bold">Choose your journey</h1>
        <p className="mt-3 text-slate-600">Simple, one-off mobile money payments. No automatic renewals. Your membership starts the moment we verify your payment.</p>
        {tier && <p className="mt-3"><span className="chip">You currently have an active {tier} membership — <Link to="/app/subscription" className="ml-1 underline">view details</Link></span></p>}
      </div>

      {error && <div className="mt-6"><Alert kind="error">{error}</Alert></div>}
      {!packages ? <Spinner /> : (
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {packages.map((p) => {
            const diamond = p.tier === "diamond";
            const featured = p.code === "bronze_30";
            return (
              <article key={p.code} className={`relative flex flex-col rounded-3xl p-7 shadow-sm ${diamond ? "bg-gradient-to-br from-plum-950 to-plum-800 text-white" : "border border-plum-100 bg-white"} ${featured ? "ring-2 ring-gold-400" : ""}`}>
                {featured && <span className="absolute -top-3 left-7 rounded-full bg-gold-400 px-3 py-1 text-xs font-bold text-plum-950">BEST VALUE</span>}
                <p className={`text-xs font-bold tracking-[0.25em] ${diamond ? "text-gold-300" : "text-gold-600"}`}>{diamond ? "◆ DIAMOND" : "BRONZE"}</p>
                <h2 className={`mt-2 text-xl font-bold ${diamond ? "text-white" : ""}`}>{p.name}</h2>
                <p className="mt-4">
                  <span className={`font-display text-4xl font-bold ${diamond ? "text-gold-300" : "text-plum-900"}`}>{ugx(p.price_ugx)}</span>
                </p>
                <p className={`text-sm ${diamond ? "text-plum-200" : "text-slate-500"}`}>Valid {p.duration_days} days from confirmed activation</p>
                {p.audience && <p className={`mt-4 text-sm ${diamond ? "text-plum-100" : "text-slate-600"}`}>{p.audience}</p>}
                <ul className="mt-5 flex-1 space-y-2 text-sm">
                  {p.benefits.map((b) => (
                    <li key={b} className="flex gap-2"><span className={diamond ? "text-gold-300" : "text-emerald-600"} aria-hidden>✓</span>{b}</li>
                  ))}
                  {diamond && <li className="flex gap-2"><span className="text-gold-300" aria-hidden>✓</span>Also includes all Bronze features</li>}
                </ul>
                {p.is_active ? (
                  <Link to={user ? `/app/checkout/${p.code}` : `/register`} className={`${diamond ? "btn-gold" : "btn-primary"} mt-7 w-full py-3`}>
                    {user ? "Choose this package" : "Join free to continue"}
                  </Link>
                ) : (
                  <p className="mt-7 rounded-full bg-slate-100 py-3 text-center text-sm font-semibold text-slate-500">Temporarily unavailable</p>
                )}
              </article>
            );
          })}
        </div>
      )}

      <div className="mx-auto mt-12 max-w-3xl card p-6">
        <h2 className="text-xl font-bold">How to pay</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-700">
          <li>Choose a package above (you need a free account first).</li>
          <li>Send the exact amount by MTN or Airtel Mobile Money to <strong className="text-plum-900">{PAYMENT_NUMBER_DISPLAY}</strong>.</li>
          <li>Type the transaction ID from your confirmation SMS into the box on the same page.</li>
          <li>Our admin checks it and activates your membership — usually within minutes. You'll get a notification.</li>
        </ol>
        <p className="mt-4 rounded-xl bg-gold-50 p-3 text-xs text-gold-700">We will never ask for your mobile money PIN, password or SMS codes. Pay only to {PAYMENT_NUMBER_DISPLAY}.</p>
        <p className="mt-3 text-xs text-slate-500">Diamond is a separate category for consenting adults seeking mutually agreed sugar-dating relationships. Offering or requesting sex for money is prohibited. See our <Link to="/terms" className="underline">Terms</Link>.</p>
      </div>
    </div>
  );
}
