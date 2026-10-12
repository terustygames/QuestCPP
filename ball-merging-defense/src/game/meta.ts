// ============================================================
// МЕТА-ПРОГРЕССИЯ между забегами: монеты (общие), очки прокачки
// (ОП — отдельно у каждого шарика), колода, открытые шарики,
// деревья навыков, магазин, ежедневный сундук и сундук после забега.
// Чистый TypeScript: без React, без DOM (кроме localStorage,
// который вызывается через обёртку с защитой от ошибок).
// ============================================================

import { ALL_TYPES, CLASSIC_TYPES, CONFIG, type OrbType } from './config';
import {
  NODE_BY_ID,
  SKILL_NODES,
  nextNodePoints,
  refundPointsFor,
  rootId,
  type SkillNode,
  type TypeMods,
} from './skills';
import type { RunConfig } from './engine';

// ---------- Экономика (все цифры прогрессии тут) ----------
export const META_CFG = {
  deckSize: CONFIG.deckSize,
  // ОП за каждую пройденную волну. Делятся поровну между шариками колоды.
  pointsPerWave: 3,
  // монеты за волну w: coinsBase + coinsPerWave * w (сумма по пройденным волнам)
  coinsBase: 10,
  coinsPerWave: 3,
  // при сбросе дерева монеты возвращаются частично (ОП шарика — полностью)
  refundCoinsShare: 0.5,
  // покупка ОП за монеты: только для открытых шариков, пачкой
  points: { price: 25, pack: 5 },
  // сундук (ежедневный и после каждого забега — одна таблица)
  chest: {
    coinsMin: 60,
    coinsMax: 150,
    pointsMin: 1,
    pointsMax: 3,
    // редкий (1 из 50) легендарный сундук: большой ОП-пакет
    legendaryChance: 1 / 50,
    legendaryPointsMin: 6,
    legendaryPointsMax: 10,
    // легендарный дубликат (шарик уже открыт): монеты в общий баланс сверх ОП
    dupCoins: 120,
  },
  boosts: {
    essence: { amount: 40, price: 120, title: 'Запас эссенции', desc: '+40 эссенции на старт забега' },
    lives: { amount: 5, price: 200, title: 'Запас жизней', desc: '+5 жизней на старт забега' },
  },
} as const;

export type BoostKind = keyof typeof META_CFG.boosts;

const STORAGE_KEY = 'orbital.meta.v1';

export type PointsMap = Record<OrbType, number>;

export interface MetaState {
  coins: number;
  pts: PointsMap; // очки прокачки по шарикам (ОП)
  owned: OrbType[];
  deck: OrbType[];
  nodes: string[]; // открытые узлы деревьев (id)
  boosts: Record<BoostKind, number>;
  chestDay: string; // дата последнего открытого ежедневного сундука (YYYY-MM-DD), '' — не открывали
  runs: number;
  bestWave: number;
}

export function emptyPoints(): PointsMap {
  return Object.fromEntries(ALL_TYPES.map((t) => [t, 0])) as PointsMap;
}

export function defaultMeta(): MetaState {
  return {
    coins: 0,
    pts: emptyPoints(),
    owned: [...CLASSIC_TYPES],
    deck: [...CLASSIC_TYPES],
    nodes: [],
    boosts: { essence: 0, lives: 0 },
    chestDay: '',
    runs: 0,
    bestWave: 0,
  };
}

// ---------- Сохранение ----------
function readStorage(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function saveMeta(m: MetaState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(m));
  } catch {
    // хранилище недоступно (приватный режим) — прогресс живёт до перезагрузки
  }
}

// Колода всегда из N уникальных открытых шариков. Если в сохранении
// что-то не так — дополняем из открытых (базовые — первыми).
function fixDeck(deck: unknown, owned: OrbType[]): OrbType[] {
  const out: OrbType[] = [];
  if (Array.isArray(deck)) {
    for (const t of deck) {
      if (typeof t === 'string' && owned.includes(t as OrbType) && !out.includes(t as OrbType)) {
        if (out.length < META_CFG.deckSize) out.push(t as OrbType);
      }
    }
  }
  for (const t of [...CLASSIC_TYPES, ...owned]) {
    if (out.length >= META_CFG.deckSize) break;
    if (owned.includes(t) && !out.includes(t)) out.push(t);
  }
  return out;
}

// Раздача общих очков старой версии (одно число) по открытым шарикам поровну
function migratePoints(total: number, owned: OrbType[]): PointsMap {
  const out = emptyPoints();
  if (total <= 0 || !owned.length) return out;
  const base = Math.floor(total / owned.length);
  const rest = total % owned.length;
  owned.forEach((t, i) => {
    out[t] = base + (i < rest ? 1 : 0);
  });
  return out;
}

