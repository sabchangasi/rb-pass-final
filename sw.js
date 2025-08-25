const CACHE_NAME = 'navratri-pass-v1.2';
const OFFLINE_URL = './offline.html';

// Files to cache for offline functionality
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './offline.html',
  // CDN resources
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/heic2any/0.0.4/heic2any.min.js',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@600;700;800&family=Noto+Sans+Gujarati:wght@400;600;700&display=swap',
  // App Icons
  './android/android-launchericon-512-512.png',
  './android/android-launchericon-192-192.png',
  './android/android-launchericon-144-144.png',
  './android/android-launchericon-96-96.png',
  './android/android-launchericon-72-72.png',
  './android/android-launchericon-48-48.png',
  './ios/16.png',
  './ios/20.png',
  './ios/29.png',
  './ios/32.png',
  './ios/40.png',
  './ios/50.png',
  './ios/57.png',
  './ios/58.png',
  './ios/60.png',
  './ios/64.png',
  './ios/72.png',
  './ios/76.png',
  './ios/80.png',
  './ios/87.png',
  './ios/100.png',
  './ios/114.png',
  './ios/120.png',
  './ios/128.png',
  './ios/144.png',
  './ios/152.png',
  './ios/167.png',
  './ios/180.png',
  './ios/192.png',
  './ios/256.png',
  './ios/512.png',
  './ios/1024.png',
  // Screenshots & Splash Screens
  './images/screenshot-mobile.png',
  './images/screenshot-wide.png',
  './images/splash-2048x2732.png',
  './images/splash-1668x2224.png',
  './images/splash-1536x2048.png',
  './images/splash-1125x2436.png',
  './images/splash-1242x2208.png',
  './images/splash-750x1334.png',
  './images/splash-828x1792.png'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(urlsToCache.map(url => new Request(url, {
          cache: 'reload'
        })));
      })
      .catch((error) => {
        console.error('[SW] Cache addAll failed:', error);
      })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of all pages under this service worker's scope
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Handle navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.open(CACHE_NAME)
            .then((cache) => {
              return cache.match(OFFLINE_URL);
            });
        })
    );
    return;
  }

  // Handle other requests with cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          console.log('[SW] Serving from cache:', event.request.url);
          return response;
        }

        return fetch(event.request).then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response for caching
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              // Only cache same-origin requests or specific CDN resources
              if (event.request.url.startsWith(self.location.origin) || 
                  event.request.url.includes('cdnjs.cloudflare.com') ||
                  event.request.url.includes('fonts.googleapis.com')) {
                console.log('[SW] Caching new resource:', event.request.url);
                cache.put(event.request, responseToCache);
              }
            });

          return response;
        });
      })
      .catch((error) => {
        console.error('[SW] Fetch failed:', error);
        // For images, return a placeholder or cached version
        if (event.request.destination === 'image') {
          return caches.match('./android/android-launchericon-192-192.png');
        }
        throw error;
      })
  );
});

// Handle background sync (for future features)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // Implement background sync logic here if needed
  return Promise.resolve();
}

// Handle push notifications (for future features)
self.addEventListener('push', (event) => {
  console.log('[SW] Push received');
  
  const options = {
    body: event.data ? event.data.text() : 'New update available!',
    icon: './android/android-launchericon-192-192.png',
    badge: './android/android-launchericon-72-72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '2'
    },
    actions: [
      {
        action: 'explore',
        title: 'Open App',
        icon: './android/android-launchericon-192-192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: './android/android-launchericon-192-192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Navratri Pass Generator', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('./')
    );
  }
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});