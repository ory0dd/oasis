const fs = require('fs');
const path = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx';

let code = fs.readFileSync(path, 'utf8');

// 1. Add state variable for active floating panel if not there
if (!code.includes('const [activeFloatingPanel, setActiveFloatingPanel]')) {
    code = code.replace(
        'const [isInitialZoom, setIsInitialZoom] = useState(true);',
        'const [activeFloatingPanel, setActiveFloatingPanel] = useState(null);\n    const [isInitialZoom, setIsInitialZoom] = useState(true);'
    );
}

// 2. Change root container
code = code.replace(
    'fixed inset-0 z-[100] bg-[#030304] overflow-y-auto no-scrollbar font-sans text-zinc-100 animate-in fade-in duration-700 flex flex-col',
    'fixed inset-0 z-[100] bg-[#030304] overflow-hidden font-sans text-zinc-100 animate-in fade-in duration-700 flex flex-col'
);
code = code.replace(
    'relative w-full h-full font-sans text-zinc-100 flex flex-col',
    'relative w-full h-full font-sans text-zinc-100 flex flex-col overflow-hidden'
);

// 3. Change content container classes to fill height
code = code.replace(
    'relative z-10 w-full px-3 sm:px-4 pt-[110px] md:pt-[96px] pb-safe flex-1 flex flex-col',
    'relative z-10 w-full h-full flex-1 flex flex-col'
);
code = code.replace(
    'relative z-10 w-full pb-2 flex-1 flex flex-col',
    'relative z-10 w-full h-full flex-1 flex flex-col'
);

// 4. Change viewMode wrapper
code = code.replace(
    '<div className="flex-1 flex flex-col gap-6 animate-in slide-in-from-bottom-8 duration-700 delay-200 fill-mode-both">',
    '<div className="absolute inset-0 flex-1 w-full h-full animate-in slide-in-from-bottom-8 duration-700 delay-200 fill-mode-both pointer-events-none">'
);

// 5. MÓDULO 1: Change to fullscreen
code = code.replace(
    '<div className="flex-1 bg-zinc-950/95 sm:bg-zinc-950/60 sm:backdrop-blur-xl border border-white/5 rounded-[2rem] p-3 md:p-4 shadow-2xl relative flex flex-col">',
    '<div className="absolute inset-0 bg-transparent flex flex-col pointer-events-auto">'
);

// Header inside MÓDULO 1
code = code.replace(
    '<div className="flex flex-row items-center justify-between gap-2 mb-2">',
    '<div className="absolute top-6 left-6 right-6 z-50 flex flex-row items-center justify-between gap-2 mb-2 pointer-events-none">\n<div className="flex items-center gap-2 pointer-events-auto">'
);
code = code.replace(
    '<div className="flex items-center gap-2">\n                                    <h2 className="text-sm font-bold text-white flex items-center gap-1.5">',
    '<h2 className="text-sm font-bold text-white flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md">'
);

code = code.replace(
    '<div className="flex flex-wrap items-center gap-4">',
    '</div>\n<div className="flex flex-wrap items-center gap-4 pointer-events-auto p-1.5 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md">'
);

// 6. Dock
const mod15Index = code.indexOf('{/* MÓDULO 1.5: ISLAS EXISTENCIALES');
const dockHTML = `
                        {/* DOCK FLOTANTE */}
                        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-[100] pointer-events-auto">
                            <div className="flex items-center gap-2 p-2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
                                <button onClick={() => setActiveFloatingPanel(p => p === 'islas' ? null : 'islas')} className={\`p-3 rounded-xl transition-all \${activeFloatingPanel === 'islas' ? 'bg-purple-500/20 text-purple-400 shadow-inner' : 'hover:bg-white/10 text-zinc-400'}\`} title="Islas del Mapa">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
                                </button>
                                <button onClick={() => setActiveFloatingPanel(p => p === 'diagnostico' ? null : 'diagnostico')} className={\`p-3 rounded-xl transition-all \${activeFloatingPanel === 'diagnostico' ? 'bg-emerald-500/20 text-emerald-400 shadow-inner' : 'hover:bg-white/10 text-zinc-400'}\`} title="Diagnóstico Fenomenológico">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                </button>
                            </div>
                        </div>
`;
code = code.slice(0, mod15Index) + dockHTML + '\n' + code.slice(mod15Index);

// 7. Islas
code = code.replace(
    '<div className="bg-zinc-950/60 backdrop-blur-xl border border-white/5 rounded-[2rem] p-4 md:p-6 shadow-xl">',
    '{activeFloatingPanel === \'islas\' && (\n<div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 w-[95%] max-w-6xl z-[150] bg-zinc-950/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-4 md:p-6 shadow-2xl animate-in slide-in-from-bottom-8 pointer-events-auto">'
);

const mod2Index = code.indexOf('{/* MÓDULO 2: RASGOS PID-5');
code = code.slice(0, mod2Index) + '</div>\n)}\n' + code.slice(mod2Index);

// 8. Diagnóstico (MÓDULO 2 + 3)
code = code.replace(
    '{/* MÓDULO 2: RASGOS PID-5 E INTEGRACIÓN CLÍ NICA (Abajo del mapa) */}',
    `{/* PANEL LATERAL: DIAGNÓSTICO */}
{activeFloatingPanel === 'diagnostico' && (
<div className="absolute top-0 right-0 h-full w-[450px] max-w-full z-[150] bg-zinc-950/90 backdrop-blur-3xl border-l border-white/10 p-6 overflow-y-auto animate-in slide-in-from-right-8 shadow-2xl pointer-events-auto flex flex-col gap-6 custom-scroll">
    <div className="flex items-center justify-between shrink-0">
        <h3 className="text-lg font-black text-white">Diagnóstico y Modalidades</h3>
        <button onClick={() => setActiveFloatingPanel(null)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-white transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
    </div>
{/* MÓDULO 2: RASGOS PID-5 E INTEGRACIÓN CLÍ NICA (Abajo del mapa) */}`
);

// We replace the outer div of Modulo 2 and Modulo 3 to just transparent divs
code = code.replace(
    'className="bg-zinc-950/95 sm:bg-zinc-950/60 sm:backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 shadow-2xl flex flex-col gap-6 animate-in slide-in-from-bottom-6 duration-200 mt-2"',
    'className="bg-black/20 border border-white/5 rounded-2xl p-5 flex flex-col gap-6"'
);
code = code.replace(
    'className="bg-zinc-950/40 border border-white/5 rounded-[2rem] p-6 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-bottom-6 duration-200 delay-100 mt-2"',
    'className="bg-black/20 border border-white/5 rounded-2xl p-5 flex flex-col gap-4"'
);

// NOW to safely close the 'diagnostico' panel. It should wrap Modulo 2 and Modulo 3.
// The end of Módulo 3 is followed by the end of the `isEmbedded` block, then the end of `viewMode === 'raw_data'` block.
// The raw_data block end looks like:
//                                 </div>
//                             </div>
//                         )}
//                     </div>
//                 )}
//             </div>
//         </div>
//     );

const viewModeEndIndex = code.lastIndexOf('            </div>\n\n</div>\n    );\n};');


if (viewModeEndIndex !== -1) {
    code = code.slice(0, viewModeEndIndex) + '</div>\n)}\n' + code.slice(viewModeEndIndex);
    fs.writeFileSync(path, code, 'utf8');
    console.log('Refactoring V3 complete!');
} else {
    console.error("Could not find viewMode end string to safely close the last block.");
}
