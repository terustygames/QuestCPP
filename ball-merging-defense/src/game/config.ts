// ============================================================
// КОНФИГ ИГРЫ "ОРБИТАЛЬ" — прототип
// Здесь собраны ВСЕ настройки: геометрия поля, цвета, баланс.
// Если что-то в игре кажется слишком лёгким/сложным — меняй цифры
// в CONFIG в конце файла, остальной код трогать не нужно.
// ============================================================

export type OrbType = 'fire' | 'ice' | 'bolt' | 'poison' | 'spiky';

// ---------- Размеры игрового поля (логические пиксели) ----------
// Портретная ориентация: поле рассчитано под вертикальный экран телефона.
// На десктопе оно просто масштабируется и центрируется.
export const STAGE_W = 640;
export const STAGE_H = 880;

// ---------- Сетка шариков ----------
export const COLS = 4;
export const ROWS = 6;
export const CELL = 80;
export const GAP = 12;
export const GRID_X = Math.round((STAGE_W - (COLS * CELL + (COLS - 1) * GAP)) / 2);
export const GRID_Y = 182;

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

// ---------- Трасса врагов: прямоугольное кольцо вокруг сетки ----------
export const TRACK = { x0: 36, y0: 140, x1: 604, y1: 772, r: 40 };

const R = TRACK.r;
const L_TOP = TRACK.x1 - R - (TRACK.x0 + R); // длина верхней/нижней прямой
const L_SIDE = TRACK.y1 - R - (TRACK.y0 + R); // длина боковой прямой
const L_ARC = (Math.PI / 2) * R; // длина одного закругления
export const PERIMETER = 2 * (L_TOP + L_SIDE) + 4 * L_ARC;
// Враг "утёк", когда прошёл почти полный круг.
// Смещаем точку выхода подальше от точки спавна, чтобы красная и
// зелёная метки не сливались в одном углу.
export const LEAK_AT = PERIMETER - 140;

// Точка на трассе по пройденной дистанции p (+ касательная tx,ty куда он идёт)
export function pathPoint(p: number) {
  let d = ((p % PERIMETER) + PERIMETER) % PERIMETER;
  const t = TRACK;
  if (d < L_TOP) return { x: t.x0 + R + d, y: t.y0, tx: 1, ty: 0 };
  d -= L_TOP;
  if (d < L_ARC) {
    const a = -Math.PI / 2 + d / R;
    const cx = t.x1 - R, cy = t.y0 + R;
    return { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a), tx: -Math.sin(a), ty: Math.cos(a) };
  }
  d -= L_ARC;
  if (d < L_SIDE) return { x: t.x1, y: t.y0 + R + d, tx: 0, ty: 1 };
  d -= L_SIDE;
  if (d < L_ARC) {
    const a = d / R;
    const cx = t.x1 - R, cy = t.y1 - R;
    return { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a), tx: -Math.sin(a), ty: Math.cos(a) };
  }
  d -= L_ARC;
  if (d < L_TOP) return { x: t.x1 - R - d, y: t.y1, tx: -1, ty: 0 };
  d -= L_TOP;
  if (d < L_ARC) {
    const a = Math.PI / 2 + d / R;
    const cx = t.x0 + R, cy = t.y1 - R;
    return { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a), tx: -Math.sin(a), ty: Math.cos(a) };
  }
  d -= L_ARC;
  if (d < L_SIDE) return { x: t.x0, y: t.y1 - R - d, tx: 0, ty: -1 };
  d -= L_SIDE;
  const a = Math.PI + d / R;
  const cx = t.x0 + R, cy = t.y0 + R;
  return { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a), tx: -Math.sin(a), ty: Math.cos(a) };
}

// ---------- Описание типов шариков ----------
export const TYPE_INFO: Record<
  OrbType,
  { name: string; color: string; dark: string; glow: string; desc: string }
> = {
  fire: {
    name: 'Огонь',
    color: '#ff6a3d',
    dark: '#7a1f0d',
    glow: 'rgba(255,106,61,',
    desc: '3 урона + осколки по рядом стоящим',
  },
  ice: {
    name: 'Лёд',
    color: '#46c8ff',
    dark: '#0c3a55',
    glow: 'rgba(70,200,255,',
    desc: 'замедляет врага на 2.3 сек',
  },
  bolt: {
    name: 'Молния',
    color: '#ffd23f',
    dark: '#6b4d00',
    glow: 'rgba(255,210,63,',
    desc: 'цепью бьёт ещё одного врага рядом',
  },
  poison: {
    name: 'Яд',
    color: '#4ade80',
    dark: '#14532d',
    glow: 'rgba(74,222,128,',
    desc: 'отравляет: урон течёт 4 сек',
  },
  spiky: {
    name: 'Шипастый',
    color: '#b16cff',
    dark: '#3b1670',
    glow: 'rgba(177,108,255,',
    desc: 'при соединении лопается: 4 иглы в стороны лопают другие шарики',
  },
};

export const ORB_TYPES: OrbType[] = ['fire', 'ice', 'bolt', 'poison', 'spiky'];

// ---------- БАЛАНС (все цифры геймдизайна тут) ----------
export const CONFIG = {
  lives: 20, // жизни на старте
  essenceStart: 30, // стартовая эссенция (валюта)
  orbCost: 10, // цена случайного шарика
  sellBase: 5, // возврат за продажу (+3 за каждый уровень)
  cooldown: 1.6, // перезарядка шарика после выстрела (сек)

  enemyHp: 6, // здоровье обычного врага на 1-й волне
  enemyHpGrowth: 1.22, // во сколько раз растёт здоровье каждую волну
  enemySpeed: 62, // скорость врага (px/сек) на 1-й волне
  enemySpeedGrowth: 1.4, // прирост скорости за волну
  enemySpeedCap: 92, // максимум скорости
  enemyReward: 2, // эссенция за обычного врага

  waveCountBase: 5, // врагов на волне N = base + N * per
  waveCountPer: 2,
  spawnInterval: 0.95, // пауза между появлением врагов (сек)
  spawnIntervalMin: 0.4,

  prepTime: 6, // пауза между волнами (сек)
  firstPrep: 9, // пауза перед самой первой волной
  callBonus: 5, // бонус эссенции за досрочный вызов волны
  clearBonusBase: 5, // награда за зачистку волны = base + номер волны

  bossEvery: 5, // каждая N-я волна — босс
  bossHp: 45, // здоровье босса (первая босс-волна)
  bossHpGrowth: 1.35, // рост здоровья босса
  bossSpeed: 46,
  bossReward: 20,
  bossLeak: 5, // сколько жизней забирает босс, если ушёл

  maxLevel: 9, // максимум накопления в одном шарике
};
