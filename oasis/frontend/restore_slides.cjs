const fs = require('fs');

let app = fs.readFileSync('src/App.jsx', 'utf8');
const slides = fs.readFileSync('slides_extracted.jsx', 'utf8');

// The slides should be inserted right after the "HERO MAIN CARD" wrapper div closes.
// In HEAD, the HERO MAIN CARD is inside a profile-slide div.
// Let's find the end of the HERO MAIN CARD profile-slide:
const targetStr = `                    <div
                        className="flex flex-col items-center gap-1 animate-bounce cursor-pointer pb-2 pointer-events-auto mt-auto shrink-0"
                        onClick={() => {
                            const scrollContainer = document.getElementById('profile-scroll-container');
                            if (scrollContainer) {
                                scrollContainer.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
                            }
                        }}
                    >
                        <span className="text-[7px] font-black uppercase tracking-[0.3em] text-zinc-500">Desliza para ver publicaciones</span>
                        <ChevronDown size={12} className="text-zinc-500" />
                    </div>
                </div>`;
const targetStrCRLF = targetStr.replace(/\n/g, '\r\n');

if (app.includes(targetStr)) {
    app = app.replace(targetStr, targetStr + '\n\n' + slides);
    fs.writeFileSync('src/App.jsx', app, 'utf8');
    console.log('Injected slides (LF)!');
} else if (app.includes(targetStrCRLF)) {
    app = app.replace(targetStrCRLF, targetStrCRLF + '\r\n\r\n' + slides.replace(/\n/g, '\r\n'));
    fs.writeFileSync('src/App.jsx', app, 'utf8');
    console.log('Injected slides (CRLF)!');
} else {
    // Maybe the scroll indicator doesn't exist? Let's check for just `</div>` after the HERO MAIN CARD...
    console.log('Could not find target string to inject slides.');
}
