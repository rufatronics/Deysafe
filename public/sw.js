const CACHE_NAME = 'dey-safe-v1';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/tflite/tf.min.js',
  '/tflite/tf-tflite.min.js',
  '/tflite/tflite_web_api_cc.js',
  '/tflite/tflite_web_api_cc.wasm'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching App Shell');
      return cache.addAll(APP_SHELL);
    })
  );
});

self.addEventListener('fetch', (event) => {
  // We handle network-first for navigation, cache-first for assets
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Large models handled via IndexedDB in App Logic to avoid Cache API limits.
