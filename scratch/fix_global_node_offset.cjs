const fs = require('fs');
const file = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /const ty = viewportHeight \/ 2 - py \* fitScale;/g;
if (regex.test(content)) {
    content = content.replace(regex, 'const ty = (viewportHeight * 0.40) - py * fitScale;');
    fs.writeFileSync(file, content, 'utf8');
    console.log("Updated resetMapTransform vertical centering!");
} else {
    console.log("Could not find resetMapTransform centering logic");
}

const regex2 = /const ty = height \/ 2 - py \* fitScale;/g;
if (regex2.test(content)) {
    content = content.replace(regex2, 'const ty = (height * 0.40) - py * fitScale;');
    fs.writeFileSync(file, content, 'utf8');
    console.log("Updated zoomToPattern vertical centering!");
} else {
    console.log("Could not find zoomToPattern centering logic");
}
