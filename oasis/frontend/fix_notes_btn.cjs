const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');

// Fix Notes button onClick
app = app.replace(
    /onClick=\{\(e\) => \{\s*e\.stopPropagation\(\);\s*setIsBitacoraOpen\(false\);\s*setIsSimpleNotesOpen\(false\);\s*setActiveNotebook\(null\);\s*setIsChatOpen\(false\);\s*setActiveTest\(null\);\s*openNewComposer\(\);\s*\}\}/g,
    `onClick={(e) => { e.stopPropagation(); setIsBitacoraOpen(false); setIsUnifiedCreatorOpen(true); setUnifiedTab('notes'); }}`
);

// Fix Notes button className
app = app.replace(
    /className=\{\`w-9 h-9 md:w-11 md:h-11 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg border shrink-0 \$\{\(isSimpleNotesOpen \|\| isComposerOpen\)/g,
    `className={\`w-9 h-9 md:w-11 md:h-11 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg border shrink-0 \${((isUnifiedCreatorOpen && unifiedTab === 'notes') || isSimpleNotesOpen || isComposerOpen)`
);

fs.writeFileSync('src/App.jsx', app);
