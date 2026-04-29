importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

if (workbox) {
  console.log(`Workbox is loaded`);
  
  // Force adoption
  workbox.core.skipWaiting();
  workbox.core.clientsClaim();

  // Cache static assets (images, fonts, scripts)
  workbox.routing.registerRoute(
    ({request}) => ['image', 'font', 'script', 'style'].includes(request.destination),
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'static-assets',
    })
  );

  // Offline Fallback for Navigation
  workbox.routing.registerRoute(
    ({request}) => request.mode === 'navigate',
    new workbox.strategies.NetworkFirst({
      cacheName: 'pages',
    })
  );

  // NOTE: Large models (.tflite, .gguf) are stored in IndexedDB 
  // via src/lib/offline.ts to prevent Cache API eviction.
  // The SW keeps the app shell alive while the app logic handles the big brains.
} else {
  console.log(`Workbox didn't load`);
}
