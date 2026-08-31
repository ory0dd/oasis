const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend/src/components/MyResponsesDashboard.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const targetStr = `
                                        if (activeChatNode) {
                                            const safeThreadIndex = selectedQuestionIndex !== null ? selectedQuestionIndex : 0;
                                            const currentChat = getSafeCurrentChat(activeChatNode.id, safeThreadIndex);
                                            const threadLabels = ['Historia', 'Relaciones', 'Cuerpo', 'Valores', 'Conductas', 'Experimentos', 'Integracin'];
                                            currentChat.forEach((msg, idx) => {
                                                const miniNodeId = \`mini_node_\${activeChatNode.id}_\${safeThreadIndex}_\${idx}\`;
                                                // Generate angular spread based on index
                                                const radius = 10 + (idx * 6);
                                                const angle = (idx * Math.PI * 2 / 5) + (safeThreadIndex * Math.PI / 3);
                                                const x = activeChatNode.x + Math.cos(angle) * radius;
                                                const y = activeChatNode.y + Math.sin(angle) * radius;
                                                const roleLabel = msg.role === 'user' ? ' (Tǧ)' : ' (IA)';
                                                
                                                finalNodesToRender.push({
                                                    id: miniNodeId,
                                                    type: 'mini_chat',
                                                    role: msg.role,
                                                    label: \`\${threadLabels[safeThreadIndex]}\${roleLabel}\`,
                                                    x, y
                                                });
                                                
                                                finalEdgesToRender.push({
                                                    source: idx === 0 ? activeChatNode.id : \`mini_node_\${activeChatNode.id}_\${safeThreadIndex}_\${idx - 1}\`,
                                                    target: miniNodeId,
                                                    type: 'mini_chat_link',
                                                    weight: 1.0
                                                });
                                            });
                                        }
`;

const replaceStr = `
                                        const threadLabels = ['Historia', 'Relaciones', 'Cuerpo', 'Valores', 'Conductas', 'Experimentos', 'Integración'];
                                        const initialNodes = [...finalNodesToRender];
                                        initialNodes.forEach(node => {
                                            if (node.type === 'mini_chat') return;
                                            
                                            // Render all history for all nodes to show a permanent galaxy of context
                                            for (let t = 0; t < 7; t++) {
                                                const currentChat = getSafeCurrentChat(node.id, t);
                                                if (currentChat && currentChat.length > 0) {
                                                    currentChat.forEach((msg, idx) => {
                                                        const miniNodeId = \`mini_node_\${node.id}_\${t}_\${idx}\`;
                                                        // Generate angular spread based on index and thread
                                                        const radius = 10 + (idx * 6);
                                                        const angle = (idx * Math.PI * 2 / 5) + (t * Math.PI / 3);
                                                        const x = node.x + Math.cos(angle) * radius;
                                                        const y = node.y + Math.sin(angle) * radius;
                                                        const roleLabel = msg.role === 'user' ? ' (Tú)' : ' (IA)';
                                                        
                                                        finalNodesToRender.push({
                                                            id: miniNodeId,
                                                            type: 'mini_chat',
                                                            role: msg.role,
                                                            label: \`\${threadLabels[t]}\${roleLabel}\`,
                                                            x, y
                                                        });
                                                        
                                                        finalEdgesToRender.push({
                                                            source: idx === 0 ? node.id : \`mini_node_\${node.id}_\${t}_\${idx - 1}\`,
                                                            target: miniNodeId,
                                                            type: 'mini_chat_link',
                                                            weight: 1.0
                                                        });
                                                    });
                                                }
                                            }
                                        });
`;

// I need to find the exact block. The safest way is to search by the first few lines and replace until the closing brace.
const startIndex = content.indexOf('if (activeChatNode) {');
if (startIndex !== -1) {
    const endStr = '                                        }';
    const endIndex = content.indexOf(endStr, startIndex) + endStr.length;
    
    content = content.substring(0, startIndex) + replaceStr.trim() + content.substring(endIndex);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Successfully replaced global mini chat logic.');
} else {
    console.log('Could not find activeChatNode block.');
}
