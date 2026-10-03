// Offline support. Fresh copies come from the network whenever there is one;
// the cache is only the fallback, so a new version shows up on the next load.
const CACHE = 'chess-library-v4';
const CORE = [
  './', './index.html', './manifest.json', './icons/logo-96.png', './icons/logo-192.png',
  './app/app.css', './app/board.js', './app/pieces.js', './app/player.js', './app/rules.js', './app/store.js', './app/sync.js', './app/vendor/chess.js',
  './bobby-fischer/index.html', './bobby-fischer/book.js', './bobby-fischer/cover.jpg', './bobby-fischer/data/ch1.js', './bobby-fischer/data/ch2.js',
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const there = new URL(req.url);
  if (there.origin !== location.origin && !there.hostname.includes('fonts.g')) return;   // e.g. the sync calls
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok && (new URL(req.url).origin === location.origin || req.url.includes('fonts.g'))) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || caches.match('./index.html')))
  );
});
