const fs = require('fs');
let code = fs.readFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/PsychologistDashboard.jsx', 'utf8');

const targetStr = `<div>
                                        <label className="text-[9px] font-black uppercase text-zinc-400 tracking-widest block font-mono mb-1.5">Descripción del Bucle del Caso</label>
                                        <textarea
                                            value={clinicianNotes['func_maintenance_hypothesis'] || ''}
                                            onChange={(e) => handleSaveClinicianNote('func_maintenance_hypothesis', e.target.value)}
                                            placeholder="Redacta cómo interactúan los detonantes, esquemas organísmicos y respuestas en un bucle cerrado..."
                                            className="w-full h-36 bg-zinc-950 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-100/90 resize-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all font-sans outline-none placeholder:text-emerald-900/40"
                                        />
                                    </div>`;

const insertStr = `<div>
                                        <label className="text-[9px] font-black uppercase text-zinc-400 tracking-widest block font-mono mb-1.5">Descripción del Bucle del Caso</label>
                                        <textarea
                                            value={clinicianNotes['func_maintenance_hypothesis'] || ''}
                                            onChange={(e) => handleSaveClinicianNote('func_maintenance_hypothesis', e.target.value)}
                                            placeholder="Redacta cómo interactúan los detonantes, esquemas organísmicos y respuestas en un bucle cerrado..."
                                            className="w-full h-36 bg-zinc-950 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-100/90 resize-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all font-sans outline-none placeholder:text-emerald-900/40"
                                        />
                                    </div>
                                    <div className="mt-4">
                                        <label className="text-[9px] font-black uppercase text-emerald-400 tracking-widest block font-mono mb-1.5">Claves para salir de aquí (Ruta de Escape)</label>
                                        <textarea
                                            value={clinicianNotes['func_exit_keys'] || ''}
                                            onChange={(e) => handleSaveClinicianNote('func_exit_keys', e.target.value)}
                                            placeholder="Define las claves específicas de salida o micro-desafíos. Sepáralas por saltos de línea..."
                                            className="w-full h-36 bg-zinc-950 border border-emerald-500/50 rounded-xl p-3 text-xs text-emerald-100/90 resize-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all font-sans outline-none placeholder:text-emerald-900/40 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                                        />
                                    </div>`;

if (code.includes(targetStr)) {
    code = code.replace(targetStr, insertStr);
    fs.writeFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/PsychologistDashboard.jsx', code);
    console.log("SUCCESS");
} else {
    console.log("FAILED to find target string in PsychologistDashboard");
}
