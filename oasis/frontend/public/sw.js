const CACHE_NAME = 'ruido-interior-v4';
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
// Soporta peticiones parciales (Range Requests) para que los videos/audios carguen offline en iOS Safari.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  const url = e.request.url;
  // Ignoramos peticiones a la API o de extensiones
  if (url.includes('/api/') || url.startsWith('chrome-extension')) return;

  // Detectar si es un video, audio o archivo en la carpeta uploads
  const isMedia = url.match(/\.(mp4|webm|ogg|mp3|wav|mov)$/i) || url.includes('/uploads/');

  if (isMedia) {
    e.respondWith(handleMediaRequest(e.request));
  } else {
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
        });
      })
    );
  }
});

// Manejo especial de videos y audios offline (Range Requests)
async function handleMediaRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  // Creamos una petición limpia sin la cabecera Range para usar como llave en caché
  const cleanHeaders = new Headers(request.headers);
  cleanHeaders.delete('Range');
  const cleanRequest = new Request(request.url, {
    method: 'GET',
    headers: cleanHeaders,
    mode: request.mode === 'navigate' ? 'cors' : request.mode,
    credentials: request.credentials
  });

  const cachedResponse = await cache.match(cleanRequest);

  if (cachedResponse) {
    return returnRangeResponse(request, cachedResponse);
  }

  try {
    const networkResponse = await fetch(cleanRequest);
    if (networkResponse && networkResponse.status === 200) {
      await cache.put(cleanRequest, networkResponse.clone());
      return returnRangeResponse(request, networkResponse);
    }
    return fetch(request);
  } catch (err) {
    console.warn('Fallo de red al solicitar multimedia, buscando en caché sin cabecera limpia...', err);
    const fallbackResponse = await cache.match(request);
    if (fallbackResponse) {
      return returnRangeResponse(request, fallbackResponse);
    }
    return new Response('', { status: 404, statusText: 'Offline y sin caché' });
  }
}

async function returnRangeResponse(request, response) {
  const rangeHeader = request.headers.get('Range');
  if (!rangeHeader) {
    return response;
  }

  try {
    const arrayBuffer = await response.clone().arrayBuffer();
    const bytes = rangeHeader.replace(/bytes=/, '').split('-');
    const start = parseInt(bytes[0], 10);
    const end = bytes[1] ? parseInt(bytes[1], 10) : arrayBuffer.byteLength - 1;

    const slicedBuffer = arrayBuffer.slice(start, end + 1);
    const newHeaders = new Headers(response.headers);
    newHeaders.set('Content-Range', `bytes ${start}-${end}/${arrayBuffer.byteLength}`);
    newHeaders.set('Content-Length', slicedBuffer.byteLength);
    newHeaders.set('Accept-Ranges', 'bytes');

    return new Response(slicedBuffer, {
      status: 206,
      statusText: 'Partial Content',
      headers: newHeaders
    });
  } catch (err) {
    console.error("Error al procesar Range Request:", err);
    return response; // Fallback
  }
}

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
        const results = requestAll.result;
        if (results.length === 0) return resolve(); 

        // Buscar URL del API de configuración o usar fallback
        const configItem = results.find(item => item.user === 'config_api_url');
        const apiBaseUrl = configItem ? configItem.apiUrl : 'http://localhost:5046';

        // Filtrar bloques reales de usuarios
        const usersBlocks = results.filter(item => item.user !== 'config_api_url');
        if (usersBlocks.length === 0) return resolve();

        try {
          // Send all pending block sets sequentially
          for (const pending of usersBlocks) {
            const response = await fetch(`${apiBaseUrl}/api/oasis/blocks?user=${pending.user}`, {
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
          const pendingStore = limpiaTx.objectStore('blocks_pendientes');
          
          // Borrar todos excepto la URL de configuración
          for (const pending of usersBlocks) {
            pendingStore.delete(pending.user);
          }
          
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
