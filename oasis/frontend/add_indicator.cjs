const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');

const targetStr = `                <div data-index={0} className="profile-slide w-full h-screen snap-start shrink-0 relative flex flex-col pt-16 px-6 md:px-10 z-10">`;
const targetStrCRLF = targetStr.replace(/\n/g, '\r\n');

const replacement = `                <div data-index={0} className="profile-slide w-full h-screen snap-start shrink-0 relative flex flex-col pt-16 px-6 md:px-10 z-10">
                    {/* Pull down indicator for Canvas */}
                    <div className="absolute top-4 sm:top-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-40 hover:opacity-100 transition-opacity cursor-pointer z-50 animate-bounce" onClick={() => setView('canvas')}>
                        <span className="text-[7px] font-black uppercase tracking-[0.3em] text-zinc-500">Desliza para Pizarrón</span>
                        <ChevronUp size={12} className="text-zinc-500" />
                    </div>`;

if (app.includes(targetStr)) {
    app = app.replace(targetStr, replacement);
    fs.writeFileSync('src/App.jsx', app, 'utf8');
    console.log('Replaced successfully (LF)');
} else if (app.includes(targetStrCRLF)) {
    app = app.replace(targetStrCRLF, replacement.replace(/\n/g, '\r\n'));
    fs.writeFileSync('src/App.jsx', app, 'utf8');
    console.log('Replaced successfully (CRLF)');
} else {
    console.log('Target string not found in App.jsx');
}
