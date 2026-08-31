import React, { useState, useRef, useEffect } from 'react';
import { Eye, CheckSquare, Trash2, Edit3, X, Check, Search, ChevronDown, ImageIcon } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5046';
const formatUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

export default function BitacoraExistencial({ activeCanvasId, setActiveCanvasId, blocks, setBlocks, accent, onClose, user, editBlock, openNewComposer, 
    deleteBlocks, onNewChat, onOpenSimpleNotes, isLoading
}) {
    const [releaseTab, setReleaseTabRaw] = useState(() => localStorage.getItem('oasis_bitacora_tab') || 'all');
    const setReleaseTab = (tab) => {
        setReleaseTabRaw(tab);
        localStorage.setItem('oasis_bitacora_tab', tab);
    };
    
    const [viewMode, setViewMode] = useState('notes'); // 'notes' | 'canvases'
    const [editingCanvasId, setEditingCanvasId] = useState(null);
    const [editingCanvasName, setEditingCanvasName] = useState("");

    
    const storedCanvases = blocks.filter(b => b.type === 'canvas').sort((a, b) => b.timestamp - a.timestamp);
    const hasDefaultCanvas = storedCanvases.find(c => c.id === 'canvas_default');
    const canvases = hasDefaultCanvas ? storedCanvases : [
        { id: 'canvas_default', type: 'canvas', content: 'Pizarrón Principal', timestamp: 0 },
        ...storedCanvases
    ];

    const currentCanvas = canvases.find(c => c.id === activeCanvasId) || { text: 'Pizarrón 1' };

    const handleCreateCanvas = () => {
        const newId = 'canvas_' + Date.now();
        const newCanvas = { id: newId, type: 'canvas', content: 'Nuevo Pizarrón', timestamp: new Date().toISOString(), user: user };
        setBlocks(prev => [...prev, newCanvas]);
        setActiveCanvasId(newId);
        setViewMode('notes');
    };

    const handleRenameCanvas = (id, newName) => {
        const exists = blocks.some(b => b.id === id);
        if (!exists) {
            setBlocks(prev => [...prev, { id, type: 'canvas', content: newName, timestamp: new Date().toISOString(), user }]);
        } else {
            setBlocks(prev => prev.map(b => b.id === id ? { ...b, content: newName } : b));
        }
        setEditingCanvasId(null);
    };

    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);
    const themeAccent = accent || '#ef4444'; 

    const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '#ef4444');
        return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '239, 68, 68';
    };

    const isBitacoraItem = (b, canvasId) => {
        if (!b) return false;
        if (b.type === 'canvas') return false;
        if (b.canvasId && b.canvasId !== canvasId) return false;
        if (!b.canvasId && canvasId !== 'canvas_default') return false;

        if (b.id === 'profile_settings' || b.id === 'user_settings') return false;

        // Ocultar notas de diagnóstico / preguntas existenciales del mapa funcional
        if (b.metadata?.isOnboardingDiagnostic) return false;
        if (b.content && typeof b.content === 'string') {
            const diagnosticTitles = [
                '**Origen y Raíces**',
                '**Dinámicas Invisibles**',
                '**Sombra de Autoexigencia**',
                '**Parálisis**',
                '**Relación Temporal**',
                '**Ritmo y Presión**',
                '**Premisa de Realidad**',
                '**Certeza Íntima**'
            ];
            if (diagnosticTitles.some(title => b.content.includes(title))) {
                return false;
            }
        }
        return true;
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
        if (!isBitacoraItem(b, activeCanvasId)) return false;
        
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
        let tA = new Date(a.metadata?.timestamp || a.timestamp || 0).getTime();
        let tB = new Date(b.metadata?.timestamp || b.timestamp || 0).getTime();
        if (isNaN(tA)) tA = 0;
        if (isNaN(tB)) tB = 0;
        return tB - tA;
    });

    return (
        <div
            className="fixed inset-x-0 md:inset-x-[10vw] lg:inset-x-[20vw] xl:inset-x-[25vw] top-[72px] md:top-[100px] bottom-0 rounded-t-[2.5rem] border-t border-x border-white/10 z-[1500] flex flex-col bg-[#050506]/95 backdrop-blur-md text-white shadow-[0_-20px_50px_rgba(0,0,0,0.8)] pb-safe pb-24 overflow-hidden animate-in fade-in slide-in-from-bottom-[60%] duration-500 transition-all pointer-events-auto"
            onTouchStart={(e) => {
                e.stopPropagation();
                const touch = e.touches[0];
                const rect = e.currentTarget.getBoundingClientRect();
                if (touch.clientY - rect.top <= 100) {
                    e.currentTarget.dataset.dragAllowed = 'true';
                    e.currentTarget.dataset.startY = touch.clientY;
                    e.currentTarget.style.transition = 'none';
                } else {
                    e.currentTarget.dataset.dragAllowed = 'false';
                }
            }}
            onTouchMove={(e) => {
                e.stopPropagation();
                if (e.currentTarget.dataset.dragAllowed !== 'true') return;
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
                if (e.currentTarget.dataset.dragAllowed !== 'true') return;
                const startY = parseFloat(e.currentTarget.dataset.startY || 0);
                const currentY = e.changedTouches[0].clientY;
                const deltaY = currentY - startY;
                if (deltaY <= 120) {
                    e.currentTarget.style.transition = 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
                    e.currentTarget.style.transform = `translateY(0px)`;
                }
            }}
            onPointerDown={e => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
        >
            
            {viewMode === 'canvases' ? (
                <>
                    <div className="shrink-0 flex items-center justify-between p-4 border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                                LIBRERO <span className="text-zinc-600 text-sm font-normal">/ {canvases.length}</span>
                            </h2>
                        </div>
                        <button onClick={onClose} className="w-8 h-8 rounded-full border border-white/10 bg-[#18181b] flex items-center justify-center text-zinc-400 hover:text-white">
                            <ChevronDown size={18} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 no-scrollbar">
                        <button onClick={handleCreateCanvas} className="w-full p-6 rounded-3xl border-2 border-dashed border-accent/30 bg-accent/5 hover:bg-accent/10 transition-all flex flex-col items-center justify-center gap-2 text-accent">
                            <span className="text-2xl font-light">+</span>
                            <span className="text-sm font-medium tracking-wide">Crear Nuevo Pizarrón</span>
                        </button>

                        <div className="grid grid-cols-2 gap-4">
                            {canvases.map(canvas => (
                                <div key={canvas.id} onClick={() => { setActiveCanvasId(canvas.id); setViewMode('notes'); }} className={`relative p-5 rounded-3xl border transition-all cursor-pointer flex flex-col gap-3 aspect-square justify-between overflow-hidden ${canvas.id === activeCanvasId ? 'bg-accent/10 border-accent/50 shadow-[0_0_20px_rgba(var(--accent-rgb),0.2)]' : 'bg-black/40 border-white/10 hover:border-white/20'}`}>
                                    
                                    {canvas.metadata?.thumbnail && (
                                        <div className="absolute inset-0 z-0">
                                            <div className="absolute inset-0 bg-black/50 z-10" />
                                            <img src={formatUrl(canvas.metadata.thumbnail)} alt="Cover" className="w-full h-full object-cover opacity-80" />
                                        </div>
                                    )}

                                    <div className="relative z-10 flex flex-col gap-3 h-full justify-between">
                                        <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center shrink-0 backdrop-blur-md">
                                            <div className="w-4 h-4 rounded-sm border-2 border-accent opacity-80" />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            {editingCanvasId === canvas.id ? (
                                                <input 
                                                    autoFocus
                                                    type="text"
                                                    value={editingCanvasName}
                                                    onChange={e => setEditingCanvasName(e.target.value)}
                                                    onClick={e => e.stopPropagation()}
                                                    onBlur={() => handleRenameCanvas(canvas.id, editingCanvasName)}
                                                    onKeyDown={e => { if(e.key === 'Enter') handleRenameCanvas(canvas.id, editingCanvasName); }}
                                                    className="w-full bg-transparent border-b border-accent outline-none text-white font-medium"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-between gap-2">
                                                    <h3 className="text-white font-medium text-sm leading-tight line-clamp-2 drop-shadow-md">{(canvas.content || canvas.text)}</h3>
                                                    <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm p-1 rounded-full">
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const fileInput = document.createElement('input');
                                                                fileInput.type = 'file';
                                                                fileInput.accept = 'image/*';
                                                                fileInput.onchange = (e) => {
                                                                    const file = e.target.files[0];
                                                                    if (!file) return;
                                                                    const formData = new FormData();
                                                                    formData.append('file', file);
                                                                    const xhr = new XMLHttpRequest();
                                                                    xhr.open('POST', `${API_URL}/api/upload`);
                                                                    xhr.onload = () => {
                                                                        if (xhr.status >= 200 && xhr.status < 300) {
                                                                            try {
                                                                                const data = JSON.parse(xhr.responseText);
                                                                                if (data.url) {
                                                                                    setBlocks(prev => {
                                                                                        const exists = prev.some(b => b.id === canvas.id);
                                                                                        if (!exists) {
                                                                                            return [...prev, { id: canvas.id, type: 'canvas', content: canvas.content || canvas.text, timestamp: new Date().toISOString(), user, metadata: { thumbnail: data.url } }];
                                                                                        }
                                                                                        return prev.map(b => b.id === canvas.id ? { ...b, metadata: { ...(b.metadata || {}), thumbnail: data.url } } : b);
                                                                                    });
                                                                                }
                                                                            } catch (err) {}
                                                                        }
                                                                    };
                                                                    xhr.send(formData);
                                                                };
                                                                fileInput.click();
                                                            }} 
                                                            className="text-zinc-400 hover:text-white p-1 rounded-full"
                                                            title="Cambiar portada"
                                                        >
                                                            <ImageIcon size={12} />
                                                        </button>
                                                        <button onClick={(e) => { e.stopPropagation(); setEditingCanvasId(canvas.id); setEditingCanvasName((canvas.content || canvas.text)); }} className="text-zinc-400 hover:text-white p-1 rounded-full"><Edit3 size={12} /></button>
                                                        {canvas.id !== 'canvas_default' && (
                                                            <button 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (window.confirm("¿Borrar este pizarrón y todos sus elementos?")) {
                                                                        const toDelete = blocks.filter(b => b.id === canvas.id || b.canvasId === canvas.id).map(b => b.id);
                                                                        deleteBlocks(toDelete);
                                                                        if (activeCanvasId === canvas.id) setActiveCanvasId('canvas_default');
                                                                    }
                                                                }}
                                                                className="text-zinc-400 hover:text-accent p-1 rounded-full"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            <span className="text-[10px] text-white font-bold drop-shadow-md uppercase tracking-widest">{blocks.filter(b => isBitacoraItem(b, canvas.id)).length} items</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            ) : (
                <>
            {/* TOP BAR / HEADER */}
            <div className="shrink-0 px-4 pt-6 pb-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button onClick={() => setViewMode('canvases')} className="w-8 h-8 rounded-full border border-white/10 bg-black/40 flex items-center justify-center text-zinc-400 hover:text-white hover:border-accent/50 transition-all shrink-0">
                        <span className="text-lg leading-none font-bold mr-[2px]">&lsaquo;</span>
                    </button>
                    <div className="flex flex-col min-w-0">
                        <span className="text-[9px] font-black tracking-[0.2em] text-accent uppercase truncate">{(currentCanvas?.content || currentCanvas?.text) || 'Pizarrón 1'}</span>
                        <span className="text-sm font-black uppercase tracking-[0.1em] text-white">Bitácora</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            setIsSelectionMode(!isSelectionMode);
                            setSelectedIds([]);
                        }}
                        className={`w-8 h-8 rounded-full border transition-all flex items-center justify-center shrink-0 ${isSelectionMode
                            ? 'bg-accent/10 border-accent/30 text-accent shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)]'
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
                        className={`w-8 h-8 rounded-full border transition-all flex items-center justify-center shrink-0 text-accent hover:bg-accent/80 hover:text-black ${isSelectionMode && selectedIds.length > 0 ? 'bg-accent/30 border-accent' : 'bg-accent/5 border-accent/20'}`}
                    >
                        <Trash2 size={14} />
                    </button>
                    <button
                        onClick={onOpenSimpleNotes}
                        className="w-8 h-8 rounded-full border border-white/10 bg-white/5 transition-all flex items-center justify-center text-accent hover:bg-accent hover:text-black"
                    >
                        <Edit3 size={14} />
                    </button>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full border border-white/10 bg-[#18181b] ml-2 transition-all flex items-center justify-center text-zinc-400 hover:text-white"
                    >
                        <ChevronDown size={18} />
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
                            ? 'bg-accent text-black font-black shadow-lg hover:scale-105'
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
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                        <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-accent animate-spin"></div>
                        <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 animate-pulse">
                            Cargando registros...
                        </p>
                    </div>
                ) : filteredReleases.length === 0 ? (
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
                                        ? 'bg-accent/10 border-accent/60 shadow-[0_0_15px_rgba(var(--accent-rgb),0.15)]'
                                        : 'bg-transparent hover:bg-white/[0.02] border-white/5 hover:border-white/20'
                                        }`}
                                    style={isSelected ? { borderColor: themeAccent, backgroundColor: `${themeAccent}10` } : undefined}
                                >
                                    <div className="absolute left-0 top-0 bottom-0 w-[2px]" style={{ backgroundColor: cardBorderColor }} />

                                    {isSelectionMode && (
                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${isSelected ? 'bg-accent border-accent text-black' : 'border-zinc-600'}`}>
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
                                            {timeString}
                                        </span>
                                        <span className="text-accent transition-transform group-hover/note:translate-x-1">
                                            →
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
                </>
            )}
        </div>
    );
}
