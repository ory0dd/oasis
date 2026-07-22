const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'components', 'PsychologistDashboard.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const kioChatsComponent = `
    const renderKioChatsTab = () => {
        if (!conversations || conversations.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-4">
                    <MessageSquare size={48} className="opacity-20" />
                    <p className="font-mono text-xs uppercase tracking-widest">No hay historial de charlas con Kio para este paciente.</p>
                </div>
            );
        }

        const selectedConversation = conversations.find(c => c.id === selectedKioChatId);

        return (
            <div className="flex h-full gap-6 animate-in fade-in duration-500">
                {/* Master list */}
                <div className="w-1/3 flex flex-col gap-3 overflow-y-auto pr-2 custom-scroll">
                    <h3 className="text-xs font-mono font-black uppercase tracking-widest text-emerald-500 mb-2 border-b border-white/5 pb-2">Sesiones Registradas</h3>
                    {conversations.map(conv => (
                        <button
                            key={conv.id}
                            onClick={() => setSelectedKioChatId(conv.id)}
                            className={\`text-left p-4 rounded-2xl border transition-all duration-300 flex flex-col gap-2 \${selectedKioChatId === conv.id ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-zinc-950/40 border-white/5 hover:border-white/10'}\`}
                        >
                            <div className="flex justify-between items-center w-full">
                                <span className={\`text-xs font-bold \${selectedKioChatId === conv.id ? 'text-emerald-400' : 'text-white'}\`}>{conv.title || 'Conversación'}</span>
                                <MessageSquare size={14} className={selectedKioChatId === conv.id ? 'text-emerald-400' : 'text-zinc-600'} />
                            </div>
                            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wide">
                                {new Date(conv.updatedAt || conv.createdAt || Date.now()).toLocaleDateString()} • {conv.messages?.length || 0} msgs
                            </span>
                        </button>
                    ))}
                </div>

                {/* Detail view */}
                <div className="flex-1 bg-zinc-950/60 border border-white/5 rounded-3xl flex flex-col overflow-hidden">
                    {selectedConversation ? (
                        <>
                            <div className="p-5 border-b border-white/5 bg-zinc-900/20">
                                <h4 className="text-sm font-bold text-emerald-400">{selectedConversation.title}</h4>
                                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-1 block">ID: {selectedConversation.id}</span>
                            </div>
                            <div className="flex-1 p-6 overflow-y-auto space-y-6 custom-scroll">
                                {(selectedConversation.messages || []).map((msg, idx) => {
                                    const isUser = msg.role === 'user';
                                    return (
                                        <div key={idx} className={\`flex gap-4 \${isUser ? 'justify-end' : 'justify-start'}\`}>
                                            {!isUser && (
                                                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                                                    <span className="text-emerald-400 font-black text-xs font-mono">K</span>
                                                </div>
                                            )}
                                            <div className={\`p-4 rounded-2xl max-w-[80%] \${isUser ? 'bg-zinc-800 text-zinc-100 rounded-tr-sm' : 'bg-zinc-900/80 border border-white/5 text-zinc-300 rounded-tl-sm'}\`}>
                                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                            </div>
                                            {isUser && (
                                                <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0">
                                                    <User size={14} className="text-zinc-400" />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-3">
                            <Compass size={40} className="opacity-20" />
                            <p className="text-[10px] font-mono uppercase tracking-widest">Selecciona una conversación</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };
`;

const searchStr = '    return (\n        <div className="fixed inset-0 z-50 bg-[#030304]';

if (!content.includes('const renderKioChatsTab = () => {')) {
    content = content.replace(searchStr, kioChatsComponent + '\n' + searchStr);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Injection successful');
} else {
    console.log('Already injected');
}
