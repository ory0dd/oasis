import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, ArrowRight, User, AlertCircle, Sparkles, X, Lock, Camera, RefreshCw, Trash2, Upload, CheckCircle2, Image as ImageIcon } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL ||
    ((typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.') || window.location.hostname.startsWith('10.')))
        ? `http://${window.location.hostname}:5046`
        : 'https://oasis-production-6303.up.railway.app');

export default function InformedConsentModal({ user, onAccept, onCancel, initialFullName = "" }) {
    // If the registered name was an email or same as alias, start empty so user writes their real full name
    const [consultantName, setConsultantName] = useState(() => {
        if (initialFullName && initialFullName !== user && !initialFullName.includes('@')) {
            return initialFullName;
        }
        if (typeof window !== 'undefined' && user) {
            const savedConsent = localStorage.getItem(`oasis_consent_name_${user}`);
            if (savedConsent && savedConsent !== user && !savedConsent.includes('@')) return savedConsent;
            const savedFull = localStorage.getItem(`oasis_fullname_${user}`);
            if (savedFull && savedFull !== user && !savedFull.includes('@')) return savedFull;
        }
        return '';
    });

    const [isAccepted, setIsAccepted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // Photo capture states
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [capturedPhoto, setCapturedPhoto] = useState(() => {
        if (typeof window !== 'undefined' && user) {
            return localStorage.getItem(`oasis_consent_photo_${user}`) || null;
        }
        return null;
    });
    const [cameraError, setCameraError] = useState('');
    const [isTakingSnapshot, setIsTakingSnapshot] = useState(false);
    const [facingMode, setFacingMode] = useState('user'); // 'user' or 'environment'

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const fileInputRef = useRef(null);

    const currentDate = new Date().toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Handle camera stream setup
    const startCamera = async (facing = facingMode) => {
        setCameraError('');
        try {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                setCameraError('Tu navegador o dispositivo no soporta acceso directo a cámara. Puedes subir una foto desde tus archivos.');
                return;
            }
            const constraints = {
                video: {
                    facingMode: facing,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;
            setIsCameraActive(true);
            
            // Give react time to mount the video element
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play().catch(e => console.warn("Video play error:", e));
                }
            }, 100);
        } catch (err) {
            console.error("Error accessing camera:", err);
            setCameraError('No se pudo acceder a la cámara. Por favor concede permisos a la cámara en tu navegador o sube una fotografía desde tus archivos.');
            setIsCameraActive(false);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsCameraActive(false);
    };

    const toggleFacingMode = () => {
        const nextFacing = facingMode === 'user' ? 'environment' : 'user';
        setFacingMode(nextFacing);
        if (isCameraActive) {
            startCamera(nextFacing);
        }
    };

    // Clean up tracks when component unmounts
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
        };
    }, []);

    // Snap photo from video feed
    const takeSnapshot = () => {
        if (!videoRef.current) return;
        setIsTakingSnapshot(true);

        try {
            const video = videoRef.current;
            const canvas = canvasRef.current || document.createElement('canvas');
            const videoW = video.videoWidth || 640;
            const videoH = video.videoHeight || 480;

            // Target max width 720 for optimal performance and storage
            const scale = Math.min(1, 720 / videoW);
            canvas.width = Math.round(videoW * scale);
            canvas.height = Math.round(videoH * scale);

            const ctx = canvas.getContext('2d');
            if (ctx) {
                // If selfie facing, mirror horizontally
                if (facingMode === 'user') {
                    ctx.translate(canvas.width, 0);
                    ctx.scale(-1, 1);
                }
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                // Reset transformation
                if (facingMode === 'user') {
                    ctx.setTransform(1, 0, 0, 1, 0, 0);
                }

                // Add bottom watermark bar
                const barH = Math.max(34, Math.round(canvas.height * 0.08));
                ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
                ctx.fillRect(0, canvas.height - barH, canvas.width, barH);

                ctx.fillStyle = '#c084fc'; // purple-400
                ctx.font = `bold ${Math.max(10, Math.round(barH * 0.32))}px -apple-system, BlinkMacSystemFont, sans-serif`;
                ctx.fillText("OASIS ✨ SELFIE PARA RECORDAR EL MOMENTO", 12, canvas.height - (barH * 0.54));

                ctx.fillStyle = '#e4e4e7'; // zinc-200
                ctx.font = `${Math.max(9, Math.round(barH * 0.26))}px -apple-system, BlinkMacSystemFont, sans-serif`;
                const nameDisplay = consultantName.trim() ? `Firma digital: ${consultantName.trim()}` : `Firma digital: @${user}`;
                const dateDisplay = `${new Date().toLocaleDateString('es-MX')} ${new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;
                ctx.fillText(`${nameDisplay} | ${dateDisplay}`, 12, canvas.height - (barH * 0.2));

                const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
                setCapturedPhoto(dataUrl);
                stopCamera();
            }
        } catch (e) {
            console.error("Error capturing snapshot:", e);
            setCameraError("Error al capturar la imagen. Intenta de nuevo.");
        } finally {
            setTimeout(() => setIsTakingSnapshot(false), 200);
        }
    };

    // File upload fallback
    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = canvasRef.current || document.createElement('canvas');
                const maxWidth = 720;
                const scale = Math.min(1, maxWidth / img.width);
                canvas.width = Math.round(img.width * scale);
                canvas.height = Math.round(img.height * scale);
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                    // Add watermark bar
                    const barH = Math.max(34, Math.round(canvas.height * 0.08));
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
                    ctx.fillRect(0, canvas.height - barH, canvas.width, barH);

                    ctx.fillStyle = '#c084fc';
                    ctx.font = `bold ${Math.max(10, Math.round(barH * 0.32))}px -apple-system, BlinkMacSystemFont, sans-serif`;
                    ctx.fillText("OASIS ✨ SELFIE PARA RECORDAR EL MOMENTO", 12, canvas.height - (barH * 0.54));

                    ctx.fillStyle = '#e4e4e7';
                    ctx.font = `${Math.max(9, Math.round(barH * 0.26))}px -apple-system, BlinkMacSystemFont, sans-serif`;
                    const nameDisplay = consultantName.trim() ? `Firma digital: ${consultantName.trim()}` : `Firma digital: @${user}`;
                    const dateDisplay = `${new Date().toLocaleDateString('es-MX')} ${new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;
                    ctx.fillText(`${nameDisplay} | ${dateDisplay}`, 12, canvas.height - (barH * 0.2));

                    const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
                    setCapturedPhoto(dataUrl);
                    stopCamera();
                }
            };
            img.src = event.target?.result;
        };
        reader.readAsDataURL(file);
    };

    const handleRemovePhoto = () => {
        setCapturedPhoto(null);
        if (typeof window !== 'undefined' && user) {
            localStorage.removeItem(`oasis_consent_photo_${user}`);
        }
    };

    const handleSubmit = async () => {
        if (!consultantName.trim()) {
            setErrorMsg('Por favor escribe tu nombre y apellidos completos como firma de conformidad.');
            return;
        }
        if (!isAccepted) {
            setErrorMsg('Debes marcar la casilla declarando que has sido informado/a y aceptas los términos.');
            return;
        }

        setIsSubmitting(true);
        setErrorMsg('');

        const consentRecord = {
            accepted: true,
            consultantName: consultantName.trim(),
            photo: capturedPhoto || null,
            date: new Date().toISOString(),
            formattedDate: currentDate,
            practitioner: "Luis Esteban Briones Canizales",
            supervisor: "Psic. Ángela Sofía Martínez Salazar (Cédula Profesional N°: 14354378)",
            version: "1.0"
        };

        if (typeof window !== 'undefined' && user) {
            try {
                localStorage.setItem(`oasis_consent_accepted_${user}`, 'true');
                localStorage.setItem(`oasis_consent_name_${user}`, consultantName.trim());
                localStorage.setItem(`oasis_fullname_${user}`, consultantName.trim());
                localStorage.setItem(`oasis_consent_date_${user}`, consentRecord.date);
                localStorage.setItem(`oasis_consent_record_${user}`, JSON.stringify(consentRecord));
                if (capturedPhoto) {
                    localStorage.setItem(`oasis_consent_photo_${user}`, capturedPhoto);
                }

                // Sync with server clinical-data for supervisor/clinician review
                const syncPayload = {
                    [`oasis_consent_accepted_${user}`]: 'true',
                    [`oasis_consent_name_${user}`]: consultantName.trim(),
                    [`oasis_consent_date_${user}`]: consentRecord.date,
                    [`oasis_consent_record_${user}`]: JSON.stringify(consentRecord),
                    [`oasis_fullname_${user}`]: consultantName.trim()
                };
                if (capturedPhoto) {
                    syncPayload[`oasis_consent_photo_${user}`] = capturedPhoto;
                }

                fetch(`${API_URL}/api/oasis/clinical-data?user=${user}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(syncPayload)
                }).catch(err => console.error("Consent server sync warning:", err));
            } catch (err) {
                console.error("Local consent storage warning:", err);
            }
        }

        if (onAccept) {
            onAccept(consentRecord);
        }
        setIsSubmitting(false);
    };

    return (
        <div className="fixed inset-0 z-[2000] bg-black/85 backdrop-blur-md overflow-y-auto flex items-center justify-center p-3 sm:p-6 md:p-8 font-sans text-zinc-100 select-text animate-in fade-in duration-300">
            {/* Hidden canvas for image scaling and watermark */}
            <canvas ref={canvasRef} className="hidden" />
            <input 
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
            />

            <div className="w-full max-w-3xl my-auto bg-zinc-950/95 border border-white/10 rounded-3xl p-5 sm:p-8 md:p-10 shadow-2xl relative overflow-hidden flex flex-col gap-6">
                
                {/* Decorative background glow */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 blur-[100px] pointer-events-none rounded-full" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/5 blur-[100px] pointer-events-none rounded-full" />

                {/* Header badges & Close */}
                <div className="relative z-10 flex items-center justify-between border-b border-white/5 pb-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[10px] font-mono font-bold uppercase tracking-wider">
                            <ShieldCheck size={13} className="text-purple-400" />
                            Marco Ético & Consentimiento
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-white/5 text-zinc-400 border border-white/5 text-[10px] font-mono uppercase">
                            Supervisión Clínica
                        </span>
                    </div>
                    {onCancel && (
                        <button 
                            onClick={onCancel}
                            className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                            title="Regresar"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>

                {/* Main Title */}
                <div className="relative z-10 space-y-2 text-center sm:text-left">
                    <h1 className="text-lg sm:text-xl md:text-2xl font-black text-white leading-snug tracking-tight uppercase">
                        CONSENTIMIENTO INFORMADO PARA LA REALIZACIÓN DE PROCESOS DE INTERVENCIÓN PSICOLÓGICA
                    </h1>
                    <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                        Constancia formal de información, voluntariedad y confidencialidad para el inicio del proceso de acompañamiento e investigación clínica.
                    </p>
                </div>

                {/* Document Body (Scrollable) */}
                <div className="relative z-10 flex flex-col gap-5 max-h-[42vh] sm:max-h-[45vh] overflow-y-auto pr-2 custom-scroll text-zinc-300 text-xs sm:text-[13px] leading-relaxed border border-white/5 bg-black/30 p-4 sm:p-5 rounded-2xl">
                    
                    {/* Philosophical / Clinical Quote */}
                    <div className="bg-purple-950/20 border border-purple-500/20 rounded-2xl p-4 text-purple-100/90 font-serif italic text-xs sm:text-sm leading-relaxed shadow-inner">
                        “La terapia tiene como objetivo definir y proporcionar una intervención individualizada que aborde las necesidades específicas de cada paciente, optimizando su desarrollo cognitivo, conductual, y lingüístico. Este enfoque personalizado asegura que las estrategias y técnicas utilizadas se adapten a las particularidades y objetivos personales de cada individuo, promoviendo su bienestar integral y mejorando su calidad de vida.”
                    </div>

                    {/* Otorgamiento del Consentimiento */}
                    <div className="space-y-3 bg-white/[0.02] border border-white/5 rounded-2xl p-4 sm:p-5">
                        <p>
                            Yo <strong className="text-white underline decoration-purple-400 underline-offset-4">{consultantName || "_________________________________"}</strong>, por medio de la presente constancia, en pleno uso de mis facultades mentales, otorgo en forma libre y voluntaria mi consentimiento a <strong>Luis Esteban Briones Canizales</strong>, en su carácter de estudiante de psicología en práctica clínica, bajo la supervisión directa de la <strong>Psic. Ángela Sofía Martínez Salazar (Cédula Profesional N°: 14354378)</strong>, para el desarrollo de las sesiones de Intervención Psicológica, así como la aplicación de los procedimientos y herramientas indicadas para el proceso.
                        </p>
                        <p className="text-zinc-400">
                            Entiendo que este enfoque está diseñado para el abordaje de pensamientos, emociones y conductas, así como para el desarrollo de estrategias de afrontamiento, regulación emocional, aceptación y flexibilidad psicológica. También entiendo y fui notificado/a de las consideraciones y beneficios de este proceso, los cuales se describen a continuación:
                        </p>
                    </div>

                    {/* CONSIDERACIONES */}
                    <div className="space-y-3 bg-amber-500/[0.04] border border-amber-500/20 rounded-2xl p-4 sm:p-5">
                        <div className="flex items-center gap-2 text-amber-300 font-bold uppercase tracking-wider text-[11px] font-mono">
                            <AlertCircle size={14} className="text-amber-400" />
                            CONSIDERACIONES
                        </div>
                        <p className="text-zinc-400 text-xs">
                            Existen ciertos factores inherentes al proceso de intervención psicológica y al trabajo introspectivo que deben tomarse en cuenta durante las sesiones:
                        </p>
                        <ul className="space-y-2.5 pl-1">
                            <li className="flex items-start gap-2.5">
                                <span className="text-amber-400 mt-0.5 font-bold">•</span>
                                <div>
                                    <strong className="text-zinc-200 font-semibold">Activación Emocional:</strong>
                                    <span className="text-zinc-400 ml-1">Durante las sesiones o posterior a ellas, es posible experimentar respuestas emocionales intensas tales como tristeza, ansiedad, enojo, frustración o vulnerabilidad, derivadas de la exploración de situaciones difíciles, recuerdos o pensamientos asociados a las dificultades abordadas.</span>
                                </div>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="text-amber-400 mt-0.5 font-bold">•</span>
                                <div>
                                    <strong className="text-zinc-200 font-semibold">Confrontación de Pensamientos y Conductas:</strong>
                                    <span className="text-zinc-400 ml-1">El proceso puede implicar la revisión de creencias arraigadas, patrones de comportamiento automáticos o estilos de afrontamiento que resulten incómodos de reconocer o modificar, lo que puede generar cierta resistencia o duda temporal.</span>
                                </div>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="text-amber-400 mt-0.5 font-bold">•</span>
                                <div>
                                    <strong className="text-zinc-200 font-semibold">Aparición de Malestar Subjetivo:</strong>
                                    <span className="text-zinc-400 ml-1">Es común que en ciertas etapas del proceso, particularmente al inicio o durante el abordaje de temas complejos, se perciba un aumento transitorio del malestar emocional antes de alcanzar mejoras sostenidas.</span>
                                </div>
                            </li>
                        </ul>
                    </div>

                    {/* BENEFICIOS */}
                    <div className="space-y-3 bg-emerald-500/[0.04] border border-emerald-500/20 rounded-2xl p-4 sm:p-5">
                        <div className="flex items-center gap-2 text-emerald-300 font-bold uppercase tracking-wider text-[11px] font-mono">
                            <Sparkles size={14} className="text-emerald-400" />
                            BENEFICIOS
                        </div>
                        <p className="text-zinc-400 text-xs">
                            El proceso de intervención basado en evidencia (incluyendo elementos de Terapia Cognitivo-Conductual y Terapia de Aceptación y Compromiso) busca generar cambios significativos y positivos:
                        </p>
                        <ul className="space-y-2 pl-1">
                            <li className="flex items-start gap-2.5">
                                <span className="text-emerald-400 mt-0.5 font-bold">✓</span>
                                <span className="text-zinc-300">Identificación, comprensión y modificación de patrones de pensamiento desadaptativos o limitantes.</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="text-emerald-400 mt-0.5 font-bold">✓</span>
                                <span className="text-zinc-300">Desarrollo de repertorios conductuales más flexibles y orientados a valores personales.</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="text-emerald-400 mt-0.5 font-bold">✓</span>
                                <span className="text-zinc-300">Adquisición de herramientas prácticas para la regulación emocional y la tolerancia al malestar.</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="text-emerald-400 mt-0.5 font-bold">✓</span>
                                <span className="text-zinc-300">Desarrollo de habilidades para la resolución de problemas, toma de decisiones y manejo de situaciones generadoras de malestar.</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="text-emerald-400 mt-0.5 font-bold">✓</span>
                                <span className="text-zinc-300">Fomento de la autoeficacia, el autocontrol y el autoconocimiento.</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="text-emerald-400 mt-0.5 font-bold">✓</span>
                                <span className="text-zinc-300">Promoción de estrategias psicológicas que favorezcan el bienestar y una mejor adaptación a las diferentes situaciones de la vida cotidiana.</span>
                            </li>
                        </ul>
                    </div>

                    {/* CONFIDENCIALIDAD, INVESTIGACIÓN Y BORRADO DEFINITIVO */}
                    <div className="space-y-3 bg-sky-500/[0.04] border border-sky-500/20 rounded-2xl p-4 sm:p-5">
                        <div className="flex items-center gap-2 text-sky-300 font-bold uppercase tracking-wider text-[11px] font-mono">
                            <Lock size={14} className="text-sky-400" />
                            PROTECCIÓN DE INFORMACIÓN, RIGOR CIENTÍFICO Y PRIVACIDAD
                        </div>
                        <p className="text-zinc-400 text-xs">
                            Con el fin de garantizar el rigor clínico, el seguimiento óptimo del proceso y el posible análisis de datos con fines estrictamente científicos, académicos o de desarrollo de herramientas de intervención psicológica, el participante acepta las siguientes condiciones sobre su información:
                        </p>
                        <ul className="space-y-2.5 pl-1">
                            <li className="flex items-start gap-2.5">
                                <span className="text-sky-400 mt-0.5">🔒</span>
                                <div>
                                    <strong className="text-zinc-200 font-semibold">Registro de Entrevistas:</strong>
                                    <span className="text-zinc-400 ml-1">Se autoriza el registro escrito y digital de las respuestas, declaraciones y fragmentos de las sesiones. Esta recopilación de datos textuales se mantendrá bajo estricto anonimato, desvinculando cualquier dato de identidad directa del participante desde el momento de su captura.</span>
                                </div>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="text-sky-400 mt-0.5">🧬</span>
                                <div>
                                    <strong className="text-zinc-200 font-semibold">Uso Científico y de Intervención:</strong>
                                    <span className="text-zinc-400 ml-1">La información recolectada se utilizará exclusivamente para el diseño de la intervención sonora y el análisis clínico supervisado dentro de la plataforma del proyecto.</span>
                                </div>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="text-sky-400 mt-0.5">🛡️</span>
                                <div>
                                    <strong className="text-zinc-200 font-semibold">Política de Borrado Definitivo:</strong>
                                    <span className="text-zinc-400 ml-1">Se garantiza que, una vez finalizado el periodo de intervención o el seguimiento del caso, todos los registros de texto, notas digitales y archivos documentales generados serán eliminados de forma permanente y definitiva de cualquier dispositivo o sistema de almacenamiento para asegurar la total privacidad del participante.</span>
                                </div>
                            </li>
                        </ul>
                    </div>

                </div>

                {/* Signature, Name & Camera Photo Block */}
                <div className="relative z-10 border-t border-white/10 pt-4 flex flex-col gap-4">
                    
                    {/* Error Notice */}
                    {errorMsg && (
                        <div className="p-3 bg-red-950/40 border border-red-500/30 text-red-300 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
                            <AlertCircle size={15} className="text-red-400 shrink-0" />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {/* Consultant Full Name Input */}
                    <div className="flex flex-col gap-2 bg-white/[0.02] border border-white/10 p-4 rounded-2xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-zinc-200 text-xs font-semibold">
                                <User size={15} className="text-purple-400 shrink-0" />
                                <span>Nombre completo del consultante (Firma oficial):</span>
                            </div>
                            <span className="text-[10px] font-mono text-purple-400/90 uppercase tracking-widest bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                                Requerido
                            </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-snug">
                            En el registro inicial solo asignaste un nombre de usuario o alias (<span className="text-zinc-300 font-mono">@{user}</span>). Escribe aquí tu <strong>nombre y apellidos reales</strong> para formalizar esta constancia clínica.
                        </p>
                        <input
                            type="text"
                            value={consultantName}
                            onChange={(e) => setConsultantName(e.target.value)}
                            placeholder="Ej. Carlos Eduardo Méndez Gómez"
                            className="w-full bg-black/60 border border-white/15 focus:border-purple-500 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-zinc-600 outline-none transition-all shadow-inner"
                        />
                    </div>

                    {/* Selfie & Signature Section */}
                    <div className="bg-purple-950/15 border border-purple-500/25 p-4 rounded-2xl flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-semibold text-purple-200">
                                <Camera size={16} className="text-purple-400 shrink-0" />
                                <span>Selfie para recordar el momento ✨</span>
                            </div>
                            <span className="text-[9px] font-mono uppercase tracking-wider text-purple-300 bg-purple-500/15 px-2.5 py-0.5 rounded-full border border-purple-500/30">
                                Firma digital
                            </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-snug">
                            Tómate una selfie (tú solo/a o junto con tu terapeuta) para sellar el inicio de este proceso. <span className="text-[9.5px] text-purple-400/80 font-mono block sm:inline sm:ml-1 font-medium">(Actúa como constancia visual y firma digital de tu consentimiento)</span>
                        </p>

                        {/* Camera Error */}
                        {cameraError && (
                            <div className="p-2.5 bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs rounded-xl flex items-center gap-2">
                                <AlertCircle size={14} className="text-amber-400 shrink-0" />
                                <span>{cameraError}</span>
                            </div>
                        )}

                        {/* CASE 1: Photo is already captured */}
                        {capturedPhoto && !isCameraActive && (
                            <div className="flex flex-col sm:flex-row items-center gap-4 bg-black/40 border border-purple-500/30 p-3.5 rounded-xl">
                                <div className="relative group w-36 h-28 sm:w-44 sm:h-32 rounded-lg overflow-hidden border border-purple-500/40 shrink-0 shadow-lg bg-black">
                                    <img 
                                        src={capturedPhoto} 
                                        alt="Selfie de recuerdo y firma" 
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute top-1 right-1 bg-emerald-500 text-black p-1 rounded-full shadow">
                                        <CheckCircle2 size={12} className="stroke-[3]" />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 flex-1 w-full text-center sm:text-left">
                                    <div className="flex items-center gap-1.5 justify-center sm:justify-start text-emerald-400 font-bold text-xs">
                                        <CheckCircle2 size={14} />
                                        <span>✨ ¡Selfie guardada! • Firma digital vinculada</span>
                                    </div>
                                    <p className="text-[10px] text-zinc-400">
                                        Esta selfie queda registrada en tu expediente clínico como constancia afectiva y formal de tu conformidad.
                                    </p>
                                    <div className="flex items-center gap-2 justify-center sm:justify-start pt-1">
                                        <button
                                            type="button"
                                            onClick={() => startCamera(facingMode)}
                                            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                                        >
                                            <RefreshCw size={12} />
                                            <span>Tomar otra selfie</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleRemovePhoto}
                                            className="px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-rose-500/20"
                                        >
                                            <Trash2 size={12} />
                                            <span>Quitar</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* CASE 2: Camera active stream */}
                        {isCameraActive && (
                            <div className="flex flex-col items-center gap-3 bg-black/60 border border-purple-500/40 p-3 rounded-2xl">
                                <div className="relative w-full max-w-sm aspect-[4/3] bg-zinc-950 rounded-xl overflow-hidden border border-white/10 shadow-2xl flex items-center justify-center">
                                    <video 
                                        ref={videoRef}
                                        playsInline
                                        autoPlay
                                        muted
                                        className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                                    />
                                    {/* Live indicator */}
                                    <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
                                        <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
                                        <span className="text-[9px] font-mono text-zinc-300 uppercase tracking-widest font-bold">Cámara lista ✨</span>
                                    </div>
                                    {/* Flash effect overlay */}
                                    {isTakingSnapshot && (
                                        <div className="absolute inset-0 bg-white animate-out fade-out duration-200 pointer-events-none" />
                                    )}
                                </div>

                                <div className="flex flex-wrap items-center gap-2 justify-center w-full">
                                    <button
                                        type="button"
                                        onClick={takeSnapshot}
                                        className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-black font-black uppercase text-xs tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all active:scale-95"
                                    >
                                        <Camera size={16} />
                                        <span>Capturar Selfie ✨</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={toggleFacingMode}
                                        className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-white/10"
                                        title="Alternar entre cámara frontal y trasera"
                                    >
                                        <RefreshCw size={14} />
                                        <span>Girar Cámara</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={stopCamera}
                                        className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-xs font-semibold transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* CASE 3: Camera not active and no photo */}
                        {!isCameraActive && !capturedPhoto && (
                            <div className="flex flex-wrap items-center gap-2.5 pt-1">
                                <button
                                    type="button"
                                    onClick={() => startCamera(facingMode)}
                                    className="px-4 py-2.5 rounded-xl bg-purple-600/90 hover:bg-purple-500 text-black font-black uppercase text-xs tracking-wider flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(168,85,247,0.25)] active:scale-95"
                                >
                                    <Camera size={15} />
                                    <span>📸 Tomar selfie para recordar el momento</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 text-xs font-semibold flex items-center gap-2 transition-colors"
                                >
                                    <Upload size={14} />
                                    <span>Subir selfie</span>
                                </button>
                                <span className="text-[10px] text-zinc-500 italic pl-1">
                                    (Opcional pero lindo para comenzar el viaje ✨)
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Declaration Checkbox */}
                    <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-purple-500/[0.06] border border-purple-500/20 hover:bg-purple-500/[0.1] transition-colors cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={isAccepted}
                            onChange={(e) => setIsAccepted(e.target.checked)}
                            className="mt-0.5 w-4 h-4 rounded border-zinc-700 bg-black text-purple-600 focus:ring-purple-500 focus:ring-offset-0 cursor-pointer accent-purple-500"
                        />
                        <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-semibold text-purple-200">
                                Declaro que he sido informado/a y acepto los términos
                            </span>
                            <span className="text-[11px] text-zinc-400 leading-snug">
                                Otorgo mi pleno consentimiento bajo supervisión clínica para dar inicio al proceso de intervención psicológica en Oasis.
                            </span>
                        </div>
                    </label>

                    {/* Date and Action Button */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                        <span className="text-[11px] font-mono text-zinc-500 tracking-wider">
                            Fecha de suscripción: <span className="text-zinc-300">{currentDate}</span>
                        </span>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            {onCancel && (
                                <button
                                    type="button"
                                    onClick={onCancel}
                                    className="px-4 py-3 rounded-2xl text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors text-xs font-semibold"
                                >
                                    Cancelar
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isSubmitting || !isAccepted || !consultantName.trim()}
                                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-black font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(168,85,247,0.35)] transition-all active:scale-95"
                            >
                                <span>Acepto y Comenzar Entrevista</span>
                                <ArrowRight size={15} />
                            </button>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}
