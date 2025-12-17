const CACHE_NAME = "bmw-game-v3"; // 🔥 CHANGE VERSION EVERY MAJOR UPDATE

// Only cache STABLE files
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./game.js",
  "./leaderboard.html",
  "./leaderboard.js",
  "./analytics.html",
  "./analytics.js",
  "./icon-192.png",
  "./icon-512.png"
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
// ACTIVATE — CLEAN OLD CACHES
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
// FETCH STRATEGY
// --------------------
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);

  // ❌ NEVER cache game data or images
  if (
    url.pathname.endsWith("items.json") ||
    url.pathname.startsWith("/Biomedical-Waste-Game/images/")
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // ✅ Cache-first for app shell
  event.respondWith(
    caches.match(event.request).then(response =>
      response || fetch(event.request)
    )
  );
});
