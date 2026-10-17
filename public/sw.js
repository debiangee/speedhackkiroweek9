/* Migration worker: invalidate legacy unbounded caches. Forecasts and radar are
 * network-only; bounded, timestamped forecast storage belongs to the application.
 * A future offline shell must be revisioned and tested before enabling caching. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key === 'ulanba-v1' || key.startsWith('weather-lang-')).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
// Intentionally no fetch interception, including third-party traffic.
