import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Save, Clock, Trash2, X, Maximize2, Minimize2, Move, Plus, Headphones, Loader2 } from 'lucide-react';

const FloatingNotebook = ({ user }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [position, setPosition] = useState({ x: 20, y: 80 });
    const [isDragging, setIsDragging] = useState(false);
    const [sessions, setSessions] = useState([]);
    const [newSessionNote, setNewSessionNote] = useState('');
    const [sessionAudioUrls, setSessionAudioUrls] = useState([]);
    const [activeNoteId, setActiveNoteId] = useState(null);
    const [isUploadingAudio, setIsUploadingAudio] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const dragRef = useRef(null);
    const fileInputRef = useRef(null);
    const dragOffset = useRef({ x: 0, y: 0 });
    const historyRef = useRef(null);

    useEffect(() => {
        if (!user) return;
        try {
            const saved = localStorage.getItem(`oasis_sessions_${user}`);
            if (saved) setSessions(JSON.parse(saved));
        } catch (e) {
            console.error(e);
        }
    }, [user]);

    // Scroll al top (nota más reciente) cuando el pizarrón se abre o cuando cambian las sesiones
    useEffect(() => {
        if (isOpen && !isMinimized && historyRef.current) {
            historyRef.current.scrollTop = 0;
        }
    }, [isOpen, isMinimized, sessions.length]);

    const saveSessions = (updated) => {
        setSessions(updated);
        if (user) {
            localStorage.setItem(`oasis_sessions_${user}`, JSON.stringify(updated));
        }
    };

    // Auto-guardado
    useEffect(() => {
        if (!newSessionNote.trim() && sessionAudioUrls.length === 0) return;

        const timeoutId = setTimeout(() => {
            if (activeNoteId) {
                setSessions(prev => {
                    const currentNote = prev.find(s => s.id === activeNoteId);
                    // Avoid redundant saves if content and audio array length/items match
                    if (currentNote && currentNote.content === newSessionNote && JSON.stringify(currentNote.audioUrls || []) === JSON.stringify(sessionAudioUrls)) return prev;

                    const updated = prev.map(s => 
                        s.id === activeNoteId ? { ...s, content: newSessionNote, audioUrls: sessionAudioUrls, updated: new Date().toISOString() } : s
                    );
                    if (user) localStorage.setItem(`oasis_sessions_${user}`, JSON.stringify(updated));
                    return updated;
                });
            } else {
                const newId = Date.now();
                setSessions(prev => {
                    const newSession = {
                        id: newId,
                        date: new Date().toISOString(),
                        content: newSessionNote,
                        audioUrls: sessionAudioUrls
                    };
                    const updated = [newSession, ...prev];
                    if (user) localStorage.setItem(`oasis_sessions_${user}`, JSON.stringify(updated));
                    return updated;
                });
                setActiveNoteId(newId);
            }
        }, 800); // 800ms debounce

        return () => clearTimeout(timeoutId);
    }, [newSessionNote, sessionAudioUrls, activeNoteId, user]);

    const handleSaveSession = () => {
        if (!newSessionNote.trim() && sessionAudioUrls.length === 0) return;
        
        if (activeNoteId) {
            // Update existing
            const updated = sessions.map(s => 
                s.id === activeNoteId ? { ...s, content: newSessionNote, audioUrls: sessionAudioUrls, updated: new Date().toISOString() } : s
            );
            saveSessions(updated);
        } else {
            // Create new
            const newSession = {
                id: Date.now(),
                date: new Date().toISOString(),
                content: newSessionNote,
                audioUrls: sessionAudioUrls
            };
            saveSessions([newSession, ...sessions]);
            setActiveNoteId(newSession.id);
            // Scroll al top para ver la nota recién guardada
            setTimeout(() => {
                if (historyRef.current) historyRef.current.scrollTop = 0;
            }, 50);
        }
    };

    const handleNewNote = () => {
        setActiveNoteId(null);
        setNewSessionNote('');
        setSessionAudioUrls([]);
    };

    const loadNote = (session) => {
        setActiveNoteId(session.id);
        setNewSessionNote(session.content || '');
        setSessionAudioUrls(session.audioUrls || []);
    };

    const handleDeleteSession = (e, id) => {
        e.stopPropagation();
        saveSessions(sessions.filter(s => s.id !== id));
        if (activeNoteId === id) {
            handleNewNote();
        }
    };

    const handleAudioUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingAudio(true);
        setUploadProgress(0);

        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5253";

        try {
            const uploadedUrl = await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                const formData = new FormData();
                formData.append('file', file);

                xhr.open('POST', `${API_URL}/api/oasis/upload`);
                xhr.upload.onprogress = (ev) => {
                    if (ev.lengthComputable) {
                        setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
                    }
                };
                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve(xhr.responseText);
                    } else {
                        reject(new Error('Upload failed'));
                    }
                };
                xhr.onerror = () => reject(new Error('Network error during upload'));
                xhr.send(formData);
            });

            setSessionAudioUrls(prev => [...prev, uploadedUrl]);
        } catch (error) {
            console.error("Audio upload failed:", error);
            alert("Hubo un error subiendo el audio. Inténtalo de nuevo.");
        } finally {
            setIsUploadingAudio(false);
            setUploadProgress(0);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const resolveMediaUrl = (url) => {
        if (!url) return '';
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5253";
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        if (url.startsWith('http')) return url;
        if (isLocal && (url.startsWith('/uploads/') || url.startsWith('uploads/'))) {
            if (url.startsWith('/uploads/')) return `${API_URL}${url}`;
            if (url.startsWith('uploads/')) return `${API_URL}/${url.replace('uploads/', '')}`;
        }
        return url;
    };

    // Dragging Logic
    const handlePointerDown = (e) => {
        // Prevent drag when interacting with buttons, textareas, or the scrollbar/resizer
        if (e.target.closest('button') || e.target.closest('textarea') || isMinimized || e.clientX > dragRef.current.getBoundingClientRect().right - 20) return;
        
        setIsDragging(true);
        dragOffset.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        };
        e.target.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e) => {
        if (!isDragging) return;
        const newX = e.clientX - dragOffset.current.x;
        const newY = e.clientY - dragOffset.current.y;
        
        const clampedX = Math.max(0, Math.min(newX, window.innerWidth - 100));
        const clampedY = Math.max(0, Math.min(newY, window.innerHeight - 100));
        
        setPosition({ x: clampedX, y: clampedY });
    };

    const handlePointerUp = (e) => {
        setIsDragging(false);
        e.target.releasePointerCapture(e.pointerId);
    };

    if (!user) return null;

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-[999] bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center group border-2 border-emerald-400/50"
            >
                <MessageSquare className="w-6 h-6 group-hover:animate-pulse" />
                <span className="absolute -top-10 bg-black/90 text-emerald-400 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-emerald-500/30">
                    Abrir Libreta
                </span>
            </button>
        );
    }

    return (
        <div
            ref={dragRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{ 
                transform: `translate(${position.x}px, ${position.y}px)`,
                minWidth: '300px',
                minHeight: isMinimized ? 'auto' : '300px',
                width: isMinimized ? '280px' : '450px',
                height: isMinimized ? 'auto' : '600px'
            }}
            className={`fixed top-0 left-0 z-[999] flex flex-col bg-zinc-950/95 backdrop-blur-xl border-2 border-emerald-500/50 rounded-2xl shadow-2xl transition-[width,height] duration-300 ${isDragging ? 'cursor-grabbing opacity-90' : 'cursor-grab'} ${!isMinimized ? '[resize:both] overflow-hidden' : 'overflow-hidden'}`}
        >
            {/* Header / Drag Handle */}
            <div className="bg-emerald-950/50 p-3 flex items-center justify-between border-b border-emerald-500/30 select-none flex-shrink-0">
                <div className="flex items-center gap-2 text-emerald-400">
                    <Move size={14} className="opacity-50" />
                    <h2 className="text-xs font-black uppercase tracking-widest">Libreta Clínica</h2>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setIsMinimized(!isMinimized)} className="text-emerald-400/50 hover:text-emerald-400 transition-colors p-1 bg-black/20 rounded">
                        {isMinimized ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
                    </button>
                    <button onClick={() => setIsOpen(false)} className="text-rose-400/50 hover:text-rose-400 transition-colors p-1 bg-black/20 rounded">
                        <X size={12} />
                    </button>
                </div>
            </div>

            {/* Body */}
            {!isMinimized && (
                <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden h-full">
                    {/* Editor Area (Flex grows based on total height) */}
                    <div className="flex flex-col gap-2 h-1/2 min-h-[150px]">
                        <div className="flex items-center justify-between px-1">
                            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                                {activeNoteId ? 'Editando Nota Guardada' : 'Nueva Nota'}
                            </span>
                        </div>
                        <div className="flex flex-col flex-1 min-h-0">
                            <textarea
                                value={newSessionNote}
                                onChange={(e) => setNewSessionNote(e.target.value)}
                                placeholder="Anota reflexiones, avances o dudas..."
                                className="w-full flex-1 bg-black/40 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-100/90 resize-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none placeholder:text-zinc-700 custom-sidebar-scroll"
                            />
                            {sessionAudioUrls.length > 0 && (
                                <div className="mt-2 flex flex-col gap-2 max-h-[100px] overflow-y-auto custom-sidebar-scroll">
                                    {sessionAudioUrls.map((url, i) => (
                                        <div key={i} className="flex items-center gap-2 bg-emerald-950/30 border border-emerald-500/20 p-2 rounded-lg">
                                            <Headphones size={12} className="text-emerald-400" />
                                            <audio controls src={resolveMediaUrl(url)} className="h-6 w-full" />
                                            <button onClick={() => setSessionAudioUrls(prev => prev.filter((_, idx) => idx !== i))} className="text-rose-400 hover:text-rose-300 p-1">
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <input 
                                type="file" 
                                accept="audio/*" 
                                className="hidden" 
                                ref={fileInputRef} 
                                onChange={handleAudioUpload} 
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploadingAudio}
                                className={`px-4 py-2 border rounded-lg font-bold uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2 ${isUploadingAudio ? 'bg-zinc-800/50 border-white/5 text-zinc-500' : 'bg-emerald-900/30 hover:bg-emerald-800/40 border-emerald-500/20 text-emerald-300'}`}
                            >
                                {isUploadingAudio ? (
                                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {uploadProgress}%</>
                                ) : (
                                    <><Headphones className="w-3.5 h-3.5" /> Pista</>
                                )}
                            </button>
                            <button
                                onClick={handleSaveSession}
                                className="flex-1 py-2 bg-emerald-600/20 hover:bg-emerald-500/40 border border-emerald-500/30 text-emerald-400 rounded-lg font-bold uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2"
                            >
                                <Save className="w-3.5 h-3.5" /> {activeNoteId ? 'Actualizar' : 'Guardar'}
                            </button>
                            <button
                                onClick={handleNewNote}
                                className="px-4 py-2 bg-zinc-800/50 hover:bg-zinc-700 border border-white/10 text-zinc-300 rounded-lg font-bold uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2"
                            >
                                <Plus className="w-3.5 h-3.5" /> Nueva
                            </button>
                        </div>
                    </div>

                    {/* History Area */}
                    <div ref={historyRef} className="flex-1 overflow-y-auto custom-sidebar-scroll border border-white/5 rounded-xl bg-black/20 p-2 space-y-2 h-1/2">
                        {sessions.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-center opacity-50">
                                <span className="text-[10px] font-mono uppercase text-emerald-500">Sin anotaciones.</span>
                            </div>
                        ) : (
                            sessions.map((session, index) => (
                                <div 
                                    key={session.id} 
                                    onClick={() => loadNote(session)}
                                    className={`bg-zinc-900/50 border-l-[3px] p-3 rounded-r-lg group hover:bg-zinc-800 transition-colors cursor-pointer ${activeNoteId === session.id ? 'border-emerald-400 bg-emerald-950/20' : 'border-emerald-500/30'}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="text-[9px] font-black uppercase flex gap-2 items-center">
                                            <span className={`${activeNoteId === session.id ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-400'} px-1.5 py-0.5 rounded`}>
                                                S{sessions.length - index}
                                            </span>
                                            <span className="text-zinc-500">{new Date(session.updated || session.date).toLocaleDateString()}</span>
                                        </div>
                                        <button 
                                            onClick={(e) => handleDeleteSession(e, session.id)}
                                            className="text-zinc-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <p className="text-zinc-300 text-xs whitespace-pre-wrap font-sans leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all">
                                        {session.content}
                                    </p>
                                    {session.audioUrls && session.audioUrls.length > 0 && (
                                        <div className="mt-3 flex flex-col gap-2">
                                            {session.audioUrls.map((url, i) => (
                                                <audio key={i} controls src={resolveMediaUrl(url)} className="h-6 w-full opacity-80 hover:opacity-100 transition-opacity" />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FloatingNotebook;