// Разбор сохранения (из localStorage или из облака). Любой мусор — значения по умолчанию.
export function parseMeta(input: unknown): MetaState {
  const base = defaultMeta();
  if (!input || typeof input !== 'object') return base;
  try {
    const d = input as Partial<MetaState> & { points?: number };
    const num = (v: unknown, fallback: number) =>
      typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : fallback;
    const owned = Array.isArray(d.owned)
      ? (d.owned.filter((t) => ALL_TYPES.includes(t as OrbType)) as OrbType[])
      : base.owned;
    const ownedFixed = [...new Set([...CLASSIC_TYPES, ...owned])];
    const nodes = Array.isArray(d.nodes)
      ? [...new Set(d.nodes.filter((id) => typeof id === 'string' && NODE_BY_ID[id]))]
      : [];
    // Старое сохранение: одно общее число очков — раздаём открытым шарикам.
    let pts = emptyPoints();
    if (d.pts && typeof d.pts === 'object') {
      for (const t of ALL_TYPES) pts[t] = num((d.pts as Record<string, unknown>)[t], 0);
    } else {
      pts = migratePoints(num(d.points, 0), ownedFixed);
    }
    return {
      coins: num(d.coins, 0),
      pts,
      owned: ownedFixed,
      deck: fixDeck(d.deck, ownedFixed),
      nodes,
      boosts: {
        essence: num(d.boosts?.essence, 0),
        lives: num(d.boosts?.lives, 0),
      },
      chestDay: typeof d.chestDay === 'string' ? d.chestDay : '',
      runs: num(d.runs, 0),
      bestWave: num(d.bestWave, 0),
    };
  } catch {
    return base;
  }
}

// Гостевая мета — на этом устройстве (ключ orbital.meta.v1). Гость играет без входа.
export function loadMeta(): MetaState {
  const raw = readStorage();
  if (!raw) return defaultMeta();
  try {
    return parseMeta(JSON.parse(raw));
  } catch {
    return defaultMeta();
  }
}

