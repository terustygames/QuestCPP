// ============================================================
// App: компоновка + состояние UI.
// Сцена рисуется на <canvas> в GameStage (60 fps, вне React).
// React обновляет только HUD — 10 раз в секунду.
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { Engine } from './game/engine';
import { initAudio, setMuted } from './game/audio';
import { GameStage } from './components/GameStage';
import { Header, Controls } from './components/Hud';
import { TitleOverlay, HelpOverlay, GameOverOverlay } from './components/Overlays';

// Виброотклик (работает на Android; на iPhone браузеры не дают — просто игнорируем)
function buzz(pattern: number | number[]) {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(pattern);
  } catch {
    // нет вибромотора — не страшно
  }
}

// Ручка для тестов и отладки: window.__orbital.g — текущий движок
declare global {
  interface Window {
    __orbital?: { g: Engine };
  }
}

export default function App() {
  const engRef = useRef<Engine | null>(null);
  if (!engRef.current) {
    engRef.current = new Engine();
    engRef.current.onEvent = (ev) => {
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
    };
  }
  const g = engRef.current;

  const [, setFrame] = useState(0);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [muted, setMutedState] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  // HUD: лёгкая перерисовка 10 раз/сек (цислы, статусы)
  useEffect(() => {
    const id = window.setInterval(() => setFrame((f) => f + 1), 100);
    return () => window.clearInterval(id);
  }, []);

  // Горячие клавиши (на телефоне все действия есть кнопками)
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

  const startNew = () => {
    initAudio();
    const game = new Engine();
    game.onEvent = engRef.current!.onEvent;
    engRef.current = game;
    game.startGame();
    setPaused(false);
    setHelpOpen(false);
    setFrame((f) => f + 1);
  };

  const toggleMute = () => {
    setMutedState((m) => {
      setMuted(!m);
      return !m;
    });
  };

  const playing = g.status === 'prep' || g.status === 'wave';

  window.__orbital = {
    get g() {
      return engRef.current!;
    },
  };

  return (
    <div
      className="flex h-dvh w-full flex-col overflow-hidden bg-[#05070e] text-slate-100"
      style={{
        backgroundImage:
          'radial-gradient(900px 420px at 50% -10%, rgba(56,120,255,.13), transparent 60%), radial-gradient(700px 380px at 85% 110%, rgba(177,108,255,.10), transparent 60%)',
      }}
    >
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
          <div className="absolute inset-0 z-40 flex items-center justify-center">
            <div className="rounded-2xl border border-white/10 bg-slate-950/85 px-7 py-4 text-center backdrop-blur-sm">
              <div className="font-display text-lg font-bold text-slate-100">Пауза</div>
              <div className="mt-1 text-[13px] text-slate-400">Продолжить — кнопка Play вверху</div>
            </div>
          </div>
        )}
      </div>

      {playing && (
        <Controls
          g={g}
          onToggleMode={() => {
            initAudio();
            g.toggleMode();
          }}
          onCallWave={() => g.callWaveNow()}
        />
      )}

      {g.status === 'title' && <TitleOverlay onStart={startNew} />}
      {helpOpen && <HelpOverlay onClose={() => setHelpOpen(false)} />}
      {g.status === 'gameover' && <GameOverOverlay g={g} onRestart={startNew} />}
    </div>
  );
}
