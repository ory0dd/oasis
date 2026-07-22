const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');

const target = `                          onClick={(e) => {
                              e.stopPropagation();
                              setIsBitacoraOpen(false);
                              setIsSimpleNotesOpen(false);
                              setIsUnifiedCreatorOpen(false);
                              setActiveNotebook(null);
                              setIsChatOpen(false);
                              setActiveTest(null);
                              openNewComposer();
                          }}`;

const replacement = `                          onClick={(e) => {
                              e.stopPropagation();
                              setIsBitacoraOpen(false);
                              setIsUnifiedCreatorOpen(true);
                              setUnifiedTab('notes');
                          }}`;

if (app.includes(target)) {
    app = app.replace(target, replacement);
    fs.writeFileSync('src/App.jsx', app);
    console.log("Successfully replaced Notes onClick!");
} else {
    console.log("Could not find target string.");
}
