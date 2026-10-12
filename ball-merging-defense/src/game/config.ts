// ============================================================
// КОНФИГ ИГРЫ "ОРБИТАЛЬ" — прототип
// Здесь собраны ВСЕ настройки: геометрия поля, цвета, баланс.
// Если что-то в игре кажется слишком лёгким/сложным — меняй цифры
// в CONFIG в конце файла, остальной код трогать не нужно.
// ============================================================

export type OrbType =
  | 'fire'
  | 'ice'
  | 'bolt'
  | 'poison'
  | 'spiky'
  | 'amp'
  | 'nova'
  | 'stun'
  | 'pierce'
  | 'vampire'
  | 'barrage'
  | 'mark';

// ---------- Размеры игрового поля (логические пиксели) ----------
// Портретная ориентация: поле рассчитано под вертикальный экран телефона.
// На десктопе оно просто масштабируется и центрируется.
export const STAGE_W = 640;
export const STAGE_H = 620;

// ---------- Сетка шариков ----------
export const COLS = 7;
export const ROWS = 5;
export const CELL = 64;
export const GAP = 10;
export const GRID_X = Math.round((STAGE_W - (COLS * CELL + (COLS - 1) * GAP)) / 2);
export const GRID_Y = 150;

// Клетка -> строка/колонка
export function cellRC(i: number) {
  return { r: Math.floor(i / COLS), c: i % COLS };
}
// Клетка -> левый верхний угол (px)
export function cellXY(i: number) {
  const { r, c } = cellRC(i);
  return { x: GRID_X + c * (CELL + GAP), y: GRID_Y + r * (CELL + GAP) };
}
// Клетка -> центр (px)
export function cellC(i: number) {
  const p = cellXY(i);
  return { x: p.x + CELL / 2, y: p.y + CELL / 2 };
}
// Соседние ли клетки (по стороне, не по диагонали)
export function isAdj(a: number, b: number) {
  const A = cellRC(a);
  const B = cellRC(b);
  return (A.r === B.r && Math.abs(A.c - B.c) === 1) || (A.c === B.c && Math.abs(A.r - B.r) === 1);
}

// ---------- Трасса врагов: ломаная линия по полю ----------
// Спавн — левый нижний угол поля, путь идёт вдоль низа и правой стороны,
// затем вдоль верха к центру и выходит в середине верхнего края.
// В кооперативе у каждого игрока выход стоит на стыке полей: поле напарника
// повёрнуто на 180°, и оба пути сходятся в одну общую точку в центре экрана.
export const TRACK_PTS = [
  { x: 26, y: 550 }, // спавн
  { x: 614, y: 550 },
  { x: 614, y: 110 },
  { x: 320, y: 110 },
  { x: 320, y: 0 }, // выход (середина верхнего края поля)
];
const SEG_LEN = TRACK_PTS.slice(1).map((p, i) => Math.hypot(p.x - TRACK_PTS[i].x, p.y - TRACK_PTS[i].y));
// Длина пути от спавна до выхода
export const PERIMETER = SEG_LEN.reduce((a, b) => a + b, 0);
// Враг «утёк», когда дошёл до выхода
export const LEAK_AT = PERIMETER;
// Прежний путь (кольцо) до выхода — 1847 px. Скорости врагов умножаются на этот коэффициент,
// чтобы новый путь проходился за то же время, что и прежний.
export const PATH_SPEED_SCALE = 1847.3 / PERIMETER;

// Точка на трассе по пройденной дистанции p (+ касательная tx,ty куда он идёт).
// За пределами пути значение зажимается: до спавна — спавн, после — выход.
export function pathPoint(p: number) {
  const d = Math.min(PERIMETER, Math.max(0, p));
  let rest = d;
  for (let i = 0; i < SEG_LEN.length; i++) {
    const a = TRACK_PTS[i];
    const b = TRACK_PTS[i + 1];
    const L = SEG_LEN[i];
    if (rest <= L || i === SEG_LEN.length - 1) {
      const t = L > 0 ? Math.min(1, rest / L) : 0;
      return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        tx: (b.x - a.x) / L,
        ty: (b.y - a.y) / L,
      };
    }
    rest -= L;
  }
  const last = TRACK_PTS[TRACK_PTS.length - 1];
  return { x: last.x, y: last.y, tx: 0, ty: -1 };
}

// ---------- Описание типов шариков (всего 11) ----------
// Шесть базовых типов открыты с начала, остальные пять открываются сундуками (ежедневным и после забега).
export const TYPE_INFO: Record<
  OrbType,
  { name: string; color: string; dark: string; glow: string; desc: string }
