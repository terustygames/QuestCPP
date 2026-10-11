// ============================================================
// МЕТА-ПРОГРЕССИЯ между забегами: монеты, очки прокачки, колода,
// открытые шарики, деревья навыков, магазин, ежедневный сундук.
// Чистый TypeScript: без React, без DOM (кроме localStorage,
// который вызывается через обёртку с защитой от ошибок).
// ============================================================

import { ALL_TYPES, CLASSIC_TYPES, CONFIG, type OrbType } from './config';
import { NODE_BY_ID, SKILL_NODES, rootId, type SkillNode, type TypeMods } from './skills';
import type { RunConfig } from './engine';

// ---------- Экономика (все цифры прогрессии тут) ----------
export const META_CFG = {
  deckSize: CONFIG.deckSize,
  // очки прокачки за каждую пройденную волну
  pointsPerWave: 1,
  // монеты за волну w: coinsBase + coinsPerWave * w (сумма по пройденным волнам)
  coinsBase: 10,
  coinsPerWave: 3,
  // при сбросе дерева монеты возвращаются частично (очки — полностью)
  refundCoinsShare: 0.5,
  chest: { coinsMin: 60, coinsMax: 150, pointsMin: 1, pointsMax: 3 },
  boosts: {
    essence: { amount: 40, price: 120, title: 'Запас эссенции', desc: '+40 эссенции на старт забега' },
    lives: { amount: 5, price: 200, title: 'Запас жизней', desc: '+5 жизней на старт забега' },
  },
} as const;

export type BoostKind = keyof typeof META_CFG.boosts;

// Шарики, которые можно купить в магазине (базовые шесть открыты с начала)
export const BALL_PRICES: Partial<Record<OrbType, number>> = {
  nova: 600,
  stun: 600,
  pierce: 800,
  vampire: 800,
  barrage: 1000,
  mark: 900,
};

const STORAGE_KEY = 'orbital.meta.v1';

export interface MetaState {
  coins: number;
  points: number;
  owned: OrbType[];
  deck: OrbType[];
  nodes: string[]; // открытые узлы деревьев (id)
  boosts: Record<BoostKind, number>;
  chestDay: string; // дата последнего открытого сундука (YYYY-MM-DD), '' — не открывали
  runs: number;
  bestWave: number;
}

export function defaultMeta(): MetaState {
  return {
    coins: 0,
    points: 0,
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

export function loadMeta(): MetaState {
  const base = defaultMeta();
  const raw = readStorage();
  if (!raw) return base;
  try {
    const d = JSON.parse(raw) as Partial<MetaState>;
    const num = (v: unknown, fallback: number) =>
      typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : fallback;
    const owned = Array.isArray(d.owned)
      ? (d.owned.filter((t) => ALL_TYPES.includes(t as OrbType)) as OrbType[])
      : base.owned;
    const ownedFixed = [...new Set([...CLASSIC_TYPES, ...owned])];
    const nodes = Array.isArray(d.nodes)
      ? [...new Set(d.nodes.filter((id) => typeof id === 'string' && NODE_BY_ID[id]))]
      : [];
    return {
      coins: num(d.coins, 0),
      points: num(d.points, 0),
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

export function openChest(m: MetaState, today: string, rnd: () => number = Math.random) {
  const c = META_CFG.chest;
  const coins = c.coinsMin + Math.floor(rnd() * (c.coinsMax - c.coinsMin + 1));
  const points = c.pointsMin + Math.floor(rnd() * (c.pointsMax - c.pointsMin + 1));
  return {
    coins,
    points,
    meta: { ...m, coins: m.coins + coins, points: m.points + points, chestDay: today },
  };
}

// ---------- Итоги забега ----------
// Волна, на которой игрок погиб (или сдался), не пройдена: пройдено wave − 1.
export function runReward(waveReached: number) {
  const passed = Math.max(0, waveReached - 1);
  let coins = 0;
  for (let w = 1; w <= passed; w++) coins += META_CFG.coinsBase + META_CFG.coinsPerWave * w;
  return { passed, coins, points: passed * META_CFG.pointsPerWave };
}

export function applyRun(m: MetaState, waveReached: number): MetaState {
  const r = runReward(waveReached);
  return {
    ...m,
    coins: m.coins + r.coins,
    points: m.points + r.points,
    runs: m.runs + 1,
    bestWave: Math.max(m.bestWave, Math.max(0, waveReached - 1)),
  };
}

// ---------- Шарики и колода ----------
export function ownsBall(m: MetaState, t: OrbType) {
  return m.owned.includes(t);
}

export function buyBall(m: MetaState, t: OrbType): { meta: MetaState; error?: string } {
  const price = BALL_PRICES[t];
  if (price === undefined || ownsBall(m, t)) return { meta: m, error: 'Уже открыт' };
  if (m.coins < price) return { meta: m, error: `Не хватает монет: нужно ${price}` };
  return { meta: { ...m, coins: m.coins - price, owned: [...m.owned, t] } };
}

export function buyBoost(m: MetaState, kind: BoostKind): { meta: MetaState; error?: string } {
  const b = META_CFG.boosts[kind];
  if (m.coins < b.price) return { meta: m, error: `Не хватает монет: нужно ${b.price}` };
  return { meta: { ...m, coins: m.coins - b.price, boosts: { ...m.boosts, [kind]: m.boosts[kind] + 1 } } };
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

// Причина, почему узел нельзя открыть сейчас (null — можно)
export function unlockBlocker(m: MetaState, n: SkillNode): string | null {
  const st = nodeStatus(m, n);
  if (st === 'open') return 'Уже открыт';
  if (!ownsBall(m, n.type)) return 'Сначала откройте шарик в магазине';
  if (st === 'locked') return 'Сначала откройте предыдущий узел ветки';
  if (st === 'blocked') return 'Путь закрыт выбором: сбросьте дерево, чтобы выбрать другой';
  if (m.points < n.points) return `Нужно очков прокачки: ${n.points}`;
  if (m.coins < n.coins) return `Нужно монет: ${n.coins}`;
  return null;
}

export function unlockNode(m: MetaState, id: string): { meta: MetaState; error?: string } {
  const n = NODE_BY_ID[id];
  if (!n) return { meta: m, error: 'Нет такого узла' };
  const why = unlockBlocker(m, n);
  if (why) return { meta: m, error: why };
  return {
    meta: { ...m, points: m.points - n.points, coins: m.coins - n.coins, nodes: [...m.nodes, id] },
  };
}

// Сброс дерева шарика: очки возвращаются полностью, монеты — частично
export function resetTree(m: MetaState, t: OrbType): { meta: MetaState; refundPoints: number; refundCoins: number } {
  const open = SKILL_NODES.filter((n) => n.type === t && m.nodes.includes(n.id));
  const refundPoints = open.reduce((s, n) => s + n.points, 0);
  const refundCoins = Math.floor(open.reduce((s, n) => s + n.coins, 0) * META_CFG.refundCoinsShare);
  return {
    refundPoints,
    refundCoins,
    meta: {
      ...m,
      points: m.points + refundPoints,
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
