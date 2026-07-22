const fs = require('fs');
const file = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace('</div>\\n</div>', '</div>\\n</div>'); // Note: replacing literal \n with actual newline requires correct JS strings
// Actually, let's just use split and join.
let lines = content.split('\\n');
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('</div>\\n</div>')) {
        lines[i] = lines[i].replace('</div>\\n</div>', '</div>\\n</div>'); // wait, \\n is just string with backslash n
    }
}
// Let's do it right:
content = content.replace(/<\\/div>\\\\n<\\/div>/g, '</div>\\n</div>');
content = content.replace(/<\\/svg>\\\\n<div/g, '</svg>\\n<div');

// The line is: `                            </div>\\n</div>`
content = content.replace('                            </div>\\\\n</div>', '                            </div>\\n                            </div>');
content = content.replace('                            </div>\\\\n<div', '                            </div>\\n                            <div');

fs.writeFileSync(file, content, 'utf8');
