// ============================================================
// App: экраны (главное меню, магазин, инвентарь, игра) и состояние UI.
// Сцена рисуется на <canvas> в GameStage (60 fps, вне React).
// React обновляет только HUD — 10 раз в секунду.
// Мета-прогресс (монеты, колода, деревья) живёт в meta.ts и хранится
// в localStorage; итоги забега начисляются один раз, при конце забега.
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { Engine, type EngineEvent } from './game/engine';
import { CONFIG, type BossId, type OrbType } from './game/config';
import { initAudio, setMuted } from './game/audio';
import { describeMods } from './game/skills';
import {
  defaultMeta,
  loadMeta,
  rollChest,
  saveMeta,
  settleRun,
  startRun as prepareRun,
  todayKey,
  type MetaState,
  type RunSettlement,
} from './game/meta';
import {
  deleteCurrentPlayer,
  errorMessage,
  loginOf,
  onPlayerChanged,
  registerPlayer,
  signInPlayer,
  signOutPlayer,
} from './firebase';
import { createCloudProfile, flushCloudSave, loadCloudMeta, scheduleCloudSave } from './services/playProfile';
import { GameStage } from './components/GameStage';
import { Header, Controls, DeckBar, DeckInfoPopup } from './components/Hud';
import { HelpOverlay, GameOverOverlay } from './components/Overlays';
import { BossRoulette } from './components/BossRoulette';
import { MainMenu } from './components/MainMenu';
import { Shop } from './components/Shop';
import { Inventory } from './components/Inventory';
import { CoopLobby } from './components/CoopLobby';
import { CoopSession } from './services/coopSession';
import { checkRoom } from './services/rooms';
import { clearRun, loadRun, restoreEngine, saveRun, serializeEngine, type SavedRun } from './game/runSave';
import { deckReady } from './game/meta';

type Screen = 'menu' | 'shop' | 'inventory' | 'coop' | 'game';

// Состояние аккаунта: гость (по умолчанию), проверка облака, вошедший игрок
type Account = { status: 'guest' | 'checking' | 'in'; login: string; uid: string };

// Виброотклик (работает на Android; на iPhone браузеры не дают — просто игнорируем)
function buzz(pattern: number | number[]) {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(pattern);
  } catch {
    // нет вибромотора — не страшно
  }
}

function onEngineEvent(ev: EngineEvent) {
  switch (ev) {
    case 'leak':
      buzz([40, 60, 40]);
      break;
    case 'kill':
      buzz(12);
      break;
    case 'boss':
      buzz([30, 50, 30]);
      break;
    case 'clear':
      buzz(35);
      break;
    case 'detonate':
      buzz(70);
      break;
    case 'upgrade':
      buzz(20);
      break;
    case 'gameover':
      buzz([90, 60, 90, 60, 220]);
      break;
  }
}

function newEngine(): Engine {
  const e = new Engine();
  e.onEvent = onEngineEvent;
  return e;
}

// Ручка для тестов и отладки: window.__orbital.g — текущий движок
declare global {
  interface Window {
    __orbital?: { g: Engine };
  }
}

