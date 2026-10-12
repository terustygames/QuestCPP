// Снимок поля для кооператива: что нужно, чтобы нарисовать поле напарника.
// Публикуется в Realtime Database примерно 4 раза в секунду.
// Пустые клетки сетки кодируются числом 0 (RTDB не хранит null в массивах),
// пустые массивы RTDB не хранит вовсе, поэтому при чтении они восстанавливаются.

import type { Engine, EnemyState, OrbState, Puddle, Status, Mode } from './engine';
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
  grid: (OrbState | 0)[];
  enemies: EnemyState[];
  puddles: Puddle[];
}

export function snapshotOf(g: Engine): BoardSnapshot {
  return {
    now: g.now,
    status: g.status,
    mode: g.mode,
    wave: g.wave,
    lives: g.lives,
    essence: g.essence,
    pendingBossId: g.pendingBossId,
    typeLevels: { ...g.typeLevels },
    grid: g.grid.map((o) => (o ? { ...o } : 0)),
    enemies: g.enemies
      .filter((e) => !e.dead)
      .map((e) => ({ ...e, dots: e.dots.map((d) => ({ ...d })), marks: e.marks.map((m) => ({ ...m })) })),
    puddles: g.puddles.map((p) => ({ ...p })),
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
  g.projs = [];
  g.needles = [];
  g.parts = [];
}
