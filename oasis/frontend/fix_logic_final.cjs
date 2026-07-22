const fs = require('fs');

let app = fs.readFileSync('src/App.jsx', 'utf8');

// 2. Set isBitacoraOpen to false by default
app = app.replace('const [isBitacoraOpen, setIsBitacoraOpen] = useState(true);', 'const [isBitacoraOpen, setIsBitacoraOpen] = useState(false);');

// 3. Fix handleWheelOrSwipe
const targetGestures = `            // Scroll down (pushing content up) -> open bitacora
            if (deltaY > 50) {
                if (!isScrollingRef.current) {
                    isScrollingRef.current = true;
                    setIsBitacoraOpen(true);
                    setTimeout(() => isScrollingRef.current = false, 800);
                }
            } else if (deltaY < -50) {
                // Pull down (scrolling up) -> open canvas
                if (!isScrollingRef.current) {
                    isScrollingRef.current = true;
                    setView('canvas');
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
    console.log('Fixed gestures (LF)');
} else {
    app = app.replace(targetGestures.replace(/\n/g, '\r\n'), replacementGestures.replace(/\n/g, '\r\n'));
    console.log('Fixed gestures (CRLF or fallback)');
}

// 4. Inject ChevronUp
if (!app.includes('ChevronUp')) {
    app = app.replace("} from 'lucide-react';", ", ChevronUp } from 'lucide-react';");
    console.log('Injected ChevronUp');
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
    console.log('Added Pull indicator');
} else {
    app = app.replace(heroTitleTarget.replace(/\n/g, '\r\n'), heroTitleReplacement.replace(/\n/g, '\r\n'));
}

fs.writeFileSync('src/App.jsx', app, 'utf8');
