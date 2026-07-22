const fs = require('fs');
const content = fs.readFileSync('src/components/MyResponsesDashboard.jsx', 'utf8');
const lines = content.split('\n');
let insideJSX = false;
lines.forEach((line, idx) => {
    if (line.includes('return (') && idx > 2500) {
        insideJSX = true;
    }
    if (insideJSX && (line.includes('selectedNode') || line.includes('currentNode'))) {
        console.log(`${idx + 1}: ${line.trim()}`);
    }
});
