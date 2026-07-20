import React from 'react';
import {
    PanelLeft, X, Radio, Zap, FileText, Compass, Heart, Share2,
    Plus, ImageIcon, Mic, Send, Minus, Save, Check, Pin, Columns
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

const OasisChat = ({ className, isOpen, isComposerOpen, messages, input, setInput, onSend, isLoading, onClose, user, setBlocks, syncBlocks,
    conversations, setConversations, activeConversationId, setActiveConversationId, folders, setFolders,
    blocks, isAnalyzingNote, setIsAnalyzingNote, activeNoteId, setActiveNoteId, handleSelectNote,
    userMemory, setUserMemory, syncMemory, setChatMessages, chatMessagesRef, onNewChat,
    playQueue, currentTrack, isPlaying, setIsPlaying, setCurrentTrack, handlePrevTrack, handleNextTrack,
    audioRef, accent, setAccent, onTogglePinFact, onForceSave, activeCanvasId,
    activeExplorationNodeId, setActiveExplorationNodeId, onToggleSplitView, isSplitView, containerStyle
}) => {
    const chatEndRef = React.useRef(null);
    const [isSidebarVisible, setIsSidebarVisible] = React.useState(false);
    const [showAttachmentMenu, setShowAttachmentMenu] = React.useState(false);
    const [isRecording, setIsRecording] = React.useState(false);

    // --- COMMITMENT INTERACTION STATE & HELPERS ---
    const [challengesUpdatedTrigger, setChallengesUpdatedTrigger] = React.useState(0);
    React.useEffect(() => {
        const handleUpdate = () => setChallengesUpdatedTrigger(prev => prev + 1);
        window.addEventListener('oasis_challenges_updated', handleUpdate);
        return () => window.removeEventListener('oasis_challenges_updated', handleUpdate);
    }, []);

    const linkedNodeId = activeExplorationNodeId;

    const cleanContent = (text) => {
        if (!text) return '';
        return text.replace(/\[COMPROMISO:\s*([^\]]+)\]/g, '').trim();
    };

    const extractCommitment = (text) => {
        if (!text) return null;
        const match = text.match(/\[COMPROMISO:\s*([^\]]+)\]/);
        return match ? match[1].trim() : null;
    };

    const handleAddCommitment = (text) => {
        if (!linkedNodeId || !text.trim()) return;
        try {
            const saved = localStorage.getItem(`oasis_node_challenges_${user}`);
            let parsed = {};
            try {
                if (saved) {
                    const temp = JSON.parse(saved);
                    if (temp && typeof temp === 'object') {
                        parsed = temp;
                    }
                }
            } catch (err) {
                console.error(err);
            }
            const currentList = parsed[linkedNodeId] || [];
            
            if (currentList.some(ch => ch.text.trim().toLowerCase() === text.trim().toLowerCase())) {
                return;
            }

            const newChallenge = {
                id: `challenge-${Date.now()}`,
                text: text.trim(),
                completed: false,
                createdAt: Date.now()
            };
            parsed[linkedNodeId] = [...currentList, newChallenge];
            localStorage.setItem(`oasis_node_challenges_${user}`, JSON.stringify(parsed));
            
            window.dispatchEvent(new Event('oasis_challenges_updated'));
        } catch (e) {
            console.error("Error adding challenge from chat:", e);
        }
    };
    const keepRecordingRef = React.useRef(false);
    const sessionFinalRef = React.useRef('');
    const baseTextRef = React.useRef('');
    const [interimText, setInterimText] = React.useState('');
    const textareaRef = React.useRef(null);
    const recognitionRef = React.useRef(null);

    const [isSaving, setIsSaving] = React.useState(false);
    const [saveSuccess, setSaveSuccess] = React.useState(false);
    const [localInput, setLocalInput] = React.useState(input || '');

    React.useEffect(() => {
        setLocalInput(input || '');
    }, [input]);

    const [greetingTrigger, setGreetingTrigger] = React.useState(0);

    const initialGreeting = React.useMemo(() => {
        const allQuestions = [
            // Bloque 1: Temporalidad
            "Se vale que duela el pasado. A veces nos frena seguir cargándolo... ¿qué te gustaría empezar a soltar hoy despacito?",
            "A veces los recuerdos pesan de más. ¿Qué historia o fragmento de tu pasado sientes que te acompaña hoy en silencio?",
            "Hay mucho ruido sobre lo que viene y cuesta estar aquí. ¿Qué es lo que intentas proteger al sobrepensar tanto?",
            "A veces la vida pasa rápido mientras intentamos descifrarla. ¿Qué pequeño paso te genera cierto temor en este momento?",
            
            // Bloque 2: Alteridad
            "Fingir que todo está bien cansa mucho. Si pudieras quitarte el peso por un momento... ¿qué hay ahí dentro realmente?",
            "¿A quién sientes que buscas complacer hoy, quizás postergando lo que tú necesitas en silencio?",
            "Cansa intentar complacer a todos. Si hoy no hubiera juicios externos, ¿qué te gustaría expresar libremente?",
            "A veces intentamos con todas nuestras fuerzas poder solos, pero el silencio pesa. ¿Qué te gustaría compartir hoy?",
            "Se puede estar rodeado de gente y aun así sentir un vacío profundo. ¿Cómo se siente esa soledad que te acompaña hoy?",
            "Sentir que nadie nos entiende es desolador. ¿Qué te da temor que los demás descubran si te abres por completo?",
            "Si pudieras liberarte de la mirada ajena y de la presión del éxito... ¿qué cambiaría en la forma en que vives hoy?",
            
            // Bloque 3: Agencia
            "Querer tener el control de todo es agotador. ¿Qué temes que ocurra si hoy te permites simplemente respirar y soltar?",
            "Es difícil cuando la realidad no sigue el camino que esperábamos. ¿Qué situación se sintió fuera de tu control hoy?",
            "Intentar predecir cada detalle desgasta la mente. ¿Qué incertidumbre te está costando abrazar en este momento?",
            "A veces se siente que todo está en contra y cansa luchar. ¿Qué mínima acción o respiro sientes que sí puedes regalarte hoy?",
            "A veces intentamos racionalizar lo que solo se puede sentir. ¿Qué emoción está buscando espacio para ser escuchada hoy?",
            "La mente a veces nos protege de sentir cosas difíciles. ¿Qué emoción o verdad te da temor mirar de frente hoy?",
            
            // Bloque 4: Evitación
            "El trabajo o el scroll infinito nos ayudan a desconectar. Ahora que estás aquí... ¿qué sentimiento empieza a asomarse?",
            "Cuando surge la incomodidad, es natural buscar un refugio. Si nos quedamos un momento aquí en silencio... ¿qué es lo que duele?",
            "Buscamos anestesiar el vacío de muchas formas. Respira un momento... ¿qué susurra tu silencio hoy?",
            "Cuando todo sale al revés, dan ganas de soltar el enojo con fuerza. Desahógate aquí, este es un espacio seguro para tu frustración.",
            "A veces el mundo nos defrauda y no responde como desearíamos. Deja ir esa carga aquí, no tienes que sostenerla en soledad.",
            "Enojarse con uno mismo por estar triste o ansioso es muy común. ¿Qué tal si hoy simplemente te permites sentirte un poco vulnerable?",
            "No somos máquinas sin fallos. ¿Por qué cuesta tanto darnos permiso de sentirnos mal? ¿Qué emoción estás intentando contener?",
            "Ese juez interno puede ser muy duro exigiendo fortaleza. Si pudieras silenciarlo un momento, ¿cómo te sientes realmente?",
            
            // Bloque 5: Valoración
            "¿Hacia dónde corres? A veces alcanzamos una meta y ya miramos la siguiente. ¿Qué pasaría si te detienes a respirar este instante?",
            "Correr tras expectativas infinitas puede ser agotador. ¿Qué crees que estás buscando demostrarte a ti o a los demás?",
            "La autoexigencia pesa en el cuerpo. ¿Qué te ayudaría a sentir que lo que hiciste hoy ya fue suficiente?",
            "Ese temor a que descubran que supuestamente no sabes suficiente es muy humano. ¿Por qué eres tan severo contigo mismo?",
            "A veces nos cuesta reconocer nuestros propios logros y lo atribuimos al azar. ¿Qué te frena a confiar en tu capacidad?",
            "A veces el miedo al éxito nos hace dar un paso atrás. ¿Qué te genera temor cuando las cosas empiezan a salir bien?",
            "Cuidar de los demás es valioso, pero a veces nos olvidamos de nosotros mismos. ¿Qué espacio necesita tu propia vida hoy?",
            "Ayudar a otros a veces nos sirve de refugio para no mirar lo propio. ¿Qué dolor tuyo ha estado esperando tu atención?",
            "A veces creemos que nuestro valor depende de cuánto nos sacrifiquemos. ¿De dónde vendrá esa exigencia tan pesada?",
            
            // Bloque 6: Sentido
            "Cumplir con la rutina diaria pero sentir un vacío por dentro es muy agotador. ¿Cómo experimentas ese vacío hoy?",
            "Hacer las cosas por inercia nos desconecta de la vida. ¿Cuándo empezaste a sentir que el entusiasmo se desvanecía?",
            "Seguir adelante solo por compromiso drena la energía. ¿Qué actividad o situación sientes que hoy te resta vitalidad?",
            "El paso del tiempo a veces genera angustia por lo no construido. Puedes compartir ese temor aquí libremente.",
            "El peso de los años o de lo que consideramos tiempo perdido duele. ¿Qué oportunidad o camino sientes que se ha cerrado?",
            "A veces el miedo nos paraliza frente al tiempo. ¿Qué proyecto o paso sientes que has estado postergando por temor?",
            "Cuando los planes se rompen, el suelo bajo nosotros parece desaparecer. ¿Cómo te sientes frente a esos pedazos hoy?",
            "Perder una certeza fundamental nos deja ante un vacío inmenso. ¿Cómo te gustaría comenzar a explorar este momento?",
            "Cuando una gran expectativa se rompe, el dolor es profundo. No hay prisa por sanar hoy, solo desahoga lo que sientes."
        ];
        const randomQuestion = allQuestions[Math.floor(Math.random() * allQuestions.length)];
        const userName = user || localStorage.getItem('oasis_user') || 'Usuario';
        return `Hola ${userName}. ${randomQuestion}`;
    }, [user, activeConversationId, greetingTrigger]);


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
                metadata: { timestamp: new Date().toISOString() },
            canvasId: activeCanvasId || 'canvas_default'
        };
            syncBlocks(prev => [newBlock, ...prev]);
        }
    };

    const isUserScrollingRef = React.useRef(false);

    React.useEffect(() => {
        if (!isUserScrollingRef.current) {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isLoading]);



    React.useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
        }
    }, [localInput, interimText]);

    // STT — uses a ref to accumulate confirmed text, recreating recognition each session
    const accumulatedTextRef = React.useRef('');

    const toggleRecording = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.');
            return;
        }

        if (isRecording) {
            // STOP
            if (recognitionRef.current) {
                try { recognitionRef.current.abort(); } catch (e) { }
                recognitionRef.current = null;
            }
            setIsRecording(false);
            setInterimText('');
            return;
        }

        // START — create a fresh instance each time to avoid result accumulation bugs
        accumulatedTextRef.current = localInput.trim();
        setInterimText('');

        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'es-ES';
        rec.maxAlternatives = 1;

        rec.onstart = () => setIsRecording(true);

        rec.onresult = (event) => {
            // Only process NEW results from resultIndex onward
            let finalSegment = '';
            let interimSegment = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    finalSegment += event.results[i][0].transcript;
                } else {
                    interimSegment += event.results[i][0].transcript;
                }
            }
            if (finalSegment) {
                accumulatedTextRef.current = (accumulatedTextRef.current
                    ? accumulatedTextRef.current + ' ' + finalSegment.trim()
                    : finalSegment.trim());
                setLocalInput(accumulatedTextRef.current);
                setInput(accumulatedTextRef.current);
                setInterimText('');
            } else if (interimSegment) {
                setInterimText(interimSegment);
            }
        };

        rec.onerror = (event) => {
            if (event.error !== 'no-speech' && event.error !== 'aborted') {
                console.error('STT error:', event.error);
            }
            if (event.error === 'not-allowed') {
                setIsRecording(false);
                recognitionRef.current = null;
            }
        };

        rec.onend = () => {
            if (sessionFinalRef.current) {
                const base = baseTextRef.current;
                baseTextRef.current = (base ? base + ' ' : '') + sessionFinalRef.current;
                sessionFinalRef.current = '';
            }
            if (keepRecordingRef.current) {
                setTimeout(() => {
                    if (keepRecordingRef.current) {
                        try { rec.start(); } catch(e) { setIsRecording(false); }
                    } else {
                        setIsRecording(false);
                        setInterimText('');
                    }
                }, 250);
            } else {
                setIsRecording(false);
                setInterimText('');
            }
        };
        recognitionRef.current = rec;
        try {
            rec.start();
        } catch (e) {
            console.error('STT start failed:', e);
            setIsRecording(false);
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
        setLocalInput(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
    };

    const handleSendAction = () => {
        const text = localInput.trim();
        if (text || isLoading) {
            setInput('');
            setLocalInput('');
            isUserScrollingRef.current = false;
            
            if (messages.length === 0 && !activeExplorationNodeId) {
                onSend(text, null, null, null, { role: 'assistant', content: initialGreeting });
            } else {
                onSend(text);
            }

            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendAction();
        }
    };

    return (
        <div
            className={`${className || "fixed inset-x-0 md:inset-x-[5vw] lg:inset-x-[10vw] xl:inset-x-[10vw] top-[140px] md:top-[100px] bottom-0 rounded-t-[2.5rem] border-t border-x border-white/10 z-[1500] flex flex-row bg-[#050506]/95 backdrop-blur-md text-white shadow-[0_-20px_50px_rgba(0,0,0,0.8)] pb-safe overflow-hidden animate-in fade-in slide-in-from-bottom-[60%] duration-500 transition-all duration-300 pointer-events-auto"}`}
            style={{
                ...containerStyle,
                ...(isComposerOpen && window.innerWidth >= 768 ? {
                    left: '10vw',
                    width: '28vw',
                    right: 'auto'
                } : {})
            }}
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
                            setGreetingTrigger(prev => prev + 1);
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
                        {onToggleSplitView && (
                            <button
                                onClick={onToggleSplitView}
                                className={`w-9 h-9 md:w-12 md:h-12 rounded-full border flex items-center justify-center transition-all hover:scale-110 pointer-events-auto hidden md:flex ${isSplitView ? 'bg-accent/20 border-accent/40 text-accent' : 'bg-white/5 border-white/10 text-zinc-500 hover:text-white'}`}
                                title="Vista Dividida"
                            >
                                <Columns size={16} className="md:size-5" />
                            </button>
                        )}
                        <button
                            onClick={handleForceSave}
                            disabled={messages.length === 0 || isLoading}
                            className={`w-9 h-9 md:w-12 md:h-12 rounded-full border flex items-center justify-center transition-all hover:scale-110 pointer-events-auto ${saveSuccess
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
                            className={`w-9 h-9 md:w-12 md:h-12 rounded-full border flex items-center justify-center transition-all hover:scale-110 pointer-events-auto ${isChatAlreadyPinned
                                    ? 'bg-purple-500/20 border-purple-500/35 text-purple-300 shadow-[0_0_15px_rgba(217,70,239,0.35)]'
                                    : !activeConversationId || isLoading
                                        ? 'bg-white/5 border-white/5 text-zinc-700 cursor-not-allowed'
                                        : 'bg-zinc-950/45 border-white/10 text-zinc-400 hover:text-white hover:bg-white/5'
                                }`}
                            title={isChatAlreadyPinned ? "Desanclar del Pizarrón" : "Anclar al Pizarrón"}
                        >
                            <Pin size={14} className={isChatAlreadyPinned ? "rotate-45 text-purple-400 md:size-[18px]" : "md:size-[18px]"} />
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
                <div 
                    className="relative z-10 flex-1 overflow-y-auto no-scrollbar pt-16 md:pt-24 min-h-0 min-w-0"
                    onTouchStart={() => { isUserScrollingRef.current = true; }}
                    onWheel={() => { isUserScrollingRef.current = true; }}
                    onScroll={(e) => {
                        const { scrollTop, scrollHeight, clientHeight } = e.target;
                        const isNearBottom = scrollHeight - scrollTop - clientHeight < 20;
                        if (!isNearBottom) {
                            isUserScrollingRef.current = true;
                        } else {
                            isUserScrollingRef.current = false;
                        }
                    }}
                >
                    <div className="max-w-4xl mx-auto px-6 md:px-12 space-y-4">
                        {isAnalyzingNote && (
                            <div className="flex items-center gap-4 p-6 rounded-3xl bg-accent/5 border border-accent/10 mb-8 animate-in slide-in-from-top-4 duration-700">
                                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent"><Radio size={18} className="animate-spin-slow" /></div>
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-accent/60">Análisis: {blocks.find(b => b.id === activeNoteId)?.caption || 'Nota activa'}</h4>
                                    <p className="text-[9px] font-bold text-white/40 mt-1 uppercase tracking-widest truncate max-w-md">"{(() => {
                                        const c = blocks.find(b => b.id === activeNoteId)?.content;
                                        return typeof c === 'string' ? c.slice(0, 100) : 'Contenido Multimedia';
                                    })()}"</p>
                                </div>
                            </div>
                        )}
                        {messages.length === 0 && (
                            <div className="min-h-[35vh] md:h-[50vh] flex flex-col items-center justify-center text-center space-y-4 md:space-y-8 animate-in fade-in zoom-in slide-in-from-top-10 duration-1000 px-6 md:px-12 py-4">
                                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-accent/5 flex items-center justify-center text-accent/30 mb-2 animate-pulse"><Zap size={20} className="md:size-6" /></div>
                                {isAnalyzingNote ? (
                                    <div className="space-y-4">
                                        <h2 className="text-xl sm:text-2xl md:text-4xl font-black italic tracking-tighter text-white/80 line-clamp-3 uppercase">
                                            {blocks.find(b => b.id === activeNoteId)?.caption || 'Analizando Frecuencia...'}
                                        </h2>
                                        <p className="text-base sm:text-xl md:text-2xl font-serif italic text-accent animate-pulse">¿Qué quieres abordar hoy sobre esta nota?</p>
                                    </div>
                                ) : (
                                    <h2 className="text-xl sm:text-2xl md:text-4xl text-white/40 oasis-typewriter leading-relaxed max-w-2xl mx-auto">
                                        <TypedText text={initialGreeting} delay={150} speed={10} />
                                    </h2>
                                )}
                            </div>
                        )}
                        {messages.map((m, i) => (
                            <div key={i} className={`flex w-full animate-in slide-in-from-bottom-6 duration-500 mb-6 group ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {m.type === 'context' ? (
                                    <div className="w-full max-w-4xl my-4 p-6 rounded-[2.5rem] bg-accent/5 border border-accent/10 flex flex-col gap-3 animate-in fade-in zoom-in duration-700">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent"><FileText size={14} /></div>
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent/60">Fragmento Adjunto: {m.title}</span>
                                            </div>
                                            <button onClick={() => { setActiveNoteId(null); setIsAnalyzingNote(false); }} className="p-2 hover:bg-white/5 rounded-full text-zinc-600 hover:text-white transition-all"><X size={14} /></button>
                                        </div>
                                        <div className="px-1 line-clamp-4"><p className="text-xs md:text-sm font-sans text-white/50 leading-relaxed">"{typeof m.content === 'string' ? m.content : 'Media'}"</p></div>
                                    </div>
                                ) : (
                                    <div className={`flex gap-4 max-w-[90%] md:max-w-[80%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                        
                                        {/* Avatar AI */}
                                        {m.role === 'assistant' && (
                                            <div className="w-8 h-8 shrink-0 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mt-1">
                                                <Zap size={14} />
                                            </div>
                                        )}

                                        <div className={`flex flex-col gap-2 min-w-0 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                                            {m.role === 'assistant' && m.thought && (
                                                <ReasoningBlock thought={m.thought} isStreaming={!m.content && isLoading} />
                                            )}
                                            
                                            <div className={`font-sans text-sm md:text-base leading-relaxed tracking-normal whitespace-pre-wrap break-words w-full ${
                                                m.role === 'user' 
                                                ? 'bg-zinc-800/80 border border-white/5 rounded-[2rem] rounded-tr-sm px-6 py-4 text-white shadow-lg text-left' 
                                                : 'bg-white/5 border border-white/10 rounded-[2rem] rounded-tl-sm px-6 py-4 text-white/90 shadow-lg text-left'
                                            }`}>
                                                {m.role === 'assistant' ? (
                                                    (i === messages.length - 1 && !isLoading) ? <WordByWordRenderer content={cleanContent(m.content)} /> : <SimpleNarrativeRenderer content={cleanContent(m.content)} />
                                                ) : m.content}
                                            </div>

                                            {m.role === 'assistant' && m.content && (
                                                <div className="flex gap-4 mt-2 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity pl-1">
                                                    <button onClick={() => {
                                                        const newBlock = { id: `sync-${Date.now()}`, type: 'text', content: cleanContent(m.content), x: (Math.random() - 0.5) * 400, y: (Math.random() - 0.5) * 400, rotation: (Math.random() - 0.5) * 10, color: '#bef264', caption: 'Nota de IA', username: user, metadata: { origin: 'spirit_chat', timestamp: new Date().toISOString() },
                                                            canvasId: activeCanvasId || 'canvas_default'
                                                        };
                                                        syncBlocks(prev => [newBlock, ...prev]);
                                                    }} className="text-[9px] font-bold text-zinc-500 hover:text-accent flex items-center gap-1.5 transition-colors"><Save size={12} /> Guardar</button>
                                                    <button className="text-[9px] font-bold text-zinc-500 hover:text-white flex items-center gap-1.5 transition-colors"><Share2 size={12} /> Compartir</button>
                                                </div>
                                            )}

                                            {m.role === 'assistant' && (() => {
                                                const commitment = extractCommitment(m.content);
                                                if (!commitment) return null;

                                                let isAlreadyAdded = false;
                                                if (linkedNodeId) {
                                                    try {
                                                        const saved = localStorage.getItem(`oasis_node_challenges_${user}`);
                                                        if (saved) {
                                                            const parsed = JSON.parse(saved);
                                                            if (parsed && typeof parsed === 'object') {
                                                                const list = parsed[linkedNodeId] || [];
                                                                isAlreadyAdded = list.some(ch => ch.text.trim().toLowerCase() === commitment.trim().toLowerCase());
                                                            }
                                                        }
                                                    } catch (e) {
                                                        console.error(e);
                                                    }
                                                }

                                                return (
                                                    <div className="mt-4 flex flex-col items-start w-full max-w-sm animate-in fade-in duration-700 bg-emerald-950/40 border border-emerald-900/50 rounded-2xl p-4 shadow-lg">
                                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500 mb-2">Compromiso Propuesto</span>
                                                        <p className="text-xs text-emerald-100/90 font-sans leading-relaxed break-words font-medium">
                                                            {commitment}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-3 w-full">
                                                            {isAlreadyAdded ? (
                                                                <span className="text-emerald-400 font-medium text-[10px] flex items-center gap-1 bg-emerald-950/50 px-2 py-1 rounded-md w-full justify-center">
                                                                    <Check size={12} /> Guardado en el nodo
                                                                </span>
                                                            ) : linkedNodeId ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleAddCommitment(commitment)}
                                                                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-[10px] transition-all flex items-center justify-center gap-1.5 py-1.5 rounded-lg shadow-md"
                                                                >
                                                                    <Save size={12} /> Aceptar Compromiso
                                                                </button>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        {isLoading && (<div className="flex items-center gap-2 pl-1 animate-pulse"><div className="w-1 h-1 rounded-full bg-accent" /><div className="w-1 h-1 rounded-full bg-accent opacity-60" /><div className="w-1 h-1 rounded-full bg-accent opacity-30" /></div>)}
                        <div style={{ height: window.innerWidth < 768 ? '80px' : '120px' }} />
                        <div ref={chatEndRef} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OasisChat;

