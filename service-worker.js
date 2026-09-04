const CACHE_NAME = "rifa-cache-v14"; // <--- CAMBIA ESTE NÚMERO (v2, v3, v4...) CADA VEZ QUE MODIFIQUES EL HTML/CSS

const ASSETS = [
  "./",
  "index.html",
  "manifest.json"
];

// 1. Instalación e intercambio rápido
self.addEventListener("install", (e) => {
  self.skipWaiting(); // Fuerza al Service Worker a activarse de inmediato
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// 2. Activación y limpieza de cachés viejas
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key); // Borra la caché de la versión anterior
          }
        })
      );
    }).then(() => self.clients.claim()) // Toma el control de las pestañas abiertas
  );
});

// 3. Estrategia Network First para HTML (intenta descargar lo nuevo, si no hay internet usa la caché)
self.addEventListener("fetch", (e) => {
  // Ignorar peticiones a la base de datos de Firebase
  if (e.request.url.includes("firebaseio.com") || e.request.url.includes("googleapis.com")) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then((networkResponse) => {
        // Si hay red, actualiza la caché con el nuevo archivo y lo entrega
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseClone));
        }
        return networkResponse;
      })
      .catch(() => {
        // Si no hay conexión (offline), usa la versión en caché
        return caches.match(e.request);
      })
  );
});
