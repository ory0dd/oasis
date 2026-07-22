const fs = require('fs');
let code = fs.readFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx', 'utf8');

// Normalize line endings to LF for easier processing
code = code.replace(/\r\n/g, '\n');

// 1. Rename Islas -> Bucles
code = code.replace(/<span>Islas<\/span>/g, '<span>Bucles</span>');
code = code.replace(/mapViewTab === 'islas'/g, "mapViewTab === 'bucles'");
code = code.replace(/setMapViewTab\('islas'\)/g, "setMapViewTab('bucles')");

// 2. Modulo 1.5
// Find the exact line index and replace
let lines = code.split('\n');

const mod15Index = lines.findIndex(l => l.includes('MÓDULO 1.5: ISLAS EXISTENCIALES (PATRONES CONDUCTUALES)'));
if (mod15Index !== -1) {
    lines[mod15Index + 1] = "                            {mapViewTab === 'bucles' && (";
    lines[mod15Index + 2] = '                                <div className="absolute top-[80px] md:top-[120px] left-4 md:left-6 z-[200] w-[300px] md:w-[340px] max-h-[calc(100vh-140px)] bg-zinc-950/90 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-5 shadow-2xl flex flex-col gap-3 animate-in slide-in-from-left-8 pointer-events-auto overflow-y-auto custom-scroll">';
}

// Convert horizontal list to vertical list
const listIdx = lines.findIndex((l, i) => i > mod15Index && l.includes('className="flex gap-2 overflow-x-auto'));
if (listIdx !== -1) {
    lines[listIdx] = '                                    <div className="flex flex-col gap-2 pb-1.5">';
}

// Modify width of buttons in vertical list
for (let i = mod15Index; i < mod15Index + 100; i++) {
    if (lines[i] && lines[i].includes('className={`flex-shrink-0 flex flex-col text-left p-3 rounded-xl border transition-all duration-300 w-[240px] sm:w-[260px]')) {
        lines[i] = lines[i].replace(
            'className={`flex-shrink-0 flex flex-col text-left p-3 rounded-xl border transition-all duration-300 w-[240px] sm:w-[260px]',
            'className={`flex flex-col text-left p-3 rounded-xl border transition-all duration-300 w-full'
        );
        break;
    }
}

// 3. Update the details panel constraint and styling
const panelCondIdx = lines.findIndex(l => l.includes("{mapViewTab === 'map' && selectedPatternId && tourActiveIndex === null && activePattern && ("));
if (panelCondIdx !== -1) {
    lines[panelCondIdx] = lines[panelCondIdx].replace(
        "{mapViewTab === 'map' && selectedPatternId && tourActiveIndex === null && activePattern && (",
        "{selectedPatternId && tourActiveIndex === null && activePattern && ("
    );
}

const panelDivIdx = lines.findIndex((l, i) => i > panelCondIdx && l.includes('id="pattern-details-panel"'));
if (panelDivIdx !== -1) {
    lines[panelDivIdx + 1] = '                                    className="absolute bottom-4 md:bottom-8 left-1/2 transform -translate-x-1/2 w-[95%] max-w-5xl z-[150] animate-in slide-in-from-bottom-8 duration-300 pointer-events-auto shadow-2xl"';
}

const panelCloseBtnIdx = lines.findIndex((l, i) => i > panelDivIdx && i < panelDivIdx + 20 && l.includes('className="absolute top-4 right-4 flex items-center gap-2 z-50"'));
if (panelCloseBtnIdx !== -1) {
    lines[panelCloseBtnIdx] = '                                        <div className="absolute top-4 right-4 flex items-center gap-2 z-50 pointer-events-auto">';
}

// Add close button for Bucles panel
const buclesHeaderIdx = lines.findIndex((l, i) => i > mod15Index && i < mod15Index + 10 && l.includes('Islas del Mapa'));
if (buclesHeaderIdx !== -1) {
    lines[buclesHeaderIdx] = lines[buclesHeaderIdx].replace('Islas del Mapa (Filtros de Patrón)', 'Tus Bucles');
    // Add close button
    const containerDivEnd = lines.findIndex((l, i) => i > buclesHeaderIdx && l.includes('</div>'));
    if (containerDivEnd !== -1) {
        lines.splice(containerDivEnd + 1, 0, `                                        <button onClick={() => setMapViewTab('map')} className="p-1.5 bg-white/5 rounded-full hover:bg-white/10 text-white transition-colors pointer-events-auto"><X size={14} /></button>`);
    }
}


code = lines.join('\n');
fs.writeFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx', code);
console.log("Fixes applied successfully.");
