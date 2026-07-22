const fs = require('fs');
let code = fs.readFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx', 'utf8');

// 1. Add getExitKeysText helper
const helperStr = `
    const getExitKeysText = () => {
        try {
            const storedNotes = localStorage.getItem(\`oasis_clinician_notes_\${user}\`);
            if (storedNotes) {
                const notesObj = JSON.parse(storedNotes);
                if (notesObj.func_exit_keys && notesObj.func_exit_keys.trim()) {
                    return notesObj.func_exit_keys;
                }
            }
        } catch (e) {}
        
        return afcData?.claves_salida || (
            afcData?.hypotheses?.solucion
                ? \`\${afcData.hypotheses.solucion}. Explora el mapa para identificar qué pensamientos o conductas puedes empezar a flexibilizar.\`
                : "Procesando datos..."
        );
    };
`;

if (!code.includes('getExitKeysText')) {
    code = code.replace(
        'const currentPatterns = useMemo(() => {',
        helperStr + '\n    const currentPatterns = useMemo(() => {'
    );
}

// 2. Fix Resumen Clinico formatting
code = code.replace(
    `                                                        {(afcData?.explicacion_sencilla || (
                                                            afcData?.hypotheses?.mantenimiento
                                                                ? "Tu mente y cuerpo han creado un patrón automático: cuando enfrentas tensiones de tu entorno o recuerdos de tu historia, reaccionas con ciertos pensamientos y conductas de protección. Aunque esto te da alivio inmediato, a largo plazo refuerza y mantiene el problema en el tiempo, impidiéndote avanzar."
                                                                : "Procesando datos..."
                                                        )).split('\\n').map((paragraph, idx) => {`,
    `                                                        {(afcData?.explicacion_sencilla || (
                                                            afcData?.hypotheses?.mantenimiento
                                                                ? "Tu mente y cuerpo han creado un patrón automático: cuando enfrentas tensiones de tu entorno o recuerdos de tu historia, reaccionas con ciertos pensamientos y conductas de protección. Aunque esto te da alivio inmediato, a largo plazo refuerza y mantiene el problema en el tiempo, impidiéndote avanzar."
                                                                : "Procesando datos..."
                                                        )).replace(/\\.\\s+/g, '.\\n\\n').split('\\n').map((paragraph, idx) => {`
);

code = code.replace(
    `<p key={idx} className={idx === 0 ? "text-zinc-100 text-base md:text-xl font-normal leading-relaxed" : "text-zinc-400 leading-relaxed"}>`,
    `<p key={idx} className={idx === 0 ? "text-zinc-100 text-sm md:text-base font-normal leading-relaxed" : "text-zinc-400 text-sm md:text-base leading-relaxed"}>`
);

// 3. Fix Claves rendering to use getExitKeysText()
code = code.replace(
    `                                                        {(afcData?.claves_salida || (
                                                            afcData?.hypotheses?.solucion
                                                                ? \`\${afcData.hypotheses.solucion}. Explora el mapa para identificar qué pensamientos o conductas puedes empezar a flexibilizar.\`
                                                                : "Procesando datos..."
                                                        )).split('\\n').map((paragraph, idx) => {`,
    `                                                        {getExitKeysText().split('\\n').map((paragraph, idx) => {`
);

code = code.replace(
    `<p className={idx === 0 ? "text-white text-xl md:text-3xl font-bold leading-normal" : "text-zinc-400 leading-relaxed"}>`,
    `<p className={idx === 0 ? "text-emerald-50 text-base md:text-xl font-bold leading-normal" : "text-zinc-300 text-sm md:text-base leading-relaxed"}>`
);

fs.writeFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx', code);
console.log("SUCCESS");
