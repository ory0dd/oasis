const fs = require('fs');

const filePath = "c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx";
let content = fs.readFileSync(filePath, 'utf8');

// Find the start and end of the Libreta Clínica block
// The block starts with: {/* SEGUIMIENTO Y NOTAS DE SESIÓN (TOP NOTEBOOK) */}
// And ends right before: {/* MÓDULO 1: LIENZO INTERACTIVO DEL AFC (100% width on top) */}

const startMarker = "{/* SEGUIMIENTO Y NOTAS DE SESIÓN (TOP NOTEBOOK) */}";
const endMarker = "{/* MÓDULO 1: LIENZO INTERACTIVO DEL AFC (100% width on top) */}";

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);

if (startIdx !== -1 && endIdx !== -1) {
    const newContent = content.substring(0, startIdx) + content.substring(endIdx);
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log("Successfully removed Libreta Clínica UI.");
} else {
    console.log("Could not find start or end markers for Libreta Clínica.");
}

// We also need to remove the states related to it:
// newSessionNote, setNewSessionNote, sessions, setSessions, handleAddSession, handleDeleteSession
// It's easier to remove these via regex or string replace.
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

const stateVarsToRemove = [
    "const [newSessionNote, setNewSessionNote]",
    "const [sessions, setSessions]",
    "const handleAddSession =",
    "const handleDeleteSession ="
];

let finalLines = [];
let skipBlock = false;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if line starts one of our blocks
    let isStartOfBlock = false;
    for (const marker of stateVarsToRemove) {
        if (line.includes(marker)) {
            isStartOfBlock = true;
            skipBlock = true;
            break;
        }
    }
    
    if (isStartOfBlock) {
        // Skip until we find the end of the block. For useState, it might be same line or next line.
        // For functions, it ends with a closing brace `};` at the same indentation level.
        // Simple approach: skip until we hit a blank line or a closing brace at column 4
        while (i < lines.length) {
            if (lines[i].trim() === '};' || lines[i].trim() === '});') {
                skipBlock = false;
                break;
            }
            if (!skipBlock) break;
            i++;
        }
        continue;
    }
    
    finalLines.push(line);
}

fs.writeFileSync(filePath, finalLines.join('\n'), 'utf8');
console.log("Cleaned up states.");
