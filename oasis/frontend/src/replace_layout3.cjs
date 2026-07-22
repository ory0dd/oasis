const fs = require('fs');
const file = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const targetStart = '                                            {/* Node Label */}';
const targetEnd = '                                            {/* Content Section: Description OR IA Exploration */}';

const startIndex = content.indexOf(targetStart);
const endIndex = content.indexOf(targetEnd);

if (startIndex === -1 || endIndex === -1) {
    console.error('Target boundaries not found!');
    process.exit(1);
}

const replacement = `                                            {/* Node Header & Navigation */}
                                            <div className="flex items-start justify-between gap-3 mb-2">
                                                <h4 className="text-xs font-black text-white leading-snug tracking-wide uppercase">{currentNode.label}</h4>
                                                
                                                {/* Mini Node Navigator */}
                                                <div className="flex items-center gap-1 shrink-0 bg-white/5 border border-white/5 rounded-lg p-0.5 mt-0.5">
                                                    <button 
                                                        onClick={prevTourNode} 
                                                        disabled={tourActiveIndex === 0} 
                                                        className="p-1 rounded-md hover:bg-white/10 text-zinc-400 hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none"
                                                        title="Nodo anterior"
                                                    >
                                                        <ChevronLeft size={12} />
                                                    </button>
                                                    <span className="text-[8.5px] font-mono font-bold text-zinc-500 px-1">
                                                        {tourActiveIndex + 1} / {sortedTourNodes.length}
                                                    </span>
                                                    <button 
                                                        onClick={nextTourNode} 
                                                        disabled={tourActiveIndex === sortedTourNodes.length - 1} 
                                                        className="p-1 rounded-md hover:bg-white/10 text-zinc-400 hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none"
                                                        title="Siguiente nodo"
                                                    >
                                                        <ChevronRight size={12} />
                                                    </button>
                                                </div>
                                            </div>

`;

const newContent = content.substring(0, startIndex) + replacement + content.substring(endIndex);
fs.writeFileSync(file, newContent, 'utf8');
console.log('Replacement successful!');
