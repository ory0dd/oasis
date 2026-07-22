const fs = require('fs');

const dataPath = 'c:\\Users\\Administrador\\Downloads\\oasis\\oasis\\backend\\oasis_data.json';
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const vacio1 = data.users.find(u => u.username === 'vacio1');
const tutio = data.users.find(u => u.username === 'TUTIO');

if (!vacio1 || !vacio1.clinicalData || !vacio1.clinicalData.oasis_canvas_nodes_vacio1) {
    console.log("No se encontraron los datos de vacio1");
    process.exit(1);
}

if (!tutio) {
    console.log("No se encontró el usuario tutio");
    process.exit(1);
}

let vacioBlocks = [];
try {
    vacioBlocks = JSON.parse(vacio1.clinicalData.oasis_canvas_nodes_vacio1);
} catch (e) {
    console.log("Error parseando bloques de vacio1");
    process.exit(1);
}

let foundEntry = null;

for (const block of vacioBlocks) {
    if (block.type === 'diary_notebook') {
        if (block.entries && block.entries.length > 0) {
            for (let i = 0; i < block.entries.length; i++) {
                const entry = block.entries[i];
                if (entry.text && entry.text.includes("💖") && entry.text.includes("Siento duda")) {
                    foundEntry = entry;
                    block.entries.splice(i, 1);
                    break;
                }
            }
        }
    }
    if (foundEntry) break;
}

if (!foundEntry) {
    console.log("No se encontró la entrada 'Siento duda' en los bloques de vacio1");
    process.exit(1);
}

console.log("Encontrada:", foundEntry.text.substring(0, 50) + "...");

// Guardar de vuelta en vacio1
vacio1.clinicalData.oasis_canvas_nodes_vacio1 = JSON.stringify(vacioBlocks);

// Extraer bloques de tutio
let tutioBlocks = [];
if (tutio.clinicalData && tutio.clinicalData.oasis_canvas_nodes_TUTIO) {
    tutioBlocks = JSON.parse(tutio.clinicalData.oasis_canvas_nodes_TUTIO);
}

let tutioDiary = tutioBlocks.find(b => b.type === 'diary_notebook');
if (!tutioDiary) {
    tutioDiary = {
        id: `anchor-diary-${Date.now()}`,
        type: 'diary_notebook',
        x: -700,
        y: -350,
        content: '',
        rotation: 0,
        color: '#f59e0b',
        isPublic: false,
        caption: 'Diario Personal',
        username: 'TUTIO',
        timestamp: new Date().toISOString(),
        metadata: {},
        canvasId: 'canvas_default',
        entries: []
    };
    tutioBlocks.push(tutioDiary);
}

if (!tutioDiary.entries) tutioDiary.entries = [];
tutioDiary.entries.push(foundEntry);

if (!tutio.clinicalData) tutio.clinicalData = {};
tutio.clinicalData.oasis_canvas_nodes_TUTIO = JSON.stringify(tutioBlocks);

// Guardarlo también en u.Blocks del backend para que fetchLatest funcione
if (vacio1.blocks) {
    const vBlock = vacio1.blocks.find(b => b.Type === 'diary_notebook' || b.type === 'diary_notebook');
    if (vBlock && (vBlock.entries || vBlock.Entries)) {
        const vEntries = vBlock.entries || vBlock.Entries;
        const vIdx = vEntries.findIndex(e => e.text && e.text.includes("💖"));
        if (vIdx > -1) vEntries.splice(vIdx, 1);
    }
}
if (!tutio.blocks) tutio.blocks = [];
let tBlock = tutio.blocks.find(b => b.Type === 'diary_notebook' || b.type === 'diary_notebook');
if (!tBlock) {
    tBlock = {
        Id: tutioDiary.id,
        Type: 'diary_notebook',
        X: -700,
        Y: -350,
        Content: '',
        Color: '#f59e0b',
        Username: 'TUTIO',
        CanvasId: 'canvas_default',
        Entries: []
    };
    tutio.blocks.push(tBlock);
}
if (!tBlock.Entries) tBlock.Entries = [];
tBlock.Entries.push(foundEntry);

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
console.log("Migración completada.");
