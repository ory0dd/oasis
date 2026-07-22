const fs = require('fs');
let code = fs.readFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/App.jsx', 'utf8');

const regex = /if \(!newBlocks\.find\(b => b\.type === 'diary_notebook'[\s\S]*?if \(!newBlocks\.find\(b => b\.type === 'conversation_notebook'.*?changed = true;\s*\}/;

const repl = `// DISABLING LOOP MAP MINI AND NOTEBOOKS FOR NOW (USER REQUEST)
        const beforeLen2 = newBlocks.length;
        newBlocks = newBlocks.filter(b => b.type !== 'loop_map_mini' && b.type !== 'diary_notebook' && b.type !== 'resonance_notebook' && b.type !== 'conversation_notebook');
        if (newBlocks.length !== beforeLen2) {
            changed = true;
        }`;

if (regex.test(code)) {
    code = code.replace(regex, repl);
    fs.writeFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/App.jsx', code);
    console.log('SUCCESS');
} else {
    console.log('Regex not found');
}
