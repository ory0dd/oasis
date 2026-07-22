const fs = require('fs');
const p = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/App.jsx';
let content = fs.readFileSync(p, 'utf8');

// 1. Add onRequestTitleEdit to MemoNode props
content = content.replace(
    /const MemoNode = React\.memo\(\(\{ block, blocks = \[\], draggingId,(.*?) camScale = 1 \}\) => \{/s,
    'const MemoNode = React.memo(({ block, blocks = [], draggingId, camScale = 1, onRequestTitleEdit }) => {'
);

// 2. Replace window.prompt in MemoNode click handler for canvas_title
content = content.replace(
    /const newText = window\.prompt\('Editar título:', block\.content\);\s*if \(newText && newText\.trim\(\) && newText !== block\.content\) \{\s*onSelect\(\{ \.\.\.block, content: newText\.trim\(\), type: 'canvas_title' \}\);\s*\}/,
    'if (onRequestTitleEdit) { onRequestTitleEdit(block.id, block.content); } else { const newText = window.prompt(\'Editar título:\', block.content); if (newText && newText.trim() && newText !== block.content) { onSelect({ ...block, content: newText.trim(), type: \'canvas_title\' }); } }'
);

// 3. Add titlePrompt state to App
content = content.replace(
    /const \[activeCanvasId, setActiveCanvasId\] = useState\(\(\) => localStorage\.getItem\('oasis_active_canvas'\) \|\| 'canvas_default'\);/,
    'const [activeCanvasId, setActiveCanvasId] = useState(() => localStorage.getItem(\'oasis_active_canvas\') || \'canvas_default\');\n    const [titlePrompt, setTitlePrompt] = useState(null);'
);

// 4. Pass onRequestTitleEdit to <MemoNode ...>
content = content.replace(
    /<MemoNode\s*key=\{b\.id\}\s*block=\{b\}/g,
    '<MemoNode\n                            onRequestTitleEdit={(blockId, currentText) => setTitlePrompt({ blockId, defaultValue: currentText, onConfirm: (newText) => { if(newText && newText.trim() && newText !== currentText) { const b = blocks.find(x => x.id === blockId); if (b) onSelect({...b, content: newText.trim(), type: \'canvas_title\'}); } } })}\n                            key={b.id}\n                            block={b}'
);

// 5. Replace window.prompt in the "T" button - ONLY MATCHING THE EXACT STRING TO AVOID GREEDY REGEX ISSUES
const targetButtonCode =                     <button onClick={() => {
                        const titleText = window.prompt('Escribe el texto o título:');
                        if (!titleText || !titleText.trim()) return;
                        const newBlock = {
                            id: \	ext-\\,
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
                    }} className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all relative group" title="Añadir Texto al Pizarrón">;

const replacementButtonCode =                     <button onClick={() => {
                        setTitlePrompt({ defaultValue: '', onConfirm: (titleText) => {
                            if (!titleText || !titleText.trim()) return;
                            const newBlock = {
                                id: \	itle-\\,
                                type: 'canvas_title',
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
                        } });
                    }} className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all relative group" title="Añadir Texto al Pizarrón">;

content = content.replace(targetButtonCode, replacementButtonCode);

// 6. Add modal rendering at the end of App
content = content.replace(
    /\{isHighlightModalOpen && \(\s*<div/g,
    '{titlePrompt && (\n                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={() => setTitlePrompt(null)}>\n                    <div className="bg-[#121214] border border-white/10 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>\n                        <h3 className="text-white text-lg font-black uppercase tracking-widest mb-4">{titlePrompt.defaultValue ? \'Editar Título\' : \'Añadir Título\'}</h3>\n                        <input \n                            type="text" \n                            autoFocus \n                            defaultValue={titlePrompt.defaultValue}\n                            placeholder="Escribe el texto aquí..."\n                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-accent transition-colors mb-6"\n                            onKeyDown={(e) => {\n                                if (e.key === \'Enter\') {\n                                    titlePrompt.onConfirm(e.currentTarget.value);\n                                    setTitlePrompt(null);\n                                }\n                                if (e.key === \'Escape\') setTitlePrompt(null);\n                            }}\n                            id="title-prompt-input"\n                        />\n                        <div className="flex gap-3 justify-end">\n                            <button onClick={() => setTitlePrompt(null)} className="px-5 py-2.5 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 font-bold text-xs uppercase tracking-widest transition-all">Cancelar</button>\n                            <button onClick={() => { const input = document.getElementById(\'title-prompt-input\'); titlePrompt.onConfirm(input.value); setTitlePrompt(null); }} className="px-5 py-2.5 rounded-xl bg-accent text-accent-foreground font-black text-xs uppercase tracking-widest hover:brightness-110 transition-all">Aceptar</button>\n                        </div>\n                    </div>\n                </div>\n            )}\n\n            {isHighlightModalOpen && (\n                <div'
);

// 7. Update TikTok font style for canvas_title
content = content.replace(
    /return \(\s*block\.type === 'canvas_title' \? \(\s*<div\s*className=\{\select-none.*?onClick=\{\(e\) => \{.*?<div\s*className="text-3xl md:text-5xl lg:text-7xl font-black tracking-tighter text-white uppercase text-center whitespace-pre-wrap leading-none p-4 pointer-events-none"\s*style=\{\{ WebkitTextStroke: '2px black', textShadow: '0 10px 40px rgba\(0,0,0,0\.8\)' \}\}\s*>\s*\{block\.content\}\s*<\/div>/s,
    'return block.type === \'canvas_title\' ? (\n        <div\n            className={select-none cursor-move active:cursor-grabbing group z-10   flex items-center justify-center}\n            style={useInternalPosition ? { left: block.x, top: block.y, transform: 	ranslate(-50%, -50%), willChange: \'transform\', backfaceVisibility: \'hidden\', WebkitBackfaceVisibility: \'hidden\' } : { willChange: \'transform\', backfaceVisibility: \'hidden\', WebkitBackfaceVisibility: \'hidden\' }}\n            onMouseDown={(e) => {\n                if (showDeleteConfirm) { e.stopPropagation(); return; }\n                e.stopPropagation();\n                handleNodeMouseDown(e);\n                onStart(e, block.id);\n            }}\n            onTouchStart={(e) => {\n                if (showDeleteConfirm) { e.stopPropagation(); return; }\n                e.stopPropagation();\n                onStart(e, block.id);\n                if (e.touches && e.touches.length === 1) {\n                    touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };\n                    if (longPressTimer.current) clearTimeout(longPressTimer.current);\n                    longPressTimer.current = setTimeout(() => {\n                        if (navigator.vibrate) navigator.vibrate([60, 40, 60]);\n                        setShowDeleteConfirm(true);\n                    }, 600);\n                }\n            }}\n            onTouchEnd={(e) => {\n                if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }\n            }}\n            onClick={(e) => {\n                const dist = Math.hypot(e.clientX - mouseDownPos.current.x, e.clientY - mouseDownPos.current.y);\n                if (dist < 5) {\n                    e.stopPropagation();\n                    if (showDeleteConfirm) return;\n                    if (onRequestTitleEdit) { onRequestTitleEdit(block.id, block.content); } else { const newText = window.prompt(\'Editar título:\', block.content); if (newText && newText.trim() && newText !== block.content) { onSelect({ ...block, content: newText.trim(), type: \'canvas_title\' }); } }\n                }\n            }}\n        >\n            <div \n                className="text-4xl md:text-5xl lg:text-[5rem] text-white text-center whitespace-pre-wrap leading-tight p-4 pointer-events-none"\n                style={{ \n                    fontFamily: \'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif\',\n                    fontWeight: \'800\',\n                    WebkitTextStroke: \'2.5px black\', \n                    textShadow: \'0px 2px 0px #000, 0px 4px 0px #000, 2px 4px 0px #000, -2px 4px 0px #000, 3px 3px 0px #000, -3px 3px 0px #000, 0px 15px 40px rgba(0,0,0,0.6)\'\n                }}\n            >\n                {block.content}\n            </div>'
);

// 8. Auto close delete prompt on outside click
content = content.replace(
    /React\.useEffect\(\(\) => \{\s*return \(\) => \{\s*if \(longPressTimer\.current\) clearTimeout\(longPressTimer\.current\);\s*\};\s*\}, \[\]\);/g,
    'React.useEffect(() => { return () => { if (longPressTimer.current) clearTimeout(longPressTimer.current); }; }, []);\n\n    React.useEffect(() => {\n        if (!showDeleteConfirm) return;\n        const handleOutsideClick = () => { setShowDeleteConfirm(false); };\n        const timer = setTimeout(() => { window.addEventListener(\'pointerdown\', handleOutsideClick); }, 10);\n        return () => { clearTimeout(timer); window.removeEventListener(\'pointerdown\', handleOutsideClick); };\n    }, [showDeleteConfirm]);'
);

fs.writeFileSync(p, content);
console.log('Success');
