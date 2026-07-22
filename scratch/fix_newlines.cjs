const fs = require('fs');
const file = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// The literal \\n in JSX is breaking Vite
content = content.replace('</div>\\n</div>', '</div>\\n</div>');
// Wait, the dock insertion was: '\\n' + dockHtml + '\\n'
content = content.replace(/\\\\n/g, '\\n');

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed literal newlines');
