const fs = require('fs');
const appFile = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/App.jsx';
let content = fs.readFileSync(appFile, 'utf8');

const regex = /<button onClick=\{\(\) => \{ setIsComposerOpen\(false\); setIsChatOpen\(false\); setActiveNotebook\(null\); setIsPublishSelectorOpen\(false\); setIsBitacoraOpen\(true\); setView\('canvas'\); \}\} className="w-10 h-10 rounded-full hover:bg-white\/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all" title="Bitácora Existencial"><Eye size=\{18\} \/><\/button>/;

const injection = `<button onClick={() => { setIsComposerOpen(false); setIsChatOpen(false); setActiveNotebook(null); setIsPublishSelectorOpen(false); setIsBitacoraOpen(true); setView('canvas'); }} className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all" title="Bitácora Existencial"><ChevronUp size={20} /></button>`;

content = content.replace(regex, injection);

if (!content.includes('ChevronUp') && content.includes('lucide-react')) {
    content = content.replace(/import \{([\s\S]*?)\} from 'lucide-react';/, `import {$1, ChevronUp } from 'lucide-react';`);
}

fs.writeFileSync(appFile, content);
console.log('NavBar Eye replaced with ChevronUp');
