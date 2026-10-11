// Главное меню: играть, магазин, инвентарь. Старая заставка с описаниями убрана.
import { Backpack, Gift, Play, Store } from 'lucide-react';
import { META_CFG, deckReady, type MetaState } from '../game/meta';
import { CurrencyChips, Screen } from './common';

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
    <Screen>
      <div
        className="flex shrink-0 justify-end px-3"
        style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}
      >
        <CurrencyChips meta={meta} />
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 pb-10">
        <div className="font-display bg-gradient-to-r from-cyan-300 via-sky-400 to-violet-400 bg-clip-text text-center text-4xl font-black tracking-wide text-transparent sm:text-5xl">
          ОРБИТАЛЬ
        </div>
        <p className="mt-2 text-center text-[13px] text-slate-400">
          Собери колоду, прокачай шарики и не пусти врагов к красной точке
        </p>

        <div className="mt-9 flex w-full max-w-xs flex-col gap-3">
          <button
            onClick={onPlay}
            disabled={!ready}
            className="flex min-h-[64px] w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 px-5 text-xl font-extrabold text-slate-950 shadow-lg shadow-cyan-500/30 transition-all enabled:hover:scale-[1.02] enabled:active:scale-[0.98] disabled:opacity-40"
          >
            <Play size={24} strokeWidth={3} />
            Играть
          </button>
          {!ready && (
            <p className="text-center text-[12px] text-amber-300/90">
              Соберите колоду из {META_CFG.deckSize} шариков в инвентаре
            </p>
          )}

          <button
            onClick={onShop}
            className="relative flex min-h-[56px] w-full items-center justify-center gap-3 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-5 text-lg font-bold text-amber-100 transition-all hover:border-amber-300/60 active:scale-[0.98]"
          >
            <Store size={22} />
            Магазин
            {chestReady && (
              <span className="absolute right-3 flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-[11px] font-extrabold text-slate-950">
                <Gift size={12} />
                сундук
              </span>
            )}
          </button>

          <button
            onClick={onInventory}
            className="flex min-h-[56px] w-full items-center justify-center gap-3 rounded-2xl border border-sky-400/30 bg-sky-500/10 px-5 text-lg font-bold text-sky-100 transition-all hover:border-sky-300/60 active:scale-[0.98]"
          >
            <Backpack size={22} />
            Инвентарь
          </button>
        </div>
      </div>
    </Screen>
  );
}
