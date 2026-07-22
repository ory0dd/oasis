const fs = require('fs'); let app = fs.readFileSync('src/App.jsx', 'utf8'); const targetStr =                 {/* Animated Scroll Down Indicator to open Canvas */}
                <div
                    className=" flex flex-col items-center gap-1 animate-bounce cursor-pointer pb-2 pointer-events-auto mt-auto shrink-0\
 onClick={() => {
 setView('canvas');
 }}
 >
 <span className=\text-[7px] font-black uppercase tracking-[0.3em] text-zinc-500\>Desliza para abrir el pizarrón</span>
 <ChevronDown size={12} className=\text-zinc-500\ />
 </div>
 </div>; const newCode = fs.readFileSync('../slides_to_restore.jsx', 'utf8'); const replacement = newCode.split(' {/* Animated Scroll Down Indicator */}')[1]; if (replacement) { app = app.replace(targetStr, ' {/* Animated Scroll Down Indicator */}' + replacement.split(' {/* FLOATING ACTION BAR FOR SELECTION DELETE */}')[0]); fs.writeFileSync('src/App.jsx', app); console.log('Replaced successfully!'); } else { console.log('Could not find split point'); }
