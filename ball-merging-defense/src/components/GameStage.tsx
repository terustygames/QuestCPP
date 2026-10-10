// ============================================================
// ИГРОВОЕ ПОЛЕ. Один <canvas> вместо сотен DOM-узлов:
// React перестал перерисовывать сцену 60 раз в секунду —
// это главный источник производительности на телефоне.
// Управление:
//   тап по шарику — выбор, тап по соседу — выстрел-слияние
//   перетаскивание шарика на соседа — выстрел-слияние
//   долгое нажатие на шарик — улучшение (за эссенцию)
//   тап по пустой клетке — поставить шарик (бесплатно)
//   ПКМ на десктопе — продать шарик
// ============================================================

import { useEffect, useRef } from 'react';
import {
  STAGE_W,
  STAGE_H,
  CELL,
  COLS,
  ROWS,
  TRACK,
  PERIMETER,
  LEAK_AT,
  BOSS_DEFS,
  CONFIG,
  cellXY,
  cellC,
  isAdj,
  pathPoint,
  TYPE_INFO,
  type BossId,
  type OrbType,
} from '../game/config';
import type { Engine } from '../game/engine';

const SPAWN_POS = pathPoint(0);
const EXIT_POS = pathPoint(LEAK_AT);

// ---------- Кеш спрайтов (рисуем один раз, потом только drawImage) ----------

type SpriteMap = Record<OrbType, HTMLCanvasElement>;
let orbSprites: SpriteMap | null = null;

// Небольшой знак на шарике, чтобы десять типов было различать
function drawOrbMark(x: CanvasRenderingContext2D, type: OrbType, cx: number, cy: number) {
  x.save();
  x.translate(cx, cy);
  x.strokeStyle = 'rgba(255,255,255,0.8)';
  x.fillStyle = 'rgba(255,255,255,0.8)';
  x.lineWidth = 3;
  x.lineCap = 'round';
  const R = 15;
  switch (type) {
    case 'ice': // снежинка: три перекрещенные линии
      for (let k = 0; k < 3; k++) {
        const a = (Math.PI / 3) * k;
        x.beginPath();
        x.moveTo(Math.cos(a) * R, Math.sin(a) * R);
        x.lineTo(-Math.cos(a) * R, -Math.sin(a) * R);
        x.stroke();
      }
      break;
    case 'bolt': // молния
      x.beginPath();
      x.moveTo(3, -R);
      x.lineTo(-6, 2);
      x.lineTo(1, 2);
      x.lineTo(-3, R);
      x.stroke();
      break;
    case 'poison': // капля
      x.beginPath();
      x.moveTo(0, -R);
      x.quadraticCurveTo(R * 0.9, R * 0.3, 0, R * 0.8);
      x.quadraticCurveTo(-R * 0.9, R * 0.3, 0, -R);
      x.stroke();
      break;
    case 'nova': // четырёхлучевая звезда
      for (let k = 0; k < 4; k++) {
        const a = (Math.PI / 2) * k - Math.PI / 2;
        x.beginPath();
        x.moveTo(0, 0);
        x.lineTo(Math.cos(a) * R * 1.25, Math.sin(a) * R * 1.25);
        x.stroke();
      }
      x.beginPath();
      x.arc(0, 0, 4, 0, Math.PI * 2);
      x.fill();
      break;
    case 'stun': // звездочка (сдвинутые перекрещенные линии)
      for (let k = 0; k < 3; k++) {
        const a = (Math.PI / 3) * k + Math.PI / 6;
        x.beginPath();
        x.moveTo(Math.cos(a) * R, Math.sin(a) * R);
        x.lineTo(-Math.cos(a) * R, -Math.sin(a) * R);
        x.stroke();
      }
      break;
    case 'pierce': // стрелка вверх
      x.beginPath();
      x.moveTo(0, R);
      x.lineTo(0, -R);
      x.moveTo(-7, -R + 8);
      x.lineTo(0, -R);
      x.lineTo(7, -R + 8);
      x.stroke();
      break;
    case 'vampire': // два клыка
      x.beginPath();
      x.moveTo(-8, -4);
      x.lineTo(-2, -4);
      x.lineTo(-5, 8);
      x.closePath();
      x.fill();
      x.beginPath();
      x.moveTo(2, -4);
      x.lineTo(8, -4);
      x.lineTo(5, 8);
      x.closePath();
      x.fill();
      break;
    case 'barrage': // три точки
      {
        const pts: [number, number][] = [[0, -R * 0.8], [-R * 0.7, R * 0.5], [R * 0.7, R * 0.5]];
        for (const [px, py] of pts) {
          x.beginPath();
          x.arc(px, py, 3.4, 0, Math.PI * 2);
          x.fill();
        }
      }
      break;
    default: // огонь и шипастый — без знака
      break;
  }
  x.restore();
}

