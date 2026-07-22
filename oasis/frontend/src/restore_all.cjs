const fs = require('fs');
const file = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx';

// Restart from the clean version! (I did git checkout so it's clean)
let content = fs.readFileSync(file, 'utf8');

// 1. replace_layout2.cjs equivalent (from the original `{/* Reflection Question */}`)
const targetStart1 = '{/* Reflection Question */}';
const targetEnd1 = '                                            {/* Footer Navigation */}';
let s1 = content.indexOf(targetStart1);
let e1 = content.indexOf(targetEnd1);
const footerEndTag1 = '                                        </div>\n                                    </div>\n                                );';
let finalE1 = content.indexOf(footerEndTag1, e1);
if(s1 !== -1 && finalE1 !== -1) {
    const replacement1 = fs.readFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/replace_layout2.cjs', 'utf8').split('const replacement = `')[1].split('`;')[0];
    content = content.substring(0, s1) + replacement1 + content.substring(finalE1);
    console.log('Applied 1');
} else {
    console.log('Failed 1');
}

// 2. replace_layout3.cjs equivalent
const targetStart2 = '                                            {/* Node Label */}';
const targetEnd2 = '                                            {/* Content Section: Description OR IA Exploration */}';
let s2 = content.indexOf(targetStart2);
let e2 = content.indexOf(targetEnd2);
if(s2 !== -1 && e2 !== -1) {
    const replacement2 = fs.readFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/replace_layout3.cjs', 'utf8').split('const replacement = `')[1].split('`;')[0];
    content = content.substring(0, s2) + replacement2 + content.substring(e2);
    console.log('Applied 2');
} else {
    console.log('Failed 2');
}

// 3. replace_layout4.cjs equivalent
content = content.replace('disabled:opacity-0 disabled:pointer-events-none">\n                                                    <ChevronLeft', 'disabled:opacity-30 disabled:pointer-events-none">\n                                                    <ChevronLeft');
content = content.replace('w-80 bg-zinc-950/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden', 'w-80 bg-zinc-950/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden resize-y min-h-[400px]');
console.log('Applied 3');

// 4. Zoom limits
content = content.replace('fitScale = Math.min(Math.max(0.15, fitScale), 1.35);', 'fitScale = Math.min(Math.max(0.02, fitScale), 1.35);');
content = content.replace('const newScale = Math.min(Math.max(0.2, prevScale + scaleChange), 4);', 'const newScale = Math.min(Math.max(0.02, prevScale + scaleChange), 4);');
content = content.replace('const newScale = Math.min(Math.max(0.2, prevScale + amount), 4);', 'const newScale = Math.min(Math.max(0.02, prevScale + amount), 4);');
content = content.replace('let fitScale = Math.min(scaleX, scaleY) * 0.75;', 'let fitScale = Math.min(scaleX, scaleY) * 0.45;');
console.log('Applied Zoom');

// 5. Move Action Dock
const targetStart5 = '                                <div className="flex flex-wrap items-center gap-4 pointer-events-auto p-1.5 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md shadow-lg">';
let s5 = content.indexOf(targetStart5);
if(s5 !== -1) {
    // Look for the end of this div block by finding the first </div> that matches its level.
    // The safest way is to search for the specific SVG code that ends the block.
    const endBlockStr = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>\n                                                </button>\n                                            </>\n                                        )}';
    let endBlockIndex = content.indexOf(endBlockStr, s5);
    if(endBlockIndex !== -1) {
        let buttonsEnd = content.indexOf('</div>', endBlockIndex);
        buttonsEnd = content.indexOf('</div>', buttonsEnd + 1); // This closes the Action Buttons container
        buttonsEnd = content.indexOf('</div>', buttonsEnd + 1); // This closes the main wrapper

        const buttonsBlock = content.substring(s5, buttonsEnd + 6);
        let beforeButtons = content.substring(0, s5);
        let afterButtons = content.substring(buttonsEnd + 6);

        let bottomDock = `
                            {/* Bottom Action Dock */}
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[120] pointer-events-none">
${buttonsBlock}
                            </div>
`;
        bottomDock = bottomDock.replace('flex flex-wrap items-center gap-4 pointer-events-auto p-1.5 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md shadow-lg', 'flex flex-wrap items-center gap-2 pointer-events-auto p-2 rounded-[1.5rem] bg-zinc-950/80 border border-white/10 backdrop-blur-2xl shadow-2xl');

        // Note: we don't need to add a closing div to beforeButtons if we grabbed exactly the buttons container.
        // Wait, the title is inside the same parent container: <div className="absolute top-[20px] left-6 right-6 z-[120] flex flex-col md:flex-row items-start md:items-center justify-start gap-3 pointer-events-none">
        // Which ends right after the buttons container!
        // We need to keep the closing div for the top container.
        beforeButtons += '                            </div>\n';

        content = beforeButtons + bottomDock + afterButtons;
        console.log('Applied Dock');
    } else {
        console.log('Failed Dock End Block Index');
    }
} else {
    console.log('Failed Dock start index');
}

fs.writeFileSync(file, content, 'utf8');
console.log('All changes applied cleanly!');
