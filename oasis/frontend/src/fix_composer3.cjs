const fs = require('fs');
const path = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/App.jsx';
let code = fs.readFileSync(path, 'utf8');

const oldComposerClassStr = 'className={isSplitViewEnabled ? "fixed inset-y-0 right-0 w-[50vw] mt-[100px] border-l border-white/10 rounded-tl-[2.5rem] bg-[#050506]/95 backdrop-blur-md text-white shadow-2xl z-[1550] flex flex-col pb-safe overflow-hidden pointer-events-auto animate-in fade-in duration-500" : "fixed inset-x-0 md:inset-x-[5vw] lg:inset-x-[10vw] xl:inset-x-[10vw] top-[140px] md:top-[100px] bottom-0 rounded-t-[2.5rem] border-t border-x border-white/5 md:border-white/10 z-[1500] flex flex-col bg-[#050506]/95 backdrop-blur-md text-white shadow-[0_-20px_50px_rgba(0,0,0,0.8)] pb-safe overflow-hidden animate-in fade-in slide-in-from-bottom-[60%] duration-500 transition-all pointer-events-auto"}';
const newComposerClassStr = 'className={(isSplitViewEnabled && (isChatOpen || activeNotebook === \\\'resonance\\\')) ? "fixed inset-y-0 right-0 w-[50vw] mt-[100px] border-l border-white/10 rounded-tl-[2.5rem] bg-[#050506]/95 backdrop-blur-md text-white shadow-2xl z-[1550] flex flex-col pb-safe overflow-hidden pointer-events-auto animate-in fade-in duration-500" : "fixed inset-x-0 md:inset-x-[5vw] lg:inset-x-[10vw] xl:inset-x-[10vw] top-[140px] md:top-[100px] bottom-0 rounded-t-[2.5rem] border-t border-x border-white/5 md:border-white/10 z-[1500] flex flex-col bg-[#050506]/95 backdrop-blur-md text-white shadow-[0_-20px_50px_rgba(0,0,0,0.8)] pb-safe overflow-hidden animate-in fade-in slide-in-from-bottom-[60%] duration-500 transition-all pointer-events-auto"}';

code = code.replace(oldComposerClassStr, newComposerClassStr);

fs.writeFileSync(path, code);
console.log('Fixed Composer split logic');
