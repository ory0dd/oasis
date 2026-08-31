const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend/src/components/MyResponsesDashboard.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Inject the useEffect for loading drafts
const useEffectCode = `
    // Load drafts automatically when navigating nodes/threads
    useEffect(() => {
        let activeId = null;
        let threadIdx = 0;
        if (mapViewTab === 'map' && tourActiveIndex !== null && sortedTourNodes[tourActiveIndex]) {
            activeId = sortedTourNodes[tourActiveIndex].id;
            threadIdx = selectedQuestionIndex || 0;
        } else if (selectedNode) {
            activeId = selectedNode.id;
            threadIdx = selectedQuestionIndex || 0;
        }
        if (activeId) {
            const draft = localStorage.getItem('draft_' + activeId + '_' + threadIdx);
            setExplorationResponse(draft || '');
        }
    }, [mapViewTab, tourActiveIndex, sortedTourNodes, selectedNode, selectedQuestionIndex]);
`;

content = content.replace(
    /const \[explorationResponse, setExplorationResponse\] = useState\(''\);/,
    `const [explorationResponse, setExplorationResponse] = useState('');\n${useEffectCode}`
);

// 2. Update the onChange handlers for the textarea/inputs
// Map view input (approx line 5514)
content = content.replace(
    /onChange=\{\(e\) => setExplorationResponse\(e\.target\.value\)\}/g,
    `onChange={(e) => {
        const val = e.target.value;
        setExplorationResponse(val);
        let activeId = null;
        if (mapViewTab === 'map' && tourActiveIndex !== null && sortedTourNodes[tourActiveIndex]) {
            activeId = sortedTourNodes[tourActiveIndex].id;
        } else if (selectedNode) {
            activeId = selectedNode.id;
        }
        if (activeId) {
            localStorage.setItem('draft_' + activeId + '_' + (selectedQuestionIndex || 0), val);
        }
    }}`
);

// 3. Prevent overriding the loaded draft with empty strings on navigate
// Replace setExplorationResponse(''); when it's done during navigation!
// Let's just remove those specific setExplorationResponse('') since the useEffect will handle it.
content = content.replace(/setSelectedQuestionIndex\((.*?)\);\s*setExplorationResponse\(''\);/g, "setSelectedQuestionIndex($1);");
content = content.replace(/setTourActiveIndex\((.*?)\);\s*setExplorationResponse\(''\);/g, "setTourActiveIndex($1);");

// Actually, let's just make the script write the file and we will run it!
fs.writeFileSync(filePath, content, 'utf8');
console.log('Injected drafts persistence logic.');
