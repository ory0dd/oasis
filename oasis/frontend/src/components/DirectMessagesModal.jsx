import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
    X, Send, Search, MessageCircle, UserPlus, Sparkles, 
    Check, ExternalLink, ArrowLeft, Heart, UserCheck, UserX,
    Clock, Users, ShieldAlert, CheckCircle2, ArrowDown, Mic,
    Paperclip, Moon, ChevronRight, Hash, Compass, Plus
} from 'lucide-react';

const DEFAULT_DEMO_CONTACTS = [
    {
        username: 'luna_veil',
        displayName: 'Luna Veil',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
        categoryTag: '#escultura',
        timeLabel: '12m',
        isOnline: true,
        vibe: 'Modelando resina fría ✨',
        initialMessages: [
            { id: 'm1', sender: 'luna_veil', text: 'Hola Ory, vi la pieza #01 de tu marco lila.', timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString() },
            { id: 'm2', sender: 'luna_veil', text: '¿Trabajas con resina pura o mezclas mortero?', timestamp: new Date(Date.now() - 14 * 60 * 1000).toISOString() },
            { id: 'm3', sender: 'ory11', text: 'Hey Luna! Es cerámica fría modelada a mano con acabado en resina refractaria c:', timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString() }
        ]
    },
    {
        username: 'kairo',
        displayName: 'Kairo',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop',
        categoryTag: '#sonido',
        timeLabel: '2h',
        isOnline: true,
        vibe: 'Grabación binaural 432Hz 🎧',
        initialMessages: [
            { id: 'k1', sender: 'kairo', text: 'Oye Ory, logré procesar las frecuencias binaurales de la cinta de meditación.', timestamp: new Date(Date.now() - 150 * 60 * 1000).toISOString() },
            { id: 'k2', sender: 'kairo', text: 'Te dejé una resonancia en el archivo sonoro para cuando quieras escuchar.', timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString() }
        ]
    },
    {
        username: 'solaris',
        displayName: 'Solaris',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=300&auto=format&fit=crop',
        categoryTag: '#fotografia',
        timeLabel: '5h',
        isOnline: true,
        vibe: 'Cámara analógica en luz tenue 📸',
        initialMessages: [
            { id: 's1', sender: 'solaris', text: '¿Viste las nuevas capturas de flash analógico del taller?', timestamp: new Date(Date.now() - 300 * 60 * 1000).toISOString() }
        ]
    }
];

