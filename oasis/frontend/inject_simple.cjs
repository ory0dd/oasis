const fs = require('fs');

let app = fs.readFileSync('src/App.jsx', 'utf8');

const targetStr = '<div id="background-media-engine" className="hidden" />';
const targetStrCRLF = '<div id="background-media-engine" className="hidden" />'.replace(/\n/g, '\r\n');

if (app.includes(targetStr)) {
    const slides = fs.readFileSync('slides_extracted.jsx', 'utf8');
    app = app.replace(targetStr, slides + '\n\n' + targetStr);
    fs.writeFileSync('src/App.jsx', app, 'utf8');
    console.log('Injected slides right before background-media-engine!');
} else {
    console.log('Could not find background-media-engine');
}
