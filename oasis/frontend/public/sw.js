const CACHE_NAME = 'ruido-interior-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// --- FASE 1: INSTALACIÓN Y CACHÉ ---
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
});

// Interceptar peticiones: Si no hay red, sirve desde Caché
self.addEventListener('fetch', (e) => {
  // Ignoramos peticiones a la API o de extensiones
  if (e.request.url.includes('/api/') || e.request.url.startsWith('chrome-extension')) return;
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse; // Lo tenemos en caché
      }
      
      // Si no, lo bajamos de la red y lo cacheamos dinámicamente
      return fetch(e.request).then((networkResponse) => {
        // Validar respuesta (200 o 0 para recursos externos opacos)
        if (!networkResponse || (networkResponse.status !== 200 && networkResponse.status !== 0)) {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, responseToCache);
        });

        return networkResponse;
      }).catch((err) => {
        console.error('App offline y recurso no en caché:', e.request.url);
      });
    })
  );
});

// --- FASE 2: BACKGROUND SYNC (MAGIA OFFLINE) ---
self.addEventListener('sync', (e) => {
  if (e.tag === 'sync-notas') {
    console.log('⚡ Evento Sync disparado: Sincronizando notas...');
    e.waitUntil(sincronizarConServidor());
  }
});

function sincronizarConServidor() {
  return new Promise((resolve, reject) => {
    const requestDB = indexedDB.open('RuidoInteriorDB', 1);
    
    requestDB.onsuccess = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('notas_pendientes')) return resolve();
      
      const tx = db.transaction('notas_pendientes', 'readonly');
      const store = tx.objectStore('notas_pendientes');
      const requestAll = store.getAll();

      requestAll.onsuccess = async () => {
        const notas = requestAll.result;
        if (notas.length === 0) return resolve(); // No hay nada que subir

        try {
          // AQUI CONECTAS CON TU BACKEND
          const response = await fetch('/api/notas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notas })
          });

          if (response.ok) {
            // Si se subieron bien, las borramos del dispositivo local
            const limpiaTx = db.transaction('notas_pendientes', 'readwrite');
            limpiaTx.objectStore('notas_pendientes').clear();
            
            limpiaTx.oncomplete = () => {
              console.log('✅ Notas sincronizadas y eliminadas de local.');
              resolve();
            };
          } else {
            throw new Error('Fallo en el servidor');
          }
        } catch (error) {
          console.error('❌ Error al sincronizar, se reintentará luego:', error);
          reject(error); // Rechazar obliga al Service Worker a intentar de nuevo más tarde
        }
      };
    };
    
    requestDB.onerror = (e) => reject(e.target.error);
  });
}
