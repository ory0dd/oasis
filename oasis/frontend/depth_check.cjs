const fs = require('fs');
const app = fs.readFileSync('src/App.jsx', 'utf8');
const lines = app.split('\n');
let start = lines.findIndex(l => l.includes('<div className=\"w-full h-screen relative overflow-hidden bg-[#0a0a0b]/85 backdrop-blur-xl\">'));

let depth = 0;
for(let i=start; i<=3010; i++){
    let line = lines[i];
    line = line.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '');
    let openMatch = line.match(/<div/g);
    let closeMatch = line.match(/<\/div>/g);
    
    if (openMatch) depth += openMatch.length;
    if (closeMatch) depth -= closeMatch.length;
    
    if(depth <= 0 && i > start) {
        console.log('Depth hit 0 at line:', i + 1, 'Content:', lines[i].trim());
    }
}
console.log('Final depth:', depth);
