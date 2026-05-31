const fs = require('fs');
const app = fs.readFileSync('src/App.jsx', 'utf8');
const lines = app.split('\n');
let start = lines.findIndex(l => l.includes('<div className=\"w-full h-screen relative overflow-hidden bg-[#0a0a0b]/85 backdrop-blur-xl\">'));

let text = lines.slice(start, 3012).join('\n');
let d = 0;
for(let i=0; i<text.length; i++){
    if(text[i]==='{') d++;
    else if(text[i]==='}') d--;
}
console.log('Braces balance:', d);
