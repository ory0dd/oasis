const fs = require('fs');
const file = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const searchStr = String.fromCharCode(92) + 'n<div className="fixed bottom-8';
const replaceStr = '\n<div className="fixed bottom-8';

content = content.replace(searchStr, replaceStr);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed literal newlines');
