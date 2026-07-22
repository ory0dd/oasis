const fs = require('fs');
let content = fs.readFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx', 'utf8');

const leftover = "        const updated = [newSession, ...sessions];\n        setSessions(updated);\n        setNewSessionNote('');\n    };";

if (content.includes(leftover)) {
    content = content.replace(leftover, '');
    fs.writeFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx', content, 'utf8');
    console.log('Fixed syntax error!');
} else {
    console.log('Could not find leftover block.');
}
