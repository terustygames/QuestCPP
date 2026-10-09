import { sfx } from "./audio";
import {
  BASE_HP,
  BASE_POS,
  BUILDER_SPEED,
  BUILDER_START,
  COIN_LIFE,
  COIN_PERIOD,
  COIN_PICKUP_R,
  COIN_VALUE,
  FIELD_MARGIN,
  FROST_SLOW,
  FROST_SLOW_TIME,
  H,
  INCOME_PER_SEC,
  KEYS,
  MID_X,
  P2_SEND_ALT,
  PATH_CLEARANCE,
  PATHS,
  PORTAL_POS,
  START_GOLD,
  TEAM,
  TOWERS,
  TOWER_MIN_GAP,
  W,
  dist,
  distToPath,
  waveCost,
  waveUnits,
} from "./config";
import type { TeamId, TowerKind, UnitSpec, Vec } from "./config";

export interface TeamStats {
  kills: number;
  towersBuilt: number;
  wavesSent: number;
  damageToBase: number;
  coinsTaken: number;
}

export interface GameOverInfo {
  winner: TeamId;
  timeSec: number;
  stats: [TeamStats, TeamStats];
}

export interface EngineCallbacks {
  onGameOver: (info: GameOverInfo) => void;
  onPauseChange: (paused: boolean) => void;
  onMuteChange: (muted: boolean) => void;
}

interface Builder {
  team: TeamId;
  x: number;
  y: number;
  faceX: number;
  faceY: number;
  aimCode: string | null;
  aimKind: TowerKind | null;
  trail: { x: number; y: number; life: number }[];
  bob: number;
}

interface Tower {
  team: TeamId;
  kind: TowerKind;
  x: number;
  y: number;
  cd: number;
  angle: number;
  pulse: number;
}

interface Unit extends UnitSpec {
  team: TeamId; // атакующий
  x: number;
  y: number;
  seg: number;
  travelled: number;
  hp: number;
  maxHp: number;
  slowT: number;
  dead: boolean;
  wob: number;
}

interface Projectile {
  team: TeamId;
  kind: TowerKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
  target: Unit | null;
  life: number;
}

interface Coin {
  team: TeamId;
  x: number;
  y: number;
  life: number;
  phase: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  drag: number;
}

interface FloatText {
  x: number;
  y: number;
  life: number;
  text: string;
  color: string;
  size: number;
}

interface SpawnBatch {
  team: TeamId;
  list: UnitSpec[];
  idx: number;
  timer: number;
}

/* Полифилл roundRect для старых браузеров — без него рендер падает на чёрный экран. */
if (typeof CanvasRenderingContext2D !== "undefined") {
  const proto = CanvasRenderingContext2D.prototype as unknown as Record<string, unknown>;
  if (!proto.roundRect) {
    proto.roundRect = function (
      this: CanvasRenderingContext2D,
      x: number,
      y: number,
      w: number,
      h: number,
      r: number | number[] = 0,
    ) {
      const rr = Math.min(Array.isArray(r) ? r[0] ?? 0 : r, w / 2, h / 2);
      this.moveTo(x + rr, y);
      this.arcTo(x + w, y, x + w, y + h, rr);
      this.arcTo(x + w, y + h, x, y + h, rr);
      this.arcTo(x, y + h, x, y, rr);
      this.arcTo(x, y, x + w, y, rr);
      this.closePath();
      return this;
    };
  }
}

const PREVENT = new Set([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Space",
  "Slash",
  "Comma",
  "Period",
  "Enter",
]);

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const rand = (a: number, b: number) => a + Math.random() * (b - a);

export class NeonSiege {
  private ctx: CanvasRenderingContext2D;
  private cb: EngineCallbacks;
  private raf = 0;
  private last = 0;
  private time = 0;
  private running = true;
  private paused = false;
  private over = false;
  private counting = true;
  private countT = 3.6;
  private lastCountInt = 4;
  private shake = 0;
  private keys = new Set<string>();

  private gold = [START_GOLD, START_GOLD] as [number, number];
  private hp = [BASE_HP, BASE_HP] as [number, number];
  private wave = [1, 1] as [number, number];
  private baseFlash = [0, 0];

  private builders: Builder[] = [];
  private towers: Tower[] = [];
  private units: Unit[] = [];
  private projectiles: Projectile[] = [];
  private coins: Coin[] = [];
  private particles: Particle[] = [];
  private texts: FloatText[] = [];
  private spawns: SpawnBatch[] = [];
  private coinTimer = COIN_PERIOD * 0.6;

  private stats: [TeamStats, TeamStats] = [
    { kills: 0, towersBuilt: 0, wavesSent: 0, damageToBase: 0, coinsTaken: 0 },
    { kills: 0, towersBuilt: 0, wavesSent: 0, damageToBase: 0, coinsTaken: 0 },
  ];

  constructor(canvas: HTMLCanvasElement, cb: EngineCallbacks) {
    this.cb = cb;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no 2d context");
    this.ctx = ctx;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    for (const t of [0, 1] as TeamId[]) {
      const s = BUILDER_START[t];
      this.builders.push({
        team: t,
        x: s.x,
        y: s.y,
        faceX: t === 0 ? 1 : -1,
        faceY: 0,
        aimCode: null,
        aimKind: null,
        trail: [],
        bob: Math.random() * Math.PI * 2,
      });
    }

    window.addEventListener("keydown", this.onKeyDown, { passive: false });
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.onBlur);

