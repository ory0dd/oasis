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
const SimpleNotesView = React.forwardRef(({ blocks, setBlocks, accent, onClose, user, editBlock, openNewComposer }, ref) => {
    const [search, setSearch] = useState('');
    const [viewportHeight, setViewportHeight] = useState(
        () => window.visualViewport?.height || window.innerHeight
    );

    React.useImperativeHandle(ref, () => ({
        createNewNote
    }));

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

    const openNote = (note) => {
        onClose();
        editBlock(note);
    };

    const createNewNote = () => {
        onClose();
        openNewComposer();
    };

    const accentColor = accent || '#bef264';

    // ── LIST VIEW ──────────────────────────────────────────────────────────
    return (
        <div
            className="fixed inset-x-0 md:inset-x-[10vw] lg:inset-x-[20vw] xl:inset-x-[25vw] top-[140px] md:top-[100px] rounded-t-[2.5rem] border-t border-x border-white/10 z-[1500] flex flex-col bg-[#050506]/95 backdrop-blur-3xl text-white animate-in fade-in slide-in-from-bottom-10 duration-700 overflow-hidden shadow-[0_-20px_50px_rgba(0,0,0,0.8)] md:shadow-[0_0_100px_rgba(0,0,0,0.8)] pb-safe transition-all duration-500"
            style={{ height: window.innerWidth < 768 && window.visualViewport?.height > 96 ? (window.visualViewport.height - 96) + 'px' : (window.visualViewport?.height || window.innerHeight) + 'px' }}
            onTouchStart={(e) => {
                e.stopPropagation();
                const touch = e.touches[0];
                e.currentTarget.dataset.startY = touch.clientY;
                e.currentTarget.style.transition = 'none';
            }}
            onTouchMove={(e) => {
                e.stopPropagation();
                const startY = parseFloat(e.currentTarget.dataset.startY || 0);
                const currentY = e.touches[0].clientY;
                const deltaY = currentY - startY;

                const scrollable = e.target.closest('.overflow-y-auto');
                if (scrollable && scrollable.scrollTop > 0) return;

                if (deltaY > 0) {
                    e.currentTarget.style.transform = `translateY(${deltaY}px)`;
                }

                if (deltaY > 120) {
                    e.currentTarget.style.transition = 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
                    e.currentTarget.style.transform = `translateY(100%)`;
                    setTimeout(() => onClose(), 200);
                }
            }}
            onTouchEnd={(e) => {
                const startY = parseFloat(e.currentTarget.dataset.startY || 0);
                const currentY = e.changedTouches[0].clientY;
                const deltaY = currentY - startY;
                if (deltaY <= 120) {
                    e.currentTarget.style.transition = 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
                    e.currentTarget.style.transform = `translateY(0px)`;
                }
            }}
            onPointerDown={e => e.stopPropagation()}
            onWheel={(e) => {
                e.stopPropagation();
                const scrollable = e.target.closest('.overflow-y-auto');
                if (scrollable && (scrollable.scrollTop > 0 || e.deltaY > 0)) return;

                if (e.deltaY < -50) {
                    e.currentTarget.style.transition = 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
                    e.currentTarget.style.transform = `translateY(100%)`;
                    setTimeout(() => onClose(), 200);
                }
            }}
        >
            {/* TOP BAR */}
            <div className="shrink-0 px-4 pt-5 pb-3 border-b border-white/5">
                <div className="flex items-center justify-center mb-4 relative h-9">
                    <h1 className="text-base font-bold text-white">Notas</h1>
                </div>

                {/* Search */}
                <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
                    <Search size={14} className="text-zinc-600 shrink-0" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar..."
                        className="flex-1 bg-transparent text-base text-white outline-none placeholder:text-zinc-700"
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

            {/* BOTTOM SAFE AREA & COUNT */}
            <div className="shrink-0 pt-6 pb-8 md:pb-10 flex justify-center bg-gradient-to-t from-[#050506] via-[#050506]/80 to-transparent">
                <span className="text-[11px] font-medium text-zinc-600 uppercase tracking-widest">
                    {notes.length} {notes.length === 1 ? 'nota' : 'notas'} en total
                </span>
            </div>

            {/* FLOATING ACTION BUTTON */}
            <button
                onClick={createNewNote}
                className="absolute bottom-6 md:bottom-8 right-6 md:right-8 w-14 h-14 rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.8)] text-black font-bold transition-transform hover:scale-105 active:scale-95 z-50 border border-white/20"
                style={{ backgroundColor: accentColor }}
                title="Nueva Nota"
            >
                <Plus size={26} strokeWidth={2.5} />
            </button>
        </div>
    );
});

export default SimpleNotesView;
