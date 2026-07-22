const fs = require('fs');
let content = fs.readFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx', 'utf8');

// 1. Add state for kioMemory
if (!content.includes('const [kioMemory, setKioMemory] = useState([]);')) {
    content = content.replace(
        'const [isSavingKio, setIsSavingKio] = useState(false);',
        'const [kioMemory, setKioMemory] = useState([]);'
    );
}

// 2. Add useEffect to fetch memory
const fetchEffect = `
    useEffect(() => {
        if (user) {
            fetch(\`\${API_URL}/api/oasis/memory?user=\${user}\`)
                .then(res => res.json())
                .then(data => {
                    if (data.memory) setKioMemory(JSON.parse(data.memory));
                })
                .catch(console.error);
        }
    }, [user]);
`;
if (!content.includes('setKioMemory(JSON.parse(data.memory))')) {
    content = content.replace(
        'const generateKioDirectives = async () => {',
        fetchEffect + '\n    const generateKioDirectives = async () => {'
    );
}

// 3. Remove handleSaveKioMemory
content = content.replace(/const handleSaveKioMemory = async \(\) => \{[\s\S]*?catch \(e\) \{[\s\S]*?setIsSavingKio\(false\);\n        \}\n    \};\n/, '');

// 4. Update the UI
const searchUI = `                                            <div className="bg-black/40 p-5 rounded-2xl border border-cyan-500/10 space-y-2">
                                                <h3 className="text-[10px] font-black uppercase tracking-widest text-cyan-500">
                                                    Memoria y Contexto Base
                                                </h3>
                                                <AutoResizeTextarea
                                                    value={formatTreatmentField(treatmentPlan.kioMemoryBase)}
                                                    onChange={(e) => handleTreatmentPlanChange('kioMemoryBase', e.target.value)}
                                                    className="w-full text-xs text-cyan-50 leading-relaxed font-sans bg-transparent border border-transparent hover:border-cyan-500/30 focus:border-cyan-400/60 focus:bg-cyan-950/40 rounded-lg p-2 transition-all outline-none"
                                                    placeholder="Ej: Paciente sufre de dependencia emocional. Sus logros principales son..."
                                                />
                                            </div>`;

const replaceUI = `                                            <div className="bg-black/40 p-5 rounded-2xl border border-cyan-500/10 space-y-3 flex flex-col max-h-[300px]">
                                                <h3 className="text-[10px] font-black uppercase tracking-widest text-cyan-500 flex items-center gap-2">
                                                    <Target size={12} /> Memoria Activa de Kio
                                                </h3>
                                                <p className="text-[10px] text-cyan-100/50 leading-relaxed">
                                                    Hechos destilados que Kio recuerda actualmente en sus conversaciones con el individuo.
                                                </p>
                                                <div className="flex-1 overflow-y-auto pr-2 space-y-2 no-scrollbar">
                                                    {kioMemory.length === 0 ? (
                                                        <p className="text-[10px] text-cyan-500/50 font-mono text-center py-4 uppercase">Sin memoria registrada</p>
                                                    ) : (
                                                        [...kioMemory].sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0)).map((fact, idx) => (
                                                            <div key={idx} className={\`p-3 rounded-xl border \${fact.isPinned ? 'bg-cyan-950/40 border-cyan-500/30' : 'bg-black/20 border-white/5'}\`}>
                                                                <div className="flex items-center gap-2 mb-1.5">
                                                                    <span className={\`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded \${fact.isPinned ? 'bg-cyan-500 text-black' : 'bg-white/10 text-zinc-400'}\`}>
                                                                        {fact.isPinned ? 'PINNED' : (fact.category || 'General')}
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs text-zinc-300 leading-relaxed font-serif italic">{fact.text}</p>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>`;

content = content.replace(searchUI, replaceUI);

// 5. Remove the extra div buttons block
const searchButtons = `                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleSaveKioMemory}
                                                    disabled={isSavingKio || !treatmentPlan.kioMemoryBase}
                                                    className="bg-zinc-800 hover:bg-zinc-700 text-cyan-400 font-black text-[10px] uppercase tracking-widest py-2 px-5 rounded-full transition-all flex items-center gap-2 border border-cyan-500/30 disabled:opacity-50"
                                                >
                                                    {isSavingKio ? (
                                                        <><div className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" /> Inyectando...</>
                                                    ) : (
                                                        <><Target size={12} /> Inyectar a Memoria Base</>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={generateKioDirectives}
                                                    disabled={isGeneratingKio}
                                                    className="bg-cyan-500 hover:bg-cyan-400 text-black font-black text-[10px] uppercase tracking-widest py-2 px-5 rounded-full transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] disabled:opacity-50"
                                                >
                                                    {isGeneratingKio ? (
                                                        <><div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" /> Analizando...</>
                                                    ) : (
                                                        <><Sparkles size={12} /> Auto-Generar con IA</>
                                                    )}
                                                </button>
                                            </div>`;

const replaceButtons = `                                            <button
                                                onClick={generateKioDirectives}
                                                disabled={isGeneratingKio}
                                                className="bg-cyan-500 hover:bg-cyan-400 text-black font-black text-[10px] uppercase tracking-widest py-2 px-5 rounded-full transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] disabled:opacity-50"
                                            >
                                                {isGeneratingKio ? (
                                                    <><div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" /> Analizando...</>
                                                ) : (
                                                    <><Sparkles size={12} /> Auto-Generar con IA</>
                                                )}
                                            </button>`;

content = content.replace(searchButtons, replaceButtons);

fs.writeFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx', content);
