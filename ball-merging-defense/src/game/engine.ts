// ============================================================
// ДВИЖОК ИГРЫ. Чистый TypeScript, без React.
// App.tsx вызывает step(dt) 60 раз в секунду и рисует то,
// что лежит в полях этого класса.
// ============================================================

import {
  ALL_TYPES,
  BOSS_DEFS,
  BOSS_IDS,
  CLASSIC_TYPES,
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
  type BossId,
  type OrbType,
} from './config';
import { sfx } from './audio';

// Четыре соседние клетки (вверх/вниз/влево/вправо)
export function neighbors4(i: number): number[] {
  const r = Math.floor(i / COLS);
  const c = i % COLS;
  const out: number[] = [];
  if (r > 0) out.push(i - COLS);
  if (r < ROWS - 1) out.push(i + COLS);
  if (c > 0) out.push(i - 1);
  if (c < COLS - 1) out.push(i + 1);
  return out;
}

export type Status = 'title' | 'prep' | 'wave' | 'gameover';
export type Mode = 'combine' | 'accumulate';
// Режим игры: обычный (как раньше) или экспериментальный (меняющаяся колода)
export type GameMode = 'normal' | 'experimental';
// Короткие события для UI (виброотклик на телефоне)
export type EngineEvent =
  | 'leak'
  | 'kill'
  | 'boss'
  | 'clear'
  | 'gameover'
  | 'detonate'
  | 'upgrade';

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
  stunUntil: number; // время, до которого враг заморожен (паралич)
  dots: { until: number; dps: number }[]; // яды
  reward: number;
  leakDmg: number;
  boss: boolean;
  bossId: number; // 0 — не босс, иначе 1 или 2 (какой именно босс)
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
  straight?: boolean; // летит прямо (пробой), без самонаведения
  pierceLeft?: number; // сколько врагов ещё пробивает
  hitIds?: number[]; // враги, уже поражённые этим снарядом
  bonus?: number; // бонус комбо: каждый шарик в цепи добавляет урон
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
  kind: 'spark' | 'ring' | 'text' | 'line' | 'arrow';
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
  gameMode: GameMode = 'normal';
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
  // план спавна: 0 = обычный враг, 1/2 = босс (какой — по BOSS_DEFS)
  spawnPlan: number[] = [];
  spawnTimer = 0;
  prepUntil = 0;
  pendingBossId = 0; // босс следующей босс-волны (выбирает рулетка)

  // --- очередь "лопания" шариков (чтобы взрывы шли красиво, с задержкой) ---
  popQueue: { at: number; cell: number; count: number; amp?: boolean }[] = [];
  popQueued = new Set<number>();
  chainCount = 0;
  maxChain = 0;

  // --- визуальное излучение стрелочек от усиленных соседей ---
  nextArrowEmit = 0;
  arrowPhase = 0;

  // --- улучшения по типам ---
  // Делается долгим нажатием на шарик на поле: шарик расходится (исчезает),
  // а уровень его ТИПА в колоде растёт. Улучшенный уровень действует на все
  // шарики этого типа и никуда не девается. Стоимость фиксированная:
  // CONFIG.upgradeCost эссенции за каждое улучшение.
  typeLevels: Record<OrbType, number> = {
    fire: 1,
    ice: 1,
    bolt: 1,
    poison: 1,
    spiky: 1,
    amp: 1,
    nova: 1,
    stun: 1,
    pierce: 1,
    vampire: 1,
    barrage: 1,
  };

  // --- автоматическое заполнение пустых клеток ---
  nextAutoFill = 0;

  // --- колода типов шариков ---
  // В обычном режиме — пять базовых типов.
  // В экспериментальном — пять случайных из десяти, меняются каждую 5-ю волну.
  deck: OrbType[] = [...CLASSIC_TYPES];
  lastVampAt = -10; // дроссель эссенции от вампира

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
  // Серая частица-стрелочка, излучаемая из центра усиленного соседнего шарика
  arrowSpark(x: number, y: number, angle?: number) {
    const a = angle ?? Math.random() * Math.PI * 2;
    const spd = 54 + Math.random() * 20;
    this.parts.push({
      id: this.nextId++,
      kind: 'arrow',
      x,
      y,
      vx: Math.cos(a) * spd,
      vy: Math.sin(a) * spd,
      life: 0.65,
      maxLife: 0.65,
      color: '#cbd5e1',
      size: 9,
      text: '',
      x2: a,
      y2: 0,
    });
  }

  // Находится ли шарик в клетке i под эффектом усиления (рядом с шариком «Усилитель»)
  isAmplified(i: number): boolean {
    if (!this.grid[i]) return false;
    for (const n of neighbors4(i)) {
      const no = this.grid[n];
      if (no && no.type === 'amp') return true;
    }
    return false;
  }

  // Излучение серых частиц-стрелочек из центра всех усиленных соседних шариков
  emitAmpArrows() {
    for (let i = 0; i < this.grid.length; i++) {
      if (!this.isAmplified(i)) continue;
      const c = cellC(i);
      const a = (this.arrowPhase * 1.9 + i * 1.37) % (Math.PI * 2);
      this.arrowSpark(c.x, c.y, a);
    }
    this.arrowPhase++;
  }

  // ============ УПРАВЛЕНИЕ ИГРОЙ ============
  // Случайный тип шарика из текущей колоды.
  // В обычном режиме шипастый выпадает реже остальных.
  private randomOrbType(): OrbType {
    // шарики появляются строго из текущей колоды (в обычном режиме —
    // шесть базовых типов, включая усилитель)
    return this.deck[Math.floor(Math.random() * this.deck.length)];
  }

  // Заполнить всё поле новыми шариками из колоды (каскадное появление).
  // Глобальное улучшение при этом сохраняется — оно не связано с шариками.
  refillField() {
    this.sel = null;
    this.popQueue.length = 0;
    this.popQueued.clear();
    for (let i = 0; i < this.grid.length; i++) {
      this.grid[i] = {
        id: this.nextId++,
        type: this.randomOrbType(),
        level: 1,
        cdUntil: 0,
        bornAt: this.now + i * 0.03,
        pulse: this.now,
      };
    }
    this.emitAmpArrows();
  }

  // Экспериментальный режим: новая колода — 5 случайных типов из десяти.
  // Поле пересобирается под новую колоду.
  reshuffleDeck(initial = false) {
    const pool = [...ALL_TYPES];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    this.deck = pool.slice(0, CONFIG.deckSize);
    if (!initial) this.refillField();
    this.setBanner(`Колода: ${this.deck.map((t) => TYPE_INFO[t].name).join(', ')}`, 3.5);
  }

  startGame(mode: GameMode = 'normal') {
    this.gameMode = mode;
    this.status = 'prep';
    this.prepUntil = this.now + CONFIG.firstPrep;
    this.nextAutoFill = 0;
    this.pendingBossId = 0;
    for (const k of Object.keys(this.typeLevels) as OrbType[]) this.typeLevels[k] = 1;
    if (mode === 'experimental') {
      this.reshuffleDeck(true);
      this.refillField();
      this.setBanner('Экспериментальный режим. Волна через 9 секунд');
    } else {
      this.deck = [...CLASSIC_TYPES];
      this.refillField();
      this.setBanner('Поле готово. Волна через 9 секунд');
    }
  }

  startWave() {
    this.status = 'wave';
    const bossWave = this.wave % CONFIG.bossEvery === 0;
    const normals = bossWave ? 4 + this.wave : CONFIG.waveCountBase + this.wave * CONFIG.waveCountPer;
    this.spawnPlan = [];
    if (bossWave) {
      // если босс ещё не выбран (страховка) — берём случайного
      if (!this.pendingBossId) this.pendingBossId = BOSS_IDS[Math.floor(Math.random() * BOSS_IDS.length)];
      this.spawnPlan.push(this.pendingBossId);
    }
    for (let i = 0; i < normals; i++) this.spawnPlan.push(0);
    this.spawnTimer = 0.4;
    this.setBanner(
      bossWave ? `Волна ${this.wave}: босс ${BOSS_DEFS[this.pendingBossId as BossId].name}` : `Волна ${this.wave}`,
    );
    sfx.waveStart();
  }

  callWaveNow() {
    if (this.status !== 'prep') return;
    this.essence += CONFIG.callBonus;
    this.textP(STAGE_W / 2, 120, `${CONFIG.callBonus} эссенции`, '#7dd3fc');
    this.startWave();
  }

  spawnInterval() {
    const base = this.wave % CONFIG.bossEvery === 0 ? 1.15 : CONFIG.spawnInterval;
    return Math.max(CONFIG.spawnIntervalMin, base - this.wave * 0.03);
  }

  // kind: 0 = обычный враг, 1 или 2 = босс (BOSS_DEFS)
  spawnEnemy(kind: number) {
    const w = this.wave;
    const boss = kind > 0;
    const def = boss ? BOSS_DEFS[kind as BossId] : null;
    const hp = boss
      ? Math.round(CONFIG.bossHp * def!.hpMult * Math.pow(CONFIG.bossHpGrowth, w / CONFIG.bossEvery - 1))
      : Math.round(CONFIG.enemyHp * Math.pow(CONFIG.enemyHpGrowth, w - 1));
    this.enemies.push({
      id: this.nextId++, p: 0, hp, maxHp: hp,
      speed: boss
        ? CONFIG.bossSpeed * def!.speedMult
        : Math.min(CONFIG.enemySpeedCap, CONFIG.enemySpeed + (w - 1) * CONFIG.enemySpeedGrowth),
      radius: boss ? def!.radius : 14,
      slowUntil: 0, slowFactor: 1, stunUntil: 0, dots: [],
      reward: boss ? def!.reward : CONFIG.enemyReward,
      leakDmg: boss ? CONFIG.bossLeak : 1,
      boss, bossId: boss ? kind : 0, flashUntil: 0, dead: false,
    });
    if (boss) this.emit('boss');
  }

  // ============ ДЕЙСТВИЯ ИГРОКА ============
  // Поместить новый шарик в пустую клетку. Бесплатно:
  // автоматически (nextAutoFill) или по тапу игрока в пустую клетку.
  placeOrbAt(cell: number, auto = false) {
    if (this.grid[cell]) return;
    const type = this.randomOrbType();
    this.grid[cell] = { id: this.nextId++, type, level: 1, cdUntil: 0, bornAt: this.now, pulse: this.now };
    this.popQueued.delete(cell);
    const c = cellC(cell);
    this.ring(c.x, c.y, TYPE_INFO[type].color, auto ? 46 : 60);
    this.spark(c.x, c.y, TYPE_INFO[type].color, auto ? 4 : 6, 90);
    if (type === 'amp') {
      for (const n of neighbors4(cell)) {
        if (this.grid[n]) {
          const nc = cellC(n);
          this.arrowSpark(nc.x, nc.y);
        }
      }
    } else if (this.isAmplified(cell)) {
      this.arrowSpark(c.x, c.y);
    }
    if (auto) sfx.place();
    else sfx.buy();
  }

  // Улучшение типа (долгое нажатие на шарик на поле): шарик расходится —
  // исчезает из клетки, а уровень его типа в колоде растёт на 1.
  // Действует на все шарики этого типа, никуда не исчезает.
  // Стоимость фиксированная: CONFIG.upgradeCost эссенции за уровень.
  upgradeCell(i: number) {
    const o = this.grid[i];
    if (!o) return;
    if (this.essence < CONFIG.upgradeCost) {
      this.err(`Не хватает эссенции, нужно ${CONFIG.upgradeCost}`);
      this.shake(i);
      return;
    }
    const info = TYPE_INFO[o.type];
    this.essence -= CONFIG.upgradeCost;
    this.typeLevels[o.type] += 1;
    const lvl = this.typeLevels[o.type];
    const c = cellC(i);
    this.grid[i] = null; // шарик расходуется
    this.popQueued.delete(i); // чтобы клетка не «залипла» в очереди
    if (this.sel === i) this.sel = null;
    this.ring(c.x, c.y, '#fbbf24', 70);
    this.spark(c.x, c.y, info.color, 12, 150);
    this.textP(c.x, c.y - 30, `${info.name}: ${lvl}`, '#fcd34d');
    // лёгкий импульс: все шарики этого типа получают усиление
    for (const cell of this.grid) {
      if (cell && cell.type === o.type) cell.pulse = this.now;
    }
    sfx.upgrade();
    this.emit('upgrade');
  }

  // Продажа (ПКМ на десктопе): клетка опустеет и заполнится новым шариком
  sellCell(i: number) {
    const o = this.grid[i];
    if (!o) return;
    const refund = CONFIG.sellBase + 3 * (o.level - 1);
    this.essence += refund;
    this.grid[i] = null;
    this.popQueued.delete(i);
    if (this.sel === i) this.sel = null;
    const c = cellC(i);
    this.textP(c.x, c.y - 10, `${refund}`, '#7dd3fc');
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

  // Режим накопления: сливаем два ОДИНАКОВЫХ шарика в один.
  // Уровни заряда СКЛАДЫВАЮТСЯ (шарик 5 и шарик 3 дают 8).
  // Заряд остаётся на шарике, который нажали ВТОРЫМ (b).
  // Шипастый можно сливать с любым шариком: заряд ляжет на тип
  // шарика, нажатого вторым.
  mergePair(a: number, b: number) {
    const A = this.grid[a];
    const B = this.grid[b];
    if (!A || !B) return;
    if (A.type !== B.type && A.type !== 'spiky' && B.type !== 'spiky') {
      this.err('Накопление: одинаковые шарики, шипастый — с любым');
      this.shake(a);
      this.shake(b);
      return;
    }
    if (A.level + B.level > CONFIG.maxLevel) {
      this.err(`Заряд выше максимума: ${CONFIG.maxLevel}`);
      this.shake(b);
      return;
    }
    B.level += A.level;
    B.pulse = this.now;
    this.grid[a] = null;
    this.popQueued.delete(a);
    this.sel = null;
    const c = cellC(b);
    this.ring(c.x, c.y, TYPE_INFO[B.type].color, 70);
    this.spark(c.x, c.y, TYPE_INFO[B.type].color, 8, 110);
    this.textP(c.x, c.y - 14, `${B.level}`, '#ffffff');
    sfx.merge();
    if (B.level >= 2) {
      this.setBanner(`Заряд ${B.level}: переключи на «Совмещение» — шарик взорвётся залпом`, 2.8);
    }
  }

  // Режим совмещения: два соседних шарика стреляют.
  // Цепь — только из одинаковых шариков, НО шипастый можно
  // соединять с любым другим шариком.
  firePair(a: number, b: number) {
    const A = this.grid[a];
    const B = this.grid[b];
    if (!A || !B) return;
    if (A.type !== B.type && A.type !== 'spiky' && B.type !== 'spiky') {
      this.err('Цепь: только одинаковые шарики (шипастый — с любым)');
      this.shake(a);
      this.shake(b);
      this.sel = null;
      return;
    }
    if (this.now < A.cdUntil || this.now < B.cdUntil) {
      this.err('Шарики ещё перезаряжаются');
      this.shake(this.now < A.cdUntil ? a : b);
      return;
    }
    const ca = cellC(a);
    const cb = cellC(b);
    this.linkLine(ca.x, ca.y, cb.x, cb.y, '#22d3ee');

    // Пара — это цепь из двух шариков: комбо-бонус +2 к каждому снаряду.
    // Шипастый не стреляет — лопает и выпускает иглы.
    if (A.type !== 'spiky') {
      this.fireOrb(a, 2, 2);
      A.cdUntil = this.now + CONFIG.cooldown;
    }
    if (B.type !== 'spiky') {
      this.fireOrb(b, 2, 2);
      B.cdUntil = this.now + CONFIG.cooldown;
    }
    if (A.type === 'spiky') this.detonateSpiky(a, 0);
    if (B.type === 'spiky' && this.grid[b]) this.detonateSpiky(b, 0);
    this.sel = null;
  }

  // Цепочка выстрела (режим совмещения): проведённая линия по соседним
  // шарикам (2 и больше, зигзаги и углы разрешены). Все готовые шарики
  // стреляют сразу — по 2 снаряда каждый; шипастые в цепочке лопаются;
  // шарики на перезарядке пропускаются (подожди и повтори линию).
  fireChain(cells: number[]) {
    const ready: number[] = [];
    for (const i of cells) {
      const o = this.grid[i];
      if (o && this.now >= o.cdUntil) ready.push(i);
    }
    if (!ready.length) {
      this.err('Шарики в цепи ещё перезаряжаются');
      return;
    }
    for (let k = 1; k < cells.length; k++) {
      const ca = cellC(cells[k - 1]);
      const cb = cellC(cells[k]);
      this.linkLine(ca.x, ca.y, cb.x, cb.y, '#22d3ee');
    }
    let fired = 0;
    // комбо: каждый шарик в цепи добавляет +1 урона всем снарядам цепи
    const bonus = ready.length;
    for (const i of ready) {
      const o = this.grid[i];
      if (!o) continue;
      if (o.type === 'spiky') {
        this.detonateSpiky(i, 0);
        continue;
      }
      this.fireOrb(i, 2, bonus);
      o.cdUntil = this.now + CONFIG.cooldown;
      fired++;
    }
    this.sel = null;
    if (ready.length > 2) this.setBanner(`Цепь: ${ready.length} шариков, +${bonus} к урону`, 1.4);
  }

  // Переключение режима. Возврат в совмещение = ДЕТОНАЦИЯ всех заряженных.
  toggleMode() {
    if (this.mode === 'combine') {
      this.mode = 'accumulate';
      this.sel = null;
      this.setBanner('Режим накопления: сливай одинаковые шарики в один', 2.4);
      sfx.modeOn();
    } else {
      this.mode = 'combine';
      this.sel = null;
      let k = 0;
      for (let i = 0; i < this.grid.length; i++) {
        const o = this.grid[i];
        if (o && o.level >= 2 && !this.popQueued.has(i)) {
          this.popQueued.add(i);
          this.popQueue.push({
            at: this.now + k * 0.08,
            cell: i,
            count: o.level,
            amp: this.isAmplified(i),
          });
          k++;
        }
      }
    if (k > 0) {
      this.setBanner(`Детонация: разрушено ${k}`, 1.6);
      this.detonateFlashUntil = this.now + 0.35;
      sfx.detonate();
      this.emit('detonate');
    } else {
      this.setBanner('Нет заряженных шариков (нужен уровень 2 и выше)', 2);
    }
  }
  }

  // ============ СТРЕЛЬБА ============
  fireOrb(cell: number, count: number, bonus = 0) {
    const o = this.grid[cell];
    if (!o) return;
    const c = cellC(cell);
    let finalCount = o.type === 'barrage' ? Math.max(count, 5 + (this.typeLevels.barrage - 1)) : count;
    // Усилитель рядом: соседние шарики выпускают в два раза больше снарядов
    if (this.isAmplified(cell)) {
      finalCount *= 2;
      for (const n of neighbors4(cell)) {
        const no = this.grid[n];
        if (no && no.type === 'amp') {
          const nc = cellC(n);
          this.ring(nc.x, nc.y, '#d7dee8', 44);
          no.pulse = this.now;
        }
      }
      this.arrowSpark(c.x, c.y);
    }
    this.fireOrbAt(c.x, c.y, o.type, finalCount, bonus);
    sfx.shoot(o.type);
    o.pulse = this.now;
  }

  // Сила эффектов берётся из уровня типа (this.typeLevels).
  // bonus — комбо-бонус: каждый шарик в цепи добавляет +1 к урону снарядов.
  fireOrbAt(x: number, y: number, type: OrbType, count: number, bonus = 0) {
    const g = this.typeLevels[type] - 1;
    if (type === 'barrage') count = Math.max(count, 5 + g); // залп растёт с уровнем типа
    for (let k = 0; k < count; k++) {
      const target = this.pickTarget();
      if (type === 'pierce') {
        // пробой: прямой выстрел в сторону цели, без самонаведения
        let dx = Math.random() - 0.5;
        let dy = -1;
        if (target) {
          const tp = pathPoint(target.p);
          dx = tp.x - x;
          dy = tp.y - y;
        }
        const d = Math.hypot(dx, dy) || 1;
        const sp = 430;
        this.projs.push({
          id: this.nextId++, kind: type, x, y,
          vx: (dx / d) * sp, vy: (dy / d) * sp,
          targetId: -1,
          age: 0, seed: Math.random() * 10, life: 1.4, trail: [],
          straight: true, pierceLeft: 2 + g, hitIds: [],
          bonus,
        });
        continue;
      }
      this.projs.push({
        id: this.nextId++, kind: type, x, y,
        vx: (Math.random() - 0.5) * 260,
        vy: -150 - Math.random() * 160,
        targetId: target ? target.id : -1,
        age: 0, seed: Math.random() * 10, life: 3, trail: [],
        bonus,
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
    // Уровень шипастого в колоде добавляет иглы. Четыре главных
    // направления (вверх/вниз/влево/вправо) всегда на месте — соседние
    // шарики достаются гарантированно; остальные разбросаны между ними.
    const n = 4 + (this.typeLevels.spiky - 1);
    const angles: number[] = [];
    for (let k = 0; k < 4; k++) angles.push(-Math.PI / 2 + (Math.PI / 2) * k);
    const extra = n - 4;
    const perGap = Math.ceil(extra / 4);
    for (let k = 0; k < extra; k++) {
      const gap = k % 4;
      const idx = Math.floor(k / 4) + 1;
      angles.push(-Math.PI / 2 + (Math.PI / 2) * gap + (Math.PI / 2) * (idx / (perGap + 1)));
    }
    for (const a of angles) {
      const dx = Math.cos(a);
      const dy = Math.sin(a);
      this.needles.push({
        id: this.nextId++, x: c.x + dx * 24, y: c.y + dy * 24,
        dx, dy, ang: a, life: 1.6, depth,
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

  // Попадание снаряда: эффект зависит от типа шарика и глобального улучшения
  impact(p: ProjState, e: EnemyState) {
    // Сила эффекта — от уровня типа в колоде (1 = базовый, g = 0)
    const g = this.typeLevels[p.kind] - 1;
    // бонус комбо: каждый шарик в цепи добавил +1 к урону снаряда
    const b = p.bonus || 0;
    const pos = pathPoint(e.p);
    switch (p.kind) {
      case 'fire': {
        // улучшение: основной урон растёт (3 + уровень) + бонус цепи
        this.damage(e, 3 + g + b, '#ff9a3d');
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
        // улучшение: замедление сильнее и дольше
        this.damage(e, 1 + b, '#9be2ff');
        e.slowUntil = this.now + 2.3 + 0.4 * g;
        e.slowFactor = Math.max(0.2, 0.55 - 0.05 * g);
        this.ring(pos.x, pos.y, '#46c8ff', 44);
        break;
      }
      case 'bolt': {
        // улучшение: цепь бьёт (1 + уровень) врагов, радиус 150 + 30 за уровень
        const chainN = 1 + g;
        const radius = 150 + 30 * g;
        const chainDmg = 2 + g + b;
        this.damage(e, chainDmg, '#ffe066');
        const cands = this.enemies
          .filter((o) => o !== e && !o.dead)
          .map((o) => {
            const q = pathPoint(o.p);
            const dx = q.x - pos.x, dy = q.y - pos.y;
            return { o, q, d2: dx * dx + dy * dy };
          })
          .filter((c) => c.d2 < radius * radius)
          .sort((a, b) => a.d2 - b.d2)
          .slice(0, chainN);
        for (const c of cands) {
          this.damage(c.o, chainDmg, '#ffe066');
          this.linkLine(pos.x, pos.y, c.q.x, c.q.y, '#ffd23f');
        }
        sfx.zap();
        break;
      }
      case 'poison': {
        // улучшение: яд сильнее и дольше
        this.damage(e, 1 + b, '#86efac');
        const dps = 1.2 + 0.6 * g;
        const until = this.now + 4 + 0.5 * g;
        if (e.dots.length < 4) e.dots.push({ until, dps });
        else {
          e.dots.sort((x, y) => x.until - y.until);
          e.dots[0].until = until;
        }
        this.ring(pos.x, pos.y, '#4ade80', 40);
        break;
      }
      case 'nova': {
        // взрыв: урон всем врагам в радиусе (улучшение: радиус и урон выше)
        const radius = 95 + 20 * g;
        const dmg = 4 + g + b;
        this.damage(e, dmg, '#ff8fa3');
        for (const o of this.enemies) {
          if (o === e || o.dead) continue;
          const q = pathPoint(o.p);
          const dx = q.x - pos.x, dy = q.y - pos.y;
          if (dx * dx + dy * dy < radius * radius) this.damage(o, dmg, '#ff8fa3', false);
        }
        this.ring(pos.x, pos.y, '#ff4d6d', radius);
        this.spark(pos.x, pos.y, '#ff8fa3', 12, 170);
        break;
      }
      case 'stun': {
        // паралич: цель замирает (улучшение: дольше)
        this.damage(e, 1 + b, '#ffd27a');
        e.stunUntil = this.now + 1.2 + 0.4 * g;
        this.ring(pos.x, pos.y, '#f59e0b', 42);
        this.spark(pos.x, pos.y, '#ffd27a', 6, 80);
        break;
      }
      case 'pierce': {
        // пробой: урон каждому врагу на линии (улучшение: урон выше, пробивает больше)
        this.damage(e, 2 + g, '#b3beff');
        break;
      }
      case 'vampire': {
        // вампир: урон + эссенция (с дросселем, не чаще раза в 0.35 с)
        this.damage(e, 1 + g + b, '#ff9cc7');
        if (this.now - this.lastVampAt > 0.35) {
          this.lastVampAt = this.now;
          this.essence += 1;
          this.textP(pos.x, pos.y - 30, '1', '#ff9cc7');
        }
        this.ring(pos.x, pos.y, '#ff5da2', 34);
        break;
      }
      case 'barrage': {
        // шквал: каждый снаряд залпа наносит 1 урон
        this.damage(e, 1 + b, '#8ff5e4');
        break;
      }
      case 'amp': {
        // эхо-снаряд усилителя: слабый урон (растёт с уровнем типа)
        this.damage(e, 1 + g + b, '#d7dee8');
        this.ring(pos.x, pos.y, '#d7dee8', 40);
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

    // автоматическое заполнение: раз в 2 секунды все пустые клетки
    // заполняются новыми случайными шариками (поле всегда на месте)
    if (this.now >= this.nextAutoFill) {
      this.nextAutoFill += CONFIG.autoFillInterval;
      const empties: number[] = [];
      this.grid.forEach((o, i) => {
        if (!o) empties.push(i);
      });
      for (const cell of empties) this.placeOrbAt(cell, true);
    }

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
      const stunned = this.now < e.stunUntil; // паралич: враг замирает
      const slowF = this.now < e.slowUntil ? e.slowFactor : 1;
      e.p += (stunned ? 0 : e.speed) * slowF * dt;
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
      this.textP(pos.x, pos.y - 14, `${e.reward}`, '#fcd34d');
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
      sfx.clear();
      this.emit('clear');
      this.wave++;
      this.status = 'prep';
      const bossWave = this.wave % CONFIG.bossEvery === 0;
      if (bossWave) {
        // рулетка: выбираем босса следующей волны ещё в подготовке,
        // чтобы у игрока было время на подготовку
        this.pendingBossId = BOSS_IDS[Math.floor(Math.random() * BOSS_IDS.length)];
        this.prepUntil = this.now + CONFIG.bossPrepTime;
        if (this.gameMode === 'experimental') this.reshuffleDeck();
        this.setBanner(`Скоро босс: ${BOSS_DEFS[this.pendingBossId as BossId].name}`, 3);
      } else {
        this.prepUntil = this.now + CONFIG.prepTime;
        this.setBanner(`Волна зачищена, бонус ${bonus} эссенции`, 2.2);
      }
    }

    // --- снаряды: самонаведение с дугой (как в Random Dice) ---
    for (const p of this.projs) {
      p.age += dt;
      p.life -= dt;
      // пробой: летит прямо и поражает врагов на линии (до pierceLeft целей)
      if (p.straight) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.trail.unshift({ x: p.x, y: p.y });
        if (p.trail.length > 5) p.trail.pop();
        for (const e of this.enemies) {
          if (e.dead || p.hitIds!.includes(e.id)) continue;
          const tp = pathPoint(e.p);
          const dx = tp.x - p.x, dy = tp.y - p.y;
          const rr = e.radius + 12;
          if (dx * dx + dy * dy < rr * rr) {
            this.impact(p, e);
            p.hitIds!.push(e.id);
            p.pierceLeft = (p.pierceLeft ?? 1) - 1;
            if (p.pierceLeft <= 0) {
              p.life = 0;
              break;
            }
          }
        }
        if (p.x < -30 || p.x > STAGE_W + 30 || p.y < -30 || p.y > STAGE_H + 30) p.life = 0;
        continue;
      }
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

    // --- иглы: летят прямо, лопают первый шарик на пути,
    //     а попутно наносят урон первому врагу, которого задевают ---
    for (const n of this.needles) {
      n.x += n.dx * 540 * dt;
      n.y += n.dy * 540 * dt;
      n.life -= dt;

      // Столкновение с врагом: игла бьёт первого врага на своём пути
      // (урон растёт с уровнем шипастого в колоде).
      for (const e of this.enemies) {
        if (e.dead) continue;
        const ep = pathPoint(e.p);
        const dx = ep.x - n.x;
        const dy = ep.y - n.y;
        const rr = e.radius + 9;
        if (dx * dx + dy * dy < rr * rr) {
          this.damage(e, 1 + (this.typeLevels.spiky - 1), '#e9d5ff');
          this.spark(ep.x, ep.y, '#b16cff', 5, 90);
          n.life = 0;
          break;
        }
      }
      if (n.life <= 0) continue;

      for (let i = 0; i < this.grid.length; i++) {
        const o = this.grid[i];
        if (!o || this.popQueued.has(i)) continue;
        const c = cellC(i);
        const along = (c.x - n.x) * n.dx + (c.y - n.y) * n.dy;
        const perp = Math.abs((c.x - n.x) * -n.dy + (c.y - n.y) * n.dx);
        if (perp < 30 && along > -18 && along < 44) {
          this.chainCount++;
          if (o.type === 'spiky') {
            this.detonateSpiky(i, n.depth + 1); // цепная реакция!
          } else {
            // Любой разрушенный иглой шарик лопается и выпускает снаряды
            this.popQueued.add(i);
            this.popQueue.push({
              at: this.now + 0.05,
              cell: i,
              count: o.level,
              amp: this.isAmplified(i),
            });
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
        if (this.sel === q.cell) this.sel = null;
        if (o.type === 'spiky') {
          this.detonateSpiky(q.cell, 0);
        } else {
          // Усилитель рядом: залп лопнувшего шарика — в два раза больше снарядов
          const amplified = Boolean(q.amp || this.isAmplified(q.cell));
          let count = o.type === 'barrage' ? Math.max(q.count, 5 + (this.typeLevels.barrage - 1)) : q.count;
          if (amplified) {
            count *= 2;
            for (const n of neighbors4(q.cell)) {
              const no = this.grid[n];
              if (no && no.type === 'amp') {
                const nc = cellC(n);
                this.ring(nc.x, nc.y, '#d7dee8', 44);
                break;
              }
            }
          }
          this.grid[q.cell] = null;
          const c = cellC(q.cell);
          this.ring(c.x, c.y, TYPE_INFO[o.type].color, 54);
          this.spark(c.x, c.y, TYPE_INFO[o.type].color, 7, 110);
          this.fireOrbAt(c.x, c.y, o.type, count);
          sfx.popSmall();
        }
      }
    }

    // --- награда за цепную реакцию ---
    if (this.chainCount > 0 && !this.needles.length && !this.popQueue.length) {
      if (this.chainCount >= 4) {
        const bonus = this.chainCount - 1;
        this.essence += bonus;
        this.setBanner(`Цепная реакция: ${this.chainCount}, бонус ${bonus} эссенции`, 2);
        sfx.clear();
      }
      this.maxChain = Math.max(this.maxChain, this.chainCount);
      this.chainCount = 0;
    }

    // --- излучение серых частиц-стрелочек с центра усиленных соседних шариков ---
    if (this.now >= this.nextArrowEmit) {
      this.nextArrowEmit = this.now + 0.14;
      this.emitAmpArrows();
    }

    // --- частицы ---
    for (const pt of this.parts) {
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      if (pt.kind === 'spark') pt.vy += 160 * dt;
      pt.life -= dt;
    }
    this.parts = this.parts.filter((pt) => pt.life > 0);
    if (this.parts.length > 320) this.parts.splice(0, this.parts.length - 320);
  }
}
