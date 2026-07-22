const fs = require('fs');
let code = fs.readFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx', 'utf8');

// 1. Resumen Clinico text size
code = code.replace(
    'className={idx === 0 ? "text-white text-xl md:text-3xl font-normal leading-normal" : "text-zinc-400 leading-relaxed"}',
    'className={idx === 0 ? "text-zinc-100 text-base md:text-xl font-normal leading-relaxed" : "text-zinc-400 leading-relaxed"}'
);

// 2. Remove the modal overall background so the map is completely visible
code = code.replace(
    '"fixed inset-0 z-[100] bg-[#030304] overflow-y-auto no-scrollbar font-sans text-zinc-100 animate-in fade-in duration-700 flex flex-col"',
    '"fixed inset-0 z-[100] bg-transparent pointer-events-none overflow-y-auto no-scrollbar font-sans text-zinc-100 animate-in fade-in duration-700 flex flex-col"'
);

// 3. Make sure inner containers allow pointer events where needed
code = code.replace(
    '"relative z-10 w-full px-3 sm:px-4 pt-[110px] md:pt-[96px] pb-safe flex-1 flex flex-col"',
    '"relative z-10 w-full px-3 sm:px-4 pt-[110px] md:pt-[96px] pb-safe flex-1 flex flex-col pointer-events-auto"'
);

code = code.replace(
    'className="absolute inset-0 z-40 bg-[#050506]/95 p-6 md:p-8 !pt-[120px] overflow-y-auto custom-scroll animate-in fade-in duration-300 flex flex-col h-full"',
    'className="absolute inset-0 z-40 bg-transparent p-6 md:p-8 !pt-[120px] overflow-y-auto custom-scroll animate-in fade-in duration-300 flex flex-col h-full pointer-events-auto"'
);

// 4. In mobile, the bucles items take too much space. Let's fix their layout.
code = code.replace(
    "className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-3 cursor-pointer ${!isLocked ? 'hover:scale-[1.01] active:scale-[0.99] transition-transform' : ''}`}",
    "className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 md:p-4 gap-2 md:gap-3 cursor-pointer ${!isLocked ? 'hover:scale-[1.01] active:scale-[0.99] transition-transform' : ''}`}"
);

fs.writeFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx', code);
console.log("SUCCESS");
