const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend/src/components/MyResponsesDashboard.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace the label inside finalNodesToRender.push for mini_chat
content = content.replace(
    /label: msg\.content\.length > 50 \? msg\.content\.substring\(0, 50\) \+ '\.\.\.' : msg\.content/,
    "label: `${threadLabels[safeThreadIndex]}${roleLabel}`"
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed label.');
