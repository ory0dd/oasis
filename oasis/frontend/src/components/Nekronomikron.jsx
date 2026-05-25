import React, { useState, useRef, useEffect } from 'react';
import { 
    Search, X, Play, Pause, SkipBack, SkipForward, Heart, Trash2, 
    Plus, Maximize2, Zap, Music, List, PlusCircle, Check, 
    ChevronRight, MoreVertical, LayoutGrid, ListMusic
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5046';

const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '190, 242, 100';
};

const formatTime = (time) => {
    if (!time || isNaN(time)) return "00:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// --- SUB-COMPONENT: VISUALIZER ---
const Visualizer = ({ isPlaying, accentRgb }) => {
    return (
        <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-[3rem] border border-white/5 bg-black/40 flex items-center justify-center overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-accent/5 animate-pulse blur-3xl opacity-20 pointer-events-none" style={{ backgroundColor: `rgba(${accentRgb}, 0.1)` }} />
            <div className="z-10 flex items-center gap-1.5 md:gap-2 px-8 h-32">
                {[...Array(20)].map((_, i) => (
                    <div 
                        key={i} 
                        className="w-1 md:w-1.5 bg-accent rounded-full transition-all duration-300" 
                        style={{ 
                            height: isPlaying ? `${20 + Math.random() * 80}%` : '4px',
                            backgroundColor: `rgb(${accentRgb})`,
                            boxShadow: `0 0 10px rgba(${accentRgb}, 0.3)`
                        }} 
                    />
                ))}
            </div>
        </div>
    );
};

// --- SUB-COMPONENT: TRACK MENU ---
const TrackMenu = ({ item, playlists, onAddToPlaylist, onClose }) => {
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');

    return (
        <div className="absolute right-0 bottom-full mb-2 w-48 bg-[#0c0c0d] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-[100] animate-in fade-in slide-in-from-bottom-2">
            <div className="p-3 border-b border-white/5 bg-white/5 flex items-center justify-between">
                <span className="text-[8px] font-black uppercase tracking-widest text-accent/60">Añadir a...</span>
                <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={10} /></button>
            </div>
            <div className="max-h-48 overflow-y-auto no-scrollbar">
                {Object.keys(playlists).map(p => (
                    <button 
                        key={p} 
                        onClick={() => { onAddToPlaylist(item, p); onClose(); }}
                        className="w-full px-4 py-3 text-[9px] font-bold text-left text-white/70 hover:bg-accent hover:text-black transition-all flex items-center justify-between group"
                    >
                        {p}
                        <Plus size={10} className="opacity-0 group-hover:opacity-100" />
                    </button>
                ))}
            </div>
            {isCreating ? (
                <div className="p-2 bg-white/5 border-t border-white/5">
                    <input 
                        autoFocus
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && newName.trim()) {
                                onAddToPlaylist(item, newName.trim());
                                onClose();
                            }
                        }}
                        placeholder="Nombre..."
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-[9px] text-white outline-none"
                    />
                </div>
            ) : (
                <button 
                    onClick={() => setIsCreating(true)}
                    className="w-full py-3 text-[9px] font-black uppercase text-center text-accent bg-accent/5 hover:bg-accent/10 transition-all border-t border-white/5"
                >
                    + Nueva Playlist
                </button>
            )}
        </div>
    );
};

