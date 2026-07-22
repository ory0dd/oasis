const fs = require('fs');
const file = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// Find the disabled:opacity-0 and change to disabled:opacity-30
content = content.replace('disabled:opacity-0 disabled:pointer-events-none">\n                                                    <ChevronLeft', 'disabled:opacity-30 disabled:pointer-events-none">\n                                                    <ChevronLeft');

// Also make the window resizable
content = content.replace('w-80 bg-zinc-950/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden', 'w-80 bg-zinc-950/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden resize-y min-h-[400px]');

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed opacity and added resize');
