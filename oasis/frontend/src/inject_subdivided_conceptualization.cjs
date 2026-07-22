const fs = require('fs');
let content = fs.readFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx', 'utf8');

// 1. Add state variable
if (!content.includes('const [isGeneratingDynamicTraits, setIsGeneratingDynamicTraits] = useState(false);')) {
    content = content.replace(
        'const [isGeneratingKio, setIsGeneratingKio] = useState(false);',
        'const [isGeneratingKio, setIsGeneratingKio] = useState(false);\n    const [isGeneratingDynamicTraits, setIsGeneratingDynamicTraits] = useState(false);'
    );
}

// 2. Add generateDynamicTraits function
const genFunc = `
    const generateDynamicTraits = async () => {
        setIsGeneratingDynamicTraits(true);
        try {
            let activeKey = localStorage.getItem('oasis_deepseek_key') || '';
            if (!activeKey) {
                activeKey = atob('c2stZmI3N2RiMTIyNjM4NDdjOGI1N2E0ODI5Nzk3NmM4NzU=');
                if (activeKey.includes("07b18eb6601a4b11a109c96a56c92a16") || activeKey.includes("VAR>")) activeKey = '';
            }

            const rawPID = pidIndices?.raw || {};
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
Eres un analista clínico experto. Tu tarea es analizar los datos psicométricos y la historia del paciente para generar descripciones clínicas profundas y detalladas de sus malestares y rasgos de personalidad (PID-5).
Debes devolver ÚNICAMENTE un objeto JSON válido con las siguientes claves:
- "malestarCognitivo": Análisis profundo del malestar cognitivo (Dudas, rumiación, autocrítica).
- "malestarMotor": Análisis profundo del malestar motor (Evitaciones, conductas de escape).
- "malestarFisiologico": Análisis profundo del malestar fisiológico (Tensión, somatización).
- "pidReactividad": Análisis profundo de su Reactividad (Afectividad Negativa).
- "pidConexion": Análisis profundo de su Conexión (Desapego).
- "pidAsertividad": Análisis profundo de su Asertividad (Antagonismo).
- "pidRitmo": Análisis profundo de su Ritmo (Desinhibición).
- "pidSingularidad": Análisis profundo de su Singularidad (Psicoticismo).

DATOS DEL PACIENTE:
- Malestar Motor Bruto: \${rawM}
- Malestar Cognitivo Bruto: \${rawC}
- Malestar Fisiológico/Somático Bruto: \${rawS}
- Rasgos PID-5 en bruto: \${JSON.stringify(rawPID)}

RESPUESTAS EXISTENCIALES:
\${userResponsesText}
\`;

            const payload = {
                model: 'deepseek-chat',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.6,
                response_format: { type: "json_object" }
            };

            const res = await fetch(\`\${API_URL}/api/oasis/config/chat-completion\`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ endpoint: 'https://api.deepseek.com/chat/completions', key: activeKey, payload })
            });

            if (!res.ok) throw new Error("Network response was not ok");
            
            const data = await res.json();
            const aiContent = data.choices[0].message.content;
            
            handleTreatmentPlanChange('dynamicTraits', JSON.parse(aiContent));
        } catch (e) {
            console.error(e);
            alert("Error al generar análisis profundo: " + e.message);
        } finally {
            setIsGeneratingDynamicTraits(false);
        }
    };
`;

if (!content.includes('generateDynamicTraits = async () =>')) {
    content = content.replace(
        'const generateKioDirectives = async () => {',
        genFunc + '\n    const generateKioDirectives = async () => {'
    );
}

// 3. Add Auto-Generate Button
const btnUI = `
                {/* AUTO-GENERATE BUTTON */}
                <div className="flex justify-end mb-4">
                    <button
                        onClick={generateDynamicTraits}
                        disabled={isGeneratingDynamicTraits}
                        className="px-4 py-2 bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-widest rounded-lg border border-indigo-500/30 hover:bg-indigo-500/30 transition-all flex items-center gap-2"
                    >
                        {isGeneratingDynamicTraits ? (
                            <><Aperture className="w-4 h-4 animate-spin" /> Analizando Módulos...</>
                        ) : (
                            <><Sparkles className="w-4 h-4" /> Auto-Generar Análisis Profundo</>
                        )}
                    </button>
                </div>
`;

if (!content.includes('Analizando Módulos...')) {
    content = content.replace(
        '{/* 2. KPI / METRICS ROW */}',
        btnUI + '\n                {/* 2. KPI / METRICS ROW */}'
    );
}

// 4. Update the 3 Malestar Cards
// Card 1: Malestar Cognitivo
content = content.replace(
    '<p className="text-[11px] text-zinc-500 mt-2">Dudas, rumiación y autocrítica.</p>',
    `<details className="mt-2 group">
        <summary className="text-[11px] text-zinc-500 cursor-pointer list-none flex items-center gap-1 hover:text-zinc-300 transition-colors">
            <ChevronDown className="w-3 h-3 group-open:rotate-180 transition-transform" /> Dudas, rumiación y autocrítica...
        </summary>
        <div className="mt-2 text-xs text-zinc-300 leading-relaxed opacity-90 whitespace-pre-wrap pl-1 border-l border-white/10">
            {treatmentPlan?.dynamicTraits?.malestarCognitivo || 'Haz clic en "Auto-Generar Análisis Profundo" para obtener la redacción clínica.'}
        </div>
    </details>`
);