// ---------- Дата (локальная для игрока) ----------
export function todayKey(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function chestReady(m: MetaState, today: string): boolean {
  return m.chestDay !== today;
}

// ---------- Сундуки ----------
export interface ChestRoll {
  coins: number;
  points: number; // ОП шарику ball
  ball: OrbType; // шарик, которому выпали ОП (если не открыт — выпадение его открывает)
  legendary: boolean;
  dupCoins: number; // монеты за легендарный дубликат (шарик уже открыт), иначе 0
}

const rangeInt = (lo: number, hi: number, rnd: () => number) => lo + Math.floor(rnd() * (hi - lo + 1));

// Один бросок сундука. Одна таблица для ежедневного и сундука после забега.
export function rollChest(rnd: () => number = Math.random): ChestRoll {
  const c = META_CFG.chest;
  const coins = rangeInt(c.coinsMin, c.coinsMax, rnd);
  const legendary = rnd() < c.legendaryChance;
  const points = legendary
    ? rangeInt(c.legendaryPointsMin, c.legendaryPointsMax, rnd)
    : rangeInt(c.pointsMin, c.pointsMax, rnd);
  const ball = ALL_TYPES[Math.floor(rnd() * ALL_TYPES.length)];
  return { coins, points, ball, legendary, dupCoins: 0 };
}

// Применить бросок к мете: монеты, ОП шарику, открытие шарика, легендарный дубликат.
export function applyChest(
  m: MetaState,
  roll: ChestRoll
): { meta: MetaState; roll: ChestRoll; opened: boolean } {
  const wasOwned = m.owned.includes(roll.ball);
  const dupCoins = roll.legendary && wasOwned ? META_CFG.chest.dupCoins : 0;
  const pts = { ...m.pts, [roll.ball]: m.pts[roll.ball] + roll.points };
  return {
    opened: !wasOwned,
    roll: { ...roll, dupCoins },
    meta: {
      ...m,
      coins: m.coins + roll.coins + dupCoins,
      pts,
      owned: wasOwned ? m.owned : [...m.owned, roll.ball],
    },
  };
}

// Ежедневный сундук: один раз в день
export function openChest(m: MetaState, today: string, rnd: () => number = Math.random) {
  const applied = applyChest(m, rollChest(rnd));
  return { ...applied, meta: { ...applied.meta, chestDay: today } };
}

// Сколько шариков ещё не открыто (для подсказок в магазине)
export function lockedBallsLeft(m: MetaState): number {
  return ALL_TYPES.filter((t) => !m.owned.includes(t)).length;
}

// ---------- Итоги забега ----------
// Волна, на которой игрок погиб (или сдался), не пройдена: пройдено wave − 1.
export function runReward(waveReached: number) {
  const passed = Math.max(0, waveReached - 1);
  let coins = 0;
  for (let w = 1; w <= passed; w++) coins += META_CFG.coinsBase + META_CFG.coinsPerWave * w;
  return { passed, coins, points: passed * META_CFG.pointsPerWave };
}

// Делим total ОП поровну между шариками колоды (остаток — первым шарикам)
export function splitPoints(total: number, deck: OrbType[]): Partial<PointsMap> {
  const out: Partial<PointsMap> = {};
  if (total <= 0 || !deck.length) return out;
  const base = Math.floor(total / deck.length);
  const rest = total % deck.length;
  deck.forEach((t, i) => {
    out[t] = base + (i < rest ? 1 : 0);
  });
  return out;
}

export interface RunSettlement {
  passed: number;
  coins: number; // монеты за волны
  points: number; // ОП всего за волны
  perBall: Partial<PointsMap>; // ОП за волны по шарикам колоды
  chest: ChestRoll; // сундук после забега
  chestOpened: boolean; // сундук открыл шарик, которого не было
}

// Итог забега: монеты и ОП за волны, сундук после забега. Чистая функция.
export function settleRun(m: MetaState, waveReached: number, roll: ChestRoll): { meta: MetaState; reward: RunSettlement } {
  const r = runReward(waveReached);
  const perBall = splitPoints(r.points, m.deck);
  const pts = { ...m.pts };
  for (const t of ALL_TYPES) pts[t] += perBall[t] ?? 0;
  const withWaves: MetaState = {
    ...m,
    coins: m.coins + r.coins,
    pts,
    runs: m.runs + 1,
    bestWave: Math.max(m.bestWave, r.passed),
  };
  const chest = applyChest(withWaves, roll);
  return {
    meta: chest.meta,
    reward: {
      passed: r.passed,
      coins: r.coins,
      points: r.points,
      perBall,
      chest: chest.roll,
      chestOpened: chest.opened,
    },
  };
}

// ---------- Шарики и колода ----------
export function ownsBall(m: MetaState, t: OrbType) {
  return m.owned.includes(t);
}

export function buyBoost(m: MetaState, kind: BoostKind): { meta: MetaState; error?: string } {
  const b = META_CFG.boosts[kind];
  if (m.coins < b.price) return { meta: m, error: `Не хватает монет: нужно ${b.price}` };
  return { meta: { ...m, coins: m.coins - b.price, boosts: { ...m.boosts, [kind]: m.boosts[kind] + 1 } } };
}

// Покупка пачки ОП шарика за монеты: только для открытых шариков
export function buyPoints(m: MetaState, t: OrbType): { meta: MetaState; error?: string } {
  if (!ownsBall(m, t)) return { meta: m, error: 'Сначала откройте шарик' };
  const { price, pack } = META_CFG.points;
  const cost = price * pack;
  if (m.coins < cost) return { meta: m, error: `Не хватает монет: нужно ${cost}` };
  return { meta: { ...m, coins: m.coins - cost, pts: { ...m.pts, [t]: m.pts[t] + pack } } };
}

// Тап по шарику в инвентаре: входит в колоду / выходит из неё.
export function toggleDeck(m: MetaState, t: OrbType): { meta: MetaState; error?: string } {
  if (!ownsBall(m, t)) return { meta: m, error: 'Шарик ещё не открыт' };
  if (m.deck.includes(t)) return { meta: { ...m, deck: m.deck.filter((x) => x !== t) } };
  if (m.deck.length >= META_CFG.deckSize) {
    return { meta: m, error: `Колода полна: ${META_CFG.deckSize} шариков. Сначала убери один` };
  }
  return { meta: { ...m, deck: [...m.deck, t] } };
}

export function deckReady(m: MetaState) {
  return m.deck.length === META_CFG.deckSize;
}

// ---------- Деревья навыков ----------
// open — открыт; ready — можно открыть; locked — не хватает родителя или шарика;
// blocked — закрыт выбором: открыт другой путь из этой развилки (нужен сброс дерева)
export type NodeStatus = 'open' | 'ready' | 'locked' | 'blocked';

export function nodeStatus(m: MetaState, n: SkillNode): NodeStatus {
  if (m.nodes.includes(n.id)) return 'open';
  if (!ownsBall(m, n.type)) return 'locked';
  const parentOpen = n.parent === rootId(n.type) || m.nodes.includes(n.parent);
  if (!parentOpen) return 'locked';
  if (n.exclusive.some((id) => m.nodes.includes(id))) return 'blocked';
  return 'ready';
}

// Сколько узлов дерева уже открыто (от этого зависит цена следующего)
export function openInTree(m: MetaState, t: OrbType): number {
  return SKILL_NODES.filter((n) => n.type === t && m.nodes.includes(n.id)).length;
}

// Цена в ОП следующего узла дерева шарика: растёт с каждым открытым узлом
export function nodePointsCost(m: MetaState, t: OrbType): number {
  return nextNodePoints(openInTree(m, t));
}

// Причина, почему узел нельзя открыть сейчас (null — можно)
export function unlockBlocker(m: MetaState, n: SkillNode): string | null {
  const st = nodeStatus(m, n);
  if (st === 'open') return 'Уже открыт';
  if (!ownsBall(m, n.type)) return 'Сначала откройте шарик';
  if (st === 'locked') return 'Сначала откройте предыдущий узел ветки';
  if (st === 'blocked') return 'Путь закрыт выбором: сбросьте дерево, чтобы выбрать другой';
  const cost = nodePointsCost(m, n.type);
  if (m.pts[n.type] < cost) return `Нужно очков прокачки этого шарика: ${cost}`;
  if (m.coins < n.coins) return `Нужно монет: ${n.coins}`;
  return null;
}

export function unlockNode(m: MetaState, id: string): { meta: MetaState; error?: string } {
  const n = NODE_BY_ID[id];
  if (!n) return { meta: m, error: 'Нет такого узла' };
  const why = unlockBlocker(m, n);
  if (why) return { meta: m, error: why };
  const cost = nodePointsCost(m, n.type);
  return {
    meta: {
      ...m,
      pts: { ...m.pts, [n.type]: m.pts[n.type] - cost },
      coins: m.coins - n.coins,
      nodes: [...m.nodes, id],
    },
  };
}

// Сброс дерева шарика: все ОП шарика возвращаются, монеты — частично
export function resetTree(m: MetaState, t: OrbType): { meta: MetaState; refundPoints: number; refundCoins: number } {
  const open = SKILL_NODES.filter((n) => n.type === t && m.nodes.includes(n.id));
  const refundPoints = refundPointsFor(open.length);
  const refundCoins = Math.floor(open.reduce((s, n) => s + n.coins, 0) * META_CFG.refundCoinsShare);
  return {
    refundPoints,
    refundCoins,
    meta: {
      ...m,
      pts: { ...m.pts, [t]: m.pts[t] + refundPoints },
      coins: m.coins + refundCoins,
      nodes: m.nodes.filter((id) => !open.some((n) => n.id === id)),
    },
  };
}

export function treeProgress(m: MetaState, t: OrbType) {
  const nodes = SKILL_NODES.filter((n) => n.type === t);
  return { open: nodes.filter((n) => m.nodes.includes(n.id)).length, total: nodes.length };
}

// Суммарные эффекты открытых узлов по каждому типу шарика
export function modsFor(m: MetaState): Partial<Record<OrbType, TypeMods>> {
  const out: Partial<Record<OrbType, TypeMods>> = {};
  for (const id of m.nodes) {
    const n = NODE_BY_ID[id];
    if (!n) continue;
    const acc: TypeMods = out[n.type] ?? {};
    for (const k of Object.keys(n.effect) as (keyof TypeMods)[]) {
      acc[k] = (acc[k] ?? 0) + (n.effect[k] ?? 0);
    }
    out[n.type] = acc;
  }
  return out;
}

// ---------- Старт забега ----------
// Бусты на старт расходуются при запуске: одна штука каждого вида на забег.
export function startRun(m: MetaState): { run: RunConfig; meta: MetaState } {
  const boostE = m.boosts.essence > 0 ? META_CFG.boosts.essence.amount : 0;
  const boostL = m.boosts.lives > 0 ? META_CFG.boosts.lives.amount : 0;
  const run: RunConfig = {
    deck: [...m.deck],
    mods: modsFor(m),
    essenceBonus: boostE,
    livesBonus: boostL,
  };
  const meta: MetaState = {
    ...m,
    boosts: {
      essence: m.boosts.essence > 0 ? m.boosts.essence - 1 : 0,
      lives: m.boosts.lives > 0 ? m.boosts.lives - 1 : 0,
    },
  };
  return { run, meta };
}


export interface PlayerProfile {
  displayName: string;
  createdAt: number;
  updatedAt: number;

  meta: {
    coins: number;
    pts: Record<string, number>;
    owned: string[];
    deck: string[];
    nodes: string[];
    boosts: {
      essence: number;
      lives: number;
    };
    chestDay: string;
    runs: number;
    bestWave: number;
  };

  achievements: Record<string, {
    unlocked: boolean;
    unlockedAt: number | null;
    progress: number;
  }>;

  stats: {
    totalKills: number;
    totalPlayTime: number;
    totalWins: number;
    totalLosses: number;
  };

  settings: {
    musicVolume: number;
    soundVolume: number;
  };
}
