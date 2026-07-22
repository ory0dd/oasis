const fs = require('fs');
let code = fs.readFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx', 'utf8');

// 1. Auto-select pattern logic
const effectInjection = `
    const hasAutoSelectedPattern = useRef(false);
    useEffect(() => {
        if (!hasAutoSelectedPattern.current && currentPatterns.length > 0 && !selectedPatternId) {
            hasAutoSelectedPattern.current = true;
            setSelectedPatternId(currentPatterns[0].id);
        }
    }, [currentPatterns, selectedPatternId]);
`;
code = code.replace(
    '    const activePattern = useMemo(() => {',
    effectInjection + '\n    const activePattern = useMemo(() => {'
);

// 2. Map Container layout fixes
code = code.replace(
    '"fixed inset-0 z-[100] bg-[#030304] overflow-y-auto no-scrollbar font-sans text-zinc-100 animate-in fade-in duration-700 flex flex-col"',
    '"fixed inset-0 z-[100] bg-transparent overflow-hidden font-sans text-zinc-100 animate-in fade-in duration-700 flex flex-col pointer-events-none"'
);

code = code.replace(
    '<div className="fixed inset-0 pointer-events-none z-0">\n                    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-accent/5 blur-[150px] rounded-full mix-blend-screen transform translate-x-1/3 -translate-y-1/3" style={{ backgroundColor: accent }} />\n                    <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-500/5 blur-[150px] rounded-full mix-blend-screen transform -translate-x-1/3 translate-y-1/3" />\n                    <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: \'radial-gradient(circle, #fff 1px, transparent 1px)\', backgroundSize: \'32px 32px\' }} />\n                </div>',
    '<div className="fixed inset-0 pointer-events-none z-0">\n                    <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: \'radial-gradient(circle, #fff 1px, transparent 1px)\', backgroundSize: \'32px 32px\' }} />\n                </div>'
);

code = code.replace(
    '"relative z-10 w-full px-3 sm:px-4 pt-[110px] md:pt-[96px] pb-safe flex-1 flex flex-col"',
    '"relative z-10 w-full h-full flex-1 flex flex-col pointer-events-none"'
);

code = code.replace(
    '<div className="flex-1 flex flex-col gap-6 animate-in slide-in-from-bottom-8 duration-700 delay-200 fill-mode-both">',
    '<div className="absolute inset-0 w-full h-full animate-in slide-in-from-bottom-8 duration-700 delay-200 fill-mode-both pointer-events-none">'
);

code = code.replace(
    '<div className="flex-1 bg-zinc-950/95 sm:bg-zinc-950/60 sm:backdrop-blur-xl border border-white/5 rounded-[2rem] p-3 md:p-4 shadow-2xl relative flex flex-col">',
    '<div className="absolute inset-0 z-0 flex flex-col w-full h-full pointer-events-auto">'
);

// Header Flotante
code = code.replace(
    '<div className="flex flex-row items-center justify-between gap-2 mb-2">',
    '<div className="absolute top-[20px] left-6 right-6 z-[120] flex flex-row items-center justify-between gap-2 pointer-events-none">'
);
code = code.replace(
    '<div className="flex items-center gap-2">',
    '<div className="flex items-center gap-2 pointer-events-auto">'
);
code = code.replace(
    '<h2 className="text-sm font-bold text-white flex items-center gap-1.5">',
    '<h2 className="text-sm font-bold text-white flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md shadow-lg">'
);
code = code.replace(
    '<div className="flex flex-wrap items-center gap-4">',
    '<div className="flex flex-wrap items-center gap-4 pointer-events-auto p-1.5 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md shadow-lg">'
);

// Segmented Tabs
const oldTabsStart = code.indexOf('{/* Segmented Control Tabs */}');
const mapRefIndex = code.indexOf('ref={mapContainerRef}', oldTabsStart);
if (oldTabsStart !== -1 && mapRefIndex !== -1) {
    const tabsHtml = `
                            {/* Segmented Control Tabs (Top NavBar) */}
                            <div className="absolute top-[80px] left-1/2 transform -translate-x-1/2 z-[150] flex bg-black/60 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 w-fit min-w-[300px] gap-1 shadow-2xl pointer-events-auto">
                                <button onClick={() => setMapViewTab('map')} className={\`px-4 py-2 rounded-xl text-[11px] uppercase tracking-wider font-black transition-all flex items-center justify-center gap-1.5 \${mapViewTab === 'map' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}\`}><Network size={13} /><span>El Mapa</span></button>
                                <button onClick={() => setMapViewTab('avances')} className={\`px-4 py-2 rounded-xl text-[11px] uppercase tracking-wider font-black transition-all flex items-center justify-center gap-1.5 \${mapViewTab === 'avances' ? 'bg-blue-600 text-white shadow-md' : 'text-zinc-500 hover:text-blue-400'}\`}><MessageSquare size={13} /><span>Avances</span></button>
                                <button onClick={() => setMapViewTab('islas')} className={\`px-4 py-2 rounded-xl text-[11px] uppercase tracking-wider font-black transition-all flex items-center justify-center gap-1.5 \${mapViewTab === 'islas' ? 'bg-purple-600 text-white shadow-md' : 'text-zinc-500 hover:text-purple-400'}\`}><Compass size={13} /><span>Islas</span></button>
                                <button onClick={() => setMapViewTab('diagnostico')} className={\`px-4 py-2 rounded-xl text-[11px] uppercase tracking-wider font-black transition-all flex items-center justify-center gap-1.5 \${mapViewTab === 'diagnostico' ? 'bg-emerald-600 text-white shadow-md' : 'text-zinc-500 hover:text-emerald-400'}\`}><Activity size={13} /><span>Diagnóstico</span></button>
                                <button onClick={() => setMapViewTab('claves')} className={\`px-4 py-2 rounded-xl text-[11px] uppercase tracking-wider font-black transition-all flex items-center justify-center gap-1.5 \${mapViewTab === 'claves' ? 'bg-orange-600 text-white shadow-md' : 'text-zinc-500 hover:text-orange-400'}\`}><Sparkles size={13} /><span>Claves</span></button>
                            </div>
    `;
    const divBeforeMap = code.lastIndexOf('<div', mapRefIndex);
    code = code.substring(0, oldTabsStart) + tabsHtml + code.substring(divBeforeMap);
}

