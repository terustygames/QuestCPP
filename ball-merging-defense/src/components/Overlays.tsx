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
  Trophy,
  Backpack,
  Coins,
  Sparkles,
  Home,
} from 'lucide-react';
import type { Engine } from '../game/engine';
import { runReward } from '../game/meta';

// Правила для справки в игре (кнопка «?»). Заставка с описаниями убрана:
// вход в игру — главное меню.
const RULES = [
  {
    icon: <ShieldAlert size={18} />,
    color: 'text-rose-400',
    title: 'Задача',
    text: 'Шарики автоматически стреляют по врагам на кольцевой трассе. Каждый враг, дошедший до выхода, забирает одну жизнь, босс забирает пять. При нуле жизней оборона считается проваленной.',
  },
  {
    icon: <Backpack size={18} />,
    color: 'text-sky-300',
    title: 'Колода',
    text: 'Перед забегом собери колоду из шести шариков в инвентаре. Поле заполняется только шариками колоды. Для каждого шарика есть дерево навыков: узлы открываются за очки прокачки и монеты и действуют в каждом забеге.',
  },
  {
    icon: <MousePointerClick size={18} />,
    color: 'text-cyan-300',
    title: 'Совмещение',
    text: 'Цепь — только из ОДИНАКОВЫХ шариков, исключение — шипастый: его можно соединить с любым шариком. Тапни по шарику и по соседнему того же типа, либо проведи линию по соседним шарикам — два и больше, зигзаги и углы разрешены: каждый шарик на линии стреляет сразу, по два снаряда. Комбо-урон: каждый шарик в цепи добавляет +1 урона ко всем снарядам цепи — чем длиннее цепь, тем больнее бьёт. Шипастый в цепи не стреляет: он лопается, и его иглы разрушают шарики и ранят врагов на трассе. Перезарядка — 1,3 секунды: дождись её и повтори ту же линию.',
  },
  {
    icon: <Hand size={18} />,
    color: 'text-emerald-300',
    title: 'Размещение',
    text: 'Пустые клетки заполняются автоматически: каждые две секунды все пустые клетки получают новые случайные шарики, поэтому поле всегда в строю. Нажатие на пустую клетку помещает шарик немедленно. Пустые клетки не требуют эссенции.',
  },
  {
    icon: <TrendingUp size={18} />,
    color: 'text-amber-300',
    title: 'Улучшение',
    text: 'Зажмите шарик на поле около половины секунды: шарик исчезает, а уровень его типа вырастает — это усиливает все шарики этого типа и никуда не исчезает. Каждое улучшение стоит 100 эссенции, улучшать можно неограниченно. Уровни типов видны в колоде внизу экрана; зажмите шарик в колоде — покажет характеристики и что именно вырастет при следующем улучшении.',
  },
  {
    icon: <Flame size={18} />,
    color: 'text-orange-400',
    title: 'Типы шариков',
    text: 'Огонь: три единицы урона цели и одна соседним врагам. Лёд: одна единица урона и замедление цели. Молния: две единицы урона и разряд по ближайшим врагам. Яд: одна единица урона плюс урон во времени. Шипастый: не стреляет, лопается при соединении (с любым шариком) и запускает цепную реакцию; его иглы разрушают шарики и ранят врагов. Усилитель — светлый шарик со звуковой волной: даёт четырём соседним шарикам усиление, и их залпы становятся больше. Сверхновая, Паралич, Пробой, Вампир и Шквал открываются в магазине за монеты.',
  },
  {
    icon: <Asterisk size={18} />,
    color: 'text-violet-400',
    title: 'Цепная реакция',
    text: 'Шипастый можно соединять с любым шариком: в цепи он лопается и запускает реакцию. Также шипастый лопается под ударом иглы. Он выпускает четыре и более иглы, каждая разрушает первый шарик на пути и ранит первого врага, которого заденет. Любой разрушенный иглой шарик лопается и выпускает снаряды (заряженный — залпом по уровню заряда). Если разрушенный шарик снова шипастый, реакция продолжается. Цепь из четырёх и более взрывов приносит бонус эссенции.',
  },
  {
    icon: <Layers size={18} />,
    color: 'text-amber-300',
    title: 'Накопление',
    text: 'Режим «Накопление» отключает выстрелы: соединение одинаковых шариков объединяет их в один (шипастый можно слить с любым шариком), а уровни заряда складываются — шарик с уровнем 5 и шарик с уровнем 3 дают шарик с уровнем 8. Максимальный уровень заряда — 9. При возврате в режим «Совмещение» все заряженные шарики лопаются и выпускают залпы. Каждый уровень заряда добавляет +2% урона всем снарядам своего залпа: заряд 9 — это +18%.',
  },
  {
    icon: <Trophy size={18} />,
    color: 'text-fuchsia-300',
    title: 'Боссы и рулетка',
    text: 'Каждая пятая волна — босс-волна. Перед ней крутится рулетка: лента из двух боссов в случайном порядке останавливается под стрелкой по центру, и босс под стрелкой приходит в этой волне. У тебя есть время подготовиться. Громила: высокое здоровье и низкая скорость — готовь урон. Стриж: стандартное здоровье и высокая скорость — готовь замедление и паралич.',
  },
  {
    icon: <Coins size={18} />,
    color: 'text-amber-300',
    title: 'Награды',
    text: 'За каждую пройденную волну ты получаешь очки прокачки и монеты. Монеты тратятся в магазине (шарики, запасы, ежедневный сундук), очки и монеты вместе открывают узлы деревьев навыков.',
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

// Итоги забега: статистика и награды за пройденные волны
export function GameOverOverlay({
  g,
  onRestart,
  onMenu,
}: {
  g: Engine;
  onRestart: () => void;
  onMenu: () => void;
}) {
  const reward = runReward(g.wave);
  const surrender = g.endReason === 'surrender';
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
      <div className="font-display mt-3 text-center text-2xl font-black text-slate-100">
        {surrender ? 'Забег завершён' : 'Оборона пала'}
      </div>
      <p className="mt-1 text-center text-[13px] text-slate-400">
        Награда считается по пройденным волнам: та, на которой ты пал, не засчитывается.
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
      <div className="mx-auto mt-3 max-w-xs rounded-2xl border border-amber-400/25 bg-amber-500/[0.06] p-3">
        <div className="text-center text-[11px] font-bold uppercase tracking-wider text-amber-200/80">
          Награда: пройдено волн {reward.passed}
        </div>
        <div className="mt-2 flex items-center justify-around gap-2">
          <div className="flex items-center gap-1.5 text-[15px] font-extrabold tabular-nums text-amber-200">
            <Coins size={16} className="text-amber-300" />
            +{reward.coins}
          </div>
          <div className="flex items-center gap-1.5 text-[15px] font-extrabold tabular-nums text-fuchsia-200">
            <Sparkles size={16} className="text-fuchsia-300" />
            +{reward.points}
          </div>
        </div>
      </div>
      <div className="mt-5 flex flex-col items-stretch gap-2 sm:flex-row sm:justify-center">
        <button
          onClick={onRestart}
          className="flex min-h-[52px] flex-1 items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 px-6 text-lg font-bold text-slate-950 shadow-lg shadow-cyan-500/30 transition-all hover:scale-[1.02] active:scale-95"
        >
          <RotateCcw size={19} strokeWidth={3} />
          Играть снова
        </button>
        <button
          onClick={onMenu}
          className="flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.06] px-6 text-[15px] font-bold text-slate-100 transition-all hover:border-white/30 active:scale-95"
        >
          <Home size={18} />
          В меню
        </button>
      </div>
    </Shell>
  );
}
