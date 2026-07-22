const fs = require('fs');
const file = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/BitacoraExistencial.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/text: 'Nuevo Pizarrón'/g, "content: 'Nuevo Pizarrón'");
content = content.replace(/text: 'Pizarrón Principal'/g, "content: 'Pizarrón Principal'");
content = content.replace(/canvas\.text/g, "(canvas.content || canvas.text)");
content = content.replace(/text: newName/g, "content: newName");
content = content.replace(/currentCanvas\?\.text/g, "(currentCanvas?.content || currentCanvas?.text)");

fs.writeFileSync(file, content);
console.log('Fixed canvas content mapping');
