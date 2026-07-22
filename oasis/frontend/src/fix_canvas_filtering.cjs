const fs = require('fs');
const file = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/App.jsx';
let content = fs.readFileSync(file, 'utf8');

const target = "{blocks.filter(b => b.type !== 'settings' && b.id !== 'user_settings').map((block) => {";
const replacement = `{blocks.filter(b => {
                    if (b.type === 'settings' || b.id === 'user_settings' || b.id === 'profile_settings' || b.type === 'canvas') return false;
                    if (b.canvasId && b.canvasId !== activeCanvasId) return false;
                    if (!b.canvasId && activeCanvasId !== 'canvas_default') return false;
                    return true;
                }).map((block) => {`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content);
console.log('Fixed canvas filtering');
