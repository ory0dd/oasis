const fs = require('fs');
const file = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const replacements = [
    {
        search: `text-[11px] font-black uppercase tracking-wide mt-0.5`,
        replace: `text-[9.5px] font-black uppercase tracking-wide mt-0.5`
    },
    {
        search: `text-[12px] text-zinc-200 leading-relaxed font-sans font-medium`,
        replace: `text-[10px] text-zinc-300 leading-relaxed font-sans font-medium`
    },
    {
        search: `text-[11px] text-zinc-300 italic leading-relaxed mt-1.5`,
        replace: `text-[9.5px] text-zinc-400 italic leading-relaxed mt-1.5`
    },
    {
        search: `text-[10px] font-bold text-sky-400 uppercase tracking-wider leading-relaxed`,
        replace: `text-[9px] font-bold text-sky-400 uppercase tracking-wider leading-relaxed`
    },
    {
        search: `text-xs text-white placeholder-zinc-600 focus:border-sky-500/50`,
        replace: `text-[10px] text-white placeholder-zinc-600 focus:border-sky-500/50`
    }
];

let changed = false;
replacements.forEach(r => {
    if (content.includes(r.search)) {
        content = content.replace(new RegExp(r.search.replace(/[.*+?^\${}()|[\]\\]/g, '\\$&'), 'g'), r.replace);
        changed = true;
        console.log("Replaced:", r.search.substring(0, 20) + "...");
    } else {
        console.log("NOT FOUND:", r.search.substring(0, 20) + "...");
    }
});

if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log("Fonts minimized!");
}
