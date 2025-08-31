if (typeof self === 'undefined') {
  // Not in a service-worker context, so we're done.
} else if (process.env.NODE_ENV === 'development') {
  // In development, we're not going to cache anything.
} else {
  // In production, we're going to cache the world.
  const cacheName = 'localhost-pwa-cache-v1';

  self.addEventListener('install', (event) => {
    event.waitUntil(
      caches.open(cacheName).then((cache) => {
        return cache.addAll([
          '/',
          '/chatroom',
          '/profile',
          '/projects'
          // Add other important assets here.
          // Be careful not to cache too much, as it can slow down the initial install.
        ]);
      })
    );
  });

  self.addEventListener('fetch', (event) => {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  });
}
