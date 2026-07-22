const fs = require('fs');
const file = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/BitacoraExistencial.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Update the 'canvases' logic to include the default canvas virtually
const oldCanvasesLogic = `const canvases = blocks.filter(b => b.type === 'canvas').sort((a, b) => b.timestamp - a.timestamp);`;
const newCanvasesLogic = `
    const storedCanvases = blocks.filter(b => b.type === 'canvas').sort((a, b) => b.timestamp - a.timestamp);
    const hasDefaultCanvas = storedCanvases.find(c => c.id === 'canvas_default');
    const canvases = hasDefaultCanvas ? storedCanvases : [
        { id: 'canvas_default', type: 'canvas', text: 'Pizarrón Principal', timestamp: 0 },
        ...storedCanvases
    ];
`;
content = content.replace(oldCanvasesLogic, newCanvasesLogic);

// 2. Update handleRenameCanvas to save the virtual default canvas if it's renamed
const oldRenameLogic = `const handleRenameCanvas = (id, newName) => {
        setBlocks(prev => prev.map(b => b.id === id ? { ...b, text: newName } : b));
        setEditingCanvasId(null);
    };`;

const newRenameLogic = `const handleRenameCanvas = (id, newName) => {
        const exists = blocks.some(b => b.id === id);
        if (!exists) {
            setBlocks(prev => [...prev, { id, type: 'canvas', text: newName, timestamp: Date.now(), user }]);
        } else {
            setBlocks(prev => prev.map(b => b.id === id ? { ...b, text: newName } : b));
        }
        setEditingCanvasId(null);
    };`;
content = content.replace(oldRenameLogic, newRenameLogic);

fs.writeFileSync(file, content);
console.log('Injected default canvas logic');
