const fs = require('fs');
const filepath = 'c:\\Users\\Administrador\\Downloads\\oasis\\oasis\\frontend\\src\\App.jsx';
let lines = fs.readFileSync(filepath, 'utf8').split(/\r?\n/);
lines.splice(4378, 21,
    '    // NUEVA LOGICA DE ENRUTAMIENTO PUBLICO',
    '    useEffect(() => {',
    '        const params = new URLSearchParams(window.location.search);',
    '        const userParam = params.get(\'u\');',
    '        if (userParam) {',
    '            setPublicProfileUser(userParam);',
    '        } else {',
    '            const path = window.location.pathname;',
    '            if (path !== \'/\' && path !== \'\') {',
    '                const potentialUser = path.substring(1).replace(\'/\', \'\');',
    '                if (potentialUser && !potentialUser.startsWith(\'api\') && potentialUser !== \'index.html\') {',
    '                    setPublicProfileUser(potentialUser);',
    '                }',
    '            }',
    '        }',
    '    }, []);',
    '',
    '    useEffect(() => {',
    '        if (publicProfileUser) {',
    '            window.history.pushState({}, \'\', \'/?u=\' + publicProfileUser.replace(\'@\', \'\'));',
    '        } else {',
    '            if (window.location.search.includes(\'u=\')) {',
    '                window.history.pushState({}, \'\', \'/\');',
    '            } else if (window.location.pathname !== \'/\' && window.location.pathname !== \'/index.html\') {',
    '                window.history.pushState({}, \'\', \'/\');',
    '            }',
    '        }',
    '    }, [publicProfileUser]);'
);
fs.writeFileSync(filepath, lines.join('\r\n'));
console.log('Done');
