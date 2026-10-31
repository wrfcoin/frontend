// WRFCoin payout notifications (backend#389): a push-only service worker.
// It has NO fetch handler, so it never caches or intercepts the app; it only shows the
// notification the backend sends ("0x12ab…cd34 was paid 1.25 WRF") and opens the explorer on click.
// Registered by src/services/payoutNotifications.ts with scope /payout-push/.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = {}; }
  const title = typeof data.title === 'string' ? data.title.slice(0, 80) : 'WRFCoin payout';
  const body = typeof data.body === 'string' ? data.body.slice(0, 400) : 'An address you follow was paid.';
  const url = typeof data.url === 'string' ? data.url : '/explore';
  event.waitUntil(self.registration.showNotification(title, {
    body,
    tag: typeof data.tag === 'string' ? data.tag.slice(0, 64) : 'payout',
    icon: '/icons/icon-192x192.png',
    data: { url },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  // Only ever open a page on this site, whatever the payload says.
  let target = new URL('/explore', self.location.origin);
  try {
    const candidate = new URL(event.notification.data && event.notification.data.url, self.location.origin);
    if (candidate.pathname === '/explore') target = new URL(candidate.pathname + candidate.search, self.location.origin);
  } catch { /* keep /explore */ }
  event.waitUntil(self.clients.openWindow(target.href));
});
