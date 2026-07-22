const fs = require('fs');

const dataPath = 'c:\\Users\\Administrador\\Downloads\\oasis\\oasis\\backend\\oasis_data.json';
const dataStr = fs.readFileSync(dataPath, 'utf8');
const data = JSON.parse(dataStr);

const vacio1 = data.users.find(u => u.username.toLowerCase() === 'vacio1');
const tutio = data.users.find(u => u.username.toLowerCase() === 'tutio');

if (!vacio1 || !tutio) {
    console.error("No se encontraron los usuarios vacio1 o tutio");
    process.exit(1);
}

let foundEntry = null;
let foundBlock = null;

// Buscar la entrada en vacio1
for (const block of vacio1.blocks) {
    if (block.type === 'diary_notebook' || block.Type === 'diary_notebook') {
        const entries = block.entries || block.Entries;
        if (entries) {
            for (let i = 0; i < entries.length; i++) {
                const entry = entries[i];
                if (entry.text && entry.text.includes("Siento duda, ") && entry.text.includes("bonita, inteligente")) {
                    foundEntry = entry;
                    entries.splice(i, 1);
                    foundBlock = block;
                    break;
                }
            }
        }
    }
    if (foundEntry) break;
}

if (!foundEntry) {
    console.error("No se encontró la entrada de diario en vacio1");
    process.exit(1);
}

console.log("Entrada encontrada en vacio1:", foundEntry.text);

// Añadir la entrada a tutio
let tutioDiary = tutio.Blocks.find(b => b.type === 'diary_notebook' || b.Type === 'diary_notebook');
if (!tutioDiary) {
    // Crear un bloque de diario para tutio si no tiene
    tutioDiary = {
        Id: `anchor-diary-${Date.now()}`,
        Type: 'diary_notebook',
        X: -700,
        Y: -350,
        Content: '',
        Rotation: 0,
        Color: '#f59e0b',
        IsPublic: false,
        Caption: 'Diario Personal',
        Username: tutio.Username,
        Timestamp: new Date().toISOString(),
        Metadata: {},
        CanvasId: 'canvas_default',
        Entries: []
    };
    tutio.Blocks.push(tutioDiary);
}

if (!tutioDiary.Entries) tutioDiary.Entries = [];
if (!tutioDiary.entries) tutioDiary.entries = tutioDiary.Entries; // alias para compatibilidad

tutioDiary.entries.push(foundEntry);
tutioDiary.Entries = tutioDiary.entries; // sync if needed

// Write back to file
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
console.log("Migración completada con éxito.");
