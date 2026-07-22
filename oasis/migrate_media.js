const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://mxxasrhqwzpbcuzglzif.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14eGFzcmhxd3pwYmN1emdsemlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MzI1MDYsImV4cCI6MjA5NTMwODUwNn0.ik5fjXrvdywciGwjCT0qQvoVxdWMyx0jYLnXXx9ljNQ';
const supabase = createClient(supabaseUrl, supabaseKey);

const uploadsDir = path.join(__dirname, '../backend/wwwroot/uploads');

async function migrateMedia() {
    if (!fs.existsSync(uploadsDir)) {
        console.log("No se encontró el directorio de uploads local.");
        return;
    }

    const files = fs.readdirSync(uploadsDir);
    console.log(`Encontrados ${files.length} archivos para migrar a Supabase Storage...`);

    for (const file of files) {
        const filePath = path.join(uploadsDir, file);
        const fileExt = path.extname(file).toLowerCase();

        // Ignorar archivos que no sean multimedia
        if (!['.mp4', '.jpg', '.png', '.jpeg', '.webm', '.ogg', '.wav'].includes(fileExt)) continue;

        const fileBuffer = fs.readFileSync(filePath);
        const contentType = fileExt === '.mp4' ? 'video/mp4' : (fileExt.includes('jpg') || fileExt.includes('jpeg') ? 'image/jpeg' : 'image/png');

        console.log(`Subiendo ${file}...`);
        const { data, error } = await supabase.storage
            .from('oasis-media')
            .upload(file, fileBuffer, {
                contentType,
                upsert: true
            });

        if (error) {
            console.error(`Error al subir ${file}:`, error.message);
        } else {
            console.log(`✅ Subido con éxito: ${file}`);
        }
    }

    console.log("¡MIGRACIÓN DE MEDIOS COMPLETADA!");
}

migrateMedia();
