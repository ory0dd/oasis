const fs = require('fs');
let code = fs.readFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/App.jsx', 'utf8');

const target1 = "if (b.type === 'insight' || b.type === 'settings' || b.type === 'canvas' || b.type === 'note' || b.isPublic || b.type === 'profile_settings' || b.type === 'user_settings') return false;";
const repl1 = "if (b.type === 'insight' || b.type === 'diary_notebook' || b.type === 'resonance_notebook' || b.type === 'conversation_notebook' || b.type === 'settings' || b.type === 'canvas' || b.type === 'note' || b.isPublic || b.type === 'profile_settings' || b.type === 'user_settings') return false;";

const target2 = "const visualBlocks = blocks.filter(b => b.type !== 'settings' && b.id !== 'user_settings' && b.id !== 'profile_settings' && b.type !== 'canvas' && b.type !== 'insight' && !b.isPublic && (b.canvasId === activeCanvasId || (!b.canvasId && activeCanvasId === 'canvas_default')));";
const repl2 = "const visualBlocks = blocks.filter(b => b.type !== 'settings' && b.id !== 'user_settings' && b.id !== 'profile_settings' && b.type !== 'canvas' && b.type !== 'insight' && b.type !== 'diary_notebook' && b.type !== 'resonance_notebook' && b.type !== 'conversation_notebook' && !b.isPublic && (b.canvasId === activeCanvasId || (!b.canvasId && activeCanvasId === 'canvas_default')));";

const target3 = "const visualBlocks = merged.filter(b => b.type !== 'settings' && b.id !== 'user_settings' && b.id !== 'profile_settings' && b.type !== 'canvas' && b.type !== 'insight' && !b.isPublic && (b.canvasId === activeCanvasId || (!b.canvasId && activeCanvasId === 'canvas_default')));";
const repl3 = "const visualBlocks = merged.filter(b => b.type !== 'settings' && b.id !== 'user_settings' && b.id !== 'profile_settings' && b.type !== 'canvas' && b.type !== 'insight' && b.type !== 'diary_notebook' && b.type !== 'resonance_notebook' && b.type !== 'conversation_notebook' && !b.isPublic && (b.canvasId === activeCanvasId || (!b.canvasId && activeCanvasId === 'canvas_default')));";


code = code.split(target1).join(repl1);
code = code.split(target2).join(repl2);
code = code.split(target3).join(repl3);

fs.writeFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/App.jsx', code);
console.log('SUCCESS');
