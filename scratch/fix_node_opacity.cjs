const fs = require('fs');
const file = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const regex1 = /isSelected \? 'border-blue-400 bg-blue-500\/20'/g;
if (regex1.test(content)) {
    content = content.replace(regex1, "isSelected ? 'border-blue-400 bg-[#0a0a0c] shadow-[inset_0_0_30px_rgba(59,130,246,0.3)]'");
}

const regex2 = /isSelected \? 'border-emerald-400 bg-emerald-500\/20'/g;
if (regex2.test(content)) {
    content = content.replace(regex2, "isSelected ? 'border-emerald-400 bg-[#0a0a0c] shadow-[inset_0_0_30px_rgba(16,185,129,0.3)]'");
}

const regex3 = /isSelected \? 'border-rose-400 bg-rose-500\/20'/g;
if (regex3.test(content)) {
    content = content.replace(regex3, "isSelected ? 'border-rose-400 bg-[#0a0a0c] shadow-[inset_0_0_30px_rgba(244,63,94,0.3)]'");
}

const regex4 = /isSelected \? 'border-zinc-300 bg-white\/10'/g;
if (regex4.test(content)) {
    content = content.replace(regex4, "isSelected ? 'border-zinc-300 bg-[#0a0a0c] shadow-[inset_0_0_30px_rgba(255,255,255,0.15)]'");
}

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed node opacity!');
