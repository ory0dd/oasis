const fs = require('fs');
const file = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Replace Top NavBar
const navBarStart = '{/* Segmented Control Tabs (Top NavBar) */}';
const navBarEnd = '                            <div'; // The next div starts here, we need to carefully match

const targetNavBarStr = `{/* Segmented Control Tabs (Top NavBar) */}
                            <div className="absolute top-[80px] left-1/2 transform -translate-x-1/2 z-[150] flex bg-black/60 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 w-fit min-w-[300px] gap-1 shadow-2xl pointer-events-auto">
                                <button onClick={() => setMapViewTab('map')} className={\`px-4 py-2 rounded-xl text-[11px] uppercase tracking-wider font-black transition-all flex items-center justify-center gap-1.5 \${mapViewTab === 'map' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}\`}><Network size={13} /><span>El Mapa</span></button>
                                <button onClick={() => setMapViewTab('avances')} className={\`px-4 py-2 rounded-xl text-[11px] uppercase tracking-wider font-black transition-all flex items-center justify-center gap-1.5 \${mapViewTab === 'avances' ? 'bg-blue-600 text-white shadow-md' : 'text-zinc-500 hover:text-blue-400'}\`}><MessageSquare size={13} /><span>Avances</span></button>
                                <button onClick={() => setMapViewTab('bucles')} className={\`px-4 py-2 rounded-xl text-[11px] uppercase tracking-wider font-black transition-all flex items-center justify-center gap-1.5 \${mapViewTab === 'bucles' ? 'bg-purple-600 text-white shadow-md' : 'text-zinc-500 hover:text-purple-400'}\`}><Compass size={13} /><span>Bucles</span></button>
                                <button onClick={() => setMapViewTab('diagnostico')} className={\`px-4 py-2 rounded-xl text-[11px] uppercase tracking-wider font-black transition-all flex items-center justify-center gap-1.5 \${mapViewTab === 'diagnostico' ? 'bg-emerald-600 text-white shadow-md' : 'text-zinc-500 hover:text-emerald-400'}\`}><Activity size={13} /><span>Diagnóstico</span></button>
                                <button onClick={() => setMapViewTab('claves')} className={\`px-4 py-2 rounded-xl text-[11px] uppercase tracking-wider font-black transition-all flex items-center justify-center gap-1.5 \${mapViewTab === 'claves' ? 'bg-orange-600 text-white shadow-md' : 'text-zinc-500 hover:text-orange-400'}\`}><Sparkles size={13} /><span>Claves</span></button>
                            </div>`;

const replacementNavBarStr = `{/* Segmented Control Tabs (Top NavBar) */}
                            <div className="absolute top-[80px] left-1/2 transform -translate-x-1/2 z-[150] flex bg-black/60 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 w-fit min-w-[200px] gap-1 shadow-2xl pointer-events-auto">
                                <button onClick={() => setMapViewTab('map')} className={\`px-4 py-2 rounded-xl text-[11px] uppercase tracking-wider font-black transition-all flex items-center justify-center gap-1.5 \${mapViewTab === 'map' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}\`}><Network size={13} /><span>El Mapa</span></button>
                                <button onClick={() => setMapViewTab('bucles')} className={\`px-4 py-2 rounded-xl text-[11px] uppercase tracking-wider font-black transition-all flex items-center justify-center gap-1.5 \${mapViewTab === 'bucles' ? 'bg-purple-600 text-white shadow-md' : 'text-zinc-500 hover:text-purple-400'}\`}><Compass size={13} /><span>Bucles</span></button>
                            </div>`;

content = content.replace(targetNavBarStr, replacementNavBarStr);

// 2. Remove Text Overlays (loop, exit_keys, avances)
const overlaysStart = '{/* Text Overlays for tabs */}';
const overlaysEnd = '                            </div>\n                            {/* MÓDULO 1.5: ISLAS EXISTENCIALES (PATRONES CONDUCTUALES) ABAJO DEL MAPA */}';

const startIndex = content.indexOf(overlaysStart);
const endIndex = content.indexOf(overlaysEnd);

if (startIndex !== -1 && endIndex !== -1) {
    content = content.substring(0, startIndex) + content.substring(endIndex);
    console.log("Successfully removed text overlays.");
} else {
    console.error("Text overlays section not found.");
}

fs.writeFileSync(file, content, 'utf8');
console.log('Done replacing layout.');
