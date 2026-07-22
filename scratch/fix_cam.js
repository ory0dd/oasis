const fs = require('fs');
let code = fs.readFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx', 'utf8');

const regex = /useEffect\(\(\) => \{\s*if \(afcData && mapContainerRef\.current && mapViewTab === 'map'\) \{\s*const timer = setTimeout\(\(\) => \{\s*if \(afcData\.nodes && afcData\.nodes\.length > 0\) \{\s*const lastNode = afcData\.nodes\[afcData\.nodes\.length - 1\];\s*zoomToNode\(lastNode\);\s*setSelectedNode\(lastNode\);\s*\} else \{\s*resetMapTransform\(\);\s*\}\s*\}, 150\);\s*return \(\) => clearTimeout\(timer\);\s*\}\s*\}, \[afcData, resetMapTransform, zoomToNode, mapViewTab\]\);/g;

const replacement = `useEffect(() => {
        if (afcData && mapContainerRef.current && mapViewTab === 'map') {
            const timer = setTimeout(() => {
                if (currentPatterns && currentPatterns.length > 0) {
                    const easiestPat = currentPatterns[0]; // Ya vienen ordenados con el más abordable primero
                    if (easiestPat.sortedNodes && easiestPat.sortedNodes.length > 0) {
                        // Focus on the first node of the easiest pattern
                        const targetNode = easiestPat.sortedNodes[0];
                        zoomToNode(targetNode);
                        setSelectedNode(targetNode);
                        return;
                    }
                }
                
                // Fallback si no hay patrones
                if (afcData.nodes && afcData.nodes.length > 0) {
                    const lastNode = afcData.nodes[afcData.nodes.length - 1];
                    zoomToNode(lastNode);
                    setSelectedNode(lastNode);
                } else {
                    resetMapTransform();
                }
            }, 150);
            return () => clearTimeout(timer);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [afcData, resetMapTransform, zoomToNode, mapViewTab]);`;

if (regex.test(code)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx', code);
    console.log("SUCCESS");
} else {
    console.log("Regex not found");
}
