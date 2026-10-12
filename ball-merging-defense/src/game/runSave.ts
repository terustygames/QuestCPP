// Сохранение текущего матча в браузере: чтобы обновление страницы ничего не сбрасывало.
// Сохраняется состояние движка (поле, волна, жизни, эссенция, враги) и данные комнаты (для кооператива).
// Мета-прогресс (монеты, колода, деревья) сохраняется отдельно (meta.ts и облако).
import { Engine } from './engine';

const KEY = 'orbital.run.v1';

export interface SavedRun {
  v: 1;
  kind: 'solo' | 'coop';
  code?: string; // код комнаты (кооператив)
  uid?: string; // мой uid (кооператив)
  engine: string; // JSON состояния движка
  savedAt: number;
}

// Движок -> JSON. Set сохраняется как { __set: [...] }, функции и визуальные частицы не сохраняются.
export function serializeEngine(e: Engine): string {
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(e)) {
    if (k === 'onEvent' || k === 'parts') continue;
    const v = (e as unknown as Record<string, unknown>)[k];
    if (typeof v === 'function') continue;
    out[k] = v;
  }
  return JSON.stringify(out, (_k, v) => (v instanceof Set ? { __set: [...v] } : v));
}

// JSON -> движок (поля из сохранения поверх нового движка)
export function restoreEngine(json: string): Engine {
  const data = JSON.parse(json, (_k, v) =>
    v && typeof v === 'object' && Array.isArray((v as { __set?: unknown }).__set) && Object.keys(v).length === 1
      ? new Set((v as { __set: unknown[] }).__set)
      : v,
  ) as Record<string, unknown>;
  const e = new Engine();
  const target = e as unknown as Record<string, unknown>;
  for (const k of Object.keys(data)) target[k] = data[k];
  return e;
}

export function saveRun(run: SavedRun): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(run));
  } catch {
    // переполнено или закрыто хранилище — матч просто не сохранится
  }
}

export function loadRun(): SavedRun | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const run = JSON.parse(raw) as SavedRun;
    return run && run.v === 1 && typeof run.engine === 'string' ? run : null;
  } catch {
    return null;
  }
}

export function clearRun(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ничего
  }
}
