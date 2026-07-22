const fs = require('fs');

// App.jsx
let app = fs.readFileSync('src/App.jsx', 'utf8');
app = app.replace(
    /<SimpleNotesView\s+ref=\{simpleNotesRef\}\s+blocks=\{blocks\}/,
    '<SimpleNotesView\n                          className="w-full h-full absolute inset-0"\n                          ref={simpleNotesRef}\n                          blocks={blocks}'
);
app = app.replace(
    /<OasisChat\s+blocks=\{blocks\}\s+setBlocks=\{syncBlocks\}/,
    '<OasisChat\n                          className="w-full h-full absolute inset-0"\n                          blocks={blocks}\n                          setBlocks={syncBlocks}'
);
fs.writeFileSync('src/App.jsx', app);

// UnifiedCreatorView.jsx
let ucv = fs.readFileSync('src/components/UnifiedCreatorView.jsx', 'utf8');
ucv = ucv.replace(/<style>\{`[\s\S]*?`\}<\/style>/, '');
fs.writeFileSync('src/components/UnifiedCreatorView.jsx', ucv);