export const NekronomikronFull = ({
    isOpen, onClose, playQueue, setPlayQueue, currentTrack, setCurrentTrack, isPlaying, setIsPlaying,
    volume, setVolume, accent, audioRef,
    searchQuery, setSearchQuery, searchResults, onSearch, isSearching,
    playlists, setPlaylists, progress, duration,
    onPlaySearchResult, onPlayPlaylist, onNext, onPrev,
    activeView, setActiveView,
    isPlaylistExpanded, setIsPlaylistExpanded, expandedPlaylistItems,
    onImportPlaylist, syncPlaylists, syncPlayback
}) => {
    const [menuTrackId, setMenuTrackId] = useState(null);
    const [activeTab, setActiveTab] = useState('player'); // 'search' | 'library' | 'player'
    const [libraryMode, setLibraryMode] = useState('songs'); // 'songs' | 'playlists'
    const rgb = hexToRgb(accent);

    if (!isOpen) return null;

    const track = playQueue[currentTrack] || { title: 'Sintonizando...', artist: 'Oasis Core', videoId: null, thumbnail: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=200' };
    const isFavorite = track.videoId && playlists['Favoritos']?.some(t => t.videoId === track.videoId);

    const handleToggleFavorite = (item) => {
        if (item.playlistId) {
            handleSavePlaylistDirectly(item);
            return;
        }
        
        const vId = item.videoId || item.id;
        const exists = (playlists['Favoritos'] || []).some(t => (t.videoId || t.id) === vId);
        let updated;
        if (exists) {
            updated = { ...playlists, Favoritos: playlists['Favoritos'].filter(t => (t.videoId || t.id) !== vId) };
        } else {
            updated = { ...playlists, Favoritos: [...(playlists['Favoritos'] || []), {
                title: item.title,
                videoId: vId,
                artist: item.artist || 'YouTube Echo',
                thumbnail: item.thumbnail
            }] };
        }
        setPlaylists(updated);
        if (typeof syncPlaylists === 'function') syncPlaylists(updated);
    };

    const handleSavePlaylistDirectly = async (item) => {
        // Si ya tenemos los items expandidos y coinciden, los usamos
        if (isPlaylistExpanded && expandedPlaylistItems.length > 0 && item.playlistId === searchResults.find(r => r.playlistId === item.playlistId)?.playlistId) {
            handleSaveEntirePlaylist(item.title, expandedPlaylistItems);
            return;
        }

        // Si no, pedimos al padre que los traiga y los guarde
        if (typeof onImportPlaylist === 'function') {
            onImportPlaylist(item.playlistId, item.title, true); // Añadimos flag de 'autoSave'
        }
    };

    const handleAddToPlaylist = (item, pName) => {
        const updated = {
            ...playlists,
            [pName]: [...(playlists[pName] || []), { 
                title: item.title, 
                videoId: item.videoId || item.id, 
                artist: item.artist || 'YouTube Echo', 
                thumbnail: item.thumbnail 
            }]
        };
        setPlaylists(updated);
        if (typeof syncPlaylists === 'function') syncPlaylists(updated);
    };

    const handleSaveEntirePlaylist = (title, items) => {
        const name = title || `Playlist Guardada ${Object.keys(playlists).length + 1}`;
        const updated = {
            ...playlists,
            [name]: items.map(t => ({
                title: t.title,
                videoId: t.videoId || t.id,
                artist: t.artist || 'YouTube Echo',
                thumbnail: t.thumbnail
            }))
        };
        setPlaylists(updated);
        if (typeof syncPlaylists === 'function') syncPlaylists(updated);
        setActiveView(name);
        setActiveTab('library');
        setLibraryMode('playlists');
    };

    const handlePerformSearch = (q) => {
        if (!q.trim()) return;
        onSearch(q);
        setActiveView('search');
        if (typeof setIsPlaylistExpanded === 'function') setIsPlaylistExpanded(false);
    };

    const listItems = activeView === 'search' ? (isPlaylistExpanded ? expandedPlaylistItems : searchResults) : (playlists[activeView] || []);

    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-0 md:p-8 animate-in fade-in duration-700 overflow-hidden">
            <div className="absolute inset-0 bg-[#050506]/90 backdrop-blur-3xl" onClick={onClose} />
            
            {/* AMBIENT GLOW */}
            <div className="absolute inset-0 opacity-20 pointer-events-none transition-colors duration-1000" 
                 style={{ background: `radial-gradient(circle at 50% 50%, ${accent}40 0%, transparent 70%)` }} />

            <div className="relative w-full md:max-w-5xl h-full md:h-[850px] glass-panel md:rounded-[3.5rem] overflow-hidden flex flex-col md:flex-col transition-all">
                
                {/* HEADER (PC & MOBILE) */}
                <div className="p-6 pb-4 shrink-0 border-b border-white/5 bg-black/40 flex items-center justify-between z-20">
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black uppercase tracking-[0.4em] text-accent/60">Frecuencia Oasis</span>
                        <h2 className="text-lg md:text-xl font-black italic tracking-tighter text-white uppercase italic">NEKRONOMIKRON</h2>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"><X size={20} /></button>
                </div>

                {/* CONTENT AREA */}
                <div className="flex-1 overflow-hidden relative z-10 flex flex-col">
                    {/* PC NAVIGATION (TOP) - HIDDEN ON MOBILE */}
                    <div className="hidden md:flex p-4 justify-center bg-black/20 border-b border-white/5">
                        <div className="flex bg-white/5 p-1 rounded-full gap-1 border border-white/5">
                            {[
                                { id: 'search', icon: <Search size={14} />, label: 'Búsqueda' },
                                { id: 'library', icon: <LayoutGrid size={14} />, label: 'Biblioteca' },
                                { id: 'player', icon: <Music size={14} />, label: 'Reproductor' }
                            ].map(tab => (
                                <button 
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-8 py-2.5 rounded-full flex items-center gap-2 transition-all text-[9px] font-black uppercase tracking-[0.2em] ${activeTab === tab.id ? 'bg-accent text-black shadow-lg shadow-accent/20' : 'text-zinc-500 hover:text-white'}`}
                                >
                                    {tab.icon} <span>{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-hidden">
                        {activeTab === 'search' && (
                            <div className="h-full flex flex-col p-6 md:p-12 animate-fade-zoom">
                                <div className="relative mb-6 shrink-0">
                                    <input
                                        autoFocus
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handlePerformSearch(searchQuery)}
                                        placeholder="Buscar frecuencias..."
                                        className="w-full bg-white/5 border border-white/10 p-5 pr-20 rounded-2xl text-base font-black italic text-white placeholder:text-zinc-800 outline-none focus:border-accent/40 shadow-inner transition-all"
                                    />
                                    <button onClick={() => handlePerformSearch(searchQuery)} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-accent text-black rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl">
                                        {isSearching ? <div className="w-5 h-5 border-3 border-black border-t-transparent rounded-full animate-spin" /> : <Search size={18} />}
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto no-scrollbar player-scroll space-y-3">
                                    {isSearching ? (
                                        <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                                            <div className="w-32 h-1 bg-accent/20 rounded-full mb-3 overflow-hidden"><div className="h-full bg-accent w-1/3 animate-move-infinite" /></div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-accent/40">Sincronizando...</span>
                                        </div>
                                    ) : (isPlaylistExpanded ? expandedPlaylistItems : searchResults).length > 0 ? (
                                        <>
                                            {isPlaylistExpanded && (
                                                <button 
                                                    onClick={() => setIsPlaylistExpanded(false)}
                                                    className="flex items-center gap-2 text-accent text-[9px] font-black uppercase tracking-widest mb-4 hover:opacity-70 transition-all"
                                                >
                                                    <ArrowLeft size={14} /> Regresar a resultados
                                                </button>
                                            )}
                                            {(isPlaylistExpanded ? expandedPlaylistItems : searchResults).map((item, idx) => {
                                                const vId = item.videoId || item.id || item.playlistId;
                                                const isPlaylist = !!item.playlistId;
                                                const isInLib = isPlaylist 
                                                    ? Object.keys(playlists).includes(item.title)
                                                    : (playlists['Favoritos'] || []).some(t => (t.videoId || t.id) === vId);

                                                return (
                                                    <div key={`${vId}-${idx}`} className="group glass-card rounded-2xl p-3 flex items-center gap-4 transition-all">
                                                        <button 
                                                            onClick={() => { 
                                                                if (isPlaylistExpanded) {
                                                                    // Play from expanded list
                                                                    handleSaveEntirePlaylist('Temp Queue', expandedPlaylistItems);
                                                                    onPlayPlaylist('Temp Queue', idx);
                                                                    setActiveTab('player');
                                                                } else if (isPlaylist) {
                                                                    onImportPlaylist(item.playlistId, item.title);
                                                                } else {
                                                                    onPlaySearchResult(idx); 
                                                                    setActiveTab('player'); 
                                                                }
                                                            }} 
                                                            className="flex items-center gap-4 flex-1 text-left min-w-0"
                                                        >
                                                            <div className="w-14 h-14 rounded-xl overflow-hidden bg-black shrink-0 relative">
                                                                <img src={item.thumbnail} className="w-full h-full object-cover opacity-60" alt="Cover" />
                                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-accent/30 backdrop-blur-sm"><Play size={20} className="text-black fill-current" /></div>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="text-[11px] font-black italic uppercase text-white truncate">{item.title}</h4>
                                                                <p className="text-[8px] font-bold uppercase tracking-widest text-zinc-600 truncate mt-1">{isPlaylist ? 'ÁLBUM / PLAYLIST' : (item.artist || 'YouTube Echo')}</p>
                                                            </div>
                                                        </button>
                                                        <div className="shrink-0 flex items-center gap-2">
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleToggleFavorite(item); }}
                                                                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isInLib ? 'bg-accent text-black scale-105' : 'bg-white/5 text-zinc-500 hover:text-white'}`}
                                                            >
                                                                <Heart size={16} fill={isInLib ? "currentColor" : "none"} />
                                                            </button>
                                                            {isPlaylist ? (
                                                                <button onClick={() => onImportPlaylist(item.playlistId, item.title)} className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center text-accent hover:bg-accent hover:text-black transition-all"><ChevronRight size={16} /></button>
                                                            ) : (
                                                                <button onClick={() => setMenuTrackId(menuTrackId === item.videoId ? null : item.videoId)} className={`w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-all ${menuTrackId === item.videoId ? 'bg-accent text-black' : ''}`}><Plus size={16} /></button>
                                                            )}
                                                        </div>
                                                        {menuTrackId === item.videoId && <div className="absolute right-0 top-full mt-2 z-[2000]"><TrackMenu item={item} playlists={playlists} onAddToPlaylist={handleAddToPlaylist} onClose={() => setMenuTrackId(null)} /></div>}
                                                    </div>
                                                );
                                            })}
                                            {isPlaylistExpanded && expandedPlaylistItems.length > 0 && (
                                                <button onClick={() => handleSaveEntirePlaylist(null, expandedPlaylistItems)} className="w-full py-4 rounded-2xl border border-accent/20 bg-accent/5 hover:bg-accent/10 transition-all flex items-center justify-center gap-3 text-[9px] font-black uppercase text-accent shadow-lg"><PlusCircle size={16} /> Guardar Álbum en Biblioteca</button>
                                            )}
                                        </>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center opacity-10 text-center font-black px-12 italic"><Music size={40} className="mb-4" /> <span className="text-[9px] uppercase tracking-widest">Esperando señal...</span></div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'library' && (
                            <div className="h-full flex flex-col p-6 md:p-12 animate-fade-zoom">
                                <div className="flex bg-white/5 p-1 rounded-xl gap-1 mb-8 self-start border border-white/5">
                                    <button 
                                        onClick={() => setLibraryMode('songs')}
                                        className={`px-6 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${libraryMode === 'songs' ? 'bg-white/10 text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
                                    >Canciones</button>
                                    <button 
                                        onClick={() => setLibraryMode('playlists')}
                                        className={`px-6 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${libraryMode === 'playlists' ? 'bg-white/10 text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
                                    >Playlists</button>
                                </div>

                                <div className="flex-1 overflow-y-auto no-scrollbar player-scroll space-y-3">
                                    {libraryMode === 'songs' ? (
                                        (playlists['Favoritos'] || []).length > 0 ? (playlists['Favoritos'] || []).map((item, idx) => (
                                            <div key={`${item.videoId || item.id}-${idx}`} className="group glass-card rounded-2xl p-3 flex items-center gap-4 transition-all">
                                                <button onClick={() => { onPlayPlaylist('Favoritos', idx); setActiveTab('player'); }} className="flex items-center gap-4 flex-1 text-left min-w-0">
                                                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-black shrink-0 relative">
                                                        <img src={item.thumbnail} className="w-full h-full object-cover opacity-60" alt="Cover" />
                                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-accent/30 backdrop-blur-sm"><Play size={20} className="text-black fill-current" /></div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-[11px] font-black italic uppercase text-white truncate">{item.title}</h4>
                                                        <p className="text-[8px] font-bold uppercase tracking-widest text-zinc-600 truncate mt-1">{item.artist || 'YouTube Echo'}</p>
                                                    </div>
                                                </button>
                                                <button onClick={() => handleToggleFavorite(item)} className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center text-accent hover:bg-red-500/20 hover:text-red-500 transition-all"><Heart size={15} fill="currentColor" /></button>
                                            </div>
                                        )) : (
                                            <div className="h-full flex flex-col items-center justify-center opacity-10 text-center font-black italic"><Music size={32} className="mb-4" /> <span className="text-[8px] uppercase tracking-widest">Sin canciones favoritas</span></div>
                                        )
                                    ) : (
                                        <div className="space-y-4">
                                            {/* PLAYLISTS LIST */}
                                            <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar py-1">
                                                {Object.keys(playlists).filter(p => p !== 'Favoritos').map(p => (
                                                    <button 
                                                        key={p} onClick={() => setActiveView(p)}
                                                        className={`px-5 py-2.5 rounded-xl border transition-all text-[8px] font-black uppercase tracking-widest whitespace-nowrap ${activeView === p ? 'bg-white/10 text-white border-white/20' : 'bg-white/5 text-zinc-600 border-white/5'}`}
                                                    >{p}</button>
                                                ))}
                                            </div>
                                            {activeView !== 'search' && activeView !== 'Favoritos' ? (
                                                (playlists[activeView] || []).map((item, idx) => (
                                                    <div key={`${item.videoId || item.id}-${idx}`} className="group glass-card rounded-2xl p-3 flex items-center gap-4 transition-all">
                                                        <button onClick={() => { onPlayPlaylist(activeView, idx); setActiveTab('player'); }} className="flex items-center gap-4 flex-1 text-left min-w-0">
                                                            <div className="w-14 h-14 rounded-xl overflow-hidden bg-black shrink-0 relative">
                                                                <img src={item.thumbnail} className="w-full h-full object-cover opacity-60" alt="Cover" />
                                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-accent/30 backdrop-blur-sm"><Play size={20} className="text-black fill-current" /></div>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="text-[11px] font-black italic uppercase text-white truncate">{item.title}</h4>
                                                                <p className="text-[8px] font-bold uppercase tracking-widest text-zinc-600 truncate mt-1">{item.artist || 'YouTube Echo'}</p>
                                                            </div>
                                                        </button>
                                                        <button onClick={() => { const updated = { ...playlists }; updated[activeView] = updated[activeView].filter((_, i) => i !== idx); setPlaylists(updated); if (typeof syncPlaylists === 'function') syncPlaylists(updated); }} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-zinc-800 hover:text-red-500 transition-all"><Trash2 size={15} /></button>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="py-20 flex flex-col items-center justify-center opacity-10 text-center font-black italic"><ListMusic size={32} className="mb-4" /> <span className="text-[8px] uppercase tracking-widest">Selecciona una playlist</span></div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'player' && (
                            <div className="h-full flex flex-col md:flex-row p-8 md:p-16 animate-fade-zoom items-center justify-center gap-10 md:gap-20">
                                <div className="relative shrink-0 flex flex-col items-center group">
                                    <div className="absolute -inset-10 bg-accent/10 blur-[80px] rounded-full opacity-0 group-hover:opacity-50 transition-opacity duration-1000" />
                                    <Visualizer isPlaying={isPlaying} accentRgb={rgb} />
                                    <div className="mt-8 flex items-center gap-3 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full">
                                        <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-accent animate-pulse' : 'bg-white/10'}`} />
                                        <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-white/40">Sincronía Activa</span>
                                    </div>
                                </div>

                                <div className="flex-1 w-full max-w-xl flex flex-col justify-center space-y-10">
                                    <div className="text-center md:text-left space-y-4">
                                        <h3 className="text-3xl md:text-5xl font-black italic text-white tracking-tighter leading-none line-clamp-2 drop-shadow-2xl">{track.title}</h3>
                                        <div className="flex items-center justify-center md:justify-start gap-4 opacity-60">
                                            <div className="h-[1px] w-6 bg-accent" />
                                            <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.6em] text-accent">{track.artist}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-5">
                                        <div className="h-1.5 bg-white/5 rounded-full relative group cursor-pointer overflow-hidden backdrop-blur-xl" onClick={(e) => { const rect = e.currentTarget.getBoundingClientRect(); const v = (e.clientX - rect.left) / rect.width; if (audioRef.current) { audioRef.current.currentTime = v * duration; syncPlayback(playQueue, currentTrack, v * duration); } }}>
                                            <div className="absolute top-0 left-0 h-full bg-accent shadow-[0_0_20px_rgba(var(--accent-rgb),0.4)]" style={{ width: `${(progress / duration) * 100}%`, '--accent-rgb': rgb }} />
                                        </div>
                                        <div className="flex justify-between text-[8px] font-black uppercase tracking-[0.3em] text-zinc-600 tabular-nums">
                                            <span className="text-white/40">{formatTime(progress)}</span><span>{formatTime(duration)}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-center md:justify-start gap-8 md:gap-12">
                                        <button onClick={onPrev} className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-zinc-600 hover:text-white hover:bg-white/10 transition-all"><SkipBack size={24} /></button>
                                        <button
                                            onClick={() => { if (isPlaying) audioRef.current.pause(); else audioRef.current.play(); setIsPlaying(!isPlaying); }}
                                            className="w-20 h-20 md:w-24 md:h-24 rounded-[2.5rem] bg-accent text-black flex items-center justify-center shadow-[0_0_60px_rgba(var(--accent-rgb),0.3)] hover:scale-110 active:scale-95 transition-all"
                                            style={{ '--accent-rgb': rgb }}
                                        >
                                            {isPlaying ? <Pause size={32} strokeWidth={3} fill="currentColor" /> : <Play size={32} strokeWidth={3} fill="currentColor" className="ml-1.5" />}
                                        </button>
                                        <button onClick={onNext} className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-zinc-600 hover:text-white hover:bg-white/10 transition-all"><SkipForward size={24} /></button>
                                    </div>

                                    <div className="flex items-center gap-8 pt-6 border-t border-white/5">
                                        <Heart
                                            onClick={() => { const updated = isFavorite ? { ...playlists, Favoritos: playlists['Favoritos'].filter(t => t.videoId !== track.videoId) } : { ...playlists, Favoritos: [...(playlists['Favoritos'] || []), track] }; setPlaylists(updated); if (typeof syncPlaylists === 'function') syncPlaylists(updated); }}
                                            className={`cursor-pointer w-6 h-6 transition-all hover:scale-125 ${isFavorite ? 'text-accent fill-current drop-shadow-[0_0_15px_rgba(var(--accent-rgb),0.5)]' : 'text-zinc-700 hover:text-zinc-500'}`}
                                            style={{ '--accent-rgb': rgb }}
                                        />
                                        <div className="flex-1 flex items-center gap-5">
                                            <div className="flex-1 h-1 bg-white/5 rounded-full relative overflow-hidden cursor-pointer" onClick={(e) => { const rect = e.currentTarget.getBoundingClientRect(); setVolume((e.clientX - rect.left) / rect.width); }}>
                                                <div className="absolute top-0 left-0 h-full bg-accent/40" style={{ width: `${volume * 100}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* MOBILE BOTTOM NAVIGATION */}
                <div className="flex md:hidden p-4 pb-8 bg-black/60 border-t border-white/5 backdrop-blur-2xl z-20">
                    <div className="flex w-full justify-between px-6">
                        {[
                            { id: 'search', icon: <Search size={22} />, label: 'Búsqueda' },
                            { id: 'library', icon: <LayoutGrid size={22} />, label: 'Biblioteca' },
                            { id: 'player', icon: <Music size={22} />, label: 'Oasis' }
                        ].map(tab => (
                            <button 
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === tab.id ? 'text-accent scale-110' : 'text-zinc-600'}`}
                            >
                                {tab.icon}
                                <span className="text-[7px] font-black uppercase tracking-[0.2em]">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- MINI HUB PLAYER (FLOATING) ---
export const OasisPlayer = ({
    playQueue, currentTrack, setCurrentTrack, isPlaying, setIsPlaying,
    isMinimized, setIsMinimized, volume, setVolume, accent,
    audioRef, pos, handleStart,
    setIsFull, progress, duration, playlists, setPlaylists, syncPlaylists, syncPlayback
}) => {
    const track = playQueue[currentTrack] || { title: 'Wait...', artist: 'Oasis Core', thumbnail: '' };
    const rgb = hexToRgb(accent);

    if (isMinimized) {
        return (
            <div className="fixed z-[2500] w-14 h-14 transition-all duration-700 ease-out" style={{ left: pos.x || 20, top: pos.y ? pos.y : undefined, bottom: pos.y ? undefined : 120 }}>
                <div
                    className="w-full h-full bg-black/90 backdrop-blur-3xl rounded-full border border-white/10 flex items-center justify-center cursor-move shadow-2xl overflow-hidden group hover:border-accent/40"
                    onMouseDown={(e) => handleStart(e, 'player')}
                    onTouchStart={(e) => handleStart(e, 'player')}
                    onClick={() => setIsMinimized(false)}
                >
                    <Play size={16} className={`${isPlaying ? 'text-accent animate-pulse' : 'text-zinc-500'}`} fill={isPlaying ? "currentColor" : "none"} />
                </div>
            </div>
        );
    }

    return (
        <div className="fixed z-[2500] w-[75vw] md:w-[240px] transition-all duration-700 ease-out" 
             style={{ 
                 left: pos.x || '50%', 
                 top: pos.y ? pos.y : undefined, 
                 bottom: pos.y ? undefined : 120, 
                 transform: !pos.x ? 'translateX(-50%)' : 'none' 
             }}>
            <div
                className="w-full bg-[#0c0c0d]/95 backdrop-blur-[50px] rounded-full border border-white/5 p-1.5 pl-3 pr-2 shadow-[0_20px_60px_rgba(0,0,0,0.8)] flex items-center gap-3 cursor-default relative group pointer-events-auto"
                onMouseDown={(e) => handleStart(e, 'player')}
                onTouchStart={(e) => handleStart(e, 'player')}
            >
                <button onClick={() => setIsFull(true)} className="flex items-center justify-center p-2 text-white/20 hover:text-accent transition-all hover:scale-110 active:scale-90 group-hover:text-white/40"><Maximize2 size={10} className="rotate-45" /></button>
                <div className="flex-1 min-w-0 flex flex-col justify-center cursor-pointer overflow-hidden" onClick={() => setIsFull(true)}>
                    <div className="marquee-container w-full h-3 relative overflow-hidden">
                        <div className="flex whitespace-nowrap animate-marquee absolute top-0 left-0">
                            <h4 className="text-[8.5px] md:text-[9.5px] font-black italic uppercase text-white tracking-[0.05em] px-2">{track.title}</h4>
                            <h4 className="text-[8.5px] md:text-[9.5px] font-black italic uppercase text-white tracking-[0.05em] px-2">{track.title}</h4>
                        </div>
                    </div>
                    <p className="text-[6.5px] font-bold text-white/20 uppercase tracking-[0.15em] truncate px-2">{track.artist}</p>
                </div>
                <div className="flex items-center gap-2 pr-1">
                    <button onClick={(e) => { e.stopPropagation(); setCurrentTrack((currentTrack - 1 + playQueue.length) % playQueue.length); }} className="p-1 text-white/20 hover:text-white transition-colors"><SkipBack size={12} /></button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (isPlaying) audioRef.current.pause();
                            else audioRef.current.play();
                            setIsPlaying(!isPlaying);
                        }}
                        className="w-9 h-9 rounded-full bg-accent text-black flex items-center justify-center shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)] hover:scale-110 active:scale-95 transition-all"
                        style={{ '--accent-rgb': rgb }}
                    >
                        {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setCurrentTrack((currentTrack + 1) % playQueue.length); }} className="p-1 text-white/20 hover:text-white transition-colors"><SkipForward size={12} /></button>
                </div>
            </div>
        </div>
    );
};
