const fs = require('fs');
const filePath = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx';
let code = fs.readFileSync(filePath, 'utf8');

// Add state
const stateMarker = 'const [unlockedCount, setUnlockedCount] = useState(6);';
if (!code.includes('const [loopQuestionnaireStates, setLoopQuestionnaireStates]')) {
    code = code.replace(stateMarker, `${stateMarker}\n    const [loopQuestionnaireStates, setLoopQuestionnaireStates] = useState({});`);
}

// Ensure Check icon is imported
if (!code.includes('Check') && code.includes('import { ')) {
    code = code.replace('import { ', 'import { Check, ');
}

// Replace the accordion body with the questionnaire
const accordionRegex = /\{\/\* INLINE CONTENT WHEN EXPANDED \*\/\}[\s\S]*?\{isSelected && \([\s\S]*?<div className="mt-4 pt-4 border-t border-white\/10 animate-in fade-in duration-300 flex flex-col gap-3">[\s\S]*?<\/div>\s*\)\}/;

const newAccordionContent = `{/* INLINE CONTENT WHEN EXPANDED */}
    {isSelected && (() => {
        const qState = loopQuestionnaireStates[pat.id] || { currentStep: 0, answers: {} };
        const totalSteps = (pat.sortedNodes?.length || 0) + 1; // 1 step per node + 1 integration
        const isCompleted = qState.currentStep >= totalSteps;
        
        const typeQuestions = {
            historical: "¿Cómo se relaciona este nodo con tu historia o aprendizajes pasados?",
            biological: "¿Cómo se siente físicamente en tu cuerpo este impulso o sensación?",
            social: "¿De qué manera influye tu entorno social o relaciones en este punto?",
            cognitive: "¿Qué pensamiento exacto cruza por tu mente en este momento?",
            motor: "¿Qué acción concreta sueles realizar cuando estás en esta etapa?",
            physiological: "¿Qué cambios fisiológicos notas en ti aquí?",
            consequence: "¿Cuál es el resultado inmediato y a largo plazo de esta acción?"
        };

        let currentQuestionText = "";
        let currentNodeLabel = "";
        if (!isCompleted) {
            if (qState.currentStep < pat.sortedNodes?.length) {
                const node = pat.sortedNodes[qState.currentStep];
                currentQuestionText = typeQuestions[node.type] || "¿Qué reflexión te surge al pensar en este punto?";
                currentNodeLabel = node.label;
            } else {
                currentQuestionText = "¿Qué pequeña acción diferente podrías tomar la próxima vez que se active este bucle completo?";
                currentNodeLabel = "Integración del Bucle";
            }
        }

        return (
        <div className="mt-4 pt-4 border-t border-white/10 animate-in fade-in duration-300 flex flex-col gap-3" onClick={e => e.stopPropagation()}>
            {!isCompleted ? (
                <>
                    <div className="flex justify-between items-center px-1">
                        <span className="text-[9px] font-mono font-black uppercase tracking-wider text-zinc-400">Paso {qState.currentStep + 1} de {totalSteps}</span>
                        <div className="flex gap-1">
                            {Array.from({length: totalSteps}).map((_, i) => (
                                <div key={i} className={\`h-1.5 w-4 rounded-full transition-colors \${i === qState.currentStep ? 'bg-purple-500' : i < qState.currentStep ? 'bg-emerald-500' : 'bg-white/10'}\`}></div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col gap-2">
                        <span className="text-[10px] uppercase font-black tracking-wide text-purple-300">{currentNodeLabel}</span>
                        <p className="text-xs text-zinc-300 mb-2">{currentQuestionText}</p>
                        <textarea
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white placeholder-zinc-600 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 outline-none resize-none"
                            rows={3}
                            placeholder="Escribe tu reflexión aquí..."
                            value={qState.answers[qState.currentStep] || ''}
                            onChange={(e) => {
                                setLoopQuestionnaireStates(prev => ({
                                    ...prev,
                                    [pat.id]: {
                                        ...prev[pat.id],
                                        answers: {
                                            ...((prev[pat.id] || {}).answers || {}),
                                            [qState.currentStep]: e.target.value
                                        }
                                    }
                                }));
                            }}
                            onMouseDown={e => e.stopPropagation()}
                            onKeyDown={e => e.stopPropagation()}
                        />
                    </div>
                    
                    <div className="flex gap-2 mt-1">
                        {qState.currentStep > 0 && (
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setLoopQuestionnaireStates(prev => ({
                                        ...prev,
                                        [pat.id]: { ...prev[pat.id], currentStep: prev[pat.id].currentStep - 1 }
                                    }));
                                }}
                                className="flex-1 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-black uppercase tracking-widest transition-colors"
                            >
                                Atrás
                            </button>
                        )}
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                const isLast = qState.currentStep === totalSteps - 1;
                                
                                setLoopQuestionnaireStates(prev => ({
                                    ...prev,
                                    [pat.id]: { ...prev[pat.id], currentStep: prev[pat.id].currentStep + 1 }
                                }));

                                if (isLast) {
                                    // Bucle completado
                                    setUnlockedCount(prev => prev + 1);
                                    setRecentlyUnlocked(1);
                                    setShowUnlockNotification(true);
                                }
                            }}
                            disabled={!(qState.answers[qState.currentStep]?.trim().length > 0)}
                            className={\`flex-[2] py-2.5 rounded-lg text-white text-[10px] font-black uppercase tracking-widest transition-colors shadow-lg \${qState.answers[qState.currentStep]?.trim().length > 0 ? 'bg-purple-600 hover:bg-purple-500' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'}\`}
                        >
                            {qState.currentStep === totalSteps - 1 ? 'Completar y Desbloquear' : 'Siguiente'}
                        </button>
                    </div>
                </>
            ) : (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex flex-col items-center justify-center gap-3 text-center">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                        <Check size={20} className="text-emerald-400" />
                    </div>
                    <div>
                        <h5 className="text-[11px] font-black uppercase tracking-wider text-emerald-400 mb-1">¡Bucle Explorado!</h5>
                        <p className="text-[10px] text-zinc-300">Has completado tu reflexión guiada para este patrón conductual. Has desbloqueado el siguiente bucle en tu mapa.</p>
                    </div>
                </div>
            )}
        </div>
        );
    })()}`;

code = code.replace(accordionRegex, newAccordionContent);
fs.writeFileSync(filePath, code);
console.log('Successfully updated the code for the interactive questionnaire.');
