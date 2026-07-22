const fs = require('fs');
const file = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove the full screen overlays
let start1 = content.indexOf("{mapViewTab === 'loop' && (");
if (start1 !== -1) {
    let end1 = content.indexOf(")}", content.indexOf(")}", start1) + 2) + 2;
    content = content.substring(0, start1) + content.substring(end1);
}

let start2 = content.indexOf("{mapViewTab === 'exit_keys' && (");
if (start2 !== -1) {
    let end2 = content.indexOf(")}", content.indexOf(")}", start2) + 2) + 2;
    content = content.substring(0, start2) + content.substring(end2);
}

// 2. Change the condition and styling for 'loop'
content = content.replace('{pidIndices && isEmbedded && (', "{mapViewTab === 'loop' && (");
content = content.replace('className="absolute top-[140px] right-6 w-[450px]', 'className="absolute top-[140px] right-6 w-[400px]');
content = content.replace('<h3 className="text-lg font-black text-white">Diagnóstico Clínico</h3>', '<h3 className="text-[11px] uppercase tracking-widest font-black text-indigo-400 flex items-center gap-2"><Brain size={14} /> ¿CÓMO FUNCIONA?</h3>');

// 3. Change the condition and styling for 'exit_keys'
if (content.includes('{isEmbedded && (')) {
    content = content.replace('{isEmbedded && (', "{mapViewTab === 'exit_keys' && (");
    content = content.replace('w-[500px] max-w-[calc(100vw-3rem)] z-[200]', 'w-[400px] max-w-[calc(100vw-3rem)] z-[200]');
}

content = content.replace('<h3 className="text-lg font-black text-white">Plan de Tratamiento</h3>', '<h3 className="text-[11px] uppercase tracking-widest font-black text-emerald-400 flex items-center gap-2"><Target size={14} /> CLAVES</h3>');

fs.writeFileSync(file, content, 'utf8');
console.log('Restored panels!');
