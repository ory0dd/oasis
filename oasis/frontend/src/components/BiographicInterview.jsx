import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Check, ArrowRight, PenLine, X, ChevronLeft } from 'lucide-react';

export const BIO_QUESTIONS = [
    // ─── I. FICHA DE IDENTIFICACIÓN BÁSICA ───
    {
        section: "FICHA DE IDENTIFICACIÓN",
        title: "Nombre completo",
        text: "Nombre completo del / de la consultante",
        placeholder: "Escribe tu nombre completo aquí..."
    },
    {
        section: null,
        title: "Datos básicos",
        text: "Edad y ocupación / actividad actual",
        placeholder: "Ej: \"28 años, estudiante de diseño\", \"42 años, gerente de ventas\", \"35 años, en transición laboral\"..."
    },

    // ─── II. MOTIVO DE CONSULTA E IMPACTO EMOCIONAL ───
    {
        section: "MOTIVO DE CONSULTA",
        title: "Motivo de consulta",
        text: "Describa brevemente el motivo de consulta",
        placeholder: "Ej: \"Siento mucha ansiedad en el trabajo y me cuesta desconectarme\", \"Me siento abrumado emocionalmente sin una causa clara\", \"Busco un espacio de introspección y claridad mental\"..."
    },
    {
        section: null,
        title: "Repercusiones",
        text: "Repercusiones o impacto que ha tenido debido a este motivo",
        placeholder: "Ej: \"Me cuesta mucho concentrarme\", \"Tengo insomnio y fatiga constante\", \"Me he estado aislando de mis círculos cercanos\"..."
    },
    {
        section: null,
        title: "Temporalidad",
        text: "¿Desde cuándo se presenta dicha problemática?",
        placeholder: "Ej: \"Desde hace 6 meses por un cambio de puesto\", \"A raíz de una pérdida hace un año\", \"Es una constante desde la adolescencia\"..."
    },
    {
        section: null,
        title: "Atribución",
        text: "¿A qué atribuye o con qué asocia la problemática?",
        placeholder: "Ej: \"Al exceso de carga laboral y falta de descanso\", \"A dificultades para procesar y expresar mis emociones\", \"No tengo claridad de la causa exacta\"..."
    },

    // ─── III. HISTORIAL DE SALUD Y SUEÑO ───
    {
        section: "HISTORIAL DE SALUD Y SUEÑO",
        title: "Diagnóstico clínico",
        text: "¿Cuenta con algún diagnóstico clínico o psicológico actual? ¿Quién se lo otorgó?",
        placeholder: "Ej: \"Ansiedad generalizada, diagnosticado por psiquiatra\", \"Ninguno, es mi primera aproximación a un proceso\", \"Migraña tensional crónica, por neurólogo\"..."
    },
    {
        section: null,
        title: "Estudios de salud",
        text: "¿Le han realizado algún estudio de salud o neurológico reciente?",
        placeholder: "Ej: \"Ninguno\", \"Análisis de sangre generales hace tres meses\", \"Audiometría o revisión de salud auditiva\"..."
    },
    {
        section: null,
        title: "Historial del sueño",
        text: "Horas promedio y calidad del descanso",
        placeholder: "Ej: \"Entre 5 y 6 horas de forma intermitente\", \"Varía mucho, de 4 a 8 horas dependiendo del nivel de estrés\"..."
    },
    {
        section: null,
        title: "Dificultades del sueño",
        text: "Dificultades específicas en el ciclo del sueño",
        placeholder: "Ej: \"Me cuesta conciliar el sueño por ruidos o rumiación de pensamientos\", \"Despertares nocturnos frecuentes\", \"Sueño muy ligero, no logro descansar\"..."
    },

    // ─── IV. PERFIL SONORO E IDENTIDAD MUSICAL ───
    {
        section: "PERFIL SONORO E IDENTIDAD MUSICAL",
        title: "Relación con la música",
        text: "¿Cómo describirías tu relación actual con la música y el silencio?",
        placeholder: "Ej: \"Uso la música para regular mi día y mis estados de ánimo\", \"Casi no escucho música, prefiero habitar el silencio\", \"La música me acompaña siempre, pero a veces me satura\"..."
    },
    {
        section: null,
        title: "Sonidos de rechazo",
        text: "¿Existe algún sonido, género musical o frecuencia que te genere rechazo, irritabilidad o ansiedad?",
        placeholder: "Ej: \"Los sonidos agudos o ritmos muy repetitivos me desesperan\", \"Los ruidos fuertes e imprevistos de la calle\", \"Ninguno en especial\"..."
    },
    {
        section: null,
        title: "Herramientas de relajación",
        text: "¿Qué herramientas, hábitos o actividades utilizas para intentar relajarte o conectar contigo mismo?",
        placeholder: "Ej: \"Escucho podcasts o ruidos blancos para dormir\", \"Ejercicios de respiración ocasionales\", \"Ninguna, me cuesta mucho trabajo entrar en estados de relajación\"..."
    },

    // ─── V. HISTORIAL TERAPÉUTICO Y PRÁCTICAS COMPLEMENTARIAS ───
    {
        section: "HISTORIAL TERAPÉUTICO",
        title: "Procesos terapéuticos previos",
        text: "¿Qué tipo de procesos terapéuticos o de acompañamiento ha llevado previamente y con qué frecuencia?",
        placeholder: "Ej: \"Psicoterapia cognitivo-conductual hace un año\", \"Ninguna previa\", \"Procesos de psicoterapia intermitentes\"..."
    },
    {
        section: null,
        title: "Sustancias y herramientas alternativas",
        text: "¿Utiliza o ha utilizado alguna sustancia, planta médica o herramienta alternativa con fines terapéuticos o de introspección?",
        placeholder: "Ej: \"Microdosis de psilocibina por cuenta propia para la ansiedad\", \"Cannabis para conciliar el sueño\", \"Experiencias en ceremonias de introspección\", \"Ninguno\"..."
    },
    {
        section: null,
        title: "Tratamiento farmacológico activo",
        text: "¿Existe algún tratamiento médico o farmacológico activo que crea importante mencionar?",
        placeholder: "Ej: \"Tratamiento farmacológico recetado por psiquiatra\", \"Uso diario de adaptógenos (Reishi, Melena de León) para el enfoque\", \"Ninguno\"..."
    },
];

