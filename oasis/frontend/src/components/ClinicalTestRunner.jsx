import React, { useState, useEffect } from 'react';
import { 
    Check, ArrowRight, ArrowLeft, X, Save, AlertTriangle, 
    Sparkles, ShieldCheck, Activity, Brain, Clock, ChevronRight,
    RotateCcw, Award, FileText
} from 'lucide-react';
import { CLINICAL_TESTS } from '../data/clinicalTestsBank';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5046';

export function ClinicalTestRunner({
    testId = 'bai',
    patientName = 'Paciente',
    onClose,
    onSave,
    readOnly = false
}) {
    const test = CLINICAL_TESTS[testId] || CLINICAL_TESTS.bai;

    const [selectedInformante, setSelectedInformante] = useState('adolescente'); // 'adolescente' | 'madre'
    
    // Load any existing saved result for this patient and test
    const getStorageKey = (inf = selectedInformante) => {
        if (test.id === 'sdq') {
            return `oasis_test_result_${patientName}_${test.id}_${inf}`;
        }
        return `oasis_test_result_${patientName}_${test.id}`;
    };

    const [existingResult, setExistingResult] = useState(() => {
        try {
            const raw = localStorage.getItem(getStorageKey('adolescente')) || localStorage.getItem(`oasis_test_result_${patientName}_${test.id}`);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    });

    const [step, setStep] = useState(existingResult ? 'results' : 'intro'); // 'intro' | 'running' | 'results'
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState(() => existingResult?.rawAnswers || {});
    const [calculatedResult, setCalculatedResult] = useState(existingResult || null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

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
    };

    const handleSaveToRecord = async () => {
        if (!calculatedResult) return;
        setIsSaving(true);

        try {
            // 1. Save locally in localStorage
            const keyToSave = getStorageKey(selectedInformante);
            localStorage.setItem(keyToSave, JSON.stringify(calculatedResult));
            if (test.id === 'sdq') {
                localStorage.setItem(`oasis_test_result_${patientName}_${test.id}`, JSON.stringify(calculatedResult));
            }

            // Also keep a registered list of completed tests for this patient
            const indexKey = `oasis_tests_index_${patientName}`;
            const existingIndex = JSON.parse(localStorage.getItem(indexKey) || '[]');
            if (!existingIndex.includes(test.id)) {
                existingIndex.push(test.id);
                localStorage.setItem(indexKey, JSON.stringify(existingIndex));
            }

            // 2. Sync to backend API if available
            try {
                await fetch(`${API_URL}/api/oasis/clinical-evaluations?patient=${encodeURIComponent(patientName)}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(calculatedResult)
                }).catch(() => null);
            } catch (e) {}

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
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="p-4 rounded-2xl bg-zinc-950/60 border border-white/5 space-y-3">
                                <div className="flex items-center justify-between text-[11px] font-mono">
                                    <span className="text-zinc-400">Consultante evaluado:</span>
                                    <span className="font-bold text-white uppercase tracking-wider">@{patientName}</span>
                                </div>
                                {test.poblacion && (
                                    <div className="flex items-center justify-between text-[11px] font-mono">
                                        <span className="text-zinc-400">Población objetivo:</span>
                                        <span className="font-bold text-purple-400">{test.poblacion}</span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between text-[11px] font-mono">
                                    <span className="text-zinc-400">Propiedad psicométrica:</span>
                                    <span className="font-bold text-emerald-400">Consistencia Interna Alta (α = {test.alphaCronbach})</span>
                                </div>
                                <div className="flex items-center justify-between text-[11px] font-mono">
                                    <span className="text-zinc-400">Extensión:</span>
                                    <span className="text-zinc-300">{test.items.length} reactivos ({test.duracionAprox})</span>
                                </div>
                                <div className="flex items-center justify-between text-[11px] font-mono">
                                    <span className="text-zinc-400">Referencia clínica:</span>
                                    <span className="text-zinc-400 truncate max-w-[260px]">{test.referencia}</span>
                                </div>
                            </div>

                            {/* Informante Selector for Multi-Informant Tests (SDQ) */}
                            {test.informantesDisponibles && (
                                <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-2">
                                    <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-purple-300 block">
                                        Perspectiva / Informante a Evaluar:
                                    </label>
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
                                                className={`py-2 px-3 rounded-xl text-xs font-mono font-bold transition-all border ${
                                                    selectedInformante === inf.id
                                                        ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/30'
                                                        : 'bg-zinc-950/60 hover:bg-zinc-900 text-zinc-400 border-white/5'
                                                }`}
                                            >
                                                {inf.label}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-[11px] text-zinc-400 font-sans mt-1">
                                        {selectedInformante === 'madre'
                                            ? 'Los reactivos se presentarán redactados para que la madre o tutor responda sobre la conducta observada en el menor.'
                                            : 'Los reactivos se presentarán en primera persona para que el adolescente responda directamente sobre su vivencia.'}
                                    </p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                                    <Brain size={13} /> Objetivo del Instrumento
                                </h4>
                                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
                                    {test.descripcion}
                                </p>
                            </div>

                            <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20 text-xs text-purple-200 leading-relaxed font-sans">
                                <strong className="font-mono uppercase text-[10px] block mb-1 text-purple-300">Instrucciones de Administración:</strong>
                                {test.instrucciones}
                            </div>

                            <div className="pt-2 flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={() => setStep('running')}
                                    className="flex-1 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20"
                                >
                                    <span>Iniciar Reactivos</span>
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
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            {/* Question progress and subscale */}
                            <div className="flex items-center justify-between border-b border-white/5 pb-3">
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
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-500">
                                            Puntuación Total Obtenida
                                        </span>
                                        {calculatedResult.informante && (
                                            <span className="px-2 py-0.5 rounded bg-purple-500/15 border border-purple-500/30 text-[9px] font-mono font-bold text-purple-300 uppercase">
                                                {calculatedResult.informante === 'madre' ? 'Perspectiva Madre' : 'Autoinforme Adolescente'}
                                            </span>
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
            </div>
        </div>
    );
}

export default ClinicalTestRunner;
