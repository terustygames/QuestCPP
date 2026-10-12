// Комнаты кооператива: создать комнату с кодом, войти по коду, выйти, слушать состояние.
// Realtime Database: rooms/{code} = { host, status, createdAt, players: { [uid]: { login, joinedAt } } }.
// Правила доступа — в консоли Firebase (см. раздел про Realtime Database в CONTEXT.md).
import { get, onValue, ref, remove, runTransaction, set } from 'firebase/database';
import { auth, rtdb } from '../firebase';

export const ROOM_SIZE = 2; // игроков в комнате
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // без похожих символов (0/O, 1/I)
const CODE_LEN = 5;

export interface RoomPlayer {
  login: string;
  joinedAt: number;
}

export interface RoomState {
  host: string;
  status: 'lobby' | 'full';
  createdAt: number;
  players: Record<string, RoomPlayer>;
}

function myUid(): string {
  const u = auth.currentUser;
  if (!u) throw new Error('Для кооператива нужно войти в аккаунт');
  return u.uid;
}

function roomRef(code: string) {
  return ref(rtdb, `rooms/${code}`);
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
    const res = await runTransaction(roomRef(code), (cur) => {
      if (cur) return; // код занят — прервём транзакцию
      return {
        host: uid,
        status: 'lobby',
        createdAt: Date.now(),
        players: { [uid]: { login, joinedAt: Date.now() } },
      } satisfies RoomState;
    });
    if (res.committed) return code;
  }
  throw new Error('Не удалось создать комнату, попробуйте ещё раз');
}

// Входит в комнату по коду; комната на два игрока
export async function joinRoom(input: string, login: string): Promise<string> {
  const uid = myUid();
  const code = normalizeCode(input);
  if (code.length !== CODE_LEN) throw new Error(`Код комнаты — ${CODE_LEN} символов`);
  let error: string | null = null;
  const res = await runTransaction(roomRef(code), (cur: RoomState | null) => {
    if (!cur) {
      error = 'Комната с таким кодом не найдена';
      return;
    }
    const players = { ...(cur.players ?? {}) };
    if (!players[uid]) {
      if (Object.keys(players).length >= ROOM_SIZE) {
        error = 'Комната уже заполнена';
        return;
      }
      players[uid] = { login, joinedAt: Date.now() };
    }
    return {
      ...cur,
      players,
      status: Object.keys(players).length >= ROOM_SIZE ? 'full' : 'lobby',
    } satisfies RoomState;
  });
  if (!res.committed || error) throw new Error(error ?? 'Не удалось войти в комнату');
  return code;
}

// Выход игрока. Пустую комнату удаляем.
export async function leaveRoom(code: string): Promise<void> {
  const uid = myUid();
  const snap = await get(roomRef(code));
  if (!snap.exists()) return;
  const cur = snap.val() as RoomState;
  const players = { ...(cur.players ?? {}) };
  delete players[uid];
  if (Object.keys(players).length === 0) {
    await remove(roomRef(code));
    return;
  }
  await set(roomRef(code), { ...cur, players, status: 'lobby' } satisfies RoomState);
}

// Подписка на состояние комнаты; возвращает функцию отписки
export function watchRoom(code: string, cb: (room: RoomState | null) => void): () => void {
  return onValue(roomRef(code), (snap) => cb(snap.exists() ? (snap.val() as RoomState) : null));
}
