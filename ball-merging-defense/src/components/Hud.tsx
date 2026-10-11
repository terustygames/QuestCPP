// Компактный HUD под тач-экран: минимум текста, крупные кнопки.
import { useRef } from 'react';
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
  X,
  Zap,
} from 'lucide-react';
import type { Engine } from '../game/engine';
import { CONFIG, TYPE_INFO, typeStatRows } from '../game/config';
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

// Колода в самом низу экрана: шесть шариков — типы, из которых сейчас
// заполняется поле. Цифра у шарика — уровень улучшения этого типа
// (1 = базовый; растёт, когда зажимаешь шарик этого типа на поле).
// Зажать (или нажать) шарик в колоде — открыть характеристики:
// что есть сейчас и что вырастет при следующем улучшении.
export function DeckBar({ g, onInfo }: { g: Engine; onInfo: (t: OrbType) => void }) {
  const deck: OrbType[] = g.deck.length ? g.deck : [];
  const pressTimer = useRef<number | null>(null);
  const pressFired = useRef(false);

  const startPress = (t: OrbType) => {
    pressFired.current = false;
    pressTimer.current = window.setTimeout(() => {
      pressFired.current = true;
      onInfo(t);
    }, 450);
  };
  const cancelPress = () => {
    if (pressTimer.current !== null) {
      window.clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  return (
    <div
      className="flex items-center justify-center gap-1.5 px-3"
      data-deck-bar
      style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }}
    >
      {deck.map((t) => {
        const lvl = g.typeLevels[t];
        return (
          <div
            key={t}
            data-deck-slot
            data-type={t}
            role="button"
            title={`${TYPE_INFO[t].name}: уровень ${lvl}. Зажмите — характеристики`}
            onPointerDown={() => startPress(t)}
            onPointerUp={cancelPress}
            onPointerLeave={cancelPress}
            onPointerCancel={cancelPress}
            onClick={() => {
              if (!pressFired.current) onInfo(t);
            }}
            className={`relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border transition-opacity ${
              lvl > 1 ? 'border-amber-400/40 bg-white/[0.06]' : 'border-white/10 bg-white/[0.04]'
            }`}
          >
            <img
              src={orbSpriteUrl(t)}
              alt={TYPE_INFO[t].name}
              draggable={false}
              className="h-8 w-8 select-none"
            />
            <span
              className={`absolute -bottom-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-md border px-1 text-[11px] font-extrabold tabular-nums ${
                lvl > 1
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

// Панель характеристик типа (показывается по зажиму шарика в колоде):
// текущие значения и что вырастет при следующем улучшении.
export function DeckInfoPopup({
  type,
  lvl,
  mods,
  note,
  onClose,
}: {
  type: OrbType;
  lvl: number;
  mods: string[];
  note?: string; // доп. строка (например, опыт шарика «Метка»)
  onClose: () => void;
}) {
  const info = TYPE_INFO[type];
  const rows = typeStatRows(type, lvl);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#04060d]/85 p-4"
      onClick={onClose}
    >
      <div
        data-deck-popup
        className="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900/95 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <img src={orbSpriteUrl(type)} alt={info.name} className="h-14 w-14 select-none" draggable={false} />
          <div className="min-w-0 flex-1">
            <div className="text-lg font-extrabold text-slate-100">{info.name}</div>
            <div className="text-[12px] text-slate-400">
              Улучшение: уровень {lvl} (следующее — {lvl + 1})
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
        <div className="mt-4 space-y-1.5">
          {rows.map((r) => (
            <div
              key={r.label}
              className="flex items-baseline justify-between gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2"
            >
              <span className="text-[13px] text-slate-300">{r.label}</span>
              <span className="whitespace-nowrap text-[14px] font-extrabold tabular-nums text-slate-100">
                {r.cur}
                {r.next && (
                  <span className="ml-2 text-[12px] font-bold text-amber-300">будет {r.next}</span>
                )}
              </span>
            </div>
          ))}
        </div>
        {note && (
          <div className="mt-3 rounded-xl border border-fuchsia-400/25 bg-fuchsia-500/[0.07] px-3 py-2 text-[13px] font-bold text-fuchsia-200">
            {note}
          </div>
        )}
        {mods.length > 0 && (
          <div className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-500/[0.06] px-3 py-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-300/80">Дерево навыков</div>
            <div className="mt-1 text-[13px] leading-snug text-emerald-200">{mods.join(' · ')}</div>
          </div>
        )}
        <p className="mt-3 text-[12px] leading-snug text-slate-500">
          Чтобы улучшить: зажмите шарик «{info.name}» на поле. Шарик исчезнет,
          а уровень типа вырастет. Стоимость: {CONFIG.upgradeCost} эссенции.
        </p>
      </div>
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
        data-mode-toggle
        aria-label="Сменить режим"
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
