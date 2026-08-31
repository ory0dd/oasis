const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend/src/components/MyResponsesDashboard.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix isDimmed logic to not dim mini_chat nodes
content = content.replace(
    /const isDimmed = \(activeNodeId \|\| selectedPatternId\) && !isConnected;/g,
    "const isDimmed = (activeNodeId || selectedPatternId) && !isConnected && node.type !== 'mini_chat';"
);

// Also let's make sure the edges for mini_chat are never dimmed
content = content.replace(
    /const edgeIsDimmed = \(activeNodeId \|\| selectedPatternId\) && !edgeIsConnected;/g,
    "const edgeIsDimmed = (activeNodeId || selectedPatternId) && !edgeIsConnected && edge.type !== 'mini_chat_link';"
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed dimming for mini chat nodes.');
