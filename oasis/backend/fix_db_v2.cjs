const fs = require('fs');
const file = 'c:/Users/Administrador/Downloads/oasis/oasis/backend/oasis_data.json';

try {
    let data = JSON.parse(fs.readFileSync(file, 'utf8'));
    let modified = false;

    data.users.forEach(user => {
        if (user.blocks) {
            user.blocks.forEach(block => {
                if (block.type !== 'canvas' && block.id !== 'user_settings' && block.id !== 'profile_settings' && block.type !== 'insight') {
                    const cid = block.canvasId;
                    if (!cid || cid === 'undefined' || cid === 'null' || cid === '') {
                        block.canvasId = 'canvas_default';
                        modified = true;
                    }
                }
            });
        }
    });

    if (modified) {
        fs.writeFileSync(file, JSON.stringify(data, null, 2));
        console.log('Fixed hijacked notes in DB!');
    } else {
        console.log('No hijacked notes found in DB.');
    }
} catch (e) {
    console.error('Error reading/writing DB:', e);
}
