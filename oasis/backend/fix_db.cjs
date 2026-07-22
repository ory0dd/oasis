const fs = require('fs');
const file = 'c:/Users/Administrador/Downloads/oasis/oasis/backend/oasis_data.json';

try {
    let data = JSON.parse(fs.readFileSync(file, 'utf8'));
    let modified = false;

    data.Users.forEach(user => {
        if (user.Blocks) {
            user.Blocks.forEach(block => {
                if (block.Type !== 'canvas' && block.Id !== 'user_settings' && block.Id !== 'profile_settings') {
                    // Check if it's assigned to a recently created canvas incorrectly
                    if (block.CanvasId && block.CanvasId.startsWith('canvas_') && block.CanvasId !== 'canvas_default') {
                        // Let's assume ANY note right now should be on canvas_default
                        // because they haven't had time to create real notes on the new canvas yet!
                        block.CanvasId = 'canvas_default';
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
