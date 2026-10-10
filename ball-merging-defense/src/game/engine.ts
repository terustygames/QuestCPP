// ============================================================
// ДВИЖОК ИГРЫ. Чистый TypeScript, без React.
// App.tsx вызывает step(dt) 60 раз в секунду и рисует то,
// что лежит в полях этого класса.
// ============================================================

import {
  CONFIG,
  COLS,
  ROWS,
  LEAK_AT,
  STAGE_W,
  STAGE_H,
  isAdj,
  cellC,
  pathPoint,
  TYPE_INFO,
  type OrbType,
} from './config';
import { sfx } from './audio';

export type Status = 'title' | 'prep' | 'wave' | 'gameover';
export type Mode = 'combine' | 'accumulate';
// Короткие события для UI (виброотклик на телефоне)
export type EngineEvent = 'leak' | 'kill' | 'boss' | 'clear' | 'gameover' | 'detonate';

export interface OrbState {
  id: number;
  type: OrbType;
  level: number; // 1 — обычный, 2+ — заряженный (накопление)
  cdUntil: number; // время, до которого шарик на перезарядке
  bornAt: number; // для анимации появления
  pulse: number; // для анимации "толчка" при слиянии
}

export interface EnemyState {
  id: number;
  p: number; // пройденная дистанция по трассе
  hp: number;
  maxHp: number;
  speed: number;
  radius: number;
  slowUntil: number;
  slowFactor: number;
  dots: { until: number; dps: number }[]; // яды
  reward: number;
  leakDmg: number;
  boss: boolean;
  flashUntil: number;
  dead: boolean;
}

export interface ProjState {
  id: number;
  kind: OrbType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetId: number;
  age: number;
  seed: number;
  life: number;
  trail: { x: number; y: number }[];
}

export interface NeedleState {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  ang: number;
  life: number;
  depth: number; // глубина цепной реакции (защита от зацикливания)
}

export interface Particle {
  id: number;
  kind: 'spark' | 'ring' | 'text' | 'line';
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  text: string;
  x2: number;
  y2: number;
}

export class Engine {
  // --- состояние игры ---
  status: Status = 'title';
  mode: Mode = 'combine';
  now = 0;
  wave = 1;
  lives = CONFIG.lives;
  essence = CONFIG.essenceStart;

  // --- сущности ---
  grid: (OrbState | null)[] = Array(COLS * ROWS).fill(null);
  enemies: EnemyState[] = [];
  projs: ProjState[] = [];
  needles: NeedleState[] = [];
  parts: Particle[] = [];

  // --- выбор игрока ---
  sel: number | null = null;

  // Колбэк событий (настраивается из React для виброотклика)
  onEvent?: (ev: EngineEvent) => void;
  private emit(ev: EngineEvent) {
    this.onEvent?.(ev);
  }

  // --- волны ---
  spawnPlan: boolean[] = []; // true = босс
  spawnTimer = 0;
  prepUntil = 0;

  // --- очередь "лопания" шариков (чтобы взрывы шли красиво, с задержкой) ---
  popQueue: { at: number; cell: number; count: number }[] = [];
  popQueued = new Set<number>();
  chainCount = 0;
  maxChain = 0;

  // --- статистика и UI-эффекты ---
  kills = 0;
  leaked = 0;
  banner = '';
  bannerUntil = 0;
  shakeCell = -1;
  shakeUntil = 0;
  hurtUntil = 0;
  detonateFlashUntil = 0;

  nextId = 1;

  get enemiesLeft() {
    return this.spawnPlan.length + this.enemies.length;
  }

  // Предпросмотр следующей волны (показываем игроку во время подготовки)
  get nextWaveBoss() {
    return this.wave % CONFIG.bossEvery === 0;
  }
  get nextWaveSize() {
    return this.nextWaveBoss
      ? 4 + this.wave
      : CONFIG.waveCountBase + this.wave * CONFIG.waveCountPer;
  }

  setBanner(t: string, dur = 2) {
    this.banner = t;
    this.bannerUntil = this.now + dur;
  }

