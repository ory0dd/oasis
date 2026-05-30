import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
        <div className="prose prose-invert max-w-none text-[14px] md:text-[16px] font-sans text-white/90 leading-relaxed selection:bg-white/20">
            {blocks.map((block, i) => {
                const trimmed = block.trim();
                if (!trimmed) return null;

                if (trimmed.startsWith('[img]')) {
                    const url = formatUrl(trimmed.replace('[img]', '').trim());
                    return <div key={i} className="my-6 rounded-2xl overflow-hidden border border-white/10 shadow-lg animate-in fade-in zoom-in duration-700 bg-black/20"><img src={url} className="w-full h-auto object-cover max-h-[400px]" alt="Oasis Fragment" /></div>;
                }
                if (trimmed.startsWith('[vid]')) {
                    const url = formatUrl(trimmed.replace('[vid]', '').trim());
                    return <div key={i} className="my-6 rounded-2xl overflow-hidden border border-white/10 shadow-lg bg-black/20 aspect-video"><video src={url} controls className="w-full h-full object-cover" /></div>;
                }
                if (trimmed.startsWith('[aud]')) {
                    const url = formatUrl(trimmed.replace('[aud]', '').trim());
                    return (
                        <div key={i} className="my-4 p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex items-center gap-4 animate-in slide-in-from-left duration-500">
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/80"><Mic size={18} /></div>
                            <audio src={url} controls className="flex-1 scale-90 origin-left invert opacity-60 hover:opacity-100 transition-opacity" />
                        </div>
                    );
                }
                if (trimmed.startsWith('[question]')) {
                    const q = trimmed.replace('[question]', '').trim();
                    return (
                        <div key={i} className="my-8 p-6 md:p-8 bg-zinc-900/50 backdrop-blur-xl rounded-2xl border border-zinc-800 shadow-md animate-in slide-in-from-right duration-700">
                            <div className="flex gap-3 mb-3 items-center">
                                <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400"><Radio size={14} /></div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Profundiza tu Conciencia</span>
                            </div>
                            <h3 className="text-xl md:text-2xl font-semibold text-white/95 leading-tight">"{q}"</h3>
                        </div>
                    );
                }
                if (trimmed.startsWith('[insight]')) {
                    const ins = trimmed.replace('[insight]', '').trim();
                    return (
                        <div key={i} className="my-4 p-5 bg-zinc-900/40 backdrop-blur-md rounded-2xl border border-zinc-800 shadow-sm animate-in fade-in zoom-in duration-700">
                            <div className="flex gap-2 mb-2 items-center">
                                <Zap size={14} className="text-zinc-400" />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Resonancia</span>
                            </div>
                            <div className="text-sm md:text-base font-sans text-zinc-300 leading-relaxed">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{ins}</ReactMarkdown>
                            </div>
                        </div>
                    );
                }

                return (
                    <ReactMarkdown
                        key={i}
                        remarkPlugins={[remarkGfm]}
                        components={{
                            h1: ({ node, ...props }) => <h1 className="text-2xl font-bold tracking-tight text-white mb-4 mt-8 pb-2 border-b border-white/10" {...props} />,
                            h2: ({ node, ...props }) => <h2 className="text-xl font-semibold tracking-tight text-white mb-3 mt-6" {...props} />,
                            h3: ({ node, ...props }) => <h3 className="text-lg font-semibold text-white/90 mb-2 mt-5" {...props} />,
                            p: ({ node, ...props }) => <p className="mb-4 text-zinc-300 leading-relaxed last:mb-0" {...props} />,
                            ul: ({ node, ...props }) => <ul className="list-disc list-outside ml-4 mb-4 space-y-1.5 text-zinc-300" {...props} />,
                            ol: ({ node, ...props }) => <ol className="list-decimal list-outside ml-4 mb-4 space-y-1.5 text-zinc-300" {...props} />,
                            li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                            strong: ({ node, ...props }) => <strong className="font-semibold text-white" {...props} />,
                            em: ({ node, ...props }) => <em className="italic text-zinc-400" {...props} />,
                            code: ({ inline, node, ...props }) => inline ? <code className="font-mono text-[13px] bg-zinc-800/80 px-1.5 py-0.5 rounded text-zinc-200" {...props} /> : <pre className="bg-zinc-900/80 p-4 rounded-xl border border-white/10 overflow-x-auto mb-4 text-[13px] text-zinc-300 font-mono"><code {...props} /></pre>,
                            blockquote: ({ node, ...props }) => <blockquote className="border-l-[3px] border-zinc-700 pl-4 py-1 my-5 text-zinc-400" {...props} />,
                            table: ({ node, ...props }) => <div className="overflow-x-auto my-6"><table className="w-full text-left text-[14px] border-collapse" {...props} /></div>,
                            thead: ({ node, ...props }) => <thead className="border-b border-white/10 text-zinc-400 font-medium" {...props} />,
                            tbody: ({ node, ...props }) => <tbody className="divide-y divide-white/5" {...props} />,
                            tr: ({ node, ...props }) => <tr className="hover:bg-white/[0.02] transition-colors" {...props} />,
                            th: ({ node, ...props }) => <th className="px-4 py-3 font-semibold text-white" {...props} />,
                            td: ({ node, ...props }) => <td className="px-4 py-3 text-zinc-300 align-top" {...props} />,
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
