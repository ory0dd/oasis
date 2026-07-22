const key = process.env.DEEPSEEK_API_KEY || Buffer.from("c2stZmI3N2RiMTIyNjM4NDdjOGI1N2E0ODI5Nzk3NmM4NzU=", 'base64').toString('utf8');

console.log("Testing API key: " + key.substring(0, 10) + "...");

async function run() {
    try {
        const response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [{ role: 'user', content: 'hola' }],
                max_tokens: 10
            })
        });
        
        console.log("Status Code:", response.status);
        console.log("Status Text:", response.statusText);
        const text = await response.text();
        console.log("Response Body:", text);
    } catch (e) {
        console.error("Fetch failed:", e);
    }
}

run();
