const fs = require('fs');

let app = fs.readFileSync('src/App.jsx', 'utf8');
const slides = fs.readFileSync('slides_extracted.jsx', 'utf8');

const markerIndex = app.indexOf('{/* BIT');
if (markerIndex !== -1) {
    const startOfLine = app.lastIndexOf('\n', markerIndex);
    const divEndIndex = app.lastIndexOf('</div>', startOfLine);
    
    if (divEndIndex !== -1) {
        // we insert the slides exactly after divEndIndex + 6
        app = app.substring(0, divEndIndex + 6) + '\n\n' + slides + '\n\n' + app.substring(divEndIndex + 6);
        fs.writeFileSync('src/App.jsx', app, 'utf8');
        console.log('Injected slides correctly!');
    } else {
        console.log('Could not find divEndIndex');
    }
} else {
    console.log('Could not find {/* BIT');
}
