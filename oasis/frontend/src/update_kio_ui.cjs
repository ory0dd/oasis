const fs = require('fs');
let lines = fs.readFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx', 'utf8').split('\n');

const replacement = `                                            <div className="bg-black/40 p-5 rounded-2xl border border-cyan-500/10 space-y-3 flex flex-col max-h-[300px]">
                                                <h3 className="text-[10px] font-black uppercase tracking-widest text-cyan-500 flex items-center gap-2">
                                                    <Target size={12} /> Memoria Activa de Kio
                                                </h3>
                                                <p className="text-[10px] text-cyan-100/50 leading-relaxed">
                                                    Hechos destilados que Kio recuerda actualmente en sus conversaciones con el individuo.
                                                </p>
                                                <div className="flex-1 overflow-y-auto pr-2 space-y-2 no-scrollbar">
                                                    {kioMemory.length === 0 ? (
                                                        <p className="text-[10px] text-cyan-500/50 font-mono text-center py-4 uppercase">Sin memoria registrada</p>
                                                    ) : (
                                                        [...kioMemory].sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0)).map((fact, idx) => (
                                                            <div key={idx} className={\`p-3 rounded-xl border \${fact.isPinned ? 'bg-cyan-950/40 border-cyan-500/30' : 'bg-black/20 border-white/5'}\`}>
                                                                <div className="flex items-center gap-2 mb-1.5">
                                                                    <span className={\`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded \${fact.isPinned ? 'bg-cyan-500 text-black' : 'bg-white/10 text-zinc-400'}\`}>
                                                                        {fact.isPinned ? 'PINNED' : (fact.category || 'General')}
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs text-zinc-300 leading-relaxed font-serif italic">{fact.text}</p>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>`;

lines.splice(3412, 11, replacement);

fs.writeFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx', lines.join('\n'));
