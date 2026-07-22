const fs = require('fs');
let code = fs.readFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/App.jsx', 'utf8');
const lines = code.split('\n');

const startIdx = lines.findIndex(l => l.includes("if (!newBlocks.find(b => b.type === 'diary_notebook'"));
const endIdx = lines.findIndex((l, i) => i > startIdx && l.includes("if (!newBlocks.find(b => b.type === 'conversation_notebook'"));
const actualEndIdx = lines.findIndex((l, i) => i > endIdx && l.includes("changed = true;"));
const braceEndIdx = lines.findIndex((l, i) => i > actualEndIdx && l.includes("}"));

if (startIdx !== -1 && braceEndIdx !== -1) {
    const repl = `        // DISABLING LOOP MAP MINI AND NOTEBOOKS FOR NOW (USER REQUEST)
        const beforeLen2 = newBlocks.length;
        newBlocks = newBlocks.filter(b => b.type !== 'loop_map_mini' && b.type !== 'diary_notebook' && b.type !== 'resonance_notebook' && b.type !== 'conversation_notebook');
        if (newBlocks.length !== beforeLen2) {
            changed = true;
        }`;
    lines.splice(startIdx, braceEndIdx - startIdx + 1, repl);
    fs.writeFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/App.jsx', lines.join('\n'));
    console.log('SUCCESS');
} else {
    console.log('Lines not found', startIdx, braceEndIdx);
}
