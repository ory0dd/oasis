const fs = require('fs');

const app = fs.readFileSync('src/App.jsx', 'utf8');

const idIndex = app.indexOf('id="profile-scroll-container"');
const divStart = app.lastIndexOf('<div', idIndex);

let divCount = 0;
let endIndex = -1;

for (let i = divStart; i < app.length; i++) {
    if (app.substring(i, i + 4) === '<div') {
        divCount++;
    } else if (app.substring(i, i + 6) === '</div>') {
        divCount--;
    }
    
    if (divCount === 0 && i > divStart) {
        endIndex = i + 6;
        break;
    }
}

console.log('Container ends at:', endIndex);
console.log('Next 200 chars:\n', app.substring(endIndex, endIndex + 200));

// We inject slides AT THE END of the container, BEFORE the closing </div>
if (endIndex !== -1) {
    const slides = fs.readFileSync('slides_extracted.jsx', 'utf8');
    const newApp = app.substring(0, endIndex - 6) + '\n\n' + slides + '\n\n' + app.substring(endIndex - 6);
    fs.writeFileSync('src/App.jsx', newApp, 'utf8');
    console.log('Injected slides correctly!');
}
