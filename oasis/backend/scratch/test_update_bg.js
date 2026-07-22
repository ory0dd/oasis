const http = require('http');

const API_URL = 'http://localhost:5046';

function post(path, user, payload) {
    return new Promise((resolve, reject) => {
        const bodyStr = JSON.stringify(payload);
        const url = `${API_URL}${path}?user=${user}`;
        const req = http.request(url, {
            method: 'POST',
            headers: {
                'X-Oasis-User': user,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(bodyStr)
            }
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log(`POST ${path}?user=${user} - Status: ${res.statusCode}`);
                console.log(`Response:`, data);
                resolve({ statusCode: res.statusCode, data });
            });
        });
        req.on('error', reject);
        req.write(bodyStr);
        req.end();
    });
}

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
        console.log('1. Fetching current background for ory11...');
        const original = await get('/api/oasis/background', 'ory11');

        console.log('\n2. Updating background to a new color...');
        const testBg = {
            type: 'color',
            value: '#ff0055',
            isTiled: false,
            opacity: 0.8
        };
        await post('/api/oasis/background', 'ory11', testBg);

        console.log('\n3. Fetching background again to see if updated in memory...');
        const updated = await get('/api/oasis/background', 'ory11');
        
        console.log('\n4. Restoring original background...');
        await post('/api/oasis/background', 'ory11', original);

    } catch (e) {
        console.error('Error:', e);
    }
}

run();
