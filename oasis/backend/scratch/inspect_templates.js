const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../oasis_data.json');
if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    process.exit(1);
}

try {
    const content = fs.readFileSync(filePath, 'utf8');
    const state = JSON.parse(content);
    console.log('Background Templates in Local State:', state.BackgroundTemplates || state.backgroundTemplates);
} catch (e) {
    console.error(e);
}
