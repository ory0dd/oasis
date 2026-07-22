const fs = require('fs');
let code = fs.readFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx', 'utf8');

// Find the line with activeCheckinPatternId
const searchStr = '{activeCheckinPatternId === pat.id ? (';
const idx = code.indexOf(searchStr);

if (idx !== -1) {
    // Look backwards from idx to find the preceding '</div>'
    const beforeStr = code.substring(0, idx);
    const lastDiv = beforeStr.lastIndexOf('</div>');
    
    if (lastDiv !== -1 && (idx - lastDiv) < 200) { // Make sure it's nearby
        // Remove the </div>
        let newCode = beforeStr.substring(0, lastDiv) + beforeStr.substring(lastDiv + 6) + code.substring(idx);
        fs.writeFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx', newCode);
        console.log('SUCCESS');
    } else {
        console.log('</div> not found nearby');
    }
} else {
    console.log('searchStr not found');
}