export function BiographicInterview({ username, activeVersion = 1, onComplete, onClose }) {
    const [isStarted, setIsStarted] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [isWriting, setIsWriting] = useState(false);
    const [dwellTimes, setDwellTimes] = useState({});
    const [startTime, setStartTime] = useState(null);
    const textareaRef = useRef(null);

    useEffect(() => {
        if (isStarted) setStartTime(Date.now());
    }, [isStarted, currentIndex]);

    // Auto-focus textarea when writing modal opens
    useEffect(() => {
        if (isWriting && textareaRef.current) {
            setTimeout(() => textareaRef.current?.focus(), 100);
        }
    }, [isWriting]);

    const handleNext = () => {
        const elapsed = Date.now() - startTime;
        setDwellTimes(prev => ({
            ...prev,
            [currentIndex]: (prev[currentIndex] || 0) + elapsed
        }));

        if (currentIndex < BIO_QUESTIONS.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setIsWriting(false);
        } else {
            const patientName = username || 'Invitado';
            const suffix = activeVersion > 1 ? `_v${activeVersion}` : '';
            const bioMetadata = {
                evaluationDate: new Date().toISOString(),
                userFullName: localStorage.getItem('oasis_fullname_' + patientName) || '',
                userAge: localStorage.getItem('oasis_age_' + patientName) ? parseInt(localStorage.getItem('oasis_age_' + patientName), 10) : null
            };

            BIO_QUESTIONS.forEach((q, idx) => {
                const text = answers[idx] || '';
                const words = text.trim().split(/\s+/).filter(Boolean).length;
                bioMetadata[idx] = {
                    dwellTime: Math.round((dwellTimes[idx] || 0) / 1000),
                    pauses: 0,
                    words: words
                };
            });

            localStorage.setItem(`oasis_bio_metadata_${patientName}${suffix}`, JSON.stringify(bioMetadata));
            onComplete(answers);
        }
    };

    const currentQ = BIO_QUESTIONS[currentIndex];
    const currentAnswer = answers[currentIndex] || '';
    const hasAnswer = currentAnswer.trim().length > 0;
    const progress = ((currentIndex + 1) / BIO_QUESTIONS.length) * 100;

    // ── PANTALLA DE INICIO ──
    if (!isStarted) {
        return (
            <div className="fixed inset-0 z-[3000] bg-black/70 backdrop-blur-xl flex flex-col items-center justify-center px-6">
                <div className="w-full max-w-sm space-y-8 animate-in slide-in-from-bottom duration-500">
                    {/* Icon */}
                    <div className="flex justify-center">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center">
                            <BookOpen size={28} className="text-emerald-400" />
                        </div>
                    </div>

                    {/* Text */}
                    <div className="text-center space-y-3">
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-400">Entrevista Biográfica</p>
                        <h2 className="text-2xl font-serif italic text-white leading-snug">Antes de comenzar...</h2>
                        <p className="text-sm text-zinc-400 leading-relaxed">
                            Responde con calma. Tus respuestas se guardan de forma segura al finalizar.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                        <button
                            onClick={() => setIsStarted(true)}
                            className="w-full py-5 rounded-2xl bg-emerald-600 text-black font-black uppercase tracking-widest text-sm shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:bg-emerald-500 transition-all active:scale-95"
                        >
                            Iniciar
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-zinc-400 font-black uppercase tracking-widest text-xs hover:text-white transition-all active:scale-95"
                        >
                            Salir
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* ── PANTALLA PRINCIPAL: SOLO LA PREGUNTA ── */}
            <div className="fixed inset-0 z-[3000] bg-black/70 backdrop-blur-xl flex flex-col">
                {/* Glow */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-500/8 rounded-full blur-[100px]" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-safe pt-5 pb-3 relative z-10">
                    <div className="flex items-center gap-3">
                        {currentIndex > 0 && (
                            <button
                                onClick={() => { setCurrentIndex(prev => prev - 1); setIsWriting(false); }}
                                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white active:scale-90 transition-all"
                            >
                                <ChevronLeft size={18} />
                            </button>
                        )}
                        <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                            {currentIndex + 1} / {BIO_QUESTIONS.length}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 hover:text-white active:scale-90 transition-all"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Progress bar */}
                <div className="h-[2px] bg-white/5 mx-5 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Question — centro de la pantalla */}
                <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
                    {currentQ.section && (
                        <span className="mb-4 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-black uppercase tracking-[0.25em] text-emerald-400">
                            {currentQ.section}
                        </span>
                    )}

                    <p className="text-2xl sm:text-3xl font-serif italic text-white/90 leading-relaxed text-center max-w-sm">
                        {currentQ.text}
                    </p>

                    {/* Preview de lo que escribió si ya hay respuesta */}
                    {hasAnswer && (
                        <p className="mt-5 text-sm text-zinc-400 text-center leading-relaxed max-w-xs line-clamp-3">
                            {currentAnswer}
                        </p>
                    )}
                </div>

                {/* Bottom actions */}
                <div className="px-5 pb-safe pb-8 space-y-3 relative z-10">
                    {/* Botón escribir */}
                    <button
                        onClick={() => setIsWriting(true)}
                        className={`w-full py-5 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-sm transition-all active:scale-95 border ${
                            hasAnswer
                                ? 'bg-white/5 border-white/10 text-zinc-300 hover:text-white'
                                : 'bg-emerald-600 border-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:bg-emerald-500'
                        }`}
                    >
                        <PenLine size={18} />
                        {hasAnswer ? 'Editar respuesta' : 'Escribir respuesta'}
                    </button>

                    {/* Botón siguiente — solo si tiene respuesta */}
                    {hasAnswer && (
                        <button
                            onClick={handleNext}
                            className="w-full py-5 rounded-2xl flex items-center justify-center gap-3 bg-emerald-600 border border-emerald-500 text-black font-black uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:bg-emerald-500 transition-all active:scale-95"
                        >
                            <span>{currentIndex === BIO_QUESTIONS.length - 1 ? 'Finalizar' : 'Siguiente'}</span>
                            {currentIndex === BIO_QUESTIONS.length - 1 ? <Check size={18} /> : <ArrowRight size={18} />}
                        </button>
                    )}
                </div>
            </div>

            {/* ── MODAL DE ESCRITURA ── */}
            {isWriting && (
                <div className="fixed inset-0 z-[3100] bg-black/80 backdrop-blur-xl flex flex-col animate-in slide-in-from-bottom duration-300">
                    {/* Header del modal */}
                    <div className="flex items-center justify-between px-5 pt-safe pt-5 pb-4 border-b border-white/5">
                        <p className="text-xs text-zinc-400 font-serif italic leading-snug max-w-[220px] line-clamp-2">
                            {currentQ.text}
                        </p>
                        <button
                            onClick={() => setIsWriting(false)}
                            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white active:scale-90 transition-all shrink-0 ml-3"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Textarea */}
                    <div className="flex-1 p-5">
                        <textarea
                            ref={textareaRef}
                            value={currentAnswer}
                            onChange={(e) => setAnswers(prev => ({ ...prev, [currentIndex]: e.target.value }))}
                            placeholder={currentQ.placeholder}
                            className="w-full h-full bg-transparent text-base text-zinc-100 font-sans leading-relaxed resize-none focus:outline-none placeholder:text-zinc-600"
                        />
                    </div>

                    {/* Botón listo */}
                    <div className="px-5 pb-safe pb-6">
                        <button
                            onClick={() => setIsWriting(false)}
                            disabled={!hasAnswer}
                            className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all active:scale-95 border ${
                                hasAnswer
                                    ? 'bg-emerald-600 border-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.25)]'
                                    : 'bg-white/5 border-white/10 text-zinc-600 opacity-50'
                            }`}
                        >
                            Listo
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
