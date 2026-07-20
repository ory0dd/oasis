// Configuración de la base de datos local
const DB_NAME = 'RuidoInteriorDB';
const STORE_NAME = 'notas_pendientes';
const BLOCKS_STORE = 'blocks_pendientes';

// Iniciar base de datos
function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2); // Bump version to 2
    
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(BLOCKS_STORE)) {
        db.createObjectStore(BLOCKS_STORE, { keyPath: 'user' });
      }
    };
    
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

// Guardar una nota localmente
async function guardarNotaLocal(nota) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.add(nota);
    
    request.onsuccess = () => resolve();
    request.onerror = (e) => reject(e.target.error);
  });
}

// Guardar bloques completos localmente
async function guardarBlocksLocales(user, blocks) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BLOCKS_STORE, 'readwrite');
    const store = tx.objectStore(BLOCKS_STORE);
    const request = store.put({ user, blocks, timestamp: Date.now() });
    
    request.onsuccess = () => resolve();
    request.onerror = (e) => reject(e.target.error);
  });
}

// Guardar la URL del API activa para el Service Worker
async function guardarApiUrl(apiUrl) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BLOCKS_STORE, 'readwrite');
    const store = tx.objectStore(BLOCKS_STORE);
    const request = store.put({ user: 'config_api_url', apiUrl });
    
    request.onsuccess = () => resolve();
    request.onerror = (e) => reject(e.target.error);
  });
}

window.guardarNotaLocal = guardarNotaLocal;
window.guardarBlocksLocales = guardarBlocksLocales;
window.guardarApiUrl = guardarApiUrl;
window.initDB = initDB;
