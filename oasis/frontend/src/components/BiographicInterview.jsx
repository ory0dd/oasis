import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Mic, Square, Check, Activity, ArrowRight, Play, Pause } from 'lucide-react';
import { useTranscription } from '../hooks/useTranscription';

const BIO_QUESTIONS = [
    { title: "Motivo de Consulta (El Presente)", text: "Para empezar, vamos a situarnos: ¿Qué es eso que hoy sientes que merece ser observado? Cuéntame sobre esa situación o estado que, al pensar en él, sientes que es el eje central de tu consulta en este momento." },
    { title: "Impacto Fenomenológico (El Cuerpo)", text: "Cuando este problema aparece, ¿cómo se siente en tu cuerpo? ¿Qué pensamientos suelen acompañarlo?" },
    { title: "Evitación Experiencial (El Costo)", text: "¿Qué has intentado hacer hasta ahora para evitar o dejar de sentir esto? ¿Sientes que esta lucha te está quitando tiempo o energía?" },
    { title: "Contexto Vital (Relaciones)", text: "¿Con quién vives? ¿Cómo describirías la relación con las personas más significativas en tu vida actualmente?" },
    { title: "Contexto Vital (Esfera Productiva)", text: "¿A qué te dedicas y cómo te sientes en tu entorno académico o laboral?" },
    { title: "Direcciones Vitales (El Futuro)", text: "Si este problema desapareciera mañana por arte de magia... ¿qué harías diferente? ¿Qué áreas de tu vida has dejado en pausa?" },
    { title: "Identidad de Afrontamiento (El Ser)", text: "¿Qué tipo de persona te gustaría ser frente a las dificultades que estás atravesando?" }
];

import { saveObservation } from '../utils/db';

