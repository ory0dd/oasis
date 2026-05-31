const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'App.jsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Imports
if (!content.includes('import BitacoraExistencial')) {
    content = content.replace(
        "import ProfileView from './components/ProfileView';",
        "import ProfileView from './components/ProfileView';\nimport BitacoraExistencial from './components/BitacoraExistencial';"
    );
}

// 2. State
if (!content.includes('isBitacoraOpen')) {
    content = content.replace(
        "const [isSimpleNotesOpenRaw, setIsSimpleNotesOpenRaw] = useState(false);",
        "const [isSimpleNotesOpenRaw, setIsSimpleNotesOpenRaw] = useState(false);\n    const [isBitacoraOpen, setIsBitacoraOpen] = useState(true);"
    );
}

// 3. Nav Bar
const navBarStart = `{/* BOTÓN DE ACCIÓN ÚNICO (LA REFINERÍA & CHAT) */}`;
const navBarEndStr = `title="Lienzo Principal"`;

if (content.includes(navBarStart) && content.includes(navBarEndStr)) {
    const startIndex = content.indexOf(navBarStart);
    const endIndex = content.indexOf(')}', content.indexOf(navBarEndStr, startIndex)) + 2;
    
    const newNavBar = `{/* BOTÓN DE ACCIÓN ÚNICO (LA REFINERÍA & CHAT) */}
            {(view === 'canvas' || view === 'profile' || view === 'soul' || isSimpleNotesOpen || activeNotebook) && view !== 'clinical' && (
                <div
                    onTouchStart={handleNavbarTouchStart}
                    onTouchEnd={handleNavbarTouchEnd}
                    className="fixed left-1/2 -translate-x-1/2 z-[2000] flex items-center gap-2 p-2 bg-[#050506]/60 backdrop-blur-xl border border-white/10 rounded-full shadow-[0_40px_100px_rgba(0,0,0,0.9)] w-max max-w-[98vw] overflow-x-auto no-scrollbar animate-in slide-in-from-top-5 duration-700"
                    style={{ top: 'max(24px, calc(env(safe-area-inset-top) + 12px))' }}
                >
                    {/* 1. Perfil */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsBitacoraOpen(false);
                            setIsSimpleNotesOpen(false);
                            setIsComposerOpen(false);
                            setActiveNotebook(null);
                            setIsChatOpen(false);
                            setActiveTest(null);
                            setView('profile');
                        }}
                        className={\`w-9 h-9 md:w-11 md:h-11 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg border shrink-0 \${view === 'profile' && !activeNotebook && !isChatOpen && !isSimpleNotesOpen ? 'bg-accent text-black border-accent shadow-[0_0_20px_rgba(var(--accent-rgb),0.4)]' : 'bg-[#18181b] border-white/5 text-zinc-400 hover:text-white hover:bg-[#2a2a2e] hover:border-white/30'}\`}
                        style={view === 'profile' && !activeNotebook && !isChatOpen && !isSimpleNotesOpen ? { backgroundColor: accent, borderColor: accent, color: '#000' } : undefined}
                        title="Perfil"
                    >
                        <User size={18} className="hover-float-icon" />
                    </button>

                    {/* Bitácora Existencial */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsSimpleNotesOpen(false);
                            setIsComposerOpen(false);
                            setActiveNotebook(null);
                            setIsChatOpen(false);
                            setActiveTest(null);
                            setView('canvas');
                            setIsBitacoraOpen(true);
                        }}
                        className={\`w-9 h-9 md:w-11 md:h-11 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg border shrink-0 \${isBitacoraOpen ? 'bg-red-500 text-black border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 'bg-[#18181b] border-white/5 text-red-500 hover:bg-red-500/10 hover:border-red-500/50'}\`}
                        title="Bitácora Existencial"
                    >
                        <Eye size={18} className="hover-float-icon" />
                    </button>

                    {/* 2. Lápiz / Notas */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsBitacoraOpen(false);
                            setIsSimpleNotesOpen(false);
                            setActiveNotebook(null);
                            setIsChatOpen(false);
                            setActiveTest(null);
                            openNewComposer();
                        }}
                        className={\`w-9 h-9 md:w-11 md:h-11 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg border shrink-0 \${(isSimpleNotesOpen || isComposerOpen) ? 'bg-accent text-black border-accent shadow-[0_0_20px_rgba(var(--accent-rgb),0.4)]' : 'bg-[#18181b] border-white/5 text-zinc-400 hover:text-white hover:bg-[#2a2a2e] hover:border-white/30'}\`}
                        style={(isSimpleNotesOpen || isComposerOpen) ? { backgroundColor: accent, borderColor: accent, color: '#000' } : undefined}
                        title="Notas Rápidas"
                    >
                        <Edit3 size={18} className="hover-float-icon" />
                    </button>

                    {/* 3. Chat IA */}
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsBitacoraOpen(false); setIsChatOpen(prev => !prev); }}
                        className={\`w-9 h-9 md:w-11 md:h-11 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg border shrink-0 \${isChatOpen ? 'bg-accent text-black border-accent shadow-[0_0_20px_rgba(var(--accent-rgb),0.4)]' : 'bg-[#18181b] border-white/5 text-zinc-400 hover:text-white hover:bg-[#2a2a2e] hover:border-white/30'}\`}
                        style={isChatOpen ? { backgroundColor: accent, borderColor: accent, color: '#000' } : undefined}
                        title="Nueva Conversación IA"
                    >
                        <MessageCircle size={18} className="hover-float-icon" />
                    </button>

                    {/* 4. Diario */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsBitacoraOpen(false);
                            setIsSimpleNotesOpen(false);
                            setIsComposerOpen(false);
                            setActiveNotebook('diary');
                            setIsChatOpen(false);
                            setActiveTest(null);
                        }}
                        className={\`w-9 h-9 md:w-11 md:h-11 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg border shrink-0 \${activeNotebook === 'diary' ? 'bg-[#f59e0b] text-black border-[#fbbf24] shadow-[0_0_20px_rgba(245,158,11,0.4)]' : 'bg-[#18181b] border-white/5 text-[#f59e0b] hover:bg-[#f59e0b]/10 hover:border-[#f59e0b]/50'}\`}
                        title="Libreta de Diario"
                    >
                        <StickyNote size={18} className="hover-float-icon" />
                    </button>

                    {/* 5. Resonancia */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsBitacoraOpen(false);
                            setIsSimpleNotesOpen(false);
                            setIsComposerOpen(false);
                            setActiveNotebook('resonance');
                            setIsChatOpen(false);
                            setActiveTest(null);
                        }}
                        className={\`w-9 h-9 md:w-11 md:h-11 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg border shrink-0 \${activeNotebook === 'resonance' ? 'bg-[#a855f7] text-black border-[#c084fc] shadow-[0_0_20px_rgba(168,85,247,0.4)]' : 'bg-[#18181b] border-white/5 text-[#a855f7] hover:bg-[#a855f7]/10 hover:border-[#a855f7]/50'}\`}
                        title="Análisis de Ruido"
                    >
                        <Sparkles size={18} className="hover-float-icon" />
                    </button>

                    {/* 6. Lienzo Principal */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsBitacoraOpen(false);
                            setIsSimpleNotesOpen(false);
                            setIsComposerOpen(false);
                            setActiveNotebook(null);
                            setIsChatOpen(false);
                            setActiveTest(null);
                            setView('canvas');
                        }}
                        className={\`w-9 h-9 md:w-11 md:h-11 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg border shrink-0 \${view === 'canvas' && !activeNotebook && !isChatOpen && !isSimpleNotesOpen && !isComposerOpen ? 'bg-accent text-black border-accent shadow-[0_0_20px_rgba(var(--accent-rgb),0.4)]' : 'bg-[#18181b] border-white/5 text-zinc-400 hover:text-white hover:bg-[#2a2a2e] hover:border-white/30'}\`}
                        style={view === 'canvas' && !activeNotebook && !isChatOpen && !isSimpleNotesOpen && !isComposerOpen ? { backgroundColor: accent, borderColor: accent, color: '#000' } : undefined}
                        title="Lienzo Principal"
                    >
                        <Compass size={18} className="hover-float-icon" />
                    </button>

                </div>
            )}`;

    content = content.substring(0, startIndex) + newNavBar + content.substring(endIndex);
}

