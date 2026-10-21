// WRFCoin PWA Service Worker
// Network-first for API, cache-first for static assets

const CACHE_NAME = 'wrfcoin-v1';
const API_CACHE_NAME = 'wrfcoin-api-v1';
const API_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Static assets to pre-cache during install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// ---------------------------------------------------------------------------
// Install - pre-cache static assets
// ---------------------------------------------------------------------------

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ---------------------------------------------------------------------------
// Activate - clean up old caches
// ---------------------------------------------------------------------------

self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME, API_CACHE_NAME];
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => !currentCaches.includes(name))
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isApiRequest(url) {
  return url.pathname.startsWith('/api/');
}

function isStaticAsset(url) {
  return (
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.ico')
  );
}

// Check if a cached API response is still fresh
function isResponseFresh(response) {
  const cachedAt = response.headers.get('sw-cached-at');
  if (!cachedAt) return false;
  return Date.now() - parseInt(cachedAt, 10) < API_CACHE_TTL;
}

// Clone a response and add a timestamp header for TTL tracking
function addTimestamp(response) {
  const headers = new Headers(response.headers);
  headers.set('sw-cached-at', String(Date.now()));
  return response.blob().then(
    (body) =>
      new Response(body, {
        status: response.status,
        statusText: response.statusText,
        headers: headers,
      })
  );
}

// ---------------------------------------------------------------------------
// Fetch strategies
// ---------------------------------------------------------------------------

// Network-first for API calls (with 5-min TTL cache fallback)
async function networkFirstApi(request) {
  const cache = await caches.open(API_CACHE_NAME);

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cloned = networkResponse.clone();
      addTimestamp(cloned).then((timestamped) =>
        cache.put(request, timestamped)
      );
    }
    return networkResponse;
  } catch (err) {
    // Network failed - try cache
    const cached = await cache.match(request);
    if (cached && isResponseFresh(cached)) {
      return cached;
    }
    // Return stale cache if nothing else available
    if (cached) {
      return cached;
    }
    // No cache either - return offline JSON
    return new Response(
      JSON.stringify({ error: 'offline', message: 'You are currently offline.' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Cache-first for static assets
async function cacheFirstStatic(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (err) {
    // Static asset not available offline
    return new Response('', { status: 504, statusText: 'Offline' });
  }
}

// Navigation requests - network first, fallback to cached index.html
async function handleNavigation(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (err) {
    const cached = await caches.match('/index.html');
    if (cached) return cached;
    return new Response('Offline', { status: 503 });
  }
}

// ---------------------------------------------------------------------------
// Main fetch handler
// ---------------------------------------------------------------------------

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // API requests -> network-first with TTL cache
  if (isApiRequest(url)) {
    event.respondWith(networkFirstApi(event.request));
    return;
  }

  // Static assets -> cache-first
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirstStatic(event.request));
    return;
  }

  // Navigation -> network-first with offline fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(handleNavigation(event.request));
    return;
  }

  // Everything else -> network with cache fallback
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
