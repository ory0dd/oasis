const fs = require('fs');
const appFile = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/App.jsx';
let content = fs.readFileSync(appFile, 'utf8');

// 1. Remove the injected activeCanvasId from MuralWorkspace
content = content.replace(
    /const \[blocks, setBlocks\] = useState\(initialBlocks \|\| \[\]\);\s*const \[activeCanvasId, setActiveCanvasId\] = useState\(\(\) => localStorage\.getItem\('oasis_active_canvas'\) \|\| 'canvas_default'\);\s*\/\/ Actualizar localStorage cuando cambie\s*useEffect\(\(\) => \{\s*localStorage\.setItem\('oasis_active_canvas', activeCanvasId\);\s*\}, \[activeCanvasId\]\);/g,
    'const [blocks, setBlocks] = useState(initialBlocks || []);'
);

// 2. Inject activeCanvasId into function App() right after view state
const appRegex = /const \[view, setViewRaw\] = useState\(\(\) => localStorage\.getItem\('oasis_user'\) === 'observador1' \? 'clinical' : 'canvas'\);/;
const appInjection = `const [view, setViewRaw] = useState(() => localStorage.getItem('oasis_user') === 'observador1' ? 'clinical' : 'canvas');
    const [activeCanvasId, setActiveCanvasId] = useState(() => localStorage.getItem('oasis_active_canvas') || 'canvas_default');
    
    useEffect(() => {
        localStorage.setItem('oasis_active_canvas', activeCanvasId);
    }, [activeCanvasId]);`;

if (!content.includes('const [activeCanvasId, setActiveCanvasId] = useState(() => localStorage.getItem(\'oasis_active_canvas\')')) {
    content = content.replace(appRegex, appInjection);
}

// 3. Fix the NavBar Eye icon
// Replace the Eye icon with ChevronUp in the navbar button for Bitacora
// But wait, the NavBar is a separate component or rendered inside App?
// Let's replace the <Eye size={18} /> that triggers setIsBitacoraOpen(true).
const navBarIconRegex = /<button onClick=\{\(\) => setIsBitacoraOpen\(true\)\}\s*className="w-12 h-12 rounded-full border transition-all flex items-center justify-center shrink-0 bg-white\/5 border-white\/10 text-zinc-400 hover:text-white hover:bg-white\/10"\s*>\s*<Eye size=\{18\} \/>\s*<\/button>/;
const navBarIconInjection = `<button onClick={() => setIsBitacoraOpen(true)}
                                            className="w-12 h-12 rounded-full border transition-all flex items-center justify-center shrink-0 bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10"
                                        >
                                            <ChevronUp size={20} />
                                        </button>`;
content = content.replace(navBarIconRegex, navBarIconInjection);

// Replace any missing ChevronUp imports
if (!content.includes('ChevronUp') && content.includes('lucide-react')) {
    content = content.replace(/import \{([\s\S]*?)\} from 'lucide-react';/, `import {$1, ChevronUp } from 'lucide-react';`);
}

fs.writeFileSync(appFile, content);
console.log('Fixed activeCanvasId location and restored NavBar icon.');
