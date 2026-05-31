const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'App.jsx');
let content = fs.readFileSync(filePath, 'utf-8');

const renderBlock = `
            {isBitacoraOpen && (
                <BitacoraExistencial
                    blocks={blocks}
                    setBlocks={setBlocks}
                    accent={accent}
                    onClose={() => setIsBitacoraOpen(false)}
                    user={user}
                    editBlock={(b) => {
                        setIsBitacoraOpen(false);
                        editBlock(b);
                    }}
                    openNewComposer={() => {
                        setIsBitacoraOpen(false);
                        openNewComposer(false, false);
                    }}
                    deleteBlocks={deleteBlocks}
                    onNewChat={() => {
                        setIsBitacoraOpen(false);
                        setIsChatOpen(true);
                    }}
                    onOpenSimpleNotes={() => {
                        setIsBitacoraOpen(false);
                        setIsSimpleNotesOpenRaw(true);
                    }}
                />
            )}
`;

if (!content.includes('<BitacoraExistencial')) {
    // Find the end of SimpleNotesView
    content = content.replace(
        /<\/SimpleNotesView>\s*\n\s*\)}/g,
        "</SimpleNotesView>\n            )}\n" + renderBlock
    );
    // Wait, SimpleNotesView doesn't have closing tag if it's self closing
    content = content.replace(
        /openNewComposer=\{openNewComposer\}\s*\/>\s*\n\s*\)}/g,
        "openNewComposer={openNewComposer}\n                />\n            )}\n" + renderBlock
    );
    fs.writeFileSync(filePath, content);
    console.log("Injected render block");
} else {
    console.log("Already injected");
}
