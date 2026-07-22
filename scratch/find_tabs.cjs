const fs = require('fs');
const file = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx';
const code = fs.readFileSync(file, 'utf8');

const lines = code.split('\n');
lines.forEach((l, i) => {
    if(l.includes('mapViewTab ===')) {
        console.log(i, l.trim().substring(0, 150));
    }
});
