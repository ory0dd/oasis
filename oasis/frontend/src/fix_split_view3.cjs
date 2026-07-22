const fs = require('fs');
const path = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/App.jsx';
let code = fs.readFileSync(path, 'utf8');

const resonanceReplacement = `                <ResonanceNotebook
                    className={isSplitViewEnabled ? "fixed inset-y-0 left-0 w-[50vw] mt-[100px] border-r border-white/10 rounded-tr-[2.5rem] bg-[#050506]/95 backdrop-blur-md shadow-2xl z-[1500] pointer-events-auto" : undefined}
                    isSplitView={isSplitViewEnabled}
                    onToggleSplitView={() => setIsSplitViewEnabled(!isSplitViewEnabled)}
                    activeCanvasId={activeCanvasId}`;

code = code.replace(
    '                <ResonanceNotebook\r\n                    activeCanvasId={activeCanvasId}',
    resonanceReplacement
);
code = code.replace(
    '                <ResonanceNotebook\n                    activeCanvasId={activeCanvasId}',
    resonanceReplacement
);


const chatReplacement = `                <OasisChat
                    className={isSplitViewEnabled ? "fixed inset-y-0 left-0 w-[50vw] mt-[100px] border-r border-white/10 rounded-tr-[2.5rem] bg-[#050506]/95 backdrop-blur-md shadow-2xl z-[1500] pointer-events-auto" : undefined}
                    isSplitView={isSplitViewEnabled}
                    onToggleSplitView={() => setIsSplitViewEnabled(!isSplitViewEnabled)}
                    isOpen={isChatOpen}`;

code = code.replace(
    '                <OasisChat\r\n                    isOpen={isChatOpen}',
    chatReplacement
);
code = code.replace(
    '                <OasisChat\n                    isOpen={isChatOpen}',
    chatReplacement
);

// We need to also ensure that if isSplitViewEnabled is true and we open Resonance, we also show SimpleNotes.
// The current condition for Resonance: {!isUnifiedCreatorOpen && activeNotebook === 'resonance' && (
// Let's replace it:
code = code.replace(
    /{!isUnifiedCreatorOpen && activeNotebook === 'resonance' && \(/g,
    '{!isUnifiedCreatorOpen && (activeNotebook === \'resonance\' || (isSplitViewEnabled && isSimpleNotesOpen)) && ('
);
// Wait, no. If activeNotebook is NOT resonance, but splitView is enabled and simpleNotes is open, we shouldn't show ResonanceNotebook.
// Actually, I already added `isSplitViewEnabled && (isChatOpen || activeNotebook === 'resonance')` for SimpleNotesView, which means SimpleNotesView will ALWAYS show up if Chat or Resonance is open and split view is enabled. This is perfect and doesn't require modifying the condition for Chat or Resonance.
// Wait, let's check App.jsx around line 13000 to see what the condition for SimpleNotesView is.
// It is: `{!isUnifiedCreatorOpen && (isSimpleNotesOpen || (isSplitViewEnabled && (isChatOpen || activeNotebook === 'resonance'))) && (`
// This is exactly what we need! SimpleNotesView will automatically render if split view is enabled and chat or resonance is open.

fs.writeFileSync(path, code);
console.log('App.jsx updated perfectly');
