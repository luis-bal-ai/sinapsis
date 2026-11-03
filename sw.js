// Sinapsis: funciona sin conexión.
// La página siempre intenta bajarse la versión nueva y, si no hay internet, usa la guardada.
const CACHE = "sinapsis-v6";
const BASE = ["./", "index.html", "manifest.json", "apple-touch-icon.png", "icon-192.png", "icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // La app: primero internet (para recibir actualizaciones), si falla, la copia guardada.
  if (req.mode === "navigate" || (url.origin === location.origin && url.pathname.endsWith(".html"))) {
    e.respondWith(
      fetch(req).then(res => {
        const copia = res.clone();
        caches.open(CACHE).then(c => c.put("index.html", copia));
        return res;
      }).catch(() => caches.match("index.html").then(r => r || caches.match("./")))
    );
    return;
  }

  // Iconos, tipografías y la librería de la cuenta: lo guardado primero (cargan al instante) y se refresca en segundo plano.
  if (url.origin === location.origin || url.hostname.endsWith("fonts.googleapis.com") || url.hostname.endsWith("fonts.gstatic.com") || url.hostname === "cdn.jsdelivr.net") {
    e.respondWith(
      caches.match(req).then(guardado => {
        const red = fetch(req).then(res => {
          if (res && (res.ok || res.type === "opaque")) { const copia = res.clone(); caches.open(CACHE).then(c => c.put(req, copia)); }
          return res;
        }).catch(() => guardado);
        return guardado || red;
      })
    );
  }
});
