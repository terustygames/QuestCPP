// Главное меню. Раскладка повторяет референс: верхняя панель с валютой,
// плавающие иконки с подписями вокруг центрального шара, крупные наклонные
// кнопки внизу. Стиль — глянцевые светящиеся шары (как на референсе).
import type { CSSProperties, ReactNode } from 'react';
import { Backpack, Gift, Sparkles, Store, Swords } from 'lucide-react';
import { META_CFG, deckReady, type MetaState } from '../game/meta';
import { CurrencyChips } from './common';

// Звёздный фон: фиксированные точки (без случайности, чтобы не мигало при перерисовке)
const STARS = Array.from({ length: 34 }, (_, i) => ({
  x: (i * 37) % 100,
  y: (i * 53 + 11) % 100,
  s: 1 + (i % 3) * 0.7,
  o: 0.25 + (i % 5) * 0.12,
}));

// Глянцевый шар: блик сверху слева, насыщенный край, тёмная кромка
function orbStyle(hi: string, mid: string, dark: string, glow: string): CSSProperties {
  return {
    background: `radial-gradient(circle at 32% 26%, ${hi} 0%, ${mid} 38%, ${dark} 100%)`,
    boxShadow: `0 0 0 2px rgba(255,255,255,0.12), 0 10px 28px -6px ${glow}, inset 0 -6px 12px rgba(0,0,0,0.25)`,
  };
}

const GOLD = orbStyle('#fff6c9', '#f7b733', '#8a4b0b', 'rgba(247,183,51,0.55)');
const AZURE = orbStyle('#e0f2fe', '#38bdf8', '#1e3a8a', 'rgba(56,189,248,0.5)');

// Плавающая кнопка с подписью (как «Магазин жетонов» / «Карточный сундук» на референсе)
function FloatingButton({
  label,
  sub,
  badge,
  onClick,
  style,
  children,
}: {
  label: string;
  sub?: string;
  badge?: boolean;
  onClick: () => void;
  style: CSSProperties;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="absolute flex w-[92px] -translate-x-1/2 flex-col items-center text-center transition active:scale-95"
      style={style}
    >
      <span className="relative flex h-[64px] w-[64px] items-center justify-center rounded-2xl border border-white/15 bg-slate-900/70 shadow-lg shadow-black/40">
        {children}
        {badge && (
          <span className="absolute -right-1.5 -top-1.5 h-3.5 w-3.5 rounded-full border-2 border-slate-950 bg-rose-500" />
        )}
      </span>
      <span className="mt-1.5 text-[12px] font-extrabold leading-tight text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.9)]">
        {label}
      </span>
      {sub && <span className="text-[11px] font-bold text-amber-300 [text-shadow:0_1px_3px_rgba(0,0,0,0.9)]">{sub}</span>}
    </button>
  );
}

// Крупная наклонная кнопка внизу (как «Режим PvP» и «Кооперация»)
function SlantButton({
  label,
  icon,
  tone,
  disabled,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  tone: 'gold' | 'azure';
  disabled?: boolean;
  onClick: () => void;
}) {
  const base = tone === 'gold' ? GOLD : AZURE;
  const edge = tone === 'gold' ? '#7c3e0a' : '#172554';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="group relative h-[84px] flex-1 transition enabled:active:scale-[0.97] disabled:opacity-45"
      aria-label={label}
    >
      {/* наклонная подложка: нижний «скос» даёт объём, верх — блик */}
      <span
        className="absolute inset-0 -skew-x-[12deg] rounded-[14px]"
        style={{ ...base, boxShadow: `inset 0 -5px 0 ${edge}, ${base.boxShadow}` }}
      />
      <span className="absolute inset-x-3 top-1.5 h-[30%] -skew-x-[12deg] rounded-t-[12px] bg-white/25" />
      <span className="relative flex h-full items-center justify-center gap-2.5 px-3 text-white [text-shadow:0_2px_4px_rgba(0,0,0,0.55)]">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black/25 ring-2 ring-white/40">
          {icon}
        </span>
        <span className="font-display text-[20px] font-black uppercase tracking-wide">{label}</span>
      </span>
    </button>
  );
}

