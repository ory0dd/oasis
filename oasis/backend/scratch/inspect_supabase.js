const https = require('https');

const supabaseUrl = 'https://mxxasrhqwzpbcuzglzif.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14eGFzcmhxd3pwYmN1emdsemlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MzI1MDYsImV4cCI6MjA5NTMwODUwNn0.ik5fjXrvdywciGwjCT0qQvoVxdWMyx0jYLnXXx9ljNQ';

function request(url, options = {}) {
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
                    reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

async function run() {
    try {
        console.log('Fetching global state from Supabase...');
        const res = await request(`${supabaseUrl}/rest/v1/oasis_global_state?id=eq.1`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'apikey': supabaseKey
            }
        });

        if (!res || res.length === 0) {
            console.log('No global state found in Supabase.');
            return;
        }

        const globalState = res[0].state_data;
        console.log('Successfully fetched state from Supabase.');
        console.log('Global Background:', globalState.GlobalBackground || globalState.globalBackground);
        
        const users = globalState.Users || globalState.users || [];
        console.log(`\nUsers in Supabase (${users.length}):`);
        users.forEach(u => {
            console.log(`- User: ${u.Username || u.username}`);
            console.log(`  Background:`, u.Background || u.background);
        });

    } catch (e) {
        console.error('Error:', e);
    }
}

run();
