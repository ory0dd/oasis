const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend/src/components/MyResponsesDashboard.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Extract the useEffect block
const useEffectRegex = /\s*\/\/ Load drafts automatically when navigating nodes\/threads\s*useEffect\(\(\) => \{[\s\S]*?\}, \[mapViewTab, tourActiveIndex, sortedTourNodes, selectedNode, selectedQuestionIndex\]\);/;
const match = content.match(useEffectRegex);

if (match) {
    const block = match[0];
    // Remove the block from its current location
    content = content.replace(useEffectRegex, '');
    
    // Find the definition of sortedTourNodes and insert the block right after it
    const targetAnchor = /const sortedTourNodes = useMemo\(\(\) => \{[\s\S]*?\}, \[afcData, user\]\);/;
    content = content.replace(targetAnchor, (m) => m + '\n' + block);
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Moved useEffect successfully.');
} else {
    console.log('Could not find useEffect block.');
}
