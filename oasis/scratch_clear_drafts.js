const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend/src/components/MyResponsesDashboard.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// The line is: setExplorationResponse(''); // Clear input box
content = content.replace(
    /setExplorationResponse\(''\); \/\/ Clear input box/,
    `setExplorationResponse(''); // Clear input box\n            localStorage.removeItem('draft_' + currentNode.id + '_' + threadIndex);`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed clearing drafts.');
