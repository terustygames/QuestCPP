import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bomb,
  Coins,
  Crosshair,
  HeartPulse,
  Home,
  Keyboard,
  Move,
  Pause,
  Play,
  RotateCcw,
  Skull,
  Snowflake,
  Swords,
  Target,
  Timer,
  TowerControl,
  Trophy,
  Volume2,
  VolumeX,
} from "lucide-react";
import { NeonSiege } from "./game/engine";
import type { GameOverInfo } from "./game/engine";
import { sfx } from "./game/audio";
import { cn } from "./utils/cn";

/* ---------------------------------------------------------------- мелочь */

function KeyCap({ children, tone }: { children: React.ReactNode; tone?: "p1" | "p2" }) {
  return <span className={cn("kbd", tone === "p1" && "kbd--p1", tone === "p2" && "kbd--p2")}>{children}</span>;
}

function ControlRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-white/60 text-[13px]">
        <span className="text-white/45">{icon}</span>
        {label}
      </div>
      <div className="flex items-center gap-1">{children}</div>
    </div>
  );
}

const TOWER_INFO = [
  { key: "arrow", icon: <Crosshair size={13} />, name: "Арбалет", cost: 20 },
  { key: "sniper", icon: <Target size={13} />, name: "Рельсотрон", cost: 45 },
  { key: "frost", icon: <Snowflake size={13} />, name: "Криоген", cost: 35 },
] as const;

