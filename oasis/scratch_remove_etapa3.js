const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend/src/components/MyResponsesDashboard.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const regex = /\/\/ ETAPA 3: Diseñando preguntas terapéuticas[\s\S]*?if \(!res3\.ok\) \{[\s\S]*?\} catch\(e\) \{[\s\S]*?\}[\s\S]*?\}/;

if (regex.test(content)) {
    content = content.replace(regex, '');
    
    // We also need to fix the Etapa 1/3 and 2/3 labels in the UI strings
    content = content.replace(/Construyendo topología masiva de nodos \(Etapa 1\/3\)/g, 'Construyendo topología masiva de nodos (Etapa 1/2)');
    content = content.replace(/Diseñando preguntas terapéuticas para cada nodo \(Etapa 3\/3\)/g, '');
    content = content.replace(/Generando insights profundos y clínicos \(Etapa 2\/3\)/g, 'Generando insights profundos y clínicos (Etapa 2/2)');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Successfully removed Etapa 3 and updated labels to 1/2 and 2/2.');
} else {
    console.error('Regex did not match Etapa 3!');
}
