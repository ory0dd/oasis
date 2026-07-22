const fs = require('fs');
const file = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove the "ENVIAR A KIO" button from inside the reflection_question textarea
// We look for:
/*
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    const userReflection = nodeNotes[node.id];
                                                                                                    
                                                                                                    // --- NUEVA LÓGICA DE GUARDADO COMO PUNTO CIEGO Y CREACIÓN DE NODO ---
                                                                                                    ...
                                                                                            >
                                                                                                <span className="text-[9px] font-bold tracking-wide">ENVIAR A KIO</span>
                                                                                            </button>
*/
// It starts at line 4873 in our view. Let's find the exact string.
const enviarAKioStartStr = `<button
                                                                                                type="button"
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    const userReflection = nodeNotes[node.id];
                                                                                                    
                                                                                                    // --- NUEVA LÓGICA DE GUARDADO COMO PUNTO CIEGO Y CREACIÓN DE NODO ---`;
const enviarAKioIdx = content.indexOf(enviarAKioStartStr);
if (enviarAKioIdx !== -1) {
    const endStr = `ENVIAR A KIO</span>\n                                                                                            </button>`;
    const enviarAKioEndIdx = content.indexOf(endStr, enviarAKioIdx) + endStr.length;
    // Remove it
    content = content.substring(0, enviarAKioIdx) + content.substring(enviarAKioEndIdx);
} else {
    console.warn("Could not find ENVIAR A KIO button block to remove.");
}

// 2. Update the main "Explorar con Kio IA" prompt
// Look for:
/*
                                                                                    const loopFlow = pat.sortedNodes?.map(n => `[${n.label} (${n.type})]`).join(' → ') || '';
                                                                                    const prompt = `Hola Kio. Quiero profundizar y reinterpretar el bucle de mi mapa conductual llamado "${pat.nombre}".
Este circuito está compuesto por la siguiente secuencia interconectada:
${loopFlow}

Por favor, analicemos:
1. ¿Cómo se alimentan y sostienen estas variables entre sí?
2. ¿De qué manera concreta puedo romper este encadenamiento conductual hoy?`;
*/
const oldPromptStr = `                                                    const loopFlow = pat.sortedNodes?.map(n => \`[\${n.label} (\${n.type})]\`).join(' → ') || '';
                                                    const prompt = \`Hola Kio. Quiero profundizar y reinterpretar el bucle de mi mapa conductual llamado "\${pat.nombre}".
Este circuito está compuesto por la siguiente secuencia interconectada:
\${loopFlow}

Por favor, analicemos:
1. ¿Cómo se alimentan y sostienen estas variables entre sí?
2. ¿De qué manera concreta puedo romper este encadenamiento conductual hoy?\`;`;

const newPromptStr = `                                                    const loopFlow = pat.sortedNodes?.map(n => \`[\${n.label} (\${n.type})]\`).join(' → ') || '';
                                                    
                                                    // Recopilar respuestas de los nodos
                                                    let respuestasTexto = '';
                                                    if (pat.sortedNodes) {
                                                        const respuestas = pat.sortedNodes.map(n => {
                                                            const nota = nodeNotes[n.id];
                                                            if (nota && nota.trim() !== '') {
                                                                return \`- En el nodo "\${n.label}": "\${nota.trim()}"\`;
                                                            }
                                                            return null;
                                                        }).filter(Boolean);
                                                        
                                                        if (respuestas.length > 0) {
                                                            respuestasTexto = \`\\n\\nMis reflexiones previas sobre los elementos de este bucle:\\n\` + respuestas.join('\\n');
                                                        }
                                                    }

                                                    const prompt = \`Hola Kio. Quiero profundizar y reinterpretar el bucle de mi mapa conductual llamado "\${pat.nombre}".
Este circuito está compuesto por la siguiente secuencia interconectada:
\${loopFlow}\${respuestasTexto}

Por favor, analicemos este bucle en su totalidad:
1. ¿Cómo se alimentan y sostienen estas variables entre sí, tomando en cuenta mis reflexiones?
2. ¿De qué manera concreta puedo romper este encadenamiento conductual hoy?\`;`;

content = content.replace(oldPromptStr, newPromptStr);

// 3. UI Polish - Make typography a bit smaller and tighter in the bucles list
// "text-2xl md:text-3xl" -> "text-xl md:text-2xl"
content = content.replace('className="text-2xl md:text-3xl font-black uppercase tracking-wider text-white"', 'className="text-xl md:text-2xl font-black uppercase tracking-wider text-white"');
// "p-5 md:p-6" -> "p-4 md:p-5" (For Card Header and Body)
content = content.replace(/p-5 md:p-6/g, 'p-4 md:p-5');

fs.writeFileSync(file, content, 'utf8');
console.log("Updated Kio integration and polished UI.");
