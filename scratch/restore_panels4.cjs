const fs = require('fs');
const file = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Tour Panel Size Fix
content = content.replace(
    'className="w-full animate-in slide-in-from-bottom-4 duration-300 mt-3"',
    'className="absolute bottom-[100px] right-6 w-[400px] max-w-[calc(100vw-3rem)] z-[200] animate-in slide-in-from-right-8 duration-300"'
);

// 2. Remove Full Screen Overlays for tabs
let fullScreenLoop = `                                {mapViewTab === 'loop' && (
                                    <div className="absolute inset-0 z-40 bg-[#050506]/95 p-6 md:p-8 overflow-y-auto no-scrollbar animate-in fade-in duration-300">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-6 border-b border-white/5 pb-3 flex items-center gap-2 sticky top-0 bg-[#050506]/95 z-50">
                                            <Brain size={14} /> ¿Cómo funciona tu bucle? (En palabras sencillas)
                                        </h3>
                                        <div className="p-6 md:p-8 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl w-full max-w-4xl mx-auto shadow-inner mb-8">
                                            <p className="text-sm md:text-base text-zinc-300 leading-relaxed font-sans whitespace-pre-line">
                                                {afcData?.explicacion_sencilla || (
                                                    afcData?.hypotheses?.mantenimiento
                                                        ? "Tu mente y cuerpo han creado un patrón automático: cuando enfrentas tensiones de tu entorno o recuerdos de tu historia, reaccionas con ciertos pensamientos y conductas de protección. Aunque esto te da alivio inmediato, a largo plazo refuerza y mantiene el problema en el tiempo, impidiéndote avanzar."
                                                        : "Procesando datos..."
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                )}`;
content = content.replace(fullScreenLoop, '');

let fullScreenExitKeys = `                                {mapViewTab === 'exit_keys' && (
                                    <div className="absolute inset-0 z-40 bg-[#050506]/95 p-6 md:p-8 overflow-y-auto no-scrollbar animate-in fade-in duration-300">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-6 border-b border-white/5 pb-3 flex items-center gap-2 sticky top-0 bg-[#050506]/95 z-50">
                                            <Target size={14} /> Claves para salir de aquí
                                        </h3>
                                        <div className="p-6 md:p-8 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl w-full max-w-4xl mx-auto shadow-inner mb-8">
                                            <p className="text-sm md:text-base text-zinc-300 leading-relaxed font-sans whitespace-pre-line">
                                                {afcData?.claves_salida || (
                                                    afcData?.hypotheses?.solucion
                                                        ? \`\${afcData.hypotheses.solucion}. Explora el mapa para identificar qué pensamientos o conductas puedes empezar a flexibilizar.\`
                                                        : "Procesando datos..."
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                )}`;
content = content.replace(fullScreenExitKeys, '');

// Also remove if there are different line endings
content = content.replace(fullScreenLoop.replace(/\\n/g, '\\r\\n'), '');
content = content.replace(fullScreenExitKeys.replace(/\\n/g, '\\r\\n'), '');


// 3. Restore and rename Diagnostico -> CÓMO FUNCIONA
content = content.replace(
    '{pidIndices && isEmbedded && (',
    "{mapViewTab === 'loop' && ("
);
content = content.replace(
    'className="absolute top-[140px] right-6 w-[450px]',
    'className="absolute top-[140px] right-6 w-[400px]'
);
content = content.replace(
    '<h3 className="text-lg font-black text-white">Diagnóstico Clínico</h3>',
    '<h3 className="text-[11px] uppercase tracking-widest font-black text-indigo-400 flex items-center gap-2"><Brain size={14} /> ¿CÓMO FUNCIONA?</h3>'
);

// 4. Restore and rename Tratamiento -> CLAVES
content = content.replace(
    '{isEmbedded && (\\n                            <div className="absolute top-[140px] bottom-6 right-6 w-[500px]',
    "{mapViewTab === 'exit_keys' && (\\n                            <div className=\\"absolute top-[140px] bottom-6 right-6 w-[400px]"
);
content = content.replace(
    '{isEmbedded && (\\r\\n                            <div className="absolute top-[140px] bottom-6 right-6 w-[500px]',
    "{mapViewTab === 'exit_keys' && (\\r\\n                            <div className=\\"absolute top-[140px] bottom-6 right-6 w-[400px]"
);
content = content.replace(
    '<h3 className="text-lg font-black text-white">Plan de Tratamiento</h3>',
    '<h3 className="text-[11px] uppercase tracking-widest font-black text-emerald-400 flex items-center gap-2"><Target size={14} /> CLAVES</h3>'
);

fs.writeFileSync(file, content, 'utf8');
console.log('Restored panels correctly!');
