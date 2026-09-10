import React, { useState, useEffect, useRef } from 'react';
import { Send, FileText, Bot, User, Sparkles, BookOpen, AlertCircle, Copy, CheckCircle2, ChevronDown, X, Trash2, RotateCcw } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5046';

export const LLMNotebookTab = ({ patientName }) => {
    const [messages, setMessages] = useState(() => {
        if (!patientName) return [];
        try {
            const saved = localStorage.getItem(`oasis_llm_notebook_messages_${patientName}`);
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("Error loading saved notebook messages:", e);
            return [];
        }
    });
    const [inputMsg, setInputMsg] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [confirmClear, setConfirmClear] = useState(false);
    const [sources, setSources] = useState([]);
    const [selectedSources, setSelectedSources] = useState(new Set());
    const [showSourcesMobile, setShowSourcesMobile] = useState(false);
    const chatScrollRef = useRef(null);

    // Load available sources
    useEffect(() => {
        if (!patientName) return;

        const availSources = [];

        // Bio
        const bioStr = localStorage.getItem(`oasis_bio_transcriptions_${patientName}`);
        if (bioStr) availSources.push({ id: 'bio', name: 'Entrevista Biográfica', type: 'doc', content: bioStr });

        // Phenom
        const phenomStr = localStorage.getItem(`oasis_phenom_qualitative_${patientName}`);
        if (phenomStr) availSources.push({ id: 'phenom', name: 'Datos Fenomenológicos', type: 'data', content: phenomStr });

        // PID-5
        const pidStr = localStorage.getItem(`oasis_pid_answers_${patientName}`);
        if (pidStr) availSources.push({ id: 'pid5', name: 'Evaluación PID-5', type: 'data', content: pidStr });

        // Transcripts
        const transStr = localStorage.getItem(`oasis_transcriptions_${patientName}`);
        if (transStr) {
            try {
                const transArr = JSON.parse(transStr);
                if (transArr.length > 0) {
                    availSources.push({ 
                        id: 'transcripts', 
                        name: `Transcripciones (${transArr.length})`, 
                        type: 'audio', 
                        content: transArr.map(t => `[${t.date}] ${t.filename}: ${t.text}`).join('\n\n') 
                    });
                }
            } catch (e) {}
        }

        setSources(availSources);
        setSelectedSources(new Set(availSources.map(s => s.id)));
    }, [patientName]);

    // Load messages when patient changes
    useEffect(() => {
        if (!patientName) {
            setMessages([]);
            return;
        }
        try {
            const saved = localStorage.getItem(`oasis_llm_notebook_messages_${patientName}`);
            setMessages(saved ? JSON.parse(saved) : []);
        } catch (e) {
            console.error("Error updating patient notebook messages:", e);
            setMessages([]);
        }
    }, [patientName]);

    // Persist messages whenever messages or patientName changes
    useEffect(() => {
        if (!patientName) return;
        try {
            if (messages.length > 0) {
                localStorage.setItem(`oasis_llm_notebook_messages_${patientName}`, JSON.stringify(messages));
            } else {
                localStorage.removeItem(`oasis_llm_notebook_messages_${patientName}`);
            }
        } catch (e) {
            console.error("Error persisting notebook messages:", e);
        }
    }, [messages, patientName]);

    useEffect(() => {
        if (chatScrollRef.current) {
            chatScrollRef.current.scrollTo({
                top: chatScrollRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages]);

    const handleClearChat = () => {
        if (!confirmClear) {
            setConfirmClear(true);
            setTimeout(() => setConfirmClear(false), 3000);
            return;
        }
        setMessages([]);
        setConfirmClear(false);
        if (patientName) {
            try {
                localStorage.removeItem(`oasis_llm_notebook_messages_${patientName}`);
            } catch (e) {}
        }
    };

    const toggleSource = (id) => {
        const newSet = new Set(selectedSources);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedSources(newSet);
    };

    const handleSend = async () => {
        if (!inputMsg.trim()) return;

        const userMsg = inputMsg.trim();
        setInputMsg('');
        const updatedMessages = [...messages, { role: 'user', content: userMsg }];
        setMessages(updatedMessages);
        setIsTyping(true);

        try {
            // Gather context from selected sources
            const contextData = sources
                .filter(s => selectedSources.has(s.id))
                .map(s => `--- FUENTE: ${s.name} ---\n${s.content}`)
                .join('\n\n');

            const systemPrompt = `Eres Kio, operando como un colega y Psicólogo Clínico Supervisor. El usuario ya es un profesional clínico experto, NUNCA le preguntes su rol ni le des advertencias médicas ("no soy tu terapeuta", "solo soy una IA").

REGLAS DE FORMATO (OBLIGATORIAS):
- ESTÁ ESTRICTAMENTE PROHIBIDO usar formato Markdown.
- CERO asteriscos. CERO negritas. CERO viñetas. CERO listas numeradas.
- Escribe todo en texto plano, en párrafos simples, como si chatearas por WhatsApp.

REGLAS DE CONVERSACIÓN (OBLIGATORIAS):
- Si el usuario dice cosas cortas como "Hola", "Hola hola", "Buen día", RESPONDE ÚNICAMENTE CON UN SALUDO CORTITO SIMILAR, por ejemplo: "Hola, ¿qué quieres hacer hoy?" o "¿En qué te ayudo?". NUNCA lances un análisis no solicitado ni listas de opciones. Fluye con la plática.

CONOCIMIENTO CLÍNICO (PID-5):
- Si las fuentes incluyen un test PID-5 con 25 ítems puntuados, asume que es el PID-5-BF (Brief Form). Utiliza tu conocimiento interno de los 5 dominios (Afecto Negativo, Desapego, Antagonismo, Desinhibición, Psicoticismo) para inferir rasgos de personalidad según las puntuaciones altas (2 o 3). NUNCA te quejes de que faltan los nombres de los ítems; deduce el perfil.

SOLO CUANDO EL USUARIO TE PIDA UN ANÁLISIS DEL CASO:
Aplica el rigor clínico de Análisis Funcional (ACT) y estructura (en texto plano) tus ideas sobre:
- Datos vs Inferencias.
- Bucles funcionales (ABC).
- Huecos y preguntas para la próxima sesión.

FUENTES SELECCIONADAS:
${contextData || 'Ninguna fuente seleccionada.'}
`;

            const activeKey = localStorage.getItem('oasis_deepseek_key') || '';
            const endpoint = localStorage.getItem('oasis_deepseek_endpoint') || 'https://api.openai.com/v1/chat/completions';
            const model = localStorage.getItem('oasis_deepseek_model') || 'gpt-4o';

            const payload = {
                model: model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...updatedMessages
                ],
                temperature: 0.2
            };

            const res = await fetch(`${API_URL}/api/oasis/config/chat-completion`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ endpoint, key: activeKey || null, payload })
            });

            if (!res.ok) throw new Error("Error en la conexión con la IA");
            const data = await res.json();
            const aiMsg = data.choices[0].message.content;

            setMessages(prev => [...prev, { role: 'assistant', content: aiMsg }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', content: `[Error de sistema: ${err.message}]` }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="w-full h-full flex flex-col md:flex-row gap-2 md:gap-4 bg-[#0a0a0c] p-1.5 sm:p-2 md:p-4 rounded-2xl md:rounded-3xl animate-in fade-in duration-300 overflow-hidden relative">
            {/* Desktop Left Panel: Sources */}
            <div className="hidden md:flex md:w-80 h-full bg-zinc-950/80 border border-white/5 rounded-2xl flex-col shrink-0">
                <div className="p-3 md:p-4 border-b border-white/5">
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                        <BookOpen size={16} className="text-blue-400" /> Fuentes
                    </h3>
                    <p className="text-[10px] text-zinc-500 font-mono mt-1">
                        Documentos del paciente @{patientName}
                    </p>
                </div>
                
                <div className="flex-1 p-3 overflow-y-auto space-y-2">
                    {sources.length === 0 ? (
                        <div className="text-center p-4 text-zinc-600 text-xs font-mono">
                            No hay fuentes disponibles
                        </div>
                    ) : (
                        sources.map(s => (
                            <div 
                                key={s.id} 
                                onClick={() => toggleSource(s.id)}
                                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                                    selectedSources.has(s.id) 
                                    ? 'bg-blue-500/10 border-blue-500/30' 
                                    : 'bg-zinc-900/40 border-white/5 opacity-50 hover:opacity-100'
                                }`}
                            >
                                <div className={`w-4 h-4 rounded mt-0.5 shrink-0 flex items-center justify-center border ${
                                    selectedSources.has(s.id) ? 'bg-blue-500 border-blue-500 text-black' : 'border-zinc-600 text-transparent'
                                }`}>
                                    <CheckCircle2 size={12} />
                                </div>
                                <div>
                                    <h4 className={`text-xs font-bold ${selectedSources.has(s.id) ? 'text-blue-100' : 'text-zinc-400'}`}>
                                        {s.name}
                                    </h4>
                                    <p className="text-[9px] text-zinc-500 font-mono mt-1 capitalize">{s.type}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <div className="p-3 border-t border-white/5">
                    <button className="w-full py-2.5 rounded-xl border border-dashed border-white/10 text-zinc-400 text-[10px] font-bold uppercase tracking-widest hover:border-white/30 hover:text-white transition-all flex items-center justify-center gap-2">
                        + Agregar Fuente
                    </button>
                </div>
            </div>

            {/* Mobile Dropdown Overlay for Sources */}
            {showSourcesMobile && (
                <div className="md:hidden absolute top-16 left-2 right-2 z-30 bg-zinc-950/95 border border-blue-500/30 rounded-2xl p-3 shadow-2xl backdrop-blur-xl animate-in slide-in-from-top-2 duration-200 max-h-[50vh] flex flex-col">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5 font-mono uppercase">
                            <BookOpen size={13} className="text-blue-400" /> Fuentes Activas
                        </span>
                        <button onClick={() => setShowSourcesMobile(false)} className="p-1 text-zinc-400 hover:text-white">
                            <X size={14} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-1.5">
                        {sources.length === 0 ? (
                            <div className="text-center py-3 text-zinc-600 text-xs font-mono">No hay fuentes disponibles</div>
                        ) : (
                            sources.map(s => (
                                <div 
                                    key={s.id} 
                                    onClick={() => toggleSource(s.id)}
                                    className={`p-2 rounded-xl border cursor-pointer flex items-center gap-2.5 text-xs transition-all ${
                                        selectedSources.has(s.id) 
                                        ? 'bg-blue-500/15 border-blue-500/40 text-blue-100 font-medium' 
                                        : 'bg-zinc-900/40 border-white/5 text-zinc-500'
                                    }`}
                                >
                                    <div className={`w-4 h-4 rounded shrink-0 flex items-center justify-center border ${
                                        selectedSources.has(s.id) ? 'bg-blue-500 border-blue-500 text-black' : 'border-zinc-700 text-transparent'
                                    }`}>
                                        <CheckCircle2 size={11} />
                                    </div>
                                    <span className="truncate">{s.name}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Right Panel: Chat Workspace */}
            <div className="flex-1 bg-zinc-950/50 border border-white/5 rounded-2xl flex flex-col min-w-0 min-h-0 h-full overflow-hidden">
                <div className="p-3 md:p-4 border-b border-white/5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-purple-400 shrink-0" />
                        <div>
                            <h3 className="text-xs md:text-sm font-black text-white">Asistente Documental</h3>
                            <p className="text-[9px] md:text-[10px] text-zinc-500 font-mono">
                                {selectedSources.size} de {sources.length} fuentes activas
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {messages.length > 0 && (
                            <button
                                onClick={handleClearChat}
                                title="Limpiar conversación actual"
                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-mono font-bold transition-all active:scale-95 border ${
                                    confirmClear 
                                        ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 animate-pulse' 
                                        : 'bg-zinc-900/80 hover:bg-rose-500/10 border-white/10 hover:border-rose-500/30 text-zinc-400 hover:text-rose-300'
                                }`}
                            >
                                <Trash2 size={12} className={confirmClear ? 'text-rose-400' : ''} />
                                <span>{confirmClear ? '¿Borrar chat?' : 'Limpiar'}</span>
                            </button>
                        )}

                        {/* Mobile Toggle Button for Sources */}
                        <button
                            onClick={() => setShowSourcesMobile(prev => !prev)}
                            className="md:hidden flex items-center gap-1 px-2.5 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/25 text-blue-400 rounded-xl text-[10px] font-mono font-bold transition-all active:scale-95"
                        >
                            <BookOpen size={12} />
                            <span>Fuentes ({selectedSources.size})</span>
                            <ChevronDown size={12} className={`transition-transform duration-200 ${showSourcesMobile ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Messages Container with Native Momentum Scroll */}
                <div 
                    ref={chatScrollRef} 
                    className="flex-1 overflow-y-auto p-3 md:p-4 space-y-4 md:space-y-6 custom-scroll overscroll-contain touch-pan-y min-h-0"
                >
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-8">
                            <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-blue-500/10 flex items-center justify-center">
                                <Sparkles className="text-blue-400 w-7 h-7 md:w-8 md:h-8" />
                            </div>
                            <div>
                                <h3 className="text-base md:text-lg font-black text-white">¿Qué te gustaría hacer?</h3>
                                <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1">
                                    Pregúntale a la IA sobre las fuentes seleccionadas, pide un resumen del caso, o pídele que arme un informe de formulación.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2 justify-center mt-3 max-w-lg">
                                <button onClick={() => setInputMsg("Haz una supervisión clínica del caso estructurada en las 6 capas (Datos, Hipótesis, Huecos, Bucles, Intervenciones y Preguntas).")} className="px-3 py-1.5 bg-zinc-900 border border-white/5 rounded-full text-[10px] text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors">Supervisión Completa</button>
                                <button onClick={() => setInputMsg("Analiza la función de las conductas principales (ej. aislamiento, escuchar música, autocastigo). ¿Qué están intentando regular o evitar?")} className="px-3 py-1.5 bg-zinc-900 border border-white/5 rounded-full text-[10px] text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors">Análisis Funcional Conductual</button>
                                <button onClick={() => setInputMsg("Identifica los huecos de evaluación. ¿Qué nos falta preguntar o comprobar en la siguiente sesión para validar nuestras hipótesis?")} className="px-3 py-1.5 bg-zinc-900 border border-white/5 rounded-full text-[10px] text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors">Huecos y Preguntas</button>
                            </div>
                        </div>
                    )}

                    {messages.map((m, idx) => (
                        <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[90%] md:max-w-[85%] rounded-2xl p-3 md:p-4 ${
                                m.role === 'user' 
                                ? 'bg-blue-600/20 text-blue-50 border border-blue-500/30 rounded-br-sm' 
                                : 'bg-zinc-900/80 text-zinc-300 border border-white/5 rounded-bl-sm'
                            }`}>
                                <div className="flex items-center gap-2 mb-1.5 opacity-50">
                                    {m.role === 'user' ? <User size={11} /> : <Bot size={11} />}
                                    <span className="text-[9px] font-mono uppercase font-bold">{m.role === 'user' ? 'Tú' : 'Notebook LM'}</span>
                                </div>
                                <div className="text-xs md:text-sm leading-relaxed whitespace-pre-wrap font-sans">
                                    {m.content}
                                </div>
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="bg-zinc-900/80 border border-white/5 rounded-2xl rounded-bl-sm p-3 md:p-4 flex gap-1">
                                <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"></div>
                                <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Bottom Bar */}
                <div className="p-2.5 md:p-4 border-t border-white/5 bg-zinc-950/80 rounded-b-2xl shrink-0">
                    <div className="relative flex items-center">
                        <textarea
                            value={inputMsg}
                            onChange={e => setInputMsg(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder="Haz una pregunta o pide que redacte algo..."
                            className="w-full bg-zinc-900 border border-white/10 rounded-2xl pl-3.5 pr-11 py-2.5 md:py-3 text-xs md:text-sm text-white placeholder:text-zinc-600 resize-none outline-none focus:border-blue-500/50 focus:bg-zinc-900/80 transition-all max-h-28 md:max-h-32"
                            rows={1}
                            style={{ minHeight: '40px' }}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!inputMsg.trim() || isTyping}
                            className="absolute right-1.5 w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 disabled:opacity-50 disabled:bg-transparent disabled:text-zinc-600 hover:bg-blue-500 hover:text-white transition-all"
                        >
                            <Send size={13} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
