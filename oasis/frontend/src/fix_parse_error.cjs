const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'App.jsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Fix the SimpleNotesView mess up
const badSimpleNotes = `                    openNewComposer={openNewComposer}
                                />
                                </>
                            )}`;

const goodSimpleNotes = `                    openNewComposer={openNewComposer}
                />
            )}`;

if (content.includes(badSimpleNotes)) {
    content = content.replace(badSimpleNotes, goodSimpleNotes);
    console.log("Fixed SimpleNotesView");
} else {
    // Try regex
    content = content.replace(/openNewComposer=\{openNewComposer\}\s*\/>\s*<\/>\s*\)\}/, `openNewComposer={openNewComposer}\n                />\n            )}`);
    console.log("Fixed SimpleNotesView via regex");
}

// 2. Properly close the fragment for ProfileView
// ProfileView is around line 10187. Let's find `<ProfileView` and the NEXT `/>` that is followed by `)}`
// Actually, I can just find `onOpenSimpleNotes={onOpenSimpleNotes}\n                                    openNewComposer={openNewComposer}\n                                />`
const profileEndStr = `onOpenSimpleNotes={onOpenSimpleNotes}
                                    openNewComposer={openNewComposer}
                                />
                            )}`;

const fixedProfileEndStr = `onOpenSimpleNotes={onOpenSimpleNotes}
                                    openNewComposer={openNewComposer}
                                />
                                </>
                            )}`;

if (content.includes(profileEndStr)) {
    content = content.replace(profileEndStr, fixedProfileEndStr);
    console.log("Closed ProfileView fragment");
} else {
    // try regex
    content = content.replace(/onOpenSimpleNotes=\{onOpenSimpleNotes\}\s*openNewComposer=\{openNewComposer\}\s*\/>\s*\)\}/, `onOpenSimpleNotes={onOpenSimpleNotes}\n                                    openNewComposer={openNewComposer}\n                                />\n                                </>\n                            )}`);
    console.log("Closed ProfileView fragment via regex");
}

fs.writeFileSync(filePath, content);
