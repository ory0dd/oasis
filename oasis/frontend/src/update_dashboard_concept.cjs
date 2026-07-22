const fs = require('fs');
let content = fs.readFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx', 'utf8');

// 1. Add state variable
if (!content.includes('const [isGeneratingConceptualization, setIsGeneratingConceptualization] = useState(false);')) {
    content = content.replace(
        'const [isGeneratingKio, setIsGeneratingKio] = useState(false);',
        'const [isGeneratingKio, setIsGeneratingKio] = useState(false);\n    const [isGeneratingConceptualization, setIsGeneratingConceptualization] = useState(false);'
    );
}

// 2. Add generateConceptualization function
const genFunc = `
    const generateConceptualization = async () => {
        let activeKey = atob('c2stZmI3N2RiMTIyNjM4NDdjOGI1N2E0ODI5Nzk3NmM4NzU=');
        
        setIsGeneratingConceptualization(true);
        try {
            let userResponsesText = "Respuestas del usuario no encontradas.";
            if (responses) {
                userResponsesText = Object.entries(responses)
                    .map(([qId, r]) => {
                        const questionText = config?.cuestionario?.preguntas?.find(p => p.id === qId)?.texto || qId;
                        return \`Pregunta: \${questionText}\\nRespuesta: \${r}\`;
                    })
                    .join('\\n\\n');
            }

            const rawPID = pidIndices?.raw || {};
            const rawM = (rawPID['m1'] || 0) + (rawPID['m2'] || 0) + (rawPID['m3'] || 0);
            const rawC = (rawPID['c1'] || 0) + (rawPID['c2'] || 0) + (rawPID['c3'] || 0);
            const rawS = (rawPID['s1'] || 0) + (rawPID['s2'] || 0) + (rawPID['s3'] || 0);

            const prompt = \`
Eres un analista clínico conductual experto de nivel mundial.
Tu tarea es escribir una **Conceptualización Dinámica y Análisis Conductual Integrado** para el paciente basada en su Historia de Vida y sus resultados psicométricos.

MÉTODOLOGIA DE REFERENCIA (DEBES REDACTAR CON ESTA CALIDAD, ESTRUCTURA, PROFUNDIDAD Y TONO):
\\\"\\\"\\\"
II. CONCEPTUALIZACIÓN DINÁMICA Y ANÁLISIS CONDUCTUAL INTEGRADO
1. Mapeo Psicométrico de la Triple Modalidad Conductual
El análisis transdiagnóstico del caso arroja una severa desconexión entre la activación fisiológica y el procesamiento cognitivo, manifestado en los siguientes niveles de afectación:
Malestar Cognitivo (85% de Predominio): Representa el núcleo del estancamiento. Se manifiesta a través de dudas obsesivas, rumiación rígida sobre el pasado, autocrítica destructiva y una tendencia constante a la metacognición patológica.
Malestar Motor (65% de Frecuencia): Expresado en respuestas motoras de evitación, aislamiento social defensivo, procrastinación de proyectos y dependencia.
Malestar Fisiológico (40% de Activación): Expresado de forma somática mediante opresión en el pecho, cierre involuntario de puños, insomnio y una inquietud física generalizada.

2. Análisis del Rasgo PID-5 Central: El Ritmo (53% - Nivel Moderado)
La mente neurodivergente del paciente opera a través de procesos secuenciales encadenados de forma rígida...
En Disfunción: El ritmo genera bucles de memoria cerrados...
En Estabilidad (El Hackeo Clínico): Debido a su necesidad interna de orden y secuencia, el paciente encuentra un estabilizador natural cuando interactúa con estructuras externas predecibles.

3. El Núcleo de la Vulnerabilidad Existencial: La Identidad Privatizada por el "Otro"
El análisis funcional profundo revela que el paciente padece de una ausencia de anclaje interno...
\\\"\\\"\\\"

DATOS DEL PACIENTE:
- Malestar Motor Bruto: \${rawM}
- Malestar Cognitivo Bruto: \${rawC}
- Malestar Fisiológico/Somático Bruto: \${rawS}
- Rasgos PID-5 en bruto: \${JSON.stringify(rawPID)}

RESPUESTAS EXISTENCIALES:
\${userResponsesText}

Instrucciones Estrictas:
1. Adapta los porcentajes y el orden de la 'Triple Modalidad' según los valores brutos provistos.
2. Identifica su rasgo dominante en el PID-5 a partir de los datos y analiza cómo funciona 'En Disfunción' y 'En Estabilidad'.
3. Redacta 'El Núcleo de la Vulnerabilidad Existencial' descubriendo el porqué de sus heridas principales basándote en la historia que relata en sus respuestas existenciales.
4. Devuelve ÚNICAMENTE el texto markdown del análisis (sin título de presentación, solo a partir de 'II. CONCEPTUALIZACIÓN DINÁMICA Y ANÁLISIS CONDUCTUAL INTEGRADO' o el título principal equivalente).
\`;

            const payload = {
                model: 'deepseek-chat',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.6,
                max_tokens: 3000
            };

            const res = await fetch(\`\${API_URL}/api/oasis/config/chat-completion\`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ endpoint: 'https://api.deepseek.com/chat/completions', key: activeKey, payload })
            });

            if (!res.ok) throw new Error("Network response was not ok");
            
            const data = await res.json();
            const aiContent = data.choices[0].message.content;
            
            handleTreatmentPlanChange('dynamicConceptualization', aiContent.trim());
        } catch (e) {
            console.error(e);
            alert("Error al generar conceptualización dinámica.");
        } finally {
            setIsGeneratingConceptualization(false);
        }
    };
`;

