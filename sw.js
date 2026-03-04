const CACHE_NAME = "qmap-v2";

// Arquivos que queremos cachear (apenas locais)
const urlsToCache = [
  "/",
  "/index.html",
  "/index.css",
  "/index.js",
  "/mapa.html",
  "/mapa.js",
  "/style.css",
  "/192.png",
  "/512.png"
];

// INSTALAR
self.addEventListener("install", event => {
  console.log("Service Worker instalado");

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );

  self.skipWaiting();
});

// ATIVAR
self.addEventListener("activate", event => {
  console.log("Service Worker ativado");

  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );

  self.clients.claim();
});

// FETCH (IMPORTANTE!)
self.addEventListener("fetch", event => {

  const url = new URL(event.request.url);

  // ❌ NÃO interceptar requisições externas (Firebase, Leaflet, APIs)
  if (url.origin !== location.origin) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );

});
