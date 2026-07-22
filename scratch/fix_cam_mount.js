const fs = require('fs');
let code = fs.readFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/App.jsx', 'utf8');

const targetStr = '    const [cam, setCam] = useState(() => ({ x: 0, y: 0, scale: window.innerWidth < 768 ? 0.45 : 0.8 }));';

const newCodeToInsert = `
    const hasCenteredCamRef = useRef(false);
    useEffect(() => {
        if (hasCenteredCamRef.current || !blocks || blocks.length === 0) return;
        
        // Only center on visual blocks of the active canvas
        const visualBlocks = blocks.filter(b => b.type !== 'settings' && b.id !== 'user_settings' && b.id !== 'profile_settings' && b.type !== 'canvas' && b.type !== 'insight' && !b.isPublic && (b.canvasId === activeCanvasId || (!b.canvasId && activeCanvasId === 'canvas_default')));
        
        if (visualBlocks.length > 0) {
            hasCenteredCamRef.current = true;
            const lastBlock = visualBlocks[visualBlocks.length - 1];
            const targetScale = window.innerWidth < 768 ? 0.45 : 1;
            const cx = (lastBlock.x !== undefined ? lastBlock.x : 0) + (lastBlock.w || 250) / 2;
            const cy = (lastBlock.y !== undefined ? lastBlock.y : 0) + (lastBlock.h || 200) / 2;
            const camX = (window.innerWidth / 2) - (cx * targetScale);
            const camY = (window.innerHeight / 2) - (cy * targetScale);
            setCam({ x: camX, y: camY, scale: targetScale });
        }
    }, [blocks, activeCanvasId]);
`;

if (code.includes(targetStr)) {
    code = code.replace(targetStr, targetStr + newCodeToInsert);
    fs.writeFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/App.jsx', code);
    console.log('SUCCESS');
} else {
    console.log('targetStr not found');
}