> = {
  fire: {
    name: 'Огонь',
    color: '#ff6a3d',
    dark: '#7a1f0d',
    glow: 'rgba(255,106,61,',
    desc: '3 ед. урона цели, 1 ед. урона соседним врагам',
  },
  ice: {
    name: 'Лёд',
    color: '#46c8ff',
    dark: '#0c3a55',
    glow: 'rgba(70,200,255,',
    desc: '1 ед. урона, замедление цели на 45% в течение 2.3 с',
  },
  bolt: {
    name: 'Молния',
    color: '#ffd23f',
    dark: '#6b4d00',
    glow: 'rgba(255,210,63,',
    desc: '2 ед. урона, разряд по ближайшему врагу',
  },
  poison: {
    name: 'Яд',
    color: '#4ade80',
    dark: '#14532d',
    glow: 'rgba(74,222,128,',
    desc: '1 ед. урона, яд: 1.2 ед. в секунду в течение 4 с',
  },
  spiky: {
    name: 'Шипастый',
    color: '#b16cff',
    dark: '#3b1670',
    glow: 'rgba(177,108,255,',
    desc: 'при соединении (с любым шариком) лопает: иглы разрушают шарики и ранят врагов',
  },
  amp: {
    name: 'Усилитель',
    color: '#d7dee8',
    dark: '#3d4757',
    glow: 'rgba(215,222,232,',
    desc: 'усиливает 4 соседних шарика: они выпускают в два раза больше снарядов',
  },
  nova: {
    name: 'Сверхновая',
    color: '#ff4d6d',
    dark: '#5e0d1e',
    glow: 'rgba(255,77,109,',
    desc: 'взрыв: 4 ед. урона всем врагам в радиусе 95 пикселей',
  },
  stun: {
    name: 'Паралич',
    color: '#f59e0b',
    dark: '#5e3a03',
    glow: 'rgba(245,158,11,',
    desc: '1 ед. урона, цель замирает на 1.2 с',
  },
  pierce: {
    name: 'Пробой',
    color: '#8b9dff',
    dark: '#1e2a6e',
    glow: 'rgba(139,157,255,',
    desc: 'снаряд летит прямо и пробивает до 2 врагов на линии',
  },
  vampire: {
    name: 'Вампир',
    color: '#ff5da2',
    dark: '#5e0d33',
    glow: 'rgba(255,93,162,',
    desc: '1 ед. урона и 1 эссенция за попадание (не чаще раза в 0.35 с)',
  },
  mark: {
    name: 'Метка',
    color: '#e879f9',
    dark: '#5b1466',
    glow: 'rgba(232,121,249,',
    desc: 'ставит метки на случайных врагов: метка жжёт врага и высасывает из него эссенцию',
  },
  barrage: {
    name: 'Шквал',
    color: '#2dd4bf',
    dark: '#0a4a42',
    glow: 'rgba(45,212,191,',
    desc: 'залп из пяти снарядов, каждый наносит 1 ед. урона',
  },
};

export const ALL_TYPES: OrbType[] = [
  'fire', 'ice', 'bolt', 'poison', 'spiky', 'amp', 'nova', 'stun', 'pierce', 'vampire', 'barrage', 'mark',
];
// Базовая колода обычного режима
export const CLASSIC_TYPES: OrbType[] = ['fire', 'ice', 'bolt', 'poison', 'spiky', 'amp'];

// ---------- Боссы (двое, рулетка выбирает одного перед босс-волной) ----------
export type BossId = 1 | 2;
export interface BossDef {
  id: BossId;
  name: string;
  color: string;
  dark: string;
  glow: string;
  hpMult: number; // множитель здоровья относительно CONFIG.bossHp
  speedMult: number; // множитель скорости относительно CONFIG.bossSpeed
  radius: number;
  reward: number;
  desc: string; // короткое техническое описание для рулетки
}
export const BOSS_DEFS: Record<BossId, BossDef> = {
  1: {
    id: 1,
    name: 'Громила',
    color: '#ff5d5d',
    dark: '#4d0d0d',
    glow: 'rgba(255,93,93,',
    hpMult: 3.0,
    speedMult: 0.62,
    radius: 32,
    reward: 25,
    desc: 'высокое здоровье, низкая скорость: готовь урон и накопление',
  },
  2: {
    id: 2,
    name: 'Стриж',
    color: '#5dd9ff',
    dark: '#0d3a55',
    glow: 'rgba(93,217,255,',
    hpMult: 1.4,
    speedMult: 1.75,
    radius: 26,
    reward: 18,
    desc: 'стандартное здоровье, высокая скорость: готовь замедление и паралич',
  },
};
export const BOSS_IDS: BossId[] = [1, 2];
// Босс волны в кооперативе: одинаковый у обоих игроков (без рулетки и случайности)
export function bossForWave(wave: number): BossId {
  const k = Math.max(0, Math.floor(wave / 5) - 1); // 5 — CONFIG.bossEvery
  return BOSS_IDS[k % BOSS_IDS.length];
}
// Код в плане спавна для заряжающегося моба (0 — обычный, 1/2 — боссы)
export const CHARGER_KIND = 3;

