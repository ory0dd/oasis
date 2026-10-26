import React, { useState, useEffect, useRef } from 'react';
import { 
    X, Send, Search, MessageCircle, UserPlus, Sparkles, 
    Check, ExternalLink, ArrowLeft, Heart, Smile
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
    accent = '#10b981'
}) {
    if (!isOpen) return null;

    const cleanCurrent = (currentUser || 'anon').replace('@', '').toLowerCase();

    // Load DM threads from localStorage
    const [threads, setThreads] = useState(() => {
        try {
            const saved = localStorage.getItem(`oasis_direct_messages_${cleanCurrent}`);
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    });

    const [activeUser, setActiveUser] = useState(initialTargetUser ? initialTargetUser.replace('@', '') : null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('chats'); // 'chats' | 'recommended'
    const [messageText, setMessageText] = useState(initialContextMessage || '');
    const messagesEndRef = useRef(null);

    // Save threads whenever they change
    const saveThreads = (newThreads) => {
        setThreads(newThreads);
        try {
            localStorage.setItem(`oasis_direct_messages_${cleanCurrent}`, JSON.stringify(newThreads));
        } catch (e) {
            console.error('Error saving direct messages:', e);
        }
    };

    // Auto-scroll to bottom of active chat
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [activeUser, threads]);

    // Handle initial target user
    useEffect(() => {
        if (initialTargetUser) {
            const targetClean = initialTargetUser.replace('@', '');
            setActiveUser(targetClean);
            if (initialContextMessage) {
                setMessageText(initialContextMessage);
            }
        }
    }, [initialTargetUser, initialContextMessage]);

    // Recommended souls / friends
    const recommendedSouls = (publicUsers || [])
        .filter(u => {
            const uname = (u.Username || u.username || '').replace('@', '').toLowerCase();
            return uname && uname !== cleanCurrent && uname !== 'anon' && !uname.startsWith('test_');
        })
        .map((u, idx) => {
            const uname = (u.Username || u.username || '').replace('@', '');
            const fullName = u.FullName || u.fullName || uname;
            const avatar = u.Avatar || u.avatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(uname)}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
            return {
                id: u.id || idx,
                username: uname,
                name: fullName.includes('@') ? uname : fullName,
                avatar,
                bio: u.Bio || u.bio || 'Explorador del Oasis Creativo'
            };
        });

    // Helper to get user info
    const getUserInfo = (username) => {
        const found = recommendedSouls.find(s => s.username.toLowerCase() === username.toLowerCase());
        if (found) return found;
        return {
            username,
            name: username,
            avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(username)}&backgroundColor=b6e3f4,c0aede,d1d4f9`,
            bio: 'Alma en el Oasis'
        };
    };

    const handleSendMessage = () => {
        if (!messageText.trim() || !activeUser) return;
        const targetClean = activeUser.toLowerCase();
        const currentThread = threads[targetClean] || {
            targetUser: activeUser,
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
        const info = getUserInfo(key);
        return info.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
               info.username.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const activeThread = activeUser ? (threads[activeUser.toLowerCase()] || { messages: [] }) : null;
    const activeUserInfo = activeUser ? getUserInfo(activeUser) : null;

    return (
        <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-md p-2 sm:p-4 select-none animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div 
                className="bg-[#121215] border border-white/10 rounded-3xl w-full max-w-4xl h-[88vh] max-h-[720px] flex overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.85)] relative"
                onClick={e => e.stopPropagation()}
            >
                {/* SIDEBAR: CONVERSACIONES Y RECOMENDADOS */}
                <div className={`w-full md:w-80 shrink-0 border-r border-white/5 flex flex-col bg-zinc-950/60 ${activeUser ? 'hidden md:flex' : 'flex'}`}>
                    
                    {/* SIDEBAR HEADER */}
                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
                                <MessageCircle size={16} />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-sm tracking-tight">Mensajes Directos</h3>
                                <p className="text-[10px] text-zinc-400 font-mono">@{cleanCurrent}</p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose}
                            className="md:hidden w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                        >
                            <X size={15} />
                        </button>
                    </div>

                    {/* SEARCH INPUT */}
                    <div className="px-4 py-2.5">
                        <div className="relative">
                            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                            <input 
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar mensajes o amigos..."
                                className="w-full bg-black/40 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-accent transition-colors"
                            />
                        </div>
                    </div>

                    {/* TABS: CHATS VS RECOMENDADOS */}
                    <div className="flex items-center gap-1 px-4 pb-2 border-b border-white/5">
                        <button
                            type="button"
                            onClick={() => setActiveTab('chats')}
                            className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                                activeTab === 'chats' 
                                    ? 'bg-white/15 text-white shadow-sm' 
                                    : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                        >
                            <span>Bandeja</span>
                            {threadKeys.length > 0 && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-accent text-black font-mono font-bold">
                                    {threadKeys.length}
                                </span>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('recommended')}
                            className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                                activeTab === 'recommended' 
                                    ? 'bg-white/15 text-white shadow-sm' 
                                    : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                        >
                            <Sparkles size={11} className="text-accent" />
                            <span>Amigos ({recommendedSouls.length})</span>
                        </button>
                    </div>

                    {/* LIST BODY */}
                    <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-1">
                        {activeTab === 'chats' ? (
                            filteredThreadKeys.length === 0 ? (
                                <div className="p-8 text-center flex flex-col items-center justify-center gap-2 text-zinc-500">
                                    <MessageCircle size={24} className="opacity-40" />
                                    <p className="text-xs font-medium">No hay conversaciones aún</p>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('recommended')}
                                        className="mt-2 px-3 py-1.5 rounded-xl bg-accent/15 border border-accent/30 text-accent text-xs font-bold hover:bg-accent/25 transition-colors"
                                    >
                                        Explorar amigos para chatear
                                    </button>
                                </div>
                            ) : (
                                filteredThreadKeys.map(key => {
                                    const thread = threads[key];
                                    const userInf = getUserInfo(key);
                                    const isSelected = activeUser?.toLowerCase() === key.toLowerCase();
                                    return (
                                        <div
                                            key={key}
                                            onClick={() => setActiveUser(key)}
                                            className={`p-2.5 rounded-2xl flex items-center gap-3 cursor-pointer transition-all ${
                                                isSelected 
                                                    ? 'bg-accent/15 border border-accent/30 text-white' 
                                                    : 'hover:bg-white/5 border border-transparent text-zinc-300'
                                            }`}
                                        >
                                            <div className="w-10 h-10 rounded-full border border-white/15 overflow-hidden shrink-0 bg-zinc-900 relative">
                                                <img 
                                                    src={userInf.avatar} 
                                                    alt={userInf.name} 
                                                    className="w-full h-full object-cover" 
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold truncate text-white">{userInf.name}</span>
                                                    <span className="text-[9px] text-zinc-500 font-mono">
                                                        {thread.lastUpdated ? new Date(thread.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                                                    {thread.lastMessage || 'Conversación iniciada'}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            )
                        ) : (
                            /* RECOMMENDED FRIENDS TAB */
                            recommendedSouls.length === 0 ? (
                                <div className="p-8 text-center text-zinc-500 text-xs">
                                    No hay otros usuarios registrados aún.
                                </div>
                            ) : (
                                recommendedSouls.map(soul => (
                                    <div
                                        key={soul.id}
                                        className="p-2.5 rounded-2xl border border-white/5 hover:border-white/15 bg-white/[0.02] hover:bg-white/[0.05] transition-all flex items-center justify-between gap-2.5 group"
                                    >
                                        <div 
                                            className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
                                            onClick={() => {
                                                setActiveUser(soul.username);
                                                setActiveTab('chats');
                                            }}
                                        >
                                            <div className="w-9 h-9 rounded-full border border-white/15 overflow-hidden shrink-0 bg-zinc-900">
                                                <img src={soul.avatar} alt={soul.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="min-w-0">
                                                <span className="text-xs font-bold text-white truncate block group-hover:text-accent transition-colors">
                                                    {soul.name}
                                                </span>
                                                <span className="text-[10px] text-zinc-400 font-mono block truncate">
                                                    @{soul.username}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setActiveUser(soul.username);
                                                setActiveTab('chats');
                                            }}
                                            className="px-2.5 py-1 rounded-xl bg-accent text-black font-black text-[10px] hover:brightness-110 transition-all flex items-center gap-1 shadow-md shrink-0"
                                            title="Enviar mensaje directo"
                                        >
                                            <Send size={10} />
                                            <span>Chatear</span>
                                        </button>
                                    </div>
                                ))
                            )
                        )}
                    </div>
                </div>

                {/* MAIN CHAT AREA */}
                <div className={`flex-1 flex-col bg-[#0e0e11] ${activeUser ? 'flex' : 'hidden md:flex'}`}>
                    {activeUser && activeUserInfo ? (
                        <>
                            {/* CHAT HEADER */}
                            <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between bg-zinc-950/40">
                                <div className="flex items-center gap-3">
                                    <button 
                                        type="button"
                                        onClick={() => setActiveUser(null)}
                                        className="md:hidden w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 flex items-center justify-center transition-colors"
                                    >
                                        <ArrowLeft size={16} />
                                    </button>
                                    <div 
                                        className="w-10 h-10 rounded-full border-2 border-accent/40 overflow-hidden shrink-0 bg-zinc-900 cursor-pointer"
                                        onClick={() => {
                                            if (onOpenProfile) onOpenProfile(activeUserInfo.username);
                                        }}
                                    >
                                        <img src={activeUserInfo.avatar} alt={activeUserInfo.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-white font-bold text-sm tracking-tight">{activeUserInfo.name}</h4>
                                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="En línea en el Oasis" />
                                        </div>
                                        <p className="text-[10px] text-zinc-400 font-mono">@{activeUserInfo.username}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {onOpenProfile && (
                                        <button
                                            type="button"
                                            onClick={() => onOpenProfile(activeUserInfo.username)}
                                            className="px-3 py-1.5 rounded-xl border border-white/10 text-zinc-300 hover:text-white hover:bg-white/5 text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1"
                                        >
                                            <span>Perfil</span>
                                            <ExternalLink size={10} />
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* MESSAGES THREAD */}
                            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 custom-scrollbar">
                                {(!activeThread.messages || activeThread.messages.length === 0) ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
                                        <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center mb-3 text-zinc-600 bg-white/[0.02]">
                                            <MessageCircle size={28} />
                                        </div>
                                        <h5 className="text-white text-sm font-bold">Comienza una conversación con {activeUserInfo.name}</h5>
                                        <p className="text-xs text-zinc-400 max-w-xs mt-1">
                                            Comparte reflexiones, ideas de proyectos o responde a sus notas en el Oasis.
                                        </p>
                                        <div className="flex flex-wrap justify-center gap-2 mt-4">
                                            {['¡Hola! 👋', 'Me gustó tu publicación ✨', '¿En qué estás trabajando hoy? 💡'].map(preset => (
                                                <button
                                                    key={preset}
                                                    type="button"
                                                    onClick={() => setMessageText(preset)}
                                                    className="px-3 py-1 rounded-full text-[11px] bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
                                                >
                                                    {preset}
                                                </button>
                                            ))}
                                        </div>
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
                                                    className={`max-w-[80%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-md ${
                                                        isMine 
                                                            ? 'bg-accent text-black font-medium rounded-br-none' 
                                                            : 'bg-zinc-800/90 border border-white/10 text-white rounded-bl-none'
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

                            {/* CHAT INPUT */}
                            <div className="p-3 sm:p-4 border-t border-white/5 bg-zinc-950/60">
                                <div className="flex items-center gap-2">
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
                                        placeholder={`Escribe un mensaje a @${activeUserInfo.username}...`}
                                        className="flex-1 bg-black/50 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs sm:text-sm placeholder-zinc-500 focus:outline-none focus:border-accent transition-colors shadow-inner"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleSendMessage}
                                        disabled={!messageText.trim()}
                                        className="w-11 h-11 rounded-2xl bg-accent text-black font-bold flex items-center justify-center hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-lg shrink-0"
                                        title="Enviar mensaje (Enter)"
                                    >
                                        <Send size={16} />
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        /* EMPTY CHAT SELECTION SCREEN */
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
                            <div className="w-20 h-20 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-4 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                                <MessageCircle size={36} />
                            </div>
                            <h4 className="text-white text-base font-bold tracking-tight">Tus Mensajes Directos</h4>
                            <p className="text-xs text-zinc-400 max-w-sm mt-1 leading-relaxed">
                                Selecciona una conversación de tu bandeja o elige a un amigo recomendado para comenzar a platicar.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
