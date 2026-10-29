import { Link } from "react-router-dom";
import { usePageMeta } from "../lib/usePageMeta";
import { useAuth } from "../context/AuthContext";
import HeroArt from "../components/HeroArt";
import { PAYMENT_NUMBER_DISPLAY } from "../lib/config";
import seo from "../data/seo-pages.json";

const steps = [
  { n: "1", t: "Create your free profile", d: "Register with your email, verify it, and tell members who you are and what you are looking for." },
  { n: "2", t: "Choose a membership", d: "Registration is free. To start browsing singles, sugar mummies and sugar daddies near you, subscribe to Silver, Gold or Diamond by MTN or Airtel Mobile Money." },
  { n: "3", t: "Connect with intention", d: "Discover members, see why you were recommended, match, and message privately." },
];

const promises = [
  { t: "Adults only", d: "Every member confirms a date of birth, and our server refuses registrations under 18." },
  { t: "Private by design", d: "Your email, phone number and exact location are never shown to other members. Photos are private files only signed-in members you allow can see." },
  { t: "Real verification", d: "Memberships start only after an administrator has checked the payment against our mobile money records." },
  { t: "Block, report, move on", d: "Block anyone in one tap. Reports go to our moderation team, who can suspend accounts that break the rules." },
];

export default function Home() {
  usePageMeta("Uganda Dating Site — Meet Singles, Sugar Mummies & Sugar Daddies",
    "Meet singles and find your dream sugar mummy or sugar daddy in Mbarara, Kampala, Fort Portal, Kabale, Hoima and across Uganda. Register free, then subscribe by MTN or Airtel Mobile Money.");
  const { user } = useAuth();

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-b from-plum-950 via-plum-900 to-plum-800 text-white">
        <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-rose-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-gold-400/20 blur-3xl" />
        <div className="container-page relative grid items-center gap-10 py-14 md:grid-cols-2 md:py-20">
          <div>
            <p className="text-xs font-semibold tracking-[0.3em] text-gold-300">YOUR JOURNEY TO TRUE LOVE STARTS HERE</p>
            <h1 className="mt-4 text-4xl font-bold leading-[1.1] text-white sm:text-5xl lg:text-6xl">
              Meet Your Person.<br /><span className="text-gold-300">Build Your Future.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-plum-100">
              Meet singles — and find your dream sugar mummy or sugar daddy — in Western Uganda and across Uganda, from Mbarara to Fort Portal,
              Kabale to Hoima, and beyond.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={user ? "/app/discover" : "/register"} className="btn-gold px-6 py-3 text-base">{user ? "Go to Discover" : "Join Now"}</Link>
              <Link to={user ? "/app/recommendations" : "/register?next=/app/recommendations"} className="btn px-6 py-3 text-base border border-white/40 text-white hover:bg-white/10">Find Your Match</Link>
              <Link to="/memberships" className="btn px-6 py-3 text-base text-gold-300 underline-offset-4 hover:underline">Explore Memberships</Link>
            </div>
            <p className="mt-6 text-sm text-plum-200">18+ only · Free to register · Memberships from UGX 10,000</p>
            <p className="mt-3 max-w-lg rounded-xl bg-white/10 px-4 py-3 text-sm text-white ring-1 ring-white/20">Register for free, then <strong className="text-gold-300">subscribe</strong> to start browsing and seeing singles, sugar mummies and sugar daddies near you.</p>
          </div>
          <div className="mx-auto w-full max-w-md md:max-w-none">
            <div className="rounded-[2.5rem] bg-white/10 p-2 shadow-2xl ring-1 ring-white/20"><HeroArt /></div>
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <h2 className="text-center text-3xl font-bold">How it works</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="card p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-400 font-display text-lg font-bold text-plum-950">{s.n}</span>
              <h3 className="mt-4 text-lg font-bold">{s.t}</h3>
              <p className="mt-2 text-sm text-slate-600">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="container-page grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:items-center">
          <div>
            <h2 className="text-3xl font-bold">Built on trust, not hype</h2>
            <p className="mt-3 text-slate-600">
              We are a new community, so we will not show you invented member counts or made-up testimonials. Here is what we
              promise instead.
            </p>
            <Link to="/safety" className="btn-outline mt-6">Visit the Safety Centre</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {promises.map((p) => (
              <div key={p.t} className="rounded-2xl border border-plum-100 bg-plum-50/60 p-5">
                <h3 className="text-base font-bold">{p.t}</h3>
                <p className="mt-1.5 text-sm text-slate-600">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card p-8">
            <p className="text-xs font-bold tracking-[0.25em] text-gold-600">SILVER &amp; GOLD</p>
            <h2 className="mt-2 text-2xl font-bold">For genuine relationships</h2>
            <p className="mt-2 text-slate-600">Silver: 14 days for UGX 10,000. Gold: 30 days for UGX 15,000. Discover, match and message members looking for love,
              marriage, dating or friendship.</p>
            <Link to="/memberships" className="btn-primary mt-6">See Silver &amp; Gold</Link>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-plum-950 to-plum-800 p-8 text-white shadow-sm">
            <p className="text-xs font-bold tracking-[0.25em] text-gold-300">DIAMOND</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Find your dream sugar mummy or sugar daddy</h2>
            <p className="mt-2 text-plum-100">30 days for UGX 25,000. Browse sugar mummies and sugar daddies near you, match and chat privately. Adults 18+ only.</p>
            <div className="mt-6 flex flex-wrap gap-3"><Link to="/memberships" className="btn-gold">See Diamond</Link><Link to="/sugar-mummy-uganda" className="btn border border-white/40 text-white hover:bg-white/10">Sugar mummy</Link><Link to="/sugar-daddy-uganda" className="btn border border-white/40 text-white hover:bg-white/10">Sugar daddy</Link></div>
          </div>
        </div>
        <p className="mt-8 text-center text-sm text-slate-600">
          Membership payments go only to our official mobile money number <strong className="text-plum-900">{PAYMENT_NUMBER_DISPLAY}</strong>.
        </p>
      </section>

      <section className="bg-white py-16">
        <div className="container-page">
          <h2 className="text-center text-3xl font-bold">Find singles near you</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">
            Meet genuine single adults in your town — from Mbarara and Fort Portal to Kabale, Hoima, Masaka and Kampala.
          </p>
          <ul className="mt-8 flex flex-wrap justify-center gap-2">
            {seo.towns.map((t) => (
              <li key={t.slug}>
                <Link to={`/dating/${t.slug}`} className="inline-block rounded-full border border-plum-200 px-4 py-2 text-sm font-medium text-plum-900 hover:bg-plum-50">
                  {t.name}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-center">
            <Link to="/dating-in-uganda" className="font-semibold text-plum-800 underline">More about dating in Uganda</Link>
          </p>
        </div>
      </section>
    </>
  );
}
