const fs = require('fs');
const file = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `<div className="absolute top-[20px] left-6 right-6 z-[120] flex flex-row items-center justify-between gap-2 pointer-events-none">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-sm font-bold text-white flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md shadow-lg">
                                        <Target size={16} className="text-emerald-400" /> Mapa de Bucles
                                        {afcData?.is_mock && <span className="ml-1 px-1.5 py-0.5 rounded bg-zinc-800 text-[9px] uppercase font-bold text-zinc-400 border border-zinc-700">Plantilla</span>}
                                    </h2>
                                </div>
                                <div className="flex flex-wrap items-center gap-4 pointer-events-auto p-1.5 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md shadow-lg">`;

const replacement = `<div className="absolute top-[20px] left-6 z-[120] flex items-center gap-2 pointer-events-none">
                                    <h2 className="text-sm font-bold text-white flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md shadow-lg">
                                        <Target size={16} className="text-emerald-400" /> Mapa de Bucles
                                        {afcData?.is_mock && <span className="ml-1 px-1.5 py-0.5 rounded bg-zinc-800 text-[9px] uppercase font-bold text-zinc-400 border border-zinc-700">Plantilla</span>}
                                    </h2>
                                </div>
                                <div className="absolute bottom-6 left-6 z-[120] flex flex-col items-center gap-2 pointer-events-auto p-1.5 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md shadow-lg">`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replacement);
    
    const endStr = `                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            
                            {/* Segmented Control Tabs (Bottom NavBar) */}`;
                            
    const endReplacement = `                                            </>
                                        )}
                                    </div>
                                </div>

                            
                            {/* Segmented Control Tabs (Bottom NavBar) */}`;

    content = content.replace(endStr, endReplacement);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Action buttons moved successfully');
} else {
    console.log('Could not find target string');
}
