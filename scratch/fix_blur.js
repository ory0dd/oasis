const fs = require('fs');
let code = fs.readFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx', 'utf8');

// Replace bg-transparent in the tabs containers with a nice blur and slight dark tint
code = code.replace(
    /className="absolute inset-0 z-40 bg-transparent p-6 md:p-8 !pt-\[120px\] overflow-y-auto custom-scroll animate-in fade-in duration-300 flex flex-col h-full pointer-events-auto"/g,
    'className="absolute inset-0 z-40 bg-black/40 backdrop-blur-[6px] p-6 md:p-8 !pt-[120px] overflow-y-auto custom-scroll animate-in fade-in duration-300 flex flex-col h-full pointer-events-auto"'
);

// Also add a little blur specifically to the textarea in avances so the box itself is blurred
code = code.replace(
    'className="w-full flex-1 bg-zinc-950 border border-white/10 rounded-xl p-4 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50 resize-none transition-colors"',
    'className="w-full flex-1 bg-black/50 backdrop-blur-md border border-white/10 rounded-xl p-4 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-blue-500/50 resize-none transition-colors shadow-xl"'
);

fs.writeFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx', code);
console.log("SUCCESS");
