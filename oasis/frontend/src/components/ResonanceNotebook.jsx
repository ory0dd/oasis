import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Plus, Save, Mic, PanelLeft, ChevronLeft, ArrowRight, ArrowLeft } from 'lucide-react';

export const ResonanceNotebook = ({ onClose, blocks, setBlocks, syncBlocks, accent, className = "fixed inset-x-0 top-[112px] md:top-0 md:inset-0 rounded-t-[2.5rem] md:rounded-none border-t border-x border-white/10 md:border-none z-[1500] bg-[#050506]/95 backdrop-blur-3xl shadow-[0_-20px_50px_rgba(0,0,0,0.8)] md:shadow-none" }) => {
    const [activeResId, setActiveResId] = useState(null);
    const [resName, setResName] = useState('');
    const [resPrimal, setResPrimal] = useState('');
    const [resImpact, setResImpact] = useState('');
    const [resAnomaly, setResAnomaly] = useState('');
    
    const [step, setStep] = useState(0); // 0: Eco, 1: Susurro, 2: Glitch
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeRecordingField, setActiveRecordingField] = useState(null); // 'primal', 'impact', 'anomaly'
    const [saveSuccess, setSaveSuccess] = useState(false);
    const recognitionRef = useRef(null);
    const [viewportHeight, setViewportHeight] = useState(
        () => window.visualViewport?.height || window.innerHeight
    );

    useEffect(() => {
        const update = () => {
            const h = window.visualViewport?.height || window.innerHeight;
            setViewportHeight(h);
        };
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', update);
            window.visualViewport.addEventListener('scroll', update);
        }
        window.addEventListener('resize', update);
        update();
        return () => {
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', update);
                window.visualViewport.removeEventListener('scroll', update);
            }
            window.removeEventListener('resize', update);
        };
    }, []);

    // Parse block content to load past notes
    const parseResonanceContent = (content = '') => {
        const primalMatch = content.match(/\[resonancia\]([\s\S]*?)(?=\n\[impacto\]|$)/);
        const impactMatch = content.match(/\[impacto\]([\s\S]*?)(?=\n\[extrano\]|$)/);
        const anomalyMatch = content.match(/\[extrano\]([\s\S]*?)$/);
        return {
            primal: primalMatch ? primalMatch[1].trim() : '',
            impact: impactMatch ? impactMatch[1].trim() : '',
            anomaly: anomalyMatch ? anomalyMatch[1].trim() : ''
        };
    };

    // Initialize Speech Recognition
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'es-ES';

            recognitionRef.current.onresult = (event) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }
                if (finalTranscript) {
                    setActiveRecordingField(prevField => {
                        if (prevField === 'primal') setResPrimal(prev => (prev.trim() ? prev + ' ' : '') + finalTranscript);
                        if (prevField === 'impact') setResImpact(prev => (prev.trim() ? prev + ' ' : '') + finalTranscript);
                        if (prevField === 'anomaly') setResAnomaly(prev => (prev.trim() ? prev + ' ' : '') + finalTranscript);
                        return prevField;
                    });
                }
            };

            recognitionRef.current.onend = () => setActiveRecordingField(null);
            recognitionRef.current.onerror = () => setActiveRecordingField(null);
        }
    }, []);

    const toggleRecording = (field) => {
        if (!recognitionRef.current) return alert("Tu navegador no soporta dictado por voz.");
        if (activeRecordingField === field) {
            recognitionRef.current.stop();
        } else {
            if (activeRecordingField) recognitionRef.current.stop();
            setTimeout(() => {
                recognitionRef.current.start();
                setActiveRecordingField(field);
            }, 100);
        }
    };

    const resonanceBlocks = blocks.filter(b => b.type === 'text' && b.content && b.content.includes('[resonancia]'))
        .sort((a, b) => new Date(b.metadata?.timestamp || 0) - new Date(a.metadata?.timestamp || 0));

    // Default name for a new noise
    useEffect(() => {
        if (!activeResId && !resName) {
            setResName(`Ruido ${resonanceBlocks.length + 1}`);
        }
    }, [resonanceBlocks.length, activeResId, resName]);

    const handleSelectResonance = (block) => {
        setActiveResId(block.id);
        setResName(block.caption);
        const parsed = parseResonanceContent(block.content);
        setResPrimal(parsed.primal);
        setResImpact(parsed.impact);
        setResAnomaly(parsed.anomaly);
        setStep(0);
        setIsSidebarOpen(false);
    };

    const handleNewResonance = () => {
        setActiveResId(null);
        setResName(`Ruido ${resonanceBlocks.length + 1}`);
        setResPrimal('');
        setResImpact('');
        setResAnomaly('');
        setStep(0);
        setIsSidebarOpen(false);
    };

    const handleSave = () => {
        if (!resPrimal.trim()) return;

        const newContent = `[resonancia] ${resPrimal}\n[impacto] ${resImpact}\n[extrano] ${resAnomaly}`;
        const blockId = activeResId || Date.now().toString();

        const newBlock = {
            id: blockId,
            type: 'text',
            x: (Math.random() - 0.5) * 100,
            y: (Math.random() - 0.5) * 100,
            content: newContent,
            caption: resName || 'Ruido Interno',
            color: '#a855f7', // Pink/Purple for resonance
            metadata: { timestamp: new Date().toISOString() },
            entries: []
        };

        if (activeResId) {
            const updated = blocks.map(b => b.id === activeResId ? newBlock : b);
            setBlocks(updated);
            if (syncBlocks) syncBlocks(updated);
        } else {
            const updated = [...blocks, newBlock];
            setBlocks(updated);
            if (syncBlocks) syncBlocks(updated);
            setActiveResId(blockId);
        }

        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
    };

    const getFieldByStep = () => {
        if (step === 0) return 'primal';
        if (step === 1) return 'impact';
        return 'anomaly';
    };

    return (
        <div 
            className={`${className} text-white flex animate-in fade-in slide-in-from-bottom-10 duration-700 overflow-hidden`} 
            style={{ height: window.innerWidth < 768 && viewportHeight > 96 ? (viewportHeight - 96) + 'px' : viewportHeight + 'px' }} 
            onClick={e => e.stopPropagation()}
        >
            {/* Sidebar / Menu */}
            {isSidebarOpen && (
                <div className="w-80 bg-[#0a0a0d]/98 border-r border-white/5 flex flex-col z-40 animate-in slide-in-from-left duration-300">
                    <div className="p-5 border-b border-white/5 flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Historial de Ruido</span>
                        <button onClick={() => setIsSidebarOpen(false)} className="text-zinc-500 hover:text-white"><ChevronLeft size={16} /></button>
                    </div>
                    
                    <div className="p-4 border-b border-white/5">
                        <button 
                            onClick={handleNewResonance}
                            className="w-full py-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500 hover:text-black font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 transition-all"
                        >
                            <Plus size={12} /> Nuevo Registro
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-2">
                        {resonanceBlocks.length === 0 ? (
                            <p className="text-[10px] text-zinc-600 font-mono text-center mt-10">Sin registros de ruido.</p>
                        ) : resonanceBlocks.map(b => (
                            <div 
                                key={b.id} 
                                onClick={() => handleSelectResonance(b)}
                                className={`p-4 rounded-xl border transition-all cursor-pointer group text-left ${activeResId === b.id ? 'bg-purple-500/10 border-purple-500/30' : 'bg-white/[0.01] border-white/5 hover:border-purple-500/20'}`}
                            >
                                <div className="flex justify-between items-start mb-1.5 font-sans">
                                    <h4 className={`text-xs font-black uppercase truncate max-w-[170px] ${activeResId === b.id ? 'text-purple-400' : 'text-zinc-300 group-hover:text-purple-400'}`}>{b.caption}</h4>
                                    <span className="text-[8px] font-mono text-zinc-600">{new Date(b.metadata?.timestamp).toLocaleDateString('es-ES', {day: 'numeric', month: 'short'})}</span>
                                </div>
                                <p className="text-[10px] font-sans text-zinc-500 line-clamp-2 italic leading-relaxed">
                                    {b.content.replace(/\[resonancia\]|\[impacto\]|\[extrano\]/g, '')}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Main Area */}
            <div className="flex-1 flex flex-col relative h-full min-w-0">
                {/* Background glow */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                    <div className="w-96 h-96 rounded-full blur-[120px] bg-purple-500/10" />
                </div>

                {/* Top bar (Header) */}
                <div className="absolute top-6 left-5 right-5 md:top-10 md:left-10 md:right-10 z-40 flex justify-between items-center pointer-events-none">
                    <div className="flex items-center gap-1.5 md:gap-3">
                        {!isSidebarOpen && (
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="w-9 h-9 md:w-12 md:h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 hover:text-white transition-all hover:scale-110 pointer-events-auto shadow-2xl"
                                title="Ver Historial de Ruido"
                            >
                                <PanelLeft size={16} className="md:size-5" />
                            </button>
                        )}
                        <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 md:px-4 md:py-2 rounded-2xl border border-white/5 flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
                            <span className="text-[10px] font-mono font-black uppercase tracking-[0.2em] text-purple-400">
                                RESONANCIA
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-9 h-9 md:w-12 md:h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 hover:text-white transition-all hover:scale-110 pointer-events-auto shadow-2xl"
                    >
                        <X size={16} className="md:size-5" />
                    </button>
                </div>

                {/* Writer/Composer View */}
                <div className="relative z-10 flex-1 overflow-y-auto no-scrollbar pt-24 md:pt-36 min-w-0">
                    <div className="max-w-2xl mx-auto px-8 md:px-12 space-y-6 pb-32">
                        {/* Title input */}
                        <div className="flex items-center justify-between">
                            <input 
                                value={resName}
                                onChange={e => setResName(e.target.value)}
                                placeholder="Nombre del Ruido..."
                                className="flex-1 min-w-0 mr-4 bg-transparent border-none text-xl sm:text-4xl font-black italic tracking-tighter text-white/90 placeholder:text-zinc-800 focus:outline-none focus:ring-0 px-0 font-sans"
                            />
                            
                            {/* Step Indicators */}
                            <div className="flex gap-1.5 items-center">
                                {[0, 1, 2].map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => setStep(s)}
                                        className={`w-6 h-1.5 rounded-full transition-all duration-300 ${s === step ? 'bg-purple-500 w-9 shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'bg-white/10 hover:bg-white/20'}`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Large Editor Canvas */}
                        <div className="min-h-[40vh] font-sans">
                            {step === 0 && (
                                <div className="space-y-4 animate-in fade-in duration-300">
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-mono text-[8px] font-black uppercase tracking-widest">ECO PSÍQUICO</span>
                                        <span className="text-[10px] text-zinc-500 font-mono uppercase">FASE 1</span>
                                    </div>
                                    <h3 className="text-sm sm:text-base font-semibold leading-relaxed text-white/90">
                                        Escucha eso que está dando vueltas en tu cabeza y no lo quieres escuchar.
                                    </h3>
                                    <textarea
                                        value={resPrimal}
                                        onChange={e => setResPrimal(e.target.value)}
                                        placeholder="Escribe aquí con total honestidad sobre el ruido o loop mental..."
                                        className="w-full flex-1 min-h-[30vh] bg-transparent resize-none border-none text-zinc-200 font-sans leading-relaxed focus:outline-none placeholder:text-zinc-700 p-0 pt-2"
                                    />
                                </div>
                            )}

                            {step === 1 && (
                                <div className="space-y-4 animate-in fade-in duration-300">
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono text-[8px] font-black uppercase tracking-widest">SUSURRO INTERNO</span>
                                        <span className="text-[10px] text-zinc-500 font-mono uppercase">FASE 2</span>
                                    </div>
                                    <h3 className="text-sm sm:text-base font-semibold leading-relaxed text-white/90">
                                        Escribe aquello que terminaste pensando después de escribir el eco, eso que quedó flotando como un nuevo pensamiento.
                                    </h3>
                                    <textarea
                                        value={resImpact}
                                        onChange={e => setResImpact(e.target.value)}
                                        placeholder="Qué nuevo pensamiento o emoción residual quedó flotando..."
                                        className="w-full flex-1 min-h-[30vh] bg-transparent resize-none border-none text-zinc-200 font-sans leading-relaxed focus:outline-none placeholder:text-zinc-700 p-0 pt-2"
                                    />
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-4 animate-in fade-in duration-300">
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 font-mono text-[8px] font-black uppercase tracking-widest">EL GLITCH</span>
                                        <span className="text-[10px] text-zinc-500 font-mono uppercase">FASE 3</span>
                                    </div>
                                    <h3 className="text-sm sm:text-base font-semibold leading-relaxed text-white/90">
                                        ¿Qué es lo que te incomoda de esa situación? Eso que de verdad te tiene en bucle, donde termina el loop y te hace repensar una y otra vez.
                                    </h3>
                                    <textarea
                                        value={resAnomaly}
                                        onChange={e => setResAnomaly(e.target.value)}
                                        placeholder="Identifica el origen del bucle existencial, el nudo o conflicto central..."
                                        className="w-full flex-1 min-h-[30vh] bg-transparent resize-none border-none text-zinc-200 font-sans leading-relaxed focus:outline-none placeholder:text-zinc-700 p-0 pt-2"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Floating Bottom Bar (Command Center style) */}
                <div className="relative z-10 p-3 md:p-12">
                    <div className="w-fit max-w-full mx-auto relative flex items-center justify-between gap-4 md:gap-8 px-3 py-2 md:px-6 md:py-3 bg-white/5 backdrop-blur-2xl rounded-[2rem] md:rounded-[2.5rem] border border-white/10 transition-all duration-500 shadow-2xl">
                        <div className="flex items-center gap-1.5 md:gap-3">
                            <button
                                onClick={() => step > 0 && setStep(prev => prev - 1)}
                                disabled={step === 0}
                                className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/5 border border-white/10 text-zinc-500 hover:text-white transition-all flex items-center justify-center disabled:opacity-20 disabled:pointer-events-none"
                                title="Fase Anterior"
                            >
                                <ArrowLeft size={14} className="md:size-4" />
                            </button>

                            <button 
                                onClick={() => toggleRecording(getFieldByStep())}
                                className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all shrink-0 ${activeRecordingField === getFieldByStep() ? 'bg-red-500 text-white animate-pulse' : 'bg-white/5 text-zinc-500 hover:text-white'}`}
                                title="Hablar (Voz a Texto)"
                            >
                                <Mic size={15} className="md:size-[18px]" />
                            </button>
                        </div>

                        <div className="hidden sm:block text-[10px] text-zinc-500 font-mono tracking-widest uppercase truncate max-w-[200px]">
                            {activeRecordingField ? 'Escuchando voz...' : `Fase ${step + 1}: ${getFieldByStep().toUpperCase()}`}
                        </div>

                        <div className="flex items-center gap-1.5 md:gap-2">
                            {step < 2 ? (
                                <button
                                    onClick={() => setStep(prev => prev + 1)}
                                    className="px-4 py-2 md:px-5 md:py-2.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white transition-all text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg shadow-purple-600/10 shrink-0"
                                >
                                    <span>Continuar</span>
                                    <ArrowRight size={10} className="md:size-3" />
                                </button>
                            ) : (
                                <button
                                    onClick={handleSave}
                                    disabled={!resPrimal.trim()}
                                    className={`px-4 py-2 md:px-5 md:py-2.5 rounded-full font-black uppercase tracking-widest text-[9px] flex items-center gap-1.5 transition-all shadow-xl ${
                                        saveSuccess
                                            ? 'bg-green-600 text-white'
                                            : !resPrimal.trim()
                                                ? 'bg-white/5 text-zinc-600 border border-white/5 cursor-not-allowed'
                                                : 'bg-white text-black hover:bg-zinc-200'
                                    }`}
                                >
                                    <Save size={10} className="md:size-3" />
                                    <span>{saveSuccess ? 'Guardado ✓' : (activeResId ? 'Actualizar' : 'Guardar')}</span>
                                </button>
                            )}
                        </div>
                    </div>
                    <p className="text-center text-[7px] font-black uppercase text-zinc-950 tracking-[0.4em] mt-3 md:mt-6 select-none italic">Oasis Resonance Module — v1.6</p>
                </div>
            </div>
        </div>
    );
};

export default ResonanceNotebook;
