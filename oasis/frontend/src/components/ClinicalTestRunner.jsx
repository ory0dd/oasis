import React, { useState, useEffect } from 'react';
import { 
    Check, ArrowRight, ArrowLeft, X, Save, AlertTriangle, 
    Sparkles, ShieldCheck, Activity, Brain, Clock, ChevronRight, ChevronDown,
    RotateCcw, Award, FileText, HelpCircle, Info, ListChecks,
    TrendingUp, BookOpen
} from 'lucide-react';
import { CLINICAL_TESTS } from '../data/clinicalTestsBank';
import { API_URL, syncTestResultToCloud, getSavedTestResult } from '../utils/api';

export function ClinicalTestRunner({
    testId = 'bai',
    patientName = 'Paciente',
    onClose,
    onSave,
    readOnly = false,
    initialInformante = 'adolescente'
}) {
    const test = CLINICAL_TESTS[testId] || CLINICAL_TESTS.bai;

    const [selectedInformante, setSelectedInformante] = useState(initialInformante); // 'adolescente' | 'madre'
    const [introTab, setIntroTab] = useState('COMO_RESPONDER'); // 'COMO_RESPONDER' | 'COMO_FUNCIONA' | 'FICHA'
    const [showHelpModal, setShowHelpModal] = useState(false);
    const [showAnswersBreakdown, setShowAnswersBreakdown] = useState(true);
    
    // Load any existing saved result for this patient and test
    const getStorageKey = (inf = selectedInformante) => {
        if (test.id === 'sdq') {
            return `oasis_test_result_${patientName}_${test.id}_${inf}`;
        }
        return `oasis_test_result_${patientName}_${test.id}`;
    };

    const loadSavedResult = (inf = selectedInformante) => {
        return getSavedTestResult(patientName, test.id, test.id === 'sdq' ? inf : null);
    };

    const [existingResult, setExistingResult] = useState(() => loadSavedResult(initialInformante));

    const [step, setStep] = useState(existingResult ? 'results' : 'intro'); // 'intro' | 'running' | 'results'
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState(() => existingResult?.rawAnswers || {});
    const [calculatedResult, setCalculatedResult] = useState(existingResult || null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Sync when testId or initialInformante changes
    useEffect(() => {
        if (initialInformante) {
            setSelectedInformante(initialInformante);
        }
        const saved = loadSavedResult(initialInformante);
        if (saved) {
            setExistingResult(saved);
            setCalculatedResult(saved);
            setAnswers(saved.rawAnswers || {});
            setStep('results');
        } else {
            setExistingResult(null);
            setCalculatedResult(null);
            setAnswers({});
            setStep('intro');
        }
    }, [testId, initialInformante, patientName]);

    const handleSwitchResultInformante = (newInf) => {
        setSelectedInformante(newInf);
        const saved = getSavedTestResult(patientName, test.id, test.id === 'sdq' ? newInf : null);
        if (saved) {
            setCalculatedResult(saved);
            setAnswers(saved.rawAnswers || {});
            setStep('results');
        } else {
            setAnswers({});
            setCalculatedResult(null);
            setStep('intro');
        }
    };

    const isParentPerspective = test.id === 'sdq' && selectedInformante === 'madre';
    const currentItem = test.items[currentIndex];
    const totalItems = test.items.length;
    const answeredCount = Object.keys(answers).length;
    const isCurrentAnswered = answers[currentItem?.id] !== undefined;
    const progressPercent = Math.round(((currentIndex + 1) / totalItems) * 100);

    const handleSelectOption = (value) => {
        const updated = { ...answers, [currentItem.id]: value };
        setAnswers(updated);

        // Auto-advance after small feedback delay
        setTimeout(() => {
            if (currentIndex < totalItems - 1) {
                setCurrentIndex(prev => prev + 1);
            } else {
                finishEvaluation(updated);
            }
        }, 180);
    };

    const finishEvaluation = (finalAnswers = answers) => {
        const result = test.calcularResultado(finalAnswers, selectedInformante);
        const payload = {
            ...result,
            patientName,
            testId: test.id,
            informante: test.id === 'sdq' ? selectedInformante : undefined,
            completedAt: new Date().toISOString(),
            dateFormatted: new Date().toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            rawAnswers: finalAnswers
        };
        setCalculatedResult(payload);
        setStep('results');

        // Auto-save immediately to localStorage AND sync to cloud
        syncTestResultToCloud(patientName, test.id, payload, test.id === 'sdq' ? selectedInformante : null);
        if (onSave) {
            onSave(payload);
        }
    };

    const handleSaveToRecord = async () => {
        if (!calculatedResult) return;
        setIsSaving(true);

        try {
            await syncTestResultToCloud(
                patientName, 
                test.id, 
                calculatedResult, 
                test.id === 'sdq' ? selectedInformante : null
            );

            setSaveSuccess(true);
            if (onSave) {
                onSave(calculatedResult);
            }
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (e) {
            console.error("Error saving clinical evaluation:", e);
        } finally {
            setIsSaving(false);
        }
    };

    const handleRestart = () => {
        setAnswers({});
        setCurrentIndex(0);
        setCalculatedResult(null);
        setStep('running');
    };

    // Helper for severity color classes
    const getSeverityBadgeClasses = (color) => {
        switch (color) {
            case 'emerald':
                return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
            case 'yellow':
                return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
            case 'amber':
                return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
            case 'orange':
                return 'bg-orange-500/10 border-orange-500/30 text-orange-400';
            case 'rose':
            default:
                return 'bg-rose-500/10 border-rose-500/30 text-rose-400';
        }
    };

    return (
        <div className="fixed inset-0 z-[3500] bg-black/75 backdrop-blur-md overflow-y-auto flex flex-col justify-center items-center p-3 sm:p-6 font-sans text-zinc-100 select-none animate-in fade-in duration-300">
            <div className="w-full max-w-2xl bg-[#09090b] border border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl relative overflow-hidden flex flex-col max-h-[92vh]">
                
                {/* Ambient glow accent */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/5 blur-[90px] pointer-events-none rounded-full" />
                <div className="absolute bottom-0 left-0 w-60 h-60 bg-emerald-500/5 blur-[80px] pointer-events-none rounded-full" />

                {/* Top header */}
                <div className="p-4 sm:p-5 border-b border-white/5 flex items-center justify-between relative z-10 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                            <Activity size={18} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-400">
                                    {test.siglas} • {test.area}
                                </span>
                                <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                    α = {test.alphaCronbach}
                                </span>
                            </div>
                            <h3 className="text-sm sm:text-base font-black text-white leading-tight mt-0.5">
                                {test.nombre}
                            </h3>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/5 transition-all"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Body Content by Step */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-8 relative z-10 custom-scroll">
                    {/* STEP 1: INTRO */}
                    {step === 'intro' && (
                        <div className="space-y-5 animate-in fade-in duration-300">
                            {/* Top Summary Card */}
                            <div className="p-4 rounded-2xl bg-zinc-950/60 border border-white/5 space-y-2">
                                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                                    <div className="flex items-center gap-2">
                                        <span className="text-zinc-400">Consultante:</span>
                                        <span className="font-bold text-white uppercase tracking-wider">@{patientName}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-zinc-400">Extensión:</span>
                                        <span className="text-purple-300 font-bold">{test.items.length} reactivos ({test.duracionAprox})</span>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono pt-1 border-t border-white/5">
                                    <div className="flex items-center gap-2">
                                        <span className="text-zinc-400">Población:</span>
                                        <span className="text-zinc-300">{test.poblacion}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-emerald-400 font-bold">
                                        <ShieldCheck size={12} />
                                        <span>α = {test.alphaCronbach} (Alta Confiabilidad)</span>
                                    </div>
                                </div>
                            </div>

                            {/* Informante Selector for Multi-Informant Tests (SDQ) */}
                            {test.informantesDisponibles && (
                                <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/25 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-purple-300 block">
                                            ¿Quién está respondiendo esta evaluación?
                                        </label>
                                        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">
                                            Multi-informante
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {test.informantesDisponibles.map(inf => (
                                            <button
                                                key={inf.id}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedInformante(inf.id);
                                                    const raw = localStorage.getItem(getStorageKey(inf.id));
                                                    if (raw) {
                                                        try {
                                                            const parsed = JSON.parse(raw);
                                                            setAnswers(parsed.rawAnswers || {});
                                                            setCalculatedResult(parsed);
                                                        } catch(e) {}
                                                    } else {
                                                        setAnswers({});
                                                        setCalculatedResult(null);
                                                    }
                                                }}
                                                className={`py-2.5 px-3 rounded-xl text-xs font-mono font-bold transition-all border ${
                                                    selectedInformante === inf.id
                                                        ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/30'
                                                        : 'bg-zinc-950/60 hover:bg-zinc-900 text-zinc-400 border-white/5'
                                                }`}
                                            >
                                                {inf.label}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-[11px] text-zinc-300 font-sans leading-relaxed">
                                        {selectedInformante === 'madre'
                                            ? (test.comoSeResponde?.perspectivaDual?.madre || 'Los reactivos se adaptan para que la madre o tutor responda sobre la conducta observada en el hogar y la escuela.')
                                            : (test.comoSeResponde?.perspectivaDual?.adolescente || 'Los reactivos se presentan en primera persona para que el adolescente exprese directamente su vivencia subjetiva y sus relaciones.')}
                                    </p>
                                </div>
                            )}

                            {/* Didactic Navigation Tabs */}
                            <div className="flex items-center gap-1.5 p-1 bg-zinc-950/80 rounded-xl border border-white/5">
                                <button
                                    type="button"
                                    onClick={() => setIntroTab('COMO_RESPONDER')}
                                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 ${
                                        introTab === 'COMO_RESPONDER'
                                            ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                                    }`}
                                >
                                    <ListChecks size={13} />
                                    <span>¿Cómo se responde?</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIntroTab('COMO_FUNCIONA')}
                                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 ${
                                        introTab === 'COMO_FUNCIONA'
                                            ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                                    }`}
                                >
                                    <Brain size={13} />
                                    <span>¿Cómo funciona?</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIntroTab('FICHA')}
                                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 ${
                                        introTab === 'FICHA'
                                            ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                                    }`}
                                >
                                    <Award size={13} />
                                    <span>Ficha Psicométrica</span>
                                </button>
                            </div>

                            {/* TAB 1: ¿CÓMO SE RESPONDE? */}
                            {introTab === 'COMO_RESPONDER' && (
                                <div className="space-y-4 animate-in fade-in duration-200">
                                    {/* Marco Temporal Banner */}
                                    <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/25 flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0 mt-0.5">
                                            <Clock size={16} />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-300 block">
                                                Marco Temporal a Evaluar:
                                            </span>
                                            <h4 className="text-sm font-bold text-white mt-0.5">
                                                "{test.comoSeResponde?.marcoTemporal || test.marcoTemporal || 'Período reciente'}"
                                            </h4>
                                            <p className="text-xs text-zinc-300 mt-1 font-sans leading-relaxed">
                                                {test.comoSeResponde?.instruccionPrincipal || test.instrucciones}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Scale Detailed Breakdown */}
                                    <div className="space-y-2.5">
                                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                                            <ListChecks size={13} className="text-purple-400" />
                                            Guía de la Escala de Respuesta:
                                        </span>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                            {(test.comoSeResponde?.escalaDetallada || test.escala.map(e => ({ valor: e.value, etiqueta: e.label, queSignifica: e.desc, ejemplo: '' }))).map((opt, i) => (
                                                <div key={i} className="p-3 rounded-xl bg-zinc-950/60 border border-white/5 space-y-1 hover:border-purple-500/20 transition-all">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold text-white">
                                                            {opt.etiqueta || opt.valor}
                                                        </span>
                                                        <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-mono font-bold flex items-center justify-center border border-purple-500/30">
                                                            {opt.valor}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-zinc-300 font-sans leading-relaxed">
                                                        {opt.queSignifica}
                                                    </p>
                                                    {opt.ejemplo && (
                                                        <p className="text-[10px] text-purple-300/80 font-sans italic border-t border-white/5 pt-1 mt-1">
                                                            💡 Ej: {opt.ejemplo}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Advice for answering */}
                                    {test.comoSeResponde?.consejos && (
                                        <div className="p-4 rounded-xl bg-zinc-950/40 border border-white/5 space-y-2">
                                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block">
                                                Recomendaciones para contestar:
                                            </span>
                                            <ul className="space-y-1.5 text-xs text-zinc-300 font-sans">
                                                {test.comoSeResponde.consejos.map((tip, idx) => (
                                                    <li key={idx} className="flex items-start gap-2">
                                                        <span className="text-purple-400 font-bold shrink-0">•</span>
                                                        <span>{tip}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TAB 2: ¿CÓMO FUNCIONA LA PRUEBA? */}
                            {introTab === 'COMO_FUNCIONA' && (
                                <div className="space-y-4 animate-in fade-in duration-200">
                                    <div className="p-4 rounded-2xl bg-zinc-950/60 border border-white/5 space-y-2">
                                        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                                            <Brain size={14} /> Propósito Clínico
                                        </h4>
                                        <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed font-sans">
                                            {test.comoFunciona?.proposito || test.descripcion}
                                        </p>
                                        <div className="pt-2 border-t border-white/5">
                                            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">¿Qué evalúa exactamente?</span>
                                            <p className="text-xs text-zinc-300 mt-0.5 font-sans leading-relaxed">
                                                {test.comoFunciona?.queMide || test.descripcion}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-2xl bg-zinc-950/60 border border-white/5 space-y-2">
                                        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                                            <TrendingUp size={14} /> Mecanismo de Puntuación
                                        </h4>
                                        <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                                            {test.comoFunciona?.mecanismoPuntuacion || 'Suma directa de los reactivos respondidos.'}
                                        </p>
                                    </div>

                                    {test.comoFunciona?.subescalas && (
                                        <div className="p-4 rounded-2xl bg-zinc-950/60 border border-white/5 space-y-2">
                                            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
                                                Subescalas / Dimensiones Evaluadas ({test.comoFunciona.subescalas.length})
                                            </h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {test.comoFunciona.subescalas.map((s, idx) => (
                                                    <div key={idx} className="px-3 py-1.5 rounded-lg bg-white/5 text-[11px] font-mono text-zinc-300">
                                                        • {s}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
                                            Baremos y Niveles de Gravedad Clínica
                                        </h4>
                                        <div className="space-y-2">
                                            {(test.comoFunciona?.puntosDeCorte || test.baremos.map(b => ({ rango: `${b.min} - ${b.max} pts`, nivel: b.nivel, interpretacion: b.desc, color: b.color }))).map((pc, idx) => (
                                                <div key={idx} className="p-3 rounded-xl bg-zinc-950/60 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${getSeverityBadgeClasses(pc.color)}`}>
                                                            {pc.nivel}
                                                        </span>
                                                        <span className="text-xs font-mono font-bold text-white">{pc.rango}</span>
                                                    </div>
                                                    <p className="text-[11px] text-zinc-400 font-sans sm:max-w-xs sm:text-right">
                                                        {pc.interpretacion}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {test.comoFunciona?.utilidadClinica && (
                                        <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-zinc-300 leading-relaxed font-sans">
                                            <strong className="text-[10px] font-mono uppercase text-emerald-400 block mb-1">
                                                Utilidad en Consulta y Formulación de Caso:
                                            </strong>
                                            {test.comoFunciona.utilidadClinica}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TAB 3: FICHA PSICOMÉTRICA */}
                            {introTab === 'FICHA' && (
                                <div className="space-y-3 animate-in fade-in duration-200">
                                    <div className="p-4 rounded-2xl bg-zinc-950/60 border border-white/5 space-y-3 font-mono text-xs">
                                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                            <span className="text-zinc-400">Instrumento:</span>
                                            <span className="font-bold text-white">{test.nombre} ({test.siglas})</span>
                                        </div>
                                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                            <span className="text-zinc-400">Área de Evaluación:</span>
                                            <span className="text-purple-300">{test.area}</span>
                                        </div>
                                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                            <span className="text-zinc-400">Población Diana:</span>
                                            <span className="text-zinc-200">{test.poblacion}</span>
                                        </div>
                                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                            <span className="text-zinc-400">Consistencia Interna:</span>
                                            <span className="text-emerald-400 font-bold">Alfa de Cronbach α = {test.alphaCronbach}</span>
                                        </div>
                                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                            <span className="text-zinc-400">Tiempo de Aplicación:</span>
                                            <span className="text-zinc-300">{test.duracionAprox}</span>
                                        </div>
                                        <div className="flex flex-col gap-1 pt-1">
                                            <span className="text-zinc-400">Referencia Bibliográfica:</span>
                                            <span className="text-zinc-400 italic text-[11px] leading-relaxed">{test.referencia}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Bottom Call to Action */}
                            <div className="pt-3 flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={() => setStep('running')}
                                    className="flex-1 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20"
                                >
                                    <span>Comenzar Cuestionario ({test.items.length} Reactivos)</span>
                                    <ArrowRight size={14} />
                                </button>
                                {existingResult && (
                                    <button
                                        onClick={() => setStep('results')}
                                        className="py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-mono text-xs font-bold uppercase tracking-wider border border-white/5 transition-all"
                                    >
                                        Ver Último Resultado ({existingResult.dateFormatted || 'Previo'})
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* STEP 2: RUNNING QUESTIONS */}
                    {step === 'running' && currentItem && (
                        <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                            {/* Persistent Frame Banner */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <Clock size={14} className="text-purple-400 shrink-0" />
                                    <span className="text-[10px] font-mono uppercase tracking-wider text-purple-300 font-bold shrink-0">Marco:</span>
                                    <span className="text-xs font-medium text-white truncate">
                                        "{test.comoSeResponde?.marcoTemporal || test.marcoTemporal || 'Período reciente'}"
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => setShowHelpModal(true)}
                                        className="px-2.5 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/30 text-purple-200 font-mono text-[10px] font-bold flex items-center gap-1 transition-all"
                                    >
                                        <HelpCircle size={12} />
                                        <span>¿Cómo responder?</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStep('intro')}
                                        className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 font-mono text-[10px] transition-all"
                                        title="Pausar y revisar metodología sin perder avances"
                                    >
                                        Instrucciones
                                    </button>
                                </div>
                            </div>

                            {/* Question progress and subscale */}
                            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                                    Reactivo {currentIndex + 1} de {totalItems}
                                </span>
                                <div className="flex items-center gap-2">
                                    {isParentPerspective && (
                                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[9px] font-mono font-bold uppercase tracking-wider text-amber-300">
                                            Madre / Familia
                                        </span>
                                    )}
                                    {currentItem.subscale && (
                                        <span className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[9px] font-mono font-bold uppercase tracking-wider text-purple-300">
                                            {currentItem.subscale}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Item Text */}
                            <div className="py-2">
                                <h2 className="text-base sm:text-xl font-medium text-white leading-snug">
                                    "{isParentPerspective && currentItem.textParent ? currentItem.textParent : currentItem.text}"
                                </h2>
                            </div>

                            {/* Options Scale */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                                {((currentItem.options && currentItem.options.length > 0) ? currentItem.options : test.escala).map(opt => {
                                    const isSelected = answers[currentItem.id] === opt.value;
                                    return (
                                        <button
                                            key={opt.value}
                                            onClick={() => handleSelectOption(opt.value)}
                                            className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all relative ${
                                                isSelected
                                                    ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/30 scale-[1.01]'
                                                    : 'bg-zinc-950/60 hover:bg-zinc-900 border-white/10 hover:border-purple-500/40 text-zinc-300'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between w-full">
                                                <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-zinc-200'}`}>
                                                    {opt.label}
                                                </span>
                                                {isSelected && <Check size={14} className="text-white shrink-0 ml-2" />}
                                            </div>
                                            {opt.desc && (
                                                <span className={`text-[10px] mt-1 leading-normal ${isSelected ? 'text-purple-100' : 'text-zinc-500'}`}>
                                                    {opt.desc}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Nav buttons */}
                            <div className="pt-4 flex items-center justify-between border-t border-white/5">
                                <button
                                    onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                                    disabled={currentIndex === 0}
                                    className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-zinc-300 font-mono text-xs flex items-center gap-1.5 transition-all"
                                >
                                    <ArrowLeft size={13} />
                                    <span>Anterior</span>
                                </button>

                                <span className="text-[10px] font-mono text-zinc-500">
                                    {answeredCount} de {totalItems} respondidos
                                </span>

                                {currentIndex < totalItems - 1 ? (
                                    <button
                                        onClick={() => setCurrentIndex(prev => prev + 1)}
                                        disabled={!isCurrentAnswered}
                                        className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-30 disabled:pointer-events-none text-white font-mono text-xs font-bold flex items-center gap-1.5 transition-all"
                                    >
                                        <span>Siguiente</span>
                                        <ArrowRight size={13} />
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => finishEvaluation()}
                                        disabled={answeredCount < totalItems}
                                        className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:pointer-events-none text-black font-mono text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all"
                                    >
                                        <Check size={14} />
                                        <span>Calcular Resultado</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* STEP 3: RESULTS AND SCORING */}
                    {step === 'results' && calculatedResult && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            {/* Urgent Clinical Alert for C-SSRS */}
                            {calculatedResult.alertaUrgente && (
                                <div className="p-4 rounded-2xl bg-rose-500/15 border-2 border-rose-500/40 text-rose-200 flex items-start gap-3 animate-pulse">
                                    <AlertTriangle size={24} className="text-rose-400 shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="font-bold text-sm text-white uppercase tracking-wider">
                                            Alerta Clínica Prioritaria: Riesgo Suicida Elevado
                                        </h4>
                                        <p className="text-xs mt-1 text-rose-200 leading-relaxed font-sans">
                                            El cribado ha detectado ideación activa, intención, métodos o antecedentes de conducta. Es imperativo activar de inmediato el protocolo de seguridad clínica, realizar la entrevista en profundidad y asegurar supervisión directa por adultos responsables.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Score Card Banner */}
                            <div className="p-5 rounded-2xl bg-zinc-950 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-500">
                                            Puntuación Total Obtenida
                                        </span>
                                        {calculatedResult.informante && (
                                            <span className="px-2 py-0.5 rounded bg-purple-500/15 border border-purple-500/30 text-[9px] font-mono font-bold text-purple-300 uppercase">
                                                {calculatedResult.informante === 'madre' ? 'Perspectiva Madre' : 'Autoinforme Adolescente'}
                                            </span>
                                        )}
                                        {test.id === 'sdq' && (
                                            <div className="flex items-center gap-1 bg-zinc-900/80 p-0.5 rounded-lg border border-white/5">
                                                <button
                                                    type="button"
                                                    onClick={() => handleSwitchResultInformante('adolescente')}
                                                    className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase transition-all ${
                                                        (calculatedResult.informante || selectedInformante) === 'adolescente'
                                                            ? 'bg-purple-600 text-white shadow-sm'
                                                            : 'text-zinc-400 hover:text-white'
                                                    }`}
                                                >
                                                    Adolescente
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleSwitchResultInformante('madre')}
                                                    className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase transition-all ${
                                                        (calculatedResult.informante || selectedInformante) === 'madre'
                                                            ? 'bg-purple-600 text-white shadow-sm'
                                                            : 'text-zinc-400 hover:text-white'
                                                    }`}
                                                >
                                                    Madre
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-baseline gap-2 mt-0.5">
                                        <span className="text-3xl sm:text-4xl font-black text-white font-mono">
                                            {calculatedResult.totalScore}
                                        </span>
                                        <span className="text-xs font-mono text-zinc-500">
                                            / {calculatedResult.maxScore} pts
                                        </span>
                                    </div>
                                </div>

                                <div className={`px-3.5 py-1.5 rounded-xl border font-mono font-black text-xs uppercase tracking-wider ${getSeverityBadgeClasses(calculatedResult.color)}`}>
                                    {calculatedResult.nivel}
                                </div>
                            </div>

                            {/* Clinical Interpretation */}
                            <div className="p-4 rounded-2xl bg-zinc-950/70 border border-white/5 space-y-2">
                                <h4 className="text-[10px] font-mono uppercase tracking-wider text-purple-300 font-bold flex items-center gap-1.5">
                                    <ShieldCheck size={13} /> Interpretación Psicométrica Clínica
                                </h4>
                                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
                                    {calculatedResult.interpretacion}
                                </p>
                            </div>

                            {/* Detailed calculation explanation */}
                            <div className="p-4 rounded-2xl bg-zinc-950/70 border border-white/5 space-y-2">
                                <h4 className="text-[10px] font-mono uppercase tracking-wider text-purple-300 font-bold flex items-center gap-1.5">
                                    <TrendingUp size={13} /> ¿Cómo se calculó y qué implica este resultado?
                                </h4>
                                <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                                    {test.comoFunciona?.mecanismoPuntuacion || 'El puntaje se obtiene sumando los reactivos respondidos según el baremo estandarizado.'}
                                </p>
                                {test.comoFunciona?.utilidadClinica && (
                                    <p className="text-xs text-zinc-400 pt-1 border-t border-white/5 font-sans leading-relaxed">
                                        <strong className="text-zinc-300">Pauta clínica:</strong> {test.comoFunciona.utilidadClinica}
                                    </p>
                                )}
                            </div>

                            {/* Subscale breakdown if exists */}
                            {calculatedResult.subescalas && Object.keys(calculatedResult.subescalas).length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
                                        Desglose por Subescalas
                                    </h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {Object.entries(calculatedResult.subescalas).map(([sub, score]) => (
                                            <div key={sub} className="p-2.5 rounded-xl bg-zinc-900/60 border border-white/5 flex items-center justify-between">
                                                <span className="text-[10px] text-zinc-400 font-mono truncate">{sub}</span>
                                                <span className="text-xs font-bold text-white font-mono">{score} pts</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Item-by-Item Answers Breakdown */}
                            <div className="rounded-2xl border border-white/10 bg-zinc-950/70 overflow-hidden shadow-lg">
                                <button
                                    type="button"
                                    onClick={() => setShowAnswersBreakdown(prev => !prev)}
                                    className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors text-left"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-7 h-7 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                                            <ListChecks size={15} />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                                                <span>Respuestas Detalladas del Consultante</span>
                                                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-bold lowercase">
                                                    reactivo por reactivo
                                                </span>
                                            </h4>
                                            <p className="text-[10px] text-zinc-400 font-sans mt-0.5">
                                                Revisa las alternativas exactas y puntajes marcados por {patientName} en cada una de las {test.items.length} preguntas
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                                            {Object.keys(calculatedResult.rawAnswers || answers || {}).length} / {test.items.length} respondidos
                                        </span>
                                        <ChevronDown size={15} className={`text-zinc-400 transition-transform duration-200 ${showAnswersBreakdown ? 'rotate-180' : ''}`} />
                                    </div>
                                </button>

                                {showAnswersBreakdown && (
                                    <div className="p-4 pt-0 border-t border-white/5 space-y-2.5 max-h-[460px] overflow-y-auto">
                                        {Object.keys(calculatedResult.rawAnswers || answers || {}).length === 0 ? (
                                            <div className="p-4 text-center text-zinc-500 font-mono text-xs">
                                                No se encontraron respuestas archivadas reactivo por reactivo para esta versión. Haz clic en "Reaplicar" para contestar y guardar todas las respuestas.
                                            </div>
                                        ) : (
                                            test.items.map((item, idx) => {
                                                const currentAnswersMap = calculatedResult.rawAnswers || answers || {};
                                                const userVal = currentAnswersMap[item.id];
                                                const isParent = test.id === 'sdq' && (calculatedResult.informante || selectedInformante) === 'madre';
                                                const itemText = (isParent && item.textParent) ? item.textParent : item.text;
                                                const optionsList = (item.options && item.options.length > 0) ? item.options : (test.escala || []);
                                                const chosenOption = optionsList.find(opt => opt.value === userVal);
                                                const isAnswered = userVal !== undefined;

                                                const isAlertItem = (
                                                    (test.id === 'cssrs' && userVal > 0) ||
                                                    (test.id === 'cdi2' && item.id === 8 && userVal > 0) ||
                                                    (test.id === 'phq9' && item.id === 9 && userVal > 0) ||
                                                    (item.critical && userVal > 0)
                                                );

                                                return (
                                                    <div 
                                                        key={item.id || idx} 
                                                        className={`p-3 rounded-xl border transition-all text-xs ${
                                                            isAnswered 
                                                                ? (isAlertItem
                                                                    ? 'bg-rose-500/10 border-rose-500/30 shadow-sm shadow-rose-500/10' 
                                                                    : 'bg-zinc-900/60 border-white/5') 
                                                                : 'bg-zinc-900/20 border-white/5 opacity-60'
                                                        }`}
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="space-y-1 flex-1">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <span className="text-[10px] font-mono font-bold text-zinc-400">
                                                                        #{idx + 1}
                                                                    </span>
                                                                    {item.subscale && (
                                                                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-500/15 text-purple-300 border border-purple-500/25">
                                                                            {item.subscale}
                                                                        </span>
                                                                    )}
                                                                    {item.reversed && (
                                                                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-300 border border-blue-500/25">
                                                                            Invertido
                                                                        </span>
                                                                    )}
                                                                    {isAlertItem && (
                                                                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold flex items-center gap-1">
                                                                            <AlertTriangle size={10} /> Reactivo Crítico
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-zinc-200 font-sans text-xs leading-snug">
                                                                    {itemText}
                                                                </p>
                                                            </div>

                                                            <div className="shrink-0 text-right">
                                                                {isAnswered ? (
                                                                    <div className="inline-flex flex-col items-end">
                                                                        <span className={`px-2.5 py-1 rounded-lg border font-mono font-bold text-xs ${
                                                                            isAlertItem
                                                                                ? 'bg-rose-500/20 border-rose-500/40 text-rose-200'
                                                                                : 'bg-purple-500/20 border-purple-500/40 text-purple-200'
                                                                        }`}>
                                                                            {chosenOption ? chosenOption.label : `Valor: ${userVal}`}
                                                                        </span>
                                                                        <span className="text-[9px] font-mono text-zinc-400 mt-0.5">
                                                                            Puntaje: {userVal} pts
                                                                        </span>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-[10px] font-mono text-zinc-500 italic">
                                                                        Sin responder
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {chosenOption?.desc && (
                                                            <p className="mt-2 text-[10px] text-zinc-400 italic bg-black/30 p-2 rounded-lg border border-white/5 leading-relaxed">
                                                                "{chosenOption.desc}"
                                                            </p>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="pt-2 flex flex-col sm:flex-row gap-3">
                                {!readOnly && (
                                    <button
                                        onClick={handleSaveToRecord}
                                        disabled={isSaving}
                                        className={`flex-1 py-3 px-4 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                                            saveSuccess
                                                ? 'bg-emerald-600 text-black shadow-lg shadow-emerald-500/20'
                                                : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/20'
                                        }`}
                                    >
                                        {saveSuccess ? (
                                            <>
                                                <Check size={14} />
                                                <span>¡Guardado en Expediente!</span>
                                            </>
                                        ) : (
                                            <>
                                                <Save size={14} />
                                                <span>{isSaving ? 'Guardando...' : 'Guardar en Expediente'}</span>
                                            </>
                                        )}
                                    </button>
                                )}

                                <button
                                    onClick={handleRestart}
                                    className="py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-mono text-xs font-bold uppercase tracking-wider border border-white/5 transition-all flex items-center justify-center gap-1.5"
                                >
                                    <RotateCcw size={13} />
                                    <span>Reaplicar</span>
                                </button>
                                
                                <button
                                    onClick={() => setStep('intro')}
                                    className="py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 font-mono text-xs font-bold uppercase tracking-wider border border-white/5 transition-all"
                                >
                                    Ver Metodología
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom Progress Bar (only during running) */}
                {step === 'running' && (
                    <div className="p-3 border-t border-white/5 bg-zinc-950/80 flex flex-col gap-1 shrink-0">
                        <div className="flex justify-between text-[8px] font-mono uppercase tracking-wider text-zinc-500">
                            <span>Progreso de Reactivos</span>
                            <span>{progressPercent}%</span>
                        </div>
                        <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                            <div 
                                className="bg-purple-500 h-full transition-all duration-300"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Help Modal Overlay while taking test */}
                {showHelpModal && (
                    <div className="fixed inset-0 z-[3600] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="w-full max-w-lg bg-[#0c0c0e] border border-white/15 rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xl relative overflow-hidden">
                            {/* Accent Glow */}
                            <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/10 blur-[50px] pointer-events-none rounded-full" />

                            <div className="flex items-center justify-between border-b border-white/10 pb-3 relative z-10">
                                <div className="flex items-center gap-2">
                                    <HelpCircle size={17} className="text-purple-400" />
                                    <h4 className="text-sm font-bold text-white">
                                        Guía de Respuesta • {test.siglas}
                                    </h4>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowHelpModal(false)}
                                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
                                >
                                    <X size={15} />
                                </button>
                            </div>

                            <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/25 space-y-1 relative z-10">
                                <span className="text-[10px] font-mono uppercase tracking-wider text-purple-300 font-bold block">
                                    Marco Temporal a tener en mente:
                                </span>
                                <p className="text-xs font-bold text-white font-sans">
                                    "{test.comoSeResponde?.marcoTemporal || test.marcoTemporal || 'Período reciente'}"
                                </p>
                                <p className="text-[11px] text-zinc-300 font-sans mt-0.5">
                                    {test.comoSeResponde?.instruccionPrincipal || test.instrucciones}
                                </p>
                            </div>

                            <div className="space-y-2 max-h-64 overflow-y-auto custom-scroll pr-1 relative z-10">
                                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold block">
                                    Significado de las Opciones:
                                </span>
                                {(test.comoSeResponde?.escalaDetallada || test.escala.map(e => ({ valor: e.value, etiqueta: e.label, queSignifica: e.desc, ejemplo: '' }))).map((opt, i) => (
                                    <div key={i} className="p-2.5 rounded-xl bg-zinc-950/80 border border-white/5 space-y-0.5">
                                        <div className="flex items-center justify-between font-bold text-white text-xs">
                                            <span>{opt.etiqueta || opt.valor}</span>
                                            <span className="text-[10px] font-mono text-purple-400">Valor {opt.valor}</span>
                                        </div>
                                        <p className="text-zinc-300 text-[11px] font-sans leading-relaxed">{opt.queSignifica}</p>
                                        {opt.ejemplo && (
                                            <p className="text-[10px] text-purple-300/80 font-sans italic border-t border-white/5 pt-1 mt-1">
                                                💡 {opt.ejemplo}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {test.comoSeResponde?.consejos && (
                                <div className="text-[11px] text-zinc-400 border-t border-white/10 pt-2 relative z-10">
                                    <span className="font-bold text-zinc-300">💡 Consejo:</span> {test.comoSeResponde.consejos[0]}
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={() => setShowHelpModal(false)}
                                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-purple-600/20 relative z-10"
                            >
                                Entendido, Continuar con la Pregunta
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ClinicalTestRunner;
