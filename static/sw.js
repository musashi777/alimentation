const CACHE_NAME = 'alimg-v2-' + Date.now(); // Version dynamique pour forcer la mise à jour

self.addEventListener('install', (event) => {
  // Force le Service Worker à devenir actif immédiatement
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Supprime tous les anciens caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('Suppression du cache :', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Stratégie : Réseau d'abord, pour être sûr d'avoir les prix frais
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
