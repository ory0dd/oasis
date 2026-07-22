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
    /<MemoNode\s*key=\{b\.id\}\s*block=\{b\}/,
    '<MemoNode\n                            onRequestTitleEdit={(blockId, currentText) => setTitlePrompt({ blockId, defaultValue: currentText, onConfirm: (newText) => { if(newText && newText.trim() && newText !== currentText) { const b = blocks.find(x => x.id === blockId); if (b) onSelect({...b, content: newText.trim(), type: \'canvas_title\'}); } } })}\n                            key={b.id}\n                            block={b}'
);

// 5. Replace window.prompt in the "T" button
content = content.replace(
    /const titleText = window\.prompt\('Escribe el texto o título:'\);\s*if \(\!titleText \|\| \!titleText\.trim\(\)\) return;\s*const newBlock = \{/g,
    'setTitlePrompt({ defaultValue: \'\', onConfirm: (titleText) => { if (!titleText || !titleText.trim()) return; const newBlock = {'
);
content = content.replace(
    /if \(typeof syncBlocks === 'function'\) syncBlocks\(updated\);\s*return updated;\s*\}\);\s*\}\} className="w-10/g,
    'if (typeof syncBlocks === \'function\') syncBlocks(updated);\n                            return updated;\n                        });\n                    } });\n                    }} className="w-10'
);

// 6. Add modal rendering at the end of App
content = content.replace(
    /\{isHighlightModalOpen && \(\s*<div/,
    '{titlePrompt && (\n                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={() => setTitlePrompt(null)}>\n                    <div className="bg-[#121214] border border-white/10 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>\n                        <h3 className="text-white text-lg font-black uppercase tracking-widest mb-4">{titlePrompt.defaultValue ? \'Editar Título\' : \'Añadir Título\'}</h3>\n                        <input \n                            type="text" \n                            autoFocus \n                            defaultValue={titlePrompt.defaultValue}\n                            placeholder="Escribe el texto aquí..."\n                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-accent transition-colors mb-6"\n                            onKeyDown={(e) => {\n                                if (e.key === \'Enter\') {\n                                    titlePrompt.onConfirm(e.currentTarget.value);\n                                    setTitlePrompt(null);\n                                }\n                                if (e.key === \'Escape\') setTitlePrompt(null);\n                            }}\n                            id="title-prompt-input"\n                        />\n                        <div className="flex gap-3 justify-end">\n                            <button onClick={() => setTitlePrompt(null)} className="px-5 py-2.5 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 font-bold text-xs uppercase tracking-widest transition-all">Cancelar</button>\n                            <button onClick={() => { const input = document.getElementById(\'title-prompt-input\'); titlePrompt.onConfirm(input.value); setTitlePrompt(null); }} className="px-5 py-2.5 rounded-xl bg-accent text-accent-foreground font-black text-xs uppercase tracking-widest hover:brightness-110 transition-all">Aceptar</button>\n                        </div>\n                    </div>\n                </div>\n            )}\n\n            {isHighlightModalOpen && (\n                <div'
);

fs.writeFileSync(p, content);
console.log('Success');
