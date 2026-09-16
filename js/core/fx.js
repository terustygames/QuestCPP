/* ==========================================================================
   FX — «сочные» эффекты: искры при клике, ленты при победе, дрожание,
   всплывающие числа, набегающие счётчики и juice-кнопки.
   ========================================================================== */

var FX = {
    canvas: null, ctx: null, parts: [], raf: null,
    PALETTE: ['#ff6b6b', '#ffb400', '#2ec4b6', '#4d96ff', '#845ef7', '#f06595', '#20c997'],

    init() {
        this.canvas = document.getElementById('fx-canvas');
        this.ctx = this.canvas.getContext('2d');
        const resize = () => { this.canvas.width = innerWidth; this.canvas.height = innerHeight; };
        resize();
        let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 120); });
        this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.bindJuice();
    },

    /* Любая .btn: вдавливание, искры и звук. Один делегат на документ. */
    bindJuice() {
        document.addEventListener('pointerdown', e => {
            const b = e.target.closest('.btn, .station, .chip, .tab');
            if (!b || b.disabled) return;
            b.classList.add('is-pressed');
            Sounds.press();
        });
        const up = e => {
            const b = e.target.closest ? e.target.closest('.btn, .station, .chip, .tab') : null;
            document.querySelectorAll('.is-pressed').forEach(el => el.classList.remove('is-pressed'));
            if (b && !b.disabled && e.type === 'pointerup') {
                this.sparks(e.clientX, e.clientY, b.dataset.fx === 'big' ? 22 : 10);
                this.ripple(b, e.clientX, e.clientY);
            }
        };
        document.addEventListener('pointerup', up);
        document.addEventListener('pointercancel', up);
        /* Звук наведения — только при входе в элемент, не чаще 12 раз/с */
        let lastHover = 0, lastEl = null;
        document.addEventListener('mouseover', e => {
            const b = e.target.closest('.btn, .station');
            if (!b || b === lastEl || b.disabled) return;
            lastEl = b;
            const now = performance.now();
            if (now - lastHover < 80) return;
            lastHover = now;
            Sounds.hover();
        }, { passive: true });
        /* Снимаем класс каскадного появления после анимации, чтобы он не спорил с hover */
        document.addEventListener('animationend', e => {
            if (e.animationName === 'rise') { e.target.classList.remove('anim-rise'); e.target.style.animationDelay = ''; }
        });
    },

    ripple(el, x, y) {
        const r = el.getBoundingClientRect();
        const d = document.createElement('span');
        d.className = 'ripple';
        const size = Math.max(r.width, r.height) * 1.6;
        d.style.cssText = `width:${size}px;height:${size}px;left:${x - r.left - size / 2}px;top:${y - r.top - size / 2}px`;
        el.appendChild(d);
        setTimeout(() => d.remove(), 600);
    },

    /* ---- частицы ---- */
    MAX_PARTS: 400,
    spawn(p) {
        if (this.parts.length >= this.MAX_PARTS) return;
        this.parts.push(p);
        if (!this.raf) { this.canvas.classList.add('is-live'); this.loop(); }
    },

    sparks(x, y, n = 12, colors = this.PALETTE) {
        if (this.reduced) return;
        for (let i = 0; i < n; i++) {
            const a = Math.random() * Math.PI * 2, v = 2 + Math.random() * 5;
            this.spawn({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2, g: 0.25, life: 1, decay: 0.03 + Math.random() * 0.03,
                         size: 3 + Math.random() * 4, color: colors[i % colors.length], shape: 'square', rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4 });
        }
    },

    burst(x, y, n = 80) {
        if (this.reduced) n = Math.min(n, 20);
        for (let i = 0; i < n; i++) {
            const a = Math.random() * Math.PI * 2, v = 4 + Math.random() * 9;
            this.spawn({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 4, g: 0.18, life: 1, decay: 0.008 + Math.random() * 0.01,
                         size: 5 + Math.random() * 7, color: this.PALETTE[i % this.PALETTE.length], shape: i % 3 ? 'rect' : 'circle',
                         rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, drag: 0.97 });
        }
    },

    /* Ленты сверху экрана */
    ribbons(n = 120) {
        if (this.reduced) n = Math.min(n, 30);
        for (let i = 0; i < n; i++) {
            this.spawn({ x: Math.random() * innerWidth, y: -20 - Math.random() * innerHeight * 0.5, vx: (Math.random() - 0.5) * 2, vy: 2 + Math.random() * 3,
                         g: 0.02, life: 1, decay: 0.004, size: 6 + Math.random() * 6, color: this.PALETTE[i % this.PALETTE.length],
                         shape: 'rect', rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.25, sway: Math.random() * 6, drag: 0.995 });
        }
    },

    loop() {
        const step = () => {
            const c = this.ctx;
            c.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.parts = this.parts.filter(p => p.life > 0 && p.y < innerHeight + 40);
            for (const p of this.parts) {
                p.vy += p.g; if (p.drag) { p.vx *= p.drag; p.vy *= p.drag; }
                if (p.sway !== undefined) { p.sway += 0.05; p.x += Math.sin(p.sway) * 0.8; }
                p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life -= p.decay;
                c.save();
                c.globalAlpha = Math.max(0, Math.min(1, p.life * 1.4));
                c.translate(p.x, p.y); c.rotate(p.rot);
                c.fillStyle = p.color;
                if (p.shape === 'circle') { c.beginPath(); c.arc(0, 0, p.size / 2, 0, 7); c.fill(); }
                else if (p.shape === 'rect') c.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
                else c.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                c.restore();
            }
            this.raf = this.parts.length ? requestAnimationFrame(step) : null;
            if (!this.raf) { c.clearRect(0, 0, this.canvas.width, this.canvas.height); this.canvas.classList.remove('is-live'); }
        };
        this.raf = requestAnimationFrame(step);
    },

    /* ---- DOM-эффекты ---- */
    shake(el, strength = 'normal') {
        el.classList.remove('anim-shake', 'anim-shake-hard');
        void el.offsetWidth;
        el.classList.add(strength === 'hard' ? 'anim-shake-hard' : 'anim-shake');
        setTimeout(() => el.classList.remove('anim-shake', 'anim-shake-hard'), 600);
    },

    pop(el) {
        el.classList.remove('anim-pop'); void el.offsetWidth; el.classList.add('anim-pop');
        setTimeout(() => el.classList.remove('anim-pop'), 500);
    },

    /* Всплывающий текст (+40 XP) */
    floatText(x, y, text, cls = '') {
        const d = document.createElement('div');
        d.className = 'float-text ' + cls;
        d.textContent = text;
        d.style.left = x + 'px'; d.style.top = y + 'px';
        document.body.appendChild(d);
        setTimeout(() => d.remove(), 1400);
    },

    /* Счётчик, который «набивается» до значения */
    countTo(el, to, dur = 800) {
        const from = parseInt(el.textContent.replace(/\D/g, ''), 10) || 0;
        if (from === to) { el.textContent = to; return; }
        const t0 = performance.now();
        let lastTick = 0;
        const step = now => {
            const k = Math.min(1, (now - t0) / dur);
            const e = 1 - Math.pow(1 - k, 3);
            const v = Math.round(from + (to - from) * e);
            el.textContent = v;
            if (v !== lastTick && k < 1 && (v - lastTick) > (to - from) / 12) { lastTick = v; Sounds.tick(); }
            if (k < 1) requestAnimationFrame(step); else { el.textContent = to; this.pop(el); }
        };
        requestAnimationFrame(step);
    },

    /* Печатающийся текст */
    typewriter(el, text, speed = 28) {
        el.textContent = '';
        let i = 0;
        const t = setInterval(() => {
            el.textContent += text[i++];
            if (i >= text.length) clearInterval(t);
        }, speed);
    },

    /* Элементы появляются каскадом */
    stagger(container, selector = '> *', delay = 40) {
        container.querySelectorAll(selector === '> *' ? ':scope > *' : selector).forEach((el, i) => {
            el.style.animationDelay = (i * delay) + 'ms';
            el.classList.add('anim-rise');
        });
    },

    /* Вспышка фона экрана */
    flash(color = 'rgba(46,196,182,.25)') {
        const d = document.createElement('div');
        d.className = 'screen-flash';
        d.style.background = color;
        document.body.appendChild(d);
        setTimeout(() => d.remove(), 500);
    }
};
