const CACHE_NAME = 'ruido-interior-v3';
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

// Interceptar peticiones: Network First (prioridad a red), fallback a caché (offline)
self.addEventListener('fetch', (e) => {
  // Ignoramos peticiones a la API o de extensiones
  if (e.request.url.includes('/api/') || e.request.url.startsWith('chrome-extension')) return;
  if (e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request).then((networkResponse) => {
      // Guardar una copia en caché de respuestas válidas
      if (networkResponse && networkResponse.status === 200) {
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, responseToCache);
        });
      }
      return networkResponse;
    }).catch(() => {
      // Si la red falla (offline), buscamos en caché
      return caches.match(e.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        // Opcional: podrías retornar una página offline aquí si lo deseas
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
  if (e.tag === 'sync-blocks') {
    console.log('⚡ Evento Sync disparado: Sincronizando blocks...');
    e.waitUntil(sincronizarBlocksConServidor());
  }
});

function sincronizarConServidor() {
  return new Promise((resolve, reject) => {
    const requestDB = indexedDB.open('RuidoInteriorDB', 2);
    
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
          const response = await fetch('/api/notas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notas })
          });

          if (response.ok) {
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
          reject(error);
        }
      };
    };
    
    requestDB.onerror = (e) => reject(e.target.error);
  });
}

function sincronizarBlocksConServidor() {
  return new Promise((resolve, reject) => {
    const requestDB = indexedDB.open('RuidoInteriorDB', 2);
    
    requestDB.onsuccess = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('blocks_pendientes')) return resolve();
      
      const tx = db.transaction('blocks_pendientes', 'readonly');
      const store = tx.objectStore('blocks_pendientes');
      const requestAll = store.getAll();

      requestAll.onsuccess = async () => {
        const usersBlocks = requestAll.result;
        if (usersBlocks.length === 0) return resolve(); 

        try {
          // Send all pending block sets sequentially
          for (const pending of usersBlocks) {
            const response = await fetch(`http://localhost:5046/api/oasis/blocks?user=${pending.user}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(pending.blocks)
            });

            if (!response.ok) {
              throw new Error('Fallo en el servidor de bloques');
            }
          }

          // If all uploads ok, clear store
          const limpiaTx = db.transaction('blocks_pendientes', 'readwrite');
          limpiaTx.objectStore('blocks_pendientes').clear();
          
          limpiaTx.oncomplete = () => {
            console.log('✅ Blocks sincronizados y eliminados de local.');
            resolve();
          };
        } catch (error) {
          console.error('❌ Error al sincronizar blocks:', error);
          reject(error); 
        }
      };
    };
    
    requestDB.onerror = (e) => reject(e.target.error);
  });
}
