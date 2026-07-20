import React, { useState, useRef } from 'react';
import { X, Globe, Search, ArrowRight, Check, ImagePlus, ChevronLeft, Upload, MapPin, Loader2, Film, Image, ShoppingBag, DollarSign } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL ||
    ((typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.') || window.location.hostname.startsWith('10.')))
        ? `http://${window.location.hostname}:5046`
        : 'https://oasis-production-6303.up.railway.app');

export default function PublishNoteSelector({ 
    blocks, 
    setBlocks,
    syncBlocks, 
    onClose, 
    onPublished,
    accent = '#ef4444',
    user
}) {
    const [step, setStep] = useState('select_type');
    const [searchTerm, setSearchTerm] = useState('');
    const [status, setStatus] = useState('idle'); // 'idle' | 'uploading' | 'saving' | 'done' | 'error'
    const [uploadProgress, setUploadProgress] = useState(0);
    const [errorMsg, setErrorMsg] = useState('');

    // For media uploads
    const [localPreviewUrl, setLocalPreviewUrl] = useState(null);
    const [mediaType, setMediaType] = useState(null); // 'image' | 'video'
    const [pendingFile, setPendingFile] = useState(null);

    // For existing block selection
    const [selectedBlock, setSelectedBlock] = useState(null);
    const [caption, setCaption] = useState('');
    const [title, setTitle] = useState('');
    const [buyLink, setBuyLink] = useState('');
    const [price, setPrice] = useState('');
    const [pendingThumbnail, setPendingThumbnail] = useState(null);
    const [localThumbnailUrl, setLocalThumbnailUrl] = useState(null);

    const fileInputRef = useRef(null);
    const thumbnailInputRef = useRef(null);

    const availableBlocks = blocks.filter(b => {
        if (b.id === 'profile_settings' || b.id === 'user_settings') return false;
        if (b.isVirtual || b.type === 'conversation') return false;
        const contentStr = typeof b.content === 'string' ? b.content.toLowerCase() : '';
        const captionStr = (b.caption || '').toLowerCase();
        const searchLow = searchTerm.toLowerCase();
        return contentStr.includes(searchLow) || captionStr.includes(searchLow);
    }).sort((a, b) => {
        const tA = new Date(a.metadata?.timestamp || a.timestamp || 0).getTime();
        const tB = new Date(b.metadata?.timestamp || b.timestamp || 0).getTime();
        return tB - tA;
    });

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setLocalPreviewUrl(URL.createObjectURL(file));
        setMediaType(file.type.startsWith('video/') ? 'video' : 'image');
        setPendingFile(file);
        setSelectedBlock(null);
        setTitle('');
        setStep('details');
    };

    const handleNoteSelect = (block) => {
        setSelectedBlock(block);
        setLocalPreviewUrl(null);
        setMediaType(null);
        setPendingFile(null);
        setTitle(block.caption || '');
        setCaption('');
        setPendingThumbnail(null);
        setLocalThumbnailUrl(null);
        setStep('details');
    };

    const isPublishingRef = useRef(false);

    // ── MAIN PUBLISH FLOW ──
    const handlePublish = async () => {
        if (isPublishingRef.current) return;
        isPublishingRef.current = true;
        setStatus('uploading');
        setErrorMsg('');

        try {
            let finalMediaUrl = null;

            // STEP 1: Upload file if there's a new media file
            if (pendingFile) {
                const formData = new FormData();
                formData.append('file', pendingFile);
                formData.append('user', user || 'default');

                const uploadedUrl = await new Promise((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    xhr.open('POST', `${API_URL}/api/oasis/upload`);
                    xhr.upload.onprogress = (e) => {
                        if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
                    };
                    xhr.onload = () => {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            try {
                                const data = JSON.parse(xhr.responseText);
                                if (data.url) resolve(data.url);
                                else reject(new Error('No URL in response'));
                            } catch { reject(new Error('Invalid JSON response')); }
                        } else {
                            reject(new Error(`Upload failed: ${xhr.status} ${xhr.responseText}`));
                        }
                    };
                    xhr.onerror = () => reject(new Error('Network error during upload'));
                    xhr.send(formData);
                });

                finalMediaUrl = uploadedUrl;
            }

            // STEP 1b: Upload thumbnail if there's one
            let finalThumbnailUrl = null;
            if (pendingThumbnail) {
                const formData = new FormData();
                formData.append('file', pendingThumbnail);
                formData.append('user', user || 'default');

                finalThumbnailUrl = await new Promise((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    xhr.open('POST', `${API_URL}/api/oasis/upload`);
                    xhr.onload = () => {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            try {
                                const data = JSON.parse(xhr.responseText);
                                if (data.url) resolve(data.url);
                                else reject(new Error('No URL in response'));
                            } catch { reject(new Error('Invalid JSON response')); }
                        } else {
                            reject(new Error(`Upload failed: ${xhr.status} ${xhr.responseText}`));
                        }
                    };
                    xhr.onerror = () => reject(new Error('Network error during upload'));
                    xhr.send(formData);
                });
            }

            // STEP 2: Build the block
            setStatus('saving');
            const now = new Date().toISOString();
            let publishedBlock;

            if (selectedBlock) {
                // Publishing existing note
                publishedBlock = {
                    ...selectedBlock,
                    isPublic: true,
                    username: user,
                    timestamp: now,
                    caption: title.trim() ? title.trim() : (selectedBlock.caption || 'Sin título'),
                    metadata: {
                        ...(selectedBlock.metadata || {}),
                        feedText: caption,
                        feedCaption: title.trim() ? title.trim() : (selectedBlock.caption || 'Sin título'),
                        publishedAt: now,
                        ...(finalThumbnailUrl ? { thumbnail: finalThumbnailUrl } : {}),
                        ...(buyLink.trim() ? { buyLink: buyLink.trim() } : {}),
                        ...(price.trim() ? { price: price.trim() } : {})
                    }
                };
            } else if (finalMediaUrl) {
                // Publishing new media
                const finalTitle = title.trim() ? title.trim() : (caption ? (caption.length > 30 ? caption.substring(0, 30) + '...' : caption) : 'Publicación');
                publishedBlock = {
                    id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'note',
                    content: mediaType === 'image' ? `[img]${finalMediaUrl}[/img]` : `[vid]${finalMediaUrl}[/vid]`,
                    x: 0, y: 0, rotation: 0,
                    caption: finalTitle,
                    color: accent,
                    isPublic: true,
                    username: user,
                    folderId: '',
                    entries: [],
                    timestamp: now,
                    metadata: { 
                        feedText: caption, 
                        feedCaption: finalTitle, 
                        publishedAt: now,
                        ...(finalThumbnailUrl ? { thumbnail: finalThumbnailUrl } : {}),
                        ...(buyLink.trim() ? { buyLink: buyLink.trim() } : {}),
                        ...(price.trim() ? { price: price.trim() } : {})
                    }
                };
            } else {
                throw new Error('Nada que publicar');
            }

            // STEP 3: POST to decoupled feed publish endpoint
            const res = await fetch(`${API_URL}/api/oasis/feed/publish?user=${user}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(publishedBlock)
            });

            if (!res.ok) throw new Error(`Feed publish failed: ${res.status}`);
            const savedFeedBlock = await res.json();

            // STEP 4: Trigger done status
            setStatus('done');

            // Small delay so "done" state is visible, then close
            await new Promise(r => setTimeout(r, 800));
            isPublishingRef.current = false;
            onClose();
            if (onPublished) onPublished(savedFeedBlock);

        } catch (err) {
            console.error('[PublishNoteSelector] Error:', err);
            setErrorMsg(err.message || 'Error desconocido');
            setStatus('error');
            isPublishingRef.current = false;
        }
    };

    // ── STATUS SCREENS ──
    if (status === 'uploading' || status === 'saving') {
        return (
            <div className="fixed inset-0 z-[2000] flex flex-col items-center justify-center bg-[#050506]/97 backdrop-blur-md text-white animate-in fade-in duration-300 pointer-events-auto">
                <Loader2 size={48} className="animate-spin mb-6" style={{ color: accent }} />
                <h2 className="text-2xl font-black uppercase tracking-widest mb-2">
                    {status === 'uploading' ? 'Subiendo archivo...' : 'Guardando en el feed...'}
                </h2>
                {status === 'uploading' && pendingFile && (
                    <div className="w-72 mt-4">
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%`, backgroundColor: accent }} />
                        </div>
                        <div className="flex justify-between mt-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                            <span>Progreso</span>
                            <span style={{ color: accent }}>{uploadProgress}%</span>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (status === 'done') {
        return (
            <div className="fixed inset-0 z-[2000] flex flex-col items-center justify-center bg-[#050506]/97 backdrop-blur-md text-white animate-in fade-in duration-300 pointer-events-auto gap-4">
                <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: `${accent}20`, border: `2px solid ${accent}` }}>
                    <Check size={36} style={{ color: accent }} />
                </div>
                <h2 className="text-2xl font-black uppercase tracking-widest">¡Publicado!</h2>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="fixed inset-0 z-[2000] flex flex-col items-center justify-center bg-[#050506]/97 backdrop-blur-md text-white gap-4 p-8 pointer-events-auto">
                <p className="text-red-400 text-sm text-center max-w-xs">{errorMsg}</p>
                <button onClick={() => setStatus('idle')} className="px-6 py-2 rounded-full bg-white/10 text-white text-sm font-bold">Intentar de nuevo</button>
            </div>
        );
    }

    // ── CARD WRAPPER ──
    return (
        <div
            className="fixed inset-x-0 md:inset-x-[5vw] lg:inset-x-[10vw] xl:inset-x-[10vw] top-[140px] md:top-[100px] bottom-0 rounded-t-[2.5rem] border-t border-x border-white/10 z-[1500] flex flex-col bg-[#050506]/95 backdrop-blur-md text-white shadow-[0_-20px_50px_rgba(0,0,0,0.8)] pb-safe overflow-hidden animate-in fade-in slide-in-from-bottom-[60%] duration-500 pointer-events-auto"
            onTouchStart={(e) => { e.stopPropagation(); const rect = e.currentTarget.getBoundingClientRect(); if (e.touches[0].clientY - rect.top <= 100) { e.currentTarget.dataset.dragAllowed = 'true'; e.currentTarget.dataset.startY = e.touches[0].clientY; e.currentTarget.style.transition = 'none'; } else { e.currentTarget.dataset.dragAllowed = 'false'; } }}
            onTouchMove={(e) => {
                e.stopPropagation();
                if (e.currentTarget.dataset.dragAllowed !== 'true') return;
                const deltaY = e.touches[0].clientY - parseFloat(e.currentTarget.dataset.startY || 0);
                const scrollable = e.target.closest('.overflow-y-auto, textarea');
                if (scrollable && scrollable.scrollTop > 0) return;
                if (deltaY > 0) e.currentTarget.style.transform = `translateY(${deltaY}px)`;
                if (deltaY > 120) { e.currentTarget.style.transition = 'all 0.5s cubic-bezier(0.16,1,0.3,1)'; e.currentTarget.style.transform = 'translateY(100%)'; setTimeout(() => onClose(), 200); }
            }}
            onTouchEnd={(e) => {
                if (e.currentTarget.dataset.dragAllowed !== 'true') return;
                const deltaY = e.changedTouches[0].clientY - parseFloat(e.currentTarget.dataset.startY || 0);
                if (deltaY <= 120) { e.currentTarget.style.transition = 'all 0.5s cubic-bezier(0.16,1,0.3,1)'; e.currentTarget.style.transform = 'translateY(0px)'; }
            }}
            onPointerDown={e => e.stopPropagation()}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={(e) => {
                e.preventDefault(); e.stopPropagation();
                if (step === 'select_type' && e.dataTransfer.files?.length > 0) {
                    const file = e.dataTransfer.files[0];
                    setLocalPreviewUrl(URL.createObjectURL(file));
                    setMediaType(file.type.startsWith('video/') ? 'video' : 'image');
                    setPendingFile(file);
                    setStep('details');
                }
            }}
        >
            {/* Close button */}
            {step === 'select_type' && (
                <div className="absolute top-4 right-4 z-50">
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-all"><X size={16} /></button>
                </div>
            )}

            {/* SELECT TYPE */}
            {step === 'select_type' && (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-300 pb-32">
                    <div className="w-16 h-16 md:w-24 md:h-24 mb-4 md:mb-6 rounded-full bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center">
                        <ImagePlus size={28} className="text-zinc-500" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white mb-2">Nueva publicación</h3>
                    <p className="text-sm text-zinc-500 mb-8 max-w-xs">Arrastra un archivo aquí o selecciona desde tu dispositivo</p>

                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleFileSelect} />

                    <div className="flex gap-3 mb-6 w-full max-w-sm">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
                        >
                            <Image size={22} className="text-zinc-400" />
                            <span className="text-xs font-bold text-zinc-300">Foto</span>
                        </button>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
                        >
                            <Film size={22} className="text-zinc-400" />
                            <span className="text-xs font-bold text-zinc-300">Video</span>
                        </button>
                    </div>

                    <div className="w-full max-w-sm flex items-center gap-4 mb-4">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-xs font-black uppercase text-zinc-600 tracking-widest">O</span>
                        <div className="flex-1 h-px bg-white/10" />
                    </div>

                    <button
                        onClick={() => setStep('select_note')}
                        className="w-full max-w-sm px-6 py-3 rounded-xl font-bold text-sm bg-white/5 text-zinc-300 hover:bg-white/10 border border-white/10 transition-all"
                    >
                        Elegir de mis Notas
                    </button>
                </div>
            )}

            {/* SELECT NOTE */}
            {step === 'select_note' && (
                <div className="flex-1 flex flex-col h-full animate-in fade-in slide-in-from-right-8 duration-300 pb-24">
                    <div className="shrink-0 p-4 border-b border-white/5 flex items-center gap-3">
                        <button onClick={() => setStep('select_type')} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
                            <ChevronLeft size={20} />
                        </button>
                        <h2 className="text-lg font-black text-white uppercase tracking-tight">Elegir Fragmento</h2>
                    </div>
                    <div className="shrink-0 px-4 pt-4 pb-2">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                            <input type="text" placeholder="Buscar notas..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-white/20 transition-all" />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
                        {availableBlocks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 text-center">
                                <p className="text-xs font-mono uppercase text-zinc-600 tracking-widest">No hay fragmentos disponibles</p>
                            </div>
                        ) : availableBlocks.map(b => {
                            const isDia = b.entries?.length > 0;
                            const isRes = typeof b.content === 'string' && b.content.includes('[resonancia]');
                            const typeLabel = isRes ? 'RESONANCIA' : (isDia ? 'DIARIO' : 'NOTA');
                            const cardColor = isRes ? '#a855f7' : (isDia ? '#f59e0b' : (b.color || '#fff'));
                            const snippet = isDia ? (b.entries[0]?.text || '') : (typeof b.content === 'string' ? b.content.replace(/\[\/?(?:img|vid|aud|resonancia|impacto|extrano)\]/g, '').trim() : '');
                            return (
                                <div key={b.id} onClick={() => handleNoteSelect(b)}
                                    className="group relative overflow-hidden bg-white/[0.02] border border-white/5 rounded-2xl p-4 transition-all hover:bg-white/[0.05] hover:border-white/10 cursor-pointer active:scale-[0.98]">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ backgroundColor: cardColor }} />
                                    <div className="flex items-center justify-between gap-4 pl-2">
                                        <div className="min-w-0 flex-1">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{typeLabel}</span>
                                            <h4 className="text-sm font-bold text-white/90 truncate">{b.caption || 'Sin título'}</h4>
                                            <p className="text-xs text-zinc-500 mt-1 line-clamp-2 italic">{snippet}</p>
                                        </div>
                                        <ArrowRight size={14} className="text-zinc-600 group-hover:text-white transition-colors shrink-0" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* DETAILS */}
            {step === 'details' && (
                <div className="flex-1 flex flex-col h-full animate-in fade-in slide-in-from-right-8 duration-300 pb-24">
                    <div className="shrink-0 px-4 py-3 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[#050506]/80 backdrop-blur-md z-10">
                        <button onClick={() => setStep(selectedBlock ? 'select_note' : 'select_type')} className="p-2 -ml-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
                            <ChevronLeft size={20} />
                        </button>
                        <h2 className="text-base font-black text-white tracking-tight">Nueva publicación</h2>
                        <button
                            onClick={handlePublish}
                            className="px-4 py-1.5 rounded-full text-sm font-bold transition-all flex items-center gap-2"
                            style={{ color: accent, backgroundColor: `${accent}20` }}
                        >
                            Compartir
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto no-scrollbar p-4 flex flex-col lg:flex-row gap-6">
                        {/* Preview */}
                        <div className={`w-full lg:w-1/2 flex-shrink-0 bg-zinc-950 rounded-2xl overflow-hidden border border-white/5 relative ${mediaType === 'video' ? 'min-h-[280px]' : 'aspect-square'} flex flex-col`}>
                            <div className="flex-1 relative min-h-[200px]">
                                {localPreviewUrl && mediaType === 'image' && (
                                    <img src={localPreviewUrl} className="w-full h-full object-contain absolute inset-0" alt="Preview" />
                                )}
                                {localPreviewUrl && mediaType === 'video' && (
                                    <video src={localPreviewUrl} controls playsInline preload="metadata" className="w-full h-full object-contain absolute inset-0" />
                                )}
                                {selectedBlock && (
                                    <div className="w-full h-full flex flex-col p-6 overflow-y-auto bg-gradient-to-br from-zinc-900 to-[#0a0a0b] absolute inset-0">
                                        <h4 className="text-white font-bold mb-3 text-lg">{selectedBlock.caption || 'Fragmento'}</h4>
                                        <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
                                            {typeof selectedBlock.content === 'string'
                                                ? selectedBlock.content.replace(/\[\/?(?:img|vid|aud)\]/g, '').trim()
                                                : ''}
                                        </p>
                                    </div>
                                )}
                            </div>
                            
                            {/* Thumbnail option */}
                            <div className="shrink-0 border-t border-white/10 p-3 bg-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Image size={16} className="text-zinc-400" />
                                    <span className="text-xs text-zinc-300 font-bold">Portada del Feed</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {localThumbnailUrl && (
                                        <div className="relative w-8 h-8 rounded overflow-hidden border border-white/20">
                                            <img src={localThumbnailUrl} className="w-full h-full object-cover" />
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setPendingThumbnail(null); setLocalThumbnailUrl(null); }}
                                                className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                                            >
                                                <X size={12} className="text-white" />
                                            </button>
                                        </div>
                                    )}
                                    <button 
                                        onClick={() => thumbnailInputRef.current?.click()}
                                        className="text-[10px] px-3 py-1.5 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 transition-all font-black uppercase tracking-wider"
                                    >
                                        {localThumbnailUrl ? 'Cambiar' : 'Añadir imagen'}
                                    </button>
                                </div>
                                <input 
                                    type="file" 
                                    ref={thumbnailInputRef} 
                                    className="hidden" 
                                    accept="image/*" 
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            setLocalThumbnailUrl(URL.createObjectURL(file));
                                            setPendingThumbnail(file);
                                        }
                                    }} 
                                />
                            </div>
                        </div>

                        {/* Caption + options */}
                        <div className="w-full lg:w-1/2 flex flex-col gap-4">
                            <div className="flex items-start gap-3 p-4 bg-white/[0.02] border border-white/5 rounded-2xl focus-within:border-white/20 focus-within:bg-white/[0.04] transition-all">
                                <img src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${user || 'anon'}`} className="w-8 h-8 rounded-full bg-zinc-800 shrink-0" alt="avatar" />
                                <div className="flex-1 flex flex-col gap-3">
                                    <input
                                        type="text"
                                        placeholder="Título (ej. Nombre del producto)..."
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        className="w-full bg-transparent text-sm font-bold text-white placeholder:text-zinc-600 outline-none border-b border-white/5 pb-2"
                                    />
                                    <textarea
                                        placeholder="Escribe un pie de foto o descripción..."
                                        value={caption}
                                        onChange={e => setCaption(e.target.value)}
                                        className="w-full h-24 bg-transparent text-sm text-white placeholder:text-zinc-600 outline-none resize-none pt-1"
                                    />
                                </div>
                            </div>

                            <div className="divide-y divide-white/5 bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                                <div className="w-full px-4 py-3 flex items-center gap-3 text-sm text-white focus-within:bg-white/[0.04] transition-all">
                                    <ShoppingBag size={18} className="text-zinc-500 shrink-0" />
                                    <input 
                                        type="url"
                                        placeholder="Enlace de compra o tienda (opcional)..."
                                        value={buyLink}
                                        onChange={(e) => setBuyLink(e.target.value)}
                                        className="flex-1 bg-transparent border-none text-white text-sm outline-none focus:ring-0 p-0 placeholder:text-zinc-600"
                                    />
                                </div>
                                <div className="w-full px-4 py-3 flex items-center gap-3 text-sm text-white focus-within:bg-white/[0.04] transition-all">
                                    <DollarSign size={18} className="text-zinc-500 shrink-0" />
                                    <input 
                                        type="text"
                                        placeholder="Precio del producto (opcional, ej. $25.00)..."
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        className="flex-1 bg-transparent border-none text-white text-sm outline-none focus:ring-0 p-0 placeholder:text-zinc-600"
                                    />
                                </div>
                                <div className="w-full px-4 py-3 flex items-center justify-between text-sm text-white">
                                    <div className="flex items-center gap-3">
                                        <Globe size={18} className="text-zinc-500" />
                                        <span>Público en Feed Ruido Interior</span>
                                    </div>
                                    <div className="w-8 h-4 rounded-full relative" style={{ backgroundColor: accent }}>
                                        <div className="absolute right-0.5 top-0.5 bottom-0.5 w-3 rounded-full bg-white shadow-sm" />
                                    </div>
                                </div>
                            </div>

                            <p className="text-[10px] text-zinc-500 px-2">
                                Al publicar, este contenido será visible en el Feed público de Ruido Interior y en tu perfil.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
