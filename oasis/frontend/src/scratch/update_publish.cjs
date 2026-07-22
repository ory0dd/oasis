const fs = require('fs');
const path = require('path');

const filepath = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/PublishNoteSelector.jsx';
let content = fs.readFileSync(filepath, 'utf8');

const targetLF = `            // STEP 3: Build full blocks list and POST to server explicitly
            const newBlocks = selectedBlock
                ? blocks.map(b => b.id === selectedBlock.id ? publishedBlock : b)
                : [...blocks, publishedBlock];

            if (window.syncBlocksTimeout) clearTimeout(window.syncBlocksTimeout);
            const res = await fetch(\`\${API_URL}/api/oasis/blocks?user=\${user}\`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newBlocks)
            });

            if (!res.ok) throw new Error(\`Server save failed: \${res.status}\`);

            // STEP 4: Update local state and feed
            if (setBlocks) setBlocks(newBlocks);
            setStatus('done');

            // Small delay so "done" state is visible, then close
            await new Promise(r => setTimeout(r, 800));
            onClose();
            if (onPublished) onPublished(publishedBlock);`;

const replacementLF = `            // STEP 3: POST to decoupled feed publish endpoint
            const res = await fetch(\`\${API_URL}/api/oasis/feed/publish?user=\${user}\`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(publishedBlock)
            });

            if (!res.ok) throw new Error(\`Feed publish failed: \${res.status}\`);
            const savedFeedBlock = await res.json();

            // STEP 4: Trigger done status
            setStatus('done');

            // Small delay so "done" state is visible, then close
            await new Promise(r => setTimeout(r, 800));
            onClose();
            if (onPublished) onPublished(savedFeedBlock);`;

// Normalize carriage returns for comparison
const normalizedContent = content.replace(/\r\n/g, '\n');
if (normalizedContent.includes(targetLF)) {
    const updatedNormalized = normalizedContent.replace(targetLF, replacementLF);
    // Restore carriage returns
    const updatedContent = updatedNormalized.replace(/\n/g, '\r\n');
    fs.writeFileSync(filepath, updatedContent, 'utf8');
    console.log('Successfully updated PublishNoteSelector.jsx');
} else {
    console.log('Target block not found!');
}
