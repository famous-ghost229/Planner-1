// sw.js — Service Worker for پلنر سیستمی
// این فایل باید دقیقاً همین اسم رو داشته باشه و کنار index.html قرار بگیره.

// هر وقت تغییری تو اپ دادی و می‌خوای کاربرها نسخه‌ی جدید رو بگیرن،
// فقط همین عدد رو یکی زیاد کن (مثلاً v2, v3, ...)
const CACHE_NAME = "system-planner-v1";

// فایل‌هایی که باید برای کارکرد آفلاین کش بشن
const APP_SHELL = [
  "./",
  "./index.html"
];

// مرحله نصب: فایل‌های اصلی اپ رو کش می‌کنه
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// مرحله فعال‌سازی: نسخه‌های قدیمی کش رو پاک می‌کنه
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// مرحله fetch: اول از شبکه امتحان می‌کنه، اگه نبود از کش میاره (کار آفلاین)
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match("./index.html")))
  );
});