export default function DirectMessagesModal({
    isOpen,
    onClose,
    currentUser = 'anon',
    currentUserAvatar,
    publicUsers = [],
    initialTargetUser = null,
    initialContextMessage = '',
    onOpenProfile,
    accent = '#10b981'
}) {
    if (!isOpen) return null;

    const cleanCurrent = (currentUser || 'anon').replace('@', '').toLowerCase();

    // ─── LOCAL STORAGE KEYS ───
    const THREADS_KEY = `oasis_direct_messages_${cleanCurrent}`;
    const FRIENDS_KEY = `oasis_friends_${cleanCurrent}`;
    const SENT_KEY = `oasis_sent_requests_${cleanCurrent}`;
    const RECEIVED_KEY = `oasis_received_requests_${cleanCurrent}`;
    const ZEN_KEY = `oasis_dm_zen_mode_${cleanCurrent}`;

    // ─── STATE INITIALIZERS ───
    const [threads, setThreads] = useState(() => {
        try {
            const saved = localStorage.getItem(THREADS_KEY);
            if (saved) return JSON.parse(saved);
            
            // Seed with curated creative contacts from mockup
            const initialMap = {};
            DEFAULT_DEMO_CONTACTS.forEach(c => {
                initialMap[c.username] = {
                    targetUser: c.username,
                    displayName: c.displayName,
                    avatar: c.avatar,
                    categoryTag: c.categoryTag,
                    lastUpdated: c.initialMessages[c.initialMessages.length - 1].timestamp,
                    lastMessage: c.initialMessages[c.initialMessages.length - 1].text,
                    messages: c.initialMessages
                };
            });
            localStorage.setItem(THREADS_KEY, JSON.stringify(initialMap));
            return initialMap;
        } catch {
            return {};
        }
    });

    const [friends, setFriends] = useState(() => {
        try {
            const saved = localStorage.getItem(FRIENDS_KEY);
            if (saved) return JSON.parse(saved);
            const defaultFriends = ['luna_veil', 'kairo', 'solaris'];
            localStorage.setItem(FRIENDS_KEY, JSON.stringify(defaultFriends));
            return defaultFriends;
        } catch {
            return ['luna_veil', 'kairo', 'solaris'];
        }
    });

    const [receivedRequests, setReceivedRequests] = useState(() => {
        try {
            const saved = localStorage.getItem(RECEIVED_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const [sentRequests, setSentRequests] = useState(() => {
        try {
            const saved = localStorage.getItem(SENT_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const [zenMode, setZenMode] = useState(() => {
        try {
            return localStorage.getItem(ZEN_KEY) === 'true';
        } catch {
            return false;
        }
    });

    const toggleZenMode = () => {
        setZenMode(prev => {
            const next = !prev;
            try { localStorage.setItem(ZEN_KEY, String(next)); } catch {}
            return next;
        });
    };

    const [activeUser, setActiveUser] = useState(() => {
        if (initialTargetUser) return initialTargetUser.replace('@', '').toLowerCase();
        return 'luna_veil';
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [subTab, setSubTab] = useState('bandeja'); // 'bandeja' | 'resonancias' | 'frecuencias'
    const [messageText, setMessageText] = useState(initialContextMessage || '');
    const [toastMessage, setToastMessage] = useState(null);
    const [isRecordingAudio, setIsRecordingAudio] = useState(false);
    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    const saveThreads = (newThreads) => {
        setThreads(newThreads);
        try {
            localStorage.setItem(THREADS_KEY, JSON.stringify(newThreads));
        } catch (e) {
            console.error('Error saving direct messages:', e);
        }
    };

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [activeUser, threads]);

    // Handle initial target user
    useEffect(() => {
        if (initialTargetUser) {
            const targetClean = initialTargetUser.replace('@', '').toLowerCase();
            setActiveUser(targetClean);
            if (initialContextMessage) {
                setMessageText(initialContextMessage);
            }
        }
    }, [initialTargetUser, initialContextMessage]);

    // Strict privacy filter for community users:
    // Only verified creators or existing friends
    const filteredCommunityUsers = useMemo(() => {
        const friendSet = new Set(friends.map(f => f.toLowerCase()));
        return (publicUsers || []).filter(u => {
            const uname = (u.Username || u.username || '').replace('@', '').toLowerCase();
            if (!uname || uname === cleanCurrent || uname === 'anon' || uname.startsWith('test_')) return false;
            // Never expose clinical patients
            if (uname.includes('patient') || uname.includes('clinician') || uname === 'somni') return false;
            const isCreator = u.isPublicProfile === true || u.role === 'creator' || u.Role === 'creator';
            return isCreator || friendSet.has(uname);
        }).map((u, idx) => {
            const uname = (u.Username || u.username || '').replace('@', '');
            const avatar = u.Avatar || u.avatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(uname)}`;
            return {
                id: u.id || idx,
                username: uname,
                displayName: u.FullName || u.fullName || uname,
                avatar,
                bio: u.Bio || u.bio || 'Creador en Oasis',
                categoryTag: '#resonancia'
            };
        });
    }, [publicUsers, friends, cleanCurrent]);

    const getUserMeta = (username) => {
        if (!username) return { username: 'anon', displayName: 'Explorador', avatar: '', categoryTag: '#obra' };
        const clean = username.replace('@', '').toLowerCase();
        const demo = DEFAULT_DEMO_CONTACTS.find(d => d.username.toLowerCase() === clean);
        if (demo) return demo;
        const comm = filteredCommunityUsers.find(c => c.username.toLowerCase() === clean);
        if (comm) return comm;
        return {
            username: clean,
            displayName: clean,
            avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(clean)}`,
            categoryTag: '#frecuencia',
            isOnline: true,
            vibe: 'En sintonía con Oasis'
        };
    };

    const handleSendMessage = () => {
        if (!messageText.trim() || !activeUser) return;
        const targetClean = activeUser.toLowerCase();

        const currentThread = threads[targetClean] || {
            targetUser: activeUser,
            displayName: getUserMeta(activeUser).displayName,
            avatar: getUserMeta(activeUser).avatar,
            categoryTag: getUserMeta(activeUser).categoryTag,
            messages: []
        };

        const newMsg = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            sender: cleanCurrent,
            receiver: targetClean,
            text: messageText.trim(),
            timestamp: new Date().toISOString()
        };

        const updatedThread = {
            ...currentThread,
            targetUser: activeUser,
            lastUpdated: new Date().toISOString(),
            lastMessage: newMsg.text,
            messages: [...(currentThread.messages || []), newMsg]
        };

        const updatedThreads = {
            ...threads,
            [targetClean]: updatedThread
        };

        saveThreads(updatedThreads);
        setMessageText('');
    };

    // Filter threads
    const threadKeys = Object.keys(threads).sort((a, b) => {
        const tA = new Date(threads[a]?.lastUpdated || 0).getTime();
        const tB = new Date(threads[b]?.lastUpdated || 0).getTime();
        return tB - tA;
    });

    const filteredThreadKeys = threadKeys.filter(key => {
        const meta = getUserMeta(key);
        const q = searchQuery.toLowerCase();
        return key.toLowerCase().includes(q) || meta.displayName.toLowerCase().includes(q) || (meta.categoryTag || '').toLowerCase().includes(q);
    });

    const activeUserInfo = activeUser ? getUserMeta(activeUser) : null;
    const activeThread = activeUser ? (threads[activeUser.toLowerCase()] || { messages: [] }) : null;

    return (
        <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 select-none animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div 
                className="bg-[#0c0f12] border border-white/10 rounded-[28px] sm:rounded-[32px] w-full max-w-5xl h-[90vh] max-h-[760px] flex flex-col overflow-hidden shadow-[0_30px_90px_rgba(0,0,0,0.95)] relative animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* ─── TOAST FEEDBACK ─── */}
                {toastMessage && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-[#1a1f26] border border-[#2dd4bf]/30 text-white text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top duration-200">
                        <CheckCircle2 size={14} className="text-[#2dd4bf] shrink-0" />
                        <span>{toastMessage}</span>
                    </div>
                )}

                {/* ─── MODAL TOP HEADER (MATCHING MOCKUP) ─── */}
                <div className="px-5 sm:px-6 py-3.5 border-b border-white/[0.08] flex items-center justify-between shrink-0 bg-[#0e1216]/90 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#2dd4bf]/10 border border-[#2dd4bf]/25 flex items-center justify-center text-[#2dd4bf] shadow-inner">
                            <MessageCircle size={18} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-white font-bold text-sm sm:text-base tracking-tight">
                                    Mensajes & Resonancias
                                </h3>
                                <span className="w-2 h-2 rounded-full bg-[#2dd4bf] shadow-[0_0_8px_#2dd4bf] animate-pulse" />
                            </div>
                            <p className="text-[11px] text-zinc-400 font-mono tracking-wide">
                                @{cleanCurrent} // frecuencia activa privada
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* MODO ZEN BUTTON */}
                        <button
                            type="button"
                            onClick={toggleZenMode}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-medium transition-all flex items-center gap-1.5 border ${
                                zenMode 
                                    ? 'bg-[#2dd4bf]/15 text-[#2dd4bf] border-[#2dd4bf]/40 shadow-sm' 
                                    : 'bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10'
                            }`}
                            title="Activar modo concentración silencioso"
                        >
                            <Moon size={13} className={zenMode ? 'text-[#2dd4bf]' : 'text-zinc-400'} />
                            <span>Modo Zen</span>
                        </button>

                        {/* CLOSE BUTTON */}
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                            title="Cerrar (Esc)"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* ─── MODAL MAIN BODY: 2-COLUMN LAYOUT ─── */}
                <div className="flex-1 flex overflow-hidden min-h-0 flex-col md:flex-row">
                    
                    {/* ──── LEFT COLUMN (SIDEBAR) ──── */}
                    <div className={`w-full md:w-[350px] lg:w-[380px] shrink-0 border-r border-white/[0.08] flex flex-col bg-[#0a0d10] ${activeUser ? 'hidden md:flex' : 'flex h-full'}`}>
                        
                        {/* SEARCH INPUT */}
                        <div className="p-3.5 pb-2">
                            <div className="relative">
                                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                                <input 
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Buscar presencia o @usuario..."
                                    className="w-full bg-[#12161b] border border-white/10 rounded-2xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#2dd4bf]/50 transition-colors font-mono"
                                />
                            </div>
                        </div>

                        {/* PRESENCIA AMBIENTAL (VIBES EN VIVO) */}
                        <div className="px-4 py-2 border-b border-white/[0.06]">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-mono tracking-wider uppercase text-zinc-400 font-bold">
                                    PRESENCIA AMBIENTAL
                                </span>
                                <span className="text-[10px] font-mono text-[#2dd4bf] font-bold tracking-wider">
                                    EN VIVO
                                </span>
                            </div>

                            {/* HORIZONTAL VIBE BUBBLES */}
                            <div className="flex items-center gap-3.5 overflow-x-auto no-scrollbar py-1">
                                {/* TU VIBE BUTTON */}
                                <div 
                                    onClick={() => {
                                        const customVibe = prompt('Escribe tu estado de presencia o vibe:', 'Esculpiendo calma en la sobreinformación ✨');
                                        if (customVibe) showToast('Vibe ambiental actualizado');
                                    }}
                                    className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group"
                                >
                                    <div className="w-11 h-11 rounded-full border border-dashed border-white/20 group-hover:border-[#2dd4bf] flex items-center justify-center text-zinc-400 group-hover:text-[#2dd4bf] transition-all bg-white/[0.02]">
                                        <Plus size={16} />
                                    </div>
                                    <span className="text-[10px] font-mono text-zinc-400 group-hover:text-white transition-colors truncate max-w-[50px]">
                                        Tu vibe
                                    </span>
                                </div>

                                {/* CONTACT VIBES */}
                                {DEFAULT_DEMO_CONTACTS.map(contact => (
                                    <div 
                                        key={contact.username}
                                        onClick={() => setActiveUser(contact.username)}
                                        className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group"
                                        title={contact.vibe}
                                    >
                                        <div className="w-11 h-11 rounded-2xl p-0.5 relative group-hover:scale-105 transition-transform">
                                            <img 
                                                src={contact.avatar} 
                                                alt={contact.displayName} 
                                                className="w-full h-full object-cover rounded-xl border border-white/15" 
                                            />
                                            {contact.isOnline && (
                                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#2dd4bf] border-2 border-[#0a0d10] shadow-[0_0_6px_#2dd4bf]" />
                                            )}
                                        </div>
                                        <span className="text-[10px] font-mono text-zinc-400 group-hover:text-white transition-colors truncate max-w-[54px]">
                                            {contact.username.split('_')[0]}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* SUB-TABS: BANDEJA | RESONANCIAS 2 | FRECUENCIAS */}
                        <div className="flex items-center gap-1 px-3 py-2 border-b border-white/[0.06]">
                            <button
                                type="button"
                                onClick={() => setSubTab('bandeja')}
                                className={`flex-1 py-1.5 rounded-xl text-[11px] font-mono font-bold transition-all flex items-center justify-center gap-1 ${
                                    subTab === 'bandeja' 
                                        ? 'bg-white/10 text-white border border-white/15 shadow-sm' 
                                        : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                            >
                                <span>Bandeja</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setSubTab('resonancias')}
                                className={`flex-1 py-1.5 rounded-xl text-[11px] font-mono font-bold transition-all flex items-center justify-center gap-1.5 ${
                                    subTab === 'resonancias' 
                                        ? 'bg-white/10 text-white border border-white/15 shadow-sm' 
                                        : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                            >
                                <span>Resonancias</span>
                                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#2dd4bf] text-black font-mono font-bold">
                                    2
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setSubTab('frecuencias')}
                                className={`flex-1 py-1.5 rounded-xl text-[11px] font-mono font-bold transition-all flex items-center justify-center gap-1 ${
                                    subTab === 'frecuencias' 
                                        ? 'bg-white/10 text-white border border-white/15 shadow-sm' 
                                        : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                            >
                                <span>Frecuencias</span>
                            </button>
                        </div>

                        {/* CONVERSATION THREAD LIST */}
                        <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-1.5">
                            {filteredThreadKeys.length === 0 ? (
                                <div className="p-8 text-center flex flex-col items-center justify-center gap-2 text-zinc-500">
                                    <MessageCircle size={24} className="opacity-40" />
                                    <p className="text-xs font-medium">Sin resonancias encontradas</p>
                                </div>
                            ) : (
                                filteredThreadKeys.map(uname => {
                                    const meta = getUserMeta(uname);
                                    const thread = threads[uname] || {};
                                    const isSelected = activeUser?.toLowerCase() === uname.toLowerCase();

                                    return (
                                        <div
                                            key={uname}
                                            onClick={() => setActiveUser(uname)}
                                            className={`p-2.5 rounded-2xl flex items-center gap-3 cursor-pointer transition-all border ${
                                                isSelected 
                                                    ? 'bg-[#2dd4bf]/[0.08] border-[#2dd4bf]/50 shadow-[0_0_20px_rgba(45,212,191,0.12)]' 
                                                    : 'hover:bg-white/[0.04] border-transparent'
                                            }`}
                                        >
                                            {/* AVATAR SQUIRCLE */}
                                            <div className="w-11 h-11 rounded-2xl border border-white/15 overflow-hidden shrink-0 bg-zinc-900 relative">
                                                <img 
                                                    src={meta.avatar} 
                                                    alt={meta.displayName} 
                                                    className="w-full h-full object-cover" 
                                                />
                                                {meta.isOnline && (
                                                    <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-[#2dd4bf] border-2 border-[#0c0f12]" />
                                                )}
                                            </div>

                                            {/* BODY */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-1">
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        <span className="text-xs font-bold text-white font-mono truncate">
                                                            {meta.displayName}
                                                        </span>
                                                        <span className="text-[10px] text-zinc-500 font-mono shrink-0">
                                                            {meta.timeLabel || (thread.lastUpdated ? new Date(thread.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'ahora')}
                                                        </span>
                                                    </div>
                                                    {/* CATEGORY TAG PILL (#escultura, #sonido, #fotografia) */}
                                                    {meta.categoryTag && (
                                                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-zinc-400 shrink-0">
                                                            {meta.categoryTag}
                                                        </span>
                                                    )}
                                                </div>

                                                <p className="text-[11px] text-zinc-400 truncate mt-1 font-mono">
                                                    {thread.lastMessage || 'Resonancia sincronizada'}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                    </div>

                    {/* ──── RIGHT COLUMN (ACTIVE CONVERSATION) ──── */}
                    <div className={`flex-1 flex flex-col bg-[#0b0e11] ${activeUser ? 'flex h-full' : 'hidden md:flex'}`}>
                        {activeUser && activeUserInfo ? (
                            <>
                                {/* ACTIVE CHAT TOP BAR */}
                                <div className="px-5 py-3.5 border-b border-white/[0.08] flex items-center justify-between bg-[#0d1014]/90 backdrop-blur-md shrink-0">
                                    <div className="flex items-center gap-3">
                                        <button 
                                            type="button"
                                            onClick={() => setActiveUser(null)}
                                            className="md:hidden w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-zinc-300 flex items-center justify-center transition-colors"
                                            title="Volver a la lista"
                                        >
                                            <ArrowLeft size={16} />
                                        </button>

                                        <div 
                                            className="w-10 h-10 rounded-2xl border border-[#2dd4bf]/40 overflow-hidden shrink-0 bg-zinc-900 cursor-pointer"
                                            onClick={() => {
                                                if (onOpenProfile) onOpenProfile(activeUserInfo.username);
                                            }}
                                        >
                                            <img src={activeUserInfo.avatar} alt={activeUserInfo.displayName} className="w-full h-full object-cover" />
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-white font-bold text-sm tracking-tight font-mono">
                                                    {activeUserInfo.displayName}
                                                </h4>
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#2dd4bf] shadow-[0_0_6px_#2dd4bf] animate-pulse" />
                                            </div>
                                            <p className="text-[10px] text-zinc-400 font-mono">
                                                @{activeUserInfo.username} // sincronizado
                                            </p>
                                        </div>
                                    </div>

                                    {/* ACTION ICONS (CLIP & SPARKLES) */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                showToast('Adjuntos efímeros listos para vincular');
                                            }}
                                            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                                            title="Adjuntar obra o archivo"
                                        >
                                            <Paperclip size={15} />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                const ideas = [
                                                    'Tu pieza tiene una resonancia visual magnética ✨',
                                                    '¿Qué textura usaste para el acabado final?',
                                                    'Me encantaría colaborar en el próximo monolito sonoro.'
                                                ];
                                                const randomIdea = ideas[Math.floor(Math.random() * ideas.length)];
                                                setMessageText(randomIdea);
                                                showToast('Inspiración generada');
                                            }}
                                            className="w-8 h-8 rounded-xl bg-[#2dd4bf]/10 hover:bg-[#2dd4bf]/20 border border-[#2dd4bf]/30 text-[#2dd4bf] flex items-center justify-center transition-all cursor-pointer"
                                            title="Generar resonancia creativa asistida"
                                        >
                                            <Sparkles size={15} />
                                        </button>
                                    </div>
                                </div>

                                {/* MESSAGES STREAM */}
                                <div 
                                    ref={chatContainerRef}
                                    className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 no-scrollbar relative"
                                >
                                    {(!activeThread.messages || activeThread.messages.length === 0) ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
                                            <div className="w-14 h-14 rounded-2xl border border-white/10 flex items-center justify-center mb-3 text-zinc-500 bg-white/[0.02]">
                                                <MessageCircle size={24} />
                                            </div>
                                            <h5 className="text-white text-sm font-bold font-mono">Comienza una resonancia con @{activeUserInfo.username}</h5>
                                            <p className="text-xs text-zinc-400 max-w-xs mt-1 font-mono">
                                                Comparte susurros efímeros, feedback estético y reflexiones sonoras.
                                            </p>
                                        </div>
                                    ) : (
                                        activeThread.messages.map((msg) => {
                                            const isMine = msg.sender.toLowerCase() === cleanCurrent;
                                            return (
                                                <div 
                                                    key={msg.id}
                                                    className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                                                >
                                                    <div 
                                                        className={`max-w-[85%] sm:max-w-[75%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-mono leading-relaxed shadow-sm ${
                                                            isMine 
                                                                ? 'bg-[#2dd4bf] text-black font-medium shadow-[0_4px_16px_rgba(45,212,191,0.2)]' 
                                                                : 'bg-[#15191e] border border-white/[0.08] text-zinc-200'
                                                        }`}
                                                    >
                                                        {msg.text}
                                                    </div>
                                                    <span className="text-[9px] text-zinc-500 font-mono mt-1 px-1">
                                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            );
                                        })
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* FLOATING SCROLL TO BOTTOM BUTTON */}
                                <div className="relative flex justify-center -mb-4 z-10 pointer-events-none">
                                    <button
                                        type="button"
                                        onClick={scrollToBottom}
                                        className="w-8 h-8 rounded-full bg-[#12161b] hover:bg-[#1a2028] border border-white/15 text-white shadow-xl flex items-center justify-center transition-all pointer-events-auto cursor-pointer hover:scale-105 active:scale-95"
                                        title="Bajar al último susurro"
                                    >
                                        <ArrowDown size={14} />
                                    </button>
                                </div>

                                {/* CHAT EFÍMERO INPUT BAR */}
                                <div className="p-3 sm:p-4 border-t border-white/[0.08] bg-[#0d1014]/95 shrink-0">
                                    <div className="flex items-center gap-2.5 bg-[#12161c] border border-white/10 rounded-full px-3 py-1.5 shadow-inner focus-within:border-[#2dd4bf]/50 transition-colors">
                                        {/* MIC BUTTON */}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsRecordingAudio(!isRecordingAudio);
                                                showToast(isRecordingAudio ? 'Nota de voz cancelada' : 'Grabando susurro de voz... 🎙');
                                            }}
                                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                                isRecordingAudio 
                                                    ? 'bg-rose-500 text-white animate-pulse' 
                                                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                            }`}
                                            title="Grabar susurro de voz"
                                        >
                                            <Mic size={15} />
                                        </button>

                                        {/* INPUT TEXT */}
                                        <input
                                            type="text"
                                            value={messageText}
                                            onChange={(e) => setMessageText(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleSendMessage();
                                                }
                                            }}
                                            placeholder={`Escribe un susurro efímero a ${activeUserInfo.displayName.split(' ')[0]}...`}
                                            className="flex-1 bg-transparent border-none text-white text-xs sm:text-sm placeholder-zinc-500 focus:outline-none font-mono py-1"
                                        />

                                        {/* SEND BUTTON */}
                                        <button
                                            type="button"
                                            onClick={handleSendMessage}
                                            disabled={!messageText.trim()}
                                            className="w-8 h-8 rounded-full bg-[#2dd4bf] hover:bg-[#2dd4bf]/90 text-black flex items-center justify-center transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer shrink-0"
                                            title="Enviar susurro"
                                        >
                                            <Send size={14} className="translate-x-0.5" />
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            /* EMPTY STATE */
                            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
                                <div className="w-16 h-16 rounded-2xl bg-[#2dd4bf]/10 border border-[#2dd4bf]/20 flex items-center justify-center text-[#2dd4bf] mb-3 shadow-[0_0_30px_rgba(45,212,191,0.15)]">
                                    <MessageCircle size={28} />
                                </div>
                                <h4 className="text-white text-base font-bold tracking-tight font-mono">Bandeja de Resonancias</h4>
                                <p className="text-xs text-zinc-400 max-w-sm mt-1 leading-relaxed font-mono">
                                    Selecciona una presencia o contacto para sintonizar en privado.
                                </p>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
