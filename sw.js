// sw.js - Service Worker for Offline Support (Workbox-inspired)

const CACHE_NAME = 'nexus-os-v1';
const RUNTIME_CACHE = 'nexus-os-runtime';

// Assets to cache immediately
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/system/kernel.js',
  '/system/state.js',
  '/system/window-manager.js',
  '/system/cpu-manager.js',
  '/system/filesystem.js',
  '/system/storage.js',
  '/system/ipc.js',
  '/system/router.js',
  '/system/notifications.js'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Precaching assets');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
            .map((name) => {
              console.log('[ServiceWorker] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip external requests (CDN, APIs)
  if (url.origin !== location.origin) {
    // Cache external resources (CDN)
    event.respondWith(
      caches.open(RUNTIME_CACHE).then((cache) => {
        return cache.match(request).then((response) => {
          if (response) {
            // Return cached, but update in background
            fetch(request).then((networkResponse) => {
              cache.put(request, networkResponse);
            }).catch(() => {});
            
            return response;
          }
          
          // Fetch from network and cache
          return fetch(request).then((networkResponse) => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          }).catch(() => {
            // Return offline fallback if available
            return new Response('Offline', { status: 503 });
          });
        });
      })
    );
    
    return;
  }
  
  // Cache-first strategy for same-origin requests
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached version
          console.log('[ServiceWorker] Serving from cache:', url.pathname);
          
          // Update cache in background
          fetch(request)
            .then((networkResponse) => {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, networkResponse);
              });
            })
            .catch(() => {});
          
          return cachedResponse;
        }
        
        // Fetch from network and cache
        console.log('[ServiceWorker] Fetching from network:', url.pathname);
        
        return fetch(request)
          .then((networkResponse) => {
            // Cache successful responses
            if (networkResponse.ok) {
              const responseClone = networkResponse.clone();
              
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            
            return networkResponse;
          })
          .catch(() => {
            // Offline fallback
            if (request.destination === 'document') {
              return caches.match('/index.html');
            }
            
            return new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Message event - handle commands from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => caches.delete(name))
        );
      }).then(() => {
        event.ports[0].postMessage({ success: true });
      })
    );
  }
  
  if (event.data && event.data.type === 'GET_CACHE_SIZE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            return caches.open(name).then((cache) => {
              return cache.keys().then((keys) => {
                return { name, count: keys.length };
              });
            });
          })
        );
      }).then((results) => {
        event.ports[0].postMessage({ caches: results });
      })
    );
  }
});

// Background sync (if supported)
if ('sync' in self.registration) {
  self.addEventListener('sync', (event) => {
    console.log('[ServiceWorker] Background sync:', event.tag);
    
    if (event.tag === 'sync-data') {
      event.waitUntil(
        // Sync logic here
        Promise.resolve()
      );
    }
  });
}

console.log('[ServiceWorker] Service Worker loaded');