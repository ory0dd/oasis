const https = require('https');

const supabaseUrl = 'https://mxxasrhqwzpbcuzglzif.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14eGFzcmhxd3pwYmN1emdsemlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MzI1MDYsImV4cCI6MjA5NTMwODUwNn0.ik5fjXrvdywciGwjCT0qQvoVxdWMyx0jYLnXXx9ljNQ';

function request(url, options = {}, payload = null) {
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
        if (payload) {
            req.write(JSON.stringify(payload));
        }
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
        console.log('Fetched state successfully. Keys:', Object.keys(globalState));
        
        const usersKey = Object.keys(globalState).find(k => k.toLowerCase() === 'users') || 'Users';
        const feedKey = Object.keys(globalState).find(k => k.toLowerCase() === 'feeditems') || 'FeedItems';

        const usersList = globalState[usersKey] || [];
        console.log('Users in Supabase:', usersList.map(u => u.username || u.Username));

        // Let's filter out private users. We want to remove 'ory11', 'ory111', and other private users.
        const usersToRemove = ['ory11', 'ory111', 'Yo_existoooo', '27wyww', 'vacio1', '324', '3123123'];
        const originalCount = usersList.length;

        globalState[usersKey] = usersList.filter(u => {
            const uname = (u.username || u.Username || '').toLowerCase();
            const shouldRemove = usersToRemove.map(x => x.toLowerCase()).includes(uname);
            if (shouldRemove) {
                console.log(`Removing user: ${u.username || u.Username} from global state...`);
            }
            return !shouldRemove;
        });

        console.log(`Remaining users:`, globalState[usersKey].map(u => u.username || u.Username));

        // Also clean feed items associated with those users
        const feedItemsList = globalState[feedKey] || [];
        if (feedItemsList.length > 0) {
            const originalFeedCount = feedItemsList.length;
            globalState[feedKey] = feedItemsList.filter(f => {
                const uname = (f.username || f.Username || '').toLowerCase();
                return !usersToRemove.map(x => x.toLowerCase()).includes(uname);
            });
            console.log(`Cleaned FeedItems: from ${originalFeedCount} to ${globalState[feedKey].length}`);
        }

        // Save cleaned state back to Supabase
        console.log('Saving cleaned state back to Supabase...');
        const updatePayload = {
            id: 1,
            state_data: globalState
        };

        await request(`${supabaseUrl}/rest/v1/oasis_global_state?id=eq.1`, {
            method: 'POST', // using POST with resolution=merge-duplicates (upsert)
            headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'apikey': supabaseKey,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates'
            }
        }, updatePayload);

        console.log('Successfully cleaned and saved state in Supabase!');

    } catch (e) {
        console.error('Error during cleanup:', e);
    }
}

run();
