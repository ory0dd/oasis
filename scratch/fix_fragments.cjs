const fs = require('fs');
const file = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// I need to replace from line 4476 to 4532, which contains the leftover dock fragments.
// Let's just use string replacement on a very specific chunk.
const badStart = `                                                )}
                                            className="p-2 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white transition-all flex items-center justify-center active:scale-95 shadow-lg shadow-emerald-950/20"`;

const badEnd = `                            </div>
                                                )}
                                                {(node.type === 'biological' || node.type === 'social') && (`;

const startIndex = content.indexOf(badStart);
const endIndex = content.indexOf(badEnd) + badEnd.length;

if (startIndex !== -1 && endIndex !== -1) {
    const replacement = `                                                )}
                                                {(node.type === 'biological' || node.type === 'social') && (`;
    
    content = content.substring(0, startIndex) + replacement + content.substring(endIndex);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed fragments!');
} else {
    console.log('Could not find boundaries.');
}
