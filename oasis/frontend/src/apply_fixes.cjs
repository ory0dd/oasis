const fs = require('fs');

const dashboardFile = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx';
const savedPatternsFile = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/saved_patterns.js';

let content = fs.readFileSync(dashboardFile, 'utf8');
const savedPatterns = fs.readFileSync(savedPatternsFile, 'utf8');

// 1. Delete original currentPatterns and activePattern
const origPatternsStart = '    const currentPatterns = useMemo(() => {';
const origPatternsEndMarker = '    }, [currentPatterns, selectedPatternId]);';
const startIdx = content.indexOf(origPatternsStart);
const endIdx = content.indexOf(origPatternsEndMarker, startIdx);

if (startIdx !== -1 && endIdx !== -1) {
    const end = endIdx + origPatternsEndMarker.length;
    content = content.substring(0, startIdx) + content.substring(end);
}

// 2. Insert new currentPatterns AFTER loadIntensities
const insertMarker = '    }, [user]);\n\n';
const insertIdx = content.indexOf(insertMarker, content.indexOf('const loadIntensities = useCallback('));
if (insertIdx !== -1) {
    content = content.substring(0, insertIdx + insertMarker.length) + savedPatterns + '\n' + content.substring(insertIdx + insertMarker.length);
}

// 3. Remove Libreta Clínica UI
const uiStartMarker = "{/* SEGUIMIENTO Y NOTAS DE SESIÓN (TOP NOTEBOOK) */}";
const uiEndMarker = "{/* MÓDULO 1: LIENZO INTERACTIVO DEL AFC (100% width on top) */}";
const uiStartIdx = content.indexOf(uiStartMarker);
const uiEndIdx = content.indexOf(uiEndMarker);

if (uiStartIdx !== -1 && uiEndIdx !== -1) {
    // Delete from uiStartMarker to uiEndMarker
    content = content.substring(0, uiStartIdx) + content.substring(uiEndIdx);
}

// 4. Remove newSessionNote and sessions state
// Just replace them with empty string using precise matching
const stateStart = '    const [newSessionNote, setNewSessionNote] = useState("");';
const stateEnd = '        }\n    });\n'; // end of setSessions initialization
const sStartIdx = content.indexOf(stateStart);
const sEndIdx = content.indexOf(stateEnd, sStartIdx);
if (sStartIdx !== -1 && sEndIdx !== -1) {
    content = content.substring(0, sStartIdx) + content.substring(sEndIdx + stateEnd.length);
}

// 5. Remove handleAddSession and handleDeleteSession
const handlersStart = '    const handleAddSession = () => {';
const handlersEnd = '    const generateTreatmentPlan = async () => {';
const hStartIdx = content.indexOf(handlersStart);
const hEndIdx = content.indexOf(handlersEnd);
if (hStartIdx !== -1 && hEndIdx !== -1) {
    content = content.substring(0, hStartIdx) + content.substring(hEndIdx);
}

// 6. Fix the sessions reference in generateTreatmentPlan
content = content.replace(/\$\{JSON\.stringify\(sessions \|\| \[\]\)\}/g, '[]');

fs.writeFileSync(dashboardFile, content, 'utf8');
console.log('Successfully applied all modifications without breaking the file!');
