import React, { useState, useEffect } from 'react';
import { BookOpen, Check, ArrowRight } from 'lucide-react';

export const BIO_QUESTIONS = [
    // ─── I. PRESENTACIÓN ───
    {
        section: "PRESENTACIÓN",
        title: "Tu nombre",
        text: "¿Cómo te llamas o cómo te gusta que te digan?",
        placeholder: "Escribe aquí tu nombre o el alias con el que te sientas más cómodo..."
    },
    {
        section: null,
        title: "Tu momento actual",
        text: "¿Cuántos años tienes y a qué le dedicas tu tiempo en el día a día?",
        placeholder: "Ej: \"24 años, estudiante de diseño y hago música\", \"32 años, trabajo en ventas\", \"28 años, en transición buscando qué rumbo tomar\"..."
    },

    // ─── II. ¿QUÉ ONDA CONTIGO HOY? ───
    {
        section: "¿QUÉ ONDA CONTIGO HOY?",
        title: "¿Qué te trae por aquí?",
        text: "¿Qué sientes que traes atorado en la cabeza o qué te motivó a entrar a este espacio?",
        placeholder: "Ej: \"Siento que ando muy acelerado y me cuesta desconectar\", \"Me siento abrumado sin una razón clara\", \"Quiero un espacio para reflexionar y poner orden en mis ideas\"..."
    },
    {
        section: null,
        title: "¿Cómo te está pegando?",
        text: "¿En qué partes de tu rutina o tus días sientes que más te afecta esto?",
        placeholder: "Ej: \"Me cuesta un montón concentrarme\", \"Tengo insomnio y fatiga constante\", \"Me dan ganas de aislarme y no hablar con nadie\"..."
    },
    {
        section: null,
        title: "El tiempo que llevas con esto",
        text: "¿Desde hace cuánto vienes sintiendo o notando esta situación?",
        placeholder: "Ej: \"Desde hace como 3 meses por cambios en mi vida\", \"A raíz de una pérdida o ruptura\", \"Siento que es algo que traigo desde la adolescencia\"..."
    },
    {
        section: null,
        title: "¿De dónde sientes que viene?",
        text: "Si tuvieras que adivinar o ponerle nombre, ¿con qué sientes que tiene que ver?",
        placeholder: "Ej: \"Con exigirme demasiado y no descansar\", \"Me cuesta procesar y decir lo que siento\", \"La neta no tengo idea y por eso quiero explorarlo\"..."
    },

    // ─── III. CUERPO, MENTE Y DESCANSO ───
    {
        section: "CUERPO, MENTE Y DESCANSO",
        title: "Diagnósticos o valoraciones",
        text: "¿Alguna vez te han diagnosticado con algo en psicología o psiquiatría, o es tu primera aproximación?",
        placeholder: "Ej: \"Me diagnosticaron ansiedad hace un año\", \"Ninguno, es la primera vez que busco un espacio así\", \"Tratamiento médico por migraña/tensión\"..."
    },
    {
        section: null,
        title: "Salud física",
        text: "¿Te has hecho algún estudio médico, neurológico o chequeo general recientemente?",
        placeholder: "Ej: \"Ninguno reciente, todo bien\", \"Análisis de sangre generales hace poco\", \"Chequeo de vista o salud auditiva\"..."
    },
    {
        section: null,
        title: "Horas de sueño",
        text: "¿Cómo anda tu descanso? ¿Cuántas horas sueles dormir y qué tan reparador lo sientes?",
        placeholder: "Ej: \"Unas 6 horas pero me despierto con cansancio\", \"Varía mucho, de 5 a 8 horas dependiendo de la semana\"..."
    },
    {
        section: null,
        title: "Detalles al dormir",
        text: "¿Tienes alguna dificultad específica para conciliar el sueño o durante la noche?",
        placeholder: "Ej: \"La cabeza no para de dar vueltas al acostarme\", \"Me despierto a mitad de la noche sin motivo\", \"Tengo sueño muy ligero\"..."
    },

    // ─── IV. TU MUNDO SONORO ───
    {
        section: "TU MUNDO SONORO",
        title: "Música y silencio",
        text: "¿Qué papel juega la música o el silencio en tu día a día?",
        placeholder: "Ej: \"Siempre traigo audífonos para regular mi estado de ánimo\", \"Casi no escucho música, prefiero el silencio\", \"Me gusta mucho pero a veces me satura el ruido\"..."
    },
    {
        section: null,
        title: "Sonidos que te saturan",
        text: "¿Hay algún sonido, frecuencia o tipo de ruido que te desespere o te ponga de malas?",
        placeholder: "Ej: \"Los ruidos repetitivos de la calle\", \"Gritos, tonos muy agudos o volumen caótico\", \"Casi nada en especial\"..."
    },
    {
        section: null,
        title: "Tus formas de desconectar",
        text: "Cuando necesitas bajar revoluciones o conectar contigo, ¿qué cosas te ayudan?",
        placeholder: "Ej: \"Salir a caminar escuchando algo tranquilo\", \"Hacer respiraciones\", \"Dibujar o escribir\", \"La verdad me cuesta mucho trabajo relajarme\"..."
    },

    // ─── V. EXPERIENCIAS Y ACOMPAÑAMIENTO ───
    {
        section: "EXPERIENCIAS Y ACOMPAÑAMIENTO",
        title: "Acompañamientos previos",
        text: "¿Has llevado algún proceso de terapia o acompañamiento antes? ¿Cómo fue tu experiencia?",
        placeholder: "Ej: \"Fui a terapia hace un año por unos meses\", \"Nunca he ido, es mi primera vez\", \"Procesos intermitentes cuando lo necesito\"..."
    },
    {
        section: null,
        title: "Herramientas o prácticas alternativas",
        text: "¿Acostumbras o has probado herramientas alternativas de introspección (plantas, microdosis, meditación, etc.)?",
        placeholder: "Ej: \"Cannabis ocasional para relajarme\", \"Microdosis por cuenta propia para enfocarme\", \"Meditación o ceremonias\", \"No uso nada de eso\"..."
    },
    {
        section: null,
        title: "Tratamientos o medicamentos",
        text: "¿Tomas actualmente algún medicamento o suplemento diario que sientas importante mencionar?",
        placeholder: "Ej: \"Medicamento recetado por especialista\", \"Suplementos o adaptógenos para el enfoque\", \"Ninguno actualmente\"..."
    },
];

export function BiographicInterview({ username, activeVersion = 1, onComplete, onClose }) {
    const [isStarted, setIsStarted] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    
    const draftKey = `oasis_bio_draft_${username || 'Invitado'}_v${activeVersion}`;
    const [answers, setAnswers] = useState(() => {
        try {
            const saved = localStorage.getItem(draftKey);
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            return {};
        }
    });

    useEffect(() => {
        if (Object.keys(answers).length > 0) {
            localStorage.setItem(draftKey, JSON.stringify(answers));
        }
    }, [answers, draftKey]);

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
            localStorage.removeItem(draftKey);
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
                                Este es un espacio tranquilo para conocerte mejor: qué te mueve, cómo andas y qué buscas en tu día a día. No hay respuestas correctas ni incorrectas; responde a tu propio ritmo con lo que sientas más tuyo.
                            </p>
                        </div>
                        <div className="pt-3 md:pt-6">
                            <button
                                onClick={() => setIsStarted(true)}
                                className="w-full py-4 rounded-xl md:rounded-2xl bg-emerald-900/40 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-600 hover:text-black font-black uppercase tracking-[0.2em] transition-all shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:scale-[1.02] text-[10px] md:text-xs"
                            >
                                Entrar al espacio
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
