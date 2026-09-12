import React, { useState, useEffect, useRef } from 'react';
import { 
    Send, FileText, Bot, User, Sparkles, BookOpen, AlertCircle, Copy, CheckCircle2, 
    ChevronDown, X, Trash2, RotateCcw, Target, ClipboardCheck, ArrowRight, Check, 
    Save, Clock, Download, History, Activity, Eye, ListChecks, ShieldCheck, Brain
} from 'lucide-react';
import { CLINICAL_TESTS } from '../data/clinicalTestsBank';
import { ClinicalTestRunner } from './ClinicalTestRunner';
import { BIO_QUESTIONS } from './BiographicInterview';
import { safeJSONParse } from '../utils/jsonParser';
import { PID5_METADATA, PID5_OPTIONS, PID5_DOMAINS, PID5_ITEMS, calcularResultadoPID5 } from '../data/pid5Data';
import { API_URL, getSavedTestResult, getCompletedTestsCount } from '../utils/api';

// Storage keys helper for 100% resilient persistence and strict patient isolation
const getNotebookKeys = (patientName) => {
    const safeName = patientName && String(patientName).trim() ? String(patientName).trim() : 'general';
    return {
        safeName,
        messagesKey: `oasis_llm_notebook_messages_${safeName}`,
        backupKey: `oasis_llm_notebook_backup_${safeName}`,
        savedSessionsKey: `oasis_llm_notebook_saved_sessions_${safeName}`,
        chosenTestKey: `oasis_chosen_test_${safeName}`,
        lastSavedKey: `oasis_llm_notebook_last_saved_time_${safeName}`
    };
};

// Validates whether stored messages belong to another patient profile due to cross-contamination
const isContaminatedWithOtherPatient = (msgs, currentPatient) => {
    if (!Array.isArray(msgs) || msgs.length === 0) return false;
    const curLower = (currentPatient || '').toLowerCase().trim();
    if (!curLower || curLower === 'general') return false;

    // 1. Tag check if available
    const firstOwner = msgs.find(m => m.patientOwner)?.patientOwner;
    if (firstOwner && firstOwner.toLowerCase() !== curLower) {
        return true;
    }

    // 2. Scan all known patient names from localStorage
    const otherPatients = new Set();
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;
            const match = key.match(/^oasis_(?:bio_transcriptions|phenom_qualitative|pid_answers|llm_notebook_messages)_(.+)$/);
            if (match && match[1]) {
                const name = match[1].trim().toLowerCase();
                if (name && name !== curLower && name !== 'general' && name !== 'latest_backup') {
                    otherPatients.add(name);
                }
            }
        }
    } catch (e) {}

    const fullChatText = msgs.map(m => (m.content || '')).join(' ').toLowerCase();
    const curWordRegex = new RegExp(`\\b${curLower}\\b`, 'i');

    for (const other of otherPatients) {
        const otherWordRegex = new RegExp(`\\b${other}\\b`, 'i');
        
        if (otherWordRegex.test(fullChatText) && !curWordRegex.test(fullChatText)) {
            console.warn(`[LLMNotebookTab] Descartando mensajes contaminados pertenecientes a '${other}' en perfil '${curLower}'`);
            return true;
        }

        try {
            const otherMsgsRaw = localStorage.getItem(`oasis_llm_notebook_messages_${other}`);
            const curMsgsRaw = localStorage.getItem(`oasis_llm_notebook_messages_${curLower}`);
            if (curMsgsRaw && otherMsgsRaw && curMsgsRaw === otherMsgsRaw) {
                if (!curWordRegex.test(fullChatText)) {
                    console.warn(`[LLMNotebookTab] Descartando duplicado idéntico de '${other}' en perfil '${curLower}'`);
                    return true;
                }
            }
        } catch (e) {}
    }

    return false;
};

// Safe loader that guarantees zero leakage between different patients
const loadStoredPatientMessages = (patientName) => {
    try {
        // Remove legacy global backup key that caused cross-patient pollution
        localStorage.removeItem('oasis_llm_notebook_messages_latest_backup');
        
        const k = getNotebookKeys(patientName);
        const saved = localStorage.getItem(k.messagesKey) || localStorage.getItem(k.backupKey);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
                if (isContaminatedWithOtherPatient(parsed, patientName)) {
                    // Purge the contaminated key for this patient so they get a fresh start
                    localStorage.removeItem(k.messagesKey);
                    localStorage.removeItem(k.backupKey);
                    return [];
                }
                return parsed;
            }
        }
    } catch (e) {
        console.error("Error loading saved notebook messages:", e);
    }
    return [];
};

// Formatter for standardized clinical test results into rich, structured clinical markdown
const formatTestResultContent = (res, testDef) => {
    if (!res) return '';
    const testName = res.nombre || testDef?.nombre || res.testId?.toUpperCase();
    const siglas = testDef?.siglas || res.testId?.toUpperCase();
    const alpha = res.alphaCronbach || testDef?.alphaCronbach || '0.85';
    const date = res.dateFormatted || res.completedAt || 'Reciente';
    const infLabel = res.informante === 'madre' ? 'Perspectiva Madre / Cuidador' : 'Autoinforme del Consultante';

    let out = `EVALUACIÓN PSICOMÉTRICA ESTANDARIZADA (${siglas}):
Instrumento: ${testName} (${siglas})
Población / Informante: ${infLabel}
Fecha de Registro: ${date}
Puntaje Total Obtenido: ${res.totalScore} / ${res.maxScore || testDef?.maxScore || 'N/A'} puntos
Clasificación / Nivel Clínico: ${res.nivel}
Consistencia Interna: Alfa de Cronbach α = ${alpha}

Interpretación Clínica Estandarizada:
${res.interpretacion || 'Sin interpretación registrada.'}
`;

    // Desglose detallado por subescalas
    if (res.subescalas && typeof res.subescalas === 'object' && Object.keys(res.subescalas).length > 0) {
        out += `\nDesglose por Subescalas / Ejes Clínicos:\n`;
        Object.entries(res.subescalas).forEach(([subName, score]) => {
            out += `• ${subName}: ${score} pts\n`;
        });
    }

    // Reactivos Críticos / Alertas
    if (res.reactivosCriticos && Array.isArray(res.reactivosCriticos) && res.reactivosCriticos.length > 0) {
        out += `\n⚠️ REACTIVOS CRÍTICOS / ALERTA DE ATENCIÓN PRIORITARIA:\n`;
        res.reactivosCriticos.forEach(rc => {
            out += `• Ítem ${rc.item}: "${rc.texto || ''}" -> Respuesta: ${rc.respuesta || rc.valor} (${rc.significado || rc.riesgo || 'Riesgo Clínico'})\n`;
        });
    } else if (res.rawAnswers && testDef?.items) {
        const elevated = [];
        testDef.items.forEach(it => {
            const val = res.rawAnswers[it.id];
            if (val !== undefined && val !== null) {
                const num = Number(val);
                if (num >= 2) {
                    elevated.push({ it, num });
                }
            }
        });
        if (elevated.length > 0) {
            out += `\nReactivos con Mayor Elevación Sintomática Reportados:\n`;
            elevated.slice(0, 6).forEach(e => {
                out += `• [${e.it.subscale || 'Ítem'}] "${e.it.text}": ${e.num} pts\n`;
            });
        }
    }

    return out;
};

