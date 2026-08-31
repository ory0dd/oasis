const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend/src/components/MyResponsesDashboard.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const leftArrowOld1 = `onClick={(e) => { e.stopPropagation(); setSelectedQuestionIndex(safeThreadIndex > 0 ? safeThreadIndex - 1 : 2); }}`;
const leftArrowNew1 = `onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const nextIdx = safeThreadIndex > 0 ? safeThreadIndex - 1 : 2;
                                                                    setSelectedQuestionIndex(nextIdx);
                                                                    const nextChat = getSafeCurrentChat(node.id, nextIdx);
                                                                    if ((!nextChat || nextChat.length === 0) && !isGeneratingExplorations) {
                                                                        continueNodeExploration(node, null, nextIdx);
                                                                    }
                                                                }}`;

const rightArrowOld1 = `onClick={(e) => { e.stopPropagation(); setSelectedQuestionIndex(safeThreadIndex < 2 ? safeThreadIndex + 1 : 0); }}`;
const rightArrowNew1 = `onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const nextIdx = safeThreadIndex < 2 ? safeThreadIndex + 1 : 0;
                                                                    setSelectedQuestionIndex(nextIdx);
                                                                    const nextChat = getSafeCurrentChat(node.id, nextIdx);
                                                                    if ((!nextChat || nextChat.length === 0) && !isGeneratingExplorations) {
                                                                        continueNodeExploration(node, null, nextIdx);
                                                                    }
                                                                }}`;

const leftArrowOld2 = `onClick={(e) => { e.stopPropagation(); setSelectedQuestionIndex(safeThreadIndex > 0 ? safeThreadIndex - 1 : 2); }}`;
const leftArrowNew2 = `onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const nextIdx = safeThreadIndex > 0 ? safeThreadIndex - 1 : 2;
                                                                    setSelectedQuestionIndex(nextIdx);
                                                                    const nextChat = getSafeCurrentChat(currentNode.id, nextIdx);
                                                                    if ((!nextChat || nextChat.length === 0) && !isGeneratingExplorations) {
                                                                        continueNodeExploration(currentNode, null, nextIdx);
                                                                    }
                                                                }}`;

const rightArrowOld2 = `onClick={(e) => { e.stopPropagation(); setSelectedQuestionIndex(safeThreadIndex < 2 ? safeThreadIndex + 1 : 0); }}`;
const rightArrowNew2 = `onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const nextIdx = safeThreadIndex < 2 ? safeThreadIndex + 1 : 0;
                                                                    setSelectedQuestionIndex(nextIdx);
                                                                    const nextChat = getSafeCurrentChat(currentNode.id, nextIdx);
                                                                    if ((!nextChat || nextChat.length === 0) && !isGeneratingExplorations) {
                                                                        continueNodeExploration(currentNode, null, nextIdx);
                                                                    }
                                                                }}`;

// The first 2 arrows use `node.id`, the second 2 arrows use `currentNode.id`
let leftCount = 0;
content = content.replace(new RegExp(leftArrowOld1.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), (match) => {
    leftCount++;
    return leftCount === 1 ? leftArrowNew1 : leftArrowNew2;
});

let rightCount = 0;
content = content.replace(new RegExp(rightArrowOld1.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), (match) => {
    rightCount++;
    return rightCount === 1 ? rightArrowNew1 : rightArrowNew2;
});

fs.writeFileSync(filePath, content, 'utf8');
console.log('Replaced', leftCount, 'left arrows and', rightCount, 'right arrows.');
