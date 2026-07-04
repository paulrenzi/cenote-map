// CACHE name MUST be bumped on every release that changes any shell file.
// The activate handler deletes every cache whose name doesn't match, so a
// stale shell can't outlive a release. The ?v= query strings on the URLs
// below also force the browser HTTP cache to miss for those URLs.
const CACHE = "cenote-map-v14";
const SHELL = [
  "/cenote-map/",
  "/cenote-map/index.html",
  "/cenote-map/styles.css?v=19",
  "/cenote-map/app.js?v=19",
  "/cenote-map/data/cenotes.json",
  "/cenote-map/data/bases.json",
  "/cenote-map/data/photos.json",
  "/cenote-map/images/hero.webp",
  "/cenote-map/manifest.webmanifest?v=19"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (url.hostname.includes("openfreemap.org") ||
      url.hostname.includes("unpkg.com") ||
      url.hostname.includes("fonts.g")) return;

  if (url.origin !== location.origin) return;

  const path = url.pathname;
  const isAppShell = /\.(html|js|css|json|webmanifest)$/.test(path) || path.endsWith("/");

  if (isAppShell) {
    // Network-first with no-cache so the SW bypasses the browser HTTP cache
    // (this is critical — without {cache:"no-cache"}, fetch() can return a
    // stale version that the browser cached previously, even though our
    // intent is to always reach the server for shell files).
    e.respondWith(
      fetch(req, { cache: "no-cache" })
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(req, clone));
          }
          return res;
        })
        .catch(() => caches.match(req))
    );
  } else {
    e.respondWith(
      caches.match(req).then((cached) => {
        const fetchPromise = fetch(req).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(req, clone));
          }
          return res;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
  }
});
