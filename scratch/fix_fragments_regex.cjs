const fs = require('fs');
const file = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /<span className=\{\`relative z-10 text-\[10px\] font-bold text-center leading-snug w-\[140px\] break-words p-3 \[text-shadow:0_1px_2px_rgba\(0,0,0,0\.8\)\] \$\{node\.dashed \? 'text-sky-300' : 'text-blue-200'\}\`\}>\{node\.label\}<\/span>[\s\S]*?className="p-2 rounded-lg bg-emerald-600\/90[\s\S]*?\{(node\.type === 'biological' \|\| node\.type === 'social') && \(/g;

const match = content.match(regex);
if (match) {
    console.log("Match found! length: " + match[0].length);
    const replacement = `<span className={\`relative z-10 text-[10px] font-bold text-center leading-snug w-[140px] break-words p-3 [text-shadow:0_1px_2px_rgba(0,0,0,0.8)] \${node.dashed ? 'text-sky-300' : 'text-blue-200'}\`}>{node.label}</span>
                                                    </div>
                                                )}
                                                {(node.type === 'biological' || node.type === 'social') && (`;
    content = content.replace(regex, replacement);
    fs.writeFileSync(file, content, 'utf8');
    console.log("Fixed!");
} else {
    console.log("No match found.");
}
