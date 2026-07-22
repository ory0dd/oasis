const fs = require('fs');
const filePath = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx';
let code = fs.readFileSync(filePath, 'utf8');

// 1. Change background to solid for the full screen tabs to completely hide the map
code = code.replace(/className="absolute inset-0 z-40 bg-\[#050506\]\/95/g, 'className="absolute inset-0 z-40 bg-[#050506]');

// 2. We need to restructure the pattern list into an accordion.
// We'll replace the `<button ... >` wrapper with `<div ...>`
// and turn the inner header into `<button>`.

const oldButtonRegex = /<button\s+key=\{pat\.id\}\s+disabled=\{isLocked\}\s+onClick=\{\(\) => \{([\s\S]*?)\}\}\s+className=\{`flex flex-col([^`]*)`\}\s*>\s*<div className="flex items-center justify-between w-full gap-2">/;

const newHeader = `<div
    key={pat.id}
    className={\`flex flex-col text-left p-3 rounded-xl border transition-all duration-300 w-full \${isLocked ? 'opacity-40 cursor-not-allowed grayscale' : ''} \${isSelected ? 'bg-purple-950/40 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'bg-black/30 border-white/5 hover:border-white/10 hover:bg-black/55'}\`}
>
    <button 
        disabled={isLocked}
        onClick={() => {
            if (isSelected) {
                setSelectedPatternId(null);
                setSelectedNode(null);
                setTourActiveIndex(null);
            } else {
                setSelectedPatternId(pat.id);
                setSelectedNode(null);
                setTourActiveIndex(null);
            }
        }}
        className="flex flex-col w-full text-left focus:outline-none transition-transform"
    >
        <div className="flex items-center justify-between w-full gap-2">`;

code = code.replace(oldButtonRegex, newHeader);

// Now we replace the closing `</button>` of that pattern item with the expanded content!
// The pattern item ends after the intensity/difficulty labels.
const oldEndRegex = /<\/span>\s*<\/div>\s*<\/button>/;

const accordionContent = `</span>
        </div>
    </button>

    {/* INLINE CONTENT WHEN EXPANDED */}
    {isSelected && (
        <div className="mt-4 pt-4 border-t border-white/10 animate-in fade-in duration-300 flex flex-col gap-3">
            <h5 className="text-[9px] font-mono font-black uppercase tracking-wider text-zinc-400">Secuencia del Bucle</h5>
            <div className="flex flex-col gap-2">
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
                        <div key={node.id} className="bg-white/5 border border-white/10 rounded-lg p-2.5 flex items-center gap-2">
                             <div className={\`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 border \${typeColors[node.type] || 'bg-zinc-800 border-white/10 text-zinc-300'}\`}>{i+1}</div>
                             <span className="text-[10px] uppercase font-black tracking-wide text-zinc-200">{node.label}</span>
                        </div>
                    );
                })}
            </div>
            
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    setMapViewTab('loop');
                }} 
                className="mt-2 w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors shadow-lg"
            >
                Explorar Detalles con IA
            </button>
        </div>
    )}
</div>`;

code = code.replace(oldEndRegex, accordionContent);

// 3. Remove the entire old pattern-details-panel!
// We'll just search for the start and the end.
const pdpStart = code.indexOf('{/* 1. Inline Island Analysis (when loop is selected but no specific node tour active) */}');
const pdpEnd = code.indexOf('{/* 2. Tour Analysis (when loop is selected AND a node is focused in the tour) */}');

if (pdpStart !== -1 && pdpEnd !== -1) {
    code = code.substring(0, pdpStart) + code.substring(pdpEnd);
}

fs.writeFileSync(filePath, code);
console.log('Successfully updated MyResponsesDashboard.jsx');
