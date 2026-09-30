import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileText, Download, Play, Pause, Trash2, Mic } from 'lucide-react';
import { API_URL } from '../utils/api';

export const TranscriptionsTab = ({ patientName }) => {
    const [transcriptions, setTranscriptions] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [playingId, setPlayingId] = useState(null);
    
    // Manual Note States
    const [isAddingManual, setIsAddingManual] = useState(false);
    const [manualTitle, setManualTitle] = useState('');
    const [manualText, setManualText] = useState('');

    const audioRef = useRef(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioVolume, setAudioVolume] = useState(0);
    const [micGain, setMicGain] = useState(1.0);
    const playbackCtxRef = useRef(null);
    const micGainRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    const timerRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const dataArrayRef = useRef(null);
    const animationFrameRef = useRef(null);
    const browserTranscriptRef = useRef('');
    const backgroundRecognitionRef = useRef(null);

    
    

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            let options = { mimeType: 'audio/webm' };
            if (!MediaRecorder.isTypeSupported('audio/webm')) {
                options = { mimeType: 'audio/mp4' };
            }
            const mediaRecorder = new MediaRecorder(stream, options);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];
            browserTranscriptRef.current = '';
            
            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
            if (SpeechRecognition) {
                try {
                    const recognition = new SpeechRecognition();
                    recognition.continuous = true;
                    recognition.interimResults = true;
                    recognition.lang = 'es-ES';
                    recognition.onresult = (event) => {
                        let fullText = '';
                        for (let i = 0; i < event.results.length; i++) {
                            fullText += event.results[i][0].transcript + ' ';
                        }
                        browserTranscriptRef.current = fullText.trim();
                    };
                    recognition.start();
                    backgroundRecognitionRef.current = recognition;
                } catch (recErr) {}
            }
            
            mediaRecorder.onstop = () => {
                if (backgroundRecognitionRef.current) {
                    try { backgroundRecognitionRef.current.stop(); } catch (e) {}
                    backgroundRecognitionRef.current = null;
                }
                const blob = new Blob(chunksRef.current, { type: options.mimeType });
                const ext = options.mimeType.includes('webm') ? 'webm' : 'm4a';
                const file = new File([blob], `sesion_grabada_${Date.now()}.${ext}`, { type: options.mimeType });
                handleUploadAndTranscribe(file, browserTranscriptRef.current);
                stream.getTracks().forEach(track => track.stop());
                
                if (audioContextRef.current) {
                    audioContextRef.current.close();
                    audioContextRef.current = null;
                }
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                }
            };

            // Setup audio visualizer
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);
            analyser.fftSize = 256;
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            
            audioContextRef.current = audioContext;
            analyserRef.current = analyser;
            dataArrayRef.current = dataArray;
            
            const updateVolume = () => {
                if (!analyserRef.current) return;
                analyserRef.current.getByteFrequencyData(dataArrayRef.current);
                let sum = 0;
                for (let i = 0; i < dataArrayRef.current.length; i++) {
                    sum += dataArrayRef.current[i];
                }
                const average = sum / dataArrayRef.current.length;
                setAudioVolume(average);
                animationFrameRef.current = requestAnimationFrame(updateVolume);
            };
            updateVolume();
            
            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (err) {
            alert('Error accediendo al micrófono: ' + err.message);
        }
    };
    
    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            clearInterval(timerRef.current);
        }
    };
    
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };


    useEffect(() => {
        if (!patientName) return;
        const saved = localStorage.getItem(`oasis_transcriptions_${patientName}`);
        if (saved) {
            try {
                setTranscriptions(JSON.parse(saved));
            } catch (e) {
                console.error("Error parsing transcriptions", e);
            }
        }
    }, [patientName]);

    const saveToLocal = (newTrans) => {
        setTranscriptions(newTrans);
        localStorage.setItem(`oasis_transcriptions_${patientName}`, JSON.stringify(newTrans));
    };

    const handleUploadAndTranscribe = async (e, precomputedTranscript = null) => {
        const file = e?.target?.files?.[0] || e;
        if (!file || !file.name) return;

        setIsUploading(true);
        setErrorMessage(null);
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const uploadRes = await fetch(`${API_URL}/api/oasis/upload`, {
                method: 'POST',
                body: formData
            });
            if (!uploadRes.ok) {
                const uploadErr = await uploadRes.text();
                throw new Error(`[Error de Subida ${uploadRes.status}]: ${uploadErr || uploadRes.statusText}`);
            }
            const uploadData = await uploadRes.json();
            const audioUrl = uploadData.url;

            setIsUploading(false);
            
            let finalTranscription = precomputedTranscript;
            
            if (!finalTranscription) {
                setIsTranscribing(true);
                const transRes = await fetch(`${API_URL}/api/oasis/transcribe-audio`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: audioUrl })
                });
                if (!transRes.ok) {
                    const errText = await transRes.text();
                    throw new Error(`[Error de Transcripción ${transRes.status}]: ${errText || transRes.statusText}`);
                }
                const transData = await transRes.json();
                finalTranscription = transData.transcription;
            }

            const newItem = {
                id: `trans_${Date.now()}`,
                date: new Date().toLocaleString(),
                filename: file.name,
                audioUrl: audioUrl,
                text: finalTranscription
            };

            saveToLocal([newItem, ...transcriptions]);
            
        } catch (err) {
            console.error("Transcription error details:", err);
            setErrorMessage(err.message || String(err));
        } finally {
            setIsUploading(false);
            setIsTranscribing(false);
        }
        e.target.value = '';
    };

    const exportToWord = (item) => {
        const html = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head><meta charset='utf-8'><title>Transcripción</title></head>
            <body>
                <h1>Transcripción: ${item.filename}</h1>
                <p><strong>Fecha:</strong> ${item.date}</p>
                <p><strong>Paciente:</strong> ${patientName}</p>
                <hr />
                <div style="font-family: Arial, sans-serif; line-height: 1.5; white-space: pre-wrap;">
                    ${item.text.replace(/\\n/g, '<br/>')}
                </div>
            </body>
            </html>
        `;
        const blob = new Blob([html], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Transcripcion_${patientName}_${item.id}.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleDelete = (id) => {
        if (confirm('¿Seguro que deseas eliminar esta transcripción?')) {
            const filtered = transcriptions.filter(t => t.id !== id);
            saveToLocal(filtered);
        }
    };

    const handleSaveManualNote = () => {
        if (!manualTitle.trim() || !manualText.trim()) {
            setErrorMessage("El título y el contenido son obligatorios para una nota manual.");
            return;
        }

        const newItem = {
            id: `manual_${Date.now()}`,
            date: new Date().toLocaleString(),
            filename: manualTitle.trim() + " (Nota/Resumen Manual)",
            audioUrl: null, // No audio
            text: manualText.trim(),
            isManual: true
        };

        saveToLocal([newItem, ...transcriptions]);
        setIsAddingManual(false);
        setManualTitle('');
        setManualText('');
    };

    const getFullAudioUrl = (url) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
    };

    const togglePlay = (url, id) => {
        if (playingId === id) {
            audioRef.current.pause();
            setPlayingId(null);
        } else {
            if (audioRef.current) {
                audioRef.current.src = getFullAudioUrl(url);
                audioRef.current.play();
                setPlayingId(id);
            }
        }
    };

    return (
        <div className="flex flex-col gap-6 p-6 overflow-y-auto max-h-full h-full text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#111113] p-6 rounded-3xl border border-white/5 gap-4">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2"><Mic className="text-emerald-400"/> Transcripción de Sesiones</h2>
                    <p className="text-zinc-400 text-sm mt-1 max-w-lg">Sube audios largos de tus sesiones (hasta 1-2 GB). El sistema usa IA avanzada para transcribir automáticamente la hora y media completa, o pega tus propias notas si ya lo tienes escrito.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
                    <button 
                        onClick={() => setIsAddingManual(!isAddingManual)}
                        className={`font-bold uppercase tracking-widest text-[10px] px-6 py-3 rounded-xl border transition-colors flex items-center justify-center gap-2 ${
                            isAddingManual ? 'bg-zinc-800 border-zinc-600 text-white' : 'bg-transparent border-white/20 text-zinc-300 hover:bg-white/5'
                        }`}
                    >
                        <FileText size={14} /> {isAddingManual ? 'Cancelar Nota' : 'Poner Nota Manual'}
                    </button>
                    {isRecording ? (
                        <button 
                            onClick={stopRecording}
                            className="bg-red-500 hover:bg-red-400 text-white font-bold uppercase tracking-widest text-[10px] px-6 py-3 rounded-xl transition-colors shadow-lg shadow-red-500/20 flex items-center justify-center gap-3"
                        >
                            <div className="flex gap-[3px] items-center h-6 bg-black/20 px-3 py-1 rounded-full border border-black/20">
                                {[1.2, 2.5, 3.8, 2.1, 4.5, 2.8, 1.5, 3.2].map((mult, i) => (
                                    <div key={i} className="w-1.5 rounded-full transition-all duration-75" 
                                         style={{ 
                                            height: `${Math.max(15, Math.min(100, audioVolume * mult))}%`,
                                            backgroundColor: audioVolume * mult > 70 ? '#ef4444' : audioVolume * mult > 40 ? '#fbbf24' : '#10b981'
                                         }}>
                                    </div>
                                ))}
                            </div>
                            Detener ({formatTime(recordingTime)})
                        </button>
                    ) : (
                        <button 
                            onClick={startRecording}
                            disabled={isUploading || isTranscribing}
                            className="bg-rose-600 hover:bg-rose-500 text-white font-bold uppercase tracking-widest text-[10px] px-6 py-3 rounded-xl transition-colors shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Mic size={14} /> Grabar
                        </button>
                    )}
                    <label className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold uppercase tracking-widest text-[10px] px-6 py-3 rounded-xl cursor-pointer transition-colors shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2">
                        {isUploading ? 'Subiendo...' : isTranscribing ? 'Transcribiendo...' : 'Subir y Transcribir'}
                        {!(isUploading || isTranscribing) && <Upload size={14} />}
                        <input type="file" accept="audio/*" className="hidden" onChange={handleUploadAndTranscribe} disabled={isUploading || isTranscribing} />
                    </label>
                </div>
            </div>

            {isAddingManual && (
                <div className="bg-zinc-950/80 border border-emerald-500/30 rounded-3xl p-6 animate-in slide-in-from-top-4 fade-in duration-300">
                    <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-widest mb-4">Añadir Resumen / Transcripción Manual</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] uppercase font-mono text-zinc-500 mb-1">Título de la Sesión o Nota</label>
                            <input 
                                type="text" 
                                value={manualTitle}
                                onChange={e => setManualTitle(e.target.value)}
                                placeholder="Ej: Sesión 3 - Lunes 15 (Audio Largo)" 
                                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500/50"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase font-mono text-zinc-500 mb-1">Contenido (Texto, Notas, Transcripción generada externamente)</label>
                            <textarea 
                                value={manualText}
                                onChange={e => setManualText(e.target.value)}
                                placeholder="Pega aquí la transcripción que hiciste, o tus apuntes detallados de la hora y media de sesión..." 
                                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500/50 min-h-[200px]"
                            />
                        </div>
                        <div className="flex justify-end">
                            <button 
                                onClick={handleSaveManualNote}
                                className="bg-emerald-500 text-black px-6 py-2.5 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-emerald-400 transition-colors"
                            >
                                Guardar Nota Manual
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <audio ref={audioRef} className="hidden" onEnded={() => setPlayingId(null)} crossOrigin="anonymous" />

            {/* ERROR BANNER */}
            {errorMessage && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <span className="text-red-400 font-bold text-xs uppercase tracking-widest">❌ Error Detectado</span>
                        <button onClick={() => setErrorMessage(null)} className="text-zinc-500 hover:text-white text-xs px-2 py-1 rounded bg-white/5">Cerrar</button>
                    </div>
                    <pre className="text-red-300 text-xs font-mono whitespace-pre-wrap break-words bg-black/30 rounded-xl p-3 max-h-48 overflow-y-auto leading-relaxed">{errorMessage}</pre>
                </div>
            )}

            {isTranscribing && (
                <div className="flex flex-col items-center justify-center p-10 border border-dashed border-emerald-500/30 rounded-3xl bg-emerald-500/5">
                    <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <h3 className="text-emerald-400 font-bold uppercase tracking-widest text-sm">La IA de Gemini está analizando la sesión...</h3>
                    <p className="text-emerald-500/70 text-xs mt-2">Esto puede tomar un par de minutos dependiendo de la duración del audio.</p>
                </div>
            )}

            <div className="flex flex-col gap-4">
                {transcriptions.length === 0 && !isTranscribing && (
                    <div className="text-center p-10 text-zinc-500 text-sm italic">
                        No hay transcripciones guardadas para este paciente. Sube un audio para comenzar.
                    </div>
                )}
                {transcriptions.map(t => (
                    <div key={t.id} className="bg-[#111113] border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
                        <div className="flex justify-between items-start border-b border-white/5 pb-4">
                            <div>
                                <h3 className="font-bold text-lg text-emerald-300 truncate max-w-md">{t.filename}</h3>
                                <p className="text-zinc-500 text-xs uppercase tracking-widest font-mono mt-1">{t.date}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {t.audioUrl && (
                                    <div className="flex items-center gap-3 mr-2 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
                                        <div className="flex flex-col items-center gap-1">
                                            <label className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">Ganancia (x{playbackGain.toFixed(1)})</label>
                                            <input 
                                                type="range" min="0.1" max="5.0" step="0.1" 
                                                value={playbackGain} 
                                                onChange={(e) => setPlaybackGain(parseFloat(e.target.value))}
                                                className="w-20 accent-emerald-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                            />
                                        </div>
                                        <div className="w-[1px] h-6 bg-white/10 mx-1"></div>
                                        <button onClick={() => togglePlay(t.audioUrl, t.id)} className="w-9 h-9 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 flex items-center justify-center text-emerald-400 transition-colors shadow-lg border border-emerald-500/20">
                                            {playingId === t.id ? <Pause size={14} /> : <Play size={14} className="ml-1" />}
                                        </button>
                                    </div>
                                )}
                                <button onClick={() => exportToWord(t)} className="w-10 h-10 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 flex items-center justify-center transition-colors" title="Exportar a Word">
                                    <Download size={16} />
                                </button>
                                <button onClick={() => handleDelete(t.id)} className="w-10 h-10 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                        <div className="bg-black/30 p-4 rounded-xl text-zinc-300 text-sm whitespace-pre-wrap font-mono leading-relaxed max-h-96 overflow-y-auto">
                            {t.text}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
