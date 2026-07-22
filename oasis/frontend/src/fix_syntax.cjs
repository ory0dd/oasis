const fs = require('fs');
const path = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/App.jsx';
let code = fs.readFileSync(path, 'utf8');

// Fix the syntax error caused by escaped quotes in JSX
code = code.replace(/\\'resonance\\'/g, "'resonance'");

fs.writeFileSync(path, code);
console.log('Fixed syntax error in App.jsx');