export function MainMenu({
  meta,
  chestReady,
  onPlay,
  onShop,
  onInventory,
}: {
  meta: MetaState;
  chestReady: boolean;
  onPlay: () => void;
  onShop: () => void;
  onInventory: () => void;
}) {
  const ready = deckReady(meta);
  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#0b0e18] text-white">
      {/* фон: космос с мягкой туманностью и звёздами */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,#3b2a7a_0%,#1a1446_42%,#0b0e18_78%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(168,85,247,0.22),transparent_45%)]" />
      {STARS.map((st, i) => (
        <span
          key={i}
          className="pointer-events-none absolute rounded-full bg-white"
          style={{ left: `${st.x}%`, top: `${st.y}%`, width: st.s, height: st.s, opacity: st.o }}
        />
      ))}

      {/* верхняя панель: значок рекорда слева, валюта справа */}
      <header
        className="relative z-10 flex shrink-0 items-center justify-between gap-2 px-3"
        style={{ paddingTop: 'max(10px, env(safe-area-inset-top))' }}
      >
        <div
          className="flex items-center gap-2 rounded-2xl border border-white/15 bg-slate-950/70 px-2.5 py-1.5 shadow-lg shadow-black/40"
          title="Лучшая волна за всё время"
        >
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full text-[15px] font-black text-slate-950"
            style={GOLD}
          >
            {meta.bestWave}
          </span>
          <div className="leading-tight">
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-200/80">Рекорд</div>
            <div className="text-[12px] font-bold text-white">волна {meta.bestWave}</div>
          </div>
        </div>
        <CurrencyChips meta={meta} />
      </header>

      {/* центральный шар-хаб: состояние колоды; нажатие — инвентарь */}
      <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center">
        <button
          onClick={onInventory}
          aria-label="Колода"
          className="relative flex h-[168px] w-[168px] flex-col items-center justify-center rounded-full transition active:scale-[0.97]"
          style={GOLD}
        >
          <span className="absolute inset-3 rounded-full border-2 border-white/30" />
          <span className="font-display text-[11px] font-bold uppercase tracking-[0.2em] text-amber-950/80">Колода</span>
          <span className="font-display text-[38px] font-black leading-none text-amber-950 tabular-nums">
            {meta.deck.length}
            <span className="text-[20px] text-amber-950/60">/{META_CFG.deckSize}</span>
          </span>
          <span className="mt-1 text-[11px] font-bold text-amber-950/75">{ready ? 'готова к бою' : 'соберите'}</span>
        </button>
        <div className="pointer-events-none absolute left-1/2 top-[38%] h-[240px] w-[240px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
      </div>

      {/* плавающие иконки: магазин слева, сундук справа (как на референсе) */}
      <FloatingButton
        label="Магазин"
        onClick={onShop}
        style={{ left: '22%', top: '38%' }}
        badge={false}
      >
        <Store size={34} className="text-amber-300" />
      </FloatingButton>
      <FloatingButton
        label="Ежедневный сундук"
        sub={chestReady ? 'готов!' : 'получен'}
        badge={chestReady}
        onClick={onShop}
        style={{ left: '78%', top: '52%' }}
      >
        <Gift size={34} className="text-sky-300" />
      </FloatingButton>

      {/* нижний блок: две крупные наклонные кнопки, как «Режим PvP» / «Кооперация» */}
      <div className="relative z-10 shrink-0 px-3" style={{ paddingBottom: 'max(18px, env(safe-area-inset-bottom))' }}>
        {!ready && (
          <div className="mb-3 flex items-center justify-center gap-1.5 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-center text-[12px] font-bold text-amber-200">
            <Sparkles size={14} className="shrink-0" />
            Соберите колоду из {META_CFG.deckSize} шариков в инвентаре, чтобы играть
          </div>
        )}
        <div className="flex gap-3">
          <SlantButton
            label="Играть"
            icon={<Swords size={22} strokeWidth={2.5} />}
            tone="gold"
            disabled={!ready}
            onClick={onPlay}
          />
          <SlantButton
            label="Инвентарь"
            icon={<Backpack size={22} strokeWidth={2.5} />}
            tone="azure"
            onClick={onInventory}
          />
        </div>
      </div>
    </div>
  );
}
