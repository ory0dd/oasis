const fs = require('fs');
const file = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /<div\s+className="absolute bottom-24 left-1\/2 transform -translate-x-1\/2 w-\[95%\] max-w-sm sm:max-w-md z-\[150\] pointer-events-auto animate-in slide-in-from-bottom-4 duration-300"/;

const replacementStr = `<div
                                        className={\`absolute bottom-24 left-1/2 z-[150] pointer-events-auto transition-transform duration-75 ease-out \${!isDraggingTour ? 'animate-in slide-in-from-bottom-4' : ''}\`}
                                        style={{ transform: \`translate(calc(-50% + \${tourModalPos.x}px), \${tourModalPos.y}px)\`, width: '320px' }}`;

if (regex.test(content)) {
    content = content.replace(regex, replacementStr);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Replaced successfully!');
} else {
    console.log('Target string not found for wrapper replacement.');
}
