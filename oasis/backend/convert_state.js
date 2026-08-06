const fs = require('fs');

const flatDataStr = fs.readFileSync('oasis_data_backup_final.json', 'utf8');
const flatData = JSON.parse(flatDataStr);

const state = {
    users: [],
    folders: [],
    globalBackground: { type: "color", value: "#030304", isTiled: false, opacity: 1 }
};

const usersMap = {};

for (const key in flatData) {
    const val = flatData[key];
    
    // Attempt to extract username from known prefixes
    let username = null;
    let type = null;
    
    if (key.startsWith('oasis_fullname_')) { username = key.replace('oasis_fullname_', ''); type = 'fullname'; }
    else if (key.startsWith('oasis_age_')) { username = key.replace('oasis_age_', ''); type = 'age'; }
    else if (key.startsWith('oasis_avatar_')) { username = key.replace('oasis_avatar_', ''); type = 'avatar'; }
    else if (key.startsWith('oasis_bg_')) { username = key.replace('oasis_bg_', ''); type = 'bg'; }
    else if (key.startsWith('oasis_public_traits_')) { username = key.replace('oasis_public_traits_', ''); type = 'public_traits'; }
    else if (key.startsWith('oasis_bio_')) { username = key.replace('oasis_bio_', ''); type = 'bio'; }
    // There are many prefixes like oasis_phenom_qualitative_, oasis_pid_answers_, etc.
    // Instead of exhaustive, let's just find the first underscore after 'oasis_' and take everything after as username?
    // Not easy. But we know all users have 'oasis_fullname_' or 'oasis_age_'.
    
    // Wait, the backend stores clinical data directly.
}

// Better approach: Get all usernames from oasis_fullname_
Object.keys(flatData).forEach(k => {
    if (k.startsWith('oasis_fullname_')) {
        const u = k.replace('oasis_fullname_', '');
        if (!usersMap[u]) usersMap[u] = { username: u, password: 'password123', clinicalData: {} };
        usersMap[u].fullName = flatData[k];
    }
});
// also check oasis_age_ just in case
Object.keys(flatData).forEach(k => {
    if (k.startsWith('oasis_age_')) {
        const u = k.replace('oasis_age_', '');
        if (!usersMap[u]) usersMap[u] = { username: u, password: 'password123', clinicalData: {} };
        usersMap[u].age = parseInt(flatData[k]) || null;
    }
});

// For each username, collect all their clinical data and properties
for (const key in flatData) {
    const val = flatData[key];
    
    // Find which user this key belongs to
    let matchedUser = null;
    // Sort usernames by length descending to match longest first (avoiding substring bugs)
    const sortedUsernames = Object.keys(usersMap).sort((a, b) => b.length - a.length);
    for (const u of sortedUsernames) {
        if (key.endsWith(`_${u}`)) {
            matchedUser = u;
            break;
        }
    }
    
    if (matchedUser) {
        if (key === `oasis_bg_${matchedUser}`) {
            try {
                usersMap[matchedUser].background = JSON.parse(val);
            } catch(e){}
        } else {
            // put in clinical data
            usersMap[matchedUser].clinicalData[key] = val;
        }
    } else {
        // if not matched, ignore for now (or put in global? mostly old junk)
    }
}

// Convert to array
state.users = Object.values(usersMap);

console.log(`Migrated ${state.users.length} users.`);

// Make sure ory11 has pass123
const ory = state.users.find(u => u.username === 'ory11');
if (ory) ory.password = 'pass123';
const obs = state.users.find(u => u.username === 'observador1');
if (obs) obs.password = 'Animanatural.21';

// Save structured data
fs.writeFileSync('oasis_data_structured.json', JSON.stringify(state, null, 2));
console.log('Saved to oasis_data_structured.json');
