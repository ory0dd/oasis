                {/* SLIDES 3+: PUBLICACIONES / TARJETAS (TIKTOK STYLE INDIVIDUAL SCROLL SNAP) */}
                {filteredReleases.length > 0 ? (
                    filteredReleases.map((b, index) => {
                        const isRes = b.content && typeof b.content === 'string' && b.content.includes('[resonancia]');
                        const isDia = b.entries && b.entries.length > 0;
                        const isInsight = b.type === 'insight';
                        const isNote = (b.type === 'text' || b.type === 'insight') && !isRes && !isDia;
                        const isImg = b.type === 'image' || b.type === 'relic';
                        const isChat = b.type === 'conversation';
                        const hasSubNotes = b.muralBlocks && b.muralBlocks.length > 0;

                        const noteColor = b.color || accent;
                        const cardBorderColor = isChat ? '#d946ef' : (isRes ? '#a855f7' : (isDia ? '#f59e0b' : (isInsight ? '#a855f7' : noteColor)));
                        const typeLabel = isChat ? 'DI├üLOGO AI' : (isRes ? 'RESONANCIA' : (isDia ? 'DIARIO' : (isImg ? 'MULTIMEDIA' : (isInsight ? 'REVELACI├ôN' : 'NOTA'))));
                        const isSelected = selectedIds.includes(b.id);

                        const isActive = activeSlideIndex === (index + 1);
                        return (
                            <div
                                key={b.id || index}
                                data-index={index + 1}
                                className="profile-slide w-full h-screen snap-start shrink-0 relative flex flex-col justify-center items-center px-6 md:px-10 z-10 overflow-hidden"
                            >
                                <div
                                    onClick={() => handleCardClick(b.id)}
                                    draggable={!isSelectionMode}
                                    onDragStart={(e) => {
                                        e.dataTransfer.setData("text/plain", b.id);
                                        e.dataTransfer.effectAllowed = "move";
                                    }}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        if (dragOverId !== b.id) setDragOverId(b.id);
                                    }}
                                    onDragLeave={() => {
                                        if (dragOverId === b.id) setDragOverId(null);
                                    }}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        setDragOverId(null);
                                        const draggedId = e.dataTransfer.getData("text/plain");
                                        handleReorderBlocks(draggedId, b.id);
                                    }}
                                    className={`w-full max-w-3xl h-[65vh] md:h-[70vh] bg-black/40 border rounded-[2.5rem] p-6 md:p-8 flex flex-col transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] transform-gpu relative overflow-hidden group/board-item shadow-2xl backdrop-blur-md cursor-pointer ${isActive
                                        ? 'scale-100 opacity-100 blur-0'
                                        : 'scale-90 opacity-20 blur-[1px]'
                                        } ${isSelectionMode
                                            ? (isSelected ? 'border-red-500 bg-red-950/10 shadow-[0_0_25px_rgba(239,68,68,0.25)]' : 'border-white/5 opacity-55 hover:opacity-100 hover:border-white/20')
                                            : 'border-white/10 hover:border-white/20'
                                        }`}
                                    style={{
                                        borderTop: `4px solid ${isSelectionMode && isSelected ? '#ef4444' : (dragOverId === b.id ? accent : cardBorderColor)}`,
                                        borderColor: dragOverId === b.id ? accent : '',
                                        boxShadow: dragOverId === b.id ? `0 0 25px ${accent}80` : '',
                                        opacity: dragOverId === b.id ? 0.7 : ''
                                    }}
                                >
                                    {/* Header Info */}
                                    <div className="flex justify-between items-center opacity-60 group-hover/board-item:opacity-100 transition-opacity pb-2 border-b border-white/5">
                                        <span className="text-[7px] font-black uppercase tracking-widest text-zinc-500">
                                            {typeLabel}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            {isSelectionMode ? (
                                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${isSelected
                                                    ? 'bg-red-500 border-red-500 text-white'
                                                    : 'border-white/30 bg-black/40'
                                                    }`}>
                                                    {isSelected && <Check size={8} />}
                                                </div>
                                            ) : (
                                                <>
                                                    <span className="text-[7px] font-mono text-zinc-600">
                                                        {b.isPublic ? 'P├ÜBLICO' : 'PRIVADO'}
                                                    </span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (b.isVirtual) {
                                                                if (window.confirm("┬┐Est├ís seguro de eliminar este di├ílogo permanentemente?")) {
                                                                    const updated = conversations.filter(c => c.id !== b.id);
                                                                    setConversations(updated);
                                                                    fetch(`${API_URL}/api/oasis/conversations?user=${user || localStorage.getItem('oasis_user')}`, {
                                                                        method: 'POST',
                                                                        headers: { 'Content-Type': 'application/json' },
                                                                        body: JSON.stringify(updated)
                                                                    });
                                                                }
                                                            } else {
                                                                deleteBlock(b.id);
                                                            }
                                                        }}
                                                        className="w-5 h-5 rounded-md bg-white/5 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-colors flex items-center justify-center"
                                                        title="Eliminar registro"
                                                    >
                                                        <Trash2 size={10} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Body Content */}
                                    {isImg && (
                                        <div className="flex-1 min-h-0 space-y-3 pt-4 flex flex-col">
                                            <div className="flex-1 w-full rounded-2xl overflow-hidden border border-white/5 relative bg-zinc-950/45">
                                                <img src={formatUrl(b.content)} className="absolute inset-0 w-full h-full object-cover group-hover/board-item:scale-105 transition-transform duration-700" />
                                            </div>
                                            {b.caption && (
                                                <h4 className="text-sm font-black italic uppercase text-zinc-300 shrink-0">
                                                    {b.caption}
                                                </h4>
                                            )}
                                        </div>
                                    )}

                                    {isChat && (() => {
                                        let msgs = [];
                                        try { msgs = JSON.parse(b.content) || []; } catch (e) { }
                                        return (
                                            <div className="flex-1 min-h-0 space-y-3 flex flex-col pt-4">
                                                <h4 className="text-base font-black italic uppercase text-purple-400 truncate leading-none shrink-0">
                                                    {b.caption || 'Di├ílogo AI'}
                                                </h4>
                                                <div className="flex-1 space-y-3 pr-1 overflow-y-auto no-scrollbar font-sans border-t border-white/5 pt-3">
                                                    {msgs.map((msg, idx) => (
                                                        <div key={idx} className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                                            <span className="text-[6px] font-black uppercase tracking-widest text-zinc-500">
                                                                {msg.role === 'user' ? 'T├║' : 'Kio'}
                                                            </span>
                                                            <p className={`text-[10px] leading-snug rounded-2xl px-3 py-1.5 font-sans ${msg.role === 'user'
                                                                ? 'bg-purple-900/20 border border-purple-800/30 text-purple-300 text-right'
                                                                : 'bg-white/5 border border-white/5 text-white/80'
                                                                } max-w-[90%] whitespace-pre-wrap`}>
                                                                {msg.content}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {isRes && (() => {
                                        const resMatch = b.content.match(/\[resonancia\]([\s\S]*?)(?=\[impacto\]|$)/);
                                        const impMatch = b.content.match(/\[impacto\]([\s\S]*?)(?=\[extrano\]|$)/);
                                        const extMatch = b.content.match(/\[extrano\]([\s\S]*?)$/);

                                        const resonanceText = resMatch ? resMatch[1].trim() : '';
                                        const impactText = impMatch ? impMatch[1].trim() : '';
                                        const strangeText = extMatch ? extMatch[1].trim() : '';

                                        return (
                                            <div className="flex-1 min-h-0 space-y-4 flex flex-col pt-4">
                                                <h4 className="text-base font-black italic uppercase text-purple-400 truncate leading-none shrink-0">
                                                    {b.caption || 'Resonancia Ps├¡quica'}
                                                </h4>
                                                <div className="flex-1 space-y-3 font-sans overflow-y-auto no-scrollbar">
                                                    {resonanceText && (
                                                        <div className="p-3.5 rounded-2xl bg-purple-950/15 border border-purple-500/10 space-y-1">
                                                            <span className="text-[7px] font-mono font-black uppercase text-purple-400 tracking-widest block">Resonancia Primal</span>
                                                            <p className="text-[11px] text-zinc-300 font-sans italic">"{resonanceText}"</p>
                                                        </div>
                                                    )}
                                                    {impactText && (
                                                        <div className="p-3.5 rounded-2xl bg-zinc-950/30 border border-white/5 space-y-1">
                                                            <span className="text-[7px] font-mono font-black uppercase text-zinc-500 tracking-widest block">Impacto Som├ítico</span>
                                                            <p className="text-[11px] text-zinc-400 font-sans italic">"{impactText}"</p>
                                                        </div>
                                                    )}
                                                    {strangeText && (
                                                        <div className="p-3.5 rounded-2xl bg-zinc-950/45 border border-white/5 space-y-1">
                                                            <span className="text-[7px] font-mono font-black uppercase text-zinc-600 tracking-widest block">Lo Extra├▒o / Glitch</span>
                                                            <p className="text-[11px] text-zinc-500 font-sans italic">"{strangeText}"</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {isDia && (
                                        <div className="flex-1 min-h-0 space-y-4 flex flex-col pt-4">
                                            <h4 className="text-base font-black italic uppercase text-amber-500 leading-none shrink-0">
                                                {b.caption || 'Bit├ícora / Diario'}
                                            </h4>
                                            <div className="flex flex-col gap-2 flex-1 overflow-y-auto no-scrollbar">
                                                {b.entries.map((entry, idx) => (
                                                    <div key={idx} className="bg-black/30 p-3 rounded-2xl border border-white/5 shrink-0">
                                                        <div className="flex justify-between items-center mb-1 text-[8px] font-mono text-zinc-500 uppercase tracking-widest">
                                                            <span>{new Date(entry.timestamp).toLocaleDateString()}</span>
                                                            <span>{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                        <p className="text-[10px] leading-relaxed text-zinc-300 font-sans italic">
                                                            "{entry.text}"
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {isNote && (
                                        <div className="flex-1 min-h-0 space-y-3 flex flex-col pt-4">
                                            <h4 className="text-lg font-black italic uppercase text-white truncate leading-none shrink-0">
                                                {b.caption || 'Nota Personal'}
                                            </h4>

                                            {(() => {
                                                const lines = (b.content || '').split('\n');
                                                const textLines = lines.filter(l => !l.startsWith('[img]') && !l.startsWith('[vid]') && !l.startsWith('[aud]')).join('\n');
                                                const inlineImage = lines.find(l => l.startsWith('[img]'))?.replace('[img]', '').trim();

                                                return (
                                                    <>
                                                        <div className="flex-1 overflow-y-auto no-scrollbar relative">
                                                            <p className="text-[11px] leading-relaxed text-zinc-300 font-sans italic selection:bg-accent/40 whitespace-pre-wrap">
                                                                {textLines}
                                                            </p>
                                                        </div>
                                                        {inlineImage && (
                                                            <div className="mt-2 w-full h-24 shrink-0 rounded-xl overflow-hidden border border-white/10">
                                                                <img src={formatUrl(inlineImage)} className="w-full h-full object-cover" alt="Adjunto" />
                                                            </div>
                                                        )}
                                                    </>
                                                );
                                            })()}

                                            {b.muralBlocks && b.muralBlocks.length > 0 && (
                                                <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pt-3 pb-1 shrink-0 border-t border-white/5 mt-auto">
                                                    {b.muralBlocks.map((mb, i) => (
                                                        <div key={mb.id || i} className="shrink-0 snap-center w-28 h-20 bg-white/5 hover:bg-white/10 transition-colors border border-white/10 rounded-xl p-2.5 flex flex-col items-center justify-center relative overflow-hidden group">
                                                            {mb.type === 'image' && <img src={formatUrl(mb.content)} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />}
                                                            {mb.type === 'text' && <p className="text-[7px] text-zinc-300 font-sans italic line-clamp-4 relative z-10">{mb.content}</p>}
                                                            <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded-full bg-black/80 border border-white/10 text-[5px] uppercase tracking-widest text-zinc-400 z-10">Sub</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Footer Controls */}
                                    <div className="pt-4 border-t border-white/5 mt-auto flex justify-between items-center shrink-0">
                                        <span className="text-[6px] font-bold text-zinc-500 uppercase font-mono tracking-widest">Oasis Digital Map</span>
                                        {!isSelectionMode && (
                                            <div className="flex gap-2">
                                                {isChat && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSelectConversation(b.id);
                                                            setView('canvas');
                                                        }}
                                                        className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500 border border-purple-500/30 rounded-xl text-[7px] font-black uppercase tracking-widest text-purple-400 hover:text-white hover:scale-105 active:scale-95 transition-all flex items-center gap-1"
                                                    >
                                                        <MessageSquare size={8} /> Abrir Di├ílogo
                                                    </button>
                                                )}
                                                {!b.isVirtual && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setView('canvas'); editBlock(b); }}
                                                        className="px-3 py-1.5 bg-white/5 hover:bg-accent hover:text-black border border-white/10 rounded-xl text-[7px] font-black uppercase tracking-widest text-zinc-400 hover:scale-105 active:scale-95 transition-all flex items-center gap-1"
                                                        style={{ '--accent-color': noteColor }}
                                                    >
                                                        <Focus size={8} /> Enfocar
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div
                        data-index={1}
                        className="profile-slide w-full h-screen snap-start shrink-0 relative flex flex-col justify-center items-center px-6 md:px-10 z-10 overflow-hidden"
                    >
                        <div className={`w-full max-w-3xl h-[40vh] flex flex-col items-center justify-center border border-white/5 bg-white/[0.01] rounded-[3rem] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] transform-gpu ${activeSlideIndex === 1 ? 'scale-100 opacity-100 blur-0' : 'scale-95 opacity-20 blur-[1px]'
                            }`}>
                            <Aperture size={32} className="mb-4 text-white/5 animate-spin-slow" />
                            <p className="text-[9px] font-black uppercase tracking-[0.6em] text-white/10 italic">Sin registros en esta categor├¡a</p>
                        </div>
                    </div>
                )}

                {/* SLIDE LAST: REORDER DROP ZONE */}
                {!isSelectionMode && filteredReleases.length > 0 && (
                    <div
                        data-index={filteredReleases.length + 1}
                        className="profile-slide w-full h-screen snap-start shrink-0 relative flex flex-col justify-center items-center px-6 md:px-10 z-10 overflow-hidden"
                    >
                        <div
                            onDragOver={(e) => {
                                e.preventDefault();
                                e.currentTarget.classList.add('bg-white/5', 'border-white/30', 'text-white');
                            }}
                            onDragLeave={(e) => {
                                e.currentTarget.classList.remove('bg-white/5', 'border-white/30', 'text-white');
                            }}
                            onDrop={(e) => {
                                e.preventDefault();
                                e.currentTarget.classList.remove('bg-white/5', 'border-white/30', 'text-white');
                                const draggedId = e.dataTransfer.getData("text/plain");
                                handleReorderBlocks(draggedId, 'FEED_END');
                            }}
                            className={`w-full max-w-3xl h-[25vh] border border-dashed border-white/10 rounded-[2.5rem] flex items-center justify-center text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-white hover:border-white/30 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] transform-gpu cursor-pointer backdrop-blur-md shadow-2xl ${activeSlideIndex === (filteredReleases.length + 1) ? 'scale-100 opacity-100 blur-0' : 'scale-95 opacity-20 blur-[1px]'
                                }`}
                        >
                            Arrastrar aqu├¡ para mover al final del feed
                        </div>
                    </div>
                )}

