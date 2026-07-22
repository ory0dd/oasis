const fs = require('fs');
let code = fs.readFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx', 'utf8');

// 1. Fullscreen layout adjustments
code = code.replace(
    '"relative w-full h-full font-sans text-zinc-100 flex flex-col"',
    '"relative w-full h-full font-sans text-zinc-100 flex flex-col overflow-hidden"'
);

code = code.replace(
    '"relative z-10 w-full px-3 sm:px-4 pt-[110px] md:pt-[96px] pb-safe flex-1 flex flex-col pointer-events-auto"',
    '"relative z-10 w-full h-full flex-1 flex flex-col pointer-events-none"'
);

code = code.replace(
    'className="flex-1 flex flex-col gap-6 animate-in slide-in-from-bottom-8 duration-700 delay-200 fill-mode-both"',
    'className="flex-1 flex flex-col animate-in slide-in-from-bottom-8 duration-700 delay-200 fill-mode-both w-full h-full pointer-events-none"'
);

code = code.replace(
    'className="flex-1 bg-zinc-950/95 sm:bg-zinc-950/60 sm:backdrop-blur-xl border border-white/5 rounded-[2rem] p-3 md:p-4 shadow-2xl relative flex flex-col"',
    'className="absolute inset-0 z-0 flex flex-col w-full h-full pointer-events-auto"'
);

code = code.replace(
    'className="flex flex-row items-center justify-between gap-2 mb-2"',
    'className="absolute top-[20px] md:top-[40px] left-4 right-4 flex flex-row items-center justify-between gap-2 z-50 pointer-events-auto"'
);

code = code.replace(
    'className="absolute top-24 left-1/2 transform -translate-x-1/2 z-[80] flex bg-black/60 backdrop-blur-xl p-1 rounded-2xl border border-white/10 w-fit min-w-[300px] gap-1 overflow-x-auto no-scrollbar shadow-2xl pointer-events-auto"',
    'className="absolute top-[80px] md:top-[100px] left-1/2 transform -translate-x-1/2 z-[80] flex bg-black/60 backdrop-blur-xl p-1 rounded-2xl border border-white/10 w-fit min-w-[300px] gap-1 overflow-x-auto no-scrollbar shadow-2xl pointer-events-auto"'
);

// We need the Islands and Diagnostic modules to float correctly.
// Module 1.5 container replacement
code = code.replace(
    '<div className="bg-zinc-950/60 backdrop-blur-xl border border-white/5 rounded-[2rem] p-4 md:p-6 shadow-xl">',
    '<div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-[95%] max-w-4xl z-[150] bg-zinc-950/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-4 md:p-6 shadow-2xl animate-in slide-in-from-bottom-8 pointer-events-auto">'
);

// 2. Auto-select easiest node logic
const effectInjection = `
    const hasAutoSelectedPattern = useRef(false);
    useEffect(() => {
        if (!hasAutoSelectedPattern.current && currentPatterns.length > 0 && !selectedPatternId) {
            hasAutoSelectedPattern.current = true;
            setSelectedPatternId(currentPatterns[0].id);
        }
    }, [currentPatterns, selectedPatternId]);
`;

code = code.replace(
    '    const activePattern = useMemo(() => {',
    effectInjection + '\n    const activePattern = useMemo(() => {'
);

fs.writeFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx', code);
console.log("Fixes applied");