// 4. Modal and Backdrop Injection
if (!content.includes('<BitacoraExistencial')) {
    const newModals = `
            {isBitacoraOpen && (
                <BitacoraExistencial
                    blocks={blocks}
                    setBlocks={setBlocks}
                    accent={accent}
                    onClose={() => setIsBitacoraOpen(false)}
                    user={user}
                    editBlock={(b) => {
                        setIsBitacoraOpen(false);
                        editBlock(b);
                    }}
                    openNewComposer={() => {
                        setIsBitacoraOpen(false);
                        openNewComposer(false, false);
                    }}
                    deleteBlocks={deleteBlocks}
                    onNewChat={() => {
                        setIsBitacoraOpen(false);
                        setIsChatOpen(true);
                    }}
                    onOpenSimpleNotes={() => {
                        setIsBitacoraOpen(false);
                        setIsSimpleNotesOpenRaw(true);
                    }}
                />
            )}

            {/* UNIFIED MODAL BACKDROP */}
            {(isComposerOpen || isSimpleNotesOpen || activeNotebook || isChatOpen || activeTest || isBitacoraOpen) && (
                <div 
                    className="fixed inset-0 z-[1399] bg-[#050506]/60 backdrop-blur-md transition-all duration-700 animate-in fade-in"
                    onPointerDown={(e) => e.stopPropagation()}
                    onWheel={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onTouchMove={(e) => e.stopPropagation()}
                />
            )}`;
            
    const oldBackdropRegex = /\{\/\* UNIFIED MODAL BACKDROP FOR MOBILE \*\/\}\s*\{\(isComposerOpen \|\| isSimpleNotesOpen \|\| activeNotebook \|\| isChatOpen \|\| activeTest\) && \(\s*<div className="fixed inset-0 z-\[1399\] bg-black\/40 backdrop-blur-xl md:hidden transition-all duration-700 animate-in fade-in pointer-events-none" \/>\s*\)\}/;
    if (content.match(oldBackdropRegex)) {
        content = content.replace(oldBackdropRegex, newModals);
    }
}

// 5. Profile Local Backdrop
const profileRegex = /\(view === 'feed' \? renderFeedView\(\) :\s*<ProfileView/g;
if (content.match(profileRegex)) {
    const replacement = `(view === 'feed' ? renderFeedView() :
                                <>
                                    <div className="fixed inset-0 z-[1399] bg-[#050506]/60 backdrop-blur-md transition-all duration-700 animate-in fade-in cursor-default pointer-events-auto" />
                                    <ProfileView`;
    content = content.replace(profileRegex, replacement);
    
    const profileEndRegex = /onOpenSimpleNotes=\{\(\) => setIsSimpleNotesOpen\(true\)\}\s*openNewComposer=\{openNewComposer\}\s*\/>\s*\)\}/;
    content = content.replace(profileEndRegex, `onOpenSimpleNotes={() => setIsSimpleNotesOpen(true)}\n                                    openNewComposer={openNewComposer}\n                                />\n                                </>\n                            )}`);
}

// 6. Startup view
content = content.replace("const [view, setView] = useState(() => localStorage.getItem('oasis_view') || 'profile');", "const [view, setView] = useState(() => localStorage.getItem('oasis_view') || 'canvas');");

fs.writeFileSync(filePath, content);
console.log("Restored all the things!");
