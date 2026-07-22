const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');

const targetStr = `            // Scroll down -> open canvas
            if (deltaY > 50) {
                if (!isScrollingRef.current) {
                    isScrollingRef.current = true;
                    setView('canvas');
                    setTimeout(() => isScrollingRef.current = false, 800);
                }
            } else if (deltaY < -50) {
                // Scroll up / Swipe down -> open bitacora
                if (!isScrollingRef.current) {
                    isScrollingRef.current = true;
                    setIsBitacoraOpen(true);
                    setTimeout(() => isScrollingRef.current = false, 800);
                }
            }`;

const replacementStr = `            // Scroll down (pushing content up) -> open bitacora
            if (deltaY > 50) {
                if (!isScrollingRef.current) {
                    isScrollingRef.current = true;
                    setIsBitacoraOpen(true);
                    setTimeout(() => isScrollingRef.current = false, 800);
                }
            } else if (deltaY < -50) {
                // Pull down (scrolling up) -> open canvas
                if (!isScrollingRef.current) {
                    isScrollingRef.current = true;
                    setView('canvas');
                    setTimeout(() => isScrollingRef.current = false, 800);
                }
            }`;

const replaced = app.replace(targetStr, replacementStr);
if (replaced === app) {
    // try with CRLF
    const replaced2 = app.replace(targetStr.replace(/\n/g, '\r\n'), replacementStr.replace(/\n/g, '\r\n'));
    if (replaced2 === app) {
        console.log('Failed to replace');
    } else {
        fs.writeFileSync('src/App.jsx', replaced2, 'utf8');
        console.log('Replaced with CRLF');
    }
} else {
    fs.writeFileSync('src/App.jsx', replaced, 'utf8');
    console.log('Replaced with LF');
}
