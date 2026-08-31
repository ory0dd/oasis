const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend/src/components/MyResponsesDashboard.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const targetContent = `    const saveNodeExplorations = (newExplorations) => {
        setNodeExplorations(newExplorations);
        setLocalItem(\`oasis_node_explorations_\${user}\`, JSON.stringify(newExplorations));
    };`;

const replacementContent = `    const saveNodeExplorations = (newExplorations) => {
        setNodeExplorations(newExplorations);
        setLocalItem(\`oasis_node_explorations_\${user}\`, JSON.stringify(newExplorations));
    };

    // Load nodeChats from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem(\`oasis_node_chats_\${user}\`);
            if (saved) {
                setNodeChats(JSON.parse(saved));
            }
        } catch (e) {
            console.error(e);
        }
    }, [user]);

    // Save nodeChats to localStorage when it changes
    useEffect(() => {
        if (Object.keys(nodeChats).length > 0) {
            setLocalItem(\`oasis_node_chats_\${user}\`, JSON.stringify(nodeChats));
        }
    }, [nodeChats, user]);`;

if (content.includes(targetContent)) {
    content = content.replace(targetContent, replacementContent);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Successfully injected nodeChats localStorage persistence.');
} else {
    console.error('Target content not found!');
}
