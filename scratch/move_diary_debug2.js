const fs = require('fs');

const dataPath = 'c:\\Users\\Administrador\\Downloads\\oasis\\oasis\\backend\\oasis_data.json';
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const tutio = data.users.find(u => u.username === 'TUTIO');

if (tutio && tutio.clinicalData && tutio.clinicalData.oasis_canvas_nodes_TUTIO) {
    const blocks = JSON.parse(tutio.clinicalData.oasis_canvas_nodes_TUTIO);
    for (const block of blocks) {
        if (block.type === 'diary_notebook') {
            const entries = block.entries || [];
            for (const entry of entries) {
                console.log(entry.text);
            }
        }
    }
}