// Card 2: Malestar Motor
content = content.replace(
    '<p className="text-[11px] text-zinc-500 mt-2">Evitaciones y conductas de escape.</p>',
    `<details className="mt-2 group">
        <summary className="text-[11px] text-zinc-500 cursor-pointer list-none flex items-center gap-1 hover:text-zinc-300 transition-colors">
            <ChevronDown className="w-3 h-3 group-open:rotate-180 transition-transform" /> Evitaciones y conductas de escape...
        </summary>
        <div className="mt-2 text-xs text-zinc-300 leading-relaxed opacity-90 whitespace-pre-wrap pl-1 border-l border-white/10">
            {treatmentPlan?.dynamicTraits?.malestarMotor || 'Haz clic en "Auto-Generar Análisis Profundo" para obtener la redacción clínica.'}
        </div>
    </details>`
);

// Card 3: Malestar Fisiológico
content = content.replace(
    '<p className="text-[11px] text-zinc-500 mt-2">Tensión, insomnio y respuesta física.</p>',
    `<details className="mt-2 group">
        <summary className="text-[11px] text-zinc-500 cursor-pointer list-none flex items-center gap-1 hover:text-zinc-300 transition-colors">
            <ChevronDown className="w-3 h-3 group-open:rotate-180 transition-transform" /> Tensión, insomnio y respuesta física...
        </summary>
        <div className="mt-2 text-xs text-zinc-300 leading-relaxed opacity-90 whitespace-pre-wrap pl-1 border-l border-white/10">
            {treatmentPlan?.dynamicTraits?.malestarFisiologico || 'Haz clic en "Auto-Generar Análisis Profundo" para obtener la redacción clínica.'}
        </div>
    </details>`
);

// 5. Update the PID-5 Bars to include details
// We need to find the specific map render for the PID-5 traits.
const pidSectionTarget = `<span className="text-[8px] px-1.5 py-0.5 rounded bg-white/5 text-zinc-400 font-mono">{status.label}</span>`;
const pidSectionReplacement = `<span className="text-[8px] px-1.5 py-0.5 rounded bg-white/5 text-zinc-400 font-mono">{status.label}</span>
                                                        <span className={\`text-[10px] font-mono font-bold \${status.color.split(' ')[0]}\`}>{Math.round(score * 100)}%</span>
                                                    </div>
                                                </div>
                                                <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden mt-1.5 mb-2">
                                                    <div className={\`h-full \${status.fill} rounded-full transition-all duration-500\`} style={{ width: \`\${score * 100}%\` }} />
                                                </div>
                                                <details className="group">
                                                    <summary className="text-[9px] text-zinc-500 cursor-pointer list-none flex items-center gap-1 hover:text-zinc-300 transition-colors font-mono">
                                                        <ChevronDown className="w-3 h-3 group-open:rotate-180 transition-transform" /> Análisis Clínico
                                                    </summary>
                                                    <div className="mt-2 text-xs text-zinc-300 leading-relaxed opacity-90 whitespace-pre-wrap pl-1 border-l border-white/10">
                                                        {treatmentPlan?.dynamicTraits?.[
                                                            status.name === 'Reactividad' ? 'pidReactividad' : 
                                                            status.name === 'Conexión' ? 'pidConexion' :
                                                            status.name === 'Asertividad' ? 'pidAsertividad' :
                                                            status.name === 'Ritmo' ? 'pidRitmo' : 'pidSingularidad'
                                                        ] || 'Haz clic en "Auto-Generar Análisis Profundo" para obtener la redacción clínica.'}
                                                    </div>
                                                </details>
                                            </div>`;

// In order to not mess up the regex replace, we use a simple text slice replace.
const pidIdx = content.indexOf('<span className="text-[8px] px-1.5 py-0.5 rounded bg-white/5 text-zinc-400 font-mono">{status.label}</span>');
if (pidIdx !== -1 && !content.includes('Análisis Clínico</summary>')) {
    // Find the end of the div
    const endOfDiv = content.indexOf('</div>', content.indexOf('<div className="w-full h-1.5', pidIdx)) + 6;
    const replacementStr = content.substring(pidIdx, endOfDiv + 6); // roughly...
    
    // Instead of substring logic which is fragile, let's just replace the exact lines
    const oldPidBlock = `<span className="text-[8px] px-1.5 py-0.5 rounded bg-white/5 text-zinc-400 font-mono">{status.label}</span>
                                                        <span className={\`text-[10px] font-mono font-bold \${status.color.split(' ')[0]}\`}>{Math.round(score * 100)}%</span>
                                                    </div>
                                                </div>
                                                <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden mt-1.5">
                                                    <div className={\`h-full \${status.fill} rounded-full transition-all duration-500\`} style={{ width: \`\${score * 100}%\` }} />
                                                </div>`;
                                                
    content = content.replace(oldPidBlock, oldPidBlock.replace('mt-1.5">', 'mt-1.5 mb-2">') + `
                                                <details className="group mt-1">
                                                    <summary className="text-[9px] text-zinc-500 cursor-pointer list-none flex items-center gap-1 hover:text-zinc-300 transition-colors font-mono">
                                                        <ChevronDown className="w-3 h-3 group-open:rotate-180 transition-transform" /> Análisis Clínico
                                                    </summary>
                                                    <div className="mt-2 text-xs text-zinc-300 leading-relaxed opacity-90 whitespace-pre-wrap pl-1 border-l border-white/10">
                                                        {treatmentPlan?.dynamicTraits?.[
                                                            status.name === 'Reactividad' ? 'pidReactividad' : 
                                                            status.name === 'Conexión' ? 'pidConexion' :
                                                            status.name === 'Asertividad' ? 'pidAsertividad' :
                                                            status.name === 'Ritmo' ? 'pidRitmo' : 'pidSingularidad'
                                                        ] || 'Haz clic en "Auto-Generar Análisis Profundo" (arriba) para obtener la redacción clínica.'}
                                                    </div>
                                                </details>`);
}


fs.writeFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx', content);
console.log('Injected successfully');
