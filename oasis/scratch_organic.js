const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend/src/components/MyResponsesDashboard.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Inject the helper function right before the return statement of MyResponsesDashboard
const helperFunction = `
    const hasAnsweredAllPerspectives = (nodeId) => {
        if (!nodeChats || !nodeChats[nodeId]) return false;
        for (let i = 0; i < 6; i++) {
            const chat = nodeChats[nodeId][i] || [];
            if (!chat.some(msg => msg.role === 'user')) return false;
        }
        return true;
    };
`;
content = content.replace(
    /return \(\s*<React\.Fragment>/,
    `${helperFunction}\n    return (\n        <React.Fragment>`
);

// 2. Remove the INTEGRAR EXPERIENCIA button blocks completely
const buttonRegex = /\{safeThreadIndex !== 6 && \(\s*<button[\s\S]*?INTEGRAR EXPERIENCIA\s*<\/button>\s*\)\}/g;
content = content.replace(buttonRegex, '');

// 3. Update the arrow logic!
// In the first instance (tour view / map view chat)
// Left Arrow:
content = content.replace(
    /const nextIdx = safeThreadIndex === 6 \? 5 : \(safeThreadIndex > 0 \? safeThreadIndex - 1 : 5\);/g,
    "const isAllAnswered = hasAnsweredAllPerspectives((activeChatNode || currentNode || selectedNode)?.id);\n                                                                    const nextIdx = safeThreadIndex === 6 ? 5 : (safeThreadIndex > 0 ? safeThreadIndex - 1 : (isAllAnswered ? 6 : 5));"
);
// Right Arrow:
content = content.replace(
    /const nextIdx = safeThreadIndex === 6 \? 0 : \(safeThreadIndex < 5 \? safeThreadIndex \+ 1 : 0\);/g,
    "const isAllAnswered = hasAnsweredAllPerspectives((activeChatNode || currentNode || selectedNode)?.id);\n                                                                      const nextIdx = safeThreadIndex === 6 ? 0 : (safeThreadIndex < 5 ? safeThreadIndex + 1 : (isAllAnswered ? 6 : 0));"
);

// 4. In continueNodeExploration, let's add auto-switch logic if they just unlocked it.
// We'll check if the 5 other threads are answered, and the one we are submitting is the 6th.
// Inside `continueNodeExploration`, right after setting the state:
const autoSwitchCode = `
            // Check if we just unlocked the integration thread!
            if (threadIndex !== 6) {
                let answeredCount = 0;
                for (let i = 0; i < 6; i++) {
                    if (i === threadIndex) answeredCount++; // We just answered this one
                    else {
                        const tChat = getSafeCurrentChat(currentNode.id, i);
                        if (tChat.some(m => m.role === 'user')) answeredCount++;
                    }
                }
                if (answeredCount === 6) {
                    // Auto-switch to Integration!
                    setTimeout(() => {
                        setSelectedQuestionIndex(6);
                        const nextChat = getSafeCurrentChat(currentNode.id, 6);
                        if (!nextChat || nextChat.length === 0) {
                            // Optionally trigger the initial LLM message for integration automatically:
                            continueNodeExploration(currentNode, null, 6);
                        }
                    }, 1500); // Wait a moment so they see their message submitted
                }
            }
`;

content = content.replace(
    /setExplorationResponse\(''\); \/\/ Clear input box\n\s*localStorage\.removeItem\('draft_' \+ currentNode\.id \+ '_' \+ threadIndex\);/,
    `setExplorationResponse(''); // Clear input box\n            localStorage.removeItem('draft_' + currentNode.id + '_' + threadIndex);\n${autoSwitchCode}`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Organic integration logic injected.');
