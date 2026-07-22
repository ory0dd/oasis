const fs = require('fs');
let code = fs.readFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/App.jsx', 'utf8');

const regex = /const visualBlocks = merged\.filter\(b => b\.type !== 'settings' && b\.id !== 'user_settings' && b\.id !== 'profile_settings' && b\.type !== 'canvas' && b\.type !== 'insight' && !b\.isPublic\);/g;

const replacement = `const visualBlocks = merged.filter(b => b.type !== 'settings' && b.id !== 'user_settings' && b.id !== 'profile_settings' && b.type !== 'canvas' && b.type !== 'insight' && !b.isPublic && (b.canvasId === activeCanvasId || (!b.canvasId && activeCanvasId === 'canvas_default')));`;

if (regex.test(code)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/App.jsx', code);
    console.log('SUCCESS');
} else {
    console.log('Regex not found');
}
