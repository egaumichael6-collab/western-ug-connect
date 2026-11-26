// WESTERN UG CONNECT service worker — makes the site installable and fast.
// - App code and images are kept on the phone after the first visit, so pages open instantly.
// - Pages are always fetched fresh; a saved copy is used only if the network is slow or offline.
// - Member data (Supabase) is never cached here.
const SHELL_CACHE = "wugc-shell-v2";
const STATIC_CACHE = "wugc-static-v2";
const SHELL = "/app-shell.html";
const SLOW_NETWORK_MS = 4000;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((c) => c.add(new Request(SHELL, { cache: "reload" }))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== SHELL_CACHE && k !== STATIC_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const isBuildFile = (url) => url.pathname.startsWith("/assets/");
const isImage = (url) => url.pathname.startsWith("/img/") || url.pathname.startsWith("/icons/")
  || url.pathname === "/favicon.png" || url.pathname === "/apple-touch-icon.png";

// Fingerprinted files never change, so serve them straight from the phone.
async function cacheFirst(req) {
  const cache = await caches.open(STATIC_CACHE);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok && res.type === "basic") cache.put(req, res.clone()).catch(() => {});
  return res;
}

// Images show instantly from the phone and quietly refresh in the background.
async function staleWhileRevalidate(event, req) {
  const cache = await caches.open(STATIC_CACHE);
  const hit = await cache.match(req);
  const update = fetch(req).then((res) => {
    if (res.ok && res.type === "basic") cache.put(req, res.clone()).catch(() => {});
    return res;
  });
  if (hit) { event.waitUntil(update.catch(() => {})); return hit; }
  return update;
}

async function page(req) {
  const cache = await caches.open(SHELL_CACHE);
  const network = fetch(req).then((res) => {
    if (res.ok && res.type === "basic") cache.put(req, res.clone()).catch(() => {});
    return res;
  });
  network.catch(() => {});
  const fallback = () => cache.match(req).then((r) => r || cache.match(SHELL));
  const slow = new Promise((resolve) => setTimeout(resolve, SLOW_NETWORK_MS)).then(fallback);
  try {
    const first = await Promise.race([network, slow]);
    if (first) return first;
    return await network;
  } catch {
    const saved = await fallback();
    return saved || new Response("You are offline. Please check your internet connection.", { headers: { "Content-Type": "text/plain" } });
  }
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Supabase, fonts etc. go straight to the network
  if (req.mode === "navigate") { event.respondWith(page(req)); return; }
  if (isBuildFile(url)) event.respondWith(cacheFirst(req));
  else if (isImage(url)) event.respondWith(staleWhileRevalidate(event, req));
});
