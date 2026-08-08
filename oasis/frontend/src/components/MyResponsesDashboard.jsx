import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Aperture, Activity, ChevronLeft, ChevronRight, ShieldAlert, Sparkles, Brain, Clock, Focus, Target, CheckCircle2, Heart, MessageCircle, AlertTriangle, ArrowRight, X, ChevronDown, ChevronUp, Lock, Network, Maximize2, Minimize2, FileText, ZoomIn, ZoomOut, Move, RotateCw, Key, Compass, Play, Check, Pin, Save, Trash2, MessageSquare } from 'lucide-react';
import { BIO_QUESTIONS } from './BiographicInterview';
import ClinicalTracker from './ClinicalTracker';

const MOCK_AFC_DATA = {
    is_mock: true,
    nodes: [
        // Capa 1: Históricos (Rombos) X: ~10-20%
        { id: "h1", type: "historical", label: "Variable Histórica A", x: 15, y: 25 },
        { id: "h2", type: "historical", label: "Variable Histórica B", x: 15, y: 75 },

        // Capa 2: Biológicos/Sociales (Círculos) X: ~45-55%
        { id: "b1", type: "biological", label: "Mediador Biológico", x: 45, y: 35 },
        { id: "s1", type: "social", label: "Mediador Social", x: 45, y: 65 },

        // Capa 3: Conductas y Mediadores (Rectángulos rojos) X: ~75%
        { id: "c1", type: "motor", label: "Respuesta Motora", x: 75, y: 20 },
        { id: "c2", type: "cognitive", label: "Respuesta Cognitiva", x: 75, y: 50 },
        { id: "c3", type: "physiological", label: "Respuesta Fisiológica", x: 75, y: 80 },

        // Capa 4: Consecuencias (Rectángulos con borde) X: ~90%
        { id: "con1", type: "consequence", label: "Consecuencia General", x: 92, y: 50 }
    ],
    edges: [
        { source: "h1", target: "b1", weight: 1, type: "unidirectional" },
        { source: "h2", target: "s1", weight: 1, type: "unidirectional" },
        { source: "b1", target: "c2", weight: 1, type: "unidirectional" },
        { source: "s1", target: "c1", weight: 1, type: "unidirectional" },
        { source: "b1", target: "c3", weight: 1, type: "unidirectional" },
        { source: "c1", target: "con1", weight: 1, type: "unidirectional" },
        { source: "c2", target: "con1", weight: 1, type: "unidirectional" },
        { source: "c3", target: "con1", weight: 1, type: "unidirectional" }
    ],
    tripleModality: {
        motor: 0,
        cognitive: 0,
        physiological: 0
    },
    hypotheses: {
        mantenimiento: "Los datos aún no han sido procesados. Presiona 'Ver Entrevistas Crudas' en la parte superior y genera tu análisis clínico con IA para obtener resultados precisos.",
        solucion: "Los datos aún no han sido procesados. Presiona 'Ver Entrevistas Crudas' en la parte superior y genera tu análisis clínico con IA para obtener resultados precisos."
    }
};

const BLIND_SPOTS_CONFIG = [
    {
        id: "cronologico",
        title: "Línea de Análisis Crucial (Eslabón Perdido en el Grafo)",
        question: "Tu mapa registra la exigencia externa y la desconexión somática, pero hay un vacío cronológico: ¿qué evento de tu historia familiar o infancia instaló la creencia inconsciente de que descansar es peligroso?",
        node: { id: "blind_spot_cronologico", type: "biological", label: "Brecha Cronológica: Vacío en la Infancia", x: 25, y: 35 },
        edge: { source: "h1", target: "blind_spot_cronologico", weight: 2, type: "unidirectional" }
    },
    {
        id: "funcional",
        title: "Desconexión de Evitación Activa (Función del Síntoma)",
        question: "¿Cómo ha funcionado el cansancio crónico para protegerte de enfrentar el miedo al fracaso en tus proyectos creativos/laborales?",
        node: { id: "blind_spot_funcional", type: "motor", label: "Brecha Funcional: Evitación del Fracaso", x: 75, y: 35 },
        edge: { source: "blind_spot_funcional", target: "con1", weight: 2, type: "unidirectional" }
    },
    {
        id: "identidad",
        title: "Fusión Cognitiva con el Rol de Proveedor",
        question: "Si dejas de sobre-esforzarte, ¿quién eres tú más allá de la utilidad y productividad que entregas a los demás?",
        node: { id: "blind_spot_identidad", type: "cognitive", label: "Brecha de Identidad: Fusión de Rol", x: 75, y: 75 },
        edge: { source: "blind_spot_identidad", target: "con1", weight: 2, type: "unidirectional" }
    },
    {
        id: "relacional",
        title: "Escudo Relacional contra la Intimidad",
        question: "¿De qué manera el mantenerte siempre ocupado te sirve como un escudo para evitar la intimidad o el conflicto en tus relaciones afectivas?",
        node: { id: "blind_spot_relacional", type: "social", label: "Brecha Relacional: Evitación de Intimidad", x: 45, y: 80 },
        edge: { source: "s1", target: "blind_spot_relacional", weight: 2, type: "unidirectional" }
    },
    {
        id: "control",
        title: "Fantasía de Control y Omnipotencia",
        question: "Si aceptas que no puedes controlarlo todo ni salvar a todos a tu alrededor, ¿qué angustia o vacío profundo tendrías que confrontar?",
        node: { id: "blind_spot_control", type: "cognitive", label: "Brecha de Control: Vacío Somático", x: 75, y: 95 },
        edge: { source: "c2", target: "blind_spot_control", weight: 2, type: "unidirectional" }
    },
    {
        id: "cuerpo",
        title: "Anestesia Somática e Indicios Físicos",
        question: "Tu cuerpo te envía señales claras de agotamiento que decides ignorar: ¿qué dolor existencial estás silenciando a través del ruido del activismo constante?",
        node: { id: "blind_spot_cuerpo", type: "physiological", label: "Brecha Somática: Bloqueo de Alerta", x: 45, y: 15 },
        edge: { source: "blind_spot_cuerpo", target: "c3", weight: 2, type: "unidirectional" }
    },
    {
        id: "limites",
        title: "Dificultad de Demarcación y Complacencia",
        question: "¿Cuál es el precio emocional que pagas por no poner límites claros, y qué fantasía de omnipotencia mantienes al intentar complacer a todos?",
        node: { id: "blind_spot_limites", type: "social", label: "Brecha de Límites: Complacencia Excesiva", x: 45, y: 95 },
        edge: { source: "s1", target: "blind_spot_limites", weight: 2, type: "unidirectional" }
    },
    {
        id: "culpa",
        title: "Mandatos de Rendimiento del Pasado",
        question: "Al tomar un momento de descanso absoluto, surge una culpa inmediata: ¿a la mirada de qué figura del pasado estás intentando complacer o pedir aprobación con tu sobreesfuerzo?",
        node: { id: "blind_spot_culpa", type: "historical", label: "Brecha de Aprobación: Culpa Heredada", x: 15, y: 95 },
        edge: { source: "h2", target: "blind_spot_culpa", weight: 2, type: "unidirectional" }
    },
    {
        id: "emocion",
        title: "Inhibición de Afectos Primitivos",
        question: "¿Qué emoción específica (miedo, tristeza, rabia) emerge cuando disminuyes la velocidad y el silencio te rodea?",
        node: { id: "blind_spot_emocion", type: "physiological", label: "Brecha de Emoción: Afecto Inhibido", x: 75, y: 5 },
        edge: { source: "blind_spot_emocion", target: "c3", weight: 2, type: "unidirectional" }
    },
    {
        id: "sentido",
        title: "Vacío de Sentido e Identidad Esencial",
        question: "Si tu valor como ser humano no dependiera de tus logros externos ni de tu rendimiento, ¿cuál sería el sentido de tu existencia en este momento?",
        node: { id: "blind_spot_sentido", type: "cognitive", label: "Brecha de Sentido: Vacío Existencial", x: 75, y: 110 },
        edge: { source: "blind_spot_sentido", target: "con1", weight: 2, type: "unidirectional" }
    }
];


const API_URL = import.meta.env.VITE_API_URL ||
    ((typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.') || window.location.hostname.startsWith('10.')))
        ? `http://${window.location.hostname}:5046`
        : 'https://oasis-production-6303.up.railway.app');

const resolveCollisions = (nodes) => {
    if (!nodes || nodes.length === 0) return nodes;

    const adjustedNodes = nodes.map(n => ({ ...n }));
    const paddingX = 12;
    const paddingY = 8;

    let adjusted = true;
    let iterations = 0;
    const maxIterations = 50;
    const damping = 0.35; // Damping factor to prevent jitter/oscillations

    while (adjusted && iterations < maxIterations) {
        adjusted = false;
        iterations++;
        for (let i = 0; i < adjustedNodes.length; i++) {
            for (let j = i + 1; j < adjustedNodes.length; j++) {
                const n1 = adjustedNodes[i];
                const n2 = adjustedNodes[j];

                let dx = n2.x - n1.x;
                let dy = n2.y - n1.y;

                // Nudge nodes that are directly or nearly on top of each other to break symmetry
                if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
                    dx = (Math.random() - 0.5) * 2;
                    dy = (Math.random() - 0.5) * 2;
                }

                const dx_norm = dx / paddingX;
                const dy_norm = dy / paddingY;
                const dist_norm = Math.hypot(dx_norm, dy_norm) || 0.01;

                if (dist_norm < 1.05) {
                    adjusted = true;

                    const ux = dx_norm / dist_norm;
                    const uy = dy_norm / dist_norm;

                    const overlap = 1.05 - dist_norm;

                    // Move them back with damping to ensure stable convergence
                    const moveX = ux * overlap * damping * paddingX;
                    const moveY = uy * overlap * damping * paddingY;

                    n1.x -= moveX;
                    n1.y -= moveY;
                    n2.x += moveX;
                    n2.y += moveY;

                    // Keep within bounds
                    n1.x = Math.max(-30, Math.min(130, n1.x));
                    n2.x = Math.max(-30, Math.min(130, n2.x));
                    n1.y = Math.max(-120, Math.min(220, n1.y));
                    n2.y = Math.max(-120, Math.min(220, n2.y));
                }
            }
        }
    }
    return adjustedNodes;
};

const getFallbackDescription = (node, user) => {
    if (node && node.id && user) {
        let spotId = node.id;
        if (spotId.startsWith("blind_spot_")) {
            spotId = spotId.substring("blind_spot_".length);
        }
        const question = localStorage.getItem(`oasis_blindspot_question_${user}__${spotId}`);
        const answer = localStorage.getItem(`oasis_blindspot_answer_${user}__${spotId}`);
        if (question && answer) {
            const baseDescription = node.description ? `${node.description}\n\n` : "";
            return `${baseDescription}Pregunta de Introspección: ${question}\n\nTu respuesta y toma de conciencia: ${answer}`;
        }
    }
    if (node && node.description) return node.description;
    if (!node) return "";
    switch (node.type) {
        case 'historical': return "Este es un hecho o vivencia de tu pasado que influye en cómo interpretas el mundo hoy.";
        case 'biological': return "Representa un factor constitucional o físico (ej. cansancio, predisposición al estrés).";
        case 'social': return "Representa un factor de tu entorno o relación con otras personas.";
        case 'motor': return "Representa lo que haces físicamente cuando te sientes abrumado (ej. alejarte, mantenerte activo o posponer cosas).";
        case 'cognitive': return "Representa lo que te dices a ti mismo en silencio (ej. dudas, rumiación mental, culpas).";
        case 'physiological': return "Representa cómo reacciona tu cuerpo físicamente frente al malestar.";
        case 'consequence': return "Representa el resultado de tu reacción (ej. alivio temporal pero frustración o estancamiento a la larga).";
        default: return "Factor de tu mapa conductual.";
    }
};

const findExactUserMention = (node, bioData, phenomData) => {
    if (!node) return null;
    const label = node.label || "";

    // Stop words to filter out
    const stopWords = new Set(["el", "la", "los", "las", "un", "una", "unos", "unas", "de", "del", "a", "al", "en", "con", "y", "o", "u", "por", "para", "si", "no", "mi", "mis", "tu", "tus", "su", "sus", "como", "que", "es", "son", "se", "lo", "te", "me", "nos", "del", "al", "que", "este", "esta", "estos", "estas"]);

    // Extract keywords from node label
    const words = label.toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
        .split(/\s+/)
        .filter(w => w.length > 2 && !stopWords.has(w));

    if (words.length === 0) return null;

    // Helper to find a matching sentence in a block of text
    const findMatchingSentence = (text) => {
        if (!text) return null;
        // Split safely into sentences
        const sentences = text.replace(/([.?!])\s+/g, "$1|").split("|").map(s => s.trim()).filter(Boolean);
        for (const sentence of sentences) {
            const lowerSentence = sentence.toLowerCase();
            // Count keyword matches
            const matchCount = words.filter(w => lowerSentence.includes(w)).length;
            if (matchCount > 0) {
                return { sentence, matches: matchCount };
            }
        }
        return null;
    };

    let bestMatch = null;

    // Search in bioData (Biographical Interview)
    if (bioData) {
        BIO_QUESTIONS.forEach((q, idx) => {
            const answer = bioData[idx];
            if (answer) {
                const match = findMatchingSentence(answer);
                if (match) {
                    if (!bestMatch || match.matches > bestMatch.matches) {
                        bestMatch = {
                            text: `Mencionaste: "${match.sentence}" (en Historia de Vida: ${q.text})`,
                            matches: match.matches
                        };
                    }
                }
            }
        });
    }

    // Search in phenomData (Existential Diagnosis)
    if (phenomData) {
        Object.entries(phenomData).forEach(([key, val]) => {
            if (val && typeof val === 'string') {
                const match = findMatchingSentence(val);
                if (match) {
                    if (!bestMatch || match.matches > bestMatch.matches) {
                        const sectionName =
                            key === 'muerte' ? 'Diagnóstico Existencial: Sentido del Tiempo y Finitud' :
                                key === 'libertad' ? 'Diagnóstico Existencial: Decisiones y Libertad' :
                                    key === 'soledad' ? 'Diagnóstico Existencial: Relaciones y Soledad' :
                                        key === 'vacio' ? 'Diagnóstico Existencial: Propósito y Vacío' :
                                            `Diagnóstico Existencial: Sección ${key}`;
                        bestMatch = {
                            text: `Mencionaste: "${match.sentence}" (en ${sectionName})`,
                            matches: match.matches
                        };
                    }
                }
            }
        });
    }

    if (bestMatch) {
        return bestMatch.text;
    }

    // Fallbacks based on category if no exact keyword sentence matches
    if (node.type === 'historical' && bioData) {
        if (bioData[1] && bioData[1].length > 15) return `Mencionaste: "${bioData[1].substring(0, 120)}..." (en tu Historia de Vida)`;
        if (bioData[0] && bioData[0].length > 15) return `Mencionaste: "${bioData[0].substring(0, 120)}..." (en tu Historia de Vida)`;
    }

    if (node.type === 'social' && bioData) {
        if (bioData[2] && bioData[2].length > 15) return `Mencionaste: "${bioData[2].substring(0, 120)}..." (en tu Historia de Vida)`;
    }

    if (node.type === 'cognitive' && phenomData) {
        if (phenomData.vacio && phenomData.vacio.length > 15) return `Mencionaste: "${phenomData.vacio.substring(0, 120)}..." (en Diagnóstico Existencial: Propósito y Vacío)`;
    }

    return null;
};

const getFallbackSource = (node, bioData, phenomData) => {
    if (node && node.source) return node.source;
    if (!node) return "";

    const exactMention = findExactUserMention(node, bioData, phenomData);
    if (exactMention) return exactMention;

    switch (node.type) {
        case 'historical': return "Relato de tu Entrevista de Vida (Historia personal y dinámicas de tu pasado).";
        case 'biological': return "Reporte de sintomatología biológica o reactividad temperamental expresada en el test PID-5.";
        case 'social': return "Respuestas de tu Entrevista de Vida sobre relaciones familiares, sociales o de pareja.";
        case 'motor': return "Comportamientos y evitaciones reportados en tu Diagnóstico Existencial.";
        case 'cognitive': return "Diálogos internos, culpas y esquemas cognitivos reportados en el Diagnóstico Existencial.";
        case 'physiological': return "Sintomatología física y activación del sistema nervioso reportada en tus respuestas.";
        case 'consequence': return "Consecuencias a largo plazo y bucles de mantenimiento descritos en tus respuestas.";
        default: return "Información extraída de tus entrevistas y evaluaciones clínicas.";
    }
};

const getFallbackChallenge = (node, user) => {
    if (node && node.id && user) {
        let spotId = node.id;
        if (spotId.startsWith("blind_spot_")) {
            spotId = spotId.substring("blind_spot_".length);
        }
        const question = localStorage.getItem(`oasis_blindspot_question_${user}__${spotId}`);
        const answer = localStorage.getItem(`oasis_blindspot_answer_${user}__${spotId}`);
        if (question && answer) {
            if (node.challenge) return node.challenge;
            return `Punto ciego clínico resuelto e integrado como eslabón activo de autorregulación.`;
        }
    }
    if (node && node.challenge) return node.challenge;
    if (!node) return "";
    switch (node.type) {
        case 'historical':
            return "Las vivencias y heridas del pasado no quedan en el ayer, sino que actúan como esquemas protectores intensamente activos en tu presente. Repites este patrón de manera automática porque tu sistema de alerta asocia los estímulos actuales con la desprotección, invalidación o dolor experimentados en tu infancia. Al hacerlo, tu inconsciente intenta mantenerte a salvo reactivando la misma estrategia defensiva que en su momento te permitió sobrevivir, aunque hoy en día ya no sea necesaria y limite tu libertad.";
        case 'biological':
            return "La activación fisiológica y tu predisposición reactiva no representan un fallo de tu organismo, sino la respuesta adaptativa y evolutiva de tu cuerpo diseñada para protegerte ante amenazas percibidas. Tu sistema nervioso autónomo mantiene un estado de alerta y tensión constante porque interpreta la realidad circundante a través de un prisma de vulnerabilidad acumulada. Esta hiperreactividad corporal es el eco de una alarma interna que sigue intentando defenderte de peligros que tu mente racional ya sabe que han pasado.";
        case 'social':
            return "Tus interacciones y respuestas dentro de tu entorno social y afectivo reflejan una profunda búsqueda de pertenencia, reconocimiento y seguridad interpersonal. A menudo adoptas roles defensivos, de aislamiento o de complacencia excesiva para proteger el vínculo con las personas que te rodean, intentando evitar a toda costa revivir el dolor del rechazo, la invalidación o el abandono que marcaron tus primeras relaciones significativas.";
        case 'motor':
            return "Esta conducta motora de escape o evitación se activa porque ofrece una vía de escape inmediata y efectiva ante el malestar emocional o existencial. Tu mente selecciona este comportamiento automático como un mecanismo de amortiguación a corto plazo para mitigar la ansiedad y la incomodidad interna. Sin embargo, al postergar o evadir la confrontación directa del problema, este alivio inmediato refuerza el hábito y termina por estancar tu desarrollo existencial a largo plazo.";
        case 'cognitive':
            return "La rumiación de pensamientos automáticos, la autocrítica severa o la culpa constante son intentos desesperados de tu mente por anticipar, controlar y prevenir posibles peligros o errores en tu vida. Tu diálogo interno se torna rígido porque existe la creencia inconsciente de que juzgarte o hiper-analizar cada escenario te mantendrá bajo control y evitará que seas vulnerable ante los demás, actuando como una ilusión de seguridad cognitiva que en realidad perpetúa tu sufrimiento.";
        case 'physiological':
            return "La tensión muscular acumulada, el insomnio persistente o la agitación física representan la energía somática no procesada y contenida que tu cuerpo ha almacenado al no poder descargarla de forma saludable. Esta respuesta es la manifestación somática directa de una lucha interna por recuperar la homeostasis y el equilibrio fisiológico frente a demandas emocionales y existenciales que superan tu capacidad de procesamiento actual.";
        case 'consequence':
            return "El bucle de mantenimiento de tu mapa conductual se consolida debido a que la consecuencia inmediata a corto plazo (que suele ser el alivio, la seguridad o la evitación del dolor) actúa como un poderoso refuerzo que consolida el hábito. Al no experimentar nuevas alternativas de respuesta, tu sistema se habitúa a reaccionar del mismo modo, atrapándote en un círculo vicioso donde la supuesta solución del presente se convierte en el problema del futuro.";
        default:
            return "Esta reacción se activa como un mecanismo de adaptación para enfrentar situaciones percibidas como demandantes o amenazantes en tu vida cotidiana.";
    }
};

const formatTreatmentField = (fieldValue) => {
    if (!fieldValue) return '';
    if (typeof fieldValue === 'string') return fieldValue;
    if (Array.isArray(fieldValue)) {
        if (fieldValue.length > 0 && typeof fieldValue[0] === 'string') return fieldValue.join('\n');
        return JSON.stringify(fieldValue, null, 2);
    }
    return JSON.stringify(fieldValue, null, 2);
};

const AutoResizeTextarea = ({ value, onChange, className }) => {
    const textareaRef = useRef(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = (textareaRef.current.scrollHeight) + 'px';
        }
    }, [value]);

    return (
        <textarea
            ref={textareaRef}
            value={value}
            onChange={onChange}
            className={`custom-sidebar-scroll resize-none ${className}`}
        />
    );
};

