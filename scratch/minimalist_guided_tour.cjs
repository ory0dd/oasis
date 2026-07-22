const fs = require('fs');
const file = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const targetCondition = "mapViewTab === 'map' && tourActiveIndex !== null";
const targetStart = content.indexOf(targetCondition);
const startIndex = content.indexOf('{/* Header */}', targetStart);

const endStr = '<ChevronRight size={13} />';
const endIndexMatch = content.indexOf(endStr, startIndex);

if (startIndex !== -1 && endIndexMatch !== -1) {
    const endOfButtonDiv = content.indexOf('</div>', endIndexMatch) + 6;
    
    const replacement = `{/* Minimalist Header */}
                                            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="flex items-center justify-center px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[9px] font-mono font-bold">
                                                        {tourActiveIndex + 1}/{sortedTourNodes.length}
                                                    </span>
                                                    <span className="flex items-center gap-1.5 text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                                                        {React.createElement(typeIcons[currentNode.type] || Activity, { size: 12, className: typeColors[currentNode.type] })}
                                                        <span>{typeCompactLabels[currentNode.type]}</span>
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setTourActiveIndex(null);
                                                        setSelectedNode(null);
                                                        setIsExploringActiveNode(false);
                                                        setSelectedExplorationSpot(null);
                                                        setExplorationResponse('');
                                                        if (selectedPatternId && activePattern) {
                                                            setTimeout(() => zoomToPattern(activePattern), 15);
                                                        } else {
                                                            setSelectedPatternId(null);
                                                            setTimeout(resetMapTransform, 15);
                                                        }
                                                    }}
                                                    className="p-1 text-zinc-500 hover:text-white transition-colors"
                                                    title="Cerrar tour"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>

                                            {/* Node Label */}
                                            <h4 className="text-xs font-black text-white leading-snug tracking-wide uppercase">{currentNode.label}</h4>

                                            {/* Description (Minimal Info) */}
                                            <div className="text-[11.5px] text-zinc-300 leading-relaxed bg-zinc-900/40 border border-white/5 rounded-xl p-3">
                                                <p className="text-zinc-200 whitespace-pre-line break-words leading-relaxed">{getFallbackDescription(currentNode, user)}</p>
                                            </div>

                                            {/* Wizard for 3 Questions */}
                                            {(() => {
                                                const explorations = nodeExplorations && nodeExplorations[currentNode.id];
                                                const hasExplorations = explorations && explorations.length > 0;
                                                
                                                if (hasExplorations) {
                                                    const currentIdx = (selectedQuestionIndex || 0) % explorations.length;
                                                    const spot = explorations[currentIdx];
                                                    const spotId = \`node_reflection_\${spot.id}\`;
                                                    const savedAnswer = localStorage.getItem(\`oasis_blindspot_answer_\${user}__\${spot.id}\`) || nodeNotes[spot.id] || '';
                                                    const isResolved = spot.resolved || localStorage.getItem(\`oasis_blindspot_resolved_\${user}__\${spot.id}\`) === 'true';

                                                    // Check if ALL 3 are resolved to show Kio button
                                                    const allResolved = explorations.every(ex => ex.resolved || localStorage.getItem(\`oasis_blindspot_resolved_\${user}__\${ex.id}\`) === 'true');

                                                    return (
                                                        <div className="flex flex-col gap-3">
                                                            <div className="flex flex-col gap-2 bg-zinc-900/40 border border-white/5 rounded-xl px-3 py-3 mt-1">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-[9px] font-mono text-zinc-400 font-bold uppercase tracking-widest">
                                                                        Pregunta {currentIdx + 1} de {explorations.length}
                                                                    </span>
                                                                    <div className="flex items-center gap-1">
                                                                        <button onClick={(e) => { e.stopPropagation(); setSelectedQuestionIndex((prev) => (prev - 1 + explorations.length) % explorations.length); }} className="p-1 text-zinc-400 hover:text-white transition-colors"><ChevronLeft size={14}/></button>
                                                                        <button onClick={(e) => { e.stopPropagation(); setSelectedQuestionIndex((prev) => (prev + 1) % explorations.length); }} className="p-1 text-zinc-400 hover:text-white transition-colors"><ChevronRight size={14}/></button>
                                                                    </div>
                                                                </div>
                                                                
                                                                <label className="text-[10px] font-bold text-sky-400 uppercase tracking-wider leading-relaxed">
                                                                    {spot.question}
                                                                </label>
                                                                
                                                                <div className="relative mt-1">
                                                                    <textarea 
                                                                        className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 pb-11 text-xs text-white placeholder-zinc-600 focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 outline-none resize-none"
                                                                        rows={3}
                                                                        placeholder="Escribe tu reflexión sobre esta pregunta..."
                                                                        value={nodeNotes[spot.id] ?? savedAnswer}
                                                                        onChange={(e) => {
                                                                            setNodeNotes(prev => ({ ...prev, [spot.id]: e.target.value }));
                                                                        }}
                                                                        onMouseDown={e => e.stopPropagation()}
                                                                        onClick={e => e.stopPropagation()}
                                                                        onKeyDown={e => e.stopPropagation()}
                                                                    />
                                                                    <div className="absolute bottom-2 right-2 flex gap-2">
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                const ans = nodeNotes[spot.id];
                                                                                if (ans && ans.trim() !== "") {
                                                                                    setLocalItem(\`oasis_blindspot_answer_\${user}__\${spot.id}\`, ans.trim());
                                                                                    setLocalItem(\`oasis_blindspot_resolved_\${user}__\${spot.id}\`, 'true');
                                                                                    const btn = e.currentTarget;
                                                                                    const origText = btn.innerHTML;
                                                                                    btn.innerHTML = '<span class="text-[9px] font-bold tracking-wide">¡GUARDADO!</span>';
                                                                                    setTimeout(() => btn.innerHTML = origText, 2000);
                                                                                    // Trigger re-render
                                                                                    setMapTransform(prev => ({...prev}));
                                                                                }
                                                                            }}
                                                                            className="flex items-center gap-1.5 p-1.5 px-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                                                                        >
                                                                            <span className="text-[9px] font-bold tracking-wide">{isResolved ? 'ACTUALIZAR' : 'SOLO GUARDAR'}</span>
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Kio IA Button at modal level, outside textarea, ONLY if all answered */}
                                                            {allResolved && (
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        let customPrompt = \`Quiero explorar profundamente mi nodo conductual: "\${currentNode.label}".\\nAquí están mis respuestas a las 3 preguntas clave:\\n\\n\`;
                                                                        explorations.forEach((ex, i) => {
                                                                            const ans = localStorage.getItem(\`oasis_blindspot_answer_\${user}__\${ex.id}\`) || nodeNotes[ex.id] || '';
                                                                            customPrompt += \`\${i + 1}. \${ex.question}\\nMi respuesta: \${ans}\\n\\n\`;
                                                                        });
                                                                        customPrompt += \`¿Qué patrones o insights descubres en base a estas reflexiones? ¿Cómo me sugieres reestructurar esto?\`;
                                                                        onOpenNodeChat?.(currentNode.id, currentNode.label, customPrompt);
                                                                    }}
                                                                    className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-900/30"
                                                                >
                                                                    <MessageCircle size={13} />
                                                                    <span>Analizar Respuestas con Kio IA</span>
                                                                </button>
                                                            )}
                                                        </div>
                                                    );
                                                }

                                                // If no explorations yet
                                                return (
                                                    <div className="flex flex-col gap-1.5 bg-zinc-900/30 border border-white/5 rounded-xl px-3 py-3 mt-1">
                                                        <label className="text-[9px] font-mono font-bold text-zinc-300 uppercase tracking-wider leading-relaxed">
                                                            Profundidad: {currentNode.reflection_question || \`¿Qué revela el patrón "\${currentNode.label}" sobre ti?\`}
                                                        </label>
                                                        
                                                        <div className="flex justify-between items-center mt-2 border-t border-white/5 pt-2">
                                                            <span className="text-[9px] text-zinc-500 italic">Analiza este nodo en 3 pasos.</span>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    generateExplorationForNode(currentNode);
                                                                }}
                                                                className="flex items-center gap-1 text-[9px] font-bold tracking-widest uppercase text-sky-400 hover:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 px-3 py-1.5 rounded-lg transition-colors border border-sky-500/20"
                                                            >
                                                                <Sparkles size={10} className={isGeneratingExplorations ? "animate-spin" : ""} />
                                                                {isGeneratingExplorations ? "Generando..." : "Generar Preguntas Profundas"}
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })()}

                                            {/* Footer Navigation */}
                                            <div className="flex items-center justify-between border-t border-white/5 pt-2.5 mt-1">
                                                <button
                                                    onClick={prevTourNode}
                                                    disabled={tourActiveIndex === 0}
                                                    className="px-3 py-1.5 bg-zinc-900 border border-white/5 hover:border-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors flex items-center gap-1 disabled:opacity-30 disabled:pointer-events-none"
                                                >
                                                    <ChevronLeft size={13} />
                                                    <span className="text-[10px] font-bold">Atrás</span>
                                                </button>
                                                <button
                                                    onClick={nextTourNode}
                                                    disabled={tourActiveIndex === sortedTourNodes.length - 1}
                                                    className="flex-1 max-w-[180px] py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-bold text-[10px] transition-colors flex items-center justify-center gap-1 shadow-md shadow-indigo-600/10 disabled:opacity-30 disabled:pointer-events-none"
                                                >
                                                    <span>Siguiente</span>
                                                    <ChevronRight size={13} />
                                                </button>
                                            </div>`;
                                            
    content = content.substring(0, startIndex) + replacement + content.substring(endOfButtonDiv);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Successfully replaced Guided Tour Modal!');
} else {
    console.log('Indices not found:', startIndex, endIndexMatch);
}
