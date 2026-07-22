const fs = require('fs');
const file = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

let modified = false;

if (content.includes("setMapViewTab('diagnostico')")) {
    content = content.replace(/setMapViewTab\('diagnostico'\)/g, "setMapViewTab('loop')");
    content = content.replace(/mapViewTab === 'diagnostico'/g, "mapViewTab === 'loop'");
    modified = true;
}

if (content.includes("setMapViewTab('claves')")) {
    content = content.replace(/setMapViewTab\('claves'\)/g, "setMapViewTab('exit_keys')");
    content = content.replace(/mapViewTab === 'claves'/g, "mapViewTab === 'exit_keys'");
    modified = true;
}

if (modified) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed tabs!');
} else {
    console.log('Tabs already fixed or not found');
}
