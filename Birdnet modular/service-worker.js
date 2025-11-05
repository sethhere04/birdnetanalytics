/**
 * Service Worker for BirdNET Analytics PWA
 * Enhanced with advanced offline support and caching
 */

const CACHE_NAME = 'birdnet-analytics-v2.0';
const DATA_CACHE_NAME = 'birdnet-data-v2.0';
const IMAGE_CACHE_NAME = 'birdnet-images-v2.0';

const urlsToCache = [
  './',
  './index.html',
  './css/styles.css',
  './js/main.js',
  './js/api.js',
  './js/analytics.js',
  './js/ui-render.js',
  './js/charts.js',
  './js/feeding.js',
  './js/migration.js',
  './js/weather.js',
  './js/audio-player.js',
  './js/alerts.js',
  './manifest.json',
  './icon.svg'
];

// IndexedDB for offline data storage
const DB_NAME = 'BirdNETDB';
const DB_VERSION = 1;
const DETECTIONS_STORE = 'detections';
const SPECIES_STORE = 'species';

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('[Service Worker] Cache failed:', error);
      })
  );
  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  const currentCaches = [CACHE_NAME, DATA_CACHE_NAME, IMAGE_CACHE_NAME];

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!currentCaches.includes(cacheName)) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control immediately
  return self.clients.claim();
});

// Fetch event - intelligent caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests (except Wikipedia and external APIs we trust)
  if (url.origin !== self.location.origin) {
    // Cache Wikipedia images and API responses
    if (url.hostname.includes('wikipedia.org') || url.hostname.includes('wikimedia.org')) {
      event.respondWith(handleImageRequest(request));
    }
    return;
  }

  // API requests - Network first, then cache
  if (url.pathname.includes('/api/')) {
    event.respondWith(handleAPIRequest(request));
    return;
  }

  // Images - Cache first, then network
  if (request.destination === 'image') {
    event.respondWith(handleImageRequest(request));
    return;
  }

  // App shell - Cache first, then network
  event.respondWith(handleAppShellRequest(request));
});

// Handle API requests: Network first, fallback to cache
async function handleAPIRequest(request) {
  const cacheName = DATA_CACHE_NAME;

  try {
    // Try network first
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }

    // If network fails, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline response
    return new Response(JSON.stringify({
      error: 'Offline',
      message: 'No cached data available',
      offline: true
    }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle image requests: Cache first, then network
async function handleImageRequest(request) {
  const cacheName = IMAGE_CACHE_NAME;

  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // If not in cache, fetch from network
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Cache the image
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Return placeholder or cached response
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('', { status: 404 });
  }
}

// Handle app shell requests: Cache first, then network
async function handleAppShellRequest(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Return cached version immediately, but update in background
      fetchAndUpdateCache(request);
      return cachedResponse;
    }

    // If not in cache, fetch from network
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Cache the response
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Try cache as fallback
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // If requesting HTML, return offline page
    if (request.headers.get('Accept').includes('text/html')) {
      return new Response(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Offline - BirdNET Analytics</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                text-align: center;
                padding: 2rem;
              }
              .offline-container {
                max-width: 500px;
              }
              h1 { font-size: 3rem; margin: 0 0 1rem 0; }
              p { font-size: 1.2rem; opacity: 0.9; }
            </style>
          </head>
          <body>
            <div class="offline-container">
              <h1>🦜</h1>
              <h1>You're Offline</h1>
              <p>BirdNET Analytics needs an internet connection to load new data.</p>
              <p>Your cached bird data is still available.</p>
            </div>
          </body>
        </html>
      `, {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'text/html' }
      });
    }

    return new Response('Offline', { status: 503 });
  }
}

// Background fetch and cache update
function fetchAndUpdateCache(request) {
  fetch(request)
    .then(response => {
      if (response.ok) {
        caches.open(CACHE_NAME).then(cache => {
          cache.put(request, response);
        });
      }
    })
    .catch(() => {
      // Silently fail - we already have cached version
    });
}

// Push notification event (for future use)
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received');

  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: data.icon || '/icon.svg',
      badge: '/icon.svg',
      vibrate: [200, 100, 200],
      data: data.data || {},
      actions: data.actions || []
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked');
  event.notification.close();

  event.waitUntil(
    clients.openWindow('/')
  );
});