    this.last = performance.now();
    this.raf = requestAnimationFrame(this.loop);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.onBlur);
  }

  setPaused(v: boolean) {
    if (this.over) return;
    if (this.paused === v) return;
    this.paused = v;
    this.keys.clear();
    for (const b of this.builders) {
      b.aimCode = null;
      b.aimKind = null;
    }
    this.cb.onPauseChange(v);
  }

  /* ------------------------------------------------------------------ ввод */

  private onBlur = () => {
    if (!this.over && !this.paused) this.setPaused(true);
  };

  private onKeyDown = (e: KeyboardEvent) => {
    if (PREVENT.has(e.code)) e.preventDefault();

    if (e.code === "Escape" || e.code === "KeyP") {
      if (!this.over) this.setPaused(!this.paused);
      return;
    }
    if (e.code === "KeyM") {
      if (!e.repeat) this.cb.onMuteChange(sfx.toggleMute());
      return;
    }
    if (this.paused || this.over || this.counting) {
      this.keys.add(e.code);
      return;
    }
    this.keys.add(e.code);

    for (const t of [0, 1] as TeamId[]) {
      const k = KEYS[t];
      const towerKey = k.towers[e.code];
      if (towerKey && !e.repeat) {
        this.builders[t].aimCode = e.code;
        this.builders[t].aimKind = towerKey;
      }
      if ((e.code === k.send || (t === 1 && e.code === P2_SEND_ALT)) && !e.repeat) {
        this.trySend(t);
      }
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
    for (const t of [0, 1] as TeamId[]) {
      const b = this.builders[t];
      if (b.aimCode === e.code && b.aimKind) {
        if (!this.paused && !this.over && !this.counting) this.tryBuild(t, b.aimKind);
        b.aimCode = null;
        b.aimKind = null;
      }
    }
  };

  /* ------------------------------------------------------------ действия */

  private canBuild(team: TeamId, x: number, y: number): string | null {
    const minX = team === 0 ? FIELD_MARGIN : MID_X + 26;
    const maxX = team === 0 ? MID_X - 26 : W - FIELD_MARGIN;
    if (x < minX || x > maxX || y < FIELD_MARGIN + 10 || y > H - FIELD_MARGIN) return "вне зоны строительства";
    for (const path of PATHS) {
      if (distToPath({ x, y }, path) < PATH_CLEARANCE) return "слишком близко к трассе";
    }
    if (dist({ x, y }, PORTAL_POS) < 70) return "рядом с порталом";
    for (const t of this.towers) {
      if (dist(t, { x, y }) < TOWER_MIN_GAP) return "рядом другая башня";
    }
    for (const bp of BASE_POS) {
      if (dist(bp, { x, y }) < 78) return "рядом с базой";
    }
    return null;
  }

  private tryBuild(team: TeamId, kind: TowerKind) {
    const b = this.builders[team];
    const def = TOWERS[kind];
    const reason = this.canBuild(team, b.x, b.y);
    if (reason) {
      sfx.error();
      this.addText(b.x, b.y - 26, reason, "#f87171", 11);
      this.burst(b.x, b.y, "rgba(248,113,113,0.8)", 8, 90);
      return;
    }
    if (this.gold[team] < def.cost) {
      sfx.error();
      this.addText(b.x, b.y - 26, `нужно ${def.cost} золота`, "#fbbf24", 11);
      return;
    }
    this.gold[team] -= def.cost;
    this.stats[team].towersBuilt++;
    this.towers.push({ team, kind, x: b.x, y: b.y, cd: 0.25, angle: team === 0 ? 0 : Math.PI, pulse: 1 });
    sfx.build();
    this.ring(b.x, b.y, TEAM[team].color, 26, 46);
    this.burst(b.x, b.y, TEAM[team].color, 14, 130);
  }

  private trySend(team: TeamId) {
    const cost = waveCost(this.wave[team]);
    if (this.gold[team] < cost) {
      sfx.error();
      const b = this.builders[team];
      this.addText(b.x, b.y - 26, `волна стоит ${cost}`, "#fbbf24", 11);
      return;
    }
    this.gold[team] -= cost;
    const list = waveUnits(this.wave[team]);
    this.spawns.push({ team, list, idx: 0, timer: 0 });
    this.wave[team]++;
    this.stats[team].wavesSent++;
    sfx.send();
    this.ring(PORTAL_POS.x, PORTAL_POS.y, TEAM[team].color, 20, 60);
    this.addText(PORTAL_POS.x + (team === 0 ? -70 : 70), PORTAL_POS.y + 42, `ВОЛНА УР.${this.wave[team] - 1}`, TEAM[team].color, 13);
  }

  /* ---------------------------------------------------------------- цикл */

  private loop = (now: number) => {
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    if (!this.running) return;

    if (!this.paused) {
      if (this.over) {
        this.updateParticles(dt);
        this.updateTexts(dt);
      } else if (this.counting) {
        this.countT -= dt;
        const ci = Math.ceil(this.countT);
        if (ci !== this.lastCountInt && ci > 0 && ci <= 3) {
          this.lastCountInt = ci;
          sfx.tick();
        }
        if (this.countT <= 0) {
          this.counting = false;
          sfx.go();
        }
        this.updateParticles(dt);
      } else {
        this.time += dt;
        this.update(dt);
      }
    }
    this.render(now / 1000);
  };

  private update(dt: number) {
    // пассивный доход
    for (const t of [0, 1] as TeamId[]) this.gold[t] += INCOME_PER_SEC * dt;

    this.updateBuilders(dt);
    this.updateCoins(dt);
    this.updateSpawns(dt);
    this.updateUnits(dt);
    this.updateTowers(dt);
    this.updateProjectiles(dt);
    this.updateParticles(dt);
    this.updateTexts(dt);

    this.shake = Math.max(0, this.shake - dt * 2.4);
    this.baseFlash[0] = Math.max(0, this.baseFlash[0] - dt * 2.2);
    this.baseFlash[1] = Math.max(0, this.baseFlash[1] - dt * 2.2);
  }

  private updateBuilders(dt: number) {
    for (const t of [0, 1] as TeamId[]) {
      const b = this.builders[t];
      const k = KEYS[t];
      let dx = 0;
      let dy = 0;
      if (this.keys.has(k.up)) dy -= 1;
      if (this.keys.has(k.down)) dy += 1;
      if (this.keys.has(k.left)) dx -= 1;
      if (this.keys.has(k.right)) dx += 1;
      if (dx !== 0 || dy !== 0) {
        const len = Math.hypot(dx, dy);
        dx /= len;
        dy /= len;
        b.faceX = dx;
        b.faceY = dy;
        b.x += dx * BUILDER_SPEED * dt;
        b.y += dy * BUILDER_SPEED * dt;
        const minX = t === 0 ? FIELD_MARGIN : MID_X + 22;
        const maxX = t === 0 ? MID_X - 22 : W - FIELD_MARGIN;
        b.x = clamp(b.x, minX, maxX);
        b.y = clamp(b.y, FIELD_MARGIN, H - FIELD_MARGIN);
      }
      b.bob += dt * 3;
      b.trail.push({ x: b.x, y: b.y, life: 0.28 });
      if (b.trail.length > 24) b.trail.shift();
      for (const p of b.trail) p.life -= dt;
    }
  }

  private updateCoins(dt: number) {
    this.coinTimer -= dt;
    if (this.coinTimer <= 0) {
      this.coinTimer = COIN_PERIOD;
      for (const t of [0, 1] as TeamId[]) {
        const pos = this.randomCoinSpot(t);
        if (pos) this.coins.push({ team: t, x: pos.x, y: pos.y, life: COIN_LIFE, phase: Math.random() * 6 });
      }
    }
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const c = this.coins[i];
      c.life -= dt;
      c.phase += dt * 4;
      if (c.life <= 0) {
        this.coins.splice(i, 1);
        continue;
      }
      const b = this.builders[c.team];
      const d = dist(c, b);
      if (d < 78) {
        // магнит
        const pull = (1 - d / 78) * 340 * dt;
        c.x += ((b.x - c.x) / (d || 1)) * pull;
        c.y += ((b.y - c.y) / (d || 1)) * pull;
      }
      if (d < COIN_PICKUP_R) {
        this.coins.splice(i, 1);
        this.gold[c.team] += COIN_VALUE;
        this.stats[c.team].coinsTaken++;
        sfx.coin();
        this.addText(c.x, c.y - 12, `+${COIN_VALUE}`, "#fde047", 13);
        this.burst(c.x, c.y, "#fbbf24", 10, 110);
      }
    }
  }

  private randomCoinSpot(team: TeamId): Vec | null {
    for (let attempt = 0; attempt < 24; attempt++) {
      const minX = team === 0 ? FIELD_MARGIN + 20 : MID_X + 42;
      const maxX = team === 0 ? MID_X - 42 : W - FIELD_MARGIN - 20;
      const p = { x: rand(minX, maxX), y: rand(FIELD_MARGIN + 40, H - FIELD_MARGIN - 10) };
      if (distToPath(p, PATHS[0]) < 46 || distToPath(p, PATHS[1]) < 46) continue;
      if (dist(p, BASE_POS[team]) < 84) continue;
      let ok = true;
      for (const t of this.towers) if (dist(p, t) < 40) ok = false;
      for (const c of this.coins) if (dist(p, c) < 50) ok = false;
      if (ok) return p;
    }
    return null;
  }

  private updateSpawns(dt: number) {
    for (let i = this.spawns.length - 1; i >= 0; i--) {
      const s = this.spawns[i];
      s.timer -= dt;
      if (s.timer <= 0 && s.idx < s.list.length) {
        s.timer = 0.55;
        const spec = s.list[s.idx++];
        const target = (1 - s.team) as TeamId;
        const p0 = PATHS[target][0];
        this.units.push({
          ...spec,
          team: s.team,
          x: p0.x,
          y: p0.y,
          seg: 0,
          travelled: 0,
          hp: spec.hp,
          maxHp: spec.hp,
          slowT: 0,
          dead: false,
          wob: Math.random() * 6,
        });
        this.burst(p0.x, p0.y, TEAM[s.team].color, 4, 60);
      }
      if (s.idx >= s.list.length) this.spawns.splice(i, 1);
    }
  }

  private updateUnits(dt: number) {
    for (let i = this.units.length - 1; i >= 0; i--) {
      const u = this.units[i];
      if (u.dead) {
        this.units.splice(i, 1);
        continue;
      }
      u.slowT = Math.max(0, u.slowT - dt);
      u.wob += dt * 6;
      const target = (1 - u.team) as TeamId;
      const path = PATHS[target];
      const speed = u.speed * (u.slowT > 0 ? 1 - FROST_SLOW : 1);
      let move = speed * dt;
      while (move > 0 && u.seg < path.length - 1) {
        const a = path[u.seg];
        const b = path[u.seg + 1];
        const segLen = dist(a, b);
        const curPos = dist(a, u);
        const remain = segLen - curPos;
        if (remain <= move) {
          u.x = b.x;
          u.y = b.y;
          u.seg++;
          u.travelled += remain;
          move -= remain;
        } else {
          const t = (curPos + move) / segLen;
          u.x = a.x + (b.x - a.x) * t;
          u.y = a.y + (b.y - a.y) * t;
          u.travelled += move;
          move = 0;
        }
      }
      if (u.seg >= path.length - 1) {
        // дошёл до базы
        u.dead = true; // больше не цель для снарядов
        this.units.splice(i, 1);
        const victim = target;
        this.hp[victim] -= u.dmg;
        this.stats[u.team].damageToBase += u.dmg;
        this.shake = Math.min(1, this.shake + 0.5);
        this.baseFlash[victim] = 1;
        sfx.baseHit();
        const bp = BASE_POS[victim];
        this.burst(bp.x, bp.y, TEAM[u.team].color, 22, 200);
        this.addText(bp.x + (victim === 0 ? 46 : -46), bp.y - 40, `-${u.dmg}`, "#f87171", 18);
        if (this.hp[victim] <= 0) this.gameOver(u.team);
      }
    }
  }

  private updateTowers(dt: number) {
    for (const t of this.towers) {
      const def = TOWERS[t.kind];
      t.cd -= dt;
      t.pulse = Math.max(0, t.pulse - dt * 1.8);
      if (t.cd > 0) continue;
      // цель: самый продвинутый враг в радиусе
      let best: Unit | null = null;
      for (const u of this.units) {
        if (u.dead || u.team === t.team) continue;
        if (dist(u, t) > def.range) continue;
        if (!best || u.travelled > best.travelled) best = u;
      }
      if (!best) continue;
      t.angle = Math.atan2(best.y - t.y, best.x - t.x);
      t.cd = 1 / def.rate;
      const mx = t.x + Math.cos(t.angle) * 15;
      const my = t.y + Math.sin(t.angle) * 15;
      const speed = t.kind === "sniper" ? 760 : t.kind === "frost" ? 420 : 560;
      this.projectiles.push({
        team: t.team,
        kind: t.kind,
        x: mx,
        y: my,
        vx: Math.cos(t.angle) * speed,
        vy: Math.sin(t.angle) * speed,
        speed,
        target: best,
        life: 1.4,
      });
      if (t.kind === "sniper") sfx.snipe();
      else if (t.kind === "frost") sfx.frost();
      else sfx.shoot();
      this.burst(mx, my, def.color, 3, 70);
    }
  }

  private updateProjectiles(dt: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;
      if (p.target && !p.target.dead) {
        const dx = p.target.x - p.x;
        const dy = p.target.y - p.y;
        const d = Math.hypot(dx, dy) || 1;
        p.vx = (dx / d) * p.speed;
        p.vy = (dy / d) * p.speed;
        if (d < p.target.radius + 5) {
          this.hitUnit(p, p.target);
          this.projectiles.splice(i, 1);
          continue;
        }
      } else if (p.target?.dead) {
        p.target = null;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.life <= 0 || p.x < 0 || p.x > W || p.y < 0 || p.y > H) this.projectiles.splice(i, 1);
    }
  }

  private hitUnit(p: Projectile, u: Unit) {
    const def = TOWERS[p.kind];
    u.hp -= def.damage;
    if (p.kind === "frost") u.slowT = FROST_SLOW_TIME;
    sfx.hit();
    this.sparks(p.x, p.y, Math.atan2(p.vy, p.vx), def.color);
    if (p.kind === "sniper") this.addText(u.x, u.y - 16, `-${def.damage}`, "#c084fc", 12);
    if (u.hp <= 0 && !u.dead) {
      u.dead = true;
      const owner = p.team;
      this.gold[owner] += u.bounty;
      this.stats[owner].kills++;
      sfx.die();
      this.burst(u.x, u.y, TEAM[u.team].color, 16, 160);
      this.addText(u.x, u.y - 12, `+${u.bounty}`, "#fde047", 12);
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.vx *= 1 - p.drag * dt;
      p.vy *= 1 - p.drag * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    if (this.particles.length > 900) this.particles.splice(0, this.particles.length - 900);
  }

  private updateTexts(dt: number) {
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.life -= dt;
      t.y -= 26 * dt;
      if (t.life <= 0) this.texts.splice(i, 1);
    }
  }

  private gameOver(winner: TeamId) {
    if (this.over) return;
    this.over = true;
    this.hp[winner === 0 ? 1 : 0] = Math.max(0, this.hp[winner === 0 ? 1 : 0]);
    sfx.win();
    // салют
    for (let i = 0; i < 5; i++) {
      const x = rand(W * 0.2, W * 0.8);
      const y = rand(H * 0.15, H * 0.5);
      setTimeout(() => this.burst(x, y, TEAM[winner].color, 40, 260), i * 160);
    }
    this.cb.onGameOver({ winner, timeSec: this.time, stats: this.stats });
  }

  /* ------------------------------------------------------ помощники эффектов */

  private burst(x: number, y: number, color: string, n: number, power: number) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = rand(power * 0.3, power);
      const life = rand(0.3, 0.7);
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life,
        maxLife: life,
        size: rand(1.5, 3.5),
        color,
        drag: 3,
      });
    }
  }

  private ring(x: number, y: number, color: string, from: number, to: number) {
    const n = 26;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const sp = ((to - from) / 0.45) * rand(0.8, 1.2);
      this.particles.push({
        x: x + Math.cos(a) * from,
        y: y + Math.sin(a) * from,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 0.45,
        maxLife: 0.45,
        size: 2.2,
        color,
        drag: 2.4,
      });
    }
  }

  private sparks(x: number, y: number, angle: number, color: string) {
    for (let i = 0; i < 4; i++) {
      const a = angle + Math.PI + rand(-0.7, 0.7);
      const sp = rand(60, 170);
      const life = rand(0.12, 0.3);
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life,
        maxLife: life,
        size: rand(1, 2.4),
        color,
        drag: 4,
      });
    }
  }

  private addText(x: number, y: number, text: string, color: string, size: number) {
    this.texts.push({ x, y, life: 1.1, text, color, size });
  }

  /* ---------------------------------------------------------------- рендер */

  private render(t: number) {
    const c = this.ctx;
    c.clearRect(0, 0, W, H);
    c.save();
    if (this.shake > 0.01) {
      c.translate(rand(-1, 1) * this.shake * 7, rand(-1, 1) * this.shake * 7);
    }

    this.drawBackground(c, t);
    this.drawPaths(c, t);
    this.drawPortal(c, t);
    this.drawBases(c, t);
    this.drawCoins(c, t);
    this.drawTowers(c, t);
    this.drawUnits(c, t);
    this.drawBuilders(c, t);
    this.drawProjectiles(c);
    this.drawParticles(c);
    this.drawTexts(c);
    this.drawDivider(c, t);
    c.restore();

    this.drawVignette(c);
    this.drawHud(c, t);
    if (this.counting && !this.over) this.drawCountdown(c);
    if (this.paused && !this.over) {
      c.fillStyle = "rgba(3,5,10,0.45)";
      c.fillRect(0, 0, W, H);
    }
  }

  private drawBackground(c: CanvasRenderingContext2D, t: number) {
    c.fillStyle = "#04060c";
    c.fillRect(0, 0, W, H);

    // половинки
    const g1 = c.createLinearGradient(0, 0, MID_X, 0);
    g1.addColorStop(0, "rgba(34,211,238,0.075)");
    g1.addColorStop(1, "rgba(34,211,238,0)");
    c.fillStyle = g1;
    c.fillRect(0, 0, MID_X, H);
    const g2 = c.createLinearGradient(W, 0, MID_X, 0);
    g2.addColorStop(0, "rgba(251,113,133,0.075)");
    g2.addColorStop(1, "rgba(251,113,133,0)");
    c.fillStyle = g2;
    c.fillRect(MID_X, 0, MID_X, H);

    // сетка
    c.strokeStyle = "rgba(120,150,220,0.06)";
    c.lineWidth = 1;
    c.beginPath();
    const off = (t * 8) % 40;
    for (let x = -40 + off; x <= W + 40; x += 40) {
      c.moveTo(x, 0);
      c.lineTo(x, H);
    }
    for (let y = -40 + off; y <= H + 40; y += 40) {
      c.moveTo(0, y);
      c.lineTo(W, y);
    }
    c.stroke();
  }

  private drawPaths(c: CanvasRenderingContext2D, t: number) {
    for (const path of PATHS) {
      c.lineJoin = "round";
      c.lineCap = "round";
      // ложе
      c.strokeStyle = "rgba(148,163,184,0.10)";
      c.lineWidth = 34;
      this.tracePath(c, path);
      c.stroke();
      c.strokeStyle = "rgba(2,6,14,0.85)";
      c.lineWidth = 26;
      this.tracePath(c, path);
      c.stroke();
      // бегущий пунктир направления
      c.strokeStyle = "rgba(148,163,184,0.34)";
      c.lineWidth = 2;
      c.setLineDash([8, 14]);
      c.lineDashOffset = -t * 46;
      this.tracePath(c, path);
      c.stroke();
      c.setLineDash([]);
    }
  }

  private tracePath(c: CanvasRenderingContext2D, path: Vec[]) {
    c.beginPath();
    c.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) c.lineTo(path[i].x, path[i].y);
  }

  private drawPortal(c: CanvasRenderingContext2D, t: number) {
    const { x, y } = PORTAL_POS;
    const r = 20 + Math.sin(t * 3) * 2.5;
    const g = c.createRadialGradient(x, y, 2, x, y, r * 2.1);
    g.addColorStop(0, "rgba(232,238,252,0.9)");
    g.addColorStop(0.35, "rgba(148,163,255,0.45)");
    g.addColorStop(1, "rgba(148,163,255,0)");
    c.fillStyle = g;
    c.beginPath();
    c.arc(x, y, r * 2.1, 0, Math.PI * 2);
    c.fill();
    c.save();
    c.translate(x, y);
    c.rotate(t * 1.4);
    c.strokeStyle = "rgba(226,232,255,0.7)";
    c.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      c.beginPath();
      c.arc(0, 0, r * (0.6 + i * 0.28), i * 2, i * 2 + Math.PI * 1.25);
      c.stroke();
    }
    c.restore();
  }

  private drawBases(c: CanvasRenderingContext2D, t: number) {
    for (const team of [0, 1] as TeamId[]) {
      const bp = BASE_POS[team];
      const col = TEAM[team].color;
      c.save();
      c.translate(bp.x, bp.y);

      // свечение
      const g = c.createRadialGradient(0, 0, 6, 0, 0, 60);
      g.addColorStop(0, TEAM[team].soft);
      g.addColorStop(1, "rgba(0,0,0,0)");
      c.fillStyle = g;
      c.fillRect(-60, -60, 120, 120);

      // корпус крепости
      c.rotate(team === 0 ? -Math.PI / 2 : Math.PI / 2);
      c.fillStyle = "rgba(8,13,24,0.95)";
      c.strokeStyle = col;
      c.lineWidth = 2;
      this.hex(c, 26);
      c.fill();
      c.stroke();
      c.fillStyle = TEAM[team].soft;
      this.hex(c, 17);
      c.fill();
      // зубцы
      void t;
      c.fillStyle = col;
      for (let i = 0; i < 3; i++) {
        c.fillRect(-13 + i * 9, -30, 6, 8);
      }
      c.rotate(team === 0 ? Math.PI / 2 : -Math.PI / 2);

      // дуга HP
      const frac = clamp(this.hp[team] / BASE_HP, 0, 1);
      c.strokeStyle = "rgba(255,255,255,0.12)";
      c.lineWidth = 4;
      c.beginPath();
      c.arc(0, 0, 38, 0, Math.PI * 2);
      c.stroke();
      c.strokeStyle = frac > 0.3 ? col : "#f87171";
      c.lineWidth = 4;
      c.lineCap = "round";
      c.beginPath();
      c.arc(0, 0, 38, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
      c.stroke();

      if (this.baseFlash[team] > 0) {
        c.globalAlpha = this.baseFlash[team] * 0.75;
        c.fillStyle = "#ffffff";
        this.hex(c, 28);
        c.fill();
        c.globalAlpha = 1;
      }
      c.restore();

      // число HP
      c.font = "700 15px Unbounded, sans-serif";
      c.textAlign = "center";
      c.fillStyle = "#e8eefc";
      c.fillText(String(Math.max(0, Math.ceil(this.hp[team]))), bp.x, bp.y + 5);
    }
  }

  private hex(c: CanvasRenderingContext2D, r: number) {
    c.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) c.moveTo(px, py);
      else c.lineTo(px, py);
    }
    c.closePath();
  }

  private drawCoins(c: CanvasRenderingContext2D, t: number) {
    for (const coin of this.coins) {
      const blink = coin.life < 3 ? (Math.sin(coin.life * 12) > 0 ? 1 : 0.25) : 1;
      const r = 9 + Math.sin(coin.phase) * 1.2;
      c.save();
      c.globalAlpha = blink;
      const g = c.createRadialGradient(coin.x, coin.y, 1, coin.x, coin.y, r * 2.4);
      g.addColorStop(0, "rgba(251,191,36,0.5)");
      g.addColorStop(1, "rgba(251,191,36,0)");
      c.fillStyle = g;
      c.fillRect(coin.x - r * 2.4, coin.y - r * 2.4, r * 4.8, r * 4.8);
      c.translate(coin.x, coin.y + Math.sin(t * 2 + coin.phase) * 2);
      c.fillStyle = "#f59e0b";
      c.beginPath();
      c.arc(0, 0, r, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#fde68a";
      c.beginPath();
      c.arc(0, 0, r * 0.68, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#b45309";
      c.font = "800 10px Rubik, sans-serif";
      c.textAlign = "center";
      c.fillText("¤", 0, 3.5);
      c.restore();
    }
  }

  private drawTowers(c: CanvasRenderingContext2D, t: number) {
    for (const tower of this.towers) {
      this.drawTowerBody(c, tower.team, tower.kind, tower.x, tower.y, tower.angle, t, tower.pulse);
    }
  }

  private drawTowerBody(
    c: CanvasRenderingContext2D,
    team: TeamId,
    kind: TowerKind,
    x: number,
    y: number,
    angle: number,
    t: number,
    pulse: number,
    ghost = false,
  ) {
    const col = TEAM[team].color;
    const def = TOWERS[kind];
    c.save();
    c.translate(x, y);
    if (ghost) c.globalAlpha = 0.85;

    // платформа
    c.fillStyle = "rgba(10,15,28,0.95)";
    c.strokeStyle = col;
    c.lineWidth = 2;
    this.hex(c, 15);
    c.fill();
    c.stroke();

    if (kind === "arrow") {
      c.rotate(angle);
      c.fillStyle = def.color;
      c.fillRect(-4, -2.6, 17, 5.2);
      c.beginPath();
      c.moveTo(13, -7);
      c.lineTo(21, 0);
      c.lineTo(13, 7);
      c.closePath();
      c.fill();
    } else if (kind === "sniper") {
      c.rotate(angle);
      c.strokeStyle = def.color;
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(-6, 0);
      c.lineTo(20, 0);
      c.stroke();
      c.fillStyle = def.color;
      c.fillRect(14, -3.4, 6, 6.8);
      c.beginPath();
      c.arc(0, 0, 5.4, 0, Math.PI * 2);
      c.fill();
    } else {
      // кристалл мороза
      const spin = t * 1.2;
      c.rotate(angle * 0.35 + Math.sin(spin) * 0.14);
      c.strokeStyle = "rgba(125,211,252,0.4)";
      c.lineWidth = 1.5;
      c.beginPath();
      c.arc(0, 0, 10 + Math.sin(spin * 2) * 1.4, 0, Math.PI * 2);
      c.stroke();
      c.rotate(Math.PI / 4);
      c.fillStyle = def.color;
      c.fillRect(-5, -5, 10, 10);
      c.fillStyle = "#e0f2fe";
      c.fillRect(-2.4, -2.4, 4.8, 4.8);
    }
    c.restore();

    if (pulse > 0) {
      c.save();
      c.translate(x, y);
      c.globalAlpha = pulse * 0.8;
      c.strokeStyle = col;
      c.lineWidth = 2;
      c.beginPath();
      c.arc(0, 0, 15 + (1 - pulse) * 26, 0, Math.PI * 2);
      c.stroke();
      c.restore();
    }
  }

  private drawUnits(c: CanvasRenderingContext2D, t: number) {
    for (const u of this.units) {
      const col = TEAM[u.team].color;
      c.save();
      c.translate(u.x, u.y);

      // тень-свечение
      const g = c.createRadialGradient(0, 0, 1, 0, 0, u.radius * 2.6);
      g.addColorStop(0, TEAM[u.team].soft);
      g.addColorStop(1, "rgba(0,0,0,0)");
      c.fillStyle = g;
      c.fillRect(-u.radius * 2.6, -u.radius * 2.6, u.radius * 5.2, u.radius * 5.2);

      c.fillStyle = "rgba(6,10,20,0.95)";
      c.strokeStyle = col;
      c.lineWidth = 2;
      if (u.kind === "fast") {
        c.rotate(u.wob * 0.25);
        c.beginPath();
        for (let i = 0; i < 3; i++) {
          const a = (i / 3) * Math.PI * 2 - Math.PI / 2;
          const px = Math.cos(a) * u.radius;
          const py = Math.sin(a) * u.radius;
          if (i === 0) c.moveTo(px, py);
          else c.lineTo(px, py);
        }
        c.closePath();
        c.fill();
        c.stroke();
      } else if (u.kind === "tank") {
        this.hex(c, u.radius);
        c.fill();
        c.stroke();
        c.strokeStyle = "rgba(255,255,255,0.35)";
        c.lineWidth = 1;
        this.hex(c, u.radius * 0.6);
        c.stroke();
      } else {
        c.beginPath();
        c.arc(0, 0, u.radius, 0, Math.PI * 2);
        c.fill();
        c.stroke();
      }

      // заморозка
      if (u.slowT > 0) {
        c.strokeStyle = "rgba(125,211,252,0.9)";
        c.lineWidth = 1.6;
        c.beginPath();
        c.arc(0, 0, u.radius + 3.5, 0, Math.PI * 2);
        c.stroke();
        c.fillStyle = "rgba(224,242,254,0.85)";
        for (let i = 0; i < 3; i++) {
          const a = t * 2 + (i / 3) * Math.PI * 2;
          c.beginPath();
          c.arc(Math.cos(a) * (u.radius + 6), Math.sin(a) * (u.radius + 6), 1.3, 0, Math.PI * 2);
          c.fill();
        }
      }
      c.restore();

      // полоска HP
      const w = 22;
      const frac = clamp(u.hp / u.maxHp, 0, 1);
      c.fillStyle = "rgba(2,6,14,0.8)";
      c.fillRect(u.x - w / 2, u.y - u.radius - 9, w, 3.4);
      c.fillStyle = frac > 0.45 ? "#4ade80" : "#f87171";
      c.fillRect(u.x - w / 2, u.y - u.radius - 9, w * frac, 3.4);
    }
  }

  private drawBuilders(c: CanvasRenderingContext2D, t: number) {
    for (const b of this.builders) {
      const col = TEAM[b.team].color;

      // шлейф
      for (const p of b.trail) {
        if (p.life <= 0) continue;
        c.globalAlpha = clamp(p.life / 0.28, 0, 1) * 0.3;
        c.fillStyle = col;
        c.beginPath();
        c.arc(p.x, p.y, 7 * (p.life / 0.28), 0, Math.PI * 2);
        c.fill();
      }
      c.globalAlpha = 1;

      const bobY = Math.sin(b.bob) * 2.2;

      // прицел башни
      if (b.aimKind) {
        const def = TOWERS[b.aimKind];
        const reason = this.canBuild(b.team, b.x, b.y);
        const afford = this.gold[b.team] >= def.cost;
        const valid = !reason && afford;
        const vcol = valid ? "rgba(74,222,128," : "rgba(248,113,113,";

        c.strokeStyle = vcol + "0.75)";
        c.fillStyle = vcol + "0.07)";
        c.lineWidth = 1.6;
        c.setLineDash([6, 7]);
        c.beginPath();
        c.arc(b.x, b.y, def.range, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.setLineDash([]);

        this.drawTowerBody(c, b.team, b.aimKind, b.x, b.y, Math.atan2(b.faceY, b.faceX), t, 0, true);

        const label = !afford
          ? `${def.name} · нужно ${def.cost} золота`
          : reason
            ? reason
            : `${def.name} · ${def.cost} золота`;
        c.font = "600 11px Rubik, sans-serif";
        const tw = c.measureText(label).width + 16;
        const lx = clamp(b.x, tw / 2 + 8, W - tw / 2 - 8);
        const ly = clamp(b.y - 40 - def.range * 0, 26, H - 10);
        c.fillStyle = "rgba(3,6,12,0.85)";
        c.strokeStyle = vcol + "0.5)";
        c.lineWidth = 1;
        c.beginPath();
        c.roundRect(lx - tw / 2, ly - 20, tw, 20, 6);
        c.fill();
        c.stroke();
        c.fillStyle = valid ? "#bbf7d0" : "#fecaca";
        c.textAlign = "center";
        c.fillText(label, lx, ly - 6);
      }

      // тело строителя
      c.save();
      c.translate(b.x, b.y + bobY);
      const g = c.createRadialGradient(0, 0, 2, 0, 0, 26);
      g.addColorStop(0, TEAM[b.team].soft);
      g.addColorStop(1, "rgba(0,0,0,0)");
      c.fillStyle = g;
      c.fillRect(-26, -26, 52, 52);

      c.fillStyle = "rgba(8,13,24,0.95)";
      c.strokeStyle = col;
      c.lineWidth = 2.4;
      c.beginPath();
      c.arc(0, 0, 13, 0, Math.PI * 2);
      c.fill();
      c.stroke();

      // направление
      c.strokeStyle = col;
      c.lineWidth = 3;
      c.lineCap = "round";
      c.beginPath();
      c.moveTo(b.faceX * 6, b.faceY * 6);
      c.lineTo(b.faceX * 17, b.faceY * 17);
      c.stroke();

      // ядро
      c.fillStyle = col;
      c.beginPath();
      c.arc(0, 0, 4.5, 0, Math.PI * 2);
      c.fill();
      c.restore();

      // тег игрока
      c.font = "800 10px Unbounded, sans-serif";
      c.textAlign = "center";
      c.fillStyle = col;
      c.fillText(TEAM[b.team].short, b.x, b.y - 20 + bobY * 0.4);
    }
  }

  private drawProjectiles(c: CanvasRenderingContext2D) {
    for (const p of this.projectiles) {
      const def = TOWERS[p.kind];
      c.strokeStyle = def.color;
      c.lineWidth = p.kind === "sniper" ? 3 : 2;
      c.lineCap = "round";
      const tl = p.kind === "sniper" ? 16 : 9;
      const d = Math.hypot(p.vx, p.vy) || 1;
      c.beginPath();
      c.moveTo(p.x - (p.vx / d) * tl, p.y - (p.vy / d) * tl);
      c.lineTo(p.x, p.y);
      c.stroke();
      c.fillStyle = "#ffffff";
      c.beginPath();
      c.arc(p.x, p.y, p.kind === "frost" ? 3 : 2, 0, Math.PI * 2);
      c.fill();
    }
  }

  private drawParticles(c: CanvasRenderingContext2D) {
    c.save();
    c.globalCompositeOperation = "lighter";
    for (const p of this.particles) {
      const a = clamp(p.life / p.maxLife, 0, 1);
      c.globalAlpha = a;
      c.fillStyle = p.color;
      c.beginPath();
      c.arc(p.x, p.y, p.size * (0.5 + a * 0.5), 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  }

  private drawTexts(c: CanvasRenderingContext2D) {
    for (const txt of this.texts) {
      c.globalAlpha = clamp(txt.life, 0, 1);
      c.font = `700 ${txt.size}px Rubik, sans-serif`;
      c.textAlign = "center";
      c.fillStyle = txt.color;
      c.fillText(txt.text, txt.x, txt.y);
    }
    c.globalAlpha = 1;
  }

  private drawDivider(c: CanvasRenderingContext2D, t: number) {
    const g = c.createLinearGradient(MID_X, 0, MID_X, H);
    g.addColorStop(0, "rgba(148,163,255,0)");
    g.addColorStop(0.5, `rgba(148,163,255,${0.35 + Math.sin(t * 2) * 0.12})`);
    g.addColorStop(1, "rgba(148,163,255,0)");
    c.fillStyle = g;
    c.fillRect(MID_X - 1.2, 0, 2.4, H);
  }

  private drawVignette(c: CanvasRenderingContext2D) {
    const g = c.createRadialGradient(W / 2, H / 2, H * 0.42, W / 2, H / 2, H * 0.95);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,0.5)");
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
  }

  /* -------------------------------------------------------------------- HUD */

  private drawHud(c: CanvasRenderingContext2D, t: number) {
    void t;
    for (const team of [0, 1] as TeamId[]) {
      const col = TEAM[team].color;
      const right = team === 1;
      const px = right ? W - 16 : 16;
      const panelW = 268;
      const x = right ? px - panelW : px;

      c.fillStyle = "rgba(4,7,13,0.72)";
      c.strokeStyle = "rgba(255,255,255,0.09)";
      c.lineWidth = 1;
      c.beginPath();
      c.roundRect(x, 12, panelW, 64, 10);
      c.fill();
      c.stroke();

      // акцентная полоска
      c.fillStyle = col;
      c.beginPath();
      c.roundRect(right ? x + panelW - 3 : x, 12, 3, 64, 2);
      c.fill();

      const tx = right ? x + panelW - 16 : x + 16;
      const align: CanvasTextAlign = right ? "right" : "left";
      c.textAlign = align;

      c.font = "800 12px Unbounded, sans-serif";
      c.fillStyle = col;
      c.fillText(TEAM[team].name, tx, 31);

      // HP и золото двумя цветными частями
      const hpTxt = `HP ${Math.max(0, Math.ceil(this.hp[team]))} · `;
      const goldTxt = `◈ ${Math.floor(this.gold[team])}`;
      c.font = "600 12.5px Rubik, sans-serif";
      const hpW = c.measureText(hpTxt).width;
      const goldW = c.measureText(goldTxt).width;
      if (right) {
        c.textAlign = "right";
        c.fillStyle = "#fde047";
        c.fillText(goldTxt, tx, 50);
        c.fillStyle = "rgba(232,238,252,0.75)";
        c.fillText(hpTxt, tx - goldW, 50);
      } else {
        c.textAlign = "left";
        c.fillStyle = "rgba(232,238,252,0.75)";
        c.fillText(hpTxt, tx, 50);
        c.fillStyle = "#fde047";
        c.fillText(goldTxt, tx + hpW, 50);
      }
      c.textAlign = align;

      // волна
      const cost = waveCost(this.wave[team]);
      c.font = "600 11px Rubik, sans-serif";
      c.fillStyle = "rgba(232,238,252,0.55)";
      const wtxt = `Волна ур.${this.wave[team]} · отправка ${cost} ◈`;
      c.fillText(wtxt, tx, 68);
    }

    // таймер по центру
    const mm = Math.floor(this.time / 60);
    const ss = Math.floor(this.time % 60);
    c.font = "800 14px Unbounded, sans-serif";
    c.textAlign = "center";
    c.fillStyle = "rgba(232,238,252,0.9)";
    c.fillText(`${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`, MID_X, 32);
    c.font = "700 9px Unbounded, sans-serif";
    c.fillStyle = "rgba(148,163,255,0.8)";
    c.fillText("V S", MID_X, 48);
  }

  private drawCountdown(c: CanvasRenderingContext2D) {
    c.fillStyle = "rgba(3,5,10,0.55)";
    c.fillRect(0, 0, W, H);
    const n = Math.ceil(this.countT);
    const frac = this.countT - Math.floor(this.countT);
    if (n <= 3 && n > 0) {
      c.save();
      c.translate(MID_X, H / 2);
      const scale = 1 + (1 - frac) * 0.12;
      c.scale(scale, scale);
      c.font = "900 120px Unbounded, sans-serif";
      c.textAlign = "center";
      c.fillStyle = "rgba(232,238,252,0.95)";
      c.shadowColor = "rgba(148,163,255,0.8)";
      c.shadowBlur = 40;
      c.fillText(String(n), 0, 40);
      c.restore();
      c.font = "600 15px Rubik, sans-serif";
      c.textAlign = "center";
      c.fillStyle = "rgba(232,238,252,0.75)";
      c.fillText("Стройте оборону и шлите волны на соперника!", MID_X, H / 2 + 92);
    }
  }
}
