const fs = require('fs');
const file = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const regex1 = /<div className="absolute top-\[20px\] left-6 right-6 z-\[120\] flex flex-row items-center justify-between gap-2 pointer-events-none">[\s\S]*?<div className="flex items-center gap-2">([\s\S]*?)<\/div>\s*<div className="flex flex-wrap items-center gap-4 pointer-events-auto p-1\.5 rounded-xl bg-black\/40 border border-white\/10 backdrop-blur-md shadow-lg">/;

const replace1 = `<div className="absolute top-6 left-6 z-[120] flex items-center gap-2 pointer-events-none">$1</div>
                                <div className="absolute bottom-6 left-6 z-[120] flex flex-wrap items-center gap-4 pointer-events-auto p-1.5 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md shadow-lg">`;

if (regex1.test(content)) {
    content = content.replace(regex1, replace1);
    
    // Now remove the extra </div>
    const regex2 = /<X size=\{16\} \/>\s*<\/button>\s*<\/div>\s*<\/div>\s*<\/div>\s*{\/\* Floating Map Controls \*\//;
    const replace2 = `<X size={16} />\n                                        </button>\n                                    </div>\n                                </div>\n\n                            {/* Floating Map Controls */}`;
    content = content.replace(regex2, replace2);
    
    fs.writeFileSync(file, content, 'utf8');
    console.log("Moved action buttons via regex!");
} else {
    console.log("Regex not matched!");
}
