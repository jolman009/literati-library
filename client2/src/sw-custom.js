// src/sw-custom.js
// Custom service worker: Workbox precaching + push notification handlers

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, NetworkOnly, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { skipWaiting, clientsClaim } from 'workbox-core';

// Activate immediately on install
skipWaiting();
clientsClaim();

// Precache all Vite-generated assets (injected by vite-plugin-pwa)
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// ─── Runtime caching rules (replicated from vite.config.mjs) ───

const API_HOST = 'library-server-m6gr.onrender.com';

// 1. Auth/cookie-protected backend calls must never be cached.
// This avoids serving stale auth responses via SW and preserves cookie-based flows.
registerRoute(
  ({ request, url }) => {
    const isBackendHost = url.hostname === API_HOST;
    const isAuthPath = url.pathname.startsWith('/auth/') || url.pathname.startsWith('/api/auth/');
    const hasAuthHeader = request.headers.has('authorization');
    const usesCookies = request.credentials === 'include';
    return isBackendHost && (isAuthPath || hasAuthHeader || usesCookies);
  },
  new NetworkOnly()
);

// 2. Public API calls only (NetworkFirst, 24h).
// Excludes auth/credentialed traffic to prevent identity/session issues.
registerRoute(
  ({ request, url }) => {
    const isApi = url.pathname.startsWith('/api/') || url.hostname === API_HOST;
    const isAuthPath = url.pathname.startsWith('/auth/') || url.pathname.startsWith('/api/auth/');
    const hasAuthHeader = request.headers.has('authorization');
    const usesCookies = request.credentials === 'include';
    return request.method === 'GET' && isApi && !isAuthPath && !hasAuthHeader && !usesCookies;
  },
  new NetworkFirst({
    cacheName: 'literati-api-cache',
    networkTimeoutSeconds: 10,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 }),
    ],
  })
);

// 3. Book files — PDFs and EPUBs (CacheFirst, 30 days)
registerRoute(
  ({ url }) =>
    url.pathname.includes('.pdf') ||
    url.pathname.includes('.epub') ||
    url.hostname.includes('supabase.co'),
  new CacheFirst({
    cacheName: 'literati-books-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 }),
    ],
  })
);

// 4. Images (StaleWhileRevalidate, 14 days)
registerRoute(
  ({ request, url }) =>
    request.destination === 'image' ||
    url.hostname.includes('covers.openlibrary.org') ||
    url.hostname.includes('picsum.photos') ||
    url.pathname.includes('/covers/'),
  new StaleWhileRevalidate({
    cacheName: 'literati-images-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 14 }),
    ],
  })
);

// 5. Google Fonts + Material Icons (CacheFirst, 1 year)
registerRoute(
  ({ url }) => url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'literati-fonts-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 }),
    ],
  })
);

// 6. Static assets — JS/CSS/Workers (StaleWhileRevalidate, 30 days)
registerRoute(
  ({ request }) => ['style', 'script', 'worker'].includes(request.destination),
  new StaleWhileRevalidate({
    cacheName: 'literati-assets-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 }),
    ],
  })
);

// ─── Push notification handlers ───

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'ShelfQuest', body: event.data.text() };
  }

  const options = {
    body: payload.body || '',
    icon: payload.icon || '/literatiLOGO.png',
    badge: payload.badge || '/favicon-96x96.png',
    data: payload.data || {},
    vibrate: [100, 50, 100],
    tag: payload.data?.type || 'shelfquest',
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(payload.title || 'ShelfQuest', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If we already have a ShelfQuest tab, focus it and navigate
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin)) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      // Otherwise open a new window
      return self.clients.openWindow(url);
    })
  );
});
