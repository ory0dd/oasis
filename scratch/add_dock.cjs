const fs = require('fs');
const file = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const dockHtml = `
                            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex flex-wrap items-center gap-4 pointer-events-auto p-2 rounded-[1.5rem] bg-zinc-950/80 border border-white/10 backdrop-blur-2xl shadow-2xl z-[300]">
                                {/* Action Buttons */}
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => generateAFCAnalysis(false)}
                                        className="p-2 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white transition-all flex items-center justify-center active:scale-95 shadow-lg shadow-emerald-950/20"
                                        title="Generar Análisis Clínico"
                                    >
                                        <Sparkles size={13} />
                                    </button>
                                    <button
                                        onClick={() => reorganizeNodes()}
                                        className="p-2 rounded-lg bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all flex items-center justify-center active:scale-95"
                                        title="Reorganizar nodos del grafo"
                                    >
                                        <Network size={13} className="text-emerald-400" />
                                    </button>
                                    <button
                                        onClick={startTour}
                                        className="p-2 rounded-lg bg-indigo-600/90 hover:bg-indigo-500 text-white transition-all flex items-center justify-center active:scale-95"
                                        title="Iniciar recorrido clínico guiado"
                                    >
                                        <Compass size={13} />
                                    </button>
                                    {isEmbedded && (
                                        <button
                                            onClick={() => setViewMode(viewMode === 'dashboard' ? 'raw_data' : 'dashboard')}
                                            className="p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors text-zinc-400 hover:text-white flex items-center justify-center active:scale-95"
                                            title={viewMode === 'dashboard' ? 'Ver informe completo escrito' : 'Ver mapa interactivo de bucles'}
                                        >
                                            <FileText size={13} />
                                        </button>
                                    )}
                                </div>
                                {/* Right side actions */}
                                <div className="flex items-center gap-2">
                                    {isEmbedded && (
                                        <>
                                            <button
                                                onClick={() => importFileInputRef.current?.click()}
                                                className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/30 transition-colors text-emerald-400 hover:text-white flex items-center justify-center active:scale-95"
                                                title="Importar Informe Clínico (.doc)"
                                            >
                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                            </button>
                                            <input 
                                                type="file" 
                                                accept=".doc,.html" 
                                                ref={importFileInputRef} 
                                                onChange={handleImportDoc} 
                                                style={{ display: 'none' }} 
                                            />
                                            <button
                                                onClick={handleExportDoc}
                                                className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/30 transition-colors text-indigo-400 hover:text-white flex items-center justify-center active:scale-95"
                                                title="Exportar Informe Clínico a Documento Word"
                                            >
                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
`;

// Inject dock Html at the end of the Dashboard
const lastDivIndex = content.lastIndexOf('</div>');
content = content.substring(0, lastDivIndex) + dockHtml + '\\n        ' + content.substring(lastDivIndex);

fs.writeFileSync(file, content, 'utf8');
console.log('Dock re-added correctly at the end!');
