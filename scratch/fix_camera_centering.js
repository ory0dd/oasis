const fs = require('fs');
let code = fs.readFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/App.jsx', 'utf8');

// 1. Remove the first useless useEffect
const firstEffectRegex = /const hasCenteredCamRef = useRef\(false\);\s*useEffect\(\(\) => \{\s*if \(hasCenteredCamRef\.current[^}]+setCam\(\{ x: camX, y: camY, scale: targetScale \}\);\s*\}\s*\}\s*\}, \[blocks, activeCanvasId\]\);/g;
// Wait, regex matching over multiple lines is tricky in JS. I will use string replacement via index.

const startIdx = code.indexOf('const hasCenteredCamRef = useRef(false);');
const endIdx = code.indexOf('const [profileCam, setProfileCam] = useState({ x: 0, y: 0, scale: 0.7 });');

if (startIdx !== -1 && endIdx !== -1) {
    code = code.substring(0, startIdx) + code.substring(endIdx);
}

// 2. Rewrite the second useEffect
const secondEffectSearch = `
        if (view === 'canvas' && isDataLoaded && blocks && blocks.length > 0 && !hasCenteredCanvasRef.current) {
            hasCenteredCanvasRef.current = true;

            const targetScale = window.innerWidth < 768 ? 0.45 : 0.8;

            // ── Encontrar la nota de texto más reciente (excluir diarios, insights, públicas) ──
            const textNotes = blocks.filter(b =>
                b.type === 'text' &&
                !b.isPublic &&
                b.x !== undefined &&
                b.y !== undefined &&
                !(b.entries && b.entries.length > 0) // excluir diarios
            );

            let targetX = 0, targetY = 0;

            if (textNotes.length > 0) {
                // Ordenar por timestamp (más reciente primero), usar getBlockTime
                const sorted = [...textNotes].sort((a, b) => getBlockTime(b) - getBlockTime(a));
                const latest = sorted[0];
                targetX = -latest.x * targetScale;
                targetY = -latest.y * targetScale;
            } else {
                // Sin notas de texto — centrar en todos los bloques visibles
                const renderedBlocks = blocks.filter(b => b.type !== 'insight' && !b.isPublic && b.x !== undefined);
                if (renderedBlocks.length > 0) {
                    const cx = renderedBlocks.reduce((s, b) => s + b.x, 0) / renderedBlocks.length;
                    const cy = renderedBlocks.reduce((s, b) => s + b.y, 0) / renderedBlocks.length;
                    targetX = -cx * targetScale;
                    targetY = -cy * targetScale;
                }
            }

            animateMainCamera(targetX, targetY, targetScale);
        }`;

const secondEffectReplace = `
        if (view === 'canvas' && isDataLoaded && blocks && blocks.length > 0 && !hasCenteredCanvasRef.current) {
            hasCenteredCanvasRef.current = true;
            const targetScale = window.innerWidth < 768 ? 0.45 : 0.8;

            const visualBlocks = blocks.filter(b => 
                b.type !== 'settings' && 
                b.id !== 'user_settings' && 
                b.id !== 'profile_settings' && 
                b.type !== 'canvas' && 
                !b.isPublic && 
                b.x !== undefined
            );

            let targetX = 0, targetY = 0;

            if (visualBlocks.length > 0) {
                const getBlockTime = (b) => parseInt(b.id) || (b.timestamp ? new Date(b.timestamp).getTime() : 0);
                const sorted = [...visualBlocks].sort((a, b) => getBlockTime(b) - getBlockTime(a));
                
                const titleBlocks = sorted.filter(b => b.type === 'canvas_title');
                const latest = titleBlocks.length > 0 ? titleBlocks[0] : sorted[0];
                
                const bw = parseFloat(latest.w) || 250;
                const bh = parseFloat(latest.h) || 200;
                const cx = parseFloat(latest.x) + (bw / 2);
                const cy = parseFloat(latest.y) + (bh / 2);
                
                targetX = -cx * targetScale;
                targetY = -cy * targetScale;
            }

            if (!isNaN(targetX) && !isNaN(targetY)) {
                animateMainCamera(targetX, targetY, targetScale);
            }
        }`;

code = code.replace(secondEffectSearch.trim(), secondEffectReplace.trim());

fs.writeFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/App.jsx', code);
console.log("SUCCESS");
