const fs = require('fs');

const filePath = "c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx";

let content = fs.readFileSync(filePath, 'utf8');
let lines = content.split('\n');

// 1. Delete the duplicate currentPatterns block
let firstIdx = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('const currentPatterns = useMemo')) {
        firstIdx = i;
        break; // Find the first one
    }
}

if (firstIdx !== -1) {
    let endIdx = -1;
    for (let i = firstIdx; i < Math.min(firstIdx + 30, lines.length); i++) {
        if (lines[i].includes('    }, [currentPatterns, selectedPatternId]);')) {
            endIdx = i;
            break;
        }
    }
    
    if (endIdx !== -1) {
        console.log(`Deleting lines ${firstIdx} to ${endIdx}`);
        lines.splice(firstIdx, endIdx - firstIdx + 1);
    } else {
        console.log("Could not find end of activePattern block.");
    }
}

// 2. Add back nodeChallenges if missing
let challengeIdx = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('const saved = localStorage.getItem(`oasis_node_challenges_${user}`);')) {
        challengeIdx = i;
        break;
    }
}

if (challengeIdx !== -1) {
    if (lines[challengeIdx - 1].includes('try {')) {
        if (!lines[challengeIdx - 2].includes('useState(() => {')) {
            console.log(`Inserting nodeChallenges useState at line ${challengeIdx - 1}`);
            lines.splice(challengeIdx - 1, 0, "    const [nodeChallenges, setNodeChallenges] = useState(() => {");
        }
    }
}

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
