
const fs = require('fs');
const p = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/App.jsx';
let lines = fs.readFileSync(p, 'utf8').split('\n');
lines[7610] = '                            try { recognitionNoteRef.current.start(); } catch (e) { setIsRecordingNote(false); }';
lines[10264] = '                            id: \	ext-\,';
fs.writeFileSync(p, lines.join('\n'));

