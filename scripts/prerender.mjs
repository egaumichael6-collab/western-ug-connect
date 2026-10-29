// Post-build step: writes a static HTML file for every public page so search engines
// (and link previews on WhatsApp/Facebook) see a real title, description and readable
// content without running JavaScript. React replaces this content as soon as it loads.
// Usage: node scripts/prerender.mjs   (runs automatically after `vite build`)
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const SITE = (process.env.SITE_URL || "https://westernugconnect.com").replace(/\/$/, "");
const NAME = "WESTERN UG CONNECT";
const seo = JSON.parse(readFileSync(join(root, "src/data/seo-pages.json"), "utf8"));
const template = readFileSync(join(dist, "index.html"), "utf8");

// Untouched copy used as the single-page-app fallback for every other route (/app/*, /admin/* …)
copyFileSync(join(dist, "index.html"), join(dist, "app-shell.html"));

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const a = (href, text) => `<a href="${href}">${esc(text)}</a>`;
const townLinks = (towns) => `<ul>${towns.map((t) => `<li>${a(`/dating/${t.slug}`, `Dating in ${t.name}`)}</li>`).join("")}</ul>`;
const nav = `<nav aria-label="Main">${a("/", "Home")} · ${a("/dating-in-uganda", "Dating in Uganda")} · ${a("/memberships", "Memberships")} · ${a("/about", "About")} · ${a("/safety", "Safety")} · ${a("/faq", "FAQ")} · ${a("/register", "Join free")}</nav>`;
const prices = `<p>Free to join. Bronze 14 days UGX 10,000 · Bronze 30 days UGX 15,000 · Diamond 30 days UGX 25,000 — paid by MTN or Airtel Mobile Money to +256 794 273 661.</p>`;

const simple = (path, title, description, h1) => ({
  path, title, description,
  body: `<h1>${esc(h1)}</h1><p>${esc(description)}</p>${prices}`,
});

