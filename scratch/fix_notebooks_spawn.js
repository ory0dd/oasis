const fs = require('fs');
let code = fs.readFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/App.jsx', 'utf8');

const regex = /if \(!newBlocks\.find\(b => b\.type === 'diary_notebook'.*?if \(!newBlocks\.find\(b => b\.type === 'conversation_notebook'.*?changed = true;\n        \}/gs;

const repl = `const beforeLen2 = newBlocks.length;
        newBlocks = newBlocks.filter(b => b.type !== 'diary_notebook' && b.type !== 'resonance_notebook' && b.type !== 'conversation_notebook');
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