export default function App() {
  // Матч, сохранённый до обновления страницы (поле, волна, жизни)
  const [boot] = useState(() => {
    const saved = loadRun();
    let eng: Engine | null = null;
    if (saved) {
      try {
        eng = restoreEngine(saved.engine);
        eng.onEvent = onEngineEvent;
        if (eng.status !== 'prep' && eng.status !== 'wave') eng = null;
      } catch {
        eng = null;
      }
    }
    return { saved: eng ? saved : null, engine: eng };
  });
  const engRef = useRef<Engine | null>(null);
  if (!engRef.current) engRef.current = boot.engine ?? newEngine();
  const g = engRef.current;
  // кооператив: поле напарника (только просмотр) и сессия связи с комнатой
  const remoteRef = useRef<Engine | null>(null);
  if (!remoteRef.current) remoteRef.current = new Engine();
  const remote = remoteRef.current;
  const coopRef = useRef<CoopSession | null>(null);
  const coopCodeRef = useRef<string>('');
  const [coopOn, setCoopOn] = useState(false);
  const [remoteLeft, setRemoteLeft] = useState(false);
  const [remoteLogin, setRemoteLogin] = useState('');
  const [leaveAsk, setLeaveAsk] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  // сначала выясняем, вошёл ли игрок (нужно для возобновления кооперативного матча)
  const [authReady, setAuthReady] = useState(false);
  // сохранённый кооперативный матч ждёт входа в аккаунт
  const pendingCoop = useRef<SavedRun | null>(boot.saved?.kind === 'coop' ? boot.saved : null);

  const [screen, setScreen] = useState<Screen>(boot.saved?.kind === 'solo' ? 'game' : 'menu');
  // Гость играет сразу, без входа: мета хранится на устройстве (orbital.meta.v1).
  // Аккаунт необязательный: вход или регистрация — во вкладке «Аккаунт» меню.
  // Аккаунт: мета только в облаке (Firestore), локальной копии нет.
  const [meta, setMeta] = useState<MetaState>(() => loadMeta());
  const [account, setAccount] = useState<Account>({ status: 'guest', login: '', uid: '' });
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const cloudLoaded = useRef(false);
  // регистрация в процессе: слушатель входа не должен создавать профиль сам
  const registering = useRef(false);
  const updateMeta = useCallback((fn: (m: MetaState) => MetaState) => {
    setMeta((prev) => fn(prev));
  }, []);

  // Вход и выход игрока (в том числе восстановление сессии при запуске)
  useEffect(
    () =>
      onPlayerChanged(async (user) => {
        setAuthReady(true);
        if (registering.current) return; // профиль создаст createAccount
        if (!user) {
          cloudLoaded.current = false;
          setMeta(loadMeta()); // назад к гостевой мете
          setAccount({ status: 'guest', login: '', uid: '' });
          return;
        }
        const login = loginOf(user);
        setAccount({ status: 'checking', login, uid: user.uid });
        try {
          let cloud = await loadCloudMeta();
          if (!cloud) {
            cloud = defaultMeta();
            await createCloudProfile(cloud, login);
          }
          cloudLoaded.current = true;
          setMeta(cloud);
          setAuthNotice(null);
          setAccount({ status: 'in', login, uid: user.uid });
        } catch (e) {
          setAuthNotice(`Не удалось войти в аккаунт: ${errorMessage(e)}`);
          await signOutPlayer().catch(() => undefined);
        }
      }),
    []
  );

  // Сохранение: гость — на устройство; аккаунт — в облако с небольшой задержкой
  useEffect(() => {
    if (account.status === 'guest') saveMeta(meta);
    else if (account.status === 'in' && cloudLoaded.current) scheduleCloudSave(meta, account.login);
  }, [meta, account]);

  // Сохранить облако, когда вкладку сворачивают или закрывают
  useEffect(() => {
    const flush = () => void flushCloudSave();
    const onHide = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, []);

  // Регистрация: прогресс гостя переносится в новый аккаунт. Гостевая мета на устройстве остаётся.
  // Если профиль в облаке не записался, аккаунт удаляется — не остаётся пустых аккаунтов.
  const createAccount = async (login: string, password: string) => {
    if (account.status !== 'guest') throw new Error('Вы уже вошли в аккаунт');
    const seed = meta;
    registering.current = true;
    try {
      const user = await registerPlayer(login, password);
      try {
        await createCloudProfile(seed, loginOf(user));
      } catch (e) {
        await deleteCurrentPlayer().catch(() => undefined);
        throw new Error(errorMessage(e)); // уже содержит «Облачное сохранение недоступно»
      }
      cloudLoaded.current = true;
      setMeta(seed);
      setAuthNotice(null);
      setAccount({ status: 'in', login: loginOf(user), uid: user.uid });
    } finally {
      registering.current = false;
    }
  };

  // Вход в существующий аккаунт: облачная мета заменяет гостевую на экране; гостевая сохраняется
  const signIn = async (login: string, password: string) => {
    if (account.status !== 'guest') throw new Error('Вы уже вошли в аккаунт');
    await signInPlayer(login, password);
  };

  const logout = async () => {
    await flushCloudSave();
    if (coopRef.current) coopRef.current.stop(true);
    coopRef.current = null;
    setScreen('menu');
    await signOutPlayer().catch(() => undefined);
  };

  const [, setFrame] = useState(0);
  const [paused, setPaused] = useState(!!boot.saved);
  const [speed, setSpeed] = useState(1);
  const [muted, setMutedState] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  // номер волны, для которой рулетка уже отыграна (не показывать дважды)
  const [rouletteWave, setRouletteWave] = useState(0);
  // тип, для которого открыта панель характеристик из колоды
  const [deckInfo, setDeckInfo] = useState<OrbType | null>(null);
  // забег, за который уже начислена награда (защита от двойного начисления)
  const rewardedFor = useRef<Engine | null>(null);
  // итог последнего забега (для оверлея конца забега)
  const [settlement, setSettlement] = useState<RunSettlement | null>(null);

  // HUD: лёгкая перерисовка 10 раз/сек (числа, статусы)
  useEffect(() => {
    const id = window.setInterval(() => setFrame((f) => f + 1), 100);
    return () => window.clearInterval(id);
  }, []);

  // Горячие клавиши (на телефоне все действия есть кнопками).
  // В меню движок не активен, поэтому клавиши действуют только в забеге.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const game = engRef.current!;
      const active = game.status === 'prep' || game.status === 'wave';
      if (e.code === 'Space') {
        e.preventDefault();
        if (active) game.toggleMode();
      } else if (e.code === 'Enter') {
        if (game.status === 'prep') game.callWaveNow();
      } else if (e.code === 'KeyP' || e.code === 'Escape') {
        if (active) setPaused((p) => !p);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Автопауза, когда вкладка/приложение скрыта
  useEffect(() => {
    const onVis = () => {
      const game = engRef.current!;
      if (document.hidden && (game.status === 'prep' || game.status === 'wave')) setPaused(true);
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  // Сохранение матча: раз в секунду, пока идёт бой (обновление страницы ничего не сбрасывает)
  useEffect(() => {
    if (screen !== 'game') return;
    const id = window.setInterval(() => {
      const game = engRef.current!;
      if (game.status !== 'prep' && game.status !== 'wave') return;
      saveRun({
        v: 1,
        kind: coopOn ? 'coop' : 'solo',
        code: coopOn ? coopCodeRef.current : undefined,
        uid: coopOn ? account.uid : undefined,
        engine: serializeEngine(game),
        savedAt: Date.now(),
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [screen, coopOn, account.uid]);

  // Возобновление кооперативного матча после обновления страницы: нужен вход и живая комната
  useEffect(() => {
    const pend = pendingCoop.current;
    if (!pend || !authReady) return;
    pendingCoop.current = null;
    const code = pend.code;
    if (account.status !== 'in' || account.uid !== pend.uid || !code) {
      clearRun();
      setNotice('Матч не восстановлен: войдите в тот же аккаунт');
      return;
    }
    checkRoom(code)
      .then((info) => {
        const stillIn = !!info && info.status === 'playing' && !!info.players?.[account.uid];
        if (!stillIn) {
          clearRun();
          setNotice('Матч уже закрыт');
          return;
        }
        const game = engRef.current!;
        attachCoop(code, account.uid, game);
        setPaused(true); // после возвращения — пауза, чтобы игрок огляделся
        setScreen('game');
        setFrame((f) => f + 1);
      })
      .catch(() => {
        clearRun();
        setNotice('Не удалось восстановить матч: нет связи с сервером');
      });
  }, [authReady, account.status, account.uid]);

  // Сообщение сверху (исчезает само)
  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(id);
  }, [notice]);

  // Конец забега (поражение или сдача): начислить монеты и очки прокачки
  // за пройденные волны. Один раз на забег.
  // Сундук после забега бросается один раз, здесь же (settleRun — чистая функция).
  useEffect(() => {
    if (g.status !== 'gameover' || rewardedFor.current === g) return;
    rewardedFor.current = g;
    clearRun(); // матч окончен: восстанавливать нечего
    const res = settleRun(meta, g.wave, rollChest());
    setSettlement(res.reward);
    updateMeta(() => res.meta);
  }, [g, g.status, meta, updateMeta]);

  // Старт забега: колода и дерево навыков из меню, запасы (бусты) — расходуются
  const startNewRun = () => {
    initAudio();
    clearRun();
    if (coopRef.current) stopCoop(true);
    const prepared = prepareRun(meta);
    updateMeta(() => prepared.meta);
    setSettlement(null);
    const game = newEngine();
    engRef.current = game;
    game.startGame(prepared.run);
    setPaused(false);
    setHelpOpen(false);
    setRouletteWave(0);
    setDeckInfo(null);
    setScreen('game');
    setFrame((f) => f + 1);
  };

  // Подключить кооперативную сессию к движку игрока (старт и возобновление)
  const attachCoop = (code: string, uid: string, game: Engine) => {
    coopRef.current?.stop(false);
    coopCodeRef.current = code;
    const other = new Engine();
    remoteRef.current = other;
    setRemoteLeft(false);
    setRemoteLogin('');
    const session = new CoopSession(code, uid, game, other, {
      onRemoteLeft: (v) => setRemoteLeft(v),
      onRemoteLogin: (name) => setRemoteLogin(name),
    });
    coopRef.current = session;
    session.start();
    setCoopOn(true);
  };

  // Кооператив: старт забега вдвоём (по коду комнаты, когда хост начал игру)
  const startCoopRun = (code: string) => {
    initAudio();
    clearRun();
    const prepared = prepareRun(meta);
    updateMeta(() => prepared.meta);
    setSettlement(null);
    const game = newEngine();
    engRef.current = game;
    game.startGame({ ...prepared.run, coop: true, livesBonus: 0 });
    attachCoop(code, account.uid, game);
    setPaused(false);
    setHelpOpen(false);
    setRouletteWave(0);
    setDeckInfo(null);
    setScreen('game');
    setFrame((f) => f + 1);
  };

  // Остановить кооперативную сессию (выйти из комнаты или оставить игру)
  const stopCoop = (leave: boolean) => {
    coopRef.current?.stop(leave);
    coopRef.current = null;
    setCoopOn(false);
    setLeaveAsk(false);
    clearRun();
  };

  // Выход из матча: напарник видит серое поле, мой матч больше не восстанавливается
  const leaveMatch = () => {
    coopRef.current?.leaveMatch();
    coopRef.current = null;
    setCoopOn(false);
    setLeaveAsk(false);
    clearRun();
    setScreen('menu');
    setNotice('Вы вышли из матча');
  };

  const toggleMute = () => {
    setMutedState((m) => {
      setMuted(!m);
      return !m;
    });
  };

  const playing = g.status === 'prep' || g.status === 'wave';
  const today = todayKey();


  window.__orbital = {
    get g() {
      return engRef.current!;
    },
  };

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-[#0b0e18] text-slate-100">
      {notice && (
        <button
          onClick={() => setNotice(null)}
          className="fixed left-1/2 top-3 z-[85] w-[min(90%,360px)] -translate-x-1/2 rounded-xl border border-white/15 bg-slate-950/95 px-4 py-2.5 text-center text-[13px] font-bold text-slate-100 shadow-lg"
        >
          {notice}
        </button>
      )}
      {account.status === 'checking' && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#0b0e18]/85 text-[14px] text-slate-300 backdrop-blur-sm">
          Загрузка аккаунта…
        </div>
      )}
      {screen === 'menu' && (
        <MainMenu
          meta={meta}
          onPlay={startNewRun}
          onShop={() => setScreen('shop')}
          onInventory={() => setScreen('inventory')}
          onCoop={() => setScreen('coop')}
          account={account}
          authNotice={authNotice}
          onCreateAccount={createAccount}
          onSignIn={signIn}
          onLogout={logout}
        />
      )}

      {screen === 'shop' && (
        <Shop meta={meta} today={today} onUpdate={updateMeta} onBack={() => setScreen('menu')} />
      )}

      {screen === 'inventory' && (
        <Inventory meta={meta} onUpdate={updateMeta} onBack={() => setScreen('menu')} />
      )}

      {screen === 'coop' && (
        <CoopLobby
          account={account}
          deckReady={deckReady(meta)}
          onBack={() => setScreen('menu')}
          onStart={startCoopRun}
        />
      )}

      {screen === 'game' && (
        <>
          <Header
            g={g}
            paused={paused}
            speed={speed}
            muted={muted}
            onPause={() => playing && setPaused((p) => !p)}
            onSpeed={() => setSpeed((s) => (s === 1 ? 2 : 1))}
            onMute={toggleMute}
            onHelp={() => setHelpOpen(true)}
          />

          <div className="relative flex min-h-0 flex-1 flex-col gap-1 px-2 pt-2 sm:px-4">
            <div className="relative min-h-0 flex-1">
            {/* кооператив: сверху поле напарника (только просмотр), снизу моё; линии сходятся */}
            {coopOn && (
              <div className="pointer-events-none absolute left-2 top-1 z-10 rounded-lg bg-black/50 px-2 py-0.5 text-[12px] font-bold text-slate-100">
                Напарник: {remoteLogin || '…'}
              </div>
            )}
            {coopOn && remoteLeft && (
              <div className="pointer-events-none absolute left-1/2 top-[25%] z-10 -translate-x-1/2 -translate-y-1/2">
                <div className="whitespace-nowrap rounded-xl border border-white/15 bg-slate-950/85 px-4 py-2 text-[14px] font-bold text-slate-200">
                  {remoteLogin || 'Напарник'} вышел из матча
                </div>
              </div>
            )}
            <GameStage
              g={g}
              remote={coopOn ? remote : null}
              frozen={remoteLeft}
              paused={paused}
              speed={speed}
              helpOpen={helpOpen}
              onCellTap={(i) => {
                initAudio();
                g.clickCell(i);
              }}
              onEmptyTap={(i) => {
                initAudio();
                g.placeOrbAt(i);
              }}
              onDragPair={(a, b) => {
                initAudio();
                if (g.mode === 'combine') g.firePair(a, b);
                else g.mergePair(a, b);
              }}
              onChainFire={(cells) => {
                initAudio();
                if (g.mode === 'combine') g.fireChain(cells);
              }}
            />
            {paused && playing && (
              <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#04060d]/50">
                <div className="w-[min(88%,300px)] rounded-2xl border border-white/10 bg-slate-950/90 p-5 text-center backdrop-blur-sm">
                  <div className="font-display text-lg font-bold text-slate-100">Пауза</div>
                  <div className="mt-4 flex flex-col gap-2">
                    <button
                      onClick={() => setPaused(false)}
                      className="min-h-[48px] rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 px-4 text-[15px] font-extrabold text-slate-950 transition active:scale-[0.98]"
                    >
                      Продолжить
                    </button>
                    <button
                      onClick={() => {
                        // в кооперативе сдаются оба: общие жизни в ноль
                        if (coopRef.current) coopRef.current.endForBoth();
                        else g.surrender();
                        setPaused(false);
                      }}
                      className="min-h-[48px] rounded-xl border border-white/15 bg-white/[0.05] px-4 text-[14px] font-bold text-slate-200 transition active:scale-[0.98]"
                    >
                      Завершить забег
                    </button>
                  </div>
                  <div className="mt-3 text-[12px] text-slate-500">
                    Награда — за пройденные волны
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>

          {playing && (
            <>
              <Controls
                g={g}
                coop={coopOn}
                onLeave={coopOn ? () => setLeaveAsk(true) : undefined}
                onToggleMode={() => {
                  initAudio();
                  g.toggleMode();
                }}
                onCallWave={() => g.callWaveNow()}
              />
              {/* колода в самом низу: шесть шариков и уровень улучшения каждого */}
              <DeckBar
                g={g}
                onInfo={(t) => setDeckInfo(t)}
                onUpgrade={(t) => {
                  initAudio();
                  g.upgradeType(t);
                }}
              />
            </>
          )}

          {/* рулетка: перед каждой босс-волной (каждая пятая) в подготовке */}
          {g.status === 'prep' &&
            !coopOn &&
            g.wave % CONFIG.bossEvery === 0 &&
            g.pendingBossId > 0 &&
            rouletteWave !== g.wave && (
              <BossRoulette
                bossId={g.pendingBossId as BossId}
                onDone={() => setRouletteWave(g.wave)}
                onWaveNow={() => {
                  g.callWaveNow();
                  setRouletteWave(g.wave);
                }}
              />
            )}

          {helpOpen && <HelpOverlay onClose={() => setHelpOpen(false)} />}

          {/* подтверждение выхода из матча: по центру экрана */}
          {leaveAsk && coopOn && (
            <div className="fixed inset-0 z-[75] flex items-center justify-center bg-[#04060d]/70 px-4">
              <div className="w-[min(92%,340px)] rounded-2xl border border-white/10 bg-slate-950 p-5 text-center shadow-2xl shadow-black/60">
                <div className="font-display text-lg font-bold text-slate-100">Выйти из матча?</div>
                <div className="mt-2 text-[13px] leading-snug text-slate-300">
                  Ваше поле у напарника станет серым, а игра продолжится без вас. Вернуться в этот матч нельзя.
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setLeaveAsk(false)}
                    className="min-h-[46px] flex-1 rounded-xl border border-white/15 bg-white/[0.05] text-[14px] font-bold text-slate-200 active:scale-[0.98]"
                  >
                    Остаться
                  </button>
                  <button
                    onClick={leaveMatch}
                    className="min-h-[46px] flex-1 rounded-xl bg-gradient-to-br from-rose-400 to-rose-600 text-[14px] font-extrabold text-white active:scale-[0.98]"
                  >
                    Выйти
                  </button>
                </div>
              </div>
            </div>
          )}
          {deckInfo && playing && (
            <DeckInfoPopup
              type={deckInfo}
              lvl={g.typeLevels[deckInfo]}
              mods={describeMods(g.mods[deckInfo])}
              onClose={() => setDeckInfo(null)}
            />
          )}
          {g.status === 'gameover' && (
            <GameOverOverlay
                g={g}
                settlement={settlement}
                onRestart={() => {
                  if (coopOn) {
                    stopCoop(true);
                    setScreen('coop');
                  } else startNewRun();
                }}
                onMenu={() => {
                  stopCoop(true);
                  setScreen('menu');
                }}
              />
          )}
        </>
      )}
    </div>
  );
}
