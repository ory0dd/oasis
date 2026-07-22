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
    console.log('Keys in state:', Object.keys(state));

    const users = state.users || state.Users || [];
    console.log(`Total users found: ${users.length}`);

    users.forEach(u => {
        const username = u.username || u.Username || 'Unknown';
        const blocks = u.blocks || u.Blocks || [];
        const clinicalData = u.clinicalData || u.ClinicalData || {};
        console.log(`- User: "${username}"`);
        console.log(`  Blocks count: ${blocks.length}`);
        console.log(`  ClinicalData keys:`, Object.keys(clinicalData));
    });

} catch (e) {
    console.error('Error:', e);
}
