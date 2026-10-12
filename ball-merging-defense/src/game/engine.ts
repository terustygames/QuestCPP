// ============================================================
// ДВИЖОК ИГРЫ. Чистый TypeScript, без React.
// App.tsx вызывает step(dt) 60 раз в секунду и рисует то,
// что лежит в полях этого класса.
// ============================================================

import {
  BOSS_DEFS,
  MINI_DEF,
  MINI_KIND,
  BOSS_IDS,
  bossForWave,
  CLASSIC_TYPES,
  CONFIG,
  COLS,
  ROWS,
  LEAK_AT,
  PATH_SPEED_SCALE,
  CHARGER_KIND,
  STAGE_W,
  STAGE_H,
  accumMul,
  isAdj,
  cellC,
  pathPoint,
  TYPE_INFO,
  gasRadius,
  type BossId,
  type OrbType,
} from './config';
import type { TypeMods } from './skills';
import { chargeProgress } from './charger';
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
// Параметры забега, которые передаёт меню: колода, дерево навыков, запасы
export interface RunConfig {
  deck: OrbType[];
  mods: Partial<Record<OrbType, TypeMods>>;
  essenceBonus: number;
  livesBonus: number;
  autoTypes: OrbType[]; // шарики с купленной «Автоатакой»
  coop?: boolean; // кооператив: волны стартует синхронизация, без таймера
}
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
  cdLen: number; // полная длина текущей перезарядки (для кольца на поле)
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
  marks: { until: number; dps: number }[]; // метки шарика «Метка» (урон во времени, высасывают эссенцию)
  reward: number;
  leakDmg: number;
  boss: boolean;
  mini: boolean; // минибосс (MINI_DEF)
  bossId: number; // 0 — не босс, иначе 1 или 2 (какой именно босс)
  flashUntil: number;
  dead: boolean;
  chargeT: number; // заряжающийся моб: секунд до полной зарядки (выбрано при создании); 0 — обычный
  bornAt: number; // время появления (для заряда)
  foreign?: boolean; // враг напарника (копия, см. Engine.setForeign)
}

// Лужа эликсира: остаётся на трассе после смерти полностью заряженного моба
export interface Puddle {
  id: number;
  p: number; // точка на трассе (пройденная дистанция)
  radius: number; // радиус вдоль трассы, px (в обе стороны)
  until: number; // время, когда лужа исчезает
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
  dmgMul?: number; // накопление: множитель урона всех попаданий снаряда
}

// Облако газа: не снаряд, а область у цели. Разрастается, держится и жжёт врагов внутри.
export interface GasCloud {
  id: number;
  x: number;
  y: number;
  age: number; // сколько прошло с рождения, с
  life: number; // сколько держится всего, с
  rMax: number; // радиус при полном разлёте, px
  nextTick: number; // время от рождения, когда следующий тик урона
  dmg: number; // база урона за тик (до дерева и накопления)
  slowF: number; // скорость врагов внутри облака (×)
  dmgMul: number; // накопление: множитель урона залпа
  seed: number; // разброс внешнего вида
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
  dmgMul: number; // накопление: множитель урона иглы (заряд шипастого)
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

// Сдвиг id врагов напарника, чтобы не совпадать с моими id
export const FOREIGN_BASE = 1_000_000_000;

export class Engine {
  // --- состояние игры ---
  status: Status = 'title';
  mode: Mode = 'combine';
  now = 0;
  wave = 1;
  lives = CONFIG.lives;
  essence = CONFIG.essenceStart;
  // почему забег закончился: поражение или сдача (для экрана итогов)
  endReason: 'loss' | 'surrender' = 'loss';
  // модификаторы дерева навыков (задаются в startGame)
  mods: Partial<Record<OrbType, TypeMods>> = {};
  // множитель урона текущего попадания (накопление: залп заряженного шарика)
  private hitMul = 1;

  // --- сущности ---
  grid: (OrbState | null)[] = Array(COLS * ROWS).fill(null);
  enemies: EnemyState[] = [];
  projs: ProjState[] = [];
  clouds: GasCloud[] = []; // облака газа (шарик «Газ»)
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
  // план спавна: 0 = обычный враг, 1/2 = босс (какой — по BOSS_DEFS), CHARGER_KIND = заряжающийся
  spawnPlan: number[] = [];
  // лужи эликсира на трассе (от мобов, убитых полностью заряженными)
  puddles: Puddle[] = [];
  spawnTimer = 0;
  prepUntil = 0;
  pendingBossId = 0; // босс следующей босс-волны (выбирает рулетка)

