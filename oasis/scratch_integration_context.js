const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend/src/components/MyResponsesDashboard.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// The replacement code to inject context from threads 0-5
const previousHistoryCode = `
        llmMessages.push({ role: 'system', content: systemPrompt });

        if (threadIndex === 6) {
            // Recopilar el contexto de todas las perspectivas previas
            let contextBuilder = "=== HISTORIAL DE EXPLORACIÓN DEL PACIENTE EN ESTE NODO ===\\n";
            const perspectives = ['Historia', 'Relaciones', 'Cuerpo', 'Valores', 'Conductas', 'Experimentos'];
            for (let i = 0; i < 6; i++) {
                const tChat = getSafeCurrentChat(currentNode.id, i);
                if (tChat.length > 0) {
                    contextBuilder += \`\\n-- Perspectiva: \${perspectives[i]} --\\n\`;
                    tChat.forEach(m => {
                        contextBuilder += \`\${m.role === 'user' ? 'Paciente' : 'Terapeuta'}: \${m.content}\\n\`;
                    });
                }
            }
            llmMessages.push({ role: 'system', content: contextBuilder });
        }

        // Append past conversation history so LLM knows the context`;

content = content.replace(
    /llmMessages\.push\(\{ role: 'system', content: systemPrompt \}\);\s*\/\/ Append past conversation history so LLM knows the context/,
    previousHistoryCode
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Injected context building for integration.');
