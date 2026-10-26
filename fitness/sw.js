const CACHE = 'steady-shell-v1';
const SHELL = ['./', './index.html', './nutrition.js', './manifest.json', './icon.svg', './icon-192.png', './icon-512.png'];
const PUBLIC = new Set(SHELL.map(path => new URL(path, self.location.href).href));
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('steady-shell-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  // Only public shell files. Never cache tokens, health records or food responses.
  if (event.request.method !== 'GET' || !PUBLIC.has(event.request.url)) return;
  event.respondWith(fetch(event.request).then(response => {
    if (response.ok) { const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(event.request, copy)); }
    return response;
  }).catch(() => caches.match(event.request)));
});