const pages = [
  {
    path: "/",
    title: "Uganda Dating Site — Meet Singles in Mbarara, Kampala & Western Uganda",
    description: "WESTERN UG CONNECT is a Ugandan dating site for single adults 18+. Meet singles in Mbarara, Kampala, Fort Portal, Kabale, Hoima and across Uganda. Free to join, pay by MTN or Airtel Mobile Money.",
    body: `<h1>Meet Your Person. Build Your Future.</h1>
<p>A respectful dating community for single adults in Western Uganda and across Uganda — from Mbarara to Fort Portal, Kabale to Hoima, and beyond.</p>
<h2>How it works</h2><ol><li>Create your free profile.</li><li>Choose a Bronze or Diamond membership and pay by MTN or Airtel Mobile Money.</li><li>Discover members, match and message privately.</li></ol>
${prices}<h2>Find singles near you</h2>${townLinks(seo.towns)}`,
    jsonld: [
      { "@context": "https://schema.org", "@type": "WebSite", name: NAME, url: `${SITE}/` },
      { "@context": "https://schema.org", "@type": "Organization", name: NAME, url: `${SITE}/`, logo: `${SITE}/apple-touch-icon.png`,
        areaServed: { "@type": "Country", name: "Uganda" } },
    ],
  },
  simple("/about", "About us", "WESTERN UG CONNECT is a Ugandan dating community for single adults in Western Uganda and across the country.", "Love that feels like home"),
  simple("/memberships", "Membership packages", "Bronze 14 days UGX 10,000 · Bronze 30 days UGX 15,000 · Diamond 30 days UGX 25,000. Pay by MTN or Airtel Mobile Money.", "Choose your journey"),
  simple("/safety", "Safety Centre", "Dating safety advice for WESTERN UG CONNECT members: avoid romance scams, protect your money and meet safely.", "Safety Centre"),
  simple("/faq", "Frequently asked questions", "Answers about joining WESTERN UG CONNECT, mobile money payments, memberships, privacy and safety.", "Frequently asked questions"),
  simple("/contact", "Contact us", "Get in touch with the WESTERN UG CONNECT team about your account, payments or safety concerns.", "Contact us"),
  simple("/guidelines", "Community guidelines", "The rules every WESTERN UG CONNECT member agrees to follow.", "Community Guidelines"),
  simple("/privacy", "Privacy policy", "How WESTERN UG CONNECT collects, uses, protects and deletes your personal data.", "Privacy Policy"),
  simple("/terms", "Terms and conditions", "The terms that apply when you use WESTERN UG CONNECT.", "Terms and Conditions"),
  {
    path: seo.hub.path,
    title: seo.hub.title,
    description: seo.hub.description,
    body: `<h1>${esc(seo.hub.h1)}</h1>${seo.hub.intro.map((p) => `<p>${esc(p)}</p>`).join("")}
${seo.hub.sections.map((s) => `<h2>${esc(s.h2)}</h2>${s.text ? `<p>${esc(s.text)}</p>` : ""}${s.items ? `<ul>${s.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>` : ""}`).join("")}
<h2>Find singles near you</h2>${townLinks(seo.towns)}`,
  },
  ...seo.towns.map((t) => {
    const nearby = t.nearby.map((s) => seo.towns.find((x) => x.slug === s)).filter(Boolean);
    return {
      path: `/dating/${t.slug}`,
      title: `Dating in ${t.name} — Meet Singles in ${t.name}, Uganda`,
      description: `Meet genuine single men and women in ${t.name} (${t.region}) on WESTERN UG CONNECT. Free to join, adults 18+, pay by MTN or Airtel Mobile Money.`,
      body: `<p>${a("/", "Home")} › ${a("/dating-in-uganda", "Dating in Uganda")} › ${esc(t.name)}</p>
<h1>Dating in ${esc(t.name)}</h1><p>${esc(t.intro)}</p><p>${esc(t.local)}</p>
<h2>How to meet singles in ${esc(t.name)}</h2><ul>
<li>Create your free profile and set your district to ${esc(t.name)} so nearby members can find you.</li>
<li>Add a clear, recent photo and say what you are looking for — marriage, a long-term relationship, dating or friendship.</li>
<li>Activate Bronze (from UGX 10,000) to view profiles, match and message, or Diamond for the separate sugar-dating category.</li>
<li>Chat on the site first, then meet in a busy public place in ${esc(t.name)} and tell a friend where you are going.</li></ul>
<h2>Safe dating in ${esc(t.name)}</h2><p>Never send money, airtime or mobile money to someone you met online, and never share your PIN or verification codes.</p>
${nearby.length ? `<h2>Dating near ${esc(t.name)}</h2>${townLinks(nearby)}` : ""}${prices}`,
      jsonld: [{
        "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
          { "@type": "ListItem", position: 2, name: "Dating in Uganda", item: `${SITE}/dating-in-uganda` },
          { "@type": "ListItem", position: 3, name: `Dating in ${t.name}`, item: `${SITE}/dating/${t.slug}` },
        ],
      }],
    };
  }),
];

function render(p) {
  const fullTitle = `${p.title} · ${NAME}`;
  const url = `${SITE}${p.path === "/" ? "/" : p.path}`;
  const head = [
    `<title>${esc(fullTitle)}</title>`,
    `<meta name="description" content="${esc(p.description)}" />`,
    `<meta name="robots" content="index, follow" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${NAME}" />`,
    `<meta property="og:title" content="${esc(fullTitle)}" />`,
    `<meta property="og:description" content="${esc(p.description)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${SITE}/og-image.png" />`,
    `<meta property="og:locale" content="en_UG" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    ...(p.jsonld || []).map((j) => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, "\\u003c")}</script>`),
  ].join("\n    ");
  let html = template
    .replace(/<title>[\s\S]*?<\/title>\s*/, "")
    .replace(/\s*<meta (name|property)="(description|og:[a-z_:]+|twitter:[a-z_:]+)"[^>]*>/g, "")
    .replace("</head>", `    ${head}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root"><div class="container-page py-12 prose-legal">${nav}${p.body}</div></div>`);
  return html;
}

for (const p of pages) {
  const out = p.path === "/" ? join(dist, "index.html") : join(dist, p.path.slice(1), "index.html");
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, render(p));
}

const today = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `  <url><loc>${SITE}${p.path}</loc><lastmod>${today}</lastmod></url>`).join("\n")}
</urlset>
`;
writeFileSync(join(dist, "sitemap.xml"), sitemap);
console.log(`prerender: wrote ${pages.length} pages + sitemap.xml for ${SITE}`);
