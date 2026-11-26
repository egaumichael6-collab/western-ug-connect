// WESTERN UG CONNECT service worker — makes the site installable as an app.
// Pages always come fresh from the network; the saved copy is only used when offline.
const CACHE = "wugc-shell-v1";
const SHELL = "/app-shell.html";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.add(new Request(SHELL, { cache: "reload" }))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || req.mode !== "navigate") return; // everything else goes straight to the network
  event.respondWith(
    fetch(req).catch(() => caches.match(SHELL).then((r) => r || new Response("You are offline. Please check your internet connection.", { headers: { "Content-Type": "text/plain" } }))),
  );
});
