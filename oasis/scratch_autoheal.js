const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend/src/components/MyResponsesDashboard.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// We want to replace the parsing block inside continueNodeExploration.
// It looks like:
// const parsed = JSON.parse(cleanContent.trim());
// if (parsed.next_question) {

const searchStr = `const parsed = JSON.parse(cleanContent.trim());
            if (parsed.next_question) {`;

const replaceStr = `let parsed;
            try {
                parsed = JSON.parse(cleanContent.trim());
            } catch (e) {
                if (e.message.includes('Unexpected end of JSON input') || e.message.includes('Unterminated string')) {
                    // LLM cutoff (max_tokens hit or network timeout). Auto-heal basic cutoffs.
                    let healed = cleanContent.trim();
                    if (healed.lastIndexOf('"') > healed.lastIndexOf(':')) {
                        healed += '"}';
                    } else {
                        healed += '}';
                    }
                    try {
                        parsed = JSON.parse(healed);
                    } catch (e2) {
                        throw new Error('El modelo de IA agotó su límite de tiempo o tokens al responder. Intenta enviar tu respuesta de nuevo.');
                    }
                } else {
                    throw e;
                }
            }
            if (parsed.next_question) {`;

content = content.replace(searchStr, replaceStr);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Injected JSON auto-heal logic.');
