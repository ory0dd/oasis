const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');

const targetStr = `        let touchStartY = 0;

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

            // Scroll down -> open canvas
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
            }
        };

        container.addEventListener('wheel', handleWheelOrSwipe, { passive: true });
        container.addEventListener('touchstart', handleTouchStart, { passive: true });
        container.addEventListener('touchend', handleWheelOrSwipe, { passive: true });

        return () => {
            container.removeEventListener('wheel', handleWheelOrSwipe);
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchend', handleWheelOrSwipe);
        };
    }, []);`;

const targetStrCRLF = targetStr.replace(/\n/g, '\r\n');

const replacement = `        let touchStartY = 0;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const index = parseInt(entry.target.getAttribute('data-index'));
                    setActiveSlideIndex(index);
                }
            });
        }, { threshold: 0.5 });

        const slides = container.querySelectorAll('.profile-slide');
        slides.forEach((slide) => observer.observe(slide));

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

            const direction = deltaY > 50 ? 1 : (deltaY < -50 ? -1 : 0);
            if (direction === 0) return;

            // IF AT TOP PROFILE AND PULL DOWN (direction -1) -> OPEN CANVAS
            if (activeSlideIndex === 0 && direction === -1) {
                if (!isScrollingRef.current) {
                    isScrollingRef.current = true;
                    setView('canvas');
                    setTimeout(() => isScrollingRef.current = false, 800);
                }
                return;
            }

            let nextIndex = activeSlideIndex + direction;
            const currentSlides = Array.from(container.querySelectorAll('.profile-slide'));
            
            if (nextIndex < 0) nextIndex = 0;
            if (nextIndex >= currentSlides.length) nextIndex = currentSlides.length - 1;

            if (nextIndex === activeSlideIndex) return;

            if (!isScrollingRef.current) {
                isScrollingRef.current = true;
                const targetSlide = currentSlides[nextIndex];
                if (targetSlide) {
                    targetSlide.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }

                setTimeout(() => {
                    isScrollingRef.current = false;
                }, 800);
            }
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
    }, [activeSlideIndex, filteredReleases]);`;

if (app.includes(targetStr)) {
    app = app.replace(targetStr, replacement);
    fs.writeFileSync('src/App.jsx', app, 'utf8');
    console.log('Replaced successfully (LF)');
} else if (app.includes(targetStrCRLF)) {
    app = app.replace(targetStrCRLF, replacement.replace(/\n/g, '\r\n'));
    fs.writeFileSync('src/App.jsx', app, 'utf8');
    console.log('Replaced successfully (CRLF)');
} else {
    console.log('Target string not found in App.jsx');
}
