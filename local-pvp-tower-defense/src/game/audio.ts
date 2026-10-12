/* Синтезированные звуковые эффекты через WebAudio — без внешних ассетов. */

export class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  muted = false;

  /** Вызывать по пользовательскому жесту (autoplay policy). */
  ensure() {
    try {
      if (this.ctx) {
        if (this.ctx.state === "suspended") void this.ctx.resume().catch(() => undefined);
        return;
      }
      if (typeof window === "undefined") return;
      const AC: typeof AudioContext | undefined =
        window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      if (this.ctx.state === "suspended") void this.ctx.resume().catch(() => undefined);
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.42;
      this.master.connect(this.ctx.destination);

      const len = this.ctx.sampleRate * 1;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    } catch {
      this.ctx = null;
      this.master = null;
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.42;
    return this.muted;
  }

  private tone(freq: number, dur: number, type: OscillatorType, vol: number, slideTo?: number, delay = 0) {
    if (!this.ctx || !this.master || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t0 + dur);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  private noise(dur: number, vol: number, lowpass = 4000, delay = 0) {
    if (!this.ctx || !this.master || !this.noiseBuf || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = lowpass;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter).connect(gain).connect(this.master);
    src.start(t0);
    src.stop(t0 + dur + 0.05);
  }

  shoot() {
    this.tone(920, 0.07, "square", 0.045, 420);
  }
  snipe() {
    this.tone(240, 0.16, "sawtooth", 0.06, 90);
    this.noise(0.09, 0.05, 2500);
  }
  frost() {
    this.tone(1250, 0.18, "sine", 0.05, 1900);
    this.tone(1650, 0.14, "triangle", 0.03, 2300, 0.02);
  }
  hit() {
    this.noise(0.05, 0.035, 3200);
  }
  die() {
    this.noise(0.16, 0.09, 1400);
    this.tone(320, 0.14, "triangle", 0.06, 60);
  }
  coin() {
    this.tone(880, 0.09, "sine", 0.07);
    this.tone(1320, 0.16, "sine", 0.07, undefined, 0.07);
  }
  build() {
    this.tone(180, 0.1, "square", 0.08, 90);
    this.tone(520, 0.12, "triangle", 0.06, 780, 0.05);
  }
  error() {
    this.tone(160, 0.16, "sawtooth", 0.07, 110);
  }
  send() {
    this.tone(196, 0.22, "sawtooth", 0.06, 392);
    this.tone(294, 0.22, "sawtooth", 0.04, 587, 0.02);
  }
  baseHit() {
    this.tone(90, 0.4, "sine", 0.16, 40);
    this.noise(0.28, 0.14, 900);
  }
  tick() {
    this.tone(660, 0.08, "sine", 0.08);
  }
  go() {
    this.tone(880, 0.1, "sine", 0.09);
    this.tone(1180, 0.18, "sine", 0.09, undefined, 0.09);
  }
  win() {
    const seq = [523, 659, 784, 1046, 1318];
    seq.forEach((f, i) => this.tone(f, 0.34, "triangle", 0.09, undefined, i * 0.13));
    this.noise(0.5, 0.05, 6000, 0.1);
  }
}

export const sfx = new Sfx();
