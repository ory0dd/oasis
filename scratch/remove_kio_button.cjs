const fs = require('fs');
const file = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const kioButtonRegex = /<button[^>]*onClick=\{\(e\) => \{\s*e\.stopPropagation\(\);\s*const userReflection = nodeNotes\[node\.id\];\s*\/\/\s*---\s*NUEVA LÓGICA DE GUARDADO[\s\S]*?ENVIAR A KIO<\/span>\s*<\/button>/g;

if (kioButtonRegex.test(content)) {
    content = content.replace(kioButtonRegex, '');
    fs.writeFileSync(file, content, 'utf8');
    console.log("Removed ENVIAR A KIO button.");
} else {
    console.warn("Regex failed to match.");
}
