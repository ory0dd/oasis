const DB_NAME = 'oasis_clinical_db';
const DB_VERSION = 1;
const STORE_NAME = 'observations';

export function initDb() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
    });
}

export async function saveObservation(session) {
    const db = await initDb();
    
    // Auto-sync videos to server backend if present
    if (session && session.videos && Object.keys(session.videos).length > 0) {
        const username = session.username || localStorage.getItem('oasis_user');
        if (username) {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5046';
            const updatedVideos = { ...session.videos };
            let hasUploads = false;

            for (const [key, val] of Object.entries(session.videos)) {
                if (val instanceof Blob) {
                    try {
                        const formData = new FormData();
                        formData.append('file', val, `video_${key}.webm`);
                        const res = await fetch(`${API_URL}/api/oasis/upload`, {
                            method: 'POST',
                            body: formData
                        });
                        if (res.ok) {
                            const data = await res.json();
                            if (data.url) {
                                updatedVideos[key] = data.url; // Use server URL string
                                hasUploads = true;
                            }
                        }
                    } catch (e) {
                        console.error(`Error uploading video ${key} to server:`, e);
                    }
                } else if (typeof val === 'string') {
                    // Already a URL string
                    updatedVideos[key] = val;
                }
            }

            if (hasUploads) {
                // Update session object with server URLs
                session.videos = updatedVideos;

                // Sync the session object to server ClinicalData
                const payloadKey = `oasis_session_videos_${session.id}`;
                const payloadValue = JSON.stringify(session);
                try {
                    await fetch(`${API_URL}/api/oasis/clinical-data?user=${username}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ [payloadKey]: payloadValue })
                    });
                } catch (e) {
                    console.error("Error syncing session videos metadata to server:", e);
                }
            }
        }
    }

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(session);
        
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
    });
}

export async function getObservations() {
    const db = await initDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
}

export async function deleteObservation(id) {
    const db = await initDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);
        
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
    });
}
