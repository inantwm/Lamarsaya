// =====================================================
// LamarSaya — Service Worker v1.0
// Handles caching & offline support
// =====================================================

const CACHE_NAME = 'lamarsaya-v1';
const OFFLINE_URL = './index.html';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js',
  'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js',
  'https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js',
];

// ── Install: pre-cache semua aset penting ──────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching aset...');
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Beberapa aset gagal di-cache:', err);
      });
    })
  );
  self.skipWaiting();
});

// ── Activate: hapus cache lama ─────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Menghapus cache lama:', name);
            return caches.delete(name);
          })
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: strategi Cache-first, fallback ke network ──
self.addEventListener('fetch', (event) => {
  // Abaikan request non-GET
  if (event.request.method !== 'GET') return;

  // Abaikan chrome-extension requests
  if (event.request.url.startsWith('chrome-extension://')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Perbarui cache di background (stale-while-revalidate)
        fetchAndUpdate(event.request);
        return cachedResponse;
      }

      // Tidak ada di cache, ambil dari network
      return fetch(event.request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type !== 'opaque'
          ) {
            const cloned = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) =>
              cache.put(event.request, cloned)
            );
          }
          return networkResponse;
        })
        .catch(() => {
          // Offline fallback
          if (event.request.destination === 'document') {
            return caches.match(OFFLINE_URL);
          }
        });
    })
  );
});

function fetchAndUpdate(request) {
  fetch(request)
    .then((response) => {
      if (response && response.status === 200) {
        caches.open(CACHE_NAME).then((cache) =>
          cache.put(request, response)
        );
      }
    })
    .catch(() => {});
}
