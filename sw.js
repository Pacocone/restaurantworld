// Service Worker v14 - cache básico para instalabilidad (app shell)
const CACHE = 'rw-shell-v14';
const CORE = [
  '/restaurantworld/',
  '/restaurantworld/index.html',
  '/restaurantworld/manifest.json',
  '/restaurantworld/icons/icon-192.png',
  '/restaurantworld/icons/icon-512.png',
  '/restaurantworld/style.css?v=14',
  '/restaurantworld/script.js?v=14'
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

  if (url.origin === location.origin) {
    if (req.mode === 'navigate') {
      event.respondWith(caches.match('/restaurantworld/index.html').then(c => c || fetch(req)));
      return;
    }
    event.respondWith(caches.match(req).then(cached => cached || fetch(req)));
    return;
  }
  event.respondWith(fetch(req).catch(()=>caches.match(req)));
});
