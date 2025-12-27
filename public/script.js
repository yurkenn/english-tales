document.addEventListener('DOMContentLoaded', () => {
    // Scroll reveals
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.animate-scroll').forEach(el => {
        observer.observe(el);
    });

    // Logo image fallback
    const logoImg = document.querySelector('.logo-img');
    if (logoImg) {
        logoImg.onerror = function () {
            this.src = 'https://via.placeholder.com/32x32/5271FF/FFFFFF?text=ET';
        };
    }

    // Hero mockup fallback
    const heroMockup = document.querySelector('.hero-mockup');
    if (heroMockup) {
        heroMockup.onerror = function () {
            this.src = 'https://via.placeholder.com/450x800/5271FF/FFFFFF?text=English+Tales+App';
        };
    }
});
