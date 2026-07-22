const fs = require('fs');
const filePath = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx';
let code = fs.readFileSync(filePath, 'utf8');

// 1. Rename "Diagnóstico" to "Análisis" in UI strings
code = code.replace(/<span className="hidden sm:inline">Diagnóstico<\/span>/g, '<span className="hidden sm:inline">Análisis</span>');
code = code.replace(/<h3 className="text-lg font-black text-white">Diagnóstico Clínico<\/h3>/g, '<h3 className="text-lg font-black text-white">Análisis Clínico</h3>');
code = code.replace(/Hipótesis Clínicas de Diagnóstico/g, 'Hipótesis Clínicas');

// 2. Add the node sequence back to the questionnaire
const questionnaireStart = '<div className="mt-4 pt-4 border-t border-white/10 animate-in fade-in duration-300 flex flex-col gap-3" onClick={e => e.stopPropagation()}>';
const nodeSequenceCode = `
            {/* Node Sequence List */}
            <div className="flex flex-col gap-1.5 mb-2">
                <h5 className="text-[9px] font-mono font-black uppercase tracking-wider text-zinc-500 mb-1">Estructura del Bucle</h5>
                {pat.sortedNodes?.map((node, i) => {
                    const typeColors = {
                        historical: "bg-amber-500/10 border-amber-500/20 text-amber-400",
                        biological: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
                        social: "bg-sky-500/10 border-sky-500/20 text-sky-400",
                        cognitive: "bg-purple-500/10 border-purple-500/20 text-purple-400",
                        motor: "bg-pink-500/10 border-pink-500/20 text-pink-400",
                        physiological: "bg-rose-500/10 border-rose-500/20 text-rose-400",
                        consequence: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                    };
                    return (
                        <div key={node.id} className="bg-white/5 border border-white/10 rounded-lg p-2 flex items-center gap-2">
                             <div className={\`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 border \${typeColors[node.type] || 'bg-zinc-800 border-white/10 text-zinc-300'}\`}>{i+1}</div>
                             <span className="text-[9px] uppercase font-bold tracking-wide text-zinc-300 line-clamp-1">{node.label}</span>
                        </div>
                    );
                })}
            </div>
`;

if (!code.includes('Estructura del Bucle')) {
    code = code.replace(questionnaireStart, questionnaireStart + nodeSequenceCode);
}

fs.writeFileSync(filePath, code);
console.log('Successfully updated MyResponsesDashboard.jsx');
