const fs = require('fs');

const files = [
    "c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx",
    "c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/PsychologistDashboard.jsx"
];

const replacements = {
    "Ã¡": "á",
    "Ã©": "é",
    "Ã­": "í",
    "Ã³": "ó",
    "Ãº": "ú",
    "Ã±": "ñ",
    "Ã‰": "É",
    "Ã“": "Ó",
    "Ãš": "Ú",
    "Ã‘": "Ñ",
    "Â¿": "¿",
    "Â¡": "¡",
    "Ã¼": "ü",
    "Â": ""
};

for (const file of files) {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        
        // Manual character fixes for corrupted unicode
        content = content.replace(/Integracin/g, 'Integración');
        content = content.replace(/Integraci.n/g, 'Integración');
        content = content.replace(/cl.nica/g, 'clínica');
        content = content.replace(/sist.mica/g, 'sistémica');
        content = content.replace(/Sist.mica/g, 'Sistémica');
        content = content.replace(/m.tricas/g, 'métricas');
        content = content.replace(/est.ndar/g, 'estándar');
        content = content.replace(/din.micas/g, 'dinámicas');
        content = content.replace(/Diagn.stico/g, 'Diagnóstico');
        content = content.replace(/som.tica/g, 'somática');
        
        // Specific replace for "Ã" and "Í" which often collide
        content = content.replace(/Ã /g, "Á");
        content = content.replace(/Ã/g, "Í");
        
        for (const [k, v] of Object.entries(replacements)) {
            content = content.split(k).join(v);
        }
        
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Fixed ${file}`);
    }
}
