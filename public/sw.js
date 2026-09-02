const CACHE_NAME = 'frintab-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Let network handle requests normally
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
