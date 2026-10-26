/* BoBo Personal OS — minimal offline shell SW */
const CACHE = 'bobo-pos-shell-v10';
const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './icons/nav/calendar.png',
  './icons/nav/course.png',
  './icons/nav/goals.png',
  './icons/nav/more.png',
  './icons/nav/today.png',
  './icons/ui/back.png',
  './icons/ui/brain.png',
  './icons/ui/check.png',
  './icons/ui/chev-left.png',
  './icons/ui/chev-right.png',
  './icons/ui/fire.png',
  './icons/ui/gear.png',
  './icons/ui/inbox.png',
  './icons/ui/link.png',
  './icons/ui/medal.png',
  './icons/ui/moon.png',
  './icons/ui/mute.png',
  './icons/ui/plus.png',
  './icons/ui/speaker.png',
  './icons/ui/sun.png',
  './icons/ui/target.png',
  './icons/ui/trash.png',
  './icons/ui/trophy.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

function isSupabase(url) {
  return url.hostname.endsWith('supabase.co');
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (isSupabase(url)) return; // never cache API

  // Network-first for navigations
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html').then((r) => r || caches.match('./')))
    );
    return;
  }

  // Same-origin shell assets: cache-first, then network
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        });
      })
    );
  }
});
