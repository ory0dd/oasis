const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../oasis_data.json.bak');
if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    process.exit(1);
}

try {
    const content = fs.readFileSync(filePath, 'utf8');
    const state = JSON.parse(content);
    const users = state.users || state.Users || [];

    const ory11 = users.find(u => (u.username || u.Username) === 'ory11');
    const vacio1 = users.find(u => (u.username || u.Username) === 'vacio1');

    if (ory11) {
        console.log('--- ory11 ClinicalData ---');
        const cData = ory11.clinicalData || ory11.ClinicalData || {};
        Object.keys(cData).forEach(k => {
            if (k.includes('transcriptions') || k.includes('qualitative')) {
                console.log(`Key: ${k}`);
                console.log(`Value: ${cData[k].substring(0, 200)}...`);
            }
        });
    }

    if (vacio1) {
        console.log('--- vacio1 ClinicalData ---');
        const cData = vacio1.clinicalData || vacio1.ClinicalData || {};
        Object.keys(cData).forEach(k => {
            if (k.includes('transcriptions') || k.includes('qualitative')) {
                console.log(`Key: ${k}`);
                console.log(`Value: ${cData[k].substring(0, 200)}...`);
            }
        });
    }

} catch (e) {
    console.error(e);
}
