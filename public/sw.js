importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

if (workbox) {
  console.log(`Workbox is loaded`);

  // Cache images
  workbox.routing.registerRoute(
    ({request}) => request.destination === 'image',
    new workbox.strategies.CacheFirst({
      cacheName: 'images',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
        }),
      ],
    })
  );

  // Cache JS/CSS
  workbox.routing.registerRoute(
    ({request}) => request.destination === 'script' || request.destination === 'style',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'static-resources',
    })
  );

  // Cache font files
  workbox.routing.registerRoute(
    ({request}) => request.destination === 'font',
    new workbox.strategies.CacheFirst({
      cacheName: 'fonts',
    })
  );
  
  // Custom model caching is handled in IndexedDB via offline.ts, 
  // but we could also intercept fetch here if needed.
} else {
  console.log(`Workbox didn't load`);
}
