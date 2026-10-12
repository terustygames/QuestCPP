/* ============================================
   SOUNDS — C++ Quest
   Синтезированные звуки через Web Audio API
   ============================================ */

const Sounds = {
    ctx: null,
    enabled: true,
    volume: 0.3,

    init() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API не доступен');
            this.enabled = false;
        }
    },

    ensureContext() {
        if (!this.ctx) this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },

    // Базовый звук
    playTone(frequency, duration, type = 'sine', vol = this.volume) {
        if (!this.enabled || !this.ctx) return;
        this.ensureContext();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);

        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + duration);
    },

    // Звук клика кнопки (как в игре)
    click() {
        this.playTone(800, 0.08, 'square', 0.15);
        setTimeout(() => this.playTone(1000, 0.06, 'square', 0.1), 30);
    },

    // Звук назад
    back() {
        this.playTone(600, 0.08, 'square', 0.12);
        setTimeout(() => this.playTone(400, 0.1, 'square', 0.08), 40);
    },

    // Звук запуска кода
    run() {
        const t = this.ctx ? this.ctx.currentTime : 0;
        this.playTone(523, 0.1, 'sine', 0.2);
        setTimeout(() => this.playTone(659, 0.1, 'sine', 0.2), 80);
        setTimeout(() => this.playTone(784, 0.15, 'sine', 0.2), 160);
    },

    // Звук отправки
    submit() {
        this.playTone(440, 0.1, 'triangle', 0.2);
        setTimeout(() => this.playTone(554, 0.1, 'triangle', 0.2), 100);
        setTimeout(() => this.playTone(659, 0.15, 'triangle', 0.25), 200);
    },

    // Успех!
    success() {
        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.2, 'sine', 0.2), i * 100);
        });
    },

    // Ошибка
    error() {
        this.playTone(200, 0.3, 'sawtooth', 0.15);
        setTimeout(() => this.playTone(180, 0.3, 'sawtooth', 0.12), 150);
    },

    // Получение XP
    xp() {
        this.playTone(880, 0.08, 'sine', 0.15);
        setTimeout(() => this.playTone(1100, 0.12, 'sine', 0.2), 60);
    },

    // Level Up!
    levelUp() {
        const notes = [523, 659, 784, 1047, 1319, 1568];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.25, 'sine', 0.25), i * 120);
        });
    },

    // Новый квест
    newquest() {
        this.playTone(440, 0.1, 'square', 0.12);
        setTimeout(() => this.playTone(550, 0.1, 'square', 0.12), 80);
        setTimeout(() => this.playTone(660, 0.12, 'triangle', 0.15), 160);
    },

    // Подсказка
    hint() {
        this.playTone(600, 0.15, 'sine', 0.15);
        setTimeout(() => this.playTone(800, 0.2, 'sine', 0.1), 100);
    },

    // Power up
    powerup() {
        const notes = [300, 400, 500, 600, 700, 800];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.08, 'square', 0.1), i * 40);
        });
    },

    // Start game
    start() {
        this.playTone(523, 0.15, 'triangle', 0.2);
        setTimeout(() => this.playTone(784, 0.15, 'triangle', 0.2), 120);
        setTimeout(() => this.playTone(1047, 0.25, 'triangle', 0.25), 240);
    },

    // Чекбокс
    check() {
        this.playTone(900, 0.06, 'sine', 0.12);
    },

    // Uncheck
    uncheck() {
        this.playTone(500, 0.06, 'sine', 0.08);
    },

    // Достижение
    achievement() {
        const melody = [784, 988, 1175, 1568, 1175, 1568];
        melody.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.2, 'sine', 0.2), i * 150);
        });
    }
};  