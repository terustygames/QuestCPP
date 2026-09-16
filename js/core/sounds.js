/* ==========================================================================
   Sounds — короткие «игровые» звуки, синтезированные Web Audio API.
   Файлов нет: всё генерируется на лету осцилляторами.
   ========================================================================== */

var Sounds = {
    ctx: null,
    master: null,

    get enabled() { return Store.state.settings.sound !== false; },

    ensure() {
        if (!this.ctx) {
            try {
                this.ctx = new (window.AudioContext || window.webkitAudioContext)();
                this.master = this.ctx.createGain();
                this.master.gain.value = 0.35;
                this.master.connect(this.ctx.destination);
            } catch (e) { return false; }
        }
        if (this.ctx.state === 'suspended') this.ctx.resume();
        return true;
    },

    /* Одна нота: частота, длительность, форма волны, громкость, задержка, скольжение к частоте */
    tone(freq, dur, type = 'square', vol = 0.5, delay = 0, glideTo = null) {
        if (!this.enabled || !this.ensure()) return;
        const t0 = this.ctx.currentTime + delay;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t0);
        if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur);
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(vol, t0 + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        osc.connect(g); g.connect(this.master);
        osc.start(t0); osc.stop(t0 + dur + 0.02);
    },

    /* Шумовой «щелчок» — для тактильных кнопок */
    noise(dur = 0.05, vol = 0.25, delay = 0) {
        if (!this.enabled || !this.ensure()) return;
        const t0 = this.ctx.currentTime + delay;
        const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * dur, this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        const f = this.ctx.createBiquadFilter();
        f.type = 'highpass'; f.frequency.value = 1800;
        const g = this.ctx.createGain(); g.gain.value = vol;
        src.connect(f); f.connect(g); g.connect(this.master);
        src.start(t0);
    },

    /* ---- палитра ---- */
    click()    { this.noise(0.03, 0.2); this.tone(900, 0.06, 'square', 0.18, 0, 1300); },
    press()    { this.noise(0.02, 0.15); this.tone(400, 0.05, 'triangle', 0.2); },
    release()  { this.tone(700, 0.05, 'triangle', 0.14, 0, 1000); },
    back()     { this.tone(600, 0.07, 'square', 0.15); this.tone(420, 0.09, 'square', 0.12, 0.05); },
    hover()    { this.tone(1400, 0.025, 'sine', 0.06); },
    check()    { this.tone(880, 0.06, 'triangle', 0.22); this.tone(1320, 0.09, 'triangle', 0.2, 0.05); },
    uncheck()  { this.tone(660, 0.06, 'triangle', 0.16); this.tone(440, 0.09, 'triangle', 0.12, 0.05); },
    tab()      { this.tone(1000, 0.04, 'sine', 0.12); },
    run()      { [523, 659, 784].forEach((f, i) => this.tone(f, 0.09, 'triangle', 0.2, i * 0.06)); },
    submit()   { [440, 554, 659, 880].forEach((f, i) => this.tone(f, 0.1, 'triangle', 0.2, i * 0.07)); },
    hint()     { this.tone(700, 0.12, 'sine', 0.18); this.tone(1050, 0.18, 'sine', 0.14, 0.09); },
    newTask()  { this.tone(500, 0.06, 'square', 0.12); this.tone(750, 0.06, 'square', 0.12, 0.06); this.tone(1000, 0.12, 'triangle', 0.16, 0.12); },
    error()    { this.tone(220, 0.18, 'sawtooth', 0.16, 0, 160); this.tone(180, 0.25, 'sawtooth', 0.12, 0.12, 120); },
    fail()     { this.tone(300, 0.1, 'square', 0.14); this.tone(250, 0.14, 'square', 0.12, 0.1); },
    testPass() { this.tone(1200, 0.05, 'sine', 0.14); },
    testFail() { this.tone(260, 0.08, 'square', 0.12); },
    success()  { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.24, i * 0.09)); this.tone(1319, 0.5, 'sine', 0.18, 0.4); },
    tick()     { this.tone(1600, 0.02, 'square', 0.05); },
    levelUp()  { [523, 659, 784, 1047, 1319, 1568, 2093].forEach((f, i) => this.tone(f, 0.3, 'triangle', 0.22, i * 0.09)); },
    achieve()  { [784, 988, 1175, 1568].forEach((f, i) => this.tone(f, 0.18, 'sine', 0.2, i * 0.11)); this.tone(1568, 0.6, 'triangle', 0.16, 0.5); },
    whoosh()   { this.tone(300, 0.18, 'sine', 0.1, 0, 1400); }
};
