const fs = require('fs');

let app = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Import UnifiedCreatorView
if (!app.includes('UnifiedCreatorView')) {
    app = app.replace(
        "import SimpleNotesView from './components/SimpleNotesView';",
        "import SimpleNotesView from './components/SimpleNotesView';\nimport UnifiedCreatorView from './components/UnifiedCreatorView';"
    );
}

// 2. Add State
if (!app.includes('isUnifiedCreatorOpen')) {
    app = app.replace(
        "const [isSimpleNotesOpen, setIsSimpleNotesOpenRaw] = useState(false);",
        "const [isSimpleNotesOpen, setIsSimpleNotesOpenRaw] = useState(false);\n    const [isUnifiedCreatorOpen, setIsUnifiedCreatorOpen] = useState(false);\n    const [unifiedTab, setUnifiedTab] = useState('notes');"
    );
}

// 3. Update the modal closing logic in Nav Pills and elsewhere
app = app.replace(/setIsSimpleNotesOpenRaw\(false\);/g, "setIsSimpleNotesOpenRaw(false);\n            setIsUnifiedCreatorOpen(false);");
app = app.replace(/setIsSimpleNotesOpen\(false\);/g, "setIsSimpleNotesOpen(false);\n                            setIsUnifiedCreatorOpen(false);");

