// -------------------------------------------------------------
// Service Worker for Biomedical Waste Game (PWA)
// -------------------------------------------------------------

const CACHE_NAME = "bmw-game-v1";
const ASSETS = [
  "index.html",
  "style.css",
  "game.js",
  "manifest.json",

  // Icons
  "icons/icon-192.png",
  "icons/icon-512.png",

  // Images
  "images/Ampoules.webp",
  "images/Blade.webp",
  "images/Blood Bag.avif",
  "images/Catheter.jpg",
  "images/Contaminated-Cotton-Swabs.webp",
  "images/Dialysis Kit.webp",
  "images/Expired Medicines.webp",
  "images/Human anatomical waste.webp",
  "images/IV SET.png",
  "images/IV bottles.jpg",
  "images/Lab Slides.jpg",
  "images/Mask.webp",
  "images/Metallic body implants.png",
  "images/Needles.jpg",
  "images/Placenta.webp",
  "images/Plaster cast.jpg",
  "images/Scalpel.webp",
  "images/Scissors.webp",
  "images/Syringe.webp",
  "images/Syringes with needles.png",
  "images/Urine Bag.webp",
  "images/Vacutainers.webp",
  "images/Vial.jpg",
  "images/Wound dressing.webp"
];

// INSTALL SW + CACHE FILES
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// ACTIVATE SW
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// FETCH FILES
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(res => {
      return res || fetch(event.request);
    })
  );
});
