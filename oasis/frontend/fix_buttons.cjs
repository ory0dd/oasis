const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');

const targetStr = `                          onClick={(e) => {
                              e.stopPropagation();
                              setIsBitacoraOpen(false);
                              setIsSimpleNotesOpen(false);
                              setIsUnifiedCreatorOpen(false);
                              setActiveNotebook(null);
                              setIsChatOpen(false);
                              setActiveTest(null);
                              openNewComposer();
                          }}`;

const replacementStr = `                          onClick={(e) => {
                              e.stopPropagation();
                              setIsBitacoraOpen(false);
                              setIsUnifiedCreatorOpen(true);
                              setUnifiedTab('notes');
                          }}`;

const index = app.indexOf(targetStr);
if (index !== -1) {
    app = app.replace(targetStr, replacementStr);
    console.log('Successfully replaced Notes button.');
} else {
    console.log('Target string NOT FOUND. Let us do a regex search.');
    // Let's replace the first instance of openNewComposer in a button onClick!
    const regex = /onClick=\{\(e\) => \{\s*e\.stopPropagation\(\);\s*setIsBitacoraOpen\(false\);\s*setIsSimpleNotesOpen\(false\);\s*setIsUnifiedCreatorOpen\(false\);\s*setActiveNotebook\(null\);\s*setIsChatOpen\(false\);\s*setActiveTest\(null\);\s*openNewComposer\(\);\s*\}\}/;
    if (regex.test(app)) {
        app = app.replace(regex, replacementStr);
        console.log('Replaced via regex!');
    } else {
        console.log('Regex also failed.');
    }
}

// Diario
const diaryTarget = /onClick=\{\(e\) => \{\s*e\.stopPropagation\(\);\s*setIsBitacoraOpen\(false\);\s*setIsSimpleNotesOpen\(false\);\s*setIsUnifiedCreatorOpen\(false\);\s*setIsComposerOpen\(false\);\s*setActiveNotebook\('diary'\);\s*setIsChatOpen\(false\);\s*setActiveTest\(null\);\s*\}\}/;
if (diaryTarget.test(app)) {
    app = app.replace(diaryTarget, `onClick={(e) => { e.stopPropagation(); setIsBitacoraOpen(false); setIsUnifiedCreatorOpen(true); setUnifiedTab('diary'); }}`);
    console.log('Replaced Diary button.');
}

// Resonance
const resonanceTarget = /onClick=\{\(e\) => \{\s*e\.stopPropagation\(\);\s*setIsBitacoraOpen\(false\);\s*setIsSimpleNotesOpen\(false\);\s*setIsUnifiedCreatorOpen\(false\);\s*setIsComposerOpen\(false\);\s*setActiveNotebook\('resonance'\);\s*setIsChatOpen\(false\);\s*setActiveTest\(null\);\s*\}\}/;
if (resonanceTarget.test(app)) {
    app = app.replace(resonanceTarget, `onClick={(e) => { e.stopPropagation(); setIsBitacoraOpen(false); setIsUnifiedCreatorOpen(true); setUnifiedTab('noise'); }}`);
    console.log('Replaced Resonance button.');
}

fs.writeFileSync('src/App.jsx', app);
