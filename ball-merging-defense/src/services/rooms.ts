// Комнаты кооператива в Realtime Database.
// Структура:
//   rooms/{code}/info           — { host, status: 'lobby'|'playing', createdAt, players: { [uid]: { login, joinedAt } } }
//   rooms/{code}/lives          — общие жизни (число)
//   rooms/{code}/ready/{uid}    — номер волны, к которой игрок готов
//   rooms/{code}/boards/{uid}   — снимок поля (JSON-строка, см. game/boardSnapshot.ts)
// Отдельные узлы нужны, чтобы доски не приходили вместе с лобби и не тянули лишний трафик.
// Правила доступа — в консоли Firebase (раздел про Realtime Database в CONTEXT.md).
import { get, onValue, ref, remove, runTransaction, set, update, type DatabaseReference } from 'firebase/database';
import { auth, rtdb } from '../firebase';
import { CONFIG } from '../game/config';

export const ROOM_SIZE = 2; // игроков в комнате
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // без похожих символов (0/O, 1/I)
const CODE_LEN = 5;

export interface RoomPlayer {
  login: string;
  joinedAt: number;
}

export interface RoomInfo {
  host: string;
  status: 'lobby' | 'playing';
  createdAt: number;
  players: Record<string, RoomPlayer>;
}

export function myUid(): string {
  const u = auth.currentUser;
  if (!u) throw new Error('Для кооператива нужно войти в аккаунт');
  return u.uid;
}

function roomRef(code: string, sub = ''): DatabaseReference {
  return ref(rtdb, `rooms/${code}${sub ? '/' + sub : ''}`);
}

export function normalizeCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function randomCode(): string {
  let s = '';
  for (let i = 0; i < CODE_LEN; i++) s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return s;
}

// Создаёт комнату с новым кодом (проверяет, что такого кода ещё нет)
export async function createRoom(login: string): Promise<string> {
  const uid = myUid();
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode();
    const res = await runTransaction(roomRef(code, 'info'), (cur) => {
      if (cur) return; // код занят — прервём транзакцию
      return {
        host: uid,
        status: 'lobby',
        createdAt: Date.now(),
        players: { [uid]: { login, joinedAt: Date.now() } },
      } satisfies RoomInfo;
    });
    if (res.committed) return code;
  }
  throw new Error('Не удалось создать комнату, попробуйте ещё раз');
}

// Входит в комнату по коду; комната на два игрока.
// Сначала читаем комнату с сервера (get), а не транзакцией: транзакция без данных
// в кэше сразу отменяется, и комната ошибочно считалась бы ненайденной.
export async function joinRoom(input: string, login: string): Promise<string> {
  const uid = myUid();
  const code = normalizeCode(input);
  if (code.length !== CODE_LEN) throw new Error(`Код комнаты — ${CODE_LEN} символов`);
  const snap = await get(roomRef(code, 'info'));
  const cur = (snap.val() as RoomInfo | null) ?? null;
  if (!cur) throw new Error(`Комната ${code} не найдена в базе. Проверьте код или создайте комнату заново`);
  const players = { ...(cur.players ?? {}) };
  if (players[uid]) return code; // уже в этой комнате (например, после перезапуска)
  if (cur.status !== 'lobby') throw new Error('Игра в этой комнате уже идёт');
  if (Object.keys(players).length >= ROOM_SIZE) throw new Error('Комната уже заполнена');
  await set(roomRef(code, `info/players/${uid}`), { login, joinedAt: Date.now() });
  return code;
}

// Хост запускает игру: общие жизни и статус playing
export async function startRoom(code: string): Promise<void> {
  await set(roomRef(code, 'lives'), CONFIG.lives);
  await set(roomRef(code, 'ready'), null);
  await update(roomRef(code, 'info'), { status: 'playing' });
}

// Выход из комнаты. Если в комнате никого не осталось, комната удаляется.
export async function leaveRoom(code: string): Promise<void> {
  const uid = myUid();
  const infoSnap = await get(roomRef(code, 'info'));
  const info = infoSnap.val() as RoomInfo | null;
  await remove(roomRef(code, `boards/${uid}`));
  await remove(roomRef(code, `ready/${uid}`));
  if (!info) return;
  const players = { ...(info.players ?? {}) };
  delete players[uid];
  if (Object.keys(players).length === 0) {
    await remove(roomRef(code));
  } else {
    await update(roomRef(code, 'info'), { players });
  }
}

// Подписка на комнату: null — комната удалена
export function watchInfo(code: string, cb: (info: RoomInfo | null) => void): () => void {
  return onValue(roomRef(code, 'info'), (snap) => cb((snap.val() as RoomInfo | null) ?? null));
}

export function watchValue(code: string, sub: string, cb: (val: unknown) => void): () => void {
  return onValue(roomRef(code, sub), (snap) => cb(snap.val()));
}

export function setReady(code: string, uid: string, wave: number): Promise<void> {
  return set(roomRef(code, `ready/${uid}`), wave);
}

export function publishBoard(code: string, uid: string, json: string): Promise<void> {
  return set(roomRef(code, `boards/${uid}`), json);
}

// Общие жизни: каждый игрок отправляет дельту своих утечек
export function leakLives(code: string, dmg: number): Promise<unknown> {
  return runTransaction(roomRef(code, 'lives'), (cur: number | null) => {
    const base = typeof cur === 'number' ? cur : CONFIG.lives;
    return Math.max(0, base - dmg);
  });
}

// Сдаться: общие жизни в ноль, у обоих игроков конец забега
export function endRoomGame(code: string): Promise<unknown> {
  return set(roomRef(code, 'lives'), 0);
}
