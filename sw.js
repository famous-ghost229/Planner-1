// sw.js — Service Worker for پلنر سیستمی
// این فایل باید دقیقاً همین اسم رو داشته باشه و کنار index.html قرار بگیره.

// هر وقت تغییری تو اپ دادی و می‌خوای کاربرها نسخه‌ی جدید رو بگیرن،
// فقط همین عدد رو یکی زیاد کن (مثلاً v2, v3, ...)
const CACHE_NAME = "system-planner-v3";

// فایل‌هایی که باید برای کارکرد آفلاین کش بشن
const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css"
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

// ===== Push Notifications: نمایش نوتیف حتی وقتی اپ بسته هست =====
// این پیام از Cloudflare Worker (aged-leaf-7c8b.amirmansirbaghri229.workers.dev) میاد
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: "یادآوری برنامه", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "⏰ یادآوری برنامه";
  const options = {
    body: data.body || "",
    tag: data.tag || "system-planner-reminder",
    renotify: true,
    vibrate: [180, 80, 180],
    dir: "rtl",
    lang: "fa",
    data: { url: data.url || "./" }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// وقتی کاربر روی نوتیف کلیک می‌کنه، اپ رو باز کن یا بیار جلو
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "./";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
