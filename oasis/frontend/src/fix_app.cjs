const fs = require('fs');

let content = fs.readFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/App.jsx', 'utf8');

const badBlock = `className={\`py-4 rounded-2xl flex items-center justify-center gap-2 transition-all border $|
                                            (phenomTextValue?.trim())
                                            ? 'bg-purple-600 border-purple-500 text-black shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:bg-purple-500'
                                            : 'bg-white/5 border-white/10 text-zinc-600 opacity-50'
                                        }}\`>`;

const goodBlock = `className={\`py-4 rounded-2xl flex items-center justify-center gap-2 transition-all border \${
                                            (phenomTextValue?.trim())
                                            ? 'bg-purple-600 border-purple-500 text-black shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:bg-purple-500'
                                            : 'bg-white/5 border-white/10 text-zinc-600 opacity-50'
                                        }\`}>`;

content = content.replace(badBlock, goodBlock);
fs.writeFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/App.jsx', content);
console.log('done');
