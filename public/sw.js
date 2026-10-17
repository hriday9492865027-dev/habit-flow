// FriendFlow Service Worker
const CACHE_NAME = 'friendflow-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Let network handle Firestore and external API requests dynamically
  if (
    event.request.url.includes('firestore.googleapis.com') ||
    event.request.url.includes('tile.openstreetmap.org') ||
    event.request.url.includes('router.project-osrm.org')
  ) {
    return;
  }
  // Standard fetch pass-through
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
