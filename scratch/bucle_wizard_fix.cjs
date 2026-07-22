const fs = require('fs');
const file = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Lower z-index of Bucles page so NavBar is visible
// Find: <div className="absolute inset-0 z-[200] bg-[#050506] overflow-y-auto custom-scroll p-6 md:p-12 animate-in fade-in duration-300 pointer-events-auto">
// Or similar (with z-[200] and bg-[#050506])
const buclesPageRegex = /<div className="absolute inset-0 z-\[200\] bg-\[#050506\]([^"]*)"/g;
if (buclesPageRegex.test(content)) {
    content = content.replace(buclesPageRegex, '<div className="absolute inset-0 z-[100] bg-[#050506]$1"');
    console.log("Lowered z-index for Bucles Page");
}

// 2. Increase top padding of Bucles header
// Find: <div className="flex flex-col gap-2 pt-10 md:pt-16">
const headerRegex = /<div className="flex flex-col gap-2 pt-10 md:pt-16">/g;
if (headerRegex.test(content)) {
    content = content.replace(headerRegex, '<div className="flex flex-col gap-2 pt-24 md:pt-28">');
    console.log("Increased top padding for Bucles Header");
}

// 3. Implement Wizard for Reflection Question in Bucles
/* 
We need to replace:
{node.reflection_question && (
    <div className="flex flex-col gap-1.5 bg-zinc-900/30 border border-white/5 rounded-xl px-3 py-3 mt-1">
        ...
        <span className="text-[9px] font-bold tracking-wide">SOLO GUARDAR</span>
        ...
    </div>
)}

With a block that checks nodeExplorations[node.id] and renders the wizard if it exists.
*/
const startReflectionStr = `{node.reflection_question && (
                                                                            <div className="flex flex-col gap-1.5 bg-zinc-900/30 border border-white/5 rounded-xl px-3 py-3 mt-1">`;
const endReflectionStr = `</button>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            )}`;

const startIdx = content.indexOf(`{node.reflection_question && (`);
if (startIdx !== -1) {
    // We can just use the known structure since we know it ends near the "SOLO GUARDAR" button.
    // Let's use regex to find the block precisely.
    const regex = /\{node\.reflection_question && \(\s*<div className="flex flex-col gap-1\.5 bg-zinc-900\/30 border border-white\/5 rounded-xl px-3 py-3 mt-1">[\s\S]*?<\/button>\s*<\/div>\s*<\/div>\s*<\/div>\s*\)\}/;
    
    const replacement = `{(() => {
                                                                            const explorations = nodeExplorations && nodeExplorations[node.id];
                                                                            const hasExplorations = explorations && explorations.length > 0;
                                                                            
                                                                            if (hasExplorations) {
                                                                                const currentIdx = (selectedQuestionIndex || 0) % explorations.length;
                                                                                const spot = explorations[currentIdx];
                                                                                const spotId = \`node_reflection_\${spot.id}\`;
                                                                                const savedAnswer = localStorage.getItem(\`oasis_blindspot_answer_\${user}__\${spot.id}\`) || nodeNotes[spot.id] || '';
                                                                                const isResolved = spot.resolved || localStorage.getItem(\`oasis_blindspot_resolved_\${user}__\${spot.id}\`) === 'true';

                                                                                return (
                                                                                    <div className="flex flex-col gap-3 bg-zinc-900/40 border border-white/5 rounded-xl px-3 py-3 mt-1">
                                                                                        <div className="flex items-center justify-between">
                                                                                            <span className="text-[9px] font-mono text-zinc-400 font-bold uppercase tracking-widest">
                                                                                                Pregunta {currentIdx + 1} de {explorations.length}
                                                                                            </span>
                                                                                            <div className="flex items-center gap-1">
                                                                                                <button onClick={(e) => { e.stopPropagation(); setSelectedQuestionIndex((prev) => (prev - 1 + explorations.length) % explorations.length)); }} className="p-1 text-zinc-400 hover:text-white transition-colors"><ChevronLeft size={14}/></button>
                                                                                                <button onClick={(e) => { e.stopPropagation(); setSelectedQuestionIndex((prev) => (prev + 1) % explorations.length)); }} className="p-1 text-zinc-400 hover:text-white transition-colors"><ChevronRight size={14}/></button>
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
                                                                                                            // Notificamos para UX
                                                                                                            const btn = e.currentTarget;
                                                                                                            const origText = btn.innerHTML;
                                                                                                            btn.innerHTML = '<span class="text-[9px] font-bold tracking-wide">¡GUARDADO!</span>';
                                                                                                            setTimeout(() => btn.innerHTML = origText, 2000);
                                                                                                        }
                                                                                                    }}
                                                                                                    className="flex items-center gap-1.5 p-1.5 px-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                                                                                                    title="Solo guardar la reflexión"
                                                                                                >
                                                                                                    <span className="text-[9px] font-bold tracking-wide">{isResolved ? 'ACTUALIZAR' : 'SOLO GUARDAR'}</span>
                                                                                                </button>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            }

                                                                            return node.reflection_question && (
                                                                                <div className="flex flex-col gap-1.5 bg-zinc-900/30 border border-white/5 rounded-xl px-3 py-3 mt-1">
                                                                                    <label className="text-[9px] font-mono font-bold text-zinc-300 uppercase tracking-wider leading-relaxed">
                                                                                        Profundidad: {node.reflection_question}
                                                                                    </label>
                                                                                    
                                                                                    <div className="flex justify-between items-center mt-2 border-t border-white/5 pt-2">
                                                                                        <span className="text-[9px] text-zinc-500 italic">No hay preguntas profundas generadas.</span>
                                                                                        <button
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                generateExplorationForNode(node);
                                                                                            }}
                                                                                            className="flex items-center gap-1 text-[9px] font-bold tracking-widest uppercase text-sky-400 hover:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 px-3 py-1.5 rounded-lg transition-colors border border-sky-500/20"
                                                                                        >
                                                                                            <Sparkles size={10} className={isGeneratingExplorations ? "animate-spin" : ""} />
                                                                                            {isGeneratingExplorations ? "Generando..." : "Generar Preguntas Profundas"}
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })()}`;

    if (regex.test(content)) {
        content = content.replace(regex, replacement);
        console.log("Successfully integrated Wizard for Node Explorations inside Bucles view!");
    } else {
        console.warn("Could not find the node.reflection_question block to replace.");
    }
}

fs.writeFileSync(file, content, 'utf8');
