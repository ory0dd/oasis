const fs = require('fs');
const p = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/App.jsx';
let lines = fs.readFileSync(p, 'utf8').split('\n');
let insertIdx = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('title={canvasIsRecording ? \'Detener Grabación\' : \'Grabar Audio\'}')) {
        for (let j = i; j < i + 10; j++) {
            if (lines[j].includes('</div>')) {
                insertIdx = j;
                break;
            }
        }
        break;
    }
}

if (insertIdx !== -1) {
    const btn = \                    <button onClick={() => {
                        const titleText = window.prompt('Escribe el texto o título:');
                        if (!titleText || !titleText.trim()) return;
                        const newBlock = {
                            id: \\\	ext-\\\\,
                            type: 'text',
                            content: titleText.trim(),
                            x: -cam.x / cam.scale,
                            y: -cam.y / cam.scale,
                            isPublic: false,
                            createdAt: new Date().toISOString(),
                            canvasId: activeCanvasId !== 'canvas_default' ? activeCanvasId : undefined
                        };
                        setBlocks(prev => {
                            const updated = [...prev, newBlock];
                            if (typeof syncBlocks === 'function') syncBlocks(updated);
                            return updated;
                        });
                    }} className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all relative group" title="Añadir Texto al Pizarrón">
                        <Type size={18} />
                    </button>\;
    lines.splice(insertIdx, 0, btn);
    fs.writeFileSync(p, lines.join('\n'));
    console.log('Success');
} else {
    console.log('Failed to find insert location');
}