const MyResponsesDashboard = ({ user, onClose, accent = '#a855f7', conversations = [], activeConversationId = null, onOpenNodeChat, isEmbedded = false }) => {
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => setIsMounted(true), 150);
        return () => clearTimeout(timer);
    }, []);

    const isMobileDevice = window.innerWidth < 768;
    const VIRTUAL_WIDTH = isMobileDevice ? 1000 : 1400;
    const VIRTUAL_HEIGHT = isMobileDevice ? 2400 : 1600;
    const [phenomData, setPhenomData] = useState(null);
    const [bioData, setBioData] = useState(null);
    const [pidData, setPidData] = useState(null);
    const [pidIndices, setPidIndices] = useState(null);
    const [activePidTab, setActivePidTab] = useState('reactividad');
    const [isGeneratingKio, setIsGeneratingKio] = useState(false);
    const [isGeneratingDynamicTraits, setIsGeneratingDynamicTraits] = useState(false);
    const [kioMemory, setKioMemory] = useState([]);
    const importFileInputRef = useRef(null);

    const handleImportDoc = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const text = evt.target.result;
                const scriptMatch = text.match(/<script id="oasis-migration-data" type="application\/json">(.*?)<\/script>/s);
                const divMatch = text.match(/<div id="oasis-migration-data" style="display: none;">(.*?)<\/div>/s);
                const commentMatch = text.match(/<!-- OASIS_MIGRATION_DATA:(.*?) -->/s);
                
                let data = null;
                if (commentMatch && commentMatch[1]) {
                    data = JSON.parse(commentMatch[1].replace(/~~/g, '--'));
                } else if (divMatch && divMatch[1]) {
                    data = JSON.parse(decodeURIComponent(atob(divMatch[1])));
                } else if (scriptMatch && scriptMatch[1]) {
                    data = JSON.parse(scriptMatch[1]);
                }

                if (data) {
                    for (const [key, value] of Object.entries(data)) {
                        const localKey = key.replace('_%USER%', `_${user}`);
                        setLocalItem(localKey, value);
                    }
                    alert("Informe importado exitosamente. La página se recargará para aplicar los datos.");
                    window.location.reload();
                } else {
                    alert("El documento no contiene datos de migración válidos.");
                }
            } catch (err) {
                console.error(err);
                alert("Error al procesar el archivo: " + err.message);
            }
            e.target.value = null;
        };
        reader.readAsText(file);
    };

    const setLocalItem = useCallback((key, value) => {
        localStorage.setItem(key, value);
        if (user) {
            fetch(`${API_URL}/api/oasis/clínical-data?user=${user}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [key]: value })
            }).catch(e => console.error("Error syncing to backend:", e));
        }
    }, [user]);

    const [completedTrackerTasks, setCompletedTrackerTasks] = useState(0);
    const [unlockedCount, setUnlockedCount] = useState(6);
    const [showUnlockNotification, setShowUnlockNotification] = useState(false);
    const [recentlyUnlocked, setRecentlyUnlocked] = useState(0);

    // Track completed tasks to unlock loops
    useEffect(() => {
        const checkTrackerProgress = () => {
            try {
                const saved = localStorage.getItem(`oasis_tracker_activities_${user}`);
                if (saved) {
                    const activities = JSON.parse(saved);
                    const completed = activities.filter(a => a.completed).length;
                    setCompletedTrackerTasks(completed);
                }
            } catch {}
        };
        checkTrackerProgress();
        const interval = setInterval(checkTrackerProgress, 2000);
        return () => clearInterval(interval);
    }, [user]);

    useEffect(() => {
        setUnlockedCount(prev => {
            const newUnlockedCount = 6 + Math.floor(completedTrackerTasks / 2);
            if (newUnlockedCount > prev && prev >= 6) {
                setRecentlyUnlocked(newUnlockedCount - prev);
                setShowUnlockNotification(true);
                setTimeout(() => setShowUnlockNotification(false), 5000);
            }
            return newUnlockedCount;
        });
    }, [completedTrackerTasks]);

    
    
    useEffect(() => {
        if (user) {
            fetch(`${API_URL}/api/oasis/memory?user=${user}`)
                .then(res => res.json())
                .then(data => {
                    if (data.memory) setKioMemory(JSON.parse(data.memory));
                })
                .catch(console.error);
        }
    }, [user]);

    
    const generateDynamicTraits = async () => {
        setIsGeneratingDynamicTraits(true);
        let aiContent = "";
        try {
            let activeKey = localStorage.getItem('oasis_deepseek_key') || '';
            if (!activeKey) {
                activeKey = atob('c2stZmI3N2RiMTIyNjM4NDdjOGI1N2E0ODI5Nzk3NmM4NzU=');
                if (activeKey.includes("07b18eb6601a4b11a109c96a56c92a16") || activeKey.includes("VAR>")) activeKey = '';
            }

            const rawPID = pidIndices?.raw || {};
            const rawM = (rawPID['m1'] || 0) + (rawPID['m2'] || 0) + (rawPID['m3'] || 0);
            const rawC = (rawPID['c1'] || 0) + (rawPID['c2'] || 0) + (rawPID['c3'] || 0);
            const rawS = (rawPID['s1'] || 0) + (rawPID['s2'] || 0) + (rawPID['s3'] || 0);

            let userResponsesText = "Respuestas del usuario no encontradas.";
            if (typeof phenomData !== 'undefined' && phenomData) {
                userResponsesText = Object.entries(phenomData)
                    .map(([qId, r]) => {
                        return `Pregunta: ${qId}\nRespuesta: ${r}`;
                    })
                    .join('\n\n');
            }

            const prompt = `
Eres un analista clínico experto. Tu tarea es analizar los datos psicométricos y la historia del paciente para generar descripciones clínicas profundas y detalladas de sus malestares y rasgos de personalidad (PID-5).
Debes devolver ÚNICAMENTE un objeto JSON válido con las siguientes claves:
- "malestarCognitivo": Análisis profundo del malestar cognitivo (Dudas, rumiación, autocrítica).
- "malestarMotor": Análisis profundo del malestar motor (Evitaciones, conductas de escape).
- "malestarFisiologico": Análisis profundo del malestar fisiológico (Tensión, somatización).
- "pidReactividad": Análisis profundo de su Reactividad (Afectividad Negativa).
- "pidConexion": Análisis profundo de su Conexión (Desapego).
- "pidAsertividad": Análisis profundo de su Asertividad (Antagonismo).
- "pidRitmo": Análisis profundo de su Ritmo (Desinhibición).
- "pidSingularidad": Análisis profundo de su Singularidad (Psicoticismo).
- "publicTraits": Un objeto JSON que represente su "Firma de Resonancia Existencial". Debe usar un lenguaje hermosamente literario y empático, pero ESTRICTAMENTE ANCLADO EN LA VERDAD DE SU HISTORIA. Debe sentirse profundamente personalizado, conectando sus vivencias reales, sus miedos y su dolor en una metáfora literaria sin perder el sentido de quién es (no lo hagas tan abstracto que pierda conexión con su vida real). Debe estar escrito estrictamente en PRIMERA PERSONA ('yo', 'soy', 'mi'), como si el paciente mismo estuviera verbalizando el fondo de su alma. Enfócate en la belleza de su tensión interna y sus anhelos más profundos. Debe ser UN SOLO PÁRRAFO con una longitud visual de aproximadamente 5 renglones. Estructura estricta:
  {
     "sintesis": "Párrafo poético, cálido y profundo anclado en su historia real (aprox 5 líneas).",
     "keywords": ["Palabra1", "Palabra2", "Palabra3"]
  }

DATOS DEL PACIENTE:
- Malestar Motor Bruto: ${rawM}
- Malestar Cognitivo Bruto: ${rawC}
- Malestar Fisiológico/Somático Bruto: ${rawS}
- Rasgos PID-5 en bruto: ${JSON.stringify(rawPID)}

RESPUESTAS EXISTENCIALES:
${userResponsesText}
`;

            const payload = {
                model: 'deepseek-chat',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.6,
                response_format: { type: "json_object" }
            };

            const res = await fetch(`${API_URL}/api/oasis/config/chat-completion`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ endpoint: 'https://api.deepseek.com/chat/completions', key: activeKey, payload })
            });

            if (!res.ok) throw new Error("Network response was not ok");
            
            const data = await res.json();
            aiContent = data.choices[0].message.content;
            
            // Strip markdown block if present
            const cleanContent = aiContent.replace(/^[\s\n]*```(?:json)?[\s\n]*/i, '').replace(/[\s\n]*```[\s\n]*$/i, '');
            const parsedContent = JSON.parse(cleanContent);
            
            // LLMs sometimes nest things unexpectedly, search deeply for habitar
            let pTraits = parsedContent.publicTraits || parsedContent.PublicTraits;
            if (!pTraits && parsedContent.FirmaDeResonancia) pTraits = parsedContent.FirmaDeResonancia;
            if (!pTraits && parsedContent["Firma de Resonancia Existencial"]) pTraits = parsedContent["Firma de Resonancia Existencial"];
            
            // If still not found, check if it's flat on the root object
            if (!pTraits && (parsedContent.sintesis || parsedContent.Sintesis || parsedContent.habitar || parsedContent.Habitar)) {
                pTraits = parsedContent;
            }

            // If still not found, let's search all values in case it nested it deeper
            if (!pTraits || (typeof pTraits === 'object' && !pTraits.sintesis && !pTraits.Sintesis && !pTraits.habitar && !pTraits.Habitar)) {
                for (const key in parsedContent) {
                    const val = parsedContent[key];
                    if (val && typeof val === 'object' && (val.sintesis || val.Sintesis || val.habitar || val.Habitar)) {
                        pTraits = val;
                        break;
                    }
                }
            }

            if (pTraits) {
                // Ensure keys are lowercase before saving
                const normalizedTraits = {
                    sintesis: pTraits.sintesis || pTraits.Sintesis || '',
                    habitar: pTraits.habitar || pTraits.Habitar || '',
                    vinculo: pTraits.vinculo || pTraits.Vinculo || pTraits.vínculo || pTraits.Vínculo || '',
                    busqueda: pTraits.busqueda || pTraits.Busqueda || pTraits.búsqueda || pTraits.Búsqueda || '',
                    keywords: pTraits.keywords || pTraits.Keywords || []
                };
                setLocalItem(`oasis_public_traits_${user}`, JSON.stringify(normalizedTraits));
                
                // Add to clinical report view
                parsedContent["Firma de Resonancia"] = normalizedTraits.sintesis ? 
                    `Síntesis Existencial: ${normalizedTraits.sintesis}` :
                    `Habitar: ${normalizedTraits.habitar}\n` +
                    `Vínculo: ${normalizedTraits.vinculo}\n` +
                    `Búsqueda: ${normalizedTraits.busqueda}\n` +
                    `Palabras clave: ${(normalizedTraits.keywords || []).join(', ')}`;
                
                delete parsedContent.publicTraits;
                delete parsedContent.PublicTraits;
            } else {
                alert("Kio generó el análisis, pero no incluyó la 'Firma de Resonancia' en el formato correcto. Por favor, dale al botón de generar de nuevo para que lo intente otra vez.");
                parsedContent["Firma de Resonancia (Aviso)"] = "La IA no pudo estructurar la firma correctamente. Intenta generar el análisis de nuevo.";
            }
            handleTreatmentPlanChange('dynamicTraits', parsedContent);
        } catch (e) {
            console.error(e);
            alert("Kio tuvo un problema estructurando el formato JSON del análisis profundo. Revisa el apartado 'Respuesta Cruda' en el informe clínico.");
            
            // Salvage the raw text and show it in the dashboard so it's not lost
            const fallbackContent = {
                "Error de Estructura": "La IA no devolvió el formato JSON válido que se le pidió. A continuación se muestra lo que respondió:",
                "Respuesta Cruda": aiContent ? aiContent : "Datos no disponibles."
            };
            handleTreatmentPlanChange('dynamicTraits', fallbackContent);
        } finally {
            setIsGeneratingDynamicTraits(false);
        }
    };

    const [contextualReportHtml, setContextualReportHtml] = useState(() => {
        try { return localStorage.getItem(`oasis_contextual_report_${user}`) || ''; } catch { return ''; }
    });
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [improvementPrompt, setImprovementPrompt] = useState('');
    const [isImprovingReport, setIsImprovingReport] = useState(false);

    const generateContextualReport = async () => {
        setIsGeneratingReport(true);
        try {
            let activeKey = localStorage.getItem('oasis_deepseek_key') || '';
            const endpoint = localStorage.getItem('oasis_deepseek_endpoint') || 'https://api.deepseek.com/chat/completions';
            const model = localStorage.getItem('oasis_deepseek_model') || 'deepseek-chat';
            
            const prompt = `
Eres un Psicólogo Clínico Experto en Terapias Contextuales (ACT, FAP) y el Modelo Multimodal Experiencial.
Tu tarea es redactar un "Informe Psicológico Clínico y Plan de Intervención" completo, profundo, riguroso y bellamente redactado en formato HTML.

CRÍTICO - FILOSOFÍA DEL MODELO MULTIMODAL EXPERIENCIAL:
No uses un lenguaje pasivo ni propongas terapias intelectualizadas (cero diarios de emociones o metáforas pasivas de consultorio). 
DEBES diseñar una intervención activa, somática y expresiva ÚNICA para este paciente. 
Usa el arte, el sonido, el cuerpo y el andamiaje ejecutivo (acciones en el mundo real, límites, planes de negocio/vida).
ADAPTA las técnicas al paciente: no uses siempre la misma música o técnica, inventa experiencias que resuenen con su caso particular. Mantén un alto nivel de rigor clínico.
NUEVA REGLA (EVITACIÓN VS REGULACIÓN): Diferencia cuidadosamente entre conductas de evitación y conductas legítimas de regulación (ej. reducir sobreestimulación, buscar silencio). No etiquetes automáticamente el aislamiento, el descanso o el baño como evitación. Considera la sobrecarga de estímulos.
NUEVA REGLA (LENGUAJE CONTEXTUAL): Evita palabras hidráulicas como "descarga corporal" o "liberación". Utiliza términos como: contacto, discriminación, expresión, regulación y elección conductual. Enseña que la emoción no es una presión que debe salir físicamente, sino una experiencia que reconocer y elegir qué hacer con ella.
NUEVA REGLA (CONTINUIDAD Y MOTIVACIÓN): Explora ciclos más profundos más allá del "perfeccionismo". Analiza el patrón de "motivación → exigencia → error → saturación → colapso → reinicio". ¿Qué pasa cuando desaparece la motivación inicial?

CRÍTICO - TONO Y PRUDENCIA CLÍNICA (HIPÓTESIS, NO VERDADES ABSOLUTAS):
Es vital que el tono del informe sea el de una "formulación clínica provisional". Frena la interpretación excesivamente segura. No conviertas intuiciones en verdades absolutas demasiado pronto (Ej. no digas que el reflujo es el único canal de expresión de la rabia; mantén abierta la vía de estrés exacerbando una condición médica). Usa un lenguaje hipotético y tentativo en tus análisis ("parece sugerir", "podría estar funcionando como").

Datos del paciente:
- Nombre: ${user}
- Respuestas Fenomenológicas: ${JSON.stringify(phenomData)}
- Entrevista Biográfica: ${JSON.stringify(bioData)}
- Mapa de Bucles (Análisis Funcional): ${JSON.stringify(afcData)}
- Perfil PID-5: ${JSON.stringify(pidIndices)}

ESTRUCTURA HTML REQUERIDA (¡PROHIBIDO USAR MARKDOWN! Debes incluir estrictamente estos apartados usando etiquetas semánticas HTML reales. Todo texto debe estar envuelto en <p>, <li>, <h1>, <h2>, <h3>, <ol>, <ul>, <strong>. Si usas texto plano se romperá la vista):

<h1>INFORME CLÍNICO PSICOLÓGICO</h1>
<p><strong>Formulación de Caso desde un Enfoque Contextual e Integrativo</strong></p>

<h2>1. Datos y motivo de consulta</h2>
<ul>
  <li><strong>Nombre:</strong> ${user}</li>
  <li><strong>Edad:</strong> (Estímala o extráela de los datos)</li>
  <li><strong>Ocupación:</strong> (Extráela de los datos)</li>
  <li><strong>Modalidad de atención:</strong> Psicoterapia individual</li>
  <li><strong>Herramientas de evaluación utilizadas:</strong> Entrevista fenomenológica, entrevista biográfica/clínica, e Inventario de Personalidad (PID-5). (INSTRUCCIÓN: Si los datos del PID-5 no aportan significativamente al análisis de este caso, omite el PID-5 de esta lista. Si lo dejas, intégralo realmente en la formulación).</li>
</ul>
<h3>Motivo de consulta</h3>
<p>(Redacta la demanda del paciente integrando sus síntomas y el contexto general...)</p>

<h2>2. Historia y desarrollo del problema</h2>
<p>(Describe cómo el problema actual se asienta sobre la historia de aprendizaje, creencias tempranas, mandatos, eventos clave, etc...)</p>

<h2>3. Funcionamiento actual por dominios</h2>
<p>(Analiza el funcionamiento del paciente en los distintos dominios de su vida: interpersonal, laboral, emocional, etc., basados en los datos...)</p>

<h2>4. Análisis funcional detallado</h2>
<p>(Diseña un circuito funcional claro y específico para este paciente siguiendo estrictamente esta cadena:)</p>
<ul>
  <li><strong>Historia de aprendizaje:</strong> ...</li>
  <li><strong>Activadores actuales (Situación):</strong> ...</li>
  <li><strong>Procesos internos (Interpretación / Activación fisiológica / Emoción):</strong> ...</li>
  <li><strong>Conductas observables (Bloqueo / Evitación / Explosión):</strong> ...</li>
  <li><strong>Consecuencias inmediatas:</strong> ...</li>
  <li><strong>Consecuencias a largo plazo (El costo):</strong> ...</li>
</ul>

<h2>5. Procesos de flexibilidad/inflexibilidad psicológica</h2>
<p>(Identifica y describe los procesos presentes: fusión cognitiva, evitación experiencial, apego al autoconcepto, desconexión del presente, falta de claridad en valores, inacción...)</p>

<h2>6. Hipótesis central + hipótesis alternativas</h2>
<p>(Redacta la hipótesis transversal del caso. Usa un tono de prudencia clínica ("parece que", "se hipotetiza que"). Diferencia el contenido cognitivo -ej. insuficiencia- del proceso organizador subyacente -ej. invalidación interpersonal- si aplica al caso. Añade breves hipótesis alternativas a considerar.)</p>

<h2>7. Factores predisponentes, precipitantes y mantenedores</h2>
<ul>
  <li><strong>Predisponentes:</strong> (Qué lo hizo vulnerable históricamente)</li>
  <li><strong>Precipitantes:</strong> (Qué detonó la crisis actual)</li>
  <li><strong>Mantenedores:</strong> (Qué hace que el problema no se resuelva hoy)</li>
</ul>

<h2>8. Recursos y factores protectores</h2>
<p>(Lista y explica las fortalezas, habilidades, redes de apoyo, pasiones y talentos reales detectados en los datos...)</p>

<h2>9. Evaluación de riesgo y aspectos a descartar</h2>
<p>(Esta sección DEBE SER RIGUROSA. Separa y documenta explícitamente: 1) Ideación suicida actual (presencia, plan, intención). 2) Autolesiones (antecedentes, función, urgencia). 3) Factores protectores que justifican tu evaluación de riesgo. Justifica si el riesgo es bajo, moderado o alto. Finalmente, señala áreas médicas a descartar (ej. evaluar orgánicamente síntomas gastrointestinales o de sueño antes de asumirlos psicosomáticos).)</p>

<h2>10. Objetivos terapéuticos operacionalizados</h2>
<ol>
  <li>(Genera objetivos terapéuticos dinámicos, inteligentes y específicos para el sistema funcional del paciente...)</li>
</ol>

<h2>11. Plan experimental de 4 sesiones</h2>
<p><strong>Consideración previa:</strong> El plan constituye una propuesta inicial de trabajo experimental y colaborativo para recopilar información y testear las hipótesis.</p>

<h3>Sesión 1: Construcción colaborativa del mapa clínico (El Laboratorio)</h3>
<ul>
  <li><strong>Objetivo:</strong> Convertir la sesión en un laboratorio colaborativo. En lugar de imponer la hipótesis ("tu problema es este"), se plantea: "Tengo una hipótesis, pero quiero comprobar contigo si describe tu experiencia".</li>
  <li><strong>Exploración (El cuerpo como entrada):</strong> Utilizar el cuerpo como primera entrada al tratamiento, ya que a menudo anuncia la emoción antes de poder verbalizarla. Explorar la secuencia: Cuando ocurre X... ¿qué notas primero en el cuerpo? ¿qué te dices? ¿qué impulso aparece? ¿qué terminas haciendo? ¿qué obtienes y qué te cuesta?</li>
</ul>

<h3>Sesión 2: [Título dinámico y experiencial para la sesión 2]</h3>
<ul>
  <li><strong>Objetivo central:</strong> (Generado dinámicamente)</li>
  <li><strong>Intervención experiencial:</strong> (Ejercicio somático, contextual o conductual. JUSTIFICA por qué esta intervención es el experimento adecuado para testear tu hipótesis de la sesión)</li>
  <li><strong>Tarea:</strong> ...</li>
</ul>

<h3>Sesión 3: [Título dinámico y experiencial para la sesión 3]</h3>
<ul>
  <li><strong>Objetivo central:</strong> (Generado dinámicamente)</li>
  <li><strong>Intervención experiencial:</strong> (Ejercicio somático, contextual o conductual. JUSTIFICA explícitamente la relación entre la hipótesis clínica y este experimento)</li>
  <li><strong>Tarea:</strong> ...</li>
</ul>

<h3>Sesión 4: [Título dinámico para la sesión 4: Revisión]</h3>
<ul>
  <li><strong>Objetivo central:</strong> Integrar los descubrimientos de las primeras sesiones y revisar el apoyo a las hipótesis.</li>
  <li><strong>Revisión:</strong> ...</li>
</ul>

<h2>12. Indicadores para saber si la hipótesis está funcionando</h2>
<p><strong>¿Qué tendría que observar en el paciente después de cada intervención para considerar que mi hipótesis recibió apoyo?</strong></p>
<ul>
  <li>(Enumera 3-5 indicadores conductuales, fisiológicos o narrativos específicos que probarían que el tratamiento va por buen camino...)</li>
</ul>

<h2>13. Criterios para modificar el tratamiento</h2>
<p>(¿Bajo qué señales, respuestas del paciente o falta de avance se debería descartar la hipótesis central y cambiar el enfoque terapéutico?)</p>

<h2>14. Líneas de continuidad</h2>
<ul>
  <li>(Estrategias a largo plazo, consolidación de identidad, valores y proyecto vital...)</li>
</ul>

Devuelve ÚNICAMENTE el código HTML crudo. No devuelvas Markdown. No incluyas \`\`\`html al inicio ni al final, solo el HTML validado.
            `;

            const res = await fetch(`${API_URL}/api/oasis/config/chat-completion`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    endpoint: endpoint,
                    key: activeKey,
                    payload: {
                        model: model,
                        messages: [
                            { role: 'system', content: "Genera el informe estrictamente en HTML válido y bien estilizado, sin bloques markdown de código." },
                            { role: 'user', content: prompt }
                        ]
                    }
                })
            });

            if (res.ok) {
                const data = await res.json();
                let contentStr = data.choices[0].message.content;
                contentStr = contentStr.replace(/^[\s\n]*```(?:html)?[\s\n]*/i, '').replace(/[\s\n]*```[\s\n]*$/i, '');
                
                setContextualReportHtml(contentStr);
                localStorage.setItem(`oasis_contextual_report_${user}`, contentStr);
            }
        } catch (e) {
            console.error("Error generating Contextual Report:", e);
            alert("Ocurrió un error al generar el informe contextual.");
        } finally {
            setIsGeneratingReport(false);
        }
    };

    const improveContextualReport = async () => {
        if (!improvementPrompt.trim() || !contextualReportHtml) return;
        setIsImprovingReport(true);
        try {
            let activeKey = localStorage.getItem('oasis_deepseek_key') || '';
            const endpoint = localStorage.getItem('oasis_deepseek_endpoint') || 'https://api.deepseek.com/chat/completions';
            const model = localStorage.getItem('oasis_deepseek_model') || 'deepseek-chat';
            
            const prompt = `
Eres un Psicólogo Clínico Experto en Terapias Contextuales (ACT, FAP) y el Modelo Multimodal Experiencial.
A continuación te proporciono un Informe y Formulación de Caso Clínico actual en formato HTML.
Tu tarea es modificar y mejorar este documento basándote estrictamente en la siguiente instrucción de mejora proporcionada por el usuario (el terapeuta o el propio paciente).

INSTRUCCIÓN DE MEJORA:
"${improvementPrompt}"

INFORME ACTUAL:
${contextualReportHtml}

Instrucciones Críticas:
1. Aplica la instrucción de mejora a profundidad. Si la instrucción pide cambiar el enfoque terapéutico (ej. de intelectualizado a multimodal experiencial), reestructura completamente las secciones de tratamiento, análisis y conclusiones para reflejar esto.
2. Mantén estrictamente el formato HTML. No uses Markdown, solo devuelve el código HTML puro (comenzando con <h1> o <div> y terminando con las etiquetas correspondientes).
3. No añadas introducciones ni conclusiones fuera del código HTML.
`;
            let res;
            if (API_URL) {
                res = await fetch(`${API_URL}/api/kio/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        messages: [{ role: 'user', content: prompt }],
                        customKey: activeKey,
                        customEndpoint: endpoint,
                        customModel: model
                    })
                });
            } else {
                if (!activeKey) throw new Error('No API Key');
                res = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${activeKey}`
                    },
                    body: JSON.stringify({
                        model: model,
                        messages: [{ role: 'user', content: prompt }],
                        temperature: 0.7,
                        max_tokens: 4000
                    })
                });
            }

            if (!res.ok) throw new Error('Error en API');
            const data = await res.json();
            let newReport = '';
            if (API_URL) {
                newReport = data.reply || data.choices?.[0]?.message?.content || '';
            } else {
                newReport = data.choices[0].message.content;
            }
            newReport = newReport.replace(/```html/g, '').replace(/```/g, '').trim();
            
            setContextualReportHtml(newReport);
            localStorage.setItem(`oasis_contextual_report_${user}`, newReport);
            setImprovementPrompt('');
        } catch (e) {
            console.error("Error mejorando reporte:", e);
            alert("Ocurrió un error al intentar mejorar el informe.");
        } finally {
            setIsImprovingReport(false);
        }
    };

    const generateKioDirectives = async () => {
        setIsGeneratingKio(true);
        try {
            let activeKey = localStorage.getItem('oasis_deepseek_key') || '';
            const endpoint = localStorage.getItem('oasis_deepseek_endpoint') || 'https://api.deepseek.com/chat/completions';
            const model = localStorage.getItem('oasis_deepseek_model') || 'deepseek-chat';
            
            const prompt = `
Eres un psicoterapeuta avanzado configurando a "Kio", una IA asistente de salud mental.
Con base en los datos fenomenológicos e historia biográfica del paciente, genera directrices para la personalidad de Kio.

Información extraída:
- Respuestas Fenomenológicas: ${JSON.stringify(phenomData)}
- Entrevista Biográfica: ${JSON.stringify(bioData)}
- Notas / Plan Actual: ${JSON.stringify(treatmentPlan)}

Genera un JSON con los siguientes campos:
1. "kioDirectives": Directrices personalizadas de intervención de Kio (la IA asistente). Instrucciones exactas de cómo Kio debe hablarle, qué preguntas ancla debe usar (ej. el Filtro del Otro) para romper sus sesgos cognitivos.
2. "kioMemoryBase": Datos base clave y memoria core que Kio debe tener siempre presente al interactuar con el paciente.

Devuelve estrictamente el JSON sin formato extra.
            `;

            const res = await fetch(`${API_URL}/api/oasis/config/chat-completion`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    endpoint: endpoint,
                    key: activeKey,
                    payload: {
                        model: model,
                        messages: [
                            { role: 'system', content: "Genera directrices en formato JSON." },
                            { role: 'user', content: prompt }
                        ],
                        response_format: { type: 'json_object' }
                    }
                })
            });

            if (res.ok) {
                const data = await res.json();
                const contentStr = data.choices[0].message.content;
                let cleanStr = contentStr;
                if (cleanStr.startsWith('\`\`\`json')) cleanStr = cleanStr.replace('\`\`\`json', '').replace('\`\`\`', '');
                
                const parsed = JSON.parse(cleanStr);
                handleTreatmentPlanChange('kioDirectives', parsed.kioDirectives || '');
                handleTreatmentPlanChange('kioMemoryBase', parsed.kioMemoryBase || '');
            }
        } catch (e) {
            console.error("Error generating Kio directives:", e);
        } finally {
            setIsGeneratingKio(false);
        }
    };


    useEffect(() => {
        if (pidIndices && pidIndices.raw) {
            const highestTrait = Object.entries(pidIndices.raw)
                .sort((a, b) => b[1] - a[1])[0]?.[0];
            if (highestTrait) {
                setActivePidTab(highestTrait);
            }
        }
    }, [pidIndices]);

    // UI State
    const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard' | 'raw_data'
    const [mapViewTab, setMapViewTab] = useState('map'); // 'map', 'loop', 'exit_keys', 'avances'
    const [selectedNode, setSelectedNode] = useState(null);
    const [lifeUpdateText, setLifeUpdateText] = useState("");
    const [isUpdatingMap, setIsUpdatingMap] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [afcData, setAfcData] = useState(null);
    const [deepseekKey, setDeepseekKey] = useState(null);
    const [phenomExpanded, setPhenomExpanded] = useState(false);
    const [bioExpanded, setBioExpanded] = useState(false);
    const [isEditingBio, setIsEditingBio] = useState(false);
    const [tempBioData, setTempBioData] = useState(null);
    const [isEditingPhenom, setIsEditingPhenom] = useState(false);
    const [tempPhenomData, setTempPhenomData] = useState(null);
    const [blindSpotsExpanded, setBlindSpotsExpanded] = useState(false);
    const [clinicalNotesExpanded, setClinicalNotesExpanded] = useState(true);
    const [extrasExpanded, setExtrasExpanded] = useState(false);
    const [clinicalReportNotes, setClinicalReportNotes] = useState(() => {
        try { return localStorage.getItem(`oasis_clinical_report_notes_${user}`) || ''; } catch { return ''; }
    });
    const [nodeNotes, setNodeNotes] = useState({});

    // Blind Spots States
    const [solidifyingBlindSpotId, setSolidifyingBlindSpotId] = useState(null);
    const [blindSpotResponse, setBlindSpotResponse] = useState("");
    const [isSubmittingBlindSpot, setIsSubmittingBlindSpot] = useState(false);
    const [autoAnalysisTriggered, setAutoAnalysisTriggered] = useState(false);
    const [selectedBlindSpotIndex, setSelectedBlindSpotIndex] = useState(0);
    const [isGeneratingBlindSpots, setIsGeneratingBlindSpots] = useState(false);

    // Bio Strategic Questions State
    const [bioStrategicQuestions, setBioStrategicQuestions] = useState(() => {
        try {
            const saved = localStorage.getItem(`oasis_bio_strategic_questions_${user}`);
            return saved ? JSON.parse(saved) : {};
        } catch (e) { return {}; }
    });
    const [isGeneratingBioQuestions, setIsGeneratingBioQuestions] = useState(false);

    // Treatment Plan State
    const [treatmentPlan, setTreatmentPlan] = useState(() => {
        try {
            const saved = localStorage.getItem(`oasis_treatment_plan_${user}`);
            return saved ? JSON.parse(saved) : null;
        } catch (e) { return null; }
    });

    useEffect(() => {
        if (!user) return;
        try {
            const saved = localStorage.getItem(`oasis_treatment_plan_${user}`);
            if (saved) setTreatmentPlan(JSON.parse(saved));
        } catch (e) {}
    }, [user]);
    const [isGeneratingTreatmentPlan, setIsGeneratingTreatmentPlan] = useState(false);

    const handleExportDoc = () => {
        let content = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>Informe Clínico - ${user}</title>
        <style>
            body { font-family: 'Calibri', 'Arial', sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: auto; padding: 20px; }
            h1 { color: #2c3e50; border-bottom: 2px solid #34495e; padding-bottom: 10px; font-size: 24px; text-transform: uppercase; }
            h2 { color: #2980b9; margin-top: 30px; font-size: 18px; border-bottom: 1px solid #bdc3c7; padding-bottom: 5px;}
            h3 { color: #8e44ad; font-size: 16px; margin-bottom: 5px; }
            p { margin-bottom: 15px; text-align: justify; }
            ul { margin-bottom: 15px; }
            .section { margin-bottom: 40px; }
        </style>
        </head><body>`;
        
        if (contextualReportHtml) {
            content += contextualReportHtml;
        } else {
            content += `<h1>Informe Clínico Completo</h1>`;
            content += `<p><strong>Paciente:</strong> ${user}<br><strong>Fecha de Exportación:</strong> ${new Date().toLocaleDateString()}</p>`;
            
            if (pidIndices && pidIndices.status) {
                content += `<div class="section"><h2>I. Perfil de Rasgos PID-5</h2><ul>`;
                Object.entries(pidIndices.status).forEach(([domain, st]) => {
                    content += `<li><strong>${domain.toUpperCase()}</strong>: Nivel ${st.label}</li>`;
                });
                content += `</ul></div>`;
            }

            if (phenomData && Object.keys(phenomData).length > 0) {
                content += `<div class="section"><h2>II. Diagnóstico Existencial</h2>`;
                const phenomLabels = {
                    antecedentes_origen: "Antecedentes y Origen (Mecanismo y Origen)",
                    experiencia_insuficiencia: "Experiencia Ontológica de Insuficiencia",
                    temporalidad_vivida: "Temporalidad Vivida",
                    premisa_realidad: "Premisa de Realidad"
                };
                Object.entries(phenomData).forEach(([k, v]) => {
                    const label = phenomLabels[k] || k.replace(/_/g, ' ').toUpperCase();
                    content += `<h3>${label}</h3><p style="white-space: pre-wrap;">${v}</p>`;
                });
                content += `</div>`;
            }

            if (afcData) {
                const maintenance = afcData.explicacion_sencilla || afcData.hypotheses?.mantenimiento;
                const solution = afcData.claves_salida || afcData.hypotheses?.solucion;
                if (maintenance || solution) {
                    content += `<div class="section"><h2>III. Conceptualización Dinámica y Análisis Conductual</h2>`;
                    if (maintenance) content += `<h3>Explicación de Mantenimiento</h3><p style="white-space: pre-wrap;">${maintenance}</p>`;
                    if (solution) content += `<h3>Claves de Salida</h3><p style="white-space: pre-wrap;">${solution}</p>`;
                    content += `</div>`;
                }
            }

            if (treatmentPlan) {
                content += `<div class="section"><h2>IV. Plan de Tratamiento</h2>`;
                if (treatmentPlan.goals) content += `<h3>Objetivos</h3><p style="white-space: pre-wrap;">${treatmentPlan.goals}</p>`;
                if (treatmentPlan.strategies) content += `<h3>Estrategias</h3><p style="white-space: pre-wrap;">${treatmentPlan.strategies}</p>`;
                if (treatmentPlan.notes) content += `<h3>Notas Clínicas</h3><p style="white-space: pre-wrap;">${treatmentPlan.notes}</p>`;
                content += `</div>`;
            }

            if (bioData && Object.keys(bioData).length > 0) {
                content += `<div class="section"><h2>V. Entrevista Biográfica</h2>`;
                Object.entries(bioData).forEach(([q, a]) => {
                    if (['antecedentes_origen', 'experiencia_insuficiencia', 'temporalidad_vivida', 'premisa_realidad'].includes(q)) return;
                    const questionIndex = parseInt(q, 10);
                    const questionText = !isNaN(questionIndex) && BIO_QUESTIONS[questionIndex] ? BIO_QUESTIONS[questionIndex].text : `Pregunta ${q}`;
                    content += `<h3>${questionText}</h3><p style="white-space: pre-wrap;">${a}</p>`;
                });
                content += `</div>`;
            }
        }
        
        const migrationData = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.endsWith(`_${user}`) || key.includes(`_${user}__`))) {
                const portableKey = key.replace(new RegExp(`_${user}(__|$)`), '_%USER%$1');
                migrationData[portableKey] = localStorage.getItem(key);
            }
        }
        
        const migrationDataStr = JSON.stringify(migrationData).replace(/--/g, '~~');
        content += `\n<!-- OASIS_MIGRATION_DATA:${migrationDataStr} -->\n`;

        content += `</body></html>`;
        
        const blob = new Blob([content], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Informe_Clinico_${user}.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleTreatmentPlanChange = useCallback((field, value) => {
        setTreatmentPlan(prev => {
            const updated = { ...prev, [field]: value };
            localStorage.setItem(`oasis_treatment_plan_${user}`, JSON.stringify(updated));
            return updated;
        });
    }, [user]);

    // Sessions State
    const [sessions, setSessions] = useState(() => {
        try {
            const saved = localStorage.getItem(`oasis_sessions_${user}`);
            return saved ? JSON.parse(saved) : [];
        } catch (e) { return []; }
    });
    const [newSessionNote, setNewSessionNote] = useState('');

    // Determine active blind spot (dynamic AI generation first, fallback to config if empty)
    const availableSpots = afcData?.blind_spots || BLIND_SPOTS_CONFIG || [];
    const unresolvedSpots = availableSpots.filter(spot => {
        return localStorage.getItem(`oasis_blindspot_resolved_${user}__${spot.id}`) !== 'true';
    });

    // Safety clamp index within range
    const activeSpot = unresolvedSpots.length > 0
        ? unresolvedSpots[Math.min(selectedBlindSpotIndex, unresolvedSpots.length - 1)]
        : null;

    // Inject active blind spot node into the graph if not resolved
    const { nodesToRender, edgesToRender } = useMemo(() => {
        let nodes = afcData?.nodes || [];
        let edges = afcData?.edges || [];

        if (activeSpot && afcData && afcData.nodes && afcData.nodes.length > 0) {
            const isSolidifying = solidifyingBlindSpotId === activeSpot.id;
            const isClicked = localStorage.getItem(`oasis_blindspot_clicked_${user}__${activeSpot.id}`) === 'true';
            const activeNode = activeSpot.node || { id: `blind_spot_${activeSpot.id}`, type: "cognitive", label: activeSpot.title };
            const injectedNode = {
                ...activeNode,
                dashed: !isSolidifying && !isClicked,
                label: isSolidifying ? "Eslabón Integrado" : activeNode.label
            };

            // Ensure coordinates are stretched and not undefined (to prevent NaN in SVG lines and nodes rendering off-screen)
            if (injectedNode.x === undefined || injectedNode.x === null || injectedNode.x < 100) {
                const baseX = (activeSpot.node && activeSpot.node.x !== undefined) ? activeSpot.node.x : (
                    injectedNode.type === 'historical' ? 12 :
                        (injectedNode.type === 'biological' || injectedNode.type === 'social') ? 38 :
                            (injectedNode.type === 'cognitive' || injectedNode.type === 'motor' || injectedNode.type === 'physiological') ? 65 : 88
                );
                const baseY = (activeSpot.node && activeSpot.node.y !== undefined) ? activeSpot.node.y : 50;

                const scaleX = 1.85;
                const scaleY = 2.8;
                const centerX = 50;
                const centerY = 50;

                injectedNode.x = centerX + (baseX - centerX) * scaleX;
                injectedNode.y = centerY + (baseY - centerY) * scaleY;
            }

            // Ensure no duplicate IDs
            if (!nodes.some(n => n.id === injectedNode.id)) {
                nodes = [...nodes, injectedNode];
            }

            const spotEdge = activeSpot.edge || { source: "historical", target: injectedNode.id };
            const matchedEdge = { ...spotEdge };
            const sourceExists = nodes.some(n => n.id === matchedEdge.source);
            const targetExists = nodes.some(n => n.id === matchedEdge.target);

            if (!sourceExists) {
                const fallbackSource = nodes.find(n => n.type === 'historical' || n.type === 'biological') || nodes[0];
                if (fallbackSource) matchedEdge.source = fallbackSource.id;
            }
            if (!targetExists) {
                const fallbackTarget = nodes.find(n => n.type === 'consequence' || n.type === 'motor') || nodes[nodes.length - 1];
                if (fallbackTarget) matchedEdge.target = fallbackTarget.id;
            }

            if (!edges.some(e => e.source === matchedEdge.source && e.target === matchedEdge.target)) {
                edges = [...edges, matchedEdge];
            }
        }


        // Dynamically inject progression (historical timeline) and feedback loop edges
        // (Disabled: AI is now fully responsible for edges, and these auto-injected edges caused confusing vertical lines)
        /*
        if (nodes.length > 0) {
            const historicalNodes = nodes.filter(n => n.type === 'historical');
            const consequenceNodes = nodes.filter(n => n.type === 'consequence');

            // 1. Connect blue points (historical) sequentially to show progression timeline
            const sortedHist = [...historicalNodes].sort((a, b) => a.y - b.y);
            for (let i = 0; i < sortedHist.length - 1; i++) {
                const sourceId = sortedHist[i].id;
                const targetId = sortedHist[i + 1].id;
                if (!edges.some(e => e.source === sourceId && e.target === targetId)) {
                    edges = [
                        ...edges,
                        { source: sourceId, target: targetId, type: 'progression', weight: 1.0 }
                    ];
                }
            }

            // 2. Connect consequence nodes back to historical nodes to close the loops
            if (historicalNodes.length > 0 && consequenceNodes.length > 0) {
                consequenceNodes.forEach((conNode, idx) => {
                    const histNode = historicalNodes[idx % historicalNodes.length];
                    const sourceId = conNode.id;
                    const targetId = histNode.id;
                    if (!edges.some(e => e.source === sourceId && e.target === targetId)) {
                        edges = [
                            ...edges,
                            { source: sourceId, target: targetId, type: 'feedback', weight: 1.2 }
                        ];
                    }
                });
            }
        }
        */

        // Graph Auto-Repair: Resolve ID mismatches and connect isolated nodes
        if (nodes.length > 0) {
            // 1. Fuzzy ID typo repair for edges
            edges = edges.map(edge => {
                const hasSource = nodes.some(n => n.id === edge.source);
                const hasTarget = nodes.some(n => n.id === edge.target);

                let sourceId = edge.source;
                let targetId = edge.target;

                if (!hasSource) {
                    const cleanSource = edge.source.toLowerCase().replace(/[^a-z0-9]/g, '');
                    let bestNode = null;
                    let maxScore = 0;
                    for (const node of nodes) {
                        const cleanNodeId = node.id.toLowerCase().replace(/[^a-z0-9]/g, '');
                        if (cleanNodeId.includes(cleanSource) || cleanSource.includes(cleanNodeId)) {
                            const score = Math.min(cleanSource.length, cleanNodeId.length) / Math.max(cleanSource.length, cleanNodeId.length);
                            if (score > maxScore) {
                                maxScore = score;
                                bestNode = node;
                            }
                        }
                    }
                    if (bestNode && maxScore > 0.4) {
                        sourceId = bestNode.id;
                    }
                }

                if (!hasTarget) {
                    const cleanTarget = edge.target.toLowerCase().replace(/[^a-z0-9]/g, '');
                    let bestNode = null;
                    let maxScore = 0;
                    for (const node of nodes) {
                        const cleanNodeId = node.id.toLowerCase().replace(/[^a-z0-9]/g, '');
                        if (cleanNodeId.includes(cleanTarget) || cleanTarget.includes(cleanNodeId)) {
                            const score = Math.min(cleanTarget.length, cleanNodeId.length) / Math.max(cleanTarget.length, cleanNodeId.length);
                            if (score > maxScore) {
                                maxScore = score;
                                bestNode = node;
                            }
                        }
                    }
                    if (bestNode && maxScore > 0.4) {
                        targetId = bestNode.id;
                    }
                }

                return { ...edge, source: sourceId, target: targetId };
            });

            // 2. Identify and connect isolated nodes (0 active connections)
            nodes.forEach(node => {
                const hasIncoming = edges.some(e => e.target === node.id && nodes.some(n => n.id === e.source));
                const hasOutgoing = edges.some(e => e.source === node.id && nodes.some(n => n.id === e.target));

                if (!hasIncoming && !hasOutgoing) {
                    // Find potential parent (source)
                    if (node.type !== 'historical') {
                        let parent = nodes.find(n => n.id !== node.id && (n.type === 'biological' || n.type === 'social'));
                        if (!parent) parent = nodes.find(n => n.id !== node.id && n.type === 'historical');
                        if (parent) {
                            edges = [
                                ...edges,
                                { source: parent.id, target: node.id, weight: 1.0, type: 'unidirectional' }
                            ];
                        }
                    }

                    // Find potential child (target)
                    if (node.type !== 'consequence') {
                        let child = null;
                        if (node.type === 'biological' || node.type === 'social') {
                            child = nodes.find(n => n.id !== node.id && (n.type === 'cognitive' || n.type === 'motor' || n.type === 'physiological'));
                        } else {
                            child = nodes.find(n => n.id !== node.id && n.type === 'consequence');
                        }
                        if (child) {
                            edges = [
                                ...edges,
                                { source: node.id, target: child.id, weight: 1.0, type: 'unidirectional' }
                            ];
                        }
                    }
                }
            });
        }

        return { nodesToRender: nodes, edgesToRender: edges };
    }, [afcData, activeSpot, solidifyingBlindSpotId, user]);

    // Map Interaction State
    const [mapTransform, setMapTransform] = useState({ x: 0, y: 0, scale: 0.2 });
    const [isInitialZoom, setIsInitialZoom] = useState(true);
    const [isDraggingMap, setIsDraggingMap] = useState(false);
    const [tourModalPos, setTourModalPos] = useState({ x: 0, y: 0 });
    const [isDraggingTour, setIsDraggingTour] = useState(false);
    const dragTourStartRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const handleTourDrag = (e) => {
            if (!isDraggingTour) return;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            setTourModalPos({ x: clientX - dragTourStartRef.current.x, y: clientY - dragTourStartRef.current.y });
        };
        const handleTourDragEnd = (e) => {
            if (!isDraggingTour) return;
            setIsDraggingTour(false);
        };
        if (isDraggingTour) {
            window.addEventListener('mousemove', handleTourDrag, { capture: true });
            window.addEventListener('mouseup', handleTourDragEnd, { capture: true });
            window.addEventListener('touchmove', handleTourDrag, { capture: true, passive: false });
            window.addEventListener('touchend', handleTourDragEnd, { capture: true });
        }
        return () => {
            window.removeEventListener('mousemove', handleTourDrag, { capture: true });
            window.removeEventListener('mouseup', handleTourDragEnd, { capture: true });
            window.removeEventListener('touchmove', handleTourDrag, { capture: true });
            window.removeEventListener('touchend', handleTourDragEnd, { capture: true });
        };
    }, [isDraggingTour]);
    const [draggingNodeId, setDraggingNodeId] = useState(null);
    const dragStart = useRef({ x: 0, y: 0 });
    const lastPointerPos = useRef({ x: 0, y: 0 });

    const transformContainerRef = useRef(null);
    const transformRef = useRef({ x: 0, y: 0, scale: 0.55 });
    const [isProgrammaticTransition, setIsProgrammaticTransition] = useState(false);
    const zoomTimeoutRef = useRef(null);

    const triggerProgrammaticTransition = useCallback(() => {
        setIsProgrammaticTransition(true);
        if (zoomTimeoutRef.current) clearTimeout(zoomTimeoutRef.current);
        zoomTimeoutRef.current = setTimeout(() => {
            setIsProgrammaticTransition(false);
        }, 200);
    }, []);

    const updateDOMTransform = useCallback((x, y, scale) => {
        if (transformContainerRef.current) {
            transformContainerRef.current.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
        }
    }, []);

    useEffect(() => {
        transformRef.current = { ...mapTransform };
    }, [mapTransform]);

    useEffect(() => {
        return () => {
            if (zoomTimeoutRef.current) clearTimeout(zoomTimeoutRef.current);
        };
    }, []);

    // Removed localStorage sync to always perform fresh mathematical auto-centering on mount and tab load

    // Node Exploration States
    const [nodeExplorations, setNodeExplorations] = useState({});
    const [isExploringActiveNode, setIsExploringActiveNode] = useState(false);
    const [nodeChats, setNodeChats] = useState({}); // { nodeId: [{ role: 'assistant'|'user', content: string }] }
    const [isGeneratingExplorations, setIsGeneratingExplorations] = useState(false);
    const [selectedExplorationSpot, setSelectedExplorationSpot] = useState(null);
    const [explorationResponse, setExplorationResponse] = useState('');

    const [isSubmittingExploration, setIsSubmittingExploration] = useState(false);
    const [solidifyingExplorationId, setSolidifyingExplorationId] = useState(null);
    const [explorationModalOpen, setExplorationModalOpen] = useState(false);
    const [explorationQuestions, setExplorationQuestions] = useState([]);
    const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(null);
    const chatContainerRef = useRef(null);

    const getSafeCurrentChat = useCallback((nodeId, threadIndex = 0) => {
        const chatData = nodeChats[nodeId];
        if (!chatData) return [];
        if (Array.isArray(chatData)) {
            return threadIndex === 0 ? chatData : [];
        }
        return chatData[threadIndex] || [];
    }, [nodeChats]);

    // --- COLLAPSIBLE PATTERNS (Islas del Mapa) ---
    const [selectedPatternId, setSelectedPatternId] = useState(null);
    const [isOpenIslandModal, setIsOpenIslandModal] = useState(false);
    const [isMapExpanded, setIsMapExpanded] = useState(false);
    // Local state for accordion expand in Bucles list — does NOT navigate to map
    const [expandedBucleNodeId, setExpandedBucleNodeId] = useState(null);

    const getAfcPatterns = useCallback((data) => {
        if (!data?.nodes || data.nodes.length === 0) return [];

        const nodes = data.nodes;
        const edges = data.edges || [];
        const islands = [];

        nodes.forEach(node => {
            const connectedNodeIds = new Set();
            connectedNodeIds.add(node.id);

            // Find all nodes directly connected to this node
            edges.forEach(edge => {
                if (edge.source === node.id) {
                    connectedNodeIds.add(edge.target);
                } else if (edge.target === node.id) {
                    connectedNodeIds.add(edge.source);
                }
            });

            // We only create an island if it represents a connection (meaning the node has at least 1 neighbor, so size >= 2)
            if (connectedNodeIds.size >= 2) {
                // Sort nodes inside this component using typeOrder to establish clínical sequence (linearity)
                const typeOrder = {
                    historical: 0,
                    biological: 1,
                    social: 2,
                    cognitive: 3,
                    motor: 4,
                    physiological: 5,
                    consequence: 6
                };

                const sortedComponentNodes = Array.from(connectedNodeIds)
                    .map(id => nodes.find(n => n.id === id))
                    .filter(Boolean)
                    .sort((a, b) => {
                        const orderA = typeOrder[a.type] ?? 99;
                        const orderB = typeOrder[b.type] ?? 99;
                        if (orderA !== orderB) return orderA - orderB;
                        if (a.x !== b.x) return a.x - b.x;
                        return a.y - b.y;
                    });

                const sortedIds = sortedComponentNodes.map(n => n.id);

                const pathLabels = sortedComponentNodes.map(n => n.label).join(' → ');
                const description = `Bucle Clínico Conectado: ${pathLabels}`;

                islands.push({
                    id: `isla_node_${node.id}`,
                    nombre: `Bucle: ${node.label}`,
                    descripcion: description,
                    node_ids: sortedIds,
                    primary_node_id: node.id,
                    sortedNodes: sortedComponentNodes
                });
            }
        });

        // Fallback: If no multi-node islands exist, return individual nodes as islands
        if (islands.length === 0) {
            nodes.forEach(node => {
                islands.push({
                    id: `isla_fallback_${node.id}`,
                    nombre: `Punto de Interés: ${node.label}`,
                    descripcion: `Nodo aislado en el mapa clínico.`,
                    node_ids: [node.id],
                    primary_node_id: node.id,
                    sortedNodes: [node]
                });
            });
        }

        return islands;
    }, []);



    const [isIslandsPanelExpanded, setIsIslandsPanelExpanded] = useState(window.innerWidth > 768);

    // --- NODE INTENSITIES & CLINICAL DENSITY ---
    const [nodeIntensities, setNodeIntensities] = useState(() => {
        try {
            const saved = localStorage.getItem(`oasis_node_intensities_${user}`);
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            return {};
        }
    });

    const handleIntensityChange = (nodeId, val) => {
        setNodeIntensities(prev => {
            const updated = { ...prev, [nodeId]: val };
            setLocalItem(`oasis_node_intensities_${user}`, JSON.stringify(updated));
            window.dispatchEvent(new Event('oasis_intensities_updated'));
            return updated;
        });
    };

    const loadIntensities = useCallback(() => {
        try {
            const saved = localStorage.getItem(`oasis_node_intensities_${user}`);
            if (saved) {
                setNodeIntensities(JSON.parse(saved));
            }
        } catch (e) {
            console.error(e);
        }
    }, [user]);

    const currentPatterns = useMemo(() => {
        const patterns = getAfcPatterns({ nodes: nodesToRender, edges: edgesToRender });
        
        return patterns.map(pattern => {
            let totalIntensity = 0;
            let selfSabotageKeywords = ['culpa', 'miedo', 'adicción', 'droga', 'evitación', 'ansiedad', 'depresión', 'castigo', 'aislamiento', 'procrastinación', 'control', 'trampas', 'tóxic'];
            let keywordScore = 0;
            let totalDifficulty = 0;
            
            pattern.sortedNodes.forEach(node => {
                const userInt = nodeIntensities[node.id] || 0;
                totalIntensity += userInt;
                
                const text = (node.label + " " + (node.observations || "")).toLowerCase();
                selfSabotageKeywords.forEach(kw => {
                    if (text.includes(kw)) keywordScore += 2;
                });
                
                if (node.type === 'behavior') totalDifficulty += 1;
                else if (node.type === 'trigger') totalDifficulty += 2;
                else if (node.type === 'cognitive') totalDifficulty += 4;
                else if (node.type === 'origin') totalDifficulty += 5;
                else totalDifficulty += 3;
            });
            
            const avgDifficulty = pattern.sortedNodes.length > 0 ? totalDifficulty / pattern.sortedNodes.length : 0;
            const finalIntensity = totalIntensity + keywordScore + (pattern.sortedNodes.length * 1.5);
            
            return {
                ...pattern,
                computedIntensity: finalIntensity,
                computedDifficulty: avgDifficulty
            };
        }).sort((a, b) => {
            const getIntensityTier = (score) => {
                if (score >= 15) return 3;
                if (score >= 8) return 2;
                return 1;
            };
            
            const tierA = getIntensityTier(a.computedIntensity);
            const tierB = getIntensityTier(b.computedIntensity);
            
            if (tierA !== tierB) {
                return tierA - tierB; // Menor intensidad primero
            }
            return a.computedDifficulty - b.computedDifficulty; // Más fácil primero dentro de la misma intensidad
        });
    }, [nodesToRender, edgesToRender, getAfcPatterns, nodeIntensities]);


    // Auto-selection removed from here, moved to after zoomToNode

    const activePattern = useMemo(() => {
        return currentPatterns.find(p => p.id === selectedPatternId) || null;
    }, [currentPatterns, selectedPatternId]);

    // --- MICRO-CHALLENGES / COMMITMENTS (Vincular Acción) ---
    const [nodeChallenges, setNodeChallenges] = useState(() => {
        try {
            const saved = localStorage.getItem(`oasis_node_challenges_${user}`);
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            return {};
        }
    });

    const loadChallenges = useCallback(() => {
        try {
            const saved = localStorage.getItem(`oasis_node_challenges_${user}`);
            if (saved) {
                setNodeChallenges(JSON.parse(saved));
            }
        } catch (e) {
            console.error(e);
        }
    }, [user]);

    useEffect(() => {
        loadIntensities();
        loadChallenges();

        window.addEventListener('oasis_intensities_updated', loadIntensities);
        window.addEventListener('oasis_challenges_updated', loadChallenges);

        return () => {
            window.removeEventListener('oasis_intensities_updated', loadIntensities);
            window.removeEventListener('oasis_challenges_updated', loadChallenges);
        };
    }, [loadIntensities, loadChallenges]);

    const toggleChallenge = (nodeId, challengeId) => {
        setNodeChallenges(prev => {
            const currentList = prev[nodeId] || [];
            const updatedList = currentList.map(ch => {
                if (ch.id === challengeId) {
                    const newStatus = !ch.completed;
                    const intensityVal = nodeIntensities[nodeId] !== undefined ? nodeIntensities[nodeId] : 8;
                    let newIntensity = intensityVal;
                    if (newStatus) {
                        newIntensity = Math.max(1, intensityVal - 2);
                    } else {
                        newIntensity = Math.min(10, intensityVal + 2);
                    }
                    handleIntensityChange(nodeId, newIntensity);
                    return { ...ch, completed: newStatus };
                }
                return ch;
            });
            const updated = { ...prev, [nodeId]: updatedList };
            setLocalItem(`oasis_node_challenges_${user}`, JSON.stringify(updated));
            return updated;
        });
    };

    const addManualChallenge = (nodeId, text) => {
        if (!text.trim()) return;
        setNodeChallenges(prev => {
            const currentList = prev[nodeId] || [];
            const newChallenge = {
                id: `challenge-${Date.now()}`,
                text: text.trim(),
                completed: false,
                createdAt: Date.now()
            };
            const updated = { ...prev, [nodeId]: [...currentList, newChallenge] };
            setLocalItem(`oasis_node_challenges_${user}`, JSON.stringify(updated));
            window.dispatchEvent(new Event('oasis_challenges_updated'));
            return updated;
        });
    };

    const deleteChallenge = (nodeId, challengeId) => {
        setNodeChallenges(prev => {
            const currentList = prev[nodeId] || [];
            const updated = { ...prev, [nodeId]: currentList.filter(ch => ch.id !== challengeId) };
            setLocalItem(`oasis_node_challenges_${user}`, JSON.stringify(updated));
            return updated;
        });
    };

    // --- DOMINO NODE CALCULATION ---
    const dominoNode = useMemo(() => {
        if (!afcData || !afcData.nodes) return null;

        const getConnectionsCount = (nodeId) => {
            return afcData.edges.filter(e => e.source === nodeId || e.target === nodeId).length;
        };

        const motorNodes = afcData.nodes.filter(n => n.type === 'motor');
        if (motorNodes.length > 0) {
            return motorNodes.reduce((max, node) =>
                getConnectionsCount(node.id) > getConnectionsCount(max.id) ? node : max
                , motorNodes[0]);
        }

        const cognitiveNodes = afcData.nodes.filter(n => n.type === 'cognitive');
        if (cognitiveNodes.length > 0) {
            return cognitiveNodes.reduce((max, node) =>
                getConnectionsCount(node.id) > getConnectionsCount(max.id) ? node : max
                , cognitiveNodes[0]);
        }

        if (afcData.nodes.length > 0) {
            return afcData.nodes.reduce((max, node) =>
                getConnectionsCount(node.id) > getConnectionsCount(max.id) ? node : max
                , afcData.nodes[0]);
        }

        return null;
    }, [afcData]);

    const [nodeConversations, setNodeConversations] = useState({});

    useEffect(() => {
        try {
            const saved = localStorage.getItem(`oasis_node_conversations_${user}`);
            if (saved) {
                setNodeConversations(JSON.parse(saved));
            }
        } catch (e) {
            console.error(e);
        }
    }, [user]);



    useEffect(() => {
        try {
            const saved = localStorage.getItem(`oasis_node_explorations_${user}`);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && typeof parsed === 'object') {
                    let migrated = false;
                    const cleaned = {};
                    Object.keys(parsed).forEach(nodeId => {
                        const spots = parsed[nodeId] || [];
                        cleaned[nodeId] = spots.map((s, idx) => {
                            if (!s.id || !s.id.startsWith(`node_explore_${nodeId}_`)) {
                                migrated = true;
                                const oldId = s.id;
                                const uniqueId = `node_explore_${nodeId}_${Date.now()}_${idx}`;
                                const targetNodeId = `blind_spot_${uniqueId}`;

                                const wasResolved = s.resolved || (oldId && localStorage.getItem(`oasis_blindspot_resolved_${user}__${oldId}`) === 'true');
                                if (wasResolved && oldId) {
                                    setLocalItem(`oasis_blindspot_resolved_${user}__${uniqueId}`, 'true');
                                    const oldAnswer = localStorage.getItem(`oasis_blindspot_answer_${user}__${oldId}`);
                                    if (oldAnswer) {
                                        setLocalItem(`oasis_blindspot_answer_${user}__${uniqueId}`, oldAnswer);
                                    }
                                }

                                return {
                                    ...s,
                                    id: uniqueId,
                                    node: s.node ? { ...s.node, id: targetNodeId } : { id: targetNodeId, type: "cognitive", label: s.title || "Punto ciego" },
                                    edge: s.edge ? { ...s.edge, source: nodeId, target: targetNodeId } : { source: nodeId, target: targetNodeId, weight: 1.5, type: "progression" },
                                    resolved: wasResolved
                                };
                            }
                            return s;
                        });
                    });

                    if (migrated) {
                        setLocalItem(`oasis_node_explorations_${user}`, JSON.stringify(cleaned));
                        setNodeExplorations(cleaned);
                    } else {
                        setNodeExplorations(parsed);
                    }
                } else {
                    setNodeExplorations({});
                }
            }
        } catch (e) {
            console.error(e);
        }
    }, [user]);
    const saveNodeExplorations = (newExplorations) => {
        setNodeExplorations(newExplorations);
        setLocalItem(`oasis_node_explorations_${user}`, JSON.stringify(newExplorations));
    };

    // Load nodeChats from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem(`oasis_node_chats_${user}`);
            if (saved) {
                setNodeChats(JSON.parse(saved));
            }
        } catch (e) {
            console.error(e);
        }
    }, [user]);

    // Save nodeChats to localStorage when it changes
    useEffect(() => {
        if (Object.keys(nodeChats).length > 0) {
            setLocalItem(`oasis_node_chats_${user}`, JSON.stringify(nodeChats));
        }
    }, [nodeChats, user]);

    const lastTouchDistance = useRef(null);
    const mapDragged = useRef(false);
    const mapContainerRef = useRef(null);
    const nodeDraggedRef = useRef(false);
    const nodeClickedRef = useRef(false);

    // Tour/Narrative State
    const [tourActiveIndex, setTourActiveIndex] = useState(null);
    const [isTourMinimized, setIsTourMinimized] = useState(false);

    useEffect(() => {
        setIsExploringActiveNode(false);
        setSelectedExplorationSpot(null);
        setExplorationResponse('');
    }, [selectedNode, tourActiveIndex]);

    useEffect(() => {
        if (selectedNode !== null || tourActiveIndex !== null) {
            setMapViewTab('map');
        }
    }, [selectedNode, tourActiveIndex]);

    // Auto-start chat when a node is opened and has no chat history
    useEffect(() => {
        if (selectedNode) {
            const currentChat = getSafeCurrentChat(selectedNode.id, selectedQuestionIndex !== null ? selectedQuestionIndex : 0);
            if (!currentChat || currentChat.length === 0) {
                // Prevenir llamadas múltiples
                console.log("TRIGGERING API", selectedNode.id, selectedQuestionIndex); if (!isGeneratingExplorations) {
                    continueNodeExploration(selectedNode);
                }
            }
        }
    }, [selectedNode, selectedQuestionIndex]); // dependemos de selectedNode y selectedQuestionIndex para auto-iniciar al cambiar hilo

    // Derived sorted list of nodes for narrative tour
    const sortedTourNodes = useMemo(() => {
        let rawNodes = afcData ? afcData.nodes : [];
        if (!rawNodes || rawNodes.length === 0) return [];

        if (selectedPatternId) {
            const activePat = currentPatterns.find(p => p.id === selectedPatternId);
            if (activePat && activePat.node_ids) {
                rawNodes = rawNodes.filter(n => activePat.node_ids.includes(n.id));
            }
        }

        const typeOrder = {
            historical: 0,
            biological: 1,
            social: 2,
            cognitive: 3,
            motor: 4,
            physiological: 5,
            consequence: 6
        };
        return [...rawNodes].sort((a, b) => {
            const orderA = typeOrder[a.type] ?? 99;
            const orderB = typeOrder[b.type] ?? 99;
            if (orderA !== orderB) return orderA - orderB;
            if (a.x !== b.x) return a.x - b.x;
            return a.y - b.y;
        });
    }, [afcData, selectedPatternId, currentPatterns]);

    const resetMapTransform = useCallback(() => {
        if (!mapContainerRef.current) return;
        const rect = mapContainerRef.current.getBoundingClientRect();
        const viewportWidth = rect.width;
        const viewportHeight = rect.height;

        // If the container width/height is 0 (not fully rendered or in background), retry after layout reflow
        if (viewportWidth === 0 || viewportHeight === 0) {
            setTimeout(resetMapTransform, 100);
            return;
        }

        const nodes = afcData?.nodes || [];
        if (nodes.length === 0) {
            triggerProgrammaticTransition();
            transformRef.current = { x: 0, y: 0, scale: 0.55 };
            setMapTransform({ x: 0, y: 0, scale: 0.55 });
            return;
        }

        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        nodes.forEach(node => {
            const nx = node.x ?? 50;
            const ny = node.y ?? 50;
            if (nx < minX) minX = nx;
            if (nx > maxX) maxX = nx;
            if (ny < minY) minY = ny;
            if (ny > maxY) maxY = ny;
        });

        const paddingPercentX = isMobileDevice ? 0.10 : 0.15;
        const paddingPercentY = isMobileDevice ? 0.25 : 0.35;
        const graphWidthRange = (maxX - minX) || 100;
        const graphHeightRange = (maxY - minY) || 100;

        const scaleX = viewportWidth / (VIRTUAL_WIDTH * (graphWidthRange / 100 + paddingPercentX));
        const scaleY = viewportHeight / (VIRTUAL_HEIGHT * (graphHeightRange / 100 + paddingPercentY));

        let fitScale = Math.min(scaleX, scaleY) * 1.20; // Zoom base aumentado a 1.20x para que no quede tan lejos
        fitScale = Math.min(Math.max(0.35, fitScale), 4); // Límite estricto para no romper el zoom manual del usuario

        const graphCenterX = (minX + maxX) / 2;
        const graphCenterY = (minY + maxY) / 2;

        const px = VIRTUAL_WIDTH * (graphCenterX / 100);
        const py = VIRTUAL_HEIGHT * (graphCenterY / 100);

        // Correct top-left origin mathematical centering formula: tx = center - px * fitScale
        const tx = viewportWidth / 2 - px * fitScale;
        const ty = (viewportHeight * (isMobileDevice ? 0.55 : 0.50)) - py * fitScale;

        triggerProgrammaticTransition();
        transformRef.current = { x: tx, y: ty, scale: fitScale };
        setMapTransform({ x: tx, y: ty, scale: fitScale });
    }, [afcData, triggerProgrammaticTransition]);

    const zoomToNode = useCallback((targetNode) => {
        if (targetNode && mapContainerRef.current) {
            const rect = mapContainerRef.current.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;
            if (width === 0 || height === 0) return;
            const px = VIRTUAL_WIDTH * ((targetNode.x ?? 50) / 100);
            const py = VIRTUAL_HEIGHT * ((targetNode.y ?? 50) / 100);
            const isMobile = window.innerWidth < 768;
            let targetScale = isMobile ? 0.85 : (width / VIRTUAL_WIDTH) * 1.3;
            targetScale = Math.min(Math.max(0.35, targetScale), 2.5);
            const tx = width / 2 - px * targetScale;
            const ty = (height * (isMobile ? 0.22 : 0.35)) - py * targetScale;
            triggerProgrammaticTransition();
            transformRef.current = { x: tx, y: ty, scale: targetScale };
            setMapTransform({ x: tx, y: ty, scale: targetScale });
        }
    }, [triggerProgrammaticTransition]);

    const hasAutoSelectedNode = useRef(false);
    useEffect(() => {
        if (!hasAutoSelectedNode.current && currentPatterns.length > 0 && !selectedNode) {
            hasAutoSelectedNode.current = true;
            const easiestPattern = currentPatterns[0];
            if (easiestPattern && easiestPattern.sortedNodes && easiestPattern.sortedNodes.length > 0) {
                // Find node with highest centrality (most connections)
                let targetNode = easiestPattern.sortedNodes[0];
                let maxEdges = -1;
                
                easiestPattern.sortedNodes.forEach(node => {
                    const edgeCount = (afcData?.edges || []).filter(e => e.source === node.id || e.target === node.id).length;
                    // Boost cognitive and motor nodes slightly in the calculation
                    const weight = (node.type === 'cognitive' ? 2 : node.type === 'motor' ? 1 : 0);
                    if (edgeCount + weight > maxEdges) {
                        maxEdges = edgeCount + weight;
                        targetNode = node;
                    }
                });
                
                if (targetNode) {
                    setSelectedPatternId(easiestPattern.id);
                    const idx = easiestPattern.sortedNodes.findIndex(n => n.id === targetNode.id);
                    setTourActiveIndex(idx !== -1 ? idx : 0);
                    setSelectedNode(targetNode);
                    setTimeout(() => zoomToNode(targetNode), 150);
                }
            }
        }
    }, [currentPatterns, selectedNode, zoomToNode]);

    const zoomToPattern = useCallback((pattern) => {
        if (pattern && pattern.sortedNodes && pattern.sortedNodes.length > 0 && mapContainerRef.current) {
            const rect = mapContainerRef.current.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;
            if (width === 0 || height === 0) return;

            let minX = Infinity, maxX = -Infinity;
            let minY = Infinity, maxY = -Infinity;
            pattern.sortedNodes.forEach(node => {
                const nx = node.x ?? 50;
                const ny = node.y ?? 50;
                if (nx < minX) minX = nx;
                if (nx > maxX) maxX = nx;
                if (ny < minY) minY = ny;
                if (ny > maxY) maxY = ny;
            });

            const graphCenterX = (minX + maxX) / 2;
            const graphCenterY = (minY + maxY) / 2;

            const px = VIRTUAL_WIDTH * (graphCenterX / 100);
            const py = VIRTUAL_HEIGHT * (graphCenterY / 100);
            
            // Dynamic wide zoom out calculation so all nodes of the pattern are fully framed
            const graphWidthRange = (maxX - minX) || 60;
            const graphHeightRange = (maxY - minY) || 60;
            const paddingPercent = isMobileDevice ? 0.15 : 0.15;
            const scaleX = width / (VIRTUAL_WIDTH * (graphWidthRange / 100 + paddingPercent));
            const scaleY = height / (VIRTUAL_HEIGHT * (graphHeightRange / 100 + paddingPercent));
            let targetScale = Math.min(scaleX, scaleY);
            targetScale = Math.min(Math.max(0.1, targetScale), 1.0);

            const tx = width / 2 - px * targetScale;
            const ty = (height * (isMobileDevice ? 0.50 : 0.45)) - py * targetScale;

            triggerProgrammaticTransition();
            transformRef.current = { x: tx, y: ty, scale: targetScale };
            setMapTransform({ x: tx, y: ty, scale: targetScale });
        } else if (typeof resetMapTransform === 'function') {
            resetMapTransform();
        }
    }, [triggerProgrammaticTransition, resetMapTransform]);

        // Prevents map from constantly resetting when afcData updates (e.g. dragging a node)
    const prevMapStateRef = useRef({ tab: mapViewTab, node: selectedNode });
    const hasInitializedAfcDataRef = useRef(false);

    useEffect(() => {
        if (!afcData || !mapContainerRef.current || mapViewTab !== 'map' || selectedNode) {
            prevMapStateRef.current = { tab: mapViewTab, node: selectedNode };
            return;
        }

        const tabChangedToMap = prevMapStateRef.current.tab !== 'map' && mapViewTab === 'map';
        const nodeDeselected = prevMapStateRef.current.node !== null && selectedNode === null;
        const isFirstDataLoad = !hasInitializedAfcDataRef.current;

        if (tabChangedToMap || nodeDeselected || isFirstDataLoad) {
            hasInitializedAfcDataRef.current = true;
            const timer = setTimeout(resetMapTransform, 150);
            prevMapStateRef.current = { tab: mapViewTab, node: selectedNode };
            return () => clearTimeout(timer);
        }
        
        prevMapStateRef.current = { tab: mapViewTab, node: selectedNode };
    }, [afcData, resetMapTransform, mapViewTab, selectedNode]);

    const nextTourNode = useCallback(() => {
        if (sortedTourNodes.length === 0) return;
        setTourActiveIndex((prev) => {
            const nextIdx = prev === null ? 0 : (prev + 1) % sortedTourNodes.length;
            const targetNode = sortedTourNodes[nextIdx];
            setSelectedNode(targetNode);
            setTimeout(() => zoomToNode(targetNode), 15);

            return nextIdx;
        });
    }, [sortedTourNodes, zoomToNode]);

    const prevTourNode = useCallback(() => {
        if (sortedTourNodes.length === 0) return;
        setTourActiveIndex((prev) => {
            const prevIdx = prev === null || prev === 0 ? sortedTourNodes.length - 1 : prev - 1;
            const targetNode = sortedTourNodes[prevIdx];
            setSelectedNode(targetNode);
            setTimeout(() => zoomToNode(targetNode), 15);

            return prevIdx;
        });
    }, [sortedTourNodes, zoomToNode]);

    const startTour = useCallback(() => {
        if (sortedTourNodes.length > 0) {
            setTourActiveIndex(0);
            const targetNode = sortedTourNodes[0];
            setSelectedNode(targetNode);
            setTimeout(() => zoomToNode(targetNode), 15);

        }
    }, [sortedTourNodes, zoomToNode]);

    const endTour = useCallback(() => {
        setTourActiveIndex(null);
        setSelectedNode(null);
        setIsExploringActiveNode(false);
        setSelectedExplorationSpot(null);
        setExplorationResponse('');
        setSelectedPatternId(null);
        setTimeout(resetMapTransform, 15);
    }, [resetMapTransform]);

    const currentTourNodeEdges = useMemo(() => {
        const edgesToRender = afcData ? afcData.edges : [];
        const nodesToRender = afcData ? afcData.nodes : [];
        if (tourActiveIndex === null || !sortedTourNodes[tourActiveIndex]) return { incoming: [], outgoing: [] };
        const node = sortedTourNodes[tourActiveIndex];
        const incoming = edgesToRender
            .filter(e => e.target === node.id)
            .map(e => nodesToRender.find(n => n.id === e.source))
            .filter(Boolean);
        const outgoing = edgesToRender
            .filter(e => e.source === node.id)
            .map(e => nodesToRender.find(n => n.id === e.target))
            .filter(Boolean);
        return { incoming, outgoing };
    }, [tourActiveIndex, sortedTourNodes, afcData]);



    const resolvedBlindSpots = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("oasis_blindspot_answer_")) {
            const part = key.substring("oasis_blindspot_answer_".length);
            const dIndex = part.indexOf('__');
            if (dIndex > -1) {
                const keyUser = part.substring(0, dIndex);
                const spotId = part.substring(dIndex + 2);
                if (keyUser === user) {
                    const answer = localStorage.getItem(key);
                    const question = localStorage.getItem(`oasis_blindspot_question_${user}__${spotId}`) || "Pregunta de punto ciego";
                    const title = localStorage.getItem(`oasis_blindspot_title_${user}__${spotId}`) || "Punto ciego clínico";
                    if (answer) {
                        resolvedBlindSpots.push({
                            id: spotId,
                            title,
                            question,
                            answer
                        });
                    }
                }
            }
        }
    }



    const handleBlindSpotSubmit = async (e, spot) => {
        if (e) e.preventDefault();
        if (!blindSpotResponse.trim() || isSubmittingBlindSpot) return;

        setIsSubmittingBlindSpot(true);
        setSolidifyingBlindSpotId(spot.id);

        try {
            const answer = blindSpotResponse.trim();
            const answerKey = `oasis_blindspot_answer_${user}__${spot.id}`;
            const resolvedKey = `oasis_blindspot_resolved_${user}__${spot.id}`;
            const questionKey = `oasis_blindspot_question_${user}__${spot.id}`;
            const titleKey = `oasis_blindspot_title_${user}__${spot.id}`;

            // Save to localStorage (this triggers the App.jsx auto-sync to backend)
            setLocalItem(answerKey, answer);
            setLocalItem(resolvedKey, 'true');
            setLocalItem(questionKey, spot.question);
            setLocalItem(titleKey, spot.title);

            // Update afcData client-side: add the node as solid and add the edge to preserve the rich analysis and cost 0 tokens!
            if (afcData) {
                const updatedAfc = { ...afcData };
                const spotNode = spot.node || { id: `blind_spot_${spot.id}`, type: "cognitive", label: spot.title };
                const spotEdge = spot.edge || { source: "historical", target: spotNode.id };

                // Add the node if not already present, make sure it is not dashed
                if (updatedAfc.nodes) {
                    const renderedNode = nodesToRender.find(n => n.id === spotNode.id);
                    const solidNode = {
                        ...(renderedNode || spotNode),
                        dashed: false
                    };
                    if (!updatedAfc.nodes.some(n => n.id === solidNode.id)) {
                        updatedAfc.nodes = [...updatedAfc.nodes, solidNode];
                    } else {
                        updatedAfc.nodes = updatedAfc.nodes.map(n => n.id === solidNode.id ? { ...n, dashed: false } : n);
                    }
                }

                // Add the edge if not already present
                if (updatedAfc.edges) {
                    const matchedEdge = { ...spotEdge };
                    const sourceExists = updatedAfc.nodes.some(n => n.id === matchedEdge.source);
                    const targetExists = updatedAfc.nodes.some(n => n.id === matchedEdge.target);

                    if (!sourceExists) {
                        const fallbackSource = updatedAfc.nodes.find(n => n.type === 'historical' || n.type === 'biological') || updatedAfc.nodes[0];
                        if (fallbackSource) matchedEdge.source = fallbackSource.id;
                    }
                    if (!targetExists) {
                        const fallbackTarget = updatedAfc.nodes.find(n => n.type === 'consequence' || n.type === 'motor') || updatedAfc.nodes[updatedAfc.nodes.length - 1];
                        if (fallbackTarget) matchedEdge.target = fallbackTarget.id;
                    }

                    if (!updatedAfc.edges.some(e => e.source === matchedEdge.source && e.target === matchedEdge.target)) {
                        updatedAfc.edges = [...updatedAfc.edges, matchedEdge];
                    }
                }

                setAfcData(updatedAfc);
                setLocalItem(`oasis_afc_real_data_${user}`, JSON.stringify(updatedAfc));
            }

            // After 2 seconds of showing the "solidifying" animation, reset
            setTimeout(() => {
                setBlindSpotResponse("");
                setSolidifyingBlindSpotId(null);
                setIsSubmittingBlindSpot(false);
            }, 2000);

        } catch (err) {
            console.error("Error submitting blind spot:", err);
            setIsSubmittingBlindSpot(false);
            setSolidifyingBlindSpotId(null);
        }
    };

    // Load deepseek key
    useEffect(() => {
        const fetchDeepseekKey = async () => {
            try {
                const res = await fetch(`${API_URL}/api/oasis/config/deepseek-key`);
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.key && data.key !== "ESCRIBE_AQUI_TU_NUEVA_API_KEY") {
                        setDeepseekKey(data.key);
                        return;
                    }
                }
            } catch (err) {
                console.error("Error fetching Deepseek Key from server:", err);
            }

            const localKey = localStorage.getItem('oasis_deepseek_key');
            if (localKey && (localKey.includes("07b18eb6601a4b11a109c96a56c92a16") || localKey.includes("VAR>"))) {
                localStorage.removeItem('oasis_deepseek_key');
            } else if (localKey) {
                setDeepseekKey(localKey);
            }
        };
        fetchDeepseekKey();
    }, []);

    useEffect(() => {
        if (!user) return;

        const storedPhenom = localStorage.getItem(`oasis_phenom_qualitative_${user}`);
        if (storedPhenom) {
            try { setPhenomData(JSON.parse(storedPhenom)); } catch (e) { console.error(e); }
        }

        const storedBio = localStorage.getItem(`oasis_bio_transcriptions_${user}`);
        if (storedBio) {
            try { setBioData(JSON.parse(storedBio)); } catch (e) { console.error(e); }
        }

        const storedPid = localStorage.getItem(`oasis_pid_answers_${user}`);
        if (storedPid) {
            try {
                const pData = JSON.parse(storedPid);
                setPidData(pData);
                setPidIndices(computePid5Indices(pData));
            } catch (e) { console.error(e); }
        }

        const storedAfc = localStorage.getItem(`oasis_afc_real_data_${user}`);
        if (storedAfc) {
            try {
                const parsed = JSON.parse(storedAfc);
                if (parsed && parsed.nodes) {
                    parsed.nodes = resolveCollisions(parsed.nodes);
                    console.log("🟢 afcData loaded successfully:", parsed);
                    setAfcData(parsed);
                } else {
                    console.warn("⚠️ afcData parsed but invalid format, using mock.");
                    const mock = { ...MOCK_AFC_DATA };
                    mock.nodes = resolveCollisions(mock.nodes);
                    setAfcData(mock);
                }
            } catch (e) { 
                console.error("🔴 Error parsing afcData, using mock:", e); 
                const mock = { ...MOCK_AFC_DATA };
                mock.nodes = resolveCollisions(mock.nodes);
                setAfcData(mock);
            }
        } else {
            console.log("ℹ️ No afcData found, using mock.");
            const mock = { ...MOCK_AFC_DATA };
            mock.nodes = resolveCollisions(mock.nodes);
            setAfcData(mock);
        }

        const storedNotes = localStorage.getItem(`oasis_afc_notes_${user}`);
        if (storedNotes) {
            try { setNodeNotes(JSON.parse(storedNotes)); } catch (e) { console.error(e); }
        } else {
            setNodeNotes({});
        }
    }, [user]);

    const handleSaveNote = (nodeId, text) => {
        const updatedNotes = {
            ...nodeNotes,
            [nodeId]: text
        };
        setNodeNotes(updatedNotes);
        setLocalItem(`oasis_afc_notes_${user}`, JSON.stringify(updatedNotes));
    };

    const computePid5Indices = (pidAnswers) => {
        if (!pidAnswers || Object.keys(pidAnswers).length === 0) return null;

        const sums = { reactividad: 0, conexion: 0, asertividad: 0, ritmo: 0, singularidad: 0 };
        for (let i = 1; i <= 25; i++) {
            const val = parseInt(pidAnswers[i] || 0, 10);
            if (i <= 5) sums.reactividad += val;
            else if (i <= 10) sums.conexion += val;
            else if (i <= 15) sums.asertividad += val;
            else if (i <= 20) sums.ritmo += val;
            else sums.singularidad += val;
        }

        const indices = {
            reactividad: parseFloat((sums.reactividad / 15).toFixed(3)),
            conexion: parseFloat((sums.conexion / 15).toFixed(3)),
            asertividad: parseFloat((sums.asertividad / 15).toFixed(3)),
            ritmo: parseFloat((sums.ritmo / 15).toFixed(3)),
            singularidad: parseFloat((sums.singularidad / 15).toFixed(3))
        };

        const getStatus = (idx) => {
            if (idx < 0.35) return { label: "Atenuado", color: "text-emerald-400 border-emerald-500/30", fill: "bg-emerald-500" };
            if (idx < 0.65) return { label: "Moderado", color: "text-amber-400 border-amber-500/30", fill: "bg-amber-500" };
            return { label: "Destacado", color: "text-violet-400 border-violet-500/30", fill: "bg-violet-500" };
        };

        return {
            raw: indices,
            status: {
                reactividad: getStatus(indices.reactividad),
                conexion: getStatus(indices.conexion),
                asertividad: getStatus(indices.asertividad),
                ritmo: getStatus(indices.ritmo),
                singularidad: getStatus(indices.singularidad)
            }
        };
    };

    const generateAFCAnalysis = async (isAdditive = false) => {
        // Disparar en paralelo la generación de la Firma de Resonancia (publicTraits) a petición del usuario
        if (!isAdditive) {
            generateDynamicTraits();
        }

        let activeKey = atob('c2stZmI3N2RiMTIyNjM4NDdjOGI1N2E0ODI5Nzk3NmM4NzU=');
        if (activeKey && (
            activeKey.includes("07b18eb6601a4b11a109c96a56c92a16") || 
            activeKey.includes("VAR>") ||
            activeKey.includes("7c7e257ac179439185c9deeff48d11f0") ||
            activeKey.includes("6cf43dc93") ||
            activeKey.includes("qw12") ||
            activeKey.includes("YOUR_DEEPSEEK_KEY") ||
            activeKey.includes("ESCRIBE_AQUI")
        )) {
            activeKey = '';
        }
        setIsAnalyzing("Construyendo topología masiva de nodos (Etapa 1/2)...");
        
        // Retrieve resolved blind spot answers dynamically from localStorage keys
        let blindSpotAnswersContext = "";
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith("oasis_blindspot_answer_")) {
                const part = key.substring("oasis_blindspot_answer_".length);
                const dIndex = part.indexOf('__');
                if (dIndex > -1) {
                    const keyUser = part.substring(0, dIndex);
                    const spotId = part.substring(dIndex + 2);
                    if (keyUser === user) {
                        const answer = localStorage.getItem(key);
                        const question = localStorage.getItem(`oasis_blindspot_question_${user}__${spotId}`) || "Pregunta de punto ciego";
                        const title = localStorage.getItem(`oasis_blindspot_title_${user}__${spotId}`) || "Punto ciego clínico";
                        if (answer) {
                            blindSpotAnswersContext += `- ${title} / Pregunta: "${question}" => Respuesta del paciente: "${answer}"\n`;
                        }
                    }
                }
            }
        }

        const currentNodesText = isAdditive && afcData && !afcData.is_mock ? JSON.stringify(afcData.nodes || [], null, 2) : "Ninguno (generación desde cero)";
        const currentEdgesText = isAdditive && afcData && !afcData.is_mock ? JSON.stringify(afcData.edges || [], null, 2) : "Ninguno (generación desde cero)";
        const currentBlindSpotsText = afcData && afcData.blind_spots ? JSON.stringify(afcData.blind_spots, null, 2) : "Ninguno";

        const context = `
=== EXTRAS / NOTAS ESPECÍFICAS DEL PACIENTE ===
${treatmentPlan?.patientExtras ? treatmentPlan.patientExtras : "No hay notas adicionales."}

=== DIAGNÓSTICO EXISTENCIAL ===
${phenomData ? JSON.stringify(phenomData, null, 2) : "No hay datos."}

=== HISTORIA DE VIDA ===
${bioData ? BIO_QUESTIONS.map((q, i) => `${q.text}: ${bioData[i] || ""}`).join('\n') : "No hay datos."}

=== RASGOS PID-5 ===
${pidIndices ? JSON.stringify(pidIndices.status, null, 2) : "No hay datos."}

=== RESPUESTAS A PUNTOS CIEGOS ===
${blindSpotAnswersContext || "Ninguno aún."}

=== MAPA CONDUCTUAL ACTUAL A PRESERVAR (SI APLICA) ===
Nodos actuales:
${currentNodesText}

Conexiones actuales:
${currentEdgesText}

Pool de Puntos Ciegos actual:
${currentBlindSpotsText}
        `;

        const systemPromptTopology = `
Eres un Psicólogo Clínico y Analista Existencial Especializado en Análisis Funcional de la Conducta (AFC).
ETAPA 1: TOPOLOGÍA. Tu tarea exclusiva es generar los nodos, conexiones y la distribución de modalidad.

=== REGLAS GENERALES ===
Analiza si las respuestas del paciente son congruentes y suficientes. Si es basura, devuelve "is_valid": false.

${isAdditive ? `
=== MODO ACTUALIZACIÓN ADITIVA ===
1. Copia EXACTAMENTE todos los nodos de 'Nodos actuales' en tu lista 'nodes' de salida. Conserva intactos sus atributos y coordenadas.
2. Copia EXACTAMENTE todas las conexiones de 'Conexiones actuales'.
3. Analiza las respuestas a los puntos ciegos recién respondidos y añade de 1 a 3 NUEVOS nodos y conexiones.
` : `
=== MODO GENERACIÓN DESDE CERO ===
1. Nodos: Genera exactamente entre 40 y 48 nodos. REGLA ESTRICTA DE BALANCE MATEMÁTICO: Debes generar entre 10 y 12 nodos de tipo 'historical' (azules), MÁXIMO 12 nodos en total sumando 'motor/cognitive/physiological' (rojos), MÁXIMO 12 nodos sumando 'biological/social' (verdes), y entre 10 y 12 nodos 'consequence' (blancos). ¡Si generas más de 12 rojos o 12 verdes, el sistema fallará por saturación visual! ORDEN DE RELEVANCIA: Identifica el motivo principal de consulta del paciente y ORDENA el arreglo de nodos de MAYOR a MENOR relevancia respecto a este motivo (los más directamente relacionados ponlos al principio del arreglo para que aparezcan en la parte superior del mapa). Usa formato ID ultracorto (n1, n2...). Textos internos del nodo ultra concisos (max 3-5 palabras).
   - historical (azules) -> x: entre -120 y -40
   - motor / cognitive / physiological (rojos) -> x: entre 20 y 100
   - biological / social (verdes) -> x: entre 140 y 220
   - consequence (blancos) -> x: entre 260 y 340
   - Coordenadas Y: distribúyelos desde Y: -400 hasta Y: 700. REGLA ESTRICTA DE ORDEN: Si dos nodos están en la misma columna (rango X), dales al menos 50 puntos de distancia Y para que no se mezclen ni se traslapen.
2. Conexiones (edges): Genera entre 55 y 65 conexiones. Mapa masivo y muy rico.
`}

=== ESTRUCTURA JSON REQUERIDA ===
{
  "is_valid": true,
  "rejection_reason": "...",
  "nodes": [
    // Lista de nodos
    // Cada nodo contiene: id (usa formato ultracorto: n1, n2...), type, label (max 3 palabras), x, y, description (max 5 palabras), source (cita corta, max 4 palabras), challenge (max 5 palabras), reflection_question (max 5 palabras)
  ],
  "edges": [
    // Lista de conexiones
    // Cada conexión contiene: source, target, weight (1, 2, 3), type ("unidirectional" | "bidirectional")
  ],
  "tripleModality": {
    "motor": 65,
    "cognitive": 85,
    "physiological": 40
  }
}
`;

        try {
            const endpoint = localStorage.getItem('oasis_deepseek_endpoint') || 'https://api.deepseek.com/chat/completions';
            const model = localStorage.getItem('oasis_deepseek_model') || 'deepseek-chat';

            const payload1 = {
                model: model,
                messages: [
                    { role: 'system', content: systemPromptTopology },
                    { role: 'user', content: "Genera exclusivamente la TOPOLOGÍA (nodos y edges) del AFC. Datos:\n" + context }
                ],
                response_format: { type: "json_object" },
                temperature: 0.3,
                max_tokens: 8192
            };

            const res1 = await fetch(`${API_URL}/api/oasis/config/chat-completion`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ endpoint, key: activeKey, payload: payload1 })
            });

            if (!res1.ok) {
                const errText = await res1.text();
                throw new Error(`Error HTTP ${res1.status} (Etapa 1): ${errText}`);
            }

            const data1 = await res1.json();
            let raw1 = data1.choices[0].message.content.trim();
            const start1 = raw1.indexOf('{');
            const end1 = raw1.lastIndexOf('}');
            let cleanContent1 = (start1 !== -1 && end1 !== -1) ? raw1.substring(start1, end1 + 1) : raw1;
            
            let parsedTopology;
            try {
                parsedTopology = JSON.parse(cleanContent1);
            } catch(e) {
                console.warn("JSON Parse failed in stage 1.", e);
                const match = e.message.match(/position (\d+)/);
                let contextStr = "";
                if (match && match[1]) {
                    const pos = parseInt(match[1], 10);
                    contextStr = "\\nContexto del error: ..." + cleanContent1.substring(Math.max(0, pos - 20), pos + 20) + "...";
                }
                throw new Error("El modelo generó un JSON inválido en la Etapa 1. " + e.message + contextStr);
            }

            if (!parsedTopology.is_valid) {
                throw new Error("El análisis fue rechazado por la IA: " + parsedTopology.rejection_reason);
            }

            setIsAnalyzing("Redactando análisis clínico profundo (Etapa 2/3)...");

            const systemPromptInsights = `
Eres un Psicólogo Clínico y Analista Existencial de Nivel Experto.
ETAPA 2: INSIGHTS PROFUNDOS. Ya tienes el mapa topológico generado en la Etapa 1. Tu tarea es generar el análisis escrito, hipótesis, puntos ciegos, patrones de dificultad y la firma de resonancia.

=== ESTRUCTURA JSON REQUERIDA ===
(CRÍTICO: Devuelve EXCLUSIVAMENTE un objeto JSON válido, verifica no agregar llaves "}" adicionales de cierre donde no van, y cuida las comas finales)
{
  "firma_resonancia": {
    "habitar": "Una frase poética pero clínica de máx. 12 palabras sobre cómo la persona habita su cuerpo y el espacio.",
    "vinculo": "Una frase de máx. 12 palabras sobre cómo se conecta con otros o su barrera principal.",
    "busqueda": "Una frase de máx. 12 palabras sobre su anhelo existencial no resuelto o su motor oculto.",
    "keywords": ["Palabra1", "Palabra2", "Palabra3"]
  },
  "hypotheses": {
    "mantenimiento": "Escribe un análisis profundo pero conciso (alrededor de 120 a 130 palabras, dividido en 2 párrafos). Explica clínica y fenomenológicamente cómo el paciente perpetúa su sufrimiento y mantiene el bucle activo.",
    "solucion": "Escribe una propuesta estructurada (alrededor de 120 a 130 palabras, dividida en 2 párrafos). Debe ser COMPLETAMENTE DISTINTA al mantenimiento. Enfócate radicalmente en la acción clínica para romper la evitación."
  },
  "explicacion_sencilla": "Escribe una narración cálida y empática (alrededor de 120 a 130 palabras, dividida en 2 párrafos). Explícale cómo funciona su bucle. Háblale directamente de 'tú'. Profundiza en su dolor, pero sé directo.",
  "claves_salida": "Escribe una lista de 3 a 4 consejos prácticos, empáticos y muy sencillos de leer (en un tono cercano de 'tú'), separados por saltos de línea y comenzando con un guion. Cada consejo debe sugerir un cambio de actitud o acción cotidiana realista.",
  "analysis_breakdown": {
    "historical_evidence": "Evidencia histórica.",
    "mediators_evidence": "Evidencia de mediadores.",
    "conducts_evidence": "Evidencia de conductas.",
    "consequences_evidence": "Evidencia de consecuencias."
  },
  "blind_spots": [
    // Pool de puntos ciegos (5 elementos en modo generación desde cero, o los restantes en modo aditivo)
    // Cada punto ciego contiene:
    // - id: identificador único.
    // - title: título de la brecha.
    // - question: la pregunta de confrontación.
    // - node: el nodo "incompleto" o "dashed" propuesto: { id: "blind_spot_...", type, label, x, y }
    // - edge: la conexión propuesta: { source, target, weight, type }
  ],
  "patrones_dificultad": [
    // Array de 1 a 2 patrones de dificultad o circuitos clínicos identificados.
    // Cada patrón encadena de 3 a 6 nodos.
    // - id: string único
    // - nombre: título cortísimo del ciclo (máximo 4 palabras)
    // - clave_salida: un consejo práctico, único y amable (máximo 25 palabras) específico para flexibilizar este circuito.
  ]
}
`;

            const payload2 = {
                model: model,
                messages: [
                    { role: 'system', content: systemPromptInsights },
                    { role: 'user', content: `Basado en los datos del paciente y esta topología generada, redacta el análisis profundo.\n\nDatos:\n${context}\n\nTopología Generada (usa estos IDs para conectar tus patrones):\n${JSON.stringify(parsedTopology.nodes)}` }
                ],
                response_format: { type: "json_object" },
                temperature: 0.3,
                max_tokens: 8192
            };

            const res2 = await fetch(`${API_URL}/api/oasis/config/chat-completion`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ endpoint, key: activeKey, payload: payload2 })
            });

            if (!res2.ok) {
                const errText = await res2.text();
                throw new Error(`Error HTTP ${res2.status} (Etapa 2): ${errText}`);
            }

            const data2 = await res2.json();
            let raw2 = data2.choices[0].message.content.trim();
            const start2 = raw2.indexOf('{');
            const end2 = raw2.lastIndexOf('}');
            let cleanContent2 = (start2 !== -1 && end2 !== -1) ? raw2.substring(start2, end2 + 1) : raw2;
            
            // Auto-heal common JSON syntax hallucinations from Deepseek (extra '}' before claves_salida or similar root keys)
            cleanContent2 = cleanContent2.replace(/},\s*"claves_salida":/g, ',\n  "claves_salida":');
            cleanContent2 = cleanContent2.replace(/},\s*"analysis_breakdown":/g, ',\n  "analysis_breakdown":');

            let parsedInsights;
            try {
                parsedInsights = JSON.parse(cleanContent2);
            } catch(e) {
                console.warn("JSON Parse failed in stage 2.", e);
                const match = e.message.match(/position (\d+)/);
                let contextStr = "";
                if (match && match[1]) {
                    const pos = parseInt(match[1], 10);
                    contextStr = "\\nContexto del error: ..." + cleanContent2.substring(Math.max(0, pos - 20), pos + 20) + "...";
                }
                throw new Error("El modelo generó un JSON inválido en la Etapa 2. " + e.message + contextStr);
            }

            const parsedAfc = {
                ...parsedTopology,
                ...parsedInsights
            };

            

            if (parsedAfc.is_valid && parsedAfc.nodes) {
                if (!isAdditive) {
                    parsedAfc.nodes = reorganizeNodes(parsedAfc.nodes, true);
                } else {
                    parsedAfc.nodes = resolveCollisions(parsedAfc.nodes);
                }
            }

            setAfcData(parsedAfc);
            setLocalItem(`oasis_afc_real_data_${user}`, JSON.stringify(parsedAfc));
            setSelectedNode(null);
            setSelectedBlindSpotIndex(0);
            setViewMode('dashboard');
        } catch (err) {
            console.error("Error generando AFC:", err);
            alert("Ocurrió un error al generar el análisis funcional: " + err.message);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const generateMissingBlindSpots = async () => {
        let activeKey = atob('c2stZmI3N2RiMTIyNjM4NDdjOGI1N2E0ODI5Nzk3NmM4NzU=');
        if (activeKey && (
            activeKey.includes("07b18eb6601a4b11a109c96a56c92a16") || 
            activeKey.includes("VAR>") ||
            activeKey.includes("7c7e257ac179439185c9deeff48d11f0") ||
            activeKey.includes("6cf43dc93") ||
            activeKey.includes("qw12") ||
            activeKey.includes("YOUR_DEEPSEEK_KEY") ||
            activeKey.includes("ESCRIBE_AQUI")
        )) {
            activeKey = '';
        }
        setIsGeneratingBlindSpots(true);

        let blindSpotAnswersContext = "";
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith("oasis_blindspot_answer_")) {
                const part = key.substring("oasis_blindspot_answer_".length);
                const dIndex = part.indexOf('__');
                if (dIndex > -1) {
                    const keyUser = part.substring(0, dIndex);
                    const spotId = part.substring(dIndex + 2);
                    if (keyUser === user) {
                        const answer = localStorage.getItem(key);
                        const question = localStorage.getItem(`oasis_blindspot_question_${user}__${spotId}`) || "Pregunta de punto ciego";
                        const title = localStorage.getItem(`oasis_blindspot_title_${user}__${spotId}`) || "Punto ciego clínico";
                        if (answer) {
                            blindSpotAnswersContext += `- ${title} / Pregunta: "${question}" => Respuesta del paciente: "${answer}"\n`;
                        }
                    }
                }
            }
        }

        const currentNodesText = afcData && !afcData.is_mock ? JSON.stringify(afcData.nodes || [], null, 2) : "Ninguno";
        const currentEdgesText = afcData && !afcData.is_mock ? JSON.stringify(afcData.edges || [], null, 2) : "Ninguno";

        const systemPrompt = `
Eres un Psicólogo Clínico y Analista Existencial de Nivel Experto.
El paciente tiene un mapa conductual generado. Tu objetivo es generar EXACTAMENTE 10 Puntos Ciegos Clínicos (brechas analíticas) personalizados y profundos basados en la información existencial, biográfica e integral del paciente.

=== INSTRUCCIONES ===
1. Debes generar exactamente 10 elementos en la lista 'blind_spots' de tu JSON de salida.
2. Cada punto ciego debe ser real, confrontativo, y proponer un nodo 'dashed' nuevo y una conexión para integrarlo al mapa conductual actual.
3. Devuelve únicamente el objeto JSON con la estructura:
{
  "blind_spots": [
     // Lista de exactamente 10 puntos ciegos
     // Cada uno tiene:
     // - id: identificador único (ej. "vacio_cronologico").
     // - title: título de la brecha.
     // - question: la pregunta de confrontación.
     // - node: el nodo "incompleto" o "dashed" propuesto: { id: "blind_spot_...", type, label, x, y }
     // - edge: la conexión propuesta: { source, target, weight, type }
  ]
}

=== DATOS DEL PACIENTE ===
Diagnóstico Existencial: ${phenomData ? JSON.stringify(phenomData, null, 2) : "No hay datos."}
Historia de Vida: ${bioData ? BIO_QUESTIONS.map((q, i) => `${q.text}: ${bioData[i] || ""}`).join('\n') : "No hay datos."}
Respuestas previas a puntos ciegos: ${blindSpotAnswersContext || "Ninguno."}
Nodos actuales: ${currentNodesText}
Conexiones actuales: ${currentEdgesText}
        `;

        try {
            const endpoint = localStorage.getItem('oasis_deepseek_endpoint') || 'https://api.deepseek.com/chat/completions';
            const model = localStorage.getItem('oasis_deepseek_model') || 'deepseek-chat';

            const payload = {
                model: model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: "Por favor, genera un pool de exactamente 10 puntos ciegos clínicos reales y personalizados para mi perfil." }
                ],
                response_format: { type: "json_object" },
                temperature: 0.3,
                max_tokens: 8192
            };

            const res = await fetch(`${API_URL}/api/oasis/config/chat-completion`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    endpoint: endpoint,
                    key: activeKey,
                    payload: payload
                })
            });

            if (!res.ok) {
                const errText = await res.text();
                let msg = `Error HTTP ${res.status}: ${errText}`;
                try {
                    const parsedErr = JSON.parse(errText);
                    if (parsedErr.msg) msg = parsedErr.msg;
                } catch (e) { }
                throw new Error(msg);
            }

            const data = await res.json();
            const aiContent = data.choices[0].message.content;

            let cleanContent = aiContent.trim();
            if (cleanContent.startsWith("```")) {
                cleanContent = cleanContent.replace(/^```[a-zA-Z]*\s*/, "");
                cleanContent = cleanContent.replace(/\s*```$/, "");
            }

            const parsed = JSON.parse(cleanContent.trim());
            if (parsed.blind_spots && parsed.blind_spots.length > 0) {
                const updatedAfc = {
                    ...afcData,
                    blind_spots: parsed.blind_spots
                };
                setAfcData(updatedAfc);
                setLocalItem(`oasis_afc_real_data_${user}`, JSON.stringify(updatedAfc));
                setSelectedBlindSpotIndex(0);
                alert("Se han generado 10 puntos ciegos personalizados con IA para tu perfil.");
            } else {
                throw new Error("No se devolvió un pool válido de puntos ciegos.");
            }
        } catch (err) {
            console.error("Error generating blind spots:", err);
            alert("Ocurrió un error al generar los puntos ciegos: " + err.message);
        } finally {
            setIsGeneratingBlindSpots(false);
        }
    };

    const generateLifeUpdate = async () => {
        if (!lifeUpdateText.trim()) return;
        setIsUpdatingMap(true);
        try {
            let activeKey = atob('c2stZmI3N2RiMTIyNjM4NDdjOGI1N2E0ODI5Nzk3NmM4NzU=');
            if (activeKey && (
                activeKey.includes("07b18eb6601a4b11a109c96a56c92a16") || 
                activeKey.includes("VAR>") ||
                activeKey.includes("7c7e257ac179439185c9deeff48d11f0") ||
                activeKey.includes("6cf43dc93") ||
                activeKey.includes("qw12") ||
                activeKey.includes("YOUR_DEEPSEEK_KEY") ||
                activeKey.includes("ESCRIBE_AQUI")
            )) {
                activeKey = '';
            }

            const currentNodesText = afcData?.nodes ? JSON.stringify(afcData.nodes, null, 2) : "[]";
            const currentEdgesText = afcData?.edges ? JSON.stringify(afcData.edges, null, 2) : "[]";

            const systemPrompt = `
Eres un Psicólogo Clínico y Analista Existencial. El paciente te está compartiendo una actualización importante sobre su vida (avances, cambios, recaídas o logros).
Tu tarea es actualizar su Mapa Conductual actual (Análisis Funcional). Puedes hacer dos cosas:
1. AÑADIR de 1 a 4 NUEVOS nodos que representen esta actualización y conectarlos al mapa existente.
2. OPCIONALMENTE MODIFICAR los nodos existentes si la actualización implica que han cambiado (por ejemplo, si un mecanismo de defensa ya no se usa, o una creencia cognitiva cambió). No elimines nodos, solo modifícalos si es absolutamente necesario para reflejar el avance.

Devuelve ÚNICAMENTE un objeto JSON con este formato exacto:
{
  "new_nodes": [
    {
      "id": "update_123",
      "type": "consequence", // puede ser historical, biological, social, cognitive, motor, physiological, consequence
      "label": "Título corto",
      "description": "Análisis de este nuevo estado o avance",
      "challenge": "El reto existencial superado o a futuro",
      "x": 80, // coordenada X sugerida (0 a 100)
      "y": 80  // coordenada Y sugerida (-100 a 200)
    }
  ],
  "modified_nodes": [
    {
      "id": "id_del_nodo_existente", // Debe coincidir exactamente con el ID de un nodo existente en el mapa
      "label": "Nuevo título (si cambió)",
      "description": "Nueva descripción reflejando el cambio o avance",
      "challenge": "Nuevo reto existencial (si aplica)"
    }
  ],
  "new_edges": [
    {
      "source": "id_nodo_existente_o_nuevo",
      "target": "id_nodo_existente_o_nuevo",
      "weight": 1.5,
      "type": "progression"
    }
  ],
  "mensaje_terapeutico": "Un mensaje empático, profundo y validante de 1 párrafo para el paciente sobre su actualización."
}

MAPA ACTUAL:
Nodos: ${currentNodesText}
Conexiones: ${currentEdgesText}

ACTUALIZACIÓN DEL PACIENTE:
"${lifeUpdateText}"
`;

            const endpoint = localStorage.getItem('oasis_deepseek_endpoint') || 'https://api.deepseek.com/chat/completions';
            const model = localStorage.getItem('oasis_deepseek_model') || 'deepseek-chat';

            const payload = {
                model: model,
                messages: [{ role: 'system', content: systemPrompt }],
                response_format: { type: "json_object" },
                temperature: 0.3,
                max_tokens: 8192
            };

            const res = await fetch(`${API_URL}/api/oasis/config/chat-completion`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ endpoint, key: activeKey, payload })
            });

            if (!res.ok) throw new Error("Error en la respuesta del servidor");
            
            const data = await res.json();
            let cleanContent = data.choices[0].message.content.trim();
            if (cleanContent.startsWith("\`\`\`")) {
                cleanContent = cleanContent.replace(/^\`\`\`[a-zA-Z]*\s*/, "").replace(/\s*\`\`\`$/, "");
            }
            const parsed = JSON.parse(cleanContent);
            
            if (parsed.new_nodes || parsed.new_edges || parsed.modified_nodes) {
                const updatedAfc = { ...afcData };
                let currentNodes = [...(updatedAfc.nodes || [])];
                
                if (parsed.modified_nodes) {
                    parsed.modified_nodes.forEach(modNode => {
                        const index = currentNodes.findIndex(n => n.id === modNode.id);
                        if (index !== -1) {
                            currentNodes[index] = { ...currentNodes[index], ...modNode };
                        }
                    });
                }
                
                if (parsed.new_nodes) {
                    currentNodes = [...currentNodes, ...parsed.new_nodes];
                }
                
                updatedAfc.nodes = resolveCollisions(currentNodes);
                if (parsed.new_edges) updatedAfc.edges = [...(updatedAfc.edges || []), ...parsed.new_edges];

                setAfcData(updatedAfc);
                setLocalItem(`oasis_afc_real_data_${user}`, JSON.stringify(updatedAfc));
                
                if (parsed.mensaje_terapeutico) {
                    alert("Mensaje Terapéutico:\n\n" + parsed.mensaje_terapeutico);
                }
                setLifeUpdateText("");
                setMapViewTab('map');
            } else {
                throw new Error("El modelo no devolvió nodos nuevos.");
            }
        } catch (err) {
            console.error(err);
            alert("Ocurrió un error al procesar tu avance: " + err.message);
        } finally {
            setIsUpdatingMap(false);
        }
    };

    const generateBioStrategicQuestions = async () => {
        if (!bioData || Object.keys(bioData).length === 0) {
            alert("No hay datos de Historia de Vida para analizar.");
            return;
        }

        setIsGeneratingBioQuestions(true);
        try {
            let activeKey = atob('c2stZmI3N2RiMTIyNjM4NDdjOGI1N2E0ODI5Nzk3NmM4NzU=');
            const endpoint = localStorage.getItem('oasis_deepseek_endpoint') || 'https://api.deepseek.com/chat/completions';
            const model = localStorage.getItem('oasis_deepseek_model') || 'deepseek-chat';

            const prompt = `
Eres un psicoterapeuta avanzado analizando la Historia de Vida de un paciente.
A continuación te presento sus respuestas a la entrevista biográfica.
Para cada respuesta proporcionada, genera 2 o 3 preguntas estratégicas de exploración profunda (preguntas que sirvan para sacar a flote nuevos puntos de la historia clínica en la sesión, explorar defensas o investigar el origen del síntoma).
Devuelve el resultado como un JSON donde las claves son exactamente los mismos índices (0, 1, 2...) de las preguntas respondidas, y el valor es un arreglo de strings (las preguntas de exploración).

=== RESPUESTAS DEL PACIENTE ===
${Object.entries(bioData).map(([idx, text]) => `[Pregunta ${idx}] ${BIO_QUESTIONS[idx]?.text}:\n${text}`).join('\n\n')}

Devuelve estrictamente el JSON, sin formato extra ni Markdown.
`;

            const res = await fetch(`${API_URL}/api/oasis/config/chat-completion`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    endpoint: endpoint,
                    key: activeKey,
                    payload: {
                        model: model,
                        messages: [
                            { role: 'system', content: "Genera JSON con preguntas estratégicas de exploración clínica." },
                            { role: 'user', content: prompt }
                        ],
                        response_format: { type: "json_object" },
                        temperature: 0.3,
                        max_tokens: 8192
                    }
                })
            });

            if (!res.ok) throw new Error("Error en la generación de preguntas.");
            const data = await res.json();
            const aiContent = data.choices[0].message.content;
            let cleanContent = aiContent.trim();
            if (cleanContent.startsWith("\`\`\`")) {
                cleanContent = cleanContent.replace(/^\`\`\`[a-zA-Z]*\s*/, "").replace(/\s*\`\`\`$/, "");
            }
            
            const parsed = JSON.parse(cleanContent);
            setBioStrategicQuestions(parsed);
            setLocalItem(`oasis_bio_strategic_questions_${user}`, JSON.stringify(parsed));
            
        } catch (err) {
            console.error(err);
            alert("Ocurrió un error al generar las preguntas estratégicas.");
        } finally {
            setIsGeneratingBioQuestions(false);
        }
    };

    const continueNodeExploration = async (currentNode, userResponseText = null, threadIndex = selectedQuestionIndex || 0) => {
        let activeKey = atob('c2stZmI3N2RiMTIyNjM4NDdjOGI1N2E0ODI5Nzk3NmM4NzU=');
        if (activeKey && (
            activeKey.includes("07b18eb6601a4b11a109c96a56c92a16") || 
            activeKey.includes("VAR>") ||
            activeKey.includes("7c7e257ac179439185c9deeff48d11f0") ||
            activeKey.includes("6cf43dc93") ||
            activeKey.includes("qw12") ||
            activeKey.includes("YOUR_DEEPSEEK_KEY") ||
            activeKey.includes("ESCRIBE_AQUI")
        )) {
            activeKey = '';
        }
        
        setIsGeneratingExplorations(true);

        // Fetch current chat history for this node
        const currentChat = getSafeCurrentChat(currentNode.id, threadIndex);

        // Build messages array for LLM context
        const llmMessages = [];
        
        // System prompt
        let systemPrompt = `Eres un Psicólogo Clínico y Analista Existencial de Nivel Experto.
El paciente está explorando un nodo de su mapa conductual (Grafo de Bucles) en formato de conversación viva contigo.
Tu objetivo es guiar esta exploración de forma empática, profunda y confrontativa cuando sea necesario.

=== CONTEXTO DEL PACIENTE ===
Diagnóstico Existencial: ${phenomData ? JSON.stringify(phenomData) : "No hay datos."}
Historia de Vida: ${bioData ? BIO_QUESTIONS.map((q, i) => `${q.text}: ${bioData[i] || ""}`).join('\n') : "No hay datos."}

=== NODO EN EXPLORACIÓN ===
Nodo: "${currentNode.label}" (Tipo: ${currentNode.type})
Análisis original: ${getFallbackDescription(currentNode, user)}

=== INSTRUCCIONES ===
1. Evalúa el historial de la conversación (si existe) y la última respuesta del paciente.
2. Si la conversación apenas inicia (el paciente no ha hablado), rompe el hielo con una única pregunta abierta muy poderosa y reflexiva. Enfoque: ${threadIndex === 0 ? 'RAÍZ HISTÓRICA o pasado (experiencias escolares, familia, infancia)' : threadIndex === 1 ? 'RELACIONES ACTUALES o entorno social (pareja, amistades, trabajo)' : threadIndex === 2 ? 'EFECTOS FISIOLÓGICOS o corporales (tensión, respiración, agotamiento)' : threadIndex === 3 ? 'VALORES y significados (creatividad, libertad, autenticidad)' : threadIndex === 4 ? 'CONDUCTAS y patrones (procrastinación, evitación, sobreesfuerzo)' : 'EXPERIMENTOS y acciones concretas para explorar nuevas posibilidades'}.
3. Si el paciente ya respondió, valida brevemente su respuesta y haz una ÚNICA pregunta de seguimiento que profundice un nivel más abajo (ej. yendo a la raíz histórica, a los efectos sistémicos, a los valores ocultos, etc.).
4. OPCIONAL: Si descubres que el paciente acaba de revelar un patrón, figura, miedo o concepto NUEVO que es muy importante, puedes sugerir un NUEVO NODO para agregarse al mapa conductual.
5. Devuelve ÚNICAMENTE un objeto JSON.

ESTRUCTURA DE SALIDA ESPERADA:
{
  "next_question": "La respuesta validante breve y tu única pregunta poderosa de seguimiento.",
  "new_node": null
}`;

        if (threadIndex === 6) {
            systemPrompt = `Eres un Psicólogo Clínico y Analista Existencial de Nivel Experto.
El paciente está cerrando e integrando la exploración de un nodo de su mapa conductual.
Ha explorado este nodo desde múltiples perspectivas diferentes (Historia, Relaciones, Cuerpo, Valores, Conductas, Experimentos).

=== NODO EN EXPLORACIÓN ===
Nodo: "${currentNode.label}" (Tipo: ${currentNode.type})

=== INSTRUCCIONES DE CIERRE E INTEGRACIÓN ===
1. La última parte del nodo invita a observar qué cambió durante la exploración. NO busques obtener más información. Busca INTEGRAR la experiencia.
2. Si el paciente NO ha hablado en esta etapa de integración, genera un ÚNICO mensaje de cierre que resuma compasivamente el núcleo de lo que se ha revelado en las perspectivas (usando tu contexto de todo lo que el paciente ha dicho) y termina con una sola pregunta integradora: "¿Qué ha cambiado en tu forma de ver o sentir esto después de esta exploración?".
3. Si el paciente ya respondió a tu pregunta de integración, evalúa si ha ocurrido una "reorganización de significado" genuina.
4. Devuelve ÚNICAMENTE un objeto JSON. Si consideras que el paciente ha integrado la experiencia con éxito (insight), establece "node_status": "integrated". De lo contrario, "node_status": "open".

ESTRUCTURA DE SALIDA ESPERADA:
{
  "next_question": "Tu mensaje integrador o respuesta final.",
  "node_status": "open"
}`;
        }

        
        llmMessages.push({ role: 'system', content: systemPrompt });

        if (threadIndex === 6) {
            // Recopilar el contexto de todas las perspectivas previas
            let contextBuilder = "=== HISTORIAL DE EXPLORACIÓN DEL PACIENTE EN ESTE NODO ===\n";
            const perspectives = ['Historia', 'Relaciones', 'Cuerpo', 'Valores', 'Conductas', 'Experimentos'];
            for (let i = 0; i < 6; i++) {
                const tChat = getSafeCurrentChat(currentNode.id, i);
                if (tChat.length > 0) {
                    contextBuilder += `\n-- Perspectiva: ${perspectives[i]} --\n`;
                    tChat.forEach(m => {
                        contextBuilder += `${m.role === 'user' ? 'Paciente' : 'Terapeuta'}: ${m.content}\n`;
                    });
                }
            }
            llmMessages.push({ role: 'system', content: contextBuilder });
        }

        // Append past conversation history so LLM knows the context
        currentChat.forEach(msg => {
            if (msg.role === 'assistant') {
                llmMessages.push({ role: 'assistant', content: msg.content });
            } else if (msg.role === 'user') {
                llmMessages.push({ role: 'user', content: msg.content });
            }
        });

        // Append the new user response if it exists
        if (userResponseText) {
            llmMessages.push({ role: 'user', content: userResponseText });
        }

        try {
            const endpoint = localStorage.getItem('oasis_deepseek_endpoint') || 'https://api.deepseek.com/chat/completions';
            const model = localStorage.getItem('oasis_deepseek_model') || 'deepseek-chat';

            const payload = {
                model: model,
                messages: llmMessages.length > 1 ? llmMessages : [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Iniciemos la exploración del nodo "${currentNode.label}". ¿Qué pregunta me harías para empezar a indagar en la raíz de esto?` }
                ],
                response_format: { type: "json_object" },
                temperature: 0.4,
                max_tokens: 4096
            };

            const res = await fetch(`${API_URL}/api/oasis/config/chat-completion`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ endpoint: endpoint, key: activeKey, payload: payload })
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`Error HTTP ${res.status}: ${errText}`);
            }

            const data = await res.json();
            const aiContent = data.choices[0].message.content;

            let cleanContent = aiContent.trim();
            if (cleanContent.startsWith("```")) {
                cleanContent = cleanContent.replace(/^```[a-zA-Z]*\s*/, "").replace(/\s*```$/, "");
            }

            let parsed;
            try {
                parsed = JSON.parse(cleanContent.trim());
            } catch (err) {
                if (err.message.includes('Unexpected end of JSON input') || err.message.includes('Unterminated string')) {
                    // LLM cutoff (max_tokens hit or network timeout). Auto-heal basic cutoffs.
                    let healed = cleanContent.trim();
                    if (healed.lastIndexOf('"') > healed.lastIndexOf(':')) {
                        healed += '"}';
                    } else {
                        healed += '}';
                    }
                    try {
                        parsed = JSON.parse(healed);
                    } catch (e2) {
                        throw new Error('El modelo de IA agotó su límite de tiempo o tokens al responder. Intenta enviar tu respuesta de nuevo.');
                    }
                } else {
                    throw err;
                }
            }
            if (parsed.next_question) {
                // Determine new chat array
                const updatedChat = [...currentChat];
                if (userResponseText) {
                    updatedChat.push({ role: 'user', content: userResponseText });
                }
                
                const assistantMessage = { 
                    role: 'assistant', 
                    content: parsed.next_question,
                    newNodeAdded: parsed.new_node || null
                };
                updatedChat.push(assistantMessage);

                setNodeChats(prev => {
                    const currentThreads = prev[currentNode.id] || { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
                    const isLegacy = Array.isArray(currentThreads);
                    
                    if (isLegacy) {
                        return {
                            ...prev,
                            [currentNode.id]: {
                                0: threadIndex === 0 ? updatedChat : currentThreads,
                                1: threadIndex === 1 ? updatedChat : [],
                                2: threadIndex === 2 ? updatedChat : [],
                                3: threadIndex === 3 ? updatedChat : [],
                                4: threadIndex === 4 ? updatedChat : [],
                                5: threadIndex === 5 ? updatedChat : [],
                                6: threadIndex === 6 ? updatedChat : []
                            }
                        };
                    }

                    return {
                        ...prev,
                        [currentNode.id]: {
                            ...currentThreads,
                            [threadIndex]: updatedChat
                        }
                    };
                });

                // Handle new node dynamic addition to visual map if LLM proposed one
                if (threadIndex === 6 && parsed.node_status === 'integrated') {
                        setAfcData(prev => {
                            if (!prev || !prev.nodes) return prev;
                            return {
                                ...prev,
                                nodes: prev.nodes.map(n => n.id === currentNode.id ? { ...n, status: 'integrated' } : n)
                            };
                        });
                    }
                    if (parsed.new_node) {
                    const uniqueId = `dynamic_node_${Date.now()}`;
                    const newNode = {
                        id: uniqueId,
                        type: parsed.new_node.type || 'cognitive',
                        label: parsed.new_node.label || 'Nuevo patrón',
                        description: parsed.new_node.description || '',
                        x: currentNode.x + (Math.random() * 20 - 10),
                        y: currentNode.y + (Math.random() * 20 - 10)
                    };
                    const newEdge = {
                        source: currentNode.id,
                        target: uniqueId,
                        weight: 1.5,
                        type: parsed.new_node.edge_type || 'progression'
                    };
                    
                    if (afcData) {
                        const updatedAfcData = { ...afcData };
                        updatedAfcData.nodes = [...updatedAfcData.nodes, newNode];
                        updatedAfcData.edges = [...updatedAfcData.edges, newEdge];
                        setAfcData(updatedAfcData);
                        setLocalItem(`oasis_afc_real_data_${user}`, JSON.stringify(updatedAfcData));
                    }
                }

                // Scroll to bottom of chat if UI is open
                setTimeout(() => {
                    const containers = document.querySelectorAll('.node-chat-scroll');
                    containers.forEach(container => {
                        container.scrollTop = container.scrollHeight;
                    });
                }, 100);

            } else {
                throw new Error("No se devolvió un next_question válido en el JSON.");
            }
        } catch (err) {
            console.error("Error generando exploración:", err);
            alert("Ocurrió un error al continuar la conversación: " + err.message);
        } finally {
            setIsGeneratingExplorations(false);
            setExplorationResponse(''); // Clear input box
            localStorage.removeItem('draft_' + currentNode.id + '_' + threadIndex);

            // Check if we just unlocked the integration thread!
            if (threadIndex !== 6) {
                let answeredCount = 0;
                for (let i = 0; i < 6; i++) {
                    if (i === threadIndex) answeredCount++; // We just answered this one
                    else {
                        const tChat = getSafeCurrentChat(currentNode.id, i);
                        if (tChat.some(m => m.role === 'user')) answeredCount++;
                    }
                }
                if (answeredCount === 6) {
                    // Auto-switch to Integration!
                    setTimeout(() => {
                        setSelectedQuestionIndex(6);
                        const nextChat = getSafeCurrentChat(currentNode.id, 6);
                        if (!nextChat || nextChat.length === 0) {
                            // Optionally trigger the initial LLM message for integration automatically:
                            continueNodeExploration(currentNode, null, 6);
                        }
                    }, 1500); // Wait a moment so they see their message submitted
                }
            }

        }
    };

    const handleExplorationSubmit = async (e) => {
        if (e) e.preventDefault();
        if (selectedQuestionIndex === null || !explorationResponse.trim() || isSubmittingExploration || !selectedNode) return;

        const spot = explorationQuestions[selectedQuestionIndex];
        const nodeId = selectedNode.id;

        setIsSubmittingExploration(true);

        try {
            const answer = explorationResponse.trim();
            const answerKey = `oasis_blindspot_answer_${user}__${spot.id}`;
            const resolvedKey = `oasis_blindspot_resolved_${user}__${spot.id}`;
            const questionKey = `oasis_blindspot_question_${user}__${spot.id}`;
            const titleKey = `oasis_blindspot_title_${user}__${spot.id}`;

            setLocalItem(answerKey, answer);
            setLocalItem(resolvedKey, 'true');
            setLocalItem(questionKey, spot.question);
            setLocalItem(titleKey, spot.title);

            if (afcData) {
                const updatedAfc = { ...afcData };

                const childCount = updatedAfc.edges.filter(ed => ed.source === nodeId).length;
                const angle = ((childCount * 60 + 45) * Math.PI) / 180;
                const radius = 18;

                const spotNode = spot.node || { id: `blind_spot_${spot.id}`, type: "cognitive", label: spot.title };
                const spotNodeId = spotNode.id.startsWith("blind_spot_") ? spotNode.id : `blind_spot_${spotNode.id}`;

                const solidNode = {
                    ...spotNode,
                    id: spotNodeId,
                    x: selectedNode.x + Math.cos(angle) * radius,
                    y: selectedNode.y + Math.sin(angle) * radius,
                    dashed: false
                };

                if (!updatedAfc.nodes.some(n => n.id === solidNode.id)) {
                    updatedAfc.nodes = [...updatedAfc.nodes, solidNode];
                } else {
                    updatedAfc.nodes = updatedAfc.nodes.map(n => n.id === solidNode.id ? { ...n, ...solidNode } : n);
                }

                const spotEdge = spot.edge || { source: nodeId, target: solidNode.id };
                const matchedEdge = {
                    ...spotEdge,
                    source: nodeId,
                    target: solidNode.id
                };

                if (!updatedAfc.edges.some(eg => eg.source === matchedEdge.source && eg.target === matchedEdge.target)) {
                    updatedAfc.edges = [...updatedAfc.edges, matchedEdge];
                }

                setAfcData(updatedAfc);
                setLocalItem(`oasis_afc_real_data_${user}`, JSON.stringify(updatedAfc));

                // Keep the narrative tour pointer on the new node
                const typeOrder = {
                    historical: 0,
                    biological: 1,
                    social: 2,
                    cognitive: 3,
                    motor: 4,
                    physiological: 5,
                    consequence: 6
                };
                const nextSortedNodes = [...updatedAfc.nodes].sort((a, b) => {
                    const orderA = typeOrder[a.type] ?? 99;
                    const orderB = typeOrder[b.type] ?? 99;
                    if (orderA !== orderB) return orderA - orderB;
                    if (a.x !== b.x) return a.x - b.x;
                    return a.y - b.y;
                });
                const newActiveIdx = nextSortedNodes.findIndex(sn => sn.id === solidNode.id);
                if (newActiveIdx !== -1) {
                    setTourActiveIndex(newActiveIdx);
                }

                setSelectedNode(solidNode);

                if (mapContainerRef.current) {
                    const rect = mapContainerRef.current.getBoundingClientRect();
                    const width = rect.width;
                    const height = rect.height;
                    const px = width * (solidNode.x / 100);
                    const py = height * (solidNode.y / 100);
                    const targetScale = 1.05;
                    const tx = -(px - width / 2) * targetScale;
                    const ty = -(py - height / 2) * targetScale;
                    triggerProgrammaticTransition();
                    transformRef.current = { x: tx, y: ty, scale: targetScale };
                    setMapTransform({ x: tx, y: ty, scale: targetScale });
                }
            }

            const spots = nodeExplorations[nodeId] || [];
            const updatedSpots = spots.map(s => s.id === spot.id ? { ...s, resolved: true } : s);
            const updatedExplorations = {
                ...nodeExplorations,
                [nodeId]: updatedSpots
            };
            saveNodeExplorations(updatedExplorations);

            setExplorationResponse("");
            setIsSubmittingExploration(false);
            setExplorationModalOpen(false);
        } catch (err) {
            console.error("Error submitting exploration:", err);
            setIsSubmittingExploration(false);
        }
    };

    useEffect(() => {
        // Trigger auto-analysis only if we have user data and are not already analyzing
        if (!user || isAnalyzing || autoAnalysisTriggered) return;

        const storedAfc = localStorage.getItem(`oasis_afc_real_data_${user}`);
        let parsed = null;
        if (storedAfc) {
            try {
                parsed = JSON.parse(storedAfc);
            } catch (e) { }
        }

        // Check if we have already attempted to generate the analysis (persisted across sessions to avoid loops and save balance)
        const attemptKey = `oasis_afc_attempted_${user}`;
        const hasAttempted = localStorage.getItem(attemptKey) === 'true';

        // If there is no stored AFC analysis, OR the stored analysis doesn't have the dynamic "blind_spots" array,
        // and we haven't already attempted it, we trigger the generation automatically!
        if (!hasAttempted && (!parsed || !parsed.blind_spots || parsed.blind_spots.length === 0)) {
            if (phenomData || bioData || pidIndices) {
                setLocalItem(attemptKey, 'true'); // Persist attempt immediately to avoid loops on failure/error
                setAutoAnalysisTriggered(true);
                generateAFCAnalysis();
            }
        }
    }, [user, deepseekKey, phenomData, bioData, pidIndices, autoAnalysisTriggered, isAnalyzing]);

    useEffect(() => {
        setBlindSpotResponse("");
    }, [activeSpot?.id]);

    useEffect(() => {
        const container = mapContainerRef.current;
        if (!container) return;

        const handleWheel = (e) => {
            e.preventDefault(); // Bloquear el scroll de la página completa
            const scaleChange = e.deltaY * -0.0012;
            const prev = transformRef.current;
            const rect = container.getBoundingClientRect();
            
            const prevScale = prev.scale;
            const newScale = Math.min(Math.max(0.35, prevScale + scaleChange), 4);
            
            // Zoom relative to mouse pointer coordinates
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const canvasX = (mouseX - prev.x) / prevScale;
            const canvasY = (mouseY - prev.y) / prevScale;
            const newX = mouseX - canvasX * newScale;
            const newY = mouseY - canvasY * newScale;
            
            prev.x = newX;
            prev.y = newY;
            prev.scale = newScale;

            updateDOMTransform(newX, newY, newScale);

            if (zoomTimeoutRef.current) clearTimeout(zoomTimeoutRef.current);
            zoomTimeoutRef.current = setTimeout(() => {
                setMapTransform({ x: newX, y: newY, scale: newScale });
            }, 100);
        };

        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => {
            container.removeEventListener('wheel', handleWheel);
        };
    }, [updateDOMTransform, selectedNode]);

    const handleMapMouseDown = (e) => {
        setIsDraggingMap(true);
        lastPointerPos.current = { x: e.clientX, y: e.clientY };
        mapDragged.current = false;
    };

    const handleMapMouseMove = (e) => {
        if (draggingNodeId && mapContainerRef.current) {
            nodeDraggedRef.current = true;
            const rect = mapContainerRef.current.getBoundingClientRect();
            const deltaX = e.clientX - lastPointerPos.current.x;
            const deltaY = e.clientY - lastPointerPos.current.y;
            lastPointerPos.current = { x: e.clientX, y: e.clientY };

            const dx = (deltaX / transformRef.current.scale) / VIRTUAL_WIDTH * 100;
            const dy = (deltaY / transformRef.current.scale) / VIRTUAL_HEIGHT * 100;

            if (!window._dragNodeAcc) window._dragNodeAcc = { dx: 0, dy: 0 };
            window._dragNodeAcc.dx += dx;
            window._dragNodeAcc.dy += dy;

            const el = document.getElementById(`afc-node-${draggingNodeId}`);
            if (el) {
                // Extract base coords from dataset to avoid reading inline styles
                const baseX = parseFloat(el.dataset.basex || 0);
                const baseY = parseFloat(el.dataset.basey || 0);
                el.style.left = `${baseX + window._dragNodeAcc.dx}%`;
                el.style.top = `${baseY + window._dragNodeAcc.dy}%`;
            }
            return;
        }

        if (!isDraggingMap) return;
        const deltaX = e.clientX - lastPointerPos.current.x;
        const deltaY = e.clientY - lastPointerPos.current.y;
        lastPointerPos.current = { x: e.clientX, y: e.clientY };

        if (Math.abs(deltaX) > 6 || Math.abs(deltaY) > 6) {
            mapDragged.current = true;
        }

        const current = transformRef.current;
        current.x += deltaX;
        current.y += deltaY;
        updateDOMTransform(current.x, current.y, current.scale);
    };

    const handleDragEnd = () => {
        setIsDraggingMap(false);
        if (draggingNodeId && nodeDraggedRef.current) {
            const adx = window._dragNodeAcc ? window._dragNodeAcc.dx : 0;
            const ady = window._dragNodeAcc ? window._dragNodeAcc.dy : 0;
            window._dragNodeAcc = { dx: 0, dy: 0 };

            setAfcData(currentAfc => {
                if (currentAfc && currentAfc.nodes) {
                    let updatedNodes = currentAfc.nodes.map(n => 
                         n.id === draggingNodeId ? { ...n, x: n.x + adx, y: n.y + ady } : n
                    );
                    
                    // Si el nodo arrastrado fue un spot activo no existente, lo agregamos (arrastre inicial)
                    if (!updatedNodes.some(n => n.id === draggingNodeId) && activeSpot) {
                         const spotNode = activeSpot.node || { id: `blind_spot_${activeSpot.id}`, type: "cognitive", label: activeSpot.title };
                         if (spotNode.id === draggingNodeId) {
                              updatedNodes = [...updatedNodes, { ...spotNode, x: spotNode.x + adx, y: spotNode.y + ady }];
                         }
                    }

                    const resolvedNodes = resolveCollisions(updatedNodes);
                    const updated = { ...currentAfc, nodes: resolvedNodes };
                    if (user) {
                        setLocalItem(`oasis_afc_real_data_${user}`, JSON.stringify(updated));
                    }
                    return updated;
                }
                return currentAfc;
            });
            nodeDraggedRef.current = false;
        } else if (mapDragged.current) {
            setMapTransform({
                x: transformRef.current.x,
                y: transformRef.current.y,
                scale: transformRef.current.scale
            });
        }
        setDraggingNodeId(null);
        lastTouchDistance.current = null;
    };

    const handleMapMouseUp = () => {
        handleDragEnd();
    };

    const handleMapClick = (e) => {
        // Don't process map clicks when Bucles overlay is active
        if (mapViewTab === 'bucles') return;
        if (mapDragged.current) {
            mapDragged.current = false;
            return;
        }
        if (e.target.closest('.zoom-controls') || e.target.closest('.existential-focus-controls')) return;
        
        // Clear selection, active pattern, exit tour and reset/zoom out to full fit
        setSelectedNode(null);
        setSelectedPatternId(null);
        setTourActiveIndex(null);
        setTimeout(resetMapTransform, 15);
    };

    const handleMapTouchStart = (e) => {
        if (e.touches.length === 1) {
            setIsDraggingMap(true);
            const touch = e.touches[0];
            lastPointerPos.current = { x: touch.clientX, y: touch.clientY };
            mapDragged.current = false;
        } else if (e.touches.length === 2) {
            setIsDraggingMap(false);
            const t1 = e.touches[0];
            const t2 = e.touches[1];
            const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
            lastTouchDistance.current = dist;
        }
    };

    const handleMapTouchMove = (e) => {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            if (draggingNodeId && mapContainerRef.current) {
                nodeDraggedRef.current = true;
                const rect = mapContainerRef.current.getBoundingClientRect();
                const deltaX = touch.clientX - lastPointerPos.current.x;
                const deltaY = touch.clientY - lastPointerPos.current.y;
                lastPointerPos.current = { x: touch.clientX, y: touch.clientY };

                const dx = (deltaX / transformRef.current.scale) / VIRTUAL_WIDTH * 100;
                const dy = (deltaY / transformRef.current.scale) / VIRTUAL_HEIGHT * 100;

                if (!window._dragNodeAcc) window._dragNodeAcc = { dx: 0, dy: 0 };
                window._dragNodeAcc.dx += dx;
                window._dragNodeAcc.dy += dy;

                const el = document.getElementById(`afc-node-${draggingNodeId}`);
                if (el) {
                    const baseX = parseFloat(el.dataset.basex || 0);
                    const baseY = parseFloat(el.dataset.basey || 0);
                    el.style.left = `${baseX + window._dragNodeAcc.dx}%`;
                    el.style.top = `${baseY + window._dragNodeAcc.dy}%`;
                }
            } else if (isDraggingMap) {
                const deltaX = touch.clientX - lastPointerPos.current.x;
                const deltaY = touch.clientY - lastPointerPos.current.y;
                lastPointerPos.current = { x: touch.clientX, y: touch.clientY };

                if (Math.abs(deltaX) > 6 || Math.abs(deltaY) > 6) {
                    mapDragged.current = true;
                }

                const current = transformRef.current;
                current.x += deltaX;
                current.y += deltaY;
                updateDOMTransform(current.x, current.y, current.scale);
            }
        } else if (e.touches.length === 2) {
            const t1 = e.touches[0];
            const t2 = e.touches[1];
            const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

            if (lastTouchDistance.current && mapContainerRef.current) {
                const ratio = dist / lastTouchDistance.current;
                const zoomFactor = (ratio - 1) * 0.5;
                const current = transformRef.current;
                
                // Zoom relative to touch midpoint
                const centerX = (t1.clientX + t2.clientX) / 2;
                const centerY = (t1.clientY + t2.clientY) / 2;
                
                const rect = mapContainerRef.current.getBoundingClientRect();
                const mouseX = centerX - rect.left;
                const mouseY = centerY - rect.top;
                
                const prevScale = current.scale;
                const newScale = Math.min(Math.max(0.35, prevScale + zoomFactor), 4);
                
                const canvasX = (mouseX - current.x) / prevScale;
                const canvasY = (mouseY - current.y) / prevScale;
                
                const newX = mouseX - canvasX * newScale;
                const newY = mouseY - canvasY * newScale;
                
                current.x = newX;
                current.y = newY;
                current.scale = newScale;
                
                updateDOMTransform(newX, newY, newScale);
            }
            lastTouchDistance.current = dist;
            mapDragged.current = true;
        }
    };

    const handleMapTouchEnd = () => {
        handleDragEnd();
    };

    /* Removed old resetMapTransform */

    const reorganizeNodes = (inputNodes = null, isInitial = false) => {
        const isArray = Array.isArray(inputNodes);
        const currentNodes = isArray ? inputNodes : (afcData ? afcData.nodes : null);
        if (!currentNodes || currentNodes.length === 0) return isArray ? inputNodes : [];

        const newNodes = [...currentNodes].map(n => ({ ...n }));

        const getStaggeredSlots = (count, baseX, customYStep, overflowDirection = 0) => {
            if (count <= 0) return [];
            if (count === 1) return [{ x: baseX, y: 50 }];

            const yStep = customYStep || 8; 
            const MAX_ROWS = 5; // Limite vertical antes de desbordar hacia los lados
            
            const slots = [];
            for (let i = 0; i < count; i++) {
                let overflowIndex = 0;
                if (overflowDirection !== 0) {
                    overflowIndex = Math.floor(i / (MAX_ROWS * 2));
                }
                
                const localI = overflowDirection !== 0 ? i % (MAX_ROWS * 2) : i;
                const rowsInThisColumn = overflowDirection !== 0 ? 
                     Math.ceil(Math.min(count - overflowIndex * (MAX_ROWS * 2), MAX_ROWS * 2) / 2) : 
                     Math.ceil(count / 2);
                
                const totalHeight = (rowsInThisColumn - 1) * yStep;
                const startY = 50 - (totalHeight / 2);
                
                const zigZagWidth = 4;
                const localXOffset = (localI % 2 === 0) ? -zigZagWidth : zigZagWidth;
                
                // overflowDirection: -1 empuja hacia la izquierda, 1 empuja hacia la derecha.
                const overflowXOffset = overflowIndex === 0 ? 0 : overflowDirection * 15 * overflowIndex;
                
                const rowIndex = Math.floor(localI / 2);
                slots.push({
                    x: baseX + localXOffset + overflowXOffset,
                    y: startY + (rowIndex * yStep)
                });
            }
            return slots;
        };

        const edges = (afcData && afcData.edges) || [];
        const getBarycenter = (node) => {
            let sumY = 0;
            let count = 0;
            edges.forEach(edge => {
                if (edge.source === node.id) {
                    const targetNode = newNodes.find(xn => xn.id === edge.target);
                    if (targetNode) {
                        sumY += targetNode.y;
                        count++;
                    }
                } else if (edge.target === node.id) {
                    const sourceNode = newNodes.find(xn => xn.id === edge.source);
                    if (sourceNode) {
                        sumY += sourceNode.y;
                        count++;
                    }
                }
            });
            return count > 0 ? sumY / count : node.y;
        };

        // Sugiyama Layered Layout with Staggered Slots and Barycenter Heuristic for all datasets
        const layers = [
            { filter: n => n.type === 'historical', baseX: 15, yStep: 14, overflowDir: -1 },
            { filter: n => n.type === 'cognitive' || n.type === 'motor' || n.type === 'physiological', baseX: 38, yStep: 8, overflowDir: 0 },
            { filter: n => n.type === 'biological' || n.type === 'social', baseX: 61, yStep: 12, overflowDir: 0 },
            { filter: n => n.type === 'consequence', baseX: 85, yStep: 8, overflowDir: 1 }
        ];

        const layerNodes = layers.map(l => newNodes.filter(l.filter));

        // Initialize all nodes to staggered slots in their layers
        // We DO NOT sort alphabetically or by barycenter anymore.
        // This guarantees that the original Array order returned by the AI (which is sorted by relevance)
        // determines the vertical position, placing the most important nodes at the top.
        layerNodes.forEach((nodes, layerIdx) => {
            const layer = layers[layerIdx];
            const slots = getStaggeredSlots(nodes.length, layer.baseX, layer.yStep, layer.overflowDir);
            nodes.forEach((n, idx) => {
                n.x = slots[idx].x;
                n.y = slots[idx].y;
            });
        });

        // Phase 3: Apply the stretching transformation to all nodes to push them outwards
        const scaleX = 1.0;
        const scaleY = 1.0;
        const centerX = 50;
        const centerY = 50;

        newNodes.forEach((n, idx) => {
            n.x = centerX + (n.x - centerX) * scaleX;
            n.y = centerY + (n.y - centerY) * scaleY;

            // Apply a subtle wavy S-curve offset to the columns to give it an organic, hand-placed look
            // curve removed
            // curve removed
        });

        const resolvedNodes = resolveCollisions(newNodes);

        if (!isArray) {
            const updated = { ...afcData, nodes: resolvedNodes };
            setAfcData(updated);
            if (user) {
                setLocalItem(`oasis_afc_real_data_${user}`, JSON.stringify(updated));
            }
            setTimeout(resetMapTransform, 50);
        }

        return resolvedNodes;
    };

    const handleZoom = (amount) => {
        if (!mapContainerRef.current) return;
        const rect = mapContainerRef.current.getBoundingClientRect();
        
        triggerProgrammaticTransition();
        setMapTransform(prev => {
            const prevScale = prev.scale;
            const newScale = Math.min(Math.max(0.35, prevScale + amount), 4);
            
            let newX, newY;
            
            if (selectedNode) {
                // Focus zoom relative to the selected node's position
                const px = rect.width * (selectedNode.x / 100);
                const py = rect.height * (selectedNode.y / 100);
                newX = prev.x + px * (prevScale - newScale);
                newY = prev.y + py * (prevScale - newScale);
            } else {
                // Zoom relative to viewport center
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const canvasX = (centerX - prev.x) / prevScale;
                const canvasY = (centerY - prev.y) / prevScale;
                newX = centerX - canvasX * newScale;
                newY = centerY - canvasY * newScale;
            }

            const nextTransform = { x: newX, y: newY, scale: newScale };
            transformRef.current = nextTransform;
            return nextTransform;
        });
    };

    const renderRawData = () => {
        return (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">

                {/* CONTEXTUAL REPORT GENERATOR */}
                <div className="bg-[#050507] border border-emerald-500/20 rounded-2xl p-6 shadow-[0_0_30px_rgba(16,185,129,0.05)]">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                                <FileText className="w-5 h-5" /> Formulación de Caso Contextual
                            </h3>
                            <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
                                Un informe clínico profesional y estructurado (ACT / Análisis Funcional) redactado por Kio con base en todos tus bucles y respuestas.
                            </p>
                        </div>
                        <button
                            onClick={generateContextualReport}
                            disabled={isGeneratingReport}
                            className="shrink-0 px-4 py-2 bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-widest rounded-lg border border-emerald-500/30 hover:bg-emerald-500/30 transition-all flex items-center gap-2 whitespace-nowrap"
                        >
                            {isGeneratingReport ? (
                                <><Aperture className="w-4 h-4 animate-spin" /> Redactando Informe...</>
                            ) : (
                                <><Sparkles className="w-4 h-4" /> Redactar Informe Contextual</>
                            )}
                        </button>
                    </div>

                    {contextualReportHtml ? (
                        <div className="space-y-4">
                            <div className="bg-white text-black p-8 rounded-xl shadow-inner prose prose-sm max-w-none prose-headings:font-bold prose-h1:text-2xl prose-h1:border-b-2 prose-h1:border-zinc-800 prose-h1:pb-2 prose-h2:text-lg prose-h2:text-emerald-700 prose-h2:border-b prose-h2:border-zinc-300 prose-h2:pb-1 prose-h2:mt-6 prose-p:text-justify prose-table:w-full prose-table:border-collapse prose-th:bg-zinc-100 prose-th:p-2 prose-th:border prose-th:border-zinc-300 prose-td:p-2 prose-td:border prose-td:border-zinc-300"
                                 dangerouslySetInnerHTML={{ __html: contextualReportHtml }} />
                            
                            {/* Chat and Export Tools */}
                            <div className="flex flex-col gap-3 bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                                <div className="flex gap-2">
                                    <input 
                                        type="text"
                                        value={improvementPrompt}
                                        onChange={(e) => setImprovementPrompt(e.target.value)}
                                        placeholder="Ej: Cambia las técnicas a modelo experiencial multimodal..."
                                        className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !isImprovingReport) {
                                                improveContextualReport();
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={improveContextualReport}
                                        disabled={isImprovingReport || !improvementPrompt.trim()}
                                        className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30 hover:bg-emerald-500/30 disabled:opacity-50 transition-colors flex items-center gap-2"
                                    >
                                        {isImprovingReport ? <Aperture className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Mejorar</span>
                                    </button>
                                </div>
                                <div className="flex justify-end mt-2">
                                    <button 
                                        onClick={handleExportDoc}
                                        className="px-4 py-2 bg-indigo-500/20 text-indigo-300 rounded-lg border border-indigo-500/30 hover:bg-indigo-500/30 transition-colors flex items-center gap-2"
                                    >
                                        <Save className="w-4 h-4" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Exportar a Word (.doc)</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10 bg-black/20 rounded-xl border border-white/5 border-dashed">
                            <FileText className="w-8 h-8 text-zinc-600 mb-2" />
                            <span className="text-xs text-zinc-500 uppercase tracking-widest font-mono">No hay informe generado</span>
                        </div>
                    )}
                </div>

                <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-8" />
                
                {/* AUTO-GENERATE BUTTON (Legacy Data) */}
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Datos Clínicos Desglosados</h3>
                    <button
                        onClick={generateDynamicTraits}
                        disabled={isGeneratingDynamicTraits}
                        className="px-4 py-2 bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-widest rounded-lg border border-indigo-500/30 hover:bg-indigo-500/30 transition-all flex items-center gap-2"
                    >
                        {isGeneratingDynamicTraits ? (
                            <><Aperture className="w-4 h-4 animate-spin" /> Analizando Módulos...</>
                        ) : (
                            <><Sparkles className="w-4 h-4" /> Auto-Generar Análisis Profundo</>
                        )}
                    </button>
                </div>

                {/* 2. KPI / METRICS ROW */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                    <div className="bg-zinc-950/40 border border-white/5 rounded-2xl p-5 relative overflow-hidden">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Malestar Cognitivo</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-rose-400">{afcData?.tripleModality?.cognitive || 0}%</span>
                            <span className="text-[10px] text-zinc-400 font-medium">Predominio</span>
                        </div>
                        <details className="mt-2 group">
        <summary className="text-[11px] text-zinc-500 cursor-pointer list-none flex items-center gap-1 hover:text-zinc-300 transition-colors">
            <ChevronDown className="w-3 h-3 group-open:rotate-180 transition-transform" /> Dudas, rumiación y autocrítica...
        </summary>
        <div className="mt-2 text-xs text-zinc-300 leading-relaxed opacity-90 whitespace-pre-wrap pl-1 border-l border-white/10">
            {treatmentPlan?.dynamicTraits?.malestarCognitivo || 'Haz clic en "Auto-Generar Análisis Profundo" para obtener la redacción clínica.'}
        </div>
    </details>
                        <div className="w-full bg-white/5 h-1 rounded-full mt-3 overflow-hidden">
                            <div className="bg-rose-400 h-full rounded-full" style={{ width: `${afcData?.tripleModality?.cognitive || 0}%` }} />
                        </div>
                    </div>

                    <div className="bg-zinc-950/40 border border-white/5 rounded-2xl p-5 relative overflow-hidden">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Malestar Motor</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-indigo-400">{afcData?.tripleModality?.motor || 0}%</span>
                            <span className="text-[10px] text-zinc-400 font-medium">Frecuencia</span>
                        </div>
                        <details className="mt-2 group">
        <summary className="text-[11px] text-zinc-500 cursor-pointer list-none flex items-center gap-1 hover:text-zinc-300 transition-colors">
            <ChevronDown className="w-3 h-3 group-open:rotate-180 transition-transform" /> Evitaciones y conductas de escape...
        </summary>
        <div className="mt-2 text-xs text-zinc-300 leading-relaxed opacity-90 whitespace-pre-wrap pl-1 border-l border-white/10">
            {treatmentPlan?.dynamicTraits?.malestarMotor || 'Haz clic en "Auto-Generar Análisis Profundo" para obtener la redacción clínica.'}
        </div>
    </details>
                        <div className="w-full bg-white/5 h-1 rounded-full mt-3 overflow-hidden">
                            <div className="bg-indigo-400 h-full rounded-full" style={{ width: `${afcData?.tripleModality?.motor || 0}%` }} />
                        </div>
                    </div>

                    <div className="bg-zinc-950/40 border border-white/5 rounded-2xl p-5 relative overflow-hidden">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Malestar Fisiológico</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-emerald-400">{afcData?.tripleModality?.physiological || 0}%</span>
                            <span className="text-[10px] text-zinc-400 font-medium">Activación</span>
                        </div>
                        <details className="mt-2 group">
        <summary className="text-[11px] text-zinc-500 cursor-pointer list-none flex items-center gap-1 hover:text-zinc-300 transition-colors">
            <ChevronDown className="w-3 h-3 group-open:rotate-180 transition-transform" /> Tensión, insomnio y respuesta física...
        </summary>
        <div className="mt-2 text-xs text-zinc-300 leading-relaxed opacity-90 whitespace-pre-wrap pl-1 border-l border-white/10">
            {treatmentPlan?.dynamicTraits?.malestarFisiologico || 'Haz clic en "Auto-Generar Análisis Profundo" para obtener la redacción clínica.'}
        </div>
    </details>
                        <div className="w-full bg-white/5 h-1 rounded-full mt-3 overflow-hidden">
                            <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${afcData?.tripleModality?.physiological || 0}%` }} />
                        </div>
                    </div>

                    <div className="bg-zinc-950/40 border border-white/5 rounded-2xl p-5 relative overflow-hidden">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Rasgo PID-5 Principal</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xl font-black text-violet-400 truncate max-w-full">
                                {pidIndices ? (
                                    Object.entries(pidIndices.raw).sort((a, b) => b[1] - a[1])[0][0].toUpperCase()
                                ) : "N/A"}
                            </span>
                            <span className="text-[9px] text-zinc-400 font-mono">
                                {pidIndices ? `${Math.round(Object.entries(pidIndices.raw).sort((a, b) => b[1] - a[1])[0][1] * 100)}%` : ""}
                            </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-2 font-mono">Dimensión con mayor puntaje.</p>
                        <div className="w-full bg-white/5 h-1 rounded-full mt-3 overflow-hidden">
                            <div className="bg-violet-400 h-full rounded-full" style={{ width: `${pidIndices ? (Object.entries(pidIndices.raw).sort((a, b) => b[1] - a[1])[0][1] * 100) : 0}%` }} />
                        </div>
                    </div>
                </div>



                {/* 2.5 FIRMA DE RESONANCIA */}
                {(() => {
                    const savedTraits = localStorage.getItem(`oasis_public_traits_${user}`);
                    if (!savedTraits) return null;
                    let resonance = null;
                    try {
                        resonance = JSON.parse(savedTraits);
                    } catch(e){}
                    if (!resonance || (!resonance.habitar && !resonance.vinculo && !resonance.busqueda)) return null;

                    return (
                        <div className="mb-6 rounded-2xl bg-zinc-950/40 border border-white/5 overflow-hidden shadow-xl">
                            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-zinc-900/40">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                                    <span className="text-[10px] font-black text-zinc-300 tracking-widest uppercase">Firma de Resonancia Existencial</span>
                                </div>
                            </div>
                            <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className="space-y-1.5 bg-zinc-950/50 p-4 rounded-xl border border-white/5">
                                    <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5"><span className="text-sm">🌍</span> Habitar</span>
                                    <p className="text-xs text-zinc-300 font-sans leading-relaxed italic pr-2">"{resonance.habitar}"</p>
                                </div>
                                <div className="space-y-1.5 bg-zinc-950/50 p-4 rounded-xl border border-white/5">
                                    <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5"><span className="text-sm">🔗</span> Vínculo</span>
                                    <p className="text-xs text-zinc-300 font-sans leading-relaxed italic pr-2">"{resonance.vinculo}"</p>
                                </div>
                                <div className="space-y-1.5 bg-zinc-950/50 p-4 rounded-xl border border-white/5">
                                    <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5"><span className="text-sm">🧭</span> Búsqueda</span>
                                    <p className="text-xs text-zinc-300 font-sans leading-relaxed italic pr-2">"{resonance.busqueda}"</p>
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {/* 3. MAIN DASHBOARD CONTENT */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                    {/* COLUMNA IZQUIERDA (8 columnas): Hipótesis y Desglose */}
                    <div className="xl:col-span-8 space-y-6">

                        {/* CARD 1: Hipótesis de Diagnóstico */}
                        {afcData && afcData.hypotheses && (
                            <div className="bg-zinc-950/40 border border-white/5 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-6 opacity-[0.02] pointer-events-none"><ShieldAlert size={140} /></div>
                                <h2 className="text-sm font-black uppercase tracking-widest text-white/50 mb-5 flex items-center gap-2"><ShieldAlert className="text-rose-400" size={16} /> Hipótesis Clínicas de Diagnóstico</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-rose-500/5 p-5 rounded-2xl border border-rose-500/10 flex flex-col justify-between">
                                        <div>
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-rose-400 mb-3 flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" /> Hipótesis de Mantenimiento
                                            </h3>
                                            <p className="text-xs text-zinc-300 leading-relaxed font-sans">{afcData.hypotheses.mantenimiento || 'Sin datos de mantenimiento.'}</p>
                                        </div>
                                        <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap gap-1.5">
                                            <span className="px-2 py-0.5 rounded bg-rose-500/10 text-[9px] font-mono text-rose-300 uppercase">Ciclo Vicioso</span>
                                            <span className="px-2 py-0.5 rounded bg-rose-500/10 text-[9px] font-mono text-rose-300 uppercase">Evitación</span>
                                        </div>
                                    </div>
                                    <div className="bg-emerald-500/5 p-5 rounded-2xl border border-emerald-500/10 flex flex-col justify-between">
                                        <div>
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-3 flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Hipótesis de Solución
                                            </h3>
                                            <p className="text-xs text-zinc-300 leading-relaxed font-sans">{afcData.hypotheses.solucion || 'Sin datos de solución.'}</p>
                                        </div>
                                        <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap gap-1.5">
                                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-[9px] font-mono text-emerald-300 uppercase">Intervención</span>
                                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-[9px] font-mono text-emerald-300 uppercase">Reencuadre</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* CARD 2: Desglose Clínico */}
                        <div className="bg-zinc-950/40 border border-white/5 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-[0.02] pointer-events-none"><Brain size={140} /></div>
                            <h2 className="text-sm font-black uppercase tracking-widest text-white/50 mb-5 flex items-center gap-2"><Brain className="text-accent" size={16} /> Desglose del Análisis Clínico</h2>

                            {afcData && afcData.is_valid === false ? (
                                <div className="flex flex-col items-center justify-center py-10 text-center">
                                    <ShieldAlert className="text-rose-500 mb-4" size={32} />
                                    <h3 className="text-rose-400 font-medium mb-2">Análisis Clínico Denegado</h3>
                                    <p className="text-xs text-zinc-400 max-w-lg mx-auto leading-relaxed">{afcData.rejection_reason}</p>
                                </div>
                            ) : afcData && afcData.analysis_breakdown ? (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-black/30 p-5 rounded-2xl border border-blue-500/5 hover:border-blue-500/20 transition-all">
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-3 flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-500 rotate-45" /> Evidencia Histórica</h3>
                                            <p className="text-xs text-zinc-300 leading-relaxed font-sans">{afcData.analysis_breakdown.historical_evidence}</p>
                                        </div>
                                        <div className="bg-black/30 p-5 rounded-2xl border border-emerald-500/5 hover:border-emerald-500/20 transition-all">
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-3 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Mediadores Actuales</h3>
                                            <p className="text-xs text-zinc-300 leading-relaxed font-sans">{afcData.analysis_breakdown.mediators_evidence}</p>
                                        </div>
                                        <div className="bg-black/30 p-5 rounded-2xl border border-rose-500/5 hover:border-rose-500/20 transition-all">
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-rose-400 mb-3 flex items-center gap-2"><div className="w-2.5 h-1.5 rounded-sm bg-rose-500" /> Triple Modalidad Conductual</h3>
                                            <p className="text-xs text-zinc-300 leading-relaxed font-sans">{afcData.analysis_breakdown.conducts_evidence}</p>
                                        </div>
                                        <div className="bg-black/30 p-5 rounded-2xl border border-white/5 hover:border-white/20 transition-all">
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-3 flex items-center gap-2"><div className="w-2 h-2 rounded-full border border-dashed border-white/60" /> Consecuencias y Refuerzos</h3>
                                            <p className="text-xs text-zinc-300 leading-relaxed font-sans">{afcData.analysis_breakdown.consequences_evidence}</p>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-10 text-center">
                                    <Activity className="text-zinc-600 mb-4" size={32} />
                                    <h3 className="text-zinc-400 font-medium mb-2">Aún no se ha generado un análisis</h3>
                                </div>
                            )}
                        </div>



                        {isEmbedded && (
                            <div className="bg-zinc-950/40 border border-purple-500/10 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-[80px] rounded-full pointer-events-none" />
                                
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h2 className="text-sm font-black uppercase tracking-widest text-purple-400 mb-1 flex items-center gap-2"><Sparkles size={16} /> Plan de Tratamiento Clínico (IA)</h2>
                                        <p className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">Generación automatizada de intervenciones</p>
                                    </div>
                                    <button
                                        onClick={generateTreatmentPlan}
                                        disabled={isGeneratingTreatmentPlan}
                                        className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg ${
                                            isGeneratingTreatmentPlan 
                                                ? 'bg-purple-900/50 text-purple-300 border border-purple-500/30' 
                                                : 'bg-purple-600/20 hover:bg-purple-500/40 border border-purple-500/30 text-purple-300 hover:text-white hover:scale-105 active:scale-95'
                                        }`}
                                    >
                                        {isGeneratingTreatmentPlan ? (
                                            <><Activity className="w-3.5 h-3.5 animate-spin" /> Procesando Contexto Clínico...</>
                                        ) : (
                                            <><Brain className="w-3.5 h-3.5" /> Generar Plan con IA</>
                                        )}
                                    </button>
                                </div>

                                {treatmentPlan ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="bg-black/30 p-5 rounded-2xl border border-white/5 space-y-2 md:col-span-2 group">
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center justify-between">
                                                Visión Clínica
                                            </h3>
                                            <AutoResizeTextarea
                                                value={formatTreatmentField(treatmentPlan.sessionAnalysis)}
                                                onChange={(e) => handleTreatmentPlanChange('sessionAnalysis', e.target.value)}
                                                className="w-full text-xs text-zinc-300 leading-relaxed font-sans bg-transparent border border-transparent hover:border-white/10 focus:border-emerald-500/50 focus:bg-black/40 rounded-lg p-2 transition-all outline-none"
                                            />
                                        </div>
                                        <div className="bg-black/30 p-5 rounded-2xl border border-white/5 space-y-2 md:col-span-2 group">
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-sky-400">
                                                Preguntas Estratégicas
                                            </h3>
                                            <AutoResizeTextarea
                                                value={formatTreatmentField(treatmentPlan.strategicQuestions)}
                                                onChange={(e) => handleTreatmentPlanChange('strategicQuestions', e.target.value)}
                                                className="w-full text-xs text-zinc-300 leading-relaxed font-sans bg-transparent border border-transparent hover:border-white/10 focus:border-sky-500/50 focus:bg-black/40 rounded-lg p-2 transition-all outline-none"
                                            />
                                        </div>
                                        <div className="bg-black/30 p-5 rounded-2xl border border-white/5 space-y-2 md:col-span-2 group">
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-purple-400">
                                                Objetivos Específicos
                                            </h3>
                                            <AutoResizeTextarea
                                                value={formatTreatmentField(treatmentPlan.specificObjectives)}
                                                onChange={(e) => handleTreatmentPlanChange('specificObjectives', e.target.value)}
                                                className="w-full text-xs text-zinc-300 leading-relaxed font-sans bg-transparent border border-transparent hover:border-white/10 focus:border-purple-500/50 focus:bg-black/40 rounded-lg p-2 transition-all outline-none"
                                            />
                                        </div>
                                        <div className="bg-black/30 p-5 rounded-2xl border border-white/5 space-y-2 group">
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                                                Encadenamiento hacia Atrás
                                            </h3>
                                            <AutoResizeTextarea
                                                value={formatTreatmentField(treatmentPlan.backwardChaining)}
                                                onChange={(e) => handleTreatmentPlanChange('backwardChaining', e.target.value)}
                                                className="w-full text-xs text-zinc-300 leading-relaxed font-sans bg-transparent border border-transparent hover:border-white/10 focus:border-amber-500/50 focus:bg-black/40 rounded-lg p-2 transition-all outline-none"
                                            />
                                        </div>
                                        <div className="bg-black/30 p-5 rounded-2xl border border-white/5 space-y-2 group">
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-rose-400">
                                                Diseño de Exposición
                                            </h3>
                                            <AutoResizeTextarea
                                                value={formatTreatmentField(treatmentPlan.exposureDesign)}
                                                onChange={(e) => handleTreatmentPlanChange('exposureDesign', e.target.value)}
                                                className="w-full text-xs text-zinc-300 leading-relaxed font-sans bg-transparent border border-transparent hover:border-white/10 focus:border-rose-500/50 focus:bg-black/40 rounded-lg p-2 transition-all outline-none"
                                            />
                                        </div>
                                        <div className="bg-black/30 p-5 rounded-2xl border border-white/5 space-y-2 md:col-span-2 group">
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                                                Psicoeducación
                                            </h3>
                                            <AutoResizeTextarea
                                                value={formatTreatmentField(treatmentPlan.psychoeducation)}
                                                onChange={(e) => handleTreatmentPlanChange('psychoeducation', e.target.value)}
                                                className="w-full text-xs text-zinc-300 leading-relaxed font-sans bg-transparent border border-transparent hover:border-white/10 focus:border-indigo-500/50 focus:bg-black/40 rounded-lg p-2 transition-all outline-none"
                                            />
                                        </div>
                                        <div className="bg-black/30 p-5 rounded-2xl border border-white/5 space-y-2 md:col-span-2 group">
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-teal-400">
                                                Ruta de 4 Sesiones
                                            </h3>
                                            <AutoResizeTextarea
                                                value={formatTreatmentField(treatmentPlan.fourSessionRoute)}
                                                onChange={(e) => handleTreatmentPlanChange('fourSessionRoute', e.target.value)}
                                                className="w-full text-xs text-zinc-300 leading-relaxed font-sans bg-transparent border border-transparent hover:border-white/10 focus:border-teal-500/50 focus:bg-black/40 rounded-lg p-2 transition-all outline-none"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-6 border border-dashed border-white/10 rounded-2xl py-12 flex flex-col items-center justify-center text-center">
                                        <Target className="text-zinc-600 mb-3" size={24} />
                                        <p className="text-zinc-400 text-xs max-w-sm">Aún no se ha generado un plan de tratamiento. Presiona el botón de arriba para que la IA lo construya en base al informe actual.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* CARD 3: Transcripciones y Respuestas de Origen */}
                        <div className="bg-zinc-950/40 border border-white/5 rounded-[2rem] p-6 shadow-2xl">
                            <h2 className="text-sm font-black uppercase tracking-widest text-white/50 mb-4 flex items-center gap-2"><FileText size={16} /> Fuentes de Información y Respuestas Crudas</h2>
                            <p className="text-xs text-zinc-500 mb-5 leading-relaxed">Registros originales y respuestas cualitativas recopiladas en las evaluaciones iniciales.</p>

                            <div className="space-y-4">
                                {/* Diagnóstico Existencial Accordion */}
                                <div className="border border-white/5 bg-black/25 rounded-2xl overflow-hidden">
                                    <div className="w-full flex items-center justify-between p-4 bg-zinc-950/20">
                                        <button
                                            onClick={() => setPhenomExpanded(!phenomExpanded)}
                                            className="flex-1 flex items-center justify-between text-left hover:text-white transition-colors focus:outline-none"
                                        >
                                            <span className="text-[10px] font-black uppercase tracking-widest text-sky-400 flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 bg-sky-400 rounded-full" /> Diagnóstico Existencial
                                            </span>
                                            <span className="text-zinc-500 hover:text-white transition-colors">
                                                {phenomExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                            </span>
                                        </button>
                                        {phenomExpanded && isEmbedded && phenomData && !isEditingPhenom && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setTempPhenomData(phenomData);
                                                    setIsEditingPhenom(true);
                                                }}
                                                className="ml-4 px-3 py-1 bg-white/5 border border-white/10 hover:bg-sky-600 hover:border-transparent text-sky-300 hover:text-white rounded-lg font-bold text-[9px] uppercase tracking-wider transition-all"
                                            >
                                                Editar Respuestas
                                            </button>
                                        )}
                                    </div>

                                    {phenomExpanded && (
                                        <div className="p-4 border-t border-white/5 bg-black/40 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                            {isEditingPhenom ? (
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center pb-2 border-b border-white/5">
                                                        <span className="text-[9px] font-mono text-zinc-500 uppercase">Modo Edición Diagnóstico Existencial</span>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    setIsEditingPhenom(false);
                                                                    setTempPhenomData(null);
                                                                }}
                                                                className="px-3 py-1 bg-zinc-900 border border-white/5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg font-black uppercase text-[9px] tracking-wider transition-all"
                                                            >
                                                                Cancelar
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setLocalItem(`oasis_phenom_qualitative_${user}`, JSON.stringify(tempPhenomData));
                                                                    setPhenomData(tempPhenomData);
                                                                    setIsEditingPhenom(false);
                                                                    setTempPhenomData(null);
                                                                }}
                                                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-black uppercase text-[9px] tracking-wider transition-all"
                                                            >
                                                                Guardar
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-3">
                                                        {[
                                                            { key: 'antecedentes_origen', label: 'Antecedentes y Origen (Mecanismo y Origen)' },
                                                            { key: 'experiencia_insuficiencia', label: 'Experiencia Ontológica de Insuficiencia' },
                                                            { key: 'temporalidad_vivida', label: 'Temporalidad Vivida' },
                                                            { key: 'premisa_realidad', label: 'Premisa Ontológica y Relación con la Realidad' }
                                                        ].map((item) => (
                                                            <div key={item.key} className="bg-zinc-950/40 p-3.5 rounded-xl border border-white/5 flex flex-col gap-2">
                                                                <span className="text-[9px] font-medium text-sky-300 leading-tight">{item.label}</span>
                                                                <textarea
                                                                    value={tempPhenomData[item.key] || ''}
                                                                    onChange={(e) => {
                                                                        setTempPhenomData(prev => ({
                                                                            ...prev,
                                                                            [item.key]: e.target.value
                                                                        }));
                                                                    }}
                                                                    placeholder="Ingrese la información aquí..."
                                                                    className="w-full bg-zinc-900/60 border border-white/5 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none focus:border-sky-500/50 transition-all min-h-[80px] resize-y font-sans leading-relaxed"
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : !phenomData ? (
                                                <div className="text-center py-6 space-y-4">
                                                    <p className="text-xs text-zinc-500 font-mono uppercase tracking-wider">Este diagnóstico existencial no ha sido completado por el paciente.</p>
                                                    {isEmbedded && (
                                                        <button
                                                            onClick={() => {
                                                                setTempPhenomData({ antecedentes_origen: "", experiencia_insuficiencia: "", temporalidad_vivida: "", premisa_realidad: "" });
                                                                setIsEditingPhenom(true);
                                                            }}
                                                            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all"
                                                        >
                                                            Rellenar Diagnóstico Manual (Presencial)
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {[
                                                        { key: 'antecedentes_origen', label: 'Antecedentes y Origen (Mecanismo y Origen)' },
                                                        { key: 'experiencia_insuficiencia', label: 'Experiencia Ontológica de Insuficiencia' },
                                                        { key: 'temporalidad_vivida', label: 'Temporalidad Vivida' },
                                                        { key: 'premisa_realidad', label: 'Premisa Ontológica y Relación con la Realidad' }
                                                    ].map((item) => {
                                                        const val = phenomData[item.key] || phenomData[item.label.toLowerCase()];
                                                        if (val === undefined || val === null) return null;
                                                        return (
                                                            <div key={item.key} className="bg-zinc-950/40 p-3.5 rounded-xl border border-white/5">
                                                                <span className="text-[8px] font-mono text-zinc-500 uppercase">{item.label}</span>
                                                                <p className="text-xs text-zinc-300 mt-1 leading-relaxed font-sans">{val}</p>
                                                            </div>
                                                        );
                                                    })}
                                                    {Object.entries(phenomData).map(([k, v]) => {
                                                        if (['antecedentes_origen', 'experiencia_insuficiencia', 'temporalidad_vivida', 'premisa_realidad'].includes(k)) return null;
                                                        return (
                                                            <div key={k} className="bg-zinc-950/40 p-3.5 rounded-xl border border-white/5">
                                                                <span className="text-[8px] font-mono text-zinc-500 uppercase">{k}</span>
                                                                <p className="text-xs text-zinc-300 mt-1 leading-relaxed font-sans">{v}</p>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Historia de Vida Accordion */}
                                <div className="border border-white/5 bg-black/25 rounded-2xl overflow-hidden">
                                    <div className="w-full flex items-center justify-between p-4 bg-zinc-950/20">
                                        <button
                                            onClick={() => setBioExpanded(!bioExpanded)}
                                            className="flex-1 flex items-center justify-between text-left hover:text-white transition-colors focus:outline-none"
                                        >
                                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full" /> Historia de Vida (Entrevista)
                                            </span>
                                            <span className="text-zinc-500 hover:text-white transition-colors">
                                                {bioExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                            </span>
                                        </button>
                                        {bioExpanded && isEmbedded && bioData && !isEditingBio && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setTempBioData(bioData);
                                                    setIsEditingBio(true);
                                                }}
                                                className="ml-4 px-3 py-1 bg-white/5 border border-white/10 hover:bg-indigo-600 hover:border-transparent text-indigo-300 hover:text-white rounded-lg font-bold text-[9px] uppercase tracking-wider transition-all"
                                            >
                                                Editar Respuestas
                                            </button>
                                        )}
                                    </div>

                                    {bioExpanded && (
                                        <div className="p-4 border-t border-white/5 bg-black/40 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                            {isEditingBio ? (
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center pb-2 border-b border-white/5">
                                                        <span className="text-[9px] font-mono text-zinc-500 uppercase">Modo Edición Clínico</span>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    setIsEditingBio(false);
                                                                    setTempBioData(null);
                                                                }}
                                                                className="px-3 py-1 bg-zinc-900 border border-white/5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg font-black uppercase text-[9px] tracking-wider transition-all"
                                                            >
                                                                Cancelar
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setLocalItem(`oasis_bio_transcriptions_${user}`, JSON.stringify(tempBioData));
                                                                    setBioData(tempBioData);
                                                                    setIsEditingBio(false);
                                                                    setTempBioData(null);
                                                                }}
                                                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-black uppercase text-[9px] tracking-wider transition-all"
                                                            >
                                                                Guardar
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 no-scrollbar">
                                                        {BIO_QUESTIONS.map((q, idx) => (
                                                            <div key={idx} className="bg-zinc-950/40 p-3.5 rounded-xl border border-white/5 flex flex-col gap-2">
                                                                <span className="text-[9px] font-medium text-indigo-300 leading-tight">{q.text}</span>
                                                                <textarea
                                                                    value={tempBioData[idx] || ''}
                                                                    onChange={(e) => {
                                                                        setTempBioData(prev => ({
                                                                            ...prev,
                                                                            [idx]: e.target.value
                                                                        }));
                                                                    }}
                                                                    placeholder={q.placeholder || "Ingrese la respuesta aquí..."}
                                                                    className="w-full bg-zinc-900/60 border border-white/5 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500/50 transition-all min-h-[80px] resize-y font-sans leading-relaxed"
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : !bioData ? (
                                                <div className="text-center py-6 space-y-4">
                                                    <p className="text-xs text-zinc-500 font-mono uppercase tracking-wider">Esta entrevista no ha sido completada por el paciente.</p>
                                                    {isEmbedded && (
                                                        <button
                                                            onClick={() => {
                                                                setTempBioData({});
                                                                setIsEditingBio(true);
                                                            }}
                                                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all"
                                                        >
                                                            Rellenar Respuestas Manuales (Presencial)
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {isEmbedded && (
                                                        <div className="flex justify-end mb-2">
                                                            <button
                                                                onClick={generateBioStrategicQuestions}
                                                                disabled={isGeneratingBioQuestions}
                                                                className={`px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-300 rounded-xl font-bold uppercase text-[9px] tracking-widest transition-all flex items-center gap-2 ${isGeneratingBioQuestions ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                            >
                                                                {isGeneratingBioQuestions ? (
                                                                    <><div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" /> Analizando Respuestas...</>
                                                                ) : (
                                                                    <><Sparkles size={12} /> Generar Exploración Estratégica</>
                                                                )}
                                                            </button>
                                                        </div>
                                                    )}
                                                    {BIO_QUESTIONS.map((q, idx) => {
                                                        if (!bioData[idx]) return null;
                                                        return (
                                                            <div key={idx} className="bg-zinc-950/40 p-3.5 rounded-xl border border-white/5 space-y-3">
                                                                <div>
                                                                    <span className="text-[9px] font-medium text-indigo-300 mb-1 block leading-tight">{q.text}</span>
                                                                    <p className="text-xs text-zinc-300 leading-relaxed font-sans">{bioData[idx]}</p>
                                                                </div>
                                                                
                                                                {/* Strategic Questions */}
                                                                {bioStrategicQuestions && bioStrategicQuestions[idx] && (
                                                                    <div className="mt-3 pt-3 border-t border-indigo-500/20 bg-indigo-950/10 rounded-lg p-3">
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            <Focus className="w-3.5 h-3.5 text-indigo-400" />
                                                                            <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Preguntas Estratégicas Generadas</span>
                                                                        </div>
                                                                        <ul className="space-y-2">
                                                                            {Array.isArray(bioStrategicQuestions[idx]) && bioStrategicQuestions[idx].map((question, qIdx) => (
                                                                                <li key={qIdx} className="text-[11px] text-indigo-200/90 font-serif italic leading-relaxed flex items-start gap-2">
                                                                                    <span className="text-indigo-500 mt-0.5">â€¢</span>
                                                                                    <span>{question}</span>
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Eslabones Integrados (Puntos Ciegos Resueltos) Accordion */}
                                <div className="border border-white/5 bg-black/25 rounded-2xl overflow-hidden">
                                    <button
                                        onClick={() => setBlindSpotsExpanded(!blindSpotsExpanded)}
                                        className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors focus:outline-none"
                                    >
                                        <span className="text-[10px] font-black uppercase tracking-widest text-sky-400 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 bg-sky-400 rounded-full" /> Eslabones Integrados (Puntos Ciegos)
                                        </span>
                                        <span className="text-zinc-500 hover:text-white transition-colors flex items-center gap-2">
                                            {resolvedBlindSpots.length > 0 && (
                                                <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 text-[8px] font-bold">
                                                    {resolvedBlindSpots.length}
                                                </span>
                                            )}
                                            {blindSpotsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                        </span>
                                    </button>

                                    {blindSpotsExpanded && (
                                        <div className="p-4 border-t border-white/5 bg-black/40 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                            {resolvedBlindSpots.length === 0 ? (
                                                <p className="text-xs text-zinc-600 font-mono uppercase tracking-wider text-center py-4">Ningún eslabón integrado aún.</p>
                                            ) : (
                                                <div className="space-y-3">
                                                    {resolvedBlindSpots.map((spot) => (
                                                        <div key={spot.id} className="bg-zinc-950/40 p-3.5 rounded-xl border border-white/5 space-y-2">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[9px] font-bold text-sky-400 uppercase tracking-wider">{spot.title}</span>
                                                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase tracking-widest">Integrado</span>
                                                            </div>
                                                            <div className="bg-black/30 p-2.5 rounded-lg border border-white/5">
                                                                <span className="text-[8px] font-mono text-zinc-500 uppercase block mb-1">Pregunta Clínica</span>
                                                                <p className="text-xs text-zinc-400 leading-relaxed font-sans italic">"{spot.question}"</p>
                                                            </div>
                                                            <div className="bg-sky-950/10 p-2.5 rounded-lg border border-sky-500/10">
                                                                <span className="text-[8px] font-mono text-sky-500 uppercase block mb-1">Respuesta del Paciente</span>
                                                                <p className="text-xs text-zinc-200 leading-relaxed font-sans">{spot.answer}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Observaciones Clínicas del Profesional Accordion */}
                                <div className="border border-white/5 bg-black/25 rounded-2xl overflow-hidden">
                                    <button
                                        onClick={() => setClinicalNotesExpanded(!clinicalNotesExpanded)}
                                        className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors focus:outline-none"
                                    >
                                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" /> Observaciones Clínicas del Profesional
                                        </span>
                                        <span className="text-zinc-500 hover:text-white transition-colors">
                                            {clinicalNotesExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                        </span>
                                    </button>
                                    {clinicalNotesExpanded && (
                                        <div className="p-4 border-t border-white/5 bg-black/40 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <ClinicalTracker user={user} treatmentPlan={treatmentPlan} />
                                        </div>
                                    )}
                                </div>

                                {/* Extras (Notas Adicionales del Paciente) Accordion */}
                                <div className="border border-white/5 bg-black/25 rounded-2xl overflow-hidden mt-3">
                                    <button
                                        onClick={() => setExtrasExpanded(!extrasExpanded)}
                                        className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors focus:outline-none"
                                    >
                                        <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 bg-orange-400 rounded-full" /> Extras (Notas Específicas del Paciente)
                                        </span>
                                        <span className="text-zinc-500 hover:text-white transition-colors">
                                            {extrasExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                        </span>
                                    </button>
                                    {extrasExpanded && (
                                        <div className="p-4 border-t border-white/5 bg-black/40 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <AutoResizeTextarea
                                                value={treatmentPlan?.patientExtras || ''}
                                                onChange={(e) => handleTreatmentPlanChange('patientExtras', e.target.value)}
                                                className="w-full bg-zinc-900/50 text-zinc-300 text-xs p-4 rounded-xl border border-white/10 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 outline-none transition-all placeholder:text-zinc-700 font-sans"
                                                placeholder="Escribe aquí notas adicionales o detalles específicos que mencionó el paciente más allá de la entrevista general..."
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* KIO PERSONA CONFIGURATOR */}
                                <div className="mt-6 border border-cyan-500/20 bg-cyan-950/20 rounded-[2rem] overflow-hidden shadow-2xl relative group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    <div className="p-6 relative z-10">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                            <div>
                                                <h2 className="text-sm font-black uppercase tracking-widest text-cyan-400 flex items-center gap-2">
                                                    <Sparkles size={16} className="animate-pulse" /> Personalidad de Kio (IA)
                                                </h2>
                                                <p className="text-xs text-cyan-100/60 mt-1">
                                                    Define las directrices de intervención y memoria base que regirán cómo Kio interactúa con este individuo.
                                                </p>
                                            </div>
                                            <button
                                                onClick={generateKioDirectives}
                                                disabled={isGeneratingKio}
                                                className="bg-cyan-500 hover:bg-cyan-400 text-black font-black text-[10px] uppercase tracking-widest py-2 px-5 rounded-full transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] disabled:opacity-50"
                                            >
                                                {isGeneratingKio ? (
                                                    <><div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" /> Analizando...</>
                                                ) : (
                                                    <><Sparkles size={12} /> Auto-Generar con IA</>
                                                )}
                                            </button>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-black/40 p-5 rounded-2xl border border-cyan-500/10 space-y-2">
                                                <h3 className="text-[10px] font-black uppercase tracking-widest text-cyan-500">
                                                    Directrices de Intervención (Filtros)
                                                </h3>
                                                <AutoResizeTextarea
                                                    value={formatTreatmentField(treatmentPlan?.kioDirectives || '')}
                                                    onChange={(e) => handleTreatmentPlanChange('kioDirectives', e.target.value)}
                                                    className="w-full text-xs text-cyan-50 leading-relaxed font-sans bg-transparent border border-transparent hover:border-cyan-500/30 focus:border-cyan-400/60 focus:bg-cyan-950/40 rounded-lg p-2 transition-all outline-none"
                                                    placeholder="Ej: Si detecta malestar cognitivo, no preguntar '¿Qué pasó?', sino '¿Esto que sientes nace de lo que tú quieres o de lo que crees que el otro piensa?'"
                                                />
                                            </div>
                                            <div className="bg-black/40 p-5 rounded-2xl border border-cyan-500/10 space-y-3 flex flex-col max-h-[300px]">
                                                <h3 className="text-[10px] font-black uppercase tracking-widest text-cyan-500 flex items-center gap-2">
                                                    <Target size={12} /> Memoria Activa de Kio
                                                </h3>
                                                <p className="text-[10px] text-cyan-100/50 leading-relaxed">
                                                    Hechos destilados que Kio recuerda actualmente en sus conversaciones con el individuo.
                                                </p>
                                                <div className="flex-1 overflow-y-auto pr-2 space-y-2 no-scrollbar">
                                                    {kioMemory.length === 0 ? (
                                                        <p className="text-[10px] text-cyan-500/50 font-mono text-center py-4 uppercase">Sin memoria registrada</p>
                                                    ) : (
                                                        [...kioMemory].sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0)).map((fact, idx) => (
                                                            <div key={idx} className={`p-3 rounded-xl border ${fact.isPinned ? 'bg-cyan-950/40 border-cyan-500/30' : 'bg-black/20 border-white/5'}`}>
                                                                <div className="flex items-center gap-2 mb-1.5">
                                                                    <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${fact.isPinned ? 'bg-cyan-500 text-black' : 'bg-white/10 text-zinc-400'}`}>
                                                                        {fact.isPinned ? 'PINNED' : (fact.category || 'General')}
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs text-zinc-300 leading-relaxed font-serif italic">{fact.text}</p>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* COLUMNA DERECHA (4 columnas): Rasgos PID-5 y Focos de Regulación */}
                    <div className="xl:col-span-4 space-y-6 animate-in fade-in duration-500">
                        {/* PID-5 Card */}
                        <div className="bg-zinc-950/40 border border-white/5 rounded-[2rem] p-6 shadow-2xl flex flex-col">
                            <h2 className="text-sm font-black uppercase tracking-widest text-white/50 mb-5 flex items-center gap-2"><Target size={16} /> Rasgos PID-5 (Perfil)</h2>

                            {!pidIndices ? (
                                <div className="flex-1 flex items-center justify-center text-center p-8 border border-white/5 rounded-2xl bg-black/40">
                                    <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-mono">Inventario Pendiente</p>
                                </div>
                            ) : (
                                <div className="flex-1 space-y-4">
                                    {[
                                        { id: 'reactividad', label: 'Reactividad' },
                                        { id: 'conexion', label: 'Conexión' },
                                        { id: 'asertividad', label: 'Asertividad' },
                                        { id: 'ritmo', label: 'Ritmo' },
                                        { id: 'singularidad', label: 'Singularidad' }
                                    ].map(dom => {
                                        const score = pidIndices.raw[dom.id];
                                        const status = pidIndices.status[dom.id];
                                        return (
                                            <div key={dom.id} className="relative bg-black/20 border border-white/[0.02] p-3 rounded-xl">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">{dom.label}</span>
                                                    <div className="flex items-center gap-2 pointer-events-auto">
                                                        <span className="text-[8px] px-1.5 py-0.5 rounded bg-white/5 text-zinc-400 font-mono">{status.label}</span>
                                                        <span className={`text-[10px] font-mono font-bold ${status.color.split(' ')[0]}`}>{Math.round(score * 100)}%</span>
                                                    </div>
                                                </div>
                                                <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden mt-1.5">
                                                    <div className={`h-full ${status.fill} rounded-full transition-all duration-500`} style={{ width: `${score * 100}%` }} />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Focos Existenciales / Regulación Clínico List Card */}
                        <div className="bg-zinc-950/40 border border-white/5 rounded-[2rem] p-6 shadow-2xl flex flex-col">
                            <h2 className="text-sm font-black uppercase tracking-widest text-white/50 mb-4 flex items-center gap-2"><Sparkles size={16} className="text-indigo-400" /> Focos de Regulación Existencial</h2>
                            <p className="text-[11px] text-zinc-500 mb-4">Metas y prioridades clínicas derivadas del análisis conductual integrado:</p>

                            <div className="space-y-3 font-sans">
                                <div className="flex items-start gap-3 p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl hover:bg-indigo-500/10 transition-colors">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                                    <div className="text-xs">
                                        <p className="font-bold text-indigo-300">Modificación de la Evitación</p>
                                        <p className="text-zinc-400 text-[10px] mt-0.5">Interrumpir las respuestas motoras de escape (ej. procrastinación, aislamiento).</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl hover:bg-rose-500/10 transition-colors">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                                    <div className="text-xs">
                                        <p className="font-bold text-rose-300">Flexibilización del Autocontrol</p>
                                        <p className="text-zinc-400 text-[10px] mt-0.5">Disminuir el diálogo autocrítico excesivo y esquemas rígidos de insuficiencia.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl hover:bg-emerald-500/10 transition-colors">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                                    <div className="text-xs">
                                        <p className="font-bold text-emerald-300">Resignificación de Dinámicas</p>
                                        <p className="text-zinc-400 text-[10px] mt-0.5">Reencuadrar la historia biográfica de invalidación temprana en una narrativa resiliente.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // --- SESSIONS & TREATMENT PLAN LOGIC ---
    const generateTreatmentPlan = async () => {
        if (!user) return;
        setIsGeneratingTreatmentPlan(true);

        try {
            let activeKey = atob('c2stZmI3N2RiMTIyNjM4NDdjOGI1N2E0ODI5Nzk3NmM4NzU=');
            const endpoint = localStorage.getItem('oasis_deepseek_endpoint') || 'https://api.deepseek.com/chat/completions';
            const model = localStorage.getItem('oasis_deepseek_model') || 'deepseek-chat';

            const prompt = `
Eres un psicoterapeuta avanzado estructurando un Plan de Tratamiento Clínico.
Con base en TODO EL INFORME PSICOLÓGICO del paciente, genera una visión clínica completa.

Información extraída:
- Respuestas Fenomenológicas: ${JSON.stringify(phenomData || {})}
- Entrevista Biográfica: ${JSON.stringify(bioData || [])}
- Sesiones Registradas: []

Genera un JSON con los siguientes campos:
1. "sessionAnalysis": Interpretación clínica general y de evidencias observadas.
2. "strategicQuestions": Preguntas estratégicas para corroboración y redirección de significado.
3. "specificObjectives": Objetivos específicos y medibles para reducir frecuencia e intensidad de conductas meta.
4. "backwardChaining": Encadenamiento hacia atrás (pasos incrementales desde la meta).
5. "exposureDesign": Diseño de jerarquía de exposición y procesos de adaptación.
6. "psychoeducation": Conceptos y analogías psicoeducativas para explicar al paciente y estructurar su autoconocimiento.
7. "fourSessionRoute": Ruta guiada y detallada de 4 sesiones de terapia, marcando los procesos clínicos, metas y exploraciones recomendadas para cada sesión.

Devuelve estrictamente el JSON sin formato extra.
            `;

            const res = await fetch(`${API_URL}/api/oasis/config/chat-completion`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    endpoint: endpoint,
                    key: activeKey,
                    payload: {
                        model: model,
                        messages: [
                            { role: 'system', content: "Genera el plan de tratamiento en JSON." },
                            { role: 'user', content: prompt }
                        ],
                        response_format: { type: "json_object" },
                        temperature: 0.4
                    }
                })
            });

            if (!res.ok) throw new Error("Error generando el plan de tratamiento.");
            const data = await res.json();
            let cleanContent = data.choices[0].message.content.trim();
            if (cleanContent.startsWith("```")) {
                cleanContent = cleanContent.replace(/^```[a-zA-Z]*\s*/, "").replace(/\s*```$/, "");
            }
            
            const parsed = JSON.parse(cleanContent);
            setTreatmentPlan(parsed);
            setLocalItem(`oasis_treatment_plan_${user}`, JSON.stringify(parsed));
            
        } catch (err) {
            console.error(err);
            alert("Ocurrió un error al generar el plan de tratamiento con IA.");
        } finally {
            setIsGeneratingTreatmentPlan(false);
        }
    };

    if (!isMounted) {
        return (
            <div className="w-full h-full bg-[#050506] flex flex-col items-center justify-center pointer-events-none transition-opacity duration-1000">
                <div className="w-8 h-8 border-2 border-white/5 border-t-accent rounded-full animate-spin opacity-50" />
            </div>
        );
    }

    return (
        <div className={isEmbedded
            ? "relative w-full h-full font-sans text-zinc-100 flex flex-col"
            : "fixed inset-0 z-[100] bg-transparent overflow-hidden font-sans text-zinc-100 animate-in fade-in duration-700 flex flex-col pointer-events-none"
        }>
            {/* Background Effects */}
            {!isEmbedded && (
                <div className="fixed inset-0 pointer-events-none z-0">
                    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-accent/5 blur-[150px] rounded-full mix-blend-screen transform translate-x-1/3 -translate-y-1/3" style={{ backgroundColor: accent }} />
                    <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-500/5 blur-[150px] rounded-full mix-blend-screen transform -translate-x-1/3 translate-y-1/3" />
                    <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
                </div>
            )}

            {/* Floating Close Button */}
            {!isEmbedded && onClose && (
                <button
                    onClick={onClose}
                    className="hidden md:flex fixed top-[80px] md:top-6 right-4 md:right-8 z-[2001] w-9 h-9 md:w-11 md:h-11 rounded-full bg-zinc-950/80 border border-white/10 hover:bg-zinc-900 hover:border-white/20 transition-all items-center justify-center text-zinc-400 hover:text-white active:scale-95 shadow-lg sm:backdrop-blur-md"
                    title="Volver al lienzo"
                >
                    <X size={16} />
                </button>
            )}


            {/* Content Container */}
            <div className={isEmbedded
                ? "relative z-10 w-full pb-2 flex-1 flex flex-col"
                : "relative z-10 w-full h-full flex-1 flex flex-col pointer-events-none"
            }>



                {isAnalyzing ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500 bg-zinc-950/40 border border-white/5 rounded-[2rem] p-12 shadow-2xl">
                        <Activity className="animate-spin mb-6" size={48} style={{ color: accent }} />
                        <h2 className="text-2xl font-light text-white mb-3">{typeof isAnalyzing === "string" ? isAnalyzing : "Construyendo tu Mapa Conductual"}</h2>
                        <p className="text-sm text-zinc-400 max-w-md mx-auto leading-relaxed mb-6">
                            Nuestra IA está analizando de forma segura tus respuestas en el Diagnóstico Existencial y la Historia de Vida para formular tus hipótesis clínicas y estructurar el mapa de bucles.
                        </p>
                        <div className="bg-[#18181b] border border-orange-500/30 rounded-xl p-4 max-w-md w-full flex items-start gap-3 text-left">
                            <ShieldAlert className="text-orange-400 shrink-0 mt-0.5" size={18} />
                            <div>
                                <h4 className="text-orange-400 font-bold text-xs uppercase tracking-wider mb-1">Análisis de Nivel Experto</h4>
                                <p className="text-[11px] text-zinc-400">
                                    Este proceso requiere un alto poder de cómputo y puede demorar entre <strong className="text-zinc-200">60 y 90 segundos</strong>. Por favor, <strong className="text-white">no cierres esta pestaña ni recargues la página</strong> mientras el clínico virtual estructura tu red conductual.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : viewMode === 'raw_data' ? renderRawData() : (
                    <div className="absolute inset-0 w-full h-full animate-in slide-in-from-bottom-8 duration-700 delay-200 fill-mode-both pointer-events-none">

                        {/* MÓDULO 1: LIENZO INTERACTIVO DEL AFC (100% width on top) */}
                        <div className="absolute inset-0 z-0 flex flex-col w-full h-full pointer-events-auto">
                            <div className="absolute top-[80px] md:top-6 left-4 md:left-6 z-[120] hidden md:flex items-center gap-2 pointer-events-none">
                                    <h2 className="text-sm font-bold text-white flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md shadow-lg">
                                        <Target size={16} className="text-emerald-400" /> Mapa de Bucles
                                        {afcData?.is_mock && <span className="ml-1 px-1.5 py-0.5 rounded bg-zinc-800 text-[9px] uppercase font-bold text-zinc-400 border border-zinc-700">Plantilla</span>}
                                    </h2>
                                </div>
                                <div className={`absolute bottom-[150px] md:bottom-6 left-3 md:left-6 z-[120] flex-col items-center gap-1.5 pointer-events-auto p-1 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md shadow-lg ${selectedNode ? 'hidden md:flex' : 'flex'}`}>


                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => generateAFCAnalysis(false)}
                                            className="p-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white transition-all flex items-center justify-center active:scale-95 shadow-lg shadow-emerald-950/20"
                                            title="Generar Análisis Clínico"
                                        >
                                            <Sparkles size={11} />
                                        </button>
                                        <button
                                            onClick={() => reorganizeNodes()}
                                            className="p-1.5 rounded-lg bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all flex items-center justify-center active:scale-95"
                                            title="Reorganizar nodos del grafo"
                                        >
                                            <Network size={11} className="text-emerald-400" />
                                        </button>
                                        <button
                                            onClick={startTour}
                                            className="p-1.5 rounded-lg bg-indigo-600/90 hover:bg-indigo-500 text-white transition-all flex items-center justify-center active:scale-95"
                                            title="Iniciar recorrido clínico guiado"
                                        >
                                            <Compass size={11} />
                                        </button>
                                        {isEmbedded && (
                                            <button
                                                onClick={() => setViewMode(viewMode === 'dashboard' ? 'raw_data' : 'dashboard')}
                                                className="p-1.5 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors text-zinc-400 hover:text-white flex items-center justify-center active:scale-95"
                                                title={viewMode === 'dashboard' ? 'Ver informe completo escrito' : 'Ver mapa interactivo de bucles'}
                                            >
                                                <FileText size={11} />
                                            </button>
                                        )}
                                        {isEmbedded && (
                                            <>
                                                <button
                                                    onClick={() => importFileInputRef.current?.click()}
                                                    className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/30 transition-colors text-emerald-400 hover:text-white flex items-center justify-center active:scale-95"
                                                    title="Importar Informe Clínico (.doc)"
                                                >
                                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                                </button>
                                                <input 
                                                    type="file" 
                                                    accept=".doc,.html" 
                                                    ref={importFileInputRef} 
                                                    onChange={handleImportDoc} 
                                                    style={{ display: 'none' }} 
                                                />
                                                <button
                                                    onClick={handleExportDoc}
                                                    className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/30 transition-colors text-indigo-400 hover:text-white flex items-center justify-center active:scale-95"
                                                    title="Exportar Informe Clínico a Documento Word"
                                                >
                                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                            
                            {/* Segmented Control Tabs (Bottom NavBar) */}
                            <div className="absolute bottom-[95px] md:bottom-6 left-1/2 transform -translate-x-1/2 z-[200] flex bg-black/60 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 w-max max-w-[95vw] gap-2 shadow-2xl pointer-events-auto overflow-x-auto no-scrollbar scale-90 md:scale-100 origin-bottom">
                                <button onClick={() => setMapViewTab('map')} title="El Mapa" className={`p-3 shrink-0 rounded-xl transition-all flex items-center justify-center ${mapViewTab === 'map' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}><Network size={18} /></button>
                                <button onClick={() => setMapViewTab('avances')} title="Avances" className={`p-3 shrink-0 rounded-xl transition-all flex items-center justify-center ${mapViewTab === 'avances' ? 'bg-blue-600 text-white shadow-md' : 'text-zinc-500 hover:text-blue-400'}`}><MessageSquare size={18} /></button>
                                <button onClick={() => setMapViewTab('bucles')} title="Bucles" className={`p-3 shrink-0 rounded-xl transition-all flex items-center justify-center ${mapViewTab === 'bucles' ? 'bg-purple-600 text-white shadow-md' : 'text-zinc-500 hover:text-purple-400'}`}><Compass size={18} /></button>
                                <button onClick={() => setMapViewTab('loop')} title="Diagnóstico" className={`p-3 shrink-0 rounded-xl transition-all flex items-center justify-center ${mapViewTab === 'loop' ? 'bg-emerald-600 text-white shadow-md' : 'text-zinc-500 hover:text-emerald-400'}`}><Activity size={18} /></button>
                                <button onClick={() => setMapViewTab('exit_keys')} title="Claves" className={`p-3 shrink-0 rounded-xl transition-all flex items-center justify-center ${mapViewTab === 'exit_keys' ? 'bg-orange-600 text-white shadow-md' : 'text-zinc-500 hover:text-orange-400'}`}><Sparkles size={18} /></button>
                            </div>
    <div
                                ref={mapContainerRef}
                                className={`absolute inset-0 z-0 bg-transparent overflow-hidden group select-none transition-all duration-200 ease-in-out ${mapViewTab === 'bucles' ? 'pointer-events-none' : 'pointer-events-auto'} ${isDraggingMap ? 'cursor-grabbing' : (draggingNodeId ? 'cursor-grabbing' : 'cursor-grab')}`}
                                onClick={handleMapClick}
                                onMouseDown={handleMapMouseDown}
                                onMouseMove={handleMapMouseMove}
                                onMouseUp={handleMapMouseUp}
                                onMouseLeave={handleMapMouseUp}
                                onTouchStart={handleMapTouchStart}
                                onTouchMove={handleMapTouchMove}
                                onTouchEnd={handleMapTouchEnd}
                                onTouchCancel={handleMapTouchEnd}
                                onDragStart={(e) => e.preventDefault()}
                                style={{ touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none', WebkitUserDrag: 'none' }}
                            >
                                {/* Decoración de fondo del lienzo (fija) */}
                                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />



                                {(afcData?.is_mock || afcData?.is_valid === false) && (
                                    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none animate-in fade-in duration-500">
                                        <p className="text-sm font-mono text-zinc-500 uppercase tracking-widest px-6 py-3 rounded-xl bg-black/80 sm:bg-black/40 border border-white/5 sm:backdrop-blur-md">
                                            {afcData?.is_valid === false ? "No hay información suficiente" : "Aún no hay datos"}
                                        </p>
                                    </div>
                                )}



                                {/* Zoom Controls Overlay - Compact Glass Toolbar */}
                                {mapViewTab === 'map' && (
                                    <div 
                                        className={`zoom-controls absolute bottom-[150px] md:bottom-2.5 right-3 md:right-2.5 z-[60] flex-row items-center gap-0.5 bg-zinc-950/85 border border-white/10 sm:backdrop-blur-md p-0.5 rounded-xl shadow-2xl transition-all duration-300 ${selectedNode ? 'hidden md:flex' : 'flex'}`}
                                        onClick={e => e.stopPropagation()}
                                        onMouseDown={e => e.stopPropagation()}
                                    >
                                        <button onClick={reorganizeNodes} className="w-6 h-6 bg-emerald-950/60 border border-emerald-500/30 rounded-lg flex items-center justify-center text-emerald-400 hover:text-emerald-300 hover:bg-emerald-800/80 transition-all" title="Reorganizar Grafo"><Network size={11} /></button>
                                        <button onClick={() => handleZoom(0.2)} className="w-6 h-6 bg-zinc-900/80 border border-white/5 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors" title="Acercar"><ZoomIn size={12} /></button>
                                        <button onClick={() => handleZoom(-0.2)} className="w-6 h-6 bg-zinc-900/80 border border-white/5 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors" title="Alejar"><ZoomOut size={12} /></button>
                                        <button onClick={resetMapTransform} className="w-6 h-6 bg-zinc-900/80 border border-white/5 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors" title="Centrar Mapa"><Maximize2 size={11} /></button>
                                    </div>
                                )}

                                {/* Transform Container (Pan/Zoom applies here) */}
                                <div
                                    ref={transformContainerRef}
                                    className={`absolute top-0 left-0 origin-top-left ${isInitialZoom ? 'transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)]' : isProgrammaticTransition ? 'transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]' : 'transition-none duration-0'}`}
                                    style={{ width: `${VIRTUAL_WIDTH}px`, height: `${VIRTUAL_HEIGHT}px`, transform: `translate(${mapTransform.x}px, ${mapTransform.y}px) scale(${mapTransform.scale})`, willChange: 'transform' }}
                                >
                                    {/* SVG Edges */}
                                    
                                    {/* --- INJECTION FOR MINI NODES --- */}
                                    {(() => {
                                        let finalNodesToRender = [...(nodesToRender || [])];
                                        let finalEdgesToRender = [...(edgesToRender || [])];
                                        const activeChatNode = (mapViewTab === 'map' && tourActiveIndex !== null && sortedTourNodes[tourActiveIndex]) ? sortedTourNodes[tourActiveIndex] : null;
                                        
                                        const threadLabels = ['Historia', 'Relaciones', 'Cuerpo', 'Valores', 'Conductas', 'Experimentos', 'Integración'];
                                        const initialNodes = [...finalNodesToRender];
                                        initialNodes.forEach(node => {
                                            if (node.type === 'mini_chat') return;
                                            
                                            // Render all history for all nodes to show a permanent galaxy of context
                                            for (let t = 0; t < 7; t++) {
                                                const currentChat = getSafeCurrentChat(node.id, t);
                                                if (currentChat && currentChat.length > 0) {
                                                    currentChat.forEach((msg, idx) => {
                                                        const miniNodeId = `mini_node_${node.id}_${t}_${idx}`;
                                                        // Constellation orbit
                                                        const radius = 120 + (idx * 15);
                                                        const angle = (idx * Math.PI * 2 / 5) + (t * Math.PI / 3);
                                                        const x = node.x + Math.cos(angle) * radius;
                                                        const y = node.y + Math.sin(angle) * radius;
                                                        const roleLabel = msg.role === 'user' ? ' (Tú)' : ' (IA)';
                                                        
                                                        finalNodesToRender.push({
                                                            id: miniNodeId,
                                                            type: 'mini_chat',
                                                            role: msg.role,
                                                            label: `${threadLabels[t]}${roleLabel}`,
                                                            x, y
                                                        });
                                                        
                                                        finalEdgesToRender.push({
                                                            source: idx === 0 ? node.id : `mini_node_${node.id}_${t}_${idx - 1}`,
                                                            target: miniNodeId,
                                                            type: 'mini_chat_link',
                                                            weight: 1.0
                                                        });
                                                    });
                                                }
                                            }
                                        });

                                        
    const hasAnsweredAllPerspectives = (nodeId) => {
        if (!nodeChats || !nodeChats[nodeId]) return false;
        for (let i = 0; i < 6; i++) {
            const chat = nodeChats[nodeId][i] || [];
            if (!chat.some(msg => msg.role === 'user')) return false;
        }
        return true;
    };

    return (
        <React.Fragment>
                                                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible">

                                        <style>{`
                                                    .edge-flow-active {
                                                        stroke-dasharray: 0.6, 0.4;
                                                    }
                                                `}</style>
                                        <defs>
                                            <marker id="arrowhead-default" markerWidth="0.8" markerHeight="0.6" refX="0.7" refY="0.3" orient="auto">
                                                <polygon points="0 0, 0.8 0.3, 0 0.6" fill="rgba(255,255,255,0.25)" />
                                            </marker>
                                            <marker id="arrowhead-incoming" markerWidth="0.8" markerHeight="0.6" refX="0.7" refY="0.3" orient="auto">
                                                <polygon points="0 0, 0.8 0.3, 0 0.6" fill="#818cf8" />
                                            </marker>
                                            <marker id="arrowhead-outgoing" markerWidth="0.8" markerHeight="0.6" refX="0.7" refY="0.3" orient="auto">
                                                <polygon points="0 0, 0.8 0.3, 0 0.6" fill="#fb7185" />
                                            </marker>
                                            <marker id="arrowhead-both" markerWidth="0.8" markerHeight="0.6" refX="0.7" refY="0.3" orient="auto">
                                                <polygon points="0 0, 0.8 0.3, 0 0.6" fill="#a78bfa" />
                                            </marker>
                                            <marker id="arrowhead-blindspot" markerWidth="0.8" markerHeight="0.6" refX="0.7" refY="0.3" orient="auto">
                                                <polygon points="0 0, 0.8 0.3, 0 0.6" fill="#38bdf8" />
                                            </marker>
                                            <marker id="arrowhead-feedback" markerWidth="0.8" markerHeight="0.6" refX="0.7" refY="0.3" orient="auto">
                                                <polygon points="0 0, 0.8 0.3, 0 0.6" fill="rgba(168, 85, 247, 0.8)" />
                                            </marker>
                                        </defs>
                                        {finalEdgesToRender.map((edge, i) => {
                                            const source = nodesToRender.find(n => n.id === edge.source);
                                            const target = nodesToRender.find(n => n.id === edge.target);
                                            if (!source || !target) return null;

                                            const spotNodeId = edge.source.startsWith("blind_spot_") ? edge.source : edge.target.startsWith("blind_spot_") ? edge.target : null;
                                            const spotId = spotNodeId ? spotNodeId.substring("blind_spot_".length) : null;
                                            const isClicked = spotId ? localStorage.getItem(`oasis_blindspot_clicked_${user}__${spotId}`) === 'true' : false;
                                            const isBlindSpotEdge = spotNodeId && !isClicked;

                                            // Calculate vector & distance
                                            const dx = target.x - source.x;
                                            const dy = target.y - source.y;
                                            const dist = Math.hypot(dx, dy) || 1;

                                            // Node radii offsets
                                            let sourceOffset = 5;
                                            let targetOffset = 5;

                                            if (source.type === 'historical') sourceOffset = 4.0;
                                            if (source.type === 'biological' || source.type === 'social') sourceOffset = 5.0;
                                            if (source.type === 'motor' || source.type === 'cognitive' || source.type === 'physiological') sourceOffset = 6.0;

                                            if (target.type === 'historical') targetOffset = 4.0;
                                            if (target.type === 'biological' || target.type === 'social') targetOffset = 5.0;
                                            if (target.type === 'motor' || target.type === 'cognitive' || target.type === 'physiological') targetOffset = 6.0;

                                            // Apply offsets only if there's enough space
                                            const actualSourceOffset = dist > sourceOffset + targetOffset + 2 ? sourceOffset : 0;
                                            const actualTargetOffset = dist > sourceOffset + targetOffset + 2 ? targetOffset : 0;

                                            const x1 = source.x + (dx / dist) * actualSourceOffset;
                                            const y1 = source.y + (dy / dist) * actualSourceOffset;
                                            const x2 = target.x - (dx / dist) * actualTargetOffset;
                                            const y2 = target.y - (dy / dist) * actualTargetOffset;

                                            // Determine edge types
                                            const isProgression = edge.type === 'progression';
                                            const isFeedback = edge.type === 'feedback' || target.x < source.x;

                                            let pathData;
                                            if (isFeedback) {
                                                const midX = (x1 + x2) / 2;
                                                const midY = (y1 + y2) / 2;
                                                const bowFactor = midY < 50 ? -30 : 30;
                                                pathData = `M ${x1} ${y1} Q ${midX} ${midY + bowFactor} ${x2} ${y2}`;
                                            } else {
                                                pathData = `M ${x1} ${y1} L ${x2} ${y2}`;
                                            }

                                            // Determine highlight state
                                            const activeNodeId = selectedNode?.id || (tourActiveIndex !== null && sortedTourNodes[tourActiveIndex]?.id);

                                            const isIncoming = activeNodeId === target.id;
                                            const isOutgoing = activeNodeId === source.id;
                                            const isEdgeInPattern = activePattern && activePattern.node_ids.includes(source.id) && activePattern.node_ids.includes(target.id);
                                            const isHighlighted = (activeNodeId && (isIncoming || isOutgoing)) || isEdgeInPattern;
                                            const isAnyNodeSelected = !!activeNodeId || !!selectedPatternId;

                                            let strokeColor = "rgba(255,255,255,0.15)";
                                            let strokeWidth = (edge.weight || 1.2) * 0.1;
                                            let className = "";
                                            let markerEnd = edge.type === 'unidirectional' || isFeedback ? "url(#arrowhead-default)" : "";
                                            let style = {};

                                            if (isAnyNodeSelected && !isHighlighted) {
                                                // If a node/pattern (island) is selected, but this edge is not highlighted, fade it completely
                                                strokeColor = "rgba(255,255,255,0.02)";
                                                strokeWidth = 0.04;
                                                markerEnd = "";
                                            } else if (isEdgeInPattern) {
                                                strokeColor = "rgba(168, 85, 247, 0.95)"; // Brighter purple active line for selected patterns/islands
                                                strokeWidth = 0.24;
                                                className = "edge-flow-active";
                                                markerEnd = "url(#arrowhead-feedback)";
                                                style = { strokeDasharray: "0.2, 0.2" };
                                            } else if (isHighlighted) {
                                                if (isIncoming && isOutgoing) {
                                                    strokeColor = "#a78bfa";
                                                    markerEnd = "url(#arrowhead-both)";
                                                } else if (isIncoming) {
                                                    strokeColor = "#818cf8";
                                                    markerEnd = "url(#arrowhead-incoming)";
                                                } else {
                                                    strokeColor = "#fb7185";
                                                    markerEnd = "url(#arrowhead-outgoing)";
                                                }
                                                strokeWidth = 0.26;
                                                className += " edge-flow-active";
                                                style = {};
                                            } else if (edge.type === 'mini_chat_link') {
                                                strokeColor = "rgba(255, 255, 255, 0.4)";
                                                strokeWidth = 0.15;
                                                style = { strokeDasharray: "0.5, 0.5" };
                                                markerEnd = "";
                                            } else if (isProgression) {
                                                strokeColor = "rgba(59, 130, 246, 0.45)";
                                                strokeWidth = 0.09;
                                                style = { strokeDasharray: "0.2, 0.2" };
                                                markerEnd = "";
                                            } else if (isFeedback) {
                                                strokeColor = "rgba(168, 85, 247, 0.55)";
                                                strokeWidth = 0.14;
                                                className = "edge-flow-active";
                                                markerEnd = "url(#arrowhead-feedback)";
                                                style = { strokeDasharray: "0.4, 0.4" };
                                            } else if (isBlindSpotEdge) {
                                                strokeColor = "#38bdf8";
                                                strokeWidth = 0.18;
                                                className += " edge-flow-active";
                                                markerEnd = "url(#arrowhead-blindspot)";
                                                style = {};
                                            } else if (isAnyNodeSelected) {
                                                strokeColor = "rgba(255,255,255,0.03)";
                                                strokeWidth = 0.05;
                                                markerEnd = "";
                                            }

                                            return (
                                                <g key={i}>
                                                    <path
                                                        d={pathData}
                                                        fill="none"
                                                        stroke={strokeColor}
                                                        strokeWidth={strokeWidth}
                                                        markerEnd={markerEnd}
                                                        className={className}
                                                        style={style}
                                                    />
                                                </g>
                                            );
                                        })}
                                    </svg>

                                    {/* HTML Nodes */}
                                    {finalNodesToRender.map(node => {
                                        const isSelected = selectedNode?.id === node.id;
                                        const activeNodeId = selectedNode?.id || (tourActiveIndex !== null && sortedTourNodes[tourActiveIndex]?.id);
                                        const isNodeInPattern = activePattern && activePattern.node_ids.includes(node.id);
                                        const isConnected = (activeNodeId && (
                                            node.id === activeNodeId ||
                                            (edgesToRender && edgesToRender.some(e =>
                                                (e.source === activeNodeId && e.target === node.id) ||
                                                (e.target === activeNodeId && e.source === node.id)
                                            ))
                                        )) || isNodeInPattern;
                                        const isDimmed = (activeNodeId || selectedPatternId) && !isConnected && node.type !== 'mini_chat';

                                        // Prevenir event propagation en el clic del nodo para no disparar el drag si el usuario da un click rápido
                                        const handleNodeClick = (e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            nodeClickedRef.current = true;
                                            if (nodeDraggedRef.current) {
                                                nodeDraggedRef.current = false;
                                                return;
                                            }
                                            setExplorationModalOpen(false);
                                            setSelectedQuestionIndex(null);
                                            const targetNode = isSelected ? null : node;
                                            setSelectedNode(targetNode);

                                            if (targetNode) {
                                                // If the clicked node is a blind spot node, mark it as clicked in localStorage
                                                if (targetNode.id.startsWith("blind_spot_")) {
                                                    const spotId = targetNode.id.substring("blind_spot_".length);
                                                    const isResolved = localStorage.getItem(`oasis_blindspot_resolved_${user}__${spotId}`) === 'true';

                                                    if (!isResolved) {
                                                        setLocalItem(`oasis_blindspot_clicked_${user}__${spotId}`, 'true');

                                                        // Check if it belongs to a node-specific exploration
                                                        let foundNodeId = null;
                                                        let foundSpot = null;
                                                        Object.keys(nodeExplorations || {}).forEach(nid => {
                                                            const spots = (nodeExplorations && nodeExplorations[nid]) || [];
                                                            const spot = spots.find(s => s.id === spotId || `blind_spot_${s.id}` === targetNode.id);
                                                            if (spot) {
                                                                foundNodeId = nid;
                                                                foundSpot = spot;
                                                            }
                                                        });

                                                        if (foundNodeId && foundSpot) {
                                                            const parentNode = sortedTourNodes.find(sn => sn.id === foundNodeId);
                                                            if (parentNode) {
                                                                const idx = sortedTourNodes.findIndex(sn => sn.id === parentNode.id);
                                                                if (idx !== -1) {
                                                                    setTourActiveIndex(idx);
                                                                }
                                                                setSelectedNode(parentNode);
                                                                setIsExploringActiveNode(true);
                                                                setSelectedExplorationSpot(foundSpot);
                                                                setExplorationResponse('');
                                                                setTimeout(() => zoomToNode(parentNode), 15);

                                                                return;
                                                            }
                                                        }
                                                    } else {
                                                        // Resolved blind spot node: select it directly
                                                        const idx = sortedTourNodes.findIndex(sn => sn.id === targetNode.id);
                                                        if (idx !== -1) {
                                                            setTourActiveIndex(idx);
                                                        }
                                                        setTimeout(() => zoomToNode(targetNode), 15);

                                                        return;
                                                    }
                                                }
                                                // Find the pattern centered on this node (primary_node_id matches targetNode.id)
                                                const foundPat = currentPatterns.find(p => p.primary_node_id === targetNode.id);
                                                if (foundPat) {
                                                    setSelectedPatternId(foundPat.id);
                                                    // We filter and sort the nodes of this pattern to determine the correct active index
                                                    const filtered = (nodesToRender || []).filter(n => foundPat.node_ids.includes(n.id));
                                                    const typeOrder = {
                                                        historical: 0,
                                                        biological: 1,
                                                        social: 2,
                                                        cognitive: 3,
                                                        motor: 4,
                                                        physiological: 5,
                                                        consequence: 6
                                                    };
                                                    const sorted = [...filtered].sort((a, b) => {
                                                        const orderA = typeOrder[a.type] ?? 99;
                                                        const orderB = typeOrder[b.type] ?? 99;
                                                        if (orderA !== orderB) return orderA - orderB;
                                                        if (a.x !== b.x) return a.x - b.x;
                                                        return a.y - b.y;
                                                    });
                                                    const targetIdx = sorted.findIndex(n => n.id === targetNode.id);
                                                    setTourActiveIndex(targetIdx !== -1 ? targetIdx : 0);
                                                } else {
                                                    setSelectedPatternId(null);
                                                    const idx = sortedTourNodes.findIndex(sn => sn.id === targetNode.id);
                                                    if (idx !== -1) {
                                                        setTourActiveIndex(idx);
                                                    }
                                                }
                                                setTimeout(() => zoomToNode(targetNode), 15);

                                            } else {
                                                setTourActiveIndex(null);
                                                setSelectedPatternId(null);
                                                setTimeout(resetMapTransform, 15);
                                            }
                                        };

                                        const handleNodeMouseDown = (e) => {
                                            e.stopPropagation();
                                            nodeDraggedRef.current = false;
                                            setDraggingNodeId(node.id);
                                            lastPointerPos.current = { x: e.clientX, y: e.clientY };
                                        };

                                        const handleNodeTouchStart = (e) => {
                                            e.stopPropagation();
                                            nodeDraggedRef.current = false;
                                            setDraggingNodeId(node.id);
                                            if (e.touches.length === 1) {
                                                const touch = e.touches[0];
                                                lastPointerPos.current = { x: touch.clientX, y: touch.clientY };
                                            }
                                        };

                                        let nodeClass = "absolute flex items-center justify-center cursor-pointer transition-[transform,opacity,filter,box-shadow] z-10 select-none ";
                                        nodeClass += draggingNodeId === node.id ? "duration-0 " : "duration-200 ";
                                        nodeClass += isSelected ? "scale-110 drop-shadow-[0_0_20px_rgba(255,255,255,0.4)] z-30 " : (draggingNodeId === node.id ? "scale-110 z-30 " : "hover:scale-105 hover:z-30 ");
                                        nodeClass += isDimmed ? "opacity-30 " : "opacity-100 drop-shadow-[0_0_15px_rgba(0,0,0,0.8)] ";

                                        return (
                                            <div
                                                key={node.id}
                                                id={`afc-node-${node.id}`}
                                                data-basex={node.x}
                                                data-basey={node.y}
                                                onClick={handleNodeClick}
                                                onMouseDown={handleNodeMouseDown}
                                                onTouchStart={handleNodeTouchStart}
                                                onDragStart={(e) => e.preventDefault()}
                                                className={nodeClass}
                                                style={{ left: `${node.x}%`, top: `${node.y}%`, transform: 'translate(-50%, -50%)', userSelect: 'none', WebkitUserSelect: 'none', WebkitUserDrag: 'none' }}
                                            >

                                                {node.type === 'historical' && (
                                                    <div className="relative flex items-center justify-center">
                                                        <div className={`w-28 h-28 absolute bg-[#0a0a0c]/90 border-2 rotate-45 transition-colors ${node.dashed ? 'border-dashed border-sky-400 bg-sky-950/30' : (node.status === 'integrated' ? 'border-yellow-400 bg-yellow-950/40 shadow-[0_0_30px_rgba(250,204,21,0.5)]' : (isSelected ? 'border-blue-400 bg-[#0a0a0c] shadow-[inset_0_0_30px_rgba(59,130,246,0.3)]' : 'border-blue-500/40 hover:border-blue-400'))}`} />
                                                        <span className={`relative z-10 text-[10px] font-bold text-center leading-snug w-[140px] break-words p-3 [text-shadow:0_1px_2px_rgba(0,0,0,0.8)] ${node.status === 'integrated' ? 'text-yellow-300' : (node.dashed ? 'text-sky-300' : 'text-blue-200')}`}>{node.label}</span>
                                                    </div>
                                                )}
                                                {(node.type === 'biological' || node.type === 'social') && (
                                                    <div className={`min-w-[130px] max-w-[170px] min-h-[130px] rounded-full bg-[#0a0a0c]/90 border-2 flex items-center justify-center p-5 transition-colors ${node.dashed ? 'border-dashed border-sky-400 bg-sky-950/30' : (node.status === 'integrated' ? 'border-yellow-400 bg-yellow-950/40 shadow-[0_0_30px_rgba(250,204,21,0.5)]' : (isSelected ? 'border-emerald-400 bg-[#0a0a0c] shadow-[inset_0_0_30px_rgba(16,185,129,0.3)]' : 'border-emerald-500/40 hover:border-emerald-400'))}`}>
                                                        <span className={`text-[11px] font-bold text-center leading-snug break-words [text-shadow:0_1px_2px_rgba(0,0,0,0.8)] ${node.status === 'integrated' ? 'text-yellow-300' : (node.dashed ? 'text-sky-300' : 'text-emerald-200')}`}>{node.label}</span>
                                                    </div>
                                                )}
                                                {(node.type === 'motor' || node.type === 'cognitive' || node.type === 'physiological') && (
                                                    <div className={`min-w-[150px] max-w-[200px] min-h-[64px] rounded-xl bg-[#0a0a0c]/90 border-2 flex items-center justify-center p-4 transition-colors ${node.dashed ? 'border-dashed border-sky-400 bg-sky-950/30' : (node.status === 'integrated' ? 'border-yellow-400 bg-yellow-950/40 shadow-[0_0_30px_rgba(250,204,21,0.5)]' : (isSelected ? 'border-rose-400 bg-[#0a0a0c] shadow-[inset_0_0_30px_rgba(244,63,94,0.3)]' : 'border-rose-500/40 hover:border-rose-400'))}`}>
                                                        <span className={`text-[11px] font-bold text-center leading-snug break-words [text-shadow:0_1px_2px_rgba(0,0,0,0.8)] ${node.status === 'integrated' ? 'text-yellow-300' : (node.dashed ? 'text-sky-300' : 'text-rose-200')}`}>{node.label}</span>
                                                    </div>
                                                )}
                                                
                                                {node.type === 'mini_chat' && (
                                                    <div className="group relative cursor-pointer flex items-center justify-center w-8 h-8">
                                                        <div className={`w-2 h-2 rounded-full border shadow-sm transition-transform duration-300 group-hover:scale-150 ${node.role === 'assistant' ? 'bg-sky-500/30 border-sky-500/80' : 'bg-emerald-500/30 border-emerald-500/80'}`} />
                                                        <div className={`absolute opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 rounded-lg bg-black/90 border p-1.5 backdrop-blur-md shadow-lg z-50 ${node.role === 'assistant' ? 'border-sky-500/60 shadow-[0_0_15px_rgba(14,165,233,0.3)]' : 'border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.3)]'}`}>
                                                            <span className={`block text-[6.5px] font-medium text-center whitespace-nowrap ${node.role === 'assistant' ? 'text-sky-100' : 'text-emerald-100'}`}>{node.label}</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {node.type === 'consequence' && (
                                                    <div className={`min-w-[150px] max-w-[200px] min-h-[80px] rounded-[2rem] bg-[#0a0a0c]/90 border-2 border-dashed flex items-center justify-center p-4 transition-colors ${isSelected ? 'border-zinc-300 bg-[#0a0a0c] shadow-[inset_0_0_30px_rgba(255,255,255,0.15)]' : 'border-zinc-500/60 hover:border-zinc-400'} ${node.dashed ? 'border-dashed border-sky-400 bg-sky-950/30' : ''}`}>
                                                        <span className="text-[11px] font-bold text-zinc-300 text-center leading-snug break-words [text-shadow:0_1px_2px_rgba(0,0,0,0.8)]">{node.label}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </React.Fragment>
                                )
                                })()}
                                </div>

                                {/* Text Overlays for tabs */}
                                {mapViewTab === 'loop' && (
                                    <div className="absolute inset-0 z-40 bg-[#050506]/95 p-6 pt-24 md:p-8 md:pt-28 overflow-y-auto no-scrollbar animate-in fade-in duration-300">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-6 border-b border-white/5 pb-3 flex items-center gap-2 sticky top-0 bg-[#050506]/95 z-50">
                                            <Brain size={14} /> ¿Cómo funciona tu bucle? (En palabras sencillas)
                                        </h3>
                                        <div className="p-6 md:p-8 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl w-full max-w-4xl mx-auto shadow-inner mb-32">
                                            <p className="text-sm md:text-base text-zinc-300 leading-relaxed font-sans whitespace-pre-line">
                                                {afcData?.explicacion_sencilla || (
                                                    afcData?.hypotheses?.mantenimiento
                                                        ? "Tu mente y cuerpo han creado un patrón automático: cuando enfrentas tensiones de tu entorno o recuerdos de tu historia, reaccionas con ciertos pensamientos y conductas de protección. Aunque esto te da alivio inmediato, a largo plazo refuerza y mantiene el problema en el tiempo, impidiéndote avanzar."
                                                        : "Procesando datos..."
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {mapViewTab === 'exit_keys' && (
                                    <div className="absolute inset-0 z-40 bg-[#050506]/95 p-6 pt-24 md:p-8 md:pt-28 overflow-y-auto no-scrollbar animate-in fade-in duration-300">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-6 border-b border-white/5 pb-3 flex items-center gap-2 sticky top-0 bg-[#050506]/95 z-50">
                                            <Target size={14} /> Claves para salir de aquí
                                        </h3>
                                        <div className="p-6 md:p-8 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl w-full max-w-4xl mx-auto shadow-inner mb-32">
                                            <p className="text-sm md:text-base text-zinc-300 leading-relaxed font-sans whitespace-pre-line">
                                                {afcData?.claves_salida || (
                                                    afcData?.hypotheses?.solucion
                                                        ? `${afcData.hypotheses.solucion}. Explora el mapa para identificar qué pensamientos o conductas puedes empezar a flexibilizar.`
                                                        : "Procesando datos..."
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {mapViewTab === 'avances' && (
                                    <div className="absolute inset-0 z-40 bg-[#050506]/95 p-6 pt-24 md:p-8 md:pt-28 overflow-y-auto custom-scroll animate-in fade-in duration-300 flex flex-col h-full">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-blue-400 mb-4 border-b border-white/5 pb-3 flex items-center gap-2 shrink-0">
                                            <MessageSquare size={14} /> Registro de Avances y Cambios
                                        </h3>
                                        <div className="flex-1 w-full max-w-4xl mx-auto flex flex-col gap-4 pb-36">
                                            <p className="text-xs text-zinc-400 mb-2">Escribe con total libertad sobre los cambios recientes en tu vida (ej. si lograste un avance, cambiaste un hábito o notaste algo distinto). La IA actualizará tu mapa de bucles de manera discreta con esta nueva información.</p>
                                            <textarea
                                                className="w-full flex-1 bg-zinc-950 border border-white/10 rounded-xl p-4 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50 resize-none transition-colors"
                                                placeholder="Ej. He logrado mantener un nuevo hábito desde hace un par de semanas y me siento diferente..."
                                                value={lifeUpdateText}
                                                onChange={(e) => setLifeUpdateText(e.target.value)}
                                            />
                                            <button
                                                className="w-full sm:w-auto self-end px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center gap-2"
                                                onClick={generateLifeUpdate}
                                                disabled={isUpdatingMap || !lifeUpdateText.trim()}
                                            >
                                                {isUpdatingMap ? (
                                                    <span className="flex items-center gap-2">
                                                        <Compass size={16} className="animate-spin-slow" />
                                                        Procesando y Actualizando Mapa...
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-2">
                                                        <Pin size={16} />
                                                        Actualizar Mapa
                                                    </span>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            {/* MÓDULO 1.5: ISLAS EXISTENCIALES (PATRONES CONDUCTUALES) ABAJO DEL MAPA */}
                            {/* BUCLES PAGE (LIST FORMAT) */}
                            {mapViewTab === 'bucles' && (
                                <div className="absolute inset-0 z-[100] bg-[#050506] overflow-y-auto custom-scroll p-3 md:p-6 animate-in fade-in duration-300 pointer-events-auto">
                                    <div className="max-w-2xl mx-auto flex flex-col gap-3 pb-28">
                                        
                                        {/* Header */}
                                        <div className="flex flex-col gap-0.5 pt-20 md:pt-24">
                                            <div className="flex items-center gap-2">
                                                <Compass size={16} className="text-purple-500" />
                                                <h2 className="text-sm font-black uppercase tracking-wider text-white">Tus Bucles Clínicos</h2>
                                            </div>
                                            <p className="text-[9px] text-zinc-500 font-mono tracking-widest uppercase">Análisis y Secuencias Conductuales</p>
                                        </div>
                                        
                                        {showUnlockNotification && (
                                            <div className="bg-emerald-950/90 border border-emerald-500/50 p-2.5 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.2)] flex items-center gap-3 backdrop-blur-md cursor-pointer hover:bg-emerald-900/90 transition-colors animate-in fade-in" onClick={() => setShowUnlockNotification(false)}>
                                                <div className="w-7 h-7 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-400/30 shrink-0">
                                                    <Sparkles size={14} className="text-emerald-400 animate-pulse" />
                                                </div>
                                                <div>
                                                    <h4 className="text-emerald-400 font-black uppercase tracking-widest text-[9px] flex items-center gap-1.5">¡Nuevo Nivel Alcanzado!</h4>
                                                    <p className="text-emerald-200 text-[9px] font-medium mt-0.5">Has desbloqueado {recentlyUnlocked} nuevo(s) bucle(s) gracias a tu progreso.</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* List */}
                                        <div className="flex flex-col gap-2">
                                            {currentPatterns.length === 0 ? (
                                                <div className="p-5 border border-white/5 border-dashed rounded-2xl flex items-center justify-center text-zinc-500 italic text-[10px]">No hay islas en este mapa clínico.</div>
                                            ) : (
                                                currentPatterns.map((pat, idx) => {
                                                    const isLocked = idx >= unlockedCount;
                                                    const isSelected = selectedPatternId === pat.id;
                                                    
                                                    return (
                                                        <div key={pat.id} className={`flex flex-col rounded-2xl border transition-all duration-300 overflow-hidden ${isLocked ? 'opacity-40 grayscale bg-black/30 border-white/5' : isSelected ? 'bg-zinc-950 border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.04)]' : 'bg-black/50 border-white/10 hover:border-white/20 hover:bg-black/80'}`}>
                                                            
                                                            {/* Card Header (Click to expand) */}
                                                            <button 
                                                                disabled={isLocked}
                                                                onClick={() => {
                                                                    if (isSelected) {
                                                                        setSelectedPatternId(null);
                                                                    } else {
                                                                        setSelectedPatternId(pat.id);
                                                                    }
                                                                }}
                                                                className="p-3 flex flex-col gap-1.5 text-left w-full relative overflow-hidden focus:outline-none"
                                                            >
                                                                {isSelected && (
                                                                    <>
                                                                        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-purple-500/5 blur-[100px] pointer-events-none" />
                                                                        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none" />
                                                                    </>
                                                                )}
                                                                
                                                                <div className="flex items-center justify-between w-full relative z-10">
                                                                    <div className="flex items-center gap-2">
                                                                        {isLocked ? <Lock size={13} className="text-zinc-500" /> : <Compass size={13} className={isSelected ? "text-purple-400" : "text-zinc-500"} />}
                                                                        <span className="text-[11px] font-black uppercase tracking-wide text-zinc-200">{pat.nombre}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        {pat.node_ids && (
                                                                            <span className="text-[8px] px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 font-mono font-bold border border-white/5">
                                                                                {pat.node_ids.length} Nodos
                                                                            </span>
                                                                        )}
                                                                        <ChevronDown size={14} className={`text-zinc-500 transition-transform duration-300 ${isSelected ? 'rotate-180 text-purple-400' : ''}`} />
                                                                    </div>
                                                                </div>
                                                                
                                                                {pat.descripcion && (
                                                                    <p className="text-[9px] text-zinc-500 leading-relaxed max-w-3xl relative z-10 line-clamp-1">
                                                                        {pat.descripcion}
                                                                    </p>
                                                                )}
                                                                
                                                                <div className="flex gap-1.5 relative z-10">
                                                                    <span className={`text-[8px] px-1.5 py-0.5 rounded-sm font-black uppercase tracking-widest ${pat.computedIntensity >= 15 ? 'bg-red-500/20 text-red-400 border border-red-500/20' : pat.computedIntensity >= 8 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'}`}>
                                                                        {pat.computedIntensity >= 15 ? 'Capa Profunda' : pat.computedIntensity >= 8 ? 'Capa Media' : 'Capa Cercana'}
                                                                    </span>
                                                                    <span className="text-[8px] px-1.5 py-0.5 rounded-sm bg-zinc-800 text-zinc-400 font-bold tracking-widest border border-white/5">
                                                                        {pat.computedDifficulty > 3 ? 'Desafiante' : 'Abordable'}
                                                                    </span>
                                                                </div>
                                                            </button>
                                                            
                                                            {/* Card Expanded Body */}
                                                            {isSelected && (
                                                                <div className="border-t border-white/5 bg-black/40 p-2.5 flex flex-col gap-3 animate-in slide-in-from-top-4 duration-300 relative z-10">
{/* Content body */}
                                        <div className="flex flex-col gap-2 relative z-10">
                                            
                                            {/* SECUENCIA Y DESGLOSE (ACCORDION) */}
                                            <div className="bg-zinc-900/30 border border-white/5 rounded-xl p-2 flex flex-col gap-1.5">
                                                <h5 className="text-[9px] font-mono font-black uppercase tracking-wider text-zinc-400">Secuencia Temporal y Desglose</h5>
                                                
                                                <div className="flex flex-col gap-2 mt-1 relative">
                                                    {pat.sortedNodes?.map((node, idx) => {
                                                        const typeColors = {
                                                            historical: "bg-amber-500/10 border-amber-500/20 text-amber-400",
                                                            biological: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
                                                            social: "bg-sky-500/10 border-sky-500/20 text-sky-400",
                                                            cognitive: "bg-purple-500/10 border-purple-500/20 text-purple-400",
                                                            motor: "bg-pink-500/10 border-pink-500/20 text-pink-400",
                                                            physiological: "bg-rose-500/10 border-rose-500/20 text-rose-400",
                                                            consequence: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                                                        };

                                                        const typeShortLabels = {
                                                            historical: "Histórico",
                                                            biological: "Biológico",
                                                            social: "Social",
                                                            cognitive: "Cognitivo",
                                                            motor: "Motor",
                                                            physiological: "Fisiológico",
                                                            consequence: "Consecuencia"
                                                        };
                                                        
                                                        const isExpanded = expandedBucleNodeId === node.id;

                                                        return (
                                                            <div 
                                                                key={node.id}
                                                                className={`flex flex-col rounded-xl border transition-all duration-300 overflow-hidden ${isExpanded ? typeColors[node.type] : 'border-white/5 bg-white/[0.02] hover:bg-white/5'}`}
                                                            >
                                                                <div 
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        // Toggle local accordion ONLY — no map navigation
                                                                        setExpandedBucleNodeId(prev => prev === node.id ? null : node.id);
                                                                    }}
                                                                    className="flex flex-row items-center gap-3 p-3 cursor-pointer group/step"
                                                                >
                                                                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-[11px] shrink-0 z-10 shadow-sm ${typeColors[node.type] || 'border-zinc-700 bg-zinc-900 text-zinc-300'} transition-colors`}>
                                                                        {idx + 1}
                                                                    </div>
                                                                    
                                                                    <div className="flex flex-col min-w-0 flex-1">
                                                                        <span className="text-[8px] font-mono uppercase tracking-widest text-zinc-500">{typeShortLabels[node.type]}</span>
                                                                        <span className={`text-[9.5px] font-black uppercase tracking-wide mt-0.5 leading-tight transition-colors ${isExpanded ? 'text-white' : 'text-zinc-300 group-hover/step:text-white'}`}>{node.label}</span>
                                                                    </div>

                                                                    <div className={`ml-auto shrink-0 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-white' : 'text-zinc-600'}`}>
                                                                        <ChevronDown size={16} />
                                                                    </div>
                                                                </div>
                                                                
                                                                {/* Accordion Body */}
                                                                <div 
                                                                    className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}
                                                                >
                                                                    <div className="px-3 pb-4 pt-1 flex flex-col gap-3">
                                                                        <p className="text-[10px] text-zinc-300 leading-relaxed font-sans font-medium">
                                                                            {getFallbackDescription(node, user)}
                                                                        </p>
                                                                        
                                                                        <div className="mt-1 pt-3 border-t border-white/10 pl-3 border-l-[3px] border-white/20 bg-black/20 p-3 rounded-r-xl">
                                                                            <p className="text-[9px] font-mono font-black uppercase tracking-widest text-zinc-400">Origen o Hipótesis</p>
                                                                            <p className="text-[9.5px] text-zinc-400 italic leading-relaxed mt-1.5">
                                                                                {getFallbackSource(node, bioData, phenomData)}
                                                                            </p>
                                                                        </div>

                                                                        {(() => {
                                                                            const safeThreadIndex = selectedQuestionIndex !== null ? selectedQuestionIndex : 0; const currentChat = getSafeCurrentChat(node.id, safeThreadIndex);
                                                                            return (
                                                                                <div className="flex flex-col gap-3 mt-1 h-full max-h-[300px]" onClick={e => e.stopPropagation()}>
                                                                                    {/* Header with arrows */}
                                                                                    <div className="flex items-center justify-between bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                                                                                        <span className="text-[9px] font-mono text-zinc-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                                                                                            <Sparkles size={10} className="text-sky-500" />
                                                                                            {safeThreadIndex === 6 ? '✨ INTEGRACIÓN DE NODO' : `PERSPECTIVA ${safeThreadIndex + 1} DE 6`}
                                                                                        </span>
                                                                                        <div className="flex gap-1">
                                                                
                                                                                            <button 
                                                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const isAllAnswered = hasAnsweredAllPerspectives((activeChatNode || currentNode || selectedNode)?.id);
                                                                    const nextIdx = safeThreadIndex === 6 ? 5 : (safeThreadIndex > 0 ? safeThreadIndex - 1 : (isAllAnswered ? 6 : 5));
                                                                    setSelectedQuestionIndex(nextIdx);
                                                                    const nextChat = getSafeCurrentChat(node.id, nextIdx);
                                                                    if ((!nextChat || nextChat.length === 0) && !isGeneratingExplorations) {
                                                                        continueNodeExploration(node, null, nextIdx);
                                                                    }
                                                                }}
                                                                                                className="p-1 text-zinc-500 hover:text-white hover:bg-white/10 rounded transition-colors"
                                                                                            >
                                                                                                <ChevronLeft size={14} />
                                                                                            </button>
                                                                                            <button 
                                                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const isAllAnswered = hasAnsweredAllPerspectives((activeChatNode || currentNode || selectedNode)?.id);
                                                                      const nextIdx = safeThreadIndex === 6 ? 0 : (safeThreadIndex < 5 ? safeThreadIndex + 1 : (isAllAnswered ? 6 : 0));
                                                                    setSelectedQuestionIndex(nextIdx);
                                                                    const nextChat = getSafeCurrentChat(node.id, nextIdx);
                                                                    if ((!nextChat || nextChat.length === 0) && !isGeneratingExplorations) {
                                                                        continueNodeExploration(node, null, nextIdx);
                                                                    }
                                                                }}
                                                                                                className="p-1 text-zinc-500 hover:text-white hover:bg-white/10 rounded transition-colors"
                                                                                            >
                                                                                                <ChevronRight size={14} />
                                                                                            </button>
                                                                                        </div>
                                                                                    </div>
                                                                                    {/* Chat messages area */}
                                                                                    <div className="node-chat-scroll flex-1 overflow-y-auto custom-scroll pr-1 flex flex-col gap-3">
                                                                                        {currentChat.length === 0 && isGeneratingExplorations && (
                                                                                            <div className="flex items-center gap-2 text-[10px] text-zinc-400 italic">
                                                                                                <Sparkles size={12} className="animate-spin text-sky-400" />
                                                                                                <span>El terapeuta está formulando la pregunta inicial...</span>
                                                                                            </div>
                                                                                        )}
                                                                                        {currentChat.map((msg, idx) => (
                                                                                            <div key={idx} className={`flex flex-col gap-1.5 ${msg.role === 'assistant' ? 'items-start' : 'items-end'}`}>
                                                                                                <div className={`p-2.5 rounded-xl text-[10px] leading-relaxed max-w-[90%] ${msg.role === 'assistant' ? 'bg-sky-500/10 border border-sky-500/20 text-sky-100 rounded-tl-sm' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-100 rounded-tr-sm'}`}>
                                                                                                    {msg.content}
                                                                                                    {msg.newNodeAdded && (
                                                                                                        <div className="mt-2 pt-2 border-t border-sky-500/30">
                                                                                                            <span className="text-[8px] font-mono font-bold text-amber-400 flex items-center gap-1"><Sparkles size={10}/> NUEVO PATRÓN DETECTADO: {msg.newNodeAdded.label}</span>
                                                                                                        </div>
                                                                                                    )}
                                                                                                </div>
                                                                                            </div>
                                                                                        ))}
                                                                                        {currentChat.length > 0 && isGeneratingExplorations && (
                                                                                            <div className="flex items-center gap-2 text-[10px] text-zinc-400 italic">
                                                                                                <Sparkles size={12} className="animate-spin text-sky-400" />
                                                                                                <span>Analizando tu respuesta...</span>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                    
                                                                                    {/* Input area */}
                                                                                    <div className="flex flex-col gap-1.5 shrink-0 border-t border-white/10 pt-2">
                                                                                        <textarea 
                                                                                            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-[10px] text-white placeholder-zinc-600 focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 outline-none resize-none custom-scroll"
                                                                                            rows={2}
                                                                                            placeholder={isGeneratingExplorations ? "Esperando al terapeuta..." : "Escribe tu reflexión aquí..."}
                                                                                            value={explorationResponse}
                                                                                            disabled={isGeneratingExplorations}
                                                                                            onChange={(e) => {
        const val = e.target.value;
        setExplorationResponse(val);
        let activeId = null;
        if (mapViewTab === 'map' && tourActiveIndex !== null && sortedTourNodes[tourActiveIndex]) {
            activeId = sortedTourNodes[tourActiveIndex].id;
        } else if (selectedNode) {
            activeId = selectedNode.id;
        }
        if (activeId) {
            localStorage.setItem('draft_' + activeId + '_' + (selectedQuestionIndex || 0), val);
        }
    }}
                                                                                            onMouseDown={e => e.stopPropagation()}
                                                                                            onClick={e => e.stopPropagation()}
                                                                                            onKeyDown={(e) => {
                                                                                                e.stopPropagation();
                                                                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                                                                    e.preventDefault();
                                                                                                    if (explorationResponse.trim() && !isGeneratingExplorations) {
                                                                                                        continueNodeExploration(node, explorationResponse.trim());
                                                                                                    }
                                                                                                }
                                                                                            }}
                                                                                        />
                                                                                        <div className="flex justify-end">
                                                                                            <button
                                                                                                type="button"
                                                                                                disabled={isGeneratingExplorations || !explorationResponse.trim()}
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    if (explorationResponse.trim() && !isGeneratingExplorations) {
                                                                                                        continueNodeExploration(node, explorationResponse.trim());
                                                                                                    }
                                                                                                }}
                                                                                                className="flex items-center gap-1.5 py-1.5 px-3 rounded text-[8px] font-bold tracking-widest uppercase bg-sky-500/10 border border-sky-500/20 text-sky-400 hover:bg-sky-500/20 transition-all disabled:opacity-50 disabled:grayscale"
                                                                                            >
                                                                                                {isGeneratingExplorations ? 'ENVIANDO...' : 'ENVIAR RESPUESTA'}
                                                                                            </button>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })()}
</div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {pat.clave_salida && (
                                                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex flex-col gap-2 relative overflow-hidden mt-1">
                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[30px] rounded-full pointer-events-none -mr-10 -mt-10" />
                                                    <h5 className="text-[9px] font-mono font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 z-10">
                                                        <Key size={10} />
                                                        Clave de Salida
                                                    </h5>
                                                    <p className="text-[11px] text-zinc-200 leading-relaxed z-10 relative">
                                                        {pat.clave_salida}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Footer Actions */}
                                        <div className="border-t border-white/5 pt-2 flex flex-row items-center justify-between gap-2 w-full relative z-10">
                                            <button
                                                onClick={() => {
                                                    const firstNode = nodesToRender.find(n => n.id === pat.primary_node_id) || nodesToRender.find(n => n.id === pat.node_ids[0]);
                                                    if (firstNode) {
                                                        setSelectedNode(firstNode);
                                                        const targetIdx = pat.sortedNodes.findIndex(n => n.id === firstNode.id);
                                                        setTourActiveIndex(targetIdx !== -1 ? targetIdx : 0);
                                                        setTimeout(() => zoomToNode(firstNode), 15);
                                                    }
                                                }}
                                                className="flex-1 py-1.5 px-2.5 rounded-lg bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-zinc-300 hover:text-white font-black text-[8px] uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 active:scale-[0.98]"
                                            >
                                                <Play size={10} />
                                                <span>Iniciar Recorrido</span>
                                            </button>

                                            <button
                                                onClick={() => {
                                                    const loopFlow = pat.sortedNodes?.map(n => `[${n.label} (${n.type})]`).join(' → ') || '';
                                                    const prompt = `Hola Kio. Quiero profundizar y reinterpretar el bucle de mi mapa conductual llamado "${pat.nombre}".
Este circuito está compuesto por la siguiente secuencia interconectada:
${loopFlow}

Por favor, analicemos:
1. ¿Cómo se alimentan y sostienen estas variables entre sí?
2. ¿De qué manera concreta puedo romper este encadenamiento conductual hoy?`;
                                                    
                                                    onOpenNodeChat?.(pat.primary_node_id, pat.nombre, prompt);
                                                }}
                                                className="flex-1 py-1.5 px-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-black uppercase text-[8px] tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-purple-900/30 hover:scale-[1.01] active:scale-[0.98]"
                                            >
                                                <MessageCircle size={10} />
                                                <span>Explorar con Kio IA</span>
                                            </button>
                                        </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )
                                                })
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {mapViewTab === 'map' && tourActiveIndex !== null && sortedTourNodes[tourActiveIndex] && (() => {
                                const currentNode = sortedTourNodes[tourActiveIndex];
                                const typeCompactLabels = {
                                    historical: "Histórico",
                                    biological: "Biológico",
                                    social: "Social",
                                    cognitive: "Cognitivo",
                                    motor: "Motor",
                                    physiological: "Fisiológico",
                                    consequence: "Consecuencia"
                                };
                                const typeIcons = {
                                    historical: Clock,
                                    biological: Activity,
                                    social: Network,
                                    cognitive: Brain,
                                    motor: Play,
                                    physiological: Heart,
                                    consequence: ArrowRight
                                };
                                const typeColors = {
                                    historical: "text-amber-400",
                                    biological: "text-emerald-400",
                                    social: "text-sky-400",
                                    cognitive: "text-purple-400",
                                    motor: "text-pink-400",
                                    physiological: "text-rose-400",
                                    consequence: "text-indigo-400"
                                };

                                const isDomino = dominoNode && dominoNode.id === currentNode.id;
                                const intensityVal = nodeIntensities[currentNode.id] !== undefined ? nodeIntensities[currentNode.id] : 8;

                                const { incoming, outgoing } = currentTourNodeEdges;
                                const totalConnections = incoming.length + outgoing.length;

                                return (
                                    <div
                                        className={`absolute bottom-[150px] md:bottom-[100px] md:top-auto left-1/2 z-[150] pointer-events-auto ${!isDraggingTour ? 'transition-transform duration-200 ease-out animate-in slide-in-from-bottom-4' : ''}`}
                                        style={{ transform: `translate(calc(-50% + ${tourModalPos.x}px), ${tourModalPos.y}px) scale(${typeof window !== 'undefined' && window.innerWidth < 768 ? 0.85 : 1})`, transformOrigin: 'bottom center' }}
                                        onClick={e => e.stopPropagation()}
                                        onMouseDown={e => e.stopPropagation()}
                                        onMouseMove={e => e.stopPropagation()}
                                        onMouseUp={e => e.stopPropagation()}
                                        onTouchStart={e => e.stopPropagation()}
                                        onTouchMove={e => e.stopPropagation()}
                                        onTouchEnd={e => e.stopPropagation()}
                                    >
                                        <div className="bg-zinc-950/95 border border-white/10 rounded-2xl p-4 shadow-2xl sm:backdrop-blur-md flex flex-col gap-3 min-w-[300px] md:min-w-[450px] w-auto max-w-[90vw] md:resize md:overflow-hidden max-h-[60vh] md:max-h-[85vh]">
                                            {/* Minimalist Header */}
                                            <div 
                                                className="flex items-center justify-between border-b border-white/5 pb-2 cursor-grab active:cursor-grabbing select-none"
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setIsDraggingTour(true);
                                                    dragTourStartRef.current = { x: e.clientX - tourModalPos.x, y: e.clientY - tourModalPos.y };
                                                }}
                                                onTouchStart={(e) => {
                                                    e.stopPropagation();
                                                    setIsDraggingTour(true);
                                                    dragTourStartRef.current = { x: e.touches[0].clientX - tourModalPos.x, y: e.touches[0].clientY - tourModalPos.y };
                                                }}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="flex items-center justify-center px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs md:text-sm font-mono font-bold">
                                                        {tourActiveIndex + 1}/{sortedTourNodes.length}
                                                    </span>
                                                    <span className="flex items-center gap-1.5 text-xs md:text-sm font-mono font-bold uppercase tracking-wider text-zinc-400">
                                                        {React.createElement(typeIcons[currentNode.type] || Activity, { size: 14, className: typeColors[currentNode.type] })}
                                                        <span>{typeCompactLabels[currentNode.type]}</span>
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => setIsTourMinimized(!isTourMinimized)}
                                                        className="p-1 text-zinc-500 hover:text-white transition-colors"
                                                        title={isTourMinimized ? "Maximizar" : "Minimizar"}
                                                    >
                                                        {isTourMinimized ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setTourActiveIndex(null);
                                                            setSelectedNode(null);
                                                            setIsExploringActiveNode(false);
                                                            setSelectedExplorationSpot(null);
                                                            setExplorationResponse('');
                                                            if (selectedPatternId && activePattern) {
                                                                setTimeout(() => zoomToPattern(activePattern), 15);
                                                            } else {
                                                                setSelectedPatternId(null);
                                                                setTimeout(resetMapTransform, 15);
                                                            }
                                                        }}
                                                        className="p-1 text-zinc-500 hover:text-white transition-colors"
                                                        title="Cerrar tour"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            </div>

                                            {!isTourMinimized && (
                                                <>
                                            <div className="flex flex-col gap-1.5 overflow-y-auto custom-scroll pr-1 pb-1 flex-1 min-h-0">
                                                {/* Node Label */}
                                            <h4 className="text-sm md:text-base font-black text-white leading-snug tracking-wide uppercase">{currentNode.label}</h4>

                                            {/* Description (Minimal Info) */}
                                            <div className="text-xs md:text-sm text-zinc-300 leading-relaxed bg-zinc-900/40 border border-white/5 rounded-xl p-3 md:p-4">
                                                <p className="text-zinc-200 whitespace-pre-line break-words leading-relaxed">{getFallbackDescription(currentNode, user)}</p>
                                            </div>

                                            {/* Wizard for 3 Questions */}
                                            {(() => {
                                                const safeThreadIndex = selectedQuestionIndex !== null ? selectedQuestionIndex : 0; const currentChat = getSafeCurrentChat(currentNode.id, safeThreadIndex);
                                                return (
                                                    <div className="flex flex-col gap-2.5 mt-2 h-full max-h-[40vh] md:max-h-[300px]" onClick={e => e.stopPropagation()}>
                                                        {/* Header with arrows */}
                                                        <div className="flex items-center justify-between bg-zinc-900/40 px-3 py-2 rounded-xl border border-white/5 mb-1">
                                                            <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                                                                <Sparkles size={12} className="text-sky-500" />
                                                                {safeThreadIndex === 6 ? '✨ INTEGRACIÓN DE NODO' : `PERSPECTIVA ${safeThreadIndex + 1} DE 6`}
                                                            </span>
                                                            <div className="flex gap-1.5">
                                                                
                                                                <button 
                                                                    onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const isAllAnswered = hasAnsweredAllPerspectives((activeChatNode || currentNode || selectedNode)?.id);
                                                                    const nextIdx = safeThreadIndex === 6 ? 5 : (safeThreadIndex > 0 ? safeThreadIndex - 1 : (isAllAnswered ? 6 : 5));
                                                                    setSelectedQuestionIndex(nextIdx);
                                                                    const nextChat = getSafeCurrentChat(currentNode.id, nextIdx);
                                                                    if ((!nextChat || nextChat.length === 0) && !isGeneratingExplorations) {
                                                                        continueNodeExploration(currentNode, null, nextIdx);
                                                                    }
                                                                }}
                                                                    className="p-1.5 text-zinc-500 hover:text-white bg-black/40 hover:bg-white/10 rounded-lg transition-colors border border-white/5"
                                                                >
                                                                    <ChevronLeft size={14} />
                                                                </button>
                                                                <button 
                                                                    onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const isAllAnswered = hasAnsweredAllPerspectives((activeChatNode || currentNode || selectedNode)?.id);
                                                                      const nextIdx = safeThreadIndex === 6 ? 0 : (safeThreadIndex < 5 ? safeThreadIndex + 1 : (isAllAnswered ? 6 : 0));
                                                                    setSelectedQuestionIndex(nextIdx);
                                                                    const nextChat = getSafeCurrentChat(currentNode.id, nextIdx);
                                                                    if ((!nextChat || nextChat.length === 0) && !isGeneratingExplorations) {
                                                                        continueNodeExploration(currentNode, null, nextIdx);
                                                                    }
                                                                }}
                                                                    className="p-1.5 text-zinc-500 hover:text-white bg-black/40 hover:bg-white/10 rounded-lg transition-colors border border-white/5"
                                                                >
                                                                    <ChevronRight size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        {/* Chat messages area */}
                                                        <div className="node-chat-scroll flex-1 overflow-y-auto custom-scroll pr-1 flex flex-col gap-3 border border-white/5 bg-zinc-900/20 p-2 rounded-xl">
                                                            {currentChat.length === 0 && isGeneratingExplorations && (
                                                                <div className="flex items-center gap-2 text-[10px] text-zinc-400 italic">
                                                                    <Sparkles size={12} className="animate-spin text-sky-400" />
                                                                    <span>El terapeuta está formulando la pregunta inicial...</span>
                                                                </div>
                                                            )}
                                                            {currentChat.map((msg, idx) => (
                                                                <div key={idx} className={`flex flex-col gap-1.5 ${msg.role === 'assistant' ? 'items-start' : 'items-end'}`}>
                                                                    <div className={`p-3 rounded-xl text-[11px] md:text-[12px] leading-relaxed max-w-[90%] shadow-md ${msg.role === 'assistant' ? 'bg-sky-500/10 border border-sky-500/20 text-sky-100 rounded-tl-sm' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-100 rounded-tr-sm'}`}>
                                                                        {msg.content}
                                                                        {msg.newNodeAdded && (
                                                                            <div className="mt-2 pt-2 border-t border-sky-500/30">
                                                                                <span className="text-[10px] font-mono font-bold text-amber-400 flex items-center gap-1"><Sparkles size={12}/> NUEVO PATRÓN DETECTADO: {msg.newNodeAdded.label}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            {currentChat.length > 0 && isGeneratingExplorations && (
                                                                <div className="flex items-center gap-2 text-[10px] text-zinc-400 italic">
                                                                    <Sparkles size={12} className="animate-spin text-sky-400" />
                                                                    <span>Analizando tu respuesta...</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        
                                                        {/* Input area */}
                                                        <div className="flex flex-col gap-2 shrink-0 pt-1">
                                                            <textarea 
                                                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-[11px] md:text-[12px] text-white placeholder-zinc-500 focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 outline-none resize-none custom-scroll min-h-[60px]"
                                                                rows={2}
                                                                placeholder={isGeneratingExplorations ? "Esperando al terapeuta..." : "Escribe tu reflexión aquí..."}
                                                                value={explorationResponse}
                                                                disabled={isGeneratingExplorations}
                                                                onChange={(e) => {
        const val = e.target.value;
        setExplorationResponse(val);
        let activeId = null;
        if (mapViewTab === 'map' && tourActiveIndex !== null && sortedTourNodes[tourActiveIndex]) {
            activeId = sortedTourNodes[tourActiveIndex].id;
        } else if (selectedNode) {
            activeId = selectedNode.id;
        }
        if (activeId) {
            localStorage.setItem('draft_' + activeId + '_' + (selectedQuestionIndex || 0), val);
        }
    }}
                                                                onMouseDown={e => e.stopPropagation()}
                                                                onClick={e => e.stopPropagation()}
                                                                onTouchStart={e => e.stopPropagation()}
                                                                onKeyDown={(e) => {
                                                                    e.stopPropagation();
                                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                                        e.preventDefault();
                                                                        if (explorationResponse.trim() && !isGeneratingExplorations) {
                                                                            continueNodeExploration(currentNode, explorationResponse.trim());
                                                                        }
                                                                    }
                                                                }}
                                                            />
                                                            <div className="flex justify-end">
                                                                <button
                                                                    type="button"
                                                                    disabled={isGeneratingExplorations || !explorationResponse.trim()}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (explorationResponse.trim() && !isGeneratingExplorations) {
                                                                            continueNodeExploration(currentNode, explorationResponse.trim());
                                                                        }
                                                                    }}
                                                                    className="flex items-center justify-center w-full md:w-auto gap-2 py-2.5 px-5 rounded-xl text-[10px] md:text-[11px] font-black tracking-widest uppercase bg-sky-500/20 border border-sky-500/30 text-sky-400 hover:bg-sky-500/30 hover:border-sky-400 transition-all disabled:opacity-50 disabled:grayscale"
                                                                >
                                                                    {isGeneratingExplorations ? 'ENVIANDO...' : 'ENVIAR RESPUESTA'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                            </div>
                                            {/* Footer Navigation */}
                                            <div className="flex items-center justify-between border-t border-white/5 pt-2 mt-0.5">
                                                <button
                                                    onClick={prevTourNode}
                                                    disabled={tourActiveIndex === 0}
                                                    className="w-10 h-8 bg-zinc-900 border border-white/5 hover:border-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none"
                                                    title="Atrás"
                                                >
                                                    <ChevronLeft size={14} />
                                                </button>
                                                
                                                <button
                                                    onClick={nextTourNode}
                                                    disabled={tourActiveIndex === sortedTourNodes.length - 1}
                                                    className="w-10 h-8 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white transition-colors flex items-center justify-center shadow-md shadow-indigo-600/10 disabled:opacity-30 disabled:pointer-events-none"
                                                    title="Siguiente"
                                                >
                                                    <ChevronRight size={14} />
                                                </button>
                                            </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}

                        </div>

                        {/* MÓDULO 2: RASGOS PID-5 E INTEGRACIÓN CLÍNICA (Abajo del mapa) */}
                        {false && (
                            <div className="absolute top-[140px] bottom-[80px] md:bottom-6 right-4 md:right-6 w-[450px] max-w-[calc(100vw-2rem)] md:max-w-[calc(100vw-3rem)] z-[200] bg-zinc-950/95 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-6 overflow-y-auto animate-in slide-in-from-right-8 shadow-2xl pointer-events-auto custom-scroll flex flex-col gap-6"><div className="flex items-center justify-between shrink-0"><h3 className="text-lg font-black text-white">Diagnóstico Clínico</h3><button onClick={() => setMapViewTab('map')} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-white transition-colors"><X size={16} /></button></div>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
                                    <div>
                                        <h2 className="text-base font-black uppercase tracking-widest text-white/80 flex items-center gap-2">
                                            <Target size={18} className="text-indigo-400" /> Perfil de Rasgos PID-5 e Integración Funcional
                                        </h2>
                                        <p className="text-xs text-zinc-400 uppercase tracking-wider font-mono mt-1">
                                            Análisis de correspondencia entre rasgos de personalidad y bucles de mantenimiento del mapa
                                        </p>
                                    </div>
                                    <div className="px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs font-mono text-indigo-300 uppercase tracking-wider font-bold">
                                        Integración Sistémica
                                    </div>
                                </div>

                                {/* Grid de 2 Columnas: Izquierda Gráficos de Rasgos, Derecha Análisis Conjunto */}
                                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                                    {/* Column 1: Progress Bars (xl:col-span-5) */}
                                    <div className="xl:col-span-5 space-y-3.5">
                                        {[
                                            { id: 'reactividad', label: 'Reactividad', desc: 'Activación fisiológica y alerta autonómica.' },
                                            { id: 'conexion', label: 'Conexión', desc: 'Aislamiento interpersonal vs red de apoyo.' },
                                            { id: 'asertividad', label: 'Asertividad', desc: 'Límites, auto-silenciamiento y sumisión.' },
                                            { id: 'ritmo', label: 'Ritmo', desc: 'Impulsividad vs perfeccionismo/control rígido.' },
                                            { id: 'singularidad', label: 'Singularidad', desc: 'Procesamiento cognitivo e ideas de insuficiencia.' }
                                        ].map(dom => {
                                            const score = pidIndices.raw[dom.id];
                                            const status = pidIndices.status[dom.id];
                                            return (
                                                <div key={dom.id} className="relative bg-black/30 border border-white/[0.02] p-3 rounded-xl hover:border-white/10 transition-all duration-300">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <div>
                                                            <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider">{dom.label}</span>
                                                            <p className="text-[10px] text-zinc-500 font-sans mt-0.5">{dom.desc}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-zinc-400 font-mono">{status.label}</span>
                                                            <span className={`text-xs font-mono font-bold ${status.color.split(' ')[0]}`}>{Math.round(score * 100)}%</span>
                                                        </div>
                                                    </div>
                                                    <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden mt-2">
                                                        <div className={`h-full ${status.fill} rounded-full transition-all duration-500`} style={{ width: `${score * 100}%` }} />
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>

                                    {/* Column 2: Análisis Funcional Conjunto (xl:col-span-7) */}
                                    <div className="xl:col-span-7 flex flex-col justify-between bg-black/20 border border-white/[0.02] rounded-2xl p-4.5">
                                        <div>
                                            <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-3 flex items-center gap-1.5">
                                                <Brain size={14} /> Análisis de Correspondencia Funcional
                                            </h3>
                                            <div className="space-y-4 text-xs md:text-sm text-zinc-300 leading-relaxed font-sans max-h-[380px] overflow-y-auto pr-2 custom-sidebar-scroll">

                                                {/* Reactividad explanation */}
                                                <div className="border-l-2 border-orange-500/50 pl-3">
                                                    <p className="font-bold text-orange-400 uppercase tracking-wider text-[10px] mb-0.5">
                                                        Reactividad ({Math.round(pidIndices.raw.reactividad * 100)}%) &rarr; Vulnerabilidad Fisiológica
                                                    </p>
                                                    <p className="text-zinc-300 text-xs italic">
                                                        {pidIndices.raw.reactividad > 0.7
                                                            ? "Vulnerabilidad fisiológica crítica. Funciona como el catalizador primario de tus arquitecturas de pánico. El sistema neurovegetativo hiper-responde ante umbrales mínimos de estrés, forzando respuestas motoras de escape (evitación) y sesgando la percepción cognitiva hacia la amenaza inminente, cerrando el bucle de mantenimiento."
                                                            : pidIndices.raw.reactividad > 0.4
                                                                ? "Modulación somática selectiva. La tensión corporal no es una constante, pero actúa como un amplificador resonante en situaciones específicas. Tus bucles se retroalimentan fisiológicamente solo bajo presión umbral interpersonal o de evaluación."
                                                                : "Resiliencia autonómica estructural. El mantenimiento de tus patrones patológicos no depende de descargas somáticas severas. La carga del bucle se procesa casi enteramente en las esferas cognitivas y conductuales, preservando la homeostasis biológica."}
                                                    </p>
                                                </div>

                                                {/* Conexión explanation */}
                                                <div className="border-l-2 border-amber-500/50 pl-3">
                                                    <p className="font-bold text-amber-400 uppercase tracking-wider text-[10px] mb-0.5">
                                                        Conexión ({Math.round(pidIndices.raw.conexion * 100)}%) &rarr; Dimensión Relacional
                                                    </p>
                                                    <p className="text-zinc-300 text-xs italic">
                                                        {pidIndices.raw.conexion > 0.7
                                                            ? "Desvinculación sistémica profunda. Este rasgo estructura bucles de reforzamiento negativo a través del auto-aislamiento. La percepción distorsionada de hostilidad ambiental bloquea los canales de corregulación externa, convirtiendo a la soledad en un mecanismo de seguridad paralizante."
                                                            : pidIndices.raw.conexion > 0.4
                                                                ? "Filtro relacional restrictivo. Operas bajo arquitecturas de vinculación selectiva donde la confianza está condicionada. El mapa refleja bucles de evitación preventiva para minimizar el impacto del desgaste interpersonal."
                                                                : "Permeabilidad relacional funcional. Conservas alta plasticidad para vincularte. Los nodos de tu mapa conductual pueden ser reconfigurados utilizando tus redes de apoyo como infraestructura de contención primaria frente al estrés."}
                                                    </p>
                                                </div>

                                                {/* Asertividad explanation */}
                                                <div className="border-l-2 border-emerald-500/50 pl-3">
                                                    <p className="font-bold text-emerald-400 uppercase tracking-wider text-[10px] mb-0.5">
                                                        Asertividad ({Math.round(pidIndices.raw.asertividad * 100)}%) &rarr; Sumisión vs Oposición
                                                    </p>
                                                    <p className="text-zinc-300 text-xs italic">
                                                        {pidIndices.raw.asertividad > 0.7
                                                            ? "Oposición compensatoria crónica. La asertividad se ha hipertrofiado hacia la confrontación preventiva. Tus bucles de mantenimiento utilizan el antagonismo o la rigidez defensiva como escudo motor para evitar la invalidación emocional."
                                                            : pidIndices.raw.asertividad > 0.4
                                                                ? "Fluctuación de límites estructurales. Experimentas intermitencia en la defensa del self. Bajo ciertos bucles, emerges proactivo; en otros, la asertividad colapsa, resultando en respuestas mixtas de sumisión-hostilidad pasiva."
                                                                : "Inhibición volitiva y auto-silenciamiento. Rasgo nuclear que alimenta bucles de complacencia patológica y acumulación somática de resentimiento. El self cede su territorio constantemente, priorizando la reducción del conflicto externo a costa de la implosión psicológica."}
                                                    </p>
                                                </div>

                                                {/* Ritmo explanation */}
                                                <div className="border-l-2 border-teal-500/50 pl-3">
                                                    <p className="font-bold text-teal-400 uppercase tracking-wider text-[10px] mb-0.5">
                                                        Ritmo ({Math.round(pidIndices.raw.ritmo * 100)}%) &rarr; Regulación de Impulso vs Rigidez
                                                    </p>
                                                    <p className="text-zinc-300 text-xs italic">
                                                        {pidIndices.raw.ritmo > 0.7
                                                            ? "Desregulación de inhibición volitiva. Exceso de urgencia conductual que alimenta secuencias de gratificación o resolución inmediata. El bucle se acelera, saltando del gatillo cognitivo a la acción impulsiva sin procesamiento analítico intermedio."
                                                            : pidIndices.raw.ritmo > 0.4
                                                                ? "Homeostasis ejecutiva fluctuante. Se observa un equilibrio razonable en la planificación general, aunque el mapa de bucles revela 'puntos de quiebre' donde la urgencia domina ante estresores específicos de alta carga."
                                                                : "Rigidez ejecutiva y perfeccionismo inhibitorio. El control se ha convertido en una cárcel procedimental. Tus bucles se estancan en la rumiación obsesiva y la parálisis por análisis, prefiriendo la inacción al margen de error."}
                                                    </p>
                                                </div>

                                                {/* Singularidad explanation */}
                                                <div className="border-l-2 border-purple-500/50 pl-3">
                                                    <p className="font-bold text-purple-400 uppercase tracking-wider text-[10px] mb-0.5">
                                                        Singularidad ({Math.round(pidIndices.raw.singularidad * 100)}%) &rarr; Idiosincrasia Cognitiva
                                                    </p>
                                                    <p className="text-zinc-300 text-xs italic">
                                                        {pidIndices.raw.singularidad > 0.7
                                                            ? "Idiosincrasia cognitiva disonante. Estructuras esquemas de realidad altamente paralelos o excéntricos. En el mapa conductual, esto genera interpretaciones anómalas que cristalizan en sistemas de creencias inflexibles (hiper-vigilancia, distorsiones de persecución o insuficiencia estructural)."
                                                            : pidIndices.raw.singularidad > 0.4
                                                                ? "Procesamiento cognitivo divergente. La excentricidad adaptativa te provee ángulos de interpretación únicos, pero interfiere intermitentemente provocando que asumas responsabilidades imaginarias o percibas juicios donde no los hay."
                                                                : "Integración normativa del esquema. El procesamiento de la realidad está anclado en métricas sistémicas compartidas. Tus trampas cognitivas son ortodoxas (ej. autoexigencia estándar) y responden a dinámicas convencionales de aprendizaje relacional."}
                                                    </p>
                                                </div>

                                            </div>
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-white/5 text-[10px] text-zinc-500 font-mono italic">
                                            Nota: Los porcentajes representan la presencia relativa de cada rasgo según el test PID-5. Su manifestación práctica está conectada dinámicamente con los nodos del mapa conductual superior.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}


                    </div>
                )}
            </div>

</div>
    );
};

export default MyResponsesDashboard;