// Helper to parse genuine unapplied test recommendations from assistant messages
const parseTestRecommendations = (content, patientName = null) => {
    if (!content || typeof content !== 'string') return { cleanText: content, tests: [] };

    // 1. Strict structured tag: [PRUEBAS_SUGERIDAS: [...]]
    const tagMatch = content.match(/\[PRUEBAS_SUGERIDAS:\s*(\[[\s\S]*?\])\s*\]/);
    if (tagMatch) {
        try {
            const parsed = JSON.parse(tagMatch[1]);
            const cleanText = content.replace(/\[PRUEBAS_SUGERIDAS:\s*\[[\s\S]*?\]\s*\]/, '').trim();
            if (Array.isArray(parsed) && parsed.length > 0) {
                // Filter out any tests that have already been completed for this patient!
                const filtered = parsed.filter(t => {
                    const low = ((t.nombre || '') + ' ' + (t.id || '')).toLowerCase();
                    const testKeys = ['bai', 'phq9', 'cope28', 'ders16', 'aaq2', 'gad7', 'cdi2', 'scared', 'sdq', 'cssrs', 'epds'];
                    for (const tk of testKeys) {
                        const def = CLINICAL_TESTS && CLINICAL_TESTS[tk];
                        const isMatch = low.includes(tk) || 
                                       (def && low.includes(def.siglas.toLowerCase())) ||
                                       (def && low.includes(def.nombre.toLowerCase()));
                        if (isMatch) {
                            if (getSavedTestResult(patientName, tk)) {
                                return false; // Already completed, exclude!
                            }
                        }
                    }
                    return true;
                });
                return { cleanText, tests: filtered.slice(0, 3) };
            }
        } catch (e) {
            console.warn("Error parsing PRUEBAS_SUGERIDAS JSON:", e);
        }
    }

    // Do NOT guess or convert regular numbered paragraphs into test recommendation cards
    return { cleanText: content, tests: [] };
};