if (!content.includes('generateConceptualization = async () =>')) {
    content = content.replace(
        'const generateKioDirectives = async () => {',
        genFunc + '\n    const generateKioDirectives = async () => {'
    );
}


// 3. Replace the static text section with the dynamic conceptualization UI
const staticTextStart = '<Brain size={14} /> Análisis de Correspondencia Funcional';
const idxStart = content.indexOf(staticTextStart);

if (idxStart !== -1) {
    // Find the enclosing div of the right column header
    const startReplace = content.lastIndexOf('<div className="col-span-3', idxStart);
    // Find the end of that column (the closing div before 'Nota: Los porcentajes representan')
    const endReplace = content.indexOf('<p className="text-[8px]', idxStart);
    
    if (startReplace !== -1 && endReplace !== -1) {
        const replacement = `
                                            <div className="col-span-3 flex flex-col gap-4">
                                                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                                    <h3 className="text-[9px] font-black uppercase tracking-widest text-indigo-400/80 flex items-center gap-1.5">
                                                        <Brain size={14} /> Conceptualización Dinámica y Análisis
                                                    </h3>
                                                    <button
                                                        onClick={generateConceptualization}
                                                        disabled={isGeneratingConceptualization}
                                                        className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[9px] font-black uppercase tracking-wider rounded border border-indigo-500/20 hover:bg-indigo-500/20 transition-all flex items-center gap-2"
                                                    >
                                                        {isGeneratingConceptualization ? (
                                                            <><Aperture className="w-3 h-3 animate-spin" /> Analizando...</>
                                                        ) : (
                                                            <><Sparkles className="w-3 h-3" /> Generar con IA</>
                                                        )}
                                                    </button>
                                                </div>
                                                <div className="flex-1">
                                                    <AutoResizeTextarea
                                                        value={treatmentPlan?.dynamicConceptualization || ''}
                                                        onChange={(e) => handleTreatmentPlanChange('dynamicConceptualization', e.target.value)}
                                                        placeholder="Haz clic en 'Generar con IA' para redactar el análisis funcional basado en la triple modalidad y los rasgos PID-5 del paciente..."
                                                        className="w-full h-full min-h-[400px] p-4 bg-black/40 border border-white/5 rounded-xl text-zinc-300 text-[11px] leading-relaxed font-sans focus:outline-none focus:border-indigo-500/30 focus:ring-1 focus:ring-indigo-500/30 transition-all resize-none"
                                                    />
                                                </div>
                                            </div>
        `;
        
        content = content.substring(0, startReplace) + replacement.trim() + '\n' + content.substring(endReplace);
    }
}

fs.writeFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx', content);
