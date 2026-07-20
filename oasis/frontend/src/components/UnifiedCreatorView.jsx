import React, { useEffect } from 'react';
import { Edit3, MessageCircle, StickyNote, Sparkles, X, Share2 } from 'lucide-react';

const UnifiedCreatorView = ({ onClose, setActiveTab, onComposeNote, onOpenPublishSelector }) => {
    const [viewportHeight, setViewportHeight] = React.useState(window.visualViewport?.height || window.innerHeight);

    useEffect(() => {
        const update = () => setViewportHeight(window.visualViewport?.height || window.innerHeight);
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', update);
            window.visualViewport.addEventListener('scroll', update);
        }
        window.addEventListener('resize', update);
        return () => {
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', update);
                window.visualViewport.removeEventListener('scroll', update);
            }
            window.removeEventListener('resize', update);
        };
    }, []);

    const modes = [
        {
            key: 'compose',
            icon: Edit3,
            label: 'Nueva Nota',
            desc: 'Escribe o graba un fragmento',
            action: onComposeNote,
        },
        {
            key: 'chat',
            icon: MessageCircle,
            label: 'Conversación IA',
            desc: 'Explora con la inteligencia',
            action: () => setActiveTab('chat'),
        },
        {
            key: 'diary',
            icon: StickyNote,
            label: 'Diario Personal',
            desc: 'Escribe con total libertad',
            action: () => setActiveTab('diary'),
        },
        {
            key: 'noise',
            icon: Sparkles,
            label: 'Ruido Interior',
            desc: 'Resonancia y frecuencias',
            action: () => setActiveTab('noise'),
        },
        {
            key: 'publish',
            icon: Share2,
            label: 'Publicar en Feed',
            desc: 'Comparte un fragmento',
            action: onOpenPublishSelector,
        }
    ];

    return (
        <div
            style={{
                height: window.innerWidth < 768 && viewportHeight > 96
                    ? (viewportHeight - 140) + 'px'
                    : 'calc(100vh - 100px)'
            }}
            className="fixed inset-x-0 md:inset-x-[5vw] lg:inset-x-[10vw] xl:inset-x-[10vw] top-[140px] md:top-[100px] bottom-0 rounded-t-[2.5rem] border-t border-x border-white/5 md:border-white/10 z-[1500] flex flex-col bg-[#050506]/95 backdrop-blur-md text-white shadow-[0_-20px_50px_rgba(0,0,0,0.8)] pb-safe overflow-hidden animate-in fade-in slide-in-from-bottom-[60%] duration-500 transition-all pointer-events-auto"
            onTouchStart={(e) => {
                e.stopPropagation();
                const touch = e.touches[0];
                const rect = e.currentTarget.getBoundingClientRect();
                if (touch.clientY - rect.top <= 100) {
                    e.currentTarget.dataset.dragAllowed = 'true';
                    e.currentTarget.dataset.startY = touch.clientY;
                    e.currentTarget.style.transition = 'none';
                } else {
                    e.currentTarget.dataset.dragAllowed = 'false';
                }
            }}
            onTouchMove={(e) => {
                e.stopPropagation();
                if (e.currentTarget.dataset.dragAllowed !== 'true') return;
                const startY = parseFloat(e.currentTarget.dataset.startY || 0);
                const currentY = e.touches[0].clientY;
                const deltaY = currentY - startY;

                const scrollable = e.target.closest('.overflow-y-auto');
                if (scrollable && scrollable.scrollTop > 0) return;

                if (deltaY > 0) {
                    e.currentTarget.style.transform = `translateY(${deltaY}px)`;
                }

                if (deltaY > 120) {
                    e.currentTarget.style.transition = 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
                    e.currentTarget.style.transform = `translateY(100%)`;
                    setTimeout(() => onClose(), 200);
                }
            }}
            onTouchEnd={(e) => {
                if (e.currentTarget.dataset.dragAllowed !== 'true') return;
                const startY = parseFloat(e.currentTarget.dataset.startY || 0);
                const currentY = e.changedTouches[0].clientY;
                const deltaY = currentY - startY;
                if (deltaY <= 120) {
                    e.currentTarget.style.transition = 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
                    e.currentTarget.style.transform = `translateY(0px)`;
                }
            }}
            onPointerDown={e => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
        >
            {/* HEADER */}
            <div className="shrink-0 flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/5">
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-600">¿Qué quieres crear?</p>
                <button
                    onClick={onClose}
                    className="p-2 rounded-full text-zinc-600 hover:text-white hover:bg-white/10 transition-colors"
                >
                    <X size={18} />
                </button>
            </div>

            {/* MODE LIST */}
            <div className="flex-1 flex flex-col justify-center gap-3 px-5 py-6">
                {modes.map(({ key, icon: Icon, label, desc, action }) => (
                    <button
                        key={key}
                        onClick={() => action && action()}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/10 transition-all duration-200 text-left group active:scale-[0.98]"
                    >
                        <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-white/10 transition-colors">
                            <Icon size={20} className="text-zinc-400 group-hover:text-white transition-colors" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-white">{label}</p>
                            <p className="text-[12px] text-zinc-600 mt-0.5">{desc}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default UnifiedCreatorView;
