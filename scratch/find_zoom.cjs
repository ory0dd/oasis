const fs = require('fs');
const file = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const resetIdx = content.indexOf('const resetMapTransform');
if (resetIdx !== -1) {
    console.log('RESET LOGIC:\n', content.substring(resetIdx, resetIdx + 1200));
}

const handleWheelIdx = content.indexOf('const handleWheel');
if (handleWheelIdx !== -1) {
    console.log('WHEEL LOGIC:\n', content.substring(handleWheelIdx, handleWheelIdx + 600));
}

const handleZoomIdx = content.indexOf('const handleZoom');
if (handleZoomIdx !== -1) {
    console.log('ZOOM LOGIC:\n', content.substring(handleZoomIdx, handleZoomIdx + 600));
}
