const fs = require('fs');
const cp = require('child_process');

// 1. Reset App.jsx to HEAD
cp.execSync('git checkout src/App.jsx');
let app = fs.readFileSync('src/App.jsx', 'utf8');

// 2. Set isBitacoraOpen to false by default
app = app.replace('const [isBitacoraOpen, setIsBitacoraOpen] = useState(true);', 'const [isBitacoraOpen, setIsBitacoraOpen] = useState(false);');

// 3. Fix handleWheelOrSwipe (Only Canvas pull-down allowed, so native scroll can work)
const targetGestures = `            // Scroll down -> open canvas
            if (deltaY > 50) {
                if (!isScrollingRef.current) {
                    isScrollingRef.current = true;
                    setView('canvas');
                    setTimeout(() => isScrollingRef.current = false, 800);
                }
            } else if (deltaY < -50) {
                // Scroll up / Swipe down -> open bitacora
                if (!isScrollingRef.current) {
                    isScrollingRef.current = true;
                    setIsBitacoraOpen(true);
                    setTimeout(() => isScrollingRef.current = false, 800);
                }
            }`;
            
const replacementGestures = `            // Pull down (scrolling up) -> open canvas
            // We only trigger if deltaY < -50 (swiping down) AND scroll position is at top
            const scrollContainer = document.getElementById('profile-scroll-container');
            if (deltaY < -50 && scrollContainer && scrollContainer.scrollTop <= 0) {
                if (!isScrollingRef.current) {
                    isScrollingRef.current = true;
                    setView('canvas');
                    setTimeout(() => isScrollingRef.current = false, 800);
                }
            }`;
            
if (app.includes(targetGestures)) {
    app = app.replace(targetGestures, replacementGestures);
} else {
    app = app.replace(targetGestures.replace(/\n/g, '\r\n'), replacementGestures.replace(/\n/g, '\r\n'));
}

// 4. Inject ChevronUp
if (!app.includes('ChevronUp')) {
    app = app.replace('} from \'lucide-react\';', ', ChevronUp } from \'lucide-react\';');
}

// 5. Add "Desliza para Pizarrón" indicator
const heroTitleTarget = `<h2 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white leading-none tracking-tighter" style={{ textShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>`;
const heroTitleReplacement = `
                            {/* PULL DOWN INDICATOR */}
                            <div className="absolute -top-12 sm:-top-16 left-0 right-0 flex flex-col items-center justify-center opacity-40 animate-pulse pointer-events-none">
                                <ChevronUp size={24} className="text-white" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-white mt-1">Desliza para Pizarrón</span>
                            </div>

                            <h2 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white leading-none tracking-tighter" style={{ textShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>`;
                            
if (app.includes(heroTitleTarget)) {
    app = app.replace(heroTitleTarget, heroTitleReplacement);
} else {
    app = app.replace(heroTitleTarget.replace(/\n/g, '\r\n'), heroTitleReplacement.replace(/\n/g, '\r\n'));
}

// 6. Inject the slides AT THE VERY END OF THE profile-scroll-container.
// We must find the EXACT `</div>` that closes `id="profile-scroll-container"`.
// In HEAD, `profile-scroll-container` contains the `profile-slide`, and then it closes.
const slides = fs.readFileSync('slides_extracted.jsx', 'utf8');

// The `ProfileView` return structure:
// <div id="profile-scroll-container" ...>
//    <div className="absolute top-0 left-0 w-full h-[100vh] ...> ... </div>
//    <div data-index={0} className="profile-slide ...> ... </div>
// </div>
// {createPortal(...)}

// The end of `data-index={0}` `profile-slide` is right before the end of `profile-scroll-container`.
// Let's find: `                          {/* BITÁCORA HUB FILTERS & UTILITIES (NOW A FLOATING MODAL CARD) */}`
// Just BEFORE this is the `</div>` that closes `profile-scroll-container`.
const markerLF = '            </div>\n\n            {/* BITÁCORA HUB FILTERS';
const markerCRLF = '            </div>\r\n\r\n            {/* BITÁCORA HUB FILTERS';

if (app.includes(markerLF)) {
    app = app.replace(markerLF, '\n' + slides + '\n            </div>\n\n            {/* BITÁCORA HUB FILTERS');
    console.log('Injected slides correctly! (LF)');
} else if (app.includes(markerCRLF)) {
    app = app.replace(markerCRLF, '\r\n' + slides.replace(/\n/g, '\r\n') + '\r\n            </div>\r\n\r\n            {/* BITÁCORA HUB FILTERS');
    console.log('Injected slides correctly! (CRLF)');
} else {
    // Unicode issue with BITÁCORA maybe?
    // Let's use regex!
    const regex = /            <\/div>\r?\n\r?\n            \{\/\* BIT.CORA HUB FILTERS/;
    const match = app.match(regex);
    if (match) {
        app = app.replace(regex, '\n' + slides + '\n' + match[0]);
        console.log('Injected slides correctly! (Regex)');
    } else {
        console.log('FAILED to find injection marker for slides!');
    }
}

fs.writeFileSync('src/App.jsx', app, 'utf8');
console.log('Rebuild complete!');
