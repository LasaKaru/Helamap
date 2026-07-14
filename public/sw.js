/*
 * HelaMap service worker — offline-first PWA.
 *
 * Strategy:
 *  - map-data.json  → network-first (always try for fresh data), cache fallback
 *  - everything else (app shell, JS/CSS, floor plans, photos) → cache-first,
 *    then network, caching successful responses as they stream in.
 *
 * Bump CACHE_VERSION when you want to force clients to refetch everything.
 */
const CACHE_VERSION = 'helamap-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Live map data: network first so edits publish instantly, cache for offline.
  if (url.pathname.endsWith('/data/map-data.json')) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(url.pathname, copy));
          return res;
        })
        .catch(() => caches.match(url.pathname)),
    );
    return;
  }

  // App shell & assets: cache first for instant, offline-friendly loads.
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((res) => {
          if (res.ok && (res.type === 'basic' || res.type === 'default')) {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(request, copy));
          }
          return res;
        }),
    ),
  );
});
