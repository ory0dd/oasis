const fs = require('fs');
const file = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Inject state for Draggable Modal
const stateInjection = `    const [isDraggingMap, setIsDraggingMap] = useState(false);
    const [tourModalPos, setTourModalPos] = useState({ x: 0, y: 0 });
    const [isDraggingTour, setIsDraggingTour] = useState(false);
    const dragTourStartRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const handleTourDrag = (e) => {
            if (!isDraggingTour) return;
            e.stopPropagation();
            setTourModalPos({ x: e.clientX - dragTourStartRef.current.x, y: e.clientY - dragTourStartRef.current.y });
        };
        const handleTourDragEnd = (e) => {
            if (!isDraggingTour) return;
            e.stopPropagation();
            setIsDraggingTour(false);
        };
        if (isDraggingTour) {
            window.addEventListener('mousemove', handleTourDrag);
            window.addEventListener('mouseup', handleTourDragEnd);
        }
        return () => {
            window.removeEventListener('mousemove', handleTourDrag);
            window.removeEventListener('mouseup', handleTourDragEnd);
        };
    }, [isDraggingTour]);`;

const stateTarget = `    const [isDraggingMap, setIsDraggingMap] = useState(false);`;
if (content.includes(stateTarget)) {
    content = content.replace(stateTarget, stateInjection);
    console.log("Injected drag state");
} else {
    console.log("Could not find state target");
}

// 2. Update Modal JSX to be smaller and draggable
const modalStartStr = `                            {mapViewTab === 'map' && tourActiveIndex !== null && sortedTourNodes[tourActiveIndex] && (() => {`;
const modalEndStr = `<ChevronRight size={13} />\r\n                                                </button>\r\n                                            </div>`;
const startIdx = content.indexOf(modalStartStr);
const endIdx = content.indexOf(modalEndStr, startIdx);

if (startIdx !== -1 && endIdx !== -1) {
    const fullEndIdx = endIdx + modalEndStr.length;
    // We need to grab the original IIFE body up to the return statement, and replace the returned JSX.
    // Let's just find the `return (` inside the block.
    const returnStr = `                                return (\r\n                                    <div`;
    const returnIdx = content.indexOf(returnStr, startIdx);
    
    // We'll replace everything from `<div\r\n                                        className="absolute bottom-24...` down to the end of the block.
    // Wait, let's just use regex to replace the wrapper div.
    
    // First, let's replace the outer wrapper classes and add the style tag.
    const outerWrapperRegex = /className="absolute bottom-24 left-1\/2 transform -translate-x-1\/2 w-\[95%\] max-w-sm sm:max-w-md z-\[150\] pointer-events-auto animate-in slide-in-from-bottom-4 duration-300"/;
    if (outerWrapperRegex.test(content)) {
        content = content.replace(outerWrapperRegex, `className={\`absolute bottom-24 left-1/2 z-[150] pointer-events-auto transition-transform duration-75 ease-out \${!isDraggingTour ? 'animate-in slide-in-from-bottom-4' : ''}\`} style={{ transform: \`translate(calc(-50% + \${tourModalPos.x}px), \${tourModalPos.y}px)\`, width: '310px' }}`);
        console.log("Updated modal wrapper");
    }

    // Now, update the inner padding and make the header the drag handle.
    const innerWrapperRegex = /<div className="bg-zinc-950\/95 border border-white\/10 rounded-2xl p-4 shadow-2xl sm:backdrop-blur-md flex flex-col gap-3 overflow-hidden">/;
    if (innerWrapperRegex.test(content)) {
        content = content.replace(innerWrapperRegex, `<div className="bg-zinc-950/95 border border-white/10 rounded-2xl p-3 shadow-2xl sm:backdrop-blur-md flex flex-col gap-2.5 overflow-hidden">`);
        console.log("Updated modal inner padding");
    }

    // Make header draggable
    const headerRegex = /<div className="flex items-center justify-between border-b border-white\/5 pb-2\.5">/;
    if (headerRegex.test(content)) {
        content = content.replace(headerRegex, `<div 
                                                className="flex items-center justify-between border-b border-white/5 pb-2 cursor-grab active:cursor-grabbing"
                                                onMouseDown={(e) => {
                                                    e.stopPropagation();
                                                    setIsDraggingTour(true);
                                                    dragTourStartRef.current = { x: e.clientX - tourModalPos.x, y: e.clientY - tourModalPos.y };
                                                }}
                                            >`);
        console.log("Made header draggable");
    }
}

fs.writeFileSync(file, content, 'utf8');
