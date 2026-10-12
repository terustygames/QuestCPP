// Сессия кооперативной игры: связывает движок игрока с комнатой в Realtime Database.
// - своё поле публикуется в rooms/{code}/boards/{uid} примерно 4 раза в секунду;
// - поле напарника подтягивается из rooms/{code}/boards/{other} в движок remote (только просмотр);
//   его враги попадают в мой движок как «чужие» (me.setForeign): мои снаряды и иглы бьют и их;
// - мои попадания по врагам напарника и награды за убийства уходят ему через rooms/{code}/inbox/{other};
//   входящие сообщения применяются к моим врагам и наградам (me.applyHit, me.creditShared);
// - волна стартует, когда готовы оба игрока (вышедший не мешает: его не ждём);
// - жизни общие: утечки уходят дельтой транзакцией, локальный движок берёт общее значение;
// - выход из матча: флаг rooms/{code}/left/{uid}, поле напарника помечается серым;
// - ускорение: скорость меняется, только когда оба игрока голосуют за одно и то же
//   (rooms/{code}/speed/{uid}); согласованное значение — rooms/{code}/speed/value.
import type { Engine } from '../game/engine';
import { applySnapshot, decodeSnapshot, encodeSnapshot, snapshotOf } from '../game/boardSnapshot';
import {
  endRoomGame,
  leakLives,
  leaveRoom,
  publishBoard,
  sendInbox,
  setAgreedSpeed,
  setLeft,
  setReady,
  setSpeedVote,
  watchInbox,
  watchInfo,
  watchValue,
  type RoomInfo,
} from './rooms';

const PUBLISH_MS = 250;

export interface CoopHooks {
  onRemoteLeft?: (left: boolean) => void;
  onRemoteLogin?: (login: string) => void;
  // согласованная скорость и мой текущий голос (null — голоса нет)
  onSpeed?: (agreed: 1 | 2, mine: 1 | 2 | null) => void;
}

export class CoopSession {
  private timer: ReturnType<typeof setInterval> | null = null;
  private unsubs: (() => void)[] = [];
  private unsubBoard: (() => void) | null = null;
  // напарник запоминается, даже если он уже вышел из комнаты
  private remoteUid: string | null = null;
  private hasInfo = false;
  private ready: Record<string, unknown> = {};
  private left: Record<string, unknown> = {};
  private sharedLives: number | null = null;
  private appliedLives: number | null = null;
  private sentLeak = 0;
  private publishedReady = -1;
  private stopped = false;
  private speedVotes: Record<string, unknown> = {};
  private agreedSpeed: 1 | 2 = 1;
  private myVote: 1 | 2 | null = null;

  constructor(
    private readonly code: string,
    private readonly uid: string,
    private readonly me: Engine,
    private readonly remote: Engine,
    private readonly hooks: CoopHooks = {},
  ) {}

  start(): void {
    // при восстановлении матча прошлые утечки уже учтены в общих жизнях
    this.sentLeak = this.me.leakDamage;
    this.unsubs.push(
      watchInfo(this.code, (info) => this.onInfo(info)),
      watchValue(this.code, 'lives', (v) => {
        this.sharedLives = typeof v === 'number' ? v : null;
      }),
      watchValue(this.code, 'ready', (v) => {
        this.ready = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>;
      }),
      watchValue(this.code, 'left', (v) => {
        this.left = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>;
        this.hooks.onRemoteLeft?.(this.remoteLeft());
        this.syncForeign();
      }),
      watchInbox(this.code, this.uid, (msg) => this.onInbox(msg)),
      watchValue(this.code, 'speed', (v) => {
        this.speedVotes = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>;
        this.resolveSpeed();
      }),
    );
    this.timer = setInterval(() => this.tick(), PUBLISH_MS);
  }

  // Мой голос за скорость: 1 или 2. Скорость поменяется, когда проголосует и напарник.
  vote(speed: 1 | 2): void {
    if (this.stopped) return;
    this.myVote = speed;
    setSpeedVote(this.code, this.uid, speed).catch(() => {});
    this.resolveSpeed();
  }

