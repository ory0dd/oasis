async function run() {
    const user = 'ory11';
    const API_URL = 'http://localhost:5046';

    console.log("Fetching existing conversations...");
    const res = await fetch(`${API_URL}/api/oasis/conversations?user=${user}`);
    if (!res.ok) {
        console.error("Fetch failed:", res.status, await res.text());
        return;
    }

    const conversations = await res.json();
    console.log(`Fetched ${conversations.length} conversations.`);

    // Simulate saveCurrentChat update
    const targetId = conversations[0]?.id || `conv-${Date.now()}`;
    let updated;
    const exists = conversations.find(c => c.id === targetId);
    
    const mockMessages = [
        { role: 'user', content: 'hola' },
        { role: 'assistant', content: 'hola asst', id: Date.now() }
    ];

    if (exists) {
        updated = conversations.map(c => c.id === targetId ? { ...c, messages: mockMessages } : c);
    } else {
        updated = [{
            id: targetId,
            title: 'Test Title',
            messages: mockMessages,
            startTime: new Date().toISOString(),
            noteId: '',
            color: '#bef264'
        }, ...conversations];
    }

    console.log("Posting updated conversations...");
    const postRes = await fetch(`${API_URL}/api/oasis/conversations?user=${user}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
    });

    if (postRes.ok) {
        console.log("POST successful!");
    } else {
        console.error("POST failed:", postRes.status, await postRes.text());
    }
}

run().catch(console.error);
