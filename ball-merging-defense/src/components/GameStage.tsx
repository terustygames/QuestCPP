// ============================================================
// ИГРОВОЕ ПОЛЕ. Один <canvas> вместо сотен DOM-узлов:
// React перестал перерисовывать сцену 60 раз в секунду —
// это главный источник производительности на телефоне.
// Управление:
//   тап по шарику — выбор, тап по соседу — выстрел-слияние
//   перетаскивание шарика на соседа — выстрел-слияние
//   тап по пустой клетке — поставить шарик (бесплатно)
//   улучшение — кликом по шарику в колоде внизу (за эссенцию), на поле не действует
// ============================================================

import { useEffect, useRef } from 'react';
import {
  STAGE_W,
  STAGE_H,
  CELL,
  COLS,
  ROWS,
  TRACK_PTS,
  PERIMETER,
  LEAK_AT,
  BOSS_DEFS,
  CONFIG,
  cellXY,
  cellC,
  isAdj,
  pathPoint,
  TYPE_INFO,
  accumMul,
  gasRadius,
  MINI_DEF,
  type BossId,
  type OrbType,
} from '../game/config';
import type { Engine, GasCloud, TrapState } from '../game/engine';
import { chargeTint } from '../game/charger';


// ---------- Кеш спрайтов (рисуем один раз, потом только drawImage) ----------

type SpriteMap = Record<OrbType, HTMLCanvasElement>;
let orbSprites: SpriteMap | null = null;

