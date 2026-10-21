/// <reference lib="webworker" />

// WRFCoin PWA Service Worker
// Cache-first for static assets, network-first for API calls,
// offline fallback, and push notification handling.

declare const self: ServiceWorkerGlobalScope;

const CACHE_VERSION = 'v2';
const STATIC_CACHE = `wrfcoin-static-${CACHE_VERSION}`;
const API_CACHE = `wrfcoin-api-${CACHE_VERSION}`;
const OFFLINE_PAGE = '/offline.html';
const API_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ---------------------------------------------------------------------------
// Static assets to pre-cache during install
// ---------------------------------------------------------------------------

const PRECACHE_ASSETS: string[] = [
  '/',
  '/index.html',
  '/manifest.json',
];

// ---------------------------------------------------------------------------
// Install
// ---------------------------------------------------------------------------

self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ---------------------------------------------------------------------------
// Activate - clean old caches
// ---------------------------------------------------------------------------

self.addEventListener('activate', (event: ExtendableEvent) => {
  const currentCaches = new Set([STATIC_CACHE, API_CACHE]);

  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => !currentCaches.has(name))
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ---------------------------------------------------------------------------
// Route matchers
// ---------------------------------------------------------------------------

function isApiRequest(url: URL): boolean {
  return url.pathname.startsWith('/api/');
}

function isStaticAsset(url: URL): boolean {
  return /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|eot|webp|avif)$/i.test(
    url.pathname
  );
}

// ---------------------------------------------------------------------------
// Cache-first: static assets
// ---------------------------------------------------------------------------

async function cacheFirstStatic(request: Request): Promise<Response> {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    return new Response('', { status: 504, statusText: 'Offline' });
  }
}

// ---------------------------------------------------------------------------
// Network-first: API calls (with TTL-aware cache fallback)
// ---------------------------------------------------------------------------

async function networkFirstApi(request: Request): Promise<Response> {
  const cache = await caches.open(API_CACHE);

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Stamp the response with a cache timestamp
      const headers = new Headers(networkResponse.headers);
      headers.set('sw-cached-at', String(Date.now()));
      const body = await networkResponse.clone().blob();
      const stamped = new Response(body, {
        status: networkResponse.status,
        statusText: networkResponse.statusText,
        headers,
      });
      cache.put(request, stamped);
    }
    return networkResponse;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;

    return new Response(
      JSON.stringify({ error: 'offline', message: 'You are currently offline.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// ---------------------------------------------------------------------------
// Navigation: network-first with offline fallback
// ---------------------------------------------------------------------------

async function handleNavigation(request: Request): Promise<Response> {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    // Try cached version of the requested page
    const cached = await caches.match(request);
    if (cached) return cached;

    // Fall back to cached app shell
    const shell = await caches.match('/index.html');
    if (shell) return shell;

    return new Response(
      '<!DOCTYPE html><html><body><h1>Offline</h1><p>WRFCoin is currently unavailable. Please check your connection.</p></body></html>',
      { status: 503, headers: { 'Content-Type': 'text/html' } }
    );
  }
}

// ---------------------------------------------------------------------------
// Main fetch handler
// ---------------------------------------------------------------------------

self.addEventListener('fetch', (event: FetchEvent) => {
  const url = new URL(event.request.url);

  // Only handle same-origin GET requests
  if (url.origin !== self.location.origin) return;
  if (event.request.method !== 'GET') return;

  if (isApiRequest(url)) {
    event.respondWith(networkFirstApi(event.request));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirstStatic(event.request));
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(handleNavigation(event.request));
    return;
  }

  // Default: network with cache fallback
  event.respondWith(
    fetch(event.request).catch(async () => {
      const cached = await caches.match(event.request);
      return cached ?? new Response('', { status: 504 });
    })
  );
});

// ---------------------------------------------------------------------------
// Push notifications
// ---------------------------------------------------------------------------

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: Record<string, unknown>;
  actions?: NotificationAction[];
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
}

self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return;

  let payload: PushPayload;
  try {
    payload = event.data.json() as PushPayload;
  } catch {
    payload = {
      title: 'WRFCoin',
      body: event.data.text(),
    };
  }

  const options: NotificationOptions = {
    body: payload.body,
    icon: payload.icon ?? '/icons/icon-192x192.png',
    badge: payload.badge ?? '/icons/badge-72x72.png',
    image: payload.image,
    tag: payload.tag ?? 'wrfcoin-notification',
    data: payload.data,
    actions: payload.actions ?? [],
    requireInteraction: payload.requireInteraction ?? false,
    silent: payload.silent ?? false,
    vibrate: payload.vibrate ?? [200, 100, 200],
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

// ---------------------------------------------------------------------------
// Notification click
// ---------------------------------------------------------------------------

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  const targetUrl = ((): string => {
    switch (event.action) {
      case 'view-station':
        return '/stations';
      case 'view-rewards':
        return '/earnings';
      case 'view-alerts':
        return '/alerts';
      default: {
        const data = event.notification.data as Record<string, unknown> | undefined;
        return (data?.url as string) ?? '/';
      }
    }
  })();

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      // Focus existing window if one is open
      for (const client of clientList) {
        if (new URL(client.url).pathname === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      return self.clients.openWindow(targetUrl);
    })
  );
});

// ---------------------------------------------------------------------------
// Message handler (SKIP_WAITING from ServiceWorkerRegistration component)
// ---------------------------------------------------------------------------

self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ---------------------------------------------------------------------------
// Background sync (when back online)
// ---------------------------------------------------------------------------

self.addEventListener('sync', (event: SyncEvent) => {
  if (event.tag === 'wrfcoin-sync') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'SYNC_COMPLETE' });
        });
      })
    );
  }
});

export {};
