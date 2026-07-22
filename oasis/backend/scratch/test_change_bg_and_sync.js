const http = require('http');
const https = require('https');

const API_URL = 'http://localhost:5046';
const supabaseUrl = 'https://mxxasrhqwzpbcuzglzif.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14eGFzcmhxd3pwYmN1emdsemlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MzI1MDYsImV4cCI6MjA5NTMwODUwNn0.ik5fjXrvdywciGwjCT0qQvoVxdWMyx0jYLnXXx9ljNQ';

function requestSupabase(url, options = {}) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        resolve(data);
                    }
                } else {
                    reject(new Error(`Supabase HTTP ${res.statusCode}: ${data}`));
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

function postAPI(path, user, payload) {
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
        console.log('1. Fetching current state from Supabase...');
        const initialSupabaseState = await requestSupabase(`${supabaseUrl}/rest/v1/oasis_global_state?id=eq.1`, {
            headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'apikey': supabaseKey
            }
        });
        const stateData = initialSupabaseState[0].state_data;
        const usersListInit = stateData.Users || stateData.users || [];
        const userObjInit = usersListInit.find(u => (u.Username || u.username) === 'ory11');
        const initialBg = userObjInit ? (userObjInit.Background || userObjInit.background) : null;
        console.log('Initial Background in Supabase:', initialBg);

        console.log('\n2. Changing background via API...');
        const uniqueValue = `color_test_${Date.now()}`;
        const newBg = {
            type: 'color',
            value: uniqueValue,
            isTiled: false,
            opacity: 0.8
        };
        await postAPI('/api/oasis/background', 'ory11', newBg);

        console.log('\n3. Waiting 3 seconds for Supabase sync task to complete...');
        await new Promise((resolve) => setTimeout(resolve, 3000));

        console.log('\n4. Fetching state from Supabase again...');
        const updatedSupabaseState = await requestSupabase(`${supabaseUrl}/rest/v1/oasis_global_state?id=eq.1`, {
            headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'apikey': supabaseKey
            }
        });
        const stateDataUpdated = updatedSupabaseState[0].state_data;
        const usersListUpdated = stateDataUpdated.Users || stateDataUpdated.users || [];
        const userObjUpdated = usersListUpdated.find(u => (u.Username || u.username) === 'ory11');
        const updatedBg = userObjUpdated ? (userObjUpdated.Background || userObjUpdated.background) : null;
        console.log('Updated Background in Supabase:', updatedBg);

        if (updatedBg && (updatedBg.Value || updatedBg.value) === uniqueValue) {
            console.log('\nSUCCESS! The background was synced to Supabase successfully!');
        } else {
            console.log('\nFAILURE! The background was NOT synced to Supabase!');
        }

        // Restore original background
        console.log('\n5. Restoring original background...');
        await postAPI('/api/oasis/background', 'ory11', initialBg);

    } catch (e) {
        console.error('Error during test:', e);
    }
}

run();
