// Магазин: ежедневный сундук (монеты, очки и шарики), запасы на старт забега.
// Шарики в магазине не продаются: они выпадают только из сундуков.
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Check, Coins, Gift, Sparkles } from 'lucide-react';
import { TYPE_INFO, type OrbType } from '../game/config';
import { sfx } from '../game/audio';
import {
  META_CFG,
  buyBoost,
  chestReady,
  lockedBallsLeft,
  openChest,
  type BoostKind,
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

type ChestResult = { coins: number; points: number; ball: OrbType | null };

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
  const [toast, showToast] = useToast();
  const [lastChest, setLastChest] = useState<ChestResult | null>(null);
  const canChest = chestReady(meta, today);
  const left = lockedBallsLeft(meta);

  const doChest = () => {
    const r = openChest(meta, today);
    onUpdate(() => r.meta);
    setLastChest({ coins: r.coins, points: r.points, ball: r.ball });
    sfx.clear();
  };

  const doBuyBoost = (k: BoostKind) => {
    const r = buyBoost(meta, k);
    if (r.error) return showToast(r.error);
    onUpdate(() => r.meta);
    sfx.buy();
    showToast(`Куплено: ${META_CFG.boosts[k].title.toLowerCase()}`);
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
                  Монеты {META_CFG.chest.coinsMin}–{META_CFG.chest.coinsMax}, {META_CFG.chest.pointsMin}–
                  {META_CFG.chest.pointsMax} очка прокачки и шарик, которого ещё нет в коллекции. Раз в сутки.
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
            {lastChest && (
              <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2">
                <div className="flex items-center justify-center gap-4 text-[15px] font-extrabold tabular-nums">
                  <span className="flex items-center gap-1.5 text-amber-200">
                    <Coins size={16} className="text-amber-300" />+{lastChest.coins}
                  </span>
                  <span className="flex items-center gap-1.5 text-fuchsia-200">
                    <Sparkles size={16} className="text-fuchsia-300" />+{lastChest.points}
                  </span>
                </div>
                {lastChest.ball ? (
                  <div className="mt-2 flex items-center justify-center gap-2 text-[13px] font-bold text-emerald-300">
                    <img src={orbSpriteUrl(lastChest.ball)} alt="" draggable={false} className="h-8 w-8" />
                    Новый шарик: {TYPE_INFO[lastChest.ball].name}
                  </div>
                ) : (
                  <div className="mt-2 text-center text-[12px] text-slate-400">
                    Все шарики уже открыты: вместо шарика — монеты
                  </div>
                )}
              </div>
            )}
          </div>
        </Section>

        <Section title="Запасы на забег">
          <div className="space-y-2">
            {(Object.keys(META_CFG.boosts) as BoostKind[]).map((k) => {
              const b = META_CFG.boosts[k];
              const have = meta.boosts[k];
              return (
                <div
                  key={k}
                  className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="text-[14px] font-bold text-slate-100">{b.title}</div>
                      <div className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-slate-300">
                        в запасе: {have}
                      </div>
                    </div>
                    <div className="text-[11px] leading-snug text-slate-500">
                      {b.desc}. Расходуется при старте забега.
                    </div>
                  </div>
                  <button
                    onClick={() => doBuyBoost(k)}
                    className={`flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-xl border px-3 text-[13px] font-extrabold transition active:scale-95 ${
                      meta.coins >= b.price
                        ? 'border-amber-400/50 bg-amber-500/15 text-amber-200'
                        : 'border-white/10 bg-white/[0.04] text-slate-500'
                    }`}
                  >
                    <Coins size={14} />
                    {b.price}
                  </button>
                </div>
              );
            })}
          </div>
        </Section>
      </div>
      <Toast msg={toast} />
    </Screen>
  );
}
