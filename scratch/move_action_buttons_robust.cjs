const fs = require('fs');
const file = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const regex1 = /<div className="absolute top-\[20px\] left-6 right-6 z-\[120\] flex flex-row items-center justify-between gap-2 pointer-events-none">[\s\S]*?<div className="flex items-center gap-2">([\s\S]*?)<\/div>\s*<div className="flex flex-wrap items-center gap-4 pointer-events-auto p-1\.5 rounded-xl bg-black\/40 border border-white\/10 backdrop-blur-md shadow-lg">/;

const replace1 = `<div className="absolute top-6 left-6 z-[120] flex items-center gap-2 pointer-events-none">$1</div>
                                <div className="absolute bottom-6 left-6 z-[120] flex flex-col items-center gap-2 pointer-events-auto p-1.5 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md shadow-lg">`;

if (regex1.test(content)) {
    content = content.replace(regex1, replace1);
    
    // The closing divs. We need to remove one.
    // Let's use a more flexible regex that finds the end of the action buttons block.
    // Look for the end of the Export button, followed by </button>, </>, )}, </div>, </div>, </div>, then {/* Segmented Control Tabs (Bottom NavBar) */} or {/* Floating Map Controls */}
    const regex2 = /<X size=\{16\} \/>\s*<\/button>\s*<\/div>\s*<\/div>\s*<\/div>\s*{\/\* Floating Map Controls \*\//;
    const replace2 = `<X size={16} />\n                                        </button>\n                                    </div>\n                                </div>\n\n                            {/* Floating Map Controls */}`;
    
    const regex3 = /<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"\/><polyline points="7 10 12 15 17 10"\/><line x1="12" y1="15" x2="12" y2="3"\/><\/svg>\s*<\/button>\s*<\/>\s*\)}\s*<\/div>\s*<\/div>\s*<\/div>\s*{\/\* Segmented Control Tabs/;
    const replace3 = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                            
                            {/* Segmented Control Tabs`;
    
    if (regex2.test(content)) {
        content = content.replace(regex2, replace2);
        console.log("Matched regex2 (X button end)");
    } else if (regex3.test(content)) {
        content = content.replace(regex3, replace3);
        console.log("Matched regex3 (Export button end)");
    } else {
        console.log("Could not find the end of the action buttons block to remove the extra div.");
    }

    fs.writeFileSync(file, content, 'utf8');
    console.log("Action buttons moved to bottom-left successfully");
} else {
    console.log("Regex1 did not match");
}
