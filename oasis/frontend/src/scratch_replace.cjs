const fs = require('fs');
const code = fs.readFileSync('c:\\Users\\Administrador\\Downloads\\oasis\\oasis\\frontend\\src\\App.jsx', 'utf8');
const replacement = fs.readFileSync('c:\\Users\\Administrador\\Downloads\\oasis\\oasis\\frontend\\src\\scratch_public_profile.jsx', 'utf8');

const startIdx = code.indexOf('    const renderPublicProfileView = () => {');
const endIdx = code.indexOf('    const renderFeedView = () => {');

if (startIdx !== -1 && endIdx !== -1) {
    const newCode = code.slice(0, startIdx) + replacement + '\n\n' + code.slice(endIdx);
    fs.writeFileSync('c:\\Users\\Administrador\\Downloads\\oasis\\oasis\\frontend\\src\\App.jsx', newCode);
    console.log('Replaced successfully');
} else {
    console.log('Could not find markers');
}
