const fs = require('fs');

const dataPath = 'c:\\Users\\Administrador\\Downloads\\oasis\\oasis\\backend\\oasis_data.json';
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const vacio1 = data.users.find(u => u.username === 'vacio1');

if (vacio1 && vacio1.clinicalData && vacio1.clinicalData.oasis_canvas_nodes_vacio1) {
    const blocks = JSON.parse(vacio1.clinicalData.oasis_canvas_nodes_vacio1);
    for (const block of blocks) {
        if (block.type === 'diary_notebook') {
            const entries = block.entries || [];
            for (const entry of entries) {
                console.log(entry.text);
            }
        }
    }
}
