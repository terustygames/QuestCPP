// Общие кирпичики экранов меню: верхняя панель, валюта, долгое нажатие.
import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowLeft, Coins, Sparkles } from 'lucide-react';
import type { MetaState } from '../game/meta';

// Чип с числом (монеты, очки прокачки)
function CurrencyChip({ icon, value, title }: { icon: ReactNode; value: number; title: string }) {
  return (
    <div
      title={title}
      className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.05] px-2.5 py-1.5 text-[13px] font-bold tabular-nums text-slate-100"
    >
      {icon}
      <span>{value}</span>
    </div>
  );
}

export function CurrencyChips({ meta }: { meta: MetaState }) {
  return (
    <div className="flex items-center gap-1.5">
      <CurrencyChip
        icon={<Coins size={15} className="shrink-0 text-amber-300" />}
        value={meta.coins}
        title="Монеты: копятся за пройденные волны, тратятся в магазине и на узлы деревьев"
      />
      <CurrencyChip
        icon={<Sparkles size={15} className="shrink-0 text-fuchsia-300" />}
        value={meta.points}
        title="Очки прокачки: 1 за пройденную волну, нужны для узлов деревьев"
      />
    </div>
  );
}

// Верхняя панель экрана: назад + заголовок + справа (например, валюта)
export function TopBar({ title, onBack, right }: { title: string; onBack: () => void; right?: ReactNode }) {
  return (
    <header
      className="flex shrink-0 items-center justify-between gap-2 px-3 pb-2"
      style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}
    >
      <div className="flex min-w-0 items-center gap-2">
        <button
          onClick={onBack}
          aria-label="Назад"
          className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.05] px-3 text-[13px] font-bold text-slate-200 transition hover:border-white/25 active:scale-95"
        >
          <ArrowLeft size={16} />
          <span>Назад</span>
        </button>
        <div className="font-display truncate text-base font-bold text-slate-100">{title}</div>
      </div>
      {right}
    </header>
  );
}

// Экран целиком (меню, магазин, инвентарь)
export function Screen({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#0b0e18]">
      {children}
    </div>
  );
}

// Долгое нажатие без глобальных таймеров: удержал — срабатывает onLong.
// wasLong() сообщает, что клик только что был долгим (обычный клик тогда игнорируем).
export function useLongPress(onLong: () => void, ms = 450) {
  const cb = useRef(onLong);
  cb.current = onLong;
  const timer = useRef<number | null>(null);
  const fired = useRef(false);

  const clear = () => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  };

  return {
    handlers: {
      onPointerDown: () => {
        fired.current = false;
        clear();
        timer.current = window.setTimeout(() => {
          timer.current = null;
          fired.current = true;
          cb.current();
        }, ms);
      },
      onPointerUp: clear,
      onPointerLeave: clear,
      onPointerCancel: clear,
      // на Android долгое нажатие открывает контекстное меню — гасим его
      onContextMenu: (e: { preventDefault: () => void }) => e.preventDefault(),
    },
    wasLong: () => {
      const f = fired.current;
      fired.current = false;
      return f;
    },
  };
}

// Короткая подсказка внизу экрана (ошибки покупки, колода полна и т. п.)
export function useToast(ms = 2200) {
  const [msg, setMsg] = useState('');
  const timer = useRef<number | null>(null);
  const show = (text: string) => {
    setMsg(text);
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMsg(''), ms);
  };
  return [msg, show] as const;
}

export function Toast({ msg }: { msg: string }) {
  if (!msg) return null;
  return (
    <div
      role="status"
      className="pointer-events-none fixed left-1/2 z-[60] w-max max-w-[92vw] -translate-x-1/2 rounded-xl border border-white/10 bg-slate-900/95 px-4 py-2 text-center text-[13px] font-semibold text-slate-100 shadow-lg"
      style={{ bottom: 'max(18px, env(safe-area-inset-bottom))' }}
    >
      {msg}
    </div>
  );
}
