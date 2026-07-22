const fs = require('fs');
const file = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// I am replacing literal \n with real newline characters
content = content.replace('</div>\\n</div>', '</div>\n                            </div>');
content = content.replace('</svg>\\n<div', '</svg>\n<div');

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed literally literal newlines');
