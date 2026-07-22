const fs = require('fs');
const file = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `    useEffect(() => {
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

const replaceStr = `    useEffect(() => {
        const handleTourDrag = (e) => {
            if (!isDraggingTour) return;
            setTourModalPos({ x: e.clientX - dragTourStartRef.current.x, y: e.clientY - dragTourStartRef.current.y });
        };
        const handleTourDragEnd = (e) => {
            if (!isDraggingTour) return;
            setIsDraggingTour(false);
        };
        if (isDraggingTour) {
            window.addEventListener('mousemove', handleTourDrag, { capture: true });
            window.addEventListener('mouseup', handleTourDragEnd, { capture: true });
        }
        return () => {
            window.removeEventListener('mousemove', handleTourDrag, { capture: true });
            window.removeEventListener('mouseup', handleTourDragEnd, { capture: true });
        };
    }, [isDraggingTour]);`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replaceStr);
    fs.writeFileSync(file, content, 'utf8');
    console.log("Fixed drag sticky issue!");
} else {
    console.log("Could not find the target useEffect");
}
