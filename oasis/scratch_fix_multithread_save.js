const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend/src/components/MyResponsesDashboard.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const targetContent = `                setNodeChats(prev => ({
                    ...prev,
                    [currentNode.id]: updatedChat
                }));`;

const replacementContent = `                setNodeChats(prev => {
                    const currentThreads = prev[currentNode.id] || { 0: [], 1: [], 2: [] };
                    const isLegacy = Array.isArray(currentThreads);
                    
                    if (isLegacy) {
                        return {
                            ...prev,
                            [currentNode.id]: {
                                0: threadIndex === 0 ? updatedChat : currentThreads,
                                1: threadIndex === 1 ? updatedChat : [],
                                2: threadIndex === 2 ? updatedChat : []
                            }
                        };
                    }

                    return {
                        ...prev,
                        [currentNode.id]: {
                            ...currentThreads,
                            [threadIndex]: updatedChat
                        }
                    };
                });`;

if (content.includes(targetContent)) {
    content = content.replace(targetContent, replacementContent);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Successfully replaced setNodeChats in continueNodeExploration');
} else {
    console.error('Target content not found!');
}
