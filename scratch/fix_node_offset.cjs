const fs = require('fs');
const file = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /const ty = height \/ 2 - py \* targetScale;/;
if (regex.test(content)) {
    content = content.replace(regex, 'const ty = (height * 0.35) - py * targetScale;');
    fs.writeFileSync(file, content, 'utf8');
    console.log("Updated zoomToNode vertical centering!");
} else {
    console.log("Could not find zoomToNode centering logic");
}
