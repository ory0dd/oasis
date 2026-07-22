const fs = require('fs');
const file = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const badStart = content.indexOf('className="p-2 rounded-lg bg-emerald-600/90');
if (badStart !== -1) {
    // We want to delete from the </div> right before this, up to the end of the fragments.
    // Let's find the closing tag of historical node just before badStart
    const historicalEnd = content.lastIndexOf('</span', badStart) + 7;
    // We want to keep everything up to `{node.label}</span>\n                                                    </div>\n                                                )}`
    
    // The fragments end at `{(node.type === 'biological'`
    const fragmentsEnd = content.indexOf('{(node.type === \'biological\'', badStart);
    
    if (historicalEnd !== -1 && fragmentsEnd !== -1) {
        const replacement = `>{node.label}</span>
                                                    </div>
                                                )}
                                                `;
        
        content = content.substring(0, historicalEnd) + replacement + content.substring(fragmentsEnd);
        fs.writeFileSync(file, content, 'utf8');
        console.log('Fragments deleted!');
    } else {
        console.log('Could not find bounds');
    }
}
