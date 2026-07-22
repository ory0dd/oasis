    const renderPublicProfileView = () => {
        const cleanPublicUser = typeof publicProfileUser === 'string' ? publicProfileUser.replace('@', '') : '';
        const publicUserPosts = (feed || []).filter(f => f && typeof f.username === 'string' && f.username.replace('@', '') === cleanPublicUser);
        const nonStoryPosts = publicUserPosts.filter(p => p && p.type !== 'story' && p.type !== 'highlight');
        
        let avatar = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${cleanPublicUser || 'anon'}`;
        let fullName = cleanPublicUser;
        let bio = 'Sin bio por ahora.';
        let cover = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop';
        
        if (publicProfileData && typeof publicProfileData === 'object') {
            if (typeof publicProfileData.avatar === 'string') avatar = publicProfileData.avatar;
            if (typeof publicProfileData.fullName === 'string') fullName = publicProfileData.fullName;
            if (typeof publicProfileData.bio === 'string') bio = publicProfileData.bio;
            if (typeof publicProfileData.coverImage === 'string') cover = publicProfileData.coverImage;
        }

        const totalPosts = nonStoryPosts.length;

        return (
            <div className="absolute inset-0 z-[1500] pointer-events-none">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto z-[1500]" onClick={(e) => { e.stopPropagation(); setPublicProfileUser(null); }} />
                
                <div className="absolute inset-x-0 md:inset-x-[5vw] lg:inset-x-[10vw] xl:inset-x-[10vw] top-[100px] bottom-0 rounded-t-[2.5rem] border-t border-x border-white/10 flex flex-col bg-[#050506] text-white shadow-[0_-20px_50px_rgba(0,0,0,0.8)] pb-safe overflow-hidden transition-all pointer-events-auto z-[1501]"
                    onTouchStart={(e) => { window._ppTouchStartY = e.touches[0].clientY; }}
                    onTouchEnd={(e) => {
                        const dy = e.changedTouches[0].clientY - (window._ppTouchStartY || 0);
                        const scrollEl = document.querySelector('[data-profile-scroll]');
                        const atTop = !scrollEl || scrollEl.scrollTop <= 4;
                        if (dy > 90 && atTop) setPublicProfileUser(null);
                    }}
                >
                    <div className="absolute top-0 left-0 w-full h-[60vh] z-0 pointer-events-none overflow-hidden" style={{ maskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)' }}>
                        <div className="absolute inset-0 transition-all duration-700 ease-in-out" style={{ backgroundImage: `url(${formatUrl(cover)})`, backgroundSize: 'cover', backgroundPosition: 'center center', opacity: 0.15 }} />
                    </div>

                    <button onClick={() => setPublicProfileUser(null)} className="absolute top-6 left-6 z-50 p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/70 hover:text-white transition-all">
                        <ArrowLeft size={18} />
                    </button>

                    <div data-profile-scroll className="w-full h-full overflow-y-auto no-scrollbar pb-32 relative z-10 pt-4">
                        <div className="w-full max-w-4xl mx-auto px-4 flex flex-col pointer-events-auto pt-10">
                            <div className="flex items-center gap-6 mb-6 mt-4">
                                <div className="relative shrink-0">
                                    <div className="w-20 h-20 md:w-28 md:h-28 rounded-full p-[2px] bg-white/10">
                                        <div className="w-full h-full rounded-full border-2 border-[#050506] overflow-hidden bg-zinc-900">
                                            <img src={formatUrl(avatar)} onError={(e) => { if (!e.target.dataset.failed) { e.target.dataset.failed = true; e.target.src = 'https://placehold.co/400x300/030304/444444?text=Offline'; } }} className="w-full h-full object-cover" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 flex justify-around md:justify-start md:gap-12 items-center">
                                    <div className="flex flex-col items-center">
                                        <span className="text-sm md:text-xl font-bold">{totalPosts}</span>
                                        <span className="text-[10px] text-zinc-400">publicaciones</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex flex-col gap-1 mb-6 px-1">
                                <h2 className="text-lg font-bold text-white">{fullName}</h2>
                                <span className="text-xs text-zinc-500 font-mono">@{cleanPublicUser}</span>
                            </div>
                            
                            <div className="px-1 mb-8">
                                <p className="text-sm leading-relaxed text-zinc-300 font-sans whitespace-pre-wrap">{bio}</p>
                            </div>
                            
                            <div className="flex w-full border-t border-white/10 mb-2">
                                <div className="flex-1 flex justify-center py-3 border-t-2 border-white text-white">
                                    <LayoutGrid size={20} />
                                </div>
                            </div>
                            
                            <div className="columns-2 md:columns-3 gap-1 md:gap-2 w-full space-y-1 md:space-y-2 px-1 pb-10">
                                {nonStoryPosts.map((post, index) => {
                                    const postImg = getBlockPreviewImage(post);
                                    const postVid = getBlockPreviewVideo(post);
                                    let cleanText = '';
                                    if (post.metadata?.feedText && typeof post.metadata.feedText === 'string') cleanText = post.metadata.feedText;
                                    else if (post.content && typeof post.content === 'string') cleanText = post.content.split('\n')[0];

                                    return (
                                        <div key={post.id || index} onClick={() => navigateToFeedAndFocusPost(post.id)} className="w-full bg-[#121214] border border-white/5 relative overflow-hidden cursor-pointer group hover:border-white/20 transition-all duration-500 rounded-lg break-inside-avoid shadow-lg">
                                            {postImg ? (
                                                <img src={formatUrl(postImg)} onError={(e) => { if (!e.target.dataset.failed) { e.target.dataset.failed = true; e.target.src = 'https://placehold.co/400x300/030304/444444?text=Offline'; } }} className="w-full h-auto block object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                                            ) : postVid ? (
                                                <video src={formatUrl(postVid)} onError={(e) => { if (!e.target.dataset.failed) { e.target.dataset.failed = true; e.target.poster = 'https://placehold.co/400x300/030304/444444?text=Offline'; } }} className="w-full h-auto block object-cover transition-transform duration-700 group-hover:scale-[1.03]" muted loop playsInline />
                                            ) : (
                                                <div className="w-full min-h-[140px] flex flex-col justify-center p-4 relative bg-gradient-to-br from-[#1a1a1e] to-[#0a0a0c]">
                                                    <p className="text-[10px] font-sans text-white/90 line-clamp-6">{cleanText}</p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };
