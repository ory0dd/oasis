const fs = require('fs');
const file = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const t1 = `{/* MÓDULO 1.5: ISLAS EXISTENCIALES (PATRONES CONDUCTUALES) ABAJO DEL MAPA */}
                            {mapViewTab === 'bucles' && (
                                <div className="absolute top-[80px] md:top-[120px] left-4 md:left-6 z-[200] w-[300px] md:w-[340px] max-h-[calc(100vh-140px)] bg-zinc-950/90 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-5 shadow-2xl flex flex-col gap-3 animate-in slide-in-from-left-8 pointer-events-auto overflow-y-auto custom-scroll">`;
const r1 = `{/* BACKGROUND SHIELD */}
                            {mapViewTab === 'bucles' && (
                                <div className="absolute inset-0 z-[100] bg-[#050506] pointer-events-auto animate-in fade-in duration-300" />
                            )}
                            {/* EMPTY STATE */}
                            {mapViewTab === 'bucles' && !selectedPatternId && (
                                <div className="hidden md:flex absolute top-[100px] left-[430px] right-8 bottom-8 z-[110] bg-zinc-950/30 backdrop-blur-3xl border border-white/5 border-dashed rounded-3xl flex-col items-center justify-center gap-6 animate-in fade-in duration-500 pointer-events-auto">
                                    <Compass size={64} className="text-zinc-700 animate-pulse" />
                                    <p className="text-zinc-500 font-mono uppercase tracking-widest text-sm text-center max-w-sm leading-relaxed">
                                        Selecciona un bucle del panel izquierdo para explorar su anatomía clínica.
                                    </p>
                                </div>
                            )}
                            {/* MÓDULO 1.5: ISLAS EXISTENCIALES (PATRONES CONDUCTUALES) ABAJO DEL MAPA */}
                            {mapViewTab === 'bucles' && (
                                <div className="absolute top-[90px] md:top-[100px] left-4 md:left-8 bottom-4 md:bottom-8 z-[120] md:z-[110] w-[calc(100%-2rem)] md:w-[380px] bg-zinc-950/80 md:bg-zinc-950/50 backdrop-blur-3xl border border-white/5 rounded-3xl p-4 md:p-6 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-left-8 pointer-events-auto overflow-y-auto custom-scroll">`;

content = content.replace(t1, r1);

const t2 = `                            {/* 1. Inline Island Analysis (when loop is selected but no specific node tour active) */}
                            {mapViewTab === 'bucles' && selectedPatternId && tourActiveIndex === null && activePattern && (
                                <div
                                    id="pattern-details-panel"
                                    className="absolute bottom-4 md:bottom-8 left-1/2 transform -translate-x-1/2 w-[95%] max-w-5xl z-[150] animate-in slide-in-from-bottom-8 duration-300 pointer-events-auto shadow-2xl"
                                    onClick={e => e.stopPropagation()}`;
const r2 = `                            {/* 1. Inline Island Analysis (when loop is selected but no specific node tour active) */}
                            {mapViewTab === 'bucles' && selectedPatternId && tourActiveIndex === null && activePattern && (
                                <div
                                    id="pattern-details-panel"
                                    className="absolute top-[90px] md:top-[100px] left-4 md:left-[430px] right-4 md:right-8 bottom-4 md:bottom-8 z-[130] md:z-[110] bg-zinc-950/95 md:bg-zinc-950/80 backdrop-blur-3xl border border-purple-500/20 rounded-3xl p-4 md:p-6 shadow-2xl flex flex-col gap-4 md:gap-6 animate-in slide-in-from-right-8 pointer-events-auto overflow-hidden"
                                    onClick={e => e.stopPropagation()}`;
content = content.replace(t2, r2);

const t3 = `                                    <div className="bg-zinc-950/95 border border-purple-500/20 rounded-2xl p-3.5 sm:p-4 shadow-2xl sm:backdrop-blur-md flex flex-col gap-3.5 sm:gap-4 overflow-hidden relative">`;
const r3 = `                                    <div className="flex flex-col gap-4 overflow-hidden h-full relative">`;
content = content.replace(t3, r3);

const t4 = `                                        {/* Content body */}
                                        <div className="flex flex-col gap-3.5 sm:gap-4 overflow-y-auto max-h-[320px] sm:max-h-[360px] custom-scroll pr-1.5 relative z-10">`;
const r4 = `                                        {/* Content body */}
                                        <div className="flex-1 flex flex-col gap-4 overflow-y-auto custom-scroll pr-2 relative z-10">`;
content = content.replace(t4, r4);

fs.writeFileSync(file, content, 'utf8');
console.log('Layout modified successfully!');
