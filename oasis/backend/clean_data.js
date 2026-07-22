const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'oasis_data.json');
try {
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(rawData);

    let removedCount = 0;
    
    data.users.forEach(user => {
        if (user.blocks && Array.isArray(user.blocks)) {
            const initialLen = user.blocks.length;
            // Remove canvas blocks, note blocks, and completely empty text blocks
            user.blocks = user.blocks.filter(b => {
                if (b.type === 'canvas') return false;
                if (b.type === 'note') return false;
                if (b.type === 'text' && (!b.content || b.content.trim() === '')) return false;
                return true;
            });
            removedCount += (initialLen - user.blocks.length);
        }
    });

    if (data.feedItems && Array.isArray(data.feedItems)) {
        // FeedItems should keep note blocks! So we don't filter feedItems for 'note'.
        // But we can filter empty texts if any
        const initialLen = data.feedItems.length;
        data.feedItems = data.feedItems.filter(b => {
            if (b.type === 'text' && (!b.content || b.content.trim() === '')) return false;
            return true;
        });
        removedCount += (initialLen - data.feedItems.length);
    }

    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    console.log(`Successfully cleaned oasis_data.json. Removed ${removedCount} empty/invalid blocks.`);
} catch (e) {
    console.error('Error cleaning JSON:', e);
}
