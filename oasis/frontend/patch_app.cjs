const fs = require('fs');

const path = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/App.jsx';
let content = fs.readFileSync(path, 'utf8');

// Add ServerCrash to lucide-react imports if it's missing
if (!content.includes('ServerCrash')) {
    content = content.replace(/import\s+{\s*([^}]+)}\s+from\s+['"]lucide-react['"];/, (match, p1) => {
        return `import { ${p1.trim()}, ServerCrash } from 'lucide-react';`;
    });
}

// Add the hook definition below imports
const hookDef = `
const useConnectionMonitor = (apiUrl) => {
    const [isOnline, setIsOnline] = React.useState(true);
    React.useEffect(() => {
        let interval;
        const checkConnection = async () => {
            try {
                const res = await fetch(\`\${apiUrl}/api/oasis/backgrounds/templates\`);
                if (res.ok) setIsOnline(true);
                else setIsOnline(false);
            } catch (err) {
                setIsOnline(false);
            }
        };
        checkConnection();
        interval = setInterval(checkConnection, 15000);
        return () => clearInterval(interval);
    }, [apiUrl]);
    return isOnline;
};
`;

if (!content.includes('useConnectionMonitor')) {
    // Insert after "const formatUrl"
    content = content.replace(/const formatUrl = /, hookDef + '\nconst formatUrl = ');
}

// Add isBackendOnline to the main App component
if (!content.includes('const isBackendOnline = useConnectionMonitor(API_URL);')) {
    content = content.replace(/(function App\(\) {\n)/, `$1    const isBackendOnline = useConnectionMonitor(API_URL);\n`);
}

// Add the warning UI to the top of the render block inside the main wrapper
const warningUI = `
            {!isBackendOnline && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-red-900/90 text-white px-4 py-2 rounded-full z-[99999] backdrop-blur-md shadow-[0_0_20px_rgba(239,68,68,0.3)] border border-red-500/50 flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
                    <ServerCrash size={16} />
                    <span className="text-sm font-medium">Servidor local desconectado. Mostrando caché offline. Las imágenes podrían no cargar.</span>
                </div>
            )}
`;
if (!content.includes('Servidor local desconectado')) {
    content = content.replace(/(<div className="min-h-screen[^>]+>)/, `$1\n${warningUI}`);
}

// Add onError to all <img and <video elements
const imgOnError = ` onError={(e) => { if (!e.target.dataset.failed) { e.target.dataset.failed = true; e.target.src = 'https://placehold.co/400x300/030304/444444?text=Offline+Media'; } }} `;
const vidOnError = ` onError={(e) => { if (!e.target.dataset.failed) { e.target.dataset.failed = true; e.target.poster = 'https://placehold.co/400x300/030304/444444?text=Offline+Video'; } }} `;

content = content.replace(/<img\s/g, `<img${imgOnError}`);
content = content.replace(/<img\n/g, `<img\n${imgOnError}`);
content = content.replace(/<video\s/g, `<video${vidOnError}`);
content = content.replace(/<video\n/g, `<video\n${vidOnError}`);

fs.writeFileSync(path, content, 'utf8');
console.log('App.jsx successfully patched.');
