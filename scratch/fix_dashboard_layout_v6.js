const fs = require('fs');
let code = fs.readFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx', 'utf8');

// 1. Rename Islas -> Bucles
code = code.replace(/<span>Islas<\/span>/g, '<span>Bucles</span>');
code = code.replace(/mapViewTab === 'islas'/g, "mapViewTab === 'bucles'");
code = code.replace(/setMapViewTab\('islas'\)/g, "setMapViewTab('bucles')");

// 2. Wrap Modulo 1.5 in mapViewTab === 'bucles' instead of 'map'
code = code.replace(
    `                            {/* MÓDULO 1.5: ISLAS EXISTENCIALES (PATRONES CONDUCTUALES) ABAJO DEL MAPA */}
                            {mapViewTab === 'map' && (
                                <div className="mt-3 bg-zinc-950/40 border border-white/5 rounded-2xl p-4 shadow-2xl flex flex-col gap-2.5 animate-in slide-in-from-bottom-4 duration-400">`,
    `                            {/* MÓDULO 1.5: ISLAS EXISTENCIALES (PATRONES CONDUCTUALES) FLOTANTE */}
                            {mapViewTab === 'bucles' && (
                                <div className="absolute top-[80px] md:top-[120px] left-4 md:left-6 z-[200] w-[300px] md:w-[340px] max-h-[calc(100vh-140px)] bg-zinc-950/90 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-5 shadow-2xl flex flex-col gap-3 animate-in slide-in-from-left-8 pointer-events-auto overflow-y-auto no-scrollbar">`
);

// Convert horizontal list to vertical list
code = code.replace(
    '<div className="flex gap-2 overflow-x-auto pb-1.5 clínical-horizontal-scroll [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">',
    '<div className="flex flex-col gap-2 pb-1.5">'
);

// Modify width of buttons in vertical list
code = code.replace(
    'className={`flex-shrink-0 flex flex-col text-left p-3 rounded-xl border transition-all duration-300 w-[240px] sm:w-[260px]',
    'className={`flex flex-col text-left p-3 rounded-xl border transition-all duration-300 w-full'
);

// 3. Update the details panel constraint and styling
// We need to find the pattern details panel constraint.
code = code.replace(
    "{mapViewTab === 'map' && selectedPatternId && tourActiveIndex === null && activePattern && (",
    "{selectedPatternId && tourActiveIndex === null && activePattern && ("
);

// Update details panel classes
code = code.replace(
    '<div\n                                    id="pattern-details-panel"\n                                    className="w-full animate-in slide-in-from-bottom-4 duration-300 mt-3"',
    '<div\n                                    id="pattern-details-panel"\n                                    className="absolute bottom-4 md:bottom-8 left-1/2 transform -translate-x-1/2 w-[95%] max-w-5xl z-[150] animate-in slide-in-from-bottom-8 duration-300 pointer-events-auto"'
);

// Also update the floating button position inside details panel to avoid overflow issues
code = code.replace(
    '<div className="absolute top-4 right-4 flex items-center gap-2 z-50">',
    '<div className="absolute top-4 right-4 flex items-center gap-2 z-50 pointer-events-auto">'
);

fs.writeFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx', code);
console.log("Fixes applied successfully.");
