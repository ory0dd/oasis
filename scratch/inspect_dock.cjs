const fs = require('fs');
const file = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// Find the Dock
const dockStart = content.indexOf('<div className="fixed bottom-8 left-1/2');
// The dock ends with the "Exportar" button's closing tags.
// Let's find the closing div of the dock. The dock contains:
// - Action Buttons div
// - Right side actions div
// It should be followed by: ")}", since it was inside historical node, but wait!
// The dock was inserted inside `<span ...>{node.label}</span>\n<div className="fixed...`
// and it took over a `</div>` that belonged to the node!
// Let's print out the content around the dock to manually inspect.
console.log(content.substring(dockStart - 200, dockStart + 500));
