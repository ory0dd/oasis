const fs = require('fs');

// DiaryNotebook
let dn = fs.readFileSync('src/components/DiaryNotebook.jsx', 'utf8');
dn = dn.replace(
    /className=\{\`\$\{className\} text-white flex animate-in fade-in slide-in-from-bottom-10 duration-700 overflow-hidden\`\}/,
    'className={`${className || "fixed inset-x-0 md:inset-x-[10vw] lg:inset-x-[20vw] xl:inset-x-[25vw] top-[140px] md:top-[100px] rounded-t-[2.5rem] border-t border-x border-white/10 z-[1500] shadow-[0_-20px_50px_rgba(0,0,0,0.8)] md:shadow-[0_0_100px_rgba(0,0,0,0.8)]"} flex flex-col bg-[#050506] text-white animate-in fade-in slide-in-from-bottom-10 duration-700 overflow-hidden pb-safe transition-all duration-500`}'
);
fs.writeFileSync('src/components/DiaryNotebook.jsx', dn);

// ResonanceNotebook
let rn = fs.readFileSync('src/components/ResonanceNotebook.jsx', 'utf8');
rn = rn.replace(
    /className=\{\`\$\{className\} text-white flex animate-in fade-in slide-in-from-bottom-10 duration-700 overflow-hidden\`\}/,
    'className={`${className || "fixed inset-x-0 md:inset-x-[10vw] lg:inset-x-[20vw] xl:inset-x-[25vw] top-[140px] md:top-[100px] rounded-t-[2.5rem] border-t border-x border-white/10 z-[1500] shadow-[0_-20px_50px_rgba(0,0,0,0.8)] md:shadow-[0_0_100px_rgba(0,0,0,0.8)]"} flex flex-col bg-[#0b0b0d] text-white animate-in fade-in slide-in-from-bottom-10 duration-700 overflow-hidden pb-safe transition-all duration-500`}'
);
fs.writeFileSync('src/components/ResonanceNotebook.jsx', rn);
