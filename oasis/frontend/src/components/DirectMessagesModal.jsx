import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
    X, Send, Search, MessageCircle, UserPlus, Sparkles, 
    Check, ExternalLink, ArrowLeft, Heart, UserCheck, UserX,
    Clock, Users, ShieldAlert, CheckCircle2, ArrowDown, Mic,
    Paperclip, Moon, ChevronRight, Hash, Compass, Plus, User
} from 'lucide-react';

export default function DirectMessagesModal({
    isOpen,
    onClose,
    currentUser = 'anon',
    currentUserAvatar,
    publicUsers = [],
    initialTargetUser = null,
    initialContextMessage = '',
    onOpenProfile,
    accent = '#84396F'
}) {
    if (!isOpen) return null;

    const cleanCurrent = (currentUser || 'anon').replace('@', '').toLowerCase();

    // ─── LOCAL STORAGE KEYS ───
    const THREADS_KEY = `oasis_direct_messages_${cleanCurrent}`;
    const FRIENDS_KEY = `oasis_friends_${cleanCurrent}`;
    const ZEN_KEY = `oasis_dm_zen_mode_${cleanCurrent}`;

    const getCuratedAvatar = (username, idx = 0) => {
        const avatars = [
            '/avatars/avatar_1.png', '/avatars/avatar_2.png', '/avatars/avatar_3.jpg',
            '/avatars/avatar_4.jpg', '/avatars/avatar_5.png', '/avatars/avatar_6.png',
            '/avatars/avatar_7.png', '/avatars/avatar_8.png', '/avatars/avatar_9.png',
            '/avatars/avatar_10.png'
        ];
        const str = String(username || '').toLowerCase().replace('@', '').trim();
        const explicitMap = {
            'ory11': '/avatars/avatar_1.png', 'observador1': '/avatars/avatar_2.png',
            'ghfd3': '/avatars/avatar_3.jpg', 'kiotest': '/avatars/avatar_4.jpg',
            'testuser_soul': '/avatars/avatar_5.png', 'jss93': '/avatars/avatar_6.png',
            'somnispiria': '/avatars/avatar_7.png', 'ajdlsmaba': '/avatars/avatar_8.png',
            'vacio1': '/avatars/avatar_9.png', 'tutio': '/avatars/avatar_10.png',
            'second_save': '/avatars/avatar_2.png'
        };
        if (explicitMap[str]) return explicitMap[str];
        let hash = 2166136261;
        for (let i = 0; i < str.length; i++) {
            hash ^= str.charCodeAt(i);
            hash = Math.imul(hash, 16777619);
        }
        return avatars[(Math.abs(hash) + idx) % avatars.length];
    };

    // ─── FILTER REAL USERS ONLY (EXCLUDE CLINICAL PATIENT IDS & SELF) ───
    const realUsers = useMemo(() => {
        return (publicUsers || []).filter(u => {
            const uname = (u.Username || u.username || '').replace('@', '').toLowerCase();
            if (!uname || uname === cleanCurrent || uname === 'anon' || uname.startsWith('test_')) return false;
            // Purge mock users
            if (uname === 'luna_veil' || uname === 'kairo' || uname === 'solaris') return false;
            // Strict clinical privacy: hide internal test/patient accounts
            if (uname.includes('patient') || uname.includes('observador') || uname === 'somni') return false;
            return true;
        }).map((u, idx) => {
            const uname = (u.Username || u.username || '').replace('@', '');
            const rawAv = u.Avatar || u.avatar;
            const avatar = (rawAv && !rawAv.includes('dicebear') && !rawAv.includes('ba90867f') && !rawAv.startsWith('/uploads/') && !rawAv.startsWith('uploads/'))
                ? rawAv
                : getCuratedAvatar(uname, idx);
            return {
                id: u.id || idx,
                username: uname,
                displayName: u.FullName || u.fullName || uname,
                avatar,
                bio: u.Bio || u.bio || 'Creador en Oasis',
                categoryTag: (u.Role || u.role) === 'creator' ? '#creador' : '#frecuencia',
                isOnline: true,
                vibe: 'En sintonía con Oasis'
            };
        });
    }, [publicUsers, cleanCurrent]);

    // ─── STATE INITIALIZERS (CLEANED OF ANY FAKE MOCKUP CONTACTS) ───
    const [threads, setThreads] = useState(() => {
        try {
            const saved = localStorage.getItem(THREADS_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                // Purge any residual mock contacts
                delete parsed['luna_veil'];
                delete parsed['kairo'];
                delete parsed['solaris'];
                return parsed;
            }
            return {};
        } catch {
            return {};
        }
    });

    const [friends, setFriends] = useState(() => {
        try {
            const saved = localStorage.getItem(FRIENDS_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                return parsed.filter(f => f !== 'luna_veil' && f !== 'kairo' && f !== 'solaris');
            }
            return [];
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

    // Initialize active user
    const [activeUser, setActiveUser] = useState(() => {
        if (initialTargetUser) return initialTargetUser.replace('@', '').toLowerCase();
        // If there are existing real threads, select the most recent one
        const threadList = Object.keys(threads);
        if (threadList.length > 0) return threadList[0];
        // Otherwise, if real users exist, pick the first real user
        if (realUsers.length > 0) return realUsers[0].username;
        return null;
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

    // Purge old mock data from localStorage once
    useEffect(() => {
        try {
            const savedThreads = localStorage.getItem(THREADS_KEY);
            if (savedThreads && (savedThreads.includes('luna_veil') || savedThreads.includes('kairo') || savedThreads.includes('solaris'))) {
                const parsed = JSON.parse(savedThreads);
                delete parsed['luna_veil'];
                delete parsed['kairo'];
                delete parsed['solaris'];
                localStorage.setItem(THREADS_KEY, JSON.stringify(parsed));
                setThreads(parsed);
            }
            const savedFriends = localStorage.getItem(FRIENDS_KEY);
            if (savedFriends && (savedFriends.includes('luna_veil') || savedFriends.includes('kairo') || savedFriends.includes('solaris'))) {
                const parsedFriends = JSON.parse(savedFriends).filter(f => f !== 'luna_veil' && f !== 'kairo' && f !== 'solaris');
                localStorage.setItem(FRIENDS_KEY, JSON.stringify(parsedFriends));
                setFriends(parsedFriends);
            }
        } catch {}
    }, []);

    const getUserMeta = (username) => {
        if (!username) return { username: 'anon', displayName: 'Explorador', avatar: getCuratedAvatar('anon'), categoryTag: '#obra' };
        const clean = username.replace('@', '').toLowerCase();
        const foundReal = realUsers.find(r => r.username.toLowerCase() === clean);
        if (foundReal) return foundReal;
        return {
            username: clean,
            displayName: clean,
            avatar: getCuratedAvatar(clean),
            categoryTag: '#frecuencia',
            isOnline: true,
            vibe: 'En sintonía con Oasis'
        };
    };

    const handleSendMessage = () => {
        if (!messageText.trim() || !activeUser) return;
        const targetClean = activeUser.toLowerCase();
        const meta = getUserMeta(activeUser);

        const currentThread = threads[targetClean] || {
            targetUser: activeUser,
            displayName: meta.displayName,
            avatar: meta.avatar,
            categoryTag: meta.categoryTag,
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

    // Real users matching search (for starting new chats)
    const filteredSearchUsers = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const q = searchQuery.toLowerCase().replace('@', '');
        return realUsers.filter(u => 
            u.username.toLowerCase().includes(q) || 
            u.displayName.toLowerCase().includes(q)
        );
    }, [searchQuery, realUsers]);

    const activeUserInfo = activeUser ? getUserMeta(activeUser) : null;
    const activeThread = activeUser ? (threads[activeUser.toLowerCase()] || { messages: [] }) : null;

    return (
        <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 select-none animate-in fade-in duration-150"
            onClick={onClose}
        >
            <div 
                className="bg-[#0f1013] border border-white/[0.08] rounded-[24px] sm:rounded-[28px] w-full max-w-5xl h-[88vh] max-h-[740px] flex flex-col overflow-hidden shadow-[0_25px_80px_rgba(0,0,0,0.92)] relative animate-in zoom-in-95 duration-150"
                onClick={e => e.stopPropagation()}
            >
                {/* TOAST FEEDBACK */}
                {toastMessage && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-[#181a1f] border border-white/10 text-white text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top duration-200">
                        <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                        <span>{toastMessage}</span>
                    </div>
                )}

                {/* MODAL TOP HEADER (OPACA Y MATE) */}
                <div className="px-5 sm:px-6 py-3.5 border-b border-white/[0.07] flex items-center justify-between shrink-0 bg-[#121317]">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-300">
                            <MessageCircle size={16} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-white font-bold text-sm tracking-tight">
                                    Mensajes & Resonancias
                                </h3>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            </div>
                            <p className="text-[11px] text-zinc-400 font-mono tracking-wide">
                                @{cleanCurrent} // frecuencia privada
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* MODO ZEN BUTTON */}
                        <button
                            type="button"
                            onClick={toggleZenMode}
                            className={`px-3 py-1.5 rounded-full text-xs font-mono font-medium transition-all flex items-center gap-1.5 border ${
                                zenMode 
                                    ? 'bg-white/15 text-white border-white/20' 
                                    : 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border-white/[0.08]'
                            }`}
                            title="Activar modo concentración silencioso"
                        >
                            <Moon size={12} className={zenMode ? 'text-amber-300' : 'text-zinc-400'} />
                            <span>Modo Zen</span>
                        </button>

                        {/* CLOSE BUTTON */}
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                            title="Cerrar (Esc)"
                        >
                            <X size={15} />
                        </button>
                    </div>
                </div>

                {/* MODAL MAIN BODY: 2-COLUMN LAYOUT */}
                <div className="flex-1 flex overflow-hidden min-h-0 flex-col md:flex-row">
                    
                    {/* LEFT COLUMN (SIDEBAR) */}
                    <div className={`w-full md:w-[340px] lg:w-[360px] shrink-0 border-r border-white/[0.07] flex flex-col bg-[#0b0c0f] ${activeUser ? 'hidden md:flex' : 'flex h-full'}`}>
                        
                        {/* SEARCH INPUT */}
                        <div className="p-3.5 pb-2">
                            <div className="relative">
                                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                                <input 
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Buscar presencia o @usuario..."
                                    className="w-full bg-[#14151a] border border-white/[0.08] rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/25 transition-colors font-mono"
                                />
                            </div>
                        </div>

                        {/* PRESENCIA AMBIENTAL (USUARIOS REALES) */}
                        <div className="px-4 py-2 border-b border-white/[0.06]">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-mono tracking-wider uppercase text-zinc-400 font-bold">
                                    PRESENCIA AMBIENTAL
                                </span>
                                <span className="text-[9px] font-mono text-zinc-500">
                                    COMUNIDAD
                                </span>
                            </div>

                            {/* HORIZONTAL VIBE BUBBLES */}
                            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
                                {/* TU VIBE BUTTON */}
                                <div 
                                    onClick={() => {
                                        const customVibe = prompt('Escribe tu estado de presencia o vibe:', 'Esculpiendo calma en la sobreinformación ✨');
                                        if (customVibe) showToast('Vibe ambiental actualizado');
                                    }}
                                    className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group"
                                >
                                    <div className="w-10 h-10 rounded-xl border border-dashed border-white/20 group-hover:border-white/40 flex items-center justify-center text-zinc-400 group-hover:text-white transition-all bg-white/[0.02]">
                                        <Plus size={15} />
                                    </div>
                                    <span className="text-[10px] font-mono text-zinc-400 group-hover:text-white transition-colors truncate max-w-[48px]">
                                        Tu vibe
                                    </span>
                                </div>

                                {/* REAL USERS VIBES */}
                                {realUsers.slice(0, 10).map(contact => (
                                    <div 
                                        key={contact.username}
                                        onClick={() => {
                                            setActiveUser(contact.username);
                                            setSearchQuery('');
                                        }}
                                        className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group"
                                        title={`@${contact.username} - ${contact.displayName}`}
                                    >
                                        <div className="w-10 h-10 rounded-xl p-0.5 relative group-hover:scale-105 transition-transform bg-zinc-900 border border-white/[0.08]">
                                            <img 
                                                src={contact.avatar} 
                                                alt={contact.displayName} 
                                                className="w-full h-full object-cover rounded-[10px]" 
                                            />
                                            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 border border-black" />
                                        </div>
                                        <span className="text-[10px] font-mono text-zinc-400 group-hover:text-white transition-colors truncate max-w-[50px]">
                                            {contact.username}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* SUB-TABS: BANDEJA | RESONANCIAS */}
                        <div className="flex items-center gap-1 px-3 py-2 border-b border-white/[0.06]">
                            <button
                                type="button"
                                onClick={() => setSubTab('bandeja')}
                                className={`flex-1 py-1.5 rounded-lg text-[11px] font-mono font-medium transition-all flex items-center justify-center gap-1 ${
                                    subTab === 'bandeja' 
                                        ? 'bg-white/10 text-white border border-white/10 shadow-sm' 
                                        : 'text-zinc-400 hover:text-zinc-200'
                                }`}
                            >
                                <span>Bandeja</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setSubTab('resonancias')}
                                className={`flex-1 py-1.5 rounded-lg text-[11px] font-mono font-medium transition-all flex items-center justify-center gap-1.5 ${
                                    subTab === 'resonancias' 
                                        ? 'bg-white/10 text-white border border-white/10 shadow-sm' 
                                        : 'text-zinc-400 hover:text-zinc-200'
                                }`}
                            >
                                <span>Comunidad ({realUsers.length})</span>
                            </button>
                        </div>

                        {/* CONVERSATION THREAD LIST & SEARCH RESULTS */}
                        <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-1">
                            {/* SEARCH RESULTS DROPDOWN */}
                            {searchQuery.trim() !== '' && (
                                <div className="mb-2 pb-2 border-b border-white/[0.06]">
                                    <p className="text-[10px] font-mono uppercase text-zinc-400 px-2 py-1">Usuarios encontrados</p>
                                    {filteredSearchUsers.length === 0 ? (
                                        <p className="text-xs text-zinc-500 px-2 py-2">No se encontraron usuarios</p>
                                    ) : (
                                        filteredSearchUsers.map(u => (
                                            <div
                                                key={u.username}
                                                onClick={() => {
                                                    setActiveUser(u.username);
                                                    setSearchQuery('');
                                                }}
                                                className="p-2 rounded-xl flex items-center gap-2.5 cursor-pointer hover:bg-white/[0.06] transition-colors"
                                            >
                                                <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10 shrink-0 bg-zinc-900">
                                                    <img src={u.avatar} alt={u.displayName} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs font-bold text-white font-mono truncate">{u.displayName}</p>
                                                    <p className="text-[10px] text-zinc-400 font-mono">@{u.username}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {subTab === 'bandeja' ? (
                                filteredThreadKeys.length === 0 ? (
                                    <div className="p-6 text-center flex flex-col items-center justify-center gap-2 text-zinc-500">
                                        <MessageCircle size={22} className="opacity-40" />
                                        <p className="text-xs font-medium text-zinc-400">Sin mensajes aún</p>
                                        <p className="text-[11px] text-zinc-500 max-w-[200px]">
                                            Selecciona un usuario de la lista superior para iniciar una conversación privada.
                                        </p>
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
                                                className={`p-2.5 rounded-xl flex items-center gap-3 cursor-pointer transition-all border ${
                                                    isSelected 
                                                        ? 'bg-white/[0.08] border-white/20 text-white shadow-sm' 
                                                        : 'hover:bg-white/[0.03] border-transparent text-zinc-300'
                                                }`}
                                            >
                                                {/* AVATAR SQUIRCLE */}
                                                <div className="w-10 h-10 rounded-xl border border-white/10 overflow-hidden shrink-0 bg-zinc-900 relative">
                                                    <img 
                                                        src={meta.avatar} 
                                                        alt={meta.displayName} 
                                                        className="w-full h-full object-cover" 
                                                    />
                                                </div>

                                                {/* BODY */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-1">
                                                        <span className="text-xs font-bold text-white font-mono truncate">
                                                            {meta.displayName}
                                                        </span>
                                                        <span className="text-[10px] text-zinc-500 font-mono shrink-0">
                                                            {thread.lastUpdated ? new Date(thread.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'ahora'}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-zinc-400 truncate mt-0.5 font-mono">
                                                        {thread.lastMessage || 'Conversación iniciada'}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )
                            ) : (
                                /* COMUNIDAD TAB */
                                <div className="space-y-1">
                                    {realUsers.map(u => (
                                        <div
                                            key={u.username}
                                            onClick={() => setActiveUser(u.username)}
                                            className={`p-2 rounded-xl flex items-center gap-2.5 cursor-pointer transition-colors border ${
                                                activeUser?.toLowerCase() === u.username.toLowerCase()
                                                    ? 'bg-white/[0.08] border-white/20'
                                                    : 'hover:bg-white/[0.04] border-transparent'
                                            }`}
                                        >
                                            <div className="w-9 h-9 rounded-xl overflow-hidden border border-white/10 shrink-0 bg-zinc-900">
                                                <img src={u.avatar} alt={u.displayName} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-bold text-white font-mono truncate">{u.displayName}</p>
                                                <p className="text-[10px] text-zinc-400 font-mono truncate">@{u.username}</p>
                                            </div>
                                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-400 shrink-0">
                                                Conectar
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>

                    {/* RIGHT COLUMN (ACTIVE CONVERSATION) */}
                    <div className={`flex-1 flex flex-col bg-[#0c0d10] ${activeUser ? 'flex h-full' : 'hidden md:flex'}`}>
                        {activeUser && activeUserInfo ? (
                            <>
                                {/* ACTIVE CHAT TOP BAR */}
                                <div className="px-5 py-3 border-b border-white/[0.07] flex items-center justify-between bg-[#111216] shrink-0">
                                    <div className="flex items-center gap-3">
                                        <button 
                                            type="button"
                                            onClick={() => setActiveUser(null)}
                                            className="md:hidden w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 flex items-center justify-center transition-colors"
                                            title="Volver a la lista"
                                        >
                                            <ArrowLeft size={16} />
                                        </button>

                                        <div 
                                            className="w-9 h-9 rounded-xl border border-white/15 overflow-hidden shrink-0 bg-zinc-900 cursor-pointer"
                                            onClick={() => {
                                                if (onOpenProfile) onOpenProfile(activeUserInfo.username);
                                            }}
                                        >
                                            <img src={activeUserInfo.avatar} alt={activeUserInfo.displayName} className="w-full h-full object-cover" />
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-white font-bold text-xs sm:text-sm tracking-tight font-mono">
                                                    {activeUserInfo.displayName}
                                                </h4>
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                            </div>
                                            <p className="text-[10px] text-zinc-400 font-mono">
                                                @{activeUserInfo.username} // conectado
                                            </p>
                                        </div>
                                    </div>

                                    {/* ACTION ICONS */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (onOpenProfile) onOpenProfile(activeUserInfo.username);
                                            }}
                                            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white text-[11px] font-mono flex items-center gap-1.5 transition-all cursor-pointer"
                                            title="Ver perfil de usuario"
                                        >
                                            <User size={12} />
                                            <span className="hidden sm:inline">Ver Perfil</span>
                                        </button>
                                    </div>
                                </div>

                                {/* MESSAGES STREAM (OPACA, MATE, ELEGANTE) */}
                                <div 
                                    ref={chatContainerRef}
                                    className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 no-scrollbar relative"
                                >
                                    {(!activeThread.messages || activeThread.messages.length === 0) ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
                                            <div className="w-12 h-12 rounded-xl border border-white/10 flex items-center justify-center mb-3 text-zinc-500 bg-white/[0.02]">
                                                <MessageCircle size={20} />
                                            </div>
                                            <h5 className="text-white text-xs sm:text-sm font-bold font-mono">Comienza una conversación con @{activeUserInfo.username}</h5>
                                            <p className="text-[11px] text-zinc-400 max-w-xs mt-1 font-mono">
                                                Comparte notas, ideas y feedback directamente en privado.
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
                                                    {/* BURBUJA DE MENSAJE: MATE OSCURA OPACA */}
                                                    <div 
                                                        className={`max-w-[85%] sm:max-w-[75%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-mono leading-relaxed shadow-sm ${
                                                            isMine 
                                                                ? 'bg-[#1e2025] border border-white/[0.12] text-zinc-100' 
                                                                : 'bg-[#131417] border border-white/[0.06] text-zinc-300'
                                                        }`}
                                                    >
                                                        {msg.text}
                                                    </div>
                                                    <span className="text-[9px] text-zinc-600 font-mono mt-1 px-1">
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
                                        className="w-7 h-7 rounded-full bg-[#181a1f] hover:bg-[#22252c] border border-white/10 text-zinc-300 shadow-xl flex items-center justify-center transition-all pointer-events-auto cursor-pointer"
                                        title="Bajar al último mensaje"
                                    >
                                        <ArrowDown size={13} />
                                    </button>
                                </div>

                                {/* CHAT INPUT BAR (OPACA Y MATE) */}
                                <div className="p-3 sm:p-4 border-t border-white/[0.07] bg-[#101115] shrink-0">
                                    <div className="flex items-center gap-2.5 bg-[#16171c] border border-white/[0.08] rounded-full px-3 py-1.5 shadow-inner focus-within:border-white/20 transition-colors">
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
                                            placeholder={`Escribe un mensaje privado a ${activeUserInfo.displayName.split(' ')[0]}...`}
                                            className="flex-1 bg-transparent border-none text-white text-xs sm:text-sm placeholder-zinc-500 focus:outline-none font-mono py-1 px-1"
                                        />

                                        {/* SEND BUTTON (MATE, OPACA, NO NEÓN) */}
                                        <button
                                            type="button"
                                            onClick={handleSendMessage}
                                            disabled={!messageText.trim()}
                                            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all border border-white/10 active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer shrink-0"
                                            title="Enviar mensaje"
                                        >
                                            <Send size={13} className="translate-x-0.5" />
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            /* EMPTY STATE */
                            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
                                <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-zinc-400 mb-3">
                                    <MessageCircle size={24} />
                                </div>
                                <h4 className="text-white text-sm font-bold tracking-tight font-mono">Bandeja de Mensajes</h4>
                                <p className="text-xs text-zinc-400 max-w-sm mt-1 leading-relaxed font-mono">
                                    Selecciona un usuario de la lista para iniciar una conversación privada.
                                </p>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
