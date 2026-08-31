import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileText, Download, Play, Pause, Trash2, Mic } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5046';

export const TranscriptionsTab = ({ patientName }) => {
    const [transcriptions, setTranscriptions] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [playingId, setPlayingId] = useState(null);
    const audioRef = useRef(null);

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

    const handleUploadAndTranscribe = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const uploadRes = await fetch(`${API_URL}/api/oasis/upload`, {
                method: 'POST',
                body: formData
            });
            if (!uploadRes.ok) throw new Error("Error al subir el audio");
            const uploadData = await uploadRes.json();
            const audioUrl = uploadData.url;

            setIsUploading(false);
            setIsTranscribing(true);

            const transRes = await fetch(`${API_URL}/api/oasis/transcribe-audio`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: audioUrl })
            });
            if (!transRes.ok) throw new Error("Error en la transcripción");
            const transData = await transRes.json();

            const newItem = {
                id: `trans_${Date.now()}`,
                date: new Date().toLocaleString(),
                filename: file.name,
                audioUrl: audioUrl,
                text: transData.transcription
            };

            saveToLocal([newItem, ...transcriptions]);
            
        } catch (err) {
            console.error(err);
            alert(err.message);
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

    const togglePlay = (url, id) => {
        if (playingId === id) {
            audioRef.current.pause();
            setPlayingId(null);
        } else {
            if (audioRef.current) {
                audioRef.current.src = url;
                audioRef.current.play();
                setPlayingId(id);
            }
        }
    };

    return (
        <div className="flex flex-col gap-6 p-6 overflow-y-auto max-h-full h-full text-white">
            <div className="flex justify-between items-center bg-[#111113] p-6 rounded-3xl border border-white/5">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2"><Mic className="text-emerald-400"/> Transcripción de Sesiones</h2>
                    <p className="text-zinc-400 text-sm mt-1">Sube audios de las sesiones con {patientName} para transcribir y separar las voces automáticamente (Terapeuta y Consultante).</p>
                </div>
                <label className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold uppercase tracking-widest text-xs px-6 py-3 rounded-full cursor-pointer transition-colors shadow-lg shadow-emerald-500/20 flex items-center gap-2">
                    {isUploading ? 'Subiendo...' : isTranscribing ? 'Transcribiendo...' : 'Subir y Transcribir'}
                    {!(isUploading || isTranscribing) && <Upload size={16} />}
                    <input type="file" accept="audio/*" className="hidden" onChange={handleUploadAndTranscribe} disabled={isUploading || isTranscribing} />
                </label>
            </div>

            <audio ref={audioRef} className="hidden" onEnded={() => setPlayingId(null)} />

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
                                <button onClick={() => togglePlay(t.audioUrl, t.id)} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors">
                                    {playingId === t.id ? <Pause size={16} /> : <Play size={16} className="ml-1" />}
                                </button>
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