export const BiographicInterview = ({ username, activeVersion = 1, onClose, onComplete }) => {
    const [isStarted, setIsStarted] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isRecording, setIsRecording] = useState(false);
    const [transcriptions, setTranscriptions] = useState({});
    const [hasRecorded, setHasRecorded] = useState({});
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const dataArrayRef = useRef(null);
    const [volume, setVolume] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    // Video Recording & Metadata tracking
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);
    const [recordedBlobs, setRecordedBlobs] = useState({});
    const recordedBlobsRef = useRef({});
    const [dwellTimes, setDwellTimes] = useState({});
    const [pauseCounts, setPauseCounts] = useState({});
    const startTimeRef = useRef(null);

    const {
        isRecording: sttRecording,
        interimTranscript,
        startRecording: sttStartRecording,
        stopRecording: sttStopRecording,
        setTranscript: sttSetTranscript
    } = useTranscription({
        onTranscriptChange: (text) => {
            setTranscriptions(prev => ({
                ...prev,
                [currentIndex]: text
            }));
        }
    });

    useEffect(() => {
        sttSetTranscript(transcriptions[currentIndex] || "");
    }, [currentIndex, sttSetTranscript]);

    useEffect(() => {
        if (!isStarted) return;
        
        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }

                // Audio Context para Medidor de Volumen
                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
                analyserRef.current = audioContextRef.current.createAnalyser();
                const source = audioContextRef.current.createMediaStreamSource(stream);
                source.connect(analyserRef.current);
                analyserRef.current.fftSize = 256;
                const bufferLength = analyserRef.current.frequencyBinCount;
                dataArrayRef.current = new Uint8Array(bufferLength);

                const updateVolume = () => {
                    if (analyserRef.current && dataArrayRef.current) {
                        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
                        let sum = 0;
                        for(let i = 0; i < bufferLength; i++) {
                            sum += dataArrayRef.current[i];
                        }
                        setVolume(sum / bufferLength);
                    }
                    requestAnimationFrame(updateVolume);
                };
                updateVolume();

            } catch (e) {
                console.error("Error accessing media devices.", e);
            }
        };
        startCamera();
        
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
            sttStopRecording();
        };
    }, [isStarted, sttStopRecording]);

    const toggleRecording = () => {
        if (isRecording) {
            setIsRecording(false);
            setIsPaused(false);
            setHasRecorded(prev => ({ ...prev, [currentIndex]: true }));
            sttStopRecording();

            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }

            if (startTimeRef.current) {
                const elapsed = Date.now() - startTimeRef.current;
                setDwellTimes(prev => ({
                    ...prev,
                    [currentIndex]: (prev[currentIndex] || 0) + elapsed
                }));
                startTimeRef.current = null;
            }
        } else {
            setIsRecording(true);
            setIsPaused(false);
            setTranscriptions(prev => ({ ...prev, [currentIndex]: "" }));
            sttStartRecording("");
            if (videoRef.current) {
                videoRef.current.play();
            }

            if (streamRef.current) {
                recordedChunksRef.current = [];
                let options = { mimeType: 'video/webm;codecs=vp9,opus' };
                if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                    options = { mimeType: 'video/webm;codecs=vp8,opus' };
                }
                if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                    options = { mimeType: 'video/webm' };
                }

                try {
                    const mediaRecorder = new MediaRecorder(streamRef.current, options);
                    mediaRecorderRef.current = mediaRecorder;

                    mediaRecorder.ondataavailable = (event) => {
                        if (event.data && event.data.size > 0) {
                            recordedChunksRef.current.push(event.data);
                        }
                    };

                    const activeIndex = currentIndex;
                    mediaRecorder.onstop = () => {
                        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
                        recordedBlobsRef.current[activeIndex] = blob;
                        setRecordedBlobs(prev => ({
                            ...prev,
                            [activeIndex]: blob
                        }));
                    };

                    mediaRecorder.start(1000);
                } catch (e) {
                    console.error("Error starting MediaRecorder:", e);
                }
            }

            startTimeRef.current = Date.now();
        }
    };

    const togglePause = () => {
        if (!isRecording) return;
        if (isPaused) {
            setIsPaused(false);
            sttStartRecording(transcriptions[currentIndex] || "");
            if (videoRef.current) {
                videoRef.current.play();
            }

            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
                mediaRecorderRef.current.resume();
            }

            startTimeRef.current = Date.now();
        } else {
            setIsPaused(true);
            sttStopRecording();
            if (videoRef.current) {
                videoRef.current.pause();
            }

            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.pause();
            }

            setPauseCounts(prev => ({
                ...prev,
                [currentIndex]: (prev[currentIndex] || 0) + 1
            }));

            if (startTimeRef.current) {
                const elapsed = Date.now() - startTimeRef.current;
                setDwellTimes(prev => ({
                    ...prev,
                    [currentIndex]: (prev[currentIndex] || 0) + elapsed
                }));
                startTimeRef.current = null;
            }
        }
    };

    const handleNext = async () => {
        if (currentIndex < BIO_QUESTIONS.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            // Save metadata and video blobs to IndexedDB
            const patientName = username || 'Invitado';
            const suffix = activeVersion > 1 ? `_v${activeVersion}` : '';
            const bioMetadata = {
                evaluationDate: new Date().toISOString(),
                userFullName: localStorage.getItem('oasis_fullname_' + patientName) || '',
                userAge: localStorage.getItem('oasis_age_' + patientName) ? parseInt(localStorage.getItem('oasis_age_' + patientName), 10) : null
            };
            BIO_QUESTIONS.forEach((q, idx) => {
                const text = transcriptions[idx] || '';
                const words = text.trim().split(/\s+/).filter(Boolean).length;
                bioMetadata[idx] = {
                    dwellTime: Math.round((dwellTimes[idx] || 0) / 1000),
                    pauses: pauseCounts[idx] || 0,
                    words: words
                };
            });

            localStorage.setItem(`oasis_bio_metadata_${patientName}${suffix}`, JSON.stringify(bioMetadata));

            const videoRecord = {
                id: `bio_videos_${patientName}${suffix}`,
                username: patientName,
                videos: recordedBlobsRef.current
            };

            try {
                await saveObservation(videoRecord);
                console.log("Biographic interview videos saved to IndexedDB!");
            } catch (err) {
                console.error("Error saving biographic interview videos to IndexedDB:", err);
            }

            onComplete(transcriptions);
        }
    };

    const handleTextChange = (e) => {
        setTranscriptions(prev => ({ ...prev, [currentIndex]: e.target.value }));
        sttSetTranscript(e.target.value);
    };


    if (!isStarted) {
        return (
            <div className="max-w-3xl mx-auto space-y-4 md:space-y-8 animate-in slide-in-from-bottom duration-500 pt-4 md:pt-12">
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">Entrevista Biográfica</span>
                    <button onClick={onClose} className="text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">Salir de la Prueba</button>
                </div>

                <div className="bg-[#08080a] border border-white/5 rounded-2xl md:rounded-[2.5rem] p-4 md:p-12 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] pointer-events-none rounded-full" />
                    
                    <div className="space-y-8 relative z-10">
                        <div className="space-y-4">
                            <h2 className="text-xl md:text-3xl font-serif italic text-white leading-tight tracking-tight">Antes de comenzar...</h2>
                            <p className="text-xs md:text-lg text-zinc-300 font-sans leading-relaxed">
                                "Antes de comenzar con las preguntas, quiero platicarte un poco sobre cómo será nuestra plática hoy. El objetivo de esta entrevista no es solo recopilar datos, sino identificar procesos emocionales profundos o complejos que estás viviendo. 
                                <br/><br/>
                                Es muy probable que al explorar esto surjan emociones difíciles o incomodidad; quiero que sepas que es completamente normal y esperado. Este es un espacio seguro para que te permitas sentir lo que sea que aparezca, sin juzgarlo y a tu propio ritmo."
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4 border-t border-white/5">
                            <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-1">
                                <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400">Duración Estimada</span>
                                <span className="text-xs md:text-sm text-zinc-200">15 - 20 minutos</span>
                            </div>
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-2">
                                <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400">Recomendación del Entorno</span>
                                <span className="text-sm font-bold text-white">Busca un lugar tranquilo (ej: tu cuarto o un parque seguro) para poder hablar de manera abierta.</span>
                            </div>
                        </div>

                        <div className="pt-6">
                            <button
                                onClick={() => setIsStarted(true)}
                                className="w-full py-4 md:py-5 rounded-xl md:rounded-2xl bg-emerald-900/40 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-600 hover:text-black font-black uppercase tracking-[0.2em] transition-all shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:scale-[1.02] text-[10px] md:text-xs"
                            >
                                Iniciar Entrevista Clínica
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-2 animate-in slide-in-from-bottom duration-500 pt-2">
            {/* Header */}
            <div className="flex justify-between items-center mb-1 px-1">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400">
                        <Camera size={10} />
                    </div>
                    <span className="text-[8px] font-mono uppercase text-zinc-500 tracking-widest">Tarjeta {currentIndex + 1} de {BIO_QUESTIONS.length}</span>
                </div>
                <button onClick={onClose} className="text-[8px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors bg-white/5 px-3 py-1 rounded-full">Salir</button>
            </div>

            {/* Layout: Video Left, Text/Controls Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 lg:gap-6 bg-[#08080a] border border-white/5 rounded-2xl lg:rounded-[2.5rem] p-2 sm:p-3 lg:p-6 shadow-2xl">
                
                {/* Left Column: Video & Question Card */}
                <div className="lg:col-span-7 flex flex-col gap-2 lg:gap-4">
                    {/* Question Card */}
                    <div className="bg-emerald-950/20 border border-emerald-800/30 rounded-xl lg:rounded-3xl p-3 lg:p-6 relative overflow-hidden shadow-inner shrink-0">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[50px] pointer-events-none" />
                        <h4 className="text-[7px] lg:text-[8px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-1.5 lg:mb-3">{BIO_QUESTIONS[currentIndex].title}</h4>
                        <p className="text-sm sm:text-base lg:text-3xl font-serif italic text-white/90 leading-tight">"{BIO_QUESTIONS[currentIndex].text}"</p>
                    </div>

                    {/* Video Player / Recording Studio Box */}
                    <div className="relative w-full h-[240px] xs:h-[280px] lg:h-auto lg:aspect-video bg-black rounded-xl lg:rounded-3xl overflow-hidden border border-white/10 group shadow-2xl flex flex-col justify-between">
                        <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" />
                        
                        {/* Recording HUD */}
                        <div className="absolute top-3 left-3 right-3 lg:top-5 lg:left-5 lg:right-5 flex justify-between items-start pointer-events-none z-10">
                            <div className="flex gap-2">
                                <div className="px-2 py-1 lg:px-3 lg:py-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-1.5 lg:gap-2">
                                    <Mic size={10} className={volume > 10 ? "text-emerald-400" : "text-white/50"} />
                                    <div className="flex gap-0.5 h-2.5 lg:h-3 items-end">
                                        {Array.from({ length: 5 }).map((_, i) => {
                                            const maxVol = 100;
                                            const normalizedVol = Math.min(volume / maxVol, 1);
                                            const multiplier = i === 2 ? 1 : (i === 1 || i === 3 ? 0.7 : 0.4);
                                            const height = Math.max(2, normalizedVol * 12 * multiplier);
                                            const isActive = volume > (i * 10);
                                            
                                            return (
                                                <div 
                                                    key={i} 
                                                    className={`w-0.5 lg:w-1 rounded-t-sm transition-all duration-75 ${isActive ? 'bg-emerald-400' : 'bg-white/20'}`}
                                                    style={{ height: `${height}px` }}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="px-2 py-1 lg:px-3 lg:py-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-1 lg:gap-2">
                                    <Camera size={10} className="text-white" />
                                    <span className="text-[7px] lg:text-[8px] font-black uppercase text-white font-mono tracking-wider">Cam OK</span>
                                </div>
                            </div>
                            {isRecording && (
                                <div className={`flex items-center gap-1.5 px-3 py-1.5 lg:px-4 lg:py-2 rounded-full border shadow-lg ${isPaused ? 'bg-amber-500/20 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.4)]' : 'bg-red-500/20 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse'}`}>
                                    <div className={`w-1.5 lg:w-2.5 h-1.5 lg:h-2.5 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-red-500'}`} />
                                    <span className={`text-[8px] lg:text-[10px] font-black uppercase tracking-widest ${isPaused ? 'text-amber-400' : 'text-red-400'}`}>{isPaused ? 'PAUSADO' : 'GRABANDO'}</span>
                                </div>
                            )}
                        </div>

                        {/* Mobile transcription & controls overlay */}
                        <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-col gap-2 lg:hidden pointer-events-auto">
                            {/* Glassmorphic Live Transcription Card */}
                            <div className="bg-black/75 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-2xl">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[7px] font-black uppercase tracking-wider text-emerald-400/90 flex items-center gap-1">
                                        <Activity size={10} className={isRecording && !isPaused ? "text-emerald-400 animate-pulse" : "text-zinc-500"} />
                                        Traducción de Voz
                                    </span>
                                    <span className="text-[6px] font-mono text-zinc-400 uppercase tracking-widest">
                                        {isRecording && !isPaused ? 'Habla ahora...' : 'Toca para editar'}
                                    </span>
                                </div>
                                <textarea
                                    value={
                                        (transcriptions[currentIndex] || '') + 
                                        (interimTranscript ? (((transcriptions[currentIndex] || '').trim() ? ' ' : '') + interimTranscript) : '')
                                    }
                                    onChange={handleTextChange}
                                    disabled={isRecording && !isPaused}
                                    placeholder="Tu voz aparecerá aquí..."
                                    className="w-full bg-transparent text-xs text-white font-sans leading-relaxed resize-none focus:outline-none h-12 disabled:opacity-80"
                                />
                            </div>

                            {/* Floating Action Buttons Overlay */}
                            <div className="grid grid-cols-2 gap-2">
                                {isRecording ? (
                                    <>
                                        <button
                                            onClick={togglePause}
                                            className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all border text-[9px] font-black uppercase tracking-wider ${
                                                isPaused
                                                    ? 'bg-amber-500 border-amber-400 text-black shadow-lg shadow-amber-500/20'
                                                    : 'bg-black/60 backdrop-blur-md border-white/20 text-white'
                                            }`}
                                        >
                                            {isPaused ? <Play size={12} /> : <Pause size={12} />}
                                            <span>{isPaused ? 'Reanudar' : 'Pausar'}</span>
                                        </button>
                                        <button
                                            onClick={toggleRecording}
                                            className="py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all border bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/20"
                                        >
                                            <Square size={12} className="fill-current" />
                                            <span>Detener</span>
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={toggleRecording}
                                            className="py-3 rounded-xl flex items-center justify-center gap-1.5 transition-all border bg-white text-black font-black uppercase tracking-wider shadow-lg"
                                        >
                                            <Mic size={12} />
                                            <span>{hasRecorded[currentIndex] ? 'Re-grabar' : 'Grabar'}</span>
                                        </button>
                                        <button
                                            onClick={handleNext}
                                            disabled={!hasRecorded[currentIndex]}
                                            className={`py-3 rounded-xl flex items-center justify-center gap-1.5 transition-all border text-[9px] font-black uppercase tracking-wider ${
                                                hasRecorded[currentIndex]
                                                    ? 'bg-emerald-500 border-emerald-400 text-black shadow-lg shadow-emerald-500/20'
                                                    : 'bg-black/40 border-white/5 text-zinc-600 opacity-50 pointer-events-none'
                                            }`}
                                        >
                                            <span>{currentIndex === BIO_QUESTIONS.length - 1 ? 'Finalizar' : 'Siguiente'}</span>
                                            {currentIndex === BIO_QUESTIONS.length - 1 ? <Check size={12} /> : <ArrowRight size={12} />}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Controls & Transcription (Desktop/Large Screen only) */}
                <div className="hidden lg:flex lg:col-span-5 flex-col gap-6">
                    <div className="flex-1 bg-[#0f0f12] border border-white/5 rounded-3xl flex flex-col overflow-hidden shadow-inner min-h-[220px]">
                        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                            <div className="flex items-center gap-2">
                                <Activity size={14} className={isRecording && !isPaused ? "text-emerald-400 animate-pulse" : "text-zinc-600"} />
                                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 font-mono">Traductor Neuronal de Voz</span>
                            </div>
                            <span className="text-[7px] font-mono text-zinc-600 uppercase tracking-widest">
                                {isRecording && !isPaused ? 'Grabando...' : (hasRecorded[currentIndex] ? 'Sincronizados los subtítulos en el video' : 'Modo Editor Activado')}
                            </span>
                        </div>
                        <div className="flex-1 relative">
                            <textarea
                                value={
                                    (transcriptions[currentIndex] || '') + 
                                    (interimTranscript ? (((transcriptions[currentIndex] || '').trim() ? ' ' : '') + interimTranscript) : '')
                                }
                                onChange={handleTextChange}
                                placeholder="Aquí aparecerá tu voz transformada en texto en tiempo real. 

Al detener o pausar la grabación, puedes hacer clic aquí para corregir cualquier error antes de continuar."
                                disabled={isRecording && !isPaused}
                                className="absolute inset-0 w-full h-full bg-transparent p-6 text-base text-zinc-300 font-sans leading-relaxed resize-none focus:outline-none disabled:opacity-50"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {isRecording ? (
                            <>
                                <button
                                    onClick={togglePause}
                                    className={`py-5 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all border ${
                                        isPaused
                                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                                            : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                                    }`}
                                >
                                    {isPaused ? <Play size={20} /> : <Pause size={20} />}
                                    <span className="text-[10px] font-black uppercase tracking-widest">{isPaused ? 'Reanudar' : 'Pausar y Editar'}</span>
                                </button>
                                <button
                                    onClick={toggleRecording}
                                    className="py-5 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all border bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                                >
                                    <Square size={20} className="fill-current" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Detener</span>
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={toggleRecording}
                                    className="py-5 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all border bg-white/5 border-white/10 text-white hover:bg-white/10"
                                >
                                    <Mic size={20} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{hasRecorded[currentIndex] ? 'Re-grabar' : 'Grabar'}</span>
                                </button>
                                <button
                                    onClick={handleNext}
                                    disabled={!hasRecorded[currentIndex]}
                                    className={`py-5 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all border ${
                                        hasRecorded[currentIndex]
                                            ? 'bg-emerald-600 border-emerald-500 text-black hover:bg-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.3)] hover:scale-105'
                                            : 'bg-white/5 border-white/10 text-zinc-600 opacity-50'
                                    }`}
                                >
                                    {currentIndex === BIO_QUESTIONS.length - 1 ? <Check size={20} /> : <ArrowRight size={20} />}
                                    <span className="text-[10px] font-black uppercase tracking-widest">{currentIndex === BIO_QUESTIONS.length - 1 ? 'Finalizar' : 'Siguiente'}</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mt-6">
                <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${((currentIndex + 1) / BIO_QUESTIONS.length) * 100}%` }} />
            </div>
        </div>
    );
};
