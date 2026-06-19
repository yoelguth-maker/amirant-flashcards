const CACHE = 'amirant-v4';
const STATIC = [
  '/amirant-flashcards/manifest.json',
  '/amirant-flashcards/icon.svg',
];
const HTML = '/amirant-flashcards/index.html';

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll([HTML, ...STATIC]))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  // מחק את כל הגרסאות הישנות
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const isHTML = url.pathname.endsWith('/') || url.pathname.endsWith('.html');

  if (isHTML) {
    // HTML — network first: תמיד נסה לטעון עדכון מהרשת, cache רק כגיבוי
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  } else {
    // קבצים סטטיים — cache first
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request))
    );
  }
});
