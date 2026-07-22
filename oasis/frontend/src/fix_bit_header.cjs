const fs = require('fs');
const file = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/BitacoraExistencial.jsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /<div className=\"flex items-center gap-2\">\s*<Eye size=\{18\} className=\"text-red-500 animate-pulse\" \/>\s*<span className=\"text-xs font-black uppercase tracking-\[0\.15em\] text-white\">BitÃ¡cora Existencial<\/span>\s*<\/div>/g;

const newHeader = `<div className="flex items-center gap-2">
                    <button onClick={() => setViewMode('canvases')} className="w-8 h-8 rounded-full border border-white/10 bg-black/40 flex items-center justify-center text-zinc-400 hover:text-white hover:border-red-500/50 transition-all">
                        <span className="text-lg leading-none font-bold mr-[2px]">&lsaquo;</span>
                    </button>
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black tracking-[0.2em] text-red-500 uppercase">{currentCanvas.text}</span>
                        <span className="text-sm font-black uppercase tracking-[0.1em] text-white">Bitácora <span className="text-zinc-600 text-xs">/ {filteredReleases.length}</span></span>
                    </div>
                </div>`;

content = content.replace(regex, newHeader);

fs.writeFileSync(file, content);
console.log('Bitacora header updated!');
