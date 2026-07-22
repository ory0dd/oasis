const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'components', 'MyResponsesDashboard.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const setLocalItemCode = `
    const setLocalItem = useCallback((key, value) => {
        localStorage.setItem(key, value);
        if (user) {
            fetch(\`\${API_URL}/api/oasis/clinical-data?user=\${user}\`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [key]: value })
            }).catch(e => console.error("Error syncing to backend:", e));
        }
    }, [user]);
`;

// Insert the code just after `const [activePidTab, setActivePidTab] = useState('reactividad');`
if (!content.includes('const setLocalItem = useCallback')) {
    content = content.replace(
        "const [activePidTab, setActivePidTab] = useState('reactividad');",
        "const [activePidTab, setActivePidTab] = useState('reactividad');\n" + setLocalItemCode
    );
}

// Ensure we don't accidentally replace `localStorage.setItem` INSIDE the new setLocalItem function or in initializers that don't have access to setLocalItem (wait, all setItem calls are inside useEffects or callbacks, which is fine)
// Let's just do a regex replace of `localStorage.setItem(` with `setLocalItem(` globally EXCEPT in the `setLocalItem` definition itself.

let parts = content.split('const setLocalItem = useCallback');
if (parts.length > 1) {
    let topPart = parts[0];
    let bottomPart = 'const setLocalItem = useCallback' + parts[1];
    
    // Split bottom part at the end of setLocalItem definition
    let bottomParts = bottomPart.split('}, [user]);');
    if (bottomParts.length > 1) {
        let setLocalItemDef = bottomParts[0] + '}, [user]);';
        let restOfFile = bottomParts.slice(1).join('}, [user]);');
        
        restOfFile = restOfFile.replace(/localStorage\.setItem\(/g, 'setLocalItem(');
        
        content = topPart + setLocalItemDef + restOfFile;
        fs.writeFileSync(filePath, content, 'utf8');
        console.log("Successfully replaced localStorage.setItem with setLocalItem.");
    }
}
