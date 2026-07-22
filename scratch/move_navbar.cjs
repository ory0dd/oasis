const fs = require('fs');
const file = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Refactor NavBar to Icon-only and move to bottom
const oldNavBarStart = `{/* Segmented Control Tabs (Top NavBar) */}`;
const oldNavBarEnd = `                            </div>\r\n    <div`;
const startIdx = content.indexOf(oldNavBarStart);
const endIdx = content.indexOf(oldNavBarEnd);

if (startIdx !== -1 && endIdx !== -1) {
    const newNavBar = `{/* Segmented Control Tabs (Bottom NavBar) */}
                            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-[200] flex bg-black/60 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 w-fit gap-2 shadow-2xl pointer-events-auto">
                                <button onClick={() => setMapViewTab('map')} title="El Mapa" className={\`p-3 rounded-xl transition-all flex items-center justify-center \${mapViewTab === 'map' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}\`}><Network size={18} /></button>
                                <button onClick={() => setMapViewTab('avances')} title="Avances" className={\`p-3 rounded-xl transition-all flex items-center justify-center \${mapViewTab === 'avances' ? 'bg-blue-600 text-white shadow-md' : 'text-zinc-500 hover:text-blue-400'}\`}><MessageSquare size={18} /></button>
                                <button onClick={() => setMapViewTab('bucles')} title="Bucles" className={\`p-3 rounded-xl transition-all flex items-center justify-center \${mapViewTab === 'bucles' ? 'bg-purple-600 text-white shadow-md' : 'text-zinc-500 hover:text-purple-400'}\`}><Compass size={18} /></button>
                                <button onClick={() => setMapViewTab('diagnostico')} title="Diagnóstico" className={\`p-3 rounded-xl transition-all flex items-center justify-center \${mapViewTab === 'diagnostico' ? 'bg-emerald-600 text-white shadow-md' : 'text-zinc-500 hover:text-emerald-400'}\`}><Activity size={18} /></button>
                                <button onClick={() => setMapViewTab('claves')} title="Claves" className={\`p-3 rounded-xl transition-all flex items-center justify-center \${mapViewTab === 'claves' ? 'bg-orange-600 text-white shadow-md' : 'text-zinc-500 hover:text-orange-400'}\`}><Sparkles size={18} /></button>
                            </div>
    <div`;
    content = content.substring(0, startIdx) + newNavBar + content.substring(endIdx + oldNavBarEnd.length);
    console.log("Replaced NavBar with icon-only bottom nav.");
}

// 2. Push Guided Tour Modal up to bottom-24 so it doesn't overlap the new NavBar
const modalRegex = /className="absolute bottom-6 left-1\/2 transform -translate-x-1\/2 w-\[95%\] max-w-sm sm:max-w-md z-\[150\] pointer-events-auto animate-in slide-in-from-bottom-4 duration-300"/g;
if (modalRegex.test(content)) {
    content = content.replace(modalRegex, 'className="absolute bottom-24 left-1/2 transform -translate-x-1/2 w-[95%] max-w-sm sm:max-w-md z-[150] pointer-events-auto animate-in slide-in-from-bottom-4 duration-300"');
    console.log("Moved Guided Tour Modal up to bottom-24.");
} else {
    // maybe it has slightly different spacing
    console.log("Could not find the Guided Tour Modal class string to move it.");
}

fs.writeFileSync(file, content, 'utf8');