// Fullscreen canvas
code = code.replace(
    'className={`w-full flex-1 min-h-[340px] sm:min-h-[420px] md:min-h-[500px] h-[50vh] md:h-[65vh] bg-[#050506]/80 rounded-[1.5rem] border border-white/5 relative overflow-hidden group select-none transition-all duration-200 ease-in-out',
    'className={`absolute inset-0 z-0 bg-transparent overflow-hidden group select-none transition-all duration-200 ease-in-out pointer-events-auto'
);

// MÓDULO 1.5 ISLAS flotantes
code = code.replace(
    '{/* MÓDULO 1.5: ISLAS EXISTENCIALES */}',
    '{/* MÓDULO 1.5: ISLAS EXISTENCIALES (FLOTANTE) */}\n{mapViewTab === \'islas\' && ('
);
code = code.replace(
    '<div className="bg-zinc-950/60 backdrop-blur-xl border border-white/5 rounded-[2rem] p-4 md:p-6 shadow-xl">',
    '<div className="absolute top-[140px] left-1/2 transform -translate-x-1/2 w-[95%] max-w-6xl z-[200] bg-zinc-950/90 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-6 shadow-2xl animate-in fade-in slide-in-from-top-8 pointer-events-auto">'
);
code = code.replace(
    '                            </div>\n                        </div>\n\n                        {/* MÓDULO 2: RASGOS PID-5 E INTEGRACIÓN CLÍ NICA (Abajo del mapa) */}',
    '                            </div>\n                        </div>\n                        )}\n\n                        {/* MÓDULO 2: RASGOS PID-5 E INTEGRACIÓN CLÍ NICA (Abajo del mapa) */}'
);

// MÓDULO 2 DIAGNÓSTICO flotantes
code = code.replace(
    '{/* MÓDULO 2: RASGOS PID-5 E INTEGRACIÓN CLÍ NICA (Abajo del mapa) */}',
    '{/* MÓDULO 2 Y 3: DIAGNÓSTICO (FLOTANTE) */}\n{mapViewTab === \'diagnostico\' && ('
);
// Replace the opening div of modulo 2
code = code.replace(
    '<div className="bg-zinc-950/95 sm:bg-zinc-950/60 sm:backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 shadow-2xl flex flex-col gap-6 animate-in slide-in-from-bottom-6 duration-200 mt-2">',
    '<div className="absolute top-[140px] bottom-6 right-6 w-[450px] max-w-[calc(100vw-3rem)] z-[200] bg-zinc-950/95 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-6 overflow-y-auto animate-in slide-in-from-right-8 shadow-2xl pointer-events-auto custom-scroll flex flex-col gap-6"><div className="flex items-center justify-between shrink-0"><h3 className="text-lg font-black text-white">Diagnóstico Clínico</h3><button onClick={() => setMapViewTab(\'map\')} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-white transition-colors"><X size={16} /></button></div>'
);
// Now close modulo 2 at the end of modulo 3 (right before Modulo 4)
code = code.replace(
    '                            </div>\n                        </div>\n\n                        {/* MÓDULO 4: PLAN DE TRATAMIENTO */}',
    '                            </div>\n                        </div>\n                        )}\n\n                        {/* MÓDULO 4: PLAN DE TRATAMIENTO */}'
);

// MÓDULO 4 TRATAMIENTO flotante
code = code.replace(
    '{/* MÓDULO 4: PLAN DE TRATAMIENTO */}',
    '{/* MÓDULO 4: PLAN DE TRATAMIENTO (FLOTANTE) */}\n{mapViewTab === \'tratamiento\' && ('
);
// Replace the opening div of modulo 4
code = code.replace(
    '<div className="bg-zinc-950/40 border border-white/5 rounded-[2rem] p-6 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-bottom-6 duration-200 delay-100 mt-2">',
    '<div className="absolute top-[140px] bottom-6 right-6 w-[500px] max-w-[calc(100vw-3rem)] z-[200] bg-zinc-950/95 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-6 overflow-y-auto animate-in slide-in-from-right-8 shadow-2xl pointer-events-auto custom-scroll flex flex-col gap-6"><div className="flex items-center justify-between shrink-0 mb-2"><h3 className="text-lg font-black text-white">Plan de Tratamiento</h3><button onClick={() => setMapViewTab(\'map\')} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-white transition-colors"><X size={16} /></button></div>'
);
// Close Modulo 4 right before the end of viewMode == 'dashboard'
code = code.replace(
    '                        {/* MÓDULO 4: PLAN DE TRATAMIENTO */}\n                        {mapViewTab === \'tratamiento\' && (',
    '                        {/* MÓDULO 4: PLAN DE TRATAMIENTO (FLOTANTE) */}\n                        {mapViewTab === \'tratamiento\' && (' // (Already replaced above, this is just to orient where we are)
);
// Wait, the end of modulo 4 is:
//                             </div>
//                         </div>
//                     </div>
//                 )}
code = code.replace(
    '                            </div>\n                        </div>\n                    </div>\n                )}',
    '                            </div>\n                        </div>\n                        )}\n                    </div>\n                )}'
);


fs.writeFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx', code);
console.log("Fixes applied successfully via custom node script.");
