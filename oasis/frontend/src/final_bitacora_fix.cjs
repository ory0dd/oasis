const fs = require('fs');
const file = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/BitacoraExistencial.jsx';
let content = fs.readFileSync(file, 'utf8');

// Props
content = content.replace(
    'export default function BitacoraExistencial({ ',
    'export default function BitacoraExistencial({ \n    activeCanvasId, setActiveCanvasId,\n    blocks, setBlocks,'
);

// States
const statesInjection = `
    const [viewMode, setViewMode] = useState('notes'); // 'notes' | 'canvases'
    const [editingCanvasId, setEditingCanvasId] = useState(null);
    const [editingCanvasName, setEditingCanvasName] = useState("");

    const canvases = blocks.filter(b => b.type === 'canvas').sort((a, b) => b.timestamp - a.timestamp);
    const currentCanvas = canvases.find(c => c.id === activeCanvasId) || { text: 'Pizarrón 1' };

    const handleCreateCanvas = () => {
        const newId = 'canvas_' + Date.now();
        const newCanvas = { id: newId, type: 'canvas', text: 'Nuevo Pizarrón', timestamp: Date.now(), user: user };
        setBlocks(prev => [...prev, newCanvas]);
        setActiveCanvasId(newId);
        setViewMode('notes');
    };

    const handleRenameCanvas = (id, newName) => {
        setBlocks(prev => prev.map(b => b.id === id ? { ...b, text: newName } : b));
        setEditingCanvasId(null);
    };
`;
content = content.replace('const [isSelectionMode, setIsSelectionMode] = useState(false);', statesInjection + '\n    const [isSelectionMode, setIsSelectionMode] = useState(false);');

// filteredReleases
const filteredReleasesInjection = `const filteredReleases = blocks.filter(b => {
        if (b.type === 'canvas') return false;
        if (b.canvasId && b.canvasId !== activeCanvasId) return false;
        if (!b.canvasId && activeCanvasId !== 'canvas_default') return false; // si no tiene, asumimos que es del default

        if (b.id === 'profile_settings' || b.id === 'user_settings') return false;`;
content = content.replace(/const filteredReleases = blocks\.filter\(b => \{\s*if \(b\.id === 'profile_settings' \|\| b\.id === 'user_settings'\) return false;/g, filteredReleasesInjection);

// Canvases view
const canvasViewHTML = `
            {viewMode === 'canvases' ? (
                <>
                    <div className="shrink-0 flex items-center justify-between p-4 border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                                LIBRERO <span className="text-zinc-600 text-sm font-normal">/ {canvases.length}</span>
                            </h2>
                        </div>
                        <button onClick={onClose} className="w-8 h-8 rounded-full border border-white/10 bg-[#18181b] flex items-center justify-center text-zinc-400 hover:text-white">
                            <ChevronDown size={18} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 no-scrollbar">
                        <button onClick={handleCreateCanvas} className="w-full p-6 rounded-3xl border-2 border-dashed border-red-500/30 bg-red-500/5 hover:bg-red-500/10 transition-all flex flex-col items-center justify-center gap-2 text-red-500">
                            <span className="text-2xl font-light">+</span>
                            <span className="text-sm font-medium tracking-wide">Crear Nuevo Pizarrón</span>
                        </button>

                        <div className="grid grid-cols-2 gap-4">
                            {canvases.map(canvas => (
                                <div key={canvas.id} onClick={() => { setActiveCanvasId(canvas.id); setViewMode('notes'); }} className={\`relative p-5 rounded-3xl border transition-all cursor-pointer flex flex-col gap-3 aspect-square justify-between \${canvas.id === activeCanvasId ? 'bg-red-500/10 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'bg-black/40 border-white/10 hover:border-white/20'}\`}>
                                    <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                                        <div className="w-4 h-4 rounded-sm border-2 border-red-500 opacity-80" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        {editingCanvasId === canvas.id ? (
                                            <input 
                                                autoFocus
                                                type="text"
                                                value={editingCanvasName}
                                                onChange={e => setEditingCanvasName(e.target.value)}
                                                onClick={e => e.stopPropagation()}
                                                onBlur={() => handleRenameCanvas(canvas.id, editingCanvasName)}
                                                onKeyDown={e => { if(e.key === 'Enter') handleRenameCanvas(canvas.id, editingCanvasName); }}
                                                className="w-full bg-transparent border-b border-red-500 outline-none text-white font-medium"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-between gap-2">
                                                <h3 className="text-white font-medium text-sm leading-tight line-clamp-2">{canvas.text}</h3>
                                                <button onClick={(e) => { e.stopPropagation(); setEditingCanvasId(canvas.id); setEditingCanvasName(canvas.text); }} className="text-zinc-500 hover:text-white p-1 rounded-full"><Edit3 size={12} /></button>
                                            </div>
                                        )}
                                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest">{blocks.filter(b => b.canvasId === canvas.id).length} items</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            ) : (
                <>`;

content = content.replace('{/* TOP BAR / HEADER */}', canvasViewHTML + '\n            {/* TOP BAR / HEADER */}');

// The tricky part: the closing tag.
// Bitacora ends exactly like this:
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// }
// We need to inject `</> )}` RIGHT BEFORE `        </div>\n    );\n}`
content = content.replace(/        <\/div>\r?\n    \);\r?\n\}/, '                </>\n            )}\n        </div>\n    );\n}');

// Header replacement
const headerRegex = /<div className=\"flex items-center gap-2\">\s*<Eye size=\{18\} className=\"text-red-500 animate-pulse\" \/>\s*<span className=\"text-xs font-black uppercase tracking-\[0\.15em\] text-white\">BitÃ¡cora Existencial<\/span>\s*<\/div>/;
const newHeader = `<div className="flex items-center gap-2">
                    <button onClick={() => setViewMode('canvases')} className="w-8 h-8 rounded-full border border-white/10 bg-black/40 flex items-center justify-center text-zinc-400 hover:text-white hover:border-red-500/50 transition-all">
                        <span className="text-lg leading-none font-bold mr-[2px]">&lsaquo;</span>
                    </button>
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black tracking-[0.2em] text-red-500 uppercase">{currentCanvas?.text || 'Pizarrón'}</span>
                        <span className="text-sm font-black uppercase tracking-[0.1em] text-white">Bitácora <span className="text-zinc-600 text-xs">/ {filteredReleases.length}</span></span>
                    </div>
                </div>`;
content = content.replace(headerRegex, newHeader);

fs.writeFileSync(file, content);
console.log('Fixed completely!');
