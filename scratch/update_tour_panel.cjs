const fs = require('fs');
const file = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// Replace the Guided Tour panel container
const oldClass = 'className="w-full animate-in slide-in-from-bottom-4 duration-300 mt-3"';
const newClass = 'className="absolute bottom-24 left-1/2 -translate-x-1/2 w-[700px] max-w-[calc(100vw-3rem)] z-[200] animate-in slide-in-from-bottom-8 duration-300"';

if (content.includes(oldClass)) {
    content = content.replace(oldClass, newClass);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed Tour Panel size!');
} else {
    console.log('Could not find Tour Panel class.');
}
