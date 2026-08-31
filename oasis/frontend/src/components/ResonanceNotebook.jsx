import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, X, Plus, Save, Mic, PanelLeft, ChevronLeft, ArrowRight, ArrowLeft, Columns } from 'lucide-react';

export const ResonanceNotebook = ({ activeCanvasId, onClose, onOpenSimpleNotes, blocks, setBlocks, syncBlocks, accent, className, onFocusNode, onToggleSplitView, isSplitView }) => {
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
    const [portalTarget, setPortalTarget] = useState(null);
    const [viewportHeight, setViewportHeight] = useState(
        () => window.visualViewport?.height || window.innerHeight
    );

    useEffect(() => {
        const interval = setInterval(() => {
            const el = document.getElementById('resonance-context-tools');
            if (el) {
                setPortalTarget(el);
                clearInterval(interval);
            }
        }, 50);
        return () => clearInterval(interval);
    }, []);

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
            keepRecordingRef.current = false; recognitionRef.current.stop();
        } else {
            if (activeRecordingField) keepRecordingRef.current = false; recognitionRef.current.stop();
            setTimeout(() => {
                keepRecordingRef.current = true; recognitionRef.current.start();
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

    const handleSave = (isAuto = false) => {
        if (!resPrimal.trim() && !resImpact.trim() && !resAnomaly.trim()) return;

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
            entries: [],
            canvasId: activeCanvasId || 'canvas_default'
        };

        if (activeResId) {
            const updated = blocks.map(b => b.id === activeResId ? { ...b, content: newContent, caption: resName || 'Ruido Interno' } : b);
            if (syncBlocks) {
                syncBlocks(updated);
            } else {
                setBlocks(updated);
            }
        } else {
            const updated = [...blocks, newBlock];
            if (syncBlocks) {
                syncBlocks(updated);
            } else {
                setBlocks(updated);
            }
            setActiveResId(blockId);
        }

        if (!isAuto) {
            setSaveSuccess(true);
            setTimeout(() => {
                setSaveSuccess(false);
                if (onFocusNode && !activeResId) {
                    onFocusNode(newBlock.x, newBlock.y);
                }
            }, 600);
        }
    };

    // Auto-guardado
    useEffect(() => {
        const timer = setTimeout(() => {
            if (resPrimal.trim() || resImpact.trim() || resAnomaly.trim()) {
                handleSave(true);
            }
        }, 1500);
        return () => clearTimeout(timer);
    }, [resPrimal, resImpact, resAnomaly, resName]);

    const getFieldByStep = () => {
        if (step === 0) return 'primal';
        if (step === 1) return 'impact';
        return 'anomaly';
    };

    return (
        <div 
            className={`${className || "fixed inset-x-0 md:inset-x-[5vw] lg:inset-x-[10vw] xl:inset-x-[10vw] top-[72px] md:top-[100px] bottom-0 rounded-t-[2.5rem] border-t border-x border-white/5 md:border-white/10 z-[1500] shadow-[0_-20px_50px_rgba(0,0,0,0.8)] md:shadow-[0_0_100px_rgba(0,0,0,0.8)]"} flex flex-col bg-[#0b0b0d] text-white animate-in fade-in slide-in-from-bottom-10 duration-700 overflow-hidden transition-all duration-500`} 
            onClick={e => e.stopPropagation()}
            onTouchStart={(e) => {
                e.stopPropagation();
                const touch = e.touches[0];
                const rect = e.currentTarget.getBoundingClientRect();
                if (touch.clientY - rect.top <= 100) {
                    e.currentTarget.dataset.dragAllowed = 'true';
                    e.currentTarget.dataset.startY = touch.clientY;
                    e.currentTarget.style.transition = 'none';
                } else {
                    e.currentTarget.dataset.dragAllowed = 'false';
                }
            }}
            onTouchMove={(e) => {
                e.stopPropagation();
                if (e.currentTarget.dataset.dragAllowed !== 'true') return;
                const startY = parseFloat(e.currentTarget.dataset.startY || 0);
                const currentY = e.touches[0].clientY;
                const deltaY = currentY - startY;

                const scrollable = e.target.closest('.overflow-y-auto');
                if (scrollable && scrollable.scrollTop > 0) return;

                if (deltaY > 0) {
                    e.currentTarget.style.transform = `translateY(${deltaY}px)`;
                }

                if (deltaY > 120) {
                    e.currentTarget.style.transition = 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
                    e.currentTarget.style.transform = `translateY(100%)`;
                    setTimeout(() => onClose(), 200);
                }
            }}
            onTouchEnd={(e) => {
                if (e.currentTarget.dataset.dragAllowed !== 'true') return;
                const startY = parseFloat(e.currentTarget.dataset.startY || 0);
                const currentY = e.changedTouches[0].clientY;
                const deltaY = currentY - startY;
                if (deltaY <= 120) {
                    e.currentTarget.style.transition = 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
                    e.currentTarget.style.transform = `translateY(0px)`;
                }
            }}
            onPointerDown={e => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
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
                {/* Background glow (Fixed Safari Safari gray square bug by using radial-gradient instead of blur filter) */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                    <div className="w-[120vw] h-[120vw] sm:w-[600px] sm:h-[600px]" style={{ background: 'radial-gradient(circle, #a855f7 0%, transparent 60%)' }} />
                </div>

                {/* Top bar removed - moved to bottom command center */}

                {/* Writer/Composer View */}
                <div className="relative z-10 flex-1 overflow-y-auto no-scrollbar pt-12 md:pt-16 min-w-0 pb-[40vh]">
                    <div className="max-w-2xl mx-auto px-8 md:px-12 space-y-6">
                        {/* Title input & Back Button */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-1 min-w-0 mr-4">
                                <button
                                    onClick={() => {
                                        if (onClose) onClose();
                                        if (onOpenSimpleNotes) onOpenSimpleNotes();
                                    }}
                                    className="p-2 -ml-2 rounded-full text-zinc-500 hover:text-white hover:bg-white/10 transition-all"
                                    title="Volver a Notas"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <input 
                                    value={resName}
                                    onChange={e => setResName(e.target.value)}
                                    placeholder="Nombre del Ruido..."
                                    className="flex-1 min-w-0 bg-transparent border-none text-2xl md:text-4xl font-bold tracking-tight text-white/90 placeholder:text-zinc-800 focus:outline-none focus:ring-0 px-0 font-sans"
                                />
                            </div>
                            
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
                                    <h3 className="text-[11px] sm:text-sm md:text-base font-semibold leading-relaxed text-white/90">
                                        Escucha eso que está dando vueltas en tu cabeza y no lo quieres escuchar.
                                    </h3>
                                    <textarea
                                        value={resPrimal}
                                        onChange={e => setResPrimal(e.target.value)}
                                        onInput={(e) => {
                                            e.target.style.height = 'auto';
                                            e.target.style.height = e.target.scrollHeight + 'px';
                                        }}
                                        placeholder="Escribe aquí con total honestidad sobre el ruido o loop mental..."
                                        className="w-full min-h-[40vh] bg-transparent resize-none border-none text-[12px] sm:text-sm md:text-lg text-zinc-200 font-sans leading-relaxed focus:outline-none placeholder:text-zinc-700 p-0 pt-2 pb-32 overflow-hidden"
                                    />
                                </div>
                            )}

                            {step === 1 && (
                                <div className="space-y-4 animate-in fade-in duration-300">
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono text-[8px] font-black uppercase tracking-widest">SUSURRO INTERNO</span>
                                        <span className="text-[10px] text-zinc-500 font-mono uppercase">FASE 2</span>
                                    </div>
                                    <h3 className="text-[11px] sm:text-sm md:text-base font-semibold leading-relaxed text-white/90">
                                        Escribe aquello que terminaste pensando después de escribir el eco, eso que quedó flotando como un nuevo pensamiento.
                                    </h3>
                                    <textarea
                                        value={resImpact}
                                        onChange={e => setResImpact(e.target.value)}
                                        onInput={(e) => {
                                            e.target.style.height = 'auto';
                                            e.target.style.height = e.target.scrollHeight + 'px';
                                        }}
                                        placeholder="Qué nuevo pensamiento o emoción residual quedó flotando..."
                                        className="w-full min-h-[40vh] bg-transparent resize-none border-none text-[12px] sm:text-sm md:text-lg text-zinc-200 font-sans leading-relaxed focus:outline-none placeholder:text-zinc-700 p-0 pt-2 pb-32 overflow-hidden"
                                    />
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-4 animate-in fade-in duration-300">
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 font-mono text-[8px] font-black uppercase tracking-widest">EL GLITCH</span>
                                        <span className="text-[10px] text-zinc-500 font-mono uppercase">FASE 3</span>
                                    </div>
                                    <h3 className="text-[11px] sm:text-sm md:text-base font-semibold leading-relaxed text-white/90">
                                        ¿Qué es lo que te incomoda de esa situación? Eso que de verdad te tiene en bucle, donde termina el loop y te hace repensar una y otra vez.
                                    </h3>
                                    <textarea
                                        value={resAnomaly}
                                        onChange={e => setResAnomaly(e.target.value)}
                                        onInput={(e) => {
                                            e.target.style.height = 'auto';
                                            e.target.style.height = e.target.scrollHeight + 'px';
                                        }}
                                        placeholder="Identifica el origen del bucle existencial, el nudo o conflicto central..."
                                        className="w-full min-h-[40vh] bg-transparent resize-none border-none text-[12px] sm:text-sm md:text-lg text-zinc-200 font-sans leading-relaxed focus:outline-none placeholder:text-zinc-700 p-0 pt-2 pb-32 overflow-hidden"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* BOTTOM COMMAND CENTER PORTAL */}
                {portalTarget && createPortal(
                    <div className="flex items-center justify-between w-full">
                        {/* Left: Sidebar toggle & Navigation */}
                        <div className="flex items-center gap-1 shrink-0">
                            <button 
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${isSidebarOpen ? 'bg-purple-500/20 text-purple-400' : 'text-zinc-500 hover:text-white hover:bg-white/10'}`}
                                title="Ver Historial"
                            >
                                <PanelLeft size={13} />
                                <PanelLeft size={13} />
                            </button>
                            {onToggleSplitView && (
                                <button
                                    onClick={onToggleSplitView}
                                    className={`p-1.5 rounded-lg transition-all hidden md:flex ${isSplitView ? 'bg-[#a855f7]/20 text-[#a855f7]' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
                                    title="Vista Dividida"
                                >
                                    <Columns size={13} />
                                </button>
                            )}
                            <div className="w-px h-3 bg-white/10 mx-0.5" />

                            <button 
                                onClick={() => setStep(Math.max(0, step - 1))}
                                disabled={step === 0}
                                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${step === 0 ? 'text-zinc-700 cursor-not-allowed' : 'text-zinc-500 hover:text-white hover:bg-white/10'}`}
                            >
                                <ArrowLeft size={13} />
                            </button>
                            <button 
                                onClick={() => setStep(Math.min(2, step + 1))}
                                disabled={step === 2}
                                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${step === 2 ? 'text-zinc-700 cursor-not-allowed' : 'text-zinc-500 hover:text-white hover:bg-white/10'}`}
                            >
                                <ArrowRight size={13} />
                            </button>
                        </div>

                        {/* Center: Voice Recording */}
                        <div className="flex-1 flex justify-center">
                            <button 
                                onClick={() => toggleRecording(getFieldByStep())}
                                className={`flex items-center justify-center w-7 h-7 rounded-full transition-all ${activeRecordingField === getFieldByStep() ? 'bg-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'}`}
                            >
                                <Mic size={12} />
                            </button>
                        </div>

                        {/* Right: Save */}
                        <div className="flex items-center gap-1 shrink-0">
                            <button 
                                onClick={handleSave}
                                className="h-7 px-3 rounded-full flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-zinc-300 hover:text-white hover:bg-white/10 transition-all"
                            >
                                <Save size={10} />
                                <span>{saveSuccess ? <span className="text-purple-400">Guardado</span> : "Guardar"}</span>
                            </button>
                        </div>
                    </div>,
                    portalTarget
                )}
            </div>
        </div>
    );
};

export default ResonanceNotebook;
