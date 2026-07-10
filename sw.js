// Service Worker — داشبورد رشد روزانه
const CACHE_NAME = 'dashboard-v1';

// فایل‌هایی که باید کش بشن
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icon-512.png',
  './icon-192.png'
];

// نصب — کش اولیه
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    }).then(() => self.skipWaiting())
  );
});

// فعال‌سازی — پاک کردن کش‌های قدیمی
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// fetch — Network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // فقط GET requests رو مدیریت کن
  if (event.request.method !== 'GET') return;

  // data: URLs رو نادیده بگیر
  if (event.request.url.startsWith('data:')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // موفقیت شبکه — نسخه کش هم آپدیت کن
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(() => {
        // خطا در شبکه — از کش بخون
        return caches.match(event.request).then((cached) => {
          return cached || new Response('آفلاین هستید', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
        });
      })
  );
});