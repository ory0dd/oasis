import React, { useState, useEffect } from 'react';
import { BookOpen, Check, ArrowRight } from 'lucide-react';

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

    // Track dwell times
    const [dwellTimes, setDwellTimes] = useState({});
    const [startTime, setStartTime] = useState(null);

    useEffect(() => {
        if (isStarted) {
            setStartTime(Date.now());
        }
    }, [isStarted, currentIndex]);

    const handleNext = () => {
        const elapsed = Date.now() - startTime;
        setDwellTimes(prev => ({
            ...prev,
            [currentIndex]: (prev[currentIndex] || 0) + elapsed
        }));

        if (currentIndex < BIO_QUESTIONS.length - 1) {
            setCurrentIndex(prev => prev + 1);
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

    const handleTextChange = (e) => {
        setAnswers(prev => ({ ...prev, [currentIndex]: e.target.value }));
    };

    if (!isStarted) {
        return (
            <div className="fixed inset-0 z-[3000] bg-black/40 backdrop-blur-md overflow-y-auto flex flex-col pt-10 md:pt-20 px-4">
                <div className="w-full max-w-3xl mx-auto space-y-3 md:space-y-8 animate-in slide-in-from-bottom duration-500">
                    <div className="flex justify-between items-center border-b border-white/5 pb-2 md:pb-4">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400">Entrevista Biográfica</span>
                    <button onClick={onClose} className="text-[8px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">Salir</button>
                </div>

                <div className="bg-zinc-950/40 border border-white/5 rounded-2xl md:rounded-[2.5rem] p-4 sm:p-6 md:p-12 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] pointer-events-none rounded-full" />
                    
                    <div className="space-y-4 md:space-y-8 relative z-10">
                        <div className="space-y-2 md:space-y-4">
                            <h2 className="text-lg md:text-3xl font-serif italic text-white leading-tight tracking-tight">Antes de comenzar...</h2>
                            <p className="text-xs md:text-lg text-zinc-300 font-sans leading-relaxed">
                                "El objetivo de esta entrevista es recopilar datos esenciales sobre tu historia clínica. Puedes escribir tus respuestas de forma clara y directa, tomándote el tiempo necesario para reflexionar sobre cada pregunta. Al finalizar, tus respuestas se guardarán de forma segura."
                            </p>
                        </div>
                        <div className="pt-3 md:pt-6">
                            <button
                                onClick={() => setIsStarted(true)}
                                className="w-full py-4 rounded-xl md:rounded-2xl bg-emerald-900/40 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-600 hover:text-black font-black uppercase tracking-[0.2em] transition-all shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:scale-[1.02] text-[10px] md:text-xs"
                            >
                                Iniciar Entrevista
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[3000] bg-black/40 backdrop-blur-md overflow-y-auto flex flex-col pt-10 md:pt-20 px-4 pb-8">
            <div className="w-full max-w-3xl mx-auto space-y-4 animate-in slide-in-from-bottom duration-500 h-full flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center mb-2 px-2">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400 shrink-0">
                        <BookOpen size={14} />
                    </div>
                    <span className="text-[10px] font-mono uppercase text-zinc-400 tracking-widest">Tarjeta {currentIndex + 1} de {BIO_QUESTIONS.length}</span>
                </div>
                <button onClick={onClose} className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-full shrink-0">Salir</button>
            </div>

            {/* Main Content Card */}
            <div className="flex-1 bg-zinc-950/40 border border-white/5 rounded-3xl p-5 md:p-10 shadow-2xl relative overflow-hidden flex flex-col">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[80px] pointer-events-none rounded-full" />
                
                {/* Question Area */}
                <div className="relative z-10 mb-6">
                    {BIO_QUESTIONS[currentIndex].section && (
                        <span className="inline-block mb-3 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-black uppercase tracking-[0.2em] text-emerald-400">
                            {BIO_QUESTIONS[currentIndex].section}
                        </span>
                    )}
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400/70 mb-2">{BIO_QUESTIONS[currentIndex].title}</h4>
                    <p className="text-xl md:text-3xl font-serif italic text-white/90 leading-relaxed">{BIO_QUESTIONS[currentIndex].text}</p>
                </div>

                {/* Input Area */}
                <div className="relative z-10 flex-1 flex flex-col gap-4">
                    <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 transition-all focus-within:border-emerald-500/50 focus-within:bg-emerald-950/20 flex flex-col">
                        <textarea
                            value={answers[currentIndex] || ''}
                            onChange={handleTextChange}
                            placeholder={BIO_QUESTIONS[currentIndex].placeholder}
                            className="w-full h-full bg-transparent text-sm md:text-base text-zinc-200 font-sans leading-relaxed resize-none focus:outline-none placeholder:text-zinc-600 min-h-[150px]"
                        />
                    </div>
                    
                    <button
                        onClick={handleNext}
                        disabled={!(answers[currentIndex]?.trim())}
                        className={`py-4 rounded-2xl flex items-center justify-center gap-2 transition-all border ${
                            (answers[currentIndex]?.trim())
                            ? 'bg-emerald-600 border-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:bg-emerald-500'
                            : 'bg-white/5 border-white/10 text-zinc-600 opacity-50'
                        }`}
                    >
                        <span className="text-[11px] font-black uppercase tracking-widest">{currentIndex === BIO_QUESTIONS.length - 1 ? 'Finalizar Entrevista' : 'Siguiente'}</span>
                        {currentIndex === BIO_QUESTIONS.length - 1 ? <Check size={16} /> : <ArrowRight size={16} />}
                    </button>
                </div>
            </div>
            
            {/* Bottom Progress bar */}
            <div className="w-full max-w-xl mx-auto pt-4 border-t border-white/5 flex flex-col gap-2 relative z-10 px-4">
                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-zinc-500 font-mono">
                    <span>Progreso</span>
                    <span>{Math.round(((currentIndex + 1) / BIO_QUESTIONS.length) * 100)}%</span>
                </div>
                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${((currentIndex + 1) / BIO_QUESTIONS.length) * 100}%` }} />
                </div>
                </div>
            </div>
        </div>
    );
}
