import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
    Plus, Minus, Edit2, Check, Radio, Focus, Compass,
    ArrowLeft, ImageIcon, Mic, Zap, Pencil,
    Edit3, Trash2, Maximize2, Settings, X,
    Heart, MessageCircle, Eye, EyeOff, Globe,
    Aperture, Infinity as InfinityIcon, Share2, Search, Play, Pause, SkipForward, SkipBack,
    FolderPlus, ChevronDown, Pin, Star, FileText, PanelLeft, PanelLeftClose, MessageSquare, StickyNote,
    Paperclip, Send, ChevronRight, ListMusic, Sparkles
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import OasisChat from './components/OasisChat';
import { NekronomikronFull, OasisPlayer } from './components/Nekronomikron';

const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '190, 242, 100';
};

// --- CONFIGURACIÓN ---
// --- CONFIGURACIÓN DE AURAS (THEMES) ---
const AURAS = {
    'oasis': {
        name: 'Oasis Classic',
        primary: '#bef264',
        bg: '#030304',
        sidebar: 'rgba(255,255,255,0.05)',
        card: 'rgba(255,255,255,0.03)',
        accentRgb: '190, 242, 100'
    },
    'monokai': {
        name: 'Monokai Pro',
        primary: '#ffd866',
        bg: '#2d2a2e',
        sidebar: 'rgba(255,255,255,0.07)',
        card: 'rgba(255,255,255,0.05)',
        accentRgb: '255, 216, 102'
    },
    'cyberpunk': {
        name: 'Neon Cyber',
        primary: '#f92672',
        bg: '#0d0d0e',
        sidebar: 'rgba(168, 85, 247, 0.05)',
        card: 'rgba(249, 38, 114, 0.03)',
        accentRgb: '249, 38, 114'
    },
    'oceanic': {
        name: 'Oceanic Drift',
        primary: '#66d9ef',
        bg: '#0f111a',
        sidebar: 'rgba(102, 217, 239, 0.05)',
        card: 'rgba(255,255,255,0.02)',
        accentRgb: '102, 217, 239'
    }
};

const PALETTES = Object.values(AURAS).map(a => ({ name: a.name, color: a.primary, id: Object.keys(AURAS).find(k => AURAS[k] === a) }));

const API_URL = 'http://127.0.0.1:5046';

const formatUrl = (url) => {
    if (!url) return url;
    if (url.startsWith('/uploads/')) return `${API_URL}${url}`;
    return url;
};

