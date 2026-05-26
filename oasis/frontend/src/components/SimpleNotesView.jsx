import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Plus, Search, Mic, Trash2, Check, X } from 'lucide-react';

// ── Helpers ────────────────────────────────────────────────────────────────
const getBlockTime = (b) => {
    if (!b) return 0;
    if (b.metadata?.timestamp) {
        const t = new Date(b.metadata.timestamp).getTime();
        if (!isNaN(t)) return t;
    }
    if (b.timestamp) {
        const t = new Date(b.timestamp).getTime();
        if (!isNaN(t)) return t;
    }
    const match = String(b.id).match(/\d+/);
    if (match) return Number(match[0]);
    return 0;
};

const formatRelative = (val) => {
    if (!val) return '';
    const d = new Date(val);
    if (isNaN(d.getTime())) return '';
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `hace ${diffMins}m`;
    if (diffHours < 24) return `hace ${diffHours}h`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `hace ${diffDays}d`;
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
};

const groupByDate = (notes) => {
    const groups = {};
    notes.forEach(n => {
        const blockTime = getBlockTime(n);
        const ts = blockTime ? new Date(blockTime).toISOString() : new Date().toISOString();
        const d = new Date(ts);
        const today = new Date();
        const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
        let label;
        if (d.toDateString() === today.toDateString()) label = 'Hoy';
        else if (d.toDateString() === yesterday.toDateString()) label = 'Ayer';
        else label = d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
        if (!groups[label]) groups[label] = [];
        groups[label].push(n);
    });
    return groups;
};

