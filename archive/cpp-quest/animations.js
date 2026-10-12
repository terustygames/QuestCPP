/* ============================================
   ANIMATIONS — C++ Quest
   Конфетти, частицы, эффекты
   ============================================ */

const Animations = {
    confettiCanvas: null,
    confettiCtx: null,
    particles: [],
    confettiPieces: [],
    confettiAnimFrame: null,

    init() {
        this.confettiCanvas = document.getElementById('confetti-canvas');
        if (this.confettiCanvas) {
            this.confettiCtx = this.confettiCanvas.getContext('2d');
            this.resizeCanvas();
            window.addEventListener('resize', () => this.resizeCanvas());
        }
        this.createBackgroundParticles();
    },

    resizeCanvas() {
        if (this.confettiCanvas) {
            this.confettiCanvas.width = window.innerWidth;
            this.confettiCanvas.height = window.innerHeight;
        }
    },

    // === Фоновые частицы ===
    createBackgroundParticles() {
        const container = document.getElementById('particles-container');
        if (!container) return;

        const colors = [
            'rgba(108, 92, 231, 0.3)',
            'rgba(0, 206, 201, 0.3)',
            'rgba(253, 121, 168, 0.2)',
            'rgba(253, 203, 110, 0.2)',
            'rgba(0, 184, 148, 0.3)'
        ];

        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            const size = Math.random() * 6 + 2;
            const color = colors[Math.floor(Math.random() * colors.length)];

            particle.style.cssText = `
                width: ${size}px;
                height: ${size}px;
                background: ${color};
                left: ${Math.random() * 100}%;
                animation-duration: ${Math.random() * 15 + 10}s;
                animation-delay: ${Math.random() * 10}s;
            `;

            container.appendChild(particle);
        }
    },

    // === Конфетти при успехе ===
    launchConfetti(duration = 3000) {
        if (!this.confettiCtx) return;

        const colors = ['#6C5CE7', '#00CEC9', '#FD79A8', '#FDCB6E', '#00B894', '#FF7675', '#74B9FF', '#A29BFE'];
        const shapes = ['rect', 'circle'];

        // Создаём конфетти
        for (let i = 0; i < 150; i++) {
            this.confettiPieces.push({
                x: Math.random() * this.confettiCanvas.width,
                y: -20 - Math.random() * 100,
                w: Math.random() * 10 + 5,
                h: Math.random() * 6 + 3,
                color: colors[Math.floor(Math.random() * colors.length)],
                shape: shapes[Math.floor(Math.random() * shapes.length)],
                vx: (Math.random() - 0.5) * 8,
                vy: Math.random() * 3 + 2,
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 10,
                opacity: 1
            });
        }

        if (!this.confettiAnimFrame) {
            this.animateConfetti();
        }

        setTimeout(() => {
            this.confettiPieces.forEach(p => {
                p.fadeOut = true;
            });
        }, duration - 1000);

        setTimeout(() => {
            this.confettiPieces = [];
            if (this.confettiAnimFrame) {
                cancelAnimationFrame(this.confettiAnimFrame);
                this.confettiAnimFrame = null;
            }
            this.confettiCtx.clearRect(0, 0, this.confettiCanvas.width, this.confettiCanvas.height);
        }, duration);
    },

    animateConfetti() {
        if (!this.confettiCtx || this.confettiPieces.length === 0) {
            this.confettiAnimFrame = null;
            return;
        }

        this.confettiCtx.clearRect(0, 0, this.confettiCanvas.width, this.confettiCanvas.height);

        this.confettiPieces.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.05; // gravity
            p.rotation += p.rotationSpeed;

            if (p.fadeOut) {
                p.opacity = Math.max(0, p.opacity - 0.02);
            }

            this.confettiCtx.save();
            this.confettiCtx.translate(p.x, p.y);
            this.confettiCtx.rotate(p.rotation * Math.PI / 180);
            this.confettiCtx.globalAlpha = p.opacity;
            this.confettiCtx.fillStyle = p.color;

            if (p.shape === 'rect') {
                this.confettiCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            } else {
                this.confettiCtx.beginPath();
                this.confettiCtx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
                this.confettiCtx.fill();
            }

            this.confettiCtx.restore();
        });

        // Удаляем ушедшие за экран
        this.confettiPieces = this.confettiPieces.filter(
            p => p.y < this.confettiCanvas.height + 50 && p.opacity > 0
        );

        this.confettiAnimFrame = requestAnimationFrame(() => this.animateConfetti());
    },

    // === Всплывающий XP ===
    showXPFloat(amount, x, y) {
        const el = document.createElement('div');
        el.className = 'xp-float';
        el.textContent = `+${amount} XP`;
        el.style.left = x + 'px';
        el.style.top = y + 'px';
        document.body.appendChild(el);

        setTimeout(() => el.remove(), 1500);
    },

    // === Level Up эффект ===
    showLevelUp(level) {
        const el = document.createElement('div');
        el.className = 'level-up-effect';
        el.innerHTML = `⬆️ LEVEL ${level}!`;
        document.body.appendChild(el);

        this.launchConfetti(2500);
        Sounds.levelUp();

        setTimeout(() => el.remove(), 2000);
    },

    // === Ripple эффект на кнопках ===
    createRipple(event, element) {
        const ripple = document.createElement('span');
        ripple.className = 'ripple';

        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);

        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = event.clientX - rect.left - size / 2 + 'px';
        ripple.style.top = event.clientY - rect.top - size / 2 + 'px';

        element.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);
    },

    // === Shake элемент ===
    shake(element) {
        element.classList.remove('shake');
        void element.offsetWidth; // force reflow
        element.classList.add('shake');
        setTimeout(() => element.classList.remove('shake'), 500);
    },

    // === Pop элемент ===
    pop(element) {
        element.classList.remove('pop');
        void element.offsetWidth;
        element.classList.add('pop');
        setTimeout(() => element.classList.remove('pop'), 300);
    },

    // === Typing effect ===
    typeText(element, texts, typeSpeed = 80, deleteSpeed = 40, pauseTime = 2000) {
        let textIndex = 0;
        let charIndex = 0;
        let isDeleting = false;

        function type() {
            const currentText = texts[textIndex];

            if (isDeleting) {
                element.textContent = currentText.substring(0, charIndex - 1);
                charIndex--;
            } else {
                element.textContent = currentText.substring(0, charIndex + 1);
                charIndex++;
            }

            let timeout = isDeleting ? deleteSpeed : typeSpeed;

            if (!isDeleting && charIndex === currentText.length) {
                timeout = pauseTime;
                isDeleting = true;
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                textIndex = (textIndex + 1) % texts.length;
                timeout = 500;
            }

            setTimeout(type, timeout);
        }

        type();
    },

    // === Появление элементов при скролле ===
    observeElements(selector) {
        const elements = document.querySelectorAll(selector);
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('slide-up');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        elements.forEach(el => observer.observe(el));
    }
};