const fs = require('fs');
const path = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/App.jsx';
let code = fs.readFileSync(path, 'utf8');

// I want to replace the style block of Composer so that it ONLY applies the left/right/width when it's NOT in split view, OR wait. If it's in split view, className handles it. If it's NOT in split view, we WANT the composer to be full width/centered, NOT pushed to the right just because chat is open! Wait, previously OasisChat was a sidebar so Composer went to the right. But now OasisChat is full screen (if not split view). So Composer should just be full screen/centered if not split view!
// So we just completely remove the left/right/width overrides for the Composer!

const oldStyle = `style={{
                        ...(isChatOpen && window.innerWidth >= 768 ? {
                            left: 'calc(10vw + 28vw + 20px)',
                            right: '10vw',
                            width: 'auto'
                        } : {})
                    }}`;

code = code.replace(oldStyle, 'style={{}}');

fs.writeFileSync(path, code);
console.log('Removed annoying style block');
