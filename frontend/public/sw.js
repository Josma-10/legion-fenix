const CACHE_NAME = 'legion-fenix-app-v2';

self.addEventListener('install', (event) => {
  // Activación inmediata y ultra-ligera (sin bloquear en archivos pesados)
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.add('/icons/icon-192.png'))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Solo maneja navegación principal en modo network-first con respaldo offline ligero
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Nunca interceptar API, manifest, iconos ni el propio Service Worker
  if (
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/api') ||
    url.pathname === '/manifest.json' ||
    url.pathname === '/sw.js' ||
    url.pathname.startsWith('/icons/')
  ) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(request).then((res) => res || caches.match('/')))
    );
  }
});
