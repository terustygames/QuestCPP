// Магазин: ежедневный сундук, шарики за монеты, запасы на старт забега.
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Check, Coins, Gift, Lock, Sparkles } from 'lucide-react';
import { TYPE_INFO, type OrbType } from '../game/config';
import { sfx } from '../game/audio';
import {
  BALL_PRICES,
  META_CFG,
  buyBall,
  buyBoost,
  chestReady,
  openChest,
  ownsBall,
  type BoostKind,
  type MetaState,
} from '../game/meta';
import { orbSpriteUrl } from './GameStage';
import { CurrencyChips, Screen, Toast, TopBar, useToast } from './common';
import { BallModal } from './BallModal';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-5">
      <h2 className="mb-2 px-1 text-[12px] font-bold uppercase tracking-wider text-slate-500">{title}</h2>
      {children}
    </section>
  );
}

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
  // шарик, для которого открыто окно описания и дерева
  const [detail, setDetail] = useState<OrbType | null>(null);
  const [lastChest, setLastChest] = useState<{ coins: number; points: number } | null>(null);
  const canChest = chestReady(meta, today);

  const doChest = () => {
    const r = openChest(meta, today);
    onUpdate(() => r.meta);
    setLastChest({ coins: r.coins, points: r.points });
    sfx.clear();
  };

  const doBuyBall = (t: OrbType) => {
    const r = buyBall(meta, t);
    if (r.error) return showToast(r.error);
    onUpdate(() => r.meta);
    sfx.buy();
    showToast(`Открыт шарик: ${TYPE_INFO[t].name}`);
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
                  Монеты {META_CFG.chest.coinsMin}–{META_CFG.chest.coinsMax} и {META_CFG.chest.pointsMin}–
                  {META_CFG.chest.pointsMax} очка прокачки. Раз в сутки.
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
              <div className="mt-3 flex items-center justify-center gap-4 rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-[15px] font-extrabold tabular-nums">
                <span className="flex items-center gap-1.5 text-amber-200">
                  <Coins size={16} className="text-amber-300" />+{lastChest.coins}
                </span>
                <span className="flex items-center gap-1.5 text-fuchsia-200">
                  <Sparkles size={16} className="text-fuchsia-300" />+{lastChest.points}
                </span>
              </div>
            )}
          </div>
        </Section>

        <Section title="Шарики">
          <div className="space-y-2">
            {(Object.keys(BALL_PRICES) as OrbType[]).map((t) => {
              const price = BALL_PRICES[t] ?? 0;
              const owned = ownsBall(meta, t);
              const info = TYPE_INFO[t];
              return (
                <div
                  key={t}
                  className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3"
                >
                  <button
                    onClick={() => setDetail(t)}
                    aria-label={`Подробнее: ${info.name}`}
                    className="shrink-0 rounded-xl transition active:scale-95"
                  >
                    <img src={orbSpriteUrl(t)} alt={info.name} draggable={false} className="h-12 w-12 select-none" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-bold text-slate-100">{info.name}</div>
                    <div className="text-[11px] leading-snug text-slate-500">{info.desc}</div>
                  </div>
                  {owned ? (
                    <div className="flex shrink-0 items-center gap-1 text-[12px] font-bold text-emerald-300">
                      <Check size={15} />
                      Открыт
                    </div>
                  ) : (
                    <button
                      onClick={() => doBuyBall(t)}
                      className={`flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-xl border px-3 text-[13px] font-extrabold transition active:scale-95 ${
                        meta.coins >= price
                          ? 'border-amber-400/50 bg-amber-500/15 text-amber-200'
                          : 'border-white/10 bg-white/[0.04] text-slate-500'
                      }`}
                    >
                      <Lock size={13} />
                      <Coins size={14} />
                      {price}
                    </button>
                  )}
                </div>
              );
            })}
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
      {detail && <BallModal type={detail} meta={meta} onUpdate={onUpdate} onClose={() => setDetail(null)} />}
      <Toast msg={toast} />
    </Screen>
  );
}
