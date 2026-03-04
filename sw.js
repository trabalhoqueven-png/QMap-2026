const CACHE_NAME = "qmap-v2";

self.addEventListener("install", event => {
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

// ❌ NÃO interceptar requisições externas (Firebase, Leaflet etc)
self.addEventListener("fetch", event => {

  const url = new URL(event.request.url);

  // Se for requisição externa, deixa passar direto
  if (url.origin !== location.origin) {
    return;
  }

  event.respondWith(fetch(event.request));

});
