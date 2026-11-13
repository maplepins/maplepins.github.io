/* MaplePins — Canada Parks Quest: offline shell.
   Cache-first with a background refresh (stale-while-revalidate)
   for the app shell and the map data, so the quest opens in a
   no-signal park — and still picks up new versions on the next
   launch after a deploy. Bump CACHE whenever the shell changes
   in a way that must reach installed users immediately. */
var CACHE = 'maplepins-shell-v5';
var SHELL = [
  './',
  'index.html',
  'quest.js',
  'quest.css',
  'styles.css',
  'canada-provinces.json',
  'manifest.webmanifest',
  'icon-192.png',
  'icon-512.png',
  'icon-180.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(SHELL); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  var cacheable = url.origin === self.location.origin ||
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com';
  if (!cacheable) return;
  e.respondWith(
    caches.match(e.request).then(function (hit) {
      var net = fetch(e.request).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        }
        return res;
      }).catch(function () { return hit; });
      /* Cached copy wins instantly (offline!); otherwise the
         network answer is used and cached for next time. */
      return hit || net;
    })
  );
});
