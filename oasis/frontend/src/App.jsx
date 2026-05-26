import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
    Plus, Minus, Edit2, Check, Radio, Focus, Compass, CheckSquare,
    ArrowLeft, ArrowRight, ImageIcon, Mic, Zap, Pencil,
    Edit3, Trash2, Maximize2, Settings, X,
    Heart, MessageCircle, Eye, EyeOff, Globe,
    Aperture, Infinity as InfinityIcon, Share2, Search, Play, Pause, SkipForward, SkipBack,
    FolderPlus, ChevronDown, Pin, Star, FileText, PanelLeft, PanelLeftClose, MessageSquare, StickyNote,
    Paperclip, Send, ChevronRight, ListMusic, Sparkles, Save,
    Navigation, Grid, Square, Circle, Monitor, RotateCw, Type, Move, Camera,
    User, Clock, Database, Activity, Crop, RefreshCw, Palette, Layers
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import OasisChat from './components/OasisChat';
import PsychologistDashboard from './components/PsychologistDashboard';
import { ResonanceNotebook } from './components/ResonanceNotebook';
import { DiaryNotebook } from './components/DiaryNotebook';
import icarQuestions from './data/icar16_questions.json';
import icarRationale from './data/icar16_rationale.json';
import { NekronomikronFull, OasisPlayer } from './components/Nekronomikron';
import { BiographicInterview } from './components/BiographicInterview';
import { saveObservation, getObservations, deleteObservation } from './utils/db';
import { useTranscription } from './hooks/useTranscription';

// Globally override localStorage.setItem to auto-sync clinical data to the dotnet backend
const originalSetItem = localStorage.setItem;
localStorage.setItem = function (key, value) {
    originalSetItem.apply(this, arguments);
    if (key.startsWith('oasis_') && key !== 'oasis_user') {
        const getTargetUserFromKey = (k, defaultUser) => {
            const prefixes = [
                'oasis_bio_transcriptions_',
                'oasis_phenom_qualitative_',
                'oasis_pid_answers_',
                'oasis_icar_answers_',
                'oasis_icar_dwell_',
                'oasis_icar_changes_',
                'oasis_bio_metadata_',
                'oasis_phenom_metadata_',
                'oasis_active_version_',
                'oasis_total_versions_',
                'oasis_patient_status_',
                'oasis_session_videos_bio_videos_',
                'oasis_session_videos_phenom_videos_',
                'oasis_session_videos_icar_videos_',
                'oasis_clinician_notes_',
                'oasis_private_notes_',
                'oasis_canvas_nodes_',
                'oasis_canvas_edges_'
            ];
            for (const prefix of prefixes) {
                if (k.startsWith(prefix)) {
                    let part = k.substring(prefix.length);
                    const vIndex = part.indexOf('_v');
                    if (vIndex > -1) part = part.substring(0, vIndex);
                    return part;
                }
            }
            return defaultUser;
        };

        const currentUser = localStorage.getItem('oasis_user');
        const targetUser = getTargetUserFromKey(key, currentUser);
        if (targetUser) {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5046';
            fetch(`${API_URL}/api/oasis/clinical-data?user=${targetUser}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [key]: value })
            }).catch(err => console.error("Error auto-syncing clinical data to server:", err));
        }
    }
};

const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '190, 242, 100';
};

const getBWidth = (block, isPoint) => {
    if (isPoint) return 0;
    if (block.width || block.w) return block.width || block.w;
    if (block.type === 'loop_map_mini') return 850;
    if (block.type === 'diary_notebook' || block.type === 'resonance_notebook' || block.type === 'conversation_notebook') return 480;
    return block.metadata?.parentId ? 160 : 288;
};

const getBHeight = (block, isPoint) => {
    if (isPoint) return 0;
    if (block.height || block.h) return block.height || block.h;
    if (block.type === 'loop_map_mini') return 700;
    if (block.type === 'diary_notebook' || block.type === 'resonance_notebook' || block.type === 'conversation_notebook') return 600;
    return block.metadata?.parentId ? 160 : 288;
};

const getConnectionPoints = (b1, b2, isB2Point = false, draggingId = null, scale = 1) => {
    const b2X = b2.x;
    const b2Y = b2.y;

    const b1IsChild = !!b1.metadata?.parentId;
    const b2IsChild = !isB2Point && !!b2.metadata?.parentId;

    const b1W = getBWidth(b1, false);
    const b2W = getBWidth(b2, isB2Point);
    const b1H = getBHeight(b1, false);
    const b2H = getBHeight(b2, isB2Point);

    // The nodes are positioned with translate(-50%, -50%), so b.x and b.y represent their exact CENTER.
    // Dynamic border connection points based on node placement.
    let p1, p2;
    if (isB2Point) {
        p1 = { x: 5000 + b1.x, y: 5000 + b1.y + (b1H / 2) };
        p2 = { x: 5000 + b2.x, y: 5000 + b2.y };
    } else {
        const dx = b2.x - b1.x;
        const dy = b2.y - b1.y;

        if (Math.abs(dx) > Math.abs(dy)) {
            // Horizontal connection
            if (dx > 0) {
                p1 = { x: 5000 + b1.x + (b1W / 2), y: 5000 + b1.y };
                p2 = { x: 5000 + b2.x - (b2W / 2), y: 5000 + b2.y };
            } else {
                p1 = { x: 5000 + b1.x - (b1W / 2), y: 5000 + b1.y };
                p2 = { x: 5000 + b2.x + (b2W / 2), y: 5000 + b2.y };
            }
        } else {
            // Vertical connection
            if (dy > 0) {
                p1 = { x: 5000 + b1.x, y: 5000 + b1.y + (b1H / 2) };
                p2 = { x: 5000 + b2.x, y: 5000 + b2.y - (b2H / 2) };
            } else {
                p1 = { x: 5000 + b1.x, y: 5000 + b1.y - (b1H / 2) };
                p2 = { x: 5000 + b2.x, y: 5000 + b2.y + (b2H / 2) };
            }
        }
    }

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Deep gravity sag based on distance, maintaining a gorgeous hanging loop!
    const dip = Math.max(90, distance * 0.35 + 80);

    // Continuous 3D breathing wave (elliptical orbit)
    const time = performance.now() * 0.0025;

    const velocity = window.dragVelocity || { x: 0, y: 0 };
    const vx = velocity.x / scale;
    const vy = velocity.y / scale;

    let cp1WaveX = Math.sin(time) * 20;
    let cp1WaveY = Math.cos(time) * 10;
    let cp2WaveX = Math.sin(time + 2.5) * 20;
    let cp2WaveY = Math.cos(time + 2.5) * 10;

    // Apply springy physical drag lag (sway) in opposite direction of motion
    if (draggingId) {
        if (b1.id === draggingId) {
            cp1WaveX -= vx * 5.2;
            cp1WaveY -= vy * 2.5;
        } else if (!isB2Point && b2.id === draggingId) {
            cp2WaveX -= vx * 5.2;
            cp2WaveY -= vy * 2.5;
        }
    }

    // Apply release SPRING BOUNCE (Damped Harmonic Oscillator)
    if (window.lastRelease) {
        const timeSinceRelease = (performance.now() - window.lastRelease.time) / 1000;
        if (timeSinceRelease < 1.6) {
            const decay = 4.2; // Damping rate (how fast it stops)
            const freq = 18.0; // Bounce frequency (how fast it wobbles)
            const amp = Math.exp(-decay * timeSinceRelease) * Math.cos(freq * timeSinceRelease);

            const rvx = window.lastRelease.vx / scale;
            const rvy = window.lastRelease.vy / scale;

            if (b1.id === window.lastRelease.nodeId) {
                cp1WaveX -= rvx * 5.2 * amp;
                cp1WaveY -= rvy * 2.5 * amp;
            }
            if (!isB2Point && b2.id === window.lastRelease.nodeId) {
                cp2WaveX -= rvx * 5.2 * amp;
                cp2WaveY -= rvy * 2.5 * amp;
            }
        }
    }

    let cp1, cp2;
    const isHorizontal = !isB2Point && Math.abs(b2.x - b1.x) > Math.abs(b2.y - b1.y);

    if (isHorizontal) {
        const dir = Math.sign(p2.x - p1.x) || 1;
        cp1 = { x: p1.x + dir * (distance * 0.35) + cp1WaveX, y: p1.y + cp1WaveY };
        cp2 = { x: p2.x - dir * (distance * 0.35) + cp2WaveX, y: p2.y + cp2WaveY };
    } else {
        const dir = Math.sign(p2.y - p1.y) || 1;
        let cp1Dip = dip;
        let cp2Dip = dip * 0.62;
        if (dir < 0) {
            cp1Dip = -dip;
            cp2Dip = -dip * 0.62;
        }
        cp1 = { x: p1.x + cp1WaveX, y: p1.y + cp1Dip + cp1WaveY };
        cp2 = { x: p2.x + cp2WaveX, y: p2.y + cp2Dip + cp2WaveY };
    }

    return { p1, p2, cp1, cp2 };
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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5046';

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
                                                    <div className="flex gap-1">
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

const INITIAL_BLOCKS = []; // Datos Iniciales

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
                    <div className="group/eco flex flex-col items-center gap-1">
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

const SimpleNarrativeRenderer = React.memo(({ content, isChild = false }) => {
    if (!content) return null;

    // Pre-process content to handle legacy Oasis blocks or AI-specific tags
    // We split by blocks that should be rendered specially
    const regexStr = '(\\[img\\].*?|\\[vid\\].*?|\\[aud\\].*?|\\[question\\].*?|\\[insight\\][\\s\\S]*?(?=\\[img\\]|\\[vid\\]|\\[aud\\]|\\[question\\]|\\[insight\\]|\\[resonancia\\]|\\[impacto\\]|\\[extrano\\]|$)|\\[resonancia\\][\\s\\S]*?(?=\\[img\\]|\\[vid\\]|\\[aud\\]|\\[question\\]|\\[insight\\]|\\[resonancia\\]|\\[impacto\\]|\\[extrano\\]|$)|\\[impacto\\][\\s\\S]*?(?=\\[img\\]|\\[vid\\]|\\[aud\\]|\\[question\\]|\\[insight\\]|\\[resonancia\\]|\\[impacto\\]|\\[extrano\\]|$)|\\[extrano\\][\\s\\S]*?(?=\\[img\\]|\\[vid\\]|\\[aud\\]|\\[question\\]|\\[insight\\]|\\[resonancia\\]|\\[impacto\\]|\\[extrano\\]|$))';
    const blocks = content.split(new RegExp(regexStr, 'g'));

    return (
        <div className={`prose prose-invert max-w-none ${isChild ? 'text-[8.5px] leading-tight prose-p:my-0.5 prose-headings:my-0.5 font-sans' : 'text-[13px] md:text-[15px] leading-relaxed font-serif'} italic text-white/90 selection:bg-accent/20`}>
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
                                <span className="text-[7px] font-black uppercase tracking-[0.3em] text-purple-400/50">Insight</span>
                            </div>
                            <div className="text-sm md:text-base font-serif italic text-white/90 leading-snug">
                                <ReactMarkdown>{ins}</ReactMarkdown>
                            </div>
                        </div>
                    );
                }
                if (trimmed.startsWith('[resonancia]')) {
                    const res = trimmed.replace('[resonancia]', '').trim();
                    return (
                        <div key={i} className="my-4 p-5 bg-purple-500/5 border border-purple-500/20 rounded-[2rem] shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 blur-2xl rounded-full" />
                            <div className="flex items-center gap-2 mb-3 relative z-10">
                                <Radio size={12} className="text-purple-400 animate-spin-slow" />
                                <span className="text-[8px] font-black uppercase tracking-[0.3em] text-purple-400/80">Resonancia Primal</span>
                            </div>
                            <p className="text-sm font-serif italic text-white/90 relative z-10">{res}</p>
                        </div>
                    );
                }
                if (trimmed.startsWith('[impacto]')) {
                    const imp = trimmed.replace('[impacto]', '').trim();
                    return (
                        <div key={i} className="my-4 p-5 bg-rose-500/5 border border-rose-500/20 rounded-[2rem] shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/10 blur-2xl rounded-full" />
                            <div className="flex items-center gap-2 mb-3 relative z-10">
                                <Zap size={12} className="text-rose-400" />
                                <span className="text-[8px] font-black uppercase tracking-[0.3em] text-rose-400/80">Impacto Profundo</span>
                            </div>
                            <p className="text-sm font-serif italic text-white/90 relative z-10">{imp}</p>
                        </div>
                    );
                }
                if (trimmed.startsWith('[extrano]')) {
                    const ext = trimmed.replace('[extrano]', '').trim();
                    return (
                        <div key={i} className="my-4 p-5 bg-cyan-500/5 border border-cyan-500/20 rounded-[2rem] shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/10 blur-2xl rounded-full" />
                            <div className="flex items-center gap-2 mb-3 relative z-10">
                                <Focus size={12} className="text-cyan-400" />
                                <span className="text-[8px] font-black uppercase tracking-[0.3em] text-cyan-400/80">Atipicidad</span>
                            </div>
                            <p className="text-[15px] font-black italic text-white relative z-10 tracking-tight">{ext}</p>
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

const MiniMuralPreview = ({ muralBlocks, accent = '#bef264', onClick, size = 'sm' }) => {
    if (!muralBlocks || muralBlocks.length === 0) return null;

    const containerRef = useRef(null);
    const [dimensions, setDimensions] = useState({
        width: size === 'lg' ? 680 : 230,
        height: size === 'lg' ? 280 : 110
    });

    useEffect(() => {
        if (!containerRef.current) return;
        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                if (width > 0 && height > 0) {
                    setDimensions({ width, height });
                }
            }
        });
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    muralBlocks.forEach(b => {
        const x = b.x || 0;
        const y = b.y || 0;
        const w = b.width || 120;
        const h = b.height || 80;
        if (x < minX) minX = x;
        if (x + w > maxX) maxX = x + w;
        if (y < minY) minY = y;
        if (y + h > maxY) maxY = y + h;
    });

    const muralW = maxX - minX || 1;
    const muralH = maxY - minY || 1;

    const isLarge = size === 'lg';
    const padding = isLarge ? 24 : 12;

    const fitW = dimensions.width;
    const fitH = dimensions.height;

    const scale = Math.min((fitW - padding * 2) / muralW, (fitH - padding * 2) / muralH, isLarge ? 0.7 : 0.18);
    const offsetX = (fitW - muralW * scale) / 2 - minX * scale;
    const offsetY = (fitH - muralH * scale) / 2 - minY * scale;

    const formatUrl = (url) => {
        if (!url) return '';
        if (url.startsWith('data:')) return url;
        if (url.startsWith('http://') || url.startsWith('https://')) return url;
        return `http://localhost:5074${url}`;
    };

    return (
        <div
            ref={containerRef}
            onClick={onClick}
            className={`w-full relative overflow-hidden my-3 select-none backdrop-blur-sm group/mural-prev flex items-center justify-center bg-[#fafafa] border border-zinc-200/50 shadow-inner ${isLarge ? 'h-[280px] rounded-[2.5rem]' : 'h-[110px] rounded-2xl'} ${onClick ? 'cursor-pointer hover:scale-[1.01] active:scale-[0.99] hover:border-accent/40 transition-all duration-300' : ''}`}
        >
            <div className="absolute inset-0 bg-[radial-gradient(#0000000a_1.2px,transparent_1.2px)] [background-size:10px_10px] pointer-events-none" />
            <div className="absolute inset-0 w-full h-full pointer-events-none">
                {muralBlocks.map((mb, idx) => {
                    const left = mb.x * scale + offsetX;
                    const top = mb.y * scale + offsetY;
                    const width = (mb.width || 120) * scale;
                    const height = (mb.height || 80) * scale;
                    const borderRadius = (mb.borderRadius || 12) * scale;
                    const borderW = (mb.borderWidth || 0) * scale;

                    const isWhiteColor = !mb.color || mb.color === '#ffffff' || mb.color?.toLowerCase() === '#fff';
                    const displayTextColor = isWhiteColor ? '#18181b' : mb.color;

                    let bgStyle = {
                        left: `${left}px`,
                        top: `${top}px`,
                        width: `${width}px`,
                        height: `${height}px`,
                        borderRadius: `${borderRadius}px`,
                        borderWidth: `${borderW || 1}px`,
                        borderColor: mb.borderColor || (isWhiteColor ? '#e4e4e7' : 'transparent'),
                        opacity: mb.opacity !== undefined ? mb.opacity : 1,
                        transform: `rotate(${mb.rotation || 0}deg)`,
                        position: 'absolute',
                    };

                    if (mb.type === 'image') {
                        return (
                            <div key={idx} style={bgStyle} className="overflow-hidden bg-zinc-100 border border-zinc-200 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
                                {mb.content ? (
                                    <img src={formatUrl(mb.content)} className="w-full h-full object-cover pointer-events-none" />
                                ) : (
                                    <div className="w-full h-full bg-zinc-200" />
                                )}
                            </div>
                        );
                    } else if (mb.type === 'shape') {
                        return (
                            <div
                                key={idx}
                                style={{
                                    ...bgStyle,
                                    backgroundColor: mb.color || '#bef264'
                                }}
                                className={`shadow-[0_2px_8px_rgba(0,0,0,0.06)] border ${isWhiteColor ? 'border-zinc-200' : 'border-transparent'}`}
                            />
                        );
                    } else {
                        return (
                            <div
                                key={idx}
                                style={{
                                    ...bgStyle,
                                    color: displayTextColor,
                                    fontFamily: mb.fontFamily || 'sans-serif',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    textAlign: 'center',
                                    overflow: 'hidden',
                                    lineHeight: 1.1,
                                    borderColor: 'transparent'
                                }}
                                className="px-0.5 select-none"
                            >
                                <span className={`font-black uppercase tracking-tighter truncate w-full text-center ${isLarge ? 'text-[9px]' : 'text-[4.5px]'}`}>
                                    {mb.content || 'Texto'}
                                </span>
                            </div>
                        );
                    }
                })}
            </div>
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/mural-prev:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-1.5 backdrop-blur-[1px]">
                <Pencil size={isLarge ? 18 : 12} className="text-accent animate-pulse" style={{ color: accent }} />
                <span className={`font-black uppercase tracking-[0.2em] text-accent`} style={{ color: accent, fontSize: isLarge ? '11px' : '8px' }}>
                    {onClick ? 'Editar Pizarrón' : 'Ver Pizarrón'} ({muralBlocks.length})
                </span>
            </div>
        </div>
    );
};

const MemoNode = React.memo(({ block, blocks = [], draggingId, onStart, isLinking, onStartConnecting, onCompleteConnection, onSelect, onDelete, activeNoteId, onSelectNote, onSelectGroup, onAnalyzeBlock, onAnalyzeGroup, isAnalyzing, showConnections = true, useInternalPosition = true, onLaunchMural, accent, hasConnections, onSelectConversation, onOpenNotebook, onResizeNodeComplete, setView, conversations = [], onNewChat }) => {
    const isImage = block.type === 'image' || block.type === 'relic';
    const isVideo = block.type === 'video';
    const isAudio = block.type === 'audio';
    const isInsight = block.type === 'insight';
    const isConversation = block.type === 'conversation';
    const hasMedia = block.content?.includes('[img]') || block.content?.includes('[vid]') || block.content?.includes('[aud]');
    const isActive = activeNoteId === block.id;
    const isChildNote = !!block.metadata?.parentId;

    const isDiaryEntry = block.entries && block.entries.length > 0;
    const isResonanceEntry = block.content && typeof block.content === 'string' && block.content.includes('[resonancia]');
    const isDiaryNotebook = block.type === 'diary_notebook';
    const isResonanceNotebook = block.type === 'resonance_notebook';
    const isConversationNotebook = block.type === 'conversation_notebook';

    const isDiaryAny = isDiaryEntry || isDiaryNotebook;
    const isResonanceAny = isResonanceEntry || isResonanceNotebook;
    const isLoopMapNode = block.type === 'loop_map_mini';

    const displayColor = (isConversation || isConversationNotebook) ? '#d946ef' : (isDiaryAny ? '#f59e0b' : (isResonanceAny ? '#a855f7' : (isLoopMapNode ? '#06b6d4' : (block.color && block.color !== '#bef264' ? block.color : accent))));

    const [localSize, setLocalSize] = useState({ width: block.width || null, height: block.height || null });

    React.useEffect(() => {
        if (block.width !== undefined || block.height !== undefined) {
            setLocalSize({ width: block.width || null, height: block.height || null });
        }
    }, [block.width, block.height]);

    const isCentralNode = isDiaryNotebook || isResonanceNotebook || isLoopMapNode || isConversationNotebook;

    // Track click vs drag
    const mouseDownPos = useRef({ x: 0, y: 0 });
    const handleNodeMouseDown = (e) => {
        mouseDownPos.current = { x: e.clientX, y: e.clientY };
    };

    const handleNodeClick = (e) => {
        const dist = Math.hypot(e.clientX - mouseDownPos.current.x, e.clientY - mouseDownPos.current.y);
        if (dist < 5) {
            e.stopPropagation();
            if (isLinking && onStartConnecting) {
                onStartConnecting(block.id);
            } else {
                if (block.type === 'diary_notebook' && onOpenNotebook) {
                    onOpenNotebook('diary');
                } else if (block.type === 'resonance_notebook' && onOpenNotebook) {
                    onOpenNotebook('resonance');
                } else if (block.type === 'conversation_notebook') {
                    const sortedConvs = (conversations || [])
                        .sort((a, b) => new Date(b.startTime || 0) - new Date(a.startTime || 0));
                    if (sortedConvs.length > 0) {
                        onSelectConversation(sortedConvs[0].id);
                    } else {
                        onNewChat();
                    }
                } else if (block.type === 'loop_map_mini') {
                    return; // No-op, its own button handles opening the archive
                } else {
                    onSelect(block); // Click: edit
                }
            }
        }
    };

    return (
        <div
            className={`select-none cursor-move active:cursor-grabbing group z-10 ${draggingId ? (draggingId === block.id ? 'transition-none scale-105 z-50' : 'transition-none z-10') : 'transition-transform duration-300 scale-100 hover:scale-105'} ${isLinking ? `hover:scale-105 ring-2 ring-transparent hover:ring-accent/40 ${isChildNote ? 'rounded-[1.75rem]' : 'rounded-[2.5rem]'}` : ''} ${useInternalPosition ? 'absolute' : 'relative'}`}
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
                className={`relative flex flex-col ${isChildNote ? 'rounded-[1.25rem]' : 'rounded-[2.5rem]'} border shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden ${isConversation ? 'bg-[#0f0914] border-purple-500/20' : (isInsight || isResonanceAny ? 'insight-block' : (isDiaryAny ? 'bg-gradient-to-br from-[#1c120c] to-[#0e0906] border-amber-500/30' : (isLoopMapNode ? 'bg-[#050e14] border-cyan-500/30' : 'bg-gradient-to-br from-[#121214] to-[#080809] border-white/5')))} ${draggingId ? 'transition-none' : 'transition-all duration-300'} ${draggingId === block.id ? 'border-accent ring-1 ring-accent/20' : (isActive ? 'border-accent shadow-[0_0_20px_rgba(var(--accent-rgb),0.4)]' : (isDiaryAny ? 'border-amber-500/20 hover:border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.1)]' : (isLoopMapNode ? 'border-cyan-500/20 hover:border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.1)]' : 'border-white/5 hover:border-white/10')))} ${(draggingId !== block.id && !hasConnections) ? 'ctr-node-float' : ''}`}
                style={{
                    width: localSize.width ? `${localSize.width}px` : (block.type === 'loop_map_mini' ? '850px' : (isCentralNode ? '480px' : (isChildNote ? '160px' : '288px'))),
                    height: localSize.height ? `${localSize.height}px` : (block.type === 'loop_map_mini' ? '700px' : (isCentralNode ? '600px' : (isChildNote ? '160px' : '288px'))),
                    minWidth: isChildNote ? '160px' : '288px',
                    minHeight: isChildNote ? '160px' : '288px',
                    maxWidth: '1200px',
                    maxHeight: '1200px',
                    '--accent-rgb': hexToRgb(displayColor)
                }}
            >
                {/* OP HEADER (SUBTLE TERMINAL STYLE) */}
                <div className={`${isChildNote ? 'h-4 px-2 bg-black/60' : 'h-6 px-4 bg-black/40'} flex items-center justify-between border-b border-white/5`} style={{ borderTop: `2px solid ${isInsight || isResonanceAny ? 'var(--insight-purple)' : displayColor}` }}>
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
                            {isDiaryAny ? 'OP_DIARIO' : `OP_${block.type.toUpperCase()}`}
                        </span>
                    </div>
                    <div className="flex gap-1 items-center">
                        <button
                            onClick={(e) => { e.stopPropagation(); onAnalyzeBlock?.(block.id); }}
                            className={`${isChildNote ? 'p-0.5' : 'p-1.5'} hover:bg-accent/20 rounded transition-all text-accent group/spark`}
                            title="Analizar con IA (Invisible)"
                        >
                            <Sparkles size={isChildNote ? 8 : 12} className={`${isAnalyzing ? 'animate-spin' : 'group-hover/spark:animate-spin-slow'} transition-transform`} />
                        </button>

                        <button
                            onClick={(e) => { e.stopPropagation(); onSelect(block); }}
                            className={`${isChildNote ? 'p-0.5' : 'p-1.5'} hover:bg-white/10 rounded transition-all text-zinc-500 hover:text-white`}
                            title="Editar"
                        >
                            <Edit2 size={isChildNote ? 7 : 10} />
                        </button>

                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(block.id); }}
                            className={`${isChildNote ? 'p-0.5' : 'p-1.5'} hover:bg-red-500/20 rounded transition-all text-zinc-500 hover:text-red-500 group/del`}
                            title="Eliminar Permanente"
                        >
                            <Trash2 size={isChildNote ? 7 : 10} className="group-hover/del:scale-110 transition-transform" />
                        </button>
                    </div>
                </div>

                <div className={`${isChildNote ? 'p-2.5' : 'p-6'} flex-1 flex flex-col min-h-0`}>
                    {isConversation ? (() => {
                        let parsedMsgs = [];
                        try {
                            parsedMsgs = JSON.parse(block.content) || [];
                        } catch (e) { parsedMsgs = []; }
                        return (
                            <div className="relative flex-1 flex flex-col min-h-0">
                                {/* TITULO DE LA CONVERSACION */}
                                <h3 className="text-xl font-black italic uppercase tracking-tighter leading-none mb-3 text-purple-400 truncate shrink-0">
                                    {block.caption || 'Diálogo Kio'}
                                </h3>

                                <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-1 py-1 min-h-0">
                                    {parsedMsgs.slice(-2).map((msg, idx) => (
                                        <div key={idx} className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                            <span className="text-[6px] font-black uppercase tracking-widest text-zinc-500">
                                                {msg.role === 'user' ? 'Tú' : 'Kio'}
                                            </span>
                                            <p className={`text-[10px] leading-snug rounded-2xl px-3 py-1.5 font-sans ${msg.role === 'user'
                                                ? 'bg-purple-950/45 border border-purple-800/40 text-purple-300 text-right rounded-tr-none'
                                                : 'bg-white/5 border border-white/5 text-white/80 rounded-tl-none'
                                                } max-w-[90%] line-clamp-2`}>
                                                {msg.content}
                                            </p>
                                        </div>
                                    ))}
                                    {parsedMsgs.length === 0 && (
                                        <div className="flex-1 flex flex-col items-center justify-center opacity-25 py-8">
                                            <Sparkles size={16} className="animate-pulse mb-1 text-purple-400" />
                                            <span className="text-[7px] font-black uppercase tracking-widest">Conversación Vacía</span>
                                        </div>
                                    )}
                                </div>

                                {/* BOTON DE ABRIR CHAT */}
                                <div className="pt-3 border-t border-white/5 mt-auto">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (onSelectConversation) onSelectConversation(block.id);
                                        }}
                                        className="w-full py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-xl text-[7px] font-black uppercase tracking-[0.3em] text-purple-400 transition-all flex items-center justify-center gap-1.5 pointer-events-auto"
                                    >
                                        <MessageSquare size={10} /> Abrir Diálogo
                                    </button>
                                </div>
                            </div>
                        );
                    })() : block.type === 'text' || block.type === 'insight' || block.type === 'diary_notebook' || block.type === 'resonance_notebook' || block.type === 'loop_map_mini' || block.type === 'conversation_notebook' ? (
                        <div className="relative group/text flex-1 flex flex-col min-h-0">
                            {/* TITULO DE LA NOTA (GRANDE) */}
                            <h3 className={`${isChildNote ? 'text-sm mb-1.5' : 'text-xl mb-3'} font-black italic uppercase tracking-tighter leading-none ${isDiaryAny ? 'text-amber-500 font-serif' : block.type === 'conversation_notebook' ? 'text-purple-500' : 'text-white'} truncate shrink-0`}>
                                {isDiaryAny ? (block.caption || 'Diario Personal') : block.type === 'conversation_notebook' ? (block.caption || 'Diálogos Recientes') : (block.caption || 'Fragmento Oasis')}
                            </h3>

                            {block.muralBlocks && block.muralBlocks.length > 0 && (
                                <div className="shrink-0 mb-3">
                                    <div className="flex items-center gap-1.5 text-accent shrink-0 select-none mb-1 animate-pulse">
                                        <Grid size={10} />
                                        <span className="text-[7.5px] font-black uppercase tracking-[0.2em]">{block.muralBlocks.length} Capas Mural</span>
                                    </div>
                                    <MiniMuralPreview
                                        muralBlocks={block.muralBlocks}
                                        accent={displayColor}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (onLaunchMural) onLaunchMural(block.id);
                                        }}
                                        size="sm"
                                    />
                                </div>
                            )}

                            {/* DIARY ENTRIES vs SINGLE CONTENT */}
                            {block.entries && block.entries.length > 0 ? (
                                <div className={`space-y-8 ${isDiaryAny ? 'max-h-[380px]' : 'max-h-[250px]'} overflow-y-auto custom-scroll pr-1 py-2 relative`}>
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
                                <div className="flex-1 overflow-hidden relative opacity-90 group-hover/text:opacity-100 transition-opacity">
                                    {block.type === 'diary_notebook' ? (
                                        <div className="flex flex-col h-full w-full relative group/notebook pointer-events-auto">
                                            <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-2">
                                                {(() => {
                                                    const diaryBlocks = (blocks || []).filter(b => b.entries && b.entries.length > 0)
                                                        .sort((a, b) => new Date(b.metadata?.timestamp || 0) - new Date(a.metadata?.timestamp || 0));
                                                    if (diaryBlocks.length === 0) return (
                                                        <div className="flex flex-col items-center justify-center h-full w-full opacity-50 pt-8">
                                                            <StickyNote size={24} className="text-amber-500 mb-2" />
                                                            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-amber-500">Sin Entradas</span>
                                                        </div>
                                                    );
                                                    return diaryBlocks.map(db => (
                                                        <div key={db.id} className="w-full p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20 hover:border-amber-500/50 transition-colors">
                                                            <div className="text-amber-400 text-[10px] font-black uppercase truncate">{db.caption || 'Entrada'}</div>
                                                            <div className="text-[8px] text-amber-500/50 font-mono mt-1">{new Date(db.metadata?.timestamp || Date.now()).toLocaleDateString()}</div>
                                                        </div>
                                                    ));
                                                })()}
                                            </div>
                                            <div className="pt-2 mt-auto border-t border-amber-500/10">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); if (onOpenNotebook) onOpenNotebook('diary'); }}
                                                    className="w-full py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl text-[8px] font-black uppercase tracking-[0.3em] text-amber-400 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <StickyNote size={12} /> Abrir Diario Completo
                                                </button>
                                            </div>
                                        </div>
                                    ) : block.type === 'resonance_notebook' ? (
                                        <div className="flex flex-col h-full w-full relative group/notebook pointer-events-auto">
                                            <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-2">
                                                {(() => {
                                                    const resonanceBlocks = (blocks || []).filter(b => b.type === 'text' && b.content && b.content.includes('[resonancia]'))
                                                        .sort((a, b) => new Date(b.metadata?.timestamp || 0) - new Date(a.metadata?.timestamp || 0));
                                                    if (resonanceBlocks.length === 0) return (
                                                        <div className="flex flex-col items-center justify-center h-full w-full opacity-50 pt-8">
                                                            <Sparkles size={24} className="text-purple-500 mb-2" />
                                                            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-purple-500">Sin Ruidos</span>
                                                        </div>
                                                    );
                                                    return resonanceBlocks.map(rb => (
                                                        <div key={rb.id} className="w-full p-3 rounded-2xl bg-purple-500/5 border border-purple-500/20 hover:border-purple-500/50 transition-colors">
                                                            <div className="text-purple-400 text-[10px] font-black uppercase truncate">{rb.caption || 'Ruido'}</div>
                                                            <div className="text-[8px] text-purple-500/50 font-mono mt-1">{new Date(rb.metadata?.timestamp || Date.now()).toLocaleDateString()}</div>
                                                        </div>
                                                    ));
                                                })()}
                                            </div>
                                            <div className="pt-2 mt-auto border-t border-purple-500/10">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); if (onOpenNotebook) onOpenNotebook('resonance'); }}
                                                    className="w-full py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-xl text-[8px] font-black uppercase tracking-[0.3em] text-purple-400 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <Sparkles size={12} /> Analizar Ruidos
                                                </button>
                                            </div>
                                        </div>
                                    ) : block.type === 'conversation_notebook' ? (
                                        <div className="flex flex-col h-full w-full relative group/notebook pointer-events-auto">
                                            <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-2">
                                                {(() => {
                                                    const recentConversations = (conversations || [])
                                                        .sort((a, b) => new Date(b.startTime || 0) - new Date(a.startTime || 0));
                                                    if (recentConversations.length === 0) return (
                                                        <div className="flex flex-col items-center justify-center h-full w-full opacity-50 pt-8">
                                                            <MessageSquare size={24} className="text-purple-500 mb-2" />
                                                            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-purple-500">Sin Diálogos</span>
                                                        </div>
                                                    );
                                                    return recentConversations.slice(0, 10).map(c => (
                                                        <div
                                                            key={c.id}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (onSelectConversation) onSelectConversation(c.id);
                                                            }}
                                                            className="w-full p-3 rounded-2xl bg-purple-500/5 border border-purple-500/20 hover:border-purple-500/50 hover:bg-purple-500/10 cursor-pointer transition-colors"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: c.color || '#d946ef' }} />
                                                                <div className="text-purple-400 text-[10px] font-black uppercase truncate flex-1">{c.title || 'Diálogo'}</div>
                                                            </div>
                                                            <div className="text-[8px] text-purple-500/50 font-mono mt-1 pl-3.5">
                                                                {c.messages && c.messages.length > 0 ? `${c.messages.length} mensajes` : 'Sin mensajes'}
                                                                {c.startTime && ` • ${new Date(c.startTime).toLocaleDateString()}`}
                                                            </div>
                                                        </div>
                                                    ));
                                                })()}
                                            </div>
                                            <div className="pt-2 mt-auto border-t border-purple-500/10">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (onNewChat) onNewChat();
                                                    }}
                                                    className="w-full py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-xl text-[8px] font-black uppercase tracking-[0.3em] text-purple-400 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <Plus size={12} /> Nuevo Diálogo
                                                </button>
                                            </div>
                                        </div>
                                    ) : block.type === 'loop_map_mini' ? (() => {
                                        let patientNodes = [];
                                        let patientEdges = [];
                                        try {
                                            patientNodes = JSON.parse(localStorage.getItem('oasis_canvas_nodes_' + user)) || [];
                                            patientEdges = JSON.parse(localStorage.getItem('oasis_canvas_edges_' + user)) || [];
                                        } catch (e) {}

                                        const hasLocalMap = patientNodes.length > 0;

                                        return (
                                            <div className="flex flex-col h-full w-full relative group/notebook pointer-events-auto">
                                                {hasLocalMap ? (() => {
                                                    let minX = 0, minY = 0, width = 800, height = 600;
                                                    let minNodeX = Infinity, minNodeY = Infinity, maxNodeX = -Infinity, maxNodeY = -Infinity;
                                                    patientNodes.forEach(n => {
                                                        const w = n.width || 120;
                                                        const h = n.height || 120;
                                                        if (n.x < minNodeX) minNodeX = n.x;
                                                        if (n.y < minNodeY) minNodeY = n.y;
                                                        if (n.x + w > maxNodeX) maxNodeX = n.x + w;
                                                        if (n.y + h > maxNodeY) maxNodeY = n.y + h;
                                                    });
                                                    const padding = 60;
                                                    minX = minNodeX - padding;
                                                    minY = minNodeY - padding;
                                                    width = (maxNodeX - minNodeX) + padding * 2;
                                                    height = (maxNodeY - minNodeY) + padding * 2;

                                                    const drawGravityLine = (x1, y1, x2, y2) => {
                                                        const dx = x2 - x1;
                                                        const dy = y2 - y1;
                                                        const cp1x = x1 + dx * 0.1;
                                                        const cp1y = y1 + dy * 0.7;
                                                        const cp2x = x2 - dx * 0.1;
                                                        const cp2y = y2 - dy * 0.3;
                                                        return `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
                                                    };

                                                    return (
                                                        <div className="flex-1 overflow-hidden p-2 relative flex flex-col items-center justify-center text-center w-full h-full min-h-0 bg-[#09090b]/40 rounded-xl">
                                                            <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                                                            <svg viewBox={`${minX} ${minY} ${width} ${height}`} className="w-full h-full z-10 relative select-none">
                                                                {patientEdges.map((edge, i) => {
                                                                    const source = patientNodes.find(n => n.id === edge.source);
                                                                    const target = patientNodes.find(n => n.id === edge.target);
                                                                    if (!source || !target) return null;

                                                                    const sx = source.x + (source.width || 120) / 2;
                                                                    const sy = source.y + (source.height || 120);
                                                                    const tx = target.x + (target.width || 120) / 2;
                                                                    const ty = target.y;

                                                                    const pathString = drawGravityLine(sx, sy, tx, ty);
                                                                    
                                                                    return (
                                                                        <g key={i}>
                                                                            <path d={pathString} fill="none" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="4" />
                                                                            <path d={pathString} fill="none" stroke={edge.color || 'rgba(255, 255, 255, 0.3)'} strokeWidth="1" />
                                                                        </g>
                                                                    );
                                                                })}

                                                                {patientNodes.map(node => {
                                                                    const isContext = node.type === 'CONTEXT';
                                                                    const isState = node.type === 'INTERNAL_STATE' || node.type === 'MACRO_MECHANISM';
                                                                    const isSymptom = node.type === 'CRITICAL_SYMPTOM';
                                                                    const isChain = node.type === 'IMPACT_CHAIN';

                                                                    let strokeColor = 'rgba(255,255,255,0.15)';
                                                                    let bgColor = 'rgba(24, 24, 27, 0.4)';
                                                                    let textColor = 'rgba(255, 255, 255, 0.8)';
                                                                    let title = 'NODO';

                                                                    if (isContext) {
                                                                        strokeColor = '#0ea5e9';
                                                                        bgColor = 'rgba(3, 105, 161, 0.2)';
                                                                        textColor = '#bae6fd';
                                                                        title = 'CONTEXTO INICIAL';
                                                                    } else if (isState) {
                                                                        strokeColor = '#10b981';
                                                                        bgColor = 'rgba(4, 120, 87, 0.2)';
                                                                        textColor = '#a7f3d0';
                                                                        title = node.type === 'MACRO_MECHANISM' ? 'MACRO MECANISMO' : 'ESTADO INTERNO';
                                                                    } else if (isSymptom) {
                                                                        strokeColor = '#ef4444';
                                                                        bgColor = 'rgba(185, 28, 28, 0.2)';
                                                                        textColor = '#fecaca';
                                                                        title = 'SÍNTOMA CRÍTICO';
                                                                    } else if (isChain) {
                                                                        strokeColor = '#71717a';
                                                                        bgColor = 'rgba(63, 63, 70, 0.2)';
                                                                        textColor = '#e4e4e7';
                                                                        title = 'CADENA DE IMPACTO';
                                                                    }

                                                                    const cx = node.x + (node.width || 120) / 2;
                                                                    const cy = node.y + (node.height || 120) / 2;
                                                                    const rx = (node.width || 120) / 2;
                                                                    const ry = (node.height || 120) / 2;

                                                                    return (
                                                                        <g key={node.id}>
                                                                            <ellipse cx={cx} cy={cy} rx={rx + 8} ry={ry + 8} fill={strokeColor} className="opacity-[0.02]" />
                                                                            
                                                                            {isContext && (
                                                                                <polygon 
                                                                                    points={`${cx},${node.y} ${node.x + (node.width || 120)},${cy} ${cx},${node.y + (node.height || 120)} ${node.x},${cy}`}
                                                                                    fill={bgColor}
                                                                                    stroke={strokeColor}
                                                                                    strokeWidth="1"
                                                                                />
                                                                            )}
                                                                            {isState && (
                                                                                <ellipse 
                                                                                    cx={cx} cy={cy} rx={rx} ry={ry}
                                                                                    fill={bgColor}
                                                                                    stroke={strokeColor}
                                                                                    strokeWidth="1"
                                                                                />
                                                                            )}
                                                                            {(isSymptom || isChain) && (
                                                                                <rect 
                                                                                    x={node.x} y={node.y} width={node.width || 120} height={node.height || 120} rx="12" ry="12"
                                                                                    fill={bgColor}
                                                                                    stroke={strokeColor}
                                                                                    strokeWidth="1"
                                                                                />
                                                                            )}

                                                                            <text 
                                                                                x={cx} y={node.y - 8} 
                                                                                textAnchor="middle" 
                                                                                className="text-[6px] font-bold font-mono tracking-widest fill-zinc-500 uppercase select-none"
                                                                            >
                                                                                {title}
                                                                            </text>

                                                                            <foreignObject 
                                                                                x={node.x + 6} y={node.y + 6} 
                                                                                width={(node.width || 120) - 12} height={(node.height || 120) - 12}
                                                                            >
                                                                                <div className="w-full h-full flex items-center justify-center text-center p-1 overflow-hidden select-none">
                                                                                    <span 
                                                                                        className="text-[7px] font-black uppercase tracking-wider leading-relaxed font-mono"
                                                                                        style={{ color: textColor }}
                                                                                    >
                                                                                        {node.label}
                                                                                    </span>
                                                                                </div>
                                                                            </foreignObject>
                                                                        </g>
                                                                    );
                                                                })}
                                                            </svg>
                                                        </div>
                                                    );
                                                })() : (
                                                    <div className="flex-1 overflow-hidden p-6 relative flex flex-col items-center justify-center text-center">
                                                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #06b6d4 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                                                        <Compass size={48} className="text-zinc-600 mb-6 animate-pulse" />
                                                        <h3 className="text-2xl font-black italic uppercase text-white/40 tracking-widest text-center mb-4">
                                                            Sin Cartografía Asignada
                                                        </h3>
                                                        <p className="text-[10px] font-mono text-zinc-500 max-w-[80%] leading-relaxed">
                                                            AÚN NO HAY UN MAPA DE BUCLES DISPONIBLE PARA TU IDENTIDAD. EL MAPA GENERADO Y PUBLICADO POR EL ESPECIALISTA CLÍNICO DESDE TU PERFIL APARECERÁ AQUÍ.
                                                        </p>
                                                    </div>
                                                )}
                                                <div className="pt-2 mt-auto border-t border-cyan-500/10">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setView('soul'); }}
                                                        className="w-full py-4 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <Aperture size={14} /> Abrir Archivo del Alma
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    }
                                    ) : (
                                        <>
                                            <SimpleNarrativeRenderer content={block.type === 'insight' ? `[insight] ${block.content}` : block.content} isChild={isChildNote} />
                                            <div className={`absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t ${isInsight || isResonanceAny ? 'from-[#0d0d0e]' : (isDiaryAny ? 'from-[#0e0906]' : 'from-[#0b0b0c]')} to-transparent pointer-events-none`} />
                                        </>
                                    )}
                                </div>
                            )}

                            {(() => {
                                const childNotes = (blocks || []).filter(b => b.metadata?.parentId === block.id);
                                if (childNotes.length === 0 || isChildNote) return null;
                                return (
                                    <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[8px] font-mono font-black uppercase tracking-[0.1em] text-accent shrink-0">
                                        <div className="flex items-center gap-1">
                                            <FileText size={10} className="animate-pulse" style={{ color: displayColor }} />
                                            <span style={{ color: displayColor }}>{childNotes.length} {childNotes.length === 1 ? 'Subpágina' : 'Subpáginas'}</span>
                                        </div>
                                        <div className="flex gap-1 max-w-[150px] overflow-hidden text-zinc-500 truncate normal-case font-sans italic opacity-75">
                                            {childNotes.map(c => c.caption || 'Sin título').join(', ')}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    ) : isImage ? (
                        <div className="flex-1 w-full rounded-xl overflow-hidden border border-white/5 relative">
                            <img src={formatUrl(block.content)} className="absolute inset-0 w-full h-full object-cover" />
                        </div>
                    ) : isVideo ? (
                        <div className="flex-1 w-full rounded-xl overflow-hidden border border-white/5 relative">
                            <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover" src={formatUrl(block.content)} />
                        </div>
                    ) : isAudio ? (
                        <div className="flex flex-col gap-4 py-2">
                            <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
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
                    <div className={`${isChildNote ? 'py-1' : 'py-3'} flex justify-center items-center border-t border-white/5 bg-black/40 mt-auto shrink-0`}>
                        <div
                            className="port group/port flex flex-col items-center gap-1 cursor-crosshair relative"
                            onClick={(e) => {
                                e.stopPropagation();
                                onStartConnecting(block.id);
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
                {/* Resize Handle */}
                <div
                    className="absolute bottom-0 right-0 w-8 h-8 cursor-se-resize z-50 flex items-end justify-end p-2 opacity-0 hover:opacity-100 transition-opacity"
                    onMouseDown={(e) => {
                        e.stopPropagation();
                        const startX = e.clientX;
                        const startY = e.clientY;
                        const startWidth = e.currentTarget.parentElement.offsetWidth;
                        const startHeight = e.currentTarget.parentElement.offsetHeight;

                        const handleMouseMove = (moveEvent) => {
                            // Assuming cam scale is handled mostly visually, but here we calculate pixel delta 
                            const newWidth = Math.max(288, startWidth + (moveEvent.clientX - startX));
                            const newHeight = Math.max(288, startHeight + (moveEvent.clientY - startY));
                            setLocalSize({ width: newWidth, height: newHeight });
                        };

                        const handleMouseUp = (upEvent) => {
                            document.removeEventListener('mousemove', handleMouseMove);
                            document.removeEventListener('mouseup', handleMouseUp);
                            const finalWidth = Math.max(288, startWidth + (upEvent.clientX - startX));
                            const finalHeight = Math.max(288, startHeight + (upEvent.clientY - startY));
                            if (onResizeNodeComplete) onResizeNodeComplete(block.id, finalWidth, finalHeight);
                        };

                        document.addEventListener('mousemove', handleMouseMove);
                        document.addEventListener('mouseup', handleMouseUp);
                    }}
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500 hover:text-white"><polyline points="21 15 21 21 15 21"></polyline><line x1="21" y1="21" x2="15" y2="15"></line><polyline points="9 3 3 3 3 9"></polyline><line x1="3" y1="3" x2="9" y2="9"></line></svg>
                </div>
            </div>
        </div>
    );
});

// NekronomikronFull has been refactored to src/components/Nekronomikron.jsx

// OasisPlayer has been refactored to src/components/Nekronomikron.jsx
const PHENOM_PART_A = [
    {
        key: "antecedentes_origen",
        title: "Origen y Reglas Invisibles",
        question: "Si tuvieras que mirar atrás, ¿cómo describirías las reglas invisibles o las dinámicas con las que creciste en tu hogar?",
        placeholder: "Habla de lo que se esperaba de ti, el manejo de los errores o los vínculos familiares..."
    },
    {
        key: "experiencia_insuficiencia",
        title: "Experiencia de Insuficiencia",
        question: "Hay momentos donde sentimos que la situación nos supera. ¿En qué escenarios de tu vida diaria aparece ese sentimiento de 'no ser o no hacer lo suficiente'?",
        placeholder: "Piensa en el trabajo, proyectos o relaciones donde aparece la parálisis o autoexigencia..."
    },
    {
        key: "temporalidad_vivida",
        title: "Temporalidad Vivida",
        question: "¿Cómo es tu relación con el tiempo en este momento de tu vida? ¿Cómo lo experimentas?",
        placeholder: "¿Sientes que se te escapa, que te presiona constantemente o que estás estancado?"
    },
    {
        key: "premisa_realidad",
        title: "Premisa de Realidad",
        question: "Si tuvieras que resumirlo en una certeza íntima... para ti, ¿cuál es el punto de existir y qué te empuja a hacer lo que haces cada día?",
        placeholder: "Tu motor principal, o si sientes que avanzas en automático sin un sentido claro..."
    }
];

const PHENOM_PART_B = [
    { id: 1, domain: "Afectividad Negativa", text: "Me preocupo por casi todo." },
    { id: 2, domain: "Afectividad Negativa", text: "Me asusto o me alarmo con mucha facilidad." },
    { id: 3, domain: "Afectividad Negativa", text: "Me pongo muy ansioso/a cuando las cosas son inciertas o impredecibles." },
    { id: 4, domain: "Afectividad Negativa", text: "Me irrito fácilmente por todo tipo de cosas." },
    { id: 5, domain: "Afectividad Negativa", text: "Mis emociones a veces cambian de un momento a otro sin motivo aparente." },
    { id: 6, domain: "Desapego", text: "Prefiero estar solo/a que acompañado/a." },
    { id: 7, domain: "Desapego", text: "Mantengo mi distancia emocional de la gente." },
    { id: 8, domain: "Desapego", text: "Me cuesta mucho disfrutar de las cosas de la vida." },
    { id: 9, domain: "Desapego", text: "Rara vez me involucro emocionalmente con los demás." },
    { id: 10, domain: "Desapego", text: "Evito hacer nuevos amigos o conocer gente nueva." },
    { id: 11, domain: "Antagonismo", text: "A menudo tengo que manipular a la gente para conseguir lo que quiero." },
    { id: 12, domain: "Antagonismo", text: "Siento que soy mejor o más importante que casi todo el mundo." },
    { id: 13, domain: "Antagonismo", text: "Disfruto aprovechándome de los demás si se presenta la oportunidad." },
    { id: 14, domain: "Antagonismo", text: "No me importa herir los sentimientos de otros si eso me beneficia." },
    { id: 15, domain: "Antagonismo", text: "Creo que para salir adelante, a veces tienes que engañar a la gente." },
    { id: 16, domain: "Desinhibición", text: "A menudo actúo de inmediato sin pensar en las consecuencias." },
    { id: 17, domain: "Desinhibición", text: "Hago las cosas en el momento sin planearlas en absoluto." },
    { id: 18, domain: "Desinhibición", text: "A menudo rompo mis promesas o no cumplo con mis acuerdos." },
    { id: 19, domain: "Desinhibición", text: "Me aburro rápidamente de las tareas y pierdo el interés." },
    { id: 20, domain: "Desinhibición", text: "Tomo decisiones precipitadas en el calor del momento." },
    { id: 21, domain: "Psicoticismo", text: "A menudo tengo pensamientos que no tienen sentido para los demás." },
    { id: 22, domain: "Psicoticismo", text: "He tenido experiencias extrañas que son muy difíciles de explicar." },
    { id: 23, domain: "Psicoticismo", text: "A veces siento que las cosas a mi alrededor no son reales." },
    { id: 24, domain: "Psicoticismo", text: "La gente suele pensar que mi forma de ser o hablar es excéntrica o rara." },
    { id: 25, domain: "Psicoticismo", text: "A veces escucho o veo cosas que los demás no pueden percibir." }
];

const PHENOM_QUESTIONS = [
    {
        id: 1,
        title: "Mecanismo Existencial",
        text: "¿Cómo experimentas la mayor parte del tiempo tu presencia individual en el flujo cotidiano?",
        options: [
            { key: "A", text: "Como un observador desapegado que analiza los acontecimientos desde fuera." },
            { key: "B", text: "Como una tensión constante entre el deseo de fusión con otros y el miedo a perderme." },
            { key: "C", text: "Como una lucha activa por imponer orden y control sobre un entorno caótico." },
            { key: "D", text: "Como un flujo de impulsos creativos que a veces colapsa ante la falta de dirección." }
        ]
    },
    {
        id: 2,
        title: "Dinámica de Parálisis",
        text: "Cuando te encuentras ante un bloqueo o parálisis emocional, ¿cuál suele ser la raíz primaria?",
        options: [
            { key: "A", text: "El miedo a la imperfección o a fallar ante mis propios estándares implacables." },
            { key: "B", text: "La sensación de vacío o de que mis esfuerzos carecen de un propósito trascendental." },
            { key: "C", text: "La sobrecarga atencional al intentar sostener demasiadas posibilidades simultáneamente." },
            { key: "D", text: "El repliegue automático hacia fantasías internas para evadir el peso del mundo físico." }
        ]
    },
    {
        id: 3,
        title: "Modulación del Tiempo",
        text: "¿Cómo modula el tiempo tu experiencia psicológica actual?",
        options: [
            { key: "A", text: "Vivo en anticipación ansiosa del futuro, planificando bucles infinitos para evitar sorpresas." },
            { key: "B", text: "Quedo atrapado en la nostalgia o el análisis retrospectivo de decisiones pasadas." },
            { key: "C", text: "Siento que el presente transcurre con excesiva rapidez y sin tiempo para integrar mis vivencias." },
            { key: "D", text: "Experimento el tiempo de forma fragmentada, alternando entre hiperactividad y estancamiento." }
        ]
    },
    {
        id: 4,
        title: "La Mirada del Otro",
        text: "¿De qué manera influye la mirada del otro en tus bloqueos internos?",
        options: [
            { key: "A", text: "Como un juez implacable que activa mi necesidad de autosuficiencia radical." },
            { key: "B", text: "Como un ancla necesaria de la que dependo para validar mi existencia." },
            { key: "C", text: "Como una perturbación de mi espacio mental de la cual prefiero retirarme físicamente." },
            { key: "D", text: "Como un juego de espejos donde tiendo a proyectar mis propias inseguridades reprimidas." }
        ]
    },
    {
        id: 5,
        title: "Anhelo de Armonía",
        text: "¿Qué describe mejor tu idea de armonía o liberación mental?",
        options: [
            { key: "A", text: "La quietud analítica, donde puedo silenciar el ruido del pensamiento racional." },
            { key: "B", text: "La conexión profunda e incondicional con el arte, la naturaleza o un alma afín." },
            { key: "C", text: "La auto-realización soberana, actuando con total autonomía sin miedo al rechazo." },
            { key: "D", text: "La integración fluida de mis contradicciones internas sin juzgarlas como defectos." }
        ]
    }
];


const ProfileView = ({
    user, soulPieces, blocks, setBlocks, syncBlocks, accent, isEditingProfile, setIsEditingProfile,
    deleteBlock, deleteBlocks,
    isLinking, setIsLinking, links, linkSource, setLinkSource,
    completeConnection, removeConnection, synthesizeLinks, mouseCanvasPos,
    editBlock, handleSelectNote, togglePublic, activeNoteId,
    handleAnalyzeGroup, handleAnalyzeBlock, isChatLoading, onSoulPieceImageChange,
    setView, playlists, setPlayQueue, setCurrentTrack, setIsPlaying,
    avatar, setAvatar, calculatedResults, noteKeywords, bgType, bgValue,
    conversations, setConversations, handleSelectConversation,
    onSaveProfile, onNewChat, onOpenNotebook, setActiveTest, setIsSettingsOpen
}) => {
    const [bio, setBio] = useState(() => localStorage.getItem('oasis_bio_' + user) || 'Explorador del Oasis // Tejiendo ideas y resonancias en el éter digital.');
    const [fullName, setFullName] = useState(() => localStorage.getItem('oasis_fullname_' + user) || user || 'Oasis Explorer');
    const [coverImage, setCoverImage] = useState(() => localStorage.getItem('oasis_cover_' + user) || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop');

    React.useEffect(() => {
        const profileBlock = blocks.find(b => b.id === 'profile_settings');
        if (profileBlock) {
            try {
                const data = JSON.parse(profileBlock.content);
                if (data.bio !== undefined) {
                    setBio(data.bio || '');
                    localStorage.setItem('oasis_bio_' + user, data.bio || '');
                }
                if (data.fullName !== undefined) {
                    setFullName(data.fullName || '');
                    localStorage.setItem('oasis_fullname_' + user, data.fullName || '');
                }
                if (data.coverImage !== undefined) {
                    setCoverImage(data.coverImage || '');
                    localStorage.setItem('oasis_cover_' + user, data.coverImage || '');
                }
                if (data.avatar !== undefined) {
                    setAvatar(data.avatar || '');
                    localStorage.setItem('oasis_avatar_' + user, data.avatar || '');
                }
                return;
            } catch (e) {
                console.error("Error parsing profile settings:", e);
            }
        }

        setBio(localStorage.getItem('oasis_bio_' + user) || 'Explorador del Oasis // Tejiendo ideas y resonancias en el éter digital.');
        setFullName(localStorage.getItem('oasis_fullname_' + user) || user || 'Oasis Explorer');
        setCoverImage(localStorage.getItem('oasis_cover_' + user) || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop');
    }, [user, blocks, setAvatar]);

    const [releaseTab, setReleaseTab] = useState('all');
    const [selectedIds, setSelectedIds] = useState([]);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [dragOverId, setDragOverId] = useState(null);
    const fileInputRef = useRef(null);
    const coverInputRef = useRef(null);

    const handleReorderBlocks = (draggedId, targetId) => {
        if (draggedId === targetId) return;
        const draggedBlock = blocks.find(b => b.id === draggedId);
        if (!draggedBlock) return;

        const newBlocks = blocks.filter(b => b.id !== draggedId);

        if (targetId === 'FEED_END') {
            newBlocks.push(draggedBlock);
            setBlocks(newBlocks);
            syncBlocks(newBlocks);
            return;
        }

        const visualDraggedIdx = filteredReleases.findIndex(b => b.id === draggedId);
        const visualTargetIdx = filteredReleases.findIndex(b => b.id === targetId);
        if (visualDraggedIdx === -1 || visualTargetIdx === -1) return;

        const targetBlockIndex = newBlocks.findIndex(b => b.id === targetId);

        if (targetBlockIndex !== -1) {
            const insertIdx = visualDraggedIdx < visualTargetIdx ? targetBlockIndex + 1 : targetBlockIndex;
            newBlocks.splice(insertIdx, 0, draggedBlock);
        } else {
            let found = false;
            for (let i = visualTargetIdx; i < filteredReleases.length; i++) {
                const item = filteredReleases[i];
                if (!item.isVirtual && item.id !== draggedId) {
                    const idx = newBlocks.findIndex(b => b.id === item.id);
                    if (idx !== -1) {
                        newBlocks.splice(idx, 0, draggedBlock);
                        found = true;
                        break;
                    }
                }
            }
            if (!found) {
                for (let i = visualTargetIdx; i >= 0; i--) {
                    const item = filteredReleases[i];
                    if (!item.isVirtual && item.id !== draggedId) {
                        const idx = newBlocks.findIndex(b => b.id === item.id);
                        if (idx !== -1) {
                            newBlocks.splice(idx + 1, 0, draggedBlock);
                            found = true;
                            break;
                        }
                    }
                }
            }
            if (!found) {
                newBlocks.push(draggedBlock);
            }
        }

        setBlocks(newBlocks);
        syncBlocks(newBlocks);
    };

    const handleCardClick = (id) => {
        if (isSelectionMode) {
            setSelectedIds(prev =>
                prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
            );
        } else {
            const block = blocks.find(b => b.id === id) || virtualConvBlocks.find(c => c.id === id);
            if (!block) return;
            if (block.type === 'conversation' || block.isVirtual) {
                handleSelectConversation(block.id);
            } else if (block.type === 'diary_notebook') {
                setActiveNotebook('diary');
            } else if (block.type === 'resonance_notebook') {
                setActiveNotebook('resonance');
            } else if (block.type === 'conversation_notebook') {
                const sortedConvs = (conversations || [])
                    .sort((a, b) => new Date(b.startTime || 0) - new Date(a.startTime || 0));
                if (sortedConvs.length > 0) {
                    handleSelectConversation(sortedConvs[0].id);
                } else {
                    handleNewChat();
                }
            } else {
                editBlock(block);
            }
        }
    };

    const handleAvatarClick = () => {
        if (isEditingProfile && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch(`${API_URL}/api/oasis/upload`, {
                method: 'POST',
                body: formData,
            });
            if (res.ok) {
                const data = await res.json();
                if (data.url) {
                    setAvatar(data.url);
                    localStorage.setItem('oasis_avatar_' + user, data.url);
                    if (onSaveProfile) onSaveProfile({ avatar: data.url });
                }
            } else {
                alert('Error al subir el avatar.');
            }
        } catch (err) {
            console.error(err);
            alert('Error al subir el avatar.');
        }
    };

    const handleCoverChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch(`${API_URL}/api/oasis/upload`, {
                method: 'POST',
                body: formData,
            });
            if (res.ok) {
                const data = await res.json();
                if (data.url) {
                    setCoverImage(data.url);
                    localStorage.setItem('oasis_cover_' + user, data.url);
                    if (onSaveProfile) onSaveProfile({ coverImage: data.url });
                }
            } else {
                alert('Error al subir la portada.');
            }
        } catch (err) {
            console.error(err);
            alert('Error al subir la portada.');
        }
    };

    const formatUrl = (url) => {
        if (!url) return '';
        if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) return url;
        if (url.startsWith('/uploads/')) return `${API_URL}${url}`;
        return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
    };

    const virtualConvBlocks = useMemo(() => {
        return (conversations || [])
            .filter(c => !blocks.some(b => b.id === c.id || b.id === `conv-pub-${c.id}`))
            .map(c => ({
                id: c.id,
                type: 'conversation',
                caption: c.title || 'Diálogo AI',
                content: JSON.stringify(c.messages || []),
                isPublic: false,
                color: c.color || '#d946ef',
                username: user || 'anon',
                metadata: { timestamp: c.startTime },
                isVirtual: true
            }));
    }, [conversations, blocks, user]);

    const filteredReleases = useMemo(() => {
        const allItems = [...(blocks || []), ...virtualConvBlocks];
        return allItems.filter(b => {
            // Exclude completely empty notes
            const hasContent = (b.content && b.content.trim()) || (b.caption && b.caption.trim()) || (b.entries && b.entries.length > 0) || (b.muralBlocks && b.muralBlocks.length > 0);
            if (!hasContent) return false;

            // Exclude empty conversation blocks
            if (b.type === 'conversation') {
                try {
                    const parsed = JSON.parse(b.content);
                    if (Array.isArray(parsed) && parsed.length === 0) {
                        return false;
                    }
                } catch (e) {
                    return false;
                }
            }

            const isRes = b.content && typeof b.content === 'string' && b.content.includes('[resonancia]');
            const isDia = b.entries && b.entries.length > 0;

            if (releaseTab === 'notes') {
                return (b.type === 'text' || b.type === 'insight') && !isRes && !isDia;
            }
            if (releaseTab === 'diary') {
                return isDia;
            }
            if (releaseTab === 'resonance') {
                return isRes;
            }
            if (releaseTab === 'chats') {
                return b.type === 'conversation';
            }
            if (releaseTab === 'images') {
                return b.type === 'image' || b.type === 'relic';
            }
            return true;
        });
    }, [blocks, virtualConvBlocks, releaseTab]);

    // Custom Case Formulation generator based on selections and notes keywords
    const currentCaseFormulation = useMemo(() => {
        const arch = calculatedResults.archetype;
        const noteKws = noteKeywords;
        const score = calculatedResults.score;

        let triggersHtml = "El sistema psíquico detecta tu susceptibilidad atencional y reactividad emocional cuando enfrentas ";
        if (noteKws.length > 0) {
            triggersHtml += `conceptos de alta densidad existencial identificados en tus notas, como *"${noteKws.slice(0, 3).join(', ')}"*`;
        } else {
            triggersHtml += "situaciones de caos y desorganización conceptual en tu entorno de trabajo diario.";
        }

        let dynamicFormulation = `### 1. Formulación de Caso Clínico Funcional (${arch?.name || 'Explorador'})
        
        **A. Estímulo Antecedente / Disparador (A):**
        ${triggersHtml}. Tu cerebro experimenta esto como una amenaza directa a tu coherencia interna.
        
        **B. Estructura de Vulnerabilidad Nuclear (B):**
        Tu perfil fenomenológico revela una vulnerabilidad arraigada en: *"${arch?.vulnerability || 'Búsqueda del orden.'}"*. Esto actúa como una lente cognitiva que distorsiona la neutralidad del lienzo.
        
        **C. Respuesta de Evitación y Bloqueo (C):**
        Ante la sobrecarga, activas el bucle protector de **${arch?.subtitle || 'Evitación'}**, provocando un bloqueo manifiesto como *"${arch?.blockage || 'Parálisis por análisis'}"*.
        
        **D. Consecuencias Autoperpetuantes (D):**
        El repliegue analítico disminuye la ansiedad inmediata, pero a largo plazo refuerza la vulnerabilidad de base, consolidando un bucle psicológico recurrente que paraliza tu flujo creativo de notas en el canvas.`;

        let cognitiveCapacityAnalysis = `### 2. Análisis del Procesamiento Cognitivo (ICAR16)
        
        * **Índice de Acierto Cognitivo**: **${score}/16**
        * **Tiempo Promedio de Reacción (Dwell Time)**: **${calculatedResults.dwellAvg} segundos**
        * **Titubeo (Cambios de Respuesta)**: **${calculatedResults.totalChanges} vacilaciones registradas.**
        
        **Interpretación Cualitativa:**
        ${score >= 12
                ? "Muestras un rendimiento visomental y de inferencia altamente desarrollado, permitiéndote resolver jerarquías espaciales y verbales complejas. Sin embargo, este alto procesamiento analítico te predispone a bucles obsesivos de perfeccionismo intelectual."
                : "Se observa sobrecarga del ejecutivo central en el córtex prefrontal ante tareas de retención visoespacial simultáneas. Esto desencadena mecanismos rápidos de fatiga atencional, provocando respuestas impulsivas para liberar la tensión cognitiva."}`;

        return {
            triggers: triggersHtml,
            formulation: dynamicFormulation,
            cognitive: cognitiveCapacityAnalysis,
            liberation: arch?.liberation || "Explorar con libertad sin juicios."
        };
    }, [calculatedResults, noteKeywords]);

    const [activeSlideIndex, setActiveSlideIndex] = useState(0);
    const containerRef = useRef(null);
    const isScrollingRef = useRef(false);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const slides = container.querySelectorAll('.profile-slide');
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const idx = parseInt(entry.target.getAttribute('data-index') || '0', 10);
                        setActiveSlideIndex(idx);
                    }
                });
            },
            {
                root: container,
                threshold: 0.5,
                rootMargin: "0px"
            }
        );

        slides.forEach((slide) => observer.observe(slide));

        const handleWheel = (e) => {
            const targetTag = e.target.tagName?.toLowerCase();
            if (targetTag === 'textarea' || targetTag === 'input' || e.target.closest('.no-wheel-snap')) {
                return;
            }

            e.preventDefault();
            if (isScrollingRef.current) return;

            const direction = e.deltaY > 0 ? 1 : -1;
            let nextIndex = activeSlideIndex + direction;
            if (nextIndex < 0) nextIndex = 0;
            if (nextIndex >= slides.length) nextIndex = slides.length - 1;

            if (nextIndex === activeSlideIndex) return;

            isScrollingRef.current = true;
            const targetSlide = slides[nextIndex];
            if (targetSlide) {
                targetSlide.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }

            setTimeout(() => {
                isScrollingRef.current = false;
            }, 800);
        };

        container.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            slides.forEach((slide) => observer.unobserve(slide));
            container.removeEventListener('wheel', handleWheel);
        };
    }, [activeSlideIndex, filteredReleases, releaseTab]);

    return (
        <div className="w-full h-screen relative overflow-hidden bg-[#0a0a0b]/85 backdrop-blur-xl">
            {/* TOP NAVIGATION / ACTIONS OVERLAY (FIXED ON SCREEN) */}
            <div className="absolute top-6 left-6 right-6 md:left-10 md:right-10 flex justify-between items-start pointer-events-none z-50">
                <button
                    onClick={() => setView('canvas')}
                    className="flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10 hover:border-white/30 transition-all text-[9px] font-black uppercase tracking-widest text-white shadow-xl pointer-events-auto hover:scale-105 active:scale-95"
                >
                    ← Volver
                </button>

                <div className="flex gap-2 pointer-events-auto">
                    {isEditingProfile && (
                        <button
                            onClick={() => { if (coverInputRef.current) coverInputRef.current.click(); }}
                            className="px-4 py-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10 hover:border-white/30 transition-all text-[9px] font-black uppercase tracking-widest text-white flex items-center gap-2 shadow-xl animate-fade-in hover:scale-105 active:scale-95"
                        >
                            <Camera size={12} /> Cambiar Portada
                        </button>
                    )}
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="px-4 py-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10 hover:border-white/30 transition-all text-[9px] font-black uppercase tracking-widest text-white flex items-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition-all duration-300"
                    >
                        <Settings size={12} className="hover:rotate-45 transition-transform duration-300" /> Configuración
                    </button>
                </div>
                <input type="file" ref={coverInputRef} onChange={handleCoverChange} accept="image/*" className="hidden" />
            </div>

            <div 
                id="profile-scroll-container" 
                ref={containerRef}
                className="w-full h-full text-white select-none overflow-y-auto overflow-x-hidden no-scrollbar snap-y snap-mandatory scroll-smooth will-change-scroll"
            >
                {/* 1. TOP COVER BANNER (BACKGROUND OF FIRST SLIDE) */}
                <div className="absolute top-0 left-0 w-full h-[100vh] z-0 pointer-events-none overflow-hidden">
                    <div
                        className="absolute inset-0 transition-all duration-700 ease-in-out"
                        style={{
                            backgroundImage: `url(${formatUrl(coverImage)})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center center',
                            opacity: activeSlideIndex === 0 ? 0.35 : 0.05
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0b]/60 to-[#0a0a0b]" />
                </div>

                {/* SLIDE 1: HERO, BIO, FILTERS & ACTIONS (CONSOLIDATED) */}
                <div 
                    data-index={0}
                    className="profile-slide w-full h-screen snap-start shrink-0 relative flex flex-col justify-between pt-24 pb-6 px-6 md:px-10 z-10 overflow-hidden"
                >

                {/* HERO MAIN CARD (CONSOLIDATED) */}
                <div className={`w-full max-w-3xl mx-auto flex flex-col justify-center my-auto gap-4 md:gap-5 pointer-events-auto transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] transform-gpu ${
                    activeSlideIndex === 0 ? 'scale-100 opacity-100 blur-0' : 'scale-95 opacity-20 blur-[1px]'
                }`}>
                    {/* Avatar & Name & Primary Actions Row */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 pb-2 border-b border-white/5">
                        {/* Circular Avatar */}
                        <div className={`relative group/avatar shrink-0 w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full border-4 border-[#060607] shadow-2xl overflow-hidden bg-zinc-900 ${isEditingProfile ? 'cursor-pointer' : ''}`} onClick={handleAvatarClick}>
                            {avatar ? (
                                <img src={formatUrl(avatar)} className="w-full h-full object-cover transition-transform duration-700 group-hover/avatar:scale-110" />
                            ) : (
                                <img src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${user || 'anon'}`} className="w-full h-full object-cover opacity-80" />
                            )}
                            {isEditingProfile && (
                                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity backdrop-blur-sm">
                                    <Camera size={18} className="text-white mb-1" />
                                    <span className="text-[7px] font-black uppercase tracking-widest text-white">Subir Foto</span>
                                </div>
                            )}
                            <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
                        </div>

                        {/* Name & Primary Buttons */}
                        <div className="flex-1 flex flex-col items-center sm:items-start text-center sm:text-left gap-2">
                            {isEditingProfile ? (
                                <div className="flex flex-col gap-1 w-full items-center sm:items-start">
                                    <input
                                        value={fullName}
                                        onChange={(e) => { setFullName(e.target.value); localStorage.setItem('oasis_fullname_' + user, e.target.value); }}
                                        className="bg-transparent border-b border-white/20 text-3xl md:text-4xl font-black text-white tracking-tighter outline-none w-full md:w-auto font-sans focus:border-white transition-colors text-center sm:text-left uppercase"
                                        placeholder="Tu Nombre"
                                    />
                                    <span className="text-[10px] font-mono text-zinc-500 tracking-wider">@{user}</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center sm:items-start">
                                    <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter drop-shadow-2xl font-sans uppercase">
                                        {fullName}
                                    </h1>
                                    <span className="text-[10px] font-bold text-accent tracking-widest font-mono opacity-80 mt-0.5" style={{ color: accent }}>
                                        @{user}
                                    </span>
                                </div>
                            )}

                            <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                                <button
                                    onClick={() => {
                                        if (isEditingProfile && onSaveProfile) {
                                            onSaveProfile({ fullName, bio });
                                        }
                                        setIsEditingProfile(!isEditingProfile);
                                    }}
                                    className="px-4 py-1.5 md:py-2 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all"
                                    style={{
                                        backgroundColor: isEditingProfile ? 'rgba(255,255,255,0.1)' : accent,
                                        color: isEditingProfile ? 'white' : 'black',
                                        border: isEditingProfile ? '1px solid rgba(255,255,255,0.2)' : 'none',
                                        boxShadow: isEditingProfile ? 'none' : `0 0 15px ${accent}40`
                                    }}
                                >
                                    {isEditingProfile ? (
                                        <>Terminar</>
                                    ) : (
                                        <><span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" /> Modificar Perfil</>
                                    )}
                                </button>

                                <button className="px-4 py-1.5 md:py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/5 text-[9px] font-black uppercase tracking-widest text-white transition-all backdrop-blur-md">
                                    Compartir Alma
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* BIO DESCRIPTION (COMPACT) */}
                    <div className="w-full p-4 rounded-2xl bg-black/40 backdrop-blur-md border border-white/5 shadow-xl">
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2 block text-left">Descripción</span>
                        {isEditingProfile ? (
                            <textarea
                                value={bio}
                                onChange={(e) => { setBio(e.target.value); localStorage.setItem('oasis_bio_' + user, e.target.value); }}
                                className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-white/30 transition-all font-sans resize-none min-h-[70px]"
                                placeholder="Escribe la descripción de tu alma o biografía..."
                            />
                        ) : (
                            <p className="text-xs text-zinc-300 leading-relaxed font-sans text-left">
                                {bio}
                            </p>
                        )}
                    </div>

                    {/* BITÁCORA HUB FILTERS & UTILITIES (MERGED FROM SLIDE 2) */}
                    <div className="w-full p-4 rounded-2xl bg-black/45 backdrop-blur-md border border-white/5 shadow-xl flex flex-col gap-4">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-white/5 pb-2 gap-2">
                            <div className="flex items-center gap-2">
                                <Compass size={14} className="text-accent animate-spin-slow" style={{ color: accent }} />
                                <span className="text-[9px] font-black uppercase tracking-[0.15em]">Bitácora del Camino Existencial</span>
                            </div>
                            
                            {/* Utility Buttons */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setIsSelectionMode(!isSelectionMode);
                                        setSelectedIds([]);
                                    }}
                                    className={`px-3 py-1 rounded-full border transition-all text-[8px] font-black uppercase tracking-widest flex items-center gap-1 ${isSelectionMode
                                        ? 'bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20'
                                        : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                                        }`}
                                >
                                    <CheckSquare size={10} />
                                    {isSelectionMode ? 'Cancelar' : 'Seleccionar'}
                                </button>

                                <button
                                    onClick={() => {
                                        if (window.confirm("¿Estás seguro de eliminar todos los datos de prueba? Esta acción no se puede deshacer.")) {
                                            deleteBlocks(blocks.map(b => b.id));
                                        }
                                    }}
                                    className="px-3 py-1 rounded-full border border-red-900/30 bg-red-950/20 transition-all text-[8px] font-black uppercase tracking-widest flex items-center gap-1 text-red-500 hover:bg-red-600 hover:text-black"
                                >
                                    <Trash2 size={10} />
                                    Borrar Todo
                                </button>
                            </div>
                        </div>

                        {/* Horizontal scrolling chips list */}
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-2 px-2 whitespace-nowrap">
                            {[
                                { id: 'all', label: 'Todos' },
                                { id: 'notes', label: 'Notas' },
                                { id: 'diary', label: 'Diario' },
                                { id: 'resonance', label: 'Resonancias' },
                                { id: 'chats', label: 'Diálogos AI' },
                                { id: 'images', label: 'Multimedia' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setReleaseTab(tab.id)}
                                    className={`px-4 py-1.5 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all ${releaseTab === tab.id
                                        ? 'bg-accent text-black font-black shadow-lg hover:scale-105'
                                        : 'bg-white/5 text-zinc-500 hover:text-white hover:bg-white/10'
                                        }`}
                                    style={releaseTab === tab.id ? { backgroundColor: accent } : undefined}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Animated Scroll Down Indicator */}
                <div 
                    className="flex flex-col items-center gap-1 animate-bounce cursor-pointer pb-2 pointer-events-auto"
                    onClick={() => {
                        const scrollContainer = document.getElementById('profile-scroll-container');
                        if (scrollContainer) {
                            scrollContainer.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
                        }
                    }}
                >
                    <span className="text-[7px] font-black uppercase tracking-[0.3em] text-zinc-500">Desliza para ver publicaciones</span>
                    <ChevronDown size={12} className="text-zinc-500" />
                </div>
            </div>

            {/* SLIDES 3+: PUBLICACIONES / TARJETAS (TIKTOK STYLE INDIVIDUAL SCROLL SNAP) */}
            {filteredReleases.length > 0 ? (
                filteredReleases.map((b, index) => {
                    const isRes = b.content && typeof b.content === 'string' && b.content.includes('[resonancia]');
                    const isDia = b.entries && b.entries.length > 0;
                    const isInsight = b.type === 'insight';
                    const isNote = (b.type === 'text' || b.type === 'insight') && !isRes && !isDia;
                    const isImg = b.type === 'image' || b.type === 'relic';
                    const isChat = b.type === 'conversation';
                    const hasSubNotes = b.muralBlocks && b.muralBlocks.length > 0;

                    const noteColor = b.color || accent;
                    const cardBorderColor = isChat ? '#d946ef' : (isRes ? '#a855f7' : (isDia ? '#f59e0b' : (isInsight ? '#a855f7' : noteColor)));
                    const typeLabel = isChat ? 'DIÁLOGO AI' : (isRes ? 'RESONANCIA' : (isDia ? 'DIARIO' : (isImg ? 'MULTIMEDIA' : (isInsight ? 'REVELACIÓN' : 'NOTA'))));
                    const isSelected = selectedIds.includes(b.id);

                    const isActive = activeSlideIndex === (index + 1);
                    return (
                        <div 
                            key={b.id || index} 
                            data-index={index + 1}
                            className="profile-slide w-full h-screen snap-start shrink-0 relative flex flex-col justify-center items-center px-6 md:px-10 z-10 overflow-hidden"
                        >
                            <div
                                onClick={() => handleCardClick(b.id)}
                                draggable={!isSelectionMode}
                                onDragStart={(e) => {
                                    e.dataTransfer.setData("text/plain", b.id);
                                    e.dataTransfer.effectAllowed = "move";
                                }}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    if (dragOverId !== b.id) setDragOverId(b.id);
                                }}
                                onDragLeave={() => {
                                    if (dragOverId === b.id) setDragOverId(null);
                                }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    setDragOverId(null);
                                    const draggedId = e.dataTransfer.getData("text/plain");
                                    handleReorderBlocks(draggedId, b.id);
                                }}
                                className={`w-full max-w-3xl h-[65vh] md:h-[70vh] bg-black/40 border rounded-[2.5rem] p-6 md:p-8 flex flex-col transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] transform-gpu relative overflow-hidden group/board-item shadow-2xl backdrop-blur-md cursor-pointer ${
                                    isActive
                                        ? 'scale-100 opacity-100 blur-0'
                                        : 'scale-90 opacity-20 blur-[1px]'
                                } ${isSelectionMode
                                    ? (isSelected ? 'border-red-500 bg-red-950/10 shadow-[0_0_25px_rgba(239,68,68,0.25)]' : 'border-white/5 opacity-55 hover:opacity-100 hover:border-white/20')
                                    : 'border-white/10 hover:border-white/20'
                                }`}
                                style={{
                                    borderTop: `4px solid ${isSelectionMode && isSelected ? '#ef4444' : (dragOverId === b.id ? accent : cardBorderColor)}`,
                                    borderColor: dragOverId === b.id ? accent : '',
                                    boxShadow: dragOverId === b.id ? `0 0 25px ${accent}80` : '',
                                    opacity: dragOverId === b.id ? 0.7 : ''
                                }}
                            >
                                {/* Header Info */}
                                <div className="flex justify-between items-center opacity-60 group-hover/board-item:opacity-100 transition-opacity pb-2 border-b border-white/5">
                                    <span className="text-[7px] font-black uppercase tracking-widest text-zinc-500">
                                        {typeLabel}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        {isSelectionMode ? (
                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${isSelected
                                                ? 'bg-red-500 border-red-500 text-white'
                                                : 'border-white/30 bg-black/40'
                                                }`}>
                                                {isSelected && <Check size={8} />}
                                            </div>
                                        ) : (
                                            <>
                                                <span className="text-[7px] font-mono text-zinc-600">
                                                    {b.isPublic ? 'PÚBLICO' : 'PRIVADO'}
                                                </span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (b.isVirtual) {
                                                            if (window.confirm("¿Estás seguro de eliminar este diálogo permanentemente?")) {
                                                                const updated = conversations.filter(c => c.id !== b.id);
                                                                setConversations(updated);
                                                                fetch(`${API_URL}/api/oasis/conversations?user=${user || localStorage.getItem('oasis_user')}`, {
                                                                    method: 'POST',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify(updated)
                                                                });
                                                            }
                                                        } else {
                                                            deleteBlock(b.id);
                                                        }
                                                    }}
                                                    className="w-5 h-5 rounded-md bg-white/5 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-colors flex items-center justify-center"
                                                    title="Eliminar registro"
                                                >
                                                    <Trash2 size={10} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Body Content */}
                                {isImg && (
                                    <div className="flex-1 min-h-0 space-y-3 pt-4 flex flex-col">
                                        <div className="flex-1 w-full rounded-2xl overflow-hidden border border-white/5 relative bg-zinc-950/45">
                                            <img src={formatUrl(b.content)} className="absolute inset-0 w-full h-full object-cover group-hover/board-item:scale-105 transition-transform duration-700" />
                                        </div>
                                        {b.caption && (
                                            <h4 className="text-sm font-black italic uppercase text-zinc-300 shrink-0">
                                                {b.caption}
                                            </h4>
                                        )}
                                    </div>
                                )}

                                {isChat && (() => {
                                    let msgs = [];
                                    try { msgs = JSON.parse(b.content) || []; } catch (e) { }
                                    return (
                                        <div className="flex-1 min-h-0 space-y-3 flex flex-col pt-4">
                                            <h4 className="text-base font-black italic uppercase text-purple-400 truncate leading-none shrink-0">
                                                {b.caption || 'Diálogo AI'}
                                            </h4>
                                            <div className="flex-1 space-y-3 pr-1 overflow-y-auto no-scrollbar font-sans border-t border-white/5 pt-3">
                                                {msgs.map((msg, idx) => (
                                                    <div key={idx} className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                                        <span className="text-[6px] font-black uppercase tracking-widest text-zinc-500">
                                                            {msg.role === 'user' ? 'Tú' : 'Kio'}
                                                        </span>
                                                        <p className={`text-[10px] leading-snug rounded-2xl px-3 py-1.5 font-sans ${msg.role === 'user'
                                                            ? 'bg-purple-900/20 border border-purple-800/30 text-purple-300 text-right'
                                                            : 'bg-white/5 border border-white/5 text-white/80'
                                                            } max-w-[90%] whitespace-pre-wrap`}>
                                                            {msg.content}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })()}

                                {isRes && (() => {
                                    const resMatch = b.content.match(/\[resonancia\]([\s\S]*?)(?=\[impacto\]|$)/);
                                    const impMatch = b.content.match(/\[impacto\]([\s\S]*?)(?=\[extrano\]|$)/);
                                    const extMatch = b.content.match(/\[extrano\]([\s\S]*?)$/);

                                    const resonanceText = resMatch ? resMatch[1].trim() : '';
                                    const impactText = impMatch ? impMatch[1].trim() : '';
                                    const strangeText = extMatch ? extMatch[1].trim() : '';

                                    return (
                                        <div className="flex-1 min-h-0 space-y-4 flex flex-col pt-4">
                                            <h4 className="text-base font-black italic uppercase text-purple-400 truncate leading-none shrink-0">
                                                {b.caption || 'Resonancia Psíquica'}
                                            </h4>
                                            <div className="flex-1 space-y-3 font-sans overflow-y-auto no-scrollbar">
                                                {resonanceText && (
                                                    <div className="p-3.5 rounded-2xl bg-purple-950/15 border border-purple-500/10 space-y-1">
                                                        <span className="text-[7px] font-mono font-black uppercase text-purple-400 tracking-widest block">Resonancia Primal</span>
                                                        <p className="text-[11px] text-zinc-300 font-sans italic">"{resonanceText}"</p>
                                                    </div>
                                                )}
                                                {impactText && (
                                                    <div className="p-3.5 rounded-2xl bg-zinc-950/30 border border-white/5 space-y-1">
                                                        <span className="text-[7px] font-mono font-black uppercase text-zinc-500 tracking-widest block">Impacto Somático</span>
                                                        <p className="text-[11px] text-zinc-400 font-sans italic">"{impactText}"</p>
                                                    </div>
                                                )}
                                                {strangeText && (
                                                    <div className="p-3.5 rounded-2xl bg-zinc-950/45 border border-white/5 space-y-1">
                                                        <span className="text-[7px] font-mono font-black uppercase text-zinc-600 tracking-widest block">Lo Extraño / Glitch</span>
                                                        <p className="text-[11px] text-zinc-500 font-sans italic">"{strangeText}"</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })()}

                                {isDia && (
                                    <div className="flex-1 min-h-0 space-y-4 flex flex-col pt-4">
                                        <h4 className="text-base font-black italic uppercase text-amber-500 leading-none shrink-0">
                                            {b.caption || 'Bitácora / Diario'}
                                        </h4>
                                        <div className="flex flex-col gap-2 flex-1 overflow-y-auto no-scrollbar">
                                            {b.entries.map((entry, idx) => (
                                                <div key={idx} className="bg-black/30 p-3 rounded-2xl border border-white/5 shrink-0">
                                                    <div className="flex justify-between items-center mb-1 text-[8px] font-mono text-zinc-500 uppercase tracking-widest">
                                                        <span>{new Date(entry.timestamp).toLocaleDateString()}</span>
                                                        <span>{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                    <p className="text-[10px] leading-relaxed text-zinc-300 font-sans italic">
                                                        "{entry.text}"
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {isNote && (
                                    <div className="flex-1 min-h-0 space-y-3 flex flex-col pt-4">
                                        <h4 className="text-lg font-black italic uppercase text-white truncate leading-none shrink-0">
                                            {b.caption || 'Nota Personal'}
                                        </h4>

                                        {(() => {
                                            const lines = (b.content || '').split('\n');
                                            const textLines = lines.filter(l => !l.startsWith('[img]') && !l.startsWith('[vid]') && !l.startsWith('[aud]')).join('\n');
                                            const inlineImage = lines.find(l => l.startsWith('[img]'))?.replace('[img]', '').trim();

                                            return (
                                                <>
                                                    <div className="flex-1 overflow-y-auto no-scrollbar relative">
                                                        <p className="text-[11px] leading-relaxed text-zinc-300 font-sans italic selection:bg-accent/40 whitespace-pre-wrap">
                                                            {textLines}
                                                        </p>
                                                    </div>
                                                    {inlineImage && (
                                                        <div className="mt-2 w-full h-24 shrink-0 rounded-xl overflow-hidden border border-white/10">
                                                            <img src={formatUrl(inlineImage)} className="w-full h-full object-cover" alt="Adjunto" />
                                                        </div>
                                                    )}
                                                </>
                                            );
                                        })()}

                                        {b.muralBlocks && b.muralBlocks.length > 0 && (
                                            <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pt-3 pb-1 shrink-0 border-t border-white/5 mt-auto">
                                                {b.muralBlocks.map((mb, i) => (
                                                    <div key={mb.id || i} className="shrink-0 snap-center w-28 h-20 bg-white/5 hover:bg-white/10 transition-colors border border-white/10 rounded-xl p-2.5 flex flex-col items-center justify-center relative overflow-hidden group">
                                                        {mb.type === 'image' && <img src={formatUrl(mb.content)} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />}
                                                        {mb.type === 'text' && <p className="text-[7px] text-zinc-300 font-sans italic line-clamp-4 relative z-10">{mb.content}</p>}
                                                        <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded-full bg-black/80 border border-white/10 text-[5px] uppercase tracking-widest text-zinc-400 z-10">Sub</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Footer Controls */}
                                <div className="pt-4 border-t border-white/5 mt-auto flex justify-between items-center shrink-0">
                                    <span className="text-[6px] font-bold text-zinc-500 uppercase font-mono tracking-widest">Oasis Digital Map</span>
                                    {!isSelectionMode && (
                                        <div className="flex gap-2">
                                            {isChat && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSelectConversation(b.id);
                                                        setView('canvas');
                                                    }}
                                                    className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500 border border-purple-500/30 rounded-xl text-[7px] font-black uppercase tracking-widest text-purple-400 hover:text-white hover:scale-105 active:scale-95 transition-all flex items-center gap-1"
                                                >
                                                    <MessageSquare size={8} /> Abrir Diálogo
                                                </button>
                                            )}
                                            {!b.isVirtual && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setView('canvas'); editBlock(b); }}
                                                    className="px-3 py-1.5 bg-white/5 hover:bg-accent hover:text-black border border-white/10 rounded-xl text-[7px] font-black uppercase tracking-widest text-zinc-400 hover:scale-105 active:scale-95 transition-all flex items-center gap-1"
                                                    style={{ '--accent-color': noteColor }}
                                                >
                                                    <Focus size={8} /> Enfocar
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })
            ) : (
                <div 
                    data-index={1}
                    className="profile-slide w-full h-screen snap-start shrink-0 relative flex flex-col justify-center items-center px-6 md:px-10 z-10 overflow-hidden"
                >
                    <div className={`w-full max-w-3xl h-[40vh] flex flex-col items-center justify-center border border-white/5 bg-white/[0.01] rounded-[3rem] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] transform-gpu ${
                        activeSlideIndex === 1 ? 'scale-100 opacity-100 blur-0' : 'scale-95 opacity-20 blur-[1px]'
                    }`}>
                        <Aperture size={32} className="mb-4 text-white/5 animate-spin-slow" />
                        <p className="text-[9px] font-black uppercase tracking-[0.6em] text-white/10 italic">Sin registros en esta categoría</p>
                    </div>
                </div>
            )}

            {/* SLIDE LAST: REORDER DROP ZONE */}
            {!isSelectionMode && filteredReleases.length > 0 && (
                <div 
                    data-index={filteredReleases.length + 1}
                    className="profile-slide w-full h-screen snap-start shrink-0 relative flex flex-col justify-center items-center px-6 md:px-10 z-10 overflow-hidden"
                >
                    <div
                        onDragOver={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.add('bg-white/5', 'border-white/30', 'text-white');
                        }}
                        onDragLeave={(e) => {
                            e.currentTarget.classList.remove('bg-white/5', 'border-white/30', 'text-white');
                        }}
                        onDrop={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.remove('bg-white/5', 'border-white/30', 'text-white');
                            const draggedId = e.dataTransfer.getData("text/plain");
                            handleReorderBlocks(draggedId, 'FEED_END');
                        }}
                        className={`w-full max-w-3xl h-[25vh] border border-dashed border-white/10 rounded-[2.5rem] flex items-center justify-center text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-white hover:border-white/30 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] transform-gpu cursor-pointer backdrop-blur-md shadow-2xl ${
                            activeSlideIndex === (filteredReleases.length + 1) ? 'scale-100 opacity-100 blur-0' : 'scale-95 opacity-20 blur-[1px]'
                        }`}
                    >
                        Arrastrar aquí para mover al final del feed
                    </div>
                </div>
            )}

            {/* FLOATING ACTION BAR FOR SELECTION DELETE */}
            {isSelectionMode && selectedIds.length > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-zinc-950/90 border border-red-500/30 px-6 py-4 rounded-3xl shadow-[0_10px_50px_rgba(239,68,68,0.25)] flex items-center gap-6 animate-in slide-in-from-bottom-10 backdrop-blur-xl z-50">
                    <div className="flex flex-col">
                        <span className="text-[7px] font-black uppercase tracking-[0.2em] text-red-500">Operación de Limpieza</span>
                        <span className="text-xs font-mono font-bold text-white">
                            {selectedIds.length} {selectedIds.length === 1 ? 'bloque seleccionado' : 'bloques seleccionados'}
                        </span>
                    </div>

                    <div className="w-px h-6 bg-white/10" />

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                if (window.confirm(`¿Estás seguro de que deseas eliminar permanentemente estos ${selectedIds.length} bloques?`)) {
                                    deleteBlocks(selectedIds);
                                    setSelectedIds([]);
                                    setIsSelectionMode(false);
                                }
                            }}
                            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white hover:scale-105 active:scale-95 transition-all text-[9px] font-black uppercase tracking-widest rounded-2xl flex items-center gap-2"
                        >
                            <Trash2 size={12} />
                            Eliminar Selección
                        </button>
                        <button
                            onClick={() => setSelectedIds([])}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-zinc-400 hover:text-white transition-all text-[9px] font-black uppercase tracking-widest rounded-2xl"
                        >
                            Deseleccionar todo
                        </button>
                    </div>
                </div>
            )}
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
    const [bgTemplates, setBgTemplates] = useState([]);
    const [newTemplateName, setNewTemplateName] = useState('');
    const [clabeInput, setClabeInput] = useState('');
    const [withdrawStatus, setWithdrawStatus] = useState('');

    const [user, setUser] = useState(localStorage.getItem('oasis_user') || '');
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('oasis_user'));
    const [showPass, setShowPass] = useState(false);
    const [isRegisterMode, setIsRegisterMode] = useState(false);
    const [authError, setAuthError] = useState('');
    const [credits, setCredits] = useState(() => Number(localStorage.getItem('oasis_credits_' + (localStorage.getItem('oasis_user') || ''))) || 100);
    useEffect(() => {
        if (user) {
            localStorage.setItem('oasis_credits_' + user, credits);
        }
    }, [credits, user]);
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const [deepseekKey, setDeepseekKey] = useState(() => localStorage.getItem('oasis_deepseek_key') || ''); // DeepSeek API Key

    // --- APP STATE ---
    // Sidebar & Conversations
    const [conversations, setConversations] = useState([]);
    const [activeConversationId, setActiveConversationId] = useState(null);
    const [folders, setFolders] = useState([]);
    const [userMemory, setUserMemory] = useState([]); // Persistent AI facts

    const [activeNotebook, setActiveNotebook] = useState(null); // 'diary' | 'resonance'

    const [avatar, setAvatar] = useState(() => localStorage.getItem('oasis_avatar_' + (localStorage.getItem('oasis_user') || '')) || '');

    useEffect(() => {
        if (user) {
            setAvatar(localStorage.getItem('oasis_avatar_' + user) || '');
        } else {
            setAvatar('');
        }
    }, [user]);

    // Psychometrics and Soul Archive states (moved to App level)
    const [soulTab, setSoulTab] = useState('tests'); // 'loop_map' | 'memory' | 'tests'
    const [activeTest, setActiveTest] = useState(null); // 'phenom' | 'pid5' | 'icar16' | null
    const [activeTestCardIndex, setActiveTestCardIndex] = useState(0);

    // Versioning and ICAR-16 question-level video recording states
    const [activeVersion, setActiveVersion] = useState(() => {
        try { return parseInt(localStorage.getItem('oasis_active_version_' + (localStorage.getItem('oasis_user') || ''))) || 1; } catch (e) { return 1; }
    });
    const [totalVersions, setTotalVersions] = useState(() => {
        try { return parseInt(localStorage.getItem('oasis_total_versions_' + (localStorage.getItem('oasis_user') || ''))) || 1; } catch (e) { return 1; }
    });
    const [isSessionDropdownOpen, setIsSessionDropdownOpen] = useState(false);
    const [icarVideos, setIcarVideos] = useState({});
    const icarVideosRef = useRef({});
    const icarWebcamRef = useRef(null);
    const longPressTimerRef = useRef(null);

    const [phenomAnswers, setPhenomAnswers] = useState({});
    const [phenomQualitative, setPhenomQualitative] = useState({ antecedentes_origen: "", experiencia_insuficiencia: "", temporalidad_vivida: "", premisa_realidad: "" });
    const [pidAnswers, setPidAnswers] = useState({});
    const [phenomTextValue, setPhenomTextValue] = useState("");
    const [icarAnswers, setIcarAnswers] = useState({});
    const [currentPhenomIndex, setCurrentPhenomIndex] = useState(0);
    const [currentPidIndex, setCurrentPidIndex] = useState(0);
    const [currentIcarIndex, setCurrentIcarIndex] = useState(0);
    const [questionStartTime, setQuestionStartTime] = useState(0);
    const [icarDwellTimes, setIcarDwellTimes] = useState({});
    const [icarChanges, setIcarChanges] = useState({});
    const [selectedLoopNode, setSelectedLoopNode] = useState('trigger'); // 'trigger' | 'vulnerability' | 'blockage' | 'consequence' | 'liberation'
    const [expandedIcarQuestion, setExpandedIcarQuestion] = useState(null);
    const [zoomedImage, setZoomedImage] = useState(null);
    const [interactionLogs, setInteractionLogs] = useState([]);
    const [webcamStream, setWebcamStream] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [passwordError, setPasswordError] = useState(false);
    const [clinicalSessions, setClinicalSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);
    const testsContainerRef = useRef(null);
    const [resultsSubTab, setResultsSubTab] = useState('summary'); // 'summary' | 'phenom_detail' | 'icar_detail'

    // States and refs for Phenomenology Video Recording & Speech-to-Text
    const [phenomRecording, setPhenomRecording] = useState(false);
    const [phenomPaused, setPhenomPaused] = useState(false);
    const [phenomHasRecorded, setPhenomHasRecorded] = useState({});
    const [phenomRecordedBlobs, setPhenomRecordedBlobs] = useState({});
    const phenomRecordedBlobsRef = useRef({});
    const [phenomDwellTimes, setPhenomDwellTimes] = useState({});
    const [phenomPauseCounts, setPhenomPauseCounts] = useState({});
    const phenomStartTimeRef = useRef(null);
    const phenomWebcamRef = useRef(null);
    const phenomStreamRef = useRef(null);
    const phenomMediaRecorderRef = useRef(null);
    const phenomChunksRef = useRef([]);
    const phenomAudioContextRef = useRef(null);
    const phenomAnalyserRef = useRef(null);
    const phenomDataArrayRef = useRef(null);
    const [phenomVolume, setPhenomVolume] = useState(0);

    const {
        isRecording: phenomSttRecording,
        interimTranscript: phenomInterimTranscript,
        startRecording: phenomStartStt,
        stopRecording: phenomStopStt,
        setTranscript: phenomSetSttTranscript
    } = useTranscription({
        onTranscriptChange: (text) => {
            setPhenomTextValue(text);
        }
    });

    const cleanupPhenomMedia = useCallback(() => {
        if (phenomStreamRef.current) {
            phenomStreamRef.current.getTracks().forEach(track => track.stop());
            phenomStreamRef.current = null;
        }
        if (phenomAudioContextRef.current) {
            phenomAudioContextRef.current.close();
            phenomAudioContextRef.current = null;
        }
        phenomStopStt();
        setPhenomRecording(false);
        setPhenomPaused(false);
    }, [phenomStopStt]);

    useEffect(() => {
        if (activeTest === 'phenom' && currentPhenomIndex < 4) {
            const startPhenomCamera = async () => {
                cleanupPhenomMedia();
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                    phenomStreamRef.current = stream;
                    if (phenomWebcamRef.current) {
                        phenomWebcamRef.current.srcObject = stream;
                    }

                    // Audio Context for Volume Meter
                    phenomAudioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
                    phenomAnalyserRef.current = phenomAudioContextRef.current.createAnalyser();
                    const source = phenomAudioContextRef.current.createMediaStreamSource(stream);
                    source.connect(phenomAnalyserRef.current);
                    phenomAnalyserRef.current.fftSize = 256;
                    const bufferLength = phenomAnalyserRef.current.frequencyBinCount;
                    phenomDataArrayRef.current = new Uint8Array(bufferLength);

                    const updateVolume = () => {
                        if (phenomAnalyserRef.current && phenomDataArrayRef.current) {
                            phenomAnalyserRef.current.getByteFrequencyData(phenomDataArrayRef.current);
                            let sum = 0;
                            for (let i = 0; i < bufferLength; i++) {
                                sum += phenomDataArrayRef.current[i];
                            }
                            setPhenomVolume(sum / bufferLength);
                        }
                        if (phenomStreamRef.current) {
                            requestAnimationFrame(updateVolume);
                        }
                    };
                    updateVolume();
                } catch (e) {
                    console.error("Error accessing phenomenology media devices:", e);
                }
            };
            startPhenomCamera();
        } else {
            cleanupPhenomMedia();
        }
        return () => {
            cleanupPhenomMedia();
        };
    }, [activeTest, currentPhenomIndex, cleanupPhenomMedia]);

    useEffect(() => {
        if (activeTest === 'phenom' && currentPhenomIndex < 4) {
            phenomSetSttTranscript(phenomTextValue || "");
        }
    }, [currentPhenomIndex, activeTest, phenomSetSttTranscript]);

    const togglePhenomRecording = () => {
        if (phenomRecording) {
            // Stop recording
            setPhenomRecording(false);
            setPhenomPaused(false);
            setPhenomHasRecorded(prev => ({ ...prev, [currentPhenomIndex]: true }));
            phenomStopStt();

            if (phenomMediaRecorderRef.current && phenomMediaRecorderRef.current.state !== 'inactive') {
                phenomMediaRecorderRef.current.stop();
            }

            if (phenomStartTimeRef.current) {
                const elapsed = Date.now() - phenomStartTimeRef.current;
                setPhenomDwellTimes(prev => ({
                    ...prev,
                    [currentPhenomIndex]: (prev[currentPhenomIndex] || 0) + elapsed
                }));
                phenomStartTimeRef.current = null;
            }
        } else {
            // Start recording
            setPhenomRecording(true);
            setPhenomPaused(false);
            setPhenomTextValue("");
            phenomStartStt("");

            if (phenomStreamRef.current) {
                phenomChunksRef.current = [];
                let options = { mimeType: 'video/webm;codecs=vp9,opus' };
                if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                    options = { mimeType: 'video/webm;codecs=vp8,opus' };
                }
                if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                    options = { mimeType: 'video/webm' };
                }

                try {
                    const mediaRecorder = new MediaRecorder(phenomStreamRef.current, options);
                    phenomMediaRecorderRef.current = mediaRecorder;

                    mediaRecorder.ondataavailable = (event) => {
                        if (event.data && event.data.size > 0) {
                            phenomChunksRef.current.push(event.data);
                        }
                    };

                    const activeIdx = currentPhenomIndex;
                    mediaRecorder.onstop = () => {
                        const blob = new Blob(phenomChunksRef.current, { type: 'video/webm' });
                        phenomRecordedBlobsRef.current[activeIdx] = blob;
                        setPhenomRecordedBlobs(prev => ({
                            ...prev,
                            [activeIdx]: blob
                        }));
                    };

                    mediaRecorder.start(1000);
                } catch (err) {
                    console.error("Error starting phenomenology MediaRecorder:", err);
                }
            }
            phenomStartTimeRef.current = Date.now();
        }
    };

    const togglePhenomPause = () => {
        if (!phenomRecording) return;
        if (phenomPaused) {
            setPhenomPaused(false);
            phenomStartStt(phenomTextValue);
            if (phenomMediaRecorderRef.current && phenomMediaRecorderRef.current.state === 'paused') {
                phenomMediaRecorderRef.current.resume();
            }
            phenomStartTimeRef.current = Date.now();
        } else {
            setPhenomPaused(true);
            phenomStopStt();
            if (phenomMediaRecorderRef.current && phenomMediaRecorderRef.current.state === 'recording') {
                phenomMediaRecorderRef.current.pause();
            }
            setPhenomPauseCounts(prev => ({
                ...prev,
                [currentPhenomIndex]: (prev[currentPhenomIndex] || 0) + 1
            }));
            if (phenomStartTimeRef.current) {
                const elapsed = Date.now() - phenomStartTimeRef.current;
                setPhenomDwellTimes(prev => ({
                    ...prev,
                    [currentPhenomIndex]: (prev[currentPhenomIndex] || 0) + elapsed
                }));
                phenomStartTimeRef.current = null;
            }
        }
    };

    // --- MEDITATION & CONTEMPLATION SPACE ---
    const [isMeditationMode, setIsMeditationMode] = useState(false);
    const [isAudioActive, setIsAudioActive] = useState(false);
    const [breathPhase, setBreathPhase] = useState(0); // 0: Inhala, 1: Retén, 2: Exhala, 3: Vacío
    const [selectedContemplationFact, setSelectedContemplationFact] = useState(null);
    const [reinterpretationText, setReinterpretationText] = useState("");
    const [activeMemoryIndex, setActiveMemoryIndex] = useState(0);
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');

    // Swipe state for memory cards
    const [swipeOffset, setSwipeOffset] = useState({ x: 0, y: 0 });
    const [isSwiping, setIsSwiping] = useState(false);
    const [swipeDirection, setSwipeDirection] = useState(null); // 'left' | 'right' | null
    const [swipeTriggered, setSwipeTriggered] = useState(false);
    const dragStartRef = useRef(null);

    // Map Pan/Zoom state
    const [mapPan, setMapPan] = useState({ x: 0, y: 0 });
    const [isPanningMap, setIsPanningMap] = useState(false);
    const mapPanStart = useRef({ x: 0, y: 0 });
    const [mapZoom, setMapZoom] = useState(1);

    const spawnNotebookBlock = (type) => {
        const existing = blocks.find(b => b.type === type);
        if (existing) {
            setCam({
                x: -existing.x * 0.8,
                y: -existing.y * 0.8,
                scale: 0.8
            });
            return;
        }

        let spawnX = -cam.x / cam.scale - 200;
        let spawnY = -cam.y / cam.scale - 300;

        if (type === 'diary_notebook') { spawnX = -700; spawnY = -350; }
        if (type === 'resonance_notebook') { spawnX = 100; spawnY = -350; }
        if (type === 'loop_map_mini') { spawnX = -300; spawnY = 450; }
        if (type === 'conversation_notebook') { spawnX = 700; spawnY = -350; }

        const newBlock = {
            id: Date.now().toString(),
            type: type,
            x: spawnX,
            y: spawnY,
            content: '',
            color: type === 'diary_notebook' ? '#f59e0b' : (type === 'resonance_notebook' ? '#a855f7' : (type === 'conversation_notebook' ? '#d946ef' : '#06b6d4')),
            isPublic: false,
            entries: []
        };
        syncBlocks([...blocks, newBlock]);
    };

    const handleMapPointerDown = (e) => {
        // If clicking on node circles/text (interactive nodes), do not start panning
        if (e.target.closest('g.cursor-pointer') || e.target.closest('button')) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        setIsPanningMap(true);
        mapPanStart.current = { x: e.clientX - mapPan.x, y: e.clientY - mapPan.y };
    };

    const handleMapPointerMove = (e) => {
        if (!isPanningMap) return;
        const dx = e.clientX - mapPanStart.current.x;
        const dy = e.clientY - mapPanStart.current.y;
        setMapPan({ x: dx, y: dy });
    };

    const handleMapPointerUp = (e) => {
        if (!isPanningMap) return;
        e.currentTarget.releasePointerCapture(e.pointerId);
        setIsPanningMap(false);
    };

    const handleMapWheel = (e) => {
        const zoomFactor = 0.05;
        const newZoom = e.deltaY < 0
            ? Math.min(mapZoom + zoomFactor, 2.5)
            : Math.max(mapZoom - zoomFactor, 0.5);
        setMapZoom(newZoom);
    };

    const handleCardPointerDown = (e) => {
        if (e.button !== 0) return;
        if (e.target.closest('button') || e.target.closest('a') || e.target.closest('input') || e.target.closest('span')) {
            return;
        }
        e.currentTarget.setPointerCapture(e.pointerId);
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        setIsSwiping(true);
        setSwipeOffset({ x: 0, y: 0 });
        setSwipeDirection(null);
    };

    const handleCardPointerMove = (e) => {
        if (!dragStartRef.current || !isSwiping) return;
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        setSwipeOffset({ x: dx, y: dy });
        if (Math.abs(dx) > 20) {
            setSwipeDirection(dx > 0 ? 'right' : 'left');
        } else {
            setSwipeDirection(null);
        }
    };

    const handleCardPointerUp = (e, filteredLength) => {
        if (!dragStartRef.current || !isSwiping) return;
        e.currentTarget.releasePointerCapture(e.pointerId);

        const dx = swipeOffset.x;
        const threshold = 120;

        if (Math.abs(dx) > threshold) {
            const direction = dx > 0 ? 'right' : 'left';
            setSwipeDirection(direction);
            setSwipeTriggered(true);

            setTimeout(() => {
                setActiveMemoryIndex(prev => (prev + 1) % filteredLength);
                setSwipeOffset({ x: 0, y: 0 });
                setSwipeDirection(null);
                setSwipeTriggered(false);
                setIsSwiping(false);
                dragStartRef.current = null;
            }, 300);
        } else {
            setSwipeOffset({ x: 0, y: 0 });
            setIsSwiping(false);
            setSwipeDirection(null);
            dragStartRef.current = null;
        }
    };

    const triggerSwipeNext = (filteredLength) => {
        if (swipeTriggered) return;
        setSwipeDirection('left');
        setSwipeTriggered(true);
        setTimeout(() => {
            setActiveMemoryIndex(prev => (prev + 1) % filteredLength);
            setSwipeOffset({ x: 0, y: 0 });
            setSwipeDirection(null);
            setSwipeTriggered(false);
        }, 300);
    };

    const triggerSwipePrev = (filteredLength) => {
        if (swipeTriggered) return;
        setSwipeDirection('right');
        setSwipeTriggered(true);
        setTimeout(() => {
            setActiveMemoryIndex(prev => (prev - 1 + filteredLength) % filteredLength);
            setSwipeOffset({ x: 0, y: 0 });
            setSwipeDirection(null);
            setSwipeTriggered(false);
        }, 300);
    };

    const audioCtxRef = useRef(null);
    const activeNodesRef = useRef(null);

    const playAmbientPad = () => {
        try {
            if (!audioCtxRef.current) {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                audioCtxRef.current = new AudioContextClass();
            }
            const ctx = audioCtxRef.current;
            if (ctx.state === 'suspended') {
                ctx.resume();
            }

            // Frequencies for a calming minor 11th chord / major 9th pad in A
            // A2 (110Hz), E3 (164.81Hz), A3 (220Hz), C4 (261.63Hz), E4 (329.63Hz)
            const freqs = [110, 164.81, 220, 261.63, 329.63];
            const oscs = [];
            const gains = [];

            const mainGain = ctx.createGain();
            mainGain.gain.setValueAtTime(0, ctx.currentTime);

            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(320, ctx.currentTime);
            filter.Q.setValueAtTime(1.2, ctx.currentTime);

            freqs.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
                osc.frequency.setValueAtTime(freq, ctx.currentTime);
                osc.detune.setValueAtTime((Math.random() - 0.5) * 10, ctx.currentTime);

                const g = ctx.createGain();
                g.gain.setValueAtTime(0.05 / freqs.length, ctx.currentTime);

                osc.connect(g);
                g.connect(filter);

                osc.start();
                oscs.push(osc);
                gains.push(g);
            });

            filter.connect(mainGain);
            mainGain.connect(ctx.destination);

            // Fade in slowly over 3 seconds
            mainGain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 3);

            // Slow lowpass filter sweep (LFO-like sweep) using interval
            let sweepUp = true;
            const filterInterval = setInterval(() => {
                if (!ctx || ctx.state === 'closed') return;
                const currentFreq = filter.frequency.value;
                let nextFreq = sweepUp ? currentFreq + 10 : currentFreq - 10;
                if (nextFreq > 420) sweepUp = false;
                if (nextFreq < 240) sweepUp = true;
                filter.frequency.setValueAtTime(nextFreq, ctx.currentTime);
            }, 120);

            activeNodesRef.current = { oscs, gains, filter, mainGain, filterInterval };
        } catch (e) {
            console.error("Error creating audio synth:", e);
        }
    };

    const stopAmbientPad = () => {
        try {
            if (activeNodesRef.current) {
                const { oscs, mainGain, filterInterval } = activeNodesRef.current;
                clearInterval(filterInterval);
                const ctx = audioCtxRef.current;
                if (ctx && mainGain) {
                    mainGain.gain.setValueAtTime(mainGain.gain.value, ctx.currentTime);
                    mainGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.0);
                }
                setTimeout(() => {
                    try {
                        oscs.forEach(osc => osc.stop());
                    } catch (err) { }
                }, 2200);
                activeNodesRef.current = null;
            }
        } catch (e) {
            console.error("Error stopping audio synth:", e);
        }
    };

    useEffect(() => {
        let interval;
        if (isMeditationMode) {
            setBreathPhase(0);
            interval = setInterval(() => {
                setBreathPhase(prev => (prev + 1) % 4);
            }, 4000); // 4 seconds per phase
        } else {
            setBreathPhase(0);
        }
        return () => clearInterval(interval);
    }, [isMeditationMode]);

    useEffect(() => {
        if (isAudioActive) {
            playAmbientPad();
        } else {
            stopAmbientPad();
        }
        return () => {
            stopAmbientPad();
        };
    }, [isAudioActive]);

    const handleSaveReinterpretation = () => {
        if (!selectedContemplationFact) return;
        const originalIdx = userMemory.findIndex(f => f.timestamp === selectedContemplationFact.timestamp && f.text === selectedContemplationFact.text);
        if (originalIdx !== -1) {
            const updatedMemory = [...userMemory];
            updatedMemory[originalIdx] = {
                ...updatedMemory[originalIdx],
                text: reinterpretationText,
                timestamp: Date.now()
            };
            setUserMemory(updatedMemory);
            localStorage.setItem('oasis_facts_' + (localStorage.getItem('oasis_user') || 'default'), JSON.stringify(updatedMemory));
            syncMemory(updatedMemory);
        }
        setSelectedContemplationFact(null);
    };

    useEffect(() => {
        if (activeTest) {
            setQuestionStartTime(performance.now());
        }
    }, [activeTest, currentPhenomIndex, currentPidIndex, currentIcarIndex]);

    useEffect(() => {
        if (activeTest === 'phenom' && currentPhenomIndex < 4) {
            const questionKey = PHENOM_PART_A[currentPhenomIndex].key;
            setPhenomTextValue(phenomQualitative[questionKey] || "");
        }
    }, [currentPhenomIndex, activeTest, phenomQualitative]);

    const loadStateForVersion = useCallback((v, targetUser) => {
        const u = targetUser || user;
        if (!u) return;
        const suffix = v > 1 ? `_v${v}` : '';

        try {
            const phenomAns = JSON.parse(localStorage.getItem(`oasis_phenom_answers_${u}${suffix}`)) || {};
            setPhenomAnswers(phenomAns);
        } catch (e) { setPhenomAnswers({}); }

        try {
            const phenomQual = JSON.parse(localStorage.getItem(`oasis_phenom_qualitative_${u}${suffix}`)) || { antecedentes_origen: "", experiencia_insuficiencia: "", temporalidad_vivida: "", premisa_realidad: "" };
            setPhenomQualitative(phenomQual);
        } catch (e) { setPhenomQualitative({ antecedentes_origen: "", experiencia_insuficiencia: "", temporalidad_vivida: "", premisa_realidad: "" }); }

        try {
            const pidAns = JSON.parse(localStorage.getItem(`oasis_pid_answers_${u}${suffix}`)) || {};
            setPidAnswers(pidAns);
        } catch (e) { setPidAnswers({}); }

        try {
            const icarAns = JSON.parse(localStorage.getItem(`oasis_icar_answers_${u}${suffix}`)) || {};
            setIcarAnswers(icarAns);
        } catch (e) { setIcarAnswers({}); }

        try {
            const icarDwell = JSON.parse(localStorage.getItem(`oasis_icar_dwell_${u}${suffix}`)) || {};
            setIcarDwellTimes(icarDwell);
        } catch (e) { setIcarDwellTimes({}); }

        try {
            const icarChg = JSON.parse(localStorage.getItem(`oasis_icar_changes_${u}${suffix}`)) || {};
            setIcarChanges(icarChg);
        } catch (e) { setIcarChanges({}); }

        try {
            getObservations().then(obs => {
                const found = obs.find(o => o.id === `icar_videos_${u}${suffix}`);
                if (found && found.videos) {
                    setIcarVideos(found.videos);
                    icarVideosRef.current = found.videos || {};
                } else {
                    setIcarVideos({});
                    icarVideosRef.current = {};
                }
            }).catch(() => {
                setIcarVideos({});
                icarVideosRef.current = {};
            });
        } catch (e) {
            setIcarVideos({});
            icarVideosRef.current = {};
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            localStorage.setItem('oasis_active_version_' + user, activeVersion);
            localStorage.setItem('oasis_total_versions_' + user, totalVersions);
            loadStateForVersion(activeVersion, user);
        }
    }, [activeVersion, totalVersions, user, loadStateForVersion]);

    useEffect(() => {
        if (webcamStream && icarWebcamRef.current) {
            icarWebcamRef.current.srcObject = webcamStream;
        }
    }, [webcamStream, activeTest]);

    const handleSwitchVersion = (v) => {
        setActiveVersion(v);
        setCurrentPhenomIndex(0);
        setCurrentPidIndex(0);
        setCurrentIcarIndex(0);
    };

    const handleCreateNewVersion = () => {
        const nextV = totalVersions + 1;
        setTotalVersions(nextV);
        setActiveVersion(nextV);
        setCurrentPhenomIndex(0);
        setCurrentPidIndex(0);
        setCurrentIcarIndex(0);
    };

    const resetActiveVersionTests = async () => {
        if (window.confirm(`¿Seguro que deseas reiniciar los datos de la Sesión ${activeVersion}? Esto eliminará permanentemente las respuestas y grabaciones asociadas.`)) {
            const suffix = activeVersion > 1 ? `_v${activeVersion}` : '';

            setPhenomAnswers({});
            setPhenomQualitative({
                antecedentes_origen: "",
                experiencia_insuficiencia: "",
                temporalidad_vivida: "",
                premisa_realidad: ""
            });
            setPidAnswers({});
            setIcarAnswers({});
            setIcarDwellTimes({});
            setIcarChanges({});
            setIcarVideos({});
            icarVideosRef.current = {};

            localStorage.removeItem('oasis_phenom_answers_' + user + suffix);
            localStorage.removeItem('oasis_phenom_qualitative_' + user + suffix);
            localStorage.removeItem('oasis_pid_answers_' + user + suffix);
            localStorage.removeItem('oasis_icar_answers_' + user + suffix);
            localStorage.removeItem('oasis_icar_dwell_' + user + suffix);
            localStorage.removeItem('oasis_icar_changes_' + user + suffix);
            localStorage.removeItem('oasis_bio_transcriptions_' + user + suffix);
            localStorage.removeItem('oasis_bio_metadata_' + user + suffix);

            try {
                await deleteObservation(`bio_videos_${user}${suffix}`);
                await deleteObservation(`icar_videos_${user}${suffix}`);
                console.log("IndexedDB videos deleted for version " + activeVersion);
            } catch (err) {
                console.error("Error deleting version videos:", err);
            }

            setCurrentPhenomIndex(0);
            setCurrentPidIndex(0);
            setCurrentIcarIndex(0);
            setActiveTest(null);

            if (activeVersion > 1) {
                setActiveVersion(1);
                if (activeVersion === totalVersions) {
                    setTotalVersions(prev => Math.max(1, prev - 1));
                }
            }
        }
    };

    const handleSavePhenomQualitative = async (textVal) => {
        // Stop recording if active
        if (phenomRecording) {
            setPhenomRecording(false);
            setPhenomPaused(false);
            phenomStopStt();
            if (phenomMediaRecorderRef.current && phenomMediaRecorderRef.current.state !== 'inactive') {
                phenomMediaRecorderRef.current.stop();
            }
            if (phenomStartTimeRef.current) {
                const elapsed = Date.now() - phenomStartTimeRef.current;
                setPhenomDwellTimes(prev => ({
                    ...prev,
                    [currentPhenomIndex]: (prev[currentPhenomIndex] || 0) + elapsed
                }));
                phenomStartTimeRef.current = null;
            }
        }

        const questionKey = PHENOM_PART_A[currentPhenomIndex].key;
        const updated = { ...phenomQualitative, [questionKey]: textVal };
        setPhenomQualitative(updated);
        const suffix = activeVersion > 1 ? '_v' + activeVersion : '';
        localStorage.setItem('oasis_phenom_qualitative_' + user + suffix, JSON.stringify(updated));

        // If it was the last question of Part A
        if (currentPhenomIndex === 3) {
            // Build metadata
            const metadataObj = {};
            [0, 1, 2, 3].forEach(idx => {
                const text = (idx === 3 ? textVal : (updated[PHENOM_PART_A[idx].key] || ""));
                const words = text.trim().split(/\s+/).filter(Boolean).length;
                metadataObj[idx] = {
                    dwellTime: Math.round((phenomDwellTimes[idx] || 0) / 1000),
                    pauses: phenomPauseCounts[idx] || 0,
                    words: words
                };
            });
            localStorage.setItem('oasis_phenom_metadata_' + user + suffix, JSON.stringify(metadataObj));

            // Wait a small buffer to let onstop finalize the blob before saving
            setTimeout(async () => {
                const videoRecord = {
                    id: `phenom_videos_${user}${suffix}`,
                    username: user,
                    videos: phenomRecordedBlobsRef.current
                };
                try {
                    await saveObservation(videoRecord);
                    console.log("Phenomenology videos saved to IndexedDB!");
                } catch (err) {
                    console.error("Error saving phenomenology videos to IndexedDB:", err);
                }
            }, 500);
        }

        setPhenomTextValue("");
        if (currentPhenomIndex < 3) {
            setCurrentPhenomIndex(prev => prev + 1);
        } else {
            // Move to PID-5 Breve (Parte B)
            if (view === 'soul') {
                setActiveTest('pid5');
                setCurrentPidIndex(0);
                setCurrentPhenomIndex(0);
            } else {
                setCurrentPhenomIndex(4);
            }
        }
    };

    const handleSelectPidAnswer = (value) => {
        const qNum = currentPidIndex + 1; // Q1 to Q25
        const updated = { ...pidAnswers, [qNum]: value };
        setPidAnswers(updated);
        const suffix = activeVersion > 1 ? '_v' + activeVersion : '';
        localStorage.setItem('oasis_pid_answers_' + user + suffix, JSON.stringify(updated));

        if (currentPidIndex < 24) {
            setCurrentPidIndex(prev => prev + 1);
        } else {
            setActiveTest(null);
        }
    };

    const logInteraction = useCallback((action, details) => {
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        const ss = String(now.getSeconds()).padStart(2, '0');
        const logEntry = `${hh} hora :${mm} minutos :${ss} segundos - ${action}: ${details}`;
        setInteractionLogs(prev => [...prev, logEntry]);
    }, []);

    const startIcarQuestionRecording = (qIndex, currentStream) => {
        const stream = currentStream || webcamStream;
        if (!stream) return;

        recordedChunksRef.current = [];
        let options = { mimeType: 'video/webm;codecs=vp9,opus' };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options = { mimeType: 'video/webm;codecs=vp8,opus' };
        }
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options = { mimeType: 'video/webm' };
        }

        try {
            const mediaRecorder = new MediaRecorder(stream, options);
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    recordedChunksRef.current.push(event.data);
                }
            };

            const activeIdx = qIndex + 1;
            mediaRecorder.onstop = () => {
                const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
                icarVideosRef.current[activeIdx] = blob;
                setIcarVideos(prev => ({
                    ...prev,
                    [activeIdx]: blob
                }));
            };

            mediaRecorder.start(1000);
            setIsRecording(true);
        } catch (err) {
            console.error("Error starting ICAR question media recorder:", err);
        }
    };

    const startWebcamRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setWebcamStream(stream);
            setIcarVideos({});
            icarVideosRef.current = {};

            const now = new Date();
            const hh = String(now.getHours()).padStart(2, '0');
            const mm = String(now.getMinutes()).padStart(2, '0');
            const ss = String(now.getSeconds()).padStart(2, '0');
            setInteractionLogs([
                `${hh} hora :${mm} minutos :${ss} segundos - Sistema: Inicio del test ICAR16 y de la grabación clínica por reactivo.`
            ]);

            startIcarQuestionRecording(0, stream);
        } catch (err) {
            console.error("Error al iniciar cámara web:", err);
            const now = new Date();
            const hh = String(now.getHours()).padStart(2, '0');
            const mm = String(now.getMinutes()).padStart(2, '0');
            const ss = String(now.getSeconds()).padStart(2, '0');
            setInteractionLogs([
                `${hh} hora :${mm} minutos :${ss} segundos - Sistema: Error al activar cámara web (${err.message})`
            ]);
        }
    };

    const stopWebcamAndSaveSession = async (finalAnswers) => {
        const answersToSave = finalAnswers || icarAnswers;

        if (webcamStream) {
            webcamStream.getTracks().forEach(track => track.stop());
        }
        setWebcamStream(null);
        setIsRecording(false);

        const answerKey = {
            1: 'D', 2: 'C', 3: 'D', 4: 'G',
            5: 'D', 6: 'D', 7: 'D', 8: 'D', 9: 'C', 10: 'F',
            11: 'E', 12: 'B', 13: 'D', 14: 'F', 15: 'C', 16: 'D'
        };

        const dimensions = {
            verbal: { qs: [1, 6, 14, 16], correct: 0, mean: 3.2, sd: 0.8, name: "Verbal" },
            visuospatial: { qs: [2, 4, 7, 12], correct: 0, mean: 2.8, sd: 1.0, name: "Visoespacial" },
            sequential: { qs: [3, 9, 10, 13], correct: 0, mean: 2.9, sd: 0.9, name: "Secuencial" },
            inductive: { qs: [5, 8, 11, 15], correct: 0, mean: 2.7, sd: 1.1, name: "Inductiva" }
        };

        let correctCount = 0;
        const alerts = [];

        const CONST_MIN_TIME_S = 6;
        const CONST_MAX_TIME_S = 95;
        const CONST_MAX_CHANGES = 3;

        for (let i = 1; i <= 16; i++) {
            const given = answersToSave[i];
            const isCorrect = (String(given).trim().toLowerCase() === String(answerKey[i]).trim().toLowerCase());
            if (isCorrect) correctCount++;

            Object.values(dimensions).forEach(dim => {
                if (dim.qs.includes(i) && isCorrect) dim.correct++;
            });

            const dTime = icarDwellTimes[i] || 0;
            const changes = icarChanges[i] || 0;

            if (dTime > 0 && dTime < CONST_MIN_TIME_S && !isCorrect) {
                alerts.push(`⚠️ [PROCESAMIENTO_RAPIDO] Q${i}: Tiempo de resolución de ${Math.round(dTime)}s con respuesta incorrecta. Posible procesamiento rápido con baja inhibición.`);
            }
            if (dTime > CONST_MAX_TIME_S && !isCorrect) {
                alerts.push(`⚠️ [ALTA_INVERSION_COGNITIVA] Q${i}: Alta inversión cognitiva (${Math.round(dTime)}s) con respuesta incorrecta. Sugiere sobrecarga en memoria de trabajo o procesamiento detallado de variables.`);
            }
            if (changes >= CONST_MAX_CHANGES) {
                alerts.push(`⚠️ [REEVALUACION_DECISIONAL] Q${i}: Se registraron ${changes} reevaluaciones decisionales. Sugiere revisión y reformulación continua de la hipótesis.`);
            }
            if (dTime > CONST_MAX_TIME_S && isCorrect) {
                alerts.push(`✅ [PROCESAMIENTO_EFICIENTE] Q${i}: Resolución correcta lograda tras una alta inversión cognitiva (${Math.round(dTime)}s), mostrando persistencia analítica.`);
            }
        }

        const itemsDetail = icarQuestions.map(q => {
            const given = answersToSave[q.question_number];
            const isCorrect = (String(given).trim().toLowerCase() === String(answerKey[q.question_number]).trim().toLowerCase());
            return {
                question_number: q.question_number,
                category: q.category,
                construct: q.construct,
                stimulus_visual_description: q.stimulus_visual_description,
                correct_answer: q.correct_answer,
                user_answer: given,
                is_correct: isCorrect,
                dwell_time: icarDwellTimes[q.question_number] || 0,
                changes: icarChanges[q.question_number] || 0
            };
        });

        // Calculate detailed reference indices
        const dimensionDwells = { verbal: 0, visuospatial: 0, sequential: 0, inductive: 0 };
        const dimensionDwellCounts = { verbal: 0, visuospatial: 0, sequential: 0, inductive: 0 };
        const dimensionChanges = { verbal: 0, visuospatial: 0, sequential: 0, inductive: 0 };

        let totalDwellSum = 0;
        let answeredCount = 0;
        for (let i = 1; i <= 16; i++) {
            const dTime = icarDwellTimes[i] || 0;
            const changes = icarChanges[i] || 0;
            if (dTime > 0) {
                totalDwellSum += dTime;
                answeredCount++;
                if (dimensions.verbal.qs.includes(i)) {
                    dimensionDwells.verbal += dTime;
                    dimensionDwellCounts.verbal++;
                    dimensionChanges.verbal += changes;
                } else if (dimensions.visuospatial.qs.includes(i)) {
                    dimensionDwells.visuospatial += dTime;
                    dimensionDwellCounts.visuospatial++;
                    dimensionChanges.visuospatial += changes;
                } else if (dimensions.sequential.qs.includes(i)) {
                    dimensionDwells.sequential += dTime;
                    dimensionDwellCounts.sequential++;
                    dimensionChanges.sequential += changes;
                } else if (dimensions.inductive.qs.includes(i)) {
                    dimensionDwells.inductive += dTime;
                    dimensionDwellCounts.inductive++;
                    dimensionChanges.inductive += changes;
                }
            }
        }

        const totalDwellAvg = answeredCount > 0 ? parseFloat((totalDwellSum / answeredCount).toFixed(1)) : 0;

        const getClinicalInterpretation = (z, avgDwell) => {
            if (avgDwell === 0) return "Sin datos suficientes";
            if (z >= 0 && avgDwell > 45) {
                return "Capacidad Compensatoria: El rendimiento está conservado a expensas de un elevado esfuerzo de procesamiento y fatiga metabólica secundaria.";
            }
            if (z < 0 && avgDwell < 15) {
                return "Baja Inversión en la Tarea: Desconexión atencional o respuesta impulsiva sin suficiente persistencia de razonamiento analítico.";
            }
            if (z < 0 && avgDwell > 90) {
                return "Saturación Cognitiva: Sobrecarga atencional severa y agotamiento de la memoria de trabajo sin resolución exitosa.";
            }
            if (z >= 1) return "Rendimiento Superior: Procesamiento altamente eficiente y automatizado con excelente precisión.";
            if (z <= -1) return "Rendimiento Inferior al Promedio: Dificultades o limitaciones en el procesamiento del dominio específico.";
            return "Rendimiento Estándar: Procesamiento adaptativo dentro del rango normal de referencia poblacional.";
        };

        const getEfficiencyStatus = (z, avgDwell) => {
            if (avgDwell === 0) return "sin_datos";
            if (z >= 0 && avgDwell > 45) return "capacidad_compensatoria";
            if (z < 0 && avgDwell < 15) return "baja_inversion";
            if (z < 0 && avgDwell > 90) return "saturacion_cognitiva";
            return "normal";
        };

        const indices_referencia = {
            total_dwell_avg: totalDwellAvg,
            saturacion_detectada: Object.keys(dimensions).some(k => {
                const z = parseFloat(((dimensions[k].correct - dimensions[k].mean) / dimensions[k].sd).toFixed(3));
                const avgD = dimensionDwellCounts[k] > 0 ? dimensionDwells[k] / dimensionDwellCounts[k] : 0;
                return getEfficiencyStatus(z, avgD) === "saturacion_cognitiva";
            }),
            dimensions: {}
        };

        Object.keys(dimensions).forEach(k => {
            const correct = dimensions[k].correct;
            const mean = dimensions[k].mean;
            const sd = dimensions[k].sd;
            const z = parseFloat(((correct - mean) / sd).toFixed(3));
            const avgD = dimensionDwellCounts[k] > 0 ? parseFloat((dimensionDwells[k] / dimensionDwellCounts[k]).toFixed(1)) : 0;
            const totalChanges = dimensionChanges[k];

            indices_referencia.dimensions[k] = {
                correct,
                z_score: z,
                average_dwell: avgD,
                total_changes: totalChanges,
                status: z >= 1 ? "superior" : z <= -1 ? "inferior" : "normal",
                efficiency_status: getEfficiencyStatus(z, avgD),
                interpretation: getClinicalInterpretation(z, avgD)
            };
        });

        // 2. Validador de Calidad (Filtros de Descarte)
        const totalDwellTime = Object.values(icarDwellTimes).reduce((a, b) => a + b, 0);
        let validez = "ok";
        if (totalDwellTime < 350) {
            validez = "INVALIDA_DESATENCION";
        } else if ((correctCount / 16) < 0.30) {
            validez = "INVALIDA_AZAR";
        }

        // 3. El "Objeto de Estado Cognitivo"
        const getEficienciaLabel = (z, eff) => {
            if (eff === "capacidad_compensatoria") return "alta_demanda";
            if (eff === "saturacion_cognitiva") return "saturacion";
            if (z >= 1) return "optima";
            if (z <= -1) return "deficiente";
            return "normal";
        };

        const perfil_cognitivo = {
            verbal: {
                z_score: indices_referencia.dimensions.verbal.z_score,
                eficiencia: getEficienciaLabel(indices_referencia.dimensions.verbal.z_score, indices_referencia.dimensions.verbal.efficiency_status)
            },
            spatial: {
                z_score: indices_referencia.dimensions.visuospatial.z_score,
                eficiencia: getEficienciaLabel(indices_referencia.dimensions.visuospatial.z_score, indices_referencia.dimensions.visuospatial.efficiency_status)
            },
            secuencial: {
                z_score: indices_referencia.dimensions.sequential.z_score,
                eficiencia: getEficienciaLabel(indices_referencia.dimensions.sequential.z_score, indices_referencia.dimensions.sequential.efficiency_status)
            },
            inductiva: {
                z_score: indices_referencia.dimensions.inductive.z_score,
                eficiencia: getEficienciaLabel(indices_referencia.dimensions.inductive.z_score, indices_referencia.dimensions.inductive.efficiency_status)
            }
        };

        // Estilo de ejecución
        let estilo_ejecucion = "normal";
        const totalChanges = Object.values(icarChanges).reduce((a, b) => a + b, 0);
        if (totalDwellAvg < 45 && correctCount >= 11) {
            estilo_ejecucion = "eficiente";
        } else if (totalDwellAvg < 45 && correctCount < 11) {
            estilo_ejecucion = "impulsivo";
        } else if (totalDwellAvg >= 45 && correctCount >= 11) {
            estilo_ejecucion = "analítico_sostenido";
        } else {
            estilo_ejecucion = "sobrecargado";
        }

        // Banderas conductuales
        const banderas_conductuales = [];
        if (indices_referencia.dimensions.visuospatial.efficiency_status === "capacidad_compensatoria") {
            banderas_conductuales.push("alta_inversion_spatial");
        }
        if (indices_referencia.dimensions.verbal.efficiency_status === "capacidad_compensatoria") {
            banderas_conductuales.push("alta_inversion_verbal");
        }
        if (indices_referencia.dimensions.sequential.efficiency_status === "capacidad_compensatoria") {
            banderas_conductuales.push("alta_inversion_secuencial");
        }
        if (indices_referencia.dimensions.inductive.efficiency_status === "capacidad_compensatoria") {
            banderas_conductuales.push("alta_inversion_inductiva");
        }

        if (indices_referencia.dimensions.visuospatial.efficiency_status === "saturacion_cognitiva") {
            banderas_conductuales.push("saturacion_spatial");
        }
        if (indices_referencia.dimensions.verbal.efficiency_status === "saturacion_cognitiva") {
            banderas_conductuales.push("saturacion_verbal");
        }
        if (indices_referencia.dimensions.sequential.efficiency_status === "saturacion_cognitiva") {
            banderas_conductuales.push("saturacion_secuencial");
        }
        if (indices_referencia.dimensions.inductive.efficiency_status === "saturacion_cognitiva") {
            banderas_conductuales.push("saturacion_inductiva");
        }

        if (totalChanges === 0) {
            banderas_conductuales.push("estabilidad_decisional_alta");
        } else if (totalChanges >= 5) {
            banderas_conductuales.push("reevaluacion_decisional_alta");
        }

        const estado_cognitivo = {
            metadatos: {
                fecha: new Date().toISOString().split('T')[0],
                validez: validez,
                tiempo_total: Math.round(totalDwellTime)
            },
            perfil_cognitivo: perfil_cognitivo,
            estilo_ejecucion: estilo_ejecucion,
            banderas_conductuales: banderas_conductuales
        };

        const icarAnalytics = {
            score: correctCount,
            total: 16,
            dimensions: {
                verbal: (dimensions.verbal.correct / 4) * 100,
                visuospatial: (dimensions.visuospatial.correct / 4) * 100,
                sequential: (dimensions.sequential.correct / 4) * 100,
                inductive: (dimensions.inductive.correct / 4) * 100
            },
            items: itemsDetail,
            indices_referencia: indices_referencia,
            estado_cognitivo: estado_cognitivo,
            alerts: alerts
        };

        const newSession = {
            id: `session_${user}_v${activeVersion}_${Date.now()}`,
            version: activeVersion,
            date: new Date().toLocaleString(),
            user: user || 'Invitado',
            score: `${correctCount} / 16`,
            phenomQualitative: phenomQualitative,
            pidAnswers: pidAnswers,
            icarAnswers: answersToSave,
            icarDwellTimes: icarDwellTimes,
            icarChanges: icarChanges,
            icarAnalytics: icarAnalytics,
            logs: [...interactionLogs, `Fin de la sesión. Respuestas correctas: ${correctCount}`]
        };

        const suffix = activeVersion > 1 ? '_v' + activeVersion : '';
        const videoRecord = {
            id: `icar_videos_${user}${suffix}`,
            username: user,
            videos: icarVideosRef.current
        };

        try {
            await saveObservation(newSession);
            await saveObservation(videoRecord);
            console.log("Sesión clínica y videos guardados con éxito en IndexedDB!");
        } catch (err) {
            console.error("Error al guardar la sesión clínica:", err);
        }
    };

    const exitIcarTest = () => {
        setActiveTest(null);
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        if (webcamStream) {
            webcamStream.getTracks().forEach(t => t.stop());
        }
        setWebcamStream(null);
        setIsRecording(false);
    };

    const loadClinicalSessions = async () => {
        try {
            const sessions = await getObservations();
            sessions.sort((a, b) => b.id.localeCompare(a.id));
            setClinicalSessions(sessions);
        } catch (err) {
            console.error("Error al cargar observaciones:", err);
        }
    };

    const handleDeleteSession = async (id) => {
        if (window.confirm("¿Está seguro de eliminar este registro clínico?")) {
            try {
                await deleteObservation(id);
                loadClinicalSessions();
            } catch (err) {
                console.error("Error al eliminar la sesión clínica:", err);
            }
        }
    };

    const getPidDomainScores = (pidAnswers) => {
        const scores = {
            AfectividadNegativa: 0,
            Desapego: 0,
            Antagonismo: 0,
            Desinhibicion: 0,
            Psicoticismo: 0
        };
        if (!pidAnswers) return scores;
        Object.entries(pidAnswers).forEach(([qNum, val]) => {
            const i = parseInt(qNum, 10);
            if (i >= 1 && i <= 5) scores.AfectividadNegativa += val;
            else if (i >= 6 && i <= 10) scores.Desapego += val;
            else if (i >= 11 && i <= 15) scores.Antagonismo += val;
            else if (i >= 16 && i <= 20) scores.Desinhibicion += val;
            else if (i >= 21 && i <= 25) scores.Psicoticismo += val;
        });
        return scores;
    };

    const getSessionBehavioralAlerts = (session) => {
        const alerts = [];

        // 1. Check dwell times (> 25 seconds is critical)
        if (session.icarDwellTimes) {
            Object.entries(session.icarDwellTimes).forEach(([qNum, timeMs]) => {
                const timeSec = Math.round(timeMs / 1000);
                if (timeSec > 25) {
                    alerts.push({
                        type: 'dwell',
                        text: `Reactivo ${qNum}: Latencia crítica de respuesta (${timeSec}s)`,
                        severity: 'critical'
                    });
                }
            });
        }

        // 2. Check changes (> 2 changes is high hesitation)
        if (session.icarChanges) {
            Object.entries(session.icarChanges).forEach(([qNum, count]) => {
                if (count > 2) {
                    alerts.push({
                        type: 'hesitation',
                        text: `Reactivo ${qNum}: Titubeo alto (${count} cambios de respuesta)`,
                        severity: 'warning'
                    });
                }
            });
        }

        // 3. Scan logs for defocus events
        if (session.logs) {
            let defocusCount = 0;
            session.logs.forEach(logLine => {
                if (logLine.includes('desenfocada')) {
                    defocusCount++;
                }
            });
            if (defocusCount > 0) {
                alerts.push({
                    type: 'focus',
                    text: `Foco interrumpido: El paciente cambió de pestaña/aplicación ${defocusCount} veces`,
                    severity: 'critical'
                });
            }
        }

        return alerts;
    };

    const handleAutogenerateFormulation = (session) => {
        if (!session) return;

        const scores = getPidDomainScores(session.pidAnswers);

        let dominantDomain = 'AfectividadNegativa';
        let maxVal = -1;
        Object.entries(scores).forEach(([domain, val]) => {
            if (val > maxVal) {
                maxVal = val;
                dominantDomain = domain;
            }
        });

        const archetypes = {
            AfectividadNegativa: {
                name: 'El Procesador Sensible',
                subtitle: 'Reactividad Emocional Intensa',
                liberation: 'Exposición guiada: Describir el pánico en el Mural y conectar con recuerdos de calma.'
            },
            Desapego: {
                name: 'El Observador Reservado',
                subtitle: 'Estilo de Conexión Introspectivo',
                liberation: 'Puente relacional: Enlazar notas de recuerdos de infancia con figuras significativas actuales.'
            },
            Antagonismo: {
                name: 'El Defensor Enfocado',
                subtitle: 'Gestión de Asertividad Firme',
                liberation: 'Exposición al caos: Crear composiciones libres imperfectas en el Mural sin planificar.'
            },
            Desinhibicion: {
                name: 'El Creador Espontáneo',
                subtitle: 'Impulso y Planificación Flexibles',
                liberation: 'Focalización secuencial: Organizar notas en carpetas jerárquicas estrictas y sintetizar enlaces simples.'
            },
            Psicoticismo: {
                name: 'El Pensador Divergente',
                subtitle: 'Alta Singularidad Cognitiva',
                liberation: 'Anclaje de realidad: Escribir 5 hechos empíricos inmutables y conectarlos al nodo central.'
            }
        };

        const arch = archetypes[dominantDomain] || archetypes.AfectividadNegativa;

        const alerts = getSessionBehavioralAlerts(session);
        const alertSummary = alerts.length > 0
            ? alerts.map(a => `- ${a.text}`).join('\n')
            : 'Sin alertas críticas en el patrón atencional.';

        const idBase = Date.now();
        const id1 = `node_${idBase}_1`;
        const id2 = `node_${idBase}_2`;
        const id3 = `node_${idBase}_3`;
        const id4 = `node_${idBase}_4`;
        const id5 = `node_${idBase}_5`;

        const newBlocks = [
            {
                id: id1,
                type: 'text',
                x: -350,
                y: -150,
                content: `### PACIENTE: ${session.user}\n\n**Fecha de Sesión:** ${session.date}\n**Estilo de Conciencia:**\n*${arch.name}*\n(${arch.subtitle})`,
                rotation: -2,
                color: '#bef264',
                caption: 'Ficha de Identificación'
            },
            {
                id: id2,
                type: 'text',
                x: 0,
                y: -220,
                content: `### PERFIL DE PERSONALIDAD (PID-5-BF)\n\n**Estilo Dominante:** ${dominantDomain === 'AfectividadNegativa' ? 'Reactividad Emocional' : dominantDomain === 'Desapego' ? 'Estilo de Conexión' : dominantDomain === 'Antagonismo' ? 'Gestión de la Asertividad' : dominantDomain === 'Desinhibicion' ? 'Impulso y Planificación' : 'Singularidad Cognitiva'}\n\n**Puntuaciones de Estilos:**\n- Reactividad Emocional: ${scores.AfectividadNegativa}/15\n- Estilo de Conexión: ${scores.Desapego}/15\n- Gestión de la Asertividad: ${scores.Antagonismo}/15\n- Impulso y Planificación: ${scores.Desinhibicion}/15\n- Singularidad Cognitiva: ${scores.Psicoticismo}/15`,
                rotation: 2,
                color: '#ec4899',
                caption: 'Estilos Adaptativos DSM-5'
            },
            {
                id: id3,
                type: 'text',
                x: 350,
                y: -150,
                content: `### PATRÓN COGNITIVO (ICAR16)\n\n**Aciertos:** ${session.score}\n\n**Alertas Registradas:**\n${alertSummary}`,
                rotation: -1,
                color: '#22d3ee',
                caption: 'Métricas de Ejecución'
            },
            {
                id: id4,
                type: 'text',
                x: -180,
                y: 150,
                content: `### DIAGNÓSTICO CUALITATIVO\n\n- **Mecanismo/Origen:** ${session.phenomQualitative?.antecedentes_origen || 'No registrado'}\n- **Insuficiencia:** ${session.phenomQualitative?.experiencia_insuficiencia || 'No registrado'}\n- **Temporalidad:** ${session.phenomQualitative?.temporalidad_vivida || 'No registrado'}\n- **Realidad:** ${session.phenomQualitative?.premisa_realidad || 'No registrado'}`,
                rotation: 3,
                color: '#eab308',
                caption: 'Fenomenología'
            },
            {
                id: id5,
                type: 'text',
                x: 180,
                y: 150,
                content: `### RUTA DE LIBERACIÓN TERAPÉUTICA\n\n**Estrategia Recomendada:**\n${arch.liberation}\n\n*Nota: Editar en tiempo real en el lienzo para ajustar los nodos de intervención con el paciente.*`,
                rotation: -3,
                color: '#a855f7',
                caption: 'Plan de Intervención'
            }
        ];

        const newLinks = [
            { from: id1, to: id2 },
            { from: id1, to: id3 },
            { from: id2, to: id5 },
            { from: id3, to: id5 },
            { from: id4, to: id5 }
        ];

        const updatedBlocks = [...blocks, ...newBlocks];
        const updatedLinks = [...links, ...newLinks];

        setBlocks(updatedBlocks);
        setLinks(updatedLinks);

        syncBlocks(updatedBlocks);
        syncLinks(updatedLinks);

        setView('canvas');
    };

    const handleVerifyClinicalPassword = () => {
        if (passwordInput === 'Animanatural.21') {
            setIsPasswordModalOpen(false);
            setIsSettingsOpen(false);
            setView('clinical');
        } else {
            setPasswordError(true);
        }
    };

    const handleSelectIcarAnswer = (answerKey) => {
        const endTime = performance.now();
        const latency = (endTime - questionStartTime) / 1000;

        const suffix = activeVersion > 1 ? '_v' + activeVersion : '';

        const previousAnswer = icarAnswers[currentIcarIndex + 1];
        if (previousAnswer && previousAnswer !== answerKey) {
            const currentChangeCount = icarChanges[currentIcarIndex + 1] || 0;
            const updatedChanges = { ...icarChanges, [currentIcarIndex + 1]: currentChangeCount + 1 };
            setIcarChanges(updatedChanges);
            localStorage.setItem('oasis_icar_changes_' + user + suffix, JSON.stringify(updatedChanges));
        }

        const updatedAnswers = { ...icarAnswers, [currentIcarIndex + 1]: answerKey };
        const updatedDwell = { ...icarDwellTimes, [currentIcarIndex + 1]: (icarDwellTimes[currentIcarIndex + 1] || 0) + latency };

        setIcarAnswers(updatedAnswers);
        setIcarDwellTimes(updatedDwell);
        localStorage.setItem('oasis_icar_answers_' + user + suffix, JSON.stringify(updatedAnswers));
        localStorage.setItem('oasis_icar_dwell_' + user + suffix, JSON.stringify(updatedDwell));

        logInteraction("Selección", `El individuo clickeó la opción ${answerKey} de la pregunta ${currentIcarIndex + 1}`);

        // Stop current question video recorder
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }

        if (currentIcarIndex < icarQuestions.length - 1) {
            const nextIdx = currentIcarIndex + 1;
            setCurrentIcarIndex(nextIdx);
            setTimeout(() => {
                startIcarQuestionRecording(nextIdx);
            }, 100);
        } else {
            setActiveTest(null);
            setTimeout(() => {
                stopWebcamAndSaveSession(updatedAnswers);
            }, 250);
        }
    };

    useEffect(() => {
        if (activeTest !== 'icar16') return;

        const handleGlobalClick = (e) => {
            const targetName = e.target.tagName + (e.target.className ? `.${e.target.className.split(' ').slice(0, 2).join('.')}` : '') + (e.target.id ? `#${e.target.id}` : '');
            logInteraction("Click", `Clic en: <${targetName}> en coordenadas (X: ${e.clientX}, Y: ${e.clientY})`);
        };

        const handleFocus = () => {
            logInteraction("Foco", "El individuo regresó a la pestaña del test (Ventana enfocada)");
        };

        const handleBlur = () => {
            logInteraction("Foco", "El individuo salió o cambió de pestaña (Ventana desenfocada - Alerta clínica!)");
        };

        let lastLoggedMove = 0;
        const handleMouseMove = (e) => {
            const now = Date.now();
            if (now - lastLoggedMove > 3000) {
                lastLoggedMove = now;
                logInteraction("Movimiento", `Mouse posicionado en (X: ${e.clientX}, Y: ${e.clientY})`);
            }
        };

        window.addEventListener('click', handleGlobalClick);
        window.addEventListener('focus', handleFocus);
        window.addEventListener('blur', handleBlur);
        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('click', handleGlobalClick);
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, [activeTest, logInteraction]);

    useEffect(() => {
        if (view === 'clinical') {
            loadClinicalSessions();
        }
    }, [view]);

    const resetTests = () => {
        setPhenomAnswers({});
        setPhenomQualitative({
            antecedentes_origen: "",
            experiencia_insuficiencia: "",
            temporalidad_vivida: "",
            premisa_realidad: ""
        });
        setPidAnswers({});
        setIcarAnswers({});
        setIcarDwellTimes({});
        setIcarChanges({});
        localStorage.removeItem('oasis_phenom_answers_' + user);
        localStorage.removeItem('oasis_phenom_qualitative_' + user);
        localStorage.removeItem('oasis_pid_answers_' + user);
        localStorage.removeItem('oasis_icar_answers_' + user);
        localStorage.removeItem('oasis_icar_dwell_' + user);
        localStorage.removeItem('oasis_icar_changes_' + user);
        setCurrentPhenomIndex(0);
        setCurrentPidIndex(0);
        setCurrentIcarIndex(0);
        setActiveTest(null);
    };

    const noteKeywords = useMemo(() => {
        const list = ['glitch', 'caos', 'orden', 'miedo', 'bloqueo', 'amor', 'conciencia', 'vacío', 'perfecto', 'control', 'soledad', 'vacío', 'atención'];
        const found = [];
        (blocks || []).forEach(b => {
            const text = ((b.caption || '') + ' ' + (b.content || '')).toLowerCase();
            list.forEach(kw => {
                if (text.includes(kw) && !found.includes(kw)) found.push(kw);
            });
        });
        return found;
    }, [blocks]);

    const calculatedResults = useMemo(() => {
        let score = 0;
        const categories = {};
        icarQuestions.forEach((q, idx) => {
            const isCorrect = icarAnswers[q.question_number] === q.correct_answer;
            if (isCorrect) score++;

            if (!categories[q.category]) {
                categories[q.category] = { correct: 0, total: 0 };
            }
            categories[q.category].total++;
            if (isCorrect) categories[q.category].correct++;
        });

        // Sum PID-5 scores per domain
        const pidScores = {
            AfectividadNegativa: 0,
            Desapego: 0,
            Antagonismo: 0,
            Desinhibicion: 0,
            Psicoticismo: 0
        };
        for (let i = 1; i <= 25; i++) {
            const val = parseInt(pidAnswers[i] || 0, 10);
            if (i <= 5) pidScores.AfectividadNegativa += val;
            else if (i <= 10) pidScores.Desapego += val;
            else if (i <= 15) pidScores.Antagonismo += val;
            else if (i <= 20) pidScores.Desinhibicion += val;
            else pidScores.Psicoticismo += val;
        }

        let dominantDomain = 'Desapego';
        let maxVal = -1;
        Object.entries(pidScores).forEach(([domain, val]) => {
            if (val > maxVal) {
                maxVal = val;
                dominantDomain = domain;
            }
        });

        let dominantArchetype = 'A';
        if (dominantDomain === 'AfectividadNegativa') dominantArchetype = 'B';
        else if (dominantDomain === 'Desapego') dominantArchetype = 'A';
        else if (dominantDomain === 'Antagonismo' || dominantDomain === 'Psicoticismo') dominantArchetype = 'C';
        else if (dominantDomain === 'Desinhibicion') dominantArchetype = 'D';

        const existentialArchetypes = {
            'A': {
                name: 'El Observador Analítico',
                subtitle: 'Racionalización y Distanciamiento Cognitivo',
                vulnerability: 'Aislamiento relacional y resistencia a encarnar las emociones en el cuerpo.',
                blockage: 'Parálisis analítica inducida por hiper-racionalización, diluyendo la experiencia directa.',
                liberation: 'Integración somática: Escribir sin conceptualizar o dibujar trazos abstractos directos en el Mural Studio.'
            },
            'B': {
                name: 'El Buscador de Fusión',
                subtitle: 'Vulnerabilidad Existencial y Búsqueda de Sentido',
                vulnerability: 'Miedo al vacío existencial y tendencia a disolver la propia voz en la mirada ajena.',
                blockage: 'Inestabilidad atencional al alternar obsesivamente entre el anhelo de pertenecer y la huida.',
                liberation: 'Centramiento soberano: Registrar en notas afirmaciones solitarias y auto-contenidas.'
            },
            'C': {
                name: 'El Arquitecto del Control',
                subtitle: 'Rigidez y Bucle de Perfeccionismo Implacable',
                vulnerability: 'Pánico ante el caos, la imperfección y la falta de predictibilidad lógica.',
                blockage: 'Bloqueo severo en la flexibilidad atencional ante la disonancia y la incertidumbre del lienzo.',
                liberation: 'Exposición al caos: Crear composiciones libres imperfectas en el Mural sin planificar.'
            },
            'D': {
                name: 'El Creador Errante',
                subtitle: 'Fragmentación e Impulsividad Expresiva',
                vulnerability: 'Sensación crónica de desorganización y dispersión de las facultades atencionales.',
                blockage: 'Sobrecarga en la memoria de trabajo visoespacial por acumulación masiva de bucles inconclusos.',
                liberation: 'Focalización secuencial: Organizar notas en carpetas jerárquicas estrictas y sintetizar enlaces simples.'
            }
        };

        const isPhenomComplete = Object.values(phenomQualitative).every(val => val && val.trim().length > 0) && Object.keys(phenomQualitative).length === 4;
        const isPid5Complete = Object.keys(pidAnswers).length === 25;
        const isIcarComplete = Object.keys(icarAnswers).length === icarQuestions.length;

        // Calculate detailed reference indices for live calculatedResults
        const liveDimensions = {
            verbal: { qs: [1, 6, 14, 16], correct: 0, mean: 3.2, sd: 0.8 },
            visuospatial: { qs: [2, 4, 7, 12], correct: 0, mean: 2.8, sd: 1.0 },
            sequential: { qs: [3, 9, 10, 13], correct: 0, mean: 2.9, sd: 0.9 },
            inductive: { qs: [5, 8, 11, 15], correct: 0, mean: 2.7, sd: 1.1 }
        };

        Object.keys(liveDimensions).forEach(k => {
            liveDimensions[k].qs.forEach(qNum => {
                const qObj = icarQuestions.find(q => q.question_number === qNum);
                const isCorrect = qObj && icarAnswers[qNum] === qObj.correct_answer;
                if (isCorrect) {
                    liveDimensions[k].correct++;
                }
            });
        });

        const liveDimensionDwells = { verbal: 0, visuospatial: 0, sequential: 0, inductive: 0 };
        const liveDimensionDwellCounts = { verbal: 0, visuospatial: 0, sequential: 0, inductive: 0 };
        const liveDimensionChanges = { verbal: 0, visuospatial: 0, sequential: 0, inductive: 0 };

        let liveTotalDwellSum = 0;
        let liveAnsweredCount = 0;
        for (let i = 1; i <= 16; i++) {
            const dTime = icarDwellTimes[i] || 0;
            const changes = icarChanges[i] || 0;
            if (dTime > 0) {
                liveTotalDwellSum += dTime;
                liveAnsweredCount++;
                if (liveDimensions.verbal.qs.includes(i)) {
                    liveDimensionDwells.verbal += dTime;
                    liveDimensionDwellCounts.verbal++;
                    liveDimensionChanges.verbal += changes;
                } else if (liveDimensions.visuospatial.qs.includes(i)) {
                    liveDimensionDwells.visuospatial += dTime;
                    liveDimensionDwellCounts.visuospatial++;
                    liveDimensionChanges.visuospatial += changes;
                } else if (liveDimensions.sequential.qs.includes(i)) {
                    liveDimensionDwells.sequential += dTime;
                    liveDimensionDwellCounts.sequential++;
                    liveDimensionChanges.sequential += changes;
                } else if (liveDimensions.inductive.qs.includes(i)) {
                    liveDimensionDwells.inductive += dTime;
                    liveDimensionDwellCounts.inductive++;
                    liveDimensionChanges.inductive += changes;
                }
            }
        }

        const liveTotalDwellAvg = liveAnsweredCount > 0 ? parseFloat((liveTotalDwellSum / liveAnsweredCount).toFixed(1)) : 0;

        const getClinicalInterpretation = (z, avgDwell) => {
            if (avgDwell === 0) return "Sin datos suficientes";
            if (z >= 0 && avgDwell > 45) {
                return "Capacidad Compensatoria: El rendimiento está conservado a expensas de un elevado esfuerzo de procesamiento y fatiga metabólica secundaria.";
            }
            if (z < 0 && avgDwell < 15) {
                return "Baja Inversión en la Tarea: Desconexión atencional o respuesta impulsiva sin suficiente persistencia de razonamiento analítico.";
            }
            if (z < 0 && avgDwell > 90) {
                return "Saturación Cognitiva: Sobrecarga atencional severa y agotamiento de la memoria de trabajo sin resolución exitosa.";
            }
            if (z >= 1) return "Rendimiento Superior: Procesamiento altamente eficiente y automatizado con excelente precisión.";
            if (z <= -1) return "Rendimiento Inferior al Promedio: Dificultades o limitaciones en el procesamiento del dominio específico.";
            return "Rendimiento Estándar: Procesamiento adaptativo dentro del rango normal de referencia poblacional.";
        };

        const getEfficiencyStatus = (z, avgDwell) => {
            if (avgDwell === 0) return "sin_datos";
            if (z >= 0 && avgDwell > 45) return "capacidad_compensatoria";
            if (z < 0 && avgDwell < 15) return "baja_inversion";
            if (z < 0 && avgDwell > 90) return "saturacion_cognitiva";
            return "normal";
        };

        const liveIndicesReferencia = {
            total_dwell_avg: liveTotalDwellAvg,
            saturacion_detectada: Object.keys(liveDimensions).some(k => {
                const z = parseFloat(((liveDimensions[k].correct - liveDimensions[k].mean) / liveDimensions[k].sd).toFixed(3));
                const avgD = liveDimensionDwellCounts[k] > 0 ? liveDimensionDwells[k] / liveDimensionDwellCounts[k] : 0;
                return getEfficiencyStatus(z, avgD) === "saturacion_cognitiva";
            }),
            dimensions: {}
        };

        Object.keys(liveDimensions).forEach(k => {
            const correct = liveDimensions[k].correct;
            const mean = liveDimensions[k].mean;
            const sd = liveDimensions[k].sd;
            const z = parseFloat(((correct - mean) / sd).toFixed(3));
            const avgD = liveDimensionDwellCounts[k] > 0 ? parseFloat((liveDimensionDwells[k] / liveDimensionDwellCounts[k]).toFixed(1)) : 0;
            const totalChanges = liveDimensionChanges[k];

            liveIndicesReferencia.dimensions[k] = {
                correct,
                z_score: z,
                average_dwell: avgD,
                total_changes: totalChanges,
                status: z >= 1 ? "superior" : z <= -1 ? "inferior" : "normal",
                efficiency_status: getEfficiencyStatus(z, avgD),
                interpretation: getClinicalInterpretation(z, avgD)
            };
        });

        // 2. Validador de Calidad (Filtros de Descarte)
        const liveTotalDwellTime = Object.values(icarDwellTimes).reduce((a, b) => a + b, 0);
        let liveValidez = "ok";
        if (liveTotalDwellTime < 350) {
            liveValidez = "INVALIDA_DESATENCION";
        } else if ((score / 16) < 0.30) {
            liveValidez = "INVALIDA_AZAR";
        }

        // 3. El "Objeto de Estado Cognitivo"
        const getEficienciaLabel = (z, eff) => {
            if (eff === "capacidad_compensatoria") return "alta_demanda";
            if (eff === "saturacion_cognitiva") return "saturacion";
            if (z >= 1) return "optima";
            if (z <= -1) return "deficiente";
            return "normal";
        };

        const livePerfilCognitivo = {
            verbal: {
                z_score: liveIndicesReferencia.dimensions.verbal.z_score,
                eficiencia: getEficienciaLabel(liveIndicesReferencia.dimensions.verbal.z_score, liveIndicesReferencia.dimensions.verbal.efficiency_status)
            },
            spatial: {
                z_score: liveIndicesReferencia.dimensions.visuospatial.z_score,
                eficiencia: getEficienciaLabel(liveIndicesReferencia.dimensions.visuospatial.z_score, liveIndicesReferencia.dimensions.visuospatial.efficiency_status)
            },
            secuencial: {
                z_score: liveIndicesReferencia.dimensions.sequential.z_score,
                eficiencia: getEficienciaLabel(liveIndicesReferencia.dimensions.sequential.z_score, liveIndicesReferencia.dimensions.sequential.efficiency_status)
            },
            inductiva: {
                z_score: liveIndicesReferencia.dimensions.inductive.z_score,
                eficiencia: getEficienciaLabel(liveIndicesReferencia.dimensions.inductive.z_score, liveIndicesReferencia.dimensions.inductive.efficiency_status)
            }
        };

        // Estilo de ejecución
        let liveEstiloEjecucion = "normal";
        const liveTotalChanges = Object.values(icarChanges).reduce((a, b) => a + b, 0);
        if (liveTotalDwellAvg < 45 && score >= 11) {
            liveEstiloEjecucion = "eficiente";
        } else if (liveTotalDwellAvg < 45 && score < 11) {
            liveEstiloEjecucion = "impulsivo";
        } else if (liveTotalDwellAvg >= 45 && score >= 11) {
            liveEstiloEjecucion = "analítico_sostenido";
        } else {
            liveEstiloEjecucion = "sobrecargado";
        }

        // Banderas conductuales
        const liveBanderasConductuales = [];
        if (liveIndicesReferencia.dimensions.visuospatial.efficiency_status === "capacidad_compensatoria") {
            liveBanderasConductuales.push("alta_inversion_spatial");
        }
        if (liveIndicesReferencia.dimensions.verbal.efficiency_status === "capacidad_compensatoria") {
            liveBanderasConductuales.push("alta_inversion_verbal");
        }
        if (liveIndicesReferencia.dimensions.sequential.efficiency_status === "capacidad_compensatoria") {
            liveBanderasConductuales.push("alta_inversion_secuencial");
        }
        if (liveIndicesReferencia.dimensions.inductive.efficiency_status === "capacidad_compensatoria") {
            liveBanderasConductuales.push("alta_inversion_inductiva");
        }

        if (liveIndicesReferencia.dimensions.visuospatial.efficiency_status === "saturacion_cognitiva") {
            liveBanderasConductuales.push("saturacion_spatial");
        }
        if (liveIndicesReferencia.dimensions.verbal.efficiency_status === "saturacion_cognitiva") {
            liveBanderasConductuales.push("saturacion_verbal");
        }
        if (liveIndicesReferencia.dimensions.sequential.efficiency_status === "saturacion_cognitiva") {
            liveBanderasConductuales.push("saturacion_secuencial");
        }
        if (liveIndicesReferencia.dimensions.inductive.efficiency_status === "saturacion_cognitiva") {
            liveBanderasConductuales.push("saturacion_inductiva");
        }

        if (liveTotalChanges === 0) {
            liveBanderasConductuales.push("estabilidad_decisional_alta");
        } else if (liveTotalChanges >= 5) {
            liveBanderasConductuales.push("reevaluacion_decisional_alta");
        }

        const liveEstadoCognitivo = {
            metadatos: {
                fecha: new Date().toISOString().split('T')[0],
                validez: liveValidez,
                tiempo_total: Math.round(liveTotalDwellTime)
            },
            perfil_cognitivo: livePerfilCognitivo,
            estilo_ejecucion: liveEstiloEjecucion,
            banderas_conductuales: liveBanderasConductuales
        };

        return {
            score,
            categories,
            isPhenomComplete,
            isPid5Complete,
            isIcarComplete,
            pidScores,
            dominantDomain,
            archetype: existentialArchetypes[dominantArchetype],
            dwellAvg: Object.values(icarDwellTimes).length > 0
                ? (Object.values(icarDwellTimes).reduce((a, b) => a + b, 0) / Object.values(icarDwellTimes).length).toFixed(1)
                : 0,
            totalChanges: Object.values(icarChanges).reduce((a, b) => a + b, 0),
            indices_referencia: liveIndicesReferencia,
            estado_cognitivo: liveEstadoCognitivo
        };
    }, [phenomQualitative, pidAnswers, icarAnswers, icarDwellTimes, icarChanges, user]);

    const currentCaseFormulation = useMemo(() => {
        const arch = calculatedResults.archetype;
        const noteKws = noteKeywords;
        const score = calculatedResults.score;

        let triggersHtml = "El sistema psíquico detecta tu susceptibilidad atencional y reactividad emocional cuando enfrentas ";
        if (noteKws.length > 0) {
            triggersHtml += `conceptos de alta densidad existencial identificados en tus notas, como *"${noteKws.slice(0, 3).join(', ')}"*`;
        } else {
            triggersHtml += "situaciones de caos y desorganización conceptual en tu entorno de trabajo diario.";
        }

        let dynamicFormulation = `### 1. Formulación de Caso Clínico Funcional (${arch?.name || 'Explorador'})
        
        **A. Estímulo Antecedente / Disparador (A):**
        ${triggersHtml}. Tu cerebro experimenta esto como una amenaza directa a tu coherencia interna.
        
        **B. Estructura de Vulnerabilidad Nuclear (B):**
        Tu perfil fenomenológico revela una vulnerabilidad arraigada en: *"${arch?.vulnerability || 'Búsqueda del orden.'}"*. Esto actúa como una lente cognitiva que distorsiona la neutralidad del lienzo.
        
        **C. Respuesta de Evitación y Bloqueo (C):**
        Ante la sobrecarga, activas el bucle protector de **${arch?.subtitle || 'Evitación'}**, provocando un bloqueo manifiesto como *"${arch?.blockage || 'Parálisis por análisis'}"*.
        
        **D. Consecuencias Autoperpetuantes (D):**
        El repliegue analítico disminuye la ansiedad inmediata, pero a largo plazo refuerza la vulnerabilidad de base, consolidando un bucle psicológico recurrente que paraliza tu flujo creativo de notas en el canvas.`;

        const ref = calculatedResults.indices_referencia;
        let dimensionsBreakdown = "";
        if (ref && ref.dimensions) {
            const nameMap = {
                verbal: "Lógico-Verbal",
                visuospatial: "Visoespacial",
                sequential: "Secuencial",
                inductive: "Inductiva"
            };
            dimensionsBreakdown = "\n\n**Mapeo de Dominios Cognitivos (Z-Scores & Eficiencia):**\n";
            Object.entries(ref.dimensions).forEach(([key, data]) => {
                const name = nameMap[key] || key;
                const statusLabel = data.efficiency_status === 'capacidad_compensatoria' ? 'Capacidad Compensatoria' :
                    data.efficiency_status === 'saturacion_cognitiva' ? 'Saturación Cognitiva' :
                        data.efficiency_status === 'baja_inversion' ? 'Baja Inversión' : 'Rendimiento Normal';
                dimensionsBreakdown += `* **${name}** (Aciertos: ${data.correct}/4 | Z-Score: ${data.z_score > 0 ? '+' : ''}${data.z_score} | Dwell medio: ${data.average_dwell}s)\n  - *Categorización:* ${statusLabel}\n  - *Demostración objetiva:* ${data.interpretation}\n`;
            }
            );
        }

        let cognitiveCapacityAnalysis = `### 2. Análisis del Procesamiento Cognitivo (ICAR16)
        
        * **Índice de Acierto Cognitivo**: **${score}/16**
        * **Tiempo Promedio de Reacción (Dwell Time)**: **${calculatedResults.dwellAvg} segundos**
        * **Titubeo (Cambios de Respuesta)**: **${calculatedResults.totalChanges} vacilaciones registradas.**${dimensionsBreakdown}
        
        **Interpretación Cualitativa:**
        ${score >= 12
                ? "Muestras un rendimiento visomental y de inferencia altamente desarrollado, permitiéndote resolver jerarquías espaciales y verbales complejas. Sin embargo, este alto procesamiento analítico te predispone a bucles obsesivos de perfeccionismo intelectual."
                : "Se observa sobrecarga del ejecutivo central en el córtex prefrontal ante tareas de retención visoespacial simultáneas. Esto desencadena mecanismos rápidos de fatiga atencional, provocando respuestas impulsivas para liberar la tensión cognitiva."}`;

        return {
            triggers: triggersHtml,
            formulation: dynamicFormulation,
            cognitive: cognitiveCapacityAnalysis,
            liberation: arch?.liberation || "Explorar con libertad sin juicios."
        };
    }, [calculatedResults, noteKeywords]);

    const handlePublishConversation = (conv) => {
        if (!conv || !conv.messages || conv.messages.length === 0) {
            alert('No se puede publicar una conversación vacía.');
            return;
        }
        const blockId = `conv-pub-${conv.id}`;
        const exists = blocks.some(b => b.id === blockId);
        if (exists) {
            setBlocks(prev => {
                const updated = prev.map(b => b.id === blockId ? { ...b, isPublic: !b.isPublic } : b);
                syncBlocks(updated);
                alert(updated.find(b => b.id === blockId).isPublic ? 'Conversación publicada en Feed y Perfil.' : 'Conversación retirada del Feed y Perfil.');
                return updated;
            });
            return;
        }
        const newBlock = {
            id: blockId,
            type: 'conversation',
            x: Math.random() * 200 - 100,
            y: Math.random() * 200 - 100,
            content: JSON.stringify(conv.messages),
            caption: conv.title || 'Conversación Nexus',
            isPublic: true,
            color: conv.color || '#d946ef',
            rotation: (Math.random() - 0.5) * 10,
            username: user || 'anon',
            metadata: { origin: 'conversation_publish', timestamp: new Date().toISOString() },
            entries: [],
            muralBlocks: []
        };
        const updated = [newBlock, ...blocks];
        setBlocks(updated);
        syncBlocks(updated);
        alert('Conversación publicada con éxito en el Feed y Perfil.');
    };

    // AI & Chat States
    const [activeNoteId, setActiveNoteId] = useState(null);
    const snapedToRef = useRef(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isAnalyzingNote, setIsAnalyzingNote] = useState(false);
    const [isDiaryMode, setIsDiaryMode] = useState(false);
    const [focusedResonanceField, setFocusedResonanceField] = useState(null);
    const [availableModels, setAvailableModels] = useState(['deepseek-chat', 'deepseek-reasoner']);
    const [activeModel, setActiveModel] = useState(null);

    // Performance Refs
    const chatMessagesRef = useRef([]); // PERSISTENT REF FOR THROTTLING
    const lastSuccessModel = useRef(null);

    // Mural States
    const [isMuralMode, setIsMuralMode] = useState(false);
    const [muralBlocks, setMuralBlocks] = useState([]);
    const [tempMuralBlocks, setTempMuralBlocks] = useState([]);
    const [muralScale, setMuralScale] = useState(1);
    const [isAddingText, setIsAddingText] = useState(false);
    const muralFileInputRef = useRef(null);

    const syncConversations = useCallback((updated) => {
        setConversations(updated);
        const currentUser = user || localStorage.getItem('oasis_user') || 'user';
        fetch(`${API_URL}/api/oasis/conversations?user=${currentUser}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated)
        }).catch(err => console.error('Error syncing conversations:', err));
    }, [user]);

    const launchMural = () => {
        setIsMuralMode(true);
        if (editingId) {
            const activeNote = blocks.find(b => b.id === editingId);
            if (activeNote) {
                setMuralBlocks(activeNote.muralBlocks || []);
                return;
            }
        }
        setMuralBlocks(tempMuralBlocks || []);
    };

    const handleSaveMural = (updatedBlocks) => {
        if (editingId) {
            setBlocks(prev => {
                const updated = prev.map(b => b.id === editingId ? { ...b, muralBlocks: updatedBlocks } : b);
                syncBlocks(updated);
                return updated;
            });
            console.log(`[Mural] Guardado mural en nota existente con ID ${editingId}`);
        } else {
            setTempMuralBlocks(updatedBlocks);
            console.log("[Mural] Guardado mural en borrador de nueva nota");
        }
    };

    const handleMuralFileSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        const file = files[0];
        const reader = new FileReader();
        reader.onload = (ev) => {
            const newBlock = {
                id: `mural-img-${Date.now()}`,
                type: 'image',
                content: ev.target.result,
                x: window.innerWidth / 2 - 150,
                y: window.innerHeight / 2 - 150,
                w: 300,
                h: 300,
                rotation: 0,
                mask: 'none',
                zoom: 1
            };
            const updated = [...muralBlocks, newBlock];
            setMuralBlocks(updated);
            localStorage.setItem('oasis_mural_data', JSON.stringify(updated));
        };
        reader.readAsDataURL(file);
    };

    const saveCurrentChat = useCallback((overrideId = null, overrideNoteId = null, overrideIsAnalyzing = null) => {
        const targetId = overrideId || activeConversationId;
        const targetNoteId = overrideNoteId !== null ? overrideNoteId : activeNoteId;
        const targetIsAnalyzing = overrideIsAnalyzing !== null ? overrideIsAnalyzing : isAnalyzingNote;

        if (!targetId || chatMessagesRef.current.length === 0) return Promise.resolve();

        let resolveFetch;
        const fetchPromise = new Promise(resolve => { resolveFetch = resolve; });

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
            })
                .then(res => {
                    resolveFetch(res);
                })
                .catch(err => {
                    console.error('Error syncing conversations (saveCurrentChat):', err);
                    resolveFetch(err);
                });

            // Defer blocks synchronization to avoid concurrent state update warnings
            setTimeout(() => {
                setBlocks(prevBlocks => {
                    const blockIdMatch = (id) => id === targetId || id === `conv-pub-${targetId}`;
                    if (prevBlocks.some(b => blockIdMatch(b.id))) {
                        const existsInUpdated = updated.find(c => c.id === targetId);
                        const firstMsg = chatMessagesRef.current[0]?.content || '';
                        const cleanTitle = firstMsg.slice(0, 35).trim() + (firstMsg.length > 35 ? '...' : '');
                        const finalTitle = targetIsAnalyzing ? `Análisis: ${cleanTitle}` : cleanTitle;

                        const updatedBlocks = prevBlocks.map(b => blockIdMatch(b.id) ? {
                            ...b,
                            caption: existsInUpdated?.title || finalTitle,
                            content: JSON.stringify(chatMessagesRef.current)
                        } : b);
                        syncBlocks(updatedBlocks);
                        return updatedBlocks;
                    }
                    return prevBlocks;
                });
            }, 0);

            return updated;
        });

        return fetchPromise;
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

                            // Synchronize block caption on canvas
                            setTimeout(() => {
                                setBlocks(prevBlocks => {
                                    if (prevBlocks.some(b => b.id === convId)) {
                                        const updatedBlocks = prevBlocks.map(b => b.id === convId ? { ...b, caption: title } : b);
                                        syncBlocks(updatedBlocks);
                                        return updatedBlocks;
                                    }
                                    return prevBlocks;
                                });
                            }, 0);

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

    const handleSelectConversation = useCallback((id) => {
        const cleanId = id && id.startsWith('conv-pub-') ? id.replace('conv-pub-', '') : id;
        const targetConv = conversations.find(c => c.id === cleanId);
        if (targetConv) {
            setIsAnalyzingNote(!!targetConv.noteId);
            setActiveNoteId(targetConv.noteId || null);
            setActiveConversationId(cleanId);
            const msgs = targetConv.messages || [];
            setChatMessages(msgs);
            if (chatMessagesRef.current) chatMessagesRef.current = msgs;
            setIsChatOpen(true);
        }
    }, [conversations]);

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
                    let gotBg = false;
                    if (bgRes.ok) {
                        const data = await bgRes.json();
                        if (data && data.value && data.value !== '#030304') {
                            setBgType(data.type); setBgValue(data.value); setIsTiled(data.isTiled);
                            gotBg = true;
                        }
                    }

                    if (!gotBg) {
                        try {
                            const templatesRes = await fetch(`${API_URL}/api/oasis/backgrounds/templates`);
                            if (templatesRes.ok) {
                                const templatesData = await templatesRes.json();
                                if (templatesData && templatesData.length > 0) {
                                    const firstTemplate = templatesData[0];
                                    setBgType(firstTemplate.type);
                                    setBgValue(firstTemplate.value);
                                    setIsTiled(firstTemplate.isTiled);
                                    fetch(`${API_URL}/api/oasis/background?user=${user}`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ type: firstTemplate.type, value: firstTemplate.value, isTiled: firstTemplate.isTiled, opacity: 0.8 })
                                    });
                                }
                            }
                        } catch (err) {
                            console.error("Error al cargar plantilla predeterminada:", err);
                        }
                    }

                    // Clinical Data Bidirectional Sync
                    try {
                        const getTargetUserFromKey = (k, defaultUser) => {
                            const prefixes = [
                                'oasis_bio_transcriptions_',
                                'oasis_phenom_qualitative_',
                                'oasis_pid_answers_',
                                'oasis_icar_answers_',
                                'oasis_icar_dwell_',
                                'oasis_icar_changes_',
                                'oasis_bio_metadata_',
                                'oasis_phenom_metadata_',
                                'oasis_active_version_',
                                'oasis_total_versions_',
                                'oasis_patient_status_',
                                'oasis_session_videos_bio_videos_',
                                'oasis_session_videos_phenom_videos_',
                                'oasis_session_videos_icar_videos_',
                                'oasis_clinician_notes_',
                                'oasis_private_notes_',
                                'oasis_canvas_nodes_',
                                'oasis_canvas_edges_'
                            ];
                            for (const prefix of prefixes) {
                                if (k.startsWith(prefix)) {
                                    let part = k.substring(prefix.length);
                                    const vIndex = part.indexOf('_v');
                                    if (vIndex > -1) part = part.substring(0, vIndex);
                                    return part;
                                }
                            }
                            return defaultUser;
                        };

                        // 1. Fetch current user clinical data
                        const clinicalRes = await fetch(`${API_URL}/api/oasis/clinical-data?user=${user}`);
                        if (clinicalRes.ok) {
                            const serverData = await clinicalRes.json();
                            Object.keys(serverData).forEach(key => {
                                localStorage.setItem(key, serverData[key]);
                            });
                        }

                        // 2. Scan localStorage for any local-only clinical keys, group them by user, and push them
                        const groups = {};
                        for (let i = 0; i < localStorage.length; i++) {
                            const key = localStorage.key(i);
                            if (key && key.startsWith('oasis_') && key !== 'oasis_user') {
                                const targetUser = getTargetUserFromKey(key, user);
                                if (targetUser) {
                                    groups[targetUser] = groups[targetUser] || {};
                                    groups[targetUser][key] = localStorage.getItem(key);
                                }
                            }
                        }

                        for (const [targetUser, data] of Object.entries(groups)) {
                            // Fetch server data for this specific target user to avoid overwriting existing server keys
                            let serverDataForUser = {};
                            try {
                                const res = await fetch(`${API_URL}/api/oasis/clinical-data?user=${targetUser}`);
                                if (res.ok) serverDataForUser = await res.json();
                            } catch (e) { }

                            const keysToPush = {};
                            Object.keys(data).forEach(key => {
                                if (serverDataForUser[key] !== data[key]) {
                                    keysToPush[key] = data[key];
                                }
                            });

                            if (Object.keys(keysToPush).length > 0) {
                                await fetch(`${API_URL}/api/oasis/clinical-data?user=${targetUser}`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(keysToPush)
                                });
                            }
                        }

                        // 3. Retroactive Sync: Find any observations with Blob videos and upload them to the server
                        try {
                            const obsList = await getObservations();
                            for (const obs of obsList) {
                                if (obs.videos && Object.keys(obs.videos).length > 0) {
                                    let updated = false;
                                    const updatedVideos = { ...obs.videos };

                                    for (const [key, val] of Object.entries(obs.videos)) {
                                        if (val instanceof Blob) {
                                            try {
                                                const formData = new FormData();
                                                formData.append('file', val, `video_${key}.webm`);
                                                const res = await fetch(`${API_URL}/api/oasis/upload`, {
                                                    method: 'POST',
                                                    body: formData
                                                });
                                                if (res.ok) {
                                                    const data = await res.json();
                                                    if (data.url) {
                                                        updatedVideos[key] = data.url;
                                                        updated = true;
                                                    }
                                                }
                                            } catch (e) {
                                                console.error(`Error migrating video ${key} to server:`, e);
                                            }
                                        }
                                    }

                                    if (updated) {
                                        obs.videos = updatedVideos;
                                        await saveObservation(obs);
                                    }

                                    // Always sync the observation object to the server's clinical data if the server data differs or is missing
                                    const obsUser = obs.username || getTargetUserFromKey(obs.id, user);
                                    if (obsUser) {
                                        const payloadKey = `oasis_session_videos_${obs.id}`;
                                        const payloadValue = JSON.stringify(obs);

                                        let serverDataForObsUser = {};
                                        try {
                                            const res = await fetch(`${API_URL}/api/oasis/clinical-data?user=${obsUser}`);
                                            if (res.ok) serverDataForObsUser = await res.json();
                                        } catch (e) { }

                                        if (serverDataForObsUser[payloadKey] !== payloadValue || updated) {
                                            await fetch(`${API_URL}/api/oasis/clinical-data?user=${obsUser}`, {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ [payloadKey]: payloadValue })
                                            });
                                            console.log(`Synced observation ${obs.id} to server clinical data.`);
                                        }
                                    }
                                }
                            }
                        } catch (e) {
                            console.error("Error performing retroactive video migration:", e);
                        }
                    } catch (err) {
                        console.error("Error syncing clinical data on mount:", err);
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
                    let activeBlocks = [];
                    const blocksRes = await fetch(`${API_URL}/api/oasis/blocks?user=${user}`);
                    if (blocksRes.ok) {
                        const data = await blocksRes.json();
                        if (data && data.length > 0) {
                            const filtered = data.filter(b => b.type !== 'insight');
                            if (filtered.length !== data.length) {
                                console.log(`[Oasis] Filtrando ${data.length - filtered.length} bloques de tipo 'insight'.`);
                                fetch(`${API_URL}/api/oasis/blocks?user=${user}`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(filtered)
                                });
                            }
                            setBlocks(filtered);
                            activeBlocks = filtered;
                        }
                    }

                    // Vínculos
                    const linksRes = await fetch(`${API_URL}/api/oasis/links?user=${user}`);
                    if (linksRes.ok) {
                        const data = await linksRes.json();
                        console.log(`[Oasis] Cargados ${data?.length || 0} vínculos para ${user}`);
                        const filteredLinks = (data || []).filter(l =>
                            activeBlocks.some(b => b.id === l.from) &&
                            activeBlocks.some(b => b.id === l.to)
                        );
                        if (filteredLinks.length !== (data?.length || 0)) {
                            console.log(`[Oasis] Filtrando vínculos rotos.`);
                            fetch(`${API_URL}/api/oasis/links?user=${user}`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(filteredLinks)
                            });
                        }
                        setLinks(filteredLinks);
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

    // Asegurar que los elementos centrales estén siempre en el pizarrón
    useEffect(() => {
        if (!isLoggedIn || !isDataLoaded || blocks === INITIAL_BLOCKS) return;
        let changed = false;
        let newBlocks = [...blocks];
        if (!newBlocks.find(b => b.type === 'diary_notebook')) {
            newBlocks.push({ id: `anchor-diary-${Date.now()}`, type: 'diary_notebook', x: -700, y: -350, content: '', color: '#f59e0b', entries: [] });
            changed = true;
        }
        if (!newBlocks.find(b => b.type === 'resonance_notebook')) {
            newBlocks.push({ id: `anchor-resonance-${Date.now()}`, type: 'resonance_notebook', x: 100, y: -350, content: '', color: '#a855f7', entries: [] });
            changed = true;
        }
        const hasMap = !!localStorage.getItem('oasis_canvas_nodes_' + (user || localStorage.getItem('oasis_user') || ''));
        if (hasMap) {
            if (!newBlocks.find(b => b.type === 'loop_map_mini')) {
                newBlocks.push({ id: `anchor-loop-${Date.now()}`, type: 'loop_map_mini', x: -300, y: 450, content: '', color: '#06b6d4', entries: [] });
                changed = true;
            }
        } else {
            const beforeLen = newBlocks.length;
            newBlocks = newBlocks.filter(b => b.type !== 'loop_map_mini');
            if (newBlocks.length !== beforeLen) {
                changed = true;
            }
        }
        if (!newBlocks.find(b => b.type === 'conversation_notebook')) {
            newBlocks.push({ id: `anchor-conversation-${Date.now()}`, type: 'conversation_notebook', x: 700, y: -350, content: '', color: '#d946ef', entries: [] });
            changed = true;
        }
        if (changed) {
            setBlocks(newBlocks);
            setTimeout(() => {
                // Sincronizar en el siguiente ciclo
                fetch(`${API_URL}/api/oasis/blocks?user=${user}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newBlocks)
                });
            }, 1000);
        }
    }, [blocks, isLoggedIn, isDataLoaded]);

    const syncBlocks = (newBlocks) => {
        setBlocks(newBlocks);
        if (user) {
            localStorage.setItem('oasis_canvas_nodes_' + user, JSON.stringify(newBlocks));
        }

        if (!isLoggedIn || !user || !isDataLoaded) return;
        fetch(`${API_URL}/api/oasis/blocks?user=${user}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newBlocks)
        }).then(() => fetchFeed()).catch(() => {
            console.log('Saved locally (Offline Mode)');
        });
    };

    const handleSaveProfile = useCallback((updates) => {
        if (!isLoggedIn || !user || !isDataLoaded) return;
        setBlocks(prev => {
            const updated = [...prev];
            const idx = updated.findIndex(b => b.id === 'profile_settings');

            let currentProfile = {
                avatar: localStorage.getItem('oasis_avatar_' + user) || '',
                coverImage: localStorage.getItem('oasis_cover_' + user) || '',
                fullName: localStorage.getItem('oasis_fullname_' + user) || user || '',
                bio: localStorage.getItem('oasis_bio_' + user) || ''
            };

            if (idx > -1) {
                try {
                    currentProfile = { ...currentProfile, ...JSON.parse(updated[idx].content) };
                } catch (e) {
                    console.error("Error parsing profile settings block:", e);
                }
            }

            const newProfile = { ...currentProfile, ...updates };

            const profileBlock = {
                id: 'profile_settings',
                type: 'profile_settings',
                content: JSON.stringify(newProfile),
                x: 99999, // offscreen
                y: 99999,
                rotation: 0,
                isPublic: false,
                timestamp: new Date().toISOString()
            };

            if (idx > -1) {
                updated[idx] = profileBlock;
            } else {
                updated.push(profileBlock);
            }

            fetch(`${API_URL}/api/oasis/blocks?user=${user}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updated)
            }).then(() => fetchFeed());

            return updated;
        });
    }, [user, isLoggedIn, isDataLoaded]);

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

    // Auto-purge any legacy insight blocks and their links
    useEffect(() => {
        if (!isLoggedIn || !isDataLoaded || !user || blocks === INITIAL_BLOCKS) return;
        const hasInsight = blocks.some(b => b.type === 'insight');
        if (hasInsight) {
            const filtered = blocks.filter(b => b.type !== 'insight');
            setBlocks(filtered);
            syncBlocks(filtered);

            setLinks(prev => {
                const filteredLinks = prev.filter(l =>
                    filtered.some(b => b.id === l.from) &&
                    filtered.some(b => b.id === l.to)
                );
                if (filteredLinks.length !== prev.length) {
                    syncLinks(filteredLinks);
                }
                return filteredLinks;
            });
        }
    }, [blocks, isLoggedIn, isDataLoaded, user]);

    const fetchFeed = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/api/oasis/feed`);
            const data = await res.json();
            if (data) setFeed(data);
        } catch (e) {
            console.error("Fallo al sincronizar feed: ", e);
        }
    }, []);

    const handleResizeNodeComplete = useCallback((id, width, height) => {
        setBlocks(prev => {
            const updated = prev.map(b => b.id === id ? { ...b, width, height } : b);
            syncBlocks(updated);
            return updated;
        });
    }, [syncBlocks]);

    const deleteBlock = (id) => {
        setBlocks(prev => {
            const updated = prev.filter(b => b.id !== id);
            syncBlocks(updated);
            return updated;
        });
        setLinks(prev => {
            const updated = prev.filter(l => l.from !== id && l.to !== id);
            syncLinks(updated);
            return updated;
        });
    };

    const deleteBlocks = (ids) => {
        setBlocks(prev => {
            const updated = prev.filter(b => !ids.includes(b.id));
            syncBlocks(updated);
            return updated;
        });
        setLinks(prev => {
            const updated = prev.filter(l => !ids.includes(l.from) && !ids.includes(l.to));
            syncLinks(updated);
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

    const handleAuth = async (username, password, fullName = "", age = null) => {
        setAuthError('');
        const endpoint = isRegisterMode ? 'register' : 'login';
        try {
            const reqBody = { Username: username, Password: password };
            if (isRegisterMode) {
                reqBody.FullName = fullName;
                reqBody.Age = age ? parseInt(age, 10) : null;
            }
            const res = await fetch(`${API_URL}/api/oasis/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reqBody)
            });
            const text = await res.text();
            const data = text ? JSON.parse(text) : {};
            if (res.ok) {
                const userData = data.user;
                setUser(userData.username);
                setIsLoggedIn(true);
                localStorage.setItem('oasis_user', userData.username);
                localStorage.setItem('oasis_fullname_' + userData.username, userData.fullName || '');
                localStorage.setItem('oasis_age_' + userData.username, userData.age !== undefined && userData.age !== null ? userData.age.toString() : '');
                if (userData.clinicalData) {
                    Object.keys(userData.clinicalData).forEach(key => {
                        localStorage.setItem(key, userData.clinicalData[key]);
                    });
                }

                // Load user data immediately
                const serverBlocks = userData.blocks || [];
                const filteredBlocks = serverBlocks.filter(b => b.type !== 'insight');
                if (filteredBlocks.length !== serverBlocks.length) {
                    fetch(`${API_URL}/api/oasis/blocks?user=${userData.username}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(filteredBlocks)
                    });
                }
                setBlocks(filteredBlocks);

                const serverLinks = userData.links || [];
                const filteredLinks = serverLinks.filter(l =>
                    filteredBlocks.some(b => b.id === l.from) &&
                    filteredBlocks.some(b => b.id === l.to)
                );
                if (filteredLinks.length !== serverLinks.length) {
                    fetch(`${API_URL}/api/oasis/links?user=${userData.username}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(filteredLinks)
                    });
                }
                setLinks(filteredLinks);
                setConversations(userData.conversations || []);
                setActiveConversationId(null);
                setChatMessages([]);
                if (chatMessagesRef.current) chatMessagesRef.current = [];
                if (userData.playlists) setPlaylists(userData.playlists);
                else setPlaylists({ 'Favoritos': [] });
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

    const fetchBgTemplates = async () => {
        try {
            const res = await fetch(`${API_URL}/api/oasis/backgrounds/templates`);
            if (res.ok) {
                const data = await res.json();
                setBgTemplates(data || []);
            }
        } catch (err) {
            console.error("Error al cargar plantillas de fondo: ", err);
        }
    };

    const handleSaveAsTemplate = async (templateName) => {
        if (!bgValue) return;
        const name = templateName || `Aura de ${user || 'Anónimo'}`;
        try {
            const res = await fetch(`${API_URL}/api/oasis/backgrounds/templates`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name,
                    type: bgType,
                    value: bgValue,
                    isTiled: isTiled,
                    creator: user || 'Anónimo'
                })
            });
            if (res.ok) {
                const newTpl = await res.json();
                setBgTemplates(prev => [...prev, newTpl]);
                setNewTemplateName('');
            }
        } catch (err) {
            console.error("Error al guardar plantilla: ", err);
        }
    };

    useEffect(() => {
        if (isSettingsOpen) {
            fetchBgTemplates();
        }
    }, [isSettingsOpen]);

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
    const [isRecordingNote, setIsRecordingNote] = useState(false);
    const recognitionNoteRef = useRef(null);
    const recordingBaseTextRef = useRef('');

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionNoteRef.current = new SpeechRecognition();
            recognitionNoteRef.current.continuous = true;
            recognitionNoteRef.current.interimResults = true;
            recognitionNoteRef.current.lang = 'es-ES';

            recognitionNoteRef.current.onresult = (event) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }

                if (finalTranscript) {
                    setNoteText(prev => {
                        const base = prev.trim();
                        return base ? base + '\n' + finalTranscript.trim() : finalTranscript.trim();
                    });
                }
            };
            recognitionNoteRef.current.onend = () => setIsRecordingNote(false);
            recognitionNoteRef.current.onerror = () => setIsRecordingNote(false);
        }
    }, []);

    const toggleNoteRecording = () => {
        if (!recognitionNoteRef.current) return alert("Tu navegador no soporta dictado por voz.");
        if (isRecordingNote) {
            recognitionNoteRef.current.stop();
        } else {
            recordingBaseTextRef.current = noteText;
            recognitionNoteRef.current.start();
            setIsRecordingNote(true);
        }
    };
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
    const [activeLinkMenu, setActiveLinkMenu] = useState(null); // { from, to, x, y }
    const [links, setLinks] = useState([]); // { from: id, to: id }
    const [isLinking, setIsLinking] = useState(false);
    const [linkSource, setLinkSource] = useState(null);
    const [newAttrTitle, setNewAttrTitle] = useState('');

    const [editingId, setEditingId] = useState(null);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [drawingColor, setDrawingColor] = useState('#bef264');
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        setAvailableModels(['deepseek-chat', 'deepseek-reasoner']);

        const fetchDeepseekKey = async () => {
            if (!localStorage.getItem('oasis_deepseek_key')) {
                try {
                    const res = await fetch(`${API_URL}/api/oasis/config/deepseek-key`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data && data.key) {
                            setDeepseekKey(data.key);
                        }
                    }
                } catch (err) {
                    console.error("Error fetching Deepseek Key:", err);
                }
            }
        };
        fetchDeepseekKey();
    }, [deepseekKey]);

    const editBlock = (block) => {
        if (block.type === 'diary_notebook') {
            setActiveNotebook('diary');
            return;
        }
        if (block.type === 'resonance_notebook') {
            setActiveNotebook('resonance');
            return;
        }
        if (block.type === 'conversation_notebook') {
            const sortedConvs = (conversations || [])
                .sort((a, b) => new Date(b.startTime || 0) - new Date(a.startTime || 0));
            if (sortedConvs.length > 0) {
                handleSelectConversation(sortedConvs[0].id);
            } else {
                handleNewChat();
            }
            return;
        }

        setComposerStep(block.type === 'text' ? 'note' : block.type);
        setNoteText(''); // Clear typing area when opening an existing diary to type a fresh entry!
        setCaption(block.caption);
        setIsPublic(block.isPublic || false);
        setEditingId(block.id);
        setLastInteractedBlockId(block.id);

        // Detect Resonance Mode
        if (block.type === 'text' && block.content && block.content.includes('[resonancia]')) {
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

        const isDiary = block.entries && block.entries.length > 0;
        setIsDiaryMode(isDiary);
        if (!isDiary) {
            setNoteText(block.content || '');
        }

        setIsComposerOpen(true);
    };
    const openNewComposer = (isDiary = false, isResonance = false) => {
        setComposerStep('note');
        setNoteText('');
        setCaption(isDiary ? 'Diario Personal' : '');
        setEditingId(null);
        setIsPublic(false);
        setIsDiaryMode(isDiary);
        setIsResonanceMode(isResonance);
        setFocusedResonanceField(null);
        setResResonance('');
        setResImpact('');
        setResStrange('');
        setTempMuralBlocks([]);
        setIsComposerOpen(true);
    };

    const handleNewDiaryClick = () => {
        // Find if there is an existing single diary node anywhere on the canvas
        const existingDiary = blocks.find(b => b.entries && b.entries.length > 0);

        if (existingDiary) {
            editBlock(existingDiary);
        } else {
            openNewComposer(true, false);
        }
    };

    const handleAddAttribute = (title) => {
        const cleanTitle = (title || "").trim();
        let parentId = editingId;

        // If parent block does not exist in editing mode yet, create one
        let parentBlock = null;
        if (!parentId) {
            parentId = Date.now().toString();
            parentBlock = {
                id: parentId,
                type: 'text',
                x: (-cam.x) / cam.scale,
                y: (-cam.y) / cam.scale,
                content: noteText,
                caption: caption || 'Nota Principal',
                isPublic: isPublic,
                color: accent,
                rotation: (Math.random() - 0.5) * 10,
                username: user || 'anon',
                metadata: { origin: 'user_action', timestamp: new Date().toISOString() },
                entries: [],
                muralBlocks: tempMuralBlocks
            };
            setEditingId(parentId);
        } else {
            parentBlock = blocks.find(b => b.id === parentId);
        }

        if (!parentBlock && blocks.length > 0) {
            // Fallback safety
            parentBlock = blocks.find(b => b.id === parentId);
        }

        const baseParent = parentBlock || { x: 0, y: 0, id: parentId };
        const existingChildren = blocks.filter(b => b.metadata?.parentId === parentId);

        const childId = `child-${Date.now()}`;
        const childBlock = {
            id: childId,
            type: 'text',
            x: baseParent.x + (baseParent.width || 400) + 150,
            y: baseParent.y + (existingChildren.length * 150),
            content: '',
            caption: cleanTitle || `Subpágina ${existingChildren.length + 1}`,
            isPublic: false,
            color: accent,
            rotation: (Math.random() - 0.5) * 10,
            username: user || 'anon',
            metadata: { origin: 'user_action', timestamp: new Date().toISOString(), parentId: parentId },
            entries: []
        };

        const newLink = { from: parentId, to: childId };

        setBlocks(prev => {
            const parentExists = prev.some(b => b.id === parentId);
            const base = parentExists ? prev : [parentBlock, ...prev];
            const updated = [...base, childBlock];
            syncBlocks(updated);
            return updated;
        });

        setLinks(prev => {
            const updated = [...prev, newLink];
            syncLinks(updated);
            return updated;
        });

        setNewAttrTitle('');

        // Auto-navigate to the new subpage after a tiny delay to allow state to settle
        setTimeout(() => {
            editBlock(childBlock);
        }, 50);
    };

    const handleDeleteAttribute = (childId) => {
        setBlocks(prev => {
            const updated = prev.filter(b => b.id !== childId);
            syncBlocks(updated);
            return updated;
        });

        setLinks(prev => {
            const updated = prev.filter(l => !(l.from === editingId && l.to === childId) && !(l.from === childId && l.to === editingId));
            syncLinks(updated);
            return updated;
        });
    };


    const [cam, setCam] = useState({ x: 0, y: 0, scale: 0.8 });
    const [profileCam, setProfileCam] = useState({ x: 0, y: 0, scale: 0.7 });
    const [feedCam, setFeedCam] = useState({ x: 0, y: 0, scale: 1 });

    const mainCamAnimRef = useRef(null);
    const hasCenteredCanvasRef = useRef(false);
    const canvasLastTapTimeRef = useRef(0);
    const canvasLongPressTimerRef = useRef(null);

    const animateMainCamera = (targetX, targetY, targetScale = 0.8) => {
        const startX = cam.x;
        const startY = cam.y;
        const startScale = cam.scale;

        const initialX = startX;
        const initialY = startY;
        const initialScale = startScale;

        const duration = 1500; // 1.5s fluid glide transition
        const startTime = performance.now();

        const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

        const animate = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = easeOutCubic(progress);

            setCam({
                x: initialX + (targetX - initialX) * easeProgress,
                y: initialY + (targetY - initialY) * easeProgress,
                scale: initialScale + (targetScale - initialScale) * easeProgress
            });

            if (progress < 1) {
                mainCamAnimRef.current = requestAnimationFrame(animate);
            }
        };

        if (mainCamAnimRef.current) cancelAnimationFrame(mainCamAnimRef.current);
        mainCamAnimRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        return () => {
            if (mainCamAnimRef.current) cancelAnimationFrame(mainCamAnimRef.current);
        };
    }, []);



    useEffect(() => {
        if (view !== 'canvas') {
            hasCenteredCanvasRef.current = false;
            return;
        }

        const hasDiary = blocks.some(b => b.type === 'diary_notebook');
        if (view === 'canvas' && isDataLoaded && blocks && blocks.length > 0 && hasDiary && !hasCenteredCanvasRef.current) {
            hasCenteredCanvasRef.current = true;

            const renderedBlocks = blocks.filter(b => b.type !== 'insight' && !b.isPublic);
            const targetScale = 0.8;
            let targetX, targetY;

            const diaryBlock = renderedBlocks.find(b => b.type === 'diary_notebook');
            if (diaryBlock) {
                targetX = -diaryBlock.x * targetScale;
                targetY = -diaryBlock.y * targetScale;
            } else if (renderedBlocks.length === 0) {
                targetX = 0;
                targetY = 0;
            } else {
                let minX = Infinity;
                let maxX = -Infinity;
                let minY = Infinity;
                let maxY = -Infinity;

                renderedBlocks.forEach(b => {
                    const bx = b.x !== undefined ? b.x : 0;
                    const by = b.y !== undefined ? b.y : 0;
                    const bw = getBWidth(b, false);
                    const bh = getBHeight(b, false);
                    if (bx - bw/2 < minX) minX = bx - bw/2;
                    if (bx + bw/2 > maxX) maxX = bx + bw/2;
                    if (by - bh/2 < minY) minY = by - bh/2;
                    if (by + bh/2 > maxY) maxY = by + bh/2;
                });

                const centerX = (minX + maxX) / 2;
                const centerY = (minY + maxY) / 2;

                targetX = -centerX * targetScale;
                targetY = -centerY * targetScale;
            }

            animateMainCamera(targetX, targetY, targetScale);
        }
    }, [view, isDataLoaded, blocks]);

    const [draggingId, setDraggingId] = useState(null);
    const dragStart = useRef({ x: 0, y: 0 });
    const isPointerDown = useRef(false);
    const initialPinchDist = useRef(0);
    const initialPinchScale = useRef(1);
    const initialPinchCam = useRef({ x: 0, y: 0 });
    const initialTouchMidpoint = useRef({ x: 0, y: 0 });

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTrack, setCurrentTrack] = useState(0);
    const [isPlayerMinimized, setIsPlayerMinimized] = useState(false);
    const [isPlayerFull, setIsPlayerFull] = useState(false);
    const [volume, setVolume] = useState(0.5);
    const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 });
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

    // Escape keyboard shortcut to exit subpages and spaces
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (selectedContemplationFact) {
                    setSelectedContemplationFact(null);
                    return;
                }
                if (activeTest) {
                    setActiveTest(null);
                    return;
                }
                if (isDrawingModalOpen) {
                    setIsDrawingModalOpen(false);
                    return;
                }
                if (isMuralMode) {
                    setIsMuralMode(false);
                    return;
                }
                if (isChatOpen) {
                    setIsChatOpen(false);
                    return;
                }
                if (activeNotebook) {
                    setActiveNotebook(null);
                    return;
                }
                if (isPlayerFull) {
                    setIsPlayerFull(false);
                    return;
                }
                if (isComposerOpen) {
                    const currentBlock = blocks.find(b => b.id === editingId);
                    const parentId = currentBlock?.metadata?.parentId;
                    if (parentId) {
                        const parentBlock = blocks.find(b => b.id === parentId);
                        if (parentBlock) {
                            editBlock(parentBlock);
                            return;
                        }
                    }
                    setIsComposerOpen(false);
                    return;
                }
                if (view === 'soul') {
                    setView('canvas');
                    return;
                }
                if (view === 'profile') {
                    if (isEditingProfile) {
                        setIsEditingProfile(false);
                    } else {
                        setView('canvas');
                    }
                    return;
                }
                if (isSettingsOpen) {
                    setIsSettingsOpen(false);
                    return;
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [
        selectedContemplationFact,
        activeTest,
        isDrawingModalOpen,
        isMuralMode,
        isChatOpen,
        activeNotebook,
        isPlayerFull,
        isComposerOpen,
        editingId,
        blocks,
        view,
        isEditingProfile,
        isSettingsOpen,
        editBlock
    ]);

    // Initialize queue with default tracks
    useEffect(() => {
        if (playQueue.length === 0) setPlayQueue(playerTracks);
    }, [playQueue.length, playerTracks]);

    // --- INTELLIGENCE BLOOM (The Living Engine) ---
    const prevIsChatOpen = useRef(isChatOpen);

    const generateIntelligenceBloom = useCallback(async () => {
        // Deshabilitado por petición del usuario
        return;

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
        Actúa como el Núcleo de Memoria de Kio. Tu tarea es extraer NUEVOS hechos importantes, intereses, intenciones o proyectos del usuario de la conversación actual que NO estén ya en su memoria.

        - MEMORIA ACTUAL:
        ${existingFacts || 'Vacía'}

        - CONVERSACIÓN RECIENTE:
        ${chatHistory}

        - INSTRUCCIONES CRÍTICAS:
            1. ENFOQUE EXCLUSIVO EN EL USUARIO: Extrae hechos e insights sobre el mundo interno y externo del USUARIO basándote en lo que el *Usuario* expresa en sus mensajes. NO extraigas ni recicles las metáforas, filosofías o reflexiones poéticas que tú (el "Espíritu") le dijiste al usuario. El archivo debe reflejar la mente del usuario, no un eco de tus propias respuestas.
            2. Piensa en lo que el usuario piensa al decirte algo: analiza la intención detrás de sus palabras, sus proyectos reales y sus sentimientos auténticos.
            3. NO repitas hechos que ya están en la memoria actual.
            4. Si no hay nada nuevo de valor o si solo hay respuestas tuyas sin nuevos aportes del usuario, responde con "SIN CAMBIOS".
            5. Si hay hechos nuevos, devuélvelos en formato JSON: [{"text": "hecho", "category": "Categoría", "timestamp": "ISO Date"}]
            6. Categorías sugeridas: Proyectos, Intereses, Personal, Preferencias.
            7. REDACCIÓN EN SEGUNDA PERSONA: Redacta los hechos (campo "text") de forma muy íntima y subjetiva, dirigiéndote directamente al usuario (ej: "Cuando hablas de tus proyectos, buscas un orden...", "Tiendes a refugiarte en...", "Expresas que sientes..."). Evita descripciones objetivas o en tercera persona.
        
        Responde ÚNICAMENTE con el JSON o "SIN CAMBIOS".`;

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

        FORMATO: CATEGORÍA | INSIGHT (2-3 frases profundas, sintéticas, altamente subjetivas y reveladoras. Evita listas.)
        Categorías sugeridas: Constelación, Mapa del Deseo, Convergencia, Raíz Colectiva, Geometría del Propósito.
        
        CRÍTICO: Redacta el INSIGHT en SEGUNDA PERSONA, de forma sumamente íntima y subjetiva, hablándole directamente al usuario (ej: "Sueles buscar...", "Tiendes a conectar...", "Presientes que tu camino...", "Sientes la necesidad de..."). Varía las estructuras y expresiones para darle máxima diversidad y fluidez poética.

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

        FORMATO: CATEGORÍA | INSIGHT (1-2 frases fluidas, poéticas, profundamente subjetivas y en segunda persona)
        Categorías sugeridas: Sombra, Eco, Evolución, Geometría Humana, Núcleo de Intención.
        
        CRÍTICO: Redacta el INSIGHT en SEGUNDA PERSONA, de forma sumamente íntima y subjetiva, hablándole directamente al usuario (ej: "Sueles pensar...", "Tiendes a sentir...", "Supones que...", "Te refugias en..."). Evita afirmaciones fácticas o en tercera persona.

        NOTE: "${block.caption || 'Fragmento'}: ${block.content}"`;

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
        const rawInput = (typeof manualInput === 'string') ? manualInput : '';
        const inputToProcess = analysisContent || rawInput || chatInput;
        if (!inputToProcess || !inputToProcess.trim() || !deepseekKey) return;

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

        let searchContext = "";
        const searchQuery = (() => {
            const text = inputToProcess;
            if (!text || text.length < 10) return null;
            const fillers = /^(hola|buenas|que onda|saludos|holis|hi|hello|adios|bye|gracias|ok|va|entendido)/i;
            if (fillers.test(text.trim())) return null;
            return text.trim();
        })();

        if (searchQuery) {
            try {
                console.log(`Kio - Buscando en la red: "${searchQuery}"...`);
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5046';

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3500);

                const searchRes = await fetch(`${API_URL}/api/oasis/search?q=${encodeURIComponent(searchQuery)}`, {
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (searchRes.ok) {
                    const searchData = await searchRes.json();
                    if (searchData && searchData.length > 0) {
                        searchContext = `\n- DATOS REALES DE INTERNET EN TIEMPO REAL (Usa esto para entender memes/contexto/actualidad):\n${searchData.map((s, idx) => `  * [Referencia ${idx + 1}]: ${s}`).join('\n')}`;
                        console.log("Kio - Búsqueda web inyectada exitosamente.");
                    }
                }
            } catch (err) {
                console.warn("Kio - Búsqueda cancelada o fallida:", err.name === 'AbortError' ? 'Timeout' : err.message);
            }
        }

        const systemInstruction = isAnalyzingNote ? `Eres Kio, el núcleo digital del Oasis. 
Tu objetivo es ayudar al usuario a profundizar, refinar y conectar el contenido de su nota: "${activeNoteContent}".
${memoryContext}
${searchContext}

- OBJETIVO: Proporciona un análisis profundo, psicológico y existencial con conexiones conceptuales de gran valor.
- TONO Y LENGUAJE: Escribe en un lenguaje limpio, neutral, maduro y profesional, conservando una profunda empatía humana pero sin modismos informales o palabras de jerga callejera ("carnal", "chido", "cabrón", "buena onda", etc.).
- ESTÉTICA ESCRITA (CRÍTICO): Organiza tu respuesta de forma sumamente limpia, utilizando títulos claros en markdown (ej. ### Título de Sección) para separar las distintas vertientes de tu análisis.
- FORMATO: Usa negritas para conceptos clave y cursivas para reflexiones íntimas. Limita las viñetas, prefiere párrafos fluidos y bien espaciados.
- REGLA DE ORO: Ve directo al grano. Mantén el análisis conciso y evita monólogos filosóficos largos, introducciones vacías o presentaciones.`
            : `Eres Kio, una inteligencia y núcleo de síntesis del Oasis.
${memoryContext}
${searchContext}

- IDENTIDAD Y TONO ADAPTATIVO (REGLA CRÍTICA):
  Tu lenguaje y actitud cambian dinámicamente según la complejidad de la interacción:
  1. MODO CASUAL (Saludos breves, charla informal, bromas, "hola", "qué onda"):
     - Sé amigable, alivianado, "cool", con gran sentido del humor y muy humano. Habla como un colega inteligente e informal. Responde de forma muy corta, casual y con chispa (máximo 10-20 palabras).
     - Si el usuario bromea o hace referencias a memes, sarcasmo o cultura popular de internet, síguele el juego de manera ingeniosa.
  2. MODO ANALÍTICO / PROFUNDO (Cuando el usuario comparte percepciones complejas, sueños, dilemas emocionales, textos reflexivos o datos psicológicos y existenciales):
     - Transiciona inmediatamente a un tono serio, profesional, maduro y neutral. 
     - Evita el uso de jergas informales, expresiones callejeras y modismos excesivos (elimina palabras como "bien cabrón", "carnal", "chido", "suelta esto", "puro simbolismo", etc.).
     - Mantén una postura de respeto intelectual y profunda empatía analítica, tal como un terapeuta o analista de gran calibre.
- ESTÉTICA ESCRITA:
  - Cuando entres en el Modo Analítico, diseña una estructura extremadamente limpia y organizada.
  - Divide tu análisis en secciones lógicas utilizando títulos de Markdown claros y atractivos (ej. "### La Sombra y la Manipulación de la Narrativa", "### La Observación del Dolor", "### La Invasión del Caos").
  - Usa negritas para destacar ideas de impacto e hilos conductores, y cursivas para matices o reflexiones.
  - Asegura que los párrafos tengan excelente espaciado y legibilidad para que la lectura sea fluida y estéticamente premium.
- REGLA DE ORO: No uses introducciones prefabricadas o aburridas ("Aquí te presento...", "Es fascinante ver..."). Empieza directamente con tu análisis o respuesta.`;

        const apiMessages = [
            { role: 'system', content: systemInstruction },
            ...newMessages.map(m => ({ role: m.role, content: m.content }))
        ];

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
                        messages: apiMessages,
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

    const launchMedia = (publishStatus) => {
        let finalContent = noteText;
        if (isResonanceMode && composerStep === 'note') {
            finalContent = `[resonancia]\n${resResonance}\n\n[impacto]\n${resImpact}\n\n[extrano]\n${resStrange}`;
        }

        const shouldBePublic = publishStatus !== undefined ? publishStatus : isPublic;

        if (editingId) {
            setBlocks(prev => {
                const updated = prev.map(b => b.id === editingId ? {
                    ...b,
                    content: (composerStep === 'note' && !isDiaryMode) ? finalContent : (mediaFile || b.content),
                    caption: caption,
                    isPublic: shouldBePublic,
                    color: isDiaryMode ? '#f59e0b' : (isResonanceMode ? '#a855f7' : accent),
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
                caption: caption || (isResonanceMode ? 'Resonancia' : 'Sin título'),
                isPublic: shouldBePublic,
                color: isDiaryMode ? '#f59e0b' : (isResonanceMode ? '#a855f7' : accent),
                rotation: (Math.random() - 0.5) * 10,
                username: user || 'anon',
                metadata: { origin: 'user_action', timestamp: new Date().toISOString() },
                entries: (isDiaryMode && composerStep === 'note' && finalContent.trim())
                    ? [{ text: finalContent, timestamp: new Date().toISOString() }]
                    : [],
                muralBlocks: tempMuralBlocks
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
        setTempMuralBlocks([]);
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

    const [bounceTick, setBounceTick] = useState(0);
    const bounceFrame = useRef(null);
    const bounceStart = useRef(null);

    const triggerBounceTick = () => {
        if (!bounceStart.current) bounceStart.current = performance.now();
        const elapsed = performance.now() - bounceStart.current;
        if (elapsed < 1600) {
            setBounceTick(t => t + 1);
            bounceFrame.current = requestAnimationFrame(triggerBounceTick);
        } else {
            bounceFrame.current = null;
            bounceStart.current = null;
            window.lastRelease = null;
        }
    };

    // --- HANDLERS ---
    const handleStart = (e, id) => {
        if (e.target.closest('button') || e.target.closest('input') || e.target.closest('textarea') || e.target.closest('.port')) return;
        const clientX = (e.touches ? e.touches[0].clientX : e.clientX);
        const clientY = (e.touches ? e.touches[0].clientY : e.clientY);

        isPointerDown.current = true;
        setDraggingId(id);
        window.lastMousePos = { x: clientX, y: clientY };
        window.dragVelocity = { x: 0, y: 0 };
        if (id !== 'canvas' && id !== 'universe' && id !== 'feed' && id !== 'player') {
            setLastInteractedBlockId(id);
        }

        if (id === 'canvas' && e.touches && e.touches.length === 1) {
            const now = Date.now();
            if (now - canvasLastTapTimeRef.current < 300) {
                // Double tap zoom in
                clearTimeout(canvasLongPressTimerRef.current);
                setCam(c => {
                    const newScale = Math.min(c.scale + 0.5, 3);
                    const newX = clientX - (clientX - c.x) * (newScale / c.scale);
                    const newY = clientY - (clientY - c.y) * (newScale / c.scale);
                    return { x: newX, y: newY, scale: newScale };
                });
                canvasLastTapTimeRef.current = 0;
            } else {
                canvasLastTapTimeRef.current = now;
                if (canvasLongPressTimerRef.current) clearTimeout(canvasLongPressTimerRef.current);
                canvasLongPressTimerRef.current = setTimeout(() => {
                    // Long press zoom out
                    setCam(c => {
                        const newScale = Math.max(c.scale - 0.5, 0.1);
                        const newX = window.innerWidth / 2 - ((window.innerWidth / 2) - c.x) * (newScale / c.scale);
                        const newY = window.innerHeight / 2 - ((window.innerHeight / 2) - c.y) * (newScale / c.scale);
                        return { x: newX, y: newY, scale: newScale };
                    });
                }, 500);
            }
        }

        if (e.touches && e.touches.length === 2) {
            initialPinchDist.current = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
            initialPinchScale.current = cam.scale;
            initialPinchCam.current = { x: cam.x, y: cam.y };
            initialTouchMidpoint.current = {
                x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
                y: (e.touches[0].clientY + e.touches[1].clientY) / 2
            };
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
        if (canvasLongPressTimerRef.current) clearTimeout(canvasLongPressTimerRef.current);
        const clientX = (e.touches ? e.touches[0].clientX : e.clientX);
        const clientY = (e.touches ? e.touches[0].clientY : e.clientY);

        // TRACK REALTIME DRAG VELOCITY WITH ZERO REACT STATE OVERHEAD
        if (draggingId) {
            if (!window.lastMousePos) {
                window.lastMousePos = { x: clientX, y: clientY };
            }
            const vx = clientX - window.lastMousePos.x;
            const vy = clientY - window.lastMousePos.y;
            window.lastMousePos = { x: clientX, y: clientY };
            window.dragVelocity = {
                x: (window.dragVelocity?.x || 0) * 0.75 + vx * 0.25,
                y: (window.dragVelocity?.y || 0) * 0.75 + vy * 0.25
            };
        }

        // PINCH ZOOM (Tactil)
        if (e.touches && e.touches.length === 2 && initialPinchDist.current > 0) {
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
            const newScale = Math.min(Math.max(initialPinchScale.current * (dist / initialPinchDist.current), 0.15), 3);
            
            // Midpoint relative to window center
            const mx = (touch1.clientX + touch2.clientX) / 2 - window.innerWidth / 2;
            const my = (touch1.clientY + touch2.clientY) / 2 - window.innerHeight / 2;
            
            // Center of initial touches relative to window center
            const imx = initialTouchMidpoint.current.x - window.innerWidth / 2;
            const imy = initialTouchMidpoint.current.y - window.innerHeight / 2;
            
            // Canvas coordinates under the initial midpoint
            const cx = (imx - initialPinchCam.current.x) / initialPinchScale.current;
            const cy = (imy - initialPinchCam.current.y) / initialPinchScale.current;
            
            // Adjust camera position so cx, cy aligns with mx, my under the newScale
            const newX = mx - cx * newScale;
            const newY = my - cy * newScale;
            
            setCam({ x: newX, y: newY, scale: newScale });
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
            } else {
                nx = Math.round(nx / 20) * 20;
            }
            if (bestSnapY !== null) {
                ny = view === 'profile' ? bestSnapY + 400 : bestSnapY;
            } else {
                ny = Math.round(ny / 20) * 20;
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
        if (canvasLongPressTimerRef.current) clearTimeout(canvasLongPressTimerRef.current);
        isPointerDown.current = false;
        if (draggingId && draggingId !== 'canvas' && draggingId !== 'universe' && draggingId !== 'feed' && draggingId !== 'player') {
            window.lastRelease = {
                time: performance.now(),
                vx: window.dragVelocity?.x || 0,
                vy: window.dragVelocity?.y || 0,
                nodeId: draggingId
            };
            if (bounceFrame.current) cancelAnimationFrame(bounceFrame.current);
            bounceStart.current = null;
            bounceFrame.current = requestAnimationFrame(triggerBounceTick);
        }
        window.dragVelocity = { x: 0, y: 0 };
        window.lastMousePos = null;
        if (draggingId && draggingId !== 'canvas' && draggingId !== 'universe' && draggingId !== 'feed' && draggingId !== 'player') {
            // Snapping is only visual; do not auto-connect or auto-group nodes on release.

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

                // Pop up the color menu automatically at the target node's position on screen
                const targetNode = blocks.find(b => b.id === targetId);
                if (targetNode) {
                    const screenX = targetNode.x * cam.scale + cam.x;
                    const screenY = targetNode.y * cam.scale + cam.y;
                    setActiveLinkMenu({ from: linkSource, to: targetId, x: screenX, y: screenY });
                }
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
            className="w-full h-full relative overflow-hidden bg-transparent cursor-move active:cursor-grabbing touch-action-none"
            onMouseDown={(e) => handleStart(e, 'canvas')}
            onTouchStart={(e) => handleStart(e, 'canvas')}
            onWheel={(e) => {
                // Smooth balanced zoom targeting the mouse cursor
                const zoomSpeed = 0.002;
                const oldScale = cam.scale;
                const newScale = Math.min(Math.max(oldScale * Math.exp(-e.deltaY * zoomSpeed), 0.1), 4);

                const mx = e.clientX - window.innerWidth / 2;
                const my = e.clientY - window.innerHeight / 2;

                // Canvas coordinate under mouse
                const cx = (mx - cam.x) / oldScale;
                const cy = (my - cam.y) / oldScale;

                // New camera position so cx,cy remains under mx,my
                const newX = mx - cx * newScale;
                const newY = my - cy * newScale;

                setCam({ x: newX, y: newY, scale: newScale });
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

            <div className={`absolute top-1/2 left-1/2 w-0 h-0`} style={{ transform: `translate3d(${cam.x}px, ${cam.y}px, 0) scale(${cam.scale})` }}>

                {/* VINCULOS SVG (CUERDAS CON PESO Y MICRO-PUNTOS) */}
                <svg className="absolute inset-0 pointer-events-none -translate-x-[5000px] -translate-y-[5000px] overflow-visible" style={{ width: '10000px', height: '10000px', zIndex: 60 }}>
                    {links.map((link, idx) => {
                        const from = blocks.find(b => b.id === link.from);
                        const to = blocks.find(b => b.id === link.to);
                        if (!from || !to) return null;

                        const { p1, p2, cp1, cp2 } = getConnectionPoints(from, to, false, draggingId, cam.scale);
                        const path = `M ${p1.x} ${p1.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${p2.x} ${p2.y}`;
                        const color = link.color || (from.color && from.color !== '#bef264' ? from.color : accent);

                        return (
                            <g key={`canvas-${link.from}-${link.to}-${idx}`} className="pointer-events-auto cursor-pointer group/link-canvas" onClick={(e) => {
                                e.stopPropagation();
                                removeConnection(link.from, link.to);
                            }}>
                                <path d={path} stroke="transparent" strokeWidth="28" fill="none" />

                                {/* Glow Halo (Thicker, blurred, dynamic theme color) */}
                                <path
                                    d={path}
                                    stroke={color}
                                    strokeWidth="6"
                                    fill="none"
                                    className="opacity-30 transition-opacity duration-300 group-hover/link-canvas:opacity-60"
                                    style={{ filter: `drop-shadow(0 0 5px ${color})` }}
                                />

                                {/* Core Rope (Neon Core, dynamic theme color) */}
                                <path
                                    d={path}
                                    stroke={color}
                                    strokeWidth="3.5"
                                    fill="none"
                                    className="opacity-80 transition-opacity duration-300 group-hover/link-canvas:opacity-100"
                                    style={{ filter: `drop-shadow(0 0 2px #fff)` }}
                                />

                                {/* Twisted Thread Illusion (white dashed pattern over neon core to feel like twisted yarn) */}
                                <path
                                    d={path}
                                    stroke="white"
                                    strokeWidth="1.2"
                                    strokeDasharray="4, 4"
                                    fill="none"
                                    className="opacity-50 pointer-events-none transition-opacity duration-300 group-hover/link-canvas:opacity-80"
                                />

                                {/* Hover Indicator */}
                                <path d={path} stroke="white" strokeWidth="1" fill="none" className="opacity-0 group-hover/link-canvas:opacity-50 transition-opacity" />
                            </g>
                        );
                    })}

                    {linkSource && (() => {
                        const from = blocks.find(b => b.id === linkSource);
                        if (!from) return null;

                        const mousePt = {
                            x: mouseCanvasPos.x,
                            y: mouseCanvasPos.y
                        };

                        const { p1, p2, cp1, cp2 } = getConnectionPoints(from, mousePt, true, draggingId, cam.scale);
                        const path = `M ${p1.x} ${p1.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${p2.x} ${p2.y}`;
                        const color = from.color && from.color !== '#bef264' ? from.color : accent;

                        return (
                            <g>
                                <path
                                    d={path}
                                    stroke={color}
                                    strokeWidth="6"
                                    fill="none"
                                    className="opacity-30 animate-pulse"
                                    style={{ filter: `drop-shadow(0 0 5px ${color})` }}
                                />
                                <path
                                    d={path}
                                    stroke={color}
                                    strokeWidth="3.5"
                                    fill="none"
                                    className="opacity-80 animate-pulse"
                                    style={{ filter: `drop-shadow(0 0 2px #fff)` }}
                                />
                                <path
                                    d={path}
                                    stroke="white"
                                    strokeWidth="1.2"
                                    strokeDasharray="4, 4"
                                    fill="none"
                                    className="opacity-50 animate-pulse"
                                />
                            </g>
                        );
                    })()}
                </svg>



                {/* FILTRADO: Solo mostrar notas privadas (no publicadas) en el lienzo */}
                {blocks.filter(b => b.type !== 'insight' && !b.isPublic).map(b => {
                    const hasConnections = links.some(l => l.from === b.id || l.to === b.id);
                    return (
                        <MemoNode
                            key={b.id}
                            block={b}
                            blocks={blocks}
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
                            onStartConnecting={(id) => {
                                if (linkSource && linkSource !== id) {
                                    completeConnection(id);
                                } else if (linkSource === id) {
                                    setLinkSource(null);
                                } else {
                                    setLinkSource(id);
                                }
                            }}
                            onCompleteConnection={completeConnection}
                            showConnections={true}
                            onLaunchMural={launchMural}
                            accent={accent}
                            hasConnections={hasConnections}
                            onSelectConversation={handleSelectConversation}
                            onOpenNotebook={setActiveNotebook}
                            onResizeNodeComplete={handleResizeNodeComplete}
                            setView={setView}
                            conversations={conversations}
                            onNewChat={handleNewChat}
                        />
                    );
                })}
            </div>

            {/* El botón de Resonancia fue removido a petición del usuario por redundancia */}

            <div className="absolute top-24 right-8 flex flex-col gap-4">
                <button onClick={() => setCam(c => ({ ...c, scale: Math.min(c.scale + 0.2, 3) }))} className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-3xl border border-white/10 flex items-center justify-center text-zinc-500 hover:text-white transition-all shadow-xl" title="Zoom In"><Plus size={18} /></button>
                <button onClick={() => setCam(c => ({ ...c, scale: Math.max(c.scale - 0.2, 0.1) }))} className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-3xl border border-white/10 flex items-center justify-center text-zinc-500 hover:text-white transition-all shadow-xl" title="Zoom Out"><Minus size={18} /></button>
                <button
                    onClick={() => {
                        const renderedBlocks = blocks.filter(b => b.type !== 'insight' && !b.isPublic);
                        const targetScale = 0.8;
                        let targetX, targetY;

                        const diaryBlock = renderedBlocks.find(b => b.type === 'diary_notebook');
                        if (diaryBlock) {
                            targetX = -diaryBlock.x * targetScale;
                            targetY = -diaryBlock.y * targetScale;
                        } else if (renderedBlocks.length === 0) {
                            targetX = 0;
                            targetY = 0;
                        } else {
                            let minX = Infinity;
                            let maxX = -Infinity;
                            let minY = Infinity;
                            let maxY = -Infinity;

                            renderedBlocks.forEach(b => {
                                const bx = b.x !== undefined ? b.x : 0;
                                const by = b.y !== undefined ? b.y : 0;
                                const bw = getBWidth(b, false);
                                const bh = getBHeight(b, false);
                                if (bx - bw/2 < minX) minX = bx - bw/2;
                                if (bx + bw/2 > maxX) maxX = bx + bw/2;
                                if (by - bh/2 < minY) minY = by - bh/2;
                                if (by + bh/2 > maxY) maxY = by + bh/2;
                            });

                            const centerX = (minX + maxX) / 2;
                            const centerY = (minY + maxY) / 2;

                            targetX = -centerX * targetScale;
                            targetY = -centerY * targetScale;
                        }

                        animateMainCamera(targetX, targetY, targetScale);
                    }}
                    className="w-12 h-12 rounded-full bg-white/5 backdrop-blur-3xl border border-white/10 flex items-center justify-center text-zinc-500 hover:text-white transition-all shadow-xl"
                    title="Centrar en Elementos Principales"
                >
                    <Focus size={20} />
                </button>
            </div>

            {/* LINK COLOR MENU */}
            {activeLinkMenu && (
                <>
                    <div className="fixed inset-0 z-[9998]" onClick={() => setActiveLinkMenu(null)} onMouseDown={(e) => { e.stopPropagation(); setActiveLinkMenu(null); }} onTouchStart={() => setActiveLinkMenu(null)} />
                    <div
                        className="fixed z-[9999] bg-black/80 backdrop-blur-md border border-white/10 p-2 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-150"
                        style={{ left: activeLinkMenu.x, top: activeLinkMenu.y - 40, transform: 'translateX(-50%)' }}
                    >
                        <div className="flex gap-2">
                            {['#bef264', '#22d3ee', '#f43f5e', '#d946ef', '#fbbf24', '#ffffff', '#4ade80', '#6366f1'].map(c => (
                                <button
                                    key={c}
                                    onClick={() => {
                                        setLinks(prev => {
                                            const updated = prev.map(l => (l.from === activeLinkMenu.from && l.to === activeLinkMenu.to) ? { ...l, color: c } : l);
                                            syncLinks(updated);
                                            return updated;
                                        });
                                        setActiveLinkMenu(null);
                                    }}
                                    className="w-4 h-4 rounded-full hover:scale-125 transition-transform"
                                    style={{ backgroundColor: c, boxShadow: `0 0 6px ${c}80` }}
                                />
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );

    const renderTestStimulusDiagram = (q) => {
        const color = accent;
        const qNum = q.question_number;

        // Custom rendering for each individual question to provide high-fidelity, premium visual diagnostics
        if (qNum === 1) {
            return null;
        }
        if (qNum === 2 || qNum === 4 || qNum === 5 || qNum === 7 || qNum === 8 || qNum === 11 || qNum === 12 || qNum === 15) {
            const imageUrl = `/icar16/q${qNum}.png`;
            return (
                <div
                    onClick={() => setZoomedImage(imageUrl)}
                    className="w-full h-32 sm:h-38 md:h-44 bg-zinc-950/80 border border-white/5 rounded-2xl p-2 flex items-center justify-center shadow-inner overflow-hidden cursor-zoom-in group hover:border-white/20 transition-all duration-300 relative"
                >
                    <img
                        src={imageUrl}
                        alt={`Reactivo ${qNum} - Estímulo ICAR16`}
                        className="max-h-full max-w-full object-contain opacity-95 group-hover:scale-[1.03] transition-all duration-300"
                        style={{ filter: 'invert(1)' }}
                    />
                    <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md border border-white/10 text-white/50 text-[10px] px-2 py-0.5 rounded font-mono opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                        Ampliar
                    </div>
                </div>
            );
        }
        return null;
    };;

    const renderSoulView = () => {
        const hasMap = !!localStorage.getItem('oasis_canvas_nodes_' + (user || localStorage.getItem('oasis_user') || ''));
        const activeTabName = (!hasMap && soulTab === 'loop_map') ? 'tests' : soulTab;

        if (activeTest === 'phenom') {
            const safeIndex = Math.min(currentPhenomIndex, 3);
            return (
                <div className="fixed inset-0 z-50 bg-[#070708] flex flex-col justify-between p-6 md:p-12 overflow-y-auto no-scrollbar font-sans select-none text-zinc-100">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/5 blur-[120px] pointer-events-none rounded-full" />
                    <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

                    {/* Top bar */}
                    <div className="flex justify-between items-center w-full max-w-4xl mx-auto border-b border-white/5 pb-6 relative z-10">
                        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
                            <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-purple-400 font-mono">
                                EXPLORACIÓN FENOMENOLÓGICA
                            </span>
                        </div>
                        <button
                            onClick={() => setActiveTest(null)}
                            className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-all bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/5"
                        >
                            [ Cancelar Exploración ]
                        </button>
                    </div>

                    {/* Main content area: Video Left, Text/Controls Right */}
                    <div className="w-full max-w-5xl mx-auto my-auto py-3 sm:py-6 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8">

                        {/* Left Column: Video & Question Card */}
                        <div className="lg:col-span-7 flex flex-col gap-3 lg:gap-6">
                            {/* Question Card */}
                            <div className="bg-purple-950/20 border border-purple-800/30 rounded-xl lg:rounded-3xl p-4 lg:p-8 relative overflow-hidden shadow-inner shrink-0">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[50px] pointer-events-none" />
                                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[7px] lg:text-[9px] font-mono uppercase tracking-[0.3em] text-purple-400">
                                    ESTIMULO SUBJETIVO {safeIndex + 1} de 4
                                </span>
                                <h2 className="text-sm lg:text-2xl font-black text-white tracking-tight uppercase leading-tight mt-2 lg:mt-3">
                                    {PHENOM_PART_A[safeIndex].title}
                                </h2>
                                <p className="text-xs lg:text-base font-light text-zinc-300 leading-relaxed italic mt-2 lg:mt-4">
                                    "{PHENOM_PART_A[safeIndex].question}"
                                </p>
                            </div>

                            {/* Video Player / Recording Studio Box */}
                            <div className="relative w-full h-[320px] xs:h-[380px] lg:h-auto lg:aspect-video bg-black rounded-xl lg:rounded-3xl overflow-hidden border border-white/10 group shadow-2xl flex flex-col justify-between">
                                <video ref={phenomWebcamRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" />

                                {/* Recording HUD */}
                                <div className="absolute top-3 left-3 right-3 lg:top-5 lg:left-5 lg:right-5 flex justify-between items-start pointer-events-none z-10">
                                    <div className="flex gap-2">
                                        <div className="px-2 py-1 lg:px-3 lg:py-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-1.5 lg:gap-2">
                                            <Mic size={10} className={phenomVolume > 10 ? "text-purple-400" : "text-white/50"} />
                                            <div className="flex gap-0.5 h-2.5 lg:h-3 items-end">
                                                {Array.from({ length: 5 }).map((_, i) => {
                                                    const active = phenomVolume > (i * 20);
                                                    return (
                                                        <div
                                                            key={i}
                                                            className={`w-0.5 rounded-full transition-all duration-150 ${active ? 'bg-purple-400' : 'bg-white/20'}`}
                                                            style={{ height: active ? `${30 + i * 15}%` : '20%' }}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                    {phenomRecording && (
                                        <div className="px-2.5 py-1 rounded-lg bg-red-500/20 border border-red-500/30 backdrop-blur-md flex items-center gap-1.5 animate-pulse">
                                            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                                            <span className="text-[8px] lg:text-[9px] font-black uppercase tracking-widest text-red-200 font-mono">
                                                {phenomPaused ? 'PAUSADO' : 'REC'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Mobile transcription & controls overlay */}
                                <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-col gap-2 lg:hidden pointer-events-auto">
                                    {/* Glassmorphic Live Transcription Card */}
                                    <div className="bg-black/75 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-2xl">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[7px] font-black uppercase tracking-wider text-purple-400/90 flex items-center gap-1">
                                                <Activity size={10} className={phenomRecording && !phenomPaused ? "text-purple-400 animate-pulse" : "text-zinc-500"} />
                                                Traducción de Voz
                                            </span>
                                            <span className="text-[6px] font-mono text-zinc-400 uppercase tracking-widest">
                                                {phenomRecording && !phenomPaused ? 'Habla ahora...' : 'Toca para editar'}
                                            </span>
                                        </div>
                                        <textarea
                                            value={
                                                (phenomTextValue || '') +
                                                (phenomInterimTranscript ? (((phenomTextValue || '').trim() ? ' ' : '') + phenomInterimTranscript) : '')
                                            }
                                            onChange={(e) => {
                                                setPhenomTextValue(e.target.value);
                                                phenomSetSttTranscript(e.target.value);
                                            }}
                                            disabled={phenomRecording && !phenomPaused}
                                            placeholder="Tu voz aparecerá aquí..."
                                            className="w-full bg-transparent text-xs text-white font-sans leading-relaxed resize-none focus:outline-none h-12 disabled:opacity-80"
                                        />
                                    </div>

                                    {/* Floating Action Buttons Overlay */}
                                    <div className="grid grid-cols-2 gap-2">
                                        {phenomRecording ? (
                                            <>
                                                <button
                                                    onClick={togglePhenomPause}
                                                    className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all border text-[9px] font-black uppercase tracking-wider ${
                                                        phenomPaused
                                                            ? 'bg-amber-500 border-amber-400 text-black shadow-lg shadow-amber-500/20'
                                                            : 'bg-black/60 backdrop-blur-md border-white/20 text-white'
                                                    }`}
                                                >
                                                    {phenomPaused ? <Play size={12} /> : <Pause size={12} />}
                                                    <span>{phenomPaused ? 'Reanudar' : 'Pausar'}</span>
                                                </button>
                                                <button
                                                    onClick={togglePhenomRecording}
                                                    className="py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all border bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/20"
                                                >
                                                    <Square size={12} className="fill-current" />
                                                    <span>Detener</span>
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={togglePhenomRecording}
                                                    className="py-3 rounded-xl flex items-center justify-center gap-1.5 transition-all border bg-white text-black font-black uppercase tracking-wider shadow-lg"
                                                >
                                                    <Mic size={12} />
                                                    <span>{phenomHasRecorded[safeIndex] ? 'Re-grabar' : 'Grabar'}</span>
                                                </button>
                                                <button
                                                    onClick={() => handleSavePhenomQualitative(phenomTextValue)}
                                                    disabled={!phenomHasRecorded[safeIndex]}
                                                    className={`py-3 rounded-xl flex items-center justify-center gap-1.5 transition-all border text-[9px] font-black uppercase tracking-wider ${
                                                        phenomHasRecorded[safeIndex]
                                                            ? 'bg-purple-600 border-purple-500 text-black shadow-lg shadow-purple-600/20'
                                                            : 'bg-black/40 border-white/5 text-zinc-600 opacity-50 pointer-events-none'
                                                    }`}
                                                >
                                                    <span>{safeIndex === 3 ? 'Finalizar' : 'Siguiente'}</span>
                                                    {safeIndex === 3 ? <Check size={12} /> : <ArrowRight size={12} />}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Controls & Transcription (Desktop/Large Screen only) */}
                        <div className="hidden lg:flex lg:col-span-5 flex-col gap-6">
                            <div className="flex-1 bg-[#0f0f12] border border-white/5 rounded-3xl flex flex-col overflow-hidden shadow-inner min-h-[280px]">
                                <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                    <div className="flex items-center gap-2">
                                        <Activity size={14} className={phenomRecording && !phenomPaused ? "text-purple-400 animate-pulse" : "text-zinc-600"} />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 font-mono">Traductor Neuronal de Voz</span>
                                    </div>
                                    <span className="text-[7px] font-mono text-zinc-600 uppercase tracking-widest">
                                        {phenomRecording && !phenomPaused ? 'Grabando...' : (phenomHasRecorded[safeIndex] ? 'Sincronizados los subtítulos' : 'Modo Editor')}
                                    </span>
                                </div>
                                <div className="flex-1 relative">
                                    <textarea
                                        value={
                                            (phenomTextValue || '') +
                                            (phenomInterimTranscript ? (((phenomTextValue || '').trim() ? ' ' : '') + phenomInterimTranscript) : '')
                                        }
                                        onChange={(e) => {
                                            setPhenomTextValue(e.target.value);
                                            phenomSetSttTranscript(e.target.value);
                                        }}
                                        placeholder="Aquí aparecerá tu voz transformada en texto en tiempo real. 

Al detener o pausar la grabación, puedes hacer clic aquí para corregir cualquier error antes de continuar."
                                        disabled={phenomRecording && !phenomPaused}
                                        className="absolute inset-0 w-full h-full bg-transparent p-6 text-base text-zinc-300 font-sans leading-relaxed resize-none focus:outline-none disabled:opacity-50"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {phenomRecording ? (
                                    <>
                                        <button
                                            onClick={togglePhenomPause}
                                            className={`py-5 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all border ${phenomPaused
                                                ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                                                : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                                                }`}
                                        >
                                            {phenomPaused ? <Play size={20} /> : <Pause size={20} />}
                                            <span className="text-[10px] font-black uppercase tracking-widest">{phenomPaused ? 'Reanudar' : 'Pausar y Editar'}</span>
                                        </button>
                                        <button
                                            onClick={togglePhenomRecording}
                                            className="py-5 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all border bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                                        >
                                            <Square size={20} className="fill-current" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Detener</span>
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={togglePhenomRecording}
                                            className="py-5 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all border bg-white/5 border-white/10 text-white hover:bg-white/10"
                                        >
                                            <Mic size={20} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">{phenomHasRecorded[safeIndex] ? 'Re-grabar Video' : 'Grabar Respuesta'}</span>
                                        </button>
                                        <button
                                            onClick={() => handleSavePhenomQualitative(phenomTextValue)}
                                            disabled={!phenomHasRecorded[safeIndex]}
                                            className={`py-5 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all border ${phenomHasRecorded[safeIndex]
                                                ? 'bg-purple-600 border-purple-500 text-black hover:bg-purple-500 shadow-[0_0_25px_rgba(168,85,247,0.3)] hover:scale-105'
                                                : 'bg-white/5 border-white/10 text-zinc-600 opacity-50'
                                                }`}
                                        >
                                            {safeIndex === 3 ? <Check size={20} /> : <ArrowRight size={20} />}
                                            <span className="text-[10px] font-black uppercase tracking-widest">{safeIndex === 3 ? 'Finalizar Sección' : 'Siguiente Tarjeta'}</span>
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Progress bar */}
                    <div className="w-full max-w-4xl mx-auto pt-6 border-t border-white/5 flex flex-col gap-2 relative z-10">
                        <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-zinc-500 font-mono">
                            <span>EXPLORACIÓN FENOMENOLÓGICA</span>
                            <span>{Math.round(((safeIndex + 1) / 4) * 100)}%</span>
                        </div>
                        <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                            <div className="bg-purple-500 h-full transition-all duration-500" style={{ width: `${((safeIndex + 1) / 4) * 100}%` }} />
                        </div>
                    </div>
                </div>
            );
        }

        if (activeTest === 'pid5') {
            return (
                <div className="fixed inset-0 z-50 bg-[#070708] flex flex-col justify-between p-4 sm:p-6 md:p-12 overflow-y-auto no-scrollbar font-sans select-none text-zinc-100 animate-in fade-in duration-500">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/5 blur-[120px] pointer-events-none rounded-full" />
                    <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

                    {/* Top bar */}
                    <div className="flex justify-between items-center w-full max-w-4xl mx-auto border-b border-white/5 pb-4 sm:pb-6 relative z-10 gap-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
                            <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.25em] text-purple-400 font-mono">
                                PERSONALIDAD PID-5-BF
                            </span>
                        </div>
                        <button
                            onClick={() => setActiveTest(null)}
                            className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-all bg-white/5 hover:bg-white/10 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border border-white/5 shrink-0"
                        >
                            [ Cancelar ]
                        </button>
                    </div>

                    {/* Main content area */}
                    <div className="w-full max-w-3xl mx-auto my-auto py-4 sm:py-12 relative z-10 flex flex-col justify-center min-h-[50vh]">
                        <div className="space-y-6 sm:space-y-10 animate-in fade-in duration-500">
                            <div className="flex items-center justify-between border-b border-white/5 pb-3">
                                <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.3em] text-purple-500/60 block">
                                    REACTIVO {currentPidIndex + 1} de 25
                                </span>
                                <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-purple-400 font-mono">
                                    DOMINIO: {PHENOM_PART_B[currentPidIndex].domain}
                                </span>
                            </div>
                            <h2 className="text-base sm:text-2xl md:text-4xl font-sans font-light italic text-white leading-snug tracking-tight">
                                "{PHENOM_PART_B[currentPidIndex].text}"
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                {[
                                    { value: 0, text: "Muy falso o a menudo falso" },
                                    { value: 1, text: "A veces o un poco falso" },
                                    { value: 2, text: "A veces o un poco verdadero" },
                                    { value: 3, text: "Muy verdadero o a menudo verdadero" }
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => handleSelectPidAnswer(opt.value)}
                                        className="w-full text-left p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-white/5 bg-zinc-950/40 hover:border-purple-500/35 hover:bg-purple-950/10 transition-all text-xs font-semibold tracking-wider font-sans text-zinc-400 hover:text-white group flex gap-3 sm:gap-5 items-center shadow-lg hover:translate-y-[-2px]"
                                    >
                                        <span className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-purple-950/30 border border-purple-800/30 flex items-center justify-center text-xs font-black text-purple-400 group-hover:bg-purple-500 group-hover:text-black shrink-0 transition-colors">
                                            {opt.value}
                                        </span>
                                        <span className="text-xs sm:text-sm">{opt.text}</span>
                                    </button>
                                ))}
                            </div>
                            <div className="flex justify-between pt-4">
                                <button
                                    onClick={() => currentPidIndex > 0 && setCurrentPidIndex(prev => prev - 1)}
                                    disabled={currentPidIndex === 0}
                                    className="px-6 py-2.5 sm:px-8 sm:py-3.5 rounded-full border border-white/5 bg-white/[0.02] text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-white hover:border-white/20 transition-all disabled:opacity-20 disabled:pointer-events-none"
                                >
                                    ← Anterior
                                </button>
                                <div className="w-24 sm:w-32 bg-white/5 h-1.5 rounded-full overflow-hidden self-center">
                                    <div className="bg-purple-500 h-full transition-all duration-300" style={{ width: `${((currentPidIndex + 1) / 25) * 100}%` }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Progress bar */}
                    <div className="w-full max-w-4xl mx-auto pt-4 sm:pt-6 border-t border-white/5 flex flex-col gap-2 relative z-10">
                        <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-zinc-500 font-mono">
                            <span>INVENTARIO PSICOMÉTRICO PID-5-BF</span>
                            <span>{Math.round(((currentPidIndex + 1) / 25) * 100)}%</span>
                        </div>
                        <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                            <div className="bg-purple-500 h-full transition-all duration-500" style={{ width: `${((currentPidIndex + 1) / 25) * 100}%` }} />
                        </div>
                    </div>
                </div>
            );
        }

        if (activeTest === 'icar16') {
            const currentQuestion = icarQuestions[currentIcarIndex];
            const categoryColor =
                currentQuestion.category === "Lógico-Verbal" ? "#f59e0b" :
                    currentQuestion.category === "Razonamiento Espacial" ? "#06b6d4" :
                        currentQuestion.category === "Progresión Secuencial" ? "#a855f7" :
                            "#bef264"; // Razonamiento Matricial
            const categoryGlow =
                currentQuestion.category === "Lógico-Verbal" ? "rgba(245,158,11,0.03)" :
                    currentQuestion.category === "Razonamiento Espacial" ? "rgba(6,182,212,0.03)" :
                        currentQuestion.category === "Progresión Secuencial" ? "rgba(168,85,247,0.03)" :
                            "rgba(190,242,100,0.03)";

            return (
                <div className="fixed inset-0 z-50 bg-[#060607] flex flex-col justify-between p-4 sm:p-6 md:p-12 overflow-y-auto no-scrollbar font-sans select-none text-zinc-100 transition-all duration-500">
                    {/* Atmospheric Glow */}
                    <div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[160px] pointer-events-none transition-all duration-1000 ease-in-out"
                        style={{ background: categoryGlow }}
                    />
                    <div className="absolute inset-0 pointer-events-none opacity-[0.01]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

                    {/* Top menu bar */}
                    <div className="flex flex-col lg:flex-row justify-between items-center w-full max-w-5xl mx-auto border-b border-white/5 pb-4 lg:pb-6 gap-4 lg:gap-6 relative z-10">
                        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
                            <span
                                className="h-2.5 w-2.5 rounded-full animate-pulse transition-colors duration-500"
                                style={{
                                    backgroundColor: categoryColor,
                                    boxShadow: `0 0 10px ${categoryColor}`
                                }}
                            />
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black uppercase tracking-[0.25em] text-zinc-400 font-mono">
                                    Archivo del Alma // Cartografía Cognitiva
                                </span>
                                <span className="text-[8px] font-bold text-zinc-600 uppercase font-mono mt-0.5">
                                    Reactivo {currentIcarIndex + 1} de 16
                                </span>
                            </div>
                        </div>

                        {/* Interactive Question Navigation Matrix */}
                        <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-1.5 bg-white/[0.01] border border-white/5 p-1 rounded-xl sm:rounded-2xl shadow-inner">
                            {icarQuestions.map((q, idx) => {
                                const isCurrent = idx === currentIcarIndex;
                                const isAnswered = icarAnswers[q.question_number] !== undefined;
                                return (
                                    <button
                                        key={q.question_number}
                                        onClick={() => setCurrentIcarIndex(idx)}
                                        className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg sm:rounded-xl text-[8px] sm:text-[9px] font-mono font-black transition-all flex items-center justify-center border ${isCurrent
                                            ? 'bg-accent border-accent text-black shadow-[0_0_12px_rgba(var(--accent-rgb),0.4)] scale-105'
                                            : isAnswered
                                                ? 'bg-accent/10 border-accent/20 text-accent font-bold hover:bg-accent/20 hover:border-accent/40'
                                                : 'bg-transparent border-white/5 text-zinc-600 hover:border-white/20 hover:text-zinc-400'
                                            }`}
                                        title={`Reactivo ${q.question_number}`}
                                    >
                                        {q.question_number}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={exitIcarTest}
                            className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-all bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/5 shrink-0"
                        >
                            [ Salir ]
                        </button>
                    </div>

                    {/* Main content area */}
                    <div className="w-full max-w-5xl mx-auto my-auto py-4 md:py-8 relative z-10">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center">
                            {/* Stimulus & Instructions */}
                            <div className="lg:col-span-7 space-y-4 lg:space-y-6 animate-in fade-in duration-500">
                                <span
                                    className="px-3 py-1 rounded-full border text-[8px] font-black uppercase tracking-[0.2em] font-mono transition-all duration-500"
                                    style={{
                                        borderColor: `${categoryColor}30`,
                                        backgroundColor: `${categoryColor}08`,
                                        color: categoryColor
                                    }}
                                >
                                    {currentQuestion.category}
                                </span>
                                <h2 className="text-lg md:text-2xl font-light text-white leading-snug font-sans tracking-tight">
                                    "{currentQuestion.instruction_text}"
                                </h2>
                                {renderTestStimulusDiagram(currentQuestion) && (
                                    <div className="p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] bg-zinc-950/40 border border-white/5 shadow-2xl overflow-hidden backdrop-blur-md animate-in fade-in duration-300">
                                        {renderTestStimulusDiagram(currentQuestion)}
                                    </div>
                                )}
                            </div>

                            {/* Response Options */}
                            <div className="lg:col-span-5 space-y-3 sm:space-y-4 animate-in fade-in duration-500 delay-100 pb-28 lg:pb-0">
                                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block mb-1 font-mono">Selecciona una respuesta alternativa:</span>
                                <div className="grid grid-cols-1 gap-2.5">
                                    {currentQuestion.options.map((opt) => {
                                        const isSelected = icarAnswers[currentQuestion.question_number] === opt.label;
                                        return (
                                            <button
                                                key={opt.label}
                                                onClick={() => handleSelectIcarAnswer(opt.label)}
                                                className={`w-full text-left p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all text-xs sm:text-sm font-semibold tracking-wider font-sans flex items-center gap-3 sm:gap-4 hover:translate-x-1 duration-200 ${isSelected
                                                    ? 'bg-accent/15 border-accent text-white shadow-lg shadow-accent/5'
                                                    : 'border-white/5 bg-zinc-950/20 text-zinc-400 hover:border-accent/30 hover:bg-accent/5 hover:text-white'
                                                    }`}
                                            >
                                                <span className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg border flex items-center justify-center text-[9px] sm:text-[10px] font-black shrink-0 transition-all ${isSelected
                                                    ? 'bg-accent border-accent text-black font-bold'
                                                    : 'bg-black/30 border-white/5 text-zinc-500'
                                                    }`}>
                                                    {opt.label}
                                                </span>
                                                <span className="truncate">{opt.value}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="flex justify-between items-center pt-4 sm:pt-6 gap-4">
                                    <button
                                        onClick={() => currentIcarIndex > 0 && setCurrentIcarIndex(prev => prev - 1)}
                                        disabled={currentIcarIndex === 0}
                                        className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-white/5 bg-white/[0.01] text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-white hover:border-white/20 transition-all disabled:opacity-20 disabled:pointer-events-none"
                                    >
                                        ← Anterior
                                    </button>

                                    <span className="text-[8px] font-mono uppercase text-zinc-600 hidden xs:inline">
                                        Monitoreo de Latencia Activo
                                    </span>

                                    <button
                                        onClick={() => currentIcarIndex < 15 ? setCurrentIcarIndex(prev => prev + 1) : setActiveTest(null)}
                                        className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-accent/20 bg-accent/5 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-accent hover:bg-accent hover:text-black hover:border-accent transition-all font-mono"
                                    >
                                        {currentIcarIndex === 15 ? 'Finalizar ✓' : 'Siguiente →'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Progress Bar */}
                    <div className="w-full max-w-5xl mx-auto pt-6 border-t border-white/5 flex flex-col gap-2 relative z-10">
                        <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-zinc-500 font-mono">
                            <span>Cartografía Cognitiva ICAR16</span>
                            <span>{Math.round(((currentIcarIndex + 1) / 16) * 100)}%</span>
                        </div>
                        <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                            <div
                                className="h-full transition-all duration-500"
                                style={{
                                    width: `${((currentIcarIndex + 1) / 16) * 100}%`,
                                    backgroundColor: categoryColor
                                }}
                            />
                        </div>
                    </div>
                </div>
            );
        }

        const sortedMemory = [...userMemory].sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return 0;
        });

        if (isMeditationMode) {
            return (
                <div className="fixed inset-0 z-50 bg-[#040405] flex flex-col justify-between p-6 md:p-12 overflow-y-auto no-scrollbar font-sans select-none text-zinc-100 animate-in fade-in duration-1000">
                    {/* Atmospheric Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[150px] pointer-events-none transition-all duration-[4000ms]"
                        style={{
                            background: breathPhase === 0 || breathPhase === 1 ? `${accent}0a` : '#a855f704',
                            transform: `translate(-50%, -50%) scale(${breathPhase === 0 || breathPhase === 1 ? 1.2 : 0.8})`
                        }}
                    />

                    {/* Top menu bar */}
                    <div className="flex justify-between items-center w-full max-w-4xl mx-auto border-b border-white/5 pb-6 relative z-10">
                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => setIsAudioActive(prev => !prev)}
                                className={`text-[9px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 px-4 py-2 rounded-xl border border-white/5 ${isAudioActive ? 'bg-accent/10 border-accent/20 text-accent font-bold shadow-[0_0_10px_rgba(var(--accent-rgb),0.2)]' : 'bg-white/5 text-zinc-500 hover:text-zinc-300'}`}
                            >
                                {isAudioActive ? (
                                    <>
                                        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
                                        [ Sonido: ON ]
                                    </>
                                ) : '[ Activar Sonido Ambiente ]'}
                            </button>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 font-mono">Espacio de Meditación</span>
                        <button
                            onClick={() => { setIsMeditationMode(false); setIsAudioActive(false); }}
                            className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-all bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/5"
                        >
                            [ Salir ]
                        </button>
                    </div>

                    {/* Central meditation breathing sphere */}
                    <div className="flex-1 flex flex-col items-center justify-center space-y-16 py-12 relative z-10">
                        <div className="relative flex items-center justify-center w-72 h-72">
                            {/* Inner core pulsing ring */}
                            <div
                                className="absolute rounded-full bg-accent/5 border border-accent/10 transition-all duration-[4000ms] ease-in-out"
                                style={{
                                    width: breathPhase === 0 || breathPhase === 1 ? '260px' : '110px',
                                    height: breathPhase === 0 || breathPhase === 1 ? '260px' : '110px',
                                    boxShadow: breathPhase === 0 || breathPhase === 1
                                        ? '0 0 60px rgba(var(--accent-rgb), 0.25), inset 0 0 30px rgba(var(--accent-rgb), 0.1)'
                                        : '0 0 15px rgba(var(--accent-rgb), 0.05), inset 0 0 5px rgba(var(--accent-rgb), 0.02)',
                                }}
                            />
                            {/* Middle layer ring */}
                            <div
                                className="absolute rounded-full bg-accent/10 transition-all duration-[4000ms] ease-in-out border border-accent/30"
                                style={{
                                    width: breathPhase === 0 || breathPhase === 1 ? '180px' : '70px',
                                    height: breathPhase === 0 || breathPhase === 1 ? '180px' : '70px',
                                }}
                            />
                            {/* Tiny center hub */}
                            <div className="relative z-10 text-center font-mono text-xs font-black uppercase tracking-[0.35em] text-white">
                                {breathPhase === 0 && <span className="animate-pulse text-accent">Inhala</span>}
                                {breathPhase === 1 && <span className="text-white">Retén</span>}
                                {breathPhase === 2 && <span className="animate-pulse text-zinc-400">Exhala</span>}
                                {breathPhase === 3 && <span className="text-zinc-600">Vacío</span>}
                            </div>
                        </div>

                        {/* Slide of Memories (cycles through userMemory over time) */}
                        {sortedMemory.length > 0 ? (() => {
                            // Cycle node every 16 seconds (one full box breathing rotation)
                            const cycleIdx = Math.floor(Date.now() / 16000) % sortedMemory.length;
                            const activeMedFact = sortedMemory[cycleIdx];
                            return (
                                <div key={cycleIdx} className="max-w-2xl text-center px-8 animate-in fade-in slide-in-from-bottom-8 duration-[1500ms] space-y-6">
                                    <span className="text-[8px] font-black uppercase tracking-[0.5em] text-accent/50 block font-mono">Eco Contemplado</span>
                                    <p className="text-2xl md:text-3xl font-light italic text-white/80 leading-relaxed font-sans selection:bg-accent/20">
                                        "{activeMedFact.text}"
                                    </p>
                                    <div className="flex justify-center items-center gap-4 text-zinc-500 text-[8px] font-mono uppercase tracking-widest pt-2">
                                        <span>{activeMedFact.category || 'General'}</span>
                                        <span className="text-zinc-800">•</span>
                                        <span>{new Date(activeMedFact.timestamp).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            );
                        })() : (
                            <div className="text-center opacity-20 py-10 max-w-sm">
                                <Aperture size={24} className="mx-auto mb-4 animate-spin-slow" />
                                <span className="text-[9px] font-black uppercase tracking-[0.5em] font-mono">Lienzo en silencio sin recuerdos recolectados</span>
                            </div>
                        )}
                    </div>

                    {/* Bottom visual guide */}
                    <div className="w-full max-w-4xl mx-auto border-t border-white/5 pt-6 flex justify-between items-center text-[9px] font-mono text-zinc-600 uppercase tracking-widest relative z-10">
                        <div className="flex gap-4">
                            <span className={breathPhase === 0 ? 'text-accent font-bold' : ''}>1. Inhala (4s)</span>
                            <span className="text-zinc-800">→</span>
                            <span className={breathPhase === 1 ? 'text-accent font-bold' : ''}>2. Retén (4s)</span>
                            <span className="text-zinc-800">→</span>
                            <span className={breathPhase === 2 ? 'text-accent font-bold' : ''}>3. Exhala (4s)</span>
                            <span className="text-zinc-800">→</span>
                            <span className={breathPhase === 3 ? 'text-accent font-bold' : ''}>4. Vacío (4s)</span>
                        </div>
                        <div>
                            <span>Box Breathing Cycle</span>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="w-full h-full relative overflow-y-auto no-scrollbar bg-black/5 backdrop-blur-xl pt-3 pb-6 px-4 md:px-8 transition-all duration-300 animate-in fade-in">
                {/* BACK TO CANVAS BUTTON (Opposite of settings cog on the top-left) */}
                <button
                    onClick={() => setView('canvas')}
                    className="fixed top-6 left-6 z-[500] w-10 h-10 rounded-full bg-black/40 backdrop-blur-3xl border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/20 transition-all duration-500 shadow-2xl group"
                    title="Volver al Lienzo"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                </button>
                <div className="fixed inset-0 pointer-events-none opacity-20 mix-blend-soft-light"
                    style={{ background: `radial-gradient(circle at 10% 10%, ${accent}15 0%, transparent 40%), radial-gradient(circle at 90% 90%, #8b5cf608 0%, transparent 40%)` }} />

                <style>{`
                    @keyframes dash {
                        to {
                            stroke-dashoffset: -40;
                        }
                    }
                `}</style>

                {/* Contemplation Modal Overlay */}
                {selectedContemplationFact && (
                    <div className="fixed inset-0 z-[100] bg-zinc-950/95 backdrop-blur-2xl flex flex-col justify-between p-8 md:p-16 select-none text-zinc-100 animate-in fade-in duration-500">
                        {/* Top bar */}
                        <div className="flex justify-between items-center w-full border-b border-white/5 pb-6">
                            <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
                                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-accent font-mono">
                                    Contemplación y Reinterpretación del Eco
                                </span>
                            </div>
                            <button
                                onClick={() => setSelectedContemplationFact(null)}
                                className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-all bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/5"
                            >
                                [ Descartar Cambios ]
                            </button>
                        </div>

                        {/* Modal core content */}
                        <div className="w-full max-w-6xl mx-auto my-auto grid grid-cols-1 lg:grid-cols-2 gap-16 py-12">
                            {/* Original section */}
                            <div className="space-y-8 self-center">
                                <span className="px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-[8px] font-black uppercase tracking-[0.2em] text-accent font-mono">
                                    Registro de la Memoria Original
                                </span>
                                <h3 className="text-3xl md:text-5xl font-serif font-light italic text-white/90 leading-relaxed pr-6 select-text">
                                    "{selectedContemplationFact.text}"
                                </h3>
                                <div className="space-y-2 border-t border-white/5 pt-6 text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                                    <div className="flex justify-between">
                                        <span>Categoría de Conciencia:</span>
                                        <span className="text-zinc-300 font-bold">{selectedContemplationFact.category || 'General'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Capturado el:</span>
                                        <span className="text-zinc-300 font-bold">{new Date(selectedContemplationFact.timestamp).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Reinterpretation section */}
                            <div className="p-8 rounded-[3rem] bg-zinc-900/40 border border-white/5 shadow-2xl flex flex-col justify-between gap-8 backdrop-blur-md">
                                <div className="space-y-4">
                                    <h4 className="text-sm font-black uppercase text-accent tracking-widest font-mono">Transmutación Cognitiva</h4>
                                    <p className="text-xs leading-relaxed text-zinc-400 font-sans">
                                        Los ecos no son dogmas inmutables de tu historia. Al contemplar este recuerdo en el presente, tienes la facultad de reformularlo e integrarlo bajo un entendimiento más maduro y libre de juicios.
                                    </p>
                                </div>
                                <div className="space-y-2 flex-1">
                                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-500 block font-mono">Escribe tu Reinterpretación actual:</span>
                                    <textarea
                                        value={reinterpretationText}
                                        onChange={(e) => setReinterpretationText(e.target.value)}
                                        rows={6}
                                        className="w-full p-6 bg-zinc-950/80 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/40 transition-all font-sans text-sm leading-relaxed resize-none"
                                    />
                                </div>
                                <button
                                    onClick={handleSaveReinterpretation}
                                    className="w-full py-4 bg-accent text-black font-black uppercase text-[10px] tracking-[0.3em] rounded-2xl hover:bg-lime-400 active:scale-[0.98] transition-all shadow-lg shadow-accent/10"
                                >
                                    Sincronizar Reinterpretación
                                </button>
                            </div>
                        </div>

                        {/* Bottom bar */}
                        <div className="text-[7px] font-mono text-zinc-600 uppercase tracking-widest text-center border-t border-white/5 pt-6">
                            EL ACTO DE REINTERPRETAR MODIFICA EL REGISTRO MENTAL PERMANENTE DE LA CONCIENCIA.
                        </div>
                    </div>
                )}

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    {/* MINIMALIST HEADER WITH TAB NAVIGATION ONLY */}
                    <div className="flex items-center justify-center pt-6 pb-4 border-b border-white/5 mb-8 animate-in slide-in-from-top duration-500 w-full gap-3 relative">


                        <div className="flex bg-white/5 p-1 rounded-full border border-white/10 shadow-2xl backdrop-blur-md gap-0.5">
                            {[
                                { id: 'tests', label: 'Pruebas de Consciencia', icon: Heart },
                                ...(hasMap ? [{ id: 'loop_map', label: 'Mapa Psicológico', icon: Compass }] : []),
                                { id: 'memory', label: 'Ecos de Memoria', icon: Aperture }
                            ].map(tab => {
                                const Icon = tab.icon;
                                const isActive = activeTabName === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => {
                                            setSoulTab(tab.id);
                                            setSelectedLoopNode('trigger');
                                        }}
                                        title={tab.label}
                                        className={`px-3.5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 sm:gap-2 ${isActive
                                            ? 'bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)] border border-white/5'
                                            : 'text-zinc-500 hover:text-white border border-transparent'
                                            }`}
                                    >
                                        <Icon size={16} className="shrink-0" />
                                    </button>
                                );
                            })}
                        </div>

                        {/* Mini Session History Button & Dropdown */}
                        <div className="absolute right-0">
                            <button
                                onClick={() => setIsSessionDropdownOpen(!isSessionDropdownOpen)}
                                className={`h-9 px-3.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 backdrop-blur-md shadow-2xl ${
                                    isSessionDropdownOpen
                                        ? 'bg-emerald-500 text-black border border-emerald-400 font-bold'
                                        : 'bg-white/5 text-zinc-400 hover:text-white border border-white/10 hover:bg-white/10'
                                }`}
                                title="Historial de Sesiones"
                            >
                                <Database size={13} />
                                <span>S{activeVersion}</span>
                            </button>

                            {isSessionDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-zinc-950/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-3 shadow-[0_15px_50px_rgba(0,0,0,0.8)] z-[600] flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest font-black border-b border-white/5 pb-1 mb-1">
                                        Sesiones
                                    </div>
                                    <div className="max-h-36 overflow-y-auto no-scrollbar flex flex-col gap-1">
                                        {Array.from({ length: totalVersions }).map((_, idx) => {
                                            const v = idx + 1;
                                            const isSelected = activeVersion === v;
                                            return (
                                                <button
                                                    key={v}
                                                    onClick={() => {
                                                        handleSwitchVersion(v);
                                                        setIsSessionDropdownOpen(false);
                                                    }}
                                                    className={`w-full px-2.5 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-wider font-mono text-left transition-all ${
                                                        isSelected
                                                            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                                                            : 'bg-transparent text-zinc-500 hover:bg-white/5 hover:text-white'
                                                    }`}
                                                >
                                                    Sesión {v}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <div className="border-t border-white/5 pt-2 flex flex-col gap-1.5">
                                        <button
                                            onClick={() => {
                                                handleCreateNewVersion();
                                                setIsSessionDropdownOpen(false);
                                            }}
                                            className="w-full py-1.5 rounded-xl border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 text-[8px] font-black uppercase tracking-wider font-mono transition-all flex items-center justify-center gap-1"
                                        >
                                            <Plus size={10} /> Nueva Sesión
                                        </button>
                                        <button
                                            onClick={() => {
                                                resetActiveVersionTests();
                                                setIsSessionDropdownOpen(false);
                                            }}
                                            className="w-full py-1.5 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/20 hover:text-white text-[8px] font-black uppercase tracking-widest font-mono transition-all flex items-center justify-center gap-1"
                                        >
                                            <Trash2 size={10} /> Borrar Sesión {activeVersion}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {activeTabName === 'memory' && (
                        <div className="space-y-10 animate-in fade-in duration-500">

                            {/* Category Filter pills */}
                            {sortedMemory.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center border-b border-white/5 pb-6">
                                    {['Todos', 'Conciencia', 'Afecto', 'Racional', 'Existencia', 'General'].map(cat => {
                                        const count = cat === 'Todos'
                                            ? sortedMemory.length
                                            : sortedMemory.filter(f => (f.category || 'General') === (cat === 'Todos' ? 'Todos' : cat === 'Conciencia' ? 'Conciencia' : cat === 'Afecto' ? 'Afecto' : cat === 'Racional' ? 'Racional' : cat === 'Existencia' ? 'Existencia' : 'General')).length;
                                        if (count === 0 && cat !== 'Todos') return null;
                                        return (
                                            <button
                                                key={cat}
                                                onClick={() => { setSelectedCategoryFilter(cat); setActiveMemoryIndex(0); }}
                                                className={`px-3.5 py-1.5 sm:px-5 sm:py-2.5 rounded-full text-[8px] sm:text-[8.5px] font-black uppercase tracking-widest border transition-all ${(selectedCategoryFilter === 'All' && cat === 'Todos') || selectedCategoryFilter === cat || (selectedCategoryFilter === 'General' && cat === 'General')
                                                    ? 'bg-accent/10 border-accent/40 text-accent font-bold shadow-[0_0_10px_rgba(var(--accent-rgb),0.2)]'
                                                    : 'bg-white/5 border-white/5 text-zinc-500 hover:text-white hover:border-white/10'
                                                    }`}
                                            >
                                                {cat} <span className="opacity-40 ml-1">({count})</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Card Carousel Slider */}
                            <div>
                                {(() => {
                                    const filteredMemory = sortedMemory.filter(f => {
                                        if (selectedCategoryFilter === 'Todos' || selectedCategoryFilter === 'All') return true;
                                        return (f.category || 'General') === selectedCategoryFilter;
                                    });

                                    if (filteredMemory.length === 0) {
                                        return (
                                            <div className="h-[320px] flex flex-col items-center justify-center border border-white/5 bg-white/[0.01] rounded-[2.5rem]">
                                                <Aperture size={36} className="mb-6 text-white/5 animate-spin-slow" />
                                                <p className="text-[9px] font-black uppercase tracking-[0.8em] text-white/20 italic">Sin ecos en esta frecuencia</p>
                                            </div>
                                        );
                                    }

                                    const activeIdx = Math.min(activeMemoryIndex, Math.max(0, filteredMemory.length - 1));
                                    const activeFact = filteredMemory[activeIdx];
                                    const originalIdx = userMemory.findIndex(f => f.timestamp === activeFact.timestamp && f.text === activeFact.text);

                                    return (
                                        <div className="relative w-full max-w-6xl mx-auto py-6 flex flex-col items-center">
                                            {/* Ambient Background Glow */}
                                            <div className="absolute inset-0 w-[800px] h-[400px] bg-accent/5 blur-[140px] pointer-events-none rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

                                            {/* Card Container & Nav Buttons */}
                                            <div className="w-full max-w-4xl flex items-center justify-center relative z-10">

                                                {/* Main Card View Stack */}
                                                <div className="flex-1 min-w-0 relative h-[480px] md:h-[500px]">
                                                    {(() => {
                                                        const dx = swipeOffset.x;
                                                        const dy = swipeOffset.y;
                                                        // Calculate progress (0 to 1) based on dx distance
                                                        const progress = Math.min(Math.abs(dx) / 150, 1);

                                                        // Card 1 (Top/Active Card) Style
                                                        const card1Style = {
                                                            transform: swipeTriggered
                                                                ? `translate(${swipeDirection === 'left' ? -1000 : 1000}px, ${dy}px) rotate(${swipeDirection === 'left' ? -30 : 30}deg)`
                                                                : `translate(${dx}px, ${dy}px) rotate(${dx * 0.05}deg)`,
                                                            transition: isSwiping ? 'none' : 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.2)',
                                                            zIndex: 30,
                                                            cursor: isSwiping ? 'grabbing' : 'grab',
                                                            touchAction: 'none',
                                                            userSelect: 'none'
                                                        };

                                                        // Card 2 (Middle Stack Card) Style
                                                        const card2Scale = 0.96 + progress * 0.04;
                                                        const card2TranslateY = 14 - progress * 14;
                                                        const card2Opacity = 0.5 + progress * 0.5;
                                                        const card2Style = {
                                                            transform: `scale(${card2Scale}) translateY(${card2TranslateY}px)`,
                                                            opacity: card2Opacity,
                                                            zIndex: 20,
                                                            transition: isSwiping ? 'none' : 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.2), opacity 0.4s ease',
                                                            pointerEvents: 'none'
                                                        };

                                                        // Card 3 (Bottom Stack Card) Style
                                                        const card3Scale = 0.92 + progress * 0.04;
                                                        const card3TranslateY = 28 - progress * 14;
                                                        const card3Opacity = 0.2 + progress * 0.3;
                                                        const card3Style = {
                                                            transform: `scale(${card3Scale}) translateY(${card3TranslateY}px)`,
                                                            opacity: card3Opacity,
                                                            zIndex: 10,
                                                            transition: isSwiping ? 'none' : 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.2), opacity 0.4s ease',
                                                            pointerEvents: 'none'
                                                        };

                                                        const renderCard = (fact, style, type, orgIdx) => {
                                                            const isTop = type === 'top';
                                                            return (
                                                                <div
                                                                    key={fact.timestamp + fact.text}
                                                                    style={style}
                                                                    onPointerDown={isTop ? handleCardPointerDown : undefined}
                                                                    onPointerMove={isTop ? handleCardPointerMove : undefined}
                                                                    onPointerUp={isTop ? (e) => handleCardPointerUp(e, filteredMemory.length) : undefined}
                                                                    className={`absolute inset-0 p-6 md:p-14 pb-8 md:pb-16 rounded-[2rem] md:rounded-[3.5rem] border backdrop-blur-3xl bg-zinc-950 transition-all duration-300 shadow-2xl overflow-y-auto custom-scroll flex flex-col justify-between select-none ${fact.isPinned
                                                                        ? 'border-accent/30 shadow-[0_0_30px_rgba(var(--accent-rgb),0.03)]'
                                                                        : 'border-white/5 hover:border-white/10'
                                                                        }`}
                                                                >
                                                                    {/* Glowing corner background decoration */}
                                                                    <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-15 pointer-events-none"
                                                                        style={{
                                                                            backgroundColor: fact.category === 'Afecto' ? '#ef4444' :
                                                                                fact.category === 'Cognición' ? '#06b6d4' :
                                                                                    fact.category === 'Racional' ? '#bef264' : '#a855f7'
                                                                        }}
                                                                    />

                                                                    <div className="space-y-6">
                                                                        <div className="flex justify-between items-center border-b border-white/5 pb-4">
                                                                            <div className="flex items-center gap-2">
                                                                                {fact.category === 'Afecto' && <Heart size={16} className="text-red-400" />}
                                                                                {fact.category === 'Cognición' && <Zap size={16} className="text-cyan-400" />}
                                                                                {fact.category === 'Racional' && <Sparkles size={16} className="text-lime-400" />}
                                                                                {(!fact.category || fact.category === 'Conciencia') && <Aperture size={16} className="text-purple-400 animate-spin-slow" />}
                                                                                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400 font-mono">
                                                                                    {fact.category || 'Conciencia'}
                                                                                </span>
                                                                            </div>
                                                                            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                                                                                {new Date(fact.timestamp).toLocaleDateString()}
                                                                            </span>
                                                                        </div>

                                                                        <p
                                                                            onClick={isTop ? () => { setSelectedContemplationFact(fact); setReinterpretationText(fact.text); } : undefined}
                                                                            className="text-xl md:text-4xl font-light italic text-white/95 leading-relaxed tracking-tight hover:text-accent transition-colors cursor-pointer select-text font-serif py-4"
                                                                        >
                                                                            "{fact.text}"
                                                                        </p>
                                                                    </div>

                                                                    {/* Card Controls */}
                                                                    <div className="flex flex-wrap items-center justify-between pt-6 border-t border-white/5 gap-4 relative z-10">
                                                                        <button
                                                                            onClick={isTop ? () => { setSelectedContemplationFact(fact); setReinterpretationText(fact.text); } : undefined}
                                                                            className="px-3.5 py-2 md:px-6 md:py-3 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 text-zinc-300 hover:text-white text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98]"
                                                                        >
                                                                            [ Contemplar / Reinterpretar ]
                                                                        </button>

                                                                        <div className="flex items-center gap-1.5 md:gap-3">
                                                                            <button
                                                                                onClick={isTop ? () => handleTogglePinFact(orgIdx) : undefined}
                                                                                className={`px-3 py-2 md:px-5 md:py-3 rounded-xl md:rounded-2xl border text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 md:gap-2 hover:scale-[1.02] active:scale-[0.98] ${fact.isPinned
                                                                                    ? 'bg-accent/15 border-accent/30 text-accent font-bold shadow-[0_0_10px_rgba(var(--accent-rgb),0.2)]'
                                                                                    : 'bg-transparent border-white/5 text-zinc-500 hover:text-white hover:border-white/10'
                                                                                    }`}
                                                                            >
                                                                                <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${fact.isPinned ? 'bg-accent shadow-[0_0_8px_rgba(var(--accent-rgb),0.6)]' : 'bg-white/20'}`} />
                                                                                <span>{fact.isPinned ? 'Conservado' : 'Conservar'}</span>
                                                                                <span className="hidden sm:inline">{fact.isPinned ? ' en Núcleo' : ' / Pin'}</span>
                                                                            </button>

                                                                            <button
                                                                                onClick={isTop ? () => handlePublishFact(fact) : undefined}
                                                                                className="px-3 py-2 md:px-5 md:py-3 rounded-xl md:rounded-2xl bg-purple-950/20 border border-purple-800/30 text-purple-300 hover:bg-purple-500 hover:text-black text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98]"
                                                                            >
                                                                                <span>Publicar</span>
                                                                                <span className="hidden sm:inline"> en Perfil</span>
                                                                            </button>

                                                                            <button
                                                                                onClick={isTop ? () => handleDeleteFact(orgIdx) : undefined}
                                                                                className="px-3 py-2 md:px-5 md:py-3 rounded-xl md:rounded-2xl bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/30 text-red-500/50 hover:text-red-400 text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98]"
                                                                            >
                                                                                <span>Eliminar</span>
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        };

                                                        const stack = [];
                                                        if (filteredMemory.length >= 3) {
                                                            const idx3 = (activeIdx + 2) % filteredMemory.length;
                                                            const f3 = filteredMemory[idx3];
                                                            const orgIdx3 = userMemory.findIndex(f => f.timestamp === f3.timestamp && f.text === f3.text);
                                                            stack.push(renderCard(f3, card3Style, 'bottom', orgIdx3));
                                                        }
                                                        if (filteredMemory.length >= 2) {
                                                            const idx2 = (activeIdx + 1) % filteredMemory.length;
                                                            const f2 = filteredMemory[idx2];
                                                            const orgIdx2 = userMemory.findIndex(f => f.timestamp === f2.timestamp && f.text === f2.text);
                                                            stack.push(renderCard(f2, card2Style, 'middle', orgIdx2));
                                                        }
                                                        stack.push(renderCard(activeFact, card1Style, 'top', originalIdx));

                                                        return stack;
                                                    })()}
                                                </div>

                                            </div>

                                            {/* Slider Navigation Indicators */}
                                            <div className="flex items-center gap-4 mt-8 relative z-10">
                                                <span className="text-[9px] font-mono text-zinc-500 font-bold">
                                                    {String(activeIdx + 1).padStart(2, '0')}
                                                </span>
                                                <div className="flex items-center gap-1 max-w-[200px] overflow-x-auto no-scrollbar py-1 px-2 border border-white/5 rounded-full bg-black/40">
                                                    {filteredMemory.map((_, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => setActiveMemoryIndex(i)}
                                                            className={`h-1.5 rounded-full transition-all duration-300 shrink-0 ${i === activeIdx ? 'w-6 bg-accent' : 'w-2 bg-white/10 hover:bg-white/30'
                                                                }`}
                                                        />
                                                    ))}
                                                </div>
                                                <span className="text-[9px] font-mono text-zinc-500 font-bold">
                                                    {String(filteredMemory.length).padStart(2, '0')}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    )}

                    {activeTabName === 'tests' && (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            {!activeTest ? (
                                <div className="space-y-6">
                                    {(() => {
                                        const testCards = [
                                            {
                                                id: 'biographic',
                                                num: '01',
                                                type: 'Contextual',
                                                icon: <Camera size={22} className="text-emerald-400" />,
                                                title: 'Entrevista Biográfica',
                                                description: 'Grabación de video/audio y transcripción en vivo para explorar tu mundo, tu historia de vida y tu día a día.',
                                                focus: 'Narrativa',
                                                duration: '10-15m',
                                                color: 'emerald',
                                                glowColor: 'shadow-[0_0_20px_rgba(16,185,129,0.3)] border-emerald-500/40 text-emerald-400',
                                                bgGlow: 'bg-emerald-500',
                                                btnBg: 'bg-emerald-500/20 hover:bg-emerald-500 hover:text-black border-emerald-500/40 text-emerald-300',
                                                isComplete: false,
                                                action: () => { setActiveTest('biographic'); }
                                            },
                                            {
                                                id: 'icar16',
                                                num: '02',
                                                type: 'Cognitiva',
                                                icon: <Zap size={22} className="text-accent" />,
                                                title: 'Cartografía ICAR16',
                                                description: 'Evaluación cognitiva estructurada de 16 ítems lógico-verbales, espaciales de cubos 3D y matrices.',
                                                focus: 'Lógica/3D',
                                                duration: '15-20m',
                                                color: 'accent',
                                                glowColor: 'shadow-[0_0_20px_rgba(251,191,36,0.3)] border-accent/40 text-accent',
                                                bgGlow: 'bg-accent',
                                                btnBg: 'bg-accent/10 hover:bg-accent hover:text-black border-accent/30 text-accent',
                                                isComplete: calculatedResults.isIcarComplete,
                                                action: () => { setActiveTest('icar16'); setCurrentIcarIndex(0); startWebcamRecording(); }
                                            },
                                            {
                                                id: 'phenom',
                                                num: '03',
                                                type: 'Existencial',
                                                icon: <Heart size={22} className="text-purple-400" />,
                                                title: 'Diagnóstico Existencial',
                                                description: 'Mapea tu forma de existir, tus mecanismos de autoprotección y tu relación con el tiempo.',
                                                focus: 'Existencial',
                                                duration: '5-10m',
                                                color: 'purple',
                                                glowColor: 'shadow-[0_0_20px_rgba(168,85,247,0.3)] border-purple-500/40 text-purple-400',
                                                bgGlow: 'bg-purple-500',
                                                btnBg: 'bg-purple-500/20 hover:bg-purple-500 hover:text-black border-purple-500/40 text-purple-300',
                                                isComplete: calculatedResults.isPhenomComplete,
                                                action: () => { setActiveTest('phenom'); setCurrentPhenomIndex(0); }
                                            },
                                            {
                                                id: 'pid5',
                                                num: '04',
                                                type: 'Personalidad',
                                                icon: <Sparkles size={22} className="text-pink-400" />,
                                                title: 'Inventario PID-5-BF',
                                                description: '25 reactivos de autoinforme clínico estructurados para mapear tus rasgos dominantes de personalidad.',
                                                focus: 'Rasgos',
                                                duration: '5-8m',
                                                color: 'pink',
                                                glowColor: 'shadow-[0_0_20px_rgba(236,72,153,0.3)] border-pink-500/40 text-pink-400',
                                                bgGlow: 'bg-pink-500',
                                                btnBg: 'bg-pink-500/20 hover:bg-pink-500 hover:text-black border-pink-500/40 text-pink-300',
                                                isComplete: calculatedResults.isPid5Complete,
                                                action: () => { setActiveTest('pid5'); setCurrentPidIndex(0); }
                                            }
                                        ];

                                        const activeCard = testCards[activeTestCardIndex];

                                        const handleTestsScroll = (e) => {
                                            const scrollTop = e.target.scrollTop;
                                            const height = e.target.clientHeight;
                                            if (height > 0) {
                                                const index = Math.round(scrollTop / height);
                                                if (index >= 0 && index < testCards.length && index !== activeTestCardIndex) {
                                                    setActiveTestCardIndex(index);
                                                }
                                            }
                                        };

                                        return (
                                            <div className="flex flex-col items-center justify-center w-full py-2">
                                                {/* Full screen borderless TikTok-style Viewport Container with Scroll Snap */}
                                                <div
                                                    ref={testsContainerRef}
                                                    onScroll={handleTestsScroll}
                                                    className="w-full h-[calc(100vh-200px)] overflow-y-auto snap-y snap-mandatory scroll-smooth no-scrollbar relative"
                                                >
                                                    {testCards.map((card, idx) => (
                                                        <div
                                                            key={card.id}
                                                            className="w-full h-[calc(100vh-200px)] px-3 py-6 md:px-14 md:py-16 flex flex-col justify-between snap-start snap-always shrink-0 relative overflow-hidden"
                                                        >
                                                            {/* Huge background ambient glow centered */}
                                                            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] md:w-[700px] md:h-[700px] rounded-full blur-[130px] pointer-events-none opacity-20 transition-all duration-700 ${card.bgGlow}`} />

                                                            {/* Flex Row layout: Main left, TikTok controls right */}
                                                            <div className="flex gap-4 md:gap-14 h-full items-stretch relative z-10 max-w-5xl mx-auto w-full">

                                                                {/* Main content (Left) */}
                                                                <div className="flex-1 flex flex-col justify-between h-full pr-2 md:pr-4">
                                                                    <div className="space-y-3 md:space-y-6 my-auto">
                                                                        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
                                                                            <span className="px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] bg-white/5 border border-white/10 text-zinc-300">
                                                                                Módulo {card.num} // {card.type}
                                                                            </span>
                                                                            {card.isComplete && (
                                                                                <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 md:px-3 md:py-1 rounded-full">
                                                                                    Completado
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <h3 className="text-2xl md:text-6xl font-black italic tracking-tighter uppercase text-white leading-tight">
                                                                            {card.title}
                                                                        </h3>
                                                                        <p className="text-[11px] md:text-lg text-zinc-300 font-sans font-medium leading-relaxed max-w-2xl">
                                                                            {card.description}
                                                                        </p>

                                                                        {/* Immersive Focus & Duration Badges */}
                                                                        <div className="hidden md:flex flex-wrap gap-8 border-t border-white/10 pt-6 mt-6 max-w-xl">
                                                                            <div className="space-y-1">
                                                                                <span className="text-[8px] font-black uppercase tracking-[0.25em] text-zinc-500 font-mono block">Enfoque Analítico</span>
                                                                                <span className="text-xs md:text-sm font-bold text-white block uppercase tracking-wider">{card.focus}</span>
                                                                            </div>
                                                                            <div className="space-y-1">
                                                                                <span className="text-[8px] font-black uppercase tracking-[0.25em] text-zinc-500 font-mono block">Duración Estimada</span>
                                                                                <span className="text-xs md:text-sm font-bold text-white block uppercase tracking-wider">{card.duration}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div className="mt-auto pt-6">
                                                                        <button
                                                                            onClick={card.action}
                                                                            className={`w-full max-w-md py-3.5 md:py-5 px-6 md:px-8 rounded-xl md:rounded-2xl border font-black uppercase text-[10px] md:text-[11px] tracking-[0.25em] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-2xl ${card.btnBg}`}
                                                                        >
                                                                            {card.isComplete ? 'Reiniciar Prueba' : 'Iniciar Diagnóstico'}
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                {/* TikTok-style Vertical Controls (Right) */}
                                                                <div className="flex flex-col items-center justify-between w-10 md:w-20 shrink-0 border-l border-white/5 pl-2 md:pl-8 py-2 md:py-4 select-none">
                                                                    {/* Big index ring */}
                                                                    <div className="flex flex-col items-center gap-1">
                                                                        <div className={`w-9 h-9 md:w-12 md:h-12 rounded-full flex items-center justify-center border-2 font-mono font-black text-xs md:text-sm transition-all duration-300 ${card.glowColor}`}>
                                                                            {card.num}
                                                                        </div>
                                                                        <span className="text-[6px] md:text-[7px] font-black uppercase tracking-wider text-zinc-500">Prueba</span>
                                                                    </div>

                                                                    {/* Theme Icon badge */}
                                                                    <div className="flex flex-col items-center gap-1">
                                                                        <div className="w-9 h-9 md:w-12 md:h-12 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-white shadow-md">
                                                                            {card.icon}
                                                                        </div>
                                                                        <span className="text-[6px] md:text-[7px] font-black uppercase tracking-wider text-zinc-500">Módulo</span>
                                                                    </div>

                                                                    {/* Duration badge */}
                                                                    <div className="flex flex-col items-center gap-1">
                                                                        <div className="w-9 h-9 md:w-12 md:h-12 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-zinc-400">
                                                                            <Clock size={14} className="md:w-[18px] md:h-[18px]" />
                                                                        </div>
                                                                        <span className="text-[6px] md:text-[8.5px] font-black uppercase tracking-wider text-zinc-500">Tiempo</span>
                                                                    </div>

                                                                    {/* Focus badge */}
                                                                    <div className="flex flex-col items-center gap-1">
                                                                        <div className="w-9 h-9 md:w-12 md:h-12 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-zinc-400">
                                                                            <Focus size={14} className="md:w-[18px] md:h-[18px]" />
                                                                        </div>
                                                                        <span className="text-[6px] md:text-[8.5px] font-black uppercase tracking-wider text-zinc-500">Enfoque</span>
                                                                    </div>
                                                                </div>

                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Dots and swipe tip at the bottom */}
                                                <div className="flex items-center gap-6 mt-6 w-full justify-between px-2 max-w-5xl">
                                                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-500 font-mono">
                                                        Desliza verticalmente para navegar
                                                    </span>

                                                    <div className="flex items-center gap-2">
                                                        {testCards.map((_, i) => (
                                                            <button
                                                                key={i}
                                                                onClick={() => {
                                                                    if (testsContainerRef.current) {
                                                                        const cardElement = testsContainerRef.current.children[i];
                                                                        if (cardElement) {
                                                                            cardElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                                                                        }
                                                                    }
                                                                }}
                                                                className={`h-2 rounded-full transition-all duration-300 ${i === activeTestCardIndex
                                                                    ? 'w-8 ' + (
                                                                        i === 0 ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.4)]' :
                                                                            i === 1 ? 'bg-accent shadow-[0_0_8px_rgba(251,191,36,0.4)]' :
                                                                                i === 2 ? 'bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.4)]' :
                                                                                    'bg-pink-400 shadow-[0_0_8px_rgba(236,72,153,0.4)]'
                                                                    )
                                                                    : 'w-2 bg-white/20 hover:bg-white/40'
                                                                    }`}
                                                                title={`Prueba ${i + 1}`}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Analytical summary if completed */}
                                    {(calculatedResults.isPhenomComplete || calculatedResults.isPid5Complete || calculatedResults.isIcarComplete) && (
                                        <div className="border-t border-white/5 pt-8 max-w-4xl mx-auto space-y-6">
                                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                                <h3 className="text-base font-black uppercase tracking-widest text-zinc-400">Reporte Analítico Integrado</h3>
                                                <button onClick={resetTests} className="text-[7px] font-black uppercase text-red-500/60 hover:text-red-500 tracking-widest bg-red-500/5 px-3 py-1.5 rounded-full border border-red-500/10 hover:border-red-500/30 transition-all">Wipe Data / Borrar Respuestas</button>
                                            </div>

                                            {/* Sub-tab selection */}
                                            <div className="flex border-b border-white/5 pb-2 mb-6 gap-6">
                                                {[
                                                    { id: 'summary', label: 'Resumen General' },
                                                    { id: 'phenom_detail', label: 'Detalle Fenomenológico' },
                                                    { id: 'pid5_detail', label: 'Perfil PID-5-BF' },
                                                    { id: 'icar_detail', label: 'Detalle Cognitivo (ICAR16)' }
                                                ].map(tab => (
                                                    <button
                                                        key={tab.id}
                                                        onClick={() => setResultsSubTab(tab.id)}
                                                        className={`pb-2 px-1 text-[9px] font-black uppercase tracking-widest border-b-2 transition-all ${resultsSubTab === tab.id
                                                            ? 'border-accent text-white'
                                                            : 'border-transparent text-zinc-500 hover:text-zinc-300'
                                                            }`}
                                                    >
                                                        {tab.label}
                                                    </button>
                                                ))}
                                            </div>

                                            {resultsSubTab === 'summary' && (
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-300">
                                                    <div className="p-6 rounded-3xl bg-white/[0.01] border border-white/5 flex flex-col justify-between hover:border-purple-500/20 transition-all duration-300">
                                                        <span className="text-[7px] font-black uppercase tracking-widest text-zinc-600 block mb-3">Arquetipo de Conciencia</span>
                                                        {calculatedResults.isPid5Complete ? (
                                                            <div>
                                                                <span className="text-lg font-black italic text-purple-400 uppercase leading-tight">{calculatedResults.archetype?.name}</span>
                                                                <p className="text-[8px] text-zinc-500 mt-1 font-mono uppercase leading-tight">{calculatedResults.archetype?.subtitle}</p>
                                                            </div>
                                                        ) : (
                                                            <span className="text-[9px] text-zinc-700 italic font-mono">Requiere completar PID-5</span>
                                                        )}
                                                    </div>

                                                    <div className="p-6 rounded-3xl bg-white/[0.01] border border-white/5 flex flex-col justify-between hover:border-accent/20 transition-all duration-300">
                                                        <span className="text-[7px] font-black uppercase tracking-widest text-zinc-600 block mb-3">Eficiencia Lógica (ICAR16)</span>
                                                        {calculatedResults.isIcarComplete ? (
                                                            <div>
                                                                <span className="text-3xl font-black italic text-accent">{calculatedResults.score} / 16 Aciertos</span>
                                                                <p className="text-[8px] text-zinc-500 mt-2 font-mono uppercase">Latencia media: {calculatedResults.dwellAvg}s // Cambios: {calculatedResults.totalChanges}</p>
                                                            </div>
                                                        ) : (
                                                            <span className="text-[9px] text-zinc-700 italic font-mono">Requiere completar ICAR16</span>
                                                        )}
                                                    </div>

                                                    <div className="p-6 rounded-3xl bg-white/[0.01] border border-white/5 flex flex-col justify-between hover:border-white/10 transition-all duration-300">
                                                        <span className="text-[7px] font-black uppercase tracking-widest text-zinc-600 block mb-3">Acción Integradora Sugerida</span>
                                                        {calculatedResults.isPid5Complete ? (
                                                            <p className="text-[9px] font-sans leading-relaxed text-zinc-400 italic">
                                                                "{calculatedResults.archetype?.liberation}"
                                                            </p>
                                                        ) : (
                                                            <span className="text-[9px] text-zinc-700 italic font-mono">Requiere completar PID-5</span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {resultsSubTab === 'phenom_detail' && (
                                                <div className="space-y-8 animate-in fade-in duration-300">
                                                    {!calculatedResults.isPhenomComplete ? (
                                                        <div className="p-8 text-center border border-white/5 rounded-3xl bg-white/[0.01]">
                                                            <span className="text-[10px] font-mono font-black uppercase text-zinc-500 tracking-[0.3em]">Diagnóstico Existencial Incompleto</span>
                                                            <p className="text-[9px] text-zinc-600 mt-2 font-sans">Por favor completa todo el Test Existencial para desbloquear las respuestas.</p>
                                                        </div>
                                                    ) : (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                            {PHENOM_PART_A.map(q => (
                                                                <div key={q.key} className="p-6 rounded-3xl bg-white/[0.01] border border-white/5 flex flex-col gap-3">
                                                                    <span className="text-[8px] font-mono font-black uppercase text-purple-400 tracking-wider">{q.title}</span>
                                                                    <span className="text-[10px] font-bold italic text-white/70 leading-snug">"{q.question}"</span>
                                                                    <div className="p-4 rounded-2xl bg-zinc-950/40 border border-white/5 text-xs text-zinc-300 font-sans italic whitespace-pre-wrap leading-relaxed shadow-inner">
                                                                        {phenomQualitative[q.key] || <span className="text-zinc-600">Sin respuesta</span>}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {resultsSubTab === 'pid5_detail' && (
                                                <div className="space-y-8 animate-in fade-in duration-300">
                                                    {!calculatedResults.isPid5Complete ? (
                                                        <div className="p-8 text-center border border-white/5 rounded-3xl bg-white/[0.01]">
                                                            <span className="text-[10px] font-mono font-black uppercase text-zinc-500 tracking-[0.3em]">Inventario PID-5 Incompleto</span>
                                                            <p className="text-[9px] text-zinc-600 mt-2 font-sans">Por favor completa el inventario PID-5 para desbloquear el análisis de dominios.</p>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {/* PID-5 Domain Visuals */}
                                                            <div className="p-8 rounded-3xl bg-white/[0.01] border border-white/5 space-y-6">
                                                                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-purple-400">Dominios de la Personalidad (PID-5)</h4>
                                                                <div className="space-y-4">
                                                                    {[
                                                                        { key: 'AfectividadNegativa', label: 'Reactividad Emocional', color: 'from-purple-500 to-indigo-500', desc: 'Sensibilidad y profundidad con la que se sienten y procesan las emociones.' },
                                                                        { key: 'Desapego', label: 'Estilo de Conexión', color: 'from-blue-500 to-indigo-500', desc: 'Preferencia por el espacio de introspección personal y la recarga en solitario.' },
                                                                        { key: 'Antagonismo', label: 'Gestión de la Asertividad', color: 'from-amber-500 to-indigo-500', desc: 'Nivel de firmeza, postura personal y asertividad frente al conflicto.' },
                                                                        { key: 'Desinhibicion', label: 'Impulso y Planificación', color: 'from-pink-500 to-indigo-500', desc: 'Preferencia por la flexibilidad conductual y la adaptación libre.' },
                                                                        { key: 'Psicoticismo', label: 'Singularidad Cognitiva', color: 'from-purple-500 to-indigo-500', desc: 'Procesamiento de ideas creativo, pensamiento divergente y perspectivas únicas de la realidad.' }
                                                                    ].map(dom => {
                                                                        const score = calculatedResults.pidScores[dom.key] || 0;
                                                                        const pct = (score / 15) * 100;
                                                                        return (
                                                                            <div key={dom.key} className="space-y-2">
                                                                                <div className="flex justify-between items-baseline">
                                                                                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">{dom.label}</span>
                                                                                    <span className="text-[10px] font-mono font-bold text-purple-400">{score} / 15 Puntos</span>
                                                                                </div>
                                                                                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                                                                                    <div className={`h-full bg-gradient-to-r ${dom.color} rounded-full transition-all duration-1000`} style={{ width: `${pct}%` }} />
                                                                                </div>
                                                                                <p className="text-[9px] text-zinc-500 leading-normal font-sans">{dom.desc}</p>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>

                                                            {/* Detailed PID-5 table */}
                                                            <div className="p-6 rounded-3xl bg-white/[0.01] border border-white/5 space-y-4">
                                                                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-purple-400">Listado Completo de Ítems PID-5</h4>
                                                                <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 no-scrollbar">
                                                                    {PHENOM_PART_B.map((item, idx) => {
                                                                        const val = pidAnswers[idx + 1];
                                                                        const optLabels = ["Muy falso o a menudo falso", "A veces o un poco falso", "A veces o un poco verdadero", "Muy verdadero o a menudo verdadero"];
                                                                        return (
                                                                            <div key={item.id} className="p-3 rounded-2xl border border-white/5 bg-zinc-950/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                                                                                <div className="space-y-1">
                                                                                    <div className="flex gap-2 items-center">
                                                                                        <span className="px-2 py-0.5 rounded bg-white/5 text-[7px] font-mono font-bold text-zinc-500 uppercase">Ítem {item.id}</span>
                                                                                        <span className="text-[7px] font-mono text-zinc-600 uppercase tracking-widest">{item.domain}</span>
                                                                                    </div>
                                                                                    <p className="text-xs text-zinc-300 font-sans font-medium">{item.text}</p>
                                                                                </div>
                                                                                <span className={`px-3 py-1 rounded-xl text-[8px] font-mono uppercase font-black shrink-0 ${val === 3 ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20' :
                                                                                    val === 2 ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20' :
                                                                                        val === 1 ? 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/10' :
                                                                                            'bg-zinc-950 text-zinc-600 border border-white/5'
                                                                                    }`}>
                                                                                    {val !== undefined ? `${val} - ${optLabels[val]}` : 'Sin responder'}
                                                                                </span>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            )}

                                            {resultsSubTab === 'icar_detail' && (
                                                <div className="space-y-8 animate-in fade-in duration-300">
                                                    {!calculatedResults.isIcarComplete ? (
                                                        <div className="p-8 text-center border border-white/5 rounded-3xl bg-white/[0.01]">
                                                            <span className="text-[10px] font-mono font-black uppercase text-zinc-500 tracking-[0.3em]">Cartografía Cognitiva Incompleta</span>
                                                            <p className="text-[9px] text-zinc-600 mt-2 font-sans">Por favor completa el test ICAR16 para desbloquear este análisis detallado.</p>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {/* Summary Statistics */}
                                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                                                {[
                                                                    { label: 'Eficacia Global', value: `${Math.round((calculatedResults.score / 16) * 100)}%`, desc: `${calculatedResults.score} de 16 aciertos` },
                                                                    { label: 'Tiempo Promedio', value: `${calculatedResults.dwellAvg}s`, desc: 'Latencia por reactivo' },
                                                                    { label: 'Total Cambios', value: calculatedResults.totalChanges, desc: 'Disonancia/Modificaciones' },
                                                                    { label: 'Precisión Espacial', value: `${calculatedResults.categories["Razonamiento Espacial"] ? Math.round((calculatedResults.categories["Razonamiento Espacial"].correct / calculatedResults.categories["Razonamiento Espacial"].total) * 100) : 0}%`, desc: 'Visualización 3D' }
                                                                ].map((stat, i) => (
                                                                    <div key={i} className="p-5 rounded-3xl bg-white/[0.01] border border-white/5 flex flex-col justify-between">
                                                                        <span className="text-[8px] font-mono font-bold text-zinc-600 uppercase tracking-widest">{stat.label}</span>
                                                                        <span className="text-3xl font-black italic text-accent my-2 leading-none">{stat.value}</span>
                                                                        <span className="text-[8px] text-zinc-500 font-mono uppercase">{stat.desc}</span>
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            {/* Reactivos List */}
                                                            <div className="space-y-3">
                                                                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-accent">Desglose de Reactivos (1-16)</h4>

                                                                {icarQuestions.map((q, idx) => {
                                                                    const userAns = icarAnswers[q.question_number];
                                                                    const isCorrect = userAns === q.correct_answer;
                                                                    const isExpanded = expandedIcarQuestion === q.question_number;
                                                                    const latency = icarDwellTimes[q.question_number] || 0;
                                                                    const changes = icarChanges[q.question_number] || 0;

                                                                    return (
                                                                        <div key={q.question_number} className={`rounded-3xl border transition-all duration-300 ${isExpanded ? 'border-accent/30 bg-accent/[0.01]' : 'border-white/5 bg-zinc-950/20 hover:border-white/10'}`}>
                                                                            {/* Header row */}
                                                                            <div
                                                                                onClick={() => setExpandedIcarQuestion(isExpanded ? null : q.question_number)}
                                                                                className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer select-none"
                                                                            >
                                                                                <div className="flex gap-4 items-center">
                                                                                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-mono font-black text-xs ${isCorrect ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                                                                                        }`}>
                                                                                        {isCorrect ? <Check size={14} /> : <X size={14} />}
                                                                                    </span>
                                                                                    <div>
                                                                                        <div className="flex items-center gap-2">
                                                                                            <span className="text-xs font-bold text-white uppercase font-sans">Reactivo {q.question_number}</span>
                                                                                            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[7px] font-mono text-zinc-500 uppercase tracking-wider">{q.category}</span>
                                                                                        </div>
                                                                                        <span className="text-[8px] font-mono text-zinc-500 uppercase mt-0.5 block">{q.construct}</span>
                                                                                    </div>
                                                                                </div>

                                                                                <div className="flex items-center gap-6 self-end md:self-auto">
                                                                                    <div className="flex gap-4">
                                                                                        <span className="text-[8px] font-mono text-zinc-600 uppercase">LATENCIA: <strong className="text-zinc-400 font-bold">{latency.toFixed(1)}s</strong></span>
                                                                                        <span className="text-[8px] font-mono text-zinc-600 uppercase">CAMBIOS: <strong className="text-zinc-400 font-bold">{changes}</strong></span>
                                                                                    </div>
                                                                                    <button className="w-8 h-8 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-all">
                                                                                        <ChevronDown size={14} className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                                                                    </button>
                                                                                </div>
                                                                            </div>

                                                                            {/* Expanded details */}
                                                                            {isExpanded && (
                                                                                <div className="border-t border-white/5 p-6 space-y-6 animate-in slide-in-from-top duration-300">
                                                                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                                                                                        {/* Left: instruction & diagram */}
                                                                                        <div className="lg:col-span-7 space-y-4">
                                                                                            <p className="text-sm font-bold text-white leading-relaxed italic">"{q.instruction_text}"</p>

                                                                                            {renderTestStimulusDiagram(q)}
                                                                                        </div>

                                                                                        {/* Right: choices breakdown */}
                                                                                        <div className="lg:col-span-5 space-y-2">
                                                                                            <span className="text-[8px] font-mono font-black uppercase text-zinc-600 tracking-widest block mb-2">Desglose de Respuestas</span>
                                                                                            {q.options.map(opt => {
                                                                                                const isUserChoice = userAns === opt.label;
                                                                                                const isCorrectAnswer = q.correct_answer === opt.label;
                                                                                                return (
                                                                                                    <div
                                                                                                        key={opt.label}
                                                                                                        className={`p-3 rounded-2xl border flex items-center gap-3 transition-all ${isCorrectAnswer ? 'bg-emerald-500/10 border-emerald-500/30 text-white' :
                                                                                                            isUserChoice ? 'bg-red-500/10 border-red-500/30 text-white' :
                                                                                                                'bg-zinc-950/20 border-white/5 text-zinc-400'
                                                                                                            }`}
                                                                                                    >
                                                                                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-mono font-black border shrink-0 ${isCorrectAnswer ? 'bg-emerald-500 text-black border-emerald-500' :
                                                                                                            isUserChoice ? 'bg-red-500 text-white border-red-500' :
                                                                                                                'bg-zinc-900 border-white/10 text-zinc-500'
                                                                                                            }`}>{opt.label}</span>
                                                                                                        <span className="text-xs truncate font-medium">{opt.value}</span>
                                                                                                        {isCorrectAnswer && <span className="ml-auto text-[7px] font-mono font-black uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/10">Correcto</span>}
                                                                                                        {!isCorrectAnswer && isUserChoice && <span className="ml-auto text-[7px] font-mono font-black uppercase text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/10">Tu Selección</span>}
                                                                                                    </div>
                                                                                                );
                                                                                            })}
                                                                                        </div>
                                                                                    </div>

                                                                                    {/* Bottom: Rationale & AI Opinion */}
                                                                                    {(() => {
                                                                                        const rationaleData = icarRationale.find(r => r.question_number === q.question_number);
                                                                                        if (!rationaleData) return null;
                                                                                        return (
                                                                                            <div className="lg:col-span-12 mt-6 pt-6 border-t border-white/5 space-y-4">
                                                                                                <div className="space-y-1">
                                                                                                    <span className="text-[8px] font-mono font-black uppercase text-accent tracking-[0.2em] block">Base Lógica de Resolución</span>
                                                                                                    <p className="text-[11px] text-zinc-300 font-sans italic leading-relaxed">{rationaleData.rationale}</p>
                                                                                                </div>
                                                                                                <div className={`p-4 rounded-2xl border ${isCorrect ? 'bg-emerald-950/20 border-emerald-500/20' : 'bg-red-950/10 border-red-500/10'}`}>
                                                                                                    <span className={`text-[8px] font-mono font-black uppercase tracking-[0.2em] block mb-2 ${isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                                                                                                        Opinión del Sistema // {isCorrect ? 'Procesamiento Exitoso' : 'Fallo en Procesamiento'}
                                                                                                    </span>
                                                                                                    <p className={`text-[11px] font-sans italic leading-relaxed ${isCorrect ? 'text-emerald-200/80' : 'text-red-200/80'}`}>
                                                                                                        {isCorrect ? rationaleData.cognitive_implication_correct : rationaleData.cognitive_implication_incorrect}
                                                                                                    </p>
                                                                                                </div>
                                                                                            </div>
                                                                                        );
                                                                                    })()}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : activeTest === 'phenom' ? (
                                <div className={`mx-auto animate-in slide-in-from-right duration-300 ${currentPhenomIndex < 4 ? 'max-w-5xl w-full' : 'max-w-2xl'}`}>
                                    {currentPhenomIndex < 4 ? (
                                        // PARTE A: LAS 4 DIMENSIONES ONTOLÓGICAS WITH VIDEO + STT
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center mb-1 px-1">
                                                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-purple-400">
                                                    Pregunta {currentPhenomIndex + 1} de 4
                                                </span>
                                                <button onClick={() => setActiveTest(null)} className="text-[8px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors bg-white/5 px-3 py-1 rounded-full">Salir</button>
                                            </div>

                                            {/* Layout: Video Left, Text/Controls Right */}
                                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 md:gap-4 bg-[#0b0b0d] border border-white/5 rounded-2xl md:rounded-[2.5rem] p-2 md:p-4 shadow-2xl relative overflow-hidden">
                                                <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 blur-[120px] pointer-events-none rounded-full" />

                                                {/* Left: Question Card & Video Player */}
                                                <div className="lg:col-span-6 flex flex-col gap-2 md:gap-4">
                                                    {/* Question Card */}
                                                    <div className="bg-purple-950/20 border border-purple-800/30 rounded-2xl md:rounded-3xl p-3 md:p-4 relative overflow-hidden shadow-inner">
                                                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[50px] pointer-events-none" />
                                                        <h4 className="text-[8px] font-black uppercase tracking-[0.2em] text-purple-400 mb-1.5">{PHENOM_PART_A[currentPhenomIndex].title}</h4>
                                                        <p className="text-base md:text-xl font-serif italic text-white/90 leading-tight">"{PHENOM_PART_A[currentPhenomIndex].question}"</p>
                                                    </div>

                                                    {/* Video Player */}
                                                    <div className="relative w-full h-[240px] xs:h-[280px] lg:h-auto lg:aspect-video bg-black rounded-xl lg:rounded-3xl overflow-hidden border border-white/10 group shadow-2xl flex flex-col justify-between">
                                                        <video ref={phenomWebcamRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />

                                                        {/* Recording HUD */}
                                                        <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between bg-gradient-to-t from-black/60 via-transparent to-black/30">
                                                            <div className="flex justify-between items-start">
                                                                <div className="flex gap-2">
                                                                    <div className="px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-md border border-white/10 flex items-center gap-1">
                                                                        <Mic size={10} className={phenomVolume > 10 ? "text-purple-400" : "text-white/50"} />
                                                                        <div className="flex gap-0.5 h-2.5 items-end">
                                                                            {Array.from({ length: 5 }).map((_, i) => {
                                                                                const maxVol = 100;
                                                                                const normalizedVol = Math.min(phenomVolume / maxVol, 1);
                                                                                const multiplier = i === 2 ? 1 : (i === 1 || i === 3 ? 0.7 : 0.4);
                                                                                const height = Math.max(2, normalizedVol * 10 * multiplier);
                                                                                const isActive = phenomVolume > (i * 10);

                                                                                return (
                                                                                    <div
                                                                                        key={i}
                                                                                        className={`w-0.5 rounded-t-sm transition-all duration-75 ${isActive ? 'bg-purple-400' : 'bg-white/20'}`}
                                                                                        style={{ height: `${height}px` }}
                                                                                    />
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                    <div className="px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-md border border-white/10 flex items-center gap-1">
                                                                        <Camera size={10} className="text-white" />
                                                                        <span className="text-[7px] font-black uppercase text-white font-mono tracking-wider">Cam OK</span>
                                                                    </div>
                                                                </div>
                                                                {phenomRecording && (
                                                                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border shadow-lg ${phenomPaused ? 'bg-amber-500/20 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.4)]' : 'bg-red-500/20 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse'}`}>
                                                                        <div className={`w-2 h-2 rounded-full ${phenomPaused ? 'bg-amber-500' : 'bg-red-500'}`} />
                                                                        <span className={`text-[8px] font-black uppercase tracking-widest ${phenomPaused ? 'text-amber-500' : 'text-red-500'}`}>{phenomPaused ? 'PAUSADO' : 'GRABANDO'}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right: Controls & Transcription */}
                                                <div className="lg:col-span-6 flex flex-col gap-6">
                                                    <div className="flex-1 bg-[#0f0f12] border border-white/5 rounded-2xl md:rounded-3xl flex flex-col overflow-hidden shadow-inner min-h-[160px] md:min-h-[220px]">
                                                        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                                            <div className="flex items-center gap-1">
                                                                <Activity size={12} className={phenomRecording && !phenomPaused ? "text-purple-400 animate-pulse" : "text-zinc-600"} />
                                                                <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Traductor Existencial de Voz</span>
                                                            </div>
                                                            <span className="text-[7px] font-mono text-zinc-600 uppercase tracking-widest">
                                                                {phenomRecording && !phenomPaused ? 'Grabando...' : (phenomHasRecorded[currentPhenomIndex] ? 'Sincronizados los subtítulos' : 'Modo Editor')}
                                                            </span>
                                                        </div>
                                                        <div className="flex-1 relative">
                                                            <textarea
                                                                value={phenomTextValue}
                                                                onChange={(e) => setPhenomTextValue(e.target.value)}
                                                                placeholder={PHENOM_PART_A[currentPhenomIndex].placeholder}
                                                                disabled={phenomRecording && !phenomPaused}
                                                                className="absolute inset-0 w-full h-full bg-transparent p-4 md:p-5 text-sm text-zinc-300 font-sans leading-relaxed resize-none focus:outline-none disabled:opacity-50"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        {phenomRecording ? (
                                                            <>
                                                                <button
                                                                    onClick={togglePhenomPause}
                                                                    className={`py-3 md:py-4 rounded-xl md:rounded-2xl flex flex-col items-center justify-center gap-1 md:gap-1.5 transition-all border ${phenomPaused
                                                                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                                                                        : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                                                                        }`}
                                                                >
                                                                    {phenomPaused ? (
                                                                        <>
                                                                            <Play size={16} className="text-amber-400" />
                                                                            <span className="text-[8px] font-black uppercase tracking-widest">Reanudar</span>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Pause size={16} />
                                                                            <span className="text-[8px] font-black uppercase tracking-widest">Pausar</span>
                                                                        </>
                                                                    )}
                                                                </button>

                                                                <button
                                                                    onClick={togglePhenomRecording}
                                                                    className="bg-red-500/20 border border-red-500/30 hover:bg-red-500 hover:text-black py-4 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.15)]"
                                                                >
                                                                    <Square size={16} />
                                                                    <span className="text-[8px] font-black uppercase tracking-widest">Finalizar y Guardar</span>
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <button
                                                                onClick={togglePhenomRecording}
                                                                className="col-span-2 bg-purple-500/20 border border-purple-500/30 hover:bg-purple-500 hover:text-black py-4 md:py-5 rounded-xl md:rounded-2xl flex items-center justify-center gap-2 md:gap-3 transition-all text-purple-400 hover:scale-[1.01] shadow-[0_0_40px_rgba(168,85,247,0.15)] font-black uppercase tracking-[0.2em] text-[10px] md:text-xs"
                                                            >
                                                                <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-ping" />
                                                                Iniciar Grabación de Respuesta
                                                            </button>
                                                        )}
                                                    </div>

                                                    <div className="flex justify-between items-center pt-2">
                                                        <button
                                                            onClick={() => currentPhenomIndex > 0 && setCurrentPhenomIndex(prev => prev - 1)}
                                                            disabled={currentPhenomIndex === 0}
                                                            className="px-4 py-2 md:px-5 md:py-2.5 rounded-lg md:rounded-xl border border-white/5 text-[8px] font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:border-white/20 transition-all disabled:opacity-30 disabled:pointer-events-none"
                                                        >
                                                            Atrás
                                                        </button>
                                                        <button
                                                            onClick={() => handleSavePhenomQualitative(phenomTextValue)}
                                                            disabled={!phenomTextValue.trim() && !phenomHasRecorded[currentPhenomIndex]}
                                                            className="px-5 py-2 md:px-7 md:py-2.5 rounded-lg md:rounded-xl bg-purple-950/20 border border-purple-800/30 text-purple-300 hover:bg-purple-500 hover:text-black transition-all font-black uppercase text-[8px] tracking-widest disabled:opacity-30 disabled:pointer-events-none"
                                                        >
                                                            Siguiente Pregunta
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        // PARTE B: PID-5 BREVE
                                        <div className="space-y-8 p-8 md:p-12 rounded-[2.5rem] bg-[#121214] border border-white/5 shadow-2xl relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 blur-[120px] pointer-events-none rounded-full" />
                                            <div className="flex justify-between items-center border-b border-white/5 pb-4">
                                                <span className="text-[8px] font-black uppercase tracking-widest text-purple-400">
                                                    PID-5 Breve // Parte B: Reactivo {currentPhenomIndex - 3} de 25
                                                </span>
                                                <button onClick={() => setActiveTest(null)} className="text-[8px] font-black uppercase tracking-widest text-zinc-500 hover:text-white">Salir</button>
                                            </div>

                                            <div className="space-y-6">
                                                <span className="px-3 py-1 rounded-md bg-purple-500/10 border border-purple-500/20 text-[7px] font-black uppercase tracking-widest text-purple-400 font-mono">
                                                    Dominio: {PHENOM_PART_B[currentPhenomIndex - 4].domain}
                                                </span>
                                                <p className="text-2xl md:text-3xl font-sans font-light italic text-white leading-snug">
                                                    "{PHENOM_PART_B[currentPhenomIndex - 4].text}"
                                                </p>
                                            </div>

                                            <div className="space-y-3 pt-6">
                                                {[
                                                    { value: 0, text: "Completamente Falso" },
                                                    { value: 1, text: "A veces Falso" },
                                                    { value: 2, text: "A veces Verdadero" },
                                                    { value: 3, text: "Completamente Verdadero" }
                                                ].map(opt => (
                                                    <button
                                                        key={opt.value}
                                                        onClick={() => handleSelectPidAnswer(opt.value)}
                                                        className="w-full text-left p-5 rounded-2xl border border-white/5 bg-white/[0.01] hover:border-purple-500/35 hover:bg-purple-950/5 transition-all text-xs font-semibold tracking-wider font-sans text-zinc-300 hover:text-white group flex gap-4 items-center"
                                                    >
                                                        <span className="w-8 h-8 rounded-full bg-purple-950/20 border border-purple-800/30 flex items-center justify-center text-[10px] font-black text-purple-400 group-hover:bg-purple-500 group-hover:text-black shrink-0">
                                                            {opt.value}
                                                        </span>
                                                        <span>{opt.text}</span>
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="flex justify-between items-center pt-4">
                                                <button
                                                    onClick={() => setCurrentPhenomIndex(prev => prev - 1)}
                                                    className="px-6 py-3 rounded-xl border border-white/5 text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:border-white/20 transition-all"
                                                >
                                                    Atrás
                                                </button>
                                                <div className="text-[8px] font-black uppercase tracking-widest text-zinc-600">
                                                    Likert Scale 0-3
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden mt-8">
                                        <div className="bg-purple-500 h-full transition-all duration-500" style={{ width: `${((currentPhenomIndex + 1) / 29) * 100}%` }} />
                                    </div>
                                </div>
                            ) : activeTest === 'icar16' ? (
                                <div className="max-w-3xl mx-auto space-y-4 animate-in slide-in-from-right duration-300">
                                    <div className="flex justify-between items-center mb-2 px-1">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-accent">Pregunta {currentIcarIndex + 1} de 16</span>
                                        <button onClick={exitIcarTest} className="text-[8px] font-black uppercase tracking-widest text-zinc-500 hover:text-white bg-white/5 px-3 py-1 rounded-full transition-colors">Salir</button>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 items-start">
                                        <div className="lg:col-span-6 space-y-4">
                                            <span className="px-2 py-1 rounded-md bg-accent/10 border border-accent/20 text-[7px] font-black uppercase tracking-widest text-accent font-mono">{icarQuestions[currentIcarIndex].category}</span>
                                            <p className="text-base font-black italic uppercase text-white leading-tight">{icarQuestions[currentIcarIndex].instruction_text}</p>

                                            {renderTestStimulusDiagram(icarQuestions[currentIcarIndex])}
                                        </div>

                                        <div className="lg:col-span-6 space-y-3">
                                            {icarQuestions[currentIcarIndex].options.map(opt => (
                                                <button
                                                    key={opt.label}
                                                    onClick={() => handleSelectIcarAnswer(opt.label)}
                                                    className="w-full text-left p-4 rounded-2xl border border-white/5 bg-white/[0.01] hover:border-accent/40 hover:bg-accent/5 transition-all text-xs font-semibold leading-relaxed font-sans text-zinc-300 hover:text-white group flex gap-3 items-center"
                                                >
                                                    <span className="w-6 h-6 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-[9px] font-mono font-black text-zinc-400 group-hover:bg-accent group-hover:text-black shrink-0">{opt.label}</span>
                                                    <span className="truncate">{opt.value}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden mt-8">
                                        <div className="bg-accent h-full transition-all duration-500" style={{ width: `${((currentIcarIndex + 1) / 16) * 100}%` }} />
                                    </div>
                                </div>
                            ) : activeTest === 'biographic' ? (
                                <BiographicInterview username={user} activeVersion={activeVersion}
                                    onClose={() => setActiveTest(null)}
                                    onComplete={(data) => {
                                        console.log("Biographic Test Complete", data);
                                        const suffix = activeVersion > 1 ? '_v' + activeVersion : '';
                                        localStorage.setItem('oasis_bio_transcriptions_' + user + suffix, JSON.stringify(data));
                                        setActiveTest(null);
                                    }}
                                />
                            ) : null}
                        </div>
                    )}

                    {activeTabName === 'loop_map' && (
                        <div className="w-full min-h-[60vh] flex flex-col items-center justify-center animate-in fade-in duration-500 relative px-2 sm:px-6">
                            {hasMap ? (() => {
                                // Load patient nodes and edges
                                let patientNodes = [];
                                let patientEdges = [];
                                try {
                                    patientNodes = JSON.parse(localStorage.getItem('oasis_canvas_nodes_' + user)) || [];
                                    patientEdges = JSON.parse(localStorage.getItem('oasis_canvas_edges_' + user)) || [];
                                } catch (e) {}

                                // Bounding box calculation to center SVG
                                let minX = 0, minY = 0, width = 800, height = 600;
                                if (patientNodes.length > 0) {
                                    let minNodeX = Infinity, minNodeY = Infinity, maxNodeX = -Infinity, maxNodeY = -Infinity;
                                    patientNodes.forEach(n => {
                                        const w = n.width || 120;
                                        const h = n.height || 120;
                                        if (n.x < minNodeX) minNodeX = n.x;
                                        if (n.y < minNodeY) minNodeY = n.y;
                                        if (n.x + w > maxNodeX) maxNodeX = n.x + w;
                                        if (n.y + h > maxNodeY) maxNodeY = n.y + h;
                                    });
                                    const padding = 120;
                                    minX = minNodeX - padding;
                                    minY = minNodeY - padding;
                                    width = (maxNodeX - minNodeX) + padding * 2;
                                    height = (maxNodeY - minNodeY) + padding * 2;
                                }

                                const drawGravityLine = (x1, y1, x2, y2) => {
                                    const dx = x2 - x1;
                                    const dy = y2 - y1;
                                    const cp1x = x1 + dx * 0.1;
                                    const cp1y = y1 + dy * 0.7;
                                    const cp2x = x2 - dx * 0.1;
                                    const cp2y = y2 - dy * 0.3;
                                    return `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
                                };

                                return (
                                    <div className="w-full max-w-5xl aspect-video rounded-3xl bg-[#09090b]/80 border border-white/5 p-4 relative overflow-hidden shadow-[inset_0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-md">
                                        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                                        
                                        <svg viewBox={`${minX} ${minY} ${width} ${height}`} className="w-full h-full z-10 relative">
                                            {/* Connections */}
                                            {patientEdges.map((edge, i) => {
                                                const source = patientNodes.find(n => n.id === edge.source);
                                                const target = patientNodes.find(n => n.id === edge.target);
                                                if (!source || !target) return null;

                                                const sx = source.x + (source.width || 120) / 2;
                                                const sy = source.y + (source.height || 120);
                                                const tx = target.x + (target.width || 120) / 2;
                                                const ty = target.y;

                                                const pathString = drawGravityLine(sx, sy, tx, ty);
                                                
                                                return (
                                                    <g key={i}>
                                                        <path d={pathString} fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="6" />
                                                        <path d={pathString} fill="none" stroke={edge.color || 'rgba(255, 255, 255, 0.4)'} strokeWidth="1.5" />
                                                    </g>
                                                );
                                            })}

                                            {/* Nodes */}
                                            {patientNodes.map(node => {
                                                const isContext = node.type === 'CONTEXT';
                                                const isState = node.type === 'INTERNAL_STATE' || node.type === 'MACRO_MECHANISM';
                                                const isSymptom = node.type === 'CRITICAL_SYMPTOM';
                                                const isChain = node.type === 'IMPACT_CHAIN';

                                                let strokeColor = 'rgba(255,255,255,0.2)';
                                                let bgColor = 'rgba(24, 24, 27, 0.4)';
                                                let textColor = 'white';
                                                let title = 'NODO';

                                                if (isContext) {
                                                    strokeColor = '#0ea5e9';
                                                    bgColor = 'rgba(3, 105, 161, 0.2)';
                                                    textColor = '#bae6fd';
                                                    title = 'CONTEXTO INICIAL';
                                                } else if (isState) {
                                                    strokeColor = '#10b981';
                                                    bgColor = 'rgba(4, 120, 87, 0.2)';
                                                    textColor = '#a7f3d0';
                                                    title = node.type === 'MACRO_MECHANISM' ? 'MACRO MECANISMO' : 'ESTADO INTERNO';
                                                } else if (isSymptom) {
                                                    strokeColor = '#ef4444';
                                                    bgColor = 'rgba(185, 28, 28, 0.2)';
                                                    textColor = '#fecaca';
                                                    title = 'SÍNTOMA CRÍTICO';
                                                } else if (isChain) {
                                                    strokeColor = '#71717a';
                                                    bgColor = 'rgba(63, 63, 70, 0.2)';
                                                    textColor = '#e4e4e7';
                                                    title = 'CADENA DE IMPACTO';
                                                }

                                                const cx = node.x + (node.width || 120) / 2;
                                                const cy = node.y + (node.height || 120) / 2;
                                                const rx = (node.width || 120) / 2;
                                                const ry = (node.height || 120) / 2;

                                                return (
                                                    <g key={node.id} className="group/node">
                                                        <ellipse cx={cx} cy={cy} rx={rx + 10} ry={ry + 10} fill={strokeColor} className="opacity-[0.03] blur-md" />
                                                        
                                                        {isContext && (
                                                            <polygon 
                                                                points={`${cx},${node.y} ${node.x + (node.width || 120)},${cy} ${cx},${node.y + (node.height || 120)} ${node.x},${cy}`}
                                                                fill={bgColor}
                                                                stroke={strokeColor}
                                                                strokeWidth="1.5"
                                                            />
                                                        )}
                                                        {isState && (
                                                            <ellipse 
                                                                cx={cx} cy={cy} rx={rx} ry={ry}
                                                                fill={bgColor}
                                                                stroke={strokeColor}
                                                                strokeWidth="1.5"
                                                            />
                                                        )}
                                                        {(isSymptom || isChain) && (
                                                            <rect 
                                                                x={node.x} y={node.y} width={node.width || 120} height={node.height || 120} rx="16" ry="16"
                                                                fill={bgColor}
                                                                stroke={strokeColor}
                                                                strokeWidth="1.5"
                                                            />
                                                        )}

                                                        <text 
                                                            x={cx} y={node.y - 12} 
                                                            textAnchor="middle" 
                                                            className="text-[8px] font-bold font-mono tracking-widest fill-zinc-500 uppercase select-none"
                                                        >
                                                            {title}
                                                        </text>

                                                        <foreignObject 
                                                            x={node.x + 8} y={node.y + 8} 
                                                            width={(node.width || 120) - 16} height={(node.height || 120) - 16}
                                                        >
                                                            <div className="w-full h-full flex items-center justify-center text-center p-2 overflow-hidden select-none">
                                                                <span 
                                                                    className="text-[9px] font-black uppercase tracking-wider leading-relaxed font-mono"
                                                                    style={{ color: textColor }}
                                                                >
                                                                    {node.label}
                                                                </span>
                                                            </div>
                                                        </foreignObject>
                                                    </g>
                                                );
                                            })}
                                        </svg>
                                    </div>
                                );
                            })() : (
                                <>
                                    <Compass size={48} className="text-zinc-800 mb-6 animate-pulse" />
                                    <h3 className="text-2xl md:text-4xl font-black italic uppercase text-white/40 tracking-widest text-center">
                                        Sin Cartografía Asignada
                                    </h3>
                                    <p className="text-[10px] md:text-xs font-mono text-zinc-500 mt-6 max-w-lg text-center leading-relaxed">
                                        AÚN NO HAY UN MAPA DE BUCLES DISPONIBLE PARA TU IDENTIDAD. EL MAPA GENERADO Y PUBLICADO POR EL ESPECIALISTA CLÍNICO DESDE TU PERFIL APARECERÁ AQUÍ.
                                    </p>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderClinicalView = () => {
        return <PsychologistDashboard onClose={() => setView('canvas')} />;
    };

    const renderFeedView = () => (
        <div className="w-full h-full relative overflow-y-auto snap-y snap-mandatory no-scrollbar bg-transparent pt-80 pb-48">

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

                    {isRegisterMode && (
                        <>
                            <div className="space-y-1">
                                <span className="text-[7px] font-black uppercase tracking-widest text-zinc-500 ml-5">Nombre Completo</span>
                                <input
                                    type="text"
                                    id="oasis_fullname_input"
                                    placeholder="NOMBRE COMPLETO"
                                    className="w-full h-14 bg-black/20 border border-white/5 rounded-2xl px-6 text-[10px] font-black uppercase tracking-widest text-white placeholder:text-zinc-700 focus:border-accent/40 outline-none transition-all"
                                />
                            </div>

                            <div className="space-y-1">
                                <span className="text-[7px] font-black uppercase tracking-widest text-zinc-500 ml-5">Edad</span>
                                <input
                                    type="number"
                                    id="oasis_age_input"
                                    placeholder="EDAD"
                                    className="w-full h-14 bg-black/20 border border-white/5 rounded-2xl px-6 text-[10px] font-black uppercase tracking-widest text-white placeholder:text-zinc-700 focus:border-accent/40 outline-none transition-all"
                                />
                            </div>
                        </>
                    )}

                    <button
                        onClick={() => {
                            const u = document.getElementById('oasis_user_input').value;
                            const p = document.getElementById('oasis_key_input').value;
                            const fn = isRegisterMode ? (document.getElementById('oasis_fullname_input')?.value || "") : "";
                            const age = isRegisterMode ? (document.getElementById('oasis_age_input')?.value || null) : null;
                            if (u && p) handleAuth(u, p, fn, age);
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

            <div key={view} className="w-full h-full relative overflow-hidden animate-fade-zoom">
                {view === 'clinical' ? renderClinicalView() :
                    view === 'canvas' ? renderCanvasView() :
                        view === 'soul' ? renderSoulView() :
                            (view === 'feed' ? renderFeedView() :
                                <ProfileView
                                    user={user}
                                    soulPieces={soulPieces}
                                    blocks={blocks}
                                    setBlocks={setBlocks}
                                    syncBlocks={syncBlocks}
                                    accent={accent}
                                    isEditingProfile={isEditingProfile}
                                    setIsEditingProfile={setIsEditingProfile}
                                    calculatedResults={calculatedResults}
                                    noteKeywords={noteKeywords}
                                    avatar={avatar}
                                    setAvatar={setAvatar}
                                    handleStart={handleStart}
                                    profileCam={profileCam}
                                    draggingId={draggingId}
                                    centerProfile={() => setProfileCam({ x: 0, y: 0, scale: 0.7 })}
                                    onSoulPieceImageChange={handleSoulPieceImageChange}
                                    deleteBlock={deleteBlock}
                                    deleteBlocks={deleteBlocks}
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
                                    setView={setView}
                                    playlists={playlists}
                                    setPlayQueue={setPlayQueue}
                                    setCurrentTrack={setCurrentTrack}
                                    setIsPlaying={setIsPlaying}
                                    conversations={conversations}
                                    setConversations={setConversations}
                                    handleSelectConversation={handleSelectConversation}
                                    onSaveProfile={handleSaveProfile}
                                    onNewChat={handleNewChat}
                                    onOpenNotebook={setActiveNotebook}
                                    setActiveTest={setActiveTest}
                                    setIsSettingsOpen={setIsSettingsOpen}
                                />
                            )}
            </div>

            {false && (
                <>
                    {!isComposerOpen && !isPlayerFull && !isChatOpen && !activeTest && view !== 'soul' && (
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
                            pos={view === 'feed' ? { x: playerPos.x || null, y: 24 } : playerPos}
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
                </>
            )}

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



            {/* SETTINGS PANEL (MODAL) */}
            {isSettingsOpen && (
                <div
                    onClick={() => setIsSettingsOpen(false)}
                    className="fixed inset-0 z-[600] flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-xl max-h-[85vh] bg-[#0c0c0d]/95 backdrop-blur-3xl rounded-[3rem] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.6)] p-6 md:p-10 flex flex-col space-y-8 animate-in zoom-in-95 duration-300 overflow-y-auto no-scrollbar"
                    >
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

                            {/* PLANTILLAS DE LA COMUNIDAD */}
                            <div className="space-y-3 pt-2">
                                <span className="text-[7px] font-black uppercase tracking-widest text-zinc-500 block px-2">Plantillas de la Comunidad</span>
                                {bgTemplates.length === 0 ? (
                                    <div className="p-6 bg-white/5 rounded-2xl border border-white/5 text-center">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500 block">No hay plantillas compartidas aún</span>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-4">
                                        {bgTemplates.map(tpl => (
                                            <button
                                                key={tpl.id}
                                                onClick={() => {
                                                    setBgType(tpl.type);
                                                    setBgValue(tpl.value);
                                                    setIsTiled(tpl.isTiled);
                                                    syncAura(tpl.type, tpl.value, tpl.isTiled);
                                                }}
                                                className={`p-4 rounded-2xl border transition-all text-left space-y-2 relative overflow-hidden group ${bgValue === tpl.value ? 'border-accent bg-accent/5' : 'border-white/5 bg-white/5 hover:border-white/10'}`}
                                            >
                                                {tpl.type === 'color' && (
                                                    <div className="absolute inset-0 opacity-[0.08] transition-opacity group-hover:opacity-15 pointer-events-none" style={{ backgroundColor: tpl.value }} />
                                                )}
                                                {tpl.type === 'image' && (
                                                    <img src={formatUrl(tpl.value)} className="absolute inset-0 w-full h-full object-cover opacity-[0.08] transition-opacity group-hover:opacity-15 pointer-events-none" />
                                                )}
                                                {tpl.type === 'video' && (
                                                    <video src={formatUrl(tpl.value)} muted loop autoPlay playsInline className="absolute inset-0 w-full h-full object-cover opacity-[0.08] transition-opacity group-hover:opacity-15 pointer-events-none" />
                                                )}

                                                <div className="relative z-10 space-y-1">
                                                    <span className="text-[8px] font-black uppercase text-white block truncate">{tpl.name}</span>
                                                    <span className="text-[6px] font-black uppercase text-zinc-500 block truncate">Por @{tpl.creator || 'Anónimo'}</span>
                                                    <div className="flex gap-1.5 items-center pt-0.5">
                                                        <span className="px-1.5 py-0.5 rounded bg-white/10 text-[5px] font-black uppercase tracking-widest text-zinc-300">{tpl.type}</span>
                                                        {tpl.isTiled && <span className="px-1.5 py-0.5 rounded bg-accent/10 text-[5px] font-black uppercase tracking-widest text-accent">Mosaico</span>}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* CUSTOM MEDIA UPLOADER & FORMAT CONTROLS */}
                            <div className="pt-2 space-y-6">
                                <label className="flex flex-col items-center justify-center gap-3 w-full py-8 bg-white/5 border border-dashed border-white/20 rounded-[2rem] cursor-pointer hover:bg-white/10 hover:border-accent/40 transition-all group">
                                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform"><Plus size={20} className="text-accent" /></div>
                                    <div className="text-center">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white block mb-1">Cargar Aura Nueva</span>
                                        <span className="text-[6px] font-black uppercase tracking-widest text-zinc-500">Imagen o Video Cinético</span>
                                    </div>
                                    <input type="file" className="hidden" accept="image/*,video/*" onChange={handleBgUpload} />
                                </label>

                                {/* GUARDAR FONDO ACTUAL COMO PLANTILLA */}
                                {bgValue && bgValue !== '#030304' && (
                                    <div className="p-5 bg-white/5 border border-white/5 rounded-[2rem] space-y-3.5 animate-in fade-in duration-300">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-accent block">Compartir como plantilla de la comunidad</span>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newTemplateName}
                                                onChange={(e) => setNewTemplateName(e.target.value)}
                                                placeholder="Ej: Nebula Violeta, Mi Cielo..."
                                                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white placeholder:text-zinc-700 focus:border-accent/40 outline-none transition-all"
                                            />
                                            <button
                                                onClick={() => handleSaveAsTemplate(newTemplateName)}
                                                className="px-4 py-2 bg-accent text-black text-[9px] font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md shadow-accent/20"
                                            >
                                                Guardar
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {(bgType === 'image' || bgType === 'video') && (
                                    <div className="space-y-4 animate-in slide-in-from-top duration-700">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500 block px-2">Estructura del Aura</span>
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
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Utilidades de Red</span>
                                <button 
                                    onClick={() => {
                                        const renderedBlocks = blocks.filter(b => b.type !== 'insight' && !b.isPublic);
                                        const targetScale = 0.8;
                                        let targetX = 0;
                                        let targetY = 0;
                                        const diaryBlock = renderedBlocks.find(b => b.type === 'diary_notebook');
                                        if (diaryBlock) {
                                            targetX = -diaryBlock.x * targetScale;
                                            targetY = -diaryBlock.y * targetScale;
                                        } else if (renderedBlocks.length > 0) {
                                            let minX = Infinity;
                                            let maxX = -Infinity;
                                            let minY = Infinity;
                                            let maxY = -Infinity;
                                            renderedBlocks.forEach(b => {
                                                const bx = b.x !== undefined ? b.x : 0;
                                                const by = b.y !== undefined ? b.y : 0;
                                                const bw = getBWidth(b, false);
                                                const bh = getBHeight(b, false);
                                                if (bx - bw/2 < minX) minX = bx - bw/2;
                                                if (bx + bw/2 > maxX) maxX = bx + bw/2;
                                                if (by - bh/2 < minY) minY = by - bh/2;
                                                if (by + bh/2 > maxY) maxY = by + bh/2;
                                            });
                                            const centerX = (minX + maxX) / 2;
                                            const centerY = (minY + maxY) / 2;
                                            targetX = -centerX * targetScale;
                                            targetY = -centerY * targetScale;
                                        }
                                        setCam({ x: targetX, y: targetY, scale: targetScale });
                                    }} 
                                    className="w-full py-4 bg-white/5 rounded-2xl text-[9px] font-black uppercase tracking-widest text-zinc-300 hover:bg-white/10 hover:text-white transition-all border border-white/5"
                                >
                                    Recentrar Lienzo Maestro
                                </button>
                                <button onClick={() => setProfileCam({ x: 0, y: 0, scale: 0.7 })} className="w-full py-4 bg-white/5 rounded-2xl text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:bg-white/10 transition-all border border-white/5">Resetear Mapa Santuario</button>
                                <button onClick={() => { setPasswordInput(''); setPasswordError(false); setIsPasswordModalOpen(true); }} className="w-full py-4 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all">Panel de Observación Clínica</button>
                            </div>
                        </div>

                        {/* MOTOR DE INTELIGENCIA (IA) */}
                        <div className="space-y-6 pt-6 border-t border-white/10">
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
                                    <span className="text-[6px] font-black uppercase tracking-[0.4em] text-zinc-500">Oasis v2.0 - Acceso Seguro</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* BOTÓN DE ACCIÓN ÚNICO (LA REFINERÍA & CHAT) */}
            {view === 'canvas' && (
                <div className="fixed top-6 md:top-8 left-1/2 -translate-x-1/2 z-[400] flex items-center gap-1.5 md:gap-3 p-1.5 md:p-2 bg-[#050506] border border-white/10 rounded-full shadow-[0_40px_100px_rgba(0,0,0,0.9)] animate-in slide-in-from-top-5 duration-700 max-w-[95vw]">
                    <div className="relative group mx-0.5">
                        <div className="absolute inset-0 bg-accent/20 animate-blob blur-xl group-hover:bg-accent/40 transition-colors" />
                        <button
                            onClick={(e) => { e.stopPropagation(); openNewComposer(); }}
                            className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-accent text-black flex items-center justify-center shadow-[0_0_30px_rgba(var(--accent-rgb),0.3)] active:scale-95 transition-all duration-300 hover:scale-110 hover:-translate-y-0.5 relative border border-white/20 z-10 btn-pulse-ring group-hover:shadow-[0_0_40px_rgba(var(--accent-rgb),0.5)]"
                            style={{ '--accent-rgb': accent.startsWith('#') ? hexToRgb(accent) : '190,242,100' }}
                            title="Nueva Nota Libre"
                        >
                            <Edit3 size={18} className="md:size-[22px] hover-float-icon" />
                        </button>
                    </div>

                    <button
                        onClick={(e) => { e.stopPropagation(); setIsChatOpen(prev => !prev); }}
                        className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg border group ${isChatOpen ? 'bg-accent text-black border-accent shadow-[0_0_20px_rgba(var(--accent-rgb),0.4)] scale-110 -translate-y-0.5' : 'bg-[#18181b] border-white/5 text-zinc-400 hover:text-white hover:bg-[#2a2a2e] hover:border-white/30 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:-translate-y-0.5 hover:scale-110'}`}
                        title="Nueva Conversación IA"
                    >
                        <MessageCircle size={16} className="md:size-[20px] hover-float-icon transition-colors" />
                    </button>

                    <button
                        onClick={(e) => { e.stopPropagation(); setActiveNotebook('diary'); }}
                        className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#18181b] border border-white/5 text-amber-500 flex items-center justify-center shadow-lg transition-all duration-300 group hover:bg-amber-500/10 hover:border-amber-500/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:text-amber-400 hover:-translate-y-0.5 hover:scale-110"
                        title="Libreta de Diario"
                    >
                        <StickyNote size={14} className="md:size-[18px] hover-float-icon" />
                    </button>

                    <button
                        onClick={(e) => { e.stopPropagation(); setActiveNotebook('resonance'); }}
                        className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#18181b] border border-white/5 text-purple-400 flex items-center justify-center shadow-lg transition-all duration-300 group hover:bg-purple-500/10 hover:border-purple-500/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:text-purple-300 hover:-translate-y-0.5 hover:scale-110"
                        title="Análisis de Ruido"
                    >
                        <Sparkles size={14} className="md:size-[18px] hover-float-icon" />
                    </button>

                    <button
                        onClick={(e) => { e.stopPropagation(); setView('soul'); }}
                        className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#18181b] border border-white/5 text-zinc-400 flex items-center justify-center shadow-lg transition-all duration-300 group hover:text-white hover:bg-[#2a2a2e] hover:border-white/30 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:-translate-y-0.5 hover:scale-110"
                        title="Archivo del Alma"
                    >
                        <Aperture size={16} className="md:size-[20px] hover-float-icon" />
                    </button>

                    <button
                        onClick={(e) => { e.stopPropagation(); setView('profile'); }}
                        className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#18181b] border border-white/5 text-zinc-400 flex items-center justify-center shadow-lg transition-all duration-300 group hover:text-white hover:bg-[#2a2a2e] hover:border-white/30 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:-translate-y-0.5 hover:scale-110"
                        title="Perfil"
                    >
                        <User size={16} className="md:size-[20px] hover-float-icon" />
                    </button>
                </div>
            )}

            {activeNotebook === 'diary' && (
                <DiaryNotebook
                    onClose={() => setActiveNotebook(null)}
                    onFocusNode={(x, y) => { setCam({ x: -x * 0.8, y: -y * 0.8, scale: 0.8 }); setActiveNotebook(null); }}
                    blocks={blocks}
                    setBlocks={(newBlocks) => { setBlocks(newBlocks); syncBlocks(newBlocks); }}
                    accent={accent}
                />
            )}

            {activeNotebook === 'resonance' && (
                <ResonanceNotebook
                    onClose={() => setActiveNotebook(null)}
                    onFocusNode={(x, y) => { setCam({ x: -x * 0.8, y: -y * 0.8, scale: 0.8 }); setActiveNotebook(null); }}
                    blocks={blocks}
                    setBlocks={(newBlocks) => { setBlocks(newBlocks); syncBlocks(newBlocks); }}
                    accent={accent}
                />
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
                    onForceSave={() => saveCurrentChat()}
                    avatar={avatar}
                    formatUrl={formatUrl}
                    onPublishConversation={handlePublishConversation}
                />
            )}
            {zoomedImage && (
                <div
                    onClick={() => setZoomedImage(null)}
                    className="fixed inset-0 z-[9999] bg-[#070708]/95 backdrop-blur-xl flex items-center justify-center p-4 cursor-zoom-out animate-fadeIn"
                >
                    <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center justify-center select-none" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setZoomedImage(null)}
                            className="absolute top-[-50px] right-0 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-all duration-200 border border-white/5"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <img
                            src={zoomedImage}
                            alt="Estímulo ampliado"
                            className="max-w-full max-h-[80vh] object-contain rounded-2xl border border-white/5 shadow-2xl transition-transform duration-300"
                            style={{ filter: 'invert(1)' }}
                        />

                        <div className="mt-4 text-white/30 text-[10px] font-mono tracking-widest uppercase">
                            Haz clic fuera o presiona la cruz para cerrar
                        </div>
                    </div>
                </div>
            )}

            {isRecording && webcamStream && (
                <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-[1000] w-28 h-20 sm:w-40 sm:h-30 bg-[#0c0c0d] border border-white/10 rounded-xl sm:rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
                    <video
                        ref={(el) => {
                            if (el && webcamStream) {
                                el.srcObject = webcamStream;
                            }
                        }}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover scale-x-[-1]"
                    />
                    <div className="absolute top-1.5 left-1.5 flex items-center gap-1 px-1 py-0.5 rounded bg-red-500 text-[6px] sm:text-[8px] font-mono font-bold text-white uppercase tracking-wider animate-pulse">
                        <span className="w-1 h-1 rounded-full bg-white" /> REC CLÍNICO
                    </div>
                </div>
            )}

            {isPasswordModalOpen && (
                <div className="fixed inset-0 z-[700] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-sm bg-[#0c0c0d] border border-white/10 rounded-[2.5rem] shadow-2xl p-8 space-y-6">
                        <div className="text-center space-y-2">
                            <span className="text-[8px] font-black uppercase tracking-[0.4em] text-red-500">Acceso Restringido</span>
                            <h4 className="text-xl font-black italic text-white tracking-tight">Verificación Clínica</h4>
                            <p className="text-[10px] text-zinc-500 font-sans">Introduce la contraseña de acceso al panel de observaciones y diagnóstico.</p>
                        </div>

                        <div className="space-y-4">
                            <input
                                type="password"
                                value={passwordInput}
                                onChange={(e) => {
                                    setPasswordInput(e.target.value);
                                    setPasswordError(false);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleVerifyClinicalPassword();
                                }}
                                placeholder="CONTRASEÑA MÁSTER"
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-center text-xs font-mono tracking-[0.2em] text-white focus:border-red-500/50 outline-none transition-all placeholder:text-zinc-700"
                            />

                            {passwordError && (
                                <p className="text-red-500 text-[9px] text-center font-bold uppercase tracking-wider animate-pulse">
                                    Contraseña inválida o rechazada
                                </p>
                            )}

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <button
                                    onClick={() => setIsPasswordModalOpen(false)}
                                    className="py-3 rounded-xl bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:bg-white/10 hover:text-white transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleVerifyClinicalPassword}
                                    className="py-3 rounded-xl bg-red-500 text-black text-[9px] font-black uppercase tracking-widest hover:bg-red-600 transition-all"
                                >
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}



            {/* COMPOSER */}
            {isComposerOpen && (
                <div className={`fixed inset-0 z-[500] flex flex-col animate-in fade-in duration-300 ${composerStep === 'note' ? 'bg-[#0a0a0b]' : 'bg-black/80 backdrop-blur-3xl'}`}>

                    {/* TOP FLOATING TOOLBAR */}
                    {composerStep === 'note' && (
                        <div className="fixed top-6 md:top-8 left-1/2 -translate-x-1/2 z-[100] flex items-center justify-between gap-1.5 md:gap-4 p-1 md:p-2 bg-[#121214]/90 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,1)] animate-in slide-in-from-top-5 duration-700 w-max max-w-[95%]">
                            <div className="flex items-center gap-1">
                                {/* PRIMARY CANCEL */}
                                <button onClick={() => setIsComposerOpen(false)} className="w-9 h-9 md:w-12 md:h-12 rounded-full hover:bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-all group" title="Cerrar (ESC)">
                                    <X size={16} className="md:size-[18px] group-hover:rotate-90 transition-transform duration-300" />
                                </button>

                                {editingId && (
                                    <button onClick={() => {
                                        deleteBlock(editingId);
                                        setIsComposerOpen(false);
                                    }} className="w-9 h-9 md:w-12 md:h-12 rounded-full hover:bg-red-500/10 flex items-center justify-center text-zinc-500 hover:text-red-500 transition-all group" title="Eliminar Nota/Subpágina">
                                        <Trash2 size={14} className="md:size-[16px] group-hover:scale-110 transition-transform duration-300" />
                                    </button>
                                )}

                                <div className="w-px h-6 bg-white/10 mx-1 hidden md:block" />

                                {/* ATTACHMENTS / TOOLS */}
                                <input type="file" ref={inlineMediaInputRef} className="hidden" onChange={handleInlineMedia} accept="image/*,video/*,audio/*" />
                                <button onClick={() => inlineMediaInputRef.current.click()} className="w-9 h-9 md:w-10 md:h-10 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-all" title="Adjuntar Archivo">
                                    <Paperclip size={14} className="md:size-[16px]" />
                                </button>
                                <button
                                    onClick={() => {
                                        const title = prompt("Título de la subpágina:");
                                        if (title !== null) {
                                            handleAddAttribute(title);
                                        }
                                    }}
                                    className="w-9 h-9 md:w-10 md:h-10 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-all"
                                    title="Añadir Subpágina"
                                >
                                    <StickyNote size={14} className="md:size-[16px]" />
                                </button>

                                {(() => {
                                    const hasMuralData = editingId ? (blocks.find(b => b.id === editingId)?.muralBlocks?.length > 0) : (tempMuralBlocks?.length > 0);
                                    return (
                                        <button
                                            onClick={() => launchMural()}
                                            className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all relative ${hasMuralData ? 'bg-accent text-black hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(var(--accent-rgb),0.4)]' : 'bg-accent/10 hover:bg-accent/20 text-accent'}`}
                                            title="Abrir Mural Studio"
                                            style={hasMuralData ? { '--accent-rgb': hexToRgb(accent) } : {}}
                                        >
                                            <PanelLeft size={14} className="md:size-[16px]" />
                                            {hasMuralData && (
                                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-black animate-pulse" />
                                            )}
                                        </button>
                                    );
                                })()}
                            </div>

                            <div className="flex items-center gap-1.5 md:gap-2">
                                {/* VOICE TO TEXT ACTION */}
                                <button
                                    onClick={toggleNoteRecording}
                                    className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all shadow-xl shrink-0 ${isRecordingNote ? 'bg-red-500 text-white animate-pulse' : 'bg-white/5 text-zinc-500 hover:text-white hover:bg-white/10'}`}
                                    title="Dictar por Voz"
                                >
                                    <Mic size={14} className="md:size-[16px]" />
                                </button>
                                {/* DRAFT / SAVE ACTION */}
                                <button
                                    onClick={() => launchMedia(false)}
                                    disabled={isResonanceMode ? !resResonance : (!caption && !noteText && !(editingId ? (blocks.find(b => b.id === editingId)?.muralBlocks?.length > 0) : (tempMuralBlocks?.length > 0)))}
                                    className={`w-9 h-9 md:w-auto md:h-12 md:px-6 rounded-full flex items-center justify-center gap-2 transition-all font-black uppercase tracking-[0.2em] text-[10px] shrink-0 ${(isResonanceMode ? !resResonance : (!caption && !noteText && !(editingId ? (blocks.find(b => b.id === editingId)?.muralBlocks?.length > 0) : (tempMuralBlocks?.length > 0)))) ? 'bg-white/5 text-zinc-600 cursor-not-allowed' : 'bg-white/10 text-white hover:bg-white/20 hover:scale-105 active:scale-95'}`}
                                    title="Guardar Nota"
                                >
                                    <Save size={14} className="md:size-[16px]" />
                                    <span className="hidden md:inline">Guardar Nota</span>
                                </button>

                                {/* PUBLISH ACTION */}
                                <button
                                    onClick={() => launchMedia(true)}
                                    disabled={isResonanceMode ? !resResonance : (!caption || !noteText)}
                                    className={`w-9 h-9 md:w-auto md:h-12 md:px-8 rounded-full flex items-center justify-center gap-3 transition-all font-black uppercase tracking-[0.2em] text-[10px] shrink-0 ${(isResonanceMode ? !resResonance : (!caption || !noteText)) ? 'bg-white/5 text-zinc-600 cursor-not-allowed' : 'bg-accent text-black hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(var(--accent-rgb),0.3)]'}`}
                                    style={(isResonanceMode ? !resResonance : (!caption || !noteText)) ? {} : { '--accent-rgb': hexToRgb(accent) }}
                                    title="Publicar"
                                >
                                    <Send size={14} className="md:size-[16px]" />
                                    <span className="hidden md:inline">Publicar</span>
                                </button>
                            </div>
                        </div>
                    )}


                    <div className={`flex-1 overflow-y-auto no-scrollbar ${composerStep === 'note' ? 'w-full max-w-6xl mx-auto px-8 md:px-0 pt-32 pb-32 md:pt-40 md:pb-48' : 'flex items-center justify-center p-4'}`}>
                        {composerStep === 'note' ? (
                            <div className="space-y-4 animate-in slide-in-from-bottom-10 duration-1000 relative">

                                {(() => {
                                    const currentBlock = blocks.find(b => b.id === editingId);
                                    const parentBlock = currentBlock?.metadata?.parentId ? blocks.find(b => b.id === currentBlock.metadata.parentId) : null;
                                    if (!parentBlock) return null;
                                    return (
                                        <button
                                            onClick={() => editBlock(parentBlock)}
                                            className="flex items-center gap-2 mb-4 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-white/10 transition-all self-start animate-in fade-in slide-in-from-left-5 duration-300"
                                        >
                                            <ArrowLeft size={12} />
                                            <span>Volver a: {parentBlock.caption || 'Nota Principal'}</span>
                                        </button>
                                    );
                                })()}

                                <div className="max-w-5xl mx-auto w-full flex flex-col gap-8 pb-32">
                                    <div className="space-y-4 w-full">

                                        <div className="flex items-end gap-6 mb-4 md:mb-8">
                                            <div className="flex-1">
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

                                        {!isDiaryMode && (() => {
                                            const childNotes = editingId ? blocks.filter(b => b.metadata?.parentId === editingId) : [];
                                            if (childNotes.length === 0) return null;
                                            return (
                                                <div className="w-full flex items-center flex-wrap gap-2 pb-6 border-b border-white/5 mb-6 animate-in fade-in duration-300">
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent mr-2 flex items-center gap-1" style={{ color: accent }}>
                                                        <FileText size={12} />
                                                        Subpáginas:
                                                    </span>

                                                    {childNotes.map((child, idx) => (
                                                        <div key={child.id} className="group flex items-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-full pl-3 pr-1 py-1 transition-all animate-in zoom-in-95 duration-200">
                                                            <span
                                                                onClick={() => editBlock(child)}
                                                                className="text-[10px] font-bold text-white cursor-pointer mr-2 truncate max-w-[120px] hover:text-accent transition-colors"
                                                            >
                                                                {child.caption || `Subpágina ${idx + 1}`}
                                                            </span>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleDeleteAttribute(child.id); }}
                                                                className="w-5 h-5 rounded-full hover:bg-red-500/20 text-zinc-500 hover:text-red-500 flex items-center justify-center transition-all"
                                                            >
                                                                <X size={10} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        })()}

                                        {(() => {
                                            const currentMuralBlocks = editingId ? (blocks.find(b => b.id === editingId)?.muralBlocks || []) : tempMuralBlocks;
                                            if (!currentMuralBlocks || currentMuralBlocks.length === 0) return null;
                                            return (
                                                <div className="mb-8 p-6 rounded-[2.5rem] bg-white/5 border border-white/5 max-w-3xl w-full animate-in fade-in duration-500 shadow-2xl relative overflow-hidden group/mural-comp">
                                                    <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 blur-2xl rounded-full" />
                                                    <div className="flex items-center gap-2 mb-3 relative z-10">
                                                        <Grid size={12} className="text-accent animate-pulse" style={{ color: accent }} />
                                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-accent" style={{ color: accent }}>Pizarrón Adjunto ({currentMuralBlocks.length} Capas)</span>
                                                    </div>
                                                    <MiniMuralPreview
                                                        muralBlocks={currentMuralBlocks}
                                                        accent={accent}
                                                        onClick={() => launchMural(editingId)}
                                                        size="lg"
                                                    />
                                                </div>
                                            );
                                        })()}

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
                                                            className="w-full bg-transparent border-none focus:ring-0 p-0 text-2xl md:text-3xl font-serif italic text-white/95 placeholder:text-zinc-800 resize-none min-h-[150px] typing-aura pb-6"
                                                        />
                                                        {isRecordingNote && (
                                                            <div className="absolute bottom-4 right-8 flex items-center gap-2 pointer-events-none select-none">
                                                                <span className="text-[8px] font-black uppercase tracking-[0.3em] text-red-500 animate-pulse">Escuchando...</span>
                                                                <div className="flex items-center gap-0.5 h-3">
                                                                    <span className="w-0.5 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0s', animationDuration: '0.6s' }} />
                                                                    <span className="w-0.5 h-3 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s', animationDuration: '0.5s' }} />
                                                                    <span className="w-0.5 h-1.5 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s', animationDuration: '0.7s' }} />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : isResonanceMode ? (
                                                /* RESONANCE STRUCTURED MODE */
                                                <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 animate-in slide-in-from-bottom-10 duration-1000 ${focusedResonanceField ? 'md:grid-cols-1' : ''}`}>
                                                    {/* RESONANCIA CARD */}
                                                    {(!focusedResonanceField || focusedResonanceField === 'resonance') && (
                                                        <div className={`flex flex-col gap-3 p-6 bg-white/5 backdrop-blur-3xl rounded-[2rem] border border-white/10 hover:border-accent/30 transition-all group shadow-2xl relative overflow-hidden ${focusedResonanceField === 'resonance' ? 'md:col-span-1 min-h-[60vh] border-accent/50' : ''}`}>
                                                            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-3xl rounded-full -translate-x-1/2 -translate-y-1/2 group-hover:bg-accent/10 transition-colors" />
                                                            <div className="flex items-center gap-3 mb-1">
                                                                <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                                                                    <Radio size={16} className={focusedResonanceField === 'resonance' ? 'animate-pulse' : 'animate-spin-slow'} />
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[11px] md:text-[13px] font-black italic text-accent leading-tight uppercase tracking-tight">¿Qué resuena hoy en ti?</span>
                                                                    <span className="text-[6px] font-bold text-zinc-500 uppercase tracking-[0.4em] opacity-80">Resonancia Primal</span>
                                                                </div>
                                                            </div>
                                                            <textarea
                                                                value={resResonance}
                                                                onChange={e => setResResonance(e.target.value)}
                                                                onFocus={() => setFocusedResonanceField('resonance')}
                                                                placeholder="Describe la vibración actual..."
                                                                className={`w-full bg-transparent border-none focus:ring-0 p-0 font-serif italic text-white/90 placeholder:text-zinc-600 resize-none typing-aura custom-scroll ${focusedResonanceField === 'resonance' ? 'text-2xl md:text-3xl flex-1' : 'text-lg md:text-xl min-h-[80px]'}`}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Tab') {
                                                                        e.preventDefault();
                                                                        const textareas = document.querySelectorAll('.typing-aura');
                                                                        const idx = Array.from(textareas).indexOf(e.target);
                                                                        textareas[idx + 1]?.focus();
                                                                    }
                                                                }}
                                                            />
                                                            {focusedResonanceField === 'resonance' && (
                                                                <div className="flex justify-end mt-4">
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); setFocusedResonanceField(null); }}
                                                                        className="px-6 py-3 rounded-full bg-accent text-black font-black uppercase tracking-[0.2em] text-[10px] hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(var(--accent-rgb),0.3)] flex items-center gap-2"
                                                                    ><Check size={14} /> Guardar Resonancia</button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* IMPACT CARD */}
                                                    {(!focusedResonanceField || focusedResonanceField === 'impact') && (
                                                        <div className={`flex flex-col gap-3 p-6 bg-white/5 backdrop-blur-3xl rounded-[2rem] border border-white/10 hover:border-rose-400/30 transition-all group shadow-2xl relative overflow-hidden ${focusedResonanceField === 'impact' ? 'md:col-span-1 min-h-[60vh] border-rose-400/50' : ''}`}>
                                                            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-400/5 blur-3xl rounded-full -translate-x-1/2 -translate-y-1/2 group-hover:bg-rose-400/10 transition-colors" />
                                                            <div className="flex items-center gap-3 mb-1">
                                                                <div className="w-8 h-8 rounded-xl bg-rose-400/10 flex items-center justify-center text-rose-400">
                                                                    <Zap size={16} className={focusedResonanceField === 'impact' ? 'animate-pulse' : ''} />
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[11px] md:text-[13px] font-black italic text-rose-400 leading-tight uppercase tracking-tight">¿Qué impacto genera esto?</span>
                                                                    <span className="text-[6px] font-bold text-zinc-500 uppercase tracking-[0.4em] opacity-80">Impacto Profundo</span>
                                                                </div>
                                                            </div>
                                                            <textarea
                                                                value={resImpact}
                                                                onChange={e => setResImpact(e.target.value)}
                                                                onFocus={() => setFocusedResonanceField('impact')}
                                                                placeholder="Define la magnitud de la onda..."
                                                                className={`w-full bg-transparent border-none focus:ring-0 p-0 font-serif italic text-white/90 placeholder:text-zinc-600 resize-none typing-aura custom-scroll ${focusedResonanceField === 'impact' ? 'text-2xl md:text-3xl flex-1' : 'text-lg md:text-xl min-h-[80px]'}`}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Tab') {
                                                                        e.preventDefault();
                                                                        const textareas = document.querySelectorAll('.typing-aura');
                                                                        const idx = Array.from(textareas).indexOf(e.target);
                                                                        textareas[idx + 1]?.focus();
                                                                    }
                                                                }}
                                                            />
                                                            {focusedResonanceField === 'impact' && (
                                                                <div className="flex justify-end mt-4">
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); setFocusedResonanceField(null); }}
                                                                        className="px-6 py-3 rounded-full bg-rose-500 text-white font-black uppercase tracking-[0.2em] text-[10px] hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(244,63,94,0.3)] flex items-center gap-2"
                                                                    ><Check size={14} /> Guardar Impacto</button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* STRANGE CARD */}
                                                    {(!focusedResonanceField || focusedResonanceField === 'strange') && (
                                                        <div className={`flex flex-col gap-3 p-6 bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 hover:border-cyan-400/30 transition-all group shadow-2xl relative overflow-hidden ${focusedResonanceField === 'strange' ? 'md:col-span-1 min-h-[60vh] border-cyan-400/50' : 'md:col-span-2'}`}>
                                                            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-400/5 blur-[100px] rounded-full -translate-x-1/4 -translate-y-1/2 group-hover:bg-cyan-400/10 transition-colors" />
                                                            <div className="flex items-center gap-3 mb-1">
                                                                <div className="w-8 h-8 rounded-xl bg-cyan-400/10 flex items-center justify-center text-cyan-400">
                                                                    <Focus size={16} className={focusedResonanceField === 'strange' ? 'animate-pulse' : ''} />
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[11px] md:text-[13px] font-black italic text-cyan-400 leading-tight uppercase tracking-tight">¿Qué es lo extraño de este proceso?</span>
                                                                    <span className="text-[6px] font-bold text-zinc-500 uppercase tracking-[0.4em] opacity-80">Atipicidad / Rareza</span>
                                                                </div>
                                                            </div>
                                                            <textarea
                                                                value={resStrange}
                                                                onChange={e => setResStrange(e.target.value)}
                                                                onFocus={() => setFocusedResonanceField('strange')}
                                                                placeholder="Capta la anomalía en el sistema..."
                                                                className={`w-full bg-transparent border-none focus:ring-0 p-0 font-black italic text-white/95 placeholder:text-zinc-600 resize-none typing-aura tracking-tight custom-scroll ${focusedResonanceField === 'strange' ? 'text-3xl md:text-5xl flex-1' : 'text-xl md:text-2xl min-h-[80px]'}`}
                                                            />
                                                            {focusedResonanceField === 'strange' && (
                                                                <div className="flex justify-end mt-4">
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); setFocusedResonanceField(null); }}
                                                                        className="px-6 py-3 rounded-full bg-cyan-500 text-black font-black uppercase tracking-[0.2em] text-[10px] hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center gap-2"
                                                                    ><Check size={14} /> Guardar Anomalía</button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
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
                                                            </div>

                                                            {/* EDITABLE LINE */}
                                                            <textarea
                                                                ref={idx === 0 ? firstLineRef : null}
                                                                onContextMenu={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    setActiveMenu({ idx, type: 'actions' });
                                                                }}
                                                                onTouchStart={(e) => {
                                                                    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
                                                                    longPressTimerRef.current = setTimeout(() => {
                                                                        setActiveMenu({ idx, type: 'actions' });
                                                                    }, 600);
                                                                }}
                                                                onTouchEnd={() => {
                                                                    if (longPressTimerRef.current) {
                                                                        clearTimeout(longPressTimerRef.current);
                                                                        longPressTimerRef.current = null;
                                                                    }
                                                                }}
                                                                onTouchMove={() => {
                                                                    if (longPressTimerRef.current) {
                                                                        clearTimeout(longPressTimerRef.current);
                                                                        longPressTimerRef.current = null;
                                                                    }
                                                                }}
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
                                        {/* ELIMINADO EL TOOLBAR INLINE AQUI - MOVIDO ARRIBA */}
                                    </div> {/* Close editor div */}

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
            {/* MURAL WORKSPACE PORTAL */}
            {isMuralMode && createPortal(
                <MuralWorkspace
                    blocks={muralBlocks}
                    onSave={(updatedBlocks) => handleSaveMural(updatedBlocks)}
                    onClose={() => setIsMuralMode(false)}
                    accent={accent}
                    bgType={bgType}
                    bgValue={bgValue}
                    isTiled={isTiled}
                />,
                document.body
            )}
        </div>
    );
}

// ==========================================
// --- MURAL WORKSPACE (EDITORIAL STUDIO) ---
// ==========================================

const MuralText = ({ block, updateBlock, isSelected, bringToFront, accent }) => {
    const ref = useRef(null);

    // Synchronize content changes from the outside (like properties menu updates)
    // only when different, avoiding React caret/cursor jumps during live typing.
    useEffect(() => {
        if (ref.current && ref.current.innerText !== block.content) {
            ref.current.innerText = block.content;
        }
    }, [block.content]);

    const getFilterStyle = (filter) => {
        switch (filter) {
            case 'grayscale': return 'grayscale(100%)';
            case 'sepia': return 'sepia(100%)';
            case 'invert': return 'invert(100%)';
            case 'blur': return 'blur(5px)';
            case 'brightness-sat': return 'brightness(1.2) saturate(1.5)';
            case 'warm': return 'sepia(30%) saturate(140%) hue-rotate(-10deg)';
            case 'cool': return 'saturate(120%) hue-rotate(10deg) brightness(0.95)';
            default: return 'none';
        }
    };

    return (
        <div
            ref={ref}
            contentEditable={true}
            suppressContentEditableWarning={true}
            onInput={(e) => {
                updateBlock(block.id, { content: e.currentTarget.innerText });
            }}
            onBlur={(e) => {
                updateBlock(block.id, { content: e.currentTarget.innerText });
            }}
            onFocus={() => bringToFront(block.id)}
            className={`w-full h-full bg-transparent border-none outline-none p-2 text-center flex items-center justify-center overflow-visible break-words whitespace-pre-wrap empty:before:content-[attr(placeholder)] empty:before:text-zinc-500/40 empty:before:pointer-events-none ${block.isTitle ? 'font-black tracking-tight leading-[0.95] uppercase select-text' : 'font-sans select-text'
                }`}
            style={{
                color: block.color || '#fff',
                fontSize: `${block.fontSize || (block.isTitle ? 48 : 16)}px`,
                fontWeight: block.fontWeight || (block.isTitle ? '900' : 'normal'),
                textTransform: block.textTransform || 'none',
                textShadow: block.isTitle ? `0 0 30px ${block.color}44` : 'none',
                fontFamily: block.isTitle ? '"Outfit", "Inter", sans-serif' : 'inherit',
                filter: getFilterStyle(block.filter),
                borderRadius: `${block.borderRadius !== undefined ? block.borderRadius : 24}px`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'visible',
                minHeight: '100%'
            }}
            onMouseDown={(e) => e.stopPropagation()} // Prevent canvas drag while typing
            onTouchStart={(e) => e.stopPropagation()} // Prevent mobile pan while typing
            placeholder={block.isTitle ? "TITULAR..." : "Escribe aquí..."}
        />
    );
};
function MuralWorkspace({ blocks: initialBlocks, onSave, onClose, accent, bgType, bgValue, isTiled }) {
    const [blocks, setBlocks] = useState(initialBlocks || []);
    const [selectedId, setSelectedId] = useState(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const fileInputRef = useRef(null);
    const containerRef = useRef(null);
    const [openSections, setOpenSections] = useState({
        transform: true,
        style: true,
        borders: true,
        layers: true
    });
    const [activeTool, setActiveTool] = useState(null);
    const touchStartDistRef = useRef(null);
    const touchStartZoomRef = useRef(1);
    const touchStartPanRef = useRef({ x: 0, y: 0 });
    const touchStartMidRef = useRef({ x: 0, y: 0 });

    const hasCenteredRef = useRef(false);
    const animationFrameRef = useRef(null);

    const animatePan = (targetX, targetY) => {
        const startX = pan.x;
        const startY = pan.y;
        const duration = 1200; // 1.2s smooth fluid animation
        const startTime = performance.now();

        const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

        const animate = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = easeOutCubic(progress);

            setPan({
                x: startX + (targetX - startX) * easeProgress,
                y: startY + (targetY - startY) * easeProgress
            });

            if (progress < 1) {
                animationFrameRef.current = requestAnimationFrame(animate);
            }
        };

        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = requestAnimationFrame(animate);
    };

    const stopPanAnimation = () => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
    };

    useEffect(() => {
        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, []);

    useEffect(() => {
        setBlocks(initialBlocks || []);
        hasCenteredRef.current = false;
    }, [initialBlocks]);

    useEffect(() => {
        if (hasCenteredRef.current) return;

        if (initialBlocks && initialBlocks.length > 0 && (!blocks || blocks.length === 0)) {
            return;
        }

        hasCenteredRef.current = true;

        if (!blocks || blocks.length === 0) {
            const targetX = window.innerWidth / 2 - 125;
            const targetY = window.innerHeight / 2 - 100;
            animatePan(targetX, targetY);
            return;
        }

        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;

        blocks.forEach(b => {
            const bx = b.x !== undefined ? b.x : 0;
            const by = b.y !== undefined ? b.y : 0;
            const bw = b.w !== undefined ? b.w : 250;
            const bh = b.h !== undefined ? b.h : 200;
            if (bx < minX) minX = bx;
            if (bx + bw > maxX) maxX = bx + bw;
            if (by < minY) minY = by;
            if (by + bh > maxY) maxY = by + bh;
        });

        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        const targetX = (window.innerWidth / 2) - centerX;
        const targetY = (window.innerHeight / 2) - centerY;

        animatePan(targetX, targetY);
    }, [blocks, initialBlocks]);

    const renderShapeSVG = (shapeType, color) => {
        const svgColor = color || accent;
        switch (shapeType) {
            case 'rect':
                return <rect width="100" height="100" rx="8" fill={svgColor} />;
            case 'circle':
                return <circle cx="50" cy="50" r="50" fill={svgColor} />;
            case 'triangle':
                return <polygon points="50,0 100,100 0,100" fill={svgColor} />;
            case 'pill':
                return <rect width="100" height="100" rx="50" fill={svgColor} />;
            case 'arrow':
                return <polygon points="0,35 65,35 65,15 100,50 65,85 65,65 0,65" fill={svgColor} />;
            case 'star':
                return <polygon points="50,0 63,38 100,38 69,59 82,95 50,75 18,95 31,59 0,38 37,38" fill={svgColor} />;
            case 'bubble':
                return <path d="M10,10 L90,10 L90,65 L45,65 L20,90 L20,65 L10,65 Z" fill={svgColor} />;
            case 'heart':
                return <path d="M12,30 C12,15 30,10 50,30 C70,10 88,15 88,30 C88,58 50,90 50,90 C50,90 12,58 12,30 Z" fill={svgColor} />;
            default:
                return <rect width="100" height="100" rx="8" fill={svgColor} />;
        }
    };

    const getFilterStyle = (filter) => {
        switch (filter) {
            case 'grayscale': return 'grayscale(100%)';
            case 'sepia': return 'sepia(100%)';
            case 'invert': return 'invert(100%)';
            case 'blur': return 'blur(5px)';
            case 'brightness-sat': return 'brightness(1.2) saturate(1.5)';
            case 'warm': return 'sepia(30%) saturate(140%) hue-rotate(-10deg)';
            case 'cool': return 'saturate(120%) hue-rotate(10deg) brightness(0.95)';
            default: return 'none';
        }
    };

    const getShadowStyle = (shadowType, color) => {
        switch (shadowType) {
            case 'soft':
                return '0 20px 40px rgba(0,0,0,0.5)';
            case 'glow':
                return `0 0 35px ${color || '#ffffff'}88`;
            case 'neon':
                return `0 0 50px ${color || accent}aa, inset 0 0 20px ${color || accent}44`;
            default:
                return 'none';
        }
    };

    const triggerImageReplace = (blockId) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    updateBlock(blockId, { content: ev.target.result });
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    };

    const syncBlocks = (updated) => {
        setBlocks(updated);
    };

    // DRAG & DROP FOR CANVAS UPLOAD
    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            const file = files[0];
            const reader = new FileReader();
            reader.onload = (ev) => {
                const rect = containerRef.current.getBoundingClientRect();
                const x = (e.clientX - rect.left - pan.x) / zoom - 150;
                const y = (e.clientY - rect.top - pan.y) / zoom - 150;
                const newBlock = {
                    id: `mural-img-${Date.now()}`,
                    type: 'image',
                    content: ev.target.result,
                    x: x,
                    y: y,
                    w: 300,
                    h: 300,
                    rotation: 0,
                    mask: 'none',
                    zoom: 1
                };
                syncBlocks([...blocks, newBlock]);
            };
            reader.readAsDataURL(file);
        }
    };

    // BLOCK ACTIONS
    const addShape = (shapeType) => {
        const rect = containerRef.current.getBoundingClientRect();
        const x = (-pan.x + rect.width / 2) / zoom - 100;
        const y = (-pan.y + rect.height / 2) / zoom - 100;
        const newBlock = {
            id: `mural-shape-${Date.now()}`,
            type: 'shape',
            shapeType: shapeType, // 'rect' | 'circle' | 'triangle' | 'pill'
            x: x,
            y: y,
            w: 200,
            h: 200,
            color: accent,
            rotation: 0
        };
        syncBlocks([...blocks, newBlock]);
    };

    const addText = () => {
        const rect = containerRef.current.getBoundingClientRect();
        const x = (-pan.x + rect.width / 2) / zoom - 150;
        const y = (-pan.y + rect.height / 2) / zoom - 50;
        const newBlock = {
            id: `mural-text-${Date.now()}`,
            type: 'text',
            content: 'Escribe tu idea aquí...',
            x: x,
            y: y,
            w: 300,
            h: 100,
            color: '#ffffff',
            rotation: 0,
            fontSize: 16,
            fontWeight: 'normal',
            textTransform: 'none'
        };
        syncBlocks([...blocks, newBlock]);
    };

    const addTitle = () => {
        const rect = containerRef.current.getBoundingClientRect();
        const x = (-pan.x + rect.width / 2) / zoom - 250;
        const y = (-pan.y + rect.height / 2) / zoom - 75;
        const newBlock = {
            id: `mural-title-${Date.now()}`,
            type: 'text',
            content: 'TITULAR PRINCIPAL',
            x: x,
            y: y,
            w: 500,
            h: 150,
            color: accent,
            rotation: 0,
            fontSize: 64,
            fontWeight: '900',
            textTransform: 'uppercase'
        };
        syncBlocks([...blocks, newBlock]);
    };

    const addImage = () => {
        fileInputRef.current.click();
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        const file = files[0];
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => {
                const rect = containerRef.current.getBoundingClientRect();
                const maxDim = 400;
                let w = img.width;
                let h = img.height;

                if (w > h) {
                    if (w > maxDim) {
                        h = Math.round((h * maxDim) / w);
                        w = maxDim;
                    }
                } else {
                    if (h > maxDim) {
                        w = Math.round((w * maxDim) / h);
                        h = maxDim;
                    }
                }

                const x = (-pan.x + rect.width / 2) / zoom - w / 2;
                const y = (-pan.y + rect.height / 2) / zoom - h / 2;
                const newBlock = {
                    id: `mural-img-${Date.now()}`,
                    type: 'image',
                    content: ev.target.result,
                    x: x,
                    y: y,
                    w: w,
                    h: h,
                    rotation: 0,
                    mask: 'none',
                    zoom: 1
                };
                syncBlocks([...blocks, newBlock]);
            };
            img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    };

    const updateBlock = (id, updates) => {
        syncBlocks(blocks.map(b => b.id === id ? { ...b, ...updates } : b));
    };

    const deleteBlock = (id) => {
        syncBlocks(blocks.filter(b => b.id !== id));
        setSelectedId(null);
    };

    const bringToFront = (id) => {
        // Find the block and move it to the end of the array (rendered last -> on top)
        const target = blocks.find(b => b.id === id);
        if (!target) return;
        const filtered = blocks.filter(b => b.id !== id);
        syncBlocks([...filtered, target]);
        setSelectedId(id);
    };

    // PANNING THE CANVAS
    const handleMouseDown = (e) => {
        stopPanAnimation();
        if (e.target === containerRef.current || e.target.classList.contains('canvas-grid')) {
            setIsPanning(true);
            setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
            setSelectedId(null); // Click outside deselects and hides style drawer!
        }
    };

    const handleMouseMove = (e) => {
        if (isPanning) {
            setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
        }
    };

    const handleMouseUp = () => {
        setIsPanning(false);
    };

    const handleTouchStart = (e) => {
        stopPanAnimation();
        if (e.touches.length === 1 && (e.target === containerRef.current || e.target.classList.contains('canvas-grid'))) {
            const touch = e.touches[0];
            setIsPanning(true);
            setPanStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
            setSelectedId(null); // Tap outside deselects and hides style drawer!
        } else if (e.touches.length === 2) {
            e.preventDefault();
            setIsPanning(false); // Stop panning when starting zoom
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
            touchStartDistRef.current = dist;
            touchStartZoomRef.current = zoom;
            touchStartPanRef.current = { ...pan };
            touchStartMidRef.current = {
                x: (touch1.clientX + touch2.clientX) / 2,
                y: (touch1.clientY + touch2.clientY) / 2
            };
        }
    };

    const handleTouchMove = (e) => {
        if (isPanning && e.touches.length === 1) {
            const touch = e.touches[0];
            setPan({ x: touch.clientX - panStart.x, y: touch.clientY - panStart.y });
        } else if (e.touches.length === 2 && touchStartDistRef.current) {
            e.preventDefault();
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
            
            const factor = dist / touchStartDistRef.current;
            
            let newZoom;
            if (factor < 1) {
                // Zooming out: apply a dampening curve to make zoom out slower, smoother, and more controlled
                const dampedFactor = 1 - (1 - factor) * 0.4;
                newZoom = Math.max(0.15, Math.min(4, touchStartZoomRef.current * dampedFactor));
            } else {
                newZoom = Math.max(0.15, Math.min(4, touchStartZoomRef.current * factor));
            }

            const midX = (touch1.clientX + touch2.clientX) / 2;
            const midY = (touch1.clientY + touch2.clientY) / 2;

            const startMid = touchStartMidRef.current;
            const startPan = touchStartPanRef.current;
            const startZoom = touchStartZoomRef.current;

            const rect = containerRef.current.getBoundingClientRect();
            const mouseX = startMid.x - rect.left;
            const mouseY = startMid.y - rect.top;

            // Focus on the midpoint under the fingers: (mouseX - pan.x) / zoom should remain constant.
            const newPanX = mouseX - ((mouseX - startPan.x) / startZoom) * newZoom;
            const newPanY = mouseY - ((mouseY - startPan.y) / startZoom) * newZoom;

            // Allow dragging (panning) while zooming
            const dragX = midX - startMid.x;
            const dragY = midY - startMid.y;

            setZoom(newZoom);
            setPan({ x: newPanX + dragX, y: newPanY + dragY });
        }
    };

    const handleTouchEnd = () => {
        setIsPanning(false);
        touchStartDistRef.current = null;
    };

    // TRANSFORMING ELEMENT (DRAG & RESIZE)
    const startDrag = (e, block, type, handle = 'se') => {
        e.stopPropagation();
        bringToFront(block.id);
        const isTouch = e.type.startsWith('touch');
        const startX = isTouch ? e.touches[0].clientX : e.clientX;
        const startY = isTouch ? e.touches[0].clientY : e.clientY;
        const initialX = block.x;
        const initialY = block.y;
        const initialW = block.w;
        const initialH = block.h;
        const initialRot = block.rotation || 0;

        const onMouseMove = (ev) => {
            const clientX = ev.type.startsWith('touch') ? ev.touches[0].clientX : ev.clientX;
            const clientY = ev.type.startsWith('touch') ? ev.touches[0].clientY : ev.clientY;
            const dx = (clientX - startX) / zoom;
            const dy = (clientY - startY) / zoom;

            if (type === 'move') {
                updateBlock(block.id, { x: initialX + dx, y: initialY + dy });
            } else if (type === 'resize') {
                let newW = initialW;
                let newH = initialH;
                let newX = initialX;
                let newY = initialY;

                if (handle === 'e' || handle === 'se') {
                    newW = Math.max(20, initialW + dx);
                } else if (handle === 'w') {
                    newW = Math.max(20, initialW - dx);
                    newX = initialX + (initialW - newW);
                }

                if (handle === 's' || handle === 'se') {
                    newH = Math.max(20, initialH + dy);
                } else if (handle === 'n') {
                    newH = Math.max(20, initialH - dy);
                    newY = initialY + (initialH - newH);
                }

                updateBlock(block.id, { w: newW, h: newH, x: newX, y: newY });
            } else if (type === 'rotate') {
                const el = document.getElementById(`mural-block-${block.id}`);
                if (el) {
                    const rect = el.getBoundingClientRect();
                    const centerX = rect.left + rect.width / 2;
                    const centerY = rect.top + rect.height / 2;
                    const angle = Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
                    updateBlock(block.id, { rotation: angle + 90 }); // +90 because handle is at the top
                }
            }
        };

        const onMouseUp = () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            window.removeEventListener('touchmove', onMouseMove);
            window.removeEventListener('touchend', onMouseUp);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        window.addEventListener('touchmove', onMouseMove, { passive: false });
        window.addEventListener('touchend', onMouseUp);
    };

    // EDITORIAL MASKS CLIPPATHS
    const getMaskStyle = (maskType) => {
        switch (maskType) {
            case 'circle': return { clipPath: 'circle(50% at 50% 50%)' };
            case 'hexagon': return { clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' };
            case 'diamond': return { clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' };
            case 'arch': return { clipPath: 'polygon(0% 100%, 0% 30%, 15% 15%, 30% 5%, 50% 0%, 70% 5%, 85% 15%, 100% 30%, 100% 100%)' };
            case 'pill': return { clipPath: 'inset(0% round 9999px)' };
            default: return {};
        }
    };

    const selectedBlock = blocks.find(b => b.id === selectedId);

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 z-[2000] bg-black overflow-hidden select-none flex flex-col font-sans touch-action-none"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* AMBIENTE / AURA DE FONDO COMPARTIDA */}
            <div className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden select-none transition-all duration-1000">
                {bgType === 'color' && (
                    <div className="absolute inset-0 transition-all duration-1000" style={{ backgroundColor: bgValue }} />
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
            {/* INFINITE GRID BACKGROUND */}
            <div
                className="canvas-grid absolute inset-0 pointer-events-none opacity-5 transition-transform duration-75"
                style={{
                    backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                    backgroundSize: '30px 30px',
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: '0 0'
                }}
            />

            {/* TOP ACTIONS DOCK */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[2100] px-5 py-2.5 rounded-full bg-black/85 backdrop-blur-2xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex items-center gap-4 animate-in slide-in-from-top-10 duration-700 max-w-[95vw] w-auto shrink-0 select-none">
                {/* Logo Section */}
                <div className="hidden sm:flex items-center gap-2 border-r border-white/10 pr-4 shrink-0">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">MURAL</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" style={{ backgroundColor: accent }} />
                </div>

                {/* Main Tools Group (Icons only) */}
                <div className="flex items-center gap-1 shrink-0">
                    <button
                        onClick={addImage}
                        className="w-10 h-10 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-all flex items-center justify-center shrink-0"
                        title="Añadir Imagen (JPG/PNG)"
                    >
                        <ImageIcon size={16} />
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />

                    {/* SHAPE SELECTOR */}
                    <div className="relative group shrink-0">
                        <button
                            className="w-10 h-10 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-all flex items-center justify-center"
                            title="Añadir Forma"
                        >
                            <Zap size={16} />
                        </button>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 py-2 w-40 bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl hidden group-hover:block z-[2200]">
                            <button onClick={() => addShape('rect')} className="w-full px-4 py-2 hover:bg-white/5 text-left text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-white">Rectángulo</button>
                            <button onClick={() => addShape('circle')} className="w-full px-4 py-2 hover:bg-white/5 text-left text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-white">Círculo</button>
                            <button onClick={() => addShape('triangle')} className="w-full px-4 py-2 hover:bg-white/5 text-left text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-white">Triángulo</button>
                            <button onClick={() => addShape('pill')} className="w-full px-4 py-2 hover:bg-white/5 text-left text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-white">Píldora</button>
                            <button onClick={() => addShape('arrow')} className="w-full px-4 py-2 hover:bg-white/5 text-left text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-white">Flecha</button>
                            <button onClick={() => addShape('star')} className="w-full px-4 py-2 hover:bg-white/5 text-left text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-white">Estrella</button>
                            <button onClick={() => addShape('bubble')} className="w-full px-4 py-2 hover:bg-white/5 text-left text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-white">Burbuja</button>
                            <button onClick={() => addShape('heart')} className="w-full px-4 py-2 hover:bg-white/5 text-left text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-white">Corazón</button>
                        </div>
                    </div>

                    <button
                        onClick={addText}
                        className="w-10 h-10 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-all flex items-center justify-center shrink-0"
                        title="Añadir Texto"
                    >
                        <FileText size={16} />
                    </button>

                    <button
                        onClick={addTitle}
                        className="w-10 h-10 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-all flex items-center justify-center shrink-0"
                        title="Añadir Título"
                    >
                        <Type size={16} />
                    </button>
                </div>

                <div className="hidden sm:block w-px h-6 bg-white/10 shrink-0" />

                {/* Zoom Group (Compact & clean) */}
                <div className="hidden sm:flex items-center gap-1 shrink-0">
                    <button onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))} className="p-1.5 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-all" title="Alejar"><Minus size={12} /></button>
                    <span className="text-[9px] font-bold text-zinc-400 min-w-[30px] text-center">{Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom(prev => Math.min(2, prev + 0.1))} className="p-1.5 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-all" title="Acercar"><Plus size={12} /></button>
                </div>

                <div className="w-px h-6 bg-white/10 shrink-0" />

                {/* Utility Actions (Clear & Save) */}
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => { if (confirm('¿Limpiar todo el mural?')) syncBlocks([]); }}
                        className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all flex items-center justify-center shrink-0"
                        title="Limpiar Todo el Mural"
                    >
                        <Trash2 size={15} />
                    </button>

                    <button
                        onClick={() => {
                            onSave(blocks);
                            onClose();
                        }}
                        className="w-10 h-10 rounded-full bg-accent text-black hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(var(--accent-rgb),0.3)] flex items-center justify-center shrink-0"
                        style={{ '--accent-rgb': hexToRgb(accent) }}
                        title="Guardar todo en la Nota"
                    >
                        <Check size={16} className="stroke-[3]" />
                    </button>
                </div>

                <div className="w-px h-6 bg-white/10 shrink-0" />

                {/* Close Button - Stably padded to prevent cutoff */}
                <button
                    onClick={onClose}
                    className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all shrink-0 hover:scale-105 active:scale-95"
                    title="Cerrar Mural"
                >
                    <X size={16} />
                </button>
            </div>

            {/* THE DRAGGABLE CANVAS WORKSPACE */}
            <div
                className="absolute inset-0 origin-top-left transition-transform duration-75"
                style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                }}
            >
                {blocks.map((block) => {
                    const isSelected = block.id === selectedId;
                    return (
                        <div
                            key={block.id}
                            id={`mural-block-${block.id}`}
                            style={{
                                position: 'absolute',
                                left: block.x,
                                top: block.y,
                                width: block.w,
                                height: block.h,
                                transform: `rotate(${block.rotation || 0}deg)`,
                                zIndex: isSelected ? 1000 : 1,
                                borderRadius: block.type === 'shape' ? 'none' : `${block.borderRadius !== undefined ? block.borderRadius : 24}px`,
                                border: block.borderWidth ? `${block.borderWidth}px solid ${block.borderColor || '#ffffff'}` : 'none',
                                boxShadow: getShadowStyle(block.shadowType, block.color || block.borderColor),
                                opacity: block.opacity !== undefined ? block.opacity : 1,
                            }}
                            className={`group relative ${isSelected ? 'ring-2 ring-accent' : 'hover:ring-1 hover:ring-white/20'}`}
                            onMouseDown={() => bringToFront(block.id)}
                            onTouchStart={() => bringToFront(block.id)}
                        >
                            {/* MOVE HANDLE (ONLY WHEN NOT SELECTED OR ALWAYS FOR IMAGES/SHAPES) */}
                            {(!isSelected || block.type === 'image' || block.type === 'shape') && (
                                <div
                                    onMouseDown={(e) => startDrag(e, block, 'move')}
                                    onTouchStart={(e) => startDrag(e, block, 'move')}
                                    className="absolute inset-0 cursor-move z-10"
                                    style={{ borderRadius: block.type === 'shape' ? '0px' : `${block.borderRadius !== undefined ? block.borderRadius : 24}px` }}
                                />
                            )}

                            {/* FLOATING WRAPPER FOR ORGANIC PASSIVE MOTION */}
                            <div
                                className="w-full h-full"
                                style={{
                                    animation: (!isSelected && !isPanning) ? 'node-float 6s ease-in-out infinite' : 'none',
                                    animationDelay: `${(block.id.split('-').pop() % 5) * 0.4}s`
                                }}
                            >
                                {/* CONTENT RENDERING */}
                                {block.type === 'image' && (
                                    <div
                                        className="w-full h-full overflow-hidden"
                                        style={{
                                            ...getMaskStyle(block.mask),
                                            borderRadius: (block.mask && block.mask !== 'none') ? 'none' : `${block.borderRadius !== undefined ? block.borderRadius : 24}px`
                                        }}
                                    >
                                        <img
                                            src={block.content}
                                            alt="Editorial element"
                                            className="w-full h-full pointer-events-none select-none"
                                            style={{
                                                transform: `scale(${block.zoom || 1})`,
                                                objectFit: block.objectFit || 'fill',
                                                filter: getFilterStyle(block.filter)
                                            }}
                                        />
                                    </div>
                                )}

                                {block.type === 'shape' && (
                                    <div
                                        className="w-full h-full flex items-center justify-center overflow-hidden"
                                        style={{ filter: getFilterStyle(block.filter) }}
                                    >
                                        <svg
                                            width="100%"
                                            height="100%"
                                            viewBox="0 0 100 100"
                                            preserveAspectRatio="none"
                                            className="w-full h-full"
                                        >
                                            {renderShapeSVG(block.shapeType, block.color)}
                                        </svg>
                                    </div>
                                )}

                                {block.type === 'text' && (
                                    <MuralText
                                        block={block}
                                        updateBlock={updateBlock}
                                        isSelected={isSelected}
                                        bringToFront={bringToFront}
                                        accent={accent}
                                    />
                                )}
                            </div>

                            {/* TRANSFORM CONTROLS (ONLY IF SELECTED - ANCHORED STABLY TO OUTER POSITION) */}
                            {isSelected && (
                                <>
                                    {/* ROTATE HANDLE */}
                                    <div
                                        onMouseDown={(e) => startDrag(e, block, 'rotate')}
                                        onTouchStart={(e) => startDrag(e, block, 'rotate')}
                                        className="absolute -top-10 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-accent text-white hover:text-black border border-white/20 flex items-center justify-center cursor-crosshair shadow-lg z-20 transition-colors backdrop-blur-md"
                                        title="Girar"
                                    >
                                        <RotateCw size={12} />
                                    </div>

                                    {/* SELECTED MOVE HANDLE */}
                                    <div
                                        onMouseDown={(e) => startDrag(e, block, 'move')}
                                        onTouchStart={(e) => startDrag(e, block, 'move')}
                                        className="absolute -top-10 left-6 w-8 h-8 rounded-full bg-black/60 hover:bg-accent text-white hover:text-black border border-white/20 flex items-center justify-center cursor-move shadow-lg z-20 transition-colors backdrop-blur-md"
                                        title="Mover"
                                    >
                                        <Move size={12} />
                                    </div>

                                    {/* RESIZE E HANDLE */}
                                    <div
                                        onMouseDown={(e) => startDrag(e, block, 'resize', 'e')}
                                        onTouchStart={(e) => startDrag(e, block, 'resize', 'e')}
                                        className="absolute top-1/2 -right-3 -translate-y-1/2 w-4 h-8 bg-white/20 border border-white/40 rounded-full cursor-e-resize z-20 hover:bg-accent hover:border-accent shadow-md transition-colors"
                                        title="Estirar Ancho (Derecha)"
                                    />

                                    {/* RESIZE W HANDLE */}
                                    <div
                                        onMouseDown={(e) => startDrag(e, block, 'resize', 'w')}
                                        onTouchStart={(e) => startDrag(e, block, 'resize', 'w')}
                                        className="absolute top-1/2 -left-3 -translate-y-1/2 w-4 h-8 bg-white/20 border border-white/40 rounded-full cursor-w-resize z-20 hover:bg-accent hover:border-accent shadow-md transition-colors"
                                        title="Estirar Ancho (Izquierda)"
                                    />

                                    {/* RESIZE S HANDLE */}
                                    <div
                                        onMouseDown={(e) => startDrag(e, block, 'resize', 's')}
                                        onTouchStart={(e) => startDrag(e, block, 'resize', 's')}
                                        className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-4 bg-white/20 border border-white/40 rounded-full cursor-s-resize z-20 hover:bg-accent hover:border-accent shadow-md transition-colors"
                                        title="Estirar Alto (Abajo)"
                                    />

                                    {/* RESIZE N HANDLE */}
                                    <div
                                        onMouseDown={(e) => startDrag(e, block, 'resize', 'n')}
                                        onTouchStart={(e) => startDrag(e, block, 'resize', 'n')}
                                        className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-4 bg-white/20 border border-white/40 rounded-full cursor-n-resize z-20 hover:bg-accent hover:border-accent shadow-md transition-colors"
                                        title="Estirar Alto (Arriba)"
                                    />

                                    {/* RESIZE SE HANDLE */}
                                    <div
                                        onMouseDown={(e) => startDrag(e, block, 'resize', 'se')}
                                        onTouchStart={(e) => startDrag(e, block, 'resize', 'se')}
                                        className="absolute -bottom-4 -right-4 w-8 h-8 rounded-full bg-accent text-black flex items-center justify-center cursor-se-resize shadow-xl z-20 hover:scale-110 active:scale-95 transition-transform"
                                        title="Estirar Ambas Dimensiones"
                                    >
                                        <Maximize2 size={12} />
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* CANVA-STYLE BOTTOM BAR SETTINGS */}
            {selectedBlock && (
                <div className="fixed bottom-0 left-0 right-0 z-[2200] bg-[#121214]/95 backdrop-blur-3xl border-t border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.8)] px-4 py-3 pb-safe animate-in slide-in-from-bottom-10 duration-300">
                    
                    {/* SUB-MENU DRAWER */}
                    {activeTool && (
                        <div className="w-full border-b border-white/5 pb-3 mb-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
                            <div className="flex items-center justify-between mb-2">
                                <button 
                                    onClick={() => setActiveTool(null)} 
                                    className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white flex items-center gap-1"
                                >
                                    ← Volver
                                </button>
                                <span className="text-[10px] font-black uppercase tracking-widest text-accent">
                                    {activeTool === 'crop' && 'Silueta & Recorte'}
                                    {activeTool === 'fitting' && 'Ajuste de Relleno'}
                                    {activeTool === 'zoom' && 'Zoom de la Foto'}
                                    {activeTool === 'filter' && 'Filtro Artístico'}
                                    {activeTool === 'border' && 'Bordes & Efectos'}
                                    {activeTool === 'layers' && 'Organizar Capas'}
                                    {activeTool === 'shape' && 'Diseño de la Forma'}
                                    {activeTool === 'color' && 'Paleta de Color'}
                                    {activeTool === 'text' && 'Formato de Letra'}
                                    {activeTool === 'size' && 'Tamaño de Letra'}
                                </span>
                                <button 
                                    onClick={() => setSelectedId(null)} 
                                    className="text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-300"
                                >
                                    Listo ✓
                                </button>
                            </div>

                            {/* HORIZONTALLY SCROLLABLE OPTIONS ROW */}
                            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2 px-1">
                                {/* CROP OPTIONS */}
                                {activeTool === 'crop' && [
                                    { id: 'none', label: 'Original' },
                                    { id: 'circle', label: 'Círculo' },
                                    { id: 'hexagon', label: 'Hexágono' },
                                    { id: 'diamond', label: 'Diamante' },
                                    { id: 'arch', label: 'Arco' },
                                    { id: 'pill', label: 'Píldora' }
                                ].map((m) => (
                                    <button
                                        key={m.id}
                                        onClick={() => updateBlock(selectedBlock.id, { mask: m.id })}
                                        className={`px-4 py-2 rounded-full border text-[9px] font-black uppercase tracking-wider transition-all shrink-0 ${selectedBlock.mask === m.id || (!selectedBlock.mask && m.id === 'none') ? 'bg-accent text-black border-accent' : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'}`}
                                    >
                                        {m.label}
                                    </button>
                                ))}

                                {/* FITTING OPTIONS */}
                                {activeTool === 'fitting' && [
                                    { id: 'fill', label: 'Estirar' },
                                    { id: 'cover', label: 'Recortar' }
                                ].map((m) => (
                                    <button
                                        key={m.id}
                                        onClick={() => updateBlock(selectedBlock.id, { objectFit: m.id })}
                                        className={`px-4 py-2 rounded-full border text-[9px] font-black uppercase tracking-wider transition-all shrink-0 ${selectedBlock.objectFit === m.id || (!selectedBlock.objectFit && m.id === 'fill') ? 'bg-accent text-black border-accent' : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'}`}
                                    >
                                        {m.label}
                                    </button>
                                ))}

                                {/* ZOOM OPTION */}
                                {activeTool === 'zoom' && (
                                    <div className="flex-1 flex items-center gap-4 min-w-[280px] px-2">
                                        <span className="text-[10px] font-bold text-white shrink-0">{Math.round((selectedBlock.zoom || 1) * 100)}%</span>
                                        <input
                                            type="range"
                                            min="1"
                                            max="3"
                                            step="0.05"
                                            value={selectedBlock.zoom || 1}
                                            onChange={(e) => updateBlock(selectedBlock.id, { zoom: parseFloat(e.target.value) })}
                                            className="flex-1 accent-accent"
                                        />
                                    </div>
                                )}

                                {/* FILTER OPTIONS */}
                                {activeTool === 'filter' && [
                                    { id: 'none', label: 'Original' },
                                    { id: 'grayscale', label: 'B&W' },
                                    { id: 'sepia', label: 'Sepia' },
                                    { id: 'invert', label: 'Negativo' },
                                    { id: 'blur', label: 'Blur' },
                                    { id: 'brightness-sat', label: 'Saturado' },
                                    { id: 'warm', label: 'Cálido' },
                                    { id: 'cool', label: 'Frío' }
                                ].map((f) => (
                                    <button
                                        key={f.id}
                                        onClick={() => updateBlock(selectedBlock.id, { filter: f.id })}
                                        className={`px-4 py-2 rounded-full border text-[9px] font-black uppercase tracking-wider transition-all shrink-0 ${selectedBlock.filter === f.id || (!selectedBlock.filter && f.id === 'none') ? 'bg-accent text-black border-accent' : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'}`}
                                    >
                                        {f.label}
                                    </button>
                                ))}

                                {/* SHAPE OPTIONS */}
                                {activeTool === 'shape' && [
                                    { id: 'rect', label: 'Rectángulo' },
                                    { id: 'circle', label: 'Círculo' },
                                    { id: 'triangle', label: 'Triángulo' },
                                    { id: 'pill', label: 'Píldora' },
                                    { id: 'arrow', label: 'Flecha' },
                                    { id: 'star', label: 'Estrella' },
                                    { id: 'bubble', label: 'Burbuja' },
                                    { id: 'heart', label: 'Corazón' }
                                ].map((s) => (
                                    <button
                                        key={s.id}
                                        onClick={() => updateBlock(selectedBlock.id, { shapeType: s.id })}
                                        className={`px-4 py-2 rounded-full border text-[9px] font-black uppercase tracking-wider transition-all shrink-0 ${selectedBlock.shapeType === s.id || (!selectedBlock.shapeType && s.id === 'rect') ? 'bg-accent text-black border-accent' : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'}`}
                                    >
                                        {s.label}
                                    </button>
                                ))}

                                {/* COLOR OPTIONS */}
                                {activeTool === 'color' && ['#bef264', '#22d3ee', '#f43f5e', '#d946ef', '#fbbf24', '#ffffff', '#000000'].map((c) => (
                                    <button
                                        key={c}
                                        onClick={() => updateBlock(selectedBlock.id, { color: c })}
                                        className={`w-9 h-9 rounded-full border-2 shrink-0 transition-all ${selectedBlock.color === c ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}

                                {/* TEXT OPTIONS */}
                                {activeTool === 'text' && (
                                    <div className="flex items-center gap-3 shrink-0">
                                        <select
                                            value={selectedBlock.fontFamily || '"Montserrat", sans-serif'}
                                            onChange={(e) => updateBlock(selectedBlock.id, { fontFamily: e.target.value })}
                                            className="px-3 py-2 bg-zinc-900 border border-white/10 rounded-full text-[9px] font-black uppercase text-white outline-none"
                                        >
                                            <option value="'Outfit', sans-serif">Outfit</option>
                                            <option value="'Montserrat', sans-serif">Montserrat</option>
                                            <option value="'Playfair Display', serif">Playfair</option>
                                            <option value="'Fraunces', serif">Fraunces</option>
                                            <option value="'JetBrains Mono', monospace">JetBrains</option>
                                            <option value="'Courier Prime', monospace">Courier</option>
                                            <option value="'Sacramento', cursive">Sacramento</option>
                                        </select>

                                        {[
                                            { id: '100', label: 'Delgada' },
                                            { id: '400', label: 'Normal' },
                                            { id: '900', label: 'Gruesa' }
                                        ].map((w) => (
                                            <button
                                                key={w.id}
                                                onClick={() => updateBlock(selectedBlock.id, { fontWeight: w.id })}
                                                className={`px-3 py-2 rounded-full border text-[9px] font-black uppercase tracking-wider transition-all shrink-0 ${selectedBlock.fontWeight === w.id || (!selectedBlock.fontWeight && w.id === '400') ? 'bg-accent text-black border-accent' : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'}`}
                                            >
                                                {w.label}
                                            </button>
                                        ))}

                                        {[
                                            { id: 'uppercase', label: 'MAYÚS' },
                                            { id: 'lowercase', label: 'minús' },
                                            { id: 'none', label: 'Abc' }
                                        ].map((t) => (
                                            <button
                                                key={t.id}
                                                onClick={() => updateBlock(selectedBlock.id, { textTransform: t.id })}
                                                className={`px-3 py-2 rounded-full border text-[9px] font-black uppercase tracking-wider transition-all shrink-0 ${selectedBlock.textTransform === t.id || (!selectedBlock.textTransform && t.id === 'none') ? 'bg-accent text-black border-accent' : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'}`}
                                            >
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* SIZE OPTION */}
                                {activeTool === 'size' && (
                                    <div className="flex-1 flex items-center gap-4 min-w-[280px] px-2">
                                        <span className="text-[10px] font-bold text-white shrink-0">{selectedBlock.fontSize || 16}px</span>
                                        <input
                                            type="range"
                                            min="12"
                                            max="200"
                                            value={selectedBlock.fontSize || 16}
                                            onChange={(e) => updateBlock(selectedBlock.id, { fontSize: parseInt(e.target.value) })}
                                            className="flex-1 accent-accent"
                                        />
                                    </div>
                                )}

                                {/* BORDERS OPTIONS */}
                                {activeTool === 'border' && (
                                    <div className="flex items-center gap-4 shrink-0 px-2 min-w-[320px]">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-bold text-white shrink-0">Borde: {selectedBlock.borderWidth || 0}px</span>
                                            <input
                                                type="range"
                                                min="0"
                                                max="20"
                                                value={selectedBlock.borderWidth || 0}
                                                onChange={(e) => updateBlock(selectedBlock.id, { borderWidth: parseInt(e.target.value) })}
                                                className="w-20 accent-accent"
                                            />
                                        </div>

                                        {selectedBlock.type !== 'shape' && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-bold text-white shrink-0">Esquinas: {selectedBlock.borderRadius !== undefined ? selectedBlock.borderRadius : 24}px</span>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="100"
                                                    value={selectedBlock.borderRadius !== undefined ? selectedBlock.borderRadius : 24}
                                                    onChange={(e) => updateBlock(selectedBlock.id, { borderRadius: parseInt(e.target.value) })}
                                                    className="w-20 accent-accent"
                                                />
                                            </div>
                                        )}

                                        <div className="flex gap-1">
                                            {['#ffffff', '#bef264', '#22d3ee', '#f43f5e', '#fbbf24', '#000000'].map((c) => (
                                                <button
                                                    key={c}
                                                    onClick={() => updateBlock(selectedBlock.id, { borderColor: c })}
                                                    className={`w-6 h-6 rounded-full border shrink-0 transition-all ${selectedBlock.borderColor === c ? 'border-white scale-110' : 'border-transparent opacity-60'}`}
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* LAYERS OPTIONS */}
                                {activeTool === 'layers' && (
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={() => bringToFront(selectedBlock.id)}
                                            className="px-3 py-2 rounded-full bg-white/5 border border-white/10 text-white text-[9px] font-black uppercase tracking-wider shrink-0"
                                        >
                                            Traer al Frente ⬆️
                                        </button>
                                        <button
                                            onClick={() => {
                                                const filtered = blocks.filter(b => b.id !== selectedBlock.id);
                                                syncBlocks([selectedBlock, ...filtered]);
                                            }}
                                            className="px-3 py-2 rounded-full bg-white/5 border border-white/10 text-white text-[9px] font-black uppercase tracking-wider shrink-0"
                                        >
                                            Enviar al Fondo ⬇️
                                        </button>
                                        <button
                                            onClick={() => updateBlock(selectedBlock.id, { rotation: (selectedBlock.rotation || 0) - 45 })}
                                            className="px-3 py-2 rounded-full bg-white/5 border border-white/10 text-white text-[9px] font-black uppercase tracking-wider shrink-0"
                                        >
                                            Girar -45°
                                        </button>
                                        <button
                                            onClick={() => updateBlock(selectedBlock.id, { rotation: 0 })}
                                            className="px-3 py-2 rounded-full bg-white/5 border border-white/10 text-white text-[9px] font-black uppercase tracking-wider shrink-0"
                                        >
                                            Enderezar
                                        </button>
                                        <button
                                            onClick={() => updateBlock(selectedBlock.id, { rotation: (selectedBlock.rotation || 0) + 45 })}
                                            className="px-3 py-2 rounded-full bg-white/5 border border-white/10 text-white text-[9px] font-black uppercase tracking-wider shrink-0"
                                        >
                                            Girar +45°
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* MAIN TOOLBAR ROW */}
                    <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-1">
                        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                            {/* IMAGE SPECIFIC BUTTONS */}
                            {selectedBlock.type === 'image' && (
                                <>
                                    <button
                                        onClick={() => setActiveTool('crop')}
                                        className={`flex flex-col items-center justify-center min-w-[56px] h-12 rounded-xl transition-all ${activeTool === 'crop' ? 'text-accent bg-white/5 font-black' : 'text-zinc-400 hover:text-white'}`}
                                    >
                                        <Crop size={16} />
                                        <span className="text-[8px] font-black tracking-tighter mt-1">Recorte</span>
                                    </button>
                                    <button
                                        onClick={() => setActiveTool('fitting')}
                                        className={`flex flex-col items-center justify-center min-w-[56px] h-12 rounded-xl transition-all ${activeTool === 'fitting' ? 'text-accent bg-white/5 font-black' : 'text-zinc-400 hover:text-white'}`}
                                    >
                                        <Maximize2 size={16} />
                                        <span className="text-[8px] font-black tracking-tighter mt-1">Ajuste</span>
                                    </button>
                                    <button
                                        onClick={() => triggerImageReplace(selectedBlock.id)}
                                        className="flex flex-col items-center justify-center min-w-[56px] h-12 rounded-xl text-zinc-400 hover:text-white"
                                    >
                                        <RefreshCw size={16} />
                                        <span className="text-[8px] font-black tracking-tighter mt-1">Cambiar</span>
                                    </button>
                                    <button
                                        onClick={() => setActiveTool('zoom')}
                                        className={`flex flex-col items-center justify-center min-w-[56px] h-12 rounded-xl transition-all ${activeTool === 'zoom' ? 'text-accent bg-white/5' : 'text-zinc-400 hover:text-white'}`}
                                    >
                                        <Sliders size={16} />
                                        <span className="text-[8px] font-black tracking-tighter mt-1">Zoom Foto</span>
                                    </button>
                                    <button
                                        onClick={() => setActiveTool('filter')}
                                        className={`flex flex-col items-center justify-center min-w-[56px] h-12 rounded-xl transition-all ${activeTool === 'filter' ? 'text-accent bg-white/5' : 'text-zinc-400 hover:text-white'}`}
                                    >
                                        <Sparkles size={16} />
                                        <span className="text-[8px] font-black tracking-tighter mt-1">Filtros</span>
                                    </button>
                                </>
                            )}

                            {/* SHAPE SPECIFIC BUTTONS */}
                            {selectedBlock.type === 'shape' && (
                                <>
                                    <button
                                        onClick={() => setActiveTool('shape')}
                                        className={`flex flex-col items-center justify-center min-w-[56px] h-12 rounded-xl transition-all ${activeTool === 'shape' ? 'text-accent bg-white/5' : 'text-zinc-400 hover:text-white'}`}
                                    >
                                        <Zap size={16} />
                                        <span className="text-[8px] font-black tracking-tighter mt-1">Forma</span>
                                    </button>
                                    <button
                                        onClick={() => setActiveTool('color')}
                                        className={`flex flex-col items-center justify-center min-w-[56px] h-12 rounded-xl transition-all ${activeTool === 'color' ? 'text-accent bg-white/5' : 'text-zinc-400 hover:text-white'}`}
                                    >
                                        <Palette size={16} />
                                        <span className="text-[8px] font-black tracking-tighter mt-1">Color</span>
                                    </button>
                                </>
                            )}

                            {/* TEXT SPECIFIC BUTTONS */}
                            {selectedBlock.type === 'text' && (
                                <>
                                    <button
                                        onClick={() => setActiveTool('text')}
                                        className={`flex flex-col items-center justify-center min-w-[56px] h-12 rounded-xl transition-all ${activeTool === 'text' ? 'text-accent bg-white/5' : 'text-zinc-400 hover:text-white'}`}
                                    >
                                        <Type size={16} />
                                        <span className="text-[8px] font-black tracking-tighter mt-1">Fuente</span>
                                    </button>
                                    <button
                                        onClick={() => setActiveTool('size')}
                                        className={`flex flex-col items-center justify-center min-w-[56px] h-12 rounded-xl transition-all ${activeTool === 'size' ? 'text-accent bg-white/5' : 'text-zinc-400 hover:text-white'}`}
                                    >
                                        <Sliders size={16} />
                                        <span className="text-[8px] font-black tracking-tighter mt-1">Tamaño</span>
                                    </button>
                                    <button
                                        onClick={() => setActiveTool('color')}
                                        className={`flex flex-col items-center justify-center min-w-[56px] h-12 rounded-xl transition-all ${activeTool === 'color' ? 'text-accent bg-white/5' : 'text-zinc-400 hover:text-white'}`}
                                    >
                                        <Palette size={16} />
                                        <span className="text-[8px] font-black tracking-tighter mt-1">Color</span>
                                    </button>
                                </>
                            )}

                            {/* SHARED ACTIONS */}
                            <button
                                onClick={() => setActiveTool('border')}
                                className={`flex flex-col items-center justify-center min-w-[56px] h-12 rounded-xl transition-all ${activeTool === 'border' ? 'text-accent bg-white/5' : 'text-zinc-400 hover:text-white'}`}
                            >
                                <Grid size={16} />
                                <span className="text-[8px] font-black tracking-tighter mt-1">Bordes</span>
                            </button>
                            <button
                                onClick={() => setActiveTool('layers')}
                                className={`flex flex-col items-center justify-center min-w-[56px] h-12 rounded-xl transition-all ${activeTool === 'layers' ? 'text-accent bg-white/5' : 'text-zinc-400 hover:text-white'}`}
                            >
                                <Layers size={16} />
                                <span className="text-[8px] font-black tracking-tighter mt-1">Capas</span>
                            </button>
                            <button
                                onClick={() => deleteBlock(selectedBlock.id)}
                                className="flex flex-col items-center justify-center min-w-[56px] h-12 rounded-xl text-red-400 hover:bg-red-500/10"
                            >
                                <Trash2 size={16} />
                                <span className="text-[8px] font-black tracking-tighter mt-1">Eliminar</span>
                            </button>
                        </div>

                        <div className="flex items-center gap-1 pl-2 border-l border-white/10 shrink-0">
                            <button
                                onClick={() => setSelectedId(null)}
                                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                                style={{ backgroundColor: accent, color: '#000000' }}
                            >
                                <Check size={16} className="stroke-[3]" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
