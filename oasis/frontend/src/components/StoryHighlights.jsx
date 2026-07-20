import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, Image as ImageIcon, History } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL ||
    ((typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.') || window.location.hostname.startsWith('10.')))
        ? `http://${window.location.hostname}:5046`
        : 'https://backend.ruidointerior.com');

const formatUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

const isVideoUrl = (url) => {
    if (!url) return false;
    if (typeof url !== 'string') return false;
    if (url.includes('#video')) return true;
    const cleanUrl = url.toLowerCase().split('?')[0].split('#')[0];
    return cleanUrl.endsWith('.mp4') || 
           cleanUrl.endsWith('.webm') || 
           cleanUrl.endsWith('.ogg') || 
           cleanUrl.endsWith('.mov') || 
           cleanUrl.endsWith('.quicktime') ||
           url.startsWith('data:video/');
};

export const StoryViewer = ({ storiesArray, highlight, onClose, onDelete, isOwner }) => {
    // storiesArray is either passed directly (for 24h stories) OR extracted from highlight.
    const items = storiesArray || (highlight?.metadata?.stories || []);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    
    // Auto-advance
    useEffect(() => {
        if (items.length === 0) return;
        const interval = setInterval(() => {
            setProgress(p => {
                if (p >= 100) {
                    if (currentIndex < items.length - 1) {
                        setCurrentIndex(c => c + 1);
                        return 0;
                    } else {
                        clearInterval(interval);
                        onClose();
                        return 100;
                    }
                }
                return p + 2; 
            });
        }, 100);
        return () => clearInterval(interval);
    }, [currentIndex, items.length, onClose]);

    const handleNext = (e) => {
        e.stopPropagation();
        if (currentIndex < items.length - 1) {
            setCurrentIndex(c => c + 1);
            setProgress(0);
        } else {
            onClose();
        }
    };

    const handlePrev = (e) => {
        e.stopPropagation();
        if (currentIndex > 0) {
            setCurrentIndex(c => c - 1);
            setProgress(0);
        }
    };

    if (items.length === 0) {
        return (
            <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
                <div className="text-white">No hay historias.</div>
                <button onClick={onClose} className="absolute top-6 right-6 text-white"><X size={32}/></button>
            </div>
        );
    }

    const currentItem = items[currentIndex];
    // If it's a 24h story object (from feed), the image is in content or metadata.thumbnail
    const imageUrl = typeof currentItem === 'string' ? currentItem : (currentItem.metadata?.thumbnail || currentItem.content);
    // Determine the ID to delete. If we passed storiesArray, we delete the specific story block.
    // If we passed a highlight, we delete the entire highlight.
    const blockIdToDelete = highlight ? highlight.id : currentItem.id;
    const title = highlight ? highlight.content : (currentItem.username || 'Historia');
    const avatarThumbnail = highlight ? highlight.metadata?.thumbnail : (currentItem.metadata?.userAvatar);

    return (
        <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center select-none">
            {/* Progress Bars */}
            <div className="absolute left-4 right-4 flex gap-1 z-50" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}>
                {items.map((s, i) => (
                    <div key={i} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-white transition-all duration-75 ease-linear"
                            style={{ 
                                width: i === currentIndex ? `${progress}%` : (i < currentIndex ? '100%' : '0%') 
                            }}
                        />
                    </div>
                ))}
            </div>

            {/* Header */}
            <div className="absolute left-4 right-4 flex justify-between items-center z-50" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 24px)' }}>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 bg-zinc-900">
                        {avatarThumbnail ? <img src={formatUrl(avatarThumbnail)} className="w-full h-full object-cover" /> : null}
                    </div>
                    <span className="text-white font-bold text-sm tracking-wider">{title}</span>
                </div>
                <div className="flex items-center gap-4">
                    {isOwner && onDelete && (
                        <button onClick={(e) => { e.stopPropagation(); onDelete(blockIdToDelete); }} className="text-white/70 hover:text-red-500 transition-colors p-2">
                            <Trash2 size={20} />
                        </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="text-white/70 hover:text-white transition-colors p-2 -mr-2">
                        <X size={28} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="w-full h-full relative" onClick={handleNext}>
                <div 
                    className="absolute inset-y-0 left-0 w-1/3 z-40" 
                    onClick={(e) => { e.stopPropagation(); handlePrev(e); }}
                />
                {isVideoUrl(imageUrl) ? (
                    <video 
                        src={formatUrl(imageUrl)} 
                        className="w-full h-full object-contain" 
                        autoPlay 
                        playsInline 
                        muted 
                        loop
                        key={currentIndex}
                    />
                ) : (
                    <img 
                        src={formatUrl(imageUrl)} 
                        className="w-full h-full object-contain" 
                        key={currentIndex}
                    />
                )}
            </div>
        </div>
    );
};

export const StoryUploadModal = ({ onClose, onSave, user, userAvatar }) => {
    const [fileUrl, setFileUrl] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileUpload = async (fileBlob) => {
        const formData = new FormData();
        formData.append('file', fileBlob);
        const res = await fetch(`${API_URL}/api/oasis/upload`, {
            method: 'POST',
            body: formData
        });
        if (!res.ok) throw new Error('Upload failed');
        const data = await res.json();
        return data.url;
    };

    const handleSave = async () => {
        if (!fileUrl) return;
        setIsUploading(true);
        try {
            let finalUrl = fileUrl;
            if (fileUrl.startsWith('blob:')) {
                const cleanBlobUrl = fileUrl.split('#')[0];
                const res = await fetch(cleanBlobUrl);
                const blob = await res.blob();
                finalUrl = await handleFileUpload(blob);
                if (fileUrl.includes('#video')) {
                    finalUrl = finalUrl + '#video';
                }
            }

            const newStory = {
                id: `story_${Date.now()}`,
                type: 'story',
                content: 'Historia 24h',
                username: user,
                isPublic: true,
                timestamp: new Date().toISOString(),
                metadata: {
                    thumbnail: finalUrl, // we store the image in thumbnail
                    userAvatar: userAvatar
                }
            };
            onSave(newStory);
        } catch (err) {
            console.error(err);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm bg-[#0c0c0e] border border-white/10 rounded-3xl p-6 flex flex-col gap-6 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors p-2 -mr-2 -mt-2">
                    <X size={20} />
                </button>
                <h2 className="text-xl font-light text-white tracking-widest uppercase text-center mt-2">Tu Historia</h2>
                
                <label className="w-full aspect-[9/16] rounded-2xl border-2 border-white/20 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors overflow-hidden bg-black/30 group">
                    {fileUrl ? (
                        isVideoUrl(fileUrl) ? (
                            <video 
                                src={fileUrl} 
                                className="w-full h-full object-cover" 
                                autoPlay 
                                playsInline 
                                muted 
                                loop
                            />
                        ) : (
                            <img src={fileUrl} className="w-full h-full object-cover" />
                        )
                    ) : (
                        <>
                            <Plus className="text-zinc-500 group-hover:text-white transition-colors mb-2" size={32} />
                            <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Subir Foto/Video</span>
                        </>
                    )}
                    <input 
                        type="file" 
                        accept="image/*,video/*" 
                        className="hidden" 
                        onChange={(e) => {
                            if (e.target.files?.[0]) {
                                const file = e.target.files[0];
                                const url = URL.createObjectURL(file);
                                if (file.type.startsWith('video/')) {
                                    setFileUrl(url + '#video');
                                } else {
                                    setFileUrl(url);
                                }
                            }
                        }}
                    />
                </label>

                <button 
                    onClick={handleSave}
                    disabled={isUploading || !fileUrl}
                    className="w-full py-4 bg-white text-black font-bold uppercase tracking-widest rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-opacity"
                >
                    {isUploading ? 'Publicando...' : 'Compartir Historia'}
                </button>
            </div>
        </div>
    );
};

export const HighlightModal = ({ onClose, onSave, user, archive = [] }) => {
    const [title, setTitle] = useState('');
    const [thumbnail, setThumbnail] = useState(null);
    const [stories, setStories] = useState([]); // Array of URLs
    const [isUploading, setIsUploading] = useState(false);
    const [showArchive, setShowArchive] = useState(false);

    const handleFileUpload = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch(`${API_URL}/api/oasis/upload`, {
            method: 'POST',
            body: formData
        });
        if (!res.ok) throw new Error('Upload failed');
        const data = await res.json();
        return data.url;
    };

    const handleSave = async () => {
        if (!title.trim() || !thumbnail || stories.length === 0) return;
        setIsUploading(true);
        try {
            let thumbnailUrl = thumbnail;
            if (thumbnail.startsWith('blob:')) {
                const cleanBlobUrl = thumbnail.split('#')[0];
                const res = await fetch(cleanBlobUrl);
                const blob = await res.blob();
                thumbnailUrl = await handleFileUpload(blob);
            }

            const uploadedStories = [];
            for (const s of stories) {
                let url = s;
                if (s.startsWith('blob:')) {
                    const cleanBlobUrl = s.split('#')[0];
                    const res = await fetch(cleanBlobUrl);
                    const blob = await res.blob();
                    url = await handleFileUpload(blob);
                    if (s.includes('#video')) {
                        url = url + '#video';
                    }
                }
                uploadedStories.push(url);
            }

            const newHighlight = {
                id: `highlight_${Date.now()}`,
                type: 'highlight',
                content: title,
                username: user,
                isPublic: true,
                timestamp: new Date().toISOString(),
                metadata: {
                    thumbnail: thumbnailUrl,
                    stories: uploadedStories
                }
            };

            onSave(newHighlight);
        } catch (err) {
            console.error("Error creating highlight", err);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#0c0c0e] border border-white/10 rounded-3xl p-6 flex flex-col gap-6 relative max-h-[90vh] overflow-y-auto no-scrollbar">
                <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors z-10 p-2 -mr-2 -mt-2">
                    <X size={20} />
                </button>

                <h2 className="text-xl font-light text-white tracking-widest uppercase text-center mt-2">Nueva Destacada</h2>

                {/* Thumbnail */}
                <div className="flex flex-col gap-2 mt-4">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold text-center">Portada</span>
                    <label className="w-24 h-24 rounded-full border border-white/20 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors overflow-hidden shrink-0 mx-auto bg-black/30">
                        {thumbnail ? (
                            <img src={thumbnail} className="w-full h-full object-cover" />
                        ) : (
                            <ImageIcon className="text-zinc-500 mb-1" size={24} />
                        )}
                        <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => {
                                if (e.target.files?.[0]) {
                                    setThumbnail(URL.createObjectURL(e.target.files[0]));
                                }
                            }}
                        />
                    </label>
                </div>

                {/* Title */}
                <input 
                    type="text" 
                    placeholder="Nombre (ej. Viajes)" 
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 text-center font-bold tracking-wider mt-2"
                />

                {/* Stories Selection */}
                <div className="flex flex-col gap-2 mt-2">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Contenido ({stories.length})</span>
                        <button onClick={() => setShowArchive(!showArchive)} className="text-[10px] text-accent uppercase tracking-widest font-bold flex items-center gap-1 hover:text-white transition-colors">
                            <History size={12}/> Archivo
                        </button>
                    </div>

                    {showArchive && archive.length > 0 && (
                        <div className="grid grid-cols-4 gap-2 mb-4 max-h-48 overflow-y-auto no-scrollbar p-2 border border-white/5 bg-black/30 rounded-xl">
                            {archive.map(storyBlock => {
                                const url = formatUrl(storyBlock.metadata?.thumbnail || storyBlock.content);
                                const isSelected = stories.includes(url);
                                return (
                                    <div 
                                        key={storyBlock.id} 
                                        onClick={() => {
                                            if (isSelected) {
                                                setStories(prev => prev.filter(s => s !== url));
                                            } else {
                                                setStories(prev => [...prev, url]);
                                            }
                                        }}
                                        className={`w-full aspect-[9/16] rounded-md overflow-hidden cursor-pointer border-2 transition-colors ${isSelected ? 'border-accent' : 'border-transparent hover:border-white/30'}`}
                                    >
                                        {isVideoUrl(url) ? (
                                            <video 
                                                src={url.split('#')[0]} 
                                                className="w-full h-full object-cover" 
                                                muted 
                                                playsInline
                                            />
                                        ) : (
                                            <img src={url} className="w-full h-full object-cover" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar items-center">
                        <label className="w-20 h-32 shrink-0 rounded-xl border border-white/20 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors bg-black/30">
                            <Plus className="text-zinc-500" size={24} />
                            <input 
                                type="file" 
                                accept="image/*,video/*" 
                                multiple
                                className="hidden" 
                                onChange={(e) => {
                                    if (e.target.files) {
                                        const newStories = Array.from(e.target.files).map(f => {
                                            const url = URL.createObjectURL(f);
                                            return f.type.startsWith('video/') ? (url + '#video') : url;
                                        });
                                        setStories(prev => [...prev, ...newStories]);
                                    }
                                }}
                            />
                        </label>
                        {stories.map((s, i) => (
                            <div key={i} className="w-20 h-32 shrink-0 rounded-xl bg-black/50 overflow-hidden relative group border border-white/10">
                                {isVideoUrl(s) ? (
                                    <video 
                                        src={s.split('#')[0]} 
                                        className="w-full h-full object-cover" 
                                        autoPlay 
                                        playsInline 
                                        muted 
                                        loop
                                    />
                                ) : (
                                    <img src={s} className="w-full h-full object-cover" />
                                )}
                                <button 
                                    onClick={() => setStories(prev => prev.filter((_, idx) => idx !== i))}
                                    className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X size={12} className="text-white" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Submit */}
                <button 
                    onClick={handleSave}
                    disabled={isUploading || !title.trim() || !thumbnail || stories.length === 0}
                    className="w-full py-4 mt-2 bg-white text-black font-bold uppercase tracking-widest rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-opacity"
                >
                    {isUploading ? 'Creando...' : 'Crear Destacada'}
                </button>
            </div>
        </div>
    );
};
