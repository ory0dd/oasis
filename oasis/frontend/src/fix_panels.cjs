const fs = require('fs');
const path = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/App.jsx';
let code = fs.readFileSync(path, 'utf8');

const snOld = 'className={isSplitViewEnabled ? "fixed inset-y-0 right-0 w-[50vw] mt-[100px] border-l border-white/10 rounded-tl-[2.5rem] bg-[#050506]/95 backdrop-blur-md shadow-2xl z-[1500] pointer-events-auto" : undefined}';
const snNew = 'className={(isSplitViewEnabled && (isChatOpen || activeNotebook === \\\'resonance\\\')) ? "fixed inset-y-0 right-0 w-[50vw] mt-[100px] border-l border-white/10 rounded-tl-[2.5rem] bg-[#050506]/95 backdrop-blur-md shadow-2xl z-[1500] pointer-events-auto" : undefined}';
code = code.replace(snOld, snNew);

const lOld = 'className={isSplitViewEnabled ? "fixed inset-y-0 left-0 w-[50vw] mt-[100px] border-r border-white/10 rounded-tr-[2.5rem] bg-[#050506]/95 backdrop-blur-md shadow-2xl z-[1500] pointer-events-auto" : undefined}';
const lNew = 'className={(isSplitViewEnabled && isSimpleNotesOpen) ? "fixed inset-y-0 left-0 w-[50vw] mt-[100px] border-r border-white/10 rounded-tr-[2.5rem] bg-[#050506]/95 backdrop-blur-md shadow-2xl z-[1500] pointer-events-auto" : undefined}';
code = code.replace(new RegExp(lOld.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), lNew);

fs.writeFileSync(path, code);
console.log('Fixed panel rendering logic');
