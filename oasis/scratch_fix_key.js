const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend/src/components/MyResponsesDashboard.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix the bad storage key
content = content.replace(
    /localStorage\.setItem\(\`oasis_afc_\$\{user\}\`, JSON\.stringify\(updatedAfcData\)\);/g,
    "setLocalItem(`oasis_afc_real_data_${user}`, JSON.stringify(updatedAfcData));"
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed localStorage key.');
