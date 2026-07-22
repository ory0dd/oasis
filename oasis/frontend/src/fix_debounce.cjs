const fs = require('fs');
const file = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/App.jsx';
let content = fs.readFileSync(file, 'utf8');

const regexBlocks = /fetch\(\`\$\{API_URL\}\/api\/oasis\/blocks\?user=\$\{user\}\`, \{\s*method: 'POST',\s*headers: \{ 'Content-Type': 'application\/json' \},\s*body: JSON\.stringify\(cleanBlocks\)\s*\}\)\.then\(\(res\) => \{\s*if \(\!res\.ok\) console\.error\("Error saving blocks:", res\.status\);\s*fetchFeed\(\);\s*\}\)\.catch\(\(err\) => \{\s*console\.log\('Saved locally \\(Offline Mode\\), waiting for sync event\.', err\);\s*\}\);/;

const replacementBlocks = `if (window.syncBlocksTimeout) clearTimeout(window.syncBlocksTimeout);
            window.syncBlocksTimeout = setTimeout(() => {
                fetch(\`\${API_URL}/api/oasis/blocks?user=\${user}\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(cleanBlocks)
                }).then((res) => {
                    if (!res.ok) console.error("Error saving blocks:", res.status);
                    fetchFeed();
                }).catch((err) => {
                    console.log('Saved locally (Offline Mode), waiting for sync event.', err);
                });
            }, 2500);`;

content = content.replace(regexBlocks, replacementBlocks);

const regexLinks = /fetch\(\`\$\{API_URL\}\/api\/oasis\/links\?user=\$\{user\}\`, \{\s*method: 'POST',\s*headers: \{ 'Content-Type': 'application\/json' \},\s*body: JSON\.stringify\(newLinks\)\s*\}\)\.then\(res => \{\s*if \(res\.ok\) console\.log\(\`\[Oasis\] Sincronizaci[óÃ³]n de v[íÃ­]nculos exitosa\.\`\);\s*else console\.error\(\`\[Oasis\] Error de sincronizaci[óÃ³]n: \$\{res\.status\}\`\);\s*\}\);/;

const replacementLinks = `if (window.syncLinksTimeout) clearTimeout(window.syncLinksTimeout);
        window.syncLinksTimeout = setTimeout(() => {
            fetch(\`\${API_URL}/api/oasis/links?user=\${user}\`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newLinks)
            }).then(res => {
                if (res.ok) console.log(\`[Oasis] Sincronización de vínculos exitosa.\`);
                else console.error(\`[Oasis] Error de sincronización: \${res.status}\`);
            });
        }, 2500);`;

content = content.replace(regexLinks, replacementLinks);

fs.writeFileSync(file, content);
console.log('Fixed both fetch calls!');
