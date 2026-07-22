const fs = require('fs');
const path = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/App.jsx';
let code = fs.readFileSync(path, 'utf8');

// Add state
code = code.replace(
    'const [isSimpleNotesOpen, setIsSimpleNotesOpenRaw] = useState(false);',
    'const [isSimpleNotesOpen, setIsSimpleNotesOpenRaw] = useState(false);\n    const [isSplitViewEnabled, setIsSplitViewEnabled] = useState(false);'
);

// Modify SimpleNotesView render
code = code.replace(
    /\{\!isUnifiedCreatorOpen && isSimpleNotesOpen && \(\r?\n\s*<SimpleNotesView/,
    '{!isUnifiedCreatorOpen && (isSimpleNotesOpen || (isSplitViewEnabled && (isChatOpen || activeNotebook === "resonance"))) && (\n                <SimpleNotesView'
);

code = code.replace(
    /<SimpleNotesView\r?\n([\s\S]*?)openNewComposer={openNewComposer}\r?\n\s*\/>/g,
    '<SimpleNotesView\n$1openNewComposer={openNewComposer}\n                    className={isSplitViewEnabled ? "fixed inset-y-0 right-0 w-[50vw] mt-[100px] border-l border-white/10 rounded-tl-[2.5rem] bg-[#050506]/95 backdrop-blur-md shadow-2xl z-[1500] pointer-events-auto" : undefined}\n                    isSplitView={isSplitViewEnabled}\n                    onToggleSplitView={() => setIsSplitViewEnabled(!isSplitViewEnabled)}\n                />'
);

// Modify ResonanceNotebook render
code = code.replace(
    /<ResonanceNotebook\r?\n([\s\S]*?)onFocusNode={onFocusNode}\r?\n\s*\/>/g,
    '<ResonanceNotebook\n$1onFocusNode={onFocusNode}\n                    className={isSplitViewEnabled ? "fixed inset-y-0 left-0 w-[50vw] mt-[100px] border-r border-white/10 rounded-tr-[2.5rem] bg-[#050506]/95 backdrop-blur-md shadow-2xl z-[1500] pointer-events-auto" : undefined}\n                    isSplitView={isSplitViewEnabled}\n                    onToggleSplitView={() => setIsSplitViewEnabled(!isSplitViewEnabled)}\n                />'
);

// Modify OasisChat render
code = code.replace(
    /<OasisChat\r?\n([\s\S]*?)setActiveExplorationNodeId={setActiveExplorationNodeId}\r?\n\s*\/>/g,
    '<OasisChat\n$1setActiveExplorationNodeId={setActiveExplorationNodeId}\n                    className={isSplitViewEnabled ? "fixed inset-y-0 left-0 w-[50vw] mt-[100px] border-r border-white/10 rounded-tr-[2.5rem] bg-[#050506]/95 backdrop-blur-md shadow-2xl z-[1500] pointer-events-auto" : undefined}\n                    isSplitView={isSplitViewEnabled}\n                    onToggleSplitView={() => setIsSplitViewEnabled(!isSplitViewEnabled)}\n                />'
);

fs.writeFileSync(path, code);
console.log('App.jsx updated');
