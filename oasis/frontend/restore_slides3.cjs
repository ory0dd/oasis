const fs = require('fs');

let app = fs.readFileSync('src/App.jsx', 'utf8');
const slides = fs.readFileSync('slides_extracted.jsx', 'utf8');

const parts = app.split('id="profile-scroll-container"');
if (parts.length > 1) {
    const afterContainer = parts[1];
    
    // Look for the end of the profile-slide div.
    // In HEAD, the profile-slide ends and then the profile-scroll-container ends with `</div>`
    // Let's find:
    const searchCRLF = '                </div>\r\n            </div>';
    const searchLF = '                </div>\n            </div>';
    
    let injected = false;
    if (afterContainer.includes(searchCRLF)) {
        app = app.replace(searchCRLF, '                </div>\r\n' + slides.replace(/\n/g, '\r\n') + '\r\n            </div>');
        injected = true;
        console.log('Injected slides (CRLF)!');
    } else if (afterContainer.includes(searchLF)) {
        app = app.replace(searchLF, '                </div>\n' + slides + '\n            </div>');
        injected = true;
        console.log('Injected slides (LF)!');
    }
    
    if (injected) {
        fs.writeFileSync('src/App.jsx', app, 'utf8');
    } else {
        console.log('Could not find exact end of profile-slide div.');
    }
}
