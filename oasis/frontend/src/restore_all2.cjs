const fs = require('fs');
const file = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx';

// Restart from the clean version! (I did git checkout so it's clean)
let content = fs.readFileSync(file, 'utf8');

// --- 1. Reflection Question Carousel ---
// Find '{/* Reflection Question */}'
const t1Start = content.indexOf('{/* Reflection Question */}');
const t1End = content.indexOf('{/* Footer Navigation */}', t1Start);
// Then find the end of the footer navigation
const t1FinalEnd = content.indexOf('                                        </div>\n                                    </div>\n                                );', t1End);

if (t1Start !== -1 && t1FinalEnd !== -1) {
    const replacement1 = fs.readFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/replace_layout2.cjs', 'utf8').split('const replacement = `')[1].split('`;')[0];
    content = content.substring(0, t1Start) + replacement1 + content.substring(t1FinalEnd);
    console.log('Applied Carousel');
} else {
    console.log('Failed Carousel');
}


// --- 2. Node Navigation ---
const t2Start = content.indexOf('{/* Node Label */}');
const t2End = content.indexOf('{/* Content Section: Description OR IA Exploration */}', t2Start);

if (t2Start !== -1 && t2End !== -1) {
    const replacement2 = fs.readFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/replace_layout3.cjs', 'utf8').split('const replacement = `')[1].split('`;')[0];
    content = content.substring(0, t2Start) + replacement2 + content.substring(t2End);
    console.log('Applied Node Navigation');
} else {
    console.log('Failed Node Navigation');
}


// --- 3. Resize & Opacity ---
content = content.replace('disabled:opacity-0 disabled:pointer-events-none">\n                                                    <ChevronLeft', 'disabled:opacity-30 disabled:pointer-events-none">\n                                                    <ChevronLeft');
content = content.replace('w-80 bg-zinc-950/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden', 'w-80 bg-zinc-950/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden resize-y min-h-[400px]');
console.log('Applied Resize');

// --- 4. Zoom Limits ---
content = content.replace('fitScale = Math.min(Math.max(0.15, fitScale), 1.35);', 'fitScale = Math.min(Math.max(0.02, fitScale), 1.35);');
content = content.replace('const newScale = Math.min(Math.max(0.2, prevScale + scaleChange), 4);', 'const newScale = Math.min(Math.max(0.02, prevScale + scaleChange), 4);');
content = content.replace('const newScale = Math.min(Math.max(0.2, prevScale + amount), 4);', 'const newScale = Math.min(Math.max(0.02, prevScale + amount), 4);');
content = content.replace('let fitScale = Math.min(scaleX, scaleY) * 0.75;', 'let fitScale = Math.min(scaleX, scaleY) * 0.45;');
console.log('Applied Zoom');

// --- 5. Dock Movement ---
// Instead of messing with strings, let's just use exact lines.
// We know where it is, it's just the Action Buttons container.
// If I search for `<div className="flex flex-wrap items-center gap-4 pointer-events-auto p-1.5 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md shadow-lg">`
const dockStartStr = '                                <div className="flex flex-wrap items-center gap-4 pointer-events-auto p-1.5 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md shadow-lg">';
let dockStart = content.indexOf(dockStartStr);
if (dockStart !== -1) {
    // The exact string that closes this block in the original file:
    // It's after the export buttons.
    const svgExportEnd = '<line x1="12" y1="15" x2="12" y2="3"/></svg>\n                                                </button>\n                                            </>\n                                        )}';
    let svgIdx = content.indexOf(svgExportEnd, dockStart);
    if (svgIdx !== -1) {
        let div1 = content.indexOf('</div>', svgIdx);
        let div2 = content.indexOf('</div>', div1 + 1);
        let div3 = content.indexOf('</div>', div2 + 1);
        
        let buttonsBlock = content.substring(dockStart, div3 + 6);
        let before = content.substring(0, dockStart);
        let after = content.substring(div3 + 6);
        
        // We close the top header block
        before += '                            </div>\n';
        
        let bottomDock = `
                            {/* Bottom Action Dock */}
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[120] pointer-events-none">
${buttonsBlock}
                            </div>
`;
        bottomDock = bottomDock.replace(dockStartStr.trim(), '<div className="flex flex-wrap items-center gap-2 pointer-events-auto p-2 rounded-[1.5rem] bg-zinc-950/80 border border-white/10 backdrop-blur-2xl shadow-2xl">');
        
        content = before + bottomDock + after;
        console.log('Applied Dock');
    } else {
        console.log('Failed to find SVG Export End');
    }
} else {
    console.log('Failed to find Dock Start');
}

fs.writeFileSync(file, content, 'utf8');
console.log('Done!');
