const fs = require('fs');
let code = fs.readFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/App.jsx', 'utf8');

const regex = /<button onClick=\{[^}]*?setActiveNotebook\('diary'\)[^>]*?>.*?<\/button>/g;
code = code.replace(regex, '');

fs.writeFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/App.jsx', code);
console.log("SUCCESS");
