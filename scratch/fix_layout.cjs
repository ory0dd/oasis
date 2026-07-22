const fs = require('fs');
const file = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Find Tus Bucles bounds
const startBuclesStr = `{/* MÓDULO 1.5: ISLAS EXISTENCIALES (PATRONES CONDUCTUALES) ABAJO DEL MAPA */}`;
let startBucles = content.indexOf(startBuclesStr);
if (startBucles === -1) {
    console.error("Failed to find startBucles");
    process.exit(1);
}

const endBuclesStr = `                            {/* 1. Inline Island Analysis (when loop is selected but no specific node tour active) */}`;
let endBucles = content.indexOf(endBuclesStr);
if (endBucles === -1) {
    console.error("Failed to find endBucles");
    process.exit(1);
}

// 2. Find pattern-details-panel bounds
let startDetails = endBucles;
let endDetailsStr = `{mapViewTab === 'map' && tourActiveIndex !== null && sortedTourNodes[tourActiveIndex] && (() => {`;
let endDetails = content.indexOf(endDetailsStr);
if (endDetails === -1) {
    console.error("Failed to find endDetails");
    process.exit(1);
}
// We want to stop right before the endDetails line.
let endDetailsIdx = content.lastIndexOf(`                            {`, endDetails);

// 3. Extract inner content of pattern-details-panel
// We want everything from {/* Content body */} to the end of the panel's inner content.
let innerStartStr = `{/* Content body */}`;
let innerStart = content.indexOf(innerStartStr, startDetails);

// Find the last button "Explorar con Kio IA"
let exploreBtnStr = `<span>Explorar con Kio IA</span>`;
let exploreBtnIdx = content.indexOf(exploreBtnStr, innerStart);
// Find the closing divs after the button.
// The button is closed with </button>. Then </div> for Footer Actions.
// Then </div> for the inner scroll container or whatever.
let endOfInner = content.indexOf(`</div>`, content.indexOf(`</button>`, exploreBtnIdx));
// Wait, Footer Actions div closes at `</div>`.
endOfInner = endOfInner + 6; // include </div>

let extractedDetails = content.substring(innerStart, endOfInner);

// Remove the max-h and overflow from Content body so it expands fully
extractedDetails = extractedDetails.replace(/overflow-y-auto max-h-\[320px\] sm:max-h-\[360px\] custom-scroll pr-1\.5/g, '');

// Replace activePattern with pat
extractedDetails = extractedDetails.replace(/activePattern/g, 'pat');

