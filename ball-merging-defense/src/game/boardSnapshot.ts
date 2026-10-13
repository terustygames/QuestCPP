// Снимок поля для кооператива: всё, что нужно, чтобы нарисовать поле напарника.
// Публикуется в Realtime Database примерно 4 раза в секунду.
// Пустые клетки сетки кодируются числом 0 (RTDB не хранит null в массивах),
// пустые массивы RTDB не хранит вовсе, поэтому при чтении они восстанавливаются.
// Числа округляются до 0.1 (для картинки этого достаточно) — снимок короче.

import type { BengalSpark, Engine, EnemyState, GasCloud, NeedleState, OrbState, ProjState, Puddle, Status, Mode, TrapState } from './engine';
import { COLS, ROWS } from './config';
import type { OrbType } from './config';

export interface BoardSnapshot {
  now: number;
  status: Status;
  mode: Mode;
  wave: number;
  lives: number;
  essence: number;
  pendingBossId: number;
  typeLevels: Record<string, number>;
  deck?: OrbType[]; // колода игрока: шесть типов шариков (показывается напарнику)
  grid: (OrbState | 0)[];
  enemies: EnemyState[];
  puddles: Puddle[];
  projs: ProjState[];
  needles: NeedleState[];
  clouds?: GasCloud[];
  traps?: TrapState[]; // мины и бомбы на поле (показываются напарнику)
  sparks?: SparkWire[]; // искры бенгальского (показываются напарнику)
}

// Искра в снимке: только то, что нужно для картинки и движения
export type SparkWire = Pick<BengalSpark, 'x' | 'y' | 'vx' | 'vy' | 'age' | 'life'>;

// Задержка снимка в пути, с. Позиции в снимке сдвигаются на эту величину вперёд.
const SNAP_LAG = 0.15;

const r1 = (v: number) => Math.round(v * 10) / 10;

export function snapshotOf(g: Engine): BoardSnapshot {
  return {
    now: r1(g.now),
    status: g.status,
    mode: g.mode,
    wave: g.wave,
    lives: g.lives,
    essence: r1(g.essence),
    pendingBossId: g.pendingBossId,
    typeLevels: { ...g.typeLevels },
    deck: [...g.deck],
    grid: g.grid.map((o) => (o ? { ...o, cdUntil: r1(o.cdUntil), cdLen: r1(o.cdLen), bornAt: r1(o.bornAt), pulse: r1(o.pulse) } : 0)),
    enemies: g.enemies
      .filter((e) => !e.dead)
      .map((e) => ({
        ...e,
        p: r1(e.p),
        hp: Math.round(e.hp),
        speed: r1(e.speed),
        slowUntil: r1(e.slowUntil),
        stunUntil: r1(e.stunUntil),
        flashUntil: r1(e.flashUntil),
        bornAt: r1(e.bornAt),
        dots: e.dots.map((d) => ({ until: r1(d.until), dps: d.dps })),
        marks: e.marks.map((m) => ({ until: r1(m.until), dps: m.dps })),
        vulnUntil: e.vulnUntil === undefined ? undefined : r1(e.vulnUntil),
        burnUntil: e.burnUntil === undefined ? undefined : r1(e.burnUntil),
      })),
    puddles: g.puddles.map((p) => ({ ...p, p: r1(p.p), until: r1(p.until) })),
    traps: g.traps.map((t) => ({
      ...t,
      x: r1(t.x),
      y: r1(t.y),
      born: r1(t.born),
      arm: r1(t.arm),
      boomAt: r1(t.boomAt),
    })),
    // облака газа: позиция, возраст и радиус (остальное сторона напарника не использует)
    clouds: g.clouds.map((c) => ({
      ...c,
      x: r1(c.x),
      y: r1(c.y),
      age: r1(c.age),
      life: r1(c.life),
      nextTick: r1(c.nextTick),
    })),
    // снаряды и шипы: позиции и направление; короткий след (до 3 точек)
    projs: g.projs.map((p) => ({
      ...p,
      x: r1(p.x),
      y: r1(p.y),
      vx: r1(p.vx),
      vy: r1(p.vy),
      life: r1(p.life),
      age: r1(p.age),
      trail: p.trail.slice(0, 3).map((t) => ({ x: r1(t.x), y: r1(t.y) })),
      hitIds: p.hitIds ? [...p.hitIds] : undefined,
    })),
    needles: g.needles.map((n) => ({ ...n, x: r1(n.x), y: r1(n.y), dx: r1(n.dx), dy: r1(n.dy), ang: r1(n.ang), life: r1(n.life) })),
    sparks: g.bengalSparks.map((k) => ({
      x: r1(k.x),
      y: r1(k.y),
      vx: Math.round(k.vx),
      vy: Math.round(k.vy),
      age: r1(k.age),
      life: r1(k.life),
    })),
  };
}

