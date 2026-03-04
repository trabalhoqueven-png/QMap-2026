const CACHE_NAME = "qmap-v1";

const urlsToCache = [
  "/",
  "/index.html",
  "/index.css",
  "/index.js",
  "/192.png",
  "/512.png"
];

self.addEventListener("install", event => {
  console.log("Service Worker Instalado");
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});


