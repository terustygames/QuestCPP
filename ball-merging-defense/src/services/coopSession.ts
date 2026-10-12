// Сессия кооперативной игры: связывает движок игрока с комнатой в Realtime Database.
// - своё поле публикуется в rooms/{code}/boards/{uid} примерно 4 раза в секунду;
// - поле напарника подтягивается из rooms/{code}/boards/{other} в движок remote (только просмотр);
// - волна стартует, когда оба игрока готовы к одному номеру волны (ready);
// - жизни общие: утечки уходят дельтой транзакцией, локальный движок берёт общее значение.
import type { Engine } from '../game/engine';
import { applySnapshot, decodeSnapshot, encodeSnapshot, snapshotOf } from '../game/boardSnapshot';
import {
  endRoomGame,
  leakLives,
  leaveRoom,
  publishBoard,
  ROOM_SIZE,
  setReady,
  watchInfo,
  watchValue,
  type RoomInfo,
} from './rooms';

const PUBLISH_MS = 250;

export class CoopSession {
  private timer: ReturnType<typeof setInterval> | null = null;
  private unsubs: (() => void)[] = [];
  private unsubBoard: (() => void) | null = null;
  private remoteUid: string | null = null;
  private players = 0;
  private ready: Record<string, unknown> = {};
  private sharedLives: number | null = null;
  private appliedLives: number | null = null;
  private sentLeak = 0;
  private publishedReady = -1;
  private stopped = false;

  constructor(
    private readonly code: string,
    private readonly uid: string,
    private readonly me: Engine,
    private readonly remote: Engine,
  ) {}

  start(): void {
    this.unsubs.push(
      watchInfo(this.code, (info) => this.onInfo(info)),
      watchValue(this.code, 'lives', (v) => {
        this.sharedLives = typeof v === 'number' ? v : null;
      }),
      watchValue(this.code, 'ready', (v) => {
        this.ready = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>;
      }),
    );
    this.timer = setInterval(() => this.tick(), PUBLISH_MS);
  }

  private onInfo(info: RoomInfo | null): void {
    if (this.stopped) return;
    if (!info) {
      // комната удалена: общий конец
      this.me.forceGameOver();
      return;
    }
    const others = Object.keys(info.players ?? {}).filter((u) => u !== this.uid);
    this.players = Object.keys(info.players ?? {}).length;
    const remote = others[0] ?? null;
    if (remote !== this.remoteUid) {
      this.unsubBoard?.();
      this.unsubBoard = null;
      this.remoteUid = remote;
      if (remote) {
        this.unsubBoard = watchValue(this.code, `boards/${remote}`, (raw) => {
          if (typeof raw !== 'string') return;
          let parsed: unknown = null;
          try {
            parsed = JSON.parse(raw);
          } catch {
            return;
          }
          const snap = decodeSnapshot(parsed);
          if (snap) applySnapshot(this.remote, snap);
        });
      }
    }
  }

  private tick(): void {
    if (this.stopped) return;
    const me = this.me;

    // 1. своё поле — напарнику
    if (me.status !== 'title') {
      publishBoard(this.code, this.uid, encodeSnapshot(snapshotOf(me))).catch(() => {});
    }

    // 2. готовность к волне
    if (me.status === 'prep' && this.publishedReady !== me.wave) {
      this.publishedReady = me.wave;
      setReady(this.code, this.uid, me.wave).catch(() => {});
    }

    // 3. утечки → общие жизни (дельта)
    const delta = me.leakDamage - this.sentLeak;
    if (delta > 0) {
      this.sentLeak = me.leakDamage;
      leakLives(this.code, delta).catch(() => {});
    }

    // 4. общие жизни → локальный движок
    if (this.sharedLives !== null && this.sharedLives !== this.appliedLives) {
      this.appliedLives = this.sharedLives;
      me.lives = this.sharedLives;
    }
    if (me.status !== 'gameover' && this.sharedLives !== null && this.sharedLives <= 0) {
      me.forceGameOver();
    }

    // 5. старт волны: оба готовы к этому номеру волны
    if (me.status === 'prep' && this.players >= ROOM_SIZE && this.remoteUid) {
      const bothReady = this.ready[this.uid] === me.wave && this.ready[this.remoteUid] === me.wave;
      if (bothReady) me.startWave();
    }
  }

  // Конец забега для обоих (сдаться или выход из игры)
  endForBoth(): void {
    endRoomGame(this.code).catch(() => {});
  }

  stop(leave: boolean): void {
    if (this.stopped) return;
    this.stopped = true;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.unsubBoard?.();
    this.unsubBoard = null;
    for (const u of this.unsubs) u();
    this.unsubs = [];
    if (leave) leaveRoom(this.code).catch(() => {});
  }
}