export const LLMNotebookTab = ({ patientName }) => {
    const [messages, setMessages] = useState(() => loadStoredPatientMessages(patientName));

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
        const k = getNotebookKeys(patientName);
        return localStorage.getItem(k.lastSavedKey) || null;
    });
    const [isSavingManual, setIsSavingManual] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [activeTestRunnerId, setActiveTestRunnerId] = useState(null);
    const [activeTestRunnerInformante, setActiveTestRunnerInformante] = useState('adolescente');
    const [viewingSource, setViewingSource] = useState(null);
    const [pid5Filter, setPid5Filter] = useState('all');
    const [inputMsg, setInputMsg] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [confirmClear, setConfirmClear] = useState(false);
    const [sources, setSources] = useState([]);
    const [selectedSources, setSelectedSources] = useState(new Set());
    const [showSourcesMobile, setShowSourcesMobile] = useState(false);
    const chatScrollRef = useRef(null);
    const prevPatientRef = useRef(patientName);
    const currentPatientRef = useRef(patientName);

    const handleOpenSource = (source) => {
        if (!source) return;
        if (source.testId || (source.id && source.id.startsWith('test_'))) {
            let tId = source.testId;
            if (!tId) {
                const parts = source.id.replace('test_', '').split('_');
                tId = parts[0];
            }
            const inf = source.informante || (source.id.includes('madre') ? 'madre' : 'adolescente');
            setActiveTestRunnerInformante(inf);
            setActiveTestRunnerId(tId);
        } else {
            setViewingSource(source);
        }
    };

    useEffect(() => {
        currentPatientRef.current = patientName;
    }, [patientName]);

    // Synchronous persistence helper to guarantee zero data loss and strict isolation
    const persistMessages = (msgsList, targetName = patientName) => {
        if (!Array.isArray(msgsList) || msgsList.length === 0) return;
        const k = getNotebookKeys(targetName);
        try {
            const taggedMsgs = msgsList.map(m => ({
                role: m.role,
                content: m.content,
                patientOwner: k.safeName
            }));
            const jsonStr = JSON.stringify(taggedMsgs);
            localStorage.setItem(k.messagesKey, jsonStr);
            localStorage.setItem(k.backupKey, jsonStr);
            const timeFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            localStorage.setItem(k.lastSavedKey, timeFormatted);
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
        if (bioStr) {
            availSources.push({ 
                id: 'bio', 
                name: 'Entrevista Biográfica (Completada)', 
                type: 'entrevista', 
                rawData: bioStr,
                content: bioStr 
            });
        }

        // Phenom / Existential
        const phenomStr = localStorage.getItem(`oasis_phenom_qualitative_${patientName}`);
        if (phenomStr) {
            availSources.push({ 
                id: 'phenom', 
                name: 'Diagnóstico Existencial y Fenomenológico (Completado)', 
                type: 'fenomenológico', 
                rawData: phenomStr,
                content: phenomStr 
            });
        }

        // PID-5 (Inventario de Personalidad DSM-5 - Forma Breve)
        const pidStr = localStorage.getItem(`oasis_pid_answers_${patientName}`);
        if (pidStr) {
            let parsedPid = {};
            try { parsedPid = JSON.parse(pidStr); } catch(e) {}
            const pidCalc = calcularResultadoPID5(parsedPid);

            const richPidContent = `INVENTARIO DE PERSONALIDAD PARA EL DSM-5 (PID-5-BF) - FORMA BREVE:
Marco Teórico: Modelo Alternativo para Trastornos de la Personalidad (AMPD) - Criterio B (DSM-5 Sección III)
Puntaje Global: ${pidCalc.totalGlobal} / 75 pts (Promedio general: ${pidCalc.promedioGlobal} / 3.0)
Reactivos Respondidos: ${pidCalc.totalAnswered} de 25
Dominios Clínicos Destacados (Elevaciones): ${pidCalc.dominiosDestacados.map(d => `${d.nombre} (${d.aliasClinico}): ${d.score}/15 pts [${d.nivel}]`).join(', ') || 'Sin elevaciones clínicas significativas (perfil normativo)'}

DESGLOSE POR DOMINIOS CLÍNICOS RESUELTOS (0 a 15 pts cada uno):
${Object.values(pidCalc.dominios).map(d => `• ${d.nombre} (${d.aliasClinico}) [${d.score}/15 pts - Nivel: ${d.nivel}]:
  Interpretación Clínica: ${d.interpretacion}
  Facetas DSM-5: ${d.facetas.join(', ')}`).join('\n\n')}

RESPUESTAS DETALLADAS REACTIVO POR REACTIVO (25 PREGUNTAS):
${PID5_ITEMS.map(item => {
    const val = pidCalc.rawAnswers[item.id];
    const opt = PID5_OPTIONS.find(o => o.value === val);
    return `#${item.id} [${item.domainName} - ${item.faceta}] "${item.text}" -> ${opt ? opt.label : 'Sin responder'} (${val !== undefined ? `${val} pts` : 'N/A'})`;
}).join('\n')}`;

            const topDomainName = pidCalc.dominiosDestacados[0]?.aliasClinico || pidCalc.dominiosDestacados[0]?.nombre || 'Equilibrado';

            availSources.push({ 
                id: 'pid5', 
                name: `Evaluación de Personalidad PID-5 [${pidCalc.totalGlobal}/75 pts - ${topDomainName}]`, 
                type: 'psicometría DSM-5', 
                rawData: pidStr,
                resultData: pidCalc,
                content: richPidContent 
            });
        }

        // Completed Clinical Screening Tests (BAI, PHQ-9, COPE, DERS, AAQ-II, GAD-7, CDI-2, SCARED, SDQ, C-SSRS, EPDS)
        if (CLINICAL_TESTS) {
            Object.keys(CLINICAL_TESTS).forEach(tId => {
                const testDef = CLINICAL_TESTS[tId];
                if (tId === 'sdq') {
                    const resAdoRaw = localStorage.getItem(`oasis_test_result_${patientName}_sdq_adolescente`);
                    const resMadRaw = localStorage.getItem(`oasis_test_result_${patientName}_sdq_madre`);
                    const resGenRaw = localStorage.getItem(`oasis_test_result_${patientName}_sdq`);

                    if (resAdoRaw) {
                        try {
                            const res = JSON.parse(resAdoRaw);
                            availSources.push({
                                id: `test_sdq_adolescente`,
                                testId: 'sdq',
                                informante: 'adolescente',
                                name: `Prueba: SDQ (Autoinforme Adolescente) [${res.nivel} - ${res.totalScore} pts]`,
                                type: 'prueba clínica',
                                resultData: res,
                                content: formatTestResultContent(res, testDef)
                            });
                        } catch(e) {}
                    }
                    if (resMadRaw) {
                        try {
                            const res = JSON.parse(resMadRaw);
                            availSources.push({
                                id: `test_sdq_madre`,
                                testId: 'sdq',
                                informante: 'madre',
                                name: `Prueba: SDQ (Perspectiva Madre) [${res.nivel} - ${res.totalScore} pts]`,
                                type: 'prueba clínica',
                                resultData: res,
                                content: formatTestResultContent(res, testDef)
                            });
                        } catch(e) {}
                    }
                    if (!resAdoRaw && !resMadRaw && resGenRaw) {
                        try {
                            const res = JSON.parse(resGenRaw);
                            availSources.push({
                                id: `test_sdq`,
                                testId: 'sdq',
                                informante: res.informante || 'adolescente',
                                name: `Prueba: SDQ [${res.nivel} - ${res.totalScore} pts]`,
                                type: 'prueba clínica',
                                resultData: res,
                                content: formatTestResultContent(res, testDef)
                            });
                        } catch(e) {}
                    }
                } else {
                    const res = getSavedTestResult(patientName, tId);
                    if (res) {
                        try {
                            availSources.push({
                                id: `test_${tId}`,
                                testId: tId,
                                informante: 'adolescente',
                                name: `Prueba: ${res.nombre || testDef?.siglas || tId.toUpperCase()} [${res.nivel} - ${res.totalScore} pts]`,
                                type: 'prueba clínica',
                                resultData: res,
                                content: formatTestResultContent(res, testDef)
                            });
                        } catch (e) {}
                    }
                }
            });
        }

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
                        rawData: transStr,
                        content: transArr.map(t => `[${t.date}] ${t.filename}: ${t.text}`).join('\n\n') 
                    });
                }
            } catch (e) {}
        }

        // Blocks & Notes
        const blocksStr = localStorage.getItem(`oasis_blocks_${patientName}`);
        if (blocksStr) availSources.push({ id: 'blocks', name: 'Escritos y Bitácora Existencial', type: 'documento', content: blocksStr, rawData: blocksStr });

        const notesStr = localStorage.getItem(`oasis_private_notes_${patientName}`);
        if (notesStr) availSources.push({ id: 'notes', name: 'Formulación y Notas Clínicas', type: 'notas clínicas', content: notesStr, rawData: notesStr });

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

        try {
            const timeRaw = localStorage.getItem(k.lastSavedKey);
            setLastSavedAt(timeRaw || null);
        } catch (e) {
            setLastSavedAt(null);
        }

        if (prevPatientRef.current !== patientName) {
            prevPatientRef.current = patientName;
            const patientMsgs = loadStoredPatientMessages(patientName);
            setMessages(patientMsgs);

            try {
                const savedTest = localStorage.getItem(k.chosenTestKey);
                setChosenTest(savedTest ? JSON.parse(savedTest) : null);
            } catch (e) {
                setChosenTest(null);
            }
        }
    }, [patientName]);

    // Continuous auto-persisting (strictly guarded to current patient)
    useEffect(() => {
        if (messages.length > 0 && currentPatientRef.current === patientName) {
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
        setLastSavedAt(null);
        const k = getNotebookKeys(patientName);
        try {
            localStorage.removeItem(k.messagesKey);
            localStorage.removeItem(k.backupKey);
            localStorage.removeItem(k.chosenTestKey);
            localStorage.removeItem(k.lastSavedKey);
            localStorage.removeItem('oasis_llm_notebook_messages_latest_backup');
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

            // Scan all completed clinical tests for this patient
            const completedTestsSummaryList = [];
            const completedTestIds = new Set();
            if (CLINICAL_TESTS) {
                Object.keys(CLINICAL_TESTS).forEach(tId => {
                    const testDef = CLINICAL_TESTS[tId];
                    if (tId === 'sdq') {
                        const resAdo = getSavedTestResult(patientName, 'sdq', 'adolescente');
                        if (resAdo) {
                            completedTestsSummaryList.push(`• SDQ (Autoinforme Adolescente): ${resAdo.totalScore} pts [${resAdo.nivel}]`);
                            completedTestIds.add('sdq_adolescente');
                            completedTestIds.add('sdq');
                        }
                        const resMad = getSavedTestResult(patientName, 'sdq', 'madre');
                        if (resMad) {
                            completedTestsSummaryList.push(`• SDQ (Perspectiva Madre): ${resMad.totalScore} pts [${resMad.nivel}]`);
                            completedTestIds.add('sdq_madre');
                            completedTestIds.add('sdq');
                        }
                    } else {
                        const res = getSavedTestResult(patientName, tId);
                        if (res) {
                            const sig = testDef?.siglas || tId.toUpperCase();
                            const nom = res.nombre || testDef?.nombre || sig;
                            completedTestsSummaryList.push(`• ${nom} (${sig}): ${res.totalScore} / ${res.maxScore || ''} pts [${res.nivel}]`);
                            completedTestIds.add(tId);
                        }
                    }
                });
            }

            const hasBio = !!localStorage.getItem(`oasis_bio_transcriptions_${patientName}`);
            const hasPhenom = !!localStorage.getItem(`oasis_phenom_qualitative_${patientName}`);
            const hasPid5 = !!localStorage.getItem(`oasis_pid_answers_${patientName}`);
            if (hasPid5) completedTestIds.add('pid5');

            const systemPrompt = `Eres Kio, Psicólogo Clínico Supervisor de alto nivel y colega de interconsulta del terapeuta.
