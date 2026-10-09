/* Игровые константы, баланс, пути и привязки клавиш. */

export const W = 1280;
export const H = 720;
export const MID_X = W / 2;

export const START_GOLD = 70;
export const BASE_HP = 30;
export const INCOME_PER_SEC = 2.4;

export const COIN_VALUE = 12;
export const COIN_LIFE = 12;
export const COIN_PERIOD = 4.2;
export const COIN_PICKUP_R = 30;

export const BUILDER_SPEED = 265;
export const TOWER_MIN_GAP = 48; // минимальная дистанция между центрами башен
export const PATH_CLEARANCE = 54; // запретная зона вокруг пути
export const FIELD_MARGIN = 34;

export interface Vec {
  x: number;
  y: number;
}

export type TeamId = 0 | 1;
export type TowerKind = "arrow" | "sniper" | "frost";

export interface TowerDef {
  kind: TowerKind;
  name: string;
  cost: number;
  range: number;
  damage: number;
  rate: number; // выстрелов в секунду
  color: string;
  desc: string;
}

export const TOWERS: Record<TowerKind, TowerDef> = {
  arrow: {
    kind: "arrow",
    name: "Арбалет",
    cost: 20,
    range: 118,
    damage: 9,
    rate: 1.35,
    color: "#fde047",
    desc: "Быстрый и дешёвый",
  },
  sniper: {
    kind: "sniper",
    name: "Рельсотрон",
    cost: 45,
    range: 210,
    damage: 34,
    rate: 0.5,
    color: "#c084fc",
    desc: "Дальний бой, большой урон",
  },
  frost: {
    kind: "frost",
    name: "Криоген",
    cost: 35,
    range: 105,
    damage: 3,
    rate: 1.1,
    color: "#7dd3fc",
    desc: "Замедляет врагов на 45%",
  },
};

export const FROST_SLOW = 0.45;
export const FROST_SLOW_TIME = 1.6;

/** Зеркальные змейки-пути: слева для атаки на Игрока 1, справа — на Игрока 2. */
const leftPath: Vec[] = [
  { x: MID_X + 2, y: 98 },
  { x: 112, y: 98 },
  { x: 112, y: 252 },
  { x: 562, y: 252 },
  { x: 562, y: 442 },
  { x: 112, y: 442 },
  { x: 112, y: 620 },
  { x: 58, y: 620 },
];

const mirror = (p: Vec[]): Vec[] => p.map((v) => ({ x: W - v.x, y: v.y }));

/** paths[i] — маршрут юнитов, атакующих игрока i. */
export const PATHS: Vec[][] = [leftPath, mirror(leftPath)];

export const BASE_POS: Vec[] = [
  { x: 52, y: 620 },
  { x: W - 52, y: 620 },
];

export const PORTAL_POS: Vec = { x: MID_X, y: 94 };

export const BUILDER_START: Vec[] = [
  { x: 320, y: 520 },
  { x: W - 320, y: 150 },
];

export const TEAM = [
  {
    name: "ИГРОК 1",
    short: "P1",
    color: "#22d3ee",
    soft: "rgba(34,211,238,0.14)",
    deep: "#0e7490",
    glow: "rgba(34,211,238,0.55)",
  },
  {
    name: "ИГРОК 2",
    short: "P2",
    color: "#fb7185",
    soft: "rgba(251,113,133,0.14)",
    deep: "#9f1239",
    glow: "rgba(251,113,133,0.55)",
  },
];

/** Управление. Башни: зажать клавишу — прицелиться, отпустить — построить. */
export const KEYS = [
  {
    up: "KeyW",
    down: "KeyS",
    left: "KeyA",
    right: "KeyD",
    towers: { KeyQ: "arrow", KeyE: "sniper", KeyR: "frost" } as Record<string, TowerKind>,
    send: "KeyF",
  },
  {
    up: "ArrowUp",
    down: "ArrowDown",
    left: "ArrowLeft",
    right: "ArrowRight",
    towers: { Comma: "arrow", Period: "sniper", Slash: "frost" } as Record<string, TowerKind>,
    send: "Enter",
  },
];

/** Альтернативная клавиша отправки волны для P2 (ноутбуки). */
export const P2_SEND_ALT = "ShiftRight";

export interface UnitSpec {
  kind: "grunt" | "fast" | "tank";
  hp: number;
  speed: number;
  dmg: number;
  radius: number;
  bounty: number;
}

/** Эскалация волн: каждая следующая отправка сильнее и дороже. */
export function waveCost(level: number): number {
  return 12 + 9 * level;
}

export function waveUnits(level: number): UnitSpec[] {
  const count = Math.min(3 + level, 12);
  const specs: UnitSpec[] = [];
  for (let i = 0; i < count; i++) {
    if (level >= 4 && i % 3 === 2) {
      specs.push({
        kind: "tank",
        hp: 42 + 24 * level,
        speed: 40,
        dmg: 3,
        radius: 12,
        bounty: 5 + Math.ceil(level * 0.9),
      });
    } else if (level >= 2 && i % 2 === 1) {
      specs.push({
        kind: "fast",
        hp: 14 + 8 * level,
        speed: 84,
        dmg: 1,
        radius: 7,
        bounty: 2 + Math.ceil(level * 0.6),
      });
    } else {
      specs.push({
        kind: "grunt",
        hp: 22 + 12 * level,
        speed: 55,
        dmg: level >= 7 ? 2 : 1,
        radius: 9,
        bounty: 3 + Math.ceil(level * 0.7),
      });
    }
  }
  return specs;
}

export function dist(a: Vec, b: Vec): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Расстояние от точки до ломаной пути. */
export function distToPath(p: Vec, path: Vec[]): number {
  let best = Infinity;
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    const abx = b.x - a.x;
    const aby = b.y - a.y;
    const lenSq = abx * abx + aby * aby || 1;
    let t = ((p.x - a.x) * abx + (p.y - a.y) * aby) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const cx = a.x + abx * t;
    const cy = a.y + aby * t;
    best = Math.min(best, Math.hypot(p.x - cx, p.y - cy));
  }
  return best;
}

export function pointInField(p: Vec, team: TeamId): boolean {
  const minX = team === 0 ? FIELD_MARGIN : MID_X + 22;
  const maxX = team === 0 ? MID_X - 22 : W - FIELD_MARGIN;
  return p.x >= minX && p.x <= maxX && p.y >= FIELD_MARGIN && p.y <= H - FIELD_MARGIN;
}
