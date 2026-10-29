import { Link, useParams } from "react-router-dom";
import { usePageMeta } from "../lib/usePageMeta";
import { PAYMENT_NUMBER_DISPLAY } from "../lib/config";
import seo from "../data/seo-pages.json";
import { NotFound } from "./ErrorPages";

export type Town = (typeof seo.towns)[number];
export const TOWNS: Town[] = seo.towns;
export const townTitle = (t: Town) => `Dating in ${t.name} — Meet Singles in ${t.name}, Uganda`;
export const townDescription = (t: Town) =>
  `Meet genuine single men and women in ${t.name} (${t.region}) on WESTERN UG CONNECT. Free to join, adults 18+, pay by MTN or Airtel Mobile Money.`;

function TownLinks({ exclude }: { exclude?: string }) {
  return (
    <ul className="mt-4 flex flex-wrap gap-2">
      {TOWNS.filter((t) => t.slug !== exclude).map((t) => (
        <li key={t.slug}>
          <Link to={`/dating/${t.slug}`} className="inline-block rounded-full border border-plum-200 bg-white px-4 py-2 text-sm font-medium text-plum-900 hover:bg-plum-50">
            Dating in {t.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function JoinBox({ place }: { place: string }) {
  return (
    <div className="mt-10 rounded-2xl bg-gradient-to-br from-plum-950 to-plum-800 p-8 text-white">
      <h2 className="text-2xl font-bold text-white">Ready to meet someone in {place}?</h2>
      <p className="mt-2 text-plum-100">
        Joining is free. Memberships start at UGX 10,000 for 14 days, paid by MTN or Airtel Mobile Money to {PAYMENT_NUMBER_DISPLAY}.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link to="/register" className="btn-gold">Join free</Link>
        <Link to="/memberships" className="btn-outline border-white text-white hover:bg-white/10">See memberships</Link>
      </div>
    </div>
  );
}

export function DatingHub() {
  const h = seo.hub;
  usePageMeta(h.title, h.description);
  return (
    <div className="container-page max-w-3xl py-12">
      <p className="text-xs font-semibold tracking-[0.25em] text-gold-600">UGANDA DATING SITE</p>
      <h1 className="mt-2 text-4xl font-bold">{h.h1}</h1>
      <div className="prose-legal mt-6">
        {h.intro.map((p) => <p key={p} className="mt-4">{p}</p>)}
        {h.sections.map((s) => (
          <section key={s.h2}>
            <h2>{s.h2}</h2>
            {"text" in s && s.text && <p>{s.text}</p>}
            {"items" in s && s.items && <ul>{s.items.map((i) => <li key={i}>{i}</li>)}</ul>}
          </section>
        ))}
      </div>
      <h2 className="mt-10 text-xl font-bold">Find singles near you</h2>
      <TownLinks />
      <JoinBox place="Uganda" />
      <p className="mt-6 text-sm text-slate-600">
        Read our <Link to="/safety" className="underline">Safety Centre</Link> and <Link to="/faq" className="underline">FAQ</Link> before you start.
      </p>
    </div>
  );
}

export function DatingTown() {
  const { slug } = useParams();
  const t = TOWNS.find((x) => x.slug === slug);
  usePageMeta(t ? townTitle(t) : "Page not found", t ? townDescription(t) : undefined, { noindex: !t });
  if (!t) return <NotFound />;
  const nearby = t.nearby.map((s) => TOWNS.find((x) => x.slug === s)).filter(Boolean) as Town[];
  return (
    <div className="container-page max-w-3xl py-12">
      <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
        <Link to="/" className="hover:underline">Home</Link> › <Link to="/dating-in-uganda" className="hover:underline">Dating in Uganda</Link> › {t.name}
      </nav>
      <p className="mt-4 text-xs font-semibold tracking-[0.25em] text-gold-600">{t.region.toUpperCase()}</p>
      <h1 className="mt-2 text-4xl font-bold">Dating in {t.name}</h1>
      <div className="prose-legal mt-6">
        <p>{t.intro}</p>
        <p className="mt-4">{t.local}</p>
        <h2>How to meet singles in {t.name}</h2>
        <ul>
          <li>Create your free profile and set your district to {t.name} so nearby members can find you.</li>
          <li>Add a clear, recent photo and say what you are looking for — marriage, a long-term relationship, dating or friendship.</li>
          <li>Activate Bronze (from UGX 10,000) to view profiles, match and message, or Diamond for the separate sugar-dating category.</li>
          <li>Chat on the site first, then meet in a busy public place in {t.name} and tell a friend where you are going.</li>
        </ul>
        <h2>Safe dating in {t.name}</h2>
        <p>
          Never send money, airtime or mobile money to someone you met online, and never share your PIN or verification codes.
          Use the Report button if anyone asks for money or makes you uncomfortable — our team reviews every report.
          Whether you speak {t.language}, English or another language, take your time and get to know each other before meeting.
        </p>
      </div>
      {nearby.length > 0 && (
        <>
          <h2 className="mt-10 text-xl font-bold">Dating near {t.name}</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {nearby.map((n) => (
              <li key={n.slug}>
                <Link to={`/dating/${n.slug}`} className="inline-block rounded-full border border-plum-200 bg-white px-4 py-2 text-sm font-medium text-plum-900 hover:bg-plum-50">
                  Dating in {n.name}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
      <JoinBox place={t.name} />
      <p className="mt-6 text-sm text-slate-600">
        Looking elsewhere? See <Link to="/dating-in-uganda" className="underline">dating across Uganda</Link>.
      </p>
    </div>
  );
}

export default DatingHub;
