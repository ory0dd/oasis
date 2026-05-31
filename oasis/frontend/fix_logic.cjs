const fs = require('fs');

let app = fs.readFileSync('src/App.jsx', 'utf16le');

const targetStart = app.indexOf('    useEffect(() => {\r\n        const container = containerRef.current;');
const targetEndStr = '    }, [activeSlideIndex, filteredReleases, releaseTab]);';
const targetEnd = app.indexOf(targetEndStr, targetStart) + targetEndStr.length;

const replacement = `    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const slides = container.querySelectorAll('.profile-slide');
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const idx = parseInt(entry.target.getAttribute('data-index') || '0', 10);
                        setActiveSlideIndex(idx);
                    }
                });
            },
            {
                root: container,
                threshold: 0.5,
                rootMargin: "0px"
            }
        );

        slides.forEach((slide) => observer.observe(slide));

        let touchStartY = 0;

        const handleTouchStart = (e) => {
            touchStartY = e.touches[0].clientY;
        };

        const handleWheelOrSwipe = (e) => {
            const targetTag = e.target.tagName?.toLowerCase();
            if (targetTag === 'textarea' || targetTag === 'input' || e.target.closest('.no-wheel-snap') || e.target.closest('.overflow-y-auto')) {
                return;
            }

            let deltaY = 0;
            if (e.type === 'wheel') {
                deltaY = e.deltaY;
            } else if (e.type === 'touchend') {
                const touchEndY = e.changedTouches[0].clientY;
                deltaY = touchStartY - touchEndY;
            }

            if (Math.abs(deltaY) < 30) return; // ignore small movements
            const direction = deltaY > 0 ? 1 : -1;

            // IF AT TOP PROFILE AND PULL DOWN (direction -1) -> OPEN CANVAS
            if (activeSlideIndex === 0 && direction === -1) {
                if (!isScrollingRef.current) {
                    isScrollingRef.current = true;
                    setView('canvas');
                    setTimeout(() => isScrollingRef.current = false, 800);
                }
                return;
            }

            if (isScrollingRef.current) return;

            let nextIndex = activeSlideIndex + direction;
            if (nextIndex < 0) nextIndex = 0;
            if (nextIndex >= slides.length) nextIndex = slides.length - 1;

            if (nextIndex === activeSlideIndex) return;

            isScrollingRef.current = true;
            const targetSlide = slides[nextIndex];
            if (targetSlide) {
                targetSlide.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }

            setTimeout(() => {
                isScrollingRef.current = false;
            }, 800);
        };

        container.addEventListener('wheel', handleWheelOrSwipe, { passive: true });
        container.addEventListener('touchstart', handleTouchStart, { passive: true });
        container.addEventListener('touchend', handleWheelOrSwipe, { passive: true });

        return () => {
            slides.forEach((slide) => observer.unobserve(slide));
            container.removeEventListener('wheel', handleWheelOrSwipe);
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchend', handleWheelOrSwipe);
        };
    }, [activeSlideIndex, filteredReleases, releaseTab]);`;

if (targetStart !== -1 && app.includes(targetEndStr)) {
    const before = app.substring(0, targetStart);
    const after = app.substring(targetEnd);
    fs.writeFileSync('src/App.jsx', before + replacement + after, 'utf16le');
    console.log('Successfully replaced logic!');
} else {
    console.log('Could not find target strings.');
}
