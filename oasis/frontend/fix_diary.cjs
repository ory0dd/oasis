const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');

// Update DiaryNotebook inside UnifiedCreatorView
app = app.replace(
    /<DiaryNotebook\s+onClose=\{\(\) => setIsUnifiedCreatorOpen\(false\)\}\s+onFocusNode=\{\(x, y\) => \{ setCam\(\{ x: -x \* 0\.8, y: -y \* 0\.8, scale: 0\.8 \}\); setIsUnifiedCreatorOpen\(false\); \}\}\s+blocks=\{blocks\}\s+setBlocks=\{setBlocks\}\s+syncBlocks=\{syncBlocks\}\s+accent=\{accent\}\s+\/>/,
    `<DiaryNotebook
                          className="w-full h-full absolute inset-0"
                          onClose={() => setIsUnifiedCreatorOpen(false)}
                          onFocusNode={(x, y) => { setCam({ x: -x * 0.8, y: -y * 0.8, scale: 0.8 }); setIsUnifiedCreatorOpen(false); }}
                          blocks={blocks}
                          setBlocks={setBlocks}
                          syncBlocks={syncBlocks}
                          accent={accent}
                      />`
);

// Update ResonanceNotebook inside UnifiedCreatorView
app = app.replace(
    /<ResonanceNotebook\s+onClose=\{\(\) => setIsUnifiedCreatorOpen\(false\)\}\s+onFocusNode=\{\(x, y\) => \{ setCam\(\{ x: -x \* 0\.8, y: -y \* 0\.8, scale: 0\.8 \}\); setIsUnifiedCreatorOpen\(false\); \}\}\s+blocks=\{blocks\}\s+setBlocks=\{setBlocks\}\s+syncBlocks=\{syncBlocks\}\s+accent=\{accent\}\s+\/>/,
    `<ResonanceNotebook
                          className="w-full h-full absolute inset-0"
                          onClose={() => setIsUnifiedCreatorOpen(false)}
                          onFocusNode={(x, y) => { setCam({ x: -x * 0.8, y: -y * 0.8, scale: 0.8 }); setIsUnifiedCreatorOpen(false); }}
                          blocks={blocks}
                          setBlocks={setBlocks}
                          syncBlocks={syncBlocks}
                          accent={accent}
                      />`
);

fs.writeFileSync('src/App.jsx', app);