Tu estilo debe ser INTELIGENTE, ORGÁNICO, REALISTA, CURIOSO Y PROFUNDAMENTE FUNCIONAL. Conversas con la agilidad, perspicacia y naturalidad de ChatGPT avanzado entre dos psicólogos clínicos experimentados.

EL USUARIO ES UN PSICÓLOGO CLÍNICO PROFESIONAL:
- NUNCA le preguntes su rol ni añadas disclaimers médicos ("recuerda que soy una IA", "no soy terapeuta").
- Trátalo como a un par profesional: con rigor conceptual y técnico (TCC, ACT, DBT, FAP, Psicometría psicodinámica/funcional), pero con un tono conversacional fresco, humano, cercano y sin rodeos burocráticos.
- Si el usuario dice un saludo breve ("hola", "buen día"), responde con un saludo breve y cálido ("¡Hola! ¿Qué aspecto del caso de ${patientName || 'tu consultante'} quieres que exploremos hoy?"). NUNCA dispares listas no solicitadas ante un simple saludo.

EXPEDIENTE Y EVALUACIONES DE ${patientName ? patientName.toUpperCase() : 'ESTE PACIENTE'}:
1. Entrevista Biográfica: ${hasBio ? 'COMPLETADA (disponible en fuentes)' : 'Pendiente'}
2. Diagnóstico Fenomenológico / Existencial: ${hasPhenom ? 'COMPLETADO (disponible en fuentes)' : 'Pendiente'}
3. Inventario de Personalidad DSM-5 (PID-5-BF): ${hasPid5 ? 'COMPLETADO Y CALIFICADO (5 dominios y 25 facetas en fuentes)' : 'Pendiente'}
4. PRUEBAS PSICOMÉTRICAS DE CRIBAJE YA CONTESTADAS Y CALIFICADAS:
${completedTestsSummaryList.length > 0 ? completedTestsSummaryList.join('\n') : '• Ninguna prueba psicométrica de cribaje adicional aplicada aún.'}

REGLAS CLÍNICAS Y CONVERSACIONALES OBLIGATORIAS:

1. PROHIBICIÓN ESTRICTA DE RECOMENDAR PRUEBAS YA REALIZADAS:
   - El terapeuta ya aplicó y tiene evaluadas las pruebas arriba listadas (${completedTestsSummaryList.length > 0 ? Array.from(completedTestIds).join(', ') : 'ninguna aún'}).
   - NUNCA sugieras ni recomiendes aplicar de nuevo estas pruebas ya contestadas.
   - Si el terapeuta pregunta "¿qué pruebas aplicar?", "¿cómo evalúo?" o "¿qué hacemos ahora?", RECONOCE DE INMEDIATO las pruebas que YA ESTÁN APLICADAS. Integra sus resultados, analiza sus implicaciones y guía al clínico sobre qué significa el cuadro integral y cómo intervenir. No caigas en guiones rígidos ni repitas listas de instrumentos ya contestados.

2. CÓMO "LEER" E INTEGRAR TODAS LAS PRUEBAS QUE YA SE HICIERON (INTEGRACIÓN FUNCIONAL):
   - No te limites a repetir números aislados. Tu valor como supervisor clínico es CONECTAR LOS PUNTOS y entender el proceso real del paciente:
     * Triangula el perfil de personalidad (PID-5) con los síntomas activos (ej. ansiedad somática en BAI, decaimiento en PHQ-9 o rumiación en GAD-7).
     * Cruza las estrategias de afrontamiento (Brief-COPE) con la regulación emocional (DERS-16) y la evitación experiencial (AAQ-II): ¿Qué hace el consultante ante el malestar o la angustia? ¿Se desconecta, se aísla, se culpa, o evita el contacto con sus emociones?
     * Identifica la función del síntoma: ¿Qué protege o de qué intenta escapar este patrón? (Análisis funcional: Antecedente -> Respuesta Interna -> Evitación -> Alivio a corto plazo -> Costo vital a largo plazo).
     * Si hay evaluación multi-informante (ej. SDQ madre vs adolescente), señala con agudeza dónde difiere la vivencia interna del joven respecto a lo que observa la familia.

3. CURIOSIDAD CLÍNICA Y DIÁLOGO EXPLORATORIO:
   - Sé inquisitivo y perspicaz. No des respuestas genéricas de manual; formula hipótesis vivas sobre el consultante.
   - Plantea preguntas reflexivas que abran perspectivas útiles para la próxima sesión con el paciente.
   - Acompaña al terapeuta a pensar, explorar y diseñar intervenciones vivas (experimentos conductuales, defusión cognitiva, aceptación o exposición gradual).

4. RECOMENDACIÓN DE NUEVOS INSTRUMENTOS (SOLO CUANDO SE SOLICITE O FALTE UN ÁREA CRÍTICA):
   - Únicamente si el terapeuta pregunta explícitamente qué otro cribado complementario que NO se haya aplicado convendría considerar (ej. cribado de trauma/TEPT, déficit de atención o riesgo de crisis), sugiere hasta 3 pruebas NUEVAS que no estén ya en su expediente.
   - En ese caso excepcional de pruebas nuevas no realizadas, incluye al final exacto:
   [PRUEBAS_SUGERIDAS: [{"id": "identificador", "nombre": "Nombre del instrumento nuevo", "area": "Área clínica", "justificacion": "Por qué complementa lo ya evaluado"}]]

