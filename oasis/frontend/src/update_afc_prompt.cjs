const fs = require('fs');
let content = fs.readFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx', 'utf8');

// Replace the additive prompt
const oldPrompt = `\${isAdditive ? \`
=== MODO ACTUALIZACIÓN ADITIVA (ACTUALIZAR EL MAPA PRESERVANDO LA ORGANIZACIÓN) ===
El usuario ha respondido preguntas de puntos ciegos. Tu tarea es incorporar estos aprendizajes al mapa actual sin alterar ni borrar lo que ya existe.
Reglas estrictas de preservación aditiva:
1. Copia EXACTAMENTE todos los nodos de 'Nodos actuales' en tu lista 'nodes' de salida. Conserva intactos sus 'id', 'label', 'type', 'x', 'y', 'description', 'source' y 'challenge'. NO cambies sus posiciones (x, y) bajo ninguna circunstancia.
2. Copia EXACTAMENTE todas las conexiones de 'Conexiones actuales' en tu lista 'edges' de salida.
3. Si vas a agregar NUEVOS nodos derivados de los aprendizajes, asígnales IDs únicos y posiciones (x,y) que no colisionen con los actuales (usa coordenadas x entre 10-90 y y entre 10-90, idealmente en espacios vacíos).
4. Si vas a actualizar un nodo actual con nueva información en su 'description', puedes hacerlo, PERO MANTÉN su ID y coordenadas originales.
5. NO modifiques la estructura fundamental ni elimines nodos existentes.
\` : \`
=== MODO GENERACIÓN DESDE CERO ===
Genera una estructura clínica completa.
\`}`;

const newPrompt = `\${isAdditive ? \`
=== MODO ACTUALIZACIÓN ADITIVA (AGREGAR AL MAPA EXISTENTE) ===
El usuario ha respondido preguntas de puntos ciegos. Tu tarea es generar SOLO LOS NUEVOS NODOS, NUEVAS CONEXIONES y NUEVOS PUNTOS CIEGOS que resulten de estos descubrimientos.
Reglas estrictas de preservación aditiva:
1. NO repitas los nodos o conexiones de los 'Nodos actuales'. Devuelve ÚNICAMENTE la nueva información (nuevos nodos y nuevas conexiones).
2. Asegúrate de referenciar los IDs de los 'Nodos actuales' en el campo 'source' o 'target' de tus nuevas conexiones para vincular los descubrimientos a la red existente.
3. Asígnales IDs únicos a los nuevos nodos y posiciones (x,y) en espacios vacíos.
\` : \`
=== MODO GENERACIÓN DESDE CERO ===
Genera una estructura clínica completa.
\`}`;

content = content.replace(oldPrompt, newPrompt);

// Now replace the parsing logic
const oldParsing = `            if (parsedAfc.is_valid && parsedAfc.nodes) {
                if (!isAdditive) {
                    parsedAfc.nodes = reorganizeNodes(parsedAfc.nodes, true);
                } else {
                    parsedAfc.nodes = resolveCollisions(parsedAfc.nodes);
                }
            }`;

const newParsing = `            if (parsedAfc.is_valid && parsedAfc.nodes) {
                if (!isAdditive) {
                    parsedAfc.nodes = reorganizeNodes(parsedAfc.nodes, true);
                } else {
                    const oldNodes = afcData?.nodes || [];
                    const oldEdges = afcData?.edges || [];
                    const oldBlindSpots = afcData?.blind_spots || [];

                    // Combine old and new to prevent overwriting and save tokens
                    parsedAfc.nodes = [...oldNodes, ...parsedAfc.nodes];
                    parsedAfc.edges = [...oldEdges, ...(parsedAfc.edges || [])];
                    parsedAfc.blind_spots = [...oldBlindSpots, ...(parsedAfc.blind_spots || [])];

                    parsedAfc.nodes = resolveCollisions(parsedAfc.nodes);
                }
            }`;

content = content.replace(oldParsing, newParsing);

// Also add a safety net: if JSON.parse fails, try to repair it
const oldJSONParse = `const parsedAfc = JSON.parse(cleanContent.trim());`;
const newJSONParse = `
            let parsedAfc;
            try {
                parsedAfc = JSON.parse(cleanContent.trim());
            } catch (e) {
                console.warn("JSON Parse failed, attempting basic repair for truncated JSON...");
                // Basic repair for truncated JSON output (closes common brackets)
                let repaired = cleanContent.trim();
                const openBraces = (repaired.match(/\\{/g) || []).length;
                const closeBraces = (repaired.match(/\\}/g) || []).length;
                const openBrackets = (repaired.match(/\\[/g) || []).length;
                const closeBrackets = (repaired.match(/\\]/g) || []).length;
                
                if (repaired.endsWith(',')) repaired = repaired.slice(0, -1);
                
                for (let i = 0; i < openBrackets - closeBrackets; i++) repaired += ']';
                for (let i = 0; i < openBraces - closeBraces; i++) repaired += '}';
                
                try {
                    parsedAfc = JSON.parse(repaired);
                    console.log("JSON successfully repaired!");
                } catch (e2) {
                    throw new Error("El JSON recibido está truncado o es inválido y no pudo ser reparado automáticamente.");
                }
            }
`;

content = content.replace(oldJSONParse, newJSONParse);

fs.writeFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx', content);
console.log('Update complete.');
