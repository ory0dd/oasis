import React, { useState, useEffect, useRef } from 'react';
import { 
    X, Send, Search, MessageCircle, UserPlus, Sparkles, 
    Check, ExternalLink, ArrowLeft, Heart, UserCheck, UserX,
    Clock, Users, ShieldAlert, CheckCircle2
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

    // ─── LOCAL STORAGE KEYS ───
    const THREADS_KEY = `oasis_direct_messages_${cleanCurrent}`;
    const FRIENDS_KEY = `oasis_friends_${cleanCurrent}`;
    const SENT_KEY = `oasis_sent_requests_${cleanCurrent}`;
    const RECEIVED_KEY = `oasis_received_requests_${cleanCurrent}`;
    const GLOBAL_FRIENDS_KEY = `oasis_global_friendship_store`;

    // ─── STATE INITIALIZERS ───
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

    const [sentRequests, setSentRequests] = useState(() => {
        try {
            const saved = localStorage.getItem(SENT_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const [receivedRequests, setReceivedRequests] = useState(() => {
        try {
            const saved = localStorage.getItem(RECEIVED_KEY);
            if (saved) return JSON.parse(saved);
            
            // Si es la primera vez que se abre, sembramos 1 o 2 solicitudes de ejemplo
            // a partir de usuarios públicos existentes para permitir probar "Aceptar" y "Negar" de inmediato.
            const candidates = (publicUsers || [])
                .map(u => (u.Username || u.username || '').replace('@', '').toLowerCase())
                .filter(u => u && u !== cleanCurrent && u !== 'anon' && !u.startsWith('test_'));
            
            const seed = candidates.slice(0, 2);
            if (seed.length > 0) {
                localStorage.setItem(RECEIVED_KEY, JSON.stringify(seed));
                return seed;
            }
            return [];
        } catch {
            return [];
        }
    });

    const [activeUser, setActiveUser] = useState(initialTargetUser ? initialTargetUser.replace('@', '') : null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState(initialTargetUser ? 'chats' : 'chats'); // 'chats' | 'requests' | 'discover'
    const [messageText, setMessageText] = useState(initialContextMessage || '');
    const [toastMessage, setToastMessage] = useState(null);
    const messagesEndRef = useRef(null);

    // Feedback Toast helper
    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3500);
    };

    // Save helpers
    const saveThreads = (newThreads) => {
        setThreads(newThreads);
        try {
            localStorage.setItem(THREADS_KEY, JSON.stringify(newThreads));
        } catch (e) {
            console.error('Error saving direct messages:', e);
        }
    };

    const saveFriends = (newList) => {
        setFriends(newList);
        try {
            localStorage.setItem(FRIENDS_KEY, JSON.stringify(newList));
        } catch (e) {
            console.error('Error saving friends:', e);
        }
    };

    const saveSentRequests = (newList) => {
        setSentRequests(newList);
        try {
            localStorage.setItem(SENT_KEY, JSON.stringify(newList));
        } catch (e) {
            console.error('Error saving sent requests:', e);
        }
    };

    const saveReceivedRequests = (newList) => {
        setReceivedRequests(newList);
        try {
            localStorage.setItem(RECEIVED_KEY, JSON.stringify(newList));
        } catch (e) {
            console.error('Error saving received requests:', e);
        }
    };

    // Auto-scroll to bottom of active chat
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [activeUser, threads]);

    // Handle Escape key to go back or close
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' || e.key === 'Esc') {
                e.preventDefault();
                if (activeUser) {
                    setActiveUser(null);
                } else {
                    onClose();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeUser, onClose]);

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

    // Available users list - formatted strictly with USERNAME (no full names)
    const communityUsers = (publicUsers || [])
        .filter(u => {
            const uname = (u.Username || u.username || '').replace('@', '').toLowerCase();
            return uname && uname !== cleanCurrent && uname !== 'anon' && !uname.startsWith('test_');
        })
        .map((u, idx) => {
            const uname = (u.Username || u.username || '').replace('@', '');
            const avatar = u.Avatar || u.avatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(uname)}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
            return {
                id: u.id || idx,
                username: uname,
                avatar,
                bio: u.Bio || u.bio || 'Creador en el Oasis'
            };
        });

    // Helper to get user info by username
    const getUserInfo = (username) => {
        const found = communityUsers.find(s => s.username.toLowerCase() === username.toLowerCase());
        if (found) return found;
        return {
            username: username.replace('@', ''),
            avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(username)}&backgroundColor=b6e3f4,c0aede,d1d4f9`,
            bio: 'Usuario de Oasis'
        };
    };

    // ─── FRIENDSHIP ACTIONS ───
    const handleSendFriendRequest = (targetUsername) => {
        const targetClean = targetUsername.replace('@', '').toLowerCase();
        if (targetClean === cleanCurrent) return;

        if (friends.includes(targetClean)) {
            showToast(`Ya eres amigo de @${targetClean}`);
            return;
        }

        if (sentRequests.includes(targetClean)) {
            showToast(`Ya enviaste una solicitud a @${targetClean}`);
            return;
        }

        // Si el otro usuario ya nos había enviado solicitud, al enviarle solicitud se auto-acepta la amistad
        if (receivedRequests.includes(targetClean)) {
            handleAcceptRequest(targetClean);
            return;
        }

        const newSent = [...sentRequests, targetClean];
        saveSentRequests(newSent);

        // Actualizar almacenamiento global para sincronizar con la otra sesión
        try {
            const globalRaw = localStorage.getItem(GLOBAL_FRIENDS_KEY);
            const globalStore = globalRaw ? JSON.parse(globalRaw) : {};
            if (!globalStore[targetClean]) globalStore[targetClean] = { received: [], friends: [] };
            if (!globalStore[targetClean].received.includes(cleanCurrent)) {
                globalStore[targetClean].received.push(cleanCurrent);
            }
            localStorage.setItem(GLOBAL_FRIENDS_KEY, JSON.stringify(globalStore));
        } catch (e) {
            console.error(e);
        }

        showToast(`Solicitud de amistad enviada a @${targetClean}`);
    };

    const handleCancelSentRequest = (targetUsername) => {
        const targetClean = targetUsername.replace('@', '').toLowerCase();
        const newSent = sentRequests.filter(u => u !== targetClean);
        saveSentRequests(newSent);
        showToast(`Solicitud a @${targetClean} cancelada`);
    };

    const handleAcceptRequest = (targetUsername) => {
        const targetClean = targetUsername.replace('@', '').toLowerCase();
        
        // Quitar de recibidas
        const newReceived = receivedRequests.filter(u => u !== targetClean);
        saveReceivedRequests(newReceived);

        // Agregar a amigos si no está
        if (!friends.includes(targetClean)) {
            const newFriends = [...friends, targetClean];
            saveFriends(newFriends);
        }

        // Quitar de enviadas si estaba
        if (sentRequests.includes(targetClean)) {
            const newSent = sentRequests.filter(u => u !== targetClean);
            saveSentRequests(newSent);
        }

        showToast(`¡Ahora eres amigo de @${targetClean}! Ya pueden chatear.`);
    };

    const handleRejectRequest = (targetUsername) => {
        const targetClean = targetUsername.replace('@', '').toLowerCase();
        const newReceived = receivedRequests.filter(u => u !== targetClean);
        saveReceivedRequests(newReceived);
        showToast(`Solicitud de @${targetClean} rechazada`);
    };

    const isFriend = (username) => {
        return friends.includes(username.replace('@', '').toLowerCase());
    };

    const isRequestSent = (username) => {
        return sentRequests.includes(username.replace('@', '').toLowerCase());
    };

    const isRequestReceived = (username) => {
        return receivedRequests.includes(username.replace('@', '').toLowerCase());
    };

    // ─── CHAT ACTIONS ───
    const handleSendMessage = () => {
        if (!messageText.trim() || !activeUser) return;
        const targetClean = activeUser.toLowerCase();

        // Validar amistad antes de chatear
        if (!isFriend(targetClean)) {
            showToast(`Debes enviar y tener aceptada una solicitud de amistad con @${targetClean} para enviar mensajes.`);
            return;
        }

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
        return key.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const filteredCommunity = communityUsers.filter(u => {
        return u.username.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const activeThread = activeUser ? (threads[activeUser.toLowerCase()] || { messages: [] }) : null;
    const activeUserInfo = activeUser ? getUserInfo(activeUser) : null;
    const activeUserIsFriend = activeUser ? isFriend(activeUser) : false;
    const activeUserRequestSent = activeUser ? isRequestSent(activeUser) : false;
    const activeUserRequestReceived = activeUser ? isRequestReceived(activeUser) : false;

    return (
        <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 select-none animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div 
                className="bg-[#111114] border border-white/10 rounded-3xl w-full max-w-4xl h-[88vh] max-h-[720px] flex overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.9)] relative flex-col md:flex-row"
                onClick={e => e.stopPropagation()}
            >
                {/* ALWAYS-VISIBLE CLOSE BUTTON ON TOP RIGHT */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-3.5 right-3.5 z-50 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-zinc-300 hover:text-white flex items-center justify-center transition-all shadow-lg pointer-events-auto"
                    title="Cerrar mensajes (Esc)"
                >
                    <X size={16} />
                </button>

                {/* TOAST FEEDBACK NOTIFICATION */}
                {toastMessage && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-zinc-900 border border-white/15 text-white text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top duration-200">
                        <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                        <span>{toastMessage}</span>
                    </div>
                )}

                {/* ─── SIDEBAR: CONVERSACIONES, SOLICITUDES Y COMUNIDAD ─── */}
                <div className={`w-full md:w-80 shrink-0 border-r border-white/5 flex flex-col bg-zinc-950/70 ${activeUser ? 'hidden md:flex' : 'flex h-full'}`}>
                    
                    {/* SIDEBAR HEADER */}
                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
                                <MessageCircle size={16} />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-sm tracking-tight">Mensajes</h3>
                                <p className="text-[11px] text-zinc-400 font-mono">@{cleanCurrent}</p>
                            </div>
                        </div>
                        <button 
                            type="button"
                            onClick={onClose}
                            className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                            title="Cerrar mensajes (Esc)"
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
                                placeholder="Buscar por @usuario..."
                                className="w-full bg-black/40 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-accent transition-colors font-mono"
                            />
                        </div>
                    </div>

                    {/* TABS: BANDEJA | SOLICITUDES | COMUNIDAD */}
                    <div className="flex items-center gap-1 px-3 pb-2 border-b border-white/5">
                        <button
                            type="button"
                            onClick={() => setActiveTab('chats')}
                            className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
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
                            onClick={() => setActiveTab('requests')}
                            className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 relative ${
                                activeTab === 'requests' 
                                    ? 'bg-white/15 text-white shadow-sm' 
                                    : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                        >
                            <UserPlus size={11} className={receivedRequests.length > 0 ? "text-amber-400" : ""} />
                            <span>Solicitudes</span>
                            {receivedRequests.length > 0 && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-400 text-black font-mono font-bold animate-pulse">
                                    {receivedRequests.length}
                                </span>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('discover')}
                            className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
                                activeTab === 'discover' 
                                    ? 'bg-white/15 text-white shadow-sm' 
                                    : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                        >
                            <Users size={11} className="text-accent" />
                            <span>Explorar</span>
                        </button>
                    </div>

                    {/* LIST BODY */}
                    <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-1">
                        
                        {/* ── TAB 1: BANDEJA DE CHATS ── */}
                        {activeTab === 'chats' && (
                            filteredThreadKeys.length === 0 ? (
                                <div className="p-8 text-center flex flex-col items-center justify-center gap-2 text-zinc-500">
                                    <MessageCircle size={24} className="opacity-40" />
                                    <p className="text-xs font-medium">No hay conversaciones activas</p>
                                    <p className="text-[11px] text-zinc-600 max-w-[200px]">
                                        Conecta con otros usuarios enviando una solicitud de amistad.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('discover')}
                                        className="mt-2 px-3 py-1.5 rounded-xl bg-accent/15 border border-accent/30 text-accent text-xs font-bold hover:bg-accent/25 transition-colors"
                                    >
                                        Explorar usuarios
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
                                                    alt={userInf.username} 
                                                    className="w-full h-full object-cover" 
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold truncate text-white font-mono">@{userInf.username}</span>
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
                        )}

                        {/* ── TAB 2: SOLICITUDES DE AMISTAD (RECIBIDAS Y ENVIADAS) ── */}
                        {activeTab === 'requests' && (
                            <div className="space-y-4 p-1">
                                {/* SOLICITUDES RECIBIDAS */}
                                <div>
                                    <div className="flex items-center justify-between px-1 mb-2">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                                            Recibidas ({receivedRequests.length})
                                        </span>
                                    </div>

                                    {receivedRequests.length === 0 ? (
                                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center text-[11px] text-zinc-500">
                                            No tienes solicitudes de amistad pendientes.
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {receivedRequests.map(uname => {
                                                const userInf = getUserInfo(uname);
                                                return (
                                                    <div
                                                        key={uname}
                                                        className="p-3 rounded-2xl bg-zinc-900/90 border border-amber-500/20 flex flex-col gap-2.5 shadow-sm"
                                                    >
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-9 h-9 rounded-full border border-white/10 overflow-hidden shrink-0 bg-zinc-800">
                                                                <img src={userInf.avatar} alt={userInf.username} className="w-full h-full object-cover" />
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <span className="text-xs font-bold text-white truncate block font-mono">
                                                                    @{userInf.username}
                                                                </span>
                                                                <span className="text-[10px] text-zinc-400 block">
                                                                    Te ha enviado una solicitud
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* BOTONES ACEPTAR / NEGAR */}
                                                        <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleAcceptRequest(uname)}
                                                                className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-[11px] flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
                                                            >
                                                                <Check size={12} strokeWidth={3} />
                                                                <span>Aceptar</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRejectRequest(uname)}
                                                                className="flex-1 py-1.5 px-3 rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-400 border border-white/10 text-zinc-300 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all active:scale-95"
                                                            >
                                                                <X size={12} strokeWidth={2.5} />
                                                                <span>Negar</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* SOLICITUDES ENVIADAS */}
                                {sentRequests.length > 0 && (
                                    <div className="pt-2 border-t border-white/5">
                                        <div className="flex items-center justify-between px-1 mb-2">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                                                Enviadas ({sentRequests.length})
                                            </span>
                                        </div>
                                        <div className="space-y-1.5">
                                            {sentRequests.map(uname => {
                                                const userInf = getUserInfo(uname);
                                                return (
                                                    <div
                                                        key={uname}
                                                        className="p-2.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-2"
                                                    >
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <div className="w-8 h-8 rounded-full border border-white/10 overflow-hidden shrink-0 bg-zinc-800">
                                                                <img src={userInf.avatar} alt={userInf.username} className="w-full h-full object-cover" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <span className="text-xs font-bold text-white truncate block font-mono">
                                                                    @{userInf.username}
                                                                </span>
                                                                <span className="text-[9px] text-zinc-500 flex items-center gap-1">
                                                                    <Clock size={9} /> Solicitud pendiente
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCancelSentRequest(uname)}
                                                            className="px-2.5 py-1 rounded-lg text-[10px] text-zinc-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
                                                        >
                                                            Cancelar
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── TAB 3: EXPLORAR COMUNIDAD / ENVIAR SOLICITUD ── */}
                        {activeTab === 'discover' && (
                            filteredCommunity.length === 0 ? (
                                <div className="p-8 text-center text-zinc-500 text-xs">
                                    No se encontraron usuarios en la comunidad.
                                </div>
                            ) : (
                                filteredCommunity.map(userItem => {
                                    const friendStatus = isFriend(userItem.username);
                                    const sentStatus = isRequestSent(userItem.username);
                                    const receivedStatus = isRequestReceived(userItem.username);

                                    return (
                                        <div
                                            key={userItem.username}
                                            className="p-3 rounded-2xl border border-white/5 hover:border-white/15 bg-white/[0.02] hover:bg-white/[0.04] transition-all flex flex-col gap-2.5 group"
                                        >
                                            <div className="flex items-center justify-between gap-2.5">
                                                <div 
                                                    className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
                                                    onClick={() => {
                                                        setActiveUser(userItem.username);
                                                        setActiveTab('chats');
                                                    }}
                                                >
                                                    <div className="w-9 h-9 rounded-full border border-white/15 overflow-hidden shrink-0 bg-zinc-900">
                                                        <img src={userItem.avatar} alt={userItem.username} className="w-full h-full object-cover" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span className="text-xs font-bold text-white truncate block font-mono group-hover:text-accent transition-colors">
                                                            @{userItem.username}
                                                        </span>
                                                        <span className="text-[10px] text-zinc-400 block truncate">
                                                            {userItem.bio}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* STATUS PILL */}
                                                {friendStatus ? (
                                                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-bold flex items-center gap-1 shrink-0">
                                                        <Check size={9} strokeWidth={3} />
                                                        Amigos
                                                    </span>
                                                ) : sentStatus ? (
                                                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[9px] font-bold flex items-center gap-1 shrink-0">
                                                        <Clock size={9} />
                                                        Pendiente
                                                    </span>
                                                ) : null}
                                            </div>

                                            {/* ACTIONS BUTTONS */}
                                            <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                                                {friendStatus ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setActiveUser(userItem.username);
                                                            setActiveTab('chats');
                                                        }}
                                                        className="w-full py-1.5 rounded-xl bg-accent text-black font-extrabold text-[11px] hover:brightness-110 transition-all flex items-center justify-center gap-1.5 shadow-md"
                                                    >
                                                        <Send size={11} />
                                                        <span>Chatear</span>
                                                    </button>
                                                ) : receivedStatus ? (
                                                    <div className="w-full flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAcceptRequest(userItem.username)}
                                                            className="flex-1 py-1.5 rounded-xl bg-emerald-500 text-black font-extrabold text-[11px] hover:bg-emerald-400 transition-all flex items-center justify-center gap-1 shadow-md"
                                                        >
                                                            <Check size={11} strokeWidth={3} />
                                                            <span>Aceptar solicitud</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRejectRequest(userItem.username)}
                                                            className="px-3 py-1.5 rounded-xl bg-white/5 text-zinc-300 font-bold text-[11px] hover:text-red-400 hover:bg-red-500/20 transition-all"
                                                        >
                                                            <span>Negar</span>
                                                        </button>
                                                    </div>
                                                ) : sentStatus ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCancelSentRequest(userItem.username)}
                                                        className="w-full py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-[11px] font-semibold transition-all flex items-center justify-center gap-1"
                                                    >
                                                        <span>Cancelar solicitud enviada</span>
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSendFriendRequest(userItem.username)}
                                                        className="w-full py-1.5 rounded-xl bg-accent/15 border border-accent/40 text-accent hover:bg-accent hover:text-black font-extrabold text-[11px] transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
                                                    >
                                                        <UserPlus size={12} />
                                                        <span>Enviar solicitud de amistad</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )
                        )}

                    </div>
                </div>

                {/* ─── MAIN CHAT AREA ─── */}
                <div className={`flex-1 flex-col bg-[#0e0e11] ${activeUser ? 'flex h-full' : 'hidden md:flex'}`}>
                    {activeUser && activeUserInfo ? (
                        <>
                            {/* CHAT HEADER */}
                            <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between bg-zinc-950/50 shrink-0">
                                <div className="flex items-center gap-3">
                                    <button 
                                        type="button"
                                        onClick={() => setActiveUser(null)}
                                        className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white flex items-center justify-center transition-colors"
                                        title="Volver a la lista (Esc)"
                                    >
                                        <ArrowLeft size={16} />
                                    </button>
                                    <div 
                                        className="w-10 h-10 rounded-full border-2 border-accent/40 overflow-hidden shrink-0 bg-zinc-900 cursor-pointer"
                                        onClick={() => {
                                            if (onOpenProfile) onOpenProfile(activeUserInfo.username);
                                        }}
                                    >
                                        <img src={activeUserInfo.avatar} alt={activeUserInfo.username} className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-white font-bold text-sm tracking-tight font-mono">@{activeUserInfo.username}</h4>
                                            {activeUserIsFriend && (
                                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Amigo conectado" />
                                            )}
                                        </div>
                                        <p className="text-[10px] text-zinc-400">
                                            {activeUserIsFriend ? 'Amigos' : activeUserRequestSent ? 'Solicitud de amistad enviada' : activeUserRequestReceived ? 'Te envió solicitud de amistad' : 'Aún no son amigos'}
                                        </p>
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

                            {/* CHAT MESSAGES BODY OR FRIENDSHIP GATE */}
                            {!activeUserIsFriend ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-zinc-400 overflow-y-auto">
                                    <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mb-4 text-accent">
                                        <UserPlus size={28} />
                                    </div>

                                    {activeUserRequestReceived ? (
                                        <div className="max-w-sm space-y-4">
                                            <h5 className="text-white text-base font-bold">@{activeUserInfo.username} quiere ser tu amigo</h5>
                                            <p className="text-xs text-zinc-400 leading-relaxed">
                                                Acepta su solicitud de amistad para habilitar la conversación directa y compartir notas creativas.
                                            </p>
                                            <div className="flex items-center justify-center gap-3 pt-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleAcceptRequest(activeUserInfo.username)}
                                                    className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs flex items-center gap-2 shadow-lg transition-all"
                                                >
                                                    <Check size={14} strokeWidth={3} />
                                                    <span>Aceptar solicitud</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRejectRequest(activeUserInfo.username)}
                                                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-zinc-300 hover:text-red-400 border border-white/10 text-xs font-bold transition-all"
                                                >
                                                    <span>Negar</span>
                                                </button>
                                            </div>
                                        </div>
                                    ) : activeUserRequestSent ? (
                                        <div className="max-w-sm space-y-3">
                                            <h5 className="text-white text-base font-bold">Solicitud enviada a @{activeUserInfo.username}</h5>
                                            <p className="text-xs text-zinc-400 leading-relaxed">
                                                Tu solicitud de amistad está pendiente de aprobación. Podrás intercambiar mensajes una vez que @{activeUserInfo.username} la acepte.
                                            </p>
                                            <div className="pt-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleCancelSentRequest(activeUserInfo.username)}
                                                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-zinc-300 hover:text-red-400 text-xs font-semibold transition-all"
                                                >
                                                    Cancelar solicitud
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="max-w-sm space-y-3">
                                            <h5 className="text-white text-base font-bold">Conecta con @{activeUserInfo.username}</h5>
                                            <p className="text-xs text-zinc-400 leading-relaxed">
                                                Para iniciar una conversación directa, primero envía una solicitud de amistad.
                                            </p>
                                            <div className="pt-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleSendFriendRequest(activeUserInfo.username)}
                                                    className="px-5 py-2.5 rounded-xl bg-accent text-black font-extrabold text-xs flex items-center gap-2 shadow-lg hover:brightness-110 transition-all mx-auto"
                                                >
                                                    <UserPlus size={14} />
                                                    <span>Enviar solicitud de amistad</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    {/* MESSAGES THREAD */}
                                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 custom-scrollbar">
                                        {(!activeThread.messages || activeThread.messages.length === 0) ? (
                                            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
                                                <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center mb-3 text-zinc-600 bg-white/[0.02]">
                                                    <MessageCircle size={28} />
                                                </div>
                                                <h5 className="text-white text-sm font-bold font-mono">Comienza una conversación con @{activeUserInfo.username}</h5>
                                                <p className="text-xs text-zinc-400 max-w-xs mt-1">
                                                    Comparte reflexiones, ideas o responde a sus notas en el Oasis.
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
                                    <div className="p-3 sm:p-4 border-t border-white/5 bg-zinc-950/60 shrink-0">
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
                            )}
                        </>
                    ) : (
                        /* EMPTY CHAT SELECTION SCREEN */
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
                            <div className="w-20 h-20 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-4 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                                <MessageCircle size={36} />
                            </div>
                            <h4 className="text-white text-base font-bold tracking-tight">Tus Mensajes</h4>
                            <p className="text-xs text-zinc-400 max-w-sm mt-1 leading-relaxed">
                                Selecciona una conversación de tu bandeja o envía solicitudes de amistad para comenzar a chatear.
                            </p>
                            <button
                                type="button"
                                onClick={() => setActiveTab('discover')}
                                className="mt-4 px-4 py-2 rounded-xl bg-accent/15 border border-accent/30 text-accent text-xs font-bold hover:bg-accent hover:text-black transition-all"
                            >
                                Explorar usuarios
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
