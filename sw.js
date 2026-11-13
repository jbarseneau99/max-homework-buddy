// Max's Study Buddy service worker — NETWORK-FIRST. Online, every request goes to the network, so fresh HTML/JS
// (and the ?v= cache-bust) always win. The cache is only an offline fallback. MP3 narration is never cached here.
// All paths are relative: the site lives under /max-homework-buddy/ on GitHub Pages.
const CACHE = "hb-pwa-v20261113b";
const SHELL = ["./", "./index.html", "./manifest.json", "./icons/icon-192.png", "./icons/icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {}));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith("hb-pwa-") && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return;     // AI calls etc. pass straight through
  if (/\.mp3$/i.test(url.pathname) || req.headers.has("range")) return;        // audio: browser default, no caching
  e.respondWith(fetch(req).then(res => {
    if (res && res.ok && res.type === "basic") { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req).then(hit => hit
    || caches.match(req, { ignoreSearch: true })
    .then(h => h || (req.mode === "navigate" ? caches.match("./index.html") : undefined))
    .then(h => h || new Response("Offline", { status: 503, statusText: "Offline" })))));
});
