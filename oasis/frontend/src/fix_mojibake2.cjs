const fs = require('fs');

const files = [
    "c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx",
    "c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/PsychologistDashboard.jsx"
];

const replacements = {
    "Í¡": "á",
    "Í©": "é",
    "Í­": "í",
    "Í³": "ó",
    "Íº": "ú",
    "Í±": "ñ",
    "Í‰": "É",
    "Í“": "Ó",
    "Íš": "Ú",
    "Í‘": "Ñ",
    "Â¿": "¿",
    "Â¡": "¡",
    "Í¼": "ü",
    "â†’": "→",
    "CÍ³MO": "CÓMO",
    "cÍ³mo": "cómo",
    "Í": "í", // any standalone Í that wasn't caught by the above is probably í, but wait!
    // actually, let's fix Í last, and only if it's inside words.
};

for (const file of files) {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        
        content = content.replace(/Í¡/g, "á");
        content = content.replace(/Í©/g, "é");
        content = content.replace(/Í­/g, "í");
        content = content.replace(/Í³/g, "ó");
        content = content.replace(/Íº/g, "ú");
        content = content.replace(/Í±/g, "ñ");
        content = content.replace(/Í‰/g, "É");
        content = content.replace(/Í“/g, "Ó");
        content = content.replace(/Íš/g, "Ú");
        content = content.replace(/Í‘/g, "Ñ");
        content = content.replace(/Â¿/g, "¿");
        content = content.replace(/Â¡/g, "¡");
        content = content.replace(/Í¼/g, "ü");
        content = content.replace(/â†’/g, "→");
        
        // fix specific words with uppercase
        content = content.replace(/C[Óó]MO/g, "CÓMO");
        content = content.replace(/PATR[Óó]N/g, "PATRÓN");
        
        content = content.replace(/cl.nica/g, 'clínica');
        content = content.replace(/sist.mica/g, 'sistémica');
        
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Fixed ${file}`);
    }
}
