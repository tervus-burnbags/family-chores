const CACHE_NAME = 'hub-v65';
const ASSETS = [
  './',
  './index.html',
  './kid-fun-data.js',
  './manifest.json',
  './firebase-config.js',
  './favicon-32.png',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
];
const PUBLIC_ASSETS = new Set(ASSETS.map((asset) => new URL(asset, self.location.href).href));

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k.startsWith('hub-v') && k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Sibling apps and APIs own their caching; never store their private responses.
  const assetUrl = new URL(event.request.url);
  assetUrl.search = '';
  assetUrl.hash = '';
  if (event.request.method !== 'GET' || !PUBLIC_ASSETS.has(assetUrl.href)) return;
  event.respondWith(
    fetch(event.request).then((response) => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(assetUrl.href, clone));
      }
      return response;
    }).catch(() => caches.match(assetUrl.href))
  );
});