// ---------- Минибосс: сильнее обычного врага, слабее большого босса; не босс для правил ----------
export const MINI_KIND = 4; // код в плане спавна
export const MINI_DEF = {
  name: 'Таран',
  color: '#f59e0b',
  dark: '#4a2a05',
  glow: 'rgba(245,158,11,',
  radius: 21,
  hpMult: 6, // здоровье относительно обычного врага этой волны
  speedMult: 0.75, // скорость относительно обычного врага
  reward: 8,
  leakDmg: 2, // жизней за утечку
};

// ---------- БАЛАНС (все цифры геймдизайна тут) ----------
export const CONFIG = {
  lives: 20, // жизни на старте
  essenceStart: 30, // стартовая эссенция (расходуется на улучшения)
  sellBase: 5, // возврат за продажу (+3 за каждый уровень заряда)

  autoFillInterval: 2.0, // период автоматического заполнения пустых клеток (сек)
  upgradeCost: 100, // стоимость одного улучшения типа (зажим шарика на поле)

  deckSize: 6, // шариков в колоде забега (колода собирается в инвентаре)
  bossPrepTime: 8, // подготовка перед босс-волной (рулетка + время на подготовку)

  cooldown: 1.3, // перезарядка шарика после выстрела (сек)

  enemyHp: 7, // здоровье обычного врага на 1-й волне
  enemyHpGrowth: 1.14, // во сколько раз растёт здоровье каждую волну (милее к концу игры)
  enemySpeed: 53, // скорость врага (px/сек) на 1-й волне (подогнано под короткую трассу: круг занимает как раньше)
  enemySpeedGrowth: 1.2, // прирост скорости за волну
  enemySpeedCap: 78, // максимум скорости
  enemyReward: 2, // эссенция за обычного врага

  waveCountBase: 5, // врагов на волне N = base + N * per
  waveCountPer: 2,
  spawnInterval: 0.95, // пауза между появлением врагов (сек)
  spawnIntervalMin: 0.4,

  prepTime: 6, // пауза между волнами (сек)
  firstPrep: 9, // пауза перед самой первой волной
  callBonus: 5, // бонус эссенции за досрочный вызов волны
  clearBonusBase: 8, // награда за зачистку волны = base + номер волны

  bossEvery: 5, // каждая N-я волна — босс
  bossHp: 45, // здоровье босса (первая босс-волна)
  bossHpGrowth: 1.35, // рост здоровья босса
  bossSpeed: 39,
  bossReward: 20,
  bossLeak: 5, // сколько жизней забирает босс, если ушёл
  miniFromWave: 3, // с какой волны появляется минибосс
  miniChance: 0.5, // шанс минибосса на обычной волне (не более одного)

  maxLevel: 9, // максимум накопления в одном шарике
  // накопление: каждый уровень заряда добавляет к урону залпа этот процент
  // (заряд 9 → +18%). Множитель действует на все снаряды залпа.
  accumDmgPerLevel: 0.02,
  // метка высасывает эссенцию из мобов: за каждую единицу урона метки (без опыта и разгона)
  markDrain: 0.5,

  // Заряжающийся моб: появляется в начале трассы, T секунд до полной зарядки выбирается
  // при создании. Серый → сиреневый. Убит полностью заряженным — на трассе остаётся лужа
  // эликсира: мобы в ней идут быстрее. Убит раньше — лужи нет.
  charger: {
    chance: 0.2, // доля заряжающихся среди обычных мобов волны
    fromWave: 2, // с какой волны появляются
    chargeMin: 3, // T: минимум секунд до полной зарядки
    chargeMax: 8, // T: максимум секунд до полной зарядки
    puddleRadius: 70, // радиус лужи вдоль трассы, px (в обе стороны от точки смерти)
    puddleDuration: 8, // сколько секунд лужа держится на трассе
    puddleSpeed: 1.6, // скорость мобов внутри лужи (×; 1.6 = +60%)
    puddleBoss: false, // действует ли лужа на боссов
  },
};

// Множитель урона залпа заряженного шарика (только для заряда 2 и выше)
export function accumMul(level: number): number {
  return level >= 2 ? 1 + level * CONFIG.accumDmgPerLevel : 1;
}

