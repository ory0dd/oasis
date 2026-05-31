const fs = require('fs');

let app = fs.readFileSync('src/App.jsx', 'utf8');

// 2. Set isBitacoraOpen to false by default
app = app.replace('const [isBitacoraOpen, setIsBitacoraOpen] = useState(true);', 'const [isBitacoraOpen, setIsBitacoraOpen] = useState(false);');

// 3. Fix handleWheelOrSwipe
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
    app = app.replace("} from 'lucide-react';", ", ChevronUp } from 'lucide-react';");
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

// 6. Inject the slides
const slides = fs.readFileSync('slides_extracted.jsx', 'utf8');
const regex = /            <\/div>\r?\n\r?\n            \{\/\* BIT.CORA HUB FILTERS/g;
const matches = [...app.matchAll(regex)];

if (matches.length > 0) {
    const match = matches[0];
    app = app.substring(0, match.index) + '\n\n' + slides + '\n\n' + match[0] + app.substring(match.index + match[0].length);
    console.log('Injected slides at the correct spot!');
} else {
    console.log('FAILED to find injection marker for slides!');
}

fs.writeFileSync('src/App.jsx', app, 'utf8');
console.log('Rebuild complete!');
