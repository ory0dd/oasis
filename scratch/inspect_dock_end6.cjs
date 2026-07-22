const fs = require('fs');
const file = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const dockStart = content.indexOf('<div className="fixed bottom-8 left-1/2');
console.log(content.substring(dockStart + 4900, dockStart + 5800));
