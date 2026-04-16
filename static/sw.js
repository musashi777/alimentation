const CACHE_NAME = 'alim-g-v2';
const ASSETS = [
  '/',
  '/css/style.css',
  '/js/cart.js',
  '/images/facade.jpg',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  // Stratégie Stale-While-Revalidate : On affiche le cache et on met à jour en arrière-plan
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        fetch(event.request).then((networkResponse) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
        });
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});
