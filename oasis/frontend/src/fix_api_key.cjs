const fs = require('fs');
let content = fs.readFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx', 'utf8');

const targetStr = "let activeKey = atob('c2stZmI3N2RiMTIyNjM4NDdjOGI1N2E0ODI5Nzk3NmM4NzU=');";

const startFunc = content.indexOf('const generateConceptualization = async () => {');
if (startFunc !== -1) {
    const keyIdx = content.indexOf(targetStr, startFunc);
    if (keyIdx !== -1 && keyIdx < startFunc + 300) {
        const replacement = `let activeKey = localStorage.getItem('oasis_deepseek_key') || '';
            if (!activeKey) {
                activeKey = atob('c2stZmI3N2RiMTIyNjM4NDdjOGI1N2E0ODI5Nzk3NmM4NzU=');
                if (activeKey.includes("07b18eb6601a4b11a109c96a56c92a16") || activeKey.includes("VAR>")) activeKey = '';
            }`;
        content = content.substring(0, keyIdx) + replacement + content.substring(keyIdx + targetStr.length);
        
        // Also update the alert message
        const alertStr = 'alert("Error al generar conceptualización dinámica.");';
        const alertReplacement = 'alert("Error al generar conceptualización dinámica: " + e.message);';
        content = content.replace(alertStr, alertReplacement);
        
        fs.writeFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx', content);
        console.log('Fixed activeKey and alert');
    } else {
        console.log('targetStr not found near startFunc');
    }
}
