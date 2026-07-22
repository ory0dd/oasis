const fs = require('fs');
let content = fs.readFileSync('src/components/UnifiedCreatorView.jsx', 'utf8');
content = content.replace(
    'const scrollContainerRef = useRef(null);',
    `const scrollContainerRef = useRef(null);
    const [viewportHeight, setViewportHeight] = React.useState(window.visualViewport?.height || window.innerHeight);

    useEffect(() => {
        const update = () => setViewportHeight(window.visualViewport?.height || window.innerHeight);
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', update);
            window.visualViewport.addEventListener('scroll', update);
        }
        window.addEventListener('resize', update);
        return () => {
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', update);
                window.visualViewport.removeEventListener('scroll', update);
            }
            window.removeEventListener('resize', update);
        };
    }, []);`
);
content = content.replace(
    /className=\"fixed inset-x-0 md:inset-x-\[10vw\] lg:inset-x-\[20vw\] xl:inset-x-\[25vw\] top-\[140px\] md:top-\[100px\] bottom-0/,
    'className="fixed inset-x-0 md:inset-x-[10vw] lg:inset-x-[20vw] xl:inset-x-[25vw] top-[140px] md:top-[100px]'
);
content = content.replace(
    /<div className=\"fixed inset-x-0/,
    `<div style={{ height: window.innerWidth < 768 && viewportHeight > 96 ? (viewportHeight - 140) + 'px' : 'calc(100vh - 100px)' }} className="fixed inset-x-0`
);
fs.writeFileSync('src/components/UnifiedCreatorView.jsx', content);
