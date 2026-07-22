const fs = require('fs');

const filename = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx';

let lines = fs.readFileSync(filename, 'utf8').split('\n');

const phenomMarker = '                                            <span className="text-zinc-500 hover:text-white transition-colors">';
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(phenomMarker) && lines[i+1].includes('{phenomExpanded ?') && lines[i+2].includes('</span>')) {
        if (lines[i+3].includes(')}')) {
            console.log(`Found damaged phenom area at line ${i+1}`);
            lines[i+3] = '                                        </button>';
            lines.splice(i+4, 0, 
                '                                        {phenomExpanded && isEmbedded && phenomData && !isEditingPhenom && (',
                '                                            <button',
                '                                                onClick={(e) => {',
                '                                                    e.stopPropagation();',
                '                                                    setTempPhenomData(phenomData);',
                '                                                    setIsEditingPhenom(true);',
                '                                                }}',
                '                                                className="ml-4 px-3 py-1 bg-white/5 border border-white/10 hover:bg-sky-600 hover:border-transparent text-sky-300 hover:text-white rounded-lg font-bold text-[9px] uppercase tracking-wider transition-all"',
                '                                            >',
                '                                                Editar Respuestas',
                '                                            </button>',
                '                                        )}'
            );
            break;
        }
    }
}

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('{/* MÓDULO 1.5: ISLAS EXISTENCIALES (PATRONES CONDUCTUALES) ABAJO DEL MAPA */}')) {
        console.log(`Found modulo 1.5 at line ${i+1}`);
        if (lines[i-6].includes(')}') && lines[i-5].includes('</button>') && lines[i-4].includes('</div>') && lines[i-3].includes('</div>') && lines[i-2].includes(')}')) {
            console.log(`Found orphaned lines from ${i-5} to ${i-1}, deleting them...`);
            lines.splice(i-6, 5);
            break;
        } else if (lines[i-7].includes(')}') && lines[i-6].includes('</button>')) {
            console.log(`Found orphaned lines, deleting...`);
            lines.splice(i-7, 5);
            break;
        } else {
            console.log("Could not find orphaned lines dynamically, attempting to search...");
            for (let j = i-10; j < i; j++) {
                console.log(`Line ${j+1}: ${lines[j]}`);
            }
        }
    }
}

fs.writeFileSync(filename, lines.join('\n'), 'utf8');
console.log('Done');
