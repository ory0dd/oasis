const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'App.jsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Remove view === 'profile' from the Global Backdrop
const badBackdropCondition = `{(isComposerOpen || isSimpleNotesOpen || activeNotebook || isChatOpen || activeTest || isBitacoraOpen || view === 'profile') && (`;
const goodBackdropCondition = `{(isComposerOpen || isSimpleNotesOpen || activeNotebook || isChatOpen || activeTest || isBitacoraOpen) && (`;

if (content.includes(badBackdropCondition)) {
    content = content.replace(badBackdropCondition, goodBackdropCondition);
    console.log("Reverted Global Backdrop");
}

// 2. Add local backdrop for ProfileView
const profileRegex = /\(view === 'feed' \? renderFeedView\(\) :\s*<ProfileView/g;
if (content.match(profileRegex)) {
    const replacement = `(view === 'feed' ? renderFeedView() :
                                <>
                                    <div className="fixed inset-0 z-[1399] bg-[#050506]/60 backdrop-blur-md transition-all duration-700 animate-in fade-in cursor-default pointer-events-auto" />
                                    <ProfileView`;
    content = content.replace(profileRegex, replacement);
    
    // We also need to close the fragment after ProfileView.
    // Let's find where ProfileView ends.
    // It's probably `openNewComposer={openNewComposer}\n                                />\n                            )}`
    // Let's replace `/>\n                            )}` with `/>\n                                </>\n                            )}`
    // It's safer to just regex replace the specific ending of ProfileView.
    const profileEndRegex = /openNewComposer=\{openNewComposer\}\s*\/>\s*\)\}/g;
    if (content.match(profileEndRegex)) {
        content = content.replace(profileEndRegex, `openNewComposer={openNewComposer}\n                                />\n                                </>\n                            )}`);
        console.log("Injected ProfileView local backdrop");
    } else {
        console.log("Could not find ProfileView end");
    }
} else {
    console.log("Could not find ProfileView start");
}

fs.writeFileSync(filePath, content);
