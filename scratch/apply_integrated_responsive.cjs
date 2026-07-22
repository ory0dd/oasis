const fs = require('fs');
const file = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// Update Left Panel for responsiveness
const targetLeftPanel = `                            {mapViewTab === 'bucles' && (
                                <div className="absolute top-[100px] left-8 bottom-8 z-[110] w-[380px] bg-zinc-950/80 backdrop-blur-3xl border border-white/5 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-left-8 pointer-events-auto overflow-y-auto custom-scroll">`;

const replaceLeftPanel = `                            {mapViewTab === 'bucles' && (
                                <div className="absolute top-[90px] md:top-[100px] left-4 md:left-8 bottom-4 md:bottom-8 z-[110] w-[calc(100%-2rem)] md:w-[380px] bg-zinc-950/80 backdrop-blur-3xl border border-white/5 rounded-3xl p-4 md:p-6 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-left-8 pointer-events-auto overflow-y-auto custom-scroll">`;

content = content.replace(targetLeftPanel, replaceLeftPanel);

// Update Empty State for responsiveness
const targetEmpty = `                            {mapViewTab === 'bucles' && !selectedPatternId && (
                                <div className="absolute top-[100px] left-[430px] right-8 bottom-8 z-[110] bg-zinc-950/30 backdrop-blur-3xl border border-white/5 border-dashed rounded-3xl flex flex-col items-center justify-center gap-6 animate-in fade-in duration-500 pointer-events-auto">`;

const replaceEmpty = `                            {mapViewTab === 'bucles' && !selectedPatternId && (
                                <div className="hidden md:flex absolute top-[100px] left-[430px] right-8 bottom-8 z-[110] bg-zinc-950/30 backdrop-blur-3xl border border-white/5 border-dashed rounded-3xl flex-col items-center justify-center gap-6 animate-in fade-in duration-500 pointer-events-auto">`;

content = content.replace(targetEmpty, replaceEmpty);

// Update Right Panel for responsiveness
const targetRightPanel = `<div
                                    id="pattern-details-panel"
                                    className="absolute top-[100px] left-[430px] right-8 bottom-8 z-[110] bg-zinc-950/80 backdrop-blur-3xl border border-purple-500/20 rounded-3xl p-6 shadow-2xl flex flex-col gap-6 animate-in slide-in-from-right-8 pointer-events-auto overflow-hidden"`;

const replaceRightPanel = `<div
                                    id="pattern-details-panel"
                                    className="absolute top-[90px] md:top-[100px] left-4 md:left-[430px] right-4 md:right-8 bottom-4 md:bottom-8 z-[120] md:z-[110] bg-zinc-950/95 md:bg-zinc-950/80 backdrop-blur-3xl border border-purple-500/20 rounded-3xl p-4 md:p-6 shadow-2xl flex flex-col gap-4 md:gap-6 animate-in slide-in-from-right-8 pointer-events-auto overflow-hidden"`;

content = content.replace(targetRightPanel, replaceRightPanel);

fs.writeFileSync(file, content, 'utf8');
console.log("Done");
