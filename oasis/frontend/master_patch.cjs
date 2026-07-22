const fs = require('fs');
let c = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Text changes
c = c.replace(/\$300 MXN/g, '$700 MXN');
c = c.replace(/Discord online y Centro Monterrey/g, 'Cerca del Parque Lineal de Escobedo');

// 2. Imports
c = c.replace(/import SimpleNotesView from '\.\/components\/SimpleNotesView';/, "import SimpleNotesView from './components/SimpleNotesView';\nimport InlineFeedPublisher from './components/InlineFeedPublisher';");

// 3. State variable
c = c.replace(/const \[publishModalBlock, setPublishModalBlock\] = useState\(null\);/, "const [publishModalBlock, setPublishModalBlock] = useState(null);\n    const [isPublishSelectOpen, setIsPublishSelectOpen] = useState(false);");

// 4. Inject the floating navbar and bottom sheet at the end of renderFeedView
c = c.replace(/<span className="text-\[7px\] font-black uppercase tracking-\[0\.4em\] text-zinc-500">Fin de las Frecuencias<\/span>\s*<\/div>\s*<\/div>\s*<\/div>\s*\)\}\s*<\/div>\s*\);\s*\};/, 
`<span className="text-[7px] font-black uppercase tracking-[0.4em] text-zinc-500">Fin de las Frecuencias</span>
                              </div>
                          </div>
                      </div>
                  )}

                  {/* FLOATING NAVBAR BUTTON */}
                  <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-center z-[5000]">
                      {!isPublishSelectOpen && (
                          <button
                              onPointerDown={(e) => { e.stopPropagation(); setIsPublishSelectOpen(true); }}
                              onClick={(e) => { e.stopPropagation(); setIsPublishSelectOpen(true); }}
                              className="flex items-center gap-3 px-6 py-3.5 bg-[#0c0c0d]/90 border border-white/10 rounded-full shadow-2xl backdrop-blur-3xl transition-all hover:scale-105 active:scale-95 pointer-events-auto group"
                          >
                              <div className="w-8 h-8 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform" style={{ backgroundColor: accent, color: '#000' }}>
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-widest text-white">Publicar Fragmento</span>
                          </button>
                      )}
                  </div>

                  {/* BOTTOM SHEET MODAL */}
                  {isPublishSelectOpen && (
                      <div className="fixed inset-0 z-[5000] pointer-events-none flex flex-col justify-end items-center">
                          <InlineFeedPublisher 
                              isOpen={true}
                              onClose={() => setIsPublishSelectOpen(false)}
                              blocks={blocks}
                              setBlocks={setBlocks}
                              syncBlocks={syncBlocks}
                              accent={accent}
                              avatar={avatar}
                          />
                      </div>
                  )}
              </div>
          );
      };`);

fs.writeFileSync('src/App.jsx', c);