// Плоский "наклейка-шарик": однотонный круг с тёмной кромкой
// и знаком типа. Без градиентов и свечения — как в референсе.
function makeOrbSprite(color: string, dark: string, _glow: string, type: OrbType): HTMLCanvasElement {
  const S = 128;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const x = c.getContext('2d')!;
  const cx = S / 2;
  const r = 46;
  // тёмная кромка чуть больше тела
  x.fillStyle = dark;
  x.beginPath();
  x.arc(cx, cx, r, 0, Math.PI * 2);
  x.fill();
  // однотонное тело
  x.fillStyle = color;
  x.beginPath();
  x.arc(cx, cx, r - 5, 0, Math.PI * 2);
  x.fill();
  // знак типа (у десяти типов свои метки)
  drawOrbMark(x, type, cx, cx);
  return c;
}

function getOrbSprites(): SpriteMap {
  if (!orbSprites) {
    const m = {} as SpriteMap;
    (Object.keys(TYPE_INFO) as OrbType[]).forEach((t) => {
      m[t] = makeOrbSprite(TYPE_INFO[t].color, TYPE_INFO[t].dark, TYPE_INFO[t].glow, t);
    });
    orbSprites = m;
  }
  return orbSprites;
}

// Фон (фон + сетка + трасса) рисуется в отдельный слой один раз,
// на каждый кадр его просто копируем.
let staticLayer: HTMLCanvasElement | null = null;
let staticW = 0;
let staticH = 0;

function roundedRect(x: CanvasRenderingContext2D, px: number, py: number, w: number, h: number, r: number) {
  x.beginPath();
  x.roundRect(px, py, w, h, r);
}

function buildStaticLayer(w: number, h: number) {
  staticLayer = document.createElement('canvas');
  staticLayer.width = w;
  staticLayer.height = h;
  staticW = w;
  staticH = h;
  const x = staticLayer.getContext('2d')!;
  const s = w / STAGE_W;
  x.setTransform(s, 0, 0, s, 0, 0);

  // плоский фон (без градиентов, сетки и виньетки)
  x.fillStyle = '#161b2c';
  x.fillRect(0, 0, STAGE_W, STAGE_H);

  // ТРАССА — плоская дорожка: два цвета, без свечения
  const t = TRACK;
  const trackPath = () => {
    x.beginPath();
    x.roundRect(t.x0, t.y0, t.x1 - t.x0, t.y1 - t.y0, t.r);
  };
  trackPath();
  x.strokeStyle = '#10141f';
  x.lineWidth = 32;
  x.lineJoin = 'round';
  x.stroke();
  trackPath();
  x.strokeStyle = '#232a40';
  x.lineWidth = 26;
  x.stroke();
}

// ---------- Вспомогательные функции рисования ----------

function drawChevrons(x: CanvasRenderingContext2D, vnow: number) {
  // Бегущие стрелки направления — единственная анимация трассы
  const n = 8;
  const step = PERIMETER / n;
  const off = (vnow * 26) % step;
  x.fillStyle = 'rgba(148,180,255,0.30)';
  for (let i = 0; i < n; i++) {
    const p = pathPoint(i * step + off);
    const a = Math.atan2(p.ty, p.tx);
    x.save();
    x.translate(p.x, p.y);
    x.rotate(a);
    x.beginPath();
    x.moveTo(5, 0);
    x.lineTo(-5, -5.5);
    x.lineTo(-2.5, 0);
    x.lineTo(-5, 5.5);
    x.closePath();
    x.fill();
    x.restore();
  }
}

function drawBeacon(x: CanvasRenderingContext2D, px: number, py: number, color: string, vnow: number, phase: number) {
  const pulse = (Math.sin(vnow * 2.6 + phase) + 1) / 2;
  x.fillStyle = color;
  x.beginPath();
  x.arc(px, py, 6.5, 0, Math.PI * 2);
  x.fill();
  x.strokeStyle = color;
  x.globalAlpha = 0.5 * (1 - pulse);
  x.lineWidth = 2;
  x.beginPath();
  x.arc(px, py, 8 + pulse * 9, 0, Math.PI * 2);
  x.stroke();
  x.globalAlpha = 1;
}

