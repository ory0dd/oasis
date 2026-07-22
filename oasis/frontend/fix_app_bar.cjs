const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Remove Mic buttons
content = content.replace(/<button onClick=\{chatToggleRecording\}.*?title="Dictar"><Mic size=\{12\} \/><\/button>/g, '');
content = content.replace(/<button onClick=\{toggleNoteRecording\}.*?title="Voz"><Mic size=\{13\} \/><\/button>/g, '');
content = content.replace(/<button onClick=\{toggleNoteRecording\}.*?title="Dictar"><Mic size=\{13\} \/><\/button>/g, '');

// 2. Define hasActiveInput in the render block
content = content.replace('const isKeyboardOpen = window.innerWidth < 768 && (maxHeight - viewportStats.visualHeight) > 150;', 'const isKeyboardOpen = window.innerWidth < 768 && (maxHeight - viewportStats.visualHeight) > 150;\n                const hasActiveInput = ((isChatOpen && chatInputBar?.trim()) || ((isComposerOpen || activeNotebook === \'diary\') && noteText?.trim()) || (activeNotebook === \'resonance\' && typeof resResonance !== \'undefined\' && resResonance?.trim()));');

// 3. Update the left nav container
content = content.replace('<div className="group flex items-center gap-0.5 px-2 py-1.5 shrink-0 border-r border-white/[0.06] transition-all duration-300">', '<div className="group flex items-center gap-0.5 px-1 sm:px-2 py-1.5 shrink-0 border-r border-white/[0.06] transition-all duration-300">');

// 4. Update the 5 buttons
content = content.replace(/chatInputBar\?\.trim\(\)/g, 'hasActiveInput');

content = content.replace(/h-8 rounded-full flex items-center justify-center transition-all overflow-hidden/g, 'h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center transition-all overflow-hidden');

content = content.replace(/w-0 opacity-0 px-0 mx-0 pointer-events-none group-hover:w-8/g, 'w-0 sm:w-0 opacity-0 px-0 mx-0 pointer-events-none group-hover:w-7 sm:group-hover:w-8');

content = content.replace(/className="shrink-0"/g, 'className="shrink-0 scale-90 sm:scale-100"');

fs.writeFileSync('src/App.jsx', content);
console.log('App.jsx updated successfully.');
