import React, { useState, useEffect, useRef } from 'react';
import { 
    Send, FileText, Bot, User, Sparkles, BookOpen, AlertCircle, Copy, CheckCircle2, 
    ChevronDown, X, Trash2, RotateCcw, Target, ClipboardCheck, ArrowRight, Check, 
    Save, Clock, Download, History 
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5046';

// Storage keys helper for 100% resilient persistence
const getNotebookKeys = (patientName) => {
    const safeName = patientName && String(patientName).trim() ? String(patientName).trim() : 'general';
    return {
        safeName,
        messagesKey: `oasis_llm_notebook_messages_${safeName}`,
        backupKey: `oasis_llm_notebook_backup_${safeName}`,
        savedSessionsKey: `oasis_llm_notebook_saved_sessions_${safeName}`,
        chosenTestKey: `oasis_chosen_test_${safeName}`,
        globalBackupKey: 'oasis_llm_notebook_messages_latest_backup'
    };
};

// Helper to parse the top 3 recommended clinical tests from assistant messages
const parseTestRecommendations = (content) => {
    if (!content || typeof content !== 'string') return { cleanText: content, tests: [] };

    // 1. Try structured tag: [PRUEBAS_SUGERIDAS: [...]]
    const tagMatch = content.match(/\[PRUEBAS_SUGERIDAS:\s*(\[[\s\S]*?\])\s*\]/);
    if (tagMatch) {
        try {
            const parsed = JSON.parse(tagMatch[1]);
            const cleanText = content.replace(/\[PRUEBAS_SUGERIDAS:\s*\[[\s\S]*?\]\s*\]/, '').trim();
            if (Array.isArray(parsed) && parsed.length > 0) {
                return { cleanText, tests: parsed.slice(0, 3) };
            }
        } catch (e) {
            console.warn("Error parsing PRUEBAS_SUGERIDAS JSON:", e);
        }
    }

    // 2. Fallback heuristic: Extract numbered recommendations if message discusses evaluations/tests
    const lower = content.toLowerCase();
    const isTestDiscussion = lower.includes('prueba') || lower.includes('evalua') || lower.includes('test') || lower.includes('escala') || lower.includes('inventario') || lower.includes('instrumento');
    
    if (isTestDiscussion) {
        const lines = content.split('\n');
        const candidateTests = [];
        lines.forEach(line => {
            const m = line.match(/^\s*([1-9])[\.\-\)]\s*([^\:\-\—\n]+)(?:[:\-\—]\s*(.+))?$/);
            if (m) {
                const num = m[1];
                let rawTitle = m[2].trim();
                let rawDesc = m[3] ? m[3].trim() : '';
                // Clean leading/trailing markdown asterisks, underscores or quotes
                rawTitle = rawTitle.replace(/^[\*\_"'\s]+|[\*\_"'\s]+$/g, '');
                rawDesc = rawDesc.replace(/^[\*\_"'\s]+|[\*\_"'\s]+$/g, '');
                if (rawTitle.length >= 3 && rawTitle.length <= 60) {
                    candidateTests.push({
                        id: String(num),
                        nombre: rawTitle,
                        area: rawDesc.slice(0, 90),
                        justificacion: rawDesc
                    });
                }
            }
        });

        if (candidateTests.length >= 2) {
            return { cleanText: content, tests: candidateTests.slice(0, 3) };
        }
    }

    return { cleanText: content, tests: [] };
};

export const LLMNotebookTab = ({ patientName }) => {
    const [messages, setMessages] = useState(() => {
        try {
            const k = getNotebookKeys(patientName);
            const saved = localStorage.getItem(k.messagesKey) || localStorage.getItem(k.backupKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
            const globalSaved = localStorage.getItem(k.globalBackupKey);
            if (globalSaved) {
                const parsed = JSON.parse(globalSaved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch (e) {
            console.error("Error loading saved notebook messages:", e);
        }
        return [];
    });

    const [chosenTest, setChosenTest] = useState(() => {
        try {
            const k = getNotebookKeys(patientName);
            const saved = localStorage.getItem(k.chosenTestKey);
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            return null;
        }
    });

    const [savedSessions, setSavedSessions] = useState(() => {
        try {
            const k = getNotebookKeys(patientName);
            const raw = localStorage.getItem(k.savedSessionsKey);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    });

    const [lastSavedAt, setLastSavedAt] = useState(() => {
        return localStorage.getItem('oasis_llm_notebook_last_saved_time') || null;
    });
    const [isSavingManual, setIsSavingManual] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [inputMsg, setInputMsg] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [confirmClear, setConfirmClear] = useState(false);
    const [sources, setSources] = useState([]);
    const [selectedSources, setSelectedSources] = useState(new Set());
    const [showSourcesMobile, setShowSourcesMobile] = useState(false);
    const chatScrollRef = useRef(null);
    const prevPatientRef = useRef(patientName);

    // Synchronous persistence helper to guarantee zero data loss
    const persistMessages = (msgsList, targetName = patientName) => {
        if (!Array.isArray(msgsList) || msgsList.length === 0) return;
        const k = getNotebookKeys(targetName);
        try {
            const jsonStr = JSON.stringify(msgsList);
            localStorage.setItem(k.messagesKey, jsonStr);
            localStorage.setItem(k.backupKey, jsonStr);
            localStorage.setItem(k.globalBackupKey, jsonStr);
            const timeFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            localStorage.setItem('oasis_llm_notebook_last_saved_time', timeFormatted);
            setLastSavedAt(timeFormatted);
        } catch (e) {
            console.error("Error persisting notebook messages:", e);
        }
    };

    // BeforeUnload listener to ensure synchronous save on browser reload (F5) or exit
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (messages && messages.length > 0) {
                persistMessages(messages, patientName);
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [messages, patientName]);

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

    // Load messages and chosen test when patient changes (preserving existing data safely)
    useEffect(() => {
        const k = getNotebookKeys(patientName);

        // Update saved sessions list for this patient
        try {
            const raw = localStorage.getItem(k.savedSessionsKey);
            setSavedSessions(raw ? JSON.parse(raw) : []);
        } catch (e) {
            setSavedSessions([]);
        }

        if (prevPatientRef.current !== patientName) {
            prevPatientRef.current = patientName;
            try {
                const saved = localStorage.getItem(k.messagesKey) || localStorage.getItem(k.backupKey);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setMessages(parsed);
                    } else {
                        setMessages([]);
                    }
                } else {
                    setMessages([]);
                }
            } catch (e) {
                console.error("Error updating patient notebook messages:", e);
                setMessages([]);
            }

            try {
                const savedTest = localStorage.getItem(k.chosenTestKey);
                setChosenTest(savedTest ? JSON.parse(savedTest) : null);
            } catch (e) {
                setChosenTest(null);
            }
        }
    }, [patientName]);

    // Continuous auto-persisting (NEVER removes on empty messages)
    useEffect(() => {
        if (messages.length > 0) {
            persistMessages(messages, patientName);
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
        setChosenTest(null);
        setConfirmClear(false);
        const k = getNotebookKeys(patientName);
        try {
            localStorage.removeItem(k.messagesKey);
            localStorage.removeItem(k.backupKey);
            localStorage.removeItem(k.chosenTestKey);
        } catch (e) {}
    };

    const handleRemoveChosenTest = () => {
        setChosenTest(null);
        const k = getNotebookKeys(patientName);
        try {
            localStorage.removeItem(k.chosenTestKey);
        } catch (e) {}
    };

    // Manual Save handler with snapshot history and backend sync
    const handleManualSave = async () => {
        if (messages.length === 0) return;
        setIsSavingManual(true);
        const k = getNotebookKeys(patientName);

        // 1. Immediately persist active messages locally
        persistMessages(messages, patientName);

        // 2. Save snapshot in savedSessions history
        const now = new Date();
        const dateStr = now.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' });
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const firstUserMsg = messages.find(m => m.role === 'user')?.content || 'Consulta clínica';
        const cleanTitle = chosenTest?.nombre 
            ? `Evaluación: ${chosenTest.nombre}`
            : (firstUserMsg.length > 42 ? firstUserMsg.slice(0, 42) + '...' : firstUserMsg);

        const newSession = {
            id: `session_${Date.now()}`,
            timestamp: now.toISOString(),
            dateFormatted: `${dateStr} a las ${timeStr}`,
            title: cleanTitle,
            messageCount: messages.length,
            chosenTest: chosenTest?.nombre || null,
            messages: messages
        };

        try {
            const raw = localStorage.getItem(k.savedSessionsKey);
            const currentList = raw ? JSON.parse(raw) : [];
            const updated = [newSession, ...currentList.filter(s => s.id !== newSession.id)].slice(0, 30);
            localStorage.setItem(k.savedSessionsKey, JSON.stringify(updated));
            setSavedSessions(updated);
        } catch (e) {
            console.error("Error saving session entry:", e);
        }

        // 3. Save to backend database for permanent sync
        try {
            const convPayload = [{
                id: `notebook_${k.safeName}_${Date.now()}`,
                title: cleanTitle,
                messages: messages.map(m => ({
                    role: m.role,
                    content: m.content,
                    timestamp: new Date().toISOString()
                })),
                updatedAt: Date.now()
            }];
            await fetch(`${API_URL}/api/oasis/conversations?user=${k.safeName}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(convPayload)
            }).catch(() => null);
        } catch (e) {}

        setIsSavingManual(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
    };

    const handleRestoreSession = (session) => {
        if (session && Array.isArray(session.messages)) {
            setMessages(session.messages);
            persistMessages(session.messages, patientName);
            if (session.chosenTest) {
                setChosenTest({ nombre: session.chosenTest });
            }
            setShowHistoryModal(false);
        }
    };

    const handleDeleteSavedSession = (sessionId, e) => {
        e?.stopPropagation();
        const k = getNotebookKeys(patientName);
        try {
            const updated = savedSessions.filter(s => s.id !== sessionId);
            localStorage.setItem(k.savedSessionsKey, JSON.stringify(updated));
            setSavedSessions(updated);
        } catch (err) {}
    };

    const handleExportChatTxt = (msgs = messages) => {
        const text = msgs.map(m => `[${m.role === 'user' ? 'TERAPEUTA' : 'KIO NOTEBOOK'}]\n${m.content}\n`).join('\n---\n\n');
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Chat_Notebook_${patientName || 'caso'}_${new Date().toISOString().slice(0,10)}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const toggleSource = (id) => {
        const newSet = new Set(selectedSources);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedSources(newSet);
    };

    const handleSend = async (customMsg = null) => {
        const textToSend = typeof customMsg === 'string' ? customMsg.trim() : inputMsg.trim();
        if (!textToSend) return;

        if (typeof customMsg !== 'string') {
            setInputMsg('');
        }
        const updatedMessages = [...messages, { role: 'user', content: textToSend }];
        setMessages(updatedMessages);
        persistMessages(updatedMessages, patientName);
        setIsTyping(true);

        try {
            // Gather context from selected sources
            const contextData = sources
                .filter(s => selectedSources.has(s.id))
                .map(s => `--- FUENTE: ${s.name} ---\n${s.content}`)
                .join('\n\n');

            const systemPrompt = `Eres Kio, operando como un colega y Psicólogo Clínico Supervisor. El usuario ya es un profesional clínico experto, NUNCA le preguntes su rol ni le des advertencias médicas ("no soy tu terapeuta", "solo soy una IA").

REGLAS DE CONVERSACIÓN Y TONO (OBLIGATORIAS):
- Escribe como un colega cercano por chat, en párrafos simples, claros y fluidos, estilo WhatsApp.
- Evita excesos de asteriscos o negritas.
- Si el usuario dice cosas cortas como "Hola", "Hola hola", "Buen día", RESPONDE ÚNICAMENTE CON UN SALUDO CORTITO SIMILAR, por ejemplo: "Hola, ¿qué quieres hacer hoy?" o "¿En qué te ayudo?". NUNCA lances un análisis no solicitado ni listas de opciones. Fluye con la plática.

RECOMENDACIÓN DE PRUEBAS / EVALUACIÓN CLÍNICA (REGLA CRÍTICA):
- Si el usuario pregunta qué pruebas, tests, inventarios o instrumentos aplicar o qué hacer clínicamente para evaluar:
- NUNCA des un catálogo genérico ni una lista larga de 5 o más pruebas abstractas.
- Analiza a fondo los datos específicos de ${patientName || 'este paciente'} (su historia biográfica, su perfil PID-5, sus síntomas y bucles de evitación o rumiación).
- Adopta una postura clínica reflexiva de colega: empieza diciendo algo natural como: "Hm, analizando el caso específico de ${patientName || 'este caso'}... podríamos pensar en estas 3 opciones que son las más viables y estratégicas:"
- Proporciona EXACTAMENTE 3 pruebas o instrumentos concretos (ni más ni menos) que aporten la mayor utilidad clínica inmediata para este caso. Para cada una explica brevemente qué evalúa y por qué es viable para este paciente.
- Invita al usuario a escoger una: "¿Cuál de estas tres te gustaría priorizar o aplicar? Si escoges una, te puedo desglosar sus reactivos clave, cómo aplicarla y cómo interpretarla clínicamente para este caso."
- OBLIGATORIO: Al final exacto de tu respuesta, añade un bloque con la etiqueta técnica en una sola línea (los datos deben ser un JSON válido):
[PRUEBAS_SUGERIDAS: [{"id": "1", "nombre": "Nombre de la prueba", "area": "Área clínica evaluada", "justificacion": "Por qué es viable para este caso específico"}, {"id": "2", "nombre": "Nombre de la prueba", "area": "Área clínica evaluada", "justificacion": "Por qué es viable para este caso específico"}, {"id": "3", "nombre": "Nombre de la prueba", "area": "Área clínica evaluada", "justificacion": "Por qué es viable para este caso específico"}]]

CUANDO EL USUARIO ESCOGE O INDICA UNA PRUEBA EN PARTICULAR:
- Desarrolla la prueba seleccionada en profundidad práctica:
  1. Breve introducción y reactivos o preguntas clave más relevantes para este paciente.
  2. Guía paso a paso de administración adaptada a su motivo de consulta.
  3. Pautas de puntuación e interpretación clínica contextualizada a su perfil (datos vs inferencias).

CONOCIMIENTO CLÍNICO (PID-5):
- Si las fuentes incluyen un test PID-5 con 25 ítems puntuados, asume que es el PID-5-BF (Brief Form). Utiliza tu conocimiento interno de los 5 dominios (Afecto Negativo, Desapego, Antagonismo, Desinhibición, Psicoticismo) para inferir rasgos de personalidad según las puntuaciones altas (2 o 3). NUNCA te quejes de que faltan los nombres de los ítems; deduce el perfil.

SOLO CUANDO EL USUARIO TE PIDA UN ANÁLISIS DEL CASO:
Aplica el rigor clínico de Análisis Funcional (ACT) y estructura tus ideas sobre:
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

            const finalMessages = [...updatedMessages, { role: 'assistant', content: aiMsg }];
            setMessages(finalMessages);
            persistMessages(finalMessages, patientName);
        } catch (err) {
            const errorMessages = [...updatedMessages, { role: 'assistant', content: `[Error de sistema: ${err.message}]` }];
            setMessages(errorMessages);
            persistMessages(errorMessages, patientName);
        } finally {
            setIsTyping(false);
        }
    };

    const handleSelectTest = (test) => {
        setChosenTest(test);
        const k = getNotebookKeys(patientName);
        try {
            localStorage.setItem(k.chosenTestKey, JSON.stringify(test));
        } catch (e) {}
        const followUp = `He seleccionado la prueba: ${test.nombre}. Por favor desglosa sus reactivos o aspectos clave, cómo aplicarla paso a paso con ${patientName || 'el paciente'}, y cómo interpretar los resultados en el contexto de su caso.`;
        handleSend(followUp);
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

                    <div className="flex items-center gap-1.5 sm:gap-2">
                        {/* Auto-saved indicator */}
                        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-[10px] font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span>{lastSavedAt ? `Guardado ${lastSavedAt}` : 'Auto-guardado'}</span>
                        </div>

                        {/* Chosen test pill if active */}
                        {chosenTest && (
                            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-300 rounded-xl text-[10px] font-mono animate-in fade-in">
                                <ClipboardCheck size={12} className="text-purple-400 shrink-0" />
                                <span className="truncate max-w-[120px] md:max-w-[160px]">Prueba: <strong>{chosenTest.nombre}</strong></span>
                                <button onClick={handleRemoveChosenTest} className="hover:text-white p-0.5 ml-0.5 text-zinc-400" title="Desmarcar prueba">
                                    <X size={10} />
                                </button>
                            </div>
                        )}

                        {/* Manual Save Chat Button */}
                        {messages.length > 0 && (
                            <button
                                onClick={handleManualSave}
                                disabled={isSavingManual}
                                title="Guardar este chat y archivarlo en el historial del paciente"
                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-mono font-bold transition-all active:scale-95 border shadow-sm ${
                                    saveSuccess
                                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 scale-105'
                                        : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 hover:border-emerald-500/50 text-emerald-400'
                                }`}
                            >
                                {saveSuccess ? (
                                    <>
                                        <Check size={12} className="text-emerald-400" />
                                        <span>¡Chat Guardado!</span>
                                    </>
                                ) : (
                                    <>
                                        <Save size={12} className="text-emerald-400" />
                                        <span>Guardar Chat</span>
                                    </>
                                )}
                            </button>
                        )}

                        {/* Saved Sessions History Button */}
                        {savedSessions.length > 0 && (
                            <button
                                onClick={() => setShowHistoryModal(true)}
                                title="Ver historial de chats guardados"
                                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-900/80 hover:bg-zinc-800 border border-white/10 hover:border-white/20 text-zinc-300 rounded-xl text-[10px] font-mono font-bold transition-all active:scale-95"
                            >
                                <Clock size={12} className="text-blue-400" />
                                <span className="hidden sm:inline">Historial ({savedSessions.length})</span>
                                <span className="sm:hidden">({savedSessions.length})</span>
                            </button>
                        )}

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
                            <div className="flex flex-wrap gap-2 justify-center mt-3 max-w-xl">
                                <button onClick={() => handleSend("¿Cuáles serían las 3 pruebas psicológicas o instrumentos clínicos más viables y estratégicos para evaluar a este paciente según sus fuentes?")} className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 rounded-full text-[10px] font-bold flex items-center gap-1.5 transition-colors">
                                    <Target size={11} className="text-purple-400" /> Top 3 Pruebas Viables
                                </button>
                                <button onClick={() => setInputMsg("Haz una supervisión clínica del caso estructurada en las 6 capas (Datos, Hipótesis, Huecos, Bucles, Intervenciones y Preguntas).")} className="px-3 py-1.5 bg-zinc-900 border border-white/5 rounded-full text-[10px] text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors">Supervisión Completa</button>
                                <button onClick={() => setInputMsg("Analiza la función de las conductas principales (ej. aislamiento, escuchar música, autocastigo). ¿Qué están intentando regular o evitar?")} className="px-3 py-1.5 bg-zinc-900 border border-white/5 rounded-full text-[10px] text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors">Análisis Funcional Conductual</button>
                                <button onClick={() => setInputMsg("Identifica los huecos de evaluación. ¿Qué nos falta preguntar o comprobar en la siguiente sesión para validar nuestras hipótesis?")} className="px-3 py-1.5 bg-zinc-900 border border-white/5 rounded-full text-[10px] text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors">Huecos y Preguntas</button>
                            </div>
                        </div>
                    )}

                    {messages.map((m, idx) => {
                        const isAssistant = m.role === 'assistant';
                        const { cleanText, tests } = isAssistant ? parseTestRecommendations(m.content) : { cleanText: m.content, tests: [] };

                        return (
                            <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[92%] md:max-w-[85%] rounded-2xl p-3 md:p-4 ${
                                    m.role === 'user' 
                                    ? 'bg-blue-600/20 text-blue-50 border border-blue-500/30 rounded-br-sm' 
                                    : 'bg-zinc-900/80 text-zinc-300 border border-white/5 rounded-bl-sm'
                                }`}>
                                    <div className="flex items-center justify-between gap-2 mb-1.5 opacity-60">
                                        <div className="flex items-center gap-1.5">
                                            {m.role === 'user' ? <User size={11} /> : <Bot size={11} className="text-purple-400" />}
                                            <span className="text-[9px] font-mono uppercase font-bold tracking-wider">{m.role === 'user' ? 'Tú' : 'Notebook LM'}</span>
                                        </div>
                                        {isAssistant && (
                                            <button
                                                onClick={() => navigator.clipboard.writeText(cleanText)}
                                                title="Copiar respuesta"
                                                className="text-zinc-500 hover:text-zinc-300 p-0.5 rounded transition-colors"
                                            >
                                                <Copy size={11} />
                                            </button>
                                        )}
                                    </div>
                                    <div className="text-xs md:text-sm leading-relaxed whitespace-pre-wrap font-sans">
                                        {cleanText}
                                    </div>

                                    {/* 3 Viable Test Recommendations Cards */}
                                    {tests.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                                                    <Target size={12} className="text-purple-400" />
                                                    3 Pruebas Clínicas Viables Sugeridas
                                                </span>
                                                <span className="text-[9px] font-mono text-zinc-500">
                                                    Haz clic para escoger una
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                                                {tests.map((test, tIdx) => {
                                                    const isSelected = chosenTest && chosenTest.nombre && (
                                                        chosenTest.nombre.toLowerCase().includes(test.nombre.toLowerCase()) || 
                                                        test.nombre.toLowerCase().includes(chosenTest.nombre.toLowerCase())
                                                    );

                                                    return (
                                                        <div 
                                                            key={test.id || tIdx}
                                                            className={`p-3 rounded-xl border flex flex-col justify-between transition-all relative overflow-hidden ${
                                                                isSelected 
                                                                    ? 'bg-purple-500/15 border-purple-500/50 shadow-lg shadow-purple-500/10' 
                                                                    : 'bg-zinc-950/70 border-white/10 hover:border-purple-500/30 hover:bg-zinc-900/60'
                                                            }`}
                                                        >
                                                            <div>
                                                                <div className="flex items-center justify-between mb-1.5">
                                                                    <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-mono font-bold flex items-center justify-center">
                                                                        #{tIdx + 1}
                                                                    </span>
                                                                    {test.area && (
                                                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-white/5 truncate max-w-[120px]">
                                                                            {test.area}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <h4 className="text-xs font-bold text-white leading-snug mb-1">
                                                                    {test.nombre}
                                                                </h4>
                                                                {test.justificacion && (
                                                                    <p className="text-[10px] text-zinc-400 line-clamp-3 leading-relaxed">
                                                                        {test.justificacion}
                                                                    </p>
                                                                )}
                                                            </div>

                                                            <button
                                                                onClick={() => handleSelectTest(test)}
                                                                disabled={isTyping}
                                                                className={`mt-2.5 w-full py-1.5 px-2 rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                                                                    isSelected 
                                                                        ? 'bg-purple-500 text-white shadow' 
                                                                        : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/30'
                                                                }`}
                                                            >
                                                                {isSelected ? (
                                                                    <>
                                                                        <Check size={11} /> Seleccionada
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        Escoger esta prueba <ArrowRight size={10} />
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
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
                            onClick={() => handleSend()}
                            disabled={!inputMsg.trim() || isTyping}
                            className="absolute right-1.5 w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 disabled:opacity-50 disabled:bg-transparent disabled:text-zinc-600 hover:bg-blue-500 hover:text-white transition-all"
                        >
                            <Send size={13} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal: Historial de Chats Guardados */}
            {showHistoryModal && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
                    <div className="bg-zinc-950 border border-white/15 rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-zinc-900/50">
                            <div className="flex items-center gap-2">
                                <Clock size={16} className="text-blue-400" />
                                <div>
                                    <h3 className="text-sm font-black text-white">Historial de Chats Guardados</h3>
                                    <p className="text-[10px] text-zinc-400 font-mono">
                                        @{patientName || 'caso'} • {savedSessions.length} conversaciones archivadas
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowHistoryModal(false)}
                                className="p-1.5 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scroll">
                            {savedSessions.length === 0 ? (
                                <div className="text-center py-8 text-zinc-500 text-xs font-mono">
                                    No hay chats archivados todavía.
                                </div>
                            ) : (
                                savedSessions.map((session) => (
                                    <div 
                                        key={session.id}
                                        className="p-3.5 rounded-xl border border-white/10 bg-zinc-900/60 hover:bg-zinc-900 hover:border-blue-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] font-mono text-zinc-500">
                                                    {session.dateFormatted}
                                                </span>
                                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 font-mono">
                                                    {session.messageCount} msgs
                                                </span>
                                                {session.chosenTest && (
                                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono truncate max-w-[130px]">
                                                        {session.chosenTest}
                                                    </span>
                                                )}
                                            </div>
                                            <h4 className="text-xs font-bold text-white truncate">
                                                {session.title}
                                            </h4>
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                                            <button
                                                onClick={() => handleRestoreSession(session)}
                                                className="px-2.5 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider transition-all flex items-center gap-1"
                                                title="Cargar esta conversación en la ventana activa"
                                            >
                                                <RotateCcw size={11} /> Cargar
                                            </button>
                                            <button
                                                onClick={() => handleExportChatTxt(session.messages)}
                                                className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-white/10 rounded-lg transition-all"
                                                title="Descargar como archivo de texto"
                                            >
                                                <Download size={12} />
                                            </button>
                                            <button
                                                onClick={(e) => handleDeleteSavedSession(session.id, e)}
                                                className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg transition-all"
                                                title="Eliminar del historial"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-3 border-t border-white/10 bg-zinc-900/40 flex justify-between items-center">
                            <span className="text-[10px] font-mono text-zinc-500">
                                Al cargar un chat se restaura para continuar trabajando.
                            </span>
                            <button
                                onClick={() => setShowHistoryModal(false)}
                                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-bold transition-colors"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
