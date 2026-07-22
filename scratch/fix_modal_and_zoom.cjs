const fs = require('fs');
const file = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Fix targetScale in zoomToNode
const zoomRegex = /const targetScale = 3\.5;/g;
if (zoomRegex.test(content)) {
    content = content.replace(zoomRegex, 'const targetScale = 2.1;');
    console.log("Updated targetScale to 2.1");
}

// 2. Fix Guided Tour Modal position
const modalRegex = /className="w-full animate-in slide-in-from-bottom-4 duration-300 mt-3"/g;
if (modalRegex.test(content)) {
    content = content.replace(modalRegex, 'className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-[95%] max-w-sm sm:max-w-md z-[150] pointer-events-auto animate-in slide-in-from-bottom-4 duration-300"');
    console.log("Fixed Guided Tour modal position");
}

fs.writeFileSync(file, content, 'utf8');
