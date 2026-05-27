import React from 'react';
import {
    PanelLeft, X, Radio, Zap, FileText, Compass, Heart, Share2,
    Plus, ImageIcon, Mic, Send, Minus, Save, Check, Pin
} from 'lucide-react';
import { TypedText, WordByWordRenderer, SimpleNarrativeRenderer } from './NarrativeRenderers';
import ChatSidebar from './ChatSidebar';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5046';

const ReasoningBlock = ({ thought, isStreaming }) => {
    const [isExpanded, setIsExpanded] = React.useState(false);
    if (!thought) return null;

    return (
        <div className="w-full mb-1 mt-1 opacity-40 hover:opacity-100 transition-opacity">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[7px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-all font-mono"
            >
                <Zap size={7} className={`${isStreaming ? 'animate-pulse text-accent' : ''}`} />
                <span>{isStreaming ? 'CORE_PROCESS_SYNCING' : 'CORE_PROCESS_ARCHIVE'}</span>
                {isExpanded ? <Minus size={7} /> : <Plus size={7} />}
            </button>
            {isExpanded && (
                <div className="mt-2 p-3 bg-black/40 border-l-2 border-accent/10 rounded-r-lg text-[10px] italic text-zinc-500 font-serif leading-snug animate-in slide-in-from-top-1 duration-300 max-w-[90%]">
                    {thought}
                </div>
            )}
        </div>
    );
};

const OasisChat = ({
    isOpen, messages, input, setInput, onSend, isLoading, onClose, user, setBlocks, syncBlocks,
    conversations, setConversations, activeConversationId, setActiveConversationId, folders, setFolders,
    blocks, isAnalyzingNote, setIsAnalyzingNote, activeNoteId, setActiveNoteId, handleSelectNote,
    userMemory, setUserMemory, syncMemory, setChatMessages, chatMessagesRef, onNewChat,
    playQueue, currentTrack, isPlaying, setIsPlaying, setCurrentTrack, handlePrevTrack, handleNextTrack,
    audioRef, accent, setAccent, onTogglePinFact, onForceSave, onPublishConversation
}) => {
    const chatEndRef = React.useRef(null);
    const [isSidebarVisible, setIsSidebarVisible] = React.useState(false);
    const [showAttachmentMenu, setShowAttachmentMenu] = React.useState(false);
    const [isRecording, setIsRecording] = React.useState(false);
    const [interimText, setInterimText] = React.useState('');
    const textareaRef = React.useRef(null);
    const recognitionRef = React.useRef(null);

    const [isSaving, setIsSaving] = React.useState(false);
    const [saveSuccess, setSaveSuccess] = React.useState(false);
    const [viewportHeight, setViewportHeight] = React.useState(
        () => window.visualViewport?.height || window.innerHeight
    );

    React.useEffect(() => {
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

    const handleForceSave = async () => {
        if (messages.length === 0 || isLoading) return;
        setIsSaving(true);
        try {
            await onForceSave();
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
        } catch (e) {
            console.error('Error al forzar guardado:', e);
        } finally {
            setIsSaving(false);
        }
    };

    const isChatAlreadyPinned = (blocks || []).some(b => b.id === activeConversationId);
    const isChatPublished = (blocks || []).some(b => b.id === `conv-pub-${activeConversationId}` && b.isPublic);

    const handlePinChatToCanvas = () => {
        if (!activeConversationId) return;
        const currentConv = (conversations || []).find(c => c.id === activeConversationId);
        if (!currentConv) return;

        if (isChatAlreadyPinned) {
            setBlocks(prev => {
                const updated = prev.filter(b => b.id !== activeConversationId);
                syncBlocks(updated);
                return updated;
            });
        } else {
            const newBlock = {
                id: activeConversationId,
                type: 'conversation',
                x: (Math.random() - 0.5) * 150,
                y: (Math.random() - 0.5) * 150,
                rotation: (Math.random() - 0.5) * 6,
                color: '#d946ef',
                caption: currentConv.title || 'Diálogo de Conciencia',
                content: JSON.stringify(messages || []),
                isPublic: false,
                username: user,
                metadata: { timestamp: new Date().toISOString() }
            };
            setBlocks(prev => {
                const updated = [newBlock, ...prev];
                syncBlocks(updated);
                return updated;
            });
        }
    };

    React.useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    React.useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
        }
    }, [input, interimText]);

    // Initial STT Setup
    React.useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'es-ES';

            recognitionRef.current.onresult = (event) => {
                let finalTranscript = '';
                let interimTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }
                
                if (finalTranscript) {
                    setInput(prev => {
                        const base = prev.trim();
                        return base ? base + ' ' + finalTranscript : finalTranscript;
                    });
                    // Clear interim on final
                    setInterimText('');
                } else if (interimTranscript) {
                    setInterimText(interimTranscript);
                }
            };

            recognitionRef.current.onend = () => setIsRecording(false);
            recognitionRef.current.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                setIsRecording(false);
            };
        }
    }, [setInput]);

    const toggleRecording = () => {
        if (!recognitionRef.current) {
            alert("Tu navegador no soporta reconocimiento de voz.");
            return;
        }

        if (isRecording) {
            recognitionRef.current.stop();
        } else {
            recognitionRef.current.start();
            setIsRecording(true);
        }
    };

    if (!isOpen) return null;

    const handleSelectConversation = (id) => {
        const targetConv = conversations.find(c => c.id === id);
        setIsAnalyzingNote(!!targetConv?.noteId);
        setActiveNoteId(targetConv?.noteId || null);
        setActiveConversationId(id);
        const msgs = targetConv ? targetConv.messages : [];
        setChatMessages(msgs);
        chatMessagesRef.current = msgs;
        if (window.innerWidth < 768) {
            setIsSidebarVisible(false);
        }
    };

    const handleDeleteConversation = (id) => {
        const updated = conversations.filter(c => c.id !== id);
        setConversations(updated);
        if (activeConversationId === id) setActiveConversationId(null);
        fetch(`${API_URL}/api/oasis/conversations?user=${user || localStorage.getItem('oasis_user')}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated)
        });
    };

    const handlePinConversation = (id) => {
        const updated = conversations.map(c => c.id === id ? { ...c, isPinned: !c.isPinned } : c);
        setConversations(updated);
        fetch(`${API_URL}/api/oasis/conversations?user=${user || localStorage.getItem('oasis_user')}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated)
        });
    };

    const handleRenameConversation = (id, newTitle) => {
        const updated = conversations.map(c => c.id === id ? { ...c, title: newTitle } : c);
        setConversations(updated);
        fetch(`${API_URL}/api/oasis/conversations?user=${user || localStorage.getItem('oasis_user')}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated)
        });
    };

    const handleCreateFolder = (name) => {
        const newFolder = { id: `folder-${Date.now()}`, name, color: '#bef264' };
        setFolders(prev => {
            const updated = [...prev, newFolder];
            fetch(`${API_URL}/api/oasis/folders?user=${user || localStorage.getItem('oasis_user')}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updated)
            });
            return updated;
        });
    };

    const handleTextareaChange = (e) => {
        setInput(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (input.trim() || isLoading) {
                onSend();
                if (textareaRef.current) textareaRef.current.style.height = 'auto';
            }
        }
    };

    return (
        <div
            className="fixed inset-x-0 top-[140px] md:top-0 md:inset-0 rounded-t-[2.5rem] md:rounded-none border-t border-x border-white/10 md:border-none z-[1500] flex bg-[#050506]/95 backdrop-blur-3xl animate-in fade-in slide-in-from-bottom-10 duration-700 overflow-hidden transition-colors duration-1000 shadow-[0_-20px_50px_rgba(0,0,0,0.8)] md:shadow-none"
            style={{ height: window.innerWidth < 768 && viewportHeight > 96 ? (viewportHeight - 96) + 'px' : viewportHeight + 'px' }}
        >
            {isSidebarVisible && (
                <>
                    {/* Mobile backdrop overlay to close sidebar by tapping outside */}
                    <div 
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1700] md:hidden animate-in fade-in duration-300 pointer-events-auto"
                        onClick={() => setIsSidebarVisible(false)}
                    />
                    <ChatSidebar
                        conversations={conversations}
                        activeConversationId={activeConversationId}
                        onSelectConversation={handleSelectConversation}
                        onDeleteConversation={handleDeleteConversation}
                        onPinConversation={handlePinConversation}
                        onRenameConversation={handleRenameConversation}
                        onCreateFolder={handleCreateFolder}
                        blocks={blocks}
                        setBlocks={setBlocks}
                        syncBlocks={syncBlocks}
                        folders={folders}
                        user={user}
                        setConversations={setConversations}
                        onSelectNote={(id) => handleSelectNote(id)}
                        onClose={() => setIsSidebarVisible(false)}
                        userMemory={userMemory}
                        setUserMemory={setUserMemory}
                        syncMemory={syncMemory}
                        onNewChat={() => {
                            onNewChat();
                            if (window.innerWidth < 768) {
                                setIsSidebarVisible(false);
                            }
                        }}
                        playQueue={playQueue}
                        currentTrack={currentTrack}
                        isPlaying={isPlaying}
                        setIsPlaying={setIsPlaying}
                        setCurrentTrack={setCurrentTrack}
                        handlePrevTrack={handlePrevTrack}
                        handleNextTrack={handleNextTrack}
                        audioRef={audioRef}
                        accent={accent}
                        setAccent={setAccent}
                        onTogglePinFact={onTogglePinFact}
                    />
                </>
            )}

            <div className="flex-1 flex flex-col relative h-full">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                    <div className={`w-64 h-64 md:w-96 md:h-96 rounded-full blur-[100px] transition-all duration-1000 ${isLoading ? 'bg-purple-600 scale-125 animate-pulse' : 'bg-accent/20 scale-100'}`} />
                </div>

                <div className="absolute top-6 left-5 right-5 md:top-10 md:left-10 md:right-10 z-[1600] flex justify-between items-center pointer-events-none">
                    <div className="flex items-center gap-1.5 md:gap-3">
                        {!isSidebarVisible && (
                            <button
                                onClick={() => setIsSidebarVisible(true)}
                                className="w-9 h-9 md:w-12 md:h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 hover:text-white transition-all hover:scale-110 pointer-events-auto"
                            >
                                <PanelLeft size={16} className="md:size-5" />
                            </button>
                        )}
                        <button
                            onClick={handleForceSave}
                            disabled={messages.length === 0 || isLoading}
                            className={`w-9 h-9 md:w-12 md:h-12 rounded-full border flex items-center justify-center transition-all hover:scale-110 pointer-events-auto ${
                                saveSuccess
                                    ? 'bg-green-500/20 border-green-500/30 text-green-400'
                                    : messages.length === 0 || isLoading
                                    ? 'bg-white/5 border-white/5 text-zinc-700 cursor-not-allowed'
                                    : 'bg-accent/15 border-accent/30 text-accent hover:bg-accent/25 hover:border-accent/50'
                            }`}
                            title="Forzar Guardado Manual"
                        >
                            {isSaving ? (
                                <Zap size={14} className="animate-spin text-accent md:size-[18px]" />
                            ) : saveSuccess ? (
                                <Check size={14} className="animate-bounce md:size-[18px]" />
                            ) : (
                                <Save size={14} className="md:size-[18px]" />
                            )}
                        </button>
                        <button
                            onClick={handlePinChatToCanvas}
                            disabled={!activeConversationId || isLoading}
                            className={`w-9 h-9 md:w-12 md:h-12 rounded-full border flex items-center justify-center transition-all hover:scale-110 pointer-events-auto ${
                                isChatAlreadyPinned
                                    ? 'bg-purple-500/20 border-purple-500/35 text-purple-300 shadow-[0_0_15px_rgba(217,70,239,0.35)]'
                                    : !activeConversationId || isLoading
                                    ? 'bg-white/5 border-white/5 text-zinc-700 cursor-not-allowed'
                                    : 'bg-zinc-950/45 border-white/10 text-zinc-400 hover:text-white hover:bg-white/5'
                            }`}
                            title={isChatAlreadyPinned ? "Desanclar del Pizarrón" : "Anclar al Pizarrón"}
                        >
                            <Pin size={14} className={isChatAlreadyPinned ? "rotate-45 text-purple-400 md:size-[18px]" : "md:size-[18px]"} />
                        </button>
                        <button
                            onClick={() => {
                                if (!activeConversationId) return;
                                const currentConv = (conversations || []).find(c => c.id === activeConversationId);
                                if (currentConv && onPublishConversation) {
                                    onPublishConversation(currentConv);
                                }
                            }}
                            disabled={!activeConversationId || isLoading}
                            className={`w-9 h-9 md:w-12 md:h-12 rounded-full border flex items-center justify-center transition-all hover:scale-110 pointer-events-auto ${
                                isChatPublished
                                    ? 'bg-green-500/20 border-green-500/35 text-green-300 shadow-[0_0_15px_rgba(34,197,94,0.35)]'
                                    : !activeConversationId || isLoading
                                    ? 'bg-white/5 border-white/5 text-zinc-700 cursor-not-allowed'
                                    : 'bg-zinc-950/45 border-white/10 text-zinc-400 hover:text-white hover:bg-white/5'
                            }`}
                            title={isChatPublished ? "Retirar del Feed (Privado)" : "Publicar en Feed (Público)"}
                        >
                            <Share2 size={14} className={isChatPublished ? "text-green-400 md:size-[18px]" : "md:size-[18px]"} />
                        </button>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 md:w-12 md:h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 hover:text-white transition-all hover:scale-110 pointer-events-auto"
                    >
                        <X size={16} className="md:size-5" />
                    </button>
                </div>

                {/* Scrollable messages container */}
                <div className="relative z-10 flex-1 overflow-y-auto no-scrollbar pt-24 md:pt-24 pb-4 min-h-0 min-w-0">
                    <div className="max-w-2xl mx-auto px-8 md:px-12 space-y-4">
                        {isAnalyzingNote && (
                            <div className="flex items-center gap-4 p-6 rounded-3xl bg-accent/5 border border-accent/10 mb-8 animate-in slide-in-from-top-4 duration-700">
                                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent"><Radio size={18} className="animate-spin-slow" /></div>
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-accent/60">Análisis: {blocks.find(b => b.id === activeNoteId)?.caption || 'Nota activa'}</h4>
                                    <p className="text-[9px] font-bold text-white/40 mt-1 uppercase tracking-widest truncate max-w-md">"{blocks.find(b => b.id === activeNoteId)?.content?.slice(0, 100) || 'Explorando el Lienzo...'}"</p>
                                </div>
                            </div>
                        )}
                        {messages.length === 0 && (
                            <div className="h-[50vh] flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in zoom-in slide-in-from-top-10 duration-1000 px-12">
                                <div className="w-16 h-16 rounded-full bg-accent/5 flex items-center justify-center text-accent/30 mb-2 animate-pulse"><Zap size={24} /></div>
                                {isAnalyzingNote ? (
                                    <div className="space-y-4">
                                        <h2 className="text-2xl md:text-4xl font-black italic tracking-tighter text-white/80 line-clamp-3 uppercase">
                                            {blocks.find(b => b.id === activeNoteId)?.caption || 'Analizando Frecuencia...'}
                                        </h2>
                                        <p className="text-xl md:text-2xl font-serif italic text-accent animate-pulse">¿Qué quieres abordar hoy sobre esta nota?</p>
                                    </div>
                                ) : (
                                    <h2 className="text-4xl md:text-6xl text-white/40 oasis-typewriter leading-none">
                                        <TypedText text={`Hola ${user || localStorage.getItem('oasis_user') || 'user'}, ¿algo nuevo que explorar?`} delay={800} speed={40} />
                                    </h2>
                                )}
                            </div>
                        )}
                        {messages.map((m, i) => (
                            <div key={i} className={`flex flex-col animate-in slide-in-from-bottom-6 duration-500 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                                {m.type === 'context' ? (
                                    <div className="w-full my-6 p-6 rounded-[2.5rem] bg-accent/5 border border-accent/10 flex flex-col gap-3 animate-in fade-in zoom-in duration-700">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent"><FileText size={14} /></div>
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent/60">Fragmento Adjunto: {m.title}</span>
                                            </div>
                                            <button onClick={() => { setActiveNoteId(null); setIsAnalyzingNote(false); }} className="p-2 hover:bg-white/5 rounded-full text-zinc-600 hover:text-white transition-all"><X size={14} /></button>
                                        </div>
                                        <div className="px-1 line-clamp-4"><p className="text-xs md:text-sm font-sans text-white/50 leading-relaxed">"{m.content}"</p></div>
                                    </div>
                                ) : (
                                    <>
                                        {m.role === 'assistant' && m.thought && (<div className="mb-3 opacity-60"><ReasoningBlock thought={m.thought} isStreaming={!m.content && isLoading} /></div>)}
                                        <div className={`max-w-[85%] px-1 font-sans text-sm md:text-base leading-relaxed tracking-normal whitespace-pre-wrap ${m.role === 'user' ? 'text-accent text-right' : 'text-white/80 text-left'}`}>
                                            {m.role === 'assistant' ? (
                                                (i === messages.length - 1 && !isLoading) ? <WordByWordRenderer content={m.content} /> : <SimpleNarrativeRenderer content={m.content} />
                                            ) : m.content}
                                        </div>
                                    </>
                                )}
                                {m.role === 'assistant' && m.content && (
                                    <div className="flex gap-4 mt-4 opacity-0 hover:opacity-100 transition-opacity pl-1">
                                        <button onClick={() => {
                                            const newBlock = { id: `sync-${Date.now()}`, type: 'text', content: m.content, x: (Math.random() - 0.5) * 400, y: (Math.random() - 0.5) * 400, rotation: (Math.random() - 0.5) * 10, color: '#bef264', caption: 'Eco del Espíritu', username: user, metadata: { origin: 'spirit_chat', timestamp: new Date().toISOString() } };
                                            setBlocks(prev => { const updated = [newBlock, ...prev]; syncBlocks(updated); return updated; });
                                        }} className="text-[8px] font-black uppercase tracking-widest text-zinc-600 hover:text-accent flex items-center gap-1.5"><Compass size={10} /> Guardar en Lienzo</button>
                                        <button className="text-zinc-700 hover:text-white transition-colors"><Heart size={10} /></button>
                                        <button className="text-zinc-700 hover:text-white transition-colors"><Share2 size={10} /></button>
                                    </div>
                                )}
                            </div>
                        ))}
                        {isLoading && (<div className="flex items-center gap-2 pl-1 animate-pulse"><div className="w-1 h-1 rounded-full bg-accent" /><div className="w-1 h-1 rounded-full bg-accent opacity-60" /><div className="w-1 h-1 rounded-full bg-accent opacity-30" /></div>)}
                        <div ref={chatEndRef} />
                    </div>
                </div>

                {/* COMMAND CENTER INPUT */}
                <div className="relative z-10 px-3 pb-safe pt-1 md:px-12 md:pb-8 md:pt-4 border-t border-white/5 bg-[#050506] backdrop-blur-md shrink-0" style={{ paddingBottom: `max(12px, env(safe-area-inset-bottom))` }}>
                    <div className="max-w-2xl mx-auto relative group flex items-end gap-2 md:gap-3 px-3 py-2 md:px-4 md:py-3 bg-white/5 backdrop-blur-2xl rounded-[2rem] md:rounded-[2.5rem] border border-white/10 group-focus-within:border-accent/40 group-focus-within:bg-white/10 transition-colors duration-300 shadow-2xl">

                        <div className="relative mb-0.5">
                            <button onClick={() => setShowAttachmentMenu(!showAttachmentMenu)} className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all ${showAttachmentMenu ? 'bg-accent text-black rotate-45' : 'bg-white/5 text-zinc-500 hover:text-white'}`}><Plus size={16} className="md:size-5" /></button>
                            {showAttachmentMenu && (
                                <div className="absolute bottom-12 left-0 w-48 bg-[#0c0c0d] border border-white/10 rounded-[1.5rem] overflow-hidden shadow-2xl p-1.5 animate-in fade-in slide-in-from-bottom-4 duration-300 z-[1000]">
                                    <button onClick={() => { document.getElementById('chat-attach-image')?.click(); setShowAttachmentMenu(false); }} className="w-full flex items-center gap-2.5 p-3 text-[9px] font-black uppercase text-zinc-500 hover:text-accent hover:bg-accent/5 rounded-xl transition-all"><ImageIcon size={14} /> Imagen de PC</button>
                                    <button onClick={() => { document.getElementById('chat-attach-doc')?.click(); setShowAttachmentMenu(false); }} className="w-full flex items-center gap-2.5 p-3 text-[9px] font-black uppercase text-zinc-500 hover:text-accent hover:bg-accent/5 rounded-xl transition-all"><FileText size={14} /> Documento / PDF</button>
                                    <input id="chat-attach-image" type="file" accept="image/*" className="hidden" onChange={(e) => console.log('File:', e.target.files[0])} />
                                    <input id="chat-attach-doc" type="file" accept=".pdf,.txt,.doc,.docx" className="hidden" onChange={(e) => console.log('File:', e.target.files[0])} />
                                </div>
                            )}
                        </div>

                        <button onClick={toggleRecording} className={`mb-0.5 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all shrink-0 ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-white/5 text-zinc-500 hover:text-white'}`} title="Hablar (Voz a Texto)"><Mic size={15} className="md:size-[18px]" /></button>

                        <textarea
                            ref={textareaRef}
                            rows={1}
                            value={input + (interimText ? (input.trim() ? ' ' : '') + interimText : '')}
                            onChange={handleTextareaChange}
                            onKeyDown={handleKeyDown}
                            placeholder="Escribe un mensaje o pregunta..."
                            className="flex-1 bg-transparent py-1.5 px-1.5 text-base font-sans text-white placeholder:text-zinc-800 outline-none resize-none no-scrollbar min-h-[32px] max-h-[200px]"
                        />

                        <button
                            onClick={() => onSend()}
                            disabled={!input.trim() && !isLoading}
                            className="mb-0.5 w-8 h-8 md:w-10 md:h-10 shrink-0 rounded-full bg-accent text-black flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl shadow-accent/20 z-[100] disabled:opacity-30 disabled:scale-100 pointer-events-auto"
                        >
                            <Send size={15} className="md:size-[18px]" strokeWidth={3} />
                        </button>
                    </div>
                    <p className="text-center text-[7px] font-black uppercase text-zinc-900 tracking-[0.4em] mt-1 md:mt-2 select-none italic">Oasis Core Chat — v1.6 (Refactored)</p>
                </div>
            </div>
        </div>
    );
};

export default OasisChat;
