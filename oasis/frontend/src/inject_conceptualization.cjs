const fs = require('fs');
let content = fs.readFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/PsychologistDashboard.jsx', 'utf8');

// 1. Add state variable
if (!content.includes('const [isGeneratingConceptualization, setIsGeneratingConceptualization] = useState(false);')) {
    content = content.replace(
        'const [isGeneratingTreatmentPlan, setIsGeneratingTreatmentPlan] = useState(false);',
        'const [isGeneratingTreatmentPlan, setIsGeneratingTreatmentPlan] = useState(false);\n    const [isGeneratingConceptualization, setIsGeneratingConceptualization] = useState(false);'
    );
}

// 2. Add generateConceptualization function
const genFunc = `
    const generateConceptualization = async () => {
        if (!selectedPatient) return;
        setIsGeneratingConceptualization(true);
        try {
            let activeKey = localStorage.getItem('oasis_deepseek_key') || '';
            if (!activeKey) {
                activeKey = atob('c2stZmI3N2RiMTIyNjM4NDdjOGI1N2E0ODI5Nzk3NmM4NzU=');
                if (activeKey.includes("07b18eb6601a4b11a109c96a56c92a16") || activeKey.includes("VAR>")) activeKey = '';
            }

            const rawPID = activePatientData?.pid5?.scores || {};
            const rawM = (rawPID['m1'] || 0) + (rawPID['m2'] || 0) + (rawPID['m3'] || 0);
            const rawC = (rawPID['c1'] || 0) + (rawPID['c2'] || 0) + (rawPID['c3'] || 0);
            const rawS = (rawPID['s1'] || 0) + (rawPID['s2'] || 0) + (rawPID['s3'] || 0);

            let userResponsesText = "Respuestas del usuario no encontradas.";
            if (activePatientData?.responses) {
                userResponsesText = Object.entries(activePatientData.responses)
                    .map(([qId, r]) => {
                        const questionText = config?.cuestionario?.preguntas?.find(p => p.id === qId)?.texto || qId;
                        return \`Pregunta: \${questionText}\\nRespuesta: \${r}\`;
                    })
                    .join('\\n\\n');
            }

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
            alert("Error al generar conceptualización dinámica: " + e.message);
        } finally {
            setIsGeneratingConceptualization(false);
        }
    };
`;

if (!content.includes('generateConceptualization = async () =>')) {
    content = content.replace(
        'const generateTreatmentPlan = async () => {',
        genFunc + '\n    const generateTreatmentPlan = async () => {'
    );
}

// 3. Add UI Block
const uiBlock = `
                        {/* CONCEPTUALIZACIÓN DINÁMICA (Auto-generada) */}
                        <div className="space-y-3 border-t border-white/5 pt-4 mb-8 mt-6">
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black uppercase text-indigo-400 tracking-wider block font-mono">Conceptualización Dinámica y Análisis Funcional Integrado</span>
                                <button
                                    onClick={generateConceptualization}
                                    disabled={isGeneratingConceptualization}
                                    className="px-3 py-1.5 bg-indigo-500/10 text-indigo-400 text-[9px] font-black uppercase tracking-widest rounded border border-indigo-500/20 hover:bg-indigo-500/20 transition-all flex items-center gap-2"
                                >
                                    {isGeneratingConceptualization ? (
                                        <><Aperture className="w-3 h-3 animate-spin" /> Analizando...</>
                                    ) : (
                                        <><Sparkles className="w-3 h-3" /> Auto-Generar PID-5 / Malestares</>
                                    )}
                                </button>
                            </div>
                            
                            <textarea
                                value={treatmentPlan?.dynamicConceptualization || ''}
                                onChange={(e) => handleTreatmentPlanChange('dynamicConceptualization', e.target.value)}
                                placeholder="Haz clic en 'Auto-Generar' para redactar el análisis funcional basado en la triple modalidad y los rasgos PID-5 del paciente..."
                                className="w-full h-[400px] bg-zinc-950 border border-indigo-500/20 rounded-xl p-4 text-xs md:text-sm text-zinc-300 leading-relaxed resize-y focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all font-sans outline-none placeholder:text-zinc-700 custom-sidebar-scroll"
                            />
                        </div>
`;

if (!content.includes('CONCEPTUALIZACIÓN DINÁMICA (Auto-generada)')) {
    content = content.replace(
        '{/* 4. ICAR-16 */}',
        uiBlock + '\n                        {/* 4. ICAR-16 */}'
    );
}

fs.writeFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/PsychologistDashboard.jsx', content);
console.log('Injected successfully');
