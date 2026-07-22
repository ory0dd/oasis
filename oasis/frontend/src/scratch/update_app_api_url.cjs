const fs = require('fs');

const filepath = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/App.jsx';
let content = fs.readFileSync(filepath, 'utf8');

const targetStr = `((typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
                    ? 'http://localhost:5046'
                    : 'https://oasis-production-6303.up.railway.app')`;

const targetStr2 = `((typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
        ? 'http://localhost:5046'
        : 'https://oasis-production-6303.up.railway.app')`;

// Let's do a more robust global replacement for any occurrence of:
// (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
// ? 'http://localhost:5046'
// : 'https://oasis-production-6303.up.railway.app'

let updated = content;

// Replace target 1:
updated = updated.split(`((typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
                    ? 'http://localhost:5046'
                    : 'https://oasis-production-6303.up.railway.app')`).join(`((typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.') || window.location.hostname.startsWith('10.')))
                    ? \`http://\${window.location.hostname}:5046\`
                    : 'https://oasis-production-6303.up.railway.app')`);

// Replace target 2:
updated = updated.split(`((typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
        ? 'http://localhost:5046'
        : 'https://oasis-production-6303.up.railway.app')`).join(`((typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.') || window.location.hostname.startsWith('10.')))
        ? \`http://\${window.location.hostname}:5046\`
        : 'https://oasis-production-6303.up.railway.app')`);

// Also normalize line endings and try simple replaces if previous failed
updated = updated.replace(/window\.location\.hostname\s*===\s*'localhost'\s*\|\|\s*window\.location\.hostname\s*===\s*'127\.0\.0\.1'/g, 
    `window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.') || window.location.hostname.startsWith('10.')`);

updated = updated.replace(/'http:\/\/localhost:5046'/g, '`http://${window.location.hostname}:5046`');

fs.writeFileSync(filepath, updated, 'utf8');
console.log('Successfully updated API_URLs in App.jsx!');
