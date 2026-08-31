const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend/src/components/MyResponsesDashboard.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update setNodeChats initialization to include thread 6
content = content.replace(
    /const currentThreads = prev\[currentNode\.id\] \|\| \{ 0: \[\], 1: \[\], 2: \[\], 3: \[\], 4: \[\], 5: \[\] \};/,
    "const currentThreads = prev[currentNode.id] || { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };"
);

// 2. Update isLegacy mapping to include 6
content = content.replace(
    /5: threadIndex === 5 \? updatedChat : \[\]/,
    "5: threadIndex === 5 ? updatedChat : [],\n                                6: threadIndex === 6 ? updatedChat : []"
);

// 3. Update threadLabels to include 'Integración'
content = content.replace(
    /const threadLabels = \['Historia', 'Relaciones', 'Cuerpo', 'Valores', 'Conductas', 'Experimentos'\];/g,
    "const threadLabels = ['Historia', 'Relaciones', 'Cuerpo', 'Valores', 'Conductas', 'Experimentos', 'Integración'];"
);

// 4. Inject Integration Prompt Logic in continueNodeExploration
const systemPromptRegex = /const systemPrompt = `Eres un Psicólogo Clínico y Analista Existencial de Nivel Experto\.[\s\S]*?\}[\s\S]*?`;/;
const newSystemPromptCode = `let systemPrompt = \`Eres un Psicólogo Clínico y Analista Existencial de Nivel Experto.
El paciente está explorando un nodo de su mapa conductual (Grafo de Bucles) en formato de conversación viva contigo.
Tu objetivo es guiar esta exploración de forma empática, profunda y confrontativa cuando sea necesario.

=== CONTEXTO DEL PACIENTE ===
Diagnóstico Existencial: \${phenomData ? JSON.stringify(phenomData) : "No hay datos."}
Historia de Vida: \${bioData ? BIO_QUESTIONS.map((q, i) => \`\${q.text}: \${bioData[i] || ""}\`).join('\\n') : "No hay datos."}

=== NODO EN EXPLORACIÓN ===
Nodo: "\${currentNode.label}" (Tipo: \${currentNode.type})
Análisis original: \${getFallbackDescription(currentNode, user)}

=== INSTRUCCIONES ===
1. Evalúa el historial de la conversación (si existe) y la última respuesta del paciente.
2. Si la conversación apenas inicia (el paciente no ha hablado), rompe el hielo con una única pregunta abierta muy poderosa y reflexiva. Enfoque: \${threadIndex === 0 ? 'RAÍZ HISTÓRICA o pasado (experiencias escolares, familia, infancia)' : threadIndex === 1 ? 'RELACIONES ACTUALES o entorno social (pareja, amistades, trabajo)' : threadIndex === 2 ? 'EFECTOS FISIOLÓGICOS o corporales (tensión, respiración, agotamiento)' : threadIndex === 3 ? 'VALORES y significados (creatividad, libertad, autenticidad)' : threadIndex === 4 ? 'CONDUCTAS y patrones (procrastinación, evitación, sobreesfuerzo)' : 'EXPERIMENTOS y acciones concretas para explorar nuevas posibilidades'}.
3. Si el paciente ya respondió, valida brevemente su respuesta y haz una ÚNICA pregunta de seguimiento que profundice un nivel más abajo (ej. yendo a la raíz histórica, a los efectos sistémicos, a los valores ocultos, etc.).
4. OPCIONAL: Si descubres que el paciente acaba de revelar un patrón, figura, miedo o concepto NUEVO que es muy importante, puedes sugerir un NUEVO NODO para agregarse al mapa conductual.
5. Devuelve ÚNICAMENTE un objeto JSON.

ESTRUCTURA DE SALIDA ESPERADA:
{
  "next_question": "La respuesta validante breve y tu única pregunta poderosa de seguimiento.",
  "new_node": null
}\`;

        if (threadIndex === 6) {
            systemPrompt = \`Eres un Psicólogo Clínico y Analista Existencial de Nivel Experto.
El paciente está cerrando e integrando la exploración de un nodo de su mapa conductual.
Ha explorado este nodo desde múltiples perspectivas diferentes (Historia, Relaciones, Cuerpo, Valores, Conductas, Experimentos).

=== NODO EN EXPLORACIÓN ===
Nodo: "\${currentNode.label}" (Tipo: \${currentNode.type})

=== INSTRUCCIONES DE CIERRE E INTEGRACIÓN ===
1. La última parte del nodo invita a observar qué cambió durante la exploración. NO busques obtener más información. Busca INTEGRAR la experiencia.
2. Si el paciente NO ha hablado en esta etapa de integración, genera un ÚNICO mensaje de cierre que resuma compasivamente el núcleo de lo que se ha revelado en las perspectivas (usando tu contexto de todo lo que el paciente ha dicho) y termina con una sola pregunta integradora: "¿Qué ha cambiado en tu forma de ver o sentir esto después de esta exploración?".
3. Si el paciente ya respondió a tu pregunta de integración, evalúa si ha ocurrido una "reorganización de significado" genuina.
4. Devuelve ÚNICAMENTE un objeto JSON. Si consideras que el paciente ha integrado la experiencia con éxito (insight), establece "node_status": "integrated". De lo contrario, "node_status": "open".

ESTRUCTURA DE SALIDA ESPERADA:
{
  "next_question": "Tu mensaje integrador o respuesta final.",
  "node_status": "open"
}\`;
        }`;

