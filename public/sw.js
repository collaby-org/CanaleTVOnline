/* Canale TV Online — Service Worker (§11 Zero-Cache)
 * Strategia Zero-Cache:
 *  - NU folosește CacheStorage (fără cache.add / cache.addAll / caches.open pentru răspunsuri)
 *  - NU interceptează fetch pentru a servi din cache; toate cererile merg la rețea
 *  - Handlerul fetch este no-op (pass-through): răspunsurile vin mereu de la rețea
 *  - La activare, șterge orice cache-uri vechi lăsate de versiuni anterioare
 *  - skipWaiting + clients.claim pentru actualizare imediată
 */
const VERSION = 'v1';

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Zero-Cache: curăță orice cache vechi, nu crea niciunul nou
      if ('caches' in self) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', () => {
  // Zero-Cache: no-op — lasă browserul să facă fetch normal de la rețea.
  // Nu se apelează event.respondWith(), deci nu se servește niciodată din cache.
});
