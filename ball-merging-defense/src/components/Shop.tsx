// Магазин: только ежедневный сундук (монеты и ОП шарику). Шарики и ОП за монеты здесь не продаются:
// шарики открываются сундуками, ОП приходят из сундуков.
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Check, Coins, Gift, Sparkles } from 'lucide-react';
import { TYPE_INFO } from '../game/config';
import { sfx } from '../game/audio';
import {
  META_CFG,
  chestReady,
  lockedBallsLeft,
  openChest,
  type ChestRoll,
  type MetaState,
} from '../game/meta';
import { orbSpriteUrl } from './GameStage';
import { CurrencyChips, Screen, Toast, TopBar, useToast } from './common';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-5">
      <h2 className="mb-2 px-1 text-[12px] font-bold uppercase tracking-wider text-slate-500">{title}</h2>
      {children}
    </section>
  );
}

// Результат сундука для показа: бросок и открыл ли он шарик
type ChestResult = { roll: ChestRoll; opened: boolean };

export function Shop({
  meta,
  today,
  onUpdate,
  onBack,
}: {
  meta: MetaState;
  today: string;
  onUpdate: (fn: (m: MetaState) => MetaState) => void;
  onBack: () => void;
}) {
  const [toast] = useToast();
  const [lastChest, setLastChest] = useState<ChestResult | null>(null);
  const canChest = chestReady(meta, today);
  const left = lockedBallsLeft(meta);
  const { chest } = META_CFG;

  const doChest = () => {
    const r = openChest(meta, today);
    onUpdate(() => r.meta);
    setLastChest({ roll: r.roll, opened: r.opened });
    sfx.clear();
  };

  return (
    <Screen>
      <TopBar title="Магазин" onBack={onBack} right={<CurrencyChips meta={meta} />} />

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-8">
        <Section title="Ежедневный сундук">
          <div className="rounded-2xl border border-amber-400/25 bg-gradient-to-br from-amber-500/15 to-transparent p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-amber-300/30 bg-amber-500/15 text-amber-300">
                <Gift size={28} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-extrabold text-slate-100">Сундук дня</div>
                <div className="text-[12px] leading-snug text-slate-400">
                  Монеты {chest.coinsMin}–{chest.coinsMax} и {chest.pointsMin}–{chest.pointsMax} ОП одному шарику.
                  Если шарика ещё нет, его ОП открывают. Раз в сутки.
                </div>
                <div className="mt-1 text-[12px] font-bold text-amber-200/80">
                  {left > 0 ? `Шариков ещё не открыто: ${left}` : 'Все шарики открыты'}
                </div>
              </div>
            </div>
            {canChest ? (
              <button
                onClick={doChest}
                className="mt-3 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 px-4 text-[15px] font-extrabold text-slate-950 transition active:scale-[0.98]"
              >
                <Gift size={18} />
                Открыть сундук
              </button>
            ) : (
              <div className="mt-3 flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-[13px] text-slate-400">
                <Check size={16} className="text-emerald-300" />
                Сегодня уже открыт. Следующий сундук — завтра
              </div>
            )}
            {lastChest && <ChestReport result={lastChest} />}
          </div>
          <p className="mt-2 px-1 text-[11px] leading-snug text-slate-500">
            Сундук после каждого забега — такой же, плюс редкий легендарный (1 из {Math.round(1 / chest.legendaryChance)}):
            {` ${chest.legendaryPointsMin}–${chest.legendaryPointsMax} ОП`} одному шарику.
          </p>
        </Section>

      </div>
      <Toast msg={toast} />
    </Screen>
  );
}

// Итог открытия сундука: монеты, ОП шарику, открыт ли шарик, дубликат
function ChestReport({ result }: { result: ChestResult }) {
  const { roll, opened } = result;
  return (
    <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2">
      <div className="flex items-center justify-center gap-4 text-[15px] font-extrabold tabular-nums">
        <span className="flex items-center gap-1.5 text-amber-200">
          <Coins size={16} className="text-amber-300" />+{roll.coins}
        </span>
        <span className="flex items-center gap-1.5 text-fuchsia-200">
          <Sparkles size={16} className="text-fuchsia-300" />+{roll.points} ОП
        </span>
      </div>
      <div className="mt-2 flex items-center justify-center gap-2 text-[13px] font-bold text-emerald-300">
        <img src={orbSpriteUrl(roll.ball)} alt="" draggable={false} className="h-8 w-8" />
        {TYPE_INFO[roll.ball].name}
        {opened ? ' — шарик открыт!' : ''}
      </div>
      {roll.legendary && (
        <div className="mt-1 text-center text-[12px] font-bold text-amber-300">Легендарный сундук!</div>
      )}
      {roll.dupCoins > 0 && (
        <div className="mt-1 text-center text-[12px] text-slate-400">
          Легендарный дубликат: +{roll.dupCoins} монет в общий баланс
        </div>
      )}
    </div>
  );
}