// 4. Construct new Bucles list
const newBuclesPage = `${startBuclesStr}
                            {/* BUCLES PAGE (LIST FORMAT) */}
                            {mapViewTab === 'bucles' && (
                                <div className="absolute inset-0 z-[200] bg-[#050506] overflow-y-auto custom-scroll p-6 md:p-12 animate-in fade-in duration-300 pointer-events-auto">
                                    <div className="max-w-4xl mx-auto flex flex-col gap-8 pb-20">
                                        
                                        {/* Header */}
                                        <div className="flex flex-col gap-2 pt-10 md:pt-16">
                                            <div className="flex items-center gap-3">
                                                <Compass size={28} className="text-purple-500" />
                                                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-wider text-white">Tus Bucles Clínicos</h2>
                                            </div>
                                            <p className="text-xs md:text-sm text-zinc-400 font-mono tracking-widest uppercase">Análisis y Secuencias Conductuales</p>
                                        </div>
                                        
                                        {showUnlockNotification && (
                                            <div className="bg-emerald-950/90 border border-emerald-500/50 p-4 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.3)] flex items-center gap-4 backdrop-blur-md cursor-pointer hover:bg-emerald-900/90 transition-colors animate-in fade-in" onClick={() => setShowUnlockNotification(false)}>
                                                <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-400/30">
                                                    <Sparkles size={20} className="text-emerald-400 animate-pulse" />
                                                </div>
                                                <div>
                                                    <h4 className="text-emerald-400 font-black uppercase tracking-widest text-sm flex items-center gap-2">¡Nuevo Nivel Alcanzado!</h4>
                                                    <p className="text-emerald-200 text-xs font-medium mt-0.5">Has desbloqueado {recentlyUnlocked} nuevo(s) bucle(s) gracias a tu progreso.</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* List */}
                                        <div className="flex flex-col gap-4">
                                            {currentPatterns.length === 0 ? (
                                                <div className="p-8 border border-white/5 border-dashed rounded-3xl flex items-center justify-center text-zinc-500 italic">No hay islas en este mapa clínico.</div>
                                            ) : (
                                                currentPatterns.map((pat, idx) => {
                                                    const isLocked = idx >= unlockedCount;
                                                    const isSelected = selectedPatternId === pat.id;
                                                    
                                                    return (
                                                        <div key={pat.id} className={\`flex flex-col rounded-3xl border transition-all duration-300 overflow-hidden \${isLocked ? 'opacity-40 grayscale bg-black/30 border-white/5' : isSelected ? 'bg-zinc-950 border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.05)]' : 'bg-black/50 border-white/10 hover:border-white/20 hover:bg-black/80'}\`}>
                                                            
                                                            {/* Card Header (Click to expand) */}
                                                            <button 
                                                                disabled={isLocked}
                                                                onClick={() => {
                                                                    if (isSelected) {
                                                                        setSelectedPatternId(null);
                                                                    } else {
                                                                        setSelectedPatternId(pat.id);
                                                                    }
                                                                }}
                                                                className="p-5 md:p-6 flex flex-col gap-3 text-left w-full relative overflow-hidden focus:outline-none"
                                                            >
                                                                {isSelected && (
                                                                    <>
                                                                        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-purple-500/5 blur-[100px] pointer-events-none" />
                                                                        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none" />
                                                                    </>
                                                                )}
                                                                
                                                                <div className="flex items-center justify-between w-full relative z-10">
                                                                    <div className="flex items-center gap-3">
                                                                        {isLocked ? <Lock size={18} className="text-zinc-500" /> : <Compass size={18} className={isSelected ? "text-purple-400" : "text-zinc-500"} />}
                                                                        <span className="text-base md:text-lg font-black uppercase tracking-wider text-zinc-200">{pat.nombre}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-4">
                                                                        {pat.node_ids && (
                                                                            <span className="hidden md:inline-block text-xs px-2 py-1 rounded bg-zinc-900 text-zinc-400 font-mono font-bold border border-white/5">
                                                                                {pat.node_ids.length} Nodos
                                                                            </span>
                                                                        )}
                                                                        <ChevronDown size={20} className={\`text-zinc-500 transition-transform duration-300 \${isSelected ? 'rotate-180 text-purple-400' : ''}\`} />
                                                                    </div>
                                                                </div>
                                                                
                                                                {pat.descripcion && (
                                                                    <p className="text-xs md:text-sm text-zinc-400 leading-relaxed max-w-3xl relative z-10 mt-1">
                                                                        {pat.descripcion}
                                                                    </p>
                                                                )}
                                                                
                                                                <div className="flex gap-2 mt-2 relative z-10">
                                                                    <span className={\`text-[9px] px-2 py-1 rounded-sm font-black uppercase tracking-widest \${pat.computedIntensity >= 15 ? 'bg-red-500/20 text-red-400 border border-red-500/20' : pat.computedIntensity >= 8 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'}\`}>
                                                                        {pat.computedIntensity >= 15 ? 'Capa Profunda' : pat.computedIntensity >= 8 ? 'Capa Media' : 'Capa Cercana'}
                                                                    </span>
                                                                    <span className="text-[9px] px-2 py-1 rounded-sm bg-zinc-800 text-zinc-400 font-bold tracking-widest border border-white/5">
                                                                        {pat.computedDifficulty > 3 ? 'Desafiante' : 'Abordable'}
                                                                    </span>
                                                                </div>
                                                            </button>
                                                            
                                                            {/* Card Expanded Body */}
                                                            {isSelected && (
                                                                <div className="border-t border-white/5 bg-black/40 p-5 md:p-6 flex flex-col gap-6 animate-in slide-in-from-top-4 duration-300 relative z-10">
${extractedDetails}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )
                                                })
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

`;

// 5. Build final content
const newContent = content.substring(0, startBucles) + newBuclesPage + content.substring(endDetailsIdx);

fs.writeFileSync(file, newContent, 'utf8');
console.log("Successfully reformatted bucles and removed old details panel, leaving Guided Tour intact.");
