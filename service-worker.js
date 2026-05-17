const CACHE_NAME = "bmw-game-v7";

// Cache only the app shell
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./leaderboard.html",
  "./analytics.html",
  "./icon-192.png",
  "./icon-512.png"
  // game.js intentionally excluded — loaded with ?v= cache-buster in index.html
];

// --------------------
// INSTALL
// --------------------
self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
});

// --------------------
// ACTIVATE
// --------------------
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// --------------------
// FETCH
// --------------------
self.addEventListener("fetch", event => {
  const req = event.request;

  // 🚫 NEVER intercept images, JSON, or media
  if (
    req.destination === "image" ||
    req.destination === "video" ||
    req.destination === "audio" ||
    req.url.endsWith(".json")
  ) {
    return; // browser handles it
  }

  // ✅ Navigation fallback ONLY for pages
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match("./index.html"))
    );
    return;
  }

  // ✅ Cache-first for static assets
  event.respondWith(
    caches.match(req).then(res => res || fetch(req))
  );
});
