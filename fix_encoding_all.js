const fs = require('fs');
const path = require('path');

const replacements = {
    'á': 'á',
    'é': 'é',
    'ó': 'ó',
    'ú': 'ú',
    'ñ': 'ñ',
    'É': 'É',
    'Ó': 'Ó',
    'Ú': 'Ú',
    'Ñ': 'Ñ',
    'ü': 'ü',
    'Ü': 'Ü',
    '¿': '¿',
    '¡': '¡',
    'Ã\xad': 'í',
    'Ã\x81': 'Á',
    'Ã\x8d': 'Í',
    'Ã\u00ad': 'í',
    'Ã\u201C': 'Ó',
    'Ã\u0161': 'Ú',
    'Ã\u2018': 'Ñ',
    'Ã\u0153': 'Ü',
    // also the replacement character if the fix script messed it up? 
    // wait, I don't know what it replaced. I will leave it alone.
};

function fixFile(filePath) {
    let original = fs.readFileSync(filePath, 'utf8');
    let fixed = original;
    for (const [bad, good] of Object.entries(replacements)) {
        fixed = fixed.split(bad).join(good);
    }
    // Specific fix for the messy html injected by fix.js if it exists:
    // It injected things like "REALIZACI\"N" where  is \uFFFD.
    // Actually, I can just replace the whole HTML block if it's there.
    // Let's just fix the basic ones first.
    
    if (original !== fixed) {
        console.log("Fixed", filePath);
        fs.writeFileSync(filePath, fixed, 'utf8');
    }
}

function walk(dir) {
    const list = fs.readdirSync(dir);
    for (const file of list) {
        if (file === 'node_modules' || file === '.git' || file === 'dist' || file === '.gemini') continue;
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            walk(fullPath);
        } else if (stat.isFile() && /\.(js|jsx|ts|tsx|html|css|json)$/i.test(fullPath)) {
            fixFile(fullPath);
        }
    }
}

walk('.');
console.log("Done");