function PlayerCard({ team }: { team: 0 | 1 }) {
  const isP1 = team === 0;
  const accent = isP1 ? "text-cyan-300" : "text-rose-300";
  return (
    <div
      className={cn(
        "relative w-[min(340px,92vw)] rounded-2xl border bg-white/[0.035] p-5 backdrop-blur-md transition-transform duration-300 hover:-translate-y-1",
        isP1
          ? "border-cyan-400/25 shadow-[0_0_50px_-12px_rgba(34,211,238,0.45)]"
          : "border-rose-400/25 shadow-[0_0_50px_-12px_rgba(251,113,133,0.45)]",
      )}
    >
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-px",
          isP1
            ? "bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent"
            : "bg-gradient-to-r from-transparent via-rose-400/80 to-transparent",
        )}
      />
      <div className="mb-4 flex items-center gap-2.5">
        <span className={cn("h-2.5 w-2.5 rounded-full animate-pulse-slow", isP1 ? "bg-cyan-400" : "bg-rose-400")} />
        <span className={cn("font-display text-sm font-extrabold tracking-widest", accent)}>
          ИГРОК {team + 1}
        </span>
        <span className="text-[11px] uppercase tracking-[0.2em] text-white/35">
          {isP1 ? "левая половина" : "правая половина"}
        </span>
      </div>

      <div className="space-y-3">
        <ControlRow icon={<Move size={14} />} label="Движение строителя">
          {isP1 ? (
            <>
              <KeyCap tone="p1">W</KeyCap>
              <KeyCap tone="p1">A</KeyCap>
              <KeyCap tone="p1">S</KeyCap>
              <KeyCap tone="p1">D</KeyCap>
            </>
          ) : (
            <>
              <KeyCap tone="p2">←</KeyCap>
              <KeyCap tone="p2">↑</KeyCap>
              <KeyCap tone="p2">↓</KeyCap>
              <KeyCap tone="p2">→</KeyCap>
            </>
          )}
        </ControlRow>

        <ControlRow icon={<TowerControl size={14} />} label="Построить башню">
          {isP1 ? (
            <>
              <KeyCap tone="p1">Q</KeyCap>
              <KeyCap tone="p1">E</KeyCap>
              <KeyCap tone="p1">R</KeyCap>
            </>
          ) : (
            <>
              <KeyCap tone="p2">,</KeyCap>
              <KeyCap tone="p2">.</KeyCap>
              <KeyCap tone="p2">/</KeyCap>
            </>
          )}
        </ControlRow>

        <ControlRow icon={<Swords size={14} />} label="Отправить волну">
          {isP1 ? <KeyCap tone="p1">F</KeyCap> : <KeyCap tone="p2">Enter</KeyCap>}
        </ControlRow>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-1.5 border-t border-white/10 pt-3">
        {TOWER_INFO.map((t, i) => (
          <div key={t.key} className="rounded-lg bg-white/[0.04] px-1.5 py-1.5 text-center">
            <div className={cn("flex items-center justify-center gap-1 text-[11px] font-semibold", accent)}>
              {t.icon}
              {isP1 ? ["Q", "E", "R"][i] : [",", ".", "/"][i]}
            </div>
            <div className="mt-0.5 text-[10px] leading-tight text-white/55">{t.name}</div>
            <div className="text-[10px] font-bold text-amber-300">{t.cost}◈</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ меню */

function MenuScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="relative h-dvh overflow-x-hidden overflow-y-auto">
      {/* фон — зафиксирован, чтобы не скроллился */}
      <div className="pointer-events-none fixed inset-0">
        <div
          className="absolute inset-0 opacity-[0.5] animate-grid-drift"
          style={{
            backgroundImage:
              "linear-gradient(rgba(120,150,220,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(120,150,220,0.07) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
        <div className="absolute -left-40 top-1/4 h-[480px] w-[480px] rounded-full bg-cyan-500/12 blur-3xl animate-pulse-slow" />
        <div className="absolute -right-40 top-1/3 h-[480px] w-[480px] rounded-full bg-rose-500/12 blur-3xl animate-pulse-slow" />
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse at center, transparent 30%, rgba(4,6,12,0.9) 100%)" }}
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-full w-full max-w-[1100px] flex-col items-center justify-center px-4 py-8">
        <div className="mb-4 flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-white/55 animate-pop">
          <Keyboard size={13} className="text-white/60" />
          2 игрока · одна клавиатура
        </div>

        <h1
          className="text-center font-display text-[clamp(1.9rem,5.5vw,4rem)] font-black leading-[1.02] tracking-tight animate-pop"
          style={{ animationDelay: "60ms" }}
        >
          <span className="text-glow-p1 text-cyan-300">НЕОНОВАЯ</span>{" "}
          <span className="text-glow-p2 text-rose-300">ОСАДА</span>
        </h1>
        <p className="mt-2.5 max-w-xl text-center text-sm text-white/55 animate-pop" style={{ animationDelay: "120ms" }}>
          PvP tower defence: возводите башни на своей половине, собирайте монеты и запускайте
          всё более мощные волны на базу соперника. У каждой базы <b className="text-white/80">30 HP</b>.
        </p>

        <div
          className="mt-6 flex items-stretch gap-5 max-lg:flex-col max-lg:items-center animate-pop"
          style={{ animationDelay: "180ms" }}
        >
          <PlayerCard team={0} />
          <div className="flex items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-white/[0.05] font-display text-lg font-black text-white/80 shadow-[0_0_40px_-6px_rgba(148,163,255,0.6)] max-lg:rotate-90">
              VS
            </div>
          </div>
          <PlayerCard team={1} />
        </div>

        <p className="mt-4 max-w-md text-center text-xs text-white/40 animate-pop" style={{ animationDelay: "220ms" }}>
          Клавишу башни можно <span className="text-white/70">удерживать</span> — появится прицел с радиусом,
          отпустите — построите.
        </p>

        <button
          type="button"
          onClick={(e) => {
            e.currentTarget.blur();
            onStart();
          }}
          className="group relative mt-5 overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-r from-cyan-500/20 via-white/10 to-rose-500/20 px-12 py-3.5 font-display text-lg font-extrabold tracking-[0.2em] text-white transition-all duration-300 hover:scale-[1.03] hover:border-white/30 hover:shadow-[0_0_60px_-10px_rgba(232,238,252,0.5)] animate-pop"
          style={{ animationDelay: "260ms" }}
        >
          <span className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-white/15 blur-md animate-shine" />
          <span className="flex items-center gap-3">
            <Swords size={20} />
            В БОЙ
          </span>
        </button>
        <span className="mt-2 text-[11px] text-white/35">или нажмите Enter</span>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-7 gap-y-2 pb-2 text-[12px] text-white/45">
          <span className="flex items-center gap-1.5">
            <Coins size={13} className="text-amber-300" /> золото: доход, монеты, награда за убийства
          </span>
          <span className="flex items-center gap-1.5">
            <Swords size={13} className="text-white/60" /> каждая следующая волна сильнее
          </span>
          <span className="flex items-center gap-1.5">
            <TowerControl size={13} className="text-white/60" /> на трассе строить нельзя
          </span>
          <span className="flex items-center gap-1.5">
            <HeartPulse size={13} className="text-rose-300" /> база пала = поражение
          </span>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- оверлеи */

function HudButton({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={(e) => {
        e.currentTarget.blur();
        onClick();
      }}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/12 bg-black/50 text-white/70 backdrop-blur-md transition-all hover:border-white/30 hover:text-white"
    >
      {children}
    </button>
  );
}

function StatRow({
  icon,
  label,
  v1,
  v2,
}: {
  icon: React.ReactNode;
  label: string;
  v1: number;
  v2: number;
}) {
  return (
    <div className="grid grid-cols-[52px_1fr_52px] items-center gap-2 text-center">
      <span className="font-display text-base font-extrabold text-cyan-300">{v1}</span>
      <span className="flex items-center justify-center gap-1.5 text-[11px] uppercase tracking-wider text-white/50">
        {icon}
        {label}
      </span>
      <span className="font-display text-base font-extrabold text-rose-300">{v2}</span>
    </div>
  );
}

function OverlayButton({
  onClick,
  primary,
  kbd,
  icon,
  children,
}: {
  onClick: () => void;
  primary?: boolean;
  kbd?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.currentTarget.blur();
        onClick();
      }}
      className={cn(
        "flex min-w-[210px] items-center justify-between gap-3 rounded-xl border px-5 py-3 text-sm font-semibold transition-all duration-200 hover:scale-[1.02]",
        primary
          ? "border-white/25 bg-gradient-to-r from-cyan-500/25 to-rose-500/25 text-white hover:border-white/45"
          : "border-white/12 bg-white/[0.05] text-white/75 hover:border-white/30 hover:text-white",
      )}
    >
      <span className="flex items-center gap-2.5">
        {icon}
        {children}
      </span>
      {kbd && <span className="kbd">{kbd}</span>}
    </button>
  );
}

/* ----------------------------------------------------------- экран игры */

function GameScreen({ onExit }: { onExit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<NeonSiege | null>(null);
  const [paused, setPaused] = useState(false);
  const [gameOver, setGameOver] = useState<GameOverInfo | null>(null);
  const [muted, setMuted] = useState(sfx.muted);
  const [round, setRound] = useState(0);
  const [engineError, setEngineError] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let engine: NeonSiege | null = null;
    try {
      engine = new NeonSiege(canvas, {
        onGameOver: (info) => setGameOver(info),
        onPauseChange: (p) => setPaused(p),
        onMuteChange: (m) => setMuted(m),
      });
      engineRef.current = engine;
    } catch (err) {
      setEngineError(err instanceof Error ? err.message : String(err));
    }
    return () => {
      engine?.destroy();
      engineRef.current = null;
    };
  }, [round]);

  const restart = useCallback(() => {
    setGameOver(null);
    setPaused(false);
    setRound((r) => r + 1);
  }, []);

  const resume = useCallback(() => engineRef.current?.setPaused(false), []);
  const togglePause = useCallback(() => {
    const e = engineRef.current;
    if (e) e.setPaused(!paused);
  }, [paused]);
  const toggleMute = useCallback(() => setMuted(sfx.toggleMute()), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (gameOver) {
        if (e.code === "KeyR") restart();
        if (e.code === "Escape") onExit();
      } else if (paused) {
        if (e.code === "KeyR") restart();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [gameOver, paused, restart, onExit]);

  const winnerIsP1 = gameOver?.winner === 0;

  return (
    <div className="flex h-dvh w-full items-center justify-center bg-void">
      <div
        className="relative"
        style={{ width: "min(100vw, calc(100dvh * 16 / 9))", aspectRatio: "16 / 9" }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          style={{ imageRendering: "auto" }}
        />

        {/* движок не запустился */}
        {engineError && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-void px-6 text-center">
            <p className="max-w-md text-sm text-white/70">
              Не удалось запустить игру: <span className="text-rose-300">{engineError}</span>
            </p>
            <OverlayButton onClick={onExit} kbd="Esc" icon={<Home size={16} />}>
              В главное меню
            </OverlayButton>
          </div>
        )}

        {/* кнопки управления */}
        {!gameOver && (
          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2">
            <HudButton onClick={toggleMute} title="Звук (M)">
              {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </HudButton>
            <HudButton onClick={togglePause} title="Пауза (Esc / P)">
              {paused ? <Play size={16} /> : <Pause size={16} />}
            </HudButton>
            <HudButton onClick={restart} title="Заново">
              <RotateCcw size={16} />
            </HudButton>
          </div>
        )}

        {/* подсказки клавиш */}
        {!gameOver && (
          <>
            <div className="pointer-events-none absolute bottom-3.5 left-4 z-10 hidden items-center gap-1.5 lg:flex">
              <KeyCap tone="p1">WASD</KeyCap>
              <span className="text-[10px] text-white/40">движение</span>
              <KeyCap tone="p1">Q·E·R</KeyCap>
              <span className="text-[10px] text-white/40">башни</span>
              <KeyCap tone="p1">F</KeyCap>
              <span className="text-[10px] text-white/40">волна</span>
            </div>
            <div className="pointer-events-none absolute bottom-3.5 right-4 z-10 hidden items-center gap-1.5 lg:flex">
              <KeyCap tone="p2">←↑↓→</KeyCap>
              <span className="text-[10px] text-white/40">движение</span>
              <KeyCap tone="p2">,</KeyCap>
              <KeyCap tone="p2">.</KeyCap>
              <KeyCap tone="p2">/</KeyCap>
              <span className="text-[10px] text-white/40">башни</span>
              <KeyCap tone="p2">Enter</KeyCap>
              <span className="text-[10px] text-white/40">волна</span>
            </div>
          </>
        )}

        {/* пауза */}
        {paused && !gameOver && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-[6px]">
            <div className="flex flex-col items-center rounded-2xl border border-white/12 bg-panel/80 p-9 shadow-2xl animate-pop">
              <div className="mb-1.5 flex items-center gap-2 text-white/40">
                <Pause size={15} />
                <span className="text-[11px] uppercase tracking-[0.3em]">игра остановлена</span>
              </div>
              <h2 className="font-display text-4xl font-black tracking-wide text-white">ПАУЗА</h2>
              <div className="mt-7 flex flex-col gap-2.5">
                <OverlayButton onClick={resume} primary kbd="Esc" icon={<Play size={16} />}>
                  Продолжить
                </OverlayButton>
                <OverlayButton onClick={restart} kbd="R" icon={<RotateCcw size={16} />}>
                  Начать заново
                </OverlayButton>
                <OverlayButton onClick={onExit} icon={<Home size={16} />}>
                  В главное меню
                </OverlayButton>
              </div>
            </div>
          </div>
        )}

        {/* победа */}
        {gameOver && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/65 backdrop-blur-[6px]">
            <div
              className={cn(
                "flex w-[min(520px,90%)] flex-col items-center rounded-3xl border bg-panel/90 p-9 animate-pop",
                winnerIsP1
                  ? "border-cyan-400/30 shadow-[0_0_90px_-18px_rgba(34,211,238,0.6)]"
                  : "border-rose-400/30 shadow-[0_0_90px_-18px_rgba(251,113,133,0.6)]",
              )}
            >
              <div
                className={cn(
                  "flex h-16 w-16 items-center justify-center rounded-full border animate-float",
                  winnerIsP1
                    ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-300"
                    : "border-rose-400/40 bg-rose-400/10 text-rose-300",
                )}
              >
                <Trophy size={28} />
              </div>
              <h2
                className={cn(
                  "mt-4 text-center font-display text-3xl font-black tracking-wide",
                  winnerIsP1 ? "text-cyan-300 text-glow-p1" : "text-rose-300 text-glow-p2",
                )}
              >
                {winnerIsP1 ? "ИГРОК 1" : "ИГРОК 2"}
              </h2>
              <p className="mt-1 text-sm font-semibold uppercase tracking-[0.35em] text-white/60">побеждает</p>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-white/40">
                <Timer size={12} />
                время матча: {Math.floor(gameOver.timeSec / 60)}:
                {String(Math.floor(gameOver.timeSec % 60)).padStart(2, "0")}
              </p>

              <div className="mt-6 w-full space-y-2.5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-3 grid grid-cols-[52px_1fr_52px] text-center text-[10px] font-bold uppercase tracking-[0.2em]">
                  <span className="text-cyan-400">P1</span>
                  <span className="text-white/35">статистика</span>
                  <span className="text-rose-400">P2</span>
                </div>
                <StatRow icon={<Bomb size={12} />} label="урон базе" v1={gameOver.stats[0].damageToBase} v2={gameOver.stats[1].damageToBase} />
                <StatRow icon={<Skull size={12} />} label="убийства" v1={gameOver.stats[0].kills} v2={gameOver.stats[1].kills} />
                <StatRow icon={<TowerControl size={12} />} label="башни" v1={gameOver.stats[0].towersBuilt} v2={gameOver.stats[1].towersBuilt} />
                <StatRow icon={<Swords size={12} />} label="волны" v1={gameOver.stats[0].wavesSent} v2={gameOver.stats[1].wavesSent} />
                <StatRow icon={<Coins size={12} />} label="монеты" v1={gameOver.stats[0].coinsTaken} v2={gameOver.stats[1].coinsTaken} />
              </div>

              <div className="mt-7 flex gap-3">
                <OverlayButton onClick={restart} primary kbd="R" icon={<RotateCcw size={16} />}>
                  Ещё раз
                </OverlayButton>
                <OverlayButton onClick={onExit} kbd="Esc" icon={<Home size={16} />}>
                  В меню
                </OverlayButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- App */

export default function App() {
  const [phase, setPhase] = useState<"menu" | "game">("menu");
  const [session, setSession] = useState(0);

  const start = useCallback(() => {
    try {
      sfx.ensure();
    } catch {
      /* звук недоступен — игра всё равно работает */
    }
    setSession((s) => s + 1);
    setPhase("game");
  }, []);

  useEffect(() => {
    if (phase !== "menu") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Enter") start();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, start]);

  if (phase === "menu") return <MenuScreen onStart={start} />;
  return <GameScreen key={session} onExit={() => setPhase("menu")} />;
}