function drawChip(x: CanvasRenderingContext2D, cx: number, cy: number, text: string, color: string) {
  x.font = '600 13px Manrope, system-ui, sans-serif';
  const w = x.measureText(text).width + 26;
  const h = 28;
  roundedRect(x, cx - w / 2, cy - h / 2, w, h, 14);
  x.fillStyle = 'rgba(15,23,42,0.78)';
  x.fill();
  x.strokeStyle = 'rgba(255,255,255,0.10)';
  x.lineWidth = 1;
  x.stroke();
  x.fillStyle = color;
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillText(text, cx, cy + 1);
}

function drawBanner(x: CanvasRenderingContext2D, g: Engine) {
  if (!g.banner || g.now >= g.bannerUntil) return;
  x.font = '700 17px Unbounded, Manrope, system-ui, sans-serif';
  const w = x.measureText(g.banner).width + 40;
  const cx = STAGE_W / 2;
  const cy = 108;
  roundedRect(x, cx - w / 2, cy - 21, w, 42, 16);
  x.fillStyle = '#1e293b';
  x.fill();
  x.strokeStyle = 'rgba(255,255,255,0.20)';
  x.lineWidth = 1;
  x.stroke();
  x.fillStyle = '#ffffff';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillText(g.banner, cx, cy + 1);
}

// ---------- Эффекты ввода (для подсветок на канвасе) ----------
export interface StageFx {
  lpCell: number; // клетка под долгим нажатием (улучшение)
  lpProgress: number; // 0..1
  dragFrom: number; // клетка, откуда тащат
  dragHover: number; // клетка, на которой сейчас палец
  placeHover: number; // пустая клетка под пальцем (можно поставить)
}

