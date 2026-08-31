const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend/src/components/MyResponsesDashboard.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Replace the systemPrompt conditional logic
const oldSystemPrompt = `2. Si el paciente no ha hablado, rompe el hielo con una única pregunta abierta poderosa y reflexiva. Enfoque: \${threadIndex === 0 ? 'RAÍZ HISTÓRICA o pasado' : threadIndex === 1 ? 'RELACIONES ACTUALES o entorno social' : 'EFECTOS FISIOLÓGICOS o corporales'}.`;
// Wait, my previous regex might fail because the prompt string is slightly different.
// Let's replace the whole systemPrompt declaration up to step 3.
