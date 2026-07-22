import sys

file_path = r'c:\Users\Administrador\Downloads\oasis\oasis\frontend\src\components\PsychologistDashboard.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add Menu
content = content.replace('Settings, Archive, ChevronDown, Check, LogOut, CheckCircle, Target, Sparkles', 'Settings, Archive, ChevronDown, Check, LogOut, CheckCircle, Target, Sparkles, Menu')

# 2. Add state
if 'const [isSidebarOpen, setIsSidebarOpen] = useState(true);' not in content:
    content = content.replace(
        'const [selectedKioChatId, setSelectedKioChatId] = useState(null);',
        'const [selectedKioChatId, setSelectedKioChatId] = useState(null);\n    const [isSidebarOpen, setIsSidebarOpen] = useState(true);'
    )

# 3. Sidebar toggle width
old_sidebar = '<div className="w-full md:w-80 md:h-full bg-zinc-950/60 border-b md:border-b-0 md:border-r border-white/5 flex flex-col shrink-0">'
new_sidebar = '<div className={`w-full ${isSidebarOpen ? \'md:w-80\' : \'md:w-20\'} md:h-full bg-zinc-950/60 border-b md:border-b-0 md:border-r border-white/5 flex flex-col shrink-0 transition-all duration-300 overflow-x-hidden`}>'
content = content.replace(old_sidebar, new_sidebar)

# 4. Hamburger + Patient Badge wrap
old_badge_start = '<div className="flex flex-col gap-4 p-4 rounded-3xl border border-white/5 bg-zinc-950/50 relative overflow-hidden mb-8">'
new_badge_start = '<button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`absolute top-6 z-10 w-8 h-8 flex items-center justify-center rounded-xl bg-zinc-950 border border-white/5 text-zinc-400 hover:text-white transition-all ${isSidebarOpen ? \'left-6\' : \'left-1/2 -translate-x-1/2\'}`}><Menu size={16} /></button>\n                        <div className={`flex flex-col gap-4 p-4 rounded-3xl border border-white/5 bg-zinc-950/50 relative overflow-hidden transition-all ${!isSidebarOpen ? \'opacity-0 translate-x-[-20px] pointer-events-none h-0 p-0 mb-0 border-0\' : \'mb-8\'}`}>'
content = content.replace(old_badge_start, new_badge_start)

# 5. Sessions Wrap
old_session = '''<div className="flex flex-col mb-8">
                                <span className="text-[9px] font-mono font-black uppercase tracking-widest text-zinc-600 mb-3">HISTORIAL DE SESIONES:</span>'''
new_session = '''<div className={`flex flex-col transition-all ${!isSidebarOpen ? \'opacity-0 h-0 pointer-events-none overflow-hidden mb-0\' : \'mb-8\'}`}>
                                <span className="text-[9px] font-mono font-black uppercase tracking-widest text-zinc-600 mb-3">HISTORIAL DE SESIONES:</span>'''
content = content.replace(old_session, new_session)

# 6. Tabs Wrap
old_tab_text = '''<div className="text-left min-w-0">
                                              <div className={`text-xs font-black uppercase tracking-wider mb-1 truncate ${isActive ? 'text-accent' : 'text-white'}`>'''
new_tab_text = '''{isSidebarOpen && <div className="text-left min-w-0">
                                              <div className={`text-xs font-black uppercase tracking-wider mb-1 truncate ${isActive ? 'text-accent' : 'text-white'}`>'''
content = content.replace(old_tab_text, new_tab_text)

old_tab_end = '''<div className={`text-[9px] font-mono uppercase tracking-widest truncate transition-colors ${isActive ? 'text-accent/70' : 'text-zinc-500'}`}>
                                                  {tab.desc}
                                              </div>
                                          </div>'''
new_tab_end = '''<div className={`text-[9px] font-mono uppercase tracking-widest truncate transition-colors ${isActive ? 'text-accent/70' : 'text-zinc-500'}`}>
                                                  {tab.desc}
                                              </div>
                                          </div>}'''
content = content.replace(old_tab_end, new_tab_end)

old_tab_button_end = '''</button>
                                  );
                              })}'''
new_tab_button_end = '''</button>
                                  );
                              })}'''
content = content.replace(old_tab_button_end, new_tab_button_end)

# 7. Exit Button Text
old_exit = '''<LogOut className="w-4 h-4" />
                            Salir del Caso'''
new_exit = '''<LogOut className="w-4 h-4" />
                            {isSidebarOpen && "Salir del Caso"}'''
content = content.replace(old_exit, new_exit)


with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Replacements executed successfully")
