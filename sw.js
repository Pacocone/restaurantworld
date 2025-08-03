// v13g: SW for PWA installability + offline shell cache
const CACHE = 'rw-v13g';
const ASSETS = [
  './',
  './index.html',
  './style.css?v=13g',
  './script.js?v=13g',
  './manifest.json?v=13g',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
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
      event.respondWith(caches.match('./index.html').then(c => c || fetch(req)));
      return;
    }
    if (ASSETS.some(a => url.pathname.endsWith(a.replace('./','')))) {
      event.respondWith(caches.match(req).then(c => c || fetch(req)));
      return;
    }
  }
  event.respondWith(fetch(req).catch(() => caches.match(req)));
});
