const fs = require('fs');
const file = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Tour Panel Size Fix
content = content.replace(
    'className="w-full animate-in slide-in-from-bottom-4 duration-300 mt-3"',
    'className="absolute bottom-[100px] right-6 w-[400px] max-w-[calc(100vw-3rem)] z-[200] animate-in slide-in-from-right-8 duration-300"'
);

// 2. Remove Full Screen Overlays for tabs
let start1 = content.indexOf("{mapViewTab === 'loop' && (\\n                                    <div className=\\"absolute inset-0 z-40 bg-[#050506]/95");
if (start1 === -1) start1 = content.indexOf("{mapViewTab === 'loop' && (\\r\\n                                    <div className=\\"absolute inset-0 z-40 bg-[#050506]/95");
if (start1 !== -1) {
    let end1 = content.indexOf(")}", start1 + 100) + 2;
    content = content.substring(0, start1) + content.substring(end1);
}

let start2 = content.indexOf("{mapViewTab === 'exit_keys' && (\\n                                    <div className=\\"absolute inset-0 z-40 bg-[#050506]/95");
if (start2 === -1) start2 = content.indexOf("{mapViewTab === 'exit_keys' && (\\r\\n                                    <div className=\\"absolute inset-0 z-40 bg-[#050506]/95");
if (start2 !== -1) {
    let end2 = content.indexOf(")}", start2 + 100) + 2;
    content = content.substring(0, start2) + content.substring(end2);
}

// 3. Restore and rename Diagnostico -> CÓMO FUNCIONA
content = content.replace(
    '{pidIndices && isEmbedded && (\\n                            <div className="absolute top-[140px] right-6 w-[450px]',
    '{mapViewTab === \\'loop\\' && (\\n                            <div className="absolute top-[140px] right-6 w-[400px]'
);
content = content.replace(
    '{pidIndices && isEmbedded && (\\r\\n                            <div className="absolute top-[140px] right-6 w-[450px]',
    '{mapViewTab === \\'loop\\' && (\\r\\n                            <div className="absolute top-[140px] right-6 w-[400px]'
);
content = content.replace(
    '<h3 className="text-lg font-black text-white">Diagnóstico Clínico</h3>',
    '<h3 className="text-[11px] uppercase tracking-widest font-black text-indigo-400 flex items-center gap-2"><Brain size={14} /> ¿CÓMO FUNCIONA?</h3>'
);

// 4. Restore and rename Tratamiento -> CLAVES
content = content.replace(
    '{isEmbedded && (\\n                            <div className="absolute top-[140px] bottom-6 right-6 w-[500px]',
    '{mapViewTab === \\'exit_keys\\' && (\\n                            <div className="absolute top-[140px] bottom-6 right-6 w-[400px]'
);
content = content.replace(
    '{isEmbedded && (\\r\\n                            <div className="absolute top-[140px] bottom-6 right-6 w-[500px]',
    '{mapViewTab === \\'exit_keys\\' && (\\r\\n                            <div className="absolute top-[140px] bottom-6 right-6 w-[400px]'
);
content = content.replace(
    '<h3 className="text-lg font-black text-white">Plan de Tratamiento</h3>',
    '<h3 className="text-[11px] uppercase tracking-widest font-black text-emerald-400 flex items-center gap-2"><Target size={14} /> CLAVES</h3>'
);

fs.writeFileSync(file, content, 'utf8');
console.log('Restored panels correctly!');
