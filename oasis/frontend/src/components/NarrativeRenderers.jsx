import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Mic, Radio, Zap, FileText } from 'lucide-react';

const formatUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5046';
    return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

export const TypedText = ({ text, speed = 40, delay = 500 }) => {
    const [displayedText, setDisplayedText] = React.useState('');
    const [started, setStarted] = React.useState(false);

    React.useEffect(() => {
        const timer = setTimeout(() => setStarted(true), delay);
        return () => clearTimeout(timer);
    }, [delay]);

    React.useEffect(() => {
        if (!started) return;
        if (displayedText.length < text.length) {
            const timeout = setTimeout(() => {
                setDisplayedText(text.slice(0, displayedText.length + 1));
            }, speed);
            return () => clearTimeout(timeout);
        }
    }, [displayedText, text, speed, started]);

    return <span>{displayedText}</span>;
};

export const SimpleNarrativeRenderer = React.memo(({ content }) => {
    if (!content) return null;

    const blocks = content.split(/(\[img\].*?|\[vid\].*?|\[aud\].*?|\[question\].*?|\[insight\].*?)/g);

    return (
        <div className="prose prose-invert max-w-none text-[13px] md:text-[15px] font-serif italic text-white/90 leading-relaxed selection:bg-accent/20">
            {blocks.map((block, i) => {
                const trimmed = block.trim();
                if (!trimmed) return null;

                if (trimmed.startsWith('[img]')) {
                    const url = formatUrl(trimmed.replace('[img]', '').trim());
                    return <div key={i} className="my-6 rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl animate-in fade-in zoom-in duration-700 bg-black/20"><img src={url} className="w-full h-auto object-cover max-h-[400px]" alt="Oasis Fragment" /></div>;
                }
                if (trimmed.startsWith('[vid]')) {
                    const url = formatUrl(trimmed.replace('[vid]', '').trim());
                    return <div key={i} className="my-6 rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl bg-black/20 aspect-video"><video src={url} controls className="w-full h-full object-cover" /></div>;
                }
                if (trimmed.startsWith('[aud]')) {
                    const url = formatUrl(trimmed.replace('[aud]', '').trim());
                    return (
                        <div key={i} className="my-4 p-5 bg-white/5 backdrop-blur-3xl rounded-[2rem] border border-white/10 flex items-center gap-4 animate-in slide-in-from-left duration-500">
                            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent"><Mic size={18} /></div>
                            <audio src={url} controls className="flex-1 scale-90 origin-left invert opacity-60 hover:opacity-100 transition-opacity" />
                        </div>
                    );
                }
                if (trimmed.startsWith('[question]')) {
                    const q = trimmed.replace('[question]', '').trim();
                    return (
                        <div key={i} className="my-8 p-8 bg-accent/10 backdrop-blur-3xl rounded-[2.5rem] border border-accent/30 shadow-[0_0_40px_rgba(var(--accent-rgb),0.2)] animate-in slide-in-from-right duration-700 group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-accent opacity-5 blur-3xl -translate-y-1/2 translate-x-1/2" />
                            <div className="flex gap-4 mb-4 items-center">
                                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent"><Radio size={16} /></div>
                                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-accent/60">Profundiza tu Conciencia</span>
                            </div>
                            <h3 className="text-xl md:text-2xl font-serif italic text-white/90 leading-tight">"{q}"</h3>
                        </div>
                    );
                }
                if (trimmed.startsWith('[insight]')) {
                    const ins = trimmed.replace('[insight]', '').trim();
                    return (
                        <div key={i} className="my-4 p-6 bg-purple-500/10 backdrop-blur-xl rounded-3xl border border-purple-500/20 shadow-[0_0_20px_rgba(192,38,211,0.05)] animate-in fade-in zoom-in duration-700 group relative">
                            <div className="flex gap-3 mb-3 items-center">
                                <Zap size={12} className="text-purple-400 opacity-50" />
                                <span className="text-[7px] font-black uppercase tracking-[0.3em] text-purple-400/50">Resonancia</span>
                            </div>
                            <div className="text-sm md:text-base font-serif italic text-white/90 leading-snug">
                                <ReactMarkdown>{ins}</ReactMarkdown>
                            </div>
                        </div>
                    );
                }

                return (
                    <ReactMarkdown
                        key={i}
                        components={{
                            h1: ({ node, ...props }) => <h1 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-4 mt-6 border-b border-white/10 pb-2" {...props} />,
                            h2: ({ node, ...props }) => <h2 className="text-xl font-black italic uppercase tracking-tight text-accent mb-3 mt-5" {...props} />,
                            h3: ({ node, ...props }) => <h3 className="text-lg font-black italic text-white/80 mb-2 mt-4" {...props} />,
                            p: ({ node, ...props }) => <p className="mb-4 last:mb-0" {...props} />,
                            ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-4 space-y-1 text-white/70" {...props} />,
                            ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-4 space-y-1 text-white/70" {...props} />,
                            li: ({ node, ...props }) => <li className="marker:text-accent" {...props} />,
                            strong: ({ node, ...props }) => <strong className="font-black text-accent" {...props} />,
                            em: ({ node, ...props }) => <em className="italic text-white" {...props} />,
                            code: ({ node, ...props }) => <code className="font-mono text-[11px] bg-white/5 px-1.5 py-0.5 rounded border border-white/10 text-cyan-400" {...props} />,
                            blockquote: ({ node, ...props }) => <blockquote className="border-l-2 border-accent/30 pl-4 py-2 my-4 bg-accent/5 rounded-r-xl italic text-white/60" {...props} />,
                        }}
                    >
                        {block.replaceAll('\u2028', '\n')}
                    </ReactMarkdown>
                );
            })}
        </div>
    );
});

export const WordByWordRenderer = ({ content, speed = 8, wordsPerTick = 2, onComplete }) => {
    const words = React.useMemo(() => content.split(' '), [content]);
    const [displayedCount, setDisplayedCount] = React.useState(0);

    React.useEffect(() => {
        if (displayedCount < words.length) {
            const timer = setTimeout(() => {
                setDisplayedCount(prev => Math.min(prev + wordsPerTick, words.length));
            }, speed);
            return () => clearTimeout(timer);
        } else if (onComplete) {
            onComplete();
        }
    }, [displayedCount, words.length, speed, wordsPerTick, onComplete]);

    const partial = words.slice(0, displayedCount).join(' ');
    return <SimpleNarrativeRenderer content={partial} />;
};
