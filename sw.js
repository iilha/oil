'use strict';
const STATIC_CACHE = 'oil-static-v1';
const API_CACHE = 'oil-api-v1';
const STATIC_ASSETS = ['/','/index.html','/js/bottom-sheet.js','/manifest.webapp'];
const CDN_ASSETS = ['https://unpkg.com/leaflet@1.9.4/dist/leaflet.css', 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((cache) => {
    cache.addAll(STATIC_ASSETS).catch(e => console.warn('[SW]', e));
    return Promise.all(CDN_ASSETS.map(url => fetch(url, {mode:'cors'}).then(r => r.ok && cache.put(url, r)).catch(() => {})));
  }).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then(names => Promise.all(
    names.filter(n => n.startsWith('oil-') && n !== STATIC_CACHE && n !== API_CACHE).map(n => caches.delete(n))
  )).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  if (url.hostname.includes('overpass-api.de')) {
    event.respondWith(caches.open(STATIC_CACHE).then(async cache => {
      const cached = await cache.match(event.request);
      if (cached) return cached;
      const r = await fetch(event.request);
      if (r.ok) cache.put(event.request, r.clone());
      return r;
    }));
    return;
  }
  if (url.hostname.includes('tile.openstreetmap.org')) {
    event.respondWith(caches.open(STATIC_CACHE).then(async cache => {
      const cached = await cache.match(event.request);
      if (cached) return cached;
      const r = await fetch(event.request);
      if (r.ok) cache.put(event.request, r.clone());
      return r;
    }));
  } else if (url.origin === location.origin) {
    event.respondWith(caches.match(event.request).then(r => r || fetch(event.request)));
  }
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data && event.data.type === 'CLEAR_CACHE') caches.keys().then(names => names.forEach(n => caches.delete(n)));
});
