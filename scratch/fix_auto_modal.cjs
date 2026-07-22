const fs = require('fs');
const file = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /if\s*\(targetNode\)\s*\{\s*setSelectedNode\(targetNode\);\s*setTimeout\(\(\)\s*=>\s*zoomToNode\(targetNode\),\s*150\);\s*\}/;

const replacementStr = `if (targetNode) {
                    setSelectedPatternId(easiestPattern.id);
                    const idx = easiestPattern.sortedNodes.findIndex(n => n.id === targetNode.id);
                    setTourActiveIndex(idx !== -1 ? idx : 0);
                    setSelectedNode(targetNode);
                    setTimeout(() => zoomToNode(targetNode), 150);
                }`;

if (regex.test(content)) {
    content = content.replace(regex, replacementStr);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed auto-select logic to open the Guided Tour Modal!');
} else {
    console.log('Target regex not found.');
}
