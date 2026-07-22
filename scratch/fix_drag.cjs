const fs = require('fs');
const file = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const searchRegex = /<div\s+className="flex items-center justify-between border-b border-white\/5 pb-2 cursor-grab active:cursor-grabbing"\s+onMouseDown=\{\(e\) => \{\s+e\.stopPropagation\(\);\s+setIsDraggingTour\(true\);\s+dragTourStartRef\.current = \{ x: e\.clientX - tourModalPos\.x, y: e\.clientY - tourModalPos\.y \};\s+\}\}/;

const replacement = `<div 
                                                className="flex items-center justify-between border-b border-white/5 pb-2 cursor-grab active:cursor-grabbing select-none"
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setIsDraggingTour(true);
                                                    dragTourStartRef.current = { x: e.clientX - tourModalPos.x, y: e.clientY - tourModalPos.y };
                                                }}`;

if (searchRegex.test(content)) {
    content = content.replace(searchRegex, replacement);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed drag behavior!');
} else {
    console.log('Could not find the target string!');
}
