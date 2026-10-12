// Снимок поля для кооператива: всё, что нужно, чтобы нарисовать поле напарника.
// Публикуется в Realtime Database примерно 4 раза в секунду.
// Пустые клетки сетки кодируются числом 0 (RTDB не хранит null в массивах),
// пустые массивы RTDB не хранит вовсе, поэтому при чтении они восстанавливаются.
// Числа округляются до 0.1 (для картинки этого достаточно) — снимок короче.

import type { Engine, EnemyState, NeedleState, OrbState, ProjState, Puddle, Status, Mode } from './engine';
import { COLS, ROWS } from './config';
import type { OrbType, TrackSide } from './config';

export interface BoardSnapshot {
  now: number;
  status: Status;
  mode: Mode;
  wave: number;
  lives: number;
  essence: number;
  pendingBossId: number;
  trackSide: TrackSide;
  typeLevels: Record<string, number>;
  grid: (OrbState | 0)[];
  enemies: EnemyState[];
  puddles: Puddle[];
  projs: ProjState[];
  needles: NeedleState[];
}

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
    trackSide: g.trackSide,
    typeLevels: { ...g.typeLevels },
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
      })),
    puddles: g.puddles.map((p) => ({ ...p, p: r1(p.p), until: r1(p.until) })),
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
export function applySnapshot(g: Engine, s: BoardSnapshot): void {
  g.now = s.now;
  g.status = s.status;
  g.mode = s.mode ?? 'combine';
  g.wave = s.wave;
  g.lives = s.lives;
  g.essence = s.essence;
  g.pendingBossId = s.pendingBossId ?? 0;
  g.trackSide = s.trackSide === 'B' ? 'B' : 'A';
  g.typeLevels = { ...g.typeLevels, ...(s.typeLevels ?? {}) } as Record<OrbType, number>;

  const cells = Array.from({ length: COLS * ROWS }, (_, i) => {
    const o = s.grid?.[i];
    return o && typeof o === 'object' ? (o as OrbState) : null;
  });
  g.grid = cells;

  g.enemies = (s.enemies ?? []).map((e) => ({
    ...e,
    dots: e.dots ?? [],
    marks: e.marks ?? [],
  }));
  g.puddles = s.puddles ?? [];
  g.projs = (s.projs ?? []).map((p) => ({ ...p, trail: p.trail ?? [] }));
  g.needles = s.needles ?? [];
  g.parts = [];
}
