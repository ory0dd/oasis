const fs = require('fs');
const path = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/App.jsx';
let code = fs.readFileSync(path, 'utf8');

// Modify ResonanceNotebook render
code = code.replace(
    /<ResonanceNotebook([^>]*?onFocusNode=\{onFocusNode\}[^>]*?)\/>/g,
    '<ResonanceNotebook$1\n                    className={isSplitViewEnabled ? "fixed inset-y-0 left-0 w-[50vw] mt-[100px] border-r border-white/10 rounded-tr-[2.5rem] bg-[#050506]/95 backdrop-blur-md shadow-2xl z-[1500] pointer-events-auto" : undefined}\n                    isSplitView={isSplitViewEnabled}\n                    onToggleSplitView={() => setIsSplitViewEnabled(!isSplitViewEnabled)}\n                />'
);

// Modify OasisChat render
code = code.replace(
    /<OasisChat([^>]*?setAccent=\{setAccent\}[^>]*?)\/>/g,
    '<OasisChat$1\n                    className={isSplitViewEnabled ? "fixed inset-y-0 left-0 w-[50vw] mt-[100px] border-r border-white/10 rounded-tr-[2.5rem] bg-[#050506]/95 backdrop-blur-md shadow-2xl z-[1500] pointer-events-auto" : undefined}\n                    isSplitView={isSplitViewEnabled}\n                    onToggleSplitView={() => setIsSplitViewEnabled(!isSplitViewEnabled)}\n                />'
);

// We should also replace isSimpleNotesOpen display logic in App.jsx to ensure it doesn't just show Chat if both are open but only Chat was expected to show. Wait, they are rendered sequentially.
// In App.jsx, the condition for OasisChat is `{!isUnifiedCreatorOpen && isChatOpen && (`
// For ResonanceNotebook: `{!isUnifiedCreatorOpen && activeNotebook === 'resonance' && (`
code = code.replace(
    /\{\!isUnifiedCreatorOpen && isChatOpen && \(\r?\n\s*<OasisChat/,
    '{!isUnifiedCreatorOpen && (isChatOpen || (isSplitViewEnabled && isSimpleNotesOpen)) && (\n                <OasisChat'
);
// wait, if isSplitViewEnabled is true and isSimpleNotesOpen is true, then Chat is also shown? 
// No, if isSplitViewEnabled is true, both Chat and Notes should be open, but we need Chat or Resonance to be the left side.

fs.writeFileSync(path, code);
console.log('App.jsx updated again');
