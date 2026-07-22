const fs = require('fs');
const file = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. ZOOM LOGIC
content = content.replace(
    /let fitScale = Math\.min\(scaleX, scaleY\) \* 0\.75; \/\/ Zoom out further so/g,
    'let fitScale = Math.min(scaleX, scaleY) * 0.45; // Zoom out further so'
);
content = content.replace(
    /const newScale = Math\.min\(Math\.max\(0\.2, prevScale \+ scaleChange\), 4\);/g,
    'const newScale = Math.min(Math.max(0.02, prevScale + scaleChange), 4);'
);
content = content.replace(
    /const newScale = Math\.min\(Math\.max\(0\.2, prevScale \+ amount\), 4\);/g,
    'const newScale = Math.min(Math.max(0.02, prevScale + amount), 4);'
);

// 2. FIX BUTTONS (diagnostico -> loop, claves -> exit_keys, labels -> ¿CÓMO FUNCIONA?, CLAVES)
content = content.replace(
    /<button onClick=\{\(\) => setMapViewTab\('diagnostico'\)\}.*?>.*?<Activity size=\{13\} \/><span>Diagnóstico<\/span><\/button>/,
    `<button onClick={() => setMapViewTab('loop')} className={\`px-4 py-2 rounded-xl text-[11px] uppercase tracking-wider font-black transition-all flex items-center justify-center gap-1.5 \${mapViewTab === 'loop' ? 'bg-indigo-600 text-white shadow-md' : 'text-zinc-500 hover:text-indigo-400'}\`}><Brain size={13} /><span>¿CÓMO FUNCIONA?</span></button>`
);

content = content.replace(
    /<button onClick=\{\(\) => setMapViewTab\('claves'\)\}.*?>.*?<Sparkles size=\{13\} \/><span>Claves<\/span><\/button>/,
    `<button onClick={() => setMapViewTab('exit_keys')} className={\`px-4 py-2 rounded-xl text-[11px] uppercase tracking-wider font-black transition-all flex items-center justify-center gap-1.5 \${mapViewTab === 'exit_keys' ? 'bg-emerald-600 text-white shadow-md' : 'text-zinc-500 hover:text-emerald-400'}\`}><Target size={13} /><span>CLAVES</span></button>`
);

// 3. MOVE BOTTOM DOCK
const startDock = content.indexOf('<div className="flex flex-wrap items-center gap-4 pointer-events-auto p-1.5 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md shadow-lg">');
if (startDock !== -1) {
    const endDock = content.indexOf('</div>', content.indexOf('</div>', content.indexOf('</div>', startDock + 1) + 1) + 1) + 6;
    let dockHtml = content.substring(startDock, endDock);
    
    content = content.substring(0, startDock) + content.substring(endDock);
    
    dockHtml = dockHtml.replace(
        'className="flex flex-wrap items-center gap-4 pointer-events-auto p-1.5 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md shadow-lg"',
        'className="fixed bottom-6 left-1/2 -translate-x-1/2 flex flex-wrap items-center gap-4 pointer-events-auto p-2 rounded-[1.5rem] bg-zinc-950/80 border border-white/10 backdrop-blur-2xl shadow-2xl z-[300]"'
    );
    
    const mapEndIndex = content.lastIndexOf('</svg>') + 6;
    const insertDockIndex = content.indexOf('</div>', mapEndIndex);
    
    if (insertDockIndex !== -1) {
        content = content.substring(0, insertDockIndex) + '\\n' + dockHtml + '\\n' + content.substring(insertDockIndex);
    }
}

// 4. RESIZE AND OPACITY OF THE INSPECTOR
content = content.replace(
    'className="absolute top-[140px] bottom-6 right-6 w-[450px] max-w-[calc(100vw-3rem)] z-[200] bg-zinc-950/95 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-6 overflow-y-auto animate-in slide-in-from-right-8 shadow-2xl pointer-events-auto custom-scroll flex flex-col gap-6"',
    'className="absolute top-[140px] right-6 w-[450px] max-w-[calc(100vw-3rem)] z-[200] bg-zinc-950/95 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-6 overflow-y-auto animate-in slide-in-from-right-8 shadow-2xl pointer-events-auto custom-scroll flex flex-col gap-6 resize-y" style={{ minHeight: "400px", maxHeight: "90vh" }}'
);

content = content.replace(/disabled:opacity-0/g, 'disabled:opacity-30');

fs.writeFileSync(file, content, 'utf8');
console.log('Layout replaced successfully!');