  // --- очередь "лопания" шариков (чтобы взрывы шли красиво, с задержкой) ---
  popQueue: { at: number; cell: number; count: number; amp?: boolean }[] = [];
  popQueued = new Set<number>();
  chainCount = 0;
  // Авто-линия: id шариков последней проведённой линии. Линия стреляет сама,
  // когда её шарики перезарядились; новая линия заменяет старую.
  autoLine: number[] | null = null;
  autoTypes: OrbType[] = []; // шарики, для которых куплена авто-атака
  coop = false; // кооператив: старт волны внешний (см. services/coopSession.ts)
  // кооператив: враги напарника (копии для прицеливания; координаты переводятся в at())
  foreign: EnemyState[] = [];
  // урон по врагам напарника, который надо ему отправить: id врага → сумма урона
  outHits: Record<string, number> = {};
  // награды за убийства, которые получит напарник (каждый убитый даёт обоим)
  outKills = 0;
  leakDamage = 0; // всего урона от утечек (для общих жизней в кооперативе)
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
    mark: 1,
    gas: 1,
  };

  // --- автоматическое заполнение пустых клеток ---
  nextAutoFill = 0;

  // --- колода типов шариков: шесть шариков, собранных в инвентаре ---
  deck: OrbType[] = [...CLASSIC_TYPES];
  lastVampAt = -10; // дроссель эссенции от вампира
  // метка высасывает эссенцию из врагов: дробная часть копится до целого
  markDrainAcc = 0;

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
        cdLen: CONFIG.cooldown,
        bornAt: this.now + i * 0.03,
        pulse: this.now,
      };
    }
    this.emitAmpArrows();
  }

  // Старт забега: колода и дерево навыков из меню, запасы на старт.
  startGame(cfg: RunConfig) {
    this.status = 'prep';
    this.prepUntil = this.now + CONFIG.firstPrep;
    this.nextAutoFill = 0;
    this.pendingBossId = 0;
    this.autoLine = null;
    this.deck = [...cfg.deck];
    this.autoTypes = [...cfg.autoTypes];
    this.coop = !!cfg.coop;
    this.leakDamage = 0;
    this.mods = cfg.mods;
    this.essence = CONFIG.essenceStart + cfg.essenceBonus;
    this.lives = CONFIG.lives + cfg.livesBonus;
    this.endReason = 'loss';
    for (const k of Object.keys(this.typeLevels) as OrbType[]) this.typeLevels[k] = 1;
    this.markDrainAcc = 0;
    this.clouds = [];
    this.refillField();
    this.setBanner('Поле готово. Волна через 9 секунд');
  }

  // Сдача: забег завершается, итоги считаются по пройденным волнам.
  surrender() {
    if (this.status !== 'prep' && this.status !== 'wave') return;
    this.status = 'gameover';
    this.endReason = 'surrender';
    this.sel = null;
    sfx.gameover();
    this.emit('gameover');
  }

  // Модификатор дерева навыков для типа шарика (0, если узла нет)
  m(t: OrbType, k: keyof TypeMods): number {
    return this.mods[t]?.[k] ?? 0;
  }
  // Урон основного попадания: плоский и процентный бонус дерева
  // Шанс критического попадания (дерево) удваивает урон удара
  hitDmg(base: number, t: OrbType): number {
    const v = (base + this.m(t, 'dmg')) * (1 + this.m(t, 'dmgPct'));
    return Math.random() < this.m(t, 'crit') ? v * 2 : v;
  }

  // Заряд заряжающегося моба: 0 — только появился, 1 — полностью заряжен
  chargeLevel(e: EnemyState): number {
    return chargeProgress(this.now, e.bornAt, e.chargeT);
  }

  // Множитель скорости моба внутри лужи эликсира (не складывается между лужами)
  puddleFactor(e: EnemyState): number {
    if (e.boss && !CONFIG.charger.puddleBoss) return 1;
    return this.puddles.some((pd) => Math.abs(e.p - pd.p) <= pd.radius) ? CONFIG.charger.puddleSpeed : 1;
  }

  // Лужа эликсира на трассе в точке p
  spawnPuddle(p: number) {
    this.puddles.push({
      id: this.nextId++,
      p,
      radius: CONFIG.charger.puddleRadius,
      until: this.now + CONFIG.charger.puddleDuration,
    });
    const pos = this.pt(p);
    this.spark(pos.x, pos.y, '#c084fc', 10, 120);
    this.textP(pos.x, pos.y - 16, 'Лужа эликсира', '#d8b4fe');
    sfx.pop();
  }

  // Случайная цель среди всех живых врагов (для шарика «Метка»)
  randomTarget(): EnemyState | null {
    const alive = this.allEnemies().filter((e) => !e.dead);
    if (!alive.length) return null;
    return alive[Math.floor(Math.random() * alive.length)];
  }

  // Метка высасывает эссенцию из врага: урон метки × CONFIG.markDrain (+ дерево «drain»).
  // Опыта у метки нет: её уровень растёт только улучшениями, как у других типов.
  drainFromMark(dmg: number) {
    this.markDrainAcc += dmg * CONFIG.markDrain * (1 + this.m('mark', 'drain'));
    const whole = Math.floor(this.markDrainAcc);
    if (whole > 0) {
      this.essence += whole;
      this.markDrainAcc -= whole;
    }
  }
  // Перезарядка шарика после выстрела (с учётом дерева)
  arm(o: OrbState) {
    const len = Math.max(0.5, CONFIG.cooldown + this.m(o.type, 'cd'));
    o.cdLen = len;
    o.cdUntil = this.now + len;
  }
  // Число снарядов залпа: базовое + дерево (шквал — от уровня типа)
  shotCount(t: OrbType, count: number): number {
    const g = this.typeLevels[t] - 1;
    const base = t === 'barrage' ? Math.max(count, 5 + g) : count;
    return base + this.m(t, 'shots');
  }
  // Усиление соседей усилителя: ×2 и дерево усилителя
  ampFactor(): number {
    return 2 + this.m('amp', 'amp');
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
    for (let i = 0; i < normals; i++) {
      const charger =
        !bossWave && this.wave >= CONFIG.charger.fromWave && Math.random() < CONFIG.charger.chance;
      this.spawnPlan.push(charger ? CHARGER_KIND : 0);
    }
    // минибосс: не больше одного за волну, на обычной волне, начиная с miniFromWave
    if (!bossWave && this.wave >= CONFIG.miniFromWave && Math.random() < CONFIG.miniChance) {
      const at = Math.floor(Math.random() * this.spawnPlan.length);
      this.spawnPlan.splice(at, 0, MINI_KIND);
    }
    this.spawnTimer = 0.4;
    this.setBanner(
      bossWave ? `Волна ${this.wave}: босс ${BOSS_DEFS[this.pendingBossId as BossId].name}` : `Волна ${this.wave}`,
    );
    sfx.waveStart();
  }

  // Точка трассы по пройденной дистанции (одна трасса для обоих полей)
  pt(p: number) {
    return pathPoint(p);
  }

  // Точка врага в координатах моего поля. Враг напарника: его поле повёрнуто
  // по вертикали (сверху), поэтому y переворачивается.
  at(e: EnemyState) {
    const q = pathPoint(e.p);
    return e.foreign ? { x: q.x, y: -q.y, tx: q.tx, ty: -q.ty } : q;
  }

  // Все враги, по которым могут попасть мои снаряды (свои и напарника)
  allEnemies(): EnemyState[] {
    return this.foreign.length ? [...this.enemies, ...this.foreign] : this.enemies;
  }

  // Кооператив: список врагов напарника со снимка (копии, см. at())
  setForeign(list: EnemyState[]) {
    this.foreign = list
      .filter((e) => !e.dead)
      .map((e) => ({ ...e, id: e.id + FOREIGN_BASE, foreign: true, dots: [], marks: [] }));
  }

  // Кооператив: удар по моему врагу от напарника (его снаряд или игла)
  applyHit(id: number, d: number) {
    const e = this.enemies.find((x) => x.id === id && !x.dead);
    if (!e) return;
    this.hitMul = 1;
    this.damage(e, d, '#7dd3fc');
  }

  // Кооператив: награда за убийство, которую получил напарник
  creditShared(n: number) {
    this.essence += n;
  }

  // Забрать накопленный урон по врагам напарника (для отправки)
  takeHits(): [number, number][] {
    const out = Object.entries(this.outHits).map(([k, v]) => [Number(k), Math.round(v * 10) / 10] as [number, number]);
    this.outHits = {};
    return out;
  }

  takeKills(): number {
    const k = Math.round(this.outKills);
    this.outKills = 0;
    return k;
  }

  // Кооператив: принудительный конец забега (общие жизни закончились)
  forceGameOver() {
    if (this.status === 'gameover') return;
    this.lives = 0;
    this.status = 'gameover';
    sfx.gameover();
    this.emit('gameover');
  }

  // Кооператив, поле напарника: время и движение врагов между снимками
  extrapolate(dt: number) {
    this.now += dt;
    for (const e of this.enemies) {
      const slowF = this.now < e.slowUntil ? e.slowFactor : 1;
      e.p += e.speed * slowF * dt;
    }
    // снаряды и шипы летят по последней скорости (между снимками)
    for (const p of this.projs) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    }
    for (const n of this.needles) {
      n.x += n.dx * 540 * dt;
      n.y += n.dy * 540 * dt;
      n.life -= dt;
    }
    for (const c of this.clouds) c.age += dt;
    this.projs = this.projs.filter((p) => p.life > 0);
    this.needles = this.needles.filter((n) => n.life > 0);
    this.clouds = this.clouds.filter((c) => c.age < c.life);
  }

  callWaveNow() {
    if (this.coop) return; // в кооперативе волну запускают оба игрока сами (готовность)
    if (this.status !== 'prep') return;
    this.essence += CONFIG.callBonus;
    this.textP(STAGE_W / 2, 120, `${CONFIG.callBonus} эссенции`, '#7dd3fc');
    this.startWave();
  }

  spawnInterval() {
    const base = this.wave % CONFIG.bossEvery === 0 ? 1.15 : CONFIG.spawnInterval;
    return Math.max(CONFIG.spawnIntervalMin, base - this.wave * 0.03);
  }

  // kind: 0 = обычный враг, 1 или 2 = босс (BOSS_DEFS), CHARGER_KIND = заряжающийся моб
  spawnEnemy(kind: number) {
    const w = this.wave;
    const charger = kind === CHARGER_KIND;
    const mini = kind === MINI_KIND;
    const boss = (kind === 1 || kind === 2) && !charger && !mini;
    // T выбирается при создании моба
    const chargeT = charger
      ? CONFIG.charger.chargeMin + Math.random() * (CONFIG.charger.chargeMax - CONFIG.charger.chargeMin)
      : 0;
    const def = boss ? BOSS_DEFS[kind as BossId] : null;
    const baseHp = CONFIG.enemyHp * Math.pow(CONFIG.enemyHpGrowth, w - 1);
    const baseSpeed = Math.min(CONFIG.enemySpeedCap, CONFIG.enemySpeed + (w - 1) * CONFIG.enemySpeedGrowth);
    const hp = boss
      ? Math.round(CONFIG.bossHp * def!.hpMult * Math.pow(CONFIG.bossHpGrowth, w / CONFIG.bossEvery - 1))
      : mini
        ? Math.round(baseHp * MINI_DEF.hpMult)
        : Math.round(baseHp);
    this.enemies.push({
      id: this.nextId++, p: 0, hp, maxHp: hp,
      speed: (boss
        ? CONFIG.bossSpeed * def!.speedMult
        : mini
          ? baseSpeed * MINI_DEF.speedMult
          : baseSpeed) * PATH_SPEED_SCALE,
      radius: boss ? def!.radius : mini ? MINI_DEF.radius : 14,
      slowUntil: 0, slowFactor: 1, stunUntil: 0, dots: [], marks: [],
      reward: boss ? def!.reward : mini ? MINI_DEF.reward : CONFIG.enemyReward,
      leakDmg: boss ? CONFIG.bossLeak : mini ? MINI_DEF.leakDmg : 1,
      boss, mini, bossId: boss ? kind : 0, flashUntil: 0, dead: false,
      chargeT, bornAt: this.now,
    });
    if (boss) this.emit('boss');
  }

  // ============ ДЕЙСТВИЯ ИГРОКА ============
  // Поместить новый шарик в пустую клетку. Бесплатно:
  // автоматически (nextAutoFill) или по тапу игрока в пустую клетку.
  placeOrbAt(cell: number, auto = false) {
    if (this.grid[cell]) return;
    const type = this.randomOrbType();
    this.grid[cell] = {
      id: this.nextId++,
      type,
      level: 1,
      cdUntil: 0,
      cdLen: CONFIG.cooldown,
      bornAt: this.now,
      pulse: this.now,
    };
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
  // Улучшение типа по клику на колоду: эссенция, шарик с поля не тратится.
  // Уровень растёт у всех шариков этого типа (их сила берётся из typeLevels).
  upgradeType(t: OrbType) {
    if (!this.deck.includes(t)) return;
    if (this.essence < CONFIG.upgradeCost) {
      this.err(`Не хватает эссенции, нужно ${CONFIG.upgradeCost}`);
      return;
    }
    this.essence -= CONFIG.upgradeCost;
    this.typeLevels[t] += 1;
    const lvl = this.typeLevels[t];
    this.setBanner(`${TYPE_INFO[t].name}: уровень ${lvl}`, 1.4);
    for (const cell of this.grid) {
      if (cell && cell.type === t) cell.pulse = this.now;
    }
    sfx.upgrade();
    this.emit('upgrade');
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
    this.setAutoLine([a, b]);
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
      this.arm(A);
    }
    if (B.type !== 'spiky') {
      this.fireOrb(b, 2, 2);
      this.arm(B);
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
    this.setAutoLine(cells);
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
      this.arm(o);
      fired++;
    }
    this.sel = null;
    if (ready.length > 2) this.setBanner(`Цепь: ${ready.length} шариков, +${bonus} к урону`, 1.4);
  }

  // ---------- Авто-линия ----------
  // Моды авто-линии суммируются по колоде (узлы дерева любых шариков в колоде):
  //  autoGap   — сколько шариков линии может пропасть, не сломав её
  //  autoPct   — % урона авто-залпов
  //  autoShots — снарядов в каждом авто-залпе (+N к двум базовым)
  //  autoCd    — секунды, на которые авто-залп сокращает перезарядку
  autoMod(k: 'autoGap' | 'autoPct' | 'autoShots' | 'autoCd'): number {
    let sum = 0;
    for (const t of this.deck) sum += this.m(t, k);
    return sum;
  }

  // Запоминаем линию по id шариков. Шипастый в авто-линии не входит:
  // он лопается при выстреле, а не стреляет.
  setAutoLine(cells: number[]) {
    const ids: number[] = [];
    for (const i of cells) {
      const o = this.grid[i];
      if (o && o.type !== 'spiky') ids.push(o.id);
    }
    if (ids.length < 2) return;
    // авто-линия только из шариков с купленной «Автоатакой»
    const lacks = cells.some((i) => {
      const o = this.grid[i];
      return o && o.type !== 'spiky' && !this.autoTypes.includes(o.type);
    });
    if (lacks) {
      this.setBanner('Авто-атака этого шарика не куплена: откройте 10 узлов дерева и купите её', 2.2);
      return;
    }
    this.autoLine = ids;
    this.setBanner(`Авто-линия: ${ids.length} шариков стреляют сами, как перезарядятся`, 2.2);
  }

  stopAutoLine() {
    if (!this.autoLine) return;
    this.autoLine = null;
    this.setBanner('Авто-линия остановлена', 1.6);
  }

  // Перезарядка авто-залпа: как обычный залп, но короче на autoCd.
  armAuto(o: OrbState) {
    const len = Math.max(0.5, CONFIG.cooldown + this.m(o.type, 'cd') - this.autoMod('autoCd'));
    o.cdLen = len;
    o.cdUntil = this.now + len;
  }

  // Каждый кадр: готовые шарики линии стреляют залпом (только в режиме совмещения).
  runAutoLine() {
    if (!this.autoLine || this.mode !== 'combine' || this.status === 'gameover') return;
    const cells: number[] = [];
    let missing = 0;
    for (const id of this.autoLine) {
      const i = this.grid.findIndex((o) => o?.id === id);
      if (i < 0) missing++;
      else cells.push(i);
    }
    if (missing > this.autoMod('autoGap') || cells.length < 2) {
      this.autoLine = null;
      this.setBanner('Авто-линия прервана: шарик убран или слит', 2);
      return;
    }
    const ready = cells.filter((i) => {
      const o = this.grid[i];
      return o && o.type !== 'spiky' && this.now >= o.cdUntil;
    });
    if (!ready.length) return;
    const bonus = ready.length;
    const shots = 2 + this.autoMod('autoShots');
    const mul = 1 + this.autoMod('autoPct') / 100;
    for (const i of ready) {
      const o = this.grid[i];
      if (!o) continue;
      this.fireOrb(i, shots, bonus, mul);
      this.armAuto(o);
    }
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
      let maxLvl = 0;
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
          maxLvl = Math.max(maxLvl, o.level);
        }
      }
    if (k > 0) {
      const pct = Math.round((accumMul(maxLvl) - 1) * 100);
      this.setBanner(`Детонация: разрушено ${k}, урон залпов +${pct}%`, 2);
      this.detonateFlashUntil = this.now + 0.35;
      sfx.detonate();
      this.emit('detonate');
    } else {
      this.setBanner('Нет заряженных шариков (нужен уровень 2 и выше)', 2);
    }
  }
  }

  // ============ СТРЕЛЬБА ============
  fireOrb(cell: number, count: number, bonus = 0, dmgMul = 1) {
    const o = this.grid[cell];
    if (!o) return;
    const c = cellC(cell);
    let finalCount = this.shotCount(o.type, count);
    // Усилитель рядом: соседние шарики выпускают больше снарядов (×2 и дерево)
    if (this.isAmplified(cell)) {
      finalCount = Math.round(finalCount * this.ampFactor());
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
    this.fireOrbAt(c.x, c.y, o.type, finalCount, bonus + this.m(o.type, 'combo'), dmgMul);
    sfx.shoot(o.type);
    o.pulse = this.now;
  }

  // Сила эффектов берётся из уровня типа (this.typeLevels).
  // bonus — комбо-бонус: каждый шарик в цепи добавляет +1 к урону снарядов.
  fireOrbAt(x: number, y: number, type: OrbType, count: number, bonus = 0, dmgMul = 1) {
    const g = this.typeLevels[type] - 1;
    if (type === 'gas') {
      // газ не летит: каждый выстрел — облако у самого продвинутого врага (чуть в стороне)
      for (let k = 0; k < count; k++) {
        const target = this.pickTarget();
        if (!target) break;
        const tp = this.at(target);
        const jit = k === 0 ? 0 : 26;
        this.spawnCloud(
          tp.x + (Math.random() - 0.5) * jit * 2,
          tp.y + (Math.random() - 0.5) * jit * 2,
          bonus,
          dmgMul,
          g,
        );
      }
      return;
    }
    for (let k = 0; k < count; k++) {
      // метка стреляет в случайного врага, остальные шарики — в ближних по трассе
      const target = type === 'mark' ? this.randomTarget() : this.pickTarget();
      if (type === 'pierce') {
        // пробой: прямой выстрел в сторону цели, без самонаведения
        let dx = Math.random() - 0.5;
        let dy = -1;
        if (target) {
          const tp = this.at(target);
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
          straight: true, pierceLeft: 2 + g + this.m(type, 'pierce'), hitIds: [], dmgMul,
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
        bonus, dmgMul,
      });
    }
  }

  // Облако газа в точке (x, y) моего поля
  spawnCloud(x: number, y: number, bonus: number, dmgMul: number, g: number) {
    this.clouds.push({
      id: this.nextId++,
      x,
      y,
      age: 0,
      life: CONFIG.gas.duration + 0.4 * g + this.m('gas', 'dur'),
      rMax: CONFIG.gas.radius + 15 * g + this.m('gas', 'radius'),
      nextTick: CONFIG.gas.tick,
      dmg: 1 + g + bonus,
      slowF: Math.max(0.2, CONFIG.gas.slow + this.m('gas', 'slow')),
      dmgMul,
      seed: Math.random() * 10,
    });
    this.spark(x, y, TYPE_INFO.gas.color, 6, 60);
  }

  // Облака: разрастаются, замедляют врагов внутри, раз в тик жгут их.
  // Враги напарника тоже попадают в облако (урон уходит владельцу через outHits).
  private updateClouds(dt: number) {
    if (!this.clouds.length) return;
    for (const c of this.clouds) {
      c.age += dt;
      const r = gasRadius(c);
      const tick = c.age >= c.nextTick;
      if (tick) c.nextTick += CONFIG.gas.tick;
      for (const e of this.allEnemies()) {
        if (e.dead) continue;
        const q = this.at(e);
        const dx = q.x - c.x, dy = q.y - c.y;
        const rr = r + e.radius;
        if (dx * dx + dy * dy >= rr * rr) continue;
        // замедление: пока враг внутри, оно продлевается каждый кадр
        const stillSlow = this.now < e.slowUntil;
        e.slowFactor = stillSlow ? Math.min(e.slowFactor, c.slowF) : c.slowF;
        e.slowUntil = Math.max(e.slowUntil, this.now + 0.15);
        if (tick) {
          this.hitMul = c.dmgMul;
          this.damage(e, this.hitDmg(c.dmg, 'gas'), '#d9f99d', false);
          this.hitMul = 1;
        }
      }
    }
    this.clouds = this.clouds.filter((c) => c.age < c.life);
  }

  // Цель: один из самых продвинутых к выходу врагов
  pickTarget(): EnemyState | null {
    const all = this.allEnemies();
    if (!all.length) return null;
    const sorted = [...all].sort((a, b) => b.p - a.p);
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
    // накопление: заряженный шипастый выпускает иглы с усилением своего заряда
    const mul = accumMul(o.level);
    this.essence += this.m('spiky', 'ess');
    this.ring(c.x, c.y, '#b16cff', 110);
    this.spark(c.x, c.y, '#b16cff', 14, 190);
    sfx.pop();
    // Уровень шипастого в колоде добавляет иглы. Четыре главных
    // направления (вверх/вниз/влево/вправо) всегда на месте — соседние
    // шарики достаются гарантированно; остальные разбросаны между ними.
    const n = 4 + (this.typeLevels.spiky - 1) + this.m('spiky', 'needles');
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
        dx, dy, ang: a, life: 1.6, depth, dmgMul: mul,
      });
    }
  }

  damage(e: EnemyState, d0: number, color = '#ffffff', show = true) {
    if (e.dead) return;
    const d = d0 * this.hitMul;
    if (e.foreign) {
      // враг напарника: урон уходит ему и применяется у него; здесь только цифра
      const key = String(e.id - FOREIGN_BASE);
      this.outHits[key] = (this.outHits[key] ?? 0) + d;
      e.flashUntil = this.now + 0.08;
      if (show) {
        const pos = this.at(e);
        this.textP(pos.x, pos.y - 18, String(Math.round(d)), color);
      }
      return;
    }
    e.hp -= d;
    e.flashUntil = this.now + 0.08;
    if (show) {
      const pos = this.at(e);
      this.textP(pos.x, pos.y - 18, String(Math.round(d)), color);
    }
  }

  // Попадание снаряда. Множитель залпа накопления (dmgMul) действует на весь
  // урон этого снаряда: и основной удар, и осколки, цепи, взрывы.
  impact(p: ProjState, e: EnemyState) {
    this.hitMul = p.dmgMul ?? 1;
    try {
      this.impactInner(p, e);
    } finally {
      this.hitMul = 1;
    }
  }

  private impactInner(p: ProjState, e: EnemyState) {
    // Сила эффекта — от уровня типа в колоде (1 = базовый, g = 0)
    const g = this.typeLevels[p.kind] - 1;
    const K = p.kind;
    // бонус комбо: каждый шарик в цепи добавил +1 к урону снаряда
    const b = p.bonus || 0;
    const pos = this.at(e);
    switch (p.kind) {
      case 'fire': {
        // улучшение: основной урон растёт (3 + уровень) + бонус цепи
        this.damage(e, this.hitDmg(3 + g + b, K), '#ff9a3d');
        this.ring(pos.x, pos.y, '#ff6a3d', 70);
        // осколки по соседним врагам
        for (const o of this.allEnemies()) {
          if (o === e || o.dead) continue;
          const q = this.at(o);
          const dx = q.x - pos.x, dy = q.y - pos.y;
          const sr = 58 + this.m(K, 'radius');
          if (dx * dx + dy * dy < sr * sr) this.damage(o, 1 + this.m(K, 'splash'), '#ff6a3d', false);
        }
        break;
      }
      case 'ice': {
        // улучшение: замедление сильнее и дольше
        this.damage(e, this.hitDmg(1 + b, K), '#9be2ff');
        e.slowUntil = this.now + 2.3 + 0.4 * g + this.m(K, 'dur');
        e.slowFactor = Math.max(0.15, 0.55 - 0.05 * g + this.m(K, 'slow'));
        this.ring(pos.x, pos.y, '#46c8ff', 44);
        break;
      }
      case 'bolt': {
        // улучшение: цепь бьёт (1 + уровень) врагов, радиус 150 + 30 за уровень
        const chainN = 1 + g + this.m(K, 'chain');
        const radius = 150 + 30 * g + this.m(K, 'radius');
        const chainDmg = this.hitDmg(2 + g + b, K);
        this.damage(e, chainDmg, '#ffe066');
        const cands = this.allEnemies()
          .filter((o) => o !== e && !o.dead)
          .map((o) => {
            const q = this.at(o);
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
        this.damage(e, this.hitDmg(1 + b, K), '#86efac');
        const dps = 1.2 + 0.6 * g + this.m(K, 'dps');
        const until = this.now + 4 + 0.5 * g + this.m(K, 'dur');
        if (e.dots.length < 4 + this.m(K, 'stacks')) e.dots.push({ until, dps });
        else {
          e.dots.sort((x, y) => x.until - y.until);
          e.dots[0].until = until;
        }
        this.ring(pos.x, pos.y, '#4ade80', 40);
        break;
      }
      case 'nova': {
        // взрыв: урон всем врагам в радиусе (улучшение: радиус и урон выше)
        const radius = 95 + 20 * g + this.m(K, 'radius');
        const dmg = this.hitDmg(4 + g + b, K);
        this.damage(e, dmg, '#ff8fa3');
        for (const o of this.allEnemies()) {
          if (o === e || o.dead) continue;
          const q = this.at(o);
          const dx = q.x - pos.x, dy = q.y - pos.y;
          if (dx * dx + dy * dy < radius * radius) this.damage(o, dmg, '#ff8fa3', false);
        }
        this.ring(pos.x, pos.y, '#ff4d6d', radius);
        this.spark(pos.x, pos.y, '#ff8fa3', 12, 170);
        break;
      }
      case 'stun': {
        // паралич: цель замирает (улучшение: дольше)
        this.damage(e, this.hitDmg(1 + b, K), '#ffd27a');
        e.stunUntil = this.now + 1.2 + 0.4 * g + this.m(K, 'dur');
        this.ring(pos.x, pos.y, '#f59e0b', 42);
        this.spark(pos.x, pos.y, '#ffd27a', 6, 80);
        break;
      }
      case 'pierce': {
        // пробой: урон каждому врагу на линии (улучшение: урон выше, пробивает больше)
        this.damage(e, this.hitDmg(2 + g, K), '#b3beff');
        break;
      }
      case 'vampire': {
        // вампир: урон + эссенция (с дросселем, не чаще раза в 0.35 с)
        this.damage(e, this.hitDmg(1 + g + b, K), '#ff9cc7');
        // дерево: эссенция за каждое попадание (без дросселя)
        this.essence += this.m(K, 'ess');
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
        this.damage(e, this.hitDmg(1 + b, K), '#8ff5e4');
        break;
      }
      case 'mark': {
        // метка: удар и метка на враге (урон во времени; урон меток идёт в опыт шарика)
        this.damage(e, this.hitDmg(1 + g + b, K), '#f0abfc');
        const cap = 2 + this.m(K, 'stacks');
        const dps = 1 + 0.5 * g + this.m(K, 'dps');
        const until = this.now + 3.5 + 0.5 * g + this.m(K, 'dur');
        if (e.marks.length < cap) e.marks.push({ until, dps });
        else {
          // все слоты заняты — обновляем метку, которая кончится раньше
          e.marks.sort((x, y) => x.until - y.until);
          e.marks[0] = { until, dps };
        }
        this.ring(pos.x, pos.y, '#e879f9', 40);
        break;
      }
      case 'amp': {
        // эхо-снаряд усилителя: слабый урон (растёт с уровнем типа)
        this.damage(e, this.hitDmg(1 + g + b, K), '#d7dee8');
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
    if (!this.coop && this.status === 'prep' && this.now >= this.prepUntil) this.startWave();

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

    // --- враги напарника (копии): ведём их по последнему снимку ---
    if (this.foreign.length) {
      for (const f of this.foreign) f.p += f.speed * dt;
      this.foreign = this.foreign.filter((f) => f.p < LEAK_AT + 40);
    }

    // --- враги ---
    this.puddles = this.puddles.filter((pd) => pd.until > this.now);
    this.updateClouds(dt);
    const leakedNow: EnemyState[] = [];
    for (const e of this.enemies) {
      if (e.marks.length) {
        // метки жгут врага; истёкшие снимаются до тика, живые каждый тик высасывают эссенцию
        e.marks = e.marks.filter((mk) => mk.until > this.now);
        for (const mk of e.marks) {
          const d = mk.dps * dt;
          e.hp -= d;
          this.drainFromMark(d);
        }
      }
      if (e.dots.length) {
        for (const d of e.dots) e.hp -= d.dps * dt;
        e.dots = e.dots.filter((d) => d.until > this.now);
        if (Math.random() < dt * 6) {
          const pos = this.at(e);
          this.spark(pos.x, pos.y, '#4ade80', 1, 40);
        }
      }
      const stunned = this.now < e.stunUntil; // паралич: враг замирает
      const slowF = this.now < e.slowUntil ? e.slowFactor : 1;
      e.p += (stunned ? 0 : e.speed) * slowF * this.puddleFactor(e) * dt;
      if (e.hp <= 0) e.dead = true;
      else if (e.p >= LEAK_AT) leakedNow.push(e);
    }

    // утечки: враг дошёл до выхода
    for (const e of leakedNow) {
      e.dead = true;
      this.lives -= e.leakDmg;
      this.leakDamage += e.leakDmg;
      this.leaked++;
      const pos = this.pt(LEAK_AT);
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
      // полностью заряженный заряжающийся моб оставляет лужу; раньше — нет
      if (e.chargeT > 0 && this.chargeLevel(e) >= 1) this.spawnPuddle(e.p);
      this.essence += e.reward;
      if (this.coop) this.outKills += e.reward; // напарник получает ту же награду
      this.kills++;
      const pos = this.at(e);
      this.spark(pos.x, pos.y, e.boss ? '#c084fc' : e.mini ? '#f59e0b' : '#fbbf24', e.boss ? 18 : e.mini ? 13 : 9, e.boss ? 200 : 130);
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
        this.pendingBossId = this.coop ? bossForWave(this.wave) : BOSS_IDS[Math.floor(Math.random() * BOSS_IDS.length)];
        this.prepUntil = this.now + CONFIG.bossPrepTime;
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
        for (const e of this.allEnemies()) {
          if (e.dead || p.hitIds!.includes(e.id)) continue;
          const tp = this.at(e);
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
        // в кооперативе снаряд может уйти в поле напарника (сверху)
        const lo = this.coop ? -STAGE_H - 30 : -30;
        const hi = this.coop ? 2 * STAGE_H + 30 : STAGE_H + 30;
        if (p.x < -30 || p.x > STAGE_W + 30 || p.y < lo || p.y > hi) p.life = 0;
        continue;
      }
      let t = this.allEnemies().find((e) => e.id === p.targetId) ?? null;
      if (!t) t = p.kind === 'mark' ? this.randomTarget() : this.pickTarget();
      if (t) {
        p.targetId = t.id;
        const tp = this.at(t);
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
      for (const e of this.allEnemies()) {
        if (e.dead) continue;
        const ep = this.at(e);
        const dx = ep.x - n.x;
        const dy = ep.y - n.y;
        const rr = e.radius + 9;
        if (dx * dx + dy * dy < rr * rr) {
          this.hitMul = n.dmgMul;
          this.damage(e, this.hitDmg(1 + (this.typeLevels.spiky - 1), 'spiky'), '#e9d5ff');
          this.hitMul = 1;
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
      (n) =>
        n.life > 0 &&
        n.x > 20 &&
        n.x < STAGE_W - 20 &&
        n.y > (this.coop ? -STAGE_H : 20) &&
        n.y < (this.coop ? 2 * STAGE_H : STAGE_H) - 20
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
          let count = this.shotCount(o.type, q.count);
          if (amplified) {
            count = Math.round(count * this.ampFactor());
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
          // накопление: залп заряженного шарика усиливает урон всех своих снарядов
          this.fireOrbAt(c.x, c.y, o.type, count, 0, accumMul(o.level));
          sfx.popSmall();
        }
      }
    }

    // --- авто-линия: стреляет сама, когда шарики перезарядились ---
    this.runAutoLine();

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
