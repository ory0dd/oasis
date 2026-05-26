const btnGuardar = document.getElementById('btnGuardar');
const tituloNota = document.getElementById('tituloNota');
const contenidoNota = document.getElementById('contenidoNota');

if (btnGuardar) {
  btnGuardar.addEventListener('click', async () => {
    const nota = {
      titulo: tituloNota.value,
      contenido: contenidoNota.value,
      fecha: new Date().toISOString()
    };

    if (!nota.titulo || !nota.contenido) return alert('Llena los campos');

    try {
      // 1. Guardar siempre en local primero
      await guardarNotaLocal(nota);
      console.log('📝 Nota guardada en IndexedDB');
      
      // Limpiar UI
      tituloNota.value = '';
      contenidoNota.value = '';

      // 2. Solicitar sincronización en segundo plano
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        const reg = await navigator.serviceWorker.ready;
        await reg.sync.register('sync-notas');
        console.log('🔄 Background Sync registrado');
      } else {
        // Fallback para navegadores que no soportan Background Sync
        console.log('⚠️ Background Sync no soportado, subiendo nota manualmente...');
        // Aquí llamarías a tu función de subida directa
      }
    } catch (error) {
      console.error('Error al procesar la nota:', error);
    }
  });
}

// Opcional: Mostrar al usuario si está online/offline
const estadoConexion = document.getElementById('estadoConexion');
if (estadoConexion) {
  window.addEventListener('online', () => estadoConexion.innerText = '🟢 Online');
  window.addEventListener('offline', () => estadoConexion.innerText = '🔴 Offline');
}
