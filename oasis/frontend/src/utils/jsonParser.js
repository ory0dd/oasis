/**
 * Safe, resilient JSON parser for LLM responses.
 * Never destroys valid JSON structures with destructive regexes.
 * Features fallback repairs for trailing commas, raw unescaped newlines/tabs in strings,
 * and truncated bracket balancing.
 */
export function safeJSONParse(rawStr) {
    if (!rawStr) throw new Error("Respuesta vacía del modelo de IA.");
    let text = String(rawStr).trim();

    // Strip markdown code fences if wrapped in ```json ... ```
    if (text.includes("```")) {
        text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    }

    // Isolate from first '{' or '[' to last '}' or ']'
    const firstBrace = text.indexOf('{');
    const firstBracket = text.indexOf('[');
    let start = -1;
    let end = -1;

    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
        start = firstBrace;
        end = text.lastIndexOf('}');
    } else if (firstBracket !== -1) {
        start = firstBracket;
        end = text.lastIndexOf(']');
    }

    if (start !== -1 && end !== -1 && end >= start) {
        text = text.substring(start, end + 1);
    }

    // 1. Direct parse attempt (preserves 100% of pristine, valid JSON)
    try {
        return JSON.parse(text);
    } catch (firstErr) {
        // 2. Intelligent repairs
        let repaired = text;

        // Fix trailing commas before } and ]
        repaired = repaired.replace(/,\s*([\}\]])/g, '$1');

        try {
            return JSON.parse(repaired);
        } catch (secondErr) {
            // 3. Fix unescaped control characters / literal newlines in strings
            try {
                let inString = false;
                let escaped = false;
                let fixed = '';
                for (let i = 0; i < repaired.length; i++) {
                    const char = repaired[i];
                    if (char === '"' && !escaped) {
                        inString = !inString;
                    }
                    if (inString && (char === '\n' || char === '\r')) {
                        fixed += char === '\n' ? '\\n' : '';
                    } else if (inString && char === '\t') {
                        fixed += '\\t';
                    } else {
                        fixed += char;
                    }
                    escaped = (char === '\\' && !escaped);
                }
                return JSON.parse(fixed);
            } catch (thirdErr) {
                // 4. Try balancing unclosed brackets or braces if truncated
                try {
                    let openBraces = 0;
                    let openBrackets = 0;
                    let inStr = false;
                    let esc = false;
                    for (let i = 0; i < repaired.length; i++) {
                        const c = repaired[i];
                        if (c === '"' && !esc) inStr = !inStr;
                        if (!inStr) {
                            if (c === '{') openBraces++;
                            else if (c === '}') openBraces--;
                            else if (c === '[') openBrackets++;
                            else if (c === ']') openBrackets--;
                        }
                        esc = (c === '\\' && !esc);
                    }
                    let balanced = repaired;
                    while (openBrackets > 0) { balanced += ']'; openBrackets--; }
                    while (openBraces > 0) { balanced += '}'; openBraces--; }
                    return JSON.parse(balanced);
                } catch (fourthErr) {
                    const match = firstErr.message.match(/position (\d+)/);
                    let contextStr = "";
                    if (match && match[1]) {
                        const pos = parseInt(match[1], 10);
                        contextStr = " (Cerca de: '..." + text.substring(Math.max(0, pos - 25), pos + 25) + "...')";
                    }
                    throw new Error(firstErr.message + contextStr);
                }
            }
        }
    }
}
