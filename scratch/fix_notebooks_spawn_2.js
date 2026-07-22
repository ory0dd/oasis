const fs = require('fs');
let code = fs.readFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/App.jsx', 'utf8');

const anchor1 = "if (!newBlocks.find(b => b.type === 'diary_notebook' && isCurrentCanvas(b))) {";
const anchor2 = "if (!newBlocks.find(b => b.type === 'conversation_notebook' && isCurrentCanvas(b))) {\n            newBlocks.push({ id: `anchor-conversation-${Date.now()}`, type: 'conversation_notebook', x: 700, y: -350, content: '', color: '#d946ef', entries: [], canvasId: activeCanvasId !== 'canvas_default' ? activeCanvasId : undefined });\n            changed = true;\n        }";

const idx1 = code.indexOf(anchor1);
let newCode = code;

if (idx1 !== -1) {
    const idx2 = code.indexOf(anchor2, idx1);
    if (idx2 !== -1) {
        const toReplace = code.substring(idx1, idx2 + anchor2.length);
        const repl = `const beforeLen2 = newBlocks.length;
        newBlocks = newBlocks.filter(b => b.type !== 'diary_notebook' && b.type !== 'resonance_notebook' && b.type !== 'conversation_notebook');
        if (newBlocks.length !== beforeLen2) {
            changed = true;
        }`;
        newCode = code.substring(0, idx1) + repl + code.substring(idx2 + anchor2.length);
        fs.writeFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/App.jsx', newCode);
        console.log('SUCCESS');
    } else {
        console.log('anchor2 not found');
    }
} else {
    console.log('anchor1 not found');
}
