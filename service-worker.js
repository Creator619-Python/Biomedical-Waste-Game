const CACHE_NAME = "bmw-game-cache-v1";
const urlsToCache = [
    "index.html",
    "leaderboard.html",
    "analytics.html",
    "style.css",
    "leaderboard.css",
    "analytics.css",
    "game.js",
    "leaderboard.js",
    "analytics.js",
    "firebase.js",
    "items.json",
    "icon-192.png",
    "icon-512.png"
];

// Install – cache all files
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(urlsToCache);
        })
    );
});

// Fetch – serve cache first, fallback to network
self.addEventListener("fetch", event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return (
                response ||
                fetch(event.request).then(res => {
                    return res;
                })
            );
        })
    );
});
