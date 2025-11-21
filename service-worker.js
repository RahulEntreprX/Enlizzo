
const CACHE_NAME = 'enlizzo-v5';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
  // NOTE: PWA icons are deliberately excluded here to prevent SW installation failure 
  // if the user has not yet uploaded the PNG files.
];

// Install SW and cache static assets
self.addEventListener('install', (event) => {
  // Force waiting service worker to become active immediately
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('SW: Cache setup failed', error);
      })
  );
});

// Activate SW and clean up old caches
self.addEventListener('activate', (event) => {
  // Claim clients immediately
  event.waitUntil(clients.claim());

  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Main Fetch Handler
self.addEventListener('fetch', (event) => {
  // Skip non-http requests
  if (!event.request.url.startsWith('http')) return;

  // 1. Navigation Requests (HTML): Network First -> Cache Fallback -> /index.html Fallback
  // This is CRITICAL for PWA installation. If we are offline and request /marketplace, 
  // we must return index.html or the browser won't treat it as an installed app.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match(event.request)
            .then((response) => {
              if (response) return response;
              // Fallback to index.html for SPA routing
              return caches.match('/index.html');
            });
        })
    );
    return;
  }

  // 2. Static Assets (Images, Scripts): Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Fetch from network to update cache in background
        const fetchPromise = fetch(event.request)
            .then((networkResponse) => {
              if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                return networkResponse;
              }
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
              return networkResponse;
            })
            .catch(() => {
               // Network failed, keep using cache
            });

        // Return cached response immediately if available, otherwise wait for network
        return cachedResponse || fetchPromise;
      })
  );
});