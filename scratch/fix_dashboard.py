import sys

filename = r"c:\Users\Administrador\Downloads\oasis\oasis\frontend\src\components\MyResponsesDashboard.jsx"

with open(filename, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# We need to restore the button in the Phenom expanded section.
# First, let's locate the place where it was deleted.
# We are looking for:
# <span className="text-zinc-500 hover:text-white transition-colors">
#     {phenomExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
# </span>
# )}
# </div>

phenom_marker = '                                            <span className="text-zinc-500 hover:text-white transition-colors">\n'
for i in range(len(lines)):
    if lines[i] == phenom_marker and "{phenomExpanded ?" in lines[i+1] and "</span>\n" in lines[i+2]:
        if ")}\n" in lines[i+3] and "</div>\n" in lines[i+4]:
            # This is the damaged area.
            print(f"Found damaged phenom area at line {i+1}")
            # Replace lines i+3 with the correct restored code
            lines[i+3] = '                                        </button>\n'
            lines.insert(i+4, '                                        {phenomExpanded && isEmbedded && phenomData && !isEditingPhenom && (\n')
            lines.insert(i+5, '                                            <button\n')
            lines.insert(i+6, '                                                onClick={(e) => {\n')
            lines.insert(i+7, '                                                    e.stopPropagation();\n')
            lines.insert(i+8, '                                                    setTempPhenomData(phenomData);\n')
            lines.insert(i+9, '                                                    setIsEditingPhenom(true);\n')
            lines.insert(i+10, '                                                }}\n')
            lines.insert(i+11, '                                                className="ml-4 px-3 py-1 bg-white/5 border border-white/10 hover:bg-sky-600 hover:border-transparent text-sky-300 hover:text-white rounded-lg font-bold text-[9px] uppercase tracking-wider transition-all"\n')
            lines.insert(i+12, '                                            >\n')
            lines.insert(i+13, '                                                Editar Respuestas\n')
            lines.insert(i+14, '                                            </button>\n')
            lines.insert(i+15, '                                        )}\n')
            break

# Now we need to remove the orphaned braces near MÓDULO 1.5
for i in range(len(lines)):
    if "{/* MÓDULO 1.5: ISLAS EXISTENCIALES (PATRONES CONDUCTUALES) ABAJO DEL MAPA */}" in lines[i]:
        print(f"Found modulo 1.5 at line {i+1}")
        # Look backwards to find the orphaned braces
        # They look like:
        # 4543:                                                 )}
        # 4544:                                             </button>
        # 4545:                                         </div>
        # 4546:                                     </div>
        # 4547:                                 )}
        # 4548:                             </div>
        
        # We need to delete lines 4543 to 4547
        if ")}\n" in lines[i-6] and "</button>\n" in lines[i-5] and "</div>\n" in lines[i-4] and "</div>\n" in lines[i-3] and ")}\n" in lines[i-2]:
            print(f"Found orphaned lines from {i-5} to {i-1}, deleting them...")
            del lines[i-6:i-1]
            break
        elif ")}\n" in lines[i-7] and "</button>\n" in lines[i-6]:
            print(f"Found orphaned lines, deleting...")
            del lines[i-7:i-2]
            break
        else:
            print("Could not find orphaned lines dynamically, attempting to search...")
            for j in range(i-10, i):
                print(f"Line {j+1}: {repr(lines[j])}")

with open(filename, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Done")
