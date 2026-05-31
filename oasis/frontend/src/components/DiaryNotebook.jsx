import React, { useState, useEffect, useRef } from 'react';
import { StickyNote, X, Plus, Save, Mic, PanelLeft, ChevronLeft } from 'lucide-react';

const getBlockTime = (b) => {
    if (!b) return 0;
    if (b.metadata?.timestamp) {
        const t = new Date(b.metadata.timestamp).getTime();
        if (!isNaN(t)) return t;
    }
    if (b.timestamp) {
        const t = new Date(b.timestamp).getTime();
        if (!isNaN(t)) return t;
    }
    const match = String(b.id).match(/\d+/);
    if (match) return Number(match[0]);
    return 0;
};

export const DiaryNotebook = ({ onClose, onFocusNode, blocks, setBlocks, syncBlocks, accent, className = "fixed inset-x-0 md:inset-x-[10vw] lg:inset-x-[20vw] xl:inset-x-[25vw] top-[140px] md:top-[100px] rounded-t-[2.5rem] border-t border-x border-white/10 z-[1500] bg-black/95 backdrop-blur-2xl shadow-[0_-20px_50px_rgba(0,0,0,0.8)] md:shadow-[0_0_100px_rgba(0,0,0,0.8)] pb-safe transition-all duration-500" }) => {
    const defaultDate = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const formattedDefaultDate = defaultDate.charAt(0).toUpperCase() + defaultDate.slice(1);

    const [activeEntryId, setActiveEntryId] = useState(null);
    const [diaryTitle, setDiaryTitle] = useState(formattedDefaultDate);
    const [diaryContent, setDiaryContent] = useState('');
    
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
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

    // Load Speech Recognition
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
                    setDiaryContent(prev => {
                        const base = prev.trim();
                        return base ? base + ' ' + finalTranscript : finalTranscript;
                    });
                }
            };

            recognitionRef.current.onend = () => setIsRecording(false);
            recognitionRef.current.onerror = () => setIsRecording(false);
        }
    }, []);

    const toggleRecording = () => {
        if (!recognitionRef.current) return alert("Tu navegador no soporta dictado por voz.");
        if (isRecording) {
            recognitionRef.current.stop();
        } else {
            recognitionRef.current.start();
            setIsRecording(true);
        }
    };

    const diaryBlocks = blocks.filter(b => b.entries && b.entries.length > 0)
        .sort((a, b) => getBlockTime(b) - getBlockTime(a));

    // Handle selecting a past diary entry
    const handleSelectEntry = (block) => {
        setActiveEntryId(block.id);
        setDiaryTitle(block.caption);
        setDiaryContent(block.entries[0]?.text || '');
        setIsSidebarOpen(false);
    };

    // Handle initiating a new entry
    const handleNewEntry = () => {
        setActiveEntryId(null);
        setDiaryTitle(formattedDefaultDate);
        setDiaryContent('');
        setIsSidebarOpen(false);
    };

    // Save or update entry
    const handleSave = () => {
        if (!diaryContent.trim()) return;

        const entryId = activeEntryId || Date.now().toString();
        const timestamp = new Date().toISOString();
        const existingBlock = blocks.find(b => b.id === entryId || (activeEntryId && b.id === activeEntryId));

        const newBlock = {
            id: entryId,
            type: 'text',
            x: existingBlock ? existingBlock.x : (Math.random() - 0.5) * 100,
            y: existingBlock ? existingBlock.y : (Math.random() - 0.5) * 100,
            caption: diaryTitle || formattedDefaultDate,
            color: existingBlock ? existingBlock.color : '#f59e0b', // Amber/Yellow for Diary
            metadata: { timestamp },
            entries: [{
                id: existingBlock?.entries?.[0]?.id || Date.now().toString(),
                timestamp,
                text: diaryContent
            }]
        };

        if (activeEntryId) {
            const updated = blocks.map(b => b.id === activeEntryId ? newBlock : b);
            setBlocks(updated);
            if (syncBlocks) syncBlocks(updated);
        } else {
            const updated = [...blocks, newBlock];
            setBlocks(updated);
            if (syncBlocks) syncBlocks(updated);
            setActiveEntryId(entryId);
        }

        setSaveSuccess(true);
        setTimeout(() => {
            setSaveSuccess(false);
            if (onFocusNode) {
                onFocusNode(newBlock.x, newBlock.y);
            }
        }, 1200);
    };

    // Auto-save changes locally as you type (debounced)
    useEffect(() => {
        if (!diaryContent.trim()) return;

        const timer = setTimeout(() => {
            const entryId = activeEntryId || Date.now().toString();
            const timestamp = new Date().toISOString();
            const existingBlock = blocks.find(b => b.id === entryId || (activeEntryId && b.id === activeEntryId));

            const newBlock = {
                id: entryId,
                type: 'text',
                x: existingBlock ? existingBlock.x : (Math.random() - 0.5) * 100,
                y: existingBlock ? existingBlock.y : (Math.random() - 0.5) * 100,
                caption: diaryTitle || formattedDefaultDate,
                color: existingBlock ? existingBlock.color : '#f59e0b',
                metadata: { timestamp },
                entries: [{
                    id: existingBlock?.entries?.[0]?.id || Date.now().toString(),
                    timestamp,
                    text: diaryContent
                }]
            };

            setBlocks(prev => {
                const exists = prev.some(b => b.id === entryId || (activeEntryId && b.id === activeEntryId));
                const updated = exists 
                    ? prev.map(b => (b.id === entryId || (activeEntryId && b.id === activeEntryId)) ? newBlock : b)
                    : [...prev, newBlock];
                if (syncBlocks) syncBlocks(updated);
                return updated;
            });

            if (!activeEntryId) {
                setActiveEntryId(entryId);
            }
        }, 800);

        return () => clearTimeout(timer);
    }, [diaryTitle, diaryContent, activeEntryId]);

    // Save immediately on app switch / exit / screen lock
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden' && diaryContent.trim()) {
                const entryId = activeEntryId || Date.now().toString();
                const timestamp = new Date().toISOString();
                const existingBlock = blocks.find(b => b.id === entryId || (activeEntryId && b.id === activeEntryId));

                const newBlock = {
                    id: entryId,
                    type: 'text',
                    x: existingBlock ? existingBlock.x : (Math.random() - 0.5) * 100,
                    y: existingBlock ? existingBlock.y : (Math.random() - 0.5) * 100,
                    caption: diaryTitle || formattedDefaultDate,
                    color: existingBlock ? existingBlock.color : '#f59e0b',
                    metadata: { timestamp },
                    entries: [{
                        id: existingBlock?.entries?.[0]?.id || Date.now().toString(),
                        timestamp,
                        text: diaryContent
                    }]
                };

                setBlocks(prev => {
                    const exists = prev.some(b => b.id === entryId || (activeEntryId && b.id === activeEntryId));
                    const updated = exists 
                        ? prev.map(b => (b.id === entryId || (activeEntryId && b.id === activeEntryId)) ? newBlock : b)
                        : [...prev, newBlock];
                    if (syncBlocks) syncBlocks(updated);
                    return updated;
                });

                if (!activeEntryId) {
                    setActiveEntryId(entryId);
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('pagehide', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('pagehide', handleVisibilityChange);
        };
    }, [diaryTitle, diaryContent, activeEntryId, blocks, setBlocks]);

    return (
        <div 
            className={`${className} text-white flex animate-in fade-in slide-in-from-bottom-10 duration-700 overflow-hidden`} 
            style={{ height: window.innerWidth < 768 && viewportHeight > 96 ? (viewportHeight - 96) + 'px' : viewportHeight + 'px' }} 
            onClick={e => e.stopPropagation()}
            onTouchStart={(e) => {
                e.stopPropagation();
                const touch = e.touches[0];
                e.currentTarget.dataset.startY = touch.clientY;
                e.currentTarget.style.transition = 'none';
            }}
            onTouchMove={(e) => {
                e.stopPropagation();
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
                const startY = parseFloat(e.currentTarget.dataset.startY || 0);
                const currentY = e.changedTouches[0].clientY;
                const deltaY = currentY - startY;
                if (deltaY <= 120) {
                    e.currentTarget.style.transition = 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
                    e.currentTarget.style.transform = `translateY(0px)`;
                }
            }}
            onPointerDown={e => e.stopPropagation()}
            onWheel={(e) => {
                e.stopPropagation();
                const scrollable = e.target.closest('.overflow-y-auto');
                if (scrollable && (scrollable.scrollTop > 0 || e.deltaY > 0)) return;

                if (e.deltaY < -50) {
                    e.currentTarget.style.transition = 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
                    e.currentTarget.style.transform = `translateY(100%)`;
                    setTimeout(() => onClose(), 200);
                }
            }}
        >
            {/* Sidebar / Menu */}
            {isSidebarOpen && (
                <div className="w-80 bg-[#0a0a0d]/98 border-r border-white/5 flex flex-col z-40 animate-in slide-in-from-left duration-300">
                    <div className="p-5 border-b border-white/5 flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Historial de Entradas</span>
                        <button onClick={() => setIsSidebarOpen(false)} className="text-zinc-500 hover:text-white"><ChevronLeft size={16} /></button>
                    </div>
                    
                    <div className="p-4 border-b border-white/5">
                        <button 
                            onClick={handleNewEntry}
                            className="w-full py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500 hover:text-black font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 transition-all"
                        >
                            <Plus size={12} /> Nueva Entrada
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-2">
                        {diaryBlocks.length === 0 ? (
                            <p className="text-[10px] text-zinc-600 font-mono text-center mt-10">Sin entradas de diario.</p>
                        ) : diaryBlocks.map(b => (
                            <div 
                                key={b.id} 
                                onClick={() => handleSelectEntry(b)}
                                className={`p-4 rounded-xl border transition-all cursor-pointer group text-left ${activeEntryId === b.id ? 'bg-amber-500/10 border-amber-500/30' : 'bg-white/[0.01] border-white/5 hover:border-amber-500/20'}`}
                            >
                                <div className="flex justify-between items-start mb-1.5 font-sans">
                                    <h4 className={`text-xs font-black uppercase truncate max-w-[170px] ${activeEntryId === b.id ? 'text-amber-400' : 'text-zinc-300 group-hover:text-amber-400'}`}>{b.caption}</h4>
                                    <span className="text-[8px] font-mono text-zinc-600">
                                        {(() => {
                                            const time = getBlockTime(b);
                                            return time ? new Date(time).toLocaleDateString('es-ES', {day: 'numeric', month: 'short'}) : '';
                                        })()}
                                    </span>
                                </div>
                                <p className="text-[10px] font-sans text-zinc-500 line-clamp-2 italic leading-relaxed">
                                    {b.entries[0]?.text}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Main Area */}
            <div className="flex-1 flex flex-col relative h-full min-w-0">
                {/* Background glow (Fixed Safari gray square bug by using radial-gradient) */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                    <div className="w-[120vw] h-[120vw] sm:w-[600px] sm:h-[600px]" style={{ background: 'radial-gradient(circle, #f59e0b 0%, transparent 60%)' }} />
                </div>

                {/* Top bar removed - moved to bottom command center */}

                {/* Writer/Composer View */}
                <div className="relative z-10 flex-1 overflow-y-auto no-scrollbar pt-12 md:pt-16 min-w-0">
                    <div className="max-w-2xl mx-auto px-8 md:px-12 space-y-6 pb-32">
                        {/* Title input */}
                        <textarea 
                            ref={(el) => {
                                if (el) {
                                    el.style.height = 'auto';
                                    el.style.height = el.scrollHeight + 'px';
                                }
                            }}
                            value={diaryTitle}
                            onChange={e => {
                                setDiaryTitle(e.target.value);
                                e.target.style.height = 'auto';
                                e.target.style.height = e.target.scrollHeight + 'px';
                            }}
                            rows={1}
                            placeholder="Título del día..."
                            className="w-full bg-transparent border-none text-3xl sm:text-5xl font-bold tracking-tight text-white/90 placeholder:text-zinc-800 focus:outline-none focus:ring-0 px-0 font-sans resize-none overflow-hidden"
                        />

                        {/* Large, beautiful borderless editor area */}
                        <div className="flex-1 font-sans text-sm sm:text-base leading-relaxed tracking-normal text-white/80 flex flex-col min-h-[40vh]">
                            <textarea 
                                value={diaryContent}
                                onChange={e => setDiaryContent(e.target.value)}
                                placeholder="Escribe aquí con total libertad sobre tu día, tus pensamientos o cualquier cosa que sientas..."
                                className="w-full flex-1 bg-transparent resize-none border-none text-zinc-200 font-sans leading-relaxed focus:outline-none placeholder:text-zinc-700 p-0"
                            />
                        </div>
                    </div>
                </div>

                {/* Floating Bottom Bar (Command Center style) */}
                <div 
                    className="relative z-10 p-3 pt-8 md:p-8 flex flex-col items-center bg-gradient-to-t from-black via-black/95 to-transparent"
                    style={{ paddingBottom: `max(64px, calc(env(safe-area-inset-bottom) + 40px))` }}
                >
                    <div className="w-fit max-w-full mx-auto relative flex items-center justify-between gap-1.5 md:gap-4 p-1 md:p-2 bg-[#121214]/90 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,1)] transition-all duration-500">
                        <div className="flex items-center gap-1 md:gap-1.5">
                            <button onClick={onClose} className="w-9 h-9 md:w-10 md:h-10 rounded-full hover:bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-all group shrink-0" title="Cerrar">
                                <X size={16} className="group-hover:rotate-90 transition-transform duration-300" />
                            </button>
                            
                            {!isSidebarOpen && (
                                <button onClick={() => setIsSidebarOpen(true)} className="w-9 h-9 md:w-10 md:h-10 rounded-full hover:bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-all group shrink-0" title="Ver Historial">
                                    <PanelLeft size={16} className="group-hover:scale-110 transition-transform duration-300" />
                                </button>
                            )}

                            <div className="w-px h-6 bg-white/10 mx-0.5 md:mx-1 hidden sm:block" />

                            <div className="px-2 md:px-3 py-1.5 rounded-2xl flex items-center gap-1.5 mx-0.5 md:mx-1 shrink-0">
                                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                                <span className="text-[10px] font-mono font-black uppercase tracking-[0.2em] text-amber-400 hidden sm:inline">
                                    Diario
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5 md:gap-2 pr-1 shrink-0">
                            <button
                                onClick={toggleRecording}
                                className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all shadow-xl shrink-0 ${
                                    isRecording
                                        ? 'bg-red-500 text-white animate-pulse'
                                        : 'bg-white/5 text-zinc-500 hover:text-white hover:bg-white/10'
                                }`}
                                title="Hablar (Voz a Texto)"
                            >
                                <Mic size={14} className="md:size-[16px]" />
                            </button>

                            <button
                                onClick={handleSave}
                                disabled={!diaryContent.trim()}
                                className={`h-9 md:h-10 px-4 rounded-full font-black uppercase tracking-widest text-[9px] flex items-center gap-1.5 shadow-xl transition-all shrink-0 ${
                                    saveSuccess
                                        ? 'bg-green-600 text-white'
                                        : !diaryContent.trim()
                                            ? 'bg-white/5 text-zinc-600 cursor-not-allowed'
                                            : 'bg-amber-500 text-black hover:bg-amber-400 hover:scale-105 active:scale-95'
                                }`}
                            >
                                <Save size={12} />
                                <span className="hidden sm:inline">{saveSuccess ? 'Guardado ✓' : (activeEntryId ? 'Actualizar' : 'Guardar')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DiaryNotebook;
