// Заряжающийся моб: чистые правила заряда и цвета (без DOM, чтобы проверять в Node).
// T (сек до полной зарядки) выбирается при создании моба; заряд растёт от времени жизни.

// Заряд 0..1: 0 — только появился, 1 — полностью заряжен. Обычный моб (chargeT ≤ 0) всегда 0.
export function chargeProgress(now: number, bornAt: number, chargeT: number): number {
  if (chargeT <= 0) return 0;
  return Math.max(0, Math.min(1, (now - bornAt) / chargeT));
}

// Цвета тела: серый (как у обычного моба) → сиреневый при полной зарядке.
const GRAY = { body: [0x5c, 0x6b, 0x85], dark: [0x2b, 0x35, 0x48] };
const LILAC = { body: [0xc0, 0x84, 0xfc], dark: [0x6b, 0x21, 0xa8] };

const mix = (a: number[], b: number[], t: number) =>
  `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',')})`;

export function chargeTint(level: number): { body: string; dark: string } {
  const t = Math.max(0, Math.min(1, level));
  return { body: mix(GRAY.body, LILAC.body, t), dark: mix(GRAY.dark, LILAC.dark, t) };
}
