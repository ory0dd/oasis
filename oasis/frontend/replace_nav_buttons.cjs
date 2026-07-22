const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');

const regex = /\{\/\*\ 2\.\ Lǭpiz\ \/\ Notas\ \*\/\}(.|\n)*?title="Anǭlisis\ de\ Ruido"\s*>\s*<Sparkles\ size=\{18\}\ className="hover-float-icon"\ \/>\s*<\/button>/g;

const replacement = `{/* CREATOR BUTTON */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsBitacoraOpen(false);
                            setIsUnifiedCreatorOpen(true);
                            setUnifiedTab('notes');
                        }}
                        className={\`w-9 h-9 md:w-11 md:h-11 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg border shrink-0 \${isUnifiedCreatorOpen ? 'bg-accent text-black border-accent shadow-[0_0_20px_rgba(var(--accent-rgb),0.4)]' : 'bg-[#18181b] border-white/5 text-zinc-400 hover:text-white hover:bg-[#2a2a2e] hover:border-white/30'}\`}
                        style={isUnifiedCreatorOpen ? { backgroundColor: accent, borderColor: accent, color: '#000' } : undefined}
                        title="Crear Nueva Frecuencia"
                    >
                        <Plus size={18} className="hover-float-icon" />
                    </button>`;

if (regex.test(app)) {
    app = app.replace(regex, replacement);
    fs.writeFileSync('src/App.jsx', app);
    console.log("Successfully replaced the 4 buttons with a single Creator button.");
} else {
    console.log("Could not find the 4 buttons to replace.");
}
