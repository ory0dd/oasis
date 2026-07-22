const fs = require('fs');
const path = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/App.jsx';
let code = fs.readFileSync(path, 'utf8');

// The block to remove is:
// style={{
//     ...(isChatOpen && window.innerWidth >= 768 ? {
//         left: 'calc(10vw + 28vw + 20px)',
//         right: '10vw',
//         width: 'auto'
//     } : {})
// }}

code = code.replace(/style=\{\{\s*\.\.\.\(isChatOpen && window\.innerWidth >= 768 \? \{\s*left: 'calc\(10vw \+ 28vw \+ 20px\)',\s*right: '10vw',\s*width: 'auto'\s*\} : \{\}\)\s*\}\}/, 'style={{}}');

fs.writeFileSync(path, code);
console.log('Removed annoying style block properly');
