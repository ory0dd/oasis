const fs = require('fs');
let code = fs.readFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/App.jsx', 'utf8');

// 1. Remove the diary button in the toolbar
const diaryButtonTarget = `<button onClick={() => { if (isComposerOpen) { if (noteText?.trim()) handleComposerAutoSave(); setIsComposerOpen(false); } setIsChatOpen(false); setActiveNotebook('diary'); setIsPublishSelectorOpen(false); }} className={\`h-7 sm:h-8 rounded-full flex items-center justify-center transition-all overflow-hidden \${activeNotebook !== 'diary' && isAnyContextOpen ? 'w-0 sm:w-0 opacity-0 px-0 mx-0 pointer-events-none group-hover:w-7 sm:group-hover:w-8 group-hover:opacity-100 group-hover:pointer-events-auto' : 'w-7 sm:w-8 opacity-100 pointer-events-auto'} \${activeNotebook === 'diary' ? 'bg-white/15 text-white' : 'text-zinc-600 hover:text-white hover:bg-white/8'}\`} title="Diario"><StickyNote size={13} className="shrink-0 scale-90 sm:scale-100" /></button>`;

code = code.replace(diaryButtonTarget, '');

// 2. Eradicate diary blocks deep at the source level.
// Search for where `serverBlocks` is defined and add a permanent filter before state sets.
const smartMergeSearch = `const serverBlocks = userData.blocks || [];`;
const smartMergeReplace = `const serverBlocks = (userData.blocks || []).filter(b => b.type !== 'diary' && b.type !== 'diary_notebook' && (!b.entries || b.entries.length === 0));`;
code = code.replace(smartMergeSearch, smartMergeReplace);

const wsMergeSearch = `const serverFiltered = (data.blocks || []).filter(b => b.type !== 'insight');`;
const wsMergeReplace = `const serverFiltered = (data.blocks || []).filter(b => b.type !== 'insight' && b.type !== 'diary' && b.type !== 'diary_notebook' && (!b.entries || b.entries.length === 0));`;
code = code.replace(wsMergeSearch, wsMergeReplace);

// Remove the global load diary state entirely
const globalSetSearch = `setBlocks(prev => {`;
// Actually, let's just use `smartMergeBlocks` to always filter.
const smartMergeFunc = `function smartMergeBlocks(serverB, localUser) {`;
const smartMergeFuncReplace = `function smartMergeBlocks(serverB, localUser) {
    serverB = serverB.filter(b => b.type !== 'diary' && b.type !== 'diary_notebook' && (!b.entries || b.entries.length === 0));
`;
code = code.replace(smartMergeFunc, smartMergeFuncReplace);

fs.writeFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/App.jsx', code);
console.log("SUCCESS");