// ---------- Главный рендер кадра ----------
function drawScene(
  x: CanvasRenderingContext2D,
  g: Engine,
  vnow: number,
  fx: StageFx | null,
) {
  x.setTransform(staticW / STAGE_W, 0, 0, staticH / STAGE_H, 0, 0);

  // фон + сетка + трасса
  if (staticLayer && staticW === x.canvas.width && staticH === x.canvas.height) {
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.drawImage(staticLayer, 0, 0);
    x.setTransform(staticW / STAGE_W, 0, 0, staticH / STAGE_H, 0, 0);
  } else {
    x.fillStyle = '#161b2c';
    x.fillRect(0, 0, STAGE_W, STAGE_H);
  }

  drawChevrons(x, vnow);
  drawBeacon(x, SPAWN_POS.x, SPAWN_POS.y, '#22c55e', vnow, 0);
  drawBeacon(x, EXIT_POS.x, EXIT_POS.y, '#ef4444', vnow, 1.7);

  const active = g.status === 'prep' || g.status === 'wave';
  const sel = g.sel;

  // --- клетки ---
  for (let i = 0; i < g.grid.length; i++) {
    const { x: px, y: py } = cellXY(i);
    const shaking = g.shakeCell === i && g.now < g.shakeUntil;
    const ox = shaking ? Math.sin(vnow * 60) * 4 : 0;
    const has = !!g.grid[i];
    const isSel = sel === i;
    const isLink = sel !== null && sel !== i && has && isAdj(sel, i);
    const isPlace = fx?.placeHover === i;

    const ccx = px + ox + CELL / 2;
    const ccy = py + CELL / 2;
    if (!has) {
      // пустая клетка: почти незаметная пунктирная рамка,
      // подсветка только под пальцем
      roundedRect(x, px + ox, py, CELL, CELL, 16);
      if (isPlace) {
        x.fillStyle = 'rgba(255,255,255,0.06)';
        x.fill();
      }
      x.setLineDash([7, 7]);
      x.strokeStyle = isPlace
        ? 'rgba(255,255,255,0.55)'
        : active
          ? 'rgba(255,255,255,0.10)'
          : 'rgba(255,255,255,0.06)';
      x.lineWidth = isPlace ? 2.5 : 1.5;
      x.stroke();
      x.setLineDash([]);
    }

    // выделение и связь — плоские кольца вокруг шарика
    if (isLink) {
      const a = 0.55 + 0.2 * Math.sin(vnow * 5);
      x.strokeStyle = `rgba(125,211,252,${a.toFixed(3)})`;
      x.lineWidth = 2;
      x.beginPath();
      x.arc(ccx, ccy, 41, 0, Math.PI * 2);
      x.stroke();
    }
    if (isSel) {
      x.strokeStyle = 'rgba(255,255,255,0.95)';
      x.lineWidth = 3;
      x.beginPath();
      x.arc(ccx, ccy, 41, 0, Math.PI * 2);
      x.stroke();
    }
  }

  // --- шарики ---
  const sprites = getOrbSprites();
  for (let i = 0; i < g.grid.length; i++) {
    const o = g.grid[i];
    if (!o) continue;
    const c = cellC(i);
    // анимация появления: шарик вырастает из нуля
    const sinceBorn = g.now - o.bornAt;
    let scale = 1;
    if (sinceBorn < 0) scale = 0.35; // ещё не время (каскад старта)
    else if (sinceBorn < 0.18) scale = 0.35 + (sinceBorn / 0.18) * 0.65;
    const box = 96 * scale;
    x.drawImage(sprites[o.type], c.x - box / 2, c.y - box / 2, box, box);

    // шипы у шипастого
    if (o.type === 'spiky') {
      const rot = vnow * 0.5;
      x.fillStyle = 'rgba(177,108,255,0.9)';
      for (let k = 0; k < 12; k++) {
        const a = rot + (Math.PI * 2 * k) / 12;
        x.save();
        x.translate(c.x + Math.cos(a) * 38, c.y + Math.sin(a) * 38);
        x.rotate(a);
        x.beginPath();
        x.moveTo(9, 0);
        x.lineTo(-4, -4.5);
        x.lineTo(-4, 4.5);
        x.closePath();
        x.fill();
        x.restore();
      }
    }

    // заряженный (2+): плоское жёлтое кольцо
    if (o.level > 1) {
      x.strokeStyle = 'rgba(251,191,36,0.85)';
      x.lineWidth = 2 + Math.min(3, o.level - 1);
      x.beginPath();
      x.arc(c.x, c.y, 27, 0, Math.PI * 2);
      x.stroke();
      // в режиме накопления подсвечиваем то, что лопнет
      if (g.mode === 'accumulate') {
        const a = 0.35 + 0.25 * Math.sin(vnow * 4);
        x.strokeStyle = `rgba(251,191,36,${a.toFixed(3)})`;
        x.lineWidth = 2;
        x.beginPath();
        x.arc(c.x, c.y, 33, 0, Math.PI * 2);
        x.stroke();
      }
      // бейдж уровня заряда
      x.font = '800 12px Manrope, system-ui, sans-serif';
      const label = `${o.level}`;
      const bw = x.measureText(label).width + 10;
      roundedRect(x, c.x + 16, c.y - 38, bw, 18, 9);
      x.fillStyle = 'rgba(0,0,0,0.75)';
      x.fill();
      x.strokeStyle = 'rgba(255,255,255,0.3)';
      x.lineWidth = 1;
      x.stroke();
      x.fillStyle = '#ffffff';
      x.textAlign = 'center';
      x.textBaseline = 'middle';
      x.fillText(label, c.x + 16 + bw / 2, c.y - 28.5);
    }

    // перезарядка
    const cd = Math.max(0, o.cdUntil - g.now);
    if (cd > 0) {
      const pct = cd / CONFIG.cooldown;
      x.fillStyle = 'rgba(3,7,18,0.72)';
      x.beginPath();
      x.moveTo(c.x, c.y);
      x.arc(c.x, c.y, 35, -Math.PI / 2, -Math.PI / 2 + pct * Math.PI * 2);
      x.closePath();
      x.fill();
    }

    // прогресс долгого нажатия (улучшение) и подпись стоимости
    if (fx && fx.lpCell === i && fx.lpProgress > 0) {
      x.strokeStyle = 'rgba(251,191,36,0.95)';
      x.lineWidth = 4;
      x.beginPath();
      x.arc(c.x, c.y, 40, -Math.PI / 2, -Math.PI / 2 + fx.lpProgress * Math.PI * 2);
      x.stroke();
      if (fx.lpProgress > 0.25) {
        const lvl = g.upgradeLevel;
        const label =
          lvl >= g.wave
            ? `Лимит улучшений: ${g.wave} (номер волны)`
            : `Улучшение: ${CONFIG.upgradeCostBase * (lvl + 1)} эссенции (все шарики)`;
        x.font = '700 13px Manrope, system-ui, sans-serif';
        const bw = x.measureText(label).width + 18;
        roundedRect(x, c.x - bw / 2, c.y - 62, bw, 22, 11);
        x.fillStyle = 'rgba(0,0,0,0.8)';
        x.fill();
        x.strokeStyle = 'rgba(251,191,36,0.5)';
        x.lineWidth = 1;
        x.stroke();
        x.fillStyle = '#fcd34d';
        x.textAlign = 'center';
        x.textBaseline = 'middle';
        x.fillText(label, c.x, c.y - 51);
      }
    }
  }

  // --- линия перетаскивания ---
  if (fx && fx.dragFrom !== -1 && fx.dragHover !== -1) {
    const a = cellC(fx.dragFrom);
    const b = cellC(fx.dragHover);
    x.strokeStyle = 'rgba(34,211,238,0.8)';
    x.lineWidth = 4;
    x.lineCap = 'round';
    x.beginPath();
    x.moveTo(a.x, a.y);
    x.lineTo(b.x, b.y);
    x.stroke();
  }

  // --- враги ---
  for (const e of g.enemies) {
    const pos = pathPoint(e.p);
    const wob = Math.sin(e.id * 1.7 + e.p * 0.02) * 5;
    const ex = pos.x - pos.ty * wob;
    const ey = pos.y + pos.tx * wob;
    const r = e.radius;
    const flash = g.now < e.flashUntil;

    // плоское тело: однотонный круг с тёмной кромкой
    const def = e.boss ? BOSS_DEFS[(e.bossId || 1) as BossId] : null;
    x.fillStyle = def ? def.dark : '#2b3548';
    x.beginPath();
    x.arc(ex, ey, r, 0, Math.PI * 2);
    x.fill();
    x.fillStyle = def ? def.color : '#5c6b85';
    x.beginPath();
    x.arc(ex, ey, r - 2.5, 0, Math.PI * 2);
    x.fill();

    if (g.now < e.slowUntil) {
      x.strokeStyle = 'rgba(70,200,255,0.85)';
      x.lineWidth = 2;
      x.beginPath();
      x.arc(ex, ey, r + 3, 0, Math.PI * 2);
      x.stroke();
    }
    if (g.now < e.stunUntil) {
      // паралич: жёлтое кольцо
      x.strokeStyle = 'rgba(255,176,32,0.95)';
      x.lineWidth = 2.5;
      x.setLineDash([6, 5]);
      x.beginPath();
      x.arc(ex, ey, r + 5, vnow * 2, vnow * 2 + Math.PI * 2);
      x.stroke();
      x.setLineDash([]);
    }
    if (e.dots.length) {
      x.strokeStyle = 'rgba(74,222,128,0.75)';
      x.lineWidth = 2;
      x.beginPath();
      x.arc(ex, ey, r + 6, 0, Math.PI * 2);
      x.stroke();
    }
    if (flash) {
      x.fillStyle = 'rgba(255,255,255,0.7)';
      x.beginPath();
      x.arc(ex, ey, r, 0, Math.PI * 2);
      x.fill();
    }

    // глаза (смотрят по ходу движения)
    x.fillStyle = 'rgba(0,0,0,0.8)';
    const fxo = pos.tx * r * 0.25;
    const fyo = pos.ty * r * 0.25;
    x.beginPath();
    x.arc(ex - r * 0.3 + fxo, ey - r * 0.15 + fyo, 2.6, 0, Math.PI * 2);
    x.arc(ex + r * 0.3 + fxo, ey - r * 0.15 + fyo, 2.6, 0, Math.PI * 2);
    x.fill();

    // полоска здоровья
    const bw = e.boss ? 46 : 28;
    const pct = Math.max(0, e.hp / e.maxHp);
    x.fillStyle = 'rgba(0,0,0,0.6)';
    roundedRect(x, ex - bw / 2, ey - r - 11, bw, 4, 2);
    x.fill();
    x.fillStyle = pct > 0.5 ? '#4ade80' : pct > 0.25 ? '#facc15' : '#ef4444';
    if (pct > 0) {
      roundedRect(x, ex - bw / 2, ey - r - 11, bw * pct, 4, 2);
      x.fill();
    }
    // имя босса над полоской здоровья
    if (e.boss && def) {
      x.font = '800 11px Manrope, system-ui, sans-serif';
      x.textAlign = 'center';
      x.textBaseline = 'alphabetic';
      x.fillStyle = 'rgba(0,0,0,0.55)';
      x.fillText(def.name, ex + 1, ey - r - 17);
      x.fillStyle = def.color;
      x.fillText(def.name, ex, ey - r - 18);
    }
  }

  // --- иглы ---
  for (const n of g.needles) {
    const dx = Math.cos(n.ang) * 14;
    const dy = Math.sin(n.ang) * 14;
    x.lineCap = 'round';
    x.strokeStyle = 'rgba(168,85,247,0.28)';
    x.lineWidth = 9;
    x.beginPath();
    x.moveTo(n.x - dx, n.y - dy);
    x.lineTo(n.x + dx, n.y + dy);
    x.stroke();
    x.strokeStyle = 'rgba(233,213,255,0.95)';
    x.lineWidth = 3;
    x.beginPath();
    x.moveTo(n.x - dx, n.y - dy);
    x.lineTo(n.x + dx, n.y + dy);
    x.stroke();
  }

  // --- снаряды ---
  for (const p of g.projs) {
    const info = TYPE_INFO[p.kind];
    const sp = Math.hypot(p.vx, p.vy) || 1;
    const nx = -p.vy / sp;
    const ny = p.vx / sp;
    // шлейф
    for (let k = 0; k < Math.min(4, p.trail.length); k++) {
      const tp = p.trail[k];
      x.globalAlpha = 0.28 - k * 0.055;
      x.fillStyle = info.color;
      x.beginPath();
      x.arc(tp.x, tp.y, 3.6 - k * 0.55, 0, Math.PI * 2);
      x.fill();
    }
    x.globalAlpha = 1;
    // плоская голова с лёгким вилянием
    const off = Math.sin(p.age * 9 + p.seed) * 4;
    const hx = p.x + nx * off;
    const hy = p.y + ny * off;
    x.fillStyle = info.dark;
    x.beginPath();
    x.arc(hx, hy, 6, 0, Math.PI * 2);
    x.fill();
    x.fillStyle = info.color;
    x.beginPath();
    x.arc(hx, hy, 4.5, 0, Math.PI * 2);
    x.fill();
  }

  // --- частицы ---
  for (const pt of g.parts) {
    const t = 1 - pt.life / pt.maxLife;
    if (pt.kind === 'spark') {
      x.globalAlpha = pt.life / pt.maxLife;
      x.fillStyle = pt.color;
      x.beginPath();
      x.arc(pt.x, pt.y, pt.size / 2, 0, Math.PI * 2);
      x.fill();
    } else if (pt.kind === 'ring') {
      const s = 10 + pt.size * t;
      x.globalAlpha = 1 - t;
      x.strokeStyle = pt.color;
      x.lineWidth = 2;
      x.beginPath();
      x.arc(pt.x, pt.y, s / 2, 0, Math.PI * 2);
      x.stroke();
    } else if (pt.kind === 'text') {
      x.globalAlpha = 1 - t;
      x.font = '800 14px Manrope, system-ui, sans-serif';
      x.textAlign = 'center';
      x.textBaseline = 'middle';
      x.fillStyle = pt.color;
      x.fillText(pt.text, pt.x, pt.y - 26 * t);
    } else {
      const len = Math.hypot(pt.x2 - pt.x, pt.y2 - pt.y);
      const ang = Math.atan2(pt.y2 - pt.y, pt.x2 - pt.x);
      x.globalAlpha = (1 - t) * 0.9;
      x.strokeStyle = pt.color;
      x.lineWidth = 3;
      x.lineCap = 'round';
      x.beginPath();
      x.moveTo(pt.x, pt.y);
      x.lineTo(pt.x + Math.cos(ang) * len, pt.y + Math.sin(ang) * len);
      x.stroke();
    }
  }
  x.globalAlpha = 1;

  // --- вспышка детонации / урон ---
  const detLeft = g.detonateFlashUntil - g.now;
  if (detLeft > 0) {
    const a = (detLeft / 0.35) * 0.3;
    const fg = x.createRadialGradient(STAGE_W / 2, STAGE_H / 2, 40, STAGE_W / 2, STAGE_H / 2, STAGE_H * 0.55);
    fg.addColorStop(0, `rgba(255,190,80,${a.toFixed(3)})`);
    fg.addColorStop(1, 'rgba(255,190,80,0)');
    x.fillStyle = fg;
    x.fillRect(0, 0, STAGE_W, STAGE_H);
  }
  const hurtLeft = g.hurtUntil - g.now;
  if (hurtLeft > 0) {
    const a = (hurtLeft / 0.35) * 0.5;
    const hg = x.createRadialGradient(STAGE_W / 2, STAGE_H / 2, STAGE_H * 0.28, STAGE_W / 2, STAGE_H / 2, STAGE_H * 0.62);
    hg.addColorStop(0, 'rgba(239,68,68,0)');
    hg.addColorStop(1, `rgba(239,68,68,${a.toFixed(3)})`);
    x.fillStyle = hg;
    x.fillRect(0, 0, STAGE_W, STAGE_H);
  }

  // --- компактный статус (без лишних надписей) ---
  if (g.status === 'prep') {
    const secs = Math.max(0, Math.ceil(g.prepUntil - g.now));
    drawChip(x, STAGE_W / 2, 44, `До волны ${g.wave}: ${secs} с`, '#fcd34d');
    const bossName = g.nextWaveBoss && g.pendingBossId ? BOSS_DEFS[g.pendingBossId as BossId].name : '';
    drawChip(
      x,
      STAGE_W / 2,
      STAGE_H - 46,
      g.nextWaveBoss
        ? `Следующая волна: босс ${bossName}, врагов ${g.nextWaveSize}`
        : `Следующая волна: врагов ${g.nextWaveSize}`,
      g.nextWaveBoss ? '#f0abfc' : '#94a3b8',
    );
  } else if (g.status === 'wave') {
    const bossOnField = g.enemies.some((e) => e.boss);
    drawChip(
      x,
      STAGE_W / 2,
      44,
      bossOnField ? `Врагов: ${g.enemiesLeft}, босс на поле` : `Врагов: ${g.enemiesLeft}`,
      '#fda4af',
    );
  }

  drawBanner(x, g);
}

