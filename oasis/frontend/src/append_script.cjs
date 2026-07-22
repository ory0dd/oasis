const fs = require('fs');
let content = fs.readFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/update_dashboard_concept.cjs', 'utf8');

const replacementLogic = `
// 3. Replace the static text section with the dynamic conceptualization UI
const staticTextStart = '<Brain size={14} /> Análisis de Correspondencia Funcional';
const idxStart = content.indexOf(staticTextStart);

if (idxStart !== -1) {
    // Find the enclosing div of the right column header
    const startReplace = content.lastIndexOf('<div className="col-span-3', idxStart);
    // Find the end of that column (the closing div before 'Nota: Los porcentajes representan')
    const endReplace = content.indexOf('<p className="text-[8px]', idxStart);
    
    if (startReplace !== -1 && endReplace !== -1) {
        const replacement = \`
                                            <div className="col-span-3 flex flex-col gap-4">
                                                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                                    <h3 className="text-[9px] font-black uppercase tracking-widest text-indigo-400/80 flex items-center gap-1.5">
                                                        <Brain size={14} /> Conceptualización Dinámica y Análisis
                                                    </h3>
                                                    <button
                                                        onClick={generateConceptualization}
                                                        disabled={isGeneratingConceptualization}
                                                        className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[9px] font-black uppercase tracking-wider rounded border border-indigo-500/20 hover:bg-indigo-500/20 transition-all flex items-center gap-2"
                                                    >
                                                        {isGeneratingConceptualization ? (
                                                            <><Aperture className="w-3 h-3 animate-spin" /> Analizando...</>
                                                        ) : (
                                                            <><Sparkles className="w-3 h-3" /> Generar con IA</>
                                                        )}
                                                    </button>
                                                </div>
                                                <div className="flex-1">
                                                    <AutoResizeTextarea
                                                        value={treatmentPlan?.dynamicConceptualization || ''}
                                                        onChange={(e) => handleTreatmentPlanChange('dynamicConceptualization', e.target.value)}
                                                        placeholder="Haz clic en 'Generar con IA' para redactar el análisis funcional basado en la triple modalidad y los rasgos PID-5 del paciente..."
                                                        className="w-full h-full min-h-[400px] p-4 bg-black/40 border border-white/5 rounded-xl text-zinc-300 text-[11px] leading-relaxed font-sans focus:outline-none focus:border-indigo-500/30 focus:ring-1 focus:ring-indigo-500/30 transition-all resize-none"
                                                    />
                                                </div>
                                            </div>
        \`;
        
        content = content.substring(0, startReplace) + replacement.trim() + '\\n' + content.substring(endReplace);
    }
}
`;

content = content.replace('fs.writeFileSync', replacementLogic + '\nfs.writeFileSync');
fs.writeFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/update_dashboard_concept.cjs', content);
