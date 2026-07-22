const fs = require('fs');
let content = fs.readFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx', 'utf8');

const target = `            let userResponsesText = "Respuestas del usuario no encontradas.";
            if (activePatientData?.responses) {
                userResponsesText = Object.entries(activePatientData.responses)
                    .map(([qId, r]) => {
                        const questionText = config?.cuestionario?.preguntas?.find(p => p.id === qId)?.texto || qId;
                        return \`Pregunta: \${questionText}\\nRespuesta: \${r}\`;
                    })
                    .join('\\n\\n');
            }`;

const replacement = `            let userResponsesText = "Respuestas del usuario no encontradas.";
            if (typeof phenomData !== 'undefined' && phenomData) {
                userResponsesText = Object.entries(phenomData)
                    .map(([qId, r]) => {
                        return \`Pregunta: \${qId}\\nRespuesta: \${r}\`;
                    })
                    .join('\\n\\n');
            }`;

if (content.includes('if (activePatientData?.responses)')) {
    content = content.replace(target, replacement);
    fs.writeFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx', content);
    console.log('Fixed activePatientData reference');
} else {
    console.log('Target not found');
}