// 4. Update the Nav Pills logic
// Notes
app = app.replace(
    /onClick=\{\(e\) => \{ e\.stopPropagation\(\); setIsBitacoraOpen\(false\); setIsSimpleNotesOpen\(prev => !prev\); \}\}/,
    `onClick={(e) => { e.stopPropagation(); setIsBitacoraOpen(false); setIsUnifiedCreatorOpen(true); setUnifiedTab('notes'); }}`
);
app = app.replace(
    /className=\{\`w-9 h-9 md:w-11 md:h-11 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg border shrink-0 \$\{isSimpleNotesOpen \? 'bg-accent/g,
    `className={\`w-9 h-9 md:w-11 md:h-11 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg border shrink-0 \${(isUnifiedCreatorOpen && unifiedTab === 'notes') || isSimpleNotesOpen ? 'bg-accent`
);

// Chat
app = app.replace(
    /onClick=\{\(e\) => \{ e\.stopPropagation\(\); setIsBitacoraOpen\(false\); setIsChatOpen\(prev => !prev\); \}\}/,
    `onClick={(e) => { e.stopPropagation(); setIsBitacoraOpen(false); setIsUnifiedCreatorOpen(true); setUnifiedTab('chat'); }}`
);
app = app.replace(
    /className=\{\`w-9 h-9 md:w-11 md:h-11 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg border shrink-0 \$\{isChatOpen \? 'bg-accent/g,
    `className={\`w-9 h-9 md:w-11 md:h-11 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg border shrink-0 \${(isUnifiedCreatorOpen && unifiedTab === 'chat') || isChatOpen ? 'bg-accent`
);

// Diary
app = app.replace(
    /onClick=\{\(e\) => \{\s*e\.stopPropagation\(\);\s*setIsBitacoraOpen\(false\);\s*setIsSimpleNotesOpen\(false\);\s*setIsComposerOpen\(false\);\s*setActiveNotebook\('diary'\);\s*setIsChatOpen\(false\);\s*setActiveTest\(null\);\s*\}\}/,
    `onClick={(e) => {
                              e.stopPropagation();
                              setIsBitacoraOpen(false);
                              setIsUnifiedCreatorOpen(true);
                              setUnifiedTab('diary');
                          }}`
);
app = app.replace(
    /className=\{\`w-9 h-9 md:w-11 md:h-11 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg border shrink-0 \$\{activeNotebook === 'diary' \?/g,
    `className={\`w-9 h-9 md:w-11 md:h-11 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg border shrink-0 \${(isUnifiedCreatorOpen && unifiedTab === 'diary') || activeNotebook === 'diary' ?`
);

// Resonance
app = app.replace(
    /onClick=\{\(e\) => \{\s*e\.stopPropagation\(\);\s*setIsBitacoraOpen\(false\);\s*setIsSimpleNotesOpen\(false\);\s*setIsComposerOpen\(false\);\s*setActiveNotebook\('resonance'\);\s*setIsChatOpen\(false\);\s*setActiveTest\(null\);\s*\}\}/,
    `onClick={(e) => {
                              e.stopPropagation();
                              setIsBitacoraOpen(false);
                              setIsUnifiedCreatorOpen(true);
                              setUnifiedTab('noise');
                          }}`
);
app = app.replace(
    /className=\{\`w-9 h-9 md:w-11 md:h-11 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg border shrink-0 \$\{activeNotebook === 'resonance' \?/g,
    `className={\`w-9 h-9 md:w-11 md:h-11 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg border shrink-0 \${(isUnifiedCreatorOpen && unifiedTab === 'noise') || activeNotebook === 'resonance' ?`
);

// 5. Inject the UnifiedCreatorView at the bottom, taking over the individual renders ONLY IF isUnifiedCreatorOpen is true.
// Otherwise they can render individually if opened by other means.
app = app.replace(
    /\{\(isComposerOpen \|\| isSimpleNotesOpen \|\| activeNotebook \|\| isChatOpen \|\| activeTest \|\| isBitacoraOpen\) && \(/,
    `{(isComposerOpen || isSimpleNotesOpen || activeNotebook || isChatOpen || activeTest || isBitacoraOpen || isUnifiedCreatorOpen) && (`
);

app = app.replace(
    /\{isSimpleNotesOpen && \(\s*<SimpleNotesView/,
    `{isUnifiedCreatorOpen && (
                  <UnifiedCreatorView onClose={() => setIsUnifiedCreatorOpen(false)} activeTab={unifiedTab} setActiveTab={setUnifiedTab}>
                      <SimpleNotesView
                          ref={simpleNotesRef}
                          blocks={blocks}
                          setBlocks={syncBlocks}
                          accent={accent}
                          user={user}
                          onClose={() => setIsUnifiedCreatorOpen(false)}
                          editBlock={editBlock}
                          openNewComposer={openNewComposer}
                      />
                      <OasisChat
                          blocks={blocks}
                          setBlocks={syncBlocks}
                          onClose={() => setIsUnifiedCreatorOpen(false)}
                          user={user}
                          handleSelectNote={handleSelectNote}
                          accent={accent}
                      />
                      <DiaryNotebook
                          onClose={() => setIsUnifiedCreatorOpen(false)}
                          onFocusNode={(x, y) => { setCam({ x: -x * 0.8, y: -y * 0.8, scale: 0.8 }); setIsUnifiedCreatorOpen(false); }}
                          blocks={blocks}
                          setBlocks={setBlocks}
                          syncBlocks={syncBlocks}
                          accent={accent}
                      />
                      <ResonanceNotebook
                          onClose={() => setIsUnifiedCreatorOpen(false)}
                          onFocusNode={(x, y) => { setCam({ x: -x * 0.8, y: -y * 0.8, scale: 0.8 }); setIsUnifiedCreatorOpen(false); }}
                          blocks={blocks}
                          setBlocks={setBlocks}
                          syncBlocks={syncBlocks}
                          accent={accent}
                      />
                  </UnifiedCreatorView>
              )}
              
              {!isUnifiedCreatorOpen && isSimpleNotesOpen && (
                  <SimpleNotesView`
);

// We need to hide the other ones if isUnifiedCreatorOpen is true so they don't double render.
app = app.replace(
    /\{activeNotebook === 'diary' && \(/,
    `{!isUnifiedCreatorOpen && activeNotebook === 'diary' && (`
);
app = app.replace(
    /\{activeNotebook === 'resonance' && \(/,
    `{!isUnifiedCreatorOpen && activeNotebook === 'resonance' && (`
);
app = app.replace(
    /\{isChatOpen && \(\s*<OasisChat/,
    `{!isUnifiedCreatorOpen && isChatOpen && (\n                  <OasisChat`
);

fs.writeFileSync('src/App.jsx', app);