// ---------- Компонент ----------

interface Gesture {
  pointerId: number;
  cell: number; // клетка, где начался жест
  sx: number;
  sy: number;
  moved: boolean;
  drag: boolean; // тащим с шариком
  hover: number; // клетка под пальцем (для drag)
  lpTimer: number | null;
  lpStart: number;
  done: boolean;
}

const LP_TIME = 0.48; // сек, удержание = улучшение
const MOVE_TOL = 16; // логических px, после этого жест считается движением

export function GameStage({
  g,
  paused,
  speed,
  helpOpen,
  onCellTap,
  onEmptyTap,
  onDragPair,
  onUpgrade,
  onSell,
}: {
  g: Engine;
  paused: boolean;
  speed: number;
  helpOpen: boolean;
  onCellTap: (i: number) => void;
  onEmptyTap: (i: number) => void;
  onDragPair: (a: number, b: number) => void;
  onUpgrade: (i: number) => void;
  onSell: (i: number) => void;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const fxRef = useRef<StageFx | null>(null);

  // пауза/скорость/справка читаются в цикле через ref
  const pausedRef = useRef(paused);
  const speedRef = useRef(speed);
  const helpRef = useRef(helpOpen);
  pausedRef.current = paused;
  speedRef.current = speed;
  helpRef.current = helpOpen;

  // Игровой цикл + отрисовка (вне React)
  useEffect(() => {
    const el = wrap.current;
    const cv = canvas.current;
    if (!el || !cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    const dpr = () => Math.min(2, window.devicePixelRatio || 1);
    const fit = () => {
      const cw = el.clientWidth;
      const ch = el.clientHeight;
      if (cw < 10 || ch < 10) return;
      const s = Math.min(cw / STAGE_W, ch / STAGE_H);
      const w = Math.max(1, Math.floor(STAGE_W * s));
      const h = Math.max(1, Math.floor(STAGE_H * s));
      const d = dpr();
      cv.style.width = `${w}px`;
      cv.style.height = `${h}px`;
      cv.width = Math.round(w * d);
      cv.height = Math.round(h * d);
      buildStaticLayer(cv.width, cv.height);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);

    let raf = 0;
    let last = performance.now();
    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      const active = g.status === 'prep' || g.status === 'wave';
      if (active && !pausedRef.current && !helpRef.current) g.step(dt * speedRef.current);

      // эффекты ввода (подсветки под пальцем)
      const gs = gesture.current;
      if (gs && !gs.done) {
        if (gs.drag && gs.moved) {
          // перетаскивание шарика
          fxRef.current = {
            lpCell: -1,
            lpProgress: 0,
            dragFrom: gs.cell,
            dragHover: gs.hover,
            placeHover: -1,
          };
        } else if (gs.drag && !gs.moved) {
          // удерживаем шарик — кольцо прогресса улучшения
          const pr = (performance.now() - gs.lpStart) / (LP_TIME * 1000);
          fxRef.current = {
            lpCell: gs.cell,
            lpProgress: Math.min(1, pr),
            dragFrom: -1,
            dragHover: -1,
            placeHover: -1,
          };
        } else if (!gs.drag && !gs.moved) {
          // держим палец на пустой клетке — подсветка «поставить сюда»
          fxRef.current = {
            lpCell: -1,
            lpProgress: 0,
            dragFrom: -1,
            dragHover: -1,
            placeHover: g.grid[gs.cell] ? -1 : gs.cell,
          };
        } else {
          fxRef.current = null;
        }
      } else {
        fxRef.current = null;
      }

      ctx.clearRect(0, 0, cv.width, cv.height);
      drawScene(ctx, g, t / 1000, fxRef.current);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [g]);

  // --- преобразование координат (pointer и mouse события) ---
  const toStage = (e: { clientX: number; clientY: number }) => {
    const cv = canvas.current!;
    const r = cv.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * STAGE_W,
      y: ((e.clientY - r.top) / r.height) * STAGE_H,
    };
  };

  const cellAt = (x: number, y: number) => {
    for (let i = 0; i < COLS * ROWS; i++) {
      const { x: px, y: py } = cellXY(i);
      if (x >= px && x < px + CELL && y >= py && y < py + CELL) return i;
    }
    return -1;
  };

  const clearLp = (gs: Gesture) => {
    if (gs.lpTimer !== null) {
      window.clearTimeout(gs.lpTimer);
      gs.lpTimer = null;
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (gesture.current) return; // один палец
    if (e.pointerType === 'mouse' && e.button !== 0) return; // только левая кнопка (ПКМ = продажа)
    const p = toStage(e);
    const i = cellAt(p.x, p.y);
    if (i < 0) return;
    canvas.current?.setPointerCapture(e.pointerId);
    const hasOrb = !!g.grid[i];
    const gs: Gesture = {
      pointerId: e.pointerId,
      cell: i,
      sx: p.x,
      sy: p.y,
      moved: false,
      drag: false,
      hover: -1,
      lpTimer: null,
      lpStart: performance.now(),
      done: false,
    };
    // Тап по соседу уже выбранного — немедленное действие (быстрый отклик)
    if (hasOrb && g.sel !== null && g.sel !== i && isAdj(g.sel, i)) {
      onCellTap(i);
      gesture.current = null;
      return;
    }
    if (hasOrb) {
      gs.drag = true;
      gs.lpTimer = window.setTimeout(() => {
        if (gesture.current === gs && !gs.moved) {
          gs.done = true;
          onUpgrade(i);
        }
      }, LP_TIME * 1000);
    }
    gesture.current = gs;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const gs = gesture.current;
    if (!gs || e.pointerId !== gs.pointerId) return;
    const p = toStage(e);
    if (Math.hypot(p.x - gs.sx, p.y - gs.sy) > MOVE_TOL) {
      gs.moved = true;
      if (gs.lpTimer !== null) {
        window.clearTimeout(gs.lpTimer);
        gs.lpTimer = null;
      }
    }
    if (gs.drag) {
      const h = cellAt(p.x, p.y);
      // подсвечиваем только соседнюю клетку с шариком
      gs.hover = h !== -1 && h !== gs.cell && isAdj(gs.cell, h) && g.grid[h] ? h : -1;
    }
  };

  const finish = (e: React.PointerEvent, act: boolean) => {
    const gs = gesture.current;
    if (!gs || e.pointerId !== gs.pointerId) return;
    clearLp(gs);
    gesture.current = null;
    if (!act || gs.done) return;
    const i = gs.cell;
    if (gs.drag) {
      if (gs.moved && gs.hover !== -1) {
        onDragPair(gs.cell, gs.hover);
        return;
      }
      if (!gs.moved) {
        onCellTap(i); // обычный тап: выбор / смена выбора
        return;
      }
      // тащили, но никуда не попали — отменяем
      return;
    }
    // пустая клетка: короткий тап = поставить шарик сюда (бесплатно)
    if (!gs.moved) onEmptyTap(i);
  };

  return (
    <div ref={wrap} className="flex h-full w-full items-center justify-center overflow-hidden">
      <canvas
        ref={canvas}
        className="block select-none rounded-3xl border border-white/10"
        style={{ touchAction: 'none', cursor: 'pointer' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(e) => finish(e, true)}
        onPointerCancel={(e) => finish(e, false)}
        // ПКМ на десктопе = продажа (на телефоне продажи нет, поле заполняется само)
        onContextMenu={(e) => {
          e.preventDefault();
          const p = toStage(e);
          const i = cellAt(p.x, p.y);
          if (i >= 0 && g.grid[i]) onSell(i);
        }}
      />
    </div>
  );
}