// Небольшой знак на шарике, чтобы десять типов было различать.
// Единый стиль: белая фигура на однотонном теле, размер ~30px.
function drawOrbMark(x: CanvasRenderingContext2D, type: OrbType, cx: number, cy: number) {
  x.save();
  x.translate(cx, cy);
  // усилитель — светлый шарик: знак рисуем тёмным, чтобы читался
  const ink = type === 'amp' ? 'rgba(15,23,42,0.92)' : 'rgba(255,255,255,0.88)';
  x.strokeStyle = ink;
  x.fillStyle = ink;
  x.lineWidth = 3;
  x.lineCap = 'round';
  x.lineJoin = 'round';
  const R = 15;
  switch (type) {
    case 'fire': // пламя (закруглённый силуэт)
      {
        const flame = new Path2D(
          'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z',
        );
        x.scale(1.6, 1.6);
        x.translate(-12, -12);
        x.fill(flame);
      }
      break;
    case 'ice': // снежинка: три перекрещенные линии и точка в центре
      for (let k = 0; k < 3; k++) {
        const a = (Math.PI / 3) * k;
        x.beginPath();
        x.moveTo(Math.cos(a) * R, Math.sin(a) * R);
        x.lineTo(-Math.cos(a) * R, -Math.sin(a) * R);
        x.stroke();
      }
      x.beginPath();
      x.arc(0, 0, 3, 0, Math.PI * 2);
      x.fill();
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
    case 'mark': // метка: прицел — кольцо и четыре засечки
      x.beginPath();
      x.arc(0, 0, R * 0.5, 0, Math.PI * 2);
      x.stroke();
      x.beginPath();
      x.moveTo(0, -R * 0.95);
      x.lineTo(0, -R * 0.35);
      x.moveTo(0, R * 0.35);
      x.lineTo(0, R * 0.95);
      x.moveTo(-R * 0.95, 0);
      x.lineTo(-R * 0.35, 0);
      x.moveTo(R * 0.35, 0);
      x.lineTo(R * 0.95, 0);
      x.stroke();
      break;
    case 'amp': // усилитель: точка и две дуги — «взмах звуком»
      x.beginPath();
      x.arc(-9, 0, 3.6, 0, Math.PI * 2);
      x.fill();
      for (const rr of [8, 15]) {
        x.beginPath();
        x.arc(-9, 0, rr, -Math.PI / 3, Math.PI / 3);
        x.stroke();
      }
      break;
    case 'mine': // мина: круг с шипами и точкой-лампочкой
      x.beginPath();
      x.arc(0, 0, R * 0.42, 0, Math.PI * 2);
      x.fill();
      for (let k = 0; k < 8; k++) {
        const a = (k * Math.PI) / 4;
        x.beginPath();
        x.moveTo(Math.cos(a) * R * 0.6, Math.sin(a) * R * 0.6);
        x.lineTo(Math.cos(a) * R * 0.95, Math.sin(a) * R * 0.95);
        x.stroke();
      }
      break;
    case 'bomb': // бомба: круг с фитилём
      x.beginPath();
      x.arc(-2, 2, R * 0.66, 0, Math.PI * 2);
      x.stroke();
      x.beginPath();
      x.moveTo(4, -6);
      x.quadraticCurveTo(8, -13, 14, -13);
      x.stroke();
      x.beginPath();
      x.arc(15, -13, 2.6, 0, Math.PI * 2);
      x.fill();
      break;
    case 'resonance': // резонанс: камертон — две ножки и дуги волны
      x.beginPath();
      x.moveTo(-6, -13);
      x.lineTo(-6, 8);
      x.moveTo(6, -13);
      x.lineTo(6, 8);
      x.stroke();
      x.beginPath();
      x.arc(0, -13, 6, Math.PI, 0);
      x.stroke();
      for (const rr of [13]) {
        x.beginPath();
        x.arc(0, 0, rr, -Math.PI / 3, Math.PI / 3);
        x.stroke();
      }
      break;
    case 'gas': // облако: три перекрывающихся круга
      for (const [px, py, rr] of [[-6, 2, 6], [5, -2, 7], [0, 6, 5]] as const) {
        x.beginPath();
        x.arc(px, py, rr, 0, Math.PI * 2);
        x.stroke();
      }
      break;
    default: // шипастый — без внутреннего знака (его знаки — внешние иглы)
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

// Спрайт шарика как картинка (для панели колоды в HUD).
// Кодируется один раз на тип — кадр не тратится на перекодировку.
const spriteUrlCache = new Map<OrbType, string>();
export function orbSpriteUrl(type: OrbType): string {
  let u = spriteUrlCache.get(type);
  if (!u) {
    u = getOrbSprites()[type].toDataURL();
    spriteUrlCache.set(type, u);
  }
  return u;
}

// ---------- Виды (как поле ложится на холст) ----------
// Холст в кооперативе: 640 × 1240. Сверху — поле напарника (зеркально по вертикали),
// снизу — моё поле. Линии трассы обоих полей сходятся на общей линии посередине.
interface View {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}
// одиночная игра: поле на весь холст
const VIEW_SOLO: View = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
// кооператив: своё поле внизу (без поворота)
const VIEW_OWN: View = { a: 1, b: 0, c: 0, d: 1, e: 0, f: STAGE_H };
// кооператив: поле напарника вверху, зеркально по вертикали (его спавн слева вверху)
const VIEW_REMOTE: View = { a: 1, b: 0, c: 0, d: -1, e: 0, f: STAGE_H };

// Текущий вид и масштаб: подписи (uText) рисуются прямо, независимо от зеркала
let CUR_VIEW: View = VIEW_SOLO;
let CUR_K = 1;

function setView(x: CanvasRenderingContext2D, v: View) {
  const k = x.canvas.width / STAGE_W;
  CUR_VIEW = v;
  CUR_K = k;
  x.setTransform(k * v.a, k * v.b, k * v.c, k * v.d, k * v.e, k * v.f);
}

// ---------- Статический слой: фон полей и трасса (рисуется один раз на размер) ----------
// Поля стыкуются без рамок и зазоров, поэтому общая линия видна целиком.
// Сначала все фоны, потом внешняя кромка всех трасс, потом светлые линии трасс:
// так кромка одного поля не перекрывает линию другого.
const staticLayers = new Map<string, HTMLCanvasElement>();
function getStaticLayer(w: number, h: number, mode: 'solo' | 'coop'): HTMLCanvasElement {
  const key = `${mode}:${w}x${h}`;
  let layer = staticLayers.get(key);
  if (!layer) {
    if (staticLayers.size > 6) staticLayers.clear();
    layer = buildStaticLayer(w, h, mode);
    staticLayers.set(key, layer);
  }
  return layer;
}

function roundedRect(x: CanvasRenderingContext2D, px: number, py: number, w: number, h: number, r: number) {
  x.beginPath();
  x.roundRect(px, py, w, h, r);
}

function buildStaticLayer(w: number, h: number, mode: 'solo' | 'coop'): HTMLCanvasElement {
  const layerCanvas = document.createElement('canvas');
  layerCanvas.width = w;
  layerCanvas.height = h;
  const x = layerCanvas.getContext('2d')!;
  const k = w / STAGE_W;
  const views = mode === 'coop' ? [VIEW_OWN, VIEW_REMOTE] : [VIEW_SOLO];
  const apply = (v: View) => x.setTransform(k * v.a, k * v.b, k * v.c, k * v.d, k * v.e, k * v.f);

  // плоский фон каждого поля
  x.fillStyle = '#161b2c';
  for (const v of views) {
    apply(v);
    x.fillRect(0, 0, STAGE_W, STAGE_H);
  }

  // трасса: сначала внешняя тёмная кромка у всех полей, потом светлая линия
  const track = (lineWidth: number, color: string) => {
    for (const v of views) {
      apply(v);
      x.beginPath();
      TRACK_PTS.forEach((pt, i) => (i === 0 ? x.moveTo(pt.x, pt.y) : x.lineTo(pt.x, pt.y)));
      x.strokeStyle = color;
      x.lineWidth = lineWidth;
      x.lineJoin = 'round';
      x.stroke();
    }
  };
  track(32, '#10141f');
  track(26, '#232a40');
  x.setTransform(1, 0, 0, 1, 0, 0);
  return layerCanvas;
}

// ---------- Вспомогательные функции рисования ----------

// Подпись: рисуется в экранных координатах, поэтому не зеркалится вместе с полем напарника.
function uText(x: CanvasRenderingContext2D, mode: 'fill' | 'stroke', text: string, px: number, py: number) {
  const v = CUR_VIEW;
  const wx = v.a * px + v.c * py + v.e;
  const wy = v.b * px + v.d * py + v.f;
  x.save();
  x.setTransform(CUR_K, 0, 0, CUR_K, 0, 0);
  x.translate(wx, wy);
  if (mode === 'fill') x.fillText(text, 0, 0);
  else x.strokeText(text, 0, 0);
  x.restore();
}

function drawChevrons(x: CanvasRenderingContext2D, vnow: number) {
  // Бегущие стрелки направления — единственная анимация трассы
  const n = 8;
  const step = PERIMETER / n;
  const off = (vnow * 26) % step;
  x.fillStyle = 'rgba(148,180,255,0.30)';
  for (let i = 0; i < n; i++) {
    const p = pathPoint((i * step + off) % PERIMETER);
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
  dragChain: number[]; // проведённая цепочка клеток (режим совмещения)
  placeHover: number; // пустая клетка под пальцем (можно поставить)
}

// Облако газа: несколько мягких пятен, колышутся; тают в начале и в конце жизни
function drawGas(x: CanvasRenderingContext2D, c: GasCloud, vnow: number) {
  const r = gasRadius(c);
  const fade = Math.min(1, c.age / 0.25) * Math.min(1, (c.life - c.age) / 0.7);
  if (fade <= 0 || r <= 0) return;
  const glow = TYPE_INFO.gas.glow;
  for (let i = 0; i < 7; i++) {
    const dir = i % 2 ? 1 : -1;
    const ang = c.seed + i * 0.9 + vnow * 0.25 * dir;
    const dist = r * (0.2 + 0.5 * ((i * 0.37 + c.seed * 0.1) % 1));
    const px = c.x + Math.cos(ang) * dist;
    const py = c.y + Math.sin(ang) * dist * 0.8;
    const pr = r * (0.42 + 0.08 * Math.sin(vnow * 1.7 + i));
    const grd = x.createRadialGradient(px, py, 0, px, py, pr);
    grd.addColorStop(0, `${glow}${(0.32 * fade).toFixed(3)})`);
    grd.addColorStop(1, `${glow}0)`);
    x.fillStyle = grd;
    x.beginPath();
    x.arc(px, py, pr, 0, Math.PI * 2);
    x.fill();
  }
  // тонкая кромка: граница облака видна
  x.strokeStyle = `${glow}${(0.3 * fade).toFixed(3)})`;
  x.lineWidth = 1.5;
  x.beginPath();
  x.arc(c.x, c.y, r, 0, Math.PI * 2);
  x.stroke();
}

// Мина и бомба на трассе. Мина: тёмный круг с шипами, после взвода горит красным.
// Бомба: пунктир — зона взрыва, дуга — сколько осталось до взрыва.
function drawTrap(x: CanvasRenderingContext2D, t: TrapState, now: number, vnow: number) {
  if (now < t.born || now >= t.born + t.life) return;
  if (t.kind === 'mine') {
    const armed = now >= t.arm;
    const info = TYPE_INFO.mine;
    x.save();
    x.globalAlpha = armed ? 1 : 0.5;
    x.fillStyle = info.dark;
    x.beginPath();
    x.arc(t.x, t.y, 10, 0, Math.PI * 2);
    x.fill();
    x.strokeStyle = info.color;
    x.lineWidth = 2;
    for (let k = 0; k < 8; k++) {
      const a = (k * Math.PI) / 4;
      x.beginPath();
      x.moveTo(t.x + Math.cos(a) * 10, t.y + Math.sin(a) * 10);
      x.lineTo(t.x + Math.cos(a) * 15, t.y + Math.sin(a) * 15);
      x.stroke();
    }
    x.fillStyle = armed ? '#fb7185' : '#64748b';
    x.beginPath();
    x.arc(t.x, t.y, 3.5, 0, Math.PI * 2);
    x.fill();
    if (armed) {
      x.strokeStyle = `rgba(251,113,133,${(0.35 + 0.25 * Math.sin(vnow * 5)).toFixed(3)})`;
      x.lineWidth = 1.5;
      x.beginPath();
      x.arc(t.x, t.y, 17 + 2 * Math.sin(vnow * 5), 0, Math.PI * 2);
      x.stroke();
    }
    x.restore();
    return;
  }
  const info = TYPE_INFO.bomb;
  const fuse = t.fuse || 1;
  const left = Math.min(1, Math.max(0, (t.boomAt - now) / fuse));
  x.save();
  // зона взрыва
  x.setLineDash([5, 5]);
  x.strokeStyle = `${info.glow}0.55)`;
  x.lineWidth = 1.5;
  x.beginPath();
  x.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
  x.stroke();
  x.setLineDash([]);
  // тело бомбы и дуга оставшегося времени
  x.fillStyle = info.dark;
  x.beginPath();
  x.arc(t.x, t.y, 10, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = info.color;
  x.beginPath();
  x.arc(t.x, t.y, 7 + (1 - left) * 2 + Math.sin(vnow * 8) * 0.5, 0, Math.PI * 2);
  x.fill();
  x.strokeStyle = '#fed7aa';
  x.lineWidth = 2.5;
  x.beginPath();
  x.arc(t.x, t.y, 13, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - left));
  x.stroke();
  x.restore();
}

// Облака, мины, бомбы, иглы и снаряды одного поля. Рисуются в текущей системе координат (setView).
function drawShots(x: CanvasRenderingContext2D, g: Engine, vnow: number) {
  for (const c of g.clouds) drawGas(x, c, vnow);
  for (const t of g.traps) drawTrap(x, t, g.now, vnow);
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
}

// ---------- Главный рендер кадра ----------
// Рисует одно поле. view — как поле ложится на холст.
// opts.interactive — подсветки под пальцем и выбор (только у моего поля);
// opts.chrome — подписи статуса и баннер (только у моего поля).
// opts.shots — облака, иглы и снаряды (поле напарника рисуется отдельно, см. loop).
function drawScene(
  x: CanvasRenderingContext2D,
  g: Engine,
  vnow: number,
  fx0: StageFx | null,
  view: View,
  opts: { interactive: boolean; chrome: boolean; shots: boolean },
) {
  setView(x, view);
  const fx = opts.interactive ? fx0 : null;
  const spawnP = pathPoint(0);
  const exitP = pathPoint(LEAK_AT);
  drawChevrons(x, vnow);
  drawBeacon(x, spawnP.x, spawnP.y, '#22c55e', vnow, 0);
  drawBeacon(x, exitP.x, exitP.y, '#ef4444', vnow, 1.7);

  const active = g.status === 'prep' || g.status === 'wave';
  const sel = opts.interactive ? g.sel : null;

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
      // бейдж уровня заряда (крупный: это главное, что видно при накоплении)
      x.font = '800 15px Manrope, system-ui, sans-serif';
      const label = `${o.level}`;
      const bw = x.measureText(label).width + 14;
      roundedRect(x, c.x + 11, c.y - 44, bw, 23, 12);
      x.fillStyle = 'rgba(0,0,0,0.85)';
      x.fill();
      x.strokeStyle = 'rgba(251,191,36,0.95)';
      x.lineWidth = 1.5;
      x.stroke();
      x.fillStyle = '#fcd34d';
      x.textAlign = 'center';
      x.textBaseline = 'middle';
      uText(x, 'fill', label, c.x + 11 + bw / 2, c.y - 32);
      // накопление: сколько процентов урона даёт заряд этого шарика
      if (g.mode === 'accumulate') {
        const pctLabel = `+${Math.round((accumMul(o.level) - 1) * 100)}%`;
        x.font = '800 12px Manrope, system-ui, sans-serif';
        x.textAlign = 'center';
        x.textBaseline = 'middle';
        x.lineWidth = 3;
        x.strokeStyle = 'rgba(0,0,0,0.85)';
        uText(x, 'stroke', pctLabel, c.x + 11 + bw / 2, c.y - 12);
        x.fillStyle = '#fde68a';
        uText(x, 'fill', pctLabel, c.x + 11 + bw / 2, c.y - 12);
      }
    }

    // перезарядка
    const cd = Math.max(0, o.cdUntil - g.now);
    if (cd > 0) {
      const pct = cd / (o.cdLen || CONFIG.cooldown);
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
        const tInfo = TYPE_INFO[o.type];
        const label = `Улучшение ${tInfo.name}: уровень ${g.typeLevels[o.type] + 1} за ${CONFIG.upgradeCost}`;
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
        uText(x, 'fill', label, c.x, c.y - 51);
      }
    }
  }

  // --- линия перетаскивания ---
  if (fx && fx.dragChain && fx.dragChain.length > 0) {
    // цепочка (режим совмещения): линия по клеткам + подсветка + счётчик
    const pts = fx.dragChain.map(cellC);
    if (pts.length > 1) {
      x.strokeStyle = 'rgba(34,211,238,0.85)';
      x.lineWidth = 4;
      x.lineCap = 'round';
      x.lineJoin = 'round';
      x.beginPath();
      x.moveTo(pts[0].x, pts[0].y);
      for (let k = 1; k < pts.length; k++) x.lineTo(pts[k].x, pts[k].y);
      x.stroke();
    }
    for (const i of fx.dragChain) {
      const cc = cellC(i);
      x.strokeStyle = 'rgba(34,211,238,0.5)';
      x.lineWidth = 2.5;
      x.beginPath();
      x.arc(cc.x, cc.y, 39, 0, Math.PI * 2);
      x.stroke();
    }
    if (pts.length > 1) {
      const last = pts[pts.length - 1];
      x.font = '800 15px Manrope, system-ui, sans-serif';
      x.fillStyle = '#67e8f9';
      x.textAlign = 'center';
      x.textBaseline = 'middle';
      uText(x, 'fill', `${pts.length}`, last.x, last.y - 48);
    }
  } else if (fx && fx.dragFrom !== -1 && fx.dragHover !== -1) {
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

  // --- лужи эликсира: полоса вдоль трассы вокруг точки смерти, мерцает и гаснет ---
  for (const pd of g.puddles) {
    const fade = Math.min(1, (pd.until - g.now) / 1.5);
    const pulse = 0.5 + 0.5 * Math.sin(vnow * 4 + pd.id);
    for (const [w, a] of [
      [26, 0.22], // широкая размытая кромка
      [16, 0.35 + 0.1 * pulse], // ядро лужи, мерцает
    ] as const) {
      x.strokeStyle = `rgba(168,85,247,${(a * fade).toFixed(3)})`;
      x.lineWidth = w;
      x.lineCap = 'round';
      x.beginPath();
      // полоса не уходит в начало трассы: pathPoint по кольцу иначе нарисует её с другой стороны
      const from = Math.max(-pd.radius, -pd.p);
      for (let s = from; s <= pd.radius; s += 4) {
        const q = pathPoint(pd.p + s);
        if (s === from) x.moveTo(q.x, q.y);
        else x.lineTo(q.x, q.y);
      }
      x.stroke();
    }
  }

  // --- враги ---
  for (const e of g.enemies) {
    const pos = g.at(e);
    const wob = Math.sin(e.id * 1.7 + e.p * 0.02) * 5;
    const ex = pos.x - pos.ty * wob;
    const ey = pos.y + pos.tx * wob;
    const r = e.radius;
    const flash = g.now < e.flashUntil;

    // плоское тело: однотонный круг с тёмной кромкой
    const def = e.boss ? BOSS_DEFS[(e.bossId || 1) as BossId] : null;
    // минибосс — свои цвета (MINI_DEF); у обычного и заряжающегося цвета прежние
    const look = def ?? (e.mini ? MINI_DEF : null);
    // заряжающийся моб: серый → сиреневый по мере зарядки; полностью заряжен — светится
    const charge = e.chargeT > 0 ? g.chargeLevel(e) : 0;
    const tint = e.chargeT > 0 ? chargeTint(charge) : null;
    x.fillStyle = look ? look.dark : tint ? tint.dark : '#2b3548';
    if (charge >= 1) {
      x.save();
      x.shadowColor = 'rgba(192,132,252,0.95)';
      x.shadowBlur = 16 + 6 * Math.sin(vnow * 6);
    }
    x.beginPath();
    x.arc(ex, ey, r, 0, Math.PI * 2);
    x.fill();
    if (charge >= 1) x.restore();
    x.fillStyle = look ? look.color : tint ? tint.body : '#5c6b85';
    x.beginPath();
    x.arc(ex, ey, r - 2.5, 0, Math.PI * 2);
    x.fill();
    if (charge >= 1) {
      x.strokeStyle = `rgba(216,180,254,${(0.45 + 0.25 * Math.sin(vnow * 6)).toFixed(3)})`;
      x.lineWidth = 2;
      x.beginPath();
      x.arc(ex, ey, r + 3, 0, Math.PI * 2);
      x.stroke();
    }

    // резонанс: помеченный враг обведён пунктиром
    if (g.now < (e.vulnUntil ?? 0)) {
      x.save();
      x.strokeStyle = 'rgba(103,232,249,0.9)';
      x.lineWidth = 1.8;
      x.setLineDash([4, 4]);
      x.lineDashOffset = -vnow * 12;
      x.beginPath();
      x.arc(ex, ey, r + 6, 0, Math.PI * 2);
      x.stroke();
      x.restore();
    }

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
    if (e.marks.length) {
      // метка шарика «Метка»: пунктирное кольцо, вращается; по числу меток — точки
      x.strokeStyle = 'rgba(232,121,249,0.95)';
      x.lineWidth = 2;
      x.setLineDash([4, 4]);
      x.beginPath();
      x.arc(ex, ey, r + 10, -vnow * 1.5, -vnow * 1.5 + Math.PI * 2);
      x.stroke();
      x.setLineDash([]);
      x.fillStyle = 'rgba(232,121,249,0.95)';
      for (let k = 0; k < e.marks.length; k++) {
        x.beginPath();
        x.arc(ex - 5 + k * 10, ey + r + 13, 2.2, 0, Math.PI * 2);
        x.fill();
      }
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
    const bw = e.boss ? 46 : e.mini ? 36 : 28;
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
    if (look) {
      x.font = '800 11px Manrope, system-ui, sans-serif';
      x.textAlign = 'center';
      x.textBaseline = 'alphabetic';
      x.fillStyle = 'rgba(0,0,0,0.55)';
      uText(x, 'fill', look.name, ex + 1, ey - r - 17);
      x.fillStyle = look.color;
      uText(x, 'fill', look.name, ex, ey - r - 18);
    }
  }

  // --- облака, иглы и снаряды: своё поле — здесь; поле напарника — отдельным вызовом ---
  if (opts.shots) drawShots(x, g, vnow);

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
      uText(x, 'fill', pt.text, pt.x, pt.y - 26 * t);
    } else if (pt.kind === 'arrow') {
      const ang = Math.atan2(pt.vy, pt.vx);
      const alpha = Math.min(1, (1 - t) * 1.35) * Math.min(1, t * 5 + 0.25);
      const s = pt.size;
      x.save();
      x.translate(pt.x, pt.y);
      x.rotate(ang);
      x.globalAlpha = alpha;
      x.lineCap = 'round';
      x.lineJoin = 'round';
      x.strokeStyle = 'rgba(30,41,59,0.85)';
      x.lineWidth = 4;
      x.beginPath();
      x.moveTo(-s * 0.55, 0);
      x.lineTo(s * 0.55, 0);
      x.moveTo(s * 0.05, -s * 0.45);
      x.lineTo(s * 0.55, 0);
      x.lineTo(s * 0.05, s * 0.45);
      x.stroke();
      x.strokeStyle = pt.color;
      x.lineWidth = 2.2;
      x.beginPath();
      x.moveTo(-s * 0.55, 0);
      x.lineTo(s * 0.55, 0);
      x.moveTo(s * 0.05, -s * 0.45);
      x.lineTo(s * 0.55, 0);
      x.lineTo(s * 0.05, s * 0.45);
      x.stroke();
      x.restore();
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
  // Альфа ограничена проектом: если по любой причине таймер вспышки
  // «залип» в прошлом относительно now, кадр не перекрашивается целиком.
  const detLeft = Math.min(0.35, Math.max(0, g.detonateFlashUntil - g.now));
  if (detLeft > 0) {
    const a = (detLeft / 0.35) * 0.3;
    const fg = x.createRadialGradient(STAGE_W / 2, STAGE_H / 2, 40, STAGE_W / 2, STAGE_H / 2, STAGE_H * 0.55);
    fg.addColorStop(0, `rgba(255,190,80,${a.toFixed(3)})`);
    fg.addColorStop(1, 'rgba(255,190,80,0)');
    x.fillStyle = fg;
    x.fillRect(0, 0, STAGE_W, STAGE_H);
  }
  const hurtLeft = Math.min(0.35, Math.max(0, g.hurtUntil - g.now));
  if (hurtLeft > 0) {
    const a = (hurtLeft / 0.35) * 0.5;
    const hg = x.createRadialGradient(STAGE_W / 2, STAGE_H / 2, STAGE_H * 0.28, STAGE_W / 2, STAGE_H / 2, STAGE_H * 0.62);
    hg.addColorStop(0, 'rgba(239,68,68,0)');
    hg.addColorStop(1, `rgba(239,68,68,${a.toFixed(3)})`);
    x.fillStyle = hg;
    x.fillRect(0, 0, STAGE_W, STAGE_H);
  }

  // --- статус и баннер: только у моего поля ---
  if (!opts.chrome) return;
  // --- компактный статус (без лишних надписей) ---
  if (g.status === 'prep') {
    const secs = Math.max(0, Math.ceil(g.prepUntil - g.now));
    drawChip(
      x,
      STAGE_W / 2,
      44,
      g.coop ? `Подготовка к волне ${g.wave}` : `До волны ${g.wave}: ${secs} с`,
      '#fcd34d',
    );
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
  chain: number[]; // проведённая линия клеток (режим совмещения)
  done: boolean;
}

const MOVE_TOL = 16; // логических px, после этого жест считается движением

export function GameStage({
  g,
  paused,
  speed,
  helpOpen,
  onCellTap,
  onEmptyTap,
  onDragPair,
  onChainFire,
  remote = null,
  frozen = false,
}: {
  g: Engine;
  paused: boolean;
  speed: number;
  helpOpen: boolean;
  onCellTap: (i: number) => void;
  onEmptyTap: (i: number) => void;
  onDragPair: (a: number, b: number) => void;
  onChainFire: (cells: number[]) => void;
  // кооператив: поле напарника (вверху, только просмотр)
  remote?: Engine | null;
  // поле напарника замерло (игрок вышел из матча)
  frozen?: boolean;
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
  const frozenRef = useRef(frozen);
  frozenRef.current = frozen;
  speedRef.current = speed;
  helpRef.current = helpOpen;

  // поле напарника: ссылка для цикла (актуальна в каждом кадре)
  const remoteRef = useRef<Engine | null>(remote);
  remoteRef.current = remote;

  // Игровой цикл + отрисовка (вне React)
  useEffect(() => {
    const el = wrap.current;
    const cv = canvas.current;
    if (!el || !cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    // поле напарника рисуется в свой холст 640×620 (dpr 1), обновляется 30 раз в секунду
    const remoteCanvas = document.createElement('canvas');
    remoteCanvas.width = STAGE_W;
    remoteCanvas.height = STAGE_H;
    const rctx = remoteCanvas.getContext('2d');

    const dpr = () => Math.min(2, window.devicePixelRatio || 1);
    let mode: 'solo' | 'coop' = 'solo';
    const fit = () => {
      const cw = el.clientWidth;
      const ch = el.clientHeight;
      if (cw < 10 || ch < 10) return;
      const worldH = mode === 'coop' ? 2 * STAGE_H : STAGE_H;
      const s = Math.min(cw / STAGE_W, ch / worldH);
      const w = Math.max(1, Math.floor(STAGE_W * s));
      const h = Math.max(1, Math.floor(worldH * s));
      const d = dpr();
      cv.style.width = `${w}px`;
      cv.style.height = `${h}px`;
      cv.width = Math.round(w * d);
      cv.height = Math.round(h * d);
    };
    fit();
    const ro = new ResizeObserver(() => fit());
    ro.observe(el);

    let raf = 0;
    let last = performance.now();
    let lastRemote = -1000;
    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      const rem = remoteRef.current;
      const want: 'solo' | 'coop' = rem ? 'coop' : 'solo';
      if (want !== mode) {
        mode = want;
        fit(); // поле напарника появилось или ушло
      }
      // своё поле: шаг игры
      const active = g.status === 'prep' || g.status === 'wave';
      if (active && !pausedRef.current && !helpRef.current) g.step(dt * speedRef.current);

      // поле напарника: время идёт по снимкам; перерисовка не чаще 30 раз в секунду
      if (rem) {
        const remLive = rem.status === 'prep' || rem.status === 'wave';
        if (remLive && !frozenRef.current) rem.extrapolate(dt * speedRef.current);
        if (rctx && t - lastRemote >= 33) {
          lastRemote = t;
          rctx.setTransform(1, 0, 0, 1, 0, 0);
          rctx.clearRect(0, 0, STAGE_W, STAGE_H);
          drawScene(rctx, rem, t / 1000, null, VIEW_REMOTE, { interactive: false, chrome: false, shots: false });
          if (frozenRef.current) {
            rctx.setTransform(1, 0, 0, 1, 0, 0);
            rctx.fillStyle = 'rgba(71,85,105,0.55)';
            rctx.fillRect(0, 0, STAGE_W, STAGE_H);
          }
        }
      }

      // эффекты ввода (подсветки под пальцем)
      const gs = gesture.current;
      if (gs && !gs.done) {
        if (gs.drag && gs.moved) {
          // перетаскивание шарика (или цепочка в режиме совмещения)
          fxRef.current = {
            lpCell: -1,
            lpProgress: 0,
            dragFrom: gs.cell,
            dragHover: gs.hover,
            dragChain: g.mode === 'combine' ? gs.chain : [],
            placeHover: -1,
          };
        } else if (gs.drag && !gs.moved) {
          // шарик на поле не удерживается: зажатие ничего не делает
        } else if (!gs.drag && !gs.moved) {
          // держим палец на пустой клетке — подсветка «поставить сюда»
          fxRef.current = {
            lpCell: -1,
            lpProgress: 0,
            dragFrom: -1,
            dragHover: -1,
            dragChain: [],
            placeHover: g.grid[gs.cell] ? -1 : gs.cell,
          };
        } else {
          fxRef.current = null;
        }
      } else {
        fxRef.current = null;
      }

      // кадр: статический слой, поле напарника (сверху), моё поле (снизу)
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.drawImage(getStaticLayer(cv.width, cv.height, mode), 0, 0);
      if (rem) ctx.drawImage(remoteCanvas, 0, 0, cv.width, cv.height / 2);
      drawScene(ctx, g, t / 1000, fxRef.current, mode === 'coop' ? VIEW_OWN : VIEW_SOLO, {
        interactive: true,
        chrome: true,
        shots: true,
      });
      // снаряды и облака напарника: рисуются прямо на главном холсте, в его зеркальной системе.
      // Снаряд, летящий к моим врагам, уходит за край его поля, и в его холсте он бы обрезался.
      if (rem && !frozenRef.current) {
        setView(ctx, VIEW_REMOTE);
        drawShots(ctx, rem, t / 1000);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [g]);

  // --- преобразование координат (pointer и mouse события) ---
  // В кооперативе холст 640×1240: сверху поле напарника, снизу моё. Касания — только по моему
  // полю: координаты переводятся в систему моего поля (его верхний край = 0).
  const toStage = (e: { clientX: number; clientY: number }) => {
    const cv = canvas.current!;
    const r = cv.getBoundingClientRect();
    const rem = remoteRef.current;
    const worldH = rem ? 2 * STAGE_H : STAGE_H;
    const wy = ((e.clientY - r.top) / r.height) * worldH;
    return {
      x: ((e.clientX - r.left) / r.width) * STAGE_W,
      y: wy - (rem ? STAGE_H : 0),
    };
  };

  const cellAt = (x: number, y: number) => {
    for (let i = 0; i < COLS * ROWS; i++) {
      const { x: px, y: py } = cellXY(i);
      if (x >= px && x < px + CELL && y >= py && y < py + CELL) return i;
    }
    return -1;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (gesture.current) return; // один палец
    if (e.pointerType === 'mouse' && e.button !== 0) return; // только левая кнопка
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
      chain: hasOrb ? [i] : [],
      done: false,
    };
    // Тап по соседу уже выбранного — немедленное действие (быстрый отклик)
    if (hasOrb && g.sel !== null && g.sel !== i && isAdj(g.sel, i)) {
      onCellTap(i);
      gesture.current = null;
      return;
    }
    if (hasOrb) gs.drag = true;
    gesture.current = gs;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const gs = gesture.current;
    if (!gs || e.pointerId !== gs.pointerId) return;
    const p = toStage(e);
    if (Math.hypot(p.x - gs.sx, p.y - gs.sy) > MOVE_TOL) {
      gs.moved = true;
    }
    if (gs.drag) {
      const h = cellAt(p.x, p.y);
      if (g.mode === 'combine' && gs.chain.length > 0) {
        // цепочка: все обычные шарики на линии — ОДИНОГО типа (тип задаёт
        // первый обычный шарик), шипастый можно вставить в любую цепь;
        // назад по линии — откат конца
        const last = gs.chain[gs.chain.length - 1];
        const prev = gs.chain[gs.chain.length - 2];
        const baseType = gs.chain
          .map((i) => g.grid[i]?.type)
          .find((t) => t !== undefined && t !== 'spiky');
        if (h !== -1 && h !== last) {
          if (h === prev) {
            gs.chain.pop();
          } else {
            const hType = g.grid[h]?.type;
            const matches =
              hType !== undefined &&
              (hType === 'spiky' ||
                (baseType !== undefined ? hType === baseType : true)) &&
              isAdj(last, h) &&
              !gs.chain.includes(h) &&
              gs.chain.length < COLS * ROWS;
            if (matches) gs.chain.push(h);
          }
        }
        gs.hover = h !== -1 ? h : last;
      } else {
        // подсвечиваем только соседнюю клетку с шариком
        gs.hover = h !== -1 && h !== gs.cell && isAdj(gs.cell, h) && g.grid[h] ? h : -1;
      }
    }
  };

  const finish = (e: React.PointerEvent, act: boolean) => {
    const gs = gesture.current;
    if (!gs || e.pointerId !== gs.pointerId) return;
    gesture.current = null;
    if (!act || gs.done) return;
    const i = gs.cell;
    if (gs.drag) {
      if (g.mode === 'combine') {
        // совмещение: цепочка из 2+ шариков стреляет, простой тап — выбор
        if (gs.chain.length >= 2) {
          onChainFire(gs.chain);
          return;
        }
        if (!gs.moved) {
          onCellTap(i); // обычный тап: выбор / смена выбора
          return;
        }
        // тащили, но цепочка не выросла — отменяем
        return;
      }
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
        // ПКМ на поле ничего не делает (продажи и удаления шариков нет)
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  );
}
