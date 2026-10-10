import type { ReactNode } from 'react';
import {
  MousePointerClick,
  Flame,
  Asterisk,
  Layers,
  ShieldAlert,
  Play,
  RotateCcw,
  Skull,
  DoorOpen,
  Flag,
  X,
  Hand,
  TrendingUp,
} from 'lucide-react';
import type { Engine } from '../game/engine';

const RULES = [
  {
    icon: <ShieldAlert size={18} />,
    color: 'text-rose-400',
    title: 'Задача',
    text: 'Шарики автоматически стреляют по врагам на кольцевой трассе. Каждый враг, дошедший до выхода, забирает одну жизнь, босс забирает пять. Каждая пятая волна содержит босса. При нуле жизней оборона считается проваленной.',
  },
  {
    icon: <MousePointerClick size={18} />,
    color: 'text-cyan-300',
    title: 'Совмещение',
    text: 'Нажмите на шарик, затем на соседний: оба произведут залп по врагам. Быстрее действует перетаскивание с одного шарика на соседний. Перезарядка оружия составляет 1,6 секунды.',
  },
  {
    icon: <Hand size={18} />,
    color: 'text-emerald-300',
    title: 'Размещение',
    text: 'Пустые клетки заполняются автоматически: каждые две секунды в случайную клетку помещается новый шарик. Нажатие на пустую клетку помещает шарик немедленно. Пустые клетки не требуют эссенции.',
  },
  {
    icon: <TrendingUp size={18} />,
    color: 'text-amber-300',
    title: 'Улучшение',
    text: 'Удерживайте шарик около половины секунды, чтобы улучшить его. Стоимость первого, второго, третьего и четвёртого уровня: 8, 16, 24 и 32 эссенции. Улучшение усиливает именно этот шарик: выше урон огня, сильнее и дольше замедление льда, цепь молнии бьёт до трёх целей, яд действует мощнее и дольше, шипастый выпускает до семи игл.',
  },
  {
    icon: <Flame size={18} />,
    color: 'text-orange-400',
    title: 'Типы шариков',
    text: 'Огонь наносит три единицы урона цели и одну единицу соседним врагам. Лёд наносит одну единицу урона и замедляет цель. Молния наносит две единицы урона и передаёт разряд ближайшему врагу в радиусе. Яд наносит одну единицу урона и добавляет урон во времени на четыре секунды. Шипастый не стреляет: он лопается и запускает цепную реакцию.',
  },
  {
    icon: <Asterisk size={18} />,
    color: 'text-violet-400',
    title: 'Цепная реакция',
    text: 'Шипастый лопается при соединении с соседом или под ударом иглы. Он выпускает четыре иглы, каждая из которых разрушает первый шарик на своём пути. Если разрушенный шарик снова шипастый, реакция продолжается. Цепь из трёх и более взрывов приносит бонус эссенции.',
  },
  {
    icon: <Layers size={18} />,
    color: 'text-amber-300',
    title: 'Накопление',
    text: 'Режим «Накопление» отключает выстрелы: соединение одинаковых шариков объединяет их в один и повышает уровень заряда. При возврате в режим «Совмещение» все заряженные шарики лопаются и выпускают залпы, сила которых растёт с уровнем заряда.',
  },
];

function RulesList() {
  return (
    <div className="space-y-2.5">
      {RULES.map((r) => (
        <div key={r.title} className="flex gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3">
          <div className={`mt-0.5 shrink-0 ${r.color}`}>{r.icon}</div>
          <div>
            <div className="text-[14px] font-bold text-slate-100">{r.title}</div>
            <div className="mt-0.5 text-[13px] leading-relaxed text-slate-400">{r.text}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#04060d]/85 p-3 backdrop-blur-sm"
      style={{
        paddingTop: 'max(12px, env(safe-area-inset-top))',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
      }}
    >
      <div className="max-h-full w-full max-w-md overflow-y-auto rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/95 to-slate-950/95 p-5 shadow-2xl sm:p-7">
        {children}
      </div>
    </div>
  );
}

export function TitleOverlay({ onStart }: { onStart: () => void }) {
  return (
    <Shell>
      <div className="font-display bg-gradient-to-r from-cyan-300 via-sky-400 to-violet-400 bg-clip-text text-center text-3xl font-black tracking-wide text-transparent sm:text-4xl">
        ОРБИТАЛЬ
      </div>
      <p className="mt-2 text-center text-[13px] text-slate-400">
        Соединяй шарики — они стреляют. Не пусти врагов к красной точке.
      </p>
      <div className="mt-4">
        <RulesList />
      </div>
      <button
        onClick={onStart}
        className="mx-auto mt-5 flex min-h-[52px] items-center gap-2.5 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 px-8 text-lg font-bold text-slate-950 shadow-lg shadow-cyan-500/30 transition-all hover:scale-[1.03] active:scale-95"
      >
        <Play size={20} strokeWidth={3} />
        Начать игру
      </button>
      <p className="mt-3 text-center text-[11px] text-slate-500">
        На компьютере: левая кнопка мыши — выбор, правая — продажа, пробел — смена режима, Enter — вызов волны
      </p>
    </Shell>
  );
}

export function HelpOverlay({ onClose }: { onClose: () => void }) {
  return (
    <Shell>
      <div className="flex items-center justify-between">
        <div className="font-display text-xl font-bold text-slate-100">Как играть</div>
        <button
          onClick={onClose}
          aria-label="Закрыть"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition hover:text-white"
        >
          <X size={16} />
        </button>
      </div>
      <div className="mt-4">
        <RulesList />
      </div>
      <button
        onClick={onClose}
        className="mx-auto mt-5 flex min-h-[48px] items-center gap-2 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 px-7 font-bold text-slate-950 transition-all hover:scale-[1.03] active:scale-95"
      >
        <Play size={18} strokeWidth={3} />
        Продолжить
      </button>
    </Shell>
  );
}

export function GameOverOverlay({ g, onRestart }: { g: Engine; onRestart: () => void }) {
  const stats = [
    { icon: <Flag size={16} className="text-amber-300" />, label: 'Дошёл до волны', value: g.wave },
    { icon: <Skull size={16} className="text-slate-300" />, label: 'Убито врагов', value: g.kills },
    { icon: <DoorOpen size={16} className="text-rose-400" />, label: 'Пропущено', value: g.leaked },
    {
      icon: <Asterisk size={16} className="text-violet-400" />,
      label: 'Лучшая цепь',
      value: g.maxChain,
    },
  ];
  return (
    <Shell>
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-400">
        <Skull size={28} />
      </div>
      <div className="font-display mt-3 text-center text-2xl font-black text-slate-100">Оборона пала</div>
      <p className="mt-1 text-center text-[13px] text-slate-400">
        Больше шипастых в центре — больше цепных реакций.
      </p>
      <div className="mx-auto mt-4 grid max-w-xs grid-cols-2 gap-2">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-2.5 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5"
          >
            {s.icon}
            <div>
              <div className="text-[10px] text-slate-500">{s.label}</div>
              <div className="text-base font-extrabold tabular-nums text-slate-100">{s.value}</div>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={onRestart}
        className="mx-auto mt-5 flex min-h-[52px] items-center gap-2.5 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 px-8 text-lg font-bold text-slate-950 shadow-lg shadow-cyan-500/30 transition-all hover:scale-[1.03] active:scale-95"
      >
        <RotateCcw size={19} strokeWidth={3} />
        Играть снова
      </button>
    </Shell>
  );
}