// Снимок в виде, безопасном для RTDB (без undefined, с пустыми значениями)
export function encodeSnapshot(snap: BoardSnapshot): string {
  return JSON.stringify(snap);
}

export function decodeSnapshot(raw: unknown): BoardSnapshot | null {
  if (!raw || typeof raw !== 'object') return null;
  const s = raw as Partial<BoardSnapshot> & Record<string, unknown>;
  if (typeof s.now !== 'number' || typeof s.status !== 'string') return null;
  return s as BoardSnapshot;
}

// Переносит снимок в движок (поле напарника). Движок только для отрисовки.
// Враги и снаряды не прыгают на каждом снимке: старые позиции сохраняются, а цель (с поправкой
// на задержку) отдаётся движку, который плавно подтягивает картинку (см. Engine.extrapolate).
export function applySnapshot(g: Engine, s: BoardSnapshot): void {
  const lagged = s.now + SNAP_LAG;
  if (Math.abs(g.now - lagged) > 0.3) g.now = lagged;
  g.status = s.status;
  g.mode = s.mode ?? 'combine';
  g.wave = s.wave;
  g.lives = s.lives;
  g.essence = s.essence;
  g.pendingBossId = s.pendingBossId ?? 0;
  g.typeLevels = { ...g.typeLevels, ...(s.typeLevels ?? {}) } as Record<OrbType, number>;
  if (Array.isArray(s.deck)) g.deck = s.deck.slice(0, 6);

  const cells = Array.from({ length: COLS * ROWS }, (_, i) => {
    const o = s.grid?.[i];
    return o && typeof o === 'object' ? (o as OrbState) : null;
  });
  g.grid = cells;

  // враги: прежняя позиция на экране, цель — позиция из снимка плюс путь за задержку
  const oldEnemyP = new Map(g.enemies.map((e) => [e.id, e.p]));
  const enemyTarget = new Map<number, number>();
  g.enemies = (s.enemies ?? []).map((e) => {
    const ne: EnemyState = { ...e, dots: e.dots ?? [], marks: e.marks ?? [] };
    const moving = s.now >= e.stunUntil;
    const target = ne.p + (moving ? ne.speed * SNAP_LAG : 0);
    enemyTarget.set(ne.id, target);
    const prev = oldEnemyP.get(ne.id);
    // сильный скачок (новый враг или сбой идентификатора) — ставим сразу
    ne.p = prev !== undefined && Math.abs(prev - target) < 60 ? prev : target;
    return ne;
  });
  g.remoteEnemyTarget = enemyTarget;

  // снаряды: то же самое по координатам
  const oldProjPos = new Map(g.projs.map((p) => [p.id, { x: p.x, y: p.y }]));
  const projTarget = new Map<number, { x: number; y: number }>();
  g.projs = (s.projs ?? []).map((p) => {
    const np: ProjState = { ...p, trail: p.trail ?? [] };
    const t = { x: np.x + np.vx * SNAP_LAG, y: np.y + np.vy * SNAP_LAG };
    projTarget.set(np.id, t);
    const prev = oldProjPos.get(np.id);
    if (prev && Math.hypot(prev.x - t.x, prev.y - t.y) < 60) {
      np.x = prev.x;
      np.y = prev.y;
    } else {
      np.x = t.x;
      np.y = t.y;
    }
    return np;
  });
  g.remoteProjTarget = projTarget;

  g.puddles = s.puddles ?? [];
  g.needles = s.needles ?? [];
  g.clouds = s.clouds ?? [];
  g.traps = s.traps ?? [];
  // искры: сдвигаются на задержку, дальше летят сами (Engine.extrapolate)
  g.bengalSparks = (s.sparks ?? []).map((k) => ({
    x: k.x + k.vx * SNAP_LAG,
    y: k.y + k.vy * SNAP_LAG,
    vx: k.vx,
    vy: k.vy,
    age: k.age + SNAP_LAG,
    life: k.life,
    dmg: 0, // на стороне напарника не жгут: только картинка
    dmgMul: 1,
  }));
  g.parts = [];
}
