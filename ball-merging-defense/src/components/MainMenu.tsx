// Главное меню. Верхняя панель с рекордом и валютой; внизу один ряд
// одинаковых кнопок-плиток (тёмный скруглённый квадрат с иконкой и подписью,
// как «Магазин»). Центр экрана свободен.
import { useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Backpack, Menu, Sparkles, Store, Swords, Users } from 'lucide-react';
import { AccountDrawer, type AccountView } from './AccountDrawer';
import { META_CFG, deckReady, type MetaState } from '../game/meta';
import { CurrencyChips } from './common';

// Звёздный фон: фиксированные точки (без случайности, чтобы не мигало при перерисовке)
const STARS = Array.from({ length: 34 }, (_, i) => ({
  x: (i * 37) % 100,
  y: (i * 53 + 11) % 100,
  s: 1 + (i % 3) * 0.7,
  o: 0.25 + (i % 5) * 0.12,
}));

// Глянцевый шар для значка рекорда
const GOLD: CSSProperties = {
  background: 'radial-gradient(circle at 32% 26%, #fff6c9 0%, #f7b733 38%, #8a4b0b 100%)',
  boxShadow: '0 0 0 2px rgba(255,255,255,0.12), 0 10px 28px -6px rgba(247,183,51,0.55), inset 0 -6px 12px rgba(0,0,0,0.25)',
};

// Кнопка-плитка: тёмный скруглённый квадрат с иконкой, подпись под ним
function TileButton({
  label,
  sub,
  subTone = 'amber',
  badge,
  disabled,
  onClick,
  children,
}: {
  label: string;
  sub?: string;
  subTone?: 'amber' | 'white';
  badge?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex min-w-0 flex-1 flex-col items-center text-center transition enabled:active:scale-95 disabled:opacity-45"
    >
      <span className="relative flex h-[64px] w-[64px] items-center justify-center rounded-2xl border border-white/15 bg-slate-900/70 shadow-lg shadow-black/40">
        {children}
        {badge && (
          <span className="absolute -right-1.5 -top-1.5 h-3.5 w-3.5 rounded-full border-2 border-slate-950 bg-rose-500" />
        )}
      </span>
      <span className="mt-1.5 w-full truncate text-[12px] font-extrabold leading-tight text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.9)]">
        {label}
      </span>
      {sub && (
        <span
          className={`text-[11px] font-bold [text-shadow:0_1px_3px_rgba(0,0,0,0.9)] ${
            subTone === 'amber' ? 'text-amber-300' : 'text-white/70'
          }`}
        >
          {sub}
        </span>
      )}
    </button>
  );
}

export function MainMenu({
  meta,
  onPlay,
  onShop,
  onInventory,
  onCoop,
  account,
  authNotice,
  onCreateAccount,
  onSignIn,
  onLogout,
}: {
  meta: MetaState;
  onPlay: () => void;
  onShop: () => void;
  onInventory: () => void;
  onCoop: () => void;
  account: AccountView;
  authNotice: string | null;
  onCreateAccount: (login: string, password: string) => Promise<void>;
  onSignIn: (login: string, password: string) => Promise<void>;
  onLogout: () => Promise<void>;
}) {
  const ready = deckReady(meta);
  const [accountOpen, setAccountOpen] = useState(false);
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
        <div className="flex items-center gap-1.5">
          <CurrencyChips meta={meta} />
          <button
            onClick={() => setAccountOpen(true)}
            aria-label="Меню аккаунта"
            title={account.status === 'in' ? `Аккаунт: ${account.login}` : 'Гость. Аккаунт'}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-slate-950/70 text-slate-200 shadow-lg shadow-black/40 transition active:scale-95"
          >
            <Menu size={18} />
          </button>
        </div>
      </header>

      {accountOpen && (
        <AccountDrawer
          account={account}
          notice={authNotice}
          onClose={() => setAccountOpen(false)}
          onCreate={onCreateAccount}
          onSignIn={onSignIn}
          onLogout={onLogout}
        />
      )}

      {/* центр свободен */}
      <div className="relative z-10 flex min-h-0 flex-1" />

      {/* нижний ряд кнопок */}
      <div className="relative z-10 shrink-0 px-3" style={{ paddingBottom: 'max(18px, env(safe-area-inset-bottom))' }}>
        {!ready && (
          <div className="mb-3 flex items-center justify-center gap-1.5 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-center text-[12px] font-bold text-amber-200">
            <Sparkles size={14} className="shrink-0" />
            Соберите колоду из {META_CFG.deckSize} шариков в инвентаре, чтобы играть
          </div>
        )}
        <div className="flex items-start justify-between gap-1">
          <TileButton label="Магазин" onClick={onShop}>
            <Store size={34} className="text-amber-300" />
          </TileButton>
          <TileButton
            label="Инвентарь"
            sub={`${meta.deck.length}/${META_CFG.deckSize}`}
            subTone="white"
            onClick={onInventory}
          >
            <Backpack size={32} className="text-sky-300" />
          </TileButton>
          <TileButton label="Играть" disabled={!ready} onClick={onPlay}>
            <Swords size={34} className="text-amber-300" />
          </TileButton>
          {/* гость: нажатие сразу открывает вход в аккаунт (без входа вдвоём не играют) */}
          <TileButton
            label="Вдвоём"
            sub={account.status === 'in' ? 'по сети' : 'войти'}
            subTone={account.status === 'in' ? 'white' : 'amber'}
            onClick={account.status === 'in' ? onCoop : () => setAccountOpen(true)}
          >
            <Users size={32} className="text-emerald-300" />
          </TileButton>
        </div>
      </div>
    </div>
  );
}
