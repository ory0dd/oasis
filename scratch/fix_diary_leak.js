const fs = require('fs');

const dataFile = 'c:/Users/Administrador/Downloads/oasis/oasis/backend/oasis_data.json';
const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

let removedCount = 0;
const targetId = '1782366668017';

Object.keys(data.users).forEach(u => {
    const user = data.users[u];
    
    // Check blocks array
    if (user.blocks && Array.isArray(user.blocks)) {
        const initialLength = user.blocks.length;
        user.blocks = user.blocks.filter(b => b.id !== targetId);
        removedCount += (initialLength - user.blocks.length);
    }
    
    // Check clinicalData arrays
    if (user.clinicalData) {
        Object.keys(user.clinicalData).forEach(k => {
            if (k.startsWith('oasis_canvas_nodes_')) {
                try {
                    let blocks = JSON.parse(user.clinicalData[k]);
                    if (Array.isArray(blocks)) {
                        const initialLength = blocks.length;
                        blocks = blocks.filter(b => b.id !== targetId);
                        if (blocks.length < initialLength) {
                            user.clinicalData[k] = JSON.stringify(blocks);
                            removedCount += (initialLength - blocks.length);
                        }
                    }
                } catch(e) {}
            }
        });
    }
});

fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
console.log('Removed ' + removedCount + ' instances of block ' + targetId);
