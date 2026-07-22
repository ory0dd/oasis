const fs = require('fs');

// SimpleNotesView
let snv = fs.readFileSync('src/components/SimpleNotesView.jsx', 'utf8');
snv = snv.replace(
    /const SimpleNotesView = React\.forwardRef\(\(\{\s*blocks,\s*setBlocks,\s*accent,\s*user,\s*onClose,\s*editBlock,\s*openNewComposer\s*\}, ref\) => \{/,
    'const SimpleNotesView = React.forwardRef(({ className, blocks, setBlocks, accent, user, onClose, editBlock, openNewComposer }, ref) => {'
);
snv = snv.replace(
    /className=\"fixed inset-x-0 md:inset-x-\[10vw\] lg:inset-x-\[20vw\] xl:inset-x-\[25vw\] top-\[140px\] md:top-\[100px\] rounded-t-\[2\.5rem\] border-t border-x border-white\/10 z-\[1500\] flex flex-col bg-\[\#050506\]\/95 backdrop-blur-3xl text-white animate-in fade-in slide-in-from-bottom-10 duration-700 overflow-hidden shadow-\[0_-20px_50px_rgba\(0,0,0,0\.8\)\] md:shadow-\[0_0_100px_rgba\(0,0,0,0\.8\)\] pb-safe transition-all duration-500\"/,
    'className={className || "fixed inset-x-0 md:inset-x-[10vw] lg:inset-x-[20vw] xl:inset-x-[25vw] top-[140px] md:top-[100px] rounded-t-[2.5rem] border-t border-x border-white/10 z-[1500] flex flex-col bg-[#050506]/95 backdrop-blur-3xl text-white animate-in fade-in slide-in-from-bottom-10 duration-700 overflow-hidden shadow-[0_-20px_50px_rgba(0,0,0,0.8)] md:shadow-[0_0_100px_rgba(0,0,0,0.8)] pb-safe transition-all duration-500"}'
);
fs.writeFileSync('src/components/SimpleNotesView.jsx', snv);

// OasisChat
let oc = fs.readFileSync('src/components/OasisChat.jsx', 'utf8');
oc = oc.replace(
    /const OasisChat = \(\{\s*isOpen,\s*messages,\s*input/,
    'const OasisChat = ({ className, isOpen, messages, input'
);
oc = oc.replace(
    /className=\"fixed inset-x-0 md:inset-x-\[10vw\] lg:inset-x-\[20vw\] xl:inset-x-\[25vw\] top-\[140px\] md:top-\[100px\] rounded-t-\[2\.5rem\] border-t border-x border-white\/10 z-\[1500\] flex bg-\[\#050506\]\/95 backdrop-blur-3xl animate-in fade-in slide-in-from-bottom-10 duration-700 overflow-hidden transition-all duration-500 shadow-\[0_-20px_50px_rgba\(0,0,0,0\.8\)\] md:shadow-\[0_0_100px_rgba\(0,0,0,0\.8\)\] pb-safe\"/,
    'className={className || "fixed inset-x-0 md:inset-x-[10vw] lg:inset-x-[20vw] xl:inset-x-[25vw] top-[140px] md:top-[100px] rounded-t-[2.5rem] border-t border-x border-white/10 z-[1500] flex bg-[#050506]/95 backdrop-blur-3xl animate-in fade-in slide-in-from-bottom-10 duration-700 overflow-hidden transition-all duration-500 shadow-[0_-20px_50px_rgba(0,0,0,0.8)] md:shadow-[0_0_100px_rgba(0,0,0,0.8)] pb-safe"}'
);
fs.writeFileSync('src/components/OasisChat.jsx', oc);
