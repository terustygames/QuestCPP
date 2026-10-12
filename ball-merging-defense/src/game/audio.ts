// Крошечный синтезатор звуков на WebAudio. Без файлов, без библиотек.
// initAudio() нужно вызвать по первому клику пользователя (требует браузер).

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;

export function initAudio() {
  if (!ctx) {
    try {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.4;
      master.connect(ctx.destination);
    } catch {
      // звук недоступен — просто играем молча
    }
  }
  if (ctx && ctx.state === 'suspended') void ctx.resume();
}

export function setMuted(m: boolean) {
  muted = m;
  if (master && ctx) master.gain.value = m ? 0 : 0.4;
}

// Простой тон: частота f0 скатывается к f1 за dur секунд
function tone(f0: number, f1: number, dur: number, type: OscillatorType = 'sine', vol = 0.12, delay = 0) {
  if (!ctx || !master || muted) return;
  const t0 = ctx.currentTime + delay;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(Math.max(20, f0), t0);
  if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g);
  g.connect(master);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

// Шумовой хлопок (для взрывов)
function noiseBurst(dur = 0.15, vol = 0.2, delay = 0) {
  if (!ctx || !master || muted) return;
  const t0 = ctx.currentTime + delay;
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const g = ctx.createGain();
  g.gain.value = vol;
  src.connect(g);
  g.connect(master);
  src.start(t0);
}

// Все звуки игры
export const sfx = {
  select() {
    tone(660, 660, 0.05, 'sine', 0.1);
  },
  cancel() {
    tone(340, 260, 0.06, 'sine', 0.08);
  },
  buy() {
    tone(520, 820, 0.1, 'triangle', 0.14);
    tone(1040, 1040, 0.06, 'sine', 0.06, 0.05);
  },
  sell() {
    tone(700, 420, 0.09, 'triangle', 0.1);
  },
  place() {
    tone(440, 720, 0.09, 'sine', 0.1);
  },
  upgrade() {
    tone(520, 1040, 0.12, 'triangle', 0.13);
    tone(780, 1560, 0.12, 'sine', 0.09, 0.05);
  },
  merge() {
    tone(300, 540, 0.13, 'triangle', 0.15);
    tone(450, 810, 0.13, 'sine', 0.08, 0.03);
  },
  modeOn() {
    tone(240, 480, 0.16, 'sawtooth', 0.08);
  },
  err() {
    tone(220, 170, 0.09, 'square', 0.09);
  },
  shoot(kind: string) {
    if (kind === 'fire') tone(320, 110, 0.14, 'sawtooth', 0.09);
    else if (kind === 'ice') tone(880, 1500, 0.09, 'sine', 0.07);
    else if (kind === 'bolt') tone(1250, 320, 0.07, 'square', 0.055);
    else if (kind === 'nova') {
      tone(180, 50, 0.2, 'sawtooth', 0.12);
      noiseBurst(0.12, 0.1);
    } else if (kind === 'stun') tone(1500, 2200, 0.08, 'square', 0.06);
    else if (kind === 'pierce') tone(900, 1400, 0.07, 'triangle', 0.08);
    else if (kind === 'vampire') tone(300, 120, 0.12, 'sine', 0.1);
    else if (kind === 'barrage') [0, 0.05, 0.1].forEach((d) => tone(520, 320, 0.05, 'triangle', 0.05, d));
    else if (kind === 'amp') tone(660, 990, 0.08, 'triangle', 0.07);
    else if (kind === 'mine') tone(180, 360, 0.06, 'square', 0.05); // щелчок установки
    else if (kind === 'bomb') tone(600, 260, 0.14, 'triangle', 0.06); // свист сброса
    else if (kind === 'resonance') tone(1320, 1760, 0.16, 'sine', 0.07); // камертон
    else if (kind === 'bengal') {
      // бенгальский: короткий треск искр
      tone(2600, 1400, 0.06, 'square', 0.025);
      noiseBurst(0.08, 0.04);
    }
    else if (kind === 'gas') {
      tone(260, 90, 0.2, 'sawtooth', 0.035);
      noiseBurst(0.18, 0.05);
    }
    else tone(430, 170, 0.13, 'sine', 0.09);
  },
  // тики ленты рулетки босса (по ходу вращения)
  reelTick() {
    for (let i = 0; i < 12; i++) tone(1100, 850, 0.035, 'square', 0.045, 0.15 + i * 0.22);
  },
  // появление босса
  bossReveal() {
    tone(70, 38, 0.6, 'sawtooth', 0.22);
    tone(140, 60, 0.5, 'square', 0.1, 0.05);
    noiseBurst(0.35, 0.12, 0.05);
  },
  pop() {
    noiseBurst(0.18, 0.25);
    tone(240, 55, 0.18, 'square', 0.12);
  },
  popSmall() {
    noiseBurst(0.08, 0.12);
    tone(520, 180, 0.08, 'triangle', 0.07);
  },
  needle() {
    tone(1500, 1900, 0.04, 'square', 0.045);
  },
  zap() {
    tone(1800, 200, 0.06, 'sawtooth', 0.05);
  },
  die() {
    tone(940, 620, 0.05, 'square', 0.04);
  },
  leak() {
    tone(180, 55, 0.32, 'sawtooth', 0.16);
    noiseBurst(0.2, 0.1);
  },
  waveStart() {
    [440, 554, 659].forEach((f, i) => tone(f, f, 0.11, 'triangle', 0.11, i * 0.08));
  },
  clear() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, f, 0.1, 'triangle', 0.1, i * 0.07));
  },
  detonate() {
    for (let i = 0; i < 5; i++) {
      noiseBurst(0.12, 0.14, i * 0.07);
      tone(200 + i * 40, 60, 0.12, 'square', 0.09, i * 0.07);
    }
  },
  // взрыв мины (резкий, короткий) и бомбы (низкий, длинный)
  boom(kind: string) {
    if (kind === 'bomb') {
      tone(140, 40, 0.42, 'sawtooth', 0.16);
      noiseBurst(0.3, 0.16);
    } else {
      tone(320, 70, 0.14, 'square', 0.09);
      noiseBurst(0.1, 0.12);
    }
  },
  gameover() {
    [392, 330, 262, 196].forEach((f, i) => tone(f, f * 0.9, 0.22, 'triangle', 0.13, i * 0.16));
  },
};
