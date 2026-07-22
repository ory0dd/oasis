const http = require('http');

const API_URL = 'http://localhost:5046';

// Helper to make GET requests
function get(url) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const req = http.request({
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname + urlObj.search,
            method: 'GET',
            headers: {
                'X-Oasis-User': 'ory11'
            }
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        });
        req.on('error', reject);
        req.end();
    });
}

// Helper to make POST requests
function post(url, payload) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const dataStr = JSON.stringify(payload);
        const req = http.request({
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname + urlObj.search,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(dataStr),
                'X-Oasis-User': 'ory11'
            }
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch(e) {
                    resolve(data);
                }
            });
        });
        req.on('error', reject);
        req.write(dataStr);
        req.end();
    });
}

async function run() {
    try {
        console.log('1. Fetching current blocks for user ory11...');
        const initialBlocks = await get(`${API_URL}/api/oasis/blocks?user=ory11`);
        console.log(`Successfully fetched ${initialBlocks.length} blocks.`);

        // Pick one block or create a test one
        const testBlockId = `test-verify-${Date.now()}`;
        const newBlock = {
            id: testBlockId,
            type: 'text',
            content: 'Contenido original de prueba de antigravedad',
            caption: 'Nota de Test',
            color: '#a855f7',
            x: 100,
            y: 200,
            canvasId: 'canvas_default',
            username: 'ory11',
            metadata: { timestamp: new Date().toISOString() }
        };

        console.log('\n2. Posting new block (first time)...');
        await post(`${API_URL}/api/oasis/blocks?user=ory11`, [newBlock, ...initialBlocks]);
        console.log('Block saved successfully.');

        console.log('\n3. Posting same block again (no content change)...');
        // Let's modify a non-content property (like position) and post again
        newBlock.x = 150;
        newBlock.y = 250;
        await post(`${API_URL}/api/oasis/blocks?user=ory11`, [newBlock, ...initialBlocks]);
        console.log('Block with unchanged content but updated position posted successfully.');

        console.log('\n4. Posting block with modified content...');
        newBlock.content = 'Contenido completamente nuevo para ver si se ejecuta la IA';
        await post(`${API_URL}/api/oasis/blocks?user=ory11`, [newBlock, ...initialBlocks]);
        console.log('Block with changed content posted successfully.');

        console.log('\nVerification calls complete. Check dotnet console output for hash match check messages!');
    } catch (e) {
        console.error('Test execution failed:', e);
    }
}

run();
