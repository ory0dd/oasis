const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../oasis_data.json');
if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    process.exit(1);
}

try {
    const content = fs.readFileSync(filePath, 'utf8');
    const state = JSON.parse(content);

    const usersKey = Object.keys(state).find(k => k.toLowerCase() === 'users') || 'users';
    const feedKey = Object.keys(state).find(k => k.toLowerCase() === 'feeditems') || 'feedItems';

    const usersList = state[usersKey] || [];
    const feedItemsList = state[feedKey] || [];

    const allowedUsers = ['ory11', 'observador1'];

    console.log(`Original users: ${usersList.map(u => u.username || u.Username)}`);
    console.log(`Original feed items count: ${feedItemsList.length}`);

    // Filter users list
    state[usersKey] = usersList.filter(u => {
        const name = (u.username || u.Username || '').toLowerCase();
        return allowedUsers.includes(name);
    });

    // Filter feed items list
    state[feedKey] = feedItemsList.filter(f => {
        const name = (f.username || f.Username || '').toLowerCase();
        return allowedUsers.includes(name);
    });

    console.log(`New users: ${state[usersKey].map(u => u.username || u.Username)}`);
    console.log(`New feed items count: ${state[feedKey].length}`);

    fs.writeFileSync(filePath, JSON.stringify(state, null, 2), 'utf8');
    console.log('Successfully cleaned local oasis_data.json!');

} catch (e) {
    console.error('Error during local cleanup:', e);
}
