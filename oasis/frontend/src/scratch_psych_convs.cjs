const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'components', 'PsychologistDashboard.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add state for conversations
if (!content.includes('const [conversations, setConversations] = useState([]);')) {
    content = content.replace(
        'const [pid5Insights, setPid5Insights] = useState(null);',
        'const [pid5Insights, setPid5Insights] = useState(null);\n    const [conversations, setConversations] = useState([]);'
    );
}

// 2. Add fetch for conversations in the useEffect
if (!content.includes('fetch(`${API_URL}/api/oasis/conversations?user=${selectedPatient.name}`);')) {
    const searchString = `const blocksRes = await fetch(\`\${API_URL}/api/oasis/blocks?user=\${selectedPatient.name}\`);`;
    const replaceString = `
                  try {
                      const convRes = await fetch(\`\${API_URL}/api/oasis/conversations?user=\${selectedPatient.name}\`);
                      if (convRes.ok && active) {
                          const convData = await convRes.json();
                          setConversations(convData || []);
                      }
                  } catch (e) {
                      console.error("Error fetching conversations:", e);
                  }
                  
                  const blocksRes = await fetch(\`\${API_URL}/api/oasis/blocks?user=\${selectedPatient.name}\`);`;
                  
    content = content.replace(searchString, replaceString);
}

// 3. Pass conversations to MyResponsesDashboard
if (!content.includes('conversations={conversations}')) {
    content = content.replace(
        '<MyResponsesDashboard \n                                  user={selectedPatient.name} \n                                  isEmbedded={true} \n                                  accent="#10b981" \n                              />',
        '<MyResponsesDashboard \n                                  user={selectedPatient.name} \n                                  isEmbedded={true} \n                                  accent="#10b981" \n                                  conversations={conversations}\n                              />'
    );
}

fs.writeFileSync(filePath, content, 'utf8');
console.log("Successfully updated PsychologistDashboard.jsx to fetch and pass conversations.");
