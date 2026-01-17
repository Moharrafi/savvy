/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST || []);

self.addEventListener('push', (event) => {
  if (!event.data) return;
  const payload = event.data.json();
  const title = payload.title || 'Savvy';
  const body = payload.body || 'Ada aktivitas tabungan baru.';
  const data = payload.data || {};

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      data,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: data?.type || 'savvy-transaction',
      renotify: true,
      requireInteraction: true,
      vibrate: [80, 40, 80],
      silent: false
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      const client = clientsArr.find((c) => c.url.includes(self.location.origin));
      if (client) {
        return client.focus();
      }
      return self.clients.openWindow('/');
    })
  );
});