// ---------- Характеристики типов по уровням ----------
// Улучшение теперь по типам: зажатый на поле шарик исчезает, а уровень
// ЕГО ТИПА растёт (стоит фиксированные CONFIG.upgradeCost эссенции).
// lvl = 1 — базовый уровень. Одни и те же формулы использует движок
// (сила эффектов) и панель колоды (показ статов «сейчас» и «будет»).
export function typeStatValue(t: OrbType, stat: string, lvl: number): number {
  const g = Math.max(0, lvl - 1);
  switch (t) {
    case 'fire':
      return stat === 'dmg' ? 3 + g : 1; // основной урон / урон соседям
    case 'ice':
      // slow = множитель скорости врага (0.55 = враг идёт на 55%)
      return stat === 'slow' ? Math.max(0.15, 0.55 - 0.05 * g) : stat === 'dur' ? 2.3 + 0.4 * g : 1;
    case 'bolt':
      return stat === 'dmg' ? 2 + g : stat === 'chain' ? 1 + g : 150 + 30 * g;
    case 'poison':
      return stat === 'dps' ? 1.2 + 0.6 * g : stat === 'dur' ? 4 + 0.5 * g : 1;
    case 'spiky':
      return 4 + g; // иглы
    case 'amp':
      return stat === 'dmg' ? 1 + g : 2; // урон собственного эхо-снаряда / множитель залпа соседа
    case 'nova':
      return stat === 'dmg' ? 4 + g : 95 + 20 * g;
    case 'stun':
      return 1.2 + 0.4 * g; // длительность паралича, с
    case 'pierce':
      return stat === 'dmg' ? 2 + g : 2 + g; // урон / сколько врагов пробивает
    case 'vampire':
      return stat === 'dmg' ? 1 + g : 1; // урон / эссенция за попадание
    case 'barrage':
      return 5 + g; // снарядов в залпе
    case 'mark':
      // dmg — урон попадания; dps — урон метки в секунду; dur — длительность метки;
      // cap — меток на одном враге (без дерева)
      if (stat === 'dmg') return 1 + g;
      if (stat === 'dps') return 1 + 0.5 * g;
      if (stat === 'dur') return 3.5 + 0.5 * g;
      if (stat === 'cap') return 2;
      return 1;
    default:
      return 1;
  }
}

function fmtStat(v: number): string {
  const r = Math.round(v * 10) / 10;
  return Number.isInteger(r) ? `${r}` : r.toFixed(1).replace('.', ',');
}

// Строка характеристики для панели колоды: next пустой, если значение
// при следующем улучшении не изменится.
export interface StatRow {
  label: string;
  cur: string;
  next: string;
}

export function typeStatRows(t: OrbType, lvl: number): StatRow[] {
  const g = Math.max(0, lvl - 1);
  const v = (stat: string) => typeStatValue(t, stat, lvl);
  const n = (stat: string) => typeStatValue(t, stat, lvl + 1);
  const R = (label: string, cur: number, next: number, unit = ''): StatRow => ({
    label,
    cur: fmtStat(cur) + unit,
    next: Math.abs(next - cur) > 1e-9 ? fmtStat(next) + unit : '',
  });
  switch (t) {
    case 'fire':
      return [R('Урон', v('dmg'), n('dmg')), R('Урон соседним врагам', 1, 1)];
    case 'ice':
      return [
        R('Урон', 1, 1),
        R('Скорость врага', v('slow') * 100, n('slow') * 100, '%'),
        R('Длительность замедления', v('dur'), n('dur'), ' с'),
      ];
    case 'bolt':
      return [R('Урон', v('dmg'), n('dmg')), R('Целей в цепи', v('chain'), n('chain')), R('Радиус цепи', v('rad'), n('rad'))];
    case 'poison':
      return [R('Урон', 1, 1), R('Яд, урон во времени', v('dps'), n('dps')), R('Длительность яда', v('dur'), n('dur'), ' с')];
    case 'spiky':
      return [
        R('Игл при взрыве', v('x'), n('x')),
        R('Урон иглы врагам', 1 + g, 2 + g),
      ];
    case 'amp':
      return [
        R('Урон эхо-снаряда', v('dmg'), n('dmg')),
        { label: 'Снаряды соседнего шарика', cur: 'в два раза больше', next: '' },
      ];
    case 'nova':
      return [R('Урон', v('dmg'), n('dmg')), R('Радиус взрыва', v('rad'), n('rad'))];
    case 'stun':
      return [R('Урон', 1, 1), R('Длительность паралича', v('dur'), n('dur'), ' с')];
    case 'pierce':
      return [R('Урон', v('dmg'), n('dmg')), R('Пробивает врагов', v('p'), n('p'))];
    case 'vampire':
      return [R('Урон', v('dmg'), n('dmg')), R('Эссенция за попадание', 1, 1)];
    case 'barrage':
      return [R('Снарядов в залпе', v('x'), n('x')), R('Урон снаряда', 1, 1)];
    case 'mark':
      return [
        R('Урон попадания', v('dmg'), n('dmg')),
        R('Урон метки в секунду', v('dps'), n('dps')),
        R('Длительность метки', v('dur'), n('dur'), ' с'),
        R('Меток на одном враге', v('cap'), v('cap')),
      ];
    default:
      return [];
  }
}
