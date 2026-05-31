import React, { useState, useRef, useEffect } from 'react';
import { Eye, CheckSquare, Trash2, Edit3, X, Check, Search } from 'lucide-react';

const formatUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `http://localhost:5033${url.startsWith('/') ? '' : '/'}${url}`;
};

export default function BitacoraExistencial({ 
    blocks, setBlocks, accent, onClose, user, editBlock, openNewComposer, 
    deleteBlocks, onNewChat, onOpenSimpleNotes 
}) {
    const [releaseTab, setReleaseTabRaw] = useState(() => localStorage.getItem('oasis_bitacora_tab') || 'all');
    const setReleaseTab = (tab) => {
        setReleaseTabRaw(tab);
        localStorage.setItem('oasis_bitacora_tab', tab);
    };
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    
    // Default to the red accent from the screenshot
    const themeAccent = '#ef4444'; 

    const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '#ef4444');
        return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '239, 68, 68';
    };

    const handleCardClick = (id) => {
        if (isSelectionMode) {
            setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
        } else {
            const b = blocks.find(x => x.id === id);
            if (b) {
                onClose();
                editBlock(b);
            }
        }
    };

    const filteredReleases = blocks.filter(b => {
        if (b.id === 'profile_settings' || b.id === 'user_settings') return false;
        
        const isRes = b.content && typeof b.content === 'string' && b.content.includes('[resonancia]');
        const isDia = b.entries && b.entries.length > 0;
        const isInsight = b.type === 'insight';
        const isNote = (b.type === 'text' || b.type === 'insight') && !isRes && !isDia;
        const isImg = b.type === 'image' || b.type === 'relic';
        const isChat = b.type === 'conversation' || b.isVirtual;

        if (releaseTab === 'all') return true;
        if (releaseTab === 'notes') return isNote;
        if (releaseTab === 'diary') return isDia;
        if (releaseTab === 'resonance') return isRes || isInsight;
        if (releaseTab === 'chats') return isChat;
        if (releaseTab === 'images') return isImg;
        return true;
    }).sort((a, b) => {
        const tA = new Date(a.metadata?.timestamp || a.timestamp || 0).getTime();
        const tB = new Date(b.metadata?.timestamp || b.timestamp || 0).getTime();
        return tB - tA;
    });

    return (
        <div
            className="fixed inset-x-0 md:inset-x-[10vw] lg:inset-x-[20vw] xl:inset-x-[25vw] top-[140px] md:top-[100px] bottom-0 rounded-t-[2.5rem] border-t border-x border-white/10 z-[1500] flex flex-col bg-[#050506]/95 backdrop-blur-3xl text-white animate-in fade-in slide-in-from-bottom-10 duration-700 overflow-hidden shadow-[0_-20px_50px_rgba(0,0,0,0.8)] md:shadow-[0_0_100px_rgba(0,0,0,0.8)] pb-safe transition-all duration-500"
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
            {/* TOP BAR / HEADER */}
            <div className="shrink-0 px-4 pt-6 pb-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Eye size={18} className="text-red-500 animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-[0.15em] text-white">Bitácora Existencial</span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            setIsSelectionMode(!isSelectionMode);
                            setSelectedIds([]);
                        }}
                        className={`w-8 h-8 rounded-full border transition-all flex items-center justify-center shrink-0 ${isSelectionMode
                            ? 'bg-red-500/10 border-red-500/30 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                            : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'
                            }`}
                    >
                        <CheckSquare size={14} />
                    </button>
                    <button
                        onClick={() => {
                            if (window.confirm("¿Estás seguro de eliminar los datos seleccionados?")) {
                                if (isSelectionMode && selectedIds.length > 0) {
                                    deleteBlocks(selectedIds);
                                    setSelectedIds([]);
                                    setIsSelectionMode(false);
                                }
                            }
                        }}
                        className={`w-8 h-8 rounded-full border transition-all flex items-center justify-center shrink-0 text-red-500 hover:bg-red-600 hover:text-black ${isSelectionMode && selectedIds.length > 0 ? 'bg-red-500/30 border-red-500' : 'bg-red-950/20 border-red-900/30'}`}
                    >
                        <Trash2 size={14} />
                    </button>
                    <button
                        onClick={onOpenSimpleNotes}
                        className="w-8 h-8 rounded-full border border-white/10 bg-white/5 transition-all flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-black"
                    >
                        <Edit3 size={14} />
                    </button>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full border border-white/10 bg-[#18181b] ml-2 transition-all flex items-center justify-center text-zinc-400 hover:text-white"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* TABS */}
            <div className="shrink-0 flex gap-2 overflow-x-auto no-scrollbar pt-4 pb-2 px-4 whitespace-nowrap">
                {[
                    { id: 'all', label: 'TODOS' },
                    { id: 'notes', label: 'NOTAS' },
                    { id: 'diary', label: 'DIARIO' },
                    { id: 'resonance', label: 'RESONANCIAS' },
                    { id: 'chats', label: 'DIÁLOGOS AI' },
                    { id: 'images', label: 'MULTIMEDIA' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setReleaseTab(tab.id)}
                        className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${releaseTab === tab.id
                            ? 'bg-red-500 text-black font-black shadow-lg hover:scale-105'
                            : 'bg-white/5 text-zinc-500 hover:text-white hover:bg-white/10'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="shrink-0 flex items-center justify-between px-4 mt-2">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                    Todos los registros <span className="ml-2 px-2 py-0.5 bg-white/5 rounded-full text-zinc-400"> + NUEVA NOTA </span>
                </span>
            </div>

            {/* LIST */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-4 pb-12">
                {filteredReleases.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                            No hay registros
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {filteredReleases.map(b => {
                            const isRes = b.content && typeof b.content === 'string' && b.content.includes('[resonancia]');
                            const isDia = b.entries && b.entries.length > 0;
                            const isInsight = b.type === 'insight';
                            const isNote = (b.type === 'text' || b.type === 'insight') && !isRes && !isDia;
                            const isImg = b.type === 'image' || b.type === 'relic';
                            const isChat = b.type === 'conversation' || b.isVirtual;

                            const noteColor = b.color || '#ffffff';
                            const cardBorderColor = isChat ? '#d946ef' : (isRes ? '#a855f7' : (isDia ? '#f59e0b' : (isImg ? '#3b82f6' : (isNote ? '#22c55e' : noteColor))));
                            const typeLabel = isChat ? 'AI' : (isRes ? 'RESONANCIA' : (isDia ? 'DIARIO' : (isImg ? 'MULTIMEDIA' : 'NOTA')));

                            let textSnippet = '';
                            if (isDia) {
                                textSnippet = b.entries[0]?.text || '';
                            } else if (isRes) {
                                const resMatch = b.content.match(/\[resonancia\]([\s\S]*?)(?=\[impacto\]|$)/);
                                textSnippet = resMatch ? resMatch[1].trim() : b.content.replace(/\[resonancia\]|\[impacto\]|\[extrano\]/g, '').trim();
                            } else if (isChat) {
                                let msgs = [];
                                try { msgs = JSON.parse(b.content) || []; } catch (e) { }
                                textSnippet = msgs[msgs.length - 1]?.content || '';
                            } else {
                                textSnippet = b.content || '';
                            }

                            const timeString = b.metadata?.timestamp
                                ? new Date(b.metadata.timestamp).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
                                : (b.timestamp ? new Date(b.timestamp).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : '');

                            const isSelected = selectedIds.includes(b.id);

                            return (
                                <div
                                    key={b.id}
                                    onClick={() => handleCardClick(b.id)}
                                    className={`group/note border rounded-xl px-3 py-3 transition-all duration-200 flex items-center justify-between gap-3 text-left cursor-pointer active:scale-[0.99] relative overflow-hidden ${isSelected
                                        ? 'bg-red-500/10 border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.15)]'
                                        : 'bg-transparent hover:bg-white/[0.02] border-white/5 hover:border-white/20'
                                        }`}
                                    style={isSelected ? { borderColor: themeAccent, backgroundColor: `${themeAccent}10` } : undefined}
                                >
                                    <div className="absolute left-0 top-0 bottom-0 w-[2px]" style={{ backgroundColor: cardBorderColor }} />

                                    {isSelectionMode && (
                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${isSelected ? 'bg-red-500 border-red-500 text-black' : 'border-zinc-600'}`}>
                                            {isSelected && <Check size={10} strokeWidth={4} />}
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0 flex items-center gap-3">
                                        <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-zinc-500 w-16 md:w-20 shrink-0">
                                            {typeLabel}
                                        </span>

                                        <h4 className="text-xs md:text-sm font-bold text-white/90 truncate max-w-[140px] md:max-w-[200px] shrink-0">
                                            {b.caption || 'Sin título'}
                                        </h4>
                                        <p className="text-[10px] text-zinc-500 font-sans truncate flex-1 italic hidden md:block">
                                            {textSnippet || ''}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-4 shrink-0 opacity-60 group-hover/note:opacity-100 transition-opacity">
                                        <span className="text-[10px] font-mono text-zinc-500">
                                            {b.isPublic ? 'Público' : 'Privado'}
                                        </span>
                                        <span className="text-[10px] font-mono text-zinc-500">
                                            {timeString}
                                        </span>
                                        <span className="text-red-500 transition-transform group-hover/note:translate-x-1">
                                            →
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