FUENTES DOCUMENTALES SELECCIONADAS:
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
                temperature: 0.7
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

    const renderSourceModalContent = (source) => {
        if (!source) return null;

        // 1. Biographical Interview
        if (source.id === 'bio') {
            let answers = {};
            try {
                const raw = source.rawData || source.content;
                answers = typeof raw === 'string' ? JSON.parse(raw) : (raw || {});
            } catch(e) {
                answers = {};
            }

            return (
                <div className="space-y-4">
                    <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center gap-2.5">
                        <ShieldCheck size={18} className="shrink-0 text-emerald-400" />
                        <div>
                            <h5 className="font-bold text-xs">Entrevista Biográfica Inicial Registrada</h5>
                            <p className="text-[10px] text-emerald-200/80 font-sans mt-0.5">
                                Respuestas textuales transcritas del paciente @{patientName}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {BIO_QUESTIONS.map((q, idx) => {
                            const answerText = answers[idx] !== undefined 
                                ? answers[idx] 
                                : (answers[String(idx)] !== undefined ? answers[String(idx)] : null);
                            
                            return (
                                <div key={idx} className="space-y-1.5">
                                    {q.section && (
                                        <div className="pt-3 pb-1 border-t border-white/5 first:border-t-0 first:pt-0">
                                            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                                                {q.section}
                                            </span>
                                        </div>
                                    )}
                                    <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-white/5 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-zinc-200">
                                                #{idx + 1}. {q.title}
                                            </span>
                                            <span className="text-[9px] font-mono text-zinc-500 uppercase">Reactivo #{idx + 1}</span>
                                        </div>
                                        <p className="text-[11px] text-zinc-400 italic leading-relaxed">
                                            "{q.text}"
                                        </p>
                                        <div className="mt-2 p-3 rounded-lg bg-black/50 border border-white/5">
                                            <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                                                Respuesta de {patientName}:
                                            </span>
                                            <p className="text-xs text-zinc-100 whitespace-pre-wrap leading-relaxed">
                                                {answerText && String(answerText).trim() 
                                                    ? String(answerText).trim() 
                                                    : <span className="text-zinc-500 italic font-mono text-[11px]">Sin respuesta registrada en la entrevista</span>}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }

        // 2. Phenomenological / Existential Diagnosis
        if (source.id === 'phenom') {
            let phenom = {};
            try {
                const raw = source.rawData || source.content;
                phenom = typeof raw === 'string' ? JSON.parse(raw) : (raw || {});
            } catch(e) {
                phenom = {};
            }

            const dimensions = [
                {
                    key: 'antecedentes_origen',
                    title: 'I. Antecedentes de Origen e Historia Temprana',
                    desc: 'Configuración relacional primaria, mandatos familiares, figuras de apego y génesis del estilo de contacto.',
                    content: phenom.antecedentes_origen || phenom['Antecedentes de Origen'] || phenom['antecedentesOrigen']
                },
                {
                    key: 'experiencia_insuficiencia',
                    title: 'II. Experiencia de Insuficiencia / Autoexigencia',
                    desc: 'La sombra de la autoexigencia, vivencia de no ser suficiente, comparación con ideales y culpa existencial.',
                    content: phenom.experiencia_insuficiencia || phenom['La Sombra de la Autoexigencia'] || phenom['experienciaInsuficiencia']
                },
                {
                    key: 'temporalidad_vivida',
                    title: 'III. Temporalidad Vivida y Aceleración',
                    desc: 'Relación con el tiempo, angustia anticipatoria, ritmo de vida, desconexión del presente y proyección catastrófica.',
                    content: phenom.temporalidad_vivida || phenom['Temporalidad Vivida'] || phenom['temporalidadVivida']
                },
                {
                    key: 'premisa_realidad',
                    title: 'IV. Premisa de Realidad y Visión del Mundo',
                    desc: 'Postura ontológica, seguridad básica en el entorno, desconfianza o apertura vital ante las relaciones.',
                    content: phenom.premisa_realidad || phenom['Premisa de Realidad'] || phenom['premisaRealidad']
                }
            ];

            return (
                <div className="space-y-4">
                    <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 flex items-center gap-2.5">
                        <Brain size={18} className="shrink-0 text-purple-400" />
                        <div>
                            <h5 className="font-bold text-xs">Diagnóstico Existencial y Fenomenológico</h5>
                            <p className="text-[10px] text-purple-200/80 font-sans mt-0.5">
                                Dimensiones cualitativas y vivencia subjetiva del consultante @{patientName}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {dimensions.map(dim => (
                            <div key={dim.key} className="p-4 rounded-xl bg-zinc-900/60 border border-white/5 space-y-2">
                                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                                    {dim.title}
                                </h4>
                                <p className="text-[10px] text-zinc-400 italic">
                                    {dim.desc}
                                </p>
                                <div className="mt-2 p-3 rounded-lg bg-black/50 border border-white/5">
                                    <p className="text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed">
                                        {dim.content && String(dim.content).trim() 
                                            ? String(dim.content).trim() 
                                            : <span className="text-zinc-500 italic font-mono text-[11px]">Sin registro cualitativo para esta dimensión.</span>}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        // 3. PID-5 Personality Inventory (AMPD - DSM-5)
        if (source.id === 'pid5') {
            let pidRaw = {};
            try {
                const raw = source.rawData || source.content;
                pidRaw = typeof raw === 'string' ? JSON.parse(raw) : (raw || {});
            } catch(e) {
                pidRaw = {};
            }

            const pidResult = calcularResultadoPID5(pidRaw);
            const activeFilter = pid5Filter || 'all';

            const filteredItems = activeFilter === 'all'
                ? PID5_ITEMS
                : PID5_ITEMS.filter(item => item.domainKey === activeFilter);

            return (
                <div className="space-y-6 animate-in fade-in duration-200">
                    {/* Header Banner */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-purple-950/40 via-zinc-900/60 to-zinc-950 border border-purple-500/20 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                                    <Activity size={20} />
                                </div>
                                <div>
                                    <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                                        <span>{PID5_METADATA.nombre}</span>
                                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">
                                            {PID5_METADATA.siglas}
                                        </span>
                                    </h4>
                                    <p className="text-[10px] sm:text-[11px] text-zinc-400 font-mono mt-0.5">
                                        {PID5_METADATA.marcoTeorico}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-right">
                                    <span className="text-[9px] font-mono text-zinc-400 block uppercase">Puntaje Global</span>
                                    <span className="text-base font-black font-mono text-white">
                                        {pidResult.totalGlobal} <span className="text-[10px] text-zinc-500 font-normal">/ {pidResult.maxGlobal} pts</span>
                                    </span>
                                </div>
                                <div className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-right">
                                    <span className="text-[9px] font-mono text-zinc-400 block uppercase">Promedio</span>
                                    <span className="text-base font-black font-mono text-purple-300">
                                        {pidResult.promedioGlobal} <span className="text-[10px] text-zinc-500 font-normal">/ 3.0</span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        <p className="text-xs text-zinc-300 font-sans leading-relaxed pt-1 border-t border-white/5">
                            {PID5_METADATA.descripcionClinica}
                        </p>
                    </div>

                    {/* Section 1: Resolved Clinical Domains (Valores Resueltos) */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
                                <ShieldCheck size={14} className="text-purple-400" />
                                <span>Dominios Clínicos Resueltos (Criterio B del DSM-5)</span>
                            </h4>
                            <span className="text-[10px] font-mono text-zinc-500">
                                5 dominios de 0 a 15 puntos
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {Object.values(pidResult.dominios).map(dom => {
                                const percent = Math.round((dom.score / dom.max) * 100);
                                const isHigh = dom.nivelKey === 'alta';
                                const isMod = dom.nivelKey === 'moderada';
                                const badgeClass = isHigh
                                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 font-bold'
                                    : (isMod
                                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 font-bold'
                                        : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300');

                                return (
                                    <div 
                                        key={dom.key} 
                                        className={`p-4 rounded-2xl border transition-all space-y-3 ${
                                            isHigh
                                                ? 'bg-rose-950/15 border-rose-500/30'
                                                : (isMod ? 'bg-amber-950/10 border-amber-500/25' : 'bg-zinc-900/50 border-white/5')
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                                                    <span>{dom.nombre}</span>
                                                    <span className="text-[10px] text-zinc-400 font-normal">({dom.aliasClinico})</span>
                                                </h5>
                                                <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                                                    5 reactivos evaluados
                                                </p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-wider border ${badgeClass}`}>
                                                    {dom.nivel}
                                                </span>
                                                <div className="text-xs font-bold font-mono text-white mt-1">
                                                    {dom.score} / {dom.max} pts
                                                </div>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full transition-all duration-500 ${
                                                    isHigh ? 'bg-rose-500' : (isMod ? 'bg-amber-500' : 'bg-emerald-500')
                                                }`}
                                                style={{ width: `${percent}%` }}
                                            />
                                        </div>

                                        {/* Clinical Meaning */}
                                        <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                                            {dom.interpretacion}
                                        </p>

                                        {/* Facets tag list */}
                                        <div className="pt-2 border-t border-white/5 flex flex-wrap gap-1">
                                            {dom.facetas.map((faceta, fIdx) => (
                                                <span key={fIdx} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-950 text-zinc-400 border border-white/5">
                                                    {faceta}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Section 2: Reactivos Detallados (Preguntas y Respuestas del Paciente) */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/70 border border-white/10 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                            <div>
                                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
                                    <ListChecks size={15} className="text-purple-400" />
                                    <span>25 Reactivos con Pregunta y Respuesta</span>
                                </h4>
                                <p className="text-[10px] text-zinc-400 font-sans mt-0.5">
                                    Inspecciona la redacción de cada pregunta del PID-5 y la respuesta exacta marcada por @{patientName}
                                </p>
                            </div>

                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                                {pidResult.totalAnswered} de 25 contestadas
                            </span>
                        </div>

                        {/* Domain Filter Buttons */}
                        <div className="flex flex-wrap gap-1.5">
                            <button
                                type="button"
                                onClick={() => setPid5Filter('all')}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                                    activeFilter === 'all'
                                        ? 'bg-purple-600 text-white shadow-sm'
                                        : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-white/5'
                                }`}
                            >
                                Todos (25)
                            </button>
                            {Object.values(PID5_DOMAINS).map(d => (
                                <button
                                    key={d.key}
                                    type="button"
                                    onClick={() => setPid5Filter(d.key)}
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                                        activeFilter === d.key
                                            ? 'bg-purple-600 text-white shadow-sm'
                                            : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-white/5'
                                    }`}
                                >
                                    {d.aliasClinico} (5)
                                </button>
                            ))}
                        </div>

                        {/* Questions list */}
                        <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                            {filteredItems.map(item => {
                                const val = pidResult.rawAnswers[item.id];
                                const opt = PID5_OPTIONS.find(o => o.value === val);
                                const isAnswered = val !== undefined;
                                const isHighIntensity = val === 3;
                                const isModIntensity = val === 2;

                                return (
                                    <div 
                                        key={item.id}
                                        className={`p-3.5 rounded-xl border transition-all text-xs space-y-2 ${
                                            isHighIntensity
                                                ? 'bg-purple-950/15 border-purple-500/30'
                                                : (isModIntensity ? 'bg-zinc-900/70 border-white/10' : 'bg-zinc-900/40 border-white/5')
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="space-y-1 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-[10px] font-mono font-bold text-zinc-400">
                                                        #{item.id}
                                                    </span>
                                                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-500/15 text-purple-300 border border-purple-500/25">
                                                        {item.domainName}
                                                    </span>
                                                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-white/5">
                                                        Faceta: {item.faceta}
                                                    </span>
                                                </div>

                                                <p className="text-zinc-100 font-sans text-xs sm:text-sm font-medium leading-snug">
                                                    "{item.text}"
                                                </p>
                                            </div>

                                            <div className="shrink-0 text-right">
                                                {isAnswered ? (
                                                    <div className="inline-flex flex-col items-end">
                                                        <span className={`px-2.5 py-1 rounded-lg border font-mono font-bold text-xs ${opt?.badgeBg || 'bg-purple-500/20 text-purple-200'}`}>
                                                            {opt ? opt.label : `Valor: ${val} pts`}
                                                        </span>
                                                        <span className="text-[9px] font-mono text-zinc-400 mt-0.5">
                                                            Puntaje: {val} pts
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] font-mono text-zinc-500 italic">
                                                        Sin responder
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {opt?.desc && (
                                            <p className="text-[10px] text-zinc-400 italic bg-black/30 p-2 rounded-lg border border-white/5 leading-relaxed">
                                                "{opt.desc}"
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Section 3: Educational scale & methodology */}
                    <div className="p-4 rounded-xl bg-zinc-900/40 border border-white/5 space-y-2">
                        <h4 className="text-[10px] font-mono uppercase tracking-wider text-purple-300 font-bold flex items-center gap-1.5">
                            <BookOpen size={13} /> Baremo y Niveles de Gravedad Dimensional
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
                            <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                                <span className="text-emerald-400 font-bold font-mono text-[10px] block">0 - 5 pts: NIVEL BAJO</span>
                                <p className="text-[10px] text-zinc-400 mt-0.5">Rango adaptativo normativo. Funcionamiento psicológico sin rigidez patológica.</p>
                            </div>
                            <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                                <span className="text-amber-400 font-bold font-mono text-[10px] block">6 - 10 pts: NIVEL MODERADO</span>
                                <p className="text-[10px] text-zinc-400 mt-0.5">Rasgo notable. Puede activarse como vulnerabilidad o generar fricción ante estrés.</p>
                            </div>
                            <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                                <span className="text-rose-400 font-bold font-mono text-[10px] block">11 - 15 pts: NIVEL ELEVADO</span>
                                <p className="text-[10px] text-zinc-400 mt-0.5">Rasgo marcadamente desadaptativo según criterios DSM-5. Prioridad de intervención.</p>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        // 4. Transcripts
        if (source.id === 'transcripts') {
            let transcripts = [];
            try {
                const raw = source.rawData || source.content;
                transcripts = typeof raw === 'string' ? JSON.parse(raw) : raw;
                if (!Array.isArray(transcripts)) transcripts = [];
            } catch(e) {
                transcripts = [];
            }

            if (transcripts.length === 0) {
                return (
                    <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/5 whitespace-pre-wrap leading-relaxed text-zinc-300 text-xs">
                        {source.content}
                    </div>
                );
            }

            return (
                <div className="space-y-3">
                    {transcripts.map((t, i) => (
                        <div key={i} className="p-3.5 rounded-xl bg-zinc-900/60 border border-white/5 space-y-2">
                            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 border-b border-white/5 pb-1.5">
                                <span className="text-blue-300 font-bold">{t.filename || `Sesión #${i + 1}`}</span>
                                <span>{t.date || 'Fecha no registrada'}</span>
                            </div>
                            <p className="text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed">
                                {t.text}
                            </p>
                        </div>
                    ))}
                </div>
            );
        }

        // 5. General documents / notes
        return (
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/5 whitespace-pre-wrap leading-relaxed text-zinc-200 text-xs font-sans">
                {source.content}
            </div>
        );
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
                                className={`p-3 rounded-xl border transition-all flex items-start justify-between gap-2.5 group ${
                                    selectedSources.has(s.id) 
                                    ? 'bg-blue-500/10 border-blue-500/30' 
                                    : 'bg-zinc-900/40 border-white/5 opacity-60 hover:opacity-100'
                                }`}
                            >
                                <div 
                                    onClick={() => toggleSource(s.id)}
                                    className="flex items-start gap-2.5 flex-1 cursor-pointer min-w-0"
                                >
                                    <div className={`w-4 h-4 rounded mt-0.5 shrink-0 flex items-center justify-center border transition-all ${
                                        selectedSources.has(s.id) ? 'bg-blue-500 border-blue-500 text-black' : 'border-zinc-600 text-transparent'
                                    }`}>
                                        <CheckCircle2 size={12} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h4 className={`text-xs font-bold leading-snug line-clamp-2 ${selectedSources.has(s.id) ? 'text-blue-100' : 'text-zinc-400'}`}>
                                            {s.name}
                                        </h4>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <span className="text-[9px] text-zinc-500 font-mono capitalize">{s.type}</span>
                                            {s.resultData?.totalScore !== undefined && (
                                                <span className="text-[9px] font-mono font-bold text-purple-400 bg-purple-500/15 px-1.5 py-0.2 rounded border border-purple-500/20">
                                                    {s.resultData.totalScore} pts
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenSource(s);
                                    }}
                                    title="Abrir y ver respuestas completas / resultados"
                                    className="p-1.5 rounded-lg bg-white/5 hover:bg-purple-600/20 text-zinc-400 hover:text-purple-300 border border-white/10 hover:border-purple-500/40 transition-all shrink-0 flex items-center gap-1 text-[10px] font-mono font-bold"
                                >
                                    <Eye size={12} />
                                    <span>Ver</span>
                                </button>
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
                                    className={`p-2 rounded-xl border flex items-center justify-between gap-2 text-xs transition-all ${
                                        selectedSources.has(s.id) 
                                        ? 'bg-blue-500/15 border-blue-500/40 text-blue-100 font-medium' 
                                        : 'bg-zinc-900/40 border-white/5 text-zinc-500'
                                    }`}
                                >
                                    <div 
                                        onClick={() => toggleSource(s.id)}
                                        className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
                                    >
                                        <div className={`w-4 h-4 rounded shrink-0 flex items-center justify-center border ${
                                            selectedSources.has(s.id) ? 'bg-blue-500 border-blue-500 text-black' : 'border-zinc-700 text-transparent'
                                        }`}>
                                            <CheckCircle2 size={11} />
                                        </div>
                                        <span className="truncate">{s.name}</span>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenSource(s);
                                        }}
                                        className="p-1.5 rounded-lg bg-white/5 text-zinc-300 hover:text-white border border-white/10 shrink-0 flex items-center gap-1 text-[10px] font-mono font-bold"
                                    >
                                        <Eye size={12} />
                                        <span>Ver</span>
                                    </button>
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
                                {getCompletedTestsCount(patientName) > 0 ? (
                                    <button 
                                        onClick={() => handleSend(`Analiza e integra orgánicamente todas las pruebas psicométricas y evaluaciones que ya completamos para ${patientName || 'este paciente'} (PID-5, sintomatología activa, afrontamiento y regulación). ¿Cuál es la lectura clínica conjunta de estos resultados y qué nos revela sobre su proceso real y sus bucles funcionales?`)} 
                                        className="px-3 py-1.5 bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 hover:bg-emerald-500/25 rounded-full text-[10px] font-bold flex items-center gap-1.5 transition-colors shadow-sm shadow-emerald-950"
                                    >
                                        <Sparkles size={11} className="text-emerald-400" /> 
                                        Integrar Pruebas Completadas ({getCompletedTestsCount(patientName)}) y Formulación
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => handleSend(`Tomando en cuenta la historia y perfil de ${patientName || 'este paciente'}, ¿cuáles serían las 3 pruebas de cribaje posteriores más viables y estratégicas para evaluar su sintomatología activa y afrontamiento?`)} 
                                        className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 rounded-full text-[10px] font-bold flex items-center gap-1.5 transition-colors"
                                    >
                                        <Target size={11} className="text-purple-400" /> 
                                        Top 3 Pruebas Posteriores Sugeridas
                                    </button>
                                )}
                                <button onClick={() => setInputMsg("Haz una supervisión clínica del caso estructurada en las 6 capas (Datos, Hipótesis, Huecos, Bucles, Intervenciones y Preguntas).")} className="px-3 py-1.5 bg-zinc-900 border border-white/5 rounded-full text-[10px] text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors">Supervisión Completa</button>
                                <button onClick={() => setInputMsg("Analiza la función de las conductas principales (ej. aislamiento, escuchar música, autocastigo). ¿Qué están intentando regular o evitar?")} className="px-3 py-1.5 bg-zinc-900 border border-white/5 rounded-full text-[10px] text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors">Análisis Funcional Conductual</button>
                                <button onClick={() => setInputMsg("Identifica los huecos de evaluación. ¿Qué nos falta preguntar o comprobar en la siguiente sesión para validar nuestras hipótesis?")} className="px-3 py-1.5 bg-zinc-900 border border-white/5 rounded-full text-[10px] text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors">Huecos y Preguntas</button>
                            </div>
                        </div>
                    )}

                    {messages.map((m, idx) => {
                        const isAssistant = m.role === 'assistant';
                        const { cleanText, tests } = isAssistant ? parseTestRecommendations(m.content, patientName) : { cleanText: m.content, tests: [] };

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

                                                    const matchedTestKey = (() => {
                                                        const low = (test.nombre || '').toLowerCase();
                                                        if (low.includes('ansiedad') || low.includes('beck') || low.includes('bai')) return 'bai';
                                                        if (low.includes('gad') || low.includes('generalizada')) return 'gad7';
                                                        if (low.includes('depres') || low.includes('phq') || low.includes('bdi')) return 'phq9';
                                                        if (low.includes('cope') || low.includes('afronta')) return 'cope';
                                                        if (low.includes('ders') || low.includes('regulaci')) return 'ders16';
                                                        if (low.includes('aaq') || low.includes('aceptaci') || low.includes('act')) return 'aaq2';
                                                        return null;
                                                    })();

                                                    const completedResult = (() => {
                                                        if (!matchedTestKey) return null;
                                                        return getSavedTestResult(patientName, matchedTestKey);
                                                    })();

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

                                                                {completedResult && (
                                                                    <div className="mt-2 px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-mono flex items-center justify-between">
                                                                        <span className="text-emerald-400 font-bold">✓ Aplicada</span>
                                                                        <span className="text-zinc-200">{completedResult.totalScore} pts ({completedResult.nivel})</span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="mt-3 space-y-1.5">
                                                                {matchedTestKey && (
                                                                    <button
                                                                        onClick={() => {
                                                                            setActiveTestRunnerInformante(completedResult?.informante || 'adolescente');
                                                                            setActiveTestRunnerId(matchedTestKey);
                                                                        }}
                                                                        className="w-full py-1.5 px-2 rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all bg-purple-600 hover:bg-purple-500 text-white shadow-sm shadow-purple-600/20"
                                                                    >
                                                                        <Activity size={11} />
                                                                        <span>{completedResult ? 'Ver Respuestas / Reaplicar' : 'Administrar Prueba'}</span>
                                                                    </button>
                                                                )}

                                                                <button
                                                                    onClick={() => handleSelectTest(test)}
                                                                    disabled={isTyping}
                                                                    className={`w-full py-1 px-2 rounded-lg text-[9px] font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                                                                        isSelected 
                                                                            ? 'bg-purple-500/40 text-purple-200 border border-purple-400/40' 
                                                                            : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 border border-white/5'
                                                                    }`}
                                                                >
                                                                    {isSelected ? (
                                                                        <>
                                                                            <Check size={10} /> Consultando con Kio
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            Consultar a Kio <ArrowRight size={9} />
                                                                        </>
                                                                    )}
                                                                </button>
                                                            </div>
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

            {/* Interactive Clinical Test Runner Modal */}
            {activeTestRunnerId && (
                <ClinicalTestRunner
                    testId={activeTestRunnerId}
                    patientName={patientName || 'Paciente'}
                    initialInformante={activeTestRunnerInformante}
                    onClose={() => {
                        setActiveTestRunnerId(null);
                        setActiveTestRunnerInformante('adolescente');
                    }}
                    onSave={(res) => {
                        // Refresh sources list with the new completed test
                        setSources(prev => {
                            const infSuffix = res.testId === 'sdq' && res.informante ? `_${res.informante}` : '';
                            const infLabel = res.testId === 'sdq' && res.informante ? (res.informante === 'madre' ? ' (Perspectiva Madre)' : ' (Autoinforme Adolescente)') : '';
                            const newSource = {
                                id: `test_${res.testId}${infSuffix}`,
                                testId: res.testId,
                                informante: res.informante || 'adolescente',
                                name: `Prueba: ${res.nombre}${infLabel} [${res.nivel} - ${res.totalScore} pts]`,
                                type: 'prueba clínica',
                                resultData: res,
                                content: `EVALUACIÓN PSICOMÉTRICA ESTANDARIZADA:\nInstrumento: ${res.nombre}${infLabel} (${res.testId.toUpperCase()})\nFecha: ${res.dateFormatted || res.completedAt}\nPuntaje Total: ${res.totalScore} / ${res.maxScore} pts\nNivel Clínico: ${res.nivel}\nAlfa de Cronbach: α = ${res.alphaCronbach || '0.80'}\nInterpretación Clínica: ${res.interpretacion}\nSubescalas: ${JSON.stringify(res.subescalas || {})}`
                            };
                            return [newSource, ...prev.filter(s => s.id !== newSource.id)];
                        });
                        const infSuffix = res.testId === 'sdq' && res.informante ? `_${res.informante}` : '';
                        setSelectedSources(prev => new Set([...prev, `test_${res.testId}${infSuffix}`]));
                    }}
                />
            )}

            {/* Non-Test Source Detail Modal (Bio, Phenom, PID-5, Transcripts, Notes) */}
            {viewingSource && (
                <div className="fixed inset-0 z-[3500] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
                    <div className="w-full max-w-3xl bg-[#0d0d12] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                        {/* Modal Header */}
                        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-zinc-950/90">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                                    <BookOpen size={18} />
                                </div>
                                <div>
                                    <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
                                        {viewingSource.name}
                                    </h3>
                                    <p className="text-[10px] sm:text-xs text-zinc-400 font-mono mt-0.5 capitalize">
                                        Expediente clínico de @{patientName} • Tipo: {viewingSource.type}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setViewingSource(null)}
                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 font-sans text-xs">
                            {renderSourceModalContent(viewingSource)}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-3.5 sm:p-4 border-t border-white/10 bg-zinc-950/95 flex items-center justify-between gap-3">
                            <button
                                onClick={() => toggleSource(viewingSource.id)}
                                className={`py-2 px-3.5 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-2 ${
                                    selectedSources.has(viewingSource.id)
                                        ? 'bg-blue-600/20 border border-blue-500/40 text-blue-300'
                                        : 'bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/5'
                                }`}
                            >
                                <CheckCircle2 size={14} className={selectedSources.has(viewingSource.id) ? 'text-blue-400' : 'text-zinc-500'} />
                                <span>{selectedSources.has(viewingSource.id) ? 'Fuente activa en contexto de Kio' : 'Incluir en contexto de Kio'}</span>
                            </button>

                            <button
                                onClick={() => setViewingSource(null)}
                                className="py-2 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-mono text-xs font-bold uppercase tracking-wider border border-white/5 transition-all"
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
