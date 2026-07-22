const fs = require('fs');
const filePath = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx';
let code = fs.readFileSync(filePath, 'utf8');

const searchStr = '<p className="text-xs text-zinc-300 mb-2">{currentQuestionText}</p>';
const replacementStr = `
                        {currentNode && (
                            <div className="flex flex-col gap-2 mb-3 bg-black/30 p-3 rounded-lg border border-white/5">
                                <p className="text-[11px] text-zinc-200 leading-relaxed font-sans font-medium">
                                    {getFallbackDescription(currentNode, user)}
                                </p>
                                <div className="mt-1 pt-2 border-t border-white/5 pl-2 border-l-[2px] border-indigo-500/30">
                                    <p className="text-[8px] font-mono font-black uppercase tracking-widest text-indigo-400">Origen Clínico</p>
                                    <p className="text-[10px] text-zinc-400 italic leading-relaxed mt-1">
                                        {getFallbackSource(currentNode, bioData, phenomData)}
                                    </p>
                                </div>
                            </div>
                        )}
                        <p className="text-xs text-zinc-300 mb-2">{currentQuestionText}</p>
`;

if (code.includes(searchStr) && !code.includes('getFallbackDescription(currentNode')) {
    code = code.replace(searchStr, replacementStr);
    code = code.replace('let currentNodeLabel = "";', 'let currentNodeLabel = ""; let currentNode = null;');
    code = code.replace('const node = pat.sortedNodes[qState.currentStep];', 'const node = pat.sortedNodes[qState.currentStep]; currentNode = node;');
    
    fs.writeFileSync(filePath, code);
    console.log('Successfully updated the text inside the questionnaire!');
} else {
    console.log('Could not find the target string or already updated.');
}
