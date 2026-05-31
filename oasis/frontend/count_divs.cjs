const fs = require('fs');
const app = fs.readFileSync('src/App.jsx', 'utf8');
const lines = app.split('\n');
let openCount = 0;
let closeCount = 0;
let start = lines.findIndex(l => l.includes('<div className=\"w-full h-screen relative overflow-hidden bg-[#0a0a0b]/85 backdrop-blur-xl\">'));

for(let i=start; i<=3010; i++){
    openCount += (lines[i].match(/<div/g) || []).length;
    closeCount += (lines[i].match(/<\/div>/g) || []).length;
}
console.log('Open:', openCount, 'Close:', closeCount);
