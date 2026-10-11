// Компактный HUD под тач-экран: минимум текста, крупные кнопки.
import type { ReactNode } from 'react';
import {
  Heart,
  Gem,
  Skull,
  Flag,
  Pause,
  Play,
  Volume2,
  VolumeX,
  HelpCircle,
  Combine,
  Layers,
  Zap,
} from 'lucide-react';
import type { Engine } from '../game/engine';
import { CONFIG, TYPE_INFO } from '../game/config';
import type { OrbType } from '../game/config';
import { orbSpriteUrl } from './GameStage';

function Chip({ icon, value, tone }: { icon: ReactNode; value: ReactNode; tone?: string }) {
  return (
    <div
      className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.05] px-2 py-1 text-[13px] font-bold tabular-nums"
      style={tone ? { color: tone } : undefined}
    >
      {icon}
      <span className="whitespace-nowrap">{value}</span>
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  title,
}: {
  children: ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-slate-300 transition hover:border-white/25 hover:text-white active:scale-90"
    >
      {children}
    </button>
  );
}

export function Header({
  g,
  paused,
  speed,
  muted,
  onPause,
  onSpeed,
  onMute,
  onHelp,
}: {
  g: Engine;
  paused: boolean;
  speed: number;
  muted: boolean;
  onPause: () => void;
  onSpeed: () => void;
  onMute: () => void;
  onHelp: () => void;
}) {
  return (
    <header
      className="flex items-center justify-between gap-2 px-3"
      style={{ paddingTop: 'max(10px, env(safe-area-inset-top))' }}
    >
      <div className="font-display hidden bg-gradient-to-r from-cyan-300 via-sky-400 to-violet-400 bg-clip-text text-[15px] font-black tracking-wide text-transparent sm:block">
        ОРБИТАЛЬ
      </div>
      <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
        <Chip icon={<Flag size={13} className="shrink-0 text-amber-300" />} value={g.wave} />
        <Chip
          icon={<Heart size={13} className="shrink-0 text-rose-400" fill="currentColor" />}
          value={g.lives}
          tone={g.lives <= 5 ? '#fda4af' : undefined}
        />
        <Chip icon={<Gem size={13} className="shrink-0 text-cyan-300" />} value={g.essence} />
        <Chip
          icon={<Zap size={13} className="shrink-0 text-amber-300" />}
          value={
            <span
              title="Глобальное улучшение: усиливает все шарики. Можно сделать столько, сколько волна на счётчике"
              className="tabular-nums"
            >
              {g.upgradeLevel} из {g.wave}
            </span>
          }
        />
        {g.status === 'wave' && (
          <Chip icon={<Skull size={13} className="shrink-0 text-slate-300" />} value={g.enemiesLeft} />
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <IconBtn onClick={onPause} title={paused ? 'Продолжить' : 'Пауза'}>
          {paused ? <Play size={15} /> : <Pause size={15} />}
        </IconBtn>
        <button
          onClick={onSpeed}
          title="Скорость игры"
          aria-label="Скорость игры"
          className={`h-9 rounded-lg border px-2 text-[12px] font-extrabold transition active:scale-90 ${
            speed === 2
              ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-300'
              : 'border-white/10 bg-white/[0.05] text-slate-300 hover:text-white'
          }`}
        >
          {speed}
        </button>
        <IconBtn onClick={onMute} title={muted ? 'Включить звук' : 'Выключить звук'}>
          {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
        </IconBtn>
        <IconBtn onClick={onHelp} title="Как играть">
          <HelpCircle size={15} />
        </IconBtn>
      </div>
    </header>
  );
}

// Колода внизу экрана: пять шариков — типы, из которых сейчас
// заполняется поле. У каждого шарика — максимальный уровень заряда
// этого типа, который есть на поле прямо сейчас (0 — такого шарика
// на поле нет). В обычном режиме колода — пять базовых типов,
// в экспериментальном меняется каждую пятую волну.
export function DeckBar({ g }: { g: Engine }) {
  const deck: OrbType[] = g.deck.length ? g.deck : [];
  const maxLevelOf = (t: OrbType) => {
    let m = 0;
    for (const o of g.grid) {
      if (o && o.type === t && o.level > m) m = o.level;
    }
    return m;
  };
  return (
    <div
      className="flex items-center justify-center gap-2 px-3"
      data-deck-bar
      style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }}
    >
      {deck.map((t) => {
        const lvl = maxLevelOf(t);
        const none = lvl === 0;
        return (
          <div
            key={t}
            data-deck-slot
            data-type={t}
            title={`${TYPE_INFO[t].name}: уровень ${lvl}`}
            className={`relative flex h-12 w-12 items-center justify-center rounded-xl border transition-opacity sm:h-13 sm:w-13 ${
              none ? 'border-white/5 bg-white/[0.02] opacity-40' : 'border-white/10 bg-white/[0.05]'
            }`}
          >
            <img
              src={orbSpriteUrl(t)}
              alt={TYPE_INFO[t].name}
              draggable={false}
              className="h-9 w-9 select-none"
            />
            <span
              className={`absolute -bottom-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-md border px-1 text-[11px] font-extrabold tabular-nums ${
                lvl >= 2
                  ? 'border-amber-400/50 bg-amber-500/20 text-amber-200'
                  : 'border-white/15 bg-slate-950 text-slate-400'
              }`}
            >
              {lvl}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function Controls({
  g,
  onToggleMode,
  onCallWave,
}: {
  g: Engine;
  onToggleMode: () => void;
  onCallWave: () => void;
}) {
  const accum = g.mode === 'accumulate';
  return (
    <div
      className="flex items-stretch gap-2 px-3"
      style={{
        paddingBottom: 4,
        paddingTop: 10,
      }}
    >
      <button
        onClick={onToggleMode}
        className={`flex min-h-[54px] min-w-0 flex-1 items-center justify-center gap-1.5 rounded-2xl border px-1.5 text-[13px] font-bold transition-all active:scale-[0.96] sm:text-[15px] ${
          accum
            ? 'border-amber-400/60 bg-amber-500/20 text-amber-200'
            : 'border-cyan-400/40 bg-cyan-500/10 text-cyan-200'
        }`}
      >
        {accum ? <Layers size={18} /> : <Combine size={18} />}
        <span className="whitespace-nowrap">{accum ? 'Накопление' : 'Совмещение'}</span>
      </button>

      {g.status === 'prep' && (
        <button
          onClick={onCallWave}
          className="flex min-h-[54px] min-w-0 flex-1 items-center justify-center gap-1.5 rounded-2xl border border-amber-400/50 bg-amber-500/15 px-1.5 text-[13px] font-bold text-amber-300 transition-all active:scale-[0.96] sm:text-[15px]"
        >
          <Zap size={18} />
          <span className="whitespace-nowrap">Волна сейчас</span>
          <span className="rounded-lg bg-black/30 px-1.5 py-0.5 text-[11px] sm:text-[13px]">{CONFIG.callBonus}</span>
        </button>
      )}
    </div>
  );
}
