const fs = require('fs');

let app = fs.readFileSync('src/App.jsx', 'utf8');
const slides = fs.readFileSync('slides_extracted.jsx', 'utf8');

// The weird unicode char is \ufffd or we can just use a regex
const regex = /            <\/div>\r?\n\r?\n            \{\/\* BIT.CORA HUB FILTERS/g;
const matches = [...app.matchAll(regex)];

if (matches.length > 0) {
    const match = matches[0];
    const newApp = app.substring(0, match.index) + '\n\n' + slides + '\n\n' + match[0] + app.substring(match.index + match[0].length);
    fs.writeFileSync('src/App.jsx', newApp, 'utf8');
    console.log('Injected slides at the correct spot!');
} else {
    console.log('Could not find the target using regex.');
}
