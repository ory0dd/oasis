const fs = require('fs');
const file = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const targetStartText = '                                <div className="flex flex-wrap items-center gap-4 pointer-events-auto p-1.5 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md shadow-lg">';
const startIndex = content.indexOf(targetStartText);

if (startIndex === -1) {
    console.error('Target start not found!');
    process.exit(1);
}

// Find where this div block ends
// It ends just before the absolute inset-0 or something else... wait
const endButtonsTag = '                                </div>\n                            </div>';
const endButtonsIndex = content.indexOf(endButtonsTag, startIndex);

if (endButtonsIndex === -1) {
    console.error('End of buttons not found');
    process.exit(1);
}

// Extract the buttons block exactly as is, but without the closing div of the parent container
const buttonsBlock = content.substring(startIndex, endButtonsIndex + 38);

// Remove the buttons block from its original position
let beforeButtons = content.substring(0, startIndex);
let afterButtons = content.substring(endButtonsIndex + 38); // skipping </div></div>

// Close the first parent container that used to hold the title + the buttons
beforeButtons += '                            </div>\n';

let bottomDock = `
                            {/* Bottom Action Dock */}
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[120] pointer-events-none">
${buttonsBlock}
                            </div>
`;
// Replace styling for the dock
bottomDock = bottomDock.replace(
    'flex flex-wrap items-center gap-4 pointer-events-auto p-1.5 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md shadow-lg',
    'flex flex-wrap items-center gap-2 pointer-events-auto p-2 rounded-[1.5rem] bg-zinc-950/80 border border-white/10 backdrop-blur-2xl shadow-2xl'
);

const newContent = beforeButtons + bottomDock + afterButtons;
fs.writeFileSync(file, newContent, 'utf8');
console.log('Dock moved successfully!');