  // ============ ЧАСТИЦЫ (визуальные эффекты) ============
  spark(x: number, y: number, color: string, n = 8, spd = 120) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = spd * (0.4 + Math.random());
      this.parts.push({
        id: this.nextId++, kind: 'spark', x, y,
        vx: Math.cos(a) * v, vy: Math.sin(a) * v,
        life: 0.45, maxLife: 0.45, color, size: 3 + Math.random() * 3, text: '', x2: 0, y2: 0,
      });
    }
  }
  ring(x: number, y: number, color: string, size = 60) {
    this.parts.push({
      id: this.nextId++, kind: 'ring', x, y, vx: 0, vy: 0,
      life: 0.4, maxLife: 0.4, color, size, text: '', x2: 0, y2: 0,
    });
  }
  textP(x: number, y: number, text: string, color: string) {
    this.parts.push({
      id: this.nextId++, kind: 'text', x, y, vx: 0, vy: -34,
      life: 0.8, maxLife: 0.8, color, size: 14, text, x2: 0, y2: 0,
    });
  }
  linkLine(x: number, y: number, x2: number, y2: number, color: string) {
    this.parts.push({
      id: this.nextId++, kind: 'line', x, y, x2, y2, vx: 0, vy: 0,
      life: 0.16, maxLife: 0.16, color, size: 3, text: '',
    });
  }

  // ============ УПРАВЛЕНИЕ ИГРОЙ ============
  startGame() {
    this.status = 'prep';
    this.prepUntil = this.now + CONFIG.firstPrep;
    this.setBanner('Призывай шарики — скоро волна!');
  }

  startWave() {
    this.status = 'wave';
    const bossWave = this.wave % CONFIG.bossEvery === 0;
    const normals = bossWave ? 4 + this.wave : CONFIG.waveCountBase + this.wave * CONFIG.waveCountPer;
    this.spawnPlan = [];
    if (bossWave) this.spawnPlan.push(true);
    for (let i = 0; i < normals; i++) this.spawnPlan.push(false);
    this.spawnTimer = 0.4;
    this.setBanner(bossWave ? `ВОЛНА ${this.wave} — БОСС!` : `Волна ${this.wave}`);
    sfx.waveStart();
  }

  callWaveNow() {
    if (this.status !== 'prep') return;
    this.essence += CONFIG.callBonus;
    this.textP(STAGE_W / 2, 120, `+${CONFIG.callBonus} эссенции`, '#7dd3fc');
    this.startWave();
  }

  spawnInterval() {
    const base = this.wave % CONFIG.bossEvery === 0 ? 1.15 : CONFIG.spawnInterval;
    return Math.max(CONFIG.spawnIntervalMin, base - this.wave * 0.03);
  }

  spawnEnemy(boss: boolean) {
    const w = this.wave;
    const hp = boss
      ? Math.round(CONFIG.bossHp * Math.pow(CONFIG.bossHpGrowth, w / CONFIG.bossEvery - 1))
      : Math.round(CONFIG.enemyHp * Math.pow(CONFIG.enemyHpGrowth, w - 1));
    this.enemies.push({
      id: this.nextId++, p: 0, hp, maxHp: hp,
      speed: boss ? CONFIG.bossSpeed : Math.min(CONFIG.enemySpeedCap, CONFIG.enemySpeed + (w - 1) * CONFIG.enemySpeedGrowth),
      radius: boss ? 22 : 14,
      slowUntil: 0, slowFactor: 1, dots: [],
      reward: boss ? CONFIG.bossReward : CONFIG.enemyReward,
      leakDmg: boss ? CONFIG.bossLeak : 1,
      boss, flashUntil: 0, dead: false,
    });
    if (boss) this.emit('boss');
  }

  // ============ ДЕЙСТВИЯ ИГРОКА ============
  // Призвать шарик в случайную свободную клетку (кнопка «Шарик»)
  buyOrb() {
    const empty: number[] = [];
    this.grid.forEach((o, i) => {
      if (!o) empty.push(i);
    });
    if (!empty.length) return this.err('Нет свободных клеток');
    this.buyOrbAt(empty[Math.floor(Math.random() * empty.length)]);
  }

  // Призвать шарик в конкретную пустую клетку (тап по пустой клетке)
  buyOrbAt(cell: number) {
    if (this.essence < CONFIG.orbCost) return this.err('Не хватает эссенции');
    if (this.grid[cell]) return;
    this.essence -= CONFIG.orbCost;
    // Шипастый чуть реже остальных (2 из 14)
    const r = Math.random() * 14;
    const type: OrbType = r < 3 ? 'fire' : r < 6 ? 'ice' : r < 9 ? 'bolt' : r < 12 ? 'poison' : 'spiky';
    this.grid[cell] = { id: this.nextId++, type, level: 1, cdUntil: 0, bornAt: this.now, pulse: this.now };
    const c = cellC(cell);
    this.ring(c.x, c.y, TYPE_INFO[type].color, 60);
    this.spark(c.x, c.y, TYPE_INFO[type].color, 6, 90);
    sfx.buy();
  }

  sellCell(i: number) {
    const o = this.grid[i];
    if (!o) return;
    const refund = CONFIG.sellBase + 3 * (o.level - 1);
    this.essence += refund;
    this.grid[i] = null;
    this.popQueued.delete(i);
    if (this.sel === i) this.sel = null;
    const c = cellC(i);
    this.textP(c.x, c.y - 10, `+${refund}`, '#7dd3fc');
    this.spark(c.x, c.y, '#7dd3fc', 6, 80);
    sfx.sell();
  }

  err(msg: string) {
    this.setBanner(msg, 1.4);
    sfx.err();
  }
  shake(i: number) {
    this.shakeCell = i;
    this.shakeUntil = this.now + 0.35;
  }

  // Клик по клетке: выбор -> действие с соседом
  clickCell(i: number) {
    const o = this.grid[i];
    if (this.sel === i) {
      this.sel = null;
      sfx.cancel();
      return;
    }
    if (this.sel === null) {
      if (o) {
        this.sel = i;
        sfx.select();
      }
      return;
    }
    const a = this.grid[this.sel];
    if (!a) {
      this.sel = o ? i : null;
      return;
    }
    if (!o) {
      this.sel = null;
      return;
    }
    if (!isAdj(this.sel, i)) {
      this.sel = i; // далёкая клетка — просто перебираем выбор
      sfx.select();
      return;
    }
    if (this.mode === 'combine') this.firePair(this.sel, i);
    else this.mergePair(this.sel, i);
  }

  // Режим накопления: сливаем два ОДИНАКОВЫХ шарика в один
  mergePair(a: number, b: number) {
    const A = this.grid[a];
    const B = this.grid[b];
    if (!A || !B) return;
    if (A.type !== B.type) {
      this.err('Накопление: соединяй только одинаковые шарики');
      this.shake(a);
      this.shake(b);
      return;
    }
    if (A.level >= CONFIG.maxLevel) {
      this.err('Шарик заряжен на максимум');
      this.shake(a);
      return;
    }
    A.level += 1;
    A.pulse = this.now;
    this.grid[b] = null;
    this.sel = null;
    const c = cellC(a);
    this.ring(c.x, c.y, TYPE_INFO[A.type].color, 70);
    this.spark(c.x, c.y, TYPE_INFO[A.type].color, 8, 110);
    this.textP(c.x, c.y - 14, `×${A.level}`, '#ffffff');
    sfx.merge();
  }

  // Режим совмещения: два соседних шарика стреляют
  firePair(a: number, b: number) {
    const A = this.grid[a];
    const B = this.grid[b];
    if (!A || !B) return;
    if (this.now < A.cdUntil || this.now < B.cdUntil) {
      this.err('Шарики ещё перезаряжаются');
      this.shake(this.now < A.cdUntil ? a : b);
      return;
    }
    const ca = cellC(a);
    const cb = cellC(b);
    this.linkLine(ca.x, ca.y, cb.x, cb.y, '#22d3ee');

    const mixed = A.type !== B.type; // разные типы -> каждый стреляет дважды
    if (A.type !== 'spiky') {
      this.fireOrb(a, mixed ? 2 : 1);
      A.cdUntil = this.now + CONFIG.cooldown;
    }
    if (B.type !== 'spiky') {
      this.fireOrb(b, mixed ? 2 : 1);
      B.cdUntil = this.now + CONFIG.cooldown;
    }
    if (A.type === 'spiky') this.detonateSpiky(a, 0);
    if (B.type === 'spiky' && this.grid[b]) this.detonateSpiky(b, 0);
    this.sel = null;
  }

  // Переключение режима. Возврат в совмещение = ДЕТОНАЦИЯ всех заряженных.
  toggleMode() {
    if (this.mode === 'combine') {
      this.mode = 'accumulate';
      this.sel = null;
      this.setBanner('НАКОПЛЕНИЕ: сливай одинаковые шарики в один', 2.4);
      sfx.modeOn();
    } else {
      this.mode = 'combine';
      this.sel = null;
      let k = 0;
      for (let i = 0; i < this.grid.length; i++) {
        const o = this.grid[i];
        if (o && o.level >= 2 && !this.popQueued.has(i)) {
          this.popQueued.add(i);
          this.popQueue.push({ at: this.now + k * 0.08, cell: i, count: o.level * 2 });
          k++;
        }
      }
      if (k > 0) {
        this.setBanner(`ДЕТОНАЦИЯ! ×${k}`, 1.6);
        this.detonateFlashUntil = this.now + 0.35;
        sfx.detonate();
        this.emit('detonate');
      } else {
        this.setBanner('Нет заряженных шариков (нужен уровень ×2 и выше)', 2);
      }
    }
  }

  // ============ СТРЕЛЬБА ============
  fireOrb(cell: number, count: number) {
    const o = this.grid[cell];
    if (!o) return;
    const c = cellC(cell);
    this.fireOrbAt(c.x, c.y, o.type, count);
    sfx.shoot(o.type);
    o.pulse = this.now;
  }

  fireOrbAt(x: number, y: number, type: OrbType, count: number) {
    for (let k = 0; k < count; k++) {
      const target = this.pickTarget();
      this.projs.push({
        id: this.nextId++, kind: type, x, y,
        vx: (Math.random() - 0.5) * 260,
        vy: -150 - Math.random() * 160,
        targetId: target ? target.id : -1,
        age: 0, seed: Math.random() * 10, life: 3, trail: [],
      });
    }
  }

  // Цель: один из самых продвинутых к выходу врагов
  pickTarget(): EnemyState | null {
    if (!this.enemies.length) return null;
    const sorted = [...this.enemies].sort((a, b) => b.p - a.p);
    const k = Math.min(4, sorted.length);
    const idx = Math.floor(Math.pow(Math.random(), 1.6) * k);
    return sorted[idx];
  }

  // Шипастый лопается: 4 иглы по сторонам
  detonateSpiky(cell: number, depth: number) {
    if (depth > 8) return;
    const o = this.grid[cell];
    if (!o) return;
    this.grid[cell] = null;
    this.popQueued.delete(cell);
    if (this.sel === cell) this.sel = null;
    const c = cellC(cell);
    this.ring(c.x, c.y, '#b16cff', 110);
    this.spark(c.x, c.y, '#b16cff', 14, 190);
    sfx.pop();
    const dirs: [number, number][] = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
    for (const [dx, dy] of dirs) {
      this.needles.push({
        id: this.nextId++, x: c.x + dx * 24, y: c.y + dy * 24,
        dx, dy, ang: Math.atan2(dy, dx), life: 1.6, depth,
      });
    }
  }

  damage(e: EnemyState, d: number, color = '#ffffff', show = true) {
    if (e.dead) return;
    e.hp -= d;
    e.flashUntil = this.now + 0.08;
    if (show) {
      const pos = pathPoint(e.p);
      this.textP(pos.x, pos.y - 18, String(Math.round(d)), color);
    }
  }

  // Попадание снаряда: эффект зависит от типа шарика, как и задумано
  impact(p: ProjState, e: EnemyState) {
    const pos = pathPoint(e.p);
    switch (p.kind) {
      case 'fire': {
        this.damage(e, 3, '#ff9a3d');
        this.ring(pos.x, pos.y, '#ff6a3d', 70);
        // осколки по соседним врагам
        for (const o of this.enemies) {
          if (o === e || o.dead) continue;
          const q = pathPoint(o.p);
          const dx = q.x - pos.x, dy = q.y - pos.y;
          if (dx * dx + dy * dy < 58 * 58) this.damage(o, 1, '#ff6a3d', false);
        }
        break;
      }
      case 'ice': {
        this.damage(e, 1, '#9be2ff');
        e.slowUntil = this.now + 2.3;
        e.slowFactor = 0.55;
        this.ring(pos.x, pos.y, '#46c8ff', 44);
        break;
      }
      case 'bolt': {
        this.damage(e, 2, '#ffe066');
        let best: EnemyState | null = null;
        let bd = 150 * 150;
        for (const o of this.enemies) {
          if (o === e || o.dead) continue;
          const q = pathPoint(o.p);
          const dx = q.x - pos.x, dy = q.y - pos.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < bd) {
            bd = d2;
            best = o;
          }
        }
        if (best) {
          this.damage(best, 2, '#ffe066');
          const q = pathPoint(best.p);
          this.linkLine(pos.x, pos.y, q.x, q.y, '#ffd23f');
        }
        sfx.zap();
        break;
      }
      case 'poison': {
        this.damage(e, 1, '#86efac');
        if (e.dots.length < 4) e.dots.push({ until: this.now + 4, dps: 1.2 });
        else {
          e.dots.sort((x, y) => x.until - y.until);
          e.dots[0].until = this.now + 4;
        }
        this.ring(pos.x, pos.y, '#4ade80', 40);
        break;
      }
      default:
        this.damage(e, 1);
    }
    this.spark(pos.x, pos.y, TYPE_INFO[p.kind].color, 5, 90);
  }

  // ============ ГЛАВНЫЙ ЦИКЛ (вызывается 60 раз/сек) ============
  step(dt: number) {
    this.now += dt;

    // подготовка -> старт волны по таймеру
    if (this.status === 'prep' && this.now >= this.prepUntil) this.startWave();

    // спавн врагов
    if (this.status === 'wave' && this.spawnPlan.length) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        const boss = this.spawnPlan.shift()!;
        this.spawnEnemy(boss);
        this.spawnTimer = this.spawnInterval();
      }
    }

    // --- враги ---
    const leakedNow: EnemyState[] = [];
    for (const e of this.enemies) {
      if (e.dots.length) {
        for (const d of e.dots) e.hp -= d.dps * dt;
        e.dots = e.dots.filter((d) => d.until > this.now);
        if (Math.random() < dt * 6) {
          const pos = pathPoint(e.p);
          this.spark(pos.x, pos.y, '#4ade80', 1, 40);
        }
      }
      const slowF = this.now < e.slowUntil ? e.slowFactor : 1;
      e.p += e.speed * slowF * dt;
      if (e.hp <= 0) e.dead = true;
      else if (e.p >= LEAK_AT) leakedNow.push(e);
    }

    // утечки: враг дошёл до выхода
    for (const e of leakedNow) {
      e.dead = true;
      this.lives -= e.leakDmg;
      this.leaked++;
      const pos = pathPoint(LEAK_AT);
      this.spark(pos.x, pos.y, '#ef4444', 12, 150);
      this.ring(pos.x, pos.y, '#ef4444', 70);
      this.textP(pos.x, pos.y - 20, `-${e.leakDmg}`, '#f87171');
      this.hurtUntil = this.now + 0.35;
      sfx.leak();
      this.emit('leak');
    }

    // смерти: награда
    const died = this.enemies.filter((e) => e.dead && e.hp <= 0);
    for (const e of died) {
      this.essence += e.reward;
      this.kills++;
      const pos = pathPoint(e.p);
      this.spark(pos.x, pos.y, e.boss ? '#c084fc' : '#fbbf24', e.boss ? 18 : 9, e.boss ? 200 : 130);
      this.textP(pos.x, pos.y - 14, `+${e.reward}`, '#fcd34d');
      this.emit('kill');
    }
    if (died.length) sfx.die();
    this.enemies = this.enemies.filter((e) => !e.dead);

    if (this.lives <= 0) {
      this.lives = 0;
      this.status = 'gameover';
      sfx.gameover();
      this.emit('gameover');
      return;
    }

    // волна зачищена
    if (this.status === 'wave' && !this.spawnPlan.length && !this.enemies.length) {
      const bonus = CONFIG.clearBonusBase + this.wave;
      this.essence += bonus;
      this.setBanner(`Волна зачищена! +${bonus} эссенции`, 2.2);
      sfx.clear();
      this.emit('clear');
      this.wave++;
      this.status = 'prep';
      this.prepUntil = this.now + CONFIG.prepTime;
    }

    // --- снаряды: самонаведение с дугой (как в Random Dice) ---
    for (const p of this.projs) {
      p.age += dt;
      p.life -= dt;
      let t = this.enemies.find((e) => e.id === p.targetId) ?? null;
      if (!t) t = this.pickTarget();
      if (t) {
        p.targetId = t.id;
        const tp = pathPoint(t.p);
        const dx = tp.x - p.x, dy = tp.y - p.y;
        const dist = Math.hypot(dx, dy) || 1;
        const maxSp = 520;
        const k = 1 - Math.exp(-5.5 * dt); // плавный поворот — даёт красивую дугу
        p.vx += ((dx / dist) * maxSp - p.vx) * k;
        p.vy += ((dy / dist) * maxSp - p.vy) * k;
        if (dist < 18) {
          this.impact(p, t);
          p.life = 0;
          continue;
        }
      } else {
        p.life -= dt * 1.5; // врагов нет — снаряд долетает и гаснет
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.trail.unshift({ x: p.x, y: p.y });
      if (p.trail.length > 5) p.trail.pop();
    }
    this.projs = this.projs.filter((p) => p.life > 0);

    // --- иглы: летят прямо, лопают первый шарик на пути ---
    for (const n of this.needles) {
      n.x += n.dx * 540 * dt;
      n.y += n.dy * 540 * dt;
      n.life -= dt;
      for (let i = 0; i < this.grid.length; i++) {
        const o = this.grid[i];
        if (!o || this.popQueued.has(i)) continue;
        const c = cellC(i);
        const along = (c.x - n.x) * n.dx + (c.y - n.y) * n.dy;
        const perp = Math.abs((c.x - n.x) * -n.dy + (c.y - n.y) * n.dx);
        if (perp < 30 && along > -18 && along < 44) {
          this.popQueued.add(i);
          this.chainCount++;
          if (o.type === 'spiky') {
            this.detonateSpiky(i, n.depth + 1); // цепная реакция!
          } else {
            this.popQueue.push({ at: this.now + 0.05, cell: i, count: 2 * o.level });
            this.spark(c.x, c.y, '#b16cff', 6, 100);
            sfx.needle();
          }
          n.life = 0;
          break;
        }
      }
    }
    this.needles = this.needles.filter(
      (n) => n.life > 0 && n.x > 20 && n.x < STAGE_W - 20 && n.y > 20 && n.y < STAGE_H - 20
    );

    // --- очередь лопающихся шариков ---
    if (this.popQueue.length) {
      const due = this.popQueue.filter((q) => q.at <= this.now);
      this.popQueue = this.popQueue.filter((q) => q.at > this.now);
      for (const q of due) {
        this.popQueued.delete(q.cell);
        const o = this.grid[q.cell];
        if (!o) continue;
        if (o.type === 'spiky') {
          this.detonateSpiky(q.cell, 0);
        } else {
          this.grid[q.cell] = null;
          const c = cellC(q.cell);
          this.ring(c.x, c.y, TYPE_INFO[o.type].color, 54);
          this.spark(c.x, c.y, TYPE_INFO[o.type].color, 7, 110);
          this.fireOrbAt(c.x, c.y, o.type, q.count);
          sfx.popSmall();
        }
      }
    }

    // --- награда за цепную реакцию ---
    if (this.chainCount > 0 && !this.needles.length && !this.popQueue.length) {
      if (this.chainCount >= 3) {
        this.essence += this.chainCount;
        this.setBanner(`Цепная реакция ×${this.chainCount}! +${this.chainCount} эссенции`, 2);
        sfx.clear();
      }
      this.maxChain = Math.max(this.maxChain, this.chainCount);
      this.chainCount = 0;
    }

    // --- частицы ---
    for (const pt of this.parts) {
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      if (pt.kind === 'spark') pt.vy += 160 * dt;
      pt.life -= dt;
    }
    this.parts = this.parts.filter((pt) => pt.life > 0);
    if (this.parts.length > 220) this.parts.splice(0, this.parts.length - 220);
  }
}