const ReasoningBlock = ({ thought, isStreaming }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    if (!thought) return null;

    return (
        <div className="w-full mb-1 mt-1 opacity-40 hover:opacity-100 transition-opacity">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[7px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-all font-mono"
            >
                <Zap size={7} className={`${isStreaming ? 'animate-pulse text-accent' : ''}`} />
                <span>{isStreaming ? 'CORE_PROCESS_SYNCING' : 'CORE_PROCESS_ARCHIVE'}</span>
                {isExpanded ? <Minus size={7} /> : <Plus size={7} />}
            </button>
            {isExpanded && (
                <div className="mt-2 p-3 bg-black/40 border-l-2 border-accent/10 rounded-r-lg text-[10px] italic text-zinc-500 font-serif leading-snug animate-in slide-in-from-top-1 duration-300 max-w-[90%]">
                    {thought}
                </div>
            )}
        </div>
    );
};
const SidebarPlayer = ({ track, isPlaying, setIsPlaying, onPrev, onNext, audioRef, setIsFull }) => {
    if (!track) return null;
    return (
        <div className="py-2 animate-in fade-in slide-in-from-top duration-500">
            <div className="w-full bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-2 flex items-center gap-3 shadow-2xl group">
                {/* TRACK INFO */}
                <div className="flex-1 min-w-0 pl-3 cursor-pointer" onClick={() => setIsFull(true)}>
                    <div className="flex items-center gap-2">
                        <div className="flex flex-col min-w-0">
                            <span className="text-[9px] font-black uppercase text-white truncate italic leading-tight">{track.title}</span>
                            <span className="text-[7px] font-bold text-zinc-500 truncate uppercase tracking-widest leading-tight">{track.artist}</span>
                        </div>
                    </div>
                </div>

                {/* CONTROLS */}
                <div className="flex items-center gap-1 pr-1">
                    <button onClick={onPrev} className="p-1.5 text-white/20 hover:text-white transition-all"><SkipBack size={12} /></button>
                    <button
                        onClick={() => {
                            if (isPlaying) audioRef.current.pause();
                            else audioRef.current.play();
                            setIsPlaying(!isPlaying);
                        }}
                        className="w-10 h-10 rounded-full bg-accent text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)]"
                    >
                        {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
                    </button>
                    <button onClick={onNext} className="p-1.5 text-white/20 hover:text-white transition-all"><SkipForward size={12} /></button>
                </div>
            </div>
        </div>
    );
};

const ChatSidebar = ({
    conversations, activeConversationId, onSelectConversation, onDeleteConversation,
    onPinConversation, onRenameConversation, onCreateFolder, blocks, setBlocks, syncBlocks, folders, user,
    setConversations, onSelectNote, onClose, userMemory, setUserMemory, syncMemory, onNewChat,
    playQueue, currentTrack, isPlaying, setIsPlaying, setCurrentTrack, handlePrevTrack, handleNextTrack,
    audioRef, accent, setAccent, onTogglePinFact
}) => {
    const [activeTab, setActiveTab] = React.useState('chats'); // 'chats' | 'notes' | 'memory'
    const [isCreatingFolder, setIsCreatingFolder] = React.useState(false);
    const [newFolderName, setNewFolderName] = React.useState('');
    const [editingConversationId, setEditingConversationId] = React.useState(null);
    const [editTitle, setEditTitle] = React.useState('');

    const handleRename = (id, title, color) => {
        const updated = conversations.map(c => c.id === id ? { ...c, title, color: color || c.color } : c);
        setConversations(updated);
        fetch(`${API_URL}/api/oasis/conversations?user=${user || localStorage.getItem('oasis_user')}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated)
        });
        setEditingConversationId(null);
    };

    return (
        <div className="fixed md:relative inset-y-0 left-0 w-full md:w-80 h-full bg-[#080809] border-r border-white/5 flex flex-col animate-in slide-in-from-left duration-500 z-[1750] shadow-2xl md:shadow-none transition-colors duration-1000">
            {/* TOP BAR / TABS */}
            <div className="p-4 border-b border-white/[0.03] flex items-center justify-between">
                <div className="flex bg-white/5 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('chats')}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'chats' ? 'bg-white/10 text-white shadow-lg' : 'text-white/30 hover:text-white/60'}`}
                    >
                        <MessageSquare size={12} /> Chats
                    </button>
                    <button
                        onClick={() => setActiveTab('notes')}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'notes' ? 'bg-white/10 text-white shadow-lg' : 'text-white/30 hover:text-white/60'}`}
                    >
                        <StickyNote size={12} /> Notas
                    </button>
                    <button
                        onClick={() => setActiveTab('memory')}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'memory' ? 'bg-white/10 text-white shadow-lg' : 'text-white/30 hover:text-white/60'}`}
                    >
                        <Zap size={12} /> Memoria
                    </button>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 mr-1 rounded-lg hover:bg-white/5 text-white/20 hover:text-white transition-all transition-all"
                    title="Ocultar Menú"
                >
                    <PanelLeftClose size={16} />
                </button>
            </div>
            <div className="p-6 pb-2 space-y-5">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white italic">Oasis Nexus</span>
                        <span className="text-[6px] font-bold text-white/20 uppercase tracking-[0.3em]">IA Core Interface</span>
                    </div>
                    <button
                        onClick={() => setIsCreatingFolder(true)}
                        className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-accent transition-all"
                        title="Nueva Carpeta"
                    >
                        <FolderPlus size={14} />
                    </button>
                </div>

                <button
                    onClick={onNewChat}
                    className="w-full h-12 rounded-2xl border border-accent/20 bg-accent/5 hover:bg-accent/10 transition-all flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest text-accent group"
                >
                    <Plus size={16} className="group-hover:rotate-90 transition-transform" />
                    Nueva Conversación
                </button>

                {/* ACENTO VISUAL (CHROMA) - MOVED TO TOP */}
                <div className="p-4 rounded-3xl bg-white/[0.02] border border-white/[0.03] space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-[7px] font-black uppercase tracking-[0.5em] text-white/40">Acento Visual (Chroma)</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                    </div>
                    <div className="flex flex-wrap gap-2 justify-between">
                        {PALETTES.map((p, idx) => (
                            <button
                                key={idx}
                                onClick={() => setAccent(p.color)}
                                className={`w-7 h-7 rounded-full border-2 transition-all p-0.5 ${accent === p.color ? 'border-[var(--primary)] shadow-[0_0_15px_rgba(var(--accent-rgb),0.4)] scale-110' : 'border-transparent hover:border-white/20'}`}
                                style={{ '--primary': p.color }}
                            >
                                <div className="w-full h-full rounded-full" style={{ backgroundColor: p.color }} />
                            </button>
                        ))}
                    </div>
                </div>

                {isCreatingFolder && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <input
                            autoFocus
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    onCreateFolder(newFolderName);
                                    setNewFolderName('');
                                    setIsCreatingFolder(false);
                                }
                                if (e.key === 'Escape') setIsCreatingFolder(false);
                            }}
                            placeholder="Nombre de carpeta..."
                            className="w-full bg-white/5 border border-accent/20 rounded-xl px-4 py-3 text-[10px] font-bold text-white outline-none placeholder:text-zinc-700"
                        />
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-6 space-y-8">
                {activeTab === 'chats' ? (
                    <>
                        {/* PINNED */}
                        {conversations.some(c => c.isPinned) && (
                            <div className="space-y-4">
                                <h3 className="text-[8px] font-black uppercase tracking-[0.4em] text-accent/40 flex items-center gap-2">
                                    <Star size={10} /> Destacados
                                </h3>
                                <div className="space-y-2">
                                    {conversations.filter(c => c.isPinned).map(c => (
                                        <div key={c.id} className="relative group">
                                            <button
                                                onClick={() => onSelectConversation(c.id)}
                                                className={`w-full p-4 rounded-2xl flex items-center justify-between group transition-all ${activeConversationId === c.id ? 'bg-accent/10 border border-accent/20' : 'bg-black/20 border border-white/5 hover:border-white/20'}`}
                                            >
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: c.color || '#bef264', boxShadow: `0 0 10px ${c.color || '#bef264'}44` }} />
                                                    <span className="text-[10px] font-bold text-white/80 truncate">{c.title || 'Conversación'}</span>
                                                </div>
                                                <Pin size={10} className="text-accent opacity-60" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* FOLDERS */}
                        {folders.map(folder => (
                            <div key={folder.id} className="space-y-3">
                                <div className="flex items-center gap-2 px-1">
                                    <ChevronDown size={10} className="text-white/20" />
                                    <span className="text-[8px] font-black uppercase tracking-[0.4em] text-white/20">{folder.name}</span>
                                </div>
                                <div className="space-y-1 pl-2 border-l border-white/5 ml-1">
                                    {/* Conversations in Folder */}
                                    {conversations.filter(c => c.folderId === folder.id).map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => onSelectConversation(c.id)}
                                            className={`w-full px-4 py-2 rounded-xl flex items-center gap-3 transition-all ${activeConversationId === c.id ? 'bg-white/5 text-white' : 'text-white/40 hover:text-white/80'}`}
                                        >
                                            <div className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: c.color || '#bef264' }} />
                                            <span className="text-[9px] font-bold truncate">{c.title || 'Sin Título'}</span>
                                        </button>
                                    ))}
                                    {/* Notes in Folder (HIDDEN IN CHATS TAB) */}
                                </div>
                            </div>
                        ))}
                        {/* GENERAL CONVERSATIONS */}
                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <h3 className="text-[8px] font-black uppercase tracking-[0.4em] text-white/10 px-1">Recientes</h3>
                            <div className="space-y-1">
                                {conversations.filter(c => !c.isPinned && !c.folderId).map(c => (
                                    <div key={c.id} className="relative group/item">
                                        {editingConversationId === c.id ? (
                                            <div className="space-y-2 p-2 bg-white/5 rounded-xl border border-accent/20">
                                                <input
                                                    autoFocus
                                                    value={editTitle}
                                                    onChange={(e) => setEditTitle(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleRename(c.id, editTitle)}
                                                    className="w-full bg-transparent border-none p-2 text-[10px] font-bold text-white outline-none"
                                                />
                                                <div className="flex items-center justify-between px-2 pb-1">
                                                    <div className="flex gap-1.5">
                                                        {['#bef264', '#22d3ee', '#f43f5e', '#d946ef', '#fbbf24'].map(color => (
                                                            <button
                                                                key={color}
                                                                onClick={() => handleRename(c.id, editTitle, color)}
                                                                className="w-3.5 h-3.5 rounded-full border border-white/10 hover:scale-125 transition-transform"
                                                                style={{ backgroundColor: color }}
                                                            />
                                                        ))}
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => setEditingConversationId(null)}
                                                            className="p-1 px-2 rounded-lg bg-white/5 text-white/30 hover:text-white transition-all text-[8px] font-black uppercase"
                                                        >
                                                            <X size={10} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleRename(c.id, editTitle)}
                                                            className="p-1 px-2 rounded-lg bg-accent/20 text-accent hover:bg-accent/30 transition-all text-[8px] font-black uppercase flex items-center gap-1"
                                                        >
                                                            <Check size={10} /> Listo
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => onSelectConversation(c.id)}
                                                    className={`w-full px-4 py-3 rounded-xl flex items-center justify-between transition-all ${activeConversationId === c.id ? 'bg-white/5 text-white' : 'text-white/30 hover:bg-white/5 hover:text-white/80'}`}
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: c.color || '#555' }} />
                                                        <span className="text-[9px] font-bold truncate pr-8">{c.title || 'Sin Título'}</span>
                                                    </div>
                                                </button>
                                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity bg-[#080809] pl-2">
                                                    <button
                                                        onClick={() => { setEditingConversationId(c.id); setEditTitle(c.title || ''); }}
                                                        className="p-1.5 hover:text-accent transition-colors"
                                                        title="Renombrar / Color"
                                                    >
                                                        <Edit3 size={10} />
                                                    </button>
                                                    <button
                                                        onClick={() => onPinConversation(c.id)}
                                                        className={`p-1.5 transition-colors ${c.isPinned ? 'text-accent' : 'hover:text-accent'}`}
                                                        title="Anclar"
                                                    >
                                                        <Pin size={10} />
                                                    </button>
                                                    <button
                                                        onClick={() => onDeleteConversation(c.id)}
                                                        className="p-1.5 hover:text-red-400 transition-colors"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={10} />
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        {/* NOTES TAB VIEW */}
                        {folders.map(folder => {
                            const folderNotes = blocks.filter(b => b.type === 'text' && b.folderId === folder.id);
                            if (folderNotes.length === 0) return null;
                            return (
                                <div key={folder.id} className="space-y-3">
                                    <div className="flex items-center gap-2 px-1">
                                        <ChevronDown size={10} className="text-white/20" />
                                        <span className="text-[8px] font-black uppercase tracking-[0.4em] text-white/20">{folder.name}</span>
                                    </div>
                                    <div className="space-y-1 pl-2 border-l border-white/5 ml-1">
                                        {folderNotes.map(b => (
                                            <div
                                                key={b.id}
                                                onClick={() => { onSelectNote(b.id); setActiveTab('chats'); }}
                                                className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/5 transition-all cursor-pointer group"
                                            >
                                                <FileText size={10} style={{ color: b.color || '#bef264' }} className="opacity-40" />
                                                <span className="text-[9px] font-bold text-white/30 group-hover:text-white/70 truncate">{b.content.slice(0, 25)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}

                        {/* UNFOLDERED NOTES */}
                        <div className="space-y-4">
                            <h3 className="text-[8px] font-black uppercase tracking-[0.4em] text-white/10 px-1">Notas del Lienzo</h3>
                            <div className="space-y-1">
                                {blocks.filter(b => b.type === 'text' && !b.folderId).map(b => (
                                    <div
                                        key={b.id}
                                        onClick={() => {
                                            onSelectNote(b.id);
                                            setActiveTab('chats');
                                        }}
                                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/5 transition-all cursor-pointer group"
                                    >
                                        <FileText size={10} style={{ color: b.color || '#bef264' }} className="opacity-40" />
                                        <span className="text-[9px] font-bold text-white/30 group-hover:text-white/70 truncate">{b.content.slice(0, 25)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'memory' && (
                    <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
                        <div className="space-y-2">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-accent/60 flex items-center gap-2">
                                <Zap size={12} /> Núcleo de Memoria
                            </h3>
                            <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Hechos destilados de tu conciencia digital.</p>
                        </div>

                        <div className="space-y-3">
                            {userMemory.length > 0 ? [...userMemory].sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0)).map((fact, idx) => {
                                const originalIdx = userMemory.findIndex(f => f.timestamp === fact.timestamp && f.text === fact.text);
                                return (
                                    <div key={idx} className={`group p-4 rounded-2xl border transition-all ${fact.isPinned ? 'bg-accent/10 border-accent/20' : 'bg-white/5 border-white/5 hover:border-accent/20'}`}>
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className={`px-2 py-0.5 rounded-md border text-[7px] font-black uppercase tracking-widest ${fact.isPinned ? 'bg-accent text-black border-accent' : 'bg-accent/10 border-accent/20 text-accent'}`}>
                                                    {fact.isPinned ? 'PINNED' : (fact.category || 'General')}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => onTogglePinFact(originalIdx)}
                                                    className={`p-1 rounded transition-all ${fact.isPinned ? 'text-accent' : 'text-white/20 hover:text-accent'}`}
                                                >
                                                    <Star size={10} fill={fact.isPinned ? "currentColor" : "none"} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const updated = userMemory.filter((_, i) => i !== originalIdx);
                                                        setUserMemory(updated);
                                                        syncMemory(updated);
                                                    }}
                                                    className="p-1 hover:bg-white/5 rounded text-white/20 hover:text-red-400"
                                                >
                                                    <X size={10} />
                                                </button>
                                            </div>
                                        </div>
                                        <p className={`text-[11px] font-sans leading-relaxed font-medium ${fact.isPinned ? 'text-white' : 'text-white/70'}`}>{fact.text}</p>
                                    </div>
                                );
                            }) : (
                                <div className="py-10 flex flex-col items-center justify-center text-center opacity-10">
                                    <Zap size={32} className="mb-4" />
                                    <span className="text-[9px] font-black uppercase tracking-[0.4em]">Sin recuerdos activos</span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4 pt-6 border-t border-white/5">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-400/60 flex items-center gap-2">
                                <Aperture size={12} /> Reflexiones del Espíritu
                            </h3>
                            <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Análisis profundos generados en tus diálogos.</p>

                            <div className="space-y-3">
                                {blocks.filter(b => b.type === 'insight').length > 0 ? blocks.filter(b => b.type === 'insight').map((insight, idx) => (
                                    <div key={insight.id || idx} className="group p-5 rounded-3xl bg-purple-500/5 border border-purple-500/10 hover:border-purple-500/30 transition-all relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500 opacity-5 blur-2xl -translate-y-1/2 translate-x-1/2" />
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex gap-2 items-center">
                                                <Zap size={10} className="text-purple-400 opacity-50" />
                                                <span className="text-[7px] font-black uppercase tracking-[0.3em] text-purple-400/50">Resonancia</span>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const updated = blocks.filter(b => b.id !== insight.id);
                                                    setBlocks(updated);
                                                    syncBlocks(updated);
                                                    setConversations(prev => prev.map(c => c.noteId === insight.id ? { ...c, noteId: null } : c));
                                                }}
                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/5 rounded text-white/20 hover:text-red-400 transition-all"
                                            >
                                                <X size={10} />
                                            </button>
                                        </div>
                                        <div className="text-[11px] font-serif italic text-white/80 leading-relaxed">
                                            <SimpleNarrativeRenderer content={insight.content} />
                                        </div>
                                        <div className="mt-4 flex items-center gap-2 opacity-20">
                                            <span className="text-[6px] font-black uppercase tracking-widest">Fragmento de Conciencia</span>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="py-10 flex flex-col items-center justify-center text-center opacity-10">
                                        <Aperture size={24} className="mb-3" />
                                        <span className="text-[8px] font-black uppercase tracking-[0.4em]">Sin reflexiones aún</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* FOOTER */}
            <div className="p-6 border-t border-white/[0.02] bg-white/[0.01] space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-white/20 hover:text-white/60 transition-colors cursor-pointer group">
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-all text-[10px] font-black">{user?.[0]?.toUpperCase() || 'U'}</div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black uppercase tracking-widest">{user || 'Usuario'}</span>
                            <span className="text-[6px] font-bold text-white/10 uppercase">Frecuencia Base</span>
                        </div>
                    </div>
                    <Settings size={14} className="text-white/10 hover:text-white transition-colors cursor-pointer" />
                </div>

                {/* SIDEBAR PLAYER AT BOTTOM */}
                {playQueue[currentTrack] && (
                    <div className="pt-2 animate-in slide-in-from-bottom-2 duration-500">
                        <SidebarPlayer
                            track={playQueue[currentTrack]}
                            isPlaying={isPlaying}
                            setIsPlaying={setIsPlaying}
                            onPrev={handlePrevTrack}
                            onNext={handleNextTrack}
                            audioRef={audioRef}
                            setIsFull={() => { }} // Placeholder for now
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

const TypedText = ({ text, speed = 40, delay = 500 }) => {
    const [displayedText, setDisplayedText] = React.useState('');
    const [started, setStarted] = React.useState(false);

    React.useEffect(() => {
        const timer = setTimeout(() => setStarted(true), delay);
        return () => clearTimeout(timer);
    }, [delay]);

    React.useEffect(() => {
        if (!started) return;
        if (displayedText.length < text.length) {
            const timeout = setTimeout(() => {
                setDisplayedText(text.slice(0, displayedText.length + 1));
            }, speed);
            return () => clearTimeout(timeout);
        }
    }, [displayedText, text, speed, started]);

    return <span>{displayedText}</span>;
};

const WordByWordRenderer = ({ content, speed = 8, wordsPerTick = 2, onComplete }) => {
    const words = React.useMemo(() => content.split(' '), [content]);
    const [displayedCount, setDisplayedCount] = React.useState(0);

    React.useEffect(() => {
        if (displayedCount < words.length) {
            const timer = setTimeout(() => {
                setDisplayedCount(prev => Math.min(prev + wordsPerTick, words.length));
            }, speed);
            return () => clearTimeout(timer);
        } else if (onComplete) {
            onComplete();
        }
    }, [displayedCount, words.length, speed, wordsPerTick, onComplete]);

    const partial = words.slice(0, displayedCount).join(' ');
    return <SimpleNarrativeRenderer content={partial} />;
};

// OasisChat has been refactored to src/components/OasisChat.jsx

const INITIAL_BLOCKS = [
    { id: '1', type: 'text', x: -120, y: -80, content: 'La realidad es un glitch en el sistema.', rotation: -3, color: '#bef264', caption: 'Mantra del Oasis' },
    { id: '2', type: 'image', x: 80, y: -160, content: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=400', rotation: 5, color: '#22d3ee', caption: 'Reliquia Visual' },
]; // Datos Iniciales

const INITIAL_SOUL_PIECES = [
    { id: 's1', title: 'Esencia', img: '', x: -200, y: -150 },
    { id: 's2', title: 'Memoria', img: '', x: 220, y: -100 },
];

const GENERATED_FEED = Array.from({ length: 40 }).map((_, i) => ({
    id: `f-${i}`,
    user: `Sincronía_${i + 102}`,
    text: "El glitch es la nueva verdad.",
    img: `https://picsum.photos/seed/${i + 40}/400/600`,
    color: PALETTES[i % 4].color,
    x: Math.random() * 2000 - 1000,
    y: Math.random() * 2000 - 1000,
    rotation: (Math.random() - 0.5) * 15
}));

// --- COMPONENTES SECUNDARIOS ---

const DrawingModal = ({ isOpen, onClose, onSave, accent }) => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.strokeStyle = accent;
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }, [isOpen, accent]);

    const getPos = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const startDraw = (e) => {
        setIsDrawing(true);
        const pos = getPos(e);
        const ctx = canvasRef.current.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const pos = getPos(e);
        const ctx = canvasRef.current.getContext('2d');
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    };

    const save = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.toBlob(async (blob) => {
            const formData = new FormData();
            formData.append('file', blob, 'drawing.png');
            try {
                const res = await fetch(`${API_URL}/api/oasis/upload`, {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                onSave(data.url); // Enviar URL relativa
                onClose();
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, 400, 400);
            } catch (err) {
                console.error("Error al subir dibujo: ", err);
            }
        }, 'image/png');
    };

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-[#0c0c0d] rounded-[3rem] border border-white/10 p-10 shadow-2xl">
                <h2 className="text-xl font-black italic mb-8 uppercase tracking-[0.4em] text-white/90">Bosquejo Creativo</h2>
                <div className="bg-white/5 rounded-[2rem] border border-white/5 overflow-hidden mb-8 aspect-square">
                    <canvas ref={canvasRef} width="400" height="400" className="w-full h-full cursor-crosshair" onMouseDown={startDraw} onMouseMove={draw} onMouseUp={() => setIsDrawing(false)} onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={() => setIsDrawing(false)} />
                </div>
                <div className="flex justify-between items-center gap-6">
                    <button onClick={onClose} className="text-zinc-500 hover:text-white uppercase text-[9px] tracking-widest font-black transition-colors">Volver</button>
                    <button onClick={save} className="flex-1 py-5 bg-accent text-black font-black uppercase tracking-widest rounded-full text-[11px] shadow-xl hover:scale-105 active:scale-95 transition-all">Guardar Dibujo</button>
                </div>
            </div>
        </div>
    );
};

const FeedItem = ({ f, credits, setCredits, blocks, setBlocks, syncBlocks }) => {
    const [_unused, setIsInView] = React.useState(false);
    const itemRef = React.useRef(null);
    const audioRef = React.useRef(null);

    // Parse content for multimedia tags
    const contentLines = f.content?.split('\n') || [];
    const inlineImage = contentLines.find(l => l.startsWith('[img]'))?.replace('[img]', '').trim();
    const inlineVideo = contentLines.find(l => l.startsWith('[vid]'))?.replace('[vid]', '').trim();
    const inlineAudio = contentLines.find(l => l.startsWith('[aud]'))?.replace('[aud]', '').trim();
    const cleanText = contentLines.filter(l => !l.startsWith('[img]') && !l.startsWith('[vid]') && !l.startsWith('[aud]')).join('\n');

    const displayImage = formatUrl(inlineImage || (f.type === 'image' || f.type === 'relic' ? f.content : null));
    const displayVideo = formatUrl(inlineVideo || (f.type === 'video' ? f.content : null));
    const displayAudio = formatUrl(inlineAudio || (f.type === 'audio' ? f.content : null));
    const hasMedia = displayImage || displayVideo || displayAudio;

    React.useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsInView(entry.isIntersecting);
                if (audioRef.current) {
                    if (entry.isIntersecting) audioRef.current.play().catch(e => console.log("Autoplay blocked:", e));
                    else audioRef.current.pause();
                }
            },
            { threshold: 0.6 }
        );
        if (itemRef.current) observer.observe(itemRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div ref={itemRef} className="w-full h-screen snap-center flex items-end justify-center px-4 pb-32">
            <div className="group relative w-[90%] max-w-xl h-[75vh] bg-[#0c0c0d]/60 backdrop-blur-3xl rounded-[3rem] border border-white/5 overflow-hidden transition-all duration-1000 shadow-[0_0_80px_rgba(0,0,0,0.6)] hover:border-white/10 flex flex-col">

                {/* 1. MEDIA HEADER (TOP) */}
                {(displayImage || displayVideo) ? (
                    <div className="w-full h-1/2 md:h-3/5 relative overflow-hidden bg-black/40">
                        {displayImage && <img src={displayImage} className="absolute inset-0 w-full h-full object-cover transition-transform duration-[4000ms] group-hover:scale-110" />}
                        {displayVideo && <video src={displayVideo} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover" />}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0d] via-transparent to-transparent opacity-60" />
                    </div>
                ) : hasMedia && displayAudio ? (
                    <div className="w-full h-32 bg-accent/5 flex items-center justify-center border-b border-white/5">
                        <div className="flex items-center gap-4 animate-pulse">
                            <Mic size={24} className="text-accent" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent/60">Resonancia de Voz</span>
                        </div>
                    </div>
                ) : null}

                {/* 2. NARRATIVE AREA (CENTERED FOR TEXT-ONLY) */}
                <div className={`flex-1 p-12 overflow-y-auto no-scrollbar ${!hasMedia ? 'flex flex-col justify-center items-center text-center' : 'text-left'}`}>
                    <div className={`${!hasMedia ? 'max-w-[90%] scale-110' : 'w-full'}`}>
                        <div className={!hasMedia ? 'font-black uppercase tracking-tighter text-2xl md:text-3xl italic' : ''}>
                            <SimpleNarrativeRenderer content={f.type === 'text' ? cleanText : f.content} />
                        </div>
                    </div>
                </div>

                {/* HIDDEN AUDIO ENGINE */}
                {displayAudio && <audio ref={audioRef} src={displayAudio} loop />}

                {/* INTERFACE OVERLAYS */}
                <div className="absolute top-6 left-6 px-3 py-1 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-2 z-20">
                    <div className="w-1 h-1 rounded-full bg-accent animate-pulse" />
                    <span className="text-[7px] font-black uppercase tracking-widest text-white/60">{f.type === 'text' ? 'Nota x Multimedia' : f.type.toUpperCase()}</span>
                </div>

                <div className="absolute right-6 bottom-14 flex flex-col gap-6 items-center z-20">
                    <div className="group/eco flex flex-col items-center gap-1.5">
                        <button
                            onClick={() => {
                                if (blocks.some(b => b.content === f.content)) {
                                    console.log('Esta frecuencia ya vibra en tu Oasis.');
                                    return;
                                }
                                if (credits >= 50) {
                                    setCredits(c => c - 50);
                                    const newRelic = {
                                        id: `trophy-${Date.now()}`,
                                        type: f.type,
                                        content: f.content,
                                        x: Math.random() * 400 - 200,
                                        y: Math.random() * 400 - 200,
                                        rotation: (Math.random() - 0.5) * 20,
                                        color: f.color || '#fbbf24',
                                        caption: `Frecuencia de @${f.username}`,
                                        isPublic: true
                                    };
                                    const updated = [newRelic, ...blocks];
                                    setBlocks(updated);
                                    syncBlocks(updated);
                                    console.log('¡Frecuencia de Alma Sincronizada!');
                                } else console.log('Energía insuficiente');
                            }}
                            className="text-zinc-500 hover:text-accent active:text-accent transform hover:scale-125 active:scale-95 transition-all duration-300"
                        >
                            <InfinityIcon size={18} strokeWidth={2.5} />
                        </button>
                        <span className="text-[5px] font-black text-zinc-700 uppercase tracking-[0.4em] group-hover/eco:text-accent transition-colors">Eco</span>
                    </div>
                </div>

                <div className="absolute bottom-5 left-8 max-w-[70%] z-20">
                    <div className="flex items-center gap-3 mb-1.5">
                        <div className="w-8 h-8 rounded-full border border-accent/20 p-0.5 bg-black/40 overflow-hidden shrink-0">
                            <img src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${f.username || 'anon'}`} className="w-full h-full object-cover rounded-full" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white">@{f.username || 'anon'}</span>
                            <span className="text-[7px] font-black uppercase tracking-[0.2em] text-accent/60">Resonancia Nivel 4</span>
                        </div>
                    </div>
                    <p className="text-[9px] font-bold italic text-white/70 leading-snug truncate">{f.caption || 'Fragmento de la conciencia.'}</p>
                </div>
            </div>
        </div>
    );
};

const SimpleNarrativeRenderer = React.memo(({ content }) => {
    if (!content) return null;

    // Pre-process content to handle legacy Oasis blocks or AI-specific tags
    // We split by blocks that should be rendered specially
    const blocks = content.split(/(\[img\].*?|\[vid\].*?|\[aud\].*?|\[question\].*?|\[insight\].*?)/g);

    return (
        <div className="prose prose-invert max-w-none text-[13px] md:text-[15px] font-serif italic text-white/90 leading-relaxed selection:bg-accent/20">
            {blocks.map((block, i) => {
                const trimmed = block.trim();
                if (!trimmed) return null;

                if (trimmed.startsWith('[img]')) {
                    const url = formatUrl(trimmed.replace('[img]', '').trim());
                    return <div key={i} className="my-6 rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl animate-in fade-in zoom-in duration-700 bg-black/20"><img src={url} className="w-full h-auto object-cover max-h-[400px]" /></div>;
                }
                if (trimmed.startsWith('[vid]')) {
                    const url = formatUrl(trimmed.replace('[vid]', '').trim());
                    return <div key={i} className="my-6 rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl bg-black/20 aspect-video"><video src={url} controls className="w-full h-full object-cover" /></div>;
                }
                if (trimmed.startsWith('[aud]')) {
                    const url = formatUrl(trimmed.replace('[aud]', '').trim());
                    return (
                        <div key={i} className="my-4 p-5 bg-white/5 backdrop-blur-3xl rounded-[2rem] border border-white/10 flex items-center gap-4 animate-in slide-in-from-left duration-500">
                            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent"><Mic size={18} /></div>
                            <audio src={url} controls className="flex-1 scale-90 origin-left invert opacity-60 hover:opacity-100 transition-opacity" />
                        </div>
                    );
                }
                if (trimmed.startsWith('[question]')) {
                    const q = trimmed.replace('[question]', '').trim();
                    return (
                        <div key={i} className="my-8 p-8 bg-accent/10 backdrop-blur-3xl rounded-[2.5rem] border border-accent/30 shadow-[0_0_40px_rgba(var(--accent-rgb),0.2)] animate-in slide-in-from-right duration-700 group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-accent opacity-5 blur-3xl -translate-y-1/2 translate-x-1/2" />
                            <div className="flex gap-4 mb-4 items-center">
                                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent"><Radio size={16} /></div>
                                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-accent/60">Profundiza tu Conciencia</span>
                            </div>
                            <h3 className="text-xl md:text-2xl font-serif italic text-white/90 leading-tight">"{q}"</h3>
                        </div>
                    );
                }
                if (trimmed.startsWith('[insight]')) {
                    const ins = trimmed.replace('[insight]', '').trim();
                    return (
                        <div key={i} className="my-4 p-6 bg-purple-500/10 backdrop-blur-xl rounded-3xl border border-purple-500/20 shadow-[0_0_20px_rgba(192,38,211,0.05)] animate-in fade-in zoom-in duration-700 group relative">
                            <div className="flex gap-3 mb-3 items-center">
                                <Zap size={12} className="text-purple-400 opacity-50" />
                                <span className="text-[7px] font-black uppercase tracking-[0.3em] text-purple-400/50">Resonancia</span>
                            </div>
                            <div className="text-sm md:text-base font-serif italic text-white/90 leading-snug">
                                <ReactMarkdown>{ins}</ReactMarkdown>
                            </div>
                        </div>
                    );
                }

                // Default: Render as Markdown
                return (
                    <ReactMarkdown
                        key={i}
                        components={{
                            h1: ({ node, ...props }) => <h1 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-4 mt-6 border-b border-white/10 pb-2" {...props} />,
                            h2: ({ node, ...props }) => <h2 className="text-xl font-black italic uppercase tracking-tight text-accent mb-3 mt-5" {...props} />,
                            h3: ({ node, ...props }) => <h3 className="text-lg font-black italic text-white/80 mb-2 mt-4" {...props} />,
                            p: ({ node, ...props }) => <p className="mb-4 last:mb-0" {...props} />,
                            ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-4 space-y-1 text-white/70" {...props} />,
                            ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-4 space-y-1 text-white/70" {...props} />,
                            li: ({ node, ...props }) => <li className="marker:text-accent" {...props} />,
                            strong: ({ node, ...props }) => <strong className="font-black text-accent" {...props} />,
                            em: ({ node, ...props }) => <em className="italic text-white" {...props} />,
                            code: ({ node, ...props }) => <code className="font-mono text-[11px] bg-white/5 px-1.5 py-0.5 rounded border border-white/10 text-cyan-400" {...props} />,
                            blockquote: ({ node, ...props }) => <blockquote className="border-l-2 border-accent/30 pl-4 py-2 my-4 bg-accent/5 rounded-r-xl italic text-white/60" {...props} />,
                        }}
                    >
                        {block.replaceAll('\u2028', '\n')}
                    </ReactMarkdown>
                );
            })}
        </div>
    );
});

const MemoNode = React.memo(({ block, draggingId, onStart, isLinking, onStartConnecting, onCompleteConnection, onSelect, onDelete, activeNoteId, onSelectNote, onSelectGroup, onAnalyzeBlock, onAnalyzeGroup, isAnalyzing, showConnections = true, useInternalPosition = true }) => {
    const isImage = block.type === 'image' || block.type === 'relic';
    const isVideo = block.type === 'video';
    const isAudio = block.type === 'audio';
    const isInsight = block.type === 'insight';
    const hasMedia = block.content?.includes('[img]') || block.content?.includes('[vid]') || block.content?.includes('[aud]');
    const isActive = activeNoteId === block.id;

    // Track click vs drag
    const mouseDownPos = useRef({ x: 0, y: 0 });
    const handleNodeMouseDown = (e) => {
        mouseDownPos.current = { x: e.clientX, y: e.clientY };
    };

    const handleNodeClick = (e) => {
        const dist = Math.hypot(e.clientX - mouseDownPos.current.x, e.clientY - mouseDownPos.current.y);
        if (dist < 5) {
            e.stopPropagation();
            onSelect(block); // Click: edit
        }
    };

    return (
        <div
            className={`select-none cursor-move active:cursor-grabbing group z-10 ${draggingId === block.id ? 'transition-none scale-105 z-50' : 'transition-transform duration-300'} ${isLinking ? 'hover:scale-105 ring-2 ring-transparent hover:ring-accent/40 rounded-[2.5rem]' : ''} ${useInternalPosition ? 'absolute' : 'relative'}`}
            style={useInternalPosition ? { left: block.x, top: block.y, transform: `translate(-50%, -50%)` } : {}}
            onMouseDown={(e) => {
                e.stopPropagation();
                handleNodeMouseDown(e);
                onStart(e, block.id);
            }}
            onTouchStart={(e) => {
                e.stopPropagation();
                onStart(e, block.id);
            }}
            onClick={handleNodeClick}
        >
            <div
                className={`relative ${hasMedia || isInsight ? 'w-80 md:w-96' : 'w-48'} rounded-[2rem] border shadow-[0_10px_40px_rgba(0,0,0,0.8)] transition-all duration-300 overflow-hidden ${isInsight ? 'insight-block' : 'bg-[#0b0b0c]'} ${draggingId === block.id ? 'border-accent ring-1 ring-accent/20' : (isActive ? 'border-accent shadow-[0_0_20px_rgba(var(--accent-rgb),0.4)]' : 'border-white/5 hover:border-white/10')}`}
                style={{ '--accent-rgb': hexToRgb(block.color || '#bef264') }}
            >
                {/* OP HEADER (SUBTLE TERMINAL STYLE) */}
                <div className="h-6 flex items-center px-4 justify-between bg-black/40 border-b border-white/5" style={{ borderTop: `2px solid ${isInsight ? 'var(--insight-purple)' : (block.color || 'white')}` }}>
                    <div className="flex items-center gap-2">
                        {block.groupId && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onAnalyzeGroup?.(block.groupId); }}
                                className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-accent/10 border border-accent/20 hover:bg-accent/20 transition-all group/grp"
                                title="Analizar Grupo"
                            >
                                <ListMusic size={8} className="text-accent group-hover/grp:scale-110" />
                                <span className="text-[6px] font-black uppercase text-accent tracking-tighter">Grouped</span>
                            </button>
                        )}
                        <span className="text-[6px] font-bold uppercase tracking-[0.3em] text-zinc-500 font-mono opacity-50">
                            {`OP_${block.type.toUpperCase()}`}
                        </span>
                    </div>
                    <div className="flex gap-1.5 items-center">
                        <button
                            onClick={(e) => { e.stopPropagation(); onAnalyzeBlock?.(block.id); }}
                            className="p-1.5 hover:bg-accent/20 rounded-md transition-all text-accent group/spark"
                            title="Analizar con IA (Invisible)"
                        >
                            <Sparkles size={12} className={`${isAnalyzing ? 'animate-spin' : 'group-hover/spark:animate-spin-slow'} transition-transform`} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onSelect(block); }}
                            className="p-1.5 hover:bg-white/10 rounded-md transition-all text-zinc-500 hover:text-white"
                            title="Editar"
                        >
                            <Edit2 size={10} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(block.id); }}
                            className="p-1.5 hover:bg-red-500/20 rounded-md transition-all text-zinc-500 hover:text-red-500 group/del"
                            title="Eliminar Permanente"
                        >
                            <Trash2 size={10} className="group-hover/del:scale-110 transition-transform" />
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    {block.type === 'text' || block.type === 'insight' ? (
                        <div className="relative group/text">
                            {/* TITULO DE LA NOTA (GRANDE) */}
                            <h3 className="text-xl font-black italic uppercase tracking-tighter leading-none mb-3 text-white truncate">
                                {block.caption || 'Fragmento Oasis'}
                            </h3>

                            {/* DIARY ENTRIES vs SINGLE CONTENT */}
                            {block.entries && block.entries.length > 0 ? (
                                <div className="space-y-8 max-h-[250px] overflow-y-auto custom-scroll pr-1 py-2 relative">
                                    {/* VERTICAL TIMELINE LINE */}
                                    <div className="absolute left-[11px] top-6 bottom-6 w-px bg-white/5" />

                                    {block.entries.map((entry, idx) => {
                                        const dateLabel = new Date(entry.timestamp).toLocaleDateString();
                                        const prevDateLabel = idx > 0 ? new Date(block.entries[idx - 1].timestamp).toLocaleDateString() : null;
                                        const isNewDay = dateLabel !== prevDateLabel;

                                        return (
                                            <div key={idx} className="flex flex-col gap-3 relative pl-8">
                                                {/* TIMELINE DOT */}
                                                <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full bg-black border-2 border-white/10 flex items-center justify-center z-10 ${idx === block.entries.length - 1 ? 'border-accent diary-active-dot' : ''}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${idx === block.entries.length - 1 ? 'bg-accent animate-pulse' : 'bg-white/20'}`} />
                                                </div>

                                                {isNewDay && (
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-[6px] font-black uppercase text-accent tracking-[0.3em] font-mono">{dateLabel}</span>
                                                    </div>
                                                )}

                                                <div className="space-y-2">
                                                    <p className="text-[12px] leading-relaxed text-zinc-300 font-serif italic selection:bg-accent/40">
                                                        {entry.text}
                                                    </p>
                                                    <div className="flex items-center gap-2 opacity-40">
                                                        <span className="text-[5px] font-black uppercase tracking-[0.3em] text-zinc-500">
                                                            {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* DIRECT ADD ENTRY TRIGGER ON CANVAS */}
                                    <div className="pt-4 border-t border-white/5 mt-auto">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onSelect(block); }}
                                            className="w-full py-2 bg-accent/5 hover:bg-accent/10 border border-accent/10 rounded-xl text-[7px] font-black uppercase tracking-[0.3em] text-accent transition-all flex items-center justify-center gap-2"
                                        >
                                            <Plus size={10} /> Añadir Entrada
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="max-h-[4.5rem] overflow-hidden relative opacity-60 group-hover/text:opacity-90 transition-opacity">
                                    <SimpleNarrativeRenderer content={block.type === 'insight' ? `[insight] ${block.content}` : block.content} />
                                    <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-[#0b0b0c] to-transparent pointer-events-none" />
                                </div>
                            )}
                        </div>
                    ) : isImage ? (
                        <img src={formatUrl(block.content)} className="w-full aspect-video object-cover rounded-sm border border-white/5" />
                    ) : isVideo ? (
                        <video autoPlay loop muted playsInline className="w-full aspect-video object-cover rounded-sm border border-white/5" src={formatUrl(block.content)} />
                    ) : isAudio ? (
                        <div className="flex flex-col gap-4 py-2">
                            <div className="flex items-center gap-3">
                                <Mic size={16} className="text-accent" />
                                <div className="h-0.5 flex-1 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full w-2/3 bg-accent animate-pulse" />
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>
                {/* NÚCLEO DE SINCRONÍA (PORT) - CONDITIONAL */}
                {showConnections && (
                    <div className="flex justify-center items-center py-3 border-t border-white/5 bg-black/40">
                        <div
                            className="port group/port flex flex-col items-center gap-1 cursor-crosshair relative"
                            onMouseDown={(e) => {
                                if (e.button !== 0) return; // Solo clic izquierdo
                                e.stopPropagation();
                                onStartConnecting(block.id);
                            }}
                            onMouseUp={(e) => {
                                e.stopPropagation();
                                onCompleteConnection(block.id);
                            }}
                        >
                            <div className="w-4 h-4 rounded-full bg-zinc-900 border-2 border-white/20 group-hover/port:border-accent group-hover/port:scale-125 transition-all shadow-lg flex items-center justify-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-accent opacity-40 group-hover/port:opacity-100 animate-pulse" />
                            </div>
                            <span className="text-[5px] font-black tracking-[0.3em] text-zinc-600 group-hover/port:text-accent uppercase select-none">Relacionar</span>

                            {/* Feedback visual de conexión activa */}
                            {isLinking && draggingId === block.id && (
                                <div className="absolute inset-0 -m-1 rounded-full border border-accent animate-ping opacity-30" />
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});

// NekronomikronFull has been refactored to src/components/Nekronomikron.jsx

// OasisPlayer has been refactored to src/components/Nekronomikron.jsx
const ProfileView = ({
    user, soulPieces, blocks, accent, isEditingProfile, setIsEditingProfile,
    handleStart, profileCam, draggingId, centerProfile, deleteBlock,
    isLinking, setIsLinking, links, linkSource, setLinkSource,
    completeConnection, removeConnection, synthesizeLinks, mouseCanvasPos,
    editBlock, handleSelectNote, togglePublic, activeNoteId,
    handleAnalyzeGroup, handleAnalyzeBlock, isChatLoading, onSoulPieceImageChange
}) => {
    const soulPieceInputRef = useRef(null);
    const [activeSoulPieceId, setActiveSoulPieceId] = useState(null);
    // Función interna para calcular posición rotada del puerto (Adaptada al offset del Perfil)
    const getPortPos = (b) => {
        if (!b) return { x: 5000, y: 5000 };
        const bx = b.x + 400;
        const by = b.y + 400;
        const hasMedia = b.content?.includes('[img]') || b.content?.includes('[vid]') || b.content?.includes('[aud]');
        const estimatedH = hasMedia ? 240 : 120;
        const portRelY = estimatedH / 2 + 10;
        return { x: 5000 + bx, y: 5000 + by + portRelY };
    };

    return (
        <div className="w-full h-full relative overflow-hidden bg-transparent" onMouseDown={(e) => handleStart(e, 'universe')} onTouchStart={(e) => handleStart(e, 'universe')}>

            {/* BACKGROUND GRID (MAPA ESPACIAL) */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: `radial-gradient(${accent}20 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 50%, ${accent}10 0%, transparent 80%)` }} />

            <div className={`absolute top-1/2 left-1/2 w-0 h-0 transition-transform ${!draggingId ? 'duration-1000 ease-out' : ''}`} style={{ transform: `translate3d(${profileCam.x}px, ${profileCam.y}px, 0) scale(${profileCam.scale})` }}>

                {/* VINCULOS SVG (SANTUARIO - BEZIER) */}
                <svg className="absolute inset-0 pointer-events-none -translate-x-[5000px] -translate-y-[5000px] overflow-visible" style={{ width: '10000px', height: '10000px' }}>
                    <defs>
                        <filter id="glow-profile">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                        <marker id="arrow-profile" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                            <path d="M0,0 L0,6 L9,3 z" fill="white" />
                        </marker>
                    </defs>

                    {/* Líneas de Constelación Originales */}
                    {soulPieces.map(p => (
                        <line key={`line-${p.id}`} x1={5000} y1={5000} x2={5000 + p.x} y2={5000 + p.y} stroke={accent} strokeWidth="1" strokeDasharray="12 16" className="opacity-10 animate-pulse" />
                    ))}

                    {/* VINCULOS ENTRE NOTAS (ALTA FIDELIDAD) */}
                    {links.map((link, idx) => {
                        const from = blocks.find(b => b.id === link.from);
                        const to = blocks.find(b => b.id === link.to);
                        if (!from || !to) return null;

                        const p1 = getPortPos(from);
                        const p2 = getPortPos(to);
                        const elbowY = Math.max(p1.y, p2.y) + 40;
                        const path = `M ${p1.x} ${p1.y} V ${elbowY} H ${p2.x} V ${p2.y}`;

                        return (
                            <g key={`${link.from}-${link.to}-${idx}`} className="pointer-events-auto cursor-pointer group/link-profile" onClick={() => removeConnection(link.from, link.to)}>
                                <path d={path} stroke="white" strokeWidth="12" fill="none" className="opacity-0 group-hover/link-profile:opacity-5 transition-opacity" />
                                <path
                                    d={path}
                                    stroke={from.color || accent}
                                    strokeWidth="2"
                                    fill="none"
                                    filter="url(#glow-profile)"
                                    className="opacity-40 group-hover/link-profile:opacity-95 transition-all"
                                />
                            </g>
                        );
                    })}

                    {/* Línea temporal (Ghost Line) */}
                    {linkSource && (() => {
                        const from = blocks.find(b => b.id === linkSource);
                        if (!from) return null;
                        const p1 = getPortPos(from);
                        const p2 = { x: 5000 + mouseCanvasPos.x, y: 5000 + mouseCanvasPos.y };
                        const elbowY = Math.max(p1.y, p2.y) + 40;
                        const path = `M ${p1.x} ${p1.y} V ${elbowY} H ${p2.x} V ${p2.y}`;

                        return (
                            <path
                                d={path}
                                stroke={from.color || 'white'}
                                strokeWidth="2"
                                fill="none"
                                strokeDasharray="6 4"
                                markerEnd="url(#arrow-profile)"
                                className="opacity-60 saturate-200 animate-pulse"
                            />
                        );
                    })()}
                </svg>

                {/* NÚCLEO CENTRAL (DENSE CORE) */}
                <div className="absolute -translate-x-1/2 -translate-y-1/2 z-50">
                    <div className={`relative w-40 h-40 md:w-48 md:h-48 bg-black/80 backdrop-blur-3xl rounded-[2.5rem] md:rounded-[3rem] border border-white/20 flex flex-col items-center justify-center overflow-hidden transition-all duration-700 ${isEditingProfile ? 'scale-110 border-accent shadow-[0_0_80px_rgba(var(--accent-rgb),0.3)]' : 'shadow-2xl'}`}>
                        <div className="absolute inset-0 opacity-20 animate-slow-spin" style={{ background: `conic-gradient(from 180deg at 50% 50%, transparent 0deg, ${accent} 360deg)` }} />
                        <div className="z-10 text-center px-4">
                            <div className="w-14 h-14 md:w-16 md:h-16 rounded-full mx-auto mb-3 border-2 border-white/20 p-0.5 overflow-hidden">
                                <img src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${user}`} className="w-full h-full bg-zinc-800" alt="Avatar" />
                            </div>
                            <span className="text-[6px] font-black uppercase tracking-[0.6em] text-accent mb-1 block">Oasis Verificado</span>
                            <h2 className="text-lg md:text-xl font-black italic text-white tracking-tighter">@{user || 'anon'}</h2>
                        </div>
                    </div>
                </div>

                {/* MEMORY SQUARES */}
                {soulPieces.filter(p => p.img || isEditingProfile).map((p, i) => {
                    const isMaster = i % 2 === 0;
                    const size = isMaster ? 'w-40 h-40 md:w-56 md:h-56' : 'w-24 h-24 md:w-32 md:h-32';
                    const radius = isMaster ? 'rounded-[3rem]' : 'rounded-[1.5rem] md:rounded-[2rem]';
                    return (
                        <div key={p.id} className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all ${draggingId === p.id ? '' : 'duration-1000'}`} style={{ left: p.x, top: p.y, zIndex: draggingId === p.id ? 100 : 40 }} onMouseDown={(e) => { e.stopPropagation(); handleStart(e, p.id); }} onTouchStart={(e) => { e.stopPropagation(); handleStart(e, p.id); }}>
                            <div className={`group relative ${size} bg-[#0c0c0d] ${radius} border border-white/10 p-1.5 overflow-hidden shadow-2xl transition-all duration-700 ${isEditingProfile ? 'ring-2 ring-accent/40 cursor-pointer' : ''}`}
                                onClick={() => {
                                    if (isEditingProfile) {
                                        setActiveSoulPieceId(p.id);
                                        soulPieceInputRef.current.click();
                                    }
                                }}
                            >
                                <img src={formatUrl(p.img)} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" style={{ borderRadius: 'inherit' }} />
                                <div className="absolute inset-x-0 bottom-4 px-3 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className={`text-white/90 bg-black/60 px-3 py-1.5 rounded-full border border-white/10 ${isMaster ? 'text-[8px]' : 'text-[6px] underline'} font-black uppercase tracking-widest`}>{p.title}</span>
                                </div>
                                {isEditingProfile && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                        <Plus size={isMaster ? 32 : 16} className="text-accent animate-pulse" />
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* HIDDEN INPUT FOR SOUL PIECES */}
                <input
                    type="file"
                    ref={soulPieceInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                        if (activeSoulPieceId) {
                            onSoulPieceImageChange(e, activeSoulPieceId);
                            setActiveSoulPieceId(null);
                        }
                    }}
                />

                {/* NOTAS PUBLICADAS (MEMONODE ALTA FIDELIDAD) */}
                {(blocks || []).map((b) => (
                    <div key={b.id} className={`absolute -translate-x-1/2 -translate-y-1/2 ${draggingId === b.id ? 'transition-none z-[100]' : 'transition-all duration-1000 z-35'}`} style={{ left: b.x + 400, top: b.y + 400 }}>
                        <MemoNode
                            block={b}
                            draggingId={draggingId}
                            activeNoteId={activeNoteId}
                            onStart={handleStart}
                            onSelect={editBlock}
                            onSelectNote={handleSelectNote}
                            onSelectGroup={handleAnalyzeGroup}
                            onAnalyzeBlock={handleAnalyzeBlock}
                            onAnalyzeGroup={handleAnalyzeGroup}
                            isAnalyzing={isChatLoading}
                            onTogglePublic={togglePublic}
                            onDelete={deleteBlock}
                            isLinking={isLinking}
                            onStartConnecting={(id) => setLinkSource(id)}
                            onCompleteConnection={completeConnection}
                            showConnections={true}
                            useInternalPosition={false}
                        />
                    </div>
                ))}
            </div>

            {/* OVERLAY ACTIONS */}
            <div className="absolute top-24 right-6 md:right-8 z-[100] flex flex-col gap-4">
                <button onClick={centerProfile} className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/5 backdrop-blur-3xl border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all shadow-xl"><Focus size={18} /></button>
                <button onClick={() => setIsEditingProfile(!isEditingProfile)} className={`w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/10 flex items-center justify-center transition-all shadow-xl ${isEditingProfile ? 'bg-accent text-black border-accent' : 'bg-white/5 text-white hover:bg-white/10'}`}>
                    {isEditingProfile ? <Check size={18} /> : <Edit2 size={18} />}
                </button>
                <div className="h-px w-full bg-white/10 my-1" />
                <button
                    onClick={() => { setIsLinking(!isLinking); setLinkSource(null); }}
                    className={`w-10 h-10 md:w-12 md:h-12 rounded-full border flex items-center justify-center transition-all shadow-xl ${isLinking ? 'bg-accent text-black border-accent animate-pulse' : 'bg-white/5 text-zinc-500 border-white/10 hover:text-white'}`}
                    title="Modo Vínculo"
                >
                    <Share2 size={18} />
                </button>
                {links.length > 0 && (
                    <button
                        onClick={synthesizeLinks}
                        className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all shadow-xl animate-in fade-in zoom-in"
                        title="Sintetizar"
                    >
                        <Zap size={18} />
                    </button>
                )}
            </div>

            {/* BIO CARD */}
            <div className="absolute bottom-32 left-0 right-0 md:left-10 md:right-auto px-4 md:px-0 z-[100] w-full md:max-w-[320px]">
                <div className="p-5 md:p-6 bg-black/60 backdrop-blur-3xl rounded-[2rem] md:rounded-[2.5rem] border border-white/10 shadow-2xl space-y-5 animate-in fade-in slide-in-from-bottom duration-1000">
                    <div className="flex justify-between items-center border-b border-white/5 pb-4">
                        {[{ val: '842', label: 'Ecos' }, { val: '12k', label: 'Segs' }, { val: '42', label: 'Masters' }].map(s => (
                            <div key={s.label} className="flex flex-col items-center">
                                <span className="text-sm md:text-base font-black italic text-white leading-none mb-1">{s.val}</span>
                                <span className="text-[6px] md:text-[7px] font-black uppercase tracking-widest text-zinc-600">{s.label}</span>
                            </div>
                        ))}
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                            <span className="text-[8px] font-black uppercase tracking-[0.4em] text-accent">Registro de Alma</span>
                        </div>
                        <p className="text-[10px] md:text-xs font-serif italic text-zinc-300 leading-relaxed text-center">"Mis memorias no se desvanecen; se magnifican en el mapa infinito de mi identidad."</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL ---

export default function App() {
    const [view, setView] = useState('canvas');
    const [accent, setAccent] = useState(localStorage.getItem('oasis_accent') || '#bef264');
    const [lastInteractedBlockId, setLastInteractedBlockId] = useState(null);

    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--accent', accent);
        root.style.setProperty('--accent-rgb', hexToRgb(accent));
        localStorage.setItem('oasis_accent', accent);
    }, [accent]);
    const [blocks, setBlocks] = useState(INITIAL_BLOCKS);
    const [soulPieces, setSoulPieces] = useState(INITIAL_SOUL_PIECES);
    const [feed, setFeed] = useState([]);

    const [isComposerOpen, setIsComposerOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [bgType, setBgType] = useState('color');
    const [bgValue, setBgValue] = useState('#030304');
    const [isTiled, setIsTiled] = useState(false);
    const [_unused1, _unused2] = useState(0.8);

    const [user, setUser] = useState(localStorage.getItem('oasis_user') || '');
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('oasis_user'));
    const [showPass, setShowPass] = useState(false);
    const [isRegisterMode, setIsRegisterMode] = useState(false);
    const [authError, setAuthError] = useState('');
    const [credits, setCredits] = useState(100);
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const [deepseekKey, setDeepseekKey] = useState('sk-07b18eb6601a4b11a109c96a56c92a16'); // DeepSeek API Key

    // --- APP STATE ---
    // Sidebar & Conversations
    const [conversations, setConversations] = useState([]);
    const [activeConversationId, setActiveConversationId] = useState(null);
    const [folders, setFolders] = useState([]);
    const [userMemory, setUserMemory] = useState([]); // Persistent AI facts

    // AI & Chat States
    const [activeNoteId, setActiveNoteId] = useState(null);
    const snapedToRef = useRef(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isAnalyzingNote, setIsAnalyzingNote] = useState(false);
    const [isDiaryMode, setIsDiaryMode] = useState(false);
    const [availableModels, setAvailableModels] = useState(['deepseek-chat', 'deepseek-reasoner']);
    const [activeModel, setActiveModel] = useState(null);

    // Performance Refs
    const chatMessagesRef = useRef([]); // PERSISTENT REF FOR THROTTLING
    const lastSuccessModel = useRef(null);

    const syncConversations = useCallback((updated) => {
        setConversations(updated);
        const currentUser = user || localStorage.getItem('oasis_user') || 'user';
        fetch(`${API_URL}/api/oasis/conversations?user=${currentUser}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated)
        }).catch(err => console.error('Error syncing conversations:', err));
    }, [user]);

    const saveCurrentChat = useCallback((overrideId = null, overrideNoteId = null, overrideIsAnalyzing = null) => {
        const targetId = overrideId || activeConversationId;
        const targetNoteId = overrideNoteId !== null ? overrideNoteId : activeNoteId;
        const targetIsAnalyzing = overrideIsAnalyzing !== null ? overrideIsAnalyzing : isAnalyzingNote;

        if (!targetId || chatMessagesRef.current.length === 0) return;

        setConversations(prev => {
            const exists = prev.find(c => c.id === targetId);
            let updated;
            if (exists) {
                updated = prev.map(c => c.id === targetId ? { ...c, messages: chatMessagesRef.current, noteId: targetNoteId } : c);
            } else {
                // Generate a clean title from the first message
                const firstMsg = chatMessagesRef.current[0]?.content || '';
                const cleanTitle = firstMsg.slice(0, 35).trim() + (firstMsg.length > 35 ? '...' : '');

                updated = [{
                    id: targetId,
                    title: targetIsAnalyzing ? `Análisis: ${cleanTitle}` : cleanTitle,
                    messages: chatMessagesRef.current,
                    startTime: new Date().toISOString(),
                    noteId: targetNoteId,
                    color: accent // Use current accent as initial color
                }, ...prev];
            }

            const currentUser = user || localStorage.getItem('oasis_user') || 'user';
            fetch(`${API_URL}/api/oasis/conversations?user=${currentUser}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updated)
            }).catch(err => console.error('Error syncing conversations (saveCurrentChat):', err));

            return updated;
        });
    }, [activeConversationId, isAnalyzingNote, activeNoteId, user, accent]);

    const generateChatTitle = useCallback(async (convId, firstMessage) => {
        const prompt = `Eres Kio, el núcleo digital del Oasis. Genera un título corto, elegante y profesional (máximo 4 palabras) para una conversación que comienza con este mensaje: "${firstMessage}". Responde ÚNICAMENTE con el título, sin comillas ni puntos finales.`;

        try {
            const res = await fetch(`https://api.deepseek.com/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${deepseekKey}`
                },
                body: JSON.stringify({
                    model: lastSuccessModel.current || 'deepseek-chat',
                    messages: [{ role: 'user', content: prompt }]
                })
            });

            if (res.ok) {
                const data = await res.json();
                let title = data.choices?.[0]?.message?.content?.trim();
                if (title) {
                    title = title.replace(/^["']|["']$|[\.]$/g, '');
                    console.log(`Kio - Título generado con éxito: "${title}"`);

                    const updateState = (attempts = 0) => {
                        setConversations(prev => {
                            const exists = prev.find(c => c.id === convId);
                            if (!exists) {
                                if (attempts < 5) {
                                    console.warn(`Kio - Intento ${attempts + 1}: Conversación [${convId}] no encontrada. Reintentando en 500ms...`);
                                    setTimeout(() => updateState(attempts + 1), 500);
                                } else {
                                    console.error(`Kio - Error: No se pudo actualizar el título tras 5 intentos.`);
                                }
                                return prev;
                            }

                            const updated = prev.map(c => c.id === convId ? { ...c, title: title } : c);
                            const currentUser = user || localStorage.getItem('oasis_user') || 'user';
                            fetch(`${API_URL}/api/oasis/conversations?user=${currentUser}`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(updated)
                            });
                            return updated;
                        });
                    };

                    updateState();
                } else {
                    console.warn("Kio - El modelo no devolvió un título válido.");
                }
            } else {
                const errData = await res.json().catch(() => ({}));
                console.error("Kio - Error en API de títulos:", errData?.error?.message || res.statusText);
            }
        } catch (e) {
            console.error("Kio - Excepción generando título AI:", e);
        }
    }, [deepseekKey, user]);

    const handleNewChat = useCallback(() => {
        console.log("Kio - Iniciando nueva línea temporal...");
        if (chatMessagesRef.current && chatMessagesRef.current.length > 0) saveCurrentChat();
        setActiveConversationId(null);
        setChatMessages([]);
        if (chatMessagesRef.current) chatMessagesRef.current = [];
        setIsAnalyzingNote(false);
        setActiveNoteId(null);
        setChatInput('');
        setIsChatOpen(true);
    }, [saveCurrentChat]);

    const logout = () => {
        setUser('');
        setIsLoggedIn(false);
        setIsDataLoaded(false);
        localStorage.removeItem('oasis_user');
        setBlocks(INITIAL_BLOCKS);
        setPlaylists({ 'Favoritos': [] });
        setPlayQueue(playerTracks);
        setCurrentTrack(0);
        setTrackProgress(0);
        setView('canvas');
    };

    // --- SINCRONIZACIÓN DE AURA Y DATOS ---
    useEffect(() => {
        if (isLoggedIn && user && !isDataLoaded) {
            const loadUserResonances = async () => {
                try {
                    // Aura
                    const bgRes = await fetch(`${API_URL}/api/oasis/background?user=${user}`);
                    if (bgRes.ok) {
                        const data = await bgRes.json();
                        if (data) { setBgType(data.type); setBgValue(data.value); setIsTiled(data.isTiled); }
                    }

                    // Conversations
                    const convRes = await fetch(`${API_URL}/api/oasis/conversations?user=${user}`);
                    if (convRes.ok) {
                        const data = await convRes.json();
                        setConversations(data || []);
                    }

                    // Folders
                    const foldRes = await fetch(`${API_URL}/api/oasis/folders?user=${user}`);
                    if (foldRes.ok) {
                        const data = await foldRes.json();
                        setFolders(data || []);
                    }

                    // Bloques
                    const blocksRes = await fetch(`${API_URL}/api/oasis/blocks?user=${user}`);
                    if (blocksRes.ok) {
                        const data = await blocksRes.json();
                        if (data && data.length > 0) setBlocks(data);
                    }

                    // Vínculos
                    const linksRes = await fetch(`${API_URL}/api/oasis/links?user=${user}`);
                    if (linksRes.ok) {
                        const data = await linksRes.json();
                        console.log(`[Oasis] Cargados ${data?.length || 0} vínculos para ${user}`);
                        setLinks(data || []);
                    }

                    // Playlists
                    const playRes = await fetch(`${API_URL}/api/oasis/playlists?user=${user}`);
                    if (playRes.ok) {
                        const data = await playRes.json();
                        if (data && Object.keys(data).length > 0) setPlaylists(data);
                    }

                    // Playback
                    const pbRes = await fetch(`${API_URL}/api/oasis/playback?user=${user}`);
                    if (pbRes.ok) {
                        const data = await pbRes.json();
                        if (data && data.queue && data.queue.length > 0) {
                            setPlayQueue(data.queue);
                            setCurrentTrack(data.currentIndex);
                            setTrackProgress(data.position || 0);
                        }
                    }

                    // Continuous Memory
                    const memRes = await fetch(`${API_URL}/api/oasis/memory?user=${user}`);
                    if (memRes.ok) {
                        const data = await memRes.text();
                        try {
                            setUserMemory(JSON.parse(data) || []);
                        } catch (e) {
                            setUserMemory([]);
                        }
                    }

                    setIsDataLoaded(true);
                } catch (err) {
                    console.error("Error al cargar datos del usuario:", err);
                }
            };
            loadUserResonances();
        }
    }, [isLoggedIn, user, isDataLoaded]);

    const syncPlaylists = useCallback((newPlaylists) => {
        if (!isLoggedIn || !user || !isDataLoaded) return;
        fetch(`${API_URL}/api/oasis/playlists?user=${user}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newPlaylists)
        });
    }, [isLoggedIn, user, isDataLoaded]);

    const syncPlayback = useCallback((queue, index, position) => {
        if (!isLoggedIn || !user || !isDataLoaded) return;
        fetch(`${API_URL}/api/oasis/playback?user=${user}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                queue: queue.map(t => ({ title: t.title, artist: t.artist, videoId: t.videoId, thumbnail: t.thumbnail })),
                currentIndex: index,
                position: position
            })
        });
    }, [isLoggedIn, user, isDataLoaded]);

    const syncMemory = useCallback((newMemory) => {
        if (!isLoggedIn || !user || !isDataLoaded) return;
        fetch(`${API_URL}/api/oasis/memory?user=${user}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ memory: JSON.stringify(newMemory) })
        });
    }, [isLoggedIn, user, isDataLoaded]);

    const syncAura = (type, val, tiled) => {
        if (!isLoggedIn || !user || !isDataLoaded) return;
        fetch(`${API_URL}/api/oasis/background?user=${user}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, value: val, isTiled: tiled, opacity: 0.8 })
        });
    };

    const syncBlocks = (newBlocks) => {
        if (!isLoggedIn || !user || !isDataLoaded) return;
        fetch(`${API_URL}/api/oasis/blocks?user=${user}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newBlocks)
        }).then(() => fetchFeed()); // Refresh feed
    };

    const syncLinks = (newLinks) => {
        if (!isLoggedIn || !user || !isDataLoaded) return;
        console.log(`[Oasis] Sincronizando ${newLinks.length} vínculos para ${user}...`);
        fetch(`${API_URL}/api/oasis/links?user=${user}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newLinks)
        }).then(res => {
            if (res.ok) console.log(`[Oasis] Sincronización de vínculos exitosa.`);
            else console.error(`[Oasis] Error de sincronización: ${res.status}`);
        });
    };

    const fetchFeed = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/api/oasis/feed`);
            const data = await res.json();
            if (data) setFeed(data);
        } catch (e) {
            console.error("Fallo al sincronizar feed: ", e);
        }
    }, []);

    const deleteBlock = (id) => {
        setBlocks(prev => {
            const updated = prev.filter(b => b.id !== id);
            syncBlocks(updated);
            return updated;
        });
    };

    useEffect(() => {
        fetchFeed();
        const interval = setInterval(fetchFeed, 30000); // Sincronía constante cada 30s
        return () => clearInterval(interval);
    }, [fetchFeed]);

    const togglePublic = (id) => {
        setBlocks(prev => {
            const updated = prev.map(b => b.id === id ? { ...b, isPublic: !b.isPublic } : b);
            syncBlocks(updated);
            return updated;
        });
    };

    const handleAuth = async (username, password) => {
        setAuthError('');
        const endpoint = isRegisterMode ? 'register' : 'login';
        try {
            const res = await fetch(`${API_URL}/api/oasis/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ Username: username, Password: password })
            });
            const text = await res.text();
            const data = text ? JSON.parse(text) : {};
            if (res.ok) {
                const userData = data.user;
                setUser(userData.username);
                setIsLoggedIn(true);
                localStorage.setItem('oasis_user', userData.username);

                // Load user data immediately
                if (userData.blocks && userData.blocks.length > 0) setBlocks(userData.blocks);
                if (userData.links && userData.links.length > 0) setLinks(userData.links);
                if (userData.playlists) setPlaylists(userData.playlists);
                if (userData.background) {
                    setBgType(userData.background.type);
                    setBgValue(userData.background.value);
                    setIsTiled(userData.background.isTiled);
                }
                if (userData.lastPlayback && userData.lastPlayback.queue && userData.lastPlayback.queue.length > 0) {
                    setPlayQueue(userData.lastPlayback.queue);
                    setCurrentTrack(userData.lastPlayback.currentIndex);
                    setTrackProgress(userData.lastPlayback.position || 0);
                }
                if (userData.continuousMemory) {
                    try {
                        setUserMemory(JSON.parse(userData.continuousMemory) || []);
                    } catch (e) { setUserMemory([]); }
                }
                setIsDataLoaded(true);
            } else {
                setAuthError(`${data.msg || 'Fallo de Conexión'} (${res.status})`);
            }
        } catch (e) {
            setAuthError('FALLO TÉCNICO: ' + e.message);
        }
    };


    const handleBgUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const type = file.type.startsWith('video') ? 'video' : 'image';

        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await fetch(`${API_URL}/api/oasis/upload`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            setBgType(type); setBgValue(data.url);
            syncAura(type, data.url, isTiled);
        } catch (err) {
            console.error("Error al subir fondo: ", err);
        }
    };

    const inlineMediaInputRef = useRef(null);
    const canvasRef = useRef(null);

    const handleInlineMedia = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await fetch(`${API_URL}/api/oasis/upload`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            const url = data.url;
            const tag = file.type.startsWith('video') ? '[vid]' : (file.type.startsWith('audio') ? '[aud]' : '[img]');
            setNoteText(prev => prev.trim() + `\n${tag}${url}\n`);
        } catch (err) {
            console.error("Error al subir media inline: ", err);
        }
    };

    const handleSoulPieceImageChange = async (e, id) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await fetch(`${API_URL}/api/oasis/upload`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            setSoulPieces(prev => prev.map(p => p.id === id ? { ...p, img: data.url } : p));
        } catch (err) {
            console.error("Error al subir pieza de alma: ", err);
        }
    };

    const [composerStep, setComposerStep] = useState('menu');
    const [noteText, setNoteText] = useState('');
    const [isResonanceMode, setIsResonanceMode] = useState(false);
    const [resResonance, setResResonance] = useState('');
    const [resImpact, setResImpact] = useState('');
    const [resStrange, setResStrange] = useState('');

    const [caption, setCaption] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const [mediaFile, setMediaFile] = useState(null);
    const [isDrawingModalOpen, setIsDrawingModalOpen] = useState(false);
    const [mouseCanvasPos, setMouseCanvasPos] = useState({ x: 0, y: 0 });
    const [activeMenu, setActiveMenu] = useState(null); // { idx: number, type: 'add' | 'actions' }
    const [links, setLinks] = useState([]); // { from: id, to: id }
    const [isLinking, setIsLinking] = useState(false);
    const [linkSource, setLinkSource] = useState(null);

    const [editingId, setEditingId] = useState(null);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [drawingColor, setDrawingColor] = useState('#bef264');
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        // En DeepSeek los modelos son estáticos para esta implementación
        setAvailableModels(['deepseek-chat', 'deepseek-reasoner']);
    }, [deepseekKey]);

    const editBlock = (block) => {
        setComposerStep(block.type === 'text' ? 'note' : block.type);
        setNoteText(block.content);
        setCaption(block.caption);
        setIsPublic(block.isPublic || false);
        setEditingId(block.id);
        setLastInteractedBlockId(block.id);

        // Detect Resonance Mode
        if (block.type === 'text' && block.content.includes('[resonancia]')) {
            setIsResonanceMode(true);
            const resMatch = block.content.match(/\[resonancia\]([\s\S]*?)(?=\[impacto\]|$)/);
            const impMatch = block.content.match(/\[impacto\]([\s\S]*?)(?=\[extrano\]|$)/);
            const extMatch = block.content.match(/\[extrano\]([\s\S]*?)$/);
            setResResonance(resMatch ? resMatch[1].trim() : '');
            setResImpact(impMatch ? impMatch[1].trim() : '');
            setResStrange(extMatch ? extMatch[1].trim() : '');
        } else {
            setIsResonanceMode(false);
            setResResonance('');
            setResImpact('');
            setResStrange('');
        }

        setIsComposerOpen(true);
    };

    const [cam, setCam] = useState({ x: 0, y: 0, scale: 0.8 });
    const [profileCam, setProfileCam] = useState({ x: 0, y: 0, scale: 0.7 });
    const [feedCam, setFeedCam] = useState({ x: 0, y: 0, scale: 1 });

    const [draggingId, setDraggingId] = useState(null);
    const dragStart = useRef({ x: 0, y: 0 });
    const isPointerDown = useRef(false);
    const initialPinchDist = useRef(0);
    const initialPinchScale = useRef(1);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTrack, setCurrentTrack] = useState(0);
    const [isPlayerMinimized, setIsPlayerMinimized] = useState(false);
    const [isPlayerFull, setIsPlayerFull] = useState(false);
    const [volume, setVolume] = useState(0.5);
    const [playerPos, setPlayerPos] = useState({ x: 0, y: 20 });
    const [playerTracks, setPlayerTracks] = useState([
        { title: 'Sincronía Profunda', artist: 'Oasis Core', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
        { title: 'Glitch Astral', artist: 'Flux', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
        { title: 'Memoria RAM', artist: 'Holo', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
    ]);
    const [playlists, setPlaylists] = useState({ 'Favoritos': [] });

    const [playerSearchQuery, setPlayerSearchQuery] = useState('');
    const [playerSearchResults, setPlayerSearchResults] = useState([]);
    const [isPlayerSearching, setIsPlayerSearching] = useState(false);
    const [playQueue, setPlayQueue] = useState([]);
    const [playSource, setPlaySource] = useState('library'); // 'search', 'playlist', 'library'
    const [activePlayerView, setActivePlayerView] = useState('search'); // 'search' or playlist name
    const [trackProgress, setTrackProgress] = useState(0);
    const [trackDuration, setTrackDuration] = useState(0);
    const [expandedPlaylistItems, setExpandedPlaylistItems] = useState([]);
    const [isPlaylistExpanded, setIsPlaylistExpanded] = useState(false);
    const [expandedPlaylistName, setExpandedPlaylistName] = useState('');


    // Initialize queue with default tracks
    useEffect(() => {
        if (playQueue.length === 0) setPlayQueue(playerTracks);
    }, [playQueue.length, playerTracks]);

    // --- INTELLIGENCE BLOOM (The Living Engine) ---
    const prevIsChatOpen = useRef(isChatOpen);

    const generateIntelligenceBloom = useCallback(async () => {
        if (!deepseekKey || chatMessages.length < 2) return;

        setIsChatLoading(true); // Using chat loading state for bloom too
        const MODELS_TO_TRY = lastSuccessModel.current
            ? [lastSuccessModel.current, ...availableModels.filter(m => m !== lastSuccessModel.current)]
            : availableModels;
        let success = false;

        const chatHistory = chatMessages
            .filter(m => m.role !== 'assistant' || m.content !== chatMessages[0].content)
            .map(m => `${m.role === 'user' ? 'Usuario' : 'Espíritu'}: ${m.content}`)
            .join('\n');

        const systemPrompt = `
        Actúa como un Asistente de Síntesis Creativa para el usuario ${user || localStorage.getItem('oasis_user') || 'user'}. 
        Tu meta es resumir los puntos más importantes de la conversación actual de manera útil y reflexiva.
        
        - TAREA: Proporciona una síntesis clara del progreso intelectual o creativo de la sesión.
        - REGLAS:
            1. Escribe una reflexión concreta y de valor (máximo 30 palabras).
            2. Usa un lenguaje natural, directo y alentador.
            3. Puedes usar emojis funcionales (💡, ✅, ✨) si añaden valor.
            4. Usa **negritas** para conceptos clave.
        - IMPORTANTE: Termina con UNA sola PREGUNTA funcional que invite al usuario a seguir explorando o ejecutando sus ideas.
        - TONO: Kio (Profesional, útil y perspicaz). Evita el misterio o la mística innecesaria.
        - IDENTIDAD: Eres Kio, el núcleo de síntesis del Oasis.
        
        Formato: [insight] {Síntesis concreta}. \n\n{Pregunta para avanzar}
        
        Conversación:
        ${chatHistory}
    `;

        for (const modelName of MODELS_TO_TRY) {
            try {
                const res = await fetch(`https://api.deepseek.com/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${deepseekKey}`
                    },
                    body: JSON.stringify({
                        model: modelName,
                        messages: [{ role: 'user', content: systemPrompt }]
                    })
                });

                if (res.ok) {
                    const data = await res.json();
                    const insightText = data.choices?.[0]?.message?.content?.trim();
                    if (insightText) {
                        const newBlock = {
                            id: `insight-${Date.now()}`,
                            type: 'insight',
                            content: insightText.replace('[insight]', '').trim(),
                            x: (Math.random() - 0.5) * 400,
                            y: (Math.random() - 0.5) * 400,
                            rotation: (Math.random() - 0.5) * 10,
                            color: '#a855f7',
                            caption: 'Revelación del Lienzo',
                            username: user || 'anon',
                            metadata: { origin: 'intelligence_bloom', timestamp: new Date().toISOString() }
                        };
                        setBlocks(prev => {
                            const updated = [newBlock, ...prev];
                            syncBlocks(updated);
                            return updated;
                        });
                        success = true;
                        break;
                    }
                }
            } catch (err) {
                console.error(`Fallo Bloom con ${modelName}:`, err);
            }
        }
        setIsChatLoading(false);
    }, [deepseekKey, chatMessages, user, syncBlocks]);

    useEffect(() => {
        if (prevIsChatOpen.current === true && isChatOpen === false) {
            // Chat just closed
            generateIntelligenceBloom();
            harvestMemory();
        }
        prevIsChatOpen.current = isChatOpen;
    }, [isChatOpen, generateIntelligenceBloom]);

    const harvestMemory = async () => {
        if (!deepseekKey || chatMessages.length < 4 || !isLoggedIn) return;

        console.log("Núcleo de Memoria - Cosechando nuevos hechos...");
        const chatHistory = chatMessages
            .map(m => `${m.role === 'user' ? 'Usuario' : 'Espíritu'}: ${m.content}`)
            .join('\n');

        const existingFacts = userMemory.map(f => f.text).join('\n');

        const harvestPrompt = `
        Actúa como el Núcleo de Memoria de Kio. Tu tarea es extraer NUEVOS hechos importantes, intereses o proyectos del usuario de la conversación actual que NO estén ya en su memoria.

        - MEMORIA ACTUAL:
        ${existingFacts || 'Vacía'}

        - CONVERSACIÓN RECIENTE:
        ${chatHistory}

        - INSTRUCCIONES:
            1. Identifica hechos concretos (ej: "Está trabajando en un álbum de techno", "Le gusta el color cian para su interfaz").
            2. NO repitas hechos que ya están en la memoria actual.
            3. Si no hay nada nuevo de valor, responde con "SIN CAMBIOS".
            4. Si hay hechos nuevos, devuélvelos en formato JSON: [{"text": "hecho", "category": "Categoría", "timestamp": "ISO Date"}]
            5. Categorías sugeridas: Proyectos, Intereses, Personal, Preferencias.
        
        Responde ÚNICAMENTE con el JSON o "SIN CAMBIOS".
        `;

        const MODELS_TO_TRY = [lastSuccessModel.current || 'deepseek-chat', ...availableModels];
        for (const modelName of MODELS_TO_TRY) {
            try {
                const res = await fetch(`https://api.deepseek.com/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${deepseekKey}`
                    },
                    body: JSON.stringify({
                        model: modelName,
                        messages: [{ role: 'user', content: harvestPrompt }]
                    })
                });

                if (res.ok) {
                    const data = await res.json();
                    const result = data.choices?.[0]?.message?.content?.trim();
                    if (result && result !== 'SIN CAMBIOS' && result.startsWith('[')) {
                        try {
                            const newFacts = JSON.parse(result);
                            if (Array.isArray(newFacts)) {
                                setUserMemory(prev => {
                                    const updated = [...newFacts, ...prev].slice(0, 50); // Keep last 50
                                    syncMemory(updated);
                                    return updated;
                                });
                                console.log("Núcleo de Memoria - Sincronizado con éxito.");
                            }
                        } catch (e) { console.error("Error al parsear cosecha:", e); }
                    }
                    break;
                }
            } catch (err) { console.error("Fallo Cosecha:", err); }
        }
    };

    // Sync playback on changes (Throttled for performance)
    const lastSyncTime = useRef(0);
    useEffect(() => {
        if (playQueue.length > 0 && isLoggedIn) {
            const now = Date.now();
            // Sync if track/index changes, or if progress moved > 10s since last sync
            if (now - lastSyncTime.current > 10000) {
                syncPlayback(playQueue, currentTrack, trackProgress);
                lastSyncTime.current = now;
            }
        }
    }, [currentTrack, playQueue, isLoggedIn, syncPlayback, trackProgress]);

    // Auto-resize note textareas on changes
    React.useLayoutEffect(() => {
        if (isComposerOpen) {
            const textareas = document.querySelectorAll('.typing-aura');
            textareas.forEach(ta => {
                ta.style.height = 'auto';
                ta.style.height = ta.scrollHeight + 'px';
            });
        }
    }, [noteText, isComposerOpen]);

    const handlePlayerSearch = async (query) => {
        if (!query) return;
        setIsPlayerSearching(true);
        setActivePlayerView('search');
        setIsPlaylistExpanded(false); // Reset expanded playlist view
        try {
            const res = await fetch(`${API_URL}/api/oasis/youtube/search?q=${encodeURIComponent(query)}`);
            const data = await res.json();
            setPlayerSearchResults(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error en búsqueda de música:", err);
        } finally {
            setIsPlayerSearching(false);
        }
    };

    const handleAddTrack = async (videoId) => {
        try {
            const res = await fetch(`${API_URL}/api/oasis/youtube/track/${videoId}`);
            const { data } = await res.json();
            const newTrack = {
                title: data.title,
                artist: data.artist,
                url: '',
                videoId: videoId
            };
            const updatedTracks = [...playerTracks, newTrack];
            setPlayerTracks(updatedTracks);

            // If we are in library mode, update queue
            if (playSource === 'library') {
                setPlayQueue(updatedTracks);
            }
        } catch (err) {
            console.error("Error al añadir track:", err);
        }
    };

    const handleImportPlaylist = async (playlistId, title, autoSave = false) => {
        setIsPlayerSearching(true);
        setExpandedPlaylistName(item.title);
        try {
            const res = await fetch(`${API_URL}/api/oasis/youtube/playlist/${playlistId}`);
            const data = await res.json();
            setExpandedPlaylistItems(data);
            setIsPlaylistExpanded(true);

            if (autoSave) {
                const name = title || `Playlist Guardada ${Object.keys(playlists).length + 1}`;
                const newPlaylist = data.map(t => ({
                    title: t.title,
                    videoId: t.videoId || t.id,
                    artist: t.artist || 'YouTube Echo',
                    thumbnail: t.thumbnail
                }));
                const updated = { ...playlists, [name]: newPlaylist };
                setPlaylists(updated);
                syncPlaylists(updated);
                setActivePlayerView(name);
            }
        } catch (err) {
            console.error("Error al importar playlist:", err);
        } finally {
            setIsPlayerSearching(false);
        }
    };

    const handlePlayFromSearch = async (index) => {
        const item = playerSearchResults[index];

        if (item.type === 'playlist' || item.playlistId) {
            handleImportPlaylist(item.playlistId, item.title);
            return;
        }

        const richResults = playerSearchResults
            .filter(item => item.type === 'video')
            .map(item => ({
                title: item.title,
                artist: item.artist || 'YouTube Echo',
                videoId: item.videoId,
                thumbnail: item.thumbnail,
                url: ''
            }));
        setPlayQueue(richResults);
        setCurrentTrack(0);
        setIsPlaying(true);
        setIsPlayerFull(true);
    };

    const handlePlayFromPlaylist = (pName, index) => {
        const pTracks = playlists[pName];
        if (pTracks && pTracks.length > 0) {
            setPlayQueue(pTracks);
            setCurrentTrack(index);
            setIsPlaying(true);
        }
    };

    const handleNextTrack = () => {
        if (playQueue.length === 0) return;
        setCurrentTrack((currentTrack + 1) % playQueue.length);
    };

    const handlePrevTrack = () => {
        if (playQueue.length === 0) return;
        setCurrentTrack((currentTrack - 1 + playQueue.length) % playQueue.length);
    };

    const handleSelectNote = (noteId) => {
        const note = blocks.find(b => b.id === noteId);
        if (!note) return;

        // If we are already in a conversation, "attach" the note to it
        if (activeConversationId) {
            setIsAnalyzingNote(true);
            setActiveNoteId(noteId);
            setIsChatOpen(true);

            // Create the context card message
            const contextMsg = {
                role: 'assistant',
                type: 'context',
                content: note.content,
                title: note.caption || 'Nota del Lienzo',
                id: Date.now()
            };

            // Update state and persistence simultaneously
            setConversations(prev => {
                const updated = prev.map(c => c.id === activeConversationId ? {
                    ...c,
                    noteId: noteId,
                    messages: [...(c.messages || []), contextMsg]
                } : c);

                // Sync to backend
                fetch(`${API_URL}/api/oasis/conversations?user=${user || localStorage.getItem('oasis_user')}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updated)
                });

                // Also update local chat messages for the current view
                const currentConv = updated.find(c => c.id === activeConversationId);
                if (currentConv) setChatMessages(currentConv.messages);

                return updated;
            });

            // Trigger AI analysis with a slight delay to ensure messages are loaded
            setTimeout(() => {
                handleSendChatMessage(null, `Analiza esta nota: "${note.content.slice(0, 50)}..."`, activeConversationId, noteId);
            }, 100);
        } else {
            // Existing logic: New "Analysis" Conversation
            const newId = `conv-vortex-${Date.now()}`;
            setIsAnalyzingNote(true);
            setActiveNoteId(noteId);
            setActiveConversationId(newId);
            setChatMessages([]);
            setIsChatOpen(true);

            // Trigger initial analysis
            handleSendChatMessage(null, note.content, newId, noteId);
        }
    };

    const handleAnalyzeGroup = async (groupId) => {
        const groupNotes = blocks.filter(b => b.groupId === groupId).slice(-12); // Limit to last 12 for prompt safety
        if (groupNotes.length === 0) return;

        const combinedContent = groupNotes.map(b => `${b.caption || 'Fragmento'}: ${b.content}`).join('\n\n---\n\n');

        setIsChatLoading(true);
        const prompt = `Analiza este conjunto de ideas como Kio, el punto de convergencia del Oasis. 
        Busca la "Arquitectura Invisible" que une estos fragmentos. 
        ¿Cuál es el proyecto del alma que emerge de esta colección?

        FORMATO: CATEGORÍA | INSIGHT (2-3 frases profundas, sintéticas y reveladoras. Evita listas.)
        Categorías sugeridas: Constelación, Mapa del Deseo, Convergencia, Raíz Colectiva, Geometría del Propósito.

        NOTAS:
        ${combinedContent}`;

        const result = await backgroundAnalyzeContent(prompt);
        if (result && result.length > 5) {
            const [category, text] = result.includes('|') ? result.split('|').map(s => s.trim()) : ['Insight Colectivo', result];
            const newFact = { category, text, timestamp: new Date().toISOString() };
            setUserMemory(prev => {
                const updated = [newFact, ...prev].slice(0, 50);
                syncMemory(updated);
                return updated;
            });
        } else {
            console.warn('Kio - El análisis de grupo no devolvió un insight válido.');
            // We don't add fallbacks to userMemory anymore to avoid cluttering, 
            // but we can show a temporary notification if we had a system for it.
        }
        setIsChatLoading(false);
    };

    const handleAnalyzeBlock = async (id) => {
        const block = blocks.find(b => b.id === id);
        if (!block) return;

        setIsChatLoading(true);
        const prompt = `Analiza esta nota del Oasis como Kio, el núcleo de síntesis. 
        No resumas; busca la intención latente, el patrón psicológico o la semilla creativa detrás de las palabras. 
        ¿Qué dice esto sobre el alma de quien lo escribió? 

        FORMATO: CATEGORÍA | INSIGHT (1-2 frases fluidas, poéticas y profundas)
        Categorías sugeridas: Sombra, Eco, Evolución, Geometría Humana, Núcleo de Intención.

        NOTA: "${block.caption || 'Fragmento'}: ${block.content}"`;

        const result = await backgroundAnalyzeContent(prompt);
        if (result && result.length > 5) {
            const [category, text] = result.includes('|') ? result.split('|').map(s => s.trim()) : ['Reflexión', result];
            const newFact = { category, text, timestamp: new Date().toISOString() };
            setUserMemory(prev => {
                const updated = [newFact, ...prev].slice(0, 50);
                syncMemory(updated);
                return updated;
            });
        } else {
            console.warn('Kio - El análisis de nota no devolvió un insight válido.');
        }
        setIsChatLoading(false);
    };

    const [analysisError, setAnalysisError] = useState(null);

    const backgroundAnalyzeContent = async (prompt) => {
        if (!deepseekKey) return null;
        setAnalysisError(null);

        const modelsToTry = lastSuccessModel.current
            ? [lastSuccessModel.current, ...availableModels.filter(m => m !== lastSuccessModel.current)]
            : ['deepseek-chat', 'deepseek-reasoner'];

        for (const modelName of modelsToTry) {
            try {
                console.log(`[Oasis AI] Intentando análisis invisible (Protocolo Streaming) con ${modelName}...`);

                const response = await fetch(`https://api.deepseek.com/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${deepseekKey}`
                    },
                    body: JSON.stringify({
                        model: modelName,
                        messages: [{ role: 'user', content: prompt }],
                        stream: true
                    })
                });

                if (response.ok) {
                    const reader = response.body.getReader();
                    let fullText = '';
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        const chunk = new TextDecoder().decode(value);
                        const lines = chunk.split('\n');
                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                try {
                                    const json = JSON.parse(line.slice(6));
                                    const part = json.choices?.[0]?.delta?.content;
                                    if (part) fullText += part;
                                } catch (e) { }
                            }
                        }
                    }

                    if (fullText) {
                        lastSuccessModel.current = modelName;
                        console.log(`Kio - Análisis Invisible Completo con ${modelName}`);
                        return fullText.replace(/<thought>[\s\S]*?<\/thought>/, '').replace(/```.*?```/gs, '').trim();
                    } else {
                        console.warn(`Kio - Stream vacío con ${modelName}.`);
                    }
                } else {
                    const errData = await response.json().catch(() => ({}));
                    console.warn(`Kio - Fallo en Stream con ${modelName}:`, errData.error?.message || response.statusText);
                }
            } catch (e) {
                console.error(`Kio - Error técnico en Stream con ${modelName}:`, e);
            }
        }

        setAnalysisError("Fallo crítico: No se pudo sintonizar el canal de IA. Revisa tu API Key.");
        return null;
    };


    const handleTogglePinFact = (idx) => {
        setUserMemory(prev => {
            const updated = prev.map((f, i) => i === idx ? { ...f, isPinned: !f.isPinned } : f);
            syncMemory(updated);
            return updated;
        });
    };

    const handlePublishFact = (fact) => {
        const newBlock = {
            id: `soul-publish-${Date.now()}`,
            type: 'text',
            x: 0, y: 0, // Profile has its own auto-layout for blocks
            content: fact.text,
            caption: `Insight Soul: ${fact.category || 'Conciencia'}`,
            isPublic: true,
            color: '#eb5e28', // Distinct color for published archive items
            rotation: 0,
            username: user,
            metadata: { origin: 'soul_archive', factTimestamp: fact.timestamp, timestamp: new Date().toISOString() }
        };

        setBlocks(prev => {
            const updated = [newBlock, ...prev];
            syncBlocks(updated);
            return updated;
        });
        console.log('Insight publicado al Perfil.');
    };

    const handleDeleteFact = (idx) => {
        setUserMemory(prev => {
            const updated = prev.filter((_, i) => i !== idx);
            syncMemory(updated);
            return updated;
        });
    };

    const handleSendChatMessage = async (manualInput, analysisContent, forceConvId, forceNoteId) => {
        const inputToProcess = analysisContent || manualInput || chatInput;
        if (!inputToProcess.trim() || !deepseekKey) return;

        let effectiveConvId = forceConvId || activeConversationId;
        const isNewChat = !effectiveConvId;
        if (isNewChat) {
            effectiveConvId = `conv-${Date.now()}`;
            setActiveConversationId(effectiveConvId);
        }
        const effectiveNoteId = forceNoteId || activeNoteId;

        const userMsg = { role: 'user', content: analysisContent || inputToProcess };
        const newMessages = [...chatMessages, userMsg];
        chatMessagesRef.current = newMessages;
        setChatMessages(newMessages);
        if (!analysisContent) setChatInput('');
        setIsChatLoading(true);

        // Save immediately so it appears in sidebar
        saveCurrentChat(effectiveConvId, effectiveNoteId, !!effectiveNoteId);

        // Generate AI title for new chats or if it's the very first message
        const isFirstMessage = newMessages.length === 1;
        if ((isNewChat || isFirstMessage) && !analysisContent) {
            console.log("Kio - Detectado inicio de chat. Disparando generación de título...");
            generateChatTitle(effectiveConvId, inputToProcess);
        }

        const MODELS_TO_TRY = lastSuccessModel.current
            ? [lastSuccessModel.current, ...availableModels.filter(m => m !== lastSuccessModel.current)]
            : ['deepseek-chat', 'deepseek-reasoner'];

        let lastError = '';
        const activeNoteContent = activeNoteId ? blocks.find(b => b.id === activeNoteId)?.content : '';

        const memoryContext = userMemory.length > 0
            ? `\n- MEMORIA CONTINUA (Datos que recuerdas del usuario):\n${userMemory.map(f => `- [${f.category || 'General'}] ${f.text}`).join('\n')}`
            : '';

        const inputPrompt = isAnalyzingNote ? `Te hablo desde el Oasis. Estoy aquí para lo que gustes. 
        Este es tu espacio de exploración. Tu objetivo es ayudar al usuario a profundizar, refinar y conectar el contenido de su nota: "${activeNoteContent}".
        ${memoryContext}
        
        - OBJETIVO: Proporciona un análisis profundo, conexiones conceptuales y una visión evolutiva de la idea.
        - ESTILO NARRATIVO: Escribe en párrafos fluidos y cohesivos. Evita las listas de viñetas si rompen el flujo de la reflexión. Usa negritas para resaltar términos clave y cursivas para matices emocionales o filosóficos.
        - LENGUAJE: Poético y profundo pero **accesible**. Evita palabras excesivamente rebuscadas, arcaicas o "difíciles" (ej: evita palabras como "prístina" si hay una opción más clara). Prefiere la claridad que resuena con la vida real.
        - ESTRUCTURA:
            [Título Sugestivo en Mayúsculas]
            Desarrolla la idea central de forma narrativa, conectando los puntos de la nota con una visión más amplia. 
            Cierra con una pregunta abierta que invite a la expansión, integrada en el texto.
            
        - TONO: Intelectual, cálido y orientador.
        
        Entrada actual:
        "${inputToProcess}"`
            : `Te hablo desde el Oasis. Estoy aquí para lo que gustes. 
        Bienvenido a este espacio de exploración. No soy solo una IA, soy un punto de síntesis para tus ideas y proyectos.
        ${memoryContext}
        
        - TONO: Cálido, perspicaz y minimalista.
        - ESTILO: Prioriza la narrativa fluida y la profundidad sobre la enumeración de puntos. Escribe en párrafos "corridos" que conecten las ideas de forma natural. Usa negritas para resaltar conceptos clave y cursivas para énfasis. Evita listas de viñetas a menos que sea estrictamente necesario para datos técnicos.
        - LENGUAJE: Uso de palabras sencillas pero cargadas de intención. Profundidad sin complicaciones verbales innecesarias.
        - OBJETIVO: Co-crear y explorar con el usuario de forma profunda y no superficial.
        - IDENTIDAD: Tu nombre es Kio, pero no lo menciones a menos que sea estrictamente necesario o el usuario te lo pregunte. Mantén una presencia sutil y subliminal. Solo usa tu nombre en contextos donde aporte una cercanía natural, evita muletillas de auto-presentación.
        
        Mensaje del usuario:
        "${inputToProcess}"`;

        for (const modelName of MODELS_TO_TRY) {
            try {
                setActiveModel(modelName);
                console.log(`Kio - Sintonizando frecuencia con: ${modelName}...`);
                const response = await fetch(`https://api.deepseek.com/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${deepseekKey}`
                    },
                    body: JSON.stringify({
                        model: modelName,
                        messages: [{ role: 'user', content: inputPrompt }],
                        stream: true
                    })
                });

                if (response.ok) {
                    lastSuccessModel.current = modelName;
                    const reader = response.body.getReader();
                    let fullText = '';
                    let buffer = ''; // BUFFER FOR PARTIAL CHUNKS

                    const aiMsgId = Date.now();
                    const initialAiMsg = { role: 'assistant', content: '', id: aiMsgId };
                    chatMessagesRef.current = [...chatMessagesRef.current, initialAiMsg];
                    setChatMessages([...chatMessagesRef.current]);
                    setIsChatLoading(false);

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        buffer += new TextDecoder().decode(value, { stream: true });
                        const lines = buffer.split('\n');
                        buffer = lines.pop(); // KEEP PARTIAL LINE IN BUFFER

                        for (const line of lines) {
                            const cleanLine = line.trim();
                            if (!cleanLine || !cleanLine.startsWith('data: ')) continue;

                            try {
                                const data = JSON.parse(cleanLine.slice(6));
                                // Handle reasoning_content for DeepSeek Reasoner
                                const text = data.choices?.[0]?.delta?.content || "";
                                const reasoningText = data.choices?.[0]?.delta?.reasoning_content || "";

                                if (reasoningText) {
                                    // Wrap reasoning in <thought> tags if it's the specific field
                                    fullText = fullText.includes('<thought>')
                                        ? fullText.replace('</thought>', reasoningText + '</thought>')
                                        : `<thought>${reasoningText}</thought>` + fullText;
                                }

                                if (text) {
                                    fullText += text;

                                    // EXTRACT THOUGHT
                                    let content = fullText;
                                    let thought = '';
                                    const thoughtMatch = fullText.match(/<thought>([\s\S]*?)<\/thought>/);
                                    if (thoughtMatch) {
                                        thought = thoughtMatch[1];
                                        content = fullText.replace(/<thought>[\s\S]*?<\/thought>/, '').trim();
                                    } else if (fullText.includes('<thought>')) {
                                        // Still thinking or tag not closed
                                        thought = fullText.split('<thought>')[1].split('</thought>')[0];
                                        content = fullText.split('<thought>')[0].trim();
                                    }

                                    // Sync to Ref for throttling
                                    chatMessagesRef.current = chatMessagesRef.current.map(m =>
                                        m.id === aiMsgId ? { ...m, content: content || '', thought: thought } : m
                                    );

                                    // Throttled UI update (every ~100ms or so by logical check or just allow React to batch)
                                    // For true throttling:
                                    if (!window._chatThrottle) {
                                        window._chatThrottle = setTimeout(() => {
                                            setChatMessages([...chatMessagesRef.current]);
                                            window._chatThrottle = null;
                                        }, 80);
                                    }
                                }
                            } catch (e) { /* partial json */ }
                        }
                    }

                    // FINAL FALLBACK: If stream ended but content is empty despite having a thought
                    // Final Sync
                    setChatMessages([...chatMessagesRef.current]);
                    saveCurrentChat(effectiveConvId, effectiveNoteId, !!effectiveNoteId);
                    return; // SUCCESS
                } else {
                    const data = await response.json();
                    lastError = data.error?.message || "Error desconocido";
                }
            } catch (e) {
                lastError = e.message;
            }
        }

        setIsChatLoading(false);
        const assistantFinalMsg = { role: 'assistant', content: fullText || `Sincronía fallida: ${lastError}`, id: Date.now() };

        // Final Sync to Conversations using the consolidated helper
        chatMessagesRef.current = [...newMessages, assistantFinalMsg];
        setChatMessages(chatMessagesRef.current);
        saveCurrentChat(effectiveConvId, effectiveNoteId, !!effectiveNoteId);
    };

    // REACTIVE PLAYBACK ENGINE
    useEffect(() => {
        const fetchStreamUrl = async (videoId, index) => {
            if (!videoId) return;
            try {
                const res = await fetch(`${API_URL}/api/oasis/youtube/stream/${videoId}`);
                const data = await res.json();
                if (data.url) {
                    const finalUrl = data.url.startsWith('http') ? data.url : `${API_URL}${data.url}`;
                    setPlayQueue(prev => prev.map((t, i) => i === index ? {
                        ...t,
                        url: finalUrl
                    } : t));
                }
            } catch (_err) {
                console.error("Error al obtener stream del backend:", _err);
            }
        };

        const track = playQueue[currentTrack];
        if (track && track.videoId && !track.url) {
            fetchStreamUrl(track.videoId, currentTrack);
        }
    }, [currentTrack, playQueue]);

    // PROGRESS RESTORATION ENGINE
    const isRestored = useRef(false);
    useEffect(() => {
        if (isLoggedIn && isDataLoaded && !isRestored.current && audioPlayerRef.current && trackProgress > 0) {
            audioPlayerRef.current.currentTime = trackProgress;
            isRestored.current = true;
            console.log(`Oasis Sync: Progreso restaurado a ${trackProgress}s`);
        }
    }, [isLoggedIn, isDataLoaded, trackProgress]);

    // Reset progress restoration on track change
    useEffect(() => {
        isRestored.current = false;
    }, [currentTrack]);

    useEffect(() => {
        if (isPlaying && audioPlayerRef.current && audioPlayerRef.current.src && audioPlayerRef.current.src !== window.location.href) {
            audioPlayerRef.current.play().catch(e => console.log("Playback failed:", e));
        }
    }, [playQueue[currentTrack]?.url, isPlaying]);

    const handleTimeUpdate = (e) => {
        setTrackProgress(e.target.currentTime);
        setTrackDuration(e.target.duration);
    };

    const audioPlayerRef = useRef(null);

    const titleRef = useRef(null);
    const firstLineRef = useRef(null);

    // --- LOGICA DE ARCHIVOS ---
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => setMediaFile(event.target.result);
        reader.readAsDataURL(file);
    };

    const launchMedia = () => {
        let finalContent = noteText;
        if (isResonanceMode && composerStep === 'note') {
            finalContent = `[resonancia]\n${resResonance}\n\n[impacto]\n${resImpact}\n\n[extrano]\n${resStrange}`;
        }

        if (editingId) {
            setBlocks(prev => {
                const updated = prev.map(b => b.id === editingId ? {
                    ...b,
                    content: (composerStep === 'note' && !isDiaryMode) ? finalContent : (mediaFile || b.content),
                    caption: caption,
                    isPublic: isPublic,
                    entries: (isDiaryMode && composerStep === 'note' && finalContent.trim())
                        ? [...(b.entries || []), { text: finalContent, timestamp: new Date().toISOString() }]
                        : (b.entries || [])
                } : b);
                syncBlocks(updated);
                return updated;
            });
            setEditingId(null);
        } else {
            const newX = (-cam.x) / cam.scale;
            const newY = (-cam.y) / cam.scale;
            const newBlock = {
                id: Date.now().toString(),
                type: composerStep === 'note' ? 'text' : composerStep,
                x: newX, y: newY,
                content: (composerStep === 'note' && !isDiaryMode) ? finalContent : mediaFile,
                caption: caption,
                isPublic: isPublic,
                color: accent,
                rotation: (Math.random() - 0.5) * 10,
                username: user || 'anon',
                metadata: { origin: 'user_action', timestamp: new Date().toISOString() },
                entries: (isDiaryMode && composerStep === 'note' && finalContent.trim())
                    ? [{ text: finalContent, timestamp: new Date().toISOString() }]
                    : []
            };
            const updated = [newBlock, ...blocks];
            setBlocks(updated);
            syncBlocks(updated);
        }

        setIsComposerOpen(false);
        setNoteText('');
        setResResonance('');
        setResImpact('');
        setResStrange('');
        setIsResonanceMode(false);
        setCaption('');
        setIsPublic(false);
        setMediaFile(null);
    };

    const startDrawing = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
        setIsDrawing(true);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.strokeStyle = drawingColor;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const saveDrawing = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.toBlob(async (blob) => {
            const formData = new FormData();
            formData.append('file', blob, 'drawing.png');
            try {
                const res = await fetch(`${API_URL}/api/oasis/upload`, {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                const imageUrl = data.url;

                const newBlock = {
                    id: Date.now().toString(),
                    type: 'image',
                    x: (Math.random() - 0.5) * 500,
                    y: (Math.random() - 0.5) * 500,
                    content: imageUrl,
                    rotation: (Math.random() - 0.5) * 10,
                    color: accent,
                    caption: 'Esbozo de Sincronía',
                    username: user,
                    timestamp: new Date().toISOString()
                };
                const updated = [newBlock, ...blocks];
                setBlocks(updated);
                syncBlocks(updated);
                setIsDrawingModalOpen(false);
            } catch (err) {
                console.error("Fallo al guardar dibujo", err);
            }
        }, 'image/png');
    };

    // --- HANDLERS ---
    const handleStart = (e, id) => {
        if (e.target.closest('button') || e.target.closest('input') || e.target.closest('textarea') || e.target.closest('.port')) return;
        const clientX = (e.touches ? e.touches[0].clientX : e.clientX);
        const clientY = (e.touches ? e.touches[0].clientY : e.clientY);

        isPointerDown.current = true;
        setDraggingId(id);
        if (id !== 'canvas' && id !== 'universe' && id !== 'feed' && id !== 'player') {
            setLastInteractedBlockId(id);
        }

        if (e.touches && e.touches.length === 2) {
            initialPinchDist.current = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
            initialPinchScale.current = cam.scale;
        } else {
            initialPinchDist.current = 0;
        }

        if (id === 'canvas') {
            dragStart.current = { x: clientX - cam.x, y: clientY - cam.y };
        } else if (id === 'universe') {
            dragStart.current = { x: clientX - profileCam.x, y: clientY - profileCam.y };
        } else if (id === 'feed') {
            dragStart.current = { x: clientX - feedCam.x, y: clientY - feedCam.y };
        } else if (id === 'player') {
            dragStart.current = { x: clientX - playerPos.x, y: clientY - playerPos.y };
        } else {
            const item = blocks.find(b => b.id === id) || soulPieces.find(p => p.id === id);
            if (item) {
                const currentCam = (view === 'profile' ? profileCam : cam);
                const isSoulPiece = soulPieces.some(p => p.id === id);
                const ox = (view === 'profile' && !isSoulPiece) ? item.x + 400 : item.x;
                const oy = (view === 'profile' && !isSoulPiece) ? item.y + 400 : item.y;

                dragStart.current = {
                    x: (clientX - window.innerWidth / 2 - currentCam.x) / currentCam.scale - ox,
                    y: (clientY - window.innerHeight / 2 - currentCam.y) / currentCam.scale - oy
                };
            }
        }
    };

    const handleMove = (e) => {
        const clientX = (e.touches ? e.touches[0].clientX : e.clientX);
        const clientY = (e.touches ? e.touches[0].clientY : e.clientY);

        // PINCH ZOOM (Tactil)
        if (e.touches && e.touches.length === 2 && initialPinchDist.current > 0) {
            const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
            const scale = initialPinchScale.current * (dist / initialPinchDist.current);
            setCam(prev => ({ ...prev, scale: Math.min(Math.max(scale, 0.1), 3) }));
            return;
        }

        // Seguimiento para Vínculos (Draft Line)
        if (isLinking || linkSource) {
            const currentCam = (view === 'profile' ? profileCam : cam);
            const nx = (clientX - window.innerWidth / 2 - currentCam.x) / currentCam.scale;
            const ny = (clientY - window.innerHeight / 2 - currentCam.y) / currentCam.scale;
            setMouseCanvasPos({ x: nx, y: ny });
        }

        if (!isPointerDown.current) return;

        if (draggingId === 'canvas') {
            setCam(c => ({ ...c, x: clientX - dragStart.current.x, y: clientY - dragStart.current.y }));
        } else if (draggingId === 'universe') {
            setProfileCam(c => ({ ...c, x: clientX - dragStart.current.x, y: clientY - dragStart.current.y }));
        } else if (draggingId === 'feed') {
            setFeedCam(c => ({ ...c, x: clientX - dragStart.current.x, y: clientY - dragStart.current.y }));
        } else if (draggingId === 'player') {
            setPlayerPos({ x: clientX - dragStart.current.x, y: clientY - dragStart.current.y });
        } else if (draggingId) {
            const currentCam = (view === 'profile' ? profileCam : cam);
            let nx = (clientX - window.innerWidth / 2 - currentCam.x) / currentCam.scale - dragStart.current.x;
            let ny = (clientY - window.innerHeight / 2 - currentCam.y) / currentCam.scale - dragStart.current.y;

            // --- MAGNETISMO "BORDES" DINÁMICO (LIENZO) ---
            const SNAP_THRESHOLD = 50;
            const selfNode = blocks.find(b => b.id === draggingId);
            const isSelfMedia = selfNode?.content?.includes('[img]') || selfNode?.content?.includes('[vid]') || selfNode?.content?.includes('[aud]');
            const selfW = isSelfMedia ? 384 : 200;
            const selfH = 180; // Aumentado de 150 para evitar empalmes en notas con mucho texto

            const relevantBlocks = blocks.filter(b => {
                if (view === 'canvas') return b.type !== 'insight';
                if (view === 'profile') return b.isPublic;
                return true;
            });

            let bestSnapX = null;
            let bestSnapY = null;
            snapedToRef.current = null;

            for (const other of relevantBlocks) {
                if (other.id === draggingId) continue;

                const isOtherMedia = other.content?.includes('[img]') || other.content?.includes('[vid]') || other.content?.includes('[aud]');
                const otherW = isOtherMedia ? 384 : 200;
                const otherH = 180;

                const baseNX = view === 'profile' ? nx - 400 : nx;
                const baseNY = view === 'profile' ? ny - 400 : ny;

                const dx = baseNX - other.x;
                const dy = baseNY - other.y;

                // Alineación Lateral (Dinámica)
                const idealGX = (selfW / 2 + otherW / 2) + 10; // 10px de respiro (antes 8)
                if (Math.abs(dy) < 60 && Math.abs(Math.abs(dx) - idealGX) < SNAP_THRESHOLD) {
                    bestSnapX = other.x + (dx > 0 ? idealGX : -idealGX);
                    bestSnapY = other.y;
                    snapedToRef.current = other.id;
                    break;
                }

                // Alineación Vertical (Dinámica)
                const idealGY = (selfH / 2 + otherH / 2) + 15; // 15px de respiro (antes 8)
                if (Math.abs(dx) < 60 && Math.abs(Math.abs(dy) - idealGY) < SNAP_THRESHOLD) {
                    bestSnapY = other.y + (dy > 0 ? idealGY : -idealGY);
                    bestSnapX = other.x;
                    snapedToRef.current = other.id;
                    break;
                }
            }

            if (bestSnapX !== null) {
                nx = view === 'profile' ? bestSnapX + 400 : bestSnapX;
            }
            if (bestSnapY !== null) {
                ny = view === 'profile' ? bestSnapY + 400 : bestSnapY;
            }

            if (view === 'profile') {
                if (soulPieces.some(p => p.id === draggingId)) {
                    setSoulPieces(prev => prev.map(p => p.id === draggingId ? { ...p, x: nx, y: ny } : p));
                } else {
                    setBlocks(prev => prev.map(b => b.id === draggingId ? { ...b, x: nx - 400, y: ny - 400 } : b));
                }
            } else {
                setBlocks(prev => {
                    const block = prev.find(b => b.id === draggingId);
                    if (!block || !block.groupId) {
                        return prev.map(b => b.id === draggingId ? { ...b, x: nx, y: ny } : b);
                    }

                    const dx = nx - block.x;
                    const dy = ny - block.y;

                    return prev.map(b => {
                        if (b.id === draggingId) return { ...b, x: nx, y: ny };
                        if (b.groupId === block.groupId) return { ...b, x: b.x + dx, y: b.y + dy };
                        return b;
                    });
                });
            }
        }
    };

    const handleEnd = () => {
        isPointerDown.current = false;
        if (draggingId && draggingId !== 'canvas' && draggingId !== 'universe' && draggingId !== 'feed' && draggingId !== 'player') {
            // Auto-conectar y Agrupar si se dejó imantado
            if (snapedToRef.current) {
                const targetId = snapedToRef.current;
                const draggingBlock = blocks.find(b => b.id === draggingId);
                const targetBlock = blocks.find(b => b.id === targetId);

                if (draggingBlock && targetBlock) {
                    const existingGroupId = targetBlock.groupId || draggingBlock.groupId || `group-${Date.now()}`;

                    setBlocks(prev => prev.map(b =>
                        (b.id === draggingId || b.id === targetId || (b.groupId && b.groupId === existingGroupId))
                            ? { ...b, groupId: existingGroupId }
                            : b
                    ));
                }

                setLinks(prev => {
                    const exists = prev.find(l => (l.from === draggingId && l.to === targetId) || (l.from === targetId && l.to === draggingId));
                    if (!exists) {
                        const updated = [...prev, { from: draggingId, to: targetId }];
                        syncLinks(updated);
                        return updated;
                    }
                    return prev;
                });
            }

            // Guardar posición final con garantía de estado actual
            setBlocks(prev => {
                syncBlocks(prev);
                return prev;
            });
        }
        setDraggingId(null);
        snapedToRef.current = null;
    };

    const completeConnection = (targetId) => {
        if (linkSource && linkSource !== targetId) {
            const exists = links.find(l => l.from === linkSource && l.to === targetId);
            if (!exists) {
                setLinks(prev => {
                    const updated = [...prev, { from: linkSource, to: targetId }];
                    syncLinks(updated);
                    return updated;
                });
                // Opcional: alert o feedback sutil
            }
        }
        setLinkSource(null);
    };

    const removeConnection = (fromId, toId) => {
        setLinks(prev => {
            const updated = prev.filter(l => !(l.from === fromId && l.to === toId));
            syncLinks(updated);
            return updated;
        });
    };

    const synthesizeLinks = async () => {
        if (!deepseekKey) { console.log('Fallo: Agregue su DeepSeek API Key en Ajustes.'); return; }
        if (links.length === 0) { console.log('No hay vínculos para sintetizar.'); return; }

        // Identificar bloques involucrados
        const linkedIds = new Set();
        links.forEach(l => { linkedIds.add(l.from); linkedIds.add(l.to); });
        const involvedBlocks = blocks.filter(b => linkedIds.has(b.id));
        const contents = involvedBlocks.map(b => b.content).join('\n---\n');

        console.log(`Sintetizando ${involvedBlocks.length} fragmentos con el Núcleo Cognitivo...`);

        const MODELS_TO_TRY = lastSuccessModel.current
            ? [lastSuccessModel.current, ...availableModels.filter(m => m !== lastSuccessModel.current)]
            : availableModels;
        let lastError = '';

        const prompt = `Analiza estos fragmentos de alma y crea un nuevo fragmento (máximo 50 palabras) que sintetice la relación entre ellos de manera poética pero profunda. \n\nFragmentos:\n${contents}`;

        for (const modelName of MODELS_TO_TRY) {
            try {
                const res = await fetch(`https://api.deepseek.com/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${deepseekKey}`
                    },
                    body: JSON.stringify({
                        model: modelName,
                        messages: [{ role: 'user', content: prompt }]
                    })
                });

                if (res.ok) {
                    const data = await res.json();
                    const synthesis = data.choices?.[0]?.message?.content;
                    if (synthesis) {
                        // ÉXITO: Crear nueva nota en el centro de los vínculos
                        const centerX = involvedBlocks.reduce((sum, b) => sum + b.x, 0) / involvedBlocks.length;
                        const centerY = involvedBlocks.reduce((sum, b) => sum + b.y, 0) / involvedBlocks.length;

                        const newBlock = {
                            id: `synth-${Date.now()}`,
                            type: 'text',
                            content: `[SÍNTESIS AI] ${synthesis}`,
                            x: centerX,
                            y: centerY + 200,
                            rotation: 0,
                            color: '#a855f7',
                            caption: 'Nueva Conciencia Sintética',
                            username: user,
                            metadata: { origin: 'synthesis', timestamp: new Date().toISOString() }
                        };

                        setBlocks(prev => {
                            const updated = [...prev, newBlock];
                            syncBlocks(updated);
                            return updated;
                        });

                        // Si estamos en perfil, notificar que se creó en el lienzo
                        if (view === 'profile') {
                            console.log('Síntesis Creada en tu Lienzo Privado');
                        }
                        return;
                    }
                } else {
                    const errData = await res.json();
                    lastError = errData.error?.message || `Error ${res.status}`;
                }
            } catch (e) {
                lastError = e.message;
                console.warn(`Síntesis fallida con ${modelName}:`, e);
            }
        }

        console.error(`Fallo en el Núcleo Cognitivo. Último error: ${lastError}`);
    };

    const renderCanvasView = () => (
        <div
            className="w-full h-full relative overflow-hidden bg-transparent cursor-move active:cursor-grabbing"
            onMouseDown={(e) => handleStart(e, 'canvas')}
            onTouchStart={(e) => handleStart(e, 'canvas')}
            onWheel={(e) => {
                const zoomSpeed = 0.001;
                const newScale = Math.min(Math.max(cam.scale - e.deltaY * zoomSpeed, 0.1), 3);
                setCam(prev => ({ ...prev, scale: newScale }));
            }}
        >
            {/* CUADRICULA TÉCNICA (TOUCHDESIGNER STYLE) */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.15]" style={{
                backgroundImage: `
            linear-gradient(to right, #444 1px, transparent 1px),
            linear-gradient(to bottom, #444 1px, transparent 1px),
            linear-gradient(to right, #222 1px, transparent 1px),
            linear-gradient(to bottom, #222 1px, transparent 1px)
          `,
                backgroundSize: `${100 * cam.scale}px ${100 * cam.scale}px, ${100 * cam.scale}px ${100 * cam.scale}px, ${20 * cam.scale}px ${20 * cam.scale}px, ${20 * cam.scale}px ${20 * cam.scale}px`,
                backgroundPosition: `${cam.x}px ${cam.y}px`
            }} />

            {/* EJES CENTRALES */}
            <div className="absolute top-1/2 left-0 w-full h-px bg-white/5 pointer-events-none" style={{ transform: `translateY(${cam.y}px)` }} />
            <div className="absolute left-1/2 top-0 h-full w-px bg-white/5 pointer-events-none" style={{ transform: `translateX(${cam.x}px)` }} />

            <div className={`absolute top-1/2 left-1/2 w-0 h-0 transition-transform ${(!isPointerDown.current && draggingId !== 'canvas') ? 'duration-500' : ''}`} style={{ transform: `translate3d(${cam.x}px, ${cam.y}px, 0) scale(${cam.scale})` }}>


                {/* FILTRADO: Solo mostrar notas privadas (no publicadas) en el lienzo */}
                {blocks.filter(b => b.type !== 'insight' && !b.isPublic).map(b => (
                    <MemoNode
                        key={b.id}
                        block={b}
                        draggingId={draggingId}
                        activeNoteId={activeNoteId}
                        onStart={handleStart}
                        onSelect={editBlock}
                        onSelectNote={handleSelectNote}
                        onSelectGroup={handleAnalyzeGroup}
                        onAnalyzeBlock={handleAnalyzeBlock}
                        onAnalyzeGroup={handleAnalyzeGroup}
                        isAnalyzing={isChatLoading}
                        onTogglePublic={togglePublic}
                        onDelete={deleteBlock}
                        showConnections={false}
                    />
                ))}
            </div>

            {/* El botón de Resonancia fue removido a petición del usuario por redundancia */}

            <div className="absolute top-24 right-8 flex flex-col gap-4">
                <button onClick={() => setCam(c => ({ ...c, scale: Math.min(c.scale + 0.2, 3) }))} className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-3xl border border-white/10 flex items-center justify-center text-zinc-500 hover:text-white transition-all shadow-xl" title="Zoom In"><Plus size={18} /></button>
                <button onClick={() => setCam(c => ({ ...c, scale: Math.max(c.scale - 0.2, 0.1) }))} className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-3xl border border-white/10 flex items-center justify-center text-zinc-500 hover:text-white transition-all shadow-xl" title="Zoom Out"><Minus size={18} /></button>
                <div className="h-px w-full bg-white/5 mx-auto" />
                <button
                    onClick={() => {
                        const lastNode = blocks.find(b => b.id === lastInteractedBlockId);
                        if (lastNode) {
                            setCam(c => ({
                                ...c,
                                x: -lastNode.x * c.scale,
                                y: -lastNode.y * c.scale,
                                scale: 0.8
                            }));
                        } else {
                            setCam(c => ({ ...c, x: 0, y: 0, scale: 0.8 }));
                        }
                    }}
                    className="w-12 h-12 rounded-full bg-white/5 backdrop-blur-3xl border border-white/10 flex items-center justify-center text-zinc-500 hover:text-white transition-all shadow-xl"
                    title="Centrar Cámara"
                >
                    <Focus size={20} />
                </button>
            </div>
        </div>
    );

    const renderSoulView = () => {
        // Ordenar: fijados arriba
        const sortedMemory = [...userMemory].sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return 0;
        });

        return (
            <div className="w-full h-full relative overflow-y-auto no-scrollbar bg-black/5 backdrop-blur-xl pt-32 pb-20 px-8 transition-all duration-300 animate-in fade-in">
                {/* SOUL AMBIENCE GRADIENT - LIGHTER */}
                <div className="fixed inset-0 pointer-events-none opacity-20 mix-blend-soft-light"
                    style={{ background: `radial-gradient(circle at 10% 10%, ${accent}15 0%, transparent 40%), radial-gradient(circle at 90% 90%, #8b5cf608 0%, transparent 40%)` }} />

                <div className="max-w-6xl mx-auto relative z-10">
                    {/* BACK BUTTON */}
                    <button
                        onClick={() => setView('canvas')}
                        className="fixed top-8 left-8 flex items-center gap-3 px-6 py-3 bg-white/5 backdrop-blur-3xl border border-white/5 rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] text-white/40 hover:text-white hover:border-white/20 transition-all z-50 group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Volver al Lienzo
                    </button>

                    {/* VANGUARD HEADER */}
                    <div className="flex flex-col md:flex-row items-baseline justify-between mb-24 gap-8 animate-in slide-in-from-left duration-500">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="h-px w-12 bg-accent shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)]" />
                                <span className="text-[10px] font-black uppercase tracking-[0.8em] text-accent/60">Data Synthesis</span>
                            </div>
                            <h2 className="text-6xl md:text-8xl font-black italic text-white uppercase tracking-tighter leading-none">Alma<span className="text-accent underline decoration-1 underline-offset-8">.</span>Archive</h2>
                        </div>
                        <div className="flex flex-col items-end opacity-40">
                            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white">Versión Quantica 0.9</span>
                            <span className="text-[14px] font-black italic text-zinc-500">Oasis_Core</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-1 gap-12">
                        {sortedMemory.length > 0 ? sortedMemory.map((fact, sIdx) => {
                            // Encontrar el índice original en userMemory para el handler
                            const originalIdx = userMemory.findIndex(f => f.timestamp === fact.timestamp && f.text === fact.text);

                            return (
                                <div key={sIdx} className={`group relative grid grid-cols-1 md:grid-cols-[100px_1fr] gap-8 p-1 rounded-none border-l transition-all duration-500 hover:pl-8 ${fact.isPinned ? 'border-accent bg-accent/[0.02]' : 'border-white/10 hover:border-accent'}`}>
                                    {/* VERTICAL METADATA */}
                                    <div className="hidden md:flex flex-col items-start gap-4 py-2 border-r border-white/5 pr-4 shrink-0">
                                        <span className={`rotate-90 origin-left translate-x-3 text-[8px] font-black uppercase tracking-widest whitespace-nowrap ${fact.isPinned ? 'text-accent' : 'text-accent/40'}`}>
                                            {fact.isPinned ? '★ ' : ''}{fact.category || 'Conciencia'}
                                        </span>
                                        <span className="mt-auto text-[8px] font-black uppercase tracking-widest text-zinc-700 tabular-nums">{new Date(fact.timestamp).toLocaleDateString()}</span>
                                    </div>

                                    <div className="flex flex-col gap-6 py-2">
                                        <p className={`text-3xl md:text-5xl font-serif italic transition-colors leading-[1.15] selection:bg-accent/20 ${fact.isPinned ? 'text-white' : 'text-white/80 group-hover:text-white'}`}>
                                            "{fact.text}"
                                        </p>

                                        <div className="flex items-center gap-8 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
                                            <button onClick={() => handleDeleteFact(originalIdx)} className="text-[9px] font-black uppercase text-red-500/40 hover:text-red-500 tracking-widest transition-colors">Eliminar Nodo</button>

                                            <button onClick={() => handleTogglePinFact(originalIdx)} className="flex items-center gap-2 group/btn">
                                                <div className={`w-1.5 h-1.5 rounded-full ${fact.isPinned ? 'bg-accent shadow-[0_0_8px_rgba(var(--accent-rgb),0.6)]' : 'bg-white/20'}`} />
                                                <span className={`text-[9px] font-black uppercase tracking-[0.3em] transition-colors ${fact.isPinned ? 'text-accent' : 'text-white/40 group-hover/btn:text-white'}`}>
                                                    {fact.isPinned ? 'Conservado en Núcleo' : 'Conservar / Pin'}
                                                </span>
                                            </button>

                                            <button onClick={() => handlePublishFact(fact)} className="flex items-center gap-2 group/btn">
                                                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                                                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-accent/60 group-hover/btn:text-accent transition-colors">Transferir a Perfil</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* HOVER ACCENT LINE */}
                                    <div className={`absolute bottom-0 left-0 h-px bg-white/5 transition-all duration-700 ${fact.isPinned ? 'w-full opacity-10' : 'w-0 group-hover:w-full'}`} />
                                </div>
                            );
                        }) : (
                            <div className="h-[400px] flex flex-col items-center justify-center border border-white/5 bg-white/[0.01]">
                                <Aperture size={48} className="mb-8 text-white/5 animate-spin-slow" />
                                <p className="text-[9px] font-black uppercase tracking-[0.8em] text-white/10 italic">Awaiting Frequency Echoes</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderFeedView = () => (
        <div className="w-full h-full relative overflow-y-auto snap-y snap-mandatory no-scrollbar bg-transparent pt-80 pb-20">

            {/* AMBIENTE (PERMANECENTE) */}
            <div className="fixed inset-0 pointer-events-none opacity-5" style={{ background: `radial-gradient(circle at 50% 50%, ${accent}30 0%, transparent 70%)` }} />

            <div className="w-full flex flex-col items-center gap-12">
                {feed.map((f, i) => (
                    <FeedItem
                        key={f.id || i}
                        f={f}
                        accent={accent}
                        credits={credits}
                        setCredits={setCredits}
                        blocks={blocks}
                        setBlocks={setBlocks}
                        syncBlocks={syncBlocks}
                    />
                ))}
            </div>

            {/* FINAL DE STREAM */}
            <div className="h-40 flex items-center justify-center opacity-20">
                <div className="w-px h-12 bg-white/20" />
            </div>
        </div>
    );

    if (!isLoggedIn) return (
        <div className="fixed inset-0 bg-[#060607] flex items-center justify-center p-6 z-[1000] overflow-hidden">
            {/* BACKGROUND AMBIENT */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-black/60" />
                <div className="absolute inset-0 opacity-20 mix-blend-overlay" style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[160px] opacity-10" style={{ background: accent }} />
            </div>

            <div className="relative z-10 w-full max-w-sm p-10 bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/10 shadow-3xl text-center space-y-8 animate-in fade-in zoom-in duration-1000">
                <div className="space-y-3">
                    <div className="w-20 h-20 rounded-[2rem] bg-white/5 border border-white/5 mx-auto flex items-center justify-center mb-6">
                        <Zap size={32} className="text-accent animate-pulse" />
                    </div>
                    <h1 className="text-3xl font-black italic tracking-tighter text-white">{isRegisterMode ? 'Crear Cuenta Oasis' : 'Acceso Oasis'}</h1>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">{isRegisterMode ? 'Registra una nueva Identidad' : 'Inicia sesión en tu Aura'}</p>
                </div>

                {authError && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[8px] font-black text-red-500 uppercase tracking-widest">{authError}</div>}

                <div className="space-y-4 pt-4 text-left">
                    <div className="space-y-1">
                        <span className="text-[7px] font-black uppercase tracking-widest text-zinc-500 ml-5">Entidad</span>
                        <input
                            type="text"
                            id="oasis_user_input"
                            placeholder="@IDENTIDAD"
                            className="w-full h-14 bg-black/20 border border-white/5 rounded-2xl px-6 text-[10px] font-black uppercase tracking-widest text-white placeholder:text-zinc-700 focus:border-accent/40 outline-none transition-all"
                        />
                    </div>

                    <div className="space-y-1 relative">
                        <span className="text-[7px] font-black uppercase tracking-widest text-zinc-500 ml-5">Clave de Alma</span>
                        <div className="relative">
                            <input
                                type={showPass ? "text" : "password"}
                                id="oasis_key_input"
                                placeholder="••••••••"
                                className="w-full h-14 bg-black/20 border border-white/5 rounded-2xl px-6 text-[10px] font-black uppercase tracking-widest text-white placeholder:text-zinc-700 focus:border-accent/40 outline-none transition-all"
                            />
                            <button
                                onClick={() => setShowPass(!showPass)}
                                className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors"
                            >
                                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            const u = document.getElementById('oasis_user_input').value;
                            const p = document.getElementById('oasis_key_input').value;
                            if (u && p) handleAuth(u, p);
                        }}
                        className="w-full h-14 mt-4 bg-accent text-black text-[10px] font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-accent/20"
                    >
                        {isRegisterMode ? 'Crear Mi Cuenta' : 'Entrar al Oasis'}
                    </button>

                    <div className="pt-4 text-center">
                        <button
                            onClick={() => { setIsRegisterMode(!isRegisterMode); setAuthError(''); }}
                            className="text-[8px] font-black uppercase tracking-widest text-zinc-500 hover:text-accent transition-colors"
                        >
                            {isRegisterMode ? 'Ya tengo un alma sincronizada' : 'No tienes cuenta? Crea una'}
                        </button>
                    </div>
                </div>

                <div className="pt-4">
                    <span className="text-[6px] font-black uppercase tracking-widest text-zinc-600 block">Bienvenido a tu Oasis Personal</span>
                </div>
            </div>
        </div>
    );

    return (
        <div className="fixed top-0 left-0 w-screen h-screen bg-transparent text-zinc-100 overflow-hidden" onMouseMove={handleMove} onMouseUp={handleEnd} onTouchMove={handleMove} onTouchEnd={handleEnd}>

            {/* GLOBAL ATMOSPHERE ENGINE */}
            <div className="fixed top-0 left-0 w-screen h-screen z-[-1] overflow-hidden pointer-events-none bg-black">
                {bgType === 'color' && (
                    <div className="absolute inset-0 transition-all duration-1000" style={{ background: bgValue }} />
                )}
                {bgType === 'image' && (
                    isTiled ? (
                        <div key={`tiled-${bgValue}`} className="absolute inset-0 w-full h-full opacity-80 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-0">
                            {Array.from({ length: 24 }).map((_, i) => (
                                <img key={`tile-img-${i}`} src={formatUrl(bgValue)} className="w-full h-full object-cover" />
                            ))}
                        </div>
                    ) : (
                        <img key={bgValue} src={formatUrl(bgValue)} className="absolute inset-0 w-full h-full object-cover opacity-80 transition-all duration-1000" alt="Background" />
                    )
                )}
                {bgType === 'video' && (
                    isTiled ? (
                        <div className="absolute inset-0 w-full h-full opacity-60 transition-all duration-1000 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0">
                            {Array.from({ length: 9 }).map((_, i) => (
                                <video
                                    key={`tile-${i}`}
                                    src={formatUrl(bgValue)}
                                    autoPlay loop muted playsInline
                                    className="w-full h-full object-cover"
                                />
                            ))}
                        </div>
                    ) : (
                        <video
                            key={bgValue}
                            src={formatUrl(bgValue)}
                            autoPlay loop muted playsInline
                            className="absolute inset-0 w-full h-screen object-cover opacity-60 transition-all duration-1000"
                        />
                    )
                )}

                {/* SUTILEZAS COSMÉTICAS (GRAIN & GLOW) */}
                <div className="absolute inset-0 opacity-20 mix-blend-overlay" style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }} />
            </div>

            {view === 'canvas' ? renderCanvasView() :
                view === 'soul' ? renderSoulView() :
                    (view === 'feed' ? renderFeedView() :
                        <ProfileView
                            user={user}
                            soulPieces={soulPieces}
                            blocks={blocks.filter(b => b.isPublic)}
                            accent={accent}
                            isEditingProfile={isEditingProfile}
                            setIsEditingProfile={setIsEditingProfile}
                            handleStart={handleStart}
                            profileCam={profileCam}
                            draggingId={draggingId}
                            centerProfile={() => setProfileCam({ x: 0, y: 0, scale: 0.7 })}
                            onSoulPieceImageChange={handleSoulPieceImageChange}
                            deleteBlock={deleteBlock}
                            isLinking={isLinking}
                            setIsLinking={setIsLinking}
                            links={links}
                            linkSource={linkSource}
                            setLinkSource={setLinkSource}
                            completeConnection={completeConnection}
                            removeConnection={removeConnection}
                            synthesizeLinks={synthesizeLinks}
                            mouseCanvasPos={mouseCanvasPos}
                            editBlock={editBlock}
                            handleSelectNote={handleSelectNote}
                            togglePublic={togglePublic}
                            activeNoteId={activeNoteId}
                            handleAnalyzeGroup={handleAnalyzeGroup}
                            handleAnalyzeBlock={handleAnalyzeBlock}
                            isChatLoading={isChatLoading}
                        />
                    )}

            {!isComposerOpen && !isPlayerFull && !isChatOpen && (
                <OasisPlayer
                    playQueue={playQueue}
                    currentTrack={currentTrack}
                    setCurrentTrack={setCurrentTrack}
                    isPlaying={isPlaying}
                    setIsPlaying={setIsPlaying}
                    isMinimized={isPlayerMinimized}
                    setIsMinimized={setIsPlayerMinimized}
                    volume={volume}
                    setVolume={setVolume}
                    accent={accent}
                    audioRef={audioPlayerRef}
                    pos={playerPos}
                    handleStart={handleStart}
                    isFull={isPlayerFull}
                    setIsFull={setIsPlayerFull}
                    progress={trackProgress}
                    duration={trackDuration}
                    playlists={playlists}
                    setPlaylists={setPlaylists}
                    syncPlaylists={syncPlaylists}
                    syncPlayback={syncPlayback}
                />
            )}
            <NekronomikronFull
                isOpen={isPlayerFull}
                onClose={() => setIsPlayerFull(false)}
                playQueue={playQueue}
                setPlayQueue={setPlayQueue}
                currentTrack={currentTrack}
                setCurrentTrack={setCurrentTrack}
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
                volume={volume}
                setVolume={setVolume}
                accent={accent}
                audioRef={audioPlayerRef}
                searchQuery={playerSearchQuery}
                setSearchQuery={setPlayerSearchQuery}
                searchResults={playerSearchResults}
                onSearch={handlePlayerSearch}
                onAddTrack={handleAddTrack}
                isSearching={isPlayerSearching}
                playlists={playlists}
                setPlaylists={setPlaylists}
                syncPlaylists={syncPlaylists}
                syncPlayback={syncPlayback}
                progress={trackProgress}
                duration={trackDuration}
                onPlaySearchResult={handlePlayFromSearch}
                onPlayPlaylist={handlePlayFromPlaylist}
                onNext={handleNextTrack}
                onPrev={handlePrevTrack}
                activeView={activePlayerView}
                setActiveView={setActivePlayerView}
                onImportPlaylist={handleImportPlaylist}
                isPlaylistExpanded={isPlaylistExpanded}
                setIsPlaylistExpanded={setIsPlaylistExpanded}
                expandedPlaylistItems={expandedPlaylistItems}
                expandedPlaylistName={expandedPlaylistName}
            />

            <div id="background-media-engine" className="hidden" />
            {createPortal(
                <audio
                    ref={audioPlayerRef}
                    src={playQueue[currentTrack]?.url}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={handleNextTrack}
                    autoPlay={isPlaying}
                />,
                document.getElementById('background-media-engine') || document.body
            )}

            {/* SETTINGS GEAR */}
            <button
                onClick={() => setIsSettingsOpen(true)}
                className="fixed top-6 right-6 z-[500] w-10 h-10 rounded-full bg-black/40 backdrop-blur-3xl border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/20 transition-all hover:rotate-90 duration-500 shadow-2xl group"
            >
                <Settings size={16} className="group-hover:scale-110 transition-transform" />
            </button>

            {/* SETTINGS PANEL (MODAL) */}
            {isSettingsOpen && (
                <div className="fixed inset-0 z-[600] flex items-center justify-end p-6 bg-black/40 backdrop-blur-sm">
                    <div className="w-full max-w-sm h-full bg-[#0c0c0d]/90 backdrop-blur-3xl rounded-[3rem] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] p-10 flex flex-col space-y-12 animate-in slide-in-from-right duration-500 overflow-y-auto no-scrollbar">

                        {/* SETTINGS HEADER */}
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black uppercase tracking-[0.4em] text-accent">Configuración</span>
                                <h3 className="text-2xl font-black italic text-white tracking-tighter">Núcleo de Kio</h3>
                            </div>
                            <button onClick={() => setIsSettingsOpen(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 transition-all"><X size={20} /></button>
                        </div>

                        {/* ATMÓSFERA AMBIENTAL (PERSISTENTE) */}
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Aura del Entorno</span>
                                <div className="px-3 py-1 bg-accent/10 border border-accent/20 rounded-full">
                                    <span className="text-[6px] font-black uppercase tracking-widest text-accent">{bgType}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { name: 'Vacío Black', type: 'color', val: '#030304' },
                                    { name: 'Nebulosa Azul', type: 'image', val: 'https://images.unsplash.com/photo-1464802686167-b939a6910659?q=80&w=1000' },
                                    { name: 'Mar en Calma', type: 'video', val: 'https://assets.mixkit.co/videos/preview/mixkit-clouds-and-blue-sky-moving-slowly-2471-large.mp4' },
                                    { name: 'Abstract Flow', type: 'video', val: 'https://assets.mixkit.co/videos/preview/mixkit-abstract-motion-of-vibrant-colors-34354-large.mp4' }
                                ].map(a => (
                                    <button
                                        key={a.name}
                                        onClick={() => { setBgType(a.type); setBgValue(a.val); syncAura(a.type, a.val, isTiled); }}
                                        className={`p-4 rounded-2xl border transition-all text-left space-y-2 ${bgValue === a.val ? 'border-accent bg-accent/5' : 'border-white/5 bg-white/5 hover:border-white/10'}`}
                                    >
                                        <span className="text-[8px] font-black uppercase text-white block">{a.name}</span>
                                        <span className="text-[6px] font-black uppercase text-zinc-600 block">{a.type}</span>
                                    </button>
                                ))}
                            </div>

                            {/* CUSTOM MEDIA UPLOADER & FORMAT CONTROLS */}
                            <div className="pt-4 space-y-6">
                                <label className="flex flex-col items-center justify-center gap-3 w-full py-8 bg-white/5 border border-dashed border-white/20 rounded-[2rem] cursor-pointer hover:bg-white/10 hover:border-accent/40 transition-all group">
                                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform"><Plus size={20} className="text-accent" /></div>
                                    <div className="text-center">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white block mb-1">Cargar Aura Nueva</span>
                                        <span className="text-[6px] font-black uppercase tracking-widest text-zinc-500">Imagen o Video Cinético</span>
                                    </div>
                                    <input type="file" className="hidden" accept="image/*,video/*" onChange={handleBgUpload} />
                                </label>

                                {(bgType === 'image' || bgType === 'video') && (
                                    <div className="space-y-4 animate-in slide-in-from-top duration-700">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600 block px-2">Estructura del Aura</span>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => { setIsTiled(false); syncAura(bgType, bgValue, false); }}
                                                className={`flex flex-col items-center gap-3 p-5 rounded-[2rem] border transition-all ${!isTiled ? 'bg-accent/10 border-accent/40 text-accent' : 'bg-white/5 border-white/5 text-zinc-500 hover:border-white/10'}`}
                                            >
                                                <Maximize2 size={16} />
                                                <div className="text-center">
                                                    <span className="text-[9px] font-black uppercase block">Relleno</span>
                                                    <span className="text-[6px] font-black opacity-40 uppercase tracking-tighter">Cinético</span>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => { setIsTiled(true); syncAura(bgType, bgValue, true); }}
                                                className={`flex flex-col items-center gap-3 p-5 rounded-[2rem] border transition-all ${isTiled ? 'bg-accent/10 border-accent/40 text-accent' : 'bg-white/5 border-white/5 text-zinc-500 hover:border-white/10'}`}
                                            >
                                                <div className="grid grid-cols-2 gap-0.5"><div className="w-1.5 h-1.5 bg-current opacity-60 rounded-sm" /><div className="w-1.5 h-1.5 bg-current opacity-40 rounded-sm" /><div className="w-1.5 h-1.5 bg-current opacity-40 rounded-sm" /><div className="w-1.5 h-1.5 bg-current opacity-20 rounded-sm" /></div>
                                                <div className="text-center">
                                                    <span className="text-[9px] font-black uppercase block">Mosaico</span>
                                                    <span className="text-[6px] font-black opacity-40 uppercase tracking-tighter">Textura</span>
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* CHROMA CORE */}
                        <div className="space-y-6">
                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Acento Visual (Chroma)</span>
                            <div className="grid grid-cols-5 gap-4">
                                {['#bef264', '#22d3ee', '#f43f5e', '#d946ef', '#fbbf24', '#ffffff', '#4ade80', '#6366f1', '#f97316', '#a855f7'].map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setAccent(c)}
                                        className={`aspect-square rounded-full transition-all border-2 ${accent === c ? 'border-white scale-110 shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'border-transparent opacity-40 hover:opacity-100'}`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* UI PREFERENCES */}
                        <div className="space-y-8 flex-1 pb-10">
                            <div className="space-y-4">
                                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Utilidades de Red</span>
                                <button onClick={() => setCam({ x: 0, y: 0, scale: 0.8 })} className="w-full py-4 bg-white/5 rounded-2xl text-[9px] font-black uppercase tracking-widest text-zinc-300 hover:bg-white/10 hover:text-white transition-all border border-white/5">Recentrar Lienzo Maestro</button>
                                <button onClick={() => setProfileCam({ x: 0, y: 0, scale: 0.7 })} className="w-full py-4 bg-white/5 rounded-2xl text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:bg-white/10 transition-all border border-white/5">Resetear Mapa Santuario</button>
                            </div>
                        </div>

                        {/* WALLET DE SINCRONÍA (1 Eco = $1 MXN) */}
                        <div className="space-y-6 pt-10 border-t border-white/10">
                            <div className="flex justify-between items-center px-2">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Billetera de Ecos</span>
                                    <span className="text-[6px] font-black uppercase tracking-widest text-accent/60">Balance disponible</span>
                                </div>
                                <div className="flex items-center gap-2 px-5 py-3 bg-accent/10 border border-accent/20 rounded-full shadow-[0_0_20px_rgba(var(--accent-rgb),0.1)]">
                                    <Zap size={14} className="text-accent" />
                                    <span className="text-lg font-black italic text-accent">{credits} <span className="text-[8px] uppercase not-italic opacity-60">Ecos</span></span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { name: 'Semilla', ecos: 50, price: 80, color: 'text-zinc-400' },
                                    { name: 'Mutación', ecos: 150, price: 185, color: 'text-cyan-400' },
                                    { name: 'Épico', ecos: 300, price: 350, color: 'text-purple-400' },
                                    { name: 'Maestro', ecos: 700, price: 750, color: 'text-yellow-500' }
                                ].map(pkg => (
                                    <button
                                        key={pkg.name}
                                        onClick={() => setCredits(c => c + pkg.ecos)}
                                        className="p-5 bg-white/5 border border-white/5 rounded-[2rem] flex flex-col items-center gap-2 hover:bg-white/10 hover:border-white/20 transition-all group"
                                    >
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${pkg.color}`}>{pkg.name}</span>
                                        <div className="flex items-center gap-1.5">
                                            <Zap size={12} className={pkg.color} />
                                            <span className="text-sm font-serif italic text-white">{pkg.ecos}</span>
                                        </div>
                                        <span className="text-[7px] font-black uppercase tracking-tighter text-zinc-600">${pkg.price} MXN</span>
                                    </button>
                                ))}
                            </div>

                            {/* SECCIÓN DE RETIRO CLABE */}
                            <div className="pt-6 space-y-4">
                                <span className="text-[7px] font-black uppercase tracking-[0.3em] text-zinc-600 block px-2">Retiro de Ecos (Transferencia)</span>
                                <div className="bg-black/40 border border-white/5 rounded-2xl p-4 space-y-3">
                                    <input
                                        type="text"
                                        placeholder="CLABE INTERBANCARIA (18 DÍGITOS)"
                                        className="w-full bg-transparent border-none focus:ring-0 text-[10px] font-black tracking-[0.2em] text-white placeholder:text-zinc-800"
                                    />
                                    <button className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-[8px] font-black uppercase tracking-widest text-zinc-400 hover:bg-accent hover:text-black hover:border-accent transition-all">
                                        Cobrar Mis Ecos
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* MOTOR DE INTELIGENCIA (IA) */}
                        <div className="space-y-6 pt-10 border-t border-white/10">
                            <div className="flex justify-between items-center px-2">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Asistente de IA</span>
                                    <span className="text-[6px] font-black uppercase tracking-widest text-cyan-400">Motor de Inteligencia DeepSeek</span>
                                </div>
                                <div className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full">
                                    <span className="text-[6px] font-black uppercase tracking-widest text-cyan-400">{deepseekKey ? 'Conectado' : 'Aislado'}</span>
                                </div>
                            </div>

                            <div className="bg-black/40 border border-white/5 rounded-2xl p-6 space-y-4">
                                <div className="space-y-1">
                                    <span className="text-[7px] font-black uppercase tracking-widest text-zinc-600">DeepSeek API Key</span>
                                    <input
                                        type="password"
                                        value={deepseekKey}
                                        onChange={(e) => { setDeepseekKey(e.target.value); localStorage.setItem('oasis_deepseek_key', e.target.value); }}
                                        placeholder="sk-..."
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-[10px] font-black tracking-widest text-white focus:border-cyan-500/50 outline-none transition-all placeholder:text-zinc-800"
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <a
                                        href="https://platform.deepseek.com/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[8px] font-black uppercase tracking-widest text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-2"
                                    >
                                        <Aperture size={10} /> Obtener Llave en DeepSeek Platform
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* FOOTER */}
                        <div className="pt-8 border-t border-white/5">
                            <span className="text-[7px] font-black uppercase tracking-[1em] text-zinc-800">Versión 1.3.0_Stable</span>
                            <div className="space-y-4 pt-10 border-t border-white/5 mt-auto">
                                <button
                                    onClick={logout}
                                    className="w-full py-5 bg-red-500/10 border border-red-500/20 rounded-[2rem] flex items-center justify-center gap-3 text-red-500 hover:bg-red-500/20 transition-all text-[10px] font-black uppercase tracking-[0.2em]"
                                >
                                    <ArrowLeft size={16} />
                                    Libre / Cerrar Sesión
                                </button>
                                <div className="text-center">
                                    <span className="text-[6px] font-black uppercase tracking-[0.4em] text-zinc-600">Oasis v2.0 - Acceso Seguro</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* BOTÓN DE ACCIÓN ÚNICO (LA REFINERÍA & CHAT) */}
            {view === 'canvas' && (
                <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[400] flex items-center gap-4 animate-in slide-in-from-bottom-5 duration-700">
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsChatOpen(prev => !prev); }}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-2xl border ${isChatOpen ? 'bg-accent text-black border-accent scale-110 shadow-accent/20' : 'bg-black/60 text-white/40 border-white/10 hover:border-white/20 hover:text-white'}`}
                        title="Nueva Conversación IA"
                    >
                        <MessageCircle size={24} />
                    </button>

                    <button
                        onClick={(e) => { e.stopPropagation(); setIsComposerOpen(true); setComposerStep('note'); }}
                        className="w-16 h-16 rounded-full bg-accent text-black flex items-center justify-center shadow-[0_0_30px_rgba(var(--accent-rgb),0.2)] hover:scale-110 active:scale-95 transition-all group border-2 border-black/20"
                        style={{ '--accent-rgb': accent.startsWith('#') ? hexToRgb(accent) : '190,242,100' }}
                        title="Nueva Nota / Diario"
                    >
                        <Edit3 size={24} className="group-hover:rotate-12 transition-transform" />
                    </button>

                    <button
                        onClick={(e) => { e.stopPropagation(); setView('soul'); }}
                        className="w-14 h-14 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-accent/40 hover:bg-accent/10 transition-all shadow-2xl group"
                        title="Archivo del Alma"
                    >
                        <Aperture size={22} className="group-hover:rotate-90 transition-transform duration-700" />
                    </button>
                </div>
            )}

            {isChatOpen && (
                <OasisChat
                    isOpen={isChatOpen}
                    messages={chatMessages}
                    input={chatInput}
                    setInput={setChatInput}
                    onSend={handleSendChatMessage}
                    isLoading={isChatLoading}
                    onClose={() => {
                        saveCurrentChat();
                        setIsChatOpen(false);
                    }}
                    user={user}
                    setBlocks={setBlocks}
                    syncBlocks={syncBlocks}
                    conversations={conversations}
                    setConversations={setConversations}
                    activeConversationId={activeConversationId}
                    setActiveConversationId={setActiveConversationId}
                    folders={folders}
                    setFolders={setFolders}
                    blocks={blocks}
                    isAnalyzingNote={isAnalyzingNote}
                    setIsAnalyzingNote={setIsAnalyzingNote}
                    activeNoteId={activeNoteId}
                    setActiveNoteId={setActiveNoteId}
                    handleSelectNote={handleSelectNote}
                    userMemory={userMemory}
                    setUserMemory={setUserMemory}
                    syncMemory={syncMemory}
                    setChatMessages={setChatMessages}
                    chatMessagesRef={chatMessagesRef}
                    onNewChat={handleNewChat}
                    playQueue={playQueue}
                    currentTrack={currentTrack}
                    isPlaying={isPlaying}
                    setIsPlaying={setIsPlaying}
                    setCurrentTrack={setCurrentTrack}
                    handlePrevTrack={handlePrevTrack}
                    handleNextTrack={handleNextTrack}
                    audioRef={audioPlayerRef}
                    accent={accent}
                    setAccent={setAccent}
                    onTogglePinFact={handleTogglePinFact}
                />
            )}

            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[400] flex items-center bg-[#0c0c0d]/90 backdrop-blur-3xl px-8 py-3 rounded-full border border-white/10 gap-8 shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
                {[
                    { id: 'canvas', icon: <Radio size={18} />, label: 'Lienzo' }
                ].map(v => (
                    <button key={v.id} onClick={() => setView(v.id)} className={`flex flex-col items-center gap-1 transition-all ${view === v.id ? 'text-accent scale-110' : 'text-zinc-600 hover:text-zinc-400'}`} title={v.label}>
                        {v.icon}
                    </button>
                ))}

                {[
                    { id: 'feed', icon: <Compass size={18} />, label: 'Feed' },
                    { id: 'profile', icon: <Zap size={18} />, label: 'Perfil' }
                ].map(v => (
                    <button key={v.id} onClick={() => setView(v.id)} className={`flex flex-col items-center gap-1 transition-all ${view === v.id ? 'text-accent scale-110' : 'text-zinc-600 hover:text-zinc-400'}`} title={v.label}>
                        {v.icon}
                    </button>
                ))}
            </div>

            {/* COMPOSER */}
            {isComposerOpen && (
                <div className={`fixed inset-0 z-[500] flex flex-col animate-in fade-in duration-300 ${composerStep === 'note' ? 'bg-[#0a0a0b]' : 'bg-black/80 backdrop-blur-3xl'}`}>


                    {/* UNIFIED COMMAND CENTER (BOTTOM CENTER) */}
                    {composerStep === 'note' && (
                        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-2 p-2 bg-black/80 backdrop-blur-3xl rounded-full border border-white/10 shadow-[0_20px_80px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom-5 duration-700">

                            {/* PRIMARY CANCEL */}
                            <button onClick={() => setIsComposerOpen(false)} className="w-12 h-12 rounded-full hover:bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-all"><X size={20} /></button>

                            <div className="w-px h-6 bg-white/5 mx-1" />

                            {/* TYPE SWITCHER (MENU) */}
                            <button onClick={() => setComposerStep('menu')} className="w-12 h-12 rounded-full hover:bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-all" title="Cambiar Tipo">
                                <Plus size={20} className="rotate-45" />
                            </button>

                            <div className="w-px h-6 bg-white/5 mx-1" />

                            {/* TOOL GROUP */}
                            <div className="flex items-center gap-1 bg-white/5 rounded-full p-1 border border-white/5">
                                <input type="file" ref={inlineMediaInputRef} className="hidden" onChange={handleInlineMedia} accept="image/*,video/*,audio/*" />
                                <button onClick={() => inlineMediaInputRef.current.click()} className="w-10 h-10 rounded-full hover:bg-cyan-500/20 text-cyan-400 flex items-center justify-center transition-all"><ImageIcon size={18} /></button>
                                <button onClick={() => inlineMediaInputRef.current.click()} className="w-10 h-10 rounded-full hover:bg-red-500/20 text-red-500 flex items-center justify-center transition-all"><Mic size={18} /></button>
                                <button onClick={() => setIsDrawingModalOpen(true)} className="w-10 h-10 rounded-full hover:bg-white/10 text-zinc-400 flex items-center justify-center transition-all"><Pencil size={18} /></button>
                            </div>

                            <div className="w-px h-6 bg-white/5 mx-1" />

                            {/* MODE GROUP */}
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setIsDiaryMode(!isDiaryMode)}
                                    className={`h-12 px-5 rounded-full flex items-center gap-2 transition-all border ${isDiaryMode ? 'bg-amber-500/20 border-amber-500/50 text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]' : 'bg-transparent border-transparent text-white/40 hover:text-white'}`}
                                >
                                    <StickyNote size={16} className={isDiaryMode ? 'animate-pulse' : ''} />
                                    <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">Diario</span>
                                </button>
                                <button
                                    onClick={() => setIsResonanceMode(!isResonanceMode)}
                                    className={`h-12 px-5 rounded-full flex items-center gap-2 transition-all border ${isResonanceMode ? 'bg-accent/20 border-accent text-accent shadow-[0_0_20px_rgba(var(--accent-rgb),0.2)]' : 'bg-transparent border-transparent text-white/40 hover:text-white'}`}
                                    style={{ '--accent-rgb': hexToRgb(accent) }}
                                >
                                    <Zap size={16} className={isResonanceMode ? 'animate-pulse' : ''} />
                                    <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">Resonancia</span>
                                </button>
                            </div>

                            <div className="w-px h-6 bg-white/5 mx-1" />

                            {/* PRIMARY ACTION: SINCRO */}
                            <button
                                onClick={launchMedia}
                                disabled={!caption || (isResonanceMode ? !resResonance : !noteText)}
                                className={`h-12 px-8 rounded-full flex items-center gap-2 transition-all shadow-2xl ${(!caption || (isResonanceMode ? !resResonance : !noteText)) ? 'bg-white/5 text-zinc-800' : 'bg-accent text-black hover:scale-105 active:scale-95'}`}
                            >
                                <Globe size={16} className={(!caption || (isResonanceMode ? !resResonance : !noteText)) ? '' : 'animate-pulse'} />
                                <span className="text-[11px] font-black uppercase tracking-widest">Sincronizar Nexus</span>
                            </button>
                        </div>
                    )}

                    <div className={`flex-1 overflow-y-auto no-scrollbar ${composerStep === 'note' ? 'w-full max-w-6xl mx-auto px-8 md:px-0 py-32 md:py-48' : 'flex items-center justify-center p-4'}`}>
                        {composerStep === 'note' ? (
                            <div className="space-y-4 animate-in slide-in-from-bottom-10 duration-1000 relative">
                                {/* INTEGRATED MINI PLAYER INFO (BOTTOM-LEFT REP.) */}
                                <div className="fixed top-4 left-1/2 -translate-x-1/2 md:top-auto md:bottom-12 md:left-12 md:translate-x-0 z-[100] w-[90%] md:w-auto md:max-w-md p-2 md:p-3 bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-2xl animate-in slide-in-from-bottom-4 duration-700">
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => setIsPlayerFull(true)} className="w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-accent/20 flex items-center justify-center text-accent hover:bg-accent/30 transition-all shrink-0">
                                            <Maximize2 size={16} />
                                        </button>
                                        <div className="flex flex-col min-w-0 flex-1 md:flex-initial md:w-40 lg:w-48">
                                            <span className="text-[9px] md:text-[10px] font-black uppercase text-white truncate italic">{playQueue[currentTrack]?.title || 'Sintonizando...'}</span>
                                            <span className="text-[7px] md:text-[8px] font-bold text-zinc-500 truncate uppercase tracking-widest">{playQueue[currentTrack]?.artist || 'Kio'}</span>
                                        </div>
                                        <div className="flex items-center gap-1 pr-2">
                                            <button onClick={() => handlePrevTrack()} className="w-8 h-8 rounded-full hover:bg-white/5 flex items-center justify-center text-zinc-600 hover:text-white transition-all"><SkipBack size={14} /></button>
                                            <button
                                                onClick={() => {
                                                    if (isPlaying) audioPlayerRef.current.pause();
                                                    else audioPlayerRef.current.play();
                                                    setIsPlaying(!isPlaying);
                                                }}
                                                className="w-10 h-10 rounded-full bg-accent text-black flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg"
                                            >
                                                {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
                                            </button>
                                            <button onClick={() => handleNextTrack()} className="w-8 h-8 rounded-full hover:bg-white/5 flex items-center justify-center text-zinc-600 hover:text-white transition-all"><SkipForward size={14} /></button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-end gap-6 mb-8">
                                    <div className="flex-1">
                                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent/40 mb-2 block">{isDiaryMode ? "Cronología del Día" : "Entrada al Vortex"}</span>
                                        <input
                                            ref={titleRef}
                                            autoFocus
                                            className="w-full bg-transparent border-none focus:ring-0 text-3xl md:text-5xl font-black text-zinc-100 placeholder:text-zinc-800 transition-all p-0 tracking-tighter"
                                            placeholder={isDiaryMode ? new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long' }) : (isResonanceMode ? "Nombra tu Resonancia" : "Sin título")}
                                            value={caption}
                                            onChange={e => setCaption(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === 'Tab') {
                                                    e.preventDefault();
                                                    const nextInput = document.querySelector('.typing-aura') || document.querySelector('textarea');
                                                    nextInput?.focus();
                                                }
                                            }}
                                        />
                                    </div>
                                    {isDiaryMode && (
                                        <div className="hidden md:flex flex-col items-end opacity-20">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white">{new Date().getFullYear()}</span>
                                            <span className="text-[20px] font-black italic text-zinc-600 -mt-1">Nexus</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1 relative" onClick={() => setActiveMenu(null)}>
                                    {isDiaryMode ? (
                                        /* FEED-STYLE DIARY MODE */
                                        <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-10 duration-1000 max-w-3xl mx-auto">
                                            {/* PREVIOUS ENTRIES */}
                                            {blocks.find(b => b.id === editingId)?.entries?.map((entry, idx) => (
                                                <div key={idx} className="flex flex-col gap-3 p-5 bg-white/5 backdrop-blur-3xl rounded-[2rem] border border-white/5 opacity-40 hover:opacity-100 transition-all">
                                                    <div className="flex items-center justify-between opacity-50">
                                                        <span className="text-[8px] font-black uppercase tracking-widest text-accent">{new Date(entry.timestamp).toLocaleDateString()}</span>
                                                        <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600">{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                    <p className="text-base md:text-lg font-serif italic text-white/90 leading-relaxed">"{entry.text}"</p>
                                                </div>
                                            ))}

                                            {/* ADD NEW ENTRY TRIGGER */}
                                            <div className="flex justify-center -my-2">
                                                <button
                                                    onClick={() => document.querySelector('textarea')?.focus()}
                                                    className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all flex items-center gap-2"
                                                >
                                                    <Plus size={12} /> Nueva Entrada
                                                </button>
                                            </div>

                                            {/* NEW ENTRY INPUT */}
                                            <div className="flex flex-col gap-4 p-8 bg-[#0c0c0d] backdrop-blur-3xl rounded-[3rem] border-2 border-accent/20 shadow-[0_0_50px_rgba(var(--accent-rgb),0.1)] group relative overflow-hidden">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-3xl rounded-full -translate-x-1/2 -translate-y-1/2" />
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-10 h-10 rounded-2xl bg-accent text-black flex items-center justify-center">
                                                        <Edit3 size={18} />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[12px] md:text-[14px] font-black italic text-accent leading-tight uppercase tracking-tight">Nueva Entrada</span>
                                                        <span className="text-[7px] font-bold text-zinc-600 uppercase tracking-[0.4em] opacity-60">Flujo de Conciencia</span>
                                                    </div>
                                                </div>
                                                <textarea
                                                    autoFocus
                                                    value={noteText}
                                                    onChange={e => setNoteText(e.target.value)}
                                                    placeholder="Escribe lo que sientes en este momento..."
                                                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-2xl md:text-3xl font-serif italic text-white/95 placeholder:text-zinc-800 resize-none min-h-[150px] typing-aura"
                                                />
                                            </div>
                                        </div>
                                    ) : isResonanceMode ? (
                                        /* RESONANCE STRUCTURED MODE */
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-10 duration-1000">
                                            {/* RESONANCIA CARD */}
                                            <div className="flex flex-col gap-4 p-8 bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/10 hover:border-accent/30 transition-all group shadow-2xl relative overflow-hidden">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-3xl rounded-full -translate-x-1/2 -translate-y-1/2 group-hover:bg-accent/10 transition-colors" />
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
                                                        <Radio size={18} className="animate-spin-slow" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[12px] md:text-[14px] font-black italic text-accent leading-tight uppercase tracking-tight">¿Qué resuena hoy en ti?</span>
                                                        <span className="text-[7px] font-bold text-zinc-600 uppercase tracking-[0.4em] opacity-60">Resonancia Primal</span>
                                                    </div>
                                                </div>
                                                <textarea
                                                    value={resResonance}
                                                    onChange={e => setResResonance(e.target.value)}
                                                    placeholder="Describe la vibración actual..."
                                                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-xl md:text-2xl font-serif italic text-white/90 placeholder:text-zinc-900 resize-none min-h-[150px] typing-aura"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Tab') {
                                                            e.preventDefault();
                                                            const textareas = document.querySelectorAll('.typing-aura');
                                                            const idx = Array.from(textareas).indexOf(e.target);
                                                            textareas[idx + 1]?.focus();
                                                        }
                                                    }}
                                                />
                                            </div>

                                            {/* IMPACT CARD */}
                                            <div className="flex flex-col gap-4 p-8 bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/10 hover:border-rose-400/30 transition-all group shadow-2xl relative overflow-hidden">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-400/5 blur-3xl rounded-full -translate-x-1/2 -translate-y-1/2 group-hover:bg-rose-400/10 transition-colors" />
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-10 h-10 rounded-2xl bg-rose-400/10 flex items-center justify-center text-rose-400">
                                                        <Zap size={18} />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[12px] md:text-[14px] font-black italic text-rose-400 leading-tight uppercase tracking-tight">¿Qué impacto genera esto?</span>
                                                        <span className="text-[7px] font-bold text-zinc-600 uppercase tracking-[0.4em] opacity-60">Impacto Profundo</span>
                                                    </div>
                                                </div>
                                                <textarea
                                                    value={resImpact}
                                                    onChange={e => setResImpact(e.target.value)}
                                                    placeholder="Define la magnitud de la onda..."
                                                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-xl md:text-2xl font-serif italic text-white/90 placeholder:text-zinc-900 resize-none min-h-[150px] typing-aura"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Tab') {
                                                            e.preventDefault();
                                                            const textareas = document.querySelectorAll('.typing-aura');
                                                            const idx = Array.from(textareas).indexOf(e.target);
                                                            textareas[idx + 1]?.focus();
                                                        }
                                                    }}
                                                />
                                            </div>

                                            {/* STRANGE CARD */}
                                            <div className="md:col-span-2 flex flex-col gap-4 p-8 bg-white/5 backdrop-blur-3xl rounded-[4rem] border border-white/10 hover:border-cyan-400/30 transition-all group shadow-2xl relative overflow-hidden">
                                                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-400/5 blur-[100px] rounded-full -translate-x-1/4 -translate-y-1/2 group-hover:bg-cyan-400/10 transition-colors" />
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-10 h-10 rounded-2xl bg-cyan-400/10 flex items-center justify-center text-cyan-400">
                                                        <Focus size={18} />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[12px] md:text-[14px] font-black italic text-cyan-400 leading-tight uppercase tracking-tight">¿Qué es lo extraño de este proceso?</span>
                                                        <span className="text-[7px] font-bold text-zinc-600 uppercase tracking-[0.4em] opacity-60">Atipicidad / Rareza</span>
                                                    </div>
                                                </div>
                                                <textarea
                                                    value={resStrange}
                                                    onChange={e => setResStrange(e.target.value)}
                                                    placeholder="Capta la anomalía en el sistema..."
                                                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-2xl md:text-4xl font-black italic text-white/95 placeholder:text-zinc-900 resize-none min-h-[120px] tracking-tight typing-aura"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        /* SIMPLE NOTE MODE */
                                        noteText.split('\n').map((line, idx) => {
                                            const colorTag = line.match(/^\[(rosa|cian|genesis|purpura)\]\s*/);
                                            const currentColor = colorTag ? colorTag[1] : null;
                                            const cleanContent = line.replace(/^\[.*?\]\s*/, '');
                                            const isHeading = cleanContent.startsWith('# ');
                                            const isQuote = cleanContent.startsWith('> ');
                                            const isBullet = cleanContent.startsWith('- ');
                                            const isCode = cleanContent.startsWith('```');

                                            if (line.startsWith('[img]')) {
                                                const url = line.replace('[img]', '').trim();
                                                return (
                                                    <div key={idx} className="group relative my-10 animate-in fade-in zoom-in duration-700">
                                                        <div className="absolute -left-14 top-4 opacity-0 group-hover:opacity-100 transition-all z-20">
                                                            <button onClick={() => {
                                                                const lines = noteText.split('\n');
                                                                lines.splice(idx, 1);
                                                                setNoteText(lines.join('\n'));
                                                            }} className="w-10 h-10 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-2xl backdrop-blur-md border border-red-500/20">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                        <div className="relative rounded-[3rem] overflow-hidden border border-white/5 shadow-[0_30px_60px_rgba(0,0,0,0.4)] group/img ring-1 ring-white/10">
                                                            <img src={formatUrl(url)} className="w-full h-auto object-cover max-h-[600px] transition-transform duration-[3000ms] group-hover/img:scale-110" />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity duration-700" />
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            if (line.startsWith('[vid]')) {
                                                const url = line.replace('[vid]', '').trim();
                                                return (
                                                    <div key={idx} className="group relative my-10 animate-in fade-in zoom-in duration-700">
                                                        <div className="absolute -left-14 top-4 opacity-0 group-hover:opacity-100 transition-all z-20">
                                                            <button onClick={() => {
                                                                const lines = noteText.split('\n');
                                                                lines.splice(idx, 1);
                                                                setNoteText(lines.join('\n'));
                                                            }} className="w-10 h-10 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-2xl backdrop-blur-md border border-red-500/20">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                        <div className="relative rounded-[3rem] overflow-hidden border border-white/5 shadow-[0_30px_60px_rgba(0,0,0,0.4)] ring-1 ring-white/10 aspect-video">
                                                            <video src={url} controls className="w-full h-full object-cover" />
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            if (line.startsWith('[aud]')) {
                                                const url = line.replace('[aud]', '').trim();
                                                return (
                                                    <div key={idx} className="group relative my-6 animate-in slide-in-from-left duration-700">
                                                        <div className="absolute -left-14 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all z-20">
                                                            <button onClick={() => {
                                                                const lines = noteText.split('\n');
                                                                lines.splice(idx, 1);
                                                                setNoteText(lines.join('\n'));
                                                            }} className="w-10 h-10 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                        <div className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 flex items-center gap-6 shadow-xl">
                                                            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 animate-pulse">
                                                                <Mic size={20} />
                                                            </div>
                                                            <audio src={url} controls className="flex-1 accent-red-500" />
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div key={idx} className="group relative flex items-start gap-2">
                                                    {/* GUTTER BUTTONS (NOTION STYLE) */}
                                                    <div className="absolute -left-12 top-1.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 z-[600]">
                                                        <button onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveMenu({ idx, type: 'add' });
                                                        }} className="p-1 hover:bg-white/10 rounded-md text-zinc-600 hover:text-white transition-colors">
                                                            <Plus size={14} />
                                                        </button>
                                                        <button onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveMenu({ idx, type: 'actions' });
                                                        }} className="p-1 hover:bg-white/10 rounded-md text-zinc-600 hover:text-white transition-colors cursor-grab active:cursor-grabbing">
                                                            <div className="grid grid-cols-2 gap-0.5 opacity-40 group-hover:opacity-100">
                                                                {[...Array(6)].map((_, i) => <div key={i} className="w-0.5 h-0.5 bg-current rounded-full" />)}
                                                            </div>
                                                        </button>
                                                    </div>

                                                    {/* EDITABLE LINE */}
                                                    <textarea
                                                        ref={idx === 0 ? firstLineRef : null}
                                                        className={`w-full bg-transparent border-none focus:ring-0 p-0 leading-[1.3] placeholder:text-zinc-900 resize-none overflow-hidden min-h-[1.5em] transition-all selection:bg-accent/20 typing-aura ${isHeading ? 'text-4xl md:text-5xl font-black text-white/95 mb-6 tracking-tight' :
                                                            isQuote ? 'text-2xl md:text-3xl font-serif italic text-accent border-l-2 border-accent/30 pl-8 py-4 my-8 bg-accent/5 rounded-r-3xl' :
                                                                isCode ? 'font-mono text-base text-cyan-400 bg-black/40 p-6 rounded-2xl border border-white/5 drop-shadow-[0_0_10px_rgba(34,211,238,0.2)]' :
                                                                    currentColor === 'rosa' ? 'text-2xl md:text-3xl font-serif italic text-rose-400/90' :
                                                                        currentColor === 'cian' ? 'text-2xl md:text-3xl font-serif italic text-cyan-400/90' :
                                                                            currentColor === 'genesis' ? 'text-2xl md:text-3xl font-serif italic text-[#bef264]/90' :
                                                                                currentColor === 'purpura' ? 'text-2xl md:text-3xl font-serif italic text-purple-400/90' :
                                                                                    'text-2xl md:text-3xl font-serif italic text-zinc-500/80'
                                                            }`}
                                                        style={{ height: 'auto', '--accent-rgb': hexToRgb(accent) }}
                                                        rows={1}
                                                        value={cleanContent.replaceAll('\u2028', '\n')}
                                                        placeholder={idx === 0 ? "Escribe algo aquí... Pulsa '/' para comandos" : ""}
                                                        onInput={(e) => {
                                                            e.target.style.height = 'auto';
                                                            e.target.style.height = e.target.scrollHeight + 'px';
                                                        }}
                                                        onChange={(e) => {
                                                            const lines = noteText.split('\n');
                                                            lines[idx] = (currentColor ? `[${currentColor}] ` : '') + e.target.value.replaceAll('\n', '\u2028');
                                                            setNoteText(lines.join('\n'));
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Tab') {
                                                                e.preventDefault();
                                                                const allTxt = document.querySelectorAll('.typing-aura');
                                                                if (idx < allTxt.length - 1) {
                                                                    allTxt[idx + 1].focus();
                                                                } else {
                                                                    // Si es el último, tal vez al título o botón?
                                                                    // Por ahora dejarlo así o pasar al primero
                                                                }
                                                            }
                                                            if (e.key === 'Enter') {
                                                                if (e.shiftKey) {
                                                                    return;
                                                                }

                                                                e.preventDefault();
                                                                const lines = noteText.split('\n');
                                                                lines.splice(idx + 1, 0, (currentColor ? `[${currentColor}] ` : ''));
                                                                setNoteText(lines.join('\n'));
                                                                setTimeout(() => {
                                                                    const allTxt = document.querySelectorAll('.typing-aura');
                                                                    allTxt[idx + 1]?.focus();
                                                                }, 50);
                                                            } else if (e.key === 'Backspace' && e.target.selectionStart === 0 && idx > 0) {
                                                                e.preventDefault();
                                                                const lines = noteText.split('\n');
                                                                const prevLine = lines[idx - 1];
                                                                const currentLine = lines[idx];

                                                                if (prevLine.startsWith('[img]') || prevLine.startsWith('[vid]') || prevLine.startsWith('[aud]')) {
                                                                    lines.splice(idx - 1, 1);
                                                                    setNoteText(lines.join('\n'));
                                                                } else {
                                                                    const currentClean = currentLine.replace(/^\[.*?\]\s*/, '');
                                                                    const prevStyleMatch = prevLine.match(/^\[.*?\]\s*/);
                                                                    const prevStyle = prevStyleMatch ? prevStyleMatch[0] : '';
                                                                    const prevClean = prevLine.replace(/^\[.*?\]\s*/, '');

                                                                    lines[idx - 1] = prevStyle + prevClean + currentClean;
                                                                    const mergedCursorPos = prevClean.length;
                                                                    lines.splice(idx, 1);
                                                                    setNoteText(lines.join('\n'));

                                                                    setTimeout(() => {
                                                                        const allTxt = document.querySelectorAll('.typing-aura');
                                                                        const target = allTxt[idx - 1];
                                                                        if (target) {
                                                                            target.focus();
                                                                            target.setSelectionRange(mergedCursorPos, mergedCursorPos);
                                                                        }
                                                                    }, 50);
                                                                }
                                                            }
                                                        }}
                                                    />

                                                    {/* FLOATING MICRO-WINDOW (NOTION STYLE) - COMPACT VERSION */}
                                                    {activeMenu?.idx === idx && (
                                                        <div className="absolute left-0 top-10 w-56 bg-[#232323] border border-white/5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[700] p-1 animate-in zoom-in-95 duration-200 ring-1 ring-white/10">
                                                            <input placeholder="Buscar acciones..." className="w-full bg-white/5 border-none focus:ring-1 focus:ring-accent/40 rounded-xl text-[9px] p-2 mb-1.5 text-white/80 placeholder:text-zinc-600" />

                                                            <div className="max-h-[350px] overflow-y-auto no-scrollbar py-0.5">
                                                                <span className="text-[6px] font-black uppercase tracking-[0.2em] text-zinc-600 px-2 py-1.5 block">Texto</span>
                                                                {[
                                                                    { id: 'h1', label: 'Encabezado 1', prefix: '# ', icon: <Focus size={12} /> },
                                                                    { id: 'quote', label: 'Cita', prefix: '> ', icon: <Edit3 size={12} /> },
                                                                    { id: 'list', label: 'Lista con viñetas', prefix: '- ', icon: <Radio size={12} /> },
                                                                    { id: 'code', label: 'Código', prefix: '```', icon: <Zap size={12} /> }
                                                                ].map(opt => (
                                                                    <button
                                                                        key={opt.id}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            const lines = noteText.split('\n');
                                                                            lines[idx] = opt.prefix + lines[idx].replace(/^[#>\-[ \] ]+/, '').replace(/^\[.*?\]\s*/, '');
                                                                            setNoteText(lines.join('\n'));
                                                                            setActiveMenu(null);
                                                                        }}
                                                                        className="w-full text-left px-2 py-1.5 hover:bg-white/5 rounded-lg flex items-center gap-2.5 transition-all group"
                                                                    >
                                                                        <div className="w-6 h-6 rounded-md bg-white/5 border border-white/5 flex items-center justify-center text-zinc-500 group-hover:text-accent transition-colors">
                                                                            {opt.icon}
                                                                        </div>
                                                                        <span className="text-[10px] font-bold text-zinc-300 group-hover:text-white">{opt.label}</span>
                                                                    </button>
                                                                ))}

                                                                <div className="w-full h-px bg-white/5 my-1" />
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        const lines = noteText.split('\n');
                                                                        const q = "¿Qué parte de este pensamiento te asusta más?";
                                                                        lines.splice(idx + 1, 0, `[question] ${q}`);
                                                                        setNoteText(lines.join('\n'));
                                                                        setActiveMenu(null);
                                                                    }}
                                                                    className="w-full text-left px-2 py-2 hover:bg-accent/10 rounded-xl flex items-center gap-2.5 transition-all group border border-accent/20 my-1.5 shadow-[0_4px_12px_rgba(var(--accent-rgb),0.1)]"
                                                                >
                                                                    <div className="w-6 h-6 rounded-md bg-accent/20 flex items-center justify-center text-accent">
                                                                        <Radio size={12} className="animate-pulse" />
                                                                    </div>
                                                                    <span className="text-[9px] font-black uppercase tracking-widest text-accent">¿Profundizar?</span>
                                                                </button>
                                                                <div className="w-full h-px bg-white/5 my-1" />
                                                                <span className="text-[6px] font-black uppercase tracking-[0.2em] text-zinc-600 px-2 py-1.5 block">Multimedia</span>
                                                                {[
                                                                    { id: 'img', label: 'Imagen', icon: <ImageIcon size={12} /> },
                                                                    { id: 'vid', label: 'Video (3s)', icon: <Maximize2 size={12} /> },
                                                                    { id: 'aud', label: 'Audio', icon: <Mic size={12} /> }
                                                                ].map(opt => (
                                                                    <button key={opt.id} className="w-full text-left px-2 py-1.5 hover:bg-white/5 rounded-lg flex items-center gap-2.5 transition-all group">
                                                                        <div className="w-6 h-6 rounded-md bg-white/5 border border-white/5 flex items-center justify-center text-zinc-500 group-hover:text-white">
                                                                            {opt.icon}
                                                                        </div>
                                                                        <span className="text-[10px] font-bold text-zinc-300 group-hover:text-white">{opt.label}</span>
                                                                    </button>
                                                                ))}

                                                                <div className="w-full h-px bg-white/5 my-1" />
                                                                <span className="text-[6px] font-black uppercase tracking-[0.2em] text-accent px-2 py-1.5 block">Aura</span>
                                                                <div className="flex gap-2 px-2 py-1">
                                                                    {PALETTES.map(p => (
                                                                        <button
                                                                            key={p.name}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                const key = p.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                                                                                const lines = noteText.split('\n');
                                                                                lines[idx] = `[${key}] ` + lines[idx].replace(/^\[.*?\]\s*/, '');
                                                                                setNoteText(lines.join('\n'));
                                                                                setActiveMenu(null);
                                                                            }}
                                                                            className="w-5 h-5 rounded-full border border-white/10 hover:scale-125 active:scale-90 transition-all shadow-lg"
                                                                            style={{ backgroundColor: p.color }}
                                                                            title={p.name}
                                                                        />
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            <div className="border-t border-white/5 mt-1 pt-1 pb-0.5 px-0.5">
                                                                <button onClick={() => {
                                                                    const lines = noteText.split('\n');
                                                                    lines.splice(idx, 1);
                                                                    setNoteText(lines.join('\n'));
                                                                    setActiveMenu(null);
                                                                }} className="w-full text-left py-2 px-2 hover:bg-red-500/10 rounded-lg text-red-500/60 hover:text-red-500 text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all">
                                                                    <Trash2 size={10} /> Eliminar
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        ) : (
                            /* MEDIA PORTAL (MODAL) */
                            <div className="relative w-full max-w-xl bg-black/40 backdrop-blur-3xl rounded-[3.5rem] border border-white/10 p-10 md:p-14 shadow-2xl animate-in zoom-in duration-500">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-xl font-black italic text-white uppercase tracking-tighter">Portal {composerStep}</h2>
                                    <X className="cursor-pointer hover:text-red-500 transition-colors" size={20} onClick={() => setIsComposerOpen(false)} />
                                </div>
                                <input
                                    autoFocus
                                    className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-lg font-black italic text-accent placeholder:text-zinc-800 mb-8"
                                    placeholder="Agrega un título..."
                                    value={caption}
                                    onChange={e => setCaption(e.target.value)}
                                />
                                <label className="group w-full h-48 border-2 border-dashed border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-all text-zinc-500 hover:text-white">
                                    <Plus size={28} className="group-hover:scale-110 transition-transform" />
                                    <span className="text-[10px] font-black uppercase mt-4 tracking-widest">{mediaFile ? '¡Reliquia Lista!' : `Vincular ${composerStep}`}</span>
                                    <input type="file" className="hidden" accept={composerStep === 'image' ? 'image/*' : (composerStep === 'audio' ? 'audio/*' : 'video/*')} onChange={handleFileChange} />
                                </label>
                                <button
                                    onClick={launchMedia}
                                    className="w-full mt-10 py-5 bg-accent text-black font-black uppercase tracking-widest rounded-3xl text-[10px] hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-30"
                                    disabled={!caption || (composerStep === 'image' && !mediaFile)}
                                >
                                    Guardar Fragmento
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* DRAWING MODAL */}
            {isDrawingModalOpen && (
                <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 bg-black/90 backdrop-blur-3xl animate-in fade-in duration-500">
                    <div className="absolute top-8 right-8 flex gap-4">
                        <button onClick={() => setIsDrawingModalOpen(false)} className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all"><X size={32} /></button>
                    </div>
                    <div className="w-full max-w-4xl bg-black rounded-[4rem] border border-white/5 overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)]">
                        <canvas
                            ref={canvasRef}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            className="w-full bg-zinc-900/10 cursor-crosshair h-[600px]"
                        />
                        <div className="p-8 border-t border-white/5 flex justify-between items-center">
                            <div className="flex gap-4">
                                {['#bef264', '#22d3ee', '#f43f5e', '#ffffff'].map(c => (
                                    <button key={c} onClick={() => setDrawingColor(c)} className={`w-8 h-8 rounded-full border-2 transition-all ${drawingColor === c ? 'border-white scale-125' : 'border-transparent opacity-40 hover:opacity-100'}`} style={{ backgroundColor: c }} />
                                ))}
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => { const ctx = canvasRef.current.getContext('2d'); ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); }} className="px-6 py-3 bg-white/5 rounded-full text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-white/10 transition-all">Limpiar</button>
                                <button onClick={saveDrawing} className="px-10 py-3 bg-accent text-black rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-accent/20">Guardar Fragmento</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
