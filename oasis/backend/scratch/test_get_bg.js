const http = require('http');

const API_URL = 'http://localhost:5046';

function get(path, user) {
    return new Promise((resolve, reject) => {
        const url = `${API_URL}${path}?user=${user}`;
        const options = {
            headers: {
                'X-Oasis-User': user
            }
        };
        http.get(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log(`GET ${path}?user=${user} - Status: ${res.statusCode}`);
                console.log(`Response:`, data);
                try {
                    resolve(JSON.parse(data));
                } catch(e) {
                    resolve(data);
                }
            });
        }).on('error', reject);
    });
}

async function run() {
    try {
        console.log('Fetching background for ory11...');
        await get('/api/oasis/background', 'ory11');

        console.log('\nFetching background for observador1...');
        await get('/api/oasis/background', 'observador1');

    } catch (e) {
        console.error('Error:', e);
    }
}

run();
