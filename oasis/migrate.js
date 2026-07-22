const fs = require('fs');
const path = require('path');
const https = require('https');

const supabaseUrl = 'https://mxxasrhqwzpbcuzglzif.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14eGFzcmhxd3pwYmN1emdsemlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MzI1MDYsImV4cCI6MjA5NTMwODUwNn0.ik5fjXrvdywciGwjCT0qQvoVxdWMyx0jYLnXXx9ljNQ';
const bucket = 'oasis-media';

const uploadsDir = path.join(__dirname, 'backend', 'wwwroot', 'uploads');

async function migrate() {
    console.log(`Buscando archivos en: ${uploadsDir}`);
    if (!fs.existsSync(uploadsDir)) {
        console.log('No se encontró la carpeta uploads.');
        return;
    }

    const files = fs.readdirSync(uploadsDir);
    console.log(`Encontrados ${files.length} archivos para subir a Supabase.`);

    for (const file of files) {
        const filePath = path.join(uploadsDir, file);
        const stats = fs.statSync(filePath);
        if (stats.isFile()) {
            console.log(`Subiendo: ${file}...`);
            const fileData = fs.readFileSync(filePath);
            
            // Determinar Content-Type
            let contentType = 'application/octet-stream';
            if (file.endsWith('.jpg') || file.endsWith('.jpeg')) contentType = 'image/jpeg';
            else if (file.endsWith('.png')) contentType = 'image/png';
            else if (file.endsWith('.gif')) contentType = 'image/gif';
            else if (file.endsWith('.mp4')) contentType = 'video/mp4';
            else if (file.endsWith('.webm')) contentType = 'video/webm';
            else if (file.endsWith('.wav')) contentType = 'audio/wav';
            else if (file.endsWith('.mp3')) contentType = 'audio/mpeg';

            try {
                const response = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${file}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${supabaseKey}`,
                        'apikey': supabaseKey,
                        'Content-Type': contentType,
                        'x-upsert': 'true' // sobreescribir si ya existe
                    },
                    body: fileData
                });

                if (response.ok) {
                    console.log(`✅ Éxito: ${file}`);
                } else {
                    const err = await response.text();
                    console.error(`❌ Error al subir ${file}: ${response.status} - ${err}`);
                }
            } catch (err) {
                console.error(`❌ Error al subir ${file}: ${err.message}`);
            }
        }
    }

    console.log('¡Migración completada! Ahora actualizando oasis_data.json...');
    const dataPath = path.join(__dirname, 'backend', 'oasis_data.json');
    if (fs.existsSync(dataPath)) {
        let dbContent = fs.readFileSync(dataPath, 'utf8');
        // El servidor actual en OasisController hace un proxy si la ruta es /uploads/
        // Pero es mejor cambiar todo a la URL de Supabase directamente
        // dbContent = dbContent.replace(/\/uploads\//g, `${supabaseUrl}/storage/v1/object/public/${bucket}/`);
        // O podriamos no cambiar el DB y hacer que el backend intercepte /uploads/
        // y devuelva un redirect a supabase o construya la URL en el frontend
        console.log('Para evitar errores en la base de datos, mantendremos las rutas de la BD como /uploads/');
        console.log('Modificaremos App.jsx para que resuelva /uploads/ usando Supabase directamente.');
    }
}

migrate();
