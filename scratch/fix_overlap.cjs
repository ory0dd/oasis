const fs = require('fs');
const file = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Loop tab
const loopRegex = /mapViewTab === 'loop' && \(\s*<div className="absolute inset-0 z-40 bg-\[#050506\]\/95 p-6 md:p-8 overflow-y-auto no-scrollbar animate-in fade-in duration-300"/;
if (loopRegex.test(content)) {
    content = content.replace(loopRegex, `mapViewTab === 'loop' && (\n                                    <div className="absolute inset-0 z-40 bg-[#050506]/95 p-6 pt-24 md:p-8 md:pt-28 overflow-y-auto no-scrollbar animate-in fade-in duration-300"`);
    console.log("Fixed loop tab padding");
}

// 2. Exit Keys tab
const exitRegex = /mapViewTab === 'exit_keys' && \(\s*<div className="absolute inset-0 z-40 bg-\[#050506\]\/95 p-6 md:p-8 overflow-y-auto no-scrollbar animate-in fade-in duration-300"/;
if (exitRegex.test(content)) {
    content = content.replace(exitRegex, `mapViewTab === 'exit_keys' && (\n                                    <div className="absolute inset-0 z-40 bg-[#050506]/95 p-6 pt-24 md:p-8 md:pt-28 overflow-y-auto no-scrollbar animate-in fade-in duration-300"`);
    console.log("Fixed exit_keys tab padding");
}

// 3. Avances tab
const avancesRegex = /mapViewTab === 'avances' && \(\s*<div className="absolute inset-0 z-40 bg-\[#050506\]\/95 p-6 md:p-8 overflow-y-auto custom-scroll animate-in fade-in duration-300 flex flex-col h-full"/;
if (avancesRegex.test(content)) {
    content = content.replace(avancesRegex, `mapViewTab === 'avances' && (\n                                    <div className="absolute inset-0 z-40 bg-[#050506]/95 p-6 pt-24 md:p-8 md:pt-28 overflow-y-auto custom-scroll animate-in fade-in duration-300 flex flex-col h-full"`);
    console.log("Fixed avances tab padding");
}

fs.writeFileSync(file, content, 'utf8');
