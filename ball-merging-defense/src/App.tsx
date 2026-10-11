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
  applyRun,
  chestReady,
  loadMeta,
  saveMeta,
  startRun as prepareRun,
  todayKey,
  type MetaState,
} from './game/meta';
import { GameStage } from './components/GameStage';
import { Header, Controls, DeckBar, DeckInfoPopup } from './components/Hud';
import { HelpOverlay, GameOverOverlay } from './components/Overlays';
import { BossRoulette } from './components/BossRoulette';
import { MainMenu } from './components/MainMenu';
import { Shop } from './components/Shop';
import { Inventory } from './components/Inventory';

type Screen = 'menu' | 'shop' | 'inventory' | 'game';

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
  const engRef = useRef<Engine | null>(null);
  if (!engRef.current) engRef.current = newEngine();
  const g = engRef.current;

  const [screen, setScreen] = useState<Screen>('menu');
  const [meta, setMeta] = useState<MetaState>(() => loadMeta());
  const updateMeta = useCallback((fn: (m: MetaState) => MetaState) => {
    setMeta((prev) => {
      const next = fn(prev);
      saveMeta(next);
      return next;
    });
  }, []);

  const [, setFrame] = useState(0);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [muted, setMutedState] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  // номер волны, для которой рулетка уже отыграна (не показывать дважды)
  const [rouletteWave, setRouletteWave] = useState(0);
  // тип, для которого открыта панель характеристик из колоды
  const [deckInfo, setDeckInfo] = useState<OrbType | null>(null);
  // забег, за который уже начислена награда (защита от двойного начисления)
  const rewardedFor = useRef<Engine | null>(null);

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

  // Конец забега (поражение или сдача): начислить монеты и очки прокачки
  // за пройденные волны. Один раз на забег.
  useEffect(() => {
    if (g.status !== 'gameover' || rewardedFor.current === g) return;
    rewardedFor.current = g;
    const wave = g.wave;
    updateMeta((m) => applyRun(m, wave));
  }, [g, g.status, updateMeta]);

  // Старт забега: колода и дерево навыков из меню, запасы (бусты) — расходуются
  const startNewRun = () => {
    initAudio();
    const prepared = prepareRun(meta);
    updateMeta(() => prepared.meta);
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
      {screen === 'menu' && (
        <MainMenu
          meta={meta}
          chestReady={chestReady(meta, today)}
          onPlay={startNewRun}
          onShop={() => setScreen('shop')}
          onInventory={() => setScreen('inventory')}
        />
      )}

      {screen === 'shop' && (
        <Shop meta={meta} today={today} onUpdate={updateMeta} onBack={() => setScreen('menu')} />
      )}

      {screen === 'inventory' && (
        <Inventory meta={meta} onUpdate={updateMeta} onBack={() => setScreen('menu')} />
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

          <div className="relative min-h-0 flex-1 px-2 pt-2 sm:px-4">
            <GameStage
              g={g}
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
              onUpgrade={(i) => {
                initAudio();
                g.upgradeCell(i);
              }}
              onSell={(i) => {
                initAudio();
                g.sellCell(i);
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
                        g.surrender();
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

          {playing && (
            <>
              <Controls
                g={g}
                onToggleMode={() => {
                  initAudio();
                  g.toggleMode();
                }}
                onCallWave={() => g.callWaveNow()}
              />
              {/* колода в самом низу: шесть шариков и уровень улучшения каждого */}
              <DeckBar g={g} onInfo={(t) => setDeckInfo(t)} />
            </>
          )}

          {/* рулетка: перед каждой босс-волной (каждая пятая) в подготовке */}
          {g.status === 'prep' &&
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
          {deckInfo && playing && (
            <DeckInfoPopup
              type={deckInfo}
              lvl={g.typeLevels[deckInfo]}
              mods={describeMods(g.mods[deckInfo])}
              onClose={() => setDeckInfo(null)}
            />
          )}
          {g.status === 'gameover' && (
            <GameOverOverlay g={g} onRestart={startNewRun} onMenu={() => setScreen('menu')} />
          )}
        </>
      )}
    </div>
  );
}
