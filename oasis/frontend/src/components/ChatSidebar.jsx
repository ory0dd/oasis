import React from 'react';
import {
    MessageSquare, StickyNote, Zap, PanelLeftClose, FolderPlus, Plus, Star,
    ChevronDown, Edit3, Pin, Trash2, Check, FileText, Settings, Aperture, X
} from 'lucide-react';
import { SimpleNarrativeRenderer } from './NarrativeRenderers';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5046';
const PALETTES = [
    { name: 'Génesis', color: '#bef264' },
    { name: 'Cian', color: '#22d3ee' },
    { name: 'Rosa', color: '#f43f5e' },
    { name: 'Púrpura', color: '#d946ef' },
    { name: 'Ámbar', color: '#fbbf24' },
];

const SidebarPlayer = ({ track, isPlaying, setIsPlaying, onPrev, onNext, audioRef, setIsFull }) => {
    // This is a simplified version or you can move the full SidebarPlayer here too
    if (!track) return null;
    return (
        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5 group">
            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-white/10">
                <img src={track.img || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=100'} className="w-full h-full object-cover" alt="Track" />
            </div>
            <div className="flex-1 min-w-0 pr-2">
                <p className="text-[9px] font-black uppercase text-white truncate">{track.title || 'Sincronizando...'}</p>
                <p className="text-[7px] font-bold text-white/20 uppercase tracking-widest truncate">{track.artist || 'Oasis Spirit'}</p>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={onPrev} className="p-1.5 text-white/40 hover:text-white transition-colors">
                    <Zap size={10} className="rotate-180" />
                </button>
                <button onClick={() => setIsPlaying(!isPlaying)} className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all">
                    {isPlaying ? <Zap size={10} className="fill-white" /> : <Zap size={10} />}
                </button>
                <button onClick={onNext} className="p-1.5 text-white/40 hover:text-white transition-colors">
                    <Zap size={10} />
                </button>
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
    const [activeTab, setActiveTab] = React.useState('chats');
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
        <div className="fixed md:relative inset-y-0 left-0 w-[280px] sm:w-80 h-full bg-[#080809] border-r border-white/5 flex flex-col animate-in slide-in-from-left duration-300 z-[1750] shadow-2xl md:shadow-none transition-colors duration-1000">
            <div className="p-4 border-b border-white/[0.03] flex items-center gap-2">
                <div className="flex bg-white/5 p-1 rounded-xl w-full">
                    <button onClick={() => setActiveTab('chats')} className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-[8px] font-black uppercase tracking-widest transition-all ${activeTab === 'chats' ? 'bg-white/10 text-white shadow-md' : 'text-white/30 hover:text-white/60'}`}><MessageSquare size={10} /> Chats</button>
                    <button onClick={() => setActiveTab('notes')} className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-[8px] font-black uppercase tracking-widest transition-all ${activeTab === 'notes' ? 'bg-white/10 text-white shadow-md' : 'text-white/30 hover:text-white/60'}`}><StickyNote size={10} /> Notas</button>
                    <button onClick={() => setActiveTab('memory')} className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-[8px] font-black uppercase tracking-widest transition-all ${activeTab === 'memory' ? 'bg-white/10 text-white shadow-md' : 'text-white/30 hover:text-white/60'}`}><Zap size={10} /> Memoria</button>
                </div>
                <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all shrink-0"><PanelLeftClose size={14} /></button>
            </div>
            <div className="p-6 pb-2 space-y-5">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white italic">Oasis Nexus</span>
                        <span className="text-[6px] font-bold text-white/20 uppercase tracking-[0.3em]">IA Core Interface</span>
                    </div>
                    <button onClick={() => setIsCreatingFolder(true)} className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-accent transition-all"><FolderPlus size={14} /></button>
                </div>
                <button onClick={onNewChat} className="w-full h-12 rounded-2xl border border-accent/20 bg-accent/5 hover:bg-accent/10 transition-all flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest text-accent group">
                    <Plus size={16} className="group-hover:rotate-90 transition-transform" /> Nueva Conversación
                </button>

                {isCreatingFolder && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <input autoFocus value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { onCreateFolder(newFolderName); setNewFolderName(''); setIsCreatingFolder(false); } if (e.key === 'Escape') setIsCreatingFolder(false); }} placeholder="Nombre de carpeta..." className="w-full bg-white/5 border border-accent/20 rounded-xl px-4 py-3 text-[10px] font-bold text-white outline-none placeholder:text-zinc-700" />
                    </div>
                )}
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-6 space-y-8">
                {activeTab === 'chats' ? (
                    <>
                        {conversations.some(c => c.isPinned) && (
                            <div className="space-y-4">
                                <h3 className="text-[8px] font-black uppercase tracking-[0.4em] text-accent/40 flex items-center gap-2"><Star size={10} /> Destacados</h3>
                                <div className="space-y-2">
                                    {conversations.filter(c => c.isPinned).map(c => (
                                        <button key={c.id} onClick={() => onSelectConversation(c.id)} className={`w-full p-4 rounded-2xl flex items-center justify-between group transition-all ${activeConversationId === c.id ? 'bg-accent/10 border border-accent/20' : 'bg-black/20 border border-white/5 hover:border-white/20'}`}><div className="flex items-center gap-3 overflow-hidden"><div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: c.color || '#bef264', boxShadow: `0 0 10px ${c.color || '#bef264'}44` }} /><span className="text-[10px] font-bold text-white/80 truncate">{c.title || 'Conversación'}</span></div><Pin size={10} className="text-accent opacity-60" /></button>
                                    ))}
                                </div>
                            </div>
                        )}
                        {folders.map(folder => (
                            <div key={folder.id} className="space-y-3">
                                <div className="flex items-center gap-2 px-1"><ChevronDown size={10} className="text-white/20" /><span className="text-[8px] font-black uppercase tracking-[0.4em] text-white/20">{folder.name}</span></div>
                                <div className="space-y-1 pl-2 border-l border-white/5 ml-1">
                                    {conversations.filter(c => c.folderId === folder.id).map(c => (
                                        <button key={c.id} onClick={() => onSelectConversation(c.id)} className={`w-full px-4 py-2 rounded-xl flex items-center gap-3 transition-all ${activeConversationId === c.id ? 'bg-white/5 text-white' : 'text-white/40 hover:text-white/80'}`}><div className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: c.color || '#bef264' }} /><span className="text-[9px] font-bold truncate">{c.title || 'Sin Título'}</span></button>
                                    ))}
                                </div>
                            </div>
                        ))}
                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <h3 className="text-[8px] font-black uppercase tracking-[0.4em] text-white/10 px-1">Recientes</h3>
                            <div className="space-y-1">
                                {conversations.filter(c => !c.isPinned && !c.folderId).map(c => (
                                    <div key={c.id} className="relative group/item">
                                        {editingConversationId === c.id ? (
                                            <div className="space-y-2 p-2 bg-white/5 rounded-xl border border-accent/20">
                                                <input autoFocus value={editTitle} onChange={(e) => setEditTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleRename(c.id, editTitle)} className="w-full bg-transparent border-none p-2 text-[10px] font-bold text-white outline-none" />
                                                <div className="flex items-center justify-between px-2 pb-1">
                                                    <div className="flex gap-1.5">{['#bef264', '#22d3ee', '#f43f5e', '#d946ef', '#fbbf24'].map(color => (<button key={color} onClick={() => handleRename(c.id, editTitle, color)} className="w-3.5 h-3.5 rounded-full border border-white/10 hover:scale-125 transition-transform" style={{ backgroundColor: color }} />))}</div>
                                                    <div className="flex gap-1"><button onClick={() => setEditingConversationId(null)} className="p-1 px-2 rounded-lg bg-white/5 text-white/30 hover:text-white transition-all text-[8px] font-black uppercase"><X size={10} /></button><button onClick={() => handleRename(c.id, editTitle)} className="p-1 px-2 rounded-lg bg-accent/20 text-accent hover:bg-accent/30 transition-all text-[8px] font-black uppercase flex items-center gap-1"><Check size={10} /> Listo</button></div>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <button onClick={() => onSelectConversation(c.id)} className={`w-full px-4 py-3 rounded-xl flex items-center justify-between transition-all ${activeConversationId === c.id ? 'bg-white/5 text-white' : 'text-white/30 hover:bg-white/5 hover:text-white/80'}`}><div className="flex items-center gap-3 min-w-0"><div className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: c.color || '#555' }} /><span className="text-[9px] font-bold truncate pr-8">{c.title || 'Sin Título'}</span></div></button>
                                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity bg-[#080809] pl-2">
                                                    <button onClick={() => { setEditingConversationId(c.id); setEditTitle(c.title || ''); }} className="p-1.5 hover:text-accent transition-colors"><Edit3 size={10} /></button>
                                                    <button onClick={() => onPinConversation(c.id)} className={`p-1.5 transition-colors ${c.isPinned ? 'text-accent' : 'hover:text-accent'}`}><Pin size={10} /></button>
                                                    <button onClick={() => onDeleteConversation(c.id)} className="p-1.5 hover:text-red-400 transition-colors"><Trash2 size={10} /></button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                ) : activeTab === 'notes' ? (
                    <>
                        {folders.map(folder => {
                            const folderNotes = blocks.filter(b => b.type === 'text' && b.folderId === folder.id);
                            if (folderNotes.length === 0) return null;
                            return (
                                <div key={folder.id} className="space-y-3">
                                    <div className="flex items-center gap-2 px-1"><ChevronDown size={10} className="text-white/20" /><span className="text-[8px] font-black uppercase tracking-[0.4em] text-white/20">{folder.name}</span></div>
                                    <div className="space-y-1 pl-2 border-l border-white/5 ml-1">
                                        {folderNotes.map(b => (
                                            <div key={b.id} onClick={() => { onSelectNote(b.id); onClose(); }} className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/5 transition-all cursor-pointer group"><FileText size={10} style={{ color: b.color || '#bef264' }} className="opacity-40" /><span className="text-[9px] font-bold text-white/30 group-hover:text-white/70 truncate">{b.content.slice(0, 25)}</span></div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <h3 className="text-[8px] font-black uppercase tracking-[0.4em] text-white/10 px-1">Notas del Lienzo</h3>
                            <div className="space-y-1">
                                {blocks.filter(b => b.type === 'text' && !b.folderId).map(b => (
                                    <div key={b.id} onClick={() => { onSelectNote(b.id); onClose(); }} className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/5 transition-all cursor-pointer group"><FileText size={10} style={{ color: b.color || '#bef264' }} className="opacity-40" /><span className="text-[9px] font-bold text-white/30 group-hover:text-white/70 truncate">{b.content.slice(0, 25)}</span></div>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 overflow-y-auto no-scrollbar space-y-6">
                        <div className="space-y-2"><h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-accent/60 flex items-center gap-2"><Zap size={12} /> Núcleo de Memoria</h3><p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Hechos destilados de tu conciencia digital.</p></div>
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
                                                    title={fact.isPinned ? "Desmarcar" : "Marcar como importante"}
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
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-400/60 flex items-center gap-2"><Aperture size={12} /> Reflexiones</h3>
                            <div className="space-y-3">
                                {blocks.filter(b => b.type === 'insight').map((insight, idx) => (
                                    <div key={insight.id || idx} className="group p-5 rounded-3xl bg-purple-500/5 border border-purple-500/10 hover:border-purple-500/30 transition-all relative overflow-hidden"><div className="text-[11px] font-serif italic text-white/80 leading-relaxed"><SimpleNarrativeRenderer content={insight.content} /></div></div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <div className="p-6 border-t border-white/[0.02] bg-white/[0.01] space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-white/20 hover:text-white/60 transition-colors cursor-pointer group">
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-all text-[10px] font-black">{user?.[0]?.toUpperCase() || 'U'}</div>
                        <div className="flex flex-col"><span className="text-[9px] font-black uppercase tracking-widest">{user || 'Usuario'}</span><span className="text-[6px] font-bold text-white/10 uppercase">Frecuencia Base</span></div>
                    </div>
                    <Settings size={14} className="text-white/10 hover:text-white transition-colors cursor-pointer" />
                </div>
                {playQueue[currentTrack] && (<div className="pt-2 animate-in slide-in-from-bottom-2 duration-500"><SidebarPlayer track={playQueue[currentTrack]} isPlaying={isPlaying} setIsPlaying={setIsPlaying} onPrev={handlePrevTrack} onNext={handleNextTrack} audioRef={audioRef} setIsFull={() => { }} /></div>)}
            </div>
        </div>
    );
};

export default ChatSidebar;
