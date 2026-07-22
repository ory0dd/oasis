const fs = require('fs');
const file = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Map Zoom Scale
content = content.replace(/const targetScale = 1\.25;/g, 'const targetScale = 0.85;');
console.log("Changed zoom from 1.25 to 0.85");

// 2. Bottom Padding for Bucles List
const buclesRegex = /className="max-w-4xl mx-auto flex flex-col gap-8 pb-20"/;
if (buclesRegex.test(content)) {
    content = content.replace(buclesRegex, 'className="max-w-4xl mx-auto flex flex-col gap-8 pb-36"');
    console.log("Added bottom padding to bucles");
}

// 3. Bottom Padding for Avances
const avancesRegex = /className="flex-1 w-full max-w-4xl mx-auto flex flex-col gap-4"/;
if (avancesRegex.test(content)) {
    content = content.replace(avancesRegex, 'className="flex-1 w-full max-w-4xl mx-auto flex flex-col gap-4 pb-36"');
    console.log("Added bottom padding to avances");
}

// 4. Bottom Padding for Loop
const loopRegex = /className="p-6 md:p-8 bg-indigo-500\/5 border border-indigo-500\/10 rounded-2xl w-full max-w-4xl mx-auto shadow-inner mb-8"/;
if (loopRegex.test(content)) {
    content = content.replace(loopRegex, 'className="p-6 md:p-8 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl w-full max-w-4xl mx-auto shadow-inner mb-32"');
    console.log("Added bottom padding to loop");
}

// 5. Bottom Padding for Exit Keys
const exitRegex = /className="p-6 md:p-8 bg-emerald-500\/5 border border-emerald-500\/10 rounded-2xl w-full max-w-4xl mx-auto shadow-inner mb-8"/;
if (exitRegex.test(content)) {
    content = content.replace(exitRegex, 'className="p-6 md:p-8 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl w-full max-w-4xl mx-auto shadow-inner mb-32"');
    console.log("Added bottom padding to exit_keys");
}

fs.writeFileSync(file, content, 'utf8');
