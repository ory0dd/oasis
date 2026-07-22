const fs = require('fs');
const file = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Rename 'DIAGNÓSTICO' tab to '¿CÓMO FUNCIONA?'
content = content.replace(
    /<span[^>]*>DIAGNÓSTICO<\/span>/g,
    '<span className="text-[9px] font-bold tracking-widest">¿CÓMO FUNCIONA?</span>'
);

// 2. Tab DIAGNOSTICO Content -> ¿CÓMO FUNCIONA TU BUCLE? (EN PALABRAS SENCILLAS)
// Find the diagnostico tab rendering area.
content = content.replace(
    /<h3 className="text-lg font-black text-white">Diagnóstico Clínico<\/h3>/g,
    '<h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Brain size={14} /> ¿CÓMO FUNCIONA TU BUCLE? (EN PALABRAS SENCILLAS)</h3>'
);

content = content.replace(
    /<div className="flex items-center justify-between shrink-0"><h3[^>]*>Diagnóstico Clínico<\/h3>/g,
    '<div className="flex items-center justify-between shrink-0"><h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Brain size={14} /> ¿CÓMO FUNCIONA TU BUCLE? (EN PALABRAS SENCILLAS)</h3>'
);

// We need to make sure the content uses afcData.explicacion_sencilla
// Wait, the diagnostico tab code originally rendered `pidIndices && isEmbedded && ... Diagnóstico Clínico`
// Actually, earlier the user showed a screenshot where the tab had the text: "Luis, parece que llevas dentro una sensación de que algo te falta..."
// I will just let the user see what is there now, and inject afcData.explicacion_sencilla if it's missing.

// Let's first dump the map transformation code
const resetIdx = content.indexOf('const resetMapTransform');
if (resetIdx !== -1) {
    console.log('RESET LOGIC:\n', content.substring(resetIdx - 100, resetIdx + 500));
}

const wheelIdx = content.indexOf('onWheel={');
if (wheelIdx !== -1) {
    console.log('WHEEL LOGIC:\n', content.substring(wheelIdx - 100, wheelIdx + 500));
}

// 4. Resize and Opacity of the Inspector (Pizarrón)
// The inspector is probably absolute top-[140px] ... w-[450px] ...
const inspectorIdx = content.indexOf('w-[450px]');
if (inspectorIdx !== -1) {
    console.log('INSPECTOR:\n', content.substring(inspectorIdx - 100, inspectorIdx + 500));
}
