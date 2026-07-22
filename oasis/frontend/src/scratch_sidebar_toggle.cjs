const fs = require('fs');
const filePath = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/PsychologistDashboard.jsx';
let content = fs.readFileSync(filePath, 'utf8');

const oldSidebar = '<div className="w-full md:w-80 md:h-full bg-zinc-950/60 border-b md:border-b-0 md:border-r border-white/5 flex flex-col shrink-0">';
const newSidebar = '<div className={`w-full ${isSidebarOpen ? \\'md:w-80\\' : \\'md:w-[84px]\\'} md:h-full bg-zinc-950/60 border-b md:border-b-0 md:border-r border-white/5 flex flex-col shrink-0 transition-all duration-300 overflow-x-hidden`}>';
content = content.replace(oldSidebar, newSidebar);

const oldBadgeStart = '<div className="flex flex-col gap-4 p-4 rounded-3xl border border-white/5 bg-zinc-950/50 relative overflow-hidden mb-8">';
const newBadgeStart = '<button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`absolute top-6 z-10 w-8 h-8 flex items-center justify-center rounded-xl bg-zinc-950 border border-white/5 text-zinc-400 hover:text-white transition-all ${isSidebarOpen ? \\'left-6\\' : \\'left-1/2 -translate-x-1/2\\'}`}><Menu size={16} /></button>\\n                        <div className={`flex flex-col gap-4 p-4 rounded-3xl border border-white/5 bg-zinc-950/50 relative overflow-hidden transition-all ${!isSidebarOpen ? \\'opacity-0 translate-x-[-20px] pointer-events-none h-0 p-0 mb-0 border-0\\' : \\'mb-8\\'}`}>';
content = content.replace(oldBadgeStart, newBadgeStart);

const oldSession = '<div className="flex flex-col mb-8">\\n                            <span className="text-[9px] font-mono font-black uppercase tracking-widest text-zinc-600 mb-3">HISTORIAL DE SESIONES:</span>';
const newSession = '<div className={`flex flex-col transition-all ${!isSidebarOpen ? \\'opacity-0 h-0 pointer-events-none overflow-hidden mb-0\\' : \\'mb-8\\'}`}>\\n                            <span className="text-[9px] font-mono font-black uppercase tracking-widest text-zinc-600 mb-3">HISTORIAL DE SESIONES:</span>';
content = content.replace(oldSession, newSession);

const oldTabText = '<div className="text-left min-w-0">\\n                                            <div className={`text-xs font-black uppercase tracking-wider mb-1 truncate ${isActive ? \\'text-accent\\' : \\'text-white\\'}`}>';
const newTabText = '{isSidebarOpen && <div className="text-left min-w-0">\\n                                            <div className={`text-xs font-black uppercase tracking-wider mb-1 truncate ${isActive ? \\'text-accent\\' : \\'text-white\\'}`}>';
content = content.replace(oldTabText, newTabText);

const oldTabEnd = '<div className={`text-[9px] font-mono uppercase tracking-widest truncate transition-colors ${isActive ? \\'text-accent/70\\' : \\'text-zinc-500\\'}`}>\\n                                                {tab.desc}\\n                                            </div>\\n                                        </div>';
const newTabEnd = '<div className={`text-[9px] font-mono uppercase tracking-widest truncate transition-colors ${isActive ? \\'text-accent/70\\' : \\'text-zinc-500\\'}`}>\\n                                                {tab.desc}\\n                                            </div>\\n                                        </div>}';
content = content.replace(oldTabEnd, newTabEnd);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Replacements executed successfully');
