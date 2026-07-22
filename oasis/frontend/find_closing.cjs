const fs = require('fs');

let app = fs.readFileSync('src/App.jsx', 'utf8');

const startIndex = app.indexOf('id="profile-scroll-container"');
if (startIndex !== -1) {
    let braceCount = 0;
    let foundStart = false;
    let endIndex = -1;
    
    for (let i = startIndex; i < app.length; i++) {
        if (app[i] === '<' && app.substring(i, i + 4) === '<div') {
            braceCount++;
            foundStart = true;
        } else if (app[i] === '<' && app.substring(i, i + 5) === '</div') {
            braceCount--;
        }
        
        if (foundStart && braceCount === 0) {
            endIndex = i + 5; // include '</div>'
            break;
        }
    }
    
    if (endIndex !== -1) {
        console.log('End index of profile-scroll-container:', endIndex);
        console.log('Last 100 chars of container:\n', app.substring(endIndex - 100, endIndex + 1));
        console.log('\nNext 200 chars after container:\n', app.substring(endIndex + 1, endIndex + 201));
        
        // Write the AST injection script
        let newApp = app.substring(0, endIndex + 1) + '\n\n' + fs.readFileSync('slides_extracted.jsx', 'utf8') + '\n\n' + app.substring(endIndex + 1);
        fs.writeFileSync('src/App.jsx', newApp, 'utf8');
        console.log('Injected successfully!');
    }
}
