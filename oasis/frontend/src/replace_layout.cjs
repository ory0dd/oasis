const fs = require('fs');
const file = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const targetStart = '{/* Reflection Question */}';
const targetEnd = '                                            {/* Footer Navigation */}';

const startIndex = content.indexOf(targetStart);
const endIndex = content.indexOf(targetEnd);

if (startIndex === -1 || endIndex === -1) {
    console.error('Target boundaries not found!');
    process.exit(1);
}

const replacement = `                                            {/* Reflection Question Carousel */}
                                            {(() => {
                                                const currentQuestions = [
                                                    currentNode.reflection_question || \`¿Qué revela el patrón "\${currentNode.label}" sobre ti?\`,
                                                    "¿En qué contextos o situaciones específicas suele aparecer más este patrón?",
                                                    "¿Qué impacto real tiene esto en tu día a día o relaciones?"
                                                ];
                                                
                                                return (
                                                    <div className="flex flex-col gap-1.5 bg-zinc-900/30 border border-white/5 rounded-xl px-3 py-3 mt-2 shrink-0">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
                                                                Pregunta {reflectionIndex + 1} de {currentQuestions.length}
                                                            </span>
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => { e.stopPropagation(); setReflectionIndex(prev => Math.max(0, prev - 1)); }}
                                                                    disabled={reflectionIndex === 0}
                                                                    className="text-zinc-500 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                                                                >
                                                                    <ChevronLeft size={14} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => { e.stopPropagation(); setReflectionIndex(prev => Math.min(currentQuestions.length - 1, prev + 1)); }}
                                                                    disabled={reflectionIndex === currentQuestions.length - 1}
                                                                    className="text-zinc-500 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                                                                >
                                                                    <ChevronRight size={14} />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <label className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-wider leading-relaxed">
                                                            {currentQuestions[reflectionIndex]}
                                                        </label>
                                                        
                                                        <div className="relative mt-2">
                                                            <textarea 
                                                                className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white placeholder-zinc-600 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none resize-none"
                                                                rows={3}
                                                                placeholder="Escribe tu reflexión aquí..."
                                                                onKeyDown={(e) => e.stopPropagation()}
                                                                value={nodeNotes[\`\${currentNode.id}_q\${reflectionIndex}\`] || ''}
                                                                onChange={(e) => handleSaveNote(\`\${currentNode.id}_q\${reflectionIndex}\`, e.target.value)}
                                                            />
                                                        </div>

                                                        {/* Buttons Container */}
                                                        <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-white/5">
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const q0 = nodeNotes[\`\${currentNode.id}_q0\`] || '';
                                                                    const q1 = nodeNotes[\`\${currentNode.id}_q1\`] || '';
                                                                    const q2 = nodeNotes[\`\${currentNode.id}_q2\`] || '';
                                                                    
                                                                    const allAnswers = [q0, q1, q2].filter(Boolean).join('\\n\\n');
                                                                    if (allAnswers) {
                                                                        const spotId = \`node_reflection_\${currentNode.id}\`;
                                                                        setLocalItem(\`oasis_blindspot_answer_\${user}__\${spotId}\`, allAnswers);
                                                                        setLocalItem(\`oasis_blindspot_resolved_\${user}__\${spotId}\`, 'true');
                                                                        setLocalItem(\`oasis_blindspot_question_\${user}__\${spotId}\`, 'Exploración Completa');
                                                                        setLocalItem(\`oasis_blindspot_title_\${user}__\${spotId}\`, \`Reflexión: \${currentNode.label}\`);
                                                                        
                                                                        if (afcData) {
                                                                            const updatedAfc = { ...afcData };
                                                                            const newNodeId = \`blind_spot_node_reflection_\${currentNode.id}\`;
                                                                            const newNode = {
                                                                                id: newNodeId,
                                                                                type: "cognitive",
                                                                                label: \`Integración: \${currentNode.label.substring(0, 10)}...\`,
                                                                                x: (currentNode.x || 50) + 12,
                                                                                y: (currentNode.y || 50) + 20,
                                                                                dashed: false,
                                                                                description: \`Reflexiones:\\n\${allAnswers.substring(0, 60)}...\`
                                                                            };
                                                                            
                                                                            if (updatedAfc.nodes && !updatedAfc.nodes.some(n => n.id === newNodeId)) {
                                                                                updatedAfc.nodes = [...updatedAfc.nodes, newNode];
                                                                            }
                                                                            
                                                                            if (updatedAfc.edges) {
                                                                                const newEdge = { source: currentNode.id, target: newNodeId, weight: 1.5, type: "progression" };
                                                                                if (!updatedAfc.edges.some(edge => edge.source === newEdge.source && edge.target === newEdge.target)) {
                                                                                    updatedAfc.edges = [...updatedAfc.edges, newEdge];
                                                                                }
                                                                            }
                                                                            
                                                                            setAfcData(updatedAfc);
                                                                            setLocalItem(\`oasis_afc_real_data_\${user}\`, JSON.stringify(updatedAfc));
                                                                        }
                                                                    }
                                                                }}
                                                                className="flex items-center gap-1.5 p-1.5 px-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                                                            >
                                                                <span className="text-[9px] font-bold tracking-wide">SOLO GUARDAR</span>
                                                            </button>

                                                            <button
                                                                type="button"
                                                                disabled={!nodeNotes[\`\${currentNode.id}_q0\`] || !nodeNotes[\`\${currentNode.id}_q1\`] || !nodeNotes[\`\${currentNode.id}_q2\`]}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const q0 = nodeNotes[\`\${currentNode.id}_q0\`] || '';
                                                                    const q1 = nodeNotes[\`\${currentNode.id}_q1\`] || '';
                                                                    const q2 = nodeNotes[\`\${currentNode.id}_q2\`] || '';
                                                                    
                                                                    let customPrompt = \`Quiero explorar y analizar en profundidad mi nodo conductual: "\${currentNode.label}".\\n\\nHe respondido a varias preguntas de reflexión para desglosarlo:\\n\\n\`;
                                                                    customPrompt += \`1. \${currentQuestions[0]}\\nMi respuesta: \${q0}\\n\\n\`;
                                                                    customPrompt += \`2. \${currentQuestions[1]}\\nMi respuesta: \${q1}\\n\\n\`;
                                                                    customPrompt += \`3. \${currentQuestions[2]}\\nMi respuesta: \${q2}\\n\\n\`;
                                                                    customPrompt += \`En base a todo este contexto integral, ¿qué perspectivas clínicas sistémicas me sugieres para entender este bucle?\`;
                                                                    
                                                                    onOpenNodeChat?.(currentNode.id, currentNode.label, customPrompt);
                                                                }}
                                                                className="flex items-center gap-1.5 p-1.5 px-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 transition-all disabled:opacity-30 disabled:pointer-events-none"
                                                                title="Responder a todas las preguntas para enviar a Kio"
                                                            >
                                                                <span className="text-[9px] font-bold tracking-wide">ENVIAR A KIO</span>
                                                                <MessageCircle size={13} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
`;

const newContent = content.substring(0, startIndex) + replacement + content.substring(endIndex);
fs.writeFileSync(file, newContent, 'utf8');
console.log('Replacement successful!');
c: \Users\Administrador\AppData\Local\Packages\MicrosoftWindows.Client.Core_cw5n1h2txyewy\TempState\ScreenClip\{ 83CB685D - B2B1 - 4A5E - 8409 - 6466056C1532 }.png