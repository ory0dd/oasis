const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend/src/components/MyResponsesDashboard.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix the syntax error in the historical node class
content = content.replace(
    /hover:border-blue-400'\)\)}``\} \/>/,
    "hover:border-blue-400'))}`} />"
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed historical syntax error.');
