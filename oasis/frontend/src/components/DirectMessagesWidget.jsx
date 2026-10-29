import React, { useState, useEffect, useRef } from 'react';
import { 
    Send, X, Maximize2, ChevronLeft, Search, Edit3, 
    Smile, Mic, ImageIcon, Heart, Pin, Check, UserPlus
} from 'lucide-react';

export default function DirectMessagesWidget({
    isOpen,
    onToggle,
    activeUser,
    setActiveUser,
    initialContext = '',
    currentUser = 'anon',
    currentUserAvatar,
    publicUsers = [],
    onOpenFullScreen,
    onOpenProfile,
    accent = '#10b981',
    isNavbarHidden = false
}) {
    const cleanCurrent = (currentUser || 'anon').replace('@', '').toLowerCase();

    // ─── LOCAL STORAGE KEYS ───
    const THREADS_KEY = `oasis_direct_messages_${cleanCurrent}`;
    const FRIENDS_KEY = `oasis_friends_${cleanCurrent}`;

    const [threads, setThreads] = useState(() => {
        try {
            const saved = localStorage.getItem(THREADS_KEY);
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    });

    const [friends, setFriends] = useState(() => {
        try {
            const saved = localStorage.getItem(FRIENDS_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const [messageText, setMessageText] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isComposingNew, setIsComposingNew] = useState(false);
    const messagesEndRef = useRef(null);

    // Sync threads from localStorage when opened or refreshed
    useEffect(() => {
        const handleStorage = () => {
            try {
                const saved = localStorage.getItem(THREADS_KEY);
                if (saved) setThreads(JSON.parse(saved));
                const fSaved = localStorage.getItem(FRIENDS_KEY);
                if (fSaved) setFriends(JSON.parse(fSaved));
            } catch (_) {}
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, [THREADS_KEY, FRIENDS_KEY]);

    // Pre-fill initial context if provided
    useEffect(() => {
        if (initialContext) {
            setMessageText(initialContext);
        }
    }, [initialContext]);

    // Scroll to bottom of chat
    useEffect(() => {
        if (activeUser && isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [activeUser, isOpen, threads]);

    const saveThreads = (newThreads) => {
        setThreads(newThreads);
        try {
            localStorage.setItem(THREADS_KEY, JSON.stringify(newThreads));
        } catch (_) {}
    };

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
            'somnispiria': '/avatars/avatar_7.png'
        };
        if (explicitMap[str]) return explicitMap[str];
        let hash = 2166136261;
        for (let i = 0; i < str.length; i++) {
            hash ^= str.charCodeAt(i);
            hash = Math.imul(hash, 16777619);
        }
        return avatars[(Math.abs(hash) + idx) % avatars.length];
    };

    // Helper to get user info
    const getUserInfo = (username) => {
        const clean = (username || '').replace('@', '').toLowerCase();
        const found = publicUsers.find(u => {
            const uclean = (u.Username || u.username || '').replace('@', '').toLowerCase();
            return uclean === clean;
        });

        const rawAv = found?.avatar || found?.Avatar;
        const finalAv = (rawAv && !rawAv.includes('dicebear') && !rawAv.startsWith('/uploads/')) ? rawAv : getCuratedAvatar(clean);
        return {
            username: clean,
            displayName: found?.FullName || found?.fullName || found?.Username || found?.username || clean,
            avatar: finalAv
        };
    };

    // Format relative time like Instagram ("1 min", "20 min", "2 h", "1 d")
    const formatRelativeTime = (isoString) => {
        if (!isoString) return '';
        const diffMs = Date.now() - new Date(isoString).getTime();
        const diffMin = Math.floor(diffMs / (1000 * 60));
        if (diffMin < 1) return 'ahora';
        if (diffMin < 60) return `${diffMin} min`;
        const diffH = Math.floor(diffMin / 60);
        if (diffH < 24) return `${diffH} h`;
        const diffDays = Math.floor(diffH / 24);
        return `${diffDays} d`;
    };

    // Send a message in active thread
    const handleSendMessage = (textToSend = messageText) => {
        const trimmed = (textToSend || '').trim();
        if (!trimmed || !activeUser) return;

        const targetClean = activeUser.replace('@', '').toLowerCase();
        const currentThread = threads[targetClean] || { messages: [] };

        const newMsg = {
            id: `msg_${Date.now()}`,
            sender: cleanCurrent,
            text: trimmed,
            timestamp: new Date().toISOString()
        };

        const updatedThread = {
            ...currentThread,
            targetUser: targetClean,
            lastUpdated: new Date().toISOString(),
            lastMessage: trimmed,
            messages: [...(currentThread.messages || []), newMsg]
        };

        const updatedThreads = {
            ...threads,
            [targetClean]: updatedThread
        };

        saveThreads(updatedThreads);
        setMessageText('');
    };

    // Render link preview card if message contains a URL (like Instagram in screenshot)
    const renderMessageContent = (text, isOutgoing) => {
        const urlMatch = text.match(/(https?:\/\/[^\s]+)/g);
        if (urlMatch) {
            const url = urlMatch[0];
            const beforeUrl = text.replace(url, '').trim();
            const isShop = url.includes('shop') || url.includes('curso') || url.includes('inn3r');
            const isMeet = url.includes('meet') || url.includes('google');

            return (
                <div className="space-y-1.5">
                    {beforeUrl && <p className="leading-snug">{beforeUrl}</p>}
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-xl overflow-hidden border border-white/15 bg-black/40 hover:bg-black/60 transition-colors shadow-md group/card text-left"
                    >
                        <div className="p-2 bg-[#0095f6]/80 text-white font-mono text-[11px] truncate font-medium">
                            {url}
                        </div>
                        {isShop && (
                            <div className="relative h-28 bg-gradient-to-t from-black via-zinc-900 to-zinc-800 flex flex-col justify-end p-2.5">
                                <div className="absolute inset-0 bg-cover bg-center opacity-70" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600&auto=format&fit=crop')` }} />
                                <div className="relative z-10 drop-shadow-md">
                                    <h4 className="font-black text-sm text-white uppercase tracking-tight leading-tight">Reinterpreta tu identidad</h4>
                                    <span className="text-[10px] text-zinc-300 font-bold block mt-0.5">Ruido Interno</span>
                                </div>
                            </div>
                        )}
                        {isMeet && (
                            <div className="p-2.5 bg-zinc-900 flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">M</div>
                                <span className="text-xs text-white font-medium">Google Meet Video Call</span>
                            </div>
                        )}
                    </a>
                </div>
            );
        }
        return <p className="leading-snug break-words whitespace-pre-wrap">{text}</p>;
    };

    // Sort threads by most recent
    const threadKeys = Object.keys(threads).sort((a, b) => {
        const tA = new Date(threads[a]?.lastUpdated || 0).getTime();
        const tB = new Date(threads[b]?.lastUpdated || 0).getTime();
        return tB - tA;
    });

    const filteredThreadKeys = threadKeys.filter(key => {
        const info = getUserInfo(key);
        return info.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
               info.displayName.toLowerCase().includes(searchQuery.toLowerCase());
    });

    // Avatars for the collapsed pill (first 3 users)
    const previewAvatars = (publicUsers || [])
        .filter(u => (u.Username || u.username || '').replace('@', '').toLowerCase() !== cleanCurrent)
        .slice(0, 3)
        .map((u, idx) => {
            const uname = (u.Username || u.username || '').replace('@', '');
            const rawAv = u.avatar || u.Avatar;
            return (rawAv && !rawAv.includes('dicebear') && !rawAv.startsWith('/uploads/')) ? rawAv : getCuratedAvatar(uname, idx);
        });

    const activeThread = activeUser ? (threads[activeUser.toLowerCase()] || { messages: [] }) : null;
    const activeUserInfo = activeUser ? getUserInfo(activeUser) : null;

    // ─────────────────────────────────────────────────────────────
    // 1. COLLAPSED FLOATING PILL (Estilo Instagram Desktop & Móvil Responsivo)
    // ─────────────────────────────────────────────────────────────
    if (!isOpen) {
        const totalUnread = Object.values(threads).reduce((acc, t) => acc + (t.unread || 0), 0) || 2;
        return (
            <button
                type="button"
                onClick={onToggle}
                className={`fixed bottom-3 right-3 sm:bottom-6 sm:right-6 z-[2400] flex items-center gap-2 sm:gap-2.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full bg-[#1e2024]/95 hover:bg-[#282b31] backdrop-blur-xl border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.85)] text-white transition-all duration-300 hover:scale-105 active:scale-95 group pointer-events-auto ${
                    isNavbarHidden ? 'translate-y-24 opacity-0 pointer-events-none sm:translate-y-0 sm:opacity-100 sm:pointer-events-auto' : 'translate-y-0 opacity-100'
                }`}
                title="Abrir Mensajes Directos"
            >
                <div className="relative flex items-center justify-center">
                    <Send size={15} className="text-white group-hover:scale-110 transition-transform -rotate-12" />
                    {totalUnread > 0 && (
                        <span className="absolute -top-1.5 -right-2 min-w-[15px] h-[15px] sm:min-w-[17px] sm:h-[17px] px-1 bg-[#ff2851] text-white text-[9px] sm:text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-md">
                            {totalUnread}
                        </span>
                    )}
                </div>
                <span className="font-bold text-xs sm:text-sm tracking-tight text-white font-sans ml-0.5">Mensajes</span>
                {previewAvatars.length > 0 && (
                    <div className="flex -space-x-1.5 sm:-space-x-2 overflow-hidden items-center ml-0.5 sm:ml-1">
                        {previewAvatars.slice(0, 2).map((src, i) => (
                            <img
                                key={i}
                                src={src}
                                alt="Usuario"
                                className="inline-block w-5 h-5 sm:w-6 sm:h-6 rounded-full ring-2 ring-[#1e2024] object-cover bg-zinc-800"
                            />
                        ))}
                    </div>
                )}
            </button>
        );
    }

    // ─────────────────────────────────────────────────────────────
    // 2. EXPANDED MESSAGES POPUP WIDGET (Screenshots 2 & 3)
    // ─────────────────────────────────────────────────────────────
    return (
        <div 
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[2600] w-[calc(100vw-32px)] sm:w-[360px] h-[520px] max-h-[85vh] bg-[#141518] border border-white/10 rounded-2xl shadow-[0_24px_70px_rgba(0,0,0,0.92)] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200 pointer-events-auto select-none"
            onClick={e => e.stopPropagation()}
        >
            {/* ─── A. ACTIVE CHAT VIEW (Screenshot 3) ─── */}
            {activeUser ? (
                <div className="flex flex-col h-full w-full bg-[#141518]">
                    {/* Chat Header */}
                    <div className="px-3.5 py-3 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#18191d]/80 backdrop-blur-md">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <button
                                type="button"
                                onClick={() => setActiveUser(null)}
                                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-colors shrink-0"
                                title="Volver a mensajes"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <div 
                                className="flex items-center gap-2 cursor-pointer min-w-0 group/u"
                                onClick={() => { if (onOpenProfile) onOpenProfile(activeUserInfo?.username); }}
                                title="Ver perfil"
                            >
                                <img
                                    src={activeUserInfo?.avatar}
                                    alt={activeUserInfo?.displayName}
                                    className="w-8 h-8 rounded-full object-cover border border-white/15 shrink-0 bg-zinc-800 group-hover/u:border-accent transition-colors"
                                />
                                <span className="font-bold text-sm text-white font-mono truncate group-hover/u:text-accent transition-colors">
                                    @{activeUserInfo?.username}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                            <button
                                type="button"
                                onClick={onOpenFullScreen}
                                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                                title="Maximizar chat"
                            >
                                <Maximize2 size={15} />
                            </button>
                            <button
                                type="button"
                                onClick={onToggle}
                                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                                title="Cerrar"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Messages Scroll Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                        {(!activeThread.messages || activeThread.messages.length === 0) ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500 space-y-3">
                                <img
                                    src={activeUserInfo?.avatar}
                                    alt={activeUserInfo?.displayName}
                                    className="w-16 h-16 rounded-full object-cover border border-white/10 mx-auto"
                                />
                                <div>
                                    <h4 className="font-bold text-white text-sm">@{activeUserInfo?.username}</h4>
                                    <p className="text-xs text-zinc-400 mt-0.5">Comienza una conversación directa en Oasis</p>
                                </div>
                            </div>
                        ) : (
                            activeThread.messages.map((msg) => {
                                const isOutgoing = msg.sender === cleanCurrent;
                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex flex-col ${isOutgoing ? 'items-end' : 'items-start'}`}
                                    >
                                        <div
                                            className={`rounded-2xl px-3.5 py-2 text-sm leading-snug max-w-[82%] shadow-md select-text ${
                                                isOutgoing
                                                    ? 'bg-[#0095f6] text-white rounded-br-xs'
                                                    : 'bg-[#262626] text-zinc-100 rounded-bl-xs'
                                            }`}
                                        >
                                            {renderMessageContent(msg.text, isOutgoing)}
                                        </div>
                                        <span className="text-[9px] text-zinc-500 font-mono mt-0.5 px-1">
                                            {formatRelativeTime(msg.timestamp)}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Chat Bottom Input Bar (Screenshot 3) */}
                    <div className="p-3 border-t border-white/10 bg-[#18191d]/90 backdrop-blur-md">
                        <div className="bg-[#24252a] rounded-full px-3.5 py-1.5 flex items-center gap-2 border border-white/5 focus-within:border-white/20 transition-all shadow-inner">
                            <button
                                type="button"
                                onClick={() => setMessageText(prev => prev + ' ✨ ')}
                                className="text-zinc-400 hover:text-white transition-colors shrink-0"
                                title="Añadir emoji"
                            >
                                <Smile size={18} />
                            </button>

                            <input
                                type="text"
                                value={messageText}
                                onChange={e => setMessageText(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                                placeholder="Envía un mensaje..."
                                className="flex-1 bg-transparent border-none text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none"
                                autoFocus
                            />

                            {messageText.trim() ? (
                                <button
                                    type="button"
                                    onClick={() => handleSendMessage()}
                                    className="text-xs sm:text-sm font-bold text-[#0095f6] hover:brightness-125 px-1 transition-all"
                                >
                                    Enviar
                                </button>
                            ) : (
                                <div className="flex items-center gap-2 text-zinc-400 shrink-0">
                                    <button 
                                        type="button" 
                                        onClick={() => handleSendMessage('🎤 [Nota de voz enviada]')} 
                                        className="hover:text-white transition-colors"
                                        title="Mensaje de voz"
                                    >
                                        <Mic size={17} />
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => handleSendMessage('📷 [Imagen compartida]')} 
                                        className="hover:text-white transition-colors"
                                        title="Compartir foto"
                                    >
                                        <ImageIcon size={17} />
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => handleSendMessage('❤️')} 
                                        className="hover:text-rose-400 transition-colors"
                                        title="Enviar corazón"
                                    >
                                        <Heart size={17} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                /* ─── B. THREADS LIST VIEW (Screenshot 2) ─── */
                <div className="flex flex-col h-full w-full bg-[#141518] relative">
                    {/* Header */}
                    <div className="px-4 py-3.5 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#18191d]/80 backdrop-blur-md">
                        <h3 className="font-bold text-base text-white font-sans tracking-tight">
                            Mensajes
                        </h3>
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={onOpenFullScreen}
                                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                                title="Abrir en pantalla completa"
                            >
                                <Maximize2 size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={onToggle}
                                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                                title="Cerrar mensajes"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="px-3 pt-2.5 pb-1">
                        <div className="flex items-center gap-2 bg-[#202126] border border-white/5 rounded-xl px-3 py-1.5 text-xs text-zinc-400">
                            <Search size={14} className="text-zinc-500 shrink-0" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Buscar contactos..."
                                className="bg-transparent border-none text-xs text-white placeholder-zinc-500 focus:outline-none w-full"
                            />
                            {searchQuery && (
                                <button type="button" onClick={() => setSearchQuery('')} className="text-zinc-500 hover:text-white">
                                    <X size={13} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Conversation List */}
                    <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 no-scrollbar">
                        {isComposingNew ? (
                            <div className="p-2 space-y-2">
                                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                                    <span className="text-xs font-bold text-zinc-300">Nuevo Mensaje Para:</span>
                                    <button 
                                        type="button" 
                                        onClick={() => setIsComposingNew(false)} 
                                        className="text-xs text-zinc-400 hover:text-white font-medium"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                                <div className="space-y-1 max-h-[340px] overflow-y-auto">
                                    {publicUsers
                                        .filter(u => (u.Username || u.username || '').replace('@', '').toLowerCase() !== cleanCurrent)
                                        .filter(u => {
                                            const uname = (u.Username || u.username || '').toLowerCase();
                                            const fname = (u.FullName || u.fullName || '').toLowerCase();
                                            return uname.includes(searchQuery.toLowerCase()) || fname.includes(searchQuery.toLowerCase());
                                        })
                                        .map(u => {
                                            const uname = (u.Username || u.username || '').replace('@', '');
                                            const info = getUserInfo(uname);
                                            return (
                                                <div
                                                    key={uname}
                                                    onClick={() => {
                                                        setActiveUser(uname);
                                                        setIsComposingNew(false);
                                                    }}
                                                    className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors"
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <img src={info.avatar} className="w-9 h-9 rounded-full object-cover border border-white/10 shrink-0" />
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="font-bold text-xs text-white font-mono truncate">@{uname}</span>
                                                            <span className="text-[11px] text-zinc-400 truncate">{info.displayName}</span>
                                                        </div>
                                                    </div>
                                                    <span className="text-xs font-bold text-[#0095f6]">Chatear</span>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        ) : filteredThreadKeys.length > 0 ? (
                            filteredThreadKeys.map((key) => {
                                const th = threads[key];
                                const info = getUserInfo(key);
                                const lastMsg = th?.lastMessage || (th?.messages?.length > 0 ? th.messages[th.messages.length - 1]?.text : 'Nueva conversación');
                                const isPinned = friends.includes(key);

                                return (
                                    <div
                                        key={key}
                                        onClick={() => setActiveUser(key)}
                                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="relative shrink-0">
                                                <img
                                                    src={info.avatar}
                                                    alt={info.displayName}
                                                    className="w-12 h-12 rounded-full object-cover border border-white/10 group-hover:border-white/20 transition-colors bg-zinc-800"
                                                />
                                            </div>
                                            <div className="flex flex-col min-w-0 pr-1">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-bold text-sm text-white font-mono truncate">
                                                        @{info.username}
                                                    </span>
                                                    {isPinned && (
                                                        <Pin size={11} className="text-zinc-500 fill-zinc-500 shrink-0" />
                                                    )}
                                                </div>
                                                <p className="text-xs text-zinc-400 truncate max-w-[200px] mt-0.5">
                                                    {lastMsg} <span className="text-zinc-600 font-sans">·</span> {formatRelativeTime(th?.lastUpdated)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="p-6 text-center text-zinc-500 space-y-3 my-auto">
                                <p className="text-xs">No tienes mensajes recientes</p>
                                <button
                                    type="button"
                                    onClick={() => setIsComposingNew(true)}
                                    className="px-4 py-1.5 rounded-full bg-[#0095f6] hover:bg-[#0081d6] text-white text-xs font-bold transition-all shadow-md"
                                >
                                    Enviar primer mensaje
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Floating Compose Button at Bottom-Right (Screenshot 2) */}
                    {!isComposingNew && (
                        <button
                            type="button"
                            onClick={() => setIsComposingNew(true)}
                            className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-[#262626] hover:bg-[#333333] border border-white/10 text-white flex items-center justify-center shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95 group/btn"
                            title="Nuevo mensaje"
                        >
                            <Edit3 size={18} className="group-hover/btn:scale-110 transition-transform" />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
