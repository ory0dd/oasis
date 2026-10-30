import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Vite emits vite:preloadError when a dynamic chunk fails to load due to a new deployment
window.addEventListener('vite:preloadError', (event) => {
    console.warn('Vite preloadError detected (new deployment). Reloading page...', event);
    const key = 'oasis_chunk_reload_ts';
    const last = parseInt(sessionStorage.getItem(key) || '0', 10);
    if (Date.now() - last > 5000) {
        sessionStorage.setItem(key, Date.now().toString());
        window.location.reload();
    }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
