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

export const DiaryNotebook = ({ onClose, onFocusNode, blocks, setBlocks, syncBlocks, accent, className = "fixed inset-x-0 top-[96px] md:top-0 md:inset-0 rounded-t-[2.5rem] md:rounded-none border-t border-x border-white/10 md:border-none z-[1500] bg-[#050506]/95 backdrop-blur-3xl shadow-[0_-20px_50px_rgba(0,0,0,0.8)] md:shadow-none" }) => {
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
                {/* Background glow */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                    <div className="w-96 h-96 rounded-full blur-[120px] bg-amber-500/10" />
                </div>

                {/* Top bar (Header) */}
                <div className="absolute top-6 left-5 right-5 md:top-10 md:left-10 md:right-10 z-40 flex justify-between items-center pointer-events-none">
                    <div className="flex items-center gap-1.5 md:gap-3">
                        {!isSidebarOpen && (
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="w-9 h-9 md:w-12 md:h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 hover:text-white transition-all hover:scale-110 pointer-events-auto shadow-2xl"
                                title="Ver Historial"
                            >
                                <PanelLeft size={16} className="md:size-5" />
                            </button>
                        )}
                        <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 md:px-4 md:py-2 rounded-2xl border border-white/5 flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                            <span className="text-[10px] font-mono font-black uppercase tracking-[0.2em] text-amber-400">
                                Diario
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pointer-events-auto">
                        <button
                            onClick={toggleRecording}
                            className={`w-9 h-9 md:w-12 md:h-12 rounded-full border flex items-center justify-center transition-all hover:scale-110 shadow-2xl ${
                                isRecording
                                    ? 'bg-red-500 text-white border-red-400 animate-pulse'
                                    : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'
                            }`}
                            title="Hablar (Voz a Texto)"
                        >
                            <Mic size={16} className="md:size-5" />
                        </button>

                        <button
                            onClick={handleSave}
                            disabled={!diaryContent.trim()}
                            className={`h-9 md:h-12 px-4 rounded-full border transition-all font-black uppercase tracking-widest text-[9px] flex items-center gap-1.5 shadow-2xl ${
                                saveSuccess
                                    ? 'bg-green-600 border-green-500 text-white'
                                    : !diaryContent.trim()
                                        ? 'bg-white/5 border-white/5 text-zinc-600 cursor-not-allowed'
                                        : 'bg-amber-500 border-amber-400 text-black hover:bg-amber-400 hover:scale-105 active:scale-95'
                            }`}
                        >
                            <Save size={12} />
                            <span>{saveSuccess ? 'Guardado ✓' : (activeEntryId ? 'Actualizar' : 'Guardar')}</span>
                        </button>

                        <button
                            onClick={onClose}
                            className="w-9 h-9 md:w-12 md:h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 hover:text-white transition-all hover:scale-110 pointer-events-auto shadow-2xl"
                            title="Cerrar"
                        >
                            <X size={16} className="md:size-5" />
                        </button>
                    </div>
                </div>

                {/* Writer/Composer View */}
                <div className="relative z-10 flex-1 overflow-y-auto no-scrollbar pt-24 md:pt-36 min-w-0">
                    <div className="max-w-2xl mx-auto px-8 md:px-12 space-y-6 pb-32">
                        {/* Title input */}
                        <input 
                            value={diaryTitle}
                            onChange={e => setDiaryTitle(e.target.value)}
                            placeholder="Título del día..."
                            className="w-full bg-transparent border-none text-2xl sm:text-5xl font-black italic tracking-tighter text-white/90 placeholder:text-zinc-800 focus:outline-none focus:ring-0 px-0 font-sans"
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

                {/* Empty footer space */}
                <div className="pb-12" />
            </div>
        </div>
    );
};

export default DiaryNotebook;
