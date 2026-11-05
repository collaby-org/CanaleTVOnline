// ── Zero-Cache Service Worker (Push Notifications Only) ───────────────────────
self.addEventListener('install', () => {
  self.skipWaiting();
});

// ── Activate: delete ALL existing browser caches immediately ──────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
  );
  self.clients.claim();
});

// No fetch interception — all requests go directly to the network without SW caching.

// ── Push notifications ───────────────────────────────────────────────────────
self.addEventListener('push', event => {
  if (!event.data) return;
  let data;
  try { data = event.data.json(); } catch { data = { title: 'CanaleTV Live', body: event.data.text() }; }
  event.waitUntil(
    self.registration.showNotification(data.title || 'CanaleTV Live', {
      body: data.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: data.url ? { url: data.url } : undefined,
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.notification.data?.url) {
    event.waitUntil(clients.openWindow(event.notification.data.url));
  }
});
