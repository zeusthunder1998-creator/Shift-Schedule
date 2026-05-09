const CACHE = 'shift-schedule-v1';
const ASSETS = ['/', '/index.html'];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(c) {
      return c.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k) { return k !== CACHE; }).map(function(k) { return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  // Only cache GET requests for same origin
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('/api/')) return;

  e.respondWith(
    fetch(e.request).then(function(res) {
      var clone = res.clone();
      caches.open(CACHE).then(function(c) { c.put(e.request, clone); });
      return res;
    }).catch(function() {
      return caches.match(e.request);
    })
  );
});

// Push notification handler
self.addEventListener('push', function(e) {
  var data = e.data ? e.data.json() : { title: 'Shift Schedule', body: 'New notification' };
  e.waitUntil(
    self.registration.showNotification(data.title || 'Shift Schedule', {
      body: data.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-48.png'
    })
  );
});
