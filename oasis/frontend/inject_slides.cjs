const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');

const targetStr = `                {/* Animated Scroll Down Indicator to open Canvas */}
                <div
                    className="flex flex-col items-center gap-1 animate-bounce cursor-pointer pb-2 pointer-events-auto mt-auto shrink-0"
                    onClick={() => {
                        setView('canvas');
                    }}
                >
                    <span className="text-[7px] font-black uppercase tracking-[0.3em] text-zinc-500">Desliza para abrir el pizarrón</span>
                    <ChevronDown size={12} className="text-zinc-500" />
                </div>
            </div>`;

const targetStrCRLF = targetStr.replace(/\n/g, '\r\n');

const slidesCode = fs.readFileSync('slides_extracted.jsx', 'utf8');

const replacement = `                    {/* Animated Scroll Down Indicator */}
                    <div
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
                </div>

${slidesCode}
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
