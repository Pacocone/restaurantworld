// Simple Service Worker for GitHub Pages - PWA installability + offline shell
// v1
const CACHE = 'rw-shell-v1';
const CORE = [
  '/restaurantworld/',
  '/restaurantworld/index.html',
  '/restaurantworld/manifest.json',
  '/restaurantworld/icons/icon-192.png',
  '/restaurantworld/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => k===CACHE ? null : caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // same-origin only
  if (url.origin === location.origin) {
    // app shell
    if (req.mode === 'navigate') {
      event.respondWith(caches.match('/restaurantworld/index.html').then(c => c || fetch(req)));
      return;
    }
    // try cache-first for static files
    event.respondWith(
      caches.match(req).then(cached => cached || fetch(req))
    );
    return;
  }

  // cross-origin: network-first
  event.respondWith(fetch(req).catch(()=>caches.match(req)));
});
