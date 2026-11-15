const CACHE = "maskan-v2";
const ASSETS = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const okHost = url.origin === location.origin || /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!okHost) return;
  // Pages : réseau d'abord, sinon la copie en cache (fonctionne hors ligne)
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then(r => { caches.open(CACHE).then(c => c.put("index.html", r.clone())); return r; })
        .catch(() => caches.match("index.html"))
    );
    return;
  }
  // Autres fichiers : cache puis mise à jour en arrière-plan
  e.respondWith(
    caches.match(req).then(hit => {
      const net = fetch(req).then(r => { if (r.ok) caches.open(CACHE).then(c => c.put(req, r.clone())); return r; }).catch(() => hit);
      return hit || net;
    })
  );
});