// ── Component ──────────────────────────────────────────────────────────────
const SimpleNotesView = React.forwardRef(({ blocks, setBlocks, accent, onClose, user, onEditorToggle }, ref) => {
    const [selectedId, setSelectedId] = useState(null);
    const [search, setSearch] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editCaption, setEditCaption] = useState('');
    const [editContent, setEditContent] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [viewportHeight, setViewportHeight] = useState(
        () => window.visualViewport?.height || window.innerHeight
    );

    const textareaRef = useRef(null);
    const recognitionRef = useRef(null);
    const saveTimerRef = useRef(null);

    React.useImperativeHandle(ref, () => ({
        createNewNote
    }));

    useEffect(() => {
        if (onEditorToggle) {
            onEditorToggle(!!selectedId);
        }
    }, [selectedId, onEditorToggle]);

    useEffect(() => {
        const update = () => {
            const h = window.visualViewport?.height || window.innerHeight;
            setViewportHeight(h);
        };
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', update);
            window.visualViewport.addEventListener('scroll', update);
        }
        window.addEventListener('resize', update);
        update();
        return () => {
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', update);
                window.visualViewport.removeEventListener('scroll', update);
            }
            window.removeEventListener('resize', update);
        };
    }, []);

    // STT setup
    useEffect(() => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SR) {
            recognitionRef.current = new SR();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'es-ES';
            recognitionRef.current.onresult = (event) => {
                let final = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) final += event.results[i][0].transcript;
                }
                if (final) setEditContent(prev => prev + (prev.trim() ? ' ' : '') + final);
            };
            recognitionRef.current.onend = () => setIsRecording(false);
        }
    }, []);

    // Auto-save debounced
    const persistEdit = useCallback((id, caption, content) => {
        setBlocks(prev => {
            const updated = prev.map(b => b.id === id ? {
                ...b,
                caption,
                content,
                metadata: { ...b.metadata, timestamp: new Date().toISOString() }
            } : b);
            return updated;
        });
    }, [setBlocks]);

    // Save immediately on app switch / exit / screen lock
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden' && selectedId) {
                if (saveTimerRef.current) {
                    clearTimeout(saveTimerRef.current);
                }
                persistEdit(selectedId, editCaption, editContent);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('pagehide', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('pagehide', handleVisibilityChange);
        };
    }, [selectedId, editCaption, editContent, persistEdit]);

    // Filter: only text notes, no diary entries, not public
    const notes = blocks
        .filter(b =>
            b.type === 'text' &&
            !b.isPublic &&
            !(b.entries && b.entries.length > 0)
        )
        .sort((a, b) => getBlockTime(b) - getBlockTime(a));

    const filtered = search.trim()
        ? notes.filter(n =>
            (n.caption || '').toLowerCase().includes(search.toLowerCase()) ||
            (n.content || '').toLowerCase().includes(search.toLowerCase())
          )
        : notes;

    const grouped = groupByDate(filtered);

    const selectedNote = notes.find(n => n.id === selectedId);

    const scheduleAutoSave = (id, caption, content) => {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => persistEdit(id, caption, content), 800);
    };

    const openNote = (note) => {
        setSelectedId(note.id);
        setEditCaption(note.caption || '');
        setEditContent(note.content || '');
        setIsEditing(false);
    };

    const createNewNote = () => {
        const newBlock = {
            id: Date.now().toString(),
            type: 'text',
            x: 0, y: 0,
            content: '',
            caption: '',
            isPublic: false,
            color: accent,
            rotation: 0,
            username: user || 'anon',
            metadata: { origin: 'simple_notes', timestamp: new Date().toISOString() },
            entries: [],
        };
        setBlocks(prev => [newBlock, ...prev]);
        setSelectedId(newBlock.id);
        setEditCaption('');
        setEditContent('');
        setTimeout(() => {
            setIsEditing(true);
            textareaRef.current?.focus();
        }, 100);
    };

    const deleteNote = (id) => {
        setBlocks(prev => prev.filter(b => b.id !== id));
        if (selectedId === id) setSelectedId(null);
    };

    const handleCaptionChange = (e) => {
        const val = e.target.value;
        setEditCaption(val);
        if (selectedId) scheduleAutoSave(selectedId, val, editContent);
    };

    const handleContentChange = (e) => {
        const val = e.target.value;
        setEditContent(val);
        if (selectedId) scheduleAutoSave(selectedId, editCaption, val);
        // Auto-resize
        e.target.style.height = 'auto';
        e.target.style.height = e.target.scrollHeight + 'px';
    };

    const toggleRecording = () => {
        if (!recognitionRef.current) return;
        if (isRecording) {
            recognitionRef.current.stop();
        } else {
            recognitionRef.current.start();
            setIsRecording(true);
        }
    };

    const handleBack = () => {
        if (selectedId) {
            if (saveTimerRef.current) {
                clearTimeout(saveTimerRef.current);
                persistEdit(selectedId, editCaption, editContent);
            }
            setSelectedId(null);
            setIsEditing(false);
        } else {
            onClose();
        }
    };

    const accentColor = accent || '#bef264';

    // ── EDITOR VIEW ────────────────────────────────────────────────────────
    if (selectedId) {
        return (
            <div
                className="fixed inset-0 z-[500] flex flex-col bg-[#080809] text-white select-none"
                style={{ height: viewportHeight + 'px' }}
            >
                {/* TOP BAR */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 shrink-0">
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-1.5 text-sm font-semibold"
                        style={{ color: accentColor }}
                    >
                        <ArrowLeft size={18} />
                        Notas
                    </button>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => deleteNote(selectedId)}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-600 hover:text-red-400 transition-colors"
                        >
                            <Trash2 size={15} />
                        </button>
                        <button
                            onClick={() => {
                                if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
                                persistEdit(selectedId, editCaption, editContent);
                                setIsEditing(false);
                            }}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-600 hover:text-white transition-colors"
                        >
                            <Check size={15} />
                        </button>
                    </div>
                </div>

                {/* EDITOR CONTENT */}
                <div className="flex-1 overflow-y-auto no-scrollbar px-5 pt-4 pb-2">
                    {/* Timestamp */}
                    <p className="text-[11px] text-zinc-600 mb-3 text-center font-medium">
                        {formatRelative(getBlockTime(selectedNote))}
                    </p>

                    {/* Title */}
                    <input
                        value={editCaption}
                        onChange={handleCaptionChange}
                        onFocus={() => setIsEditing(true)}
                        placeholder="Título"
                        className="w-full bg-transparent text-white text-[26px] font-bold leading-tight outline-none placeholder:text-zinc-800 mb-3"
                        style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                    />

                    {/* Body */}
                    <textarea
                        ref={textareaRef}
                        value={editContent}
                        onChange={handleContentChange}
                        onFocus={() => setIsEditing(true)}
                        placeholder="Escribe aquí con total libertad..."
                        rows={1}
                        className="w-full bg-transparent text-zinc-200 text-[16px] leading-relaxed outline-none resize-none placeholder:text-zinc-800 no-scrollbar overflow-hidden"
                        style={{
                            fontFamily: 'system-ui, -apple-system, sans-serif',
                            minHeight: '200px',
                        }}
                    />
                </div>

                {/* BOTTOM TOOLBAR */}
                <div
                    className="shrink-0 border-t border-white/5 bg-[#080809] px-4 py-3 flex items-center gap-3"
                    style={{ paddingBottom: `max(12px, env(safe-area-inset-bottom))` }}
                >
                    {/* Voice */}
                    <button
                        onClick={toggleRecording}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                            isRecording
                                ? 'bg-red-500 text-white animate-pulse'
                                : 'bg-white/5 text-zinc-400 hover:text-white'
                        }`}
                    >
                        <Mic size={16} />
                    </button>

                    {/* Accent tape stripe */}
                    <div className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                        {['■', '●', '▲', '★', '→'].map((sym, i) => (
                            <button
                                key={i}
                                onClick={() => setEditContent(prev => prev + sym)}
                                className="w-9 h-9 rounded-xl bg-white/5 text-zinc-400 hover:text-white text-sm flex items-center justify-center transition-colors shrink-0"
                            >
                                {sym}
                            </button>
                        ))}
                    </div>

                    {/* Color tape bar */}
                    <div
                        className="w-1.5 h-6 rounded-full shrink-0"
                        style={{ backgroundColor: accentColor }}
                    />
                </div>
            </div>
        );
    }

    // ── LIST VIEW ──────────────────────────────────────────────────────────
    return (
        <div
            className="fixed inset-0 z-[500] flex flex-col bg-[#080809] text-white pt-24 md:pt-28"
            style={{ height: viewportHeight + 'px' }}
        >
            {/* TOP BAR */}
            <div className="shrink-0 px-4 pt-5 pb-3 border-b border-white/5">
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={onClose}
                        className="flex items-center gap-1.5 text-sm font-semibold"
                        style={{ color: accentColor }}
                    >
                        <ArrowLeft size={18} />
                        Pizarrón
                    </button>
                    <h1 className="text-base font-bold text-white">Notas</h1>
                    <button
                        onClick={createNewNote}
                        className="w-9 h-9 rounded-full flex items-center justify-center"
                        style={{ color: accentColor }}
                    >
                        <Plus size={20} />
                    </button>
                </div>

                {/* Search */}
                <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
                    <Search size={14} className="text-zinc-600 shrink-0" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar..."
                        className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-700"
                    />
                    {search && (
                        <button onClick={() => setSearch('')}>
                            <X size={14} className="text-zinc-600" />
                        </button>
                    )}
                </div>
            </div>

            {/* NOTE LIST */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
                {Object.keys(grouped).length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
                        <p className="text-zinc-700 text-sm">No hay notas aún.</p>
                        <button
                            onClick={createNewNote}
                            className="px-6 py-3 rounded-2xl text-sm font-bold text-black"
                            style={{ backgroundColor: accentColor }}
                        >
                            + Nueva Nota
                        </button>
                    </div>
                ) : (
                    Object.entries(grouped).map(([label, groupNotes]) => (
                        <div key={label}>
                            {/* Date group header */}
                            <div className="px-4 py-2 sticky top-0 bg-[#080809]/90 backdrop-blur-sm">
                                <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-600">
                                    {label}
                                </span>
                            </div>

                            {groupNotes.map((note, i) => (
                                <button
                                    key={note.id}
                                    onClick={() => openNote(note)}
                                    className={`w-full text-left px-4 py-3 transition-colors hover:bg-white/5 active:bg-white/10 ${
                                        i < groupNotes.length - 1 ? 'border-b border-white/[0.04]' : ''
                                    }`}
                                >
                                    {/* Accent stripe */}
                                    <div className="flex items-start gap-3">
                                        <div
                                            className="w-1 h-10 rounded-full shrink-0 mt-0.5"
                                            style={{ backgroundColor: note.color || accentColor, opacity: 0.7 }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-baseline justify-between gap-2 mb-0.5">
                                                <p className="text-[15px] font-semibold text-white truncate">
                                                    {note.caption || 'Sin título'}
                                                </p>
                                                <span className="text-[11px] text-zinc-600 shrink-0">
                                                    {formatRelative(getBlockTime(note))}
                                                </span>
                                            </div>
                                            <p className="text-[13px] text-zinc-500 truncate leading-snug">
                                                {note.content || 'Sin contenido'}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ))
                )}
            </div>

            {/* BOTTOM FAB */}
            <div
                className="shrink-0 px-4 pb-4 pt-2 flex items-center justify-between border-t border-white/5 bg-[#080809]"
                style={{ paddingBottom: `max(16px, env(safe-area-inset-bottom))` }}
            >
                <span className="text-[12px] text-zinc-700 font-medium">
                    {notes.length} {notes.length === 1 ? 'nota' : 'notas'}
                </span>
                <button
                    onClick={createNewNote}
                    className="w-12 h-12 rounded-full flex items-center justify-center shadow-xl text-black font-bold transition-transform active:scale-95 hover:scale-105"
                    style={{ backgroundColor: accentColor }}
                >
                    <Plus size={22} strokeWidth={2.5} />
                </button>
            </div>
        </div>
    );
});

export default SimpleNotesView;
