// Offline support: app files are cached; the network is tried first so updates arrive quickly.
const CACHE = 'tala-v1';
const FILES = [
  './', 'index.html', 'css/app.css', 'manifest.webmanifest', 'icons/icon-192.png',
  'js/app.js', 'js/content.js', 'js/store.js', 'js/cloud.js', 'js/config.js',
  'js/exercises.js', 'js/speech.js', 'js/i18n.js', 'js/greet.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.hostname.endsWith('supabase.co')) return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
