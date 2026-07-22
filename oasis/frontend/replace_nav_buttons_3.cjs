const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');

const regexNotes = /\{\/\*\s*2\./;
const matchNotes = app.match(regexNotes);
console.log('Notes comment found:', !!matchNotes);

const regexLienzo = /\{\/\*\s*6\./;
const matchLienzo = app.match(regexLienzo);
console.log('Lienzo comment found:', !!matchLienzo);

if (matchNotes && matchLienzo) {
    const startIndex = matchNotes.index;
    const endIndex = matchLienzo.index;
    console.log('Start:', startIndex, 'End:', endIndex);
    
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
                      </button>

                      `;
                      
    app = app.substring(0, startIndex) + replacement + app.substring(endIndex);
    fs.writeFileSync('src/App.jsx', app);
    console.log('Replaced successfully!');
}
