// Инвентарь: колода из шести шариков и коллекция всех шариков.
// Тап по шарику — в колоду или из неё. Зажать — описание и дерево навыков.
import { useState } from 'react';
import { Check, Gift, Lock } from 'lucide-react';
import { ALL_TYPES, TYPE_INFO, type OrbType } from '../game/config';
import { sfx } from '../game/audio';
import { META_CFG, ownsBall, toggleDeck, treeProgress, type MetaState } from '../game/meta';
import { orbSpriteUrl } from './GameStage';
import { CurrencyChips, Screen, Toast, TopBar, useLongPress, useToast } from './common';
import { BallModal } from './BallModal';

// Слот колоды: пустой или с шариком (тап — убрать из колоды, зажать — описание)
function DeckSlot({
  t,
  onTap,
  onLong,
}: {
  t: OrbType | undefined;
  onTap: (t: OrbType) => void;
  onLong: (t: OrbType) => void;
}) {
  const press = useLongPress(() => t && onLong(t));
  if (!t) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/[0.02] text-[18px] text-slate-600">
        +
      </div>
    );
  }
  return (
    <button
      {...press.handlers}
      onClick={() => {
        if (!press.wasLong()) onTap(t);
      }}
      aria-label={`${TYPE_INFO[t].name} в колоде`}
      className="relative flex aspect-square items-center justify-center rounded-xl border border-amber-400/40 bg-amber-500/[0.07] transition active:scale-95"
    >
      <img src={orbSpriteUrl(t)} alt="" draggable={false} className="h-9 w-9 select-none" />
      <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-slate-950">
        <Check size={10} strokeWidth={3.5} />
      </span>
    </button>
  );
}

// Плитка шарика в коллекции
function BallTile({
  t,
  meta,
  inDeck,
  onTap,
  onLong,
}: {
  t: OrbType;
  meta: MetaState;
  inDeck: boolean;
  onTap: (t: OrbType) => void;
  onLong: (t: OrbType) => void;
}) {
  const press = useLongPress(() => onLong(t));
  const owned = ownsBall(meta, t);
  const prog = treeProgress(meta, t);
  const info = TYPE_INFO[t];
  return (
    <button
      {...press.handlers}
      onClick={() => {
        if (press.wasLong()) return;
        onTap(t);
      }}
      aria-label={info.name}
      className={`relative flex flex-col items-center rounded-2xl border p-2 text-center transition active:scale-[0.97] ${
        inDeck
          ? 'border-amber-400/50 bg-amber-500/[0.08]'
          : owned
            ? 'border-white/[0.1] bg-white/[0.03]'
            : 'border-white/[0.06] bg-white/[0.015]'
      }`}
    >
      <img
        src={orbSpriteUrl(t)}
        alt=""
        draggable={false}
        className={`h-11 w-11 select-none ${owned ? '' : 'opacity-40 grayscale'}`}
      />
      <div className={`mt-1 w-full truncate text-[12px] font-bold ${owned ? 'text-slate-100' : 'text-slate-500'}`}>
        {info.name}
      </div>
      <div className="mt-0.5 flex h-4 items-center justify-center text-[10px] font-bold">
        {inDeck ? (
          <span className="text-amber-300">в колоде</span>
        ) : owned ? (
          <span className="text-emerald-300/90">открыт</span>
        ) : (
          <span className="flex items-center gap-1 text-slate-500">
            <Lock size={10} />
            <Gift size={10} />
            из сундука
          </span>
        )}
      </div>
      <div className="mt-0.5 text-[10px] tabular-nums text-slate-500">
        дерево {prog.open}/{prog.total}
      </div>
    </button>
  );
}

export function Inventory({
  meta,
  onUpdate,
  onBack,
}: {
  meta: MetaState;
  onUpdate: (fn: (m: MetaState) => MetaState) => void;
  onBack: () => void;
}) {
  const [detail, setDetail] = useState<OrbType | null>(null);
  const [toast, showToast] = useToast();

  const tap = (t: OrbType) => {
    if (!ownsBall(meta, t)) {
      return showToast(`${TYPE_INFO[t].name} выпадает из ежедневного сундука`);
    }
    const r = toggleDeck(meta, t);
    if (r.error) return showToast(r.error);
    onUpdate(() => r.meta);
    sfx.select();
  };

  const full = meta.deck.length === META_CFG.deckSize;

  return (
    <Screen>
      <TopBar title="Инвентарь" onBack={onBack} right={<CurrencyChips meta={meta} />} />

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-8">
        <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[14px] font-extrabold text-slate-100">Колода</div>
            <div
              className={`rounded-lg px-2 py-0.5 text-[12px] font-extrabold tabular-nums ${
                full ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'
              }`}
            >
              {meta.deck.length} / {META_CFG.deckSize}
            </div>
          </div>
          <div className="grid grid-cols-6 gap-1.5">
            {Array.from({ length: META_CFG.deckSize }, (_, i) => (
              <DeckSlot key={i} t={meta.deck[i]} onTap={tap} onLong={setDetail} />
            ))}
          </div>
          <p className="mt-2 text-[12px] leading-snug text-slate-500">
            В забеге поле заполняется только шариками колоды. Тап по шарику ниже — в колоду или из неё. Зажми шарик —
            описание и дерево навыков.
          </p>
          {!full && (
            <p className="mt-1 text-[12px] font-semibold text-amber-300/90">
              Соберите колоду до {META_CFG.deckSize} шариков, чтобы начать забег.
            </p>
          )}
        </section>

        <h2 className="mb-2 mt-5 px-1 text-[12px] font-bold uppercase tracking-wider text-slate-500">Все шарики</h2>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {ALL_TYPES.map((t) => (
            <BallTile
              key={t}
              t={t}
              meta={meta}
              inDeck={meta.deck.includes(t)}
              onTap={tap}
              onLong={setDetail}
            />
          ))}
        </div>
      </div>

      {detail && <BallModal type={detail} meta={meta} onUpdate={onUpdate} onClose={() => setDetail(null)} />}
      <Toast msg={toast} />
    </Screen>
  );
}
