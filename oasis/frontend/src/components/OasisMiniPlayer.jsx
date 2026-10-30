import React, { useState } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, ChevronDown, ChevronUp, User, Music, Disc3, Maximize2 } from 'lucide-react';

export default function OasisMiniPlayer({
    track,
    isPlaying = false,
    onTogglePlay,
    onNext,
    onPrev,
    hasMultipleTracks = false,
    accent = '#bef264',
    onOpenProfile,
    isMuted = false,
    onToggleMute,
    volume = 0.7,
    onVolumeChange,
    coverImage = ''
}) {
    const [isMinimized, setIsMinimized] = useState(() => {
        try {
            return window.innerWidth < 768;
        } catch (e) {
            return false;
        }
    });
    const [isVolumeHovered, setIsVolumeHovered] = useState(false);

    if (!track) return null;

    const trackTitle = track.title || 'respiración lenta [432 Hz]';
    const trackArtist = track.artist || 'soundtrack continuo';

    // Estado Minimizador Compacto (Píldora discreta)
    if (isMinimized) {
        return (
            <div 
                className="fixed bottom-20 left-3 sm:bottom-6 sm:left-6 z-[2450] animate-in fade-in slide-in-from-bottom-2 duration-200 select-none pointer-events-auto"
                onMouseDown={e => e.stopPropagation()}
                onTouchStart={e => e.stopPropagation()}
            >
                <div className="flex items-center gap-2 bg-[#0c0d10]/95 backdrop-blur-2xl border border-white/10 hover:border-white/20 p-1.5 sm:px-2.5 sm:py-1.5 rounded-2xl shadow-[0_15px_35px_rgba(0,0,0,0.85)] transition-all">
                    {/* Botón expandir con icono de disco o ecualizador animado */}
                    <button
                        type="button"
                        onClick={() => setIsMinimized(false)}
                        className="flex items-center gap-2 text-left group/expand cursor-pointer"
                        title="Expandir reproductor de soundtrack"
                    >
                        <div className="w-7 h-7 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center relative overflow-hidden shrink-0">
                            {isPlaying ? (
                                <div className="flex items-end justify-center gap-0.5 h-3.5 w-3.5">
                                    <span className="w-1 bg-accent rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-3" />
                                    <span className="w-1 bg-accent rounded-full animate-[pulse_0.9s_ease-in-out_infinite] h-2" />
                                    <span className="w-1 bg-accent rounded-full animate-[pulse_0.75s_ease-in-out_infinite] h-3.5" />
                                </div>
                            ) : (
                                <Disc3 size={13} className="text-zinc-400 group-hover/expand:text-white transition-colors" />
                            )}
                        </div>
                        <div className="hidden sm:flex flex-col min-w-0 max-w-[110px]">
                            <span className="text-[10.5px] font-mono font-bold text-white truncate">{trackTitle}</span>
                            <span className="text-[8px] font-mono text-zinc-400 truncate">[432 Hz]</span>
                        </div>
                    </button>

                    {/* Botón Play / Pause en modo compacto */}
                    <button
                        type="button"
                        onClick={onTogglePlay}
                        className="w-7 h-7 rounded-xl bg-accent text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer"
                        title={isPlaying ? 'Pausar soundtrack' : 'Reproducir soundtrack'}
                    >
                        {isPlaying ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" className="ml-0.5" />}
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsMinimized(false)}
                        className="w-6 h-6 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                        title="Expandir controles"
                    >
                        <ChevronUp size={13} />
                    </button>
                </div>
            </div>
        );
    }

    // Estado Completo (Squircle moderno)
    return (
        <div 
            className="fixed bottom-20 left-3 sm:bottom-6 sm:left-6 z-[2450] animate-in fade-in slide-in-from-bottom-3 duration-200 select-none pointer-events-auto"
            onMouseDown={e => e.stopPropagation()}
            onTouchStart={e => e.stopPropagation()}
        >
            <div className="flex items-center gap-2.5 sm:gap-3 bg-[#0c0d10]/95 backdrop-blur-2xl border border-white/[0.1] hover:border-white/[0.18] p-2 sm:px-3 sm:py-2.5 rounded-[22px] sm:rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.88)] transition-all max-w-[94vw] sm:max-w-md">
                
                {/* Portada o ecualizador animado */}
                <div 
                    onClick={onOpenProfile}
                    className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden border border-white/10 bg-zinc-900 shrink-0 group/cover cursor-pointer shadow-md"
                    title="Ver en Perfil"
                >
                    {coverImage ? (
                        <img 
                            src={coverImage} 
                            alt="Cover" 
                            className="w-full h-full object-cover group-hover/cover:scale-105 transition-transform" 
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-950 flex items-center justify-center">
                            <Music size={14} className="text-zinc-500" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 group-hover/cover:bg-black/60 transition-colors flex items-center justify-center">
                        {isPlaying ? (
                            <div className="flex items-end justify-center gap-0.5 h-3.5 w-3.5">
                                <span className="w-0.5 sm:w-1 bg-accent rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-3" />
                                <span className="w-0.5 sm:w-1 bg-accent rounded-full animate-[pulse_0.9s_ease-in-out_infinite] h-2" />
                                <span className="w-0.5 sm:w-1 bg-accent rounded-full animate-[pulse_0.75s_ease-in-out_infinite] h-3.5" />
                            </div>
                        ) : (
                            <Disc3 size={14} className="text-zinc-400 group-hover/cover:text-white" />
                        )}
                    </div>
                </div>

                {/* Info de la pista */}
                <div 
                    onClick={onOpenProfile}
                    className="flex flex-col min-w-0 max-w-[110px] sm:max-w-[150px] cursor-pointer group/title"
                    title="Abrir reproductor en Perfil"
                >
                    <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isPlaying ? 'bg-accent animate-pulse shadow-[0_0_8px_rgba(var(--accent-rgb),0.8)]' : 'bg-zinc-600'}`} />
                        <span className="text-[11px] sm:text-xs font-mono font-bold text-white group-hover/title:text-accent transition-colors truncate">
                            {trackTitle}
                        </span>
                    </div>
                    <span className="text-[8.5px] font-mono text-zinc-400 truncate pl-3">
                        {trackArtist}
                    </span>
                </div>

                {/* Controles de reproducción */}
                <div className="flex items-center gap-1 shrink-0">
                    {hasMultipleTracks && (
                        <button
                            type="button"
                            onClick={onPrev}
                            className="w-7 h-7 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                            title="Canción anterior"
                        >
                            <SkipBack size={13} />
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={onTogglePlay}
                        className="w-8 h-8 rounded-xl bg-accent hover:bg-accent/90 text-black flex items-center justify-center shadow-[0_0_15px_rgba(var(--accent-rgb),0.35)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
                        title={isPlaying ? 'Pausar soundtrack' : 'Reproducir soundtrack'}
                    >
                        {isPlaying ? <Pause size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" className="ml-0.5" />}
                    </button>

                    {hasMultipleTracks && (
                        <button
                            type="button"
                            onClick={onNext}
                            className="w-7 h-7 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                            title="Siguiente canción"
                        >
                            <SkipForward size={13} />
                        </button>
                    )}

                    {/* Mute / Volumen */}
                    <div 
                        className="relative"
                        onMouseEnter={() => setIsVolumeHovered(true)}
                        onMouseLeave={() => setIsVolumeHovered(false)}
                    >
                        <button
                            type="button"
                            onClick={onToggleMute}
                            className="w-7 h-7 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                            title={isMuted ? 'Activar sonido' : 'Silenciar'}
                        >
                            {isMuted ? <VolumeX size={13} className="text-red-400" /> : <Volume2 size={13} />}
                        </button>

                        {isVolumeHovered && onVolumeChange && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-black/95 border border-white/15 rounded-xl shadow-xl flex items-center gap-2">
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={isMuted ? 0 : volume}
                                    onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                                    className="w-16 h-1 accent-accent bg-white/20 rounded-lg cursor-pointer"
                                />
                            </div>
                        )}
                    </div>

                    {/* Ir al Perfil */}
                    <button
                        type="button"
                        onClick={onOpenProfile}
                        className="w-7 h-7 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white hidden sm:flex items-center justify-center transition-colors cursor-pointer"
                        title="Ver en Perfil"
                    >
                        <Maximize2 size={11} />
                    </button>

                    {/* Minimizar */}
                    <button
                        type="button"
                        onClick={() => setIsMinimized(true)}
                        className="w-6 h-6 rounded-lg hover:bg-white/10 text-zinc-500 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                        title="Minimizar reproductor"
                    >
                        <ChevronDown size={12} />
                    </button>
                </div>

            </div>
        </div>
    );
}
