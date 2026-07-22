const fs = require('fs');
let lines = fs.readFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx', 'utf8').split('\n');

const replacement = `                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleSaveKioMemory}
                                                    disabled={isSavingKio || !treatmentPlan.kioMemoryBase}
                                                    className="bg-zinc-800 hover:bg-zinc-700 text-cyan-400 font-black text-[10px] uppercase tracking-widest py-2 px-5 rounded-full transition-all flex items-center gap-2 border border-cyan-500/30 disabled:opacity-50"
                                                >
                                                    {isSavingKio ? (
                                                        <><div className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" /> Inyectando...</>
                                                    ) : (
                                                        <><Target size={12} /> Inyectar a Memoria Base</>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={generateKioDirectives}
                                                    disabled={isGeneratingKio}
                                                    className="bg-cyan-500 hover:bg-cyan-400 text-black font-black text-[10px] uppercase tracking-widest py-2 px-5 rounded-full transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] disabled:opacity-50"
                                                >
                                                    {isGeneratingKio ? (
                                                        <><div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" /> Analizando...</>
                                                    ) : (
                                                        <><Sparkles size={12} /> Auto-Generar con IA</>
                                                    )}
                                                </button>
                                            </div>`;

lines.splice(3400, 11, replacement);

fs.writeFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx', lines.join('\n'));
