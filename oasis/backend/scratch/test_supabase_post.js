const https = require('https');

const supabaseUrl = 'https://mxxasrhqwzpbcuzglzif.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14eGFzcmhxd3pwYmN1emdsemlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MzI1MDYsImV4cCI6MjA5NTMwODUwNn0.ik5fjXrvdywciGwjCT0qQvoVxdWMyx0jYLnXXx9ljNQ';

function post(url, headers, payload) {
    return new Promise((resolve, reject) => {
        const bodyStr = JSON.stringify(payload);
        const req = https.request(url, {
            method: 'POST',
            headers: {
                ...headers,
                'Content-Length': Buffer.byteLength(bodyStr)
            }
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log(`Status Code: ${res.statusCode}`);
                console.log(`Headers:`, res.headers);
                console.log(`Response Data:`, data);
                resolve({ statusCode: res.statusCode, data });
            });
        });
        req.on('error', reject);
        req.write(bodyStr);
        req.end();
    });
}

async function run() {
    try {
        console.log('Sending test POST to Supabase...');
        const headers = {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
        };

        // Let's first fetch the current state so we don't destroy it
        const getRes = await new Promise((resolve, reject) => {
            https.get(`${supabaseUrl}/rest/v1/oasis_global_state?id=eq.1`, {
                headers: {
                    'Authorization': `Bearer ${supabaseKey}`,
                    'apikey': supabaseKey
                }
            }, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => resolve(JSON.parse(data)));
            }).on('error', reject);
        });

        if (!getRes || getRes.length === 0) {
            console.log('State not found.');
            return;
        }

        const globalState = getRes[0].state_data;
        const payload = {
            id: 1,
            state_data: globalState
        };

        // Try POSTing to see if it succeeds
        await post(`${supabaseUrl}/rest/v1/oasis_global_state`, headers, payload);

    } catch (e) {
        console.error('Error:', e);
    }
}

run();
