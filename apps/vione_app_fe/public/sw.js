const CACHE_NAME = "ceo1983-pwa-v2";
const STATIC_ASSETS = [
  "/manifest.webmanifest",
  "/apple-touch-icon.png",
  "/favicon.png",
  "/app-icon-192.png",
  "/ceo1983-official-logo.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        /* Continue even if some optional assets are missed */
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Không can thiệp API calls hoặc WebSocket
  if (url.pathname.startsWith("/api") || url.pathname.startsWith("/dm") || url.pathname.startsWith("/socket.io")) {
    return;
  }

  // 1. Navigation request (HTML pages): Network-First để luôn nhận phiên bản mới nhất khi deploy
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        })
        .catch(() => caches.match(request) || caches.match("/association"))
    );
    return;
  }

  // 2. Chunks JS/CSS hoặc assets: Network-First với fallback cache
  if (url.pathname.includes("/assets/") || url.pathname.includes("/_build/")) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // 3. Các assets tĩnh khác: Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === "basic") {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// 4. Background Push & Notification Click handling for Phone Lockscreen & Status Bar
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Thông báo ViOne", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "ViOne Connect";
  const options = {
    body: data.body || "Bạn có thông báo mới từ hệ sinh thái ViOne",
    icon: data.icon || "/app-icon.png",
    badge: data.badge || "/app-icon.png",
    tag: data.tag || `vione-notif-${Date.now()}`,
    data: { url: data.url || "/connect-app" },
    vibrate: data.vibrate || [200, 100, 200],
    requireInteraction: data.requireInteraction || false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/connect-app";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          if (client.url && client.url.includes(self.location.origin)) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
