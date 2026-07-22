const fs = require('fs');
const file = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/App.jsx';
let content = fs.readFileSync(file, 'utf8');

const badSyncLogic = `if (b.type !== 'canvas' && b.id !== 'user_settings' && b.id !== 'profile_settings' && !b.canvasId && b.type !== 'insight') {
                    return { ...b, canvasId: activeCanvasId };
                }`;

const goodSyncLogic = `if (b.type !== 'canvas' && b.id !== 'user_settings' && b.id !== 'profile_settings' && !b.canvasId && b.type !== 'insight') {
                    return { ...b, canvasId: 'canvas_default' };
                }`;

content = content.replace(badSyncLogic, goodSyncLogic);
fs.writeFileSync(file, content);
console.log('Fixed block migration issue');
