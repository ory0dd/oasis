const fs = require('fs');
const file = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/BitacoraExistencial.jsx';
let arr = fs.readFileSync(file, 'utf8').split('\n');

for(let i=0; i<arr.length; i++) {
    if (arr[i].includes('BitÃ¡cora Existencial') || arr[i].includes('Bitácora Existencial')) {
        arr.splice(i-2, 4,
'                <div className="flex items-center gap-2">',
'                    <button onClick={() => setViewMode(\'canvases\')} className="w-8 h-8 rounded-full border border-white/10 bg-black/40 flex items-center justify-center text-zinc-400 hover:text-white hover:border-red-500/50 transition-all shrink-0">',
'                        <span className="text-lg leading-none font-bold mr-[2px]">&lsaquo;</span>',
'                    </button>',
'                    <div className="flex flex-col min-w-0">',
'                        <span className="text-[9px] font-black tracking-[0.2em] text-red-500 uppercase truncate">{currentCanvas?.text || \'Pizarrón 1\'}</span>',
'                        <span className="text-sm font-black uppercase tracking-[0.1em] text-white">Bitácora</span>',
'                    </div>',
'                </div>'
        );
        break;
    }
}

fs.writeFileSync(file, arr.join('\n'));
console.log('Fixed Header completely');
