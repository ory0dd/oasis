const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'App.jsx');
let content = fs.readFileSync(filePath, 'utf-8');

// The original static handlers in Composer:
const oldComposerTouch = /onTouchStart=\{e => e\.stopPropagation\(\)\}\s+onPointerDown=\{e => e\.stopPropagation\(\)\}\s+onWheel=\{e => e\.stopPropagation\(\)\}/g;

const newComposerTouch = `onTouchStart={(e) => { e.stopPropagation(); const touch = e.touches[0]; e.currentTarget.dataset.startY = touch.clientY; e.currentTarget.style.transition = 'none'; }}
                    onTouchMove={(e) => { e.stopPropagation(); const startY = parseFloat(e.currentTarget.dataset.startY || 0); const currentY = e.touches[0].clientY; const deltaY = currentY - startY; const scrollable = e.target.closest('.overflow-y-auto, textarea, input'); if (scrollable && scrollable.scrollTop > 0) return; if (deltaY > 0) { e.currentTarget.style.transform = \`translateY(\${deltaY}px)\`; } if (deltaY > 120) { e.currentTarget.style.transition = 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)'; e.currentTarget.style.transform = 'translateY(100%)'; setTimeout(() => { setIsComposerOpen(false); setView('canvas'); }, 200); } }}
                    onTouchEnd={(e) => { const startY = parseFloat(e.currentTarget.dataset.startY || 0); const currentY = e.changedTouches[0].clientY; const deltaY = currentY - startY; if (deltaY <= 120) { e.currentTarget.style.transition = 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)'; e.currentTarget.style.transform = 'translateY(0px)'; } }}
                    onPointerDown={e => e.stopPropagation()}
                    onWheel={(e) => { e.stopPropagation(); const scrollable = e.target.closest('.overflow-y-auto, textarea, input'); if (scrollable && (scrollable.scrollTop > 0 || e.deltaY > 0)) return; if (e.deltaY < -50) { e.currentTarget.style.transition = 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)'; e.currentTarget.style.transform = 'translateY(100%)'; setTimeout(() => { setIsComposerOpen(false); setView('canvas'); }, 200); } }}`;

content = content.replace(oldComposerTouch, newComposerTouch);

// Fix the height of the Composer div so it doesn't overflow past the bottom of the screen!
// Top is top-[140px] md:top-[100px]
// So height should subtract 140px on mobile and 100px on desktop.
const oldHeightStyle = `style={{ height: window.innerWidth < 768 && window.visualViewport?.height > 96 ? (window.visualViewport.height - 96) + 'px' : (window.visualViewport?.height || window.innerHeight) + 'px' }}`;
const newHeightStyle = `style={{ height: window.innerWidth < 768 ? (window.visualViewport?.height || window.innerHeight) - 140 + 'px' : (window.visualViewport?.height || window.innerHeight) - 100 + 'px' }}`;

content = content.replace(oldHeightStyle, newHeightStyle);

fs.writeFileSync(filePath, content);
console.log("Composer fixes applied.");