content = content.replace(systemPromptRegex, newSystemPromptCode);

// 5. Inject node status updates from LLM JSON
content = content.replace(
    /if \(parsed\.new_node\) \{/g,
    `if (threadIndex === 6 && parsed.node_status === 'integrated') {
                        setAfcData(prev => {
                            if (!prev || !prev.nodes) return prev;
                            return {
                                ...prev,
                                nodes: prev.nodes.map(n => n.id === currentNode.id ? { ...n, status: 'integrated' } : n)
                            };
                        });
                    }
                    if (parsed.new_node) {`
);

// 6. Fix Map Node Styling for 'integrated' status
content = content.replace(
    /border-blue-500\/40 hover:border-blue-400'\)}/g,
    "border-blue-500/40 hover:border-blue-400')}`"
); // Un-escape a bit if needed, actually I'll use a safer regex:

content = content.replace(
    /\(isSelected \? 'border-blue-400 bg-\[#0a0a0c\] shadow-\[inset_0_0_30px_rgba\(59,130,246,0\.3\)\]' : 'border-blue-500\/40 hover:border-blue-400'\)/g,
    "(node.status === 'integrated' ? 'border-yellow-400 bg-yellow-950/40 shadow-[0_0_30px_rgba(250,204,21,0.5)]' : (isSelected ? 'border-blue-400 bg-[#0a0a0c] shadow-[inset_0_0_30px_rgba(59,130,246,0.3)]' : 'border-blue-500/40 hover:border-blue-400'))"
);

content = content.replace(
    /\(isSelected \? 'border-emerald-400 bg-\[#0a0a0c\] shadow-\[inset_0_0_30px_rgba\(16,185,129,0\.3\)\]' : 'border-emerald-500\/40 hover:border-emerald-400'\)/g,
    "(node.status === 'integrated' ? 'border-yellow-400 bg-yellow-950/40 shadow-[0_0_30px_rgba(250,204,21,0.5)]' : (isSelected ? 'border-emerald-400 bg-[#0a0a0c] shadow-[inset_0_0_30px_rgba(16,185,129,0.3)]' : 'border-emerald-500/40 hover:border-emerald-400'))"
);

content = content.replace(
    /\(isSelected \? 'border-rose-400 bg-\[#0a0a0c\] shadow-\[inset_0_0_30px_rgba\(244,63,94,0\.3\)\]' : 'border-rose-500\/40 hover:border-rose-400'\)/g,
    "(node.status === 'integrated' ? 'border-yellow-400 bg-yellow-950/40 shadow-[0_0_30px_rgba(250,204,21,0.5)]' : (isSelected ? 'border-rose-400 bg-[#0a0a0c] shadow-[inset_0_0_30px_rgba(244,63,94,0.3)]' : 'border-rose-500/40 hover:border-rose-400'))"
);

// Update text color for integrated nodes
content = content.replace(
    /\$\{node\.dashed \? 'text-sky-300' : 'text-blue-200'\}/g,
    "${node.status === 'integrated' ? 'text-yellow-300' : (node.dashed ? 'text-sky-300' : 'text-blue-200')}"
);
content = content.replace(
    /\$\{node\.dashed \? 'text-sky-300' : 'text-emerald-200'\}/g,
    "${node.status === 'integrated' ? 'text-yellow-300' : (node.dashed ? 'text-sky-300' : 'text-emerald-200')}"
);
content = content.replace(
    /\$\{node\.dashed \? 'text-sky-300' : 'text-rose-200'\}/g,
    "${node.status === 'integrated' ? 'text-yellow-300' : (node.dashed ? 'text-sky-300' : 'text-rose-200')}"
);

// 7. UI updates for perspective headers (PERSPECTIVA X DE 6) -> INTEGRACIÓN
// For the map view:
content = content.replace(
    /PERSPECTIVA \{safeThreadIndex \+ 1\} DE 6/g,
    "{safeThreadIndex === 6 ? '✨ INTEGRACIÓN DE NODO' : `PERSPECTIVA ${safeThreadIndex + 1} DE 6`}"
);

// 8. Add the "Integrar" button to the UI!
// We'll place it right next to the left/right arrows.
// `<div className="flex gap-1">` or `<div className="flex gap-1.5">`
content = content.replace(
    /<div className="flex gap-1\.5">/g,
    `<div className="flex gap-1.5">
                                                                {safeThreadIndex !== 6 && (
                                                                    <button 
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setSelectedQuestionIndex(6);
                                                                            const nextChat = getSafeCurrentChat(activeChatNode?.id || currentNode?.id || selectedNode?.id, 6);
                                                                            if ((!nextChat || nextChat.length === 0) && !isGeneratingExplorations) {
                                                                                continueNodeExploration(activeChatNode || currentNode || selectedNode, null, 6);
                                                                            }
                                                                        }}
                                                                        className="mr-2 px-2 py-1 text-[9px] font-bold bg-amber-500/20 text-amber-400 hover:bg-amber-500/40 rounded border border-amber-500/30 transition-colors"
                                                                    >
                                                                        INTEGRAR EXPERIENCIA
                                                                    </button>
                                                                )}`
);
content = content.replace(
    /<div className="flex gap-1">/g,
    `<div className="flex gap-1">
                                                                {safeThreadIndex !== 6 && (
                                                                    <button 
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setSelectedQuestionIndex(6);
                                                                            const nextChat = getSafeCurrentChat(activeChatNode?.id || currentNode?.id || selectedNode?.id, 6);
                                                                            if ((!nextChat || nextChat.length === 0) && !isGeneratingExplorations) {
                                                                                continueNodeExploration(activeChatNode || currentNode || selectedNode, null, 6);
                                                                            }
                                                                        }}
                                                                        className="mr-2 px-2 py-1 text-[9px] font-bold bg-amber-500/20 text-amber-400 hover:bg-amber-500/40 rounded border border-amber-500/30 transition-colors"
                                                                    >
                                                                        INTEGRAR EXPERIENCIA
                                                                    </button>
                                                                )}`
);

// 9. Fix arrow logic to navigate 0 to 5, skipping 6 unless we are in 6. If we are in 6, arrows bring us back to 5 or 0.
content = content.replace(
    /const nextIdx = safeThreadIndex > 0 \? safeThreadIndex - 1 : 5;/g,
    "const nextIdx = safeThreadIndex === 6 ? 5 : (safeThreadIndex > 0 ? safeThreadIndex - 1 : 5);"
);
content = content.replace(
    /const nextIdx = safeThreadIndex < 5 \? safeThreadIndex \+ 1 : 0;/g,
    "const nextIdx = safeThreadIndex === 6 ? 0 : (safeThreadIndex < 5 ? safeThreadIndex + 1 : 0);"
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Injected integration logic!');
