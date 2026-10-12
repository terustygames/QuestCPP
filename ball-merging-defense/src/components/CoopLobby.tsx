// Лобби кооператива: создать комнату или войти по коду, видеть игроков, хост запускает игру.
// Переход в игру — по статусу комнаты 'playing' (одинаково для хоста и гостя).
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Copy, LogOut, Play, Users } from 'lucide-react';
import type { AccountView } from './AccountDrawer';
import { errorMessage } from '../firebase';
import { ROOM_SIZE, createRoom, joinRoom, leaveRoom, normalizeCode, startRoom, watchInfo, type RoomInfo } from '../services/rooms';
import { META_CFG } from '../game/meta';

// Подставляется сборкой (vite.config.ts): время сборки этой версии игры
declare const __BUILD_STAMP__: string;

export function CoopLobby({
  account,
  deckReady,
  onBack,
  onStart,
}: {
  account: AccountView;
  deckReady: boolean;
  onBack: () => void;
  onStart: (code: string) => void;
}) {
  const [code, setCode] = useState<string | null>(null);
  const [info, setInfo] = useState<RoomInfo | null>(null);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);
  const onStartRef = useRef(onStart);
  onStartRef.current = onStart;

  // Подписка на комнату
  useEffect(() => {
    if (!code) return;
    started.current = false;
    return watchInfo(code, (next) => {
      if (!next) {
        setInfo(null);
        setCode(null);
        setError('Комната закрыта');
        return;
      }
      setInfo(next);
      if (next.status === 'playing' && !started.current) {
        started.current = true;
        onStartRef.current(code);
      }
    });
  }, [code]);

  const inRoom = code !== null;
  const players = info ? Object.values(info.players ?? {}) : [];
  const isHost = !!info && info.host === account.uid;
  const full = players.length >= ROOM_SIZE;

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const create = () =>
    run(async () => {
      const c = await createRoom(account.login);
      setCode(c);
    });

  const join = () =>
    run(async () => {
      const c = await joinRoom(input, account.login);
      setCode(normalizeCode(c));
    });

  const start = () =>
    run(async () => {
      if (!code) return;
      await startRoom(code);
    });

  const leave = async () => {
    if (code) await leaveRoom(code).catch(() => undefined);
    setCode(null);
    setInfo(null);
    setError(null);
  };

  const back = async () => {
    if (code) await leaveRoom(code).catch(() => undefined);
    onBack();
  };

  const copy = () => {
    if (!code) return;
    try {
      void navigator.clipboard?.writeText(code);
    } catch {
      // буфер обмена недоступен — код можно просто прочитать
    }
  };

  const notReady = !account || account.status !== 'in';

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#0b0e18] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,#1d3a5a_0%,#121b33_50%,#0b0e18_80%)]" />
      <header
        className="relative z-10 flex shrink-0 items-center gap-2 px-3"
        style={{ paddingTop: 'max(10px, env(safe-area-inset-top))' }}
      >
        <button
          onClick={back}
          aria-label="Назад"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-slate-950/70 text-slate-200 active:scale-95"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="font-display text-[17px] font-bold">Вдвоём</div>
      </header>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-6 pt-4">
        <div className="relative z-10 shrink-0 px-4 text-[11px] text-slate-500">версия игры: {__BUILD_STAMP__}</div>

      {notReady ? (
          <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-[14px] text-amber-100">
            Для игры вдвоём нужен вход в аккаунт. Откройте меню «три полоски» → «Аккаунт».
          </div>
        ) : !deckReady ? (
          <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-[14px] text-amber-100">
            Соберите колоду из {META_CFG.deckSize} шариков в инвентаре, чтобы играть.
          </div>
        ) : !inRoom ? (
          <>
            <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
              <div className="text-[13px] font-bold text-slate-300">Создать комнату</div>
              <div className="mt-1 text-[12px] text-slate-400">Получите код и отправьте его напарнику.</div>
              <button
                onClick={create}
                disabled={busy}
                className="mt-3 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 px-4 text-[15px] font-extrabold text-slate-950 transition active:scale-[0.98] disabled:opacity-50"
              >
                <Users size={18} /> Создать комнату
              </button>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
              <div className="text-[13px] font-bold text-slate-300">Войти по коду</div>
              <div className="mt-3 flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(normalizeCode(e.target.value))}
                  maxLength={5}
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="КОД"
                  aria-label="Код комнаты"
                  className="min-h-[48px] min-w-0 flex-1 rounded-xl border border-white/15 bg-black/30 px-3 text-center font-mono text-[18px] font-bold tracking-[0.3em] text-white outline-none focus:border-emerald-400/60"
                />
                <button
                  onClick={join}
                  disabled={busy || input.length !== 5}
                  className="min-h-[48px] rounded-xl border border-white/15 bg-white/[0.06] px-5 text-[14px] font-bold text-white transition active:scale-[0.98] disabled:opacity-40"
                >
                  Войти
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-center">
              <div className="text-[12px] font-bold uppercase tracking-wider text-slate-400">Код комнаты</div>
              <div className="mt-1 font-mono text-[32px] font-black tracking-[0.25em] text-amber-300">{code}</div>
              <button
                onClick={copy}
                className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-bold text-slate-300 active:scale-95"
              >
                <Copy size={13} /> Скопировать
              </button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
              <div className="text-[13px] font-bold text-slate-300">Игроки ({players.length}/{ROOM_SIZE})</div>
              <ul className="mt-2 flex flex-col gap-2">
                {Array.from({ length: ROOM_SIZE }).map((_, i) => {
                  const entry = Object.entries(info?.players ?? {})[i];
                  return (
                    <li
                      key={i}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-black/25 px-3 py-2.5"
                    >
                      <span className="text-[14px] font-bold text-slate-100">
                        {entry ? entry[1].login : 'ждём игрока…'}
                      </span>
                      <span className="text-[12px] text-slate-400">
                        {entry && info?.host === entry[0] ? 'хост' : entry ? (entry[0] === account.uid ? 'вы' : '') : ''}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            {isHost ? (
              <button
                onClick={start}
                disabled={!full || busy}
                className="flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-amber-300 to-orange-500 px-4 text-[16px] font-extrabold text-slate-950 transition active:scale-[0.98] disabled:opacity-40"
              >
                <Play size={18} /> {full ? 'Начать игру' : 'Нужен второй игрок'}
              </button>
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-center text-[13px] text-slate-300">
                {full ? 'Ждём, пока хост начнёт игру…' : 'Ждём второго игрока…'}
              </div>
            )}

            <button
              onClick={leave}
              className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] px-4 text-[14px] font-bold text-slate-200 active:scale-[0.98]"
            >
              <LogOut size={16} /> Выйти из комнаты
            </button>
          </>
        )}

        {error && (
          <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-center text-[13px] text-rose-200">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