  // Заявки обоих совпали и отличаются от согласованной — записываем её.
  // Записать может любой из двоих: одинаковое значение не портит друг друга.
  private resolveSpeed(): void {
    if (this.stopped) return;
    const v = this.speedVotes.value;
    const agreed: 1 | 2 = v === 2 ? 2 : 1;
    if (agreed !== this.agreedSpeed) this.agreedSpeed = agreed;
    this.hooks.onSpeed?.(this.agreedSpeed, this.myVote);
    const theirs = this.remoteUid ? this.speedVotes[this.remoteUid] : undefined;
    if (this.myVote !== null && theirs === this.myVote && this.myVote !== agreed) {
      setAgreedSpeed(this.code, this.myVote).catch(() => {});
    }
  }

  private remoteLeft(): boolean {
    return !!this.remoteUid && !!this.left[this.remoteUid];
  }

  // Враги напарника со снимка — в мой движок (мои снаряды бьют и их). Вышедший не воюет.
  private syncForeign(): void {
    this.me.setForeign(this.remoteLeft() ? [] : this.remote.enemies, this.remote.now);
  }

  // Входящие: попадания по моим врагам и награды за убийства напарника
  private onInbox(msg: string): void {
    if (this.stopped) return;
    let data: { h?: [number, number][]; k?: number } | null = null;
    try {
      data = JSON.parse(msg);
    } catch {
      return;
    }
    if (!data) return;
    for (const [id, d] of data.h ?? []) this.me.applyHit(id, d);
    if (data.k && data.k > 0) this.me.creditShared(data.k);
  }

  // Исходящие: мои попадания по врагам напарника и награды за мои убийства
  private flushOutbox(): void {
    const me = this.me;
    const hits = me.takeHits();
    const kills = me.takeKills();
    if (!this.remoteUid || this.remoteLeft() || (!hits.length && !kills)) return;
    sendInbox(this.code, this.remoteUid, JSON.stringify({ h: hits, k: kills })).catch(() => {});
  }

  private onInfo(info: RoomInfo | null): void {
    if (this.stopped) return;
    if (!info) {
      // комната удалена: общий конец
      this.hasInfo = false;
      this.me.forceGameOver();
      return;
    }
    this.hasInfo = true;
    const others = Object.keys(info.players ?? {}).filter((u) => u !== this.uid);
    if (others.length > 0 && others[0] !== this.remoteUid) {
      this.unsubBoard?.();
      this.remoteUid = others[0];
      this.unsubBoard = watchValue(this.code, `boards/${this.remoteUid}`, (raw) => {
        if (typeof raw !== 'string') return;
        let parsed: unknown = null;
        try {
          parsed = JSON.parse(raw);
        } catch {
          return;
        }
        const snap = decodeSnapshot(parsed);
        if (!snap) return;
        applySnapshot(this.remote, snap);
        this.syncForeign();
      });
      const login = info.players[this.remoteUid]?.login;
      if (login) this.hooks.onRemoteLogin?.(login);
    }
    if (this.remoteUid) {
      const login = info.players?.[this.remoteUid]?.login;
      if (login) this.hooks.onRemoteLogin?.(login);
    }
  }

  private tick(): void {
    if (this.stopped) return;
    const me = this.me;

    // 1. своё поле — напарнику
    if (me.status !== 'title') {
      publishBoard(this.code, this.uid, encodeSnapshot(snapshotOf(me))).catch(() => {});
    }

    // 1б. попадания по врагам напарника и награды — ему в очередь
    this.flushOutbox();

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

    // 5. старт волны: я готов и напарник готов (или уже вышел из матча)
    if (me.status === 'prep' && this.remoteUid) {
      const iAmReady = this.ready[this.uid] === me.wave;
      const partnerReady = this.remoteLeft() || this.ready[this.remoteUid] === me.wave;
      if (iAmReady && partnerReady) me.startWave();
    }
  }

  // Выход из матча: напарник увидит серое поле, мой движок останавливается.
  leaveMatch(): void {
    if (this.hasInfo) setLeft(this.code, this.uid).catch(() => {});
    this.stop(true);
  }

  // Конец забега для обоих (сдаться в паузе)
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
