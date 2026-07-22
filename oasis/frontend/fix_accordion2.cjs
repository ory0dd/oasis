const fs = require('fs');
const file = 'src/components/MyResponsesDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const startStr = '                                            {/* SECUENCIA Y DESGLOSE (ACCORDION) */}';
const endStr = '                                        {/* Footer Actions */}';

const start = content.indexOf(startStr);
const end = content.indexOf(endStr);

if (start > -1 && end > start) {
    const newBlock =                                             {/* SECUENCIA Y DESGLOSE (ACCORDION) */}
                                            <div className="bg-zinc-900/30 border border-white/5 rounded-xl p-3 flex flex-col gap-2">
                                                <h5 className="text-[9px] font-mono font-black uppercase tracking-wider text-zinc-400">Secuencia Temporal y Desglose</h5>
                                                
                                                <div className="flex flex-col gap-2 mt-1 relative">
                                                    {activePattern.sortedNodes?.map((node, idx) => {
                                                        const typeColors = {
                                                            historical: "bg-amber-500/10 border-amber-500/20 text-amber-400",
                                                            biological: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
                                                            social: "bg-sky-500/10 border-sky-500/20 text-sky-400",
                                                            cognitive: "bg-purple-500/10 border-purple-500/20 text-purple-400",
                                                            motor: "bg-pink-500/10 border-pink-500/20 text-pink-400",
                                                            physiological: "bg-rose-500/10 border-rose-500/20 text-rose-400",
                                                            consequence: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                                                        };

                                                        const typeShortLabels = {
                                                            historical: "Histórico",
                                                            biological: "Biológico",
                                                            social: "Social",
                                                            cognitive: "Cognitivo",
                                                            motor: "Motor",
                                                            physiological: "Fisiológico",
                                                            consequence: "Consecuencia"
                                                        };
                                                        
                                                        const isExpanded = selectedNode?.id === node.id;

                                                        return (
                                                            <div 
                                                                key={node.id}
                                                                className={\lex flex-col rounded-xl border transition-all duration-300 overflow-hidden \\}
                                                            >
                                                                <div 
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (isExpanded) {
                                                                            setSelectedNode(null);
                                                                        } else {
                                                                            setSelectedNode(node);
                                                                            setTimeout(() => zoomToNode(node), 50);
                                                                        }
                                                                    }}
                                                                    className="flex flex-row items-center gap-3 p-3 cursor-pointer group/step"
                                                                >
                                                                    <div className={\w-8 h-8 rounded-full border flex items-center justify-center font-bold text-[11px] shrink-0 z-10 shadow-sm \ transition-colors\}>
                                                                        {idx + 1}
                                                                    </div>
                                                                    
                                                                    <div className="flex flex-col min-w-0 flex-1">
                                                                        <span className="text-[8px] font-mono uppercase tracking-widest text-zinc-500">{typeShortLabels[node.type]}</span>
                                                                        <span className={\	ext-[11px] font-black uppercase tracking-wide mt-0.5 leading-tight transition-colors \\}>{node.label}</span>
                                                                    </div>

                                                                    <div className={\ml-auto shrink-0 transition-transform duration-300 \\}>
                                                                        <ChevronDown size={16} />
                                                                    </div>
                                                                </div>
                                                                
                                                                {/* Accordion Body */}
                                                                <div 
                                                                    className={\	ransition-all duration-300 ease-in-out \\}
                                                                >
                                                                    <div className="px-3 pb-4 pt-1 flex flex-col gap-3">
                                                                        <p className="text-[12px] text-zinc-200 leading-relaxed font-sans font-medium">
                                                                            {getFallbackDescription(node, user)}
                                                                        </p>
                                                                        
                                                                        <div className="mt-1 pt-3 border-t border-white/10 pl-3 border-l-[3px] border-white/20 bg-black/20 p-3 rounded-r-xl">
                                                                            <p className="text-[9px] font-mono font-black uppercase tracking-widest text-zinc-400">Origen o Hipótesis</p>
                                                                            <p className="text-[11px] text-zinc-300 italic leading-relaxed mt-1.5">
                                                                                {getFallbackSource(node, bioData, phenomData)}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>\n\n;
    content = content.slice(0, start) + newBlock + content.slice(end);
    fs.writeFileSync(file, content);
    console.log('Fixed block!');
} else {
    console.log('Markers not found');
}
