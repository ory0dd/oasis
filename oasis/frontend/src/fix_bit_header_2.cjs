const fs = require('fs');
const file = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/BitacoraExistencial.jsx';
let lines = fs.readFileSync(file, 'utf8').split('\n');

lines.splice(117, 4,
'                <div className="flex items-center gap-2">',
'                    <button onClick={() => setViewMode(\'canvases\')} className="w-8 h-8 rounded-full border border-white/10 bg-black/40 flex items-center justify-center text-zinc-400 hover:text-white hover:border-red-500/50 transition-all">',
'                        <span className="text-lg leading-none font-bold mr-[2px]">&lsaquo;</span>',
'                    </button>',
'                    <div className="flex flex-col">',
'                        <span className="text-[9px] font-black tracking-[0.2em] text-red-500 uppercase">{currentCanvas?.text || \'Pizarrón\'}</span>',
'                        <span className="text-sm font-black uppercase tracking-[0.1em] text-white">Bitácora <span className="text-zinc-600 text-xs">/ {filteredReleases.length}</span></span>',
'                    </div>',
'                </div>'
);

fs.writeFileSync(file, lines.join('\n'));
console.log('Fixed Bitacora Header lines 118-121');
