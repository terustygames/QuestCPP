// Окно шарика: описание и вкладка «Дерево» с предпросмотром.
// Зажатый в инвентаре (или в магазине) шарик открывает это окно.
// Дерево можно тянуть вверх и вниз (или крутить колесом).
import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import { Check, Coins, GitBranch, Info, Lock, RotateCcw, Sparkles, X } from 'lucide-react';
import { TYPE_INFO, typeStatRows, type OrbType } from '../game/config';
import { sfx } from '../game/audio';
import {
  modsFor,
  nodePointsCost,
  nodeStatus,
  type NodeStatus,
  ownsBall,
  AUTO_ABILITY,
  autoAbilityBlocker,
  buyAutoAbility,
  hasAutoAbility,
  resetTree,
  treeProgress,
  unlockBlocker,
  unlockNode,
  type MetaState,
} from '../game/meta';
import { NODE_BY_ID, TREE_BY_TYPE, describeMods, rootId, type SkillNode } from '../game/skills';
import { orbSpriteUrl } from './GameStage';
import { Toast, useToast } from './common';

// Схема дерева в координатах окна (px). Сетка 4 колонки по 90 px (подписи 84 px не перекрываются).
// Корень — между колонками 1 и 2 (колонка 1.5), см. skills.ts TREE_SLOTS.
const CANVAS_W = 320; // схема по ширине вписывается в окно (на узком экране её уменьшают)
const CANVAS_H = 520;
const VIEW_H = 250;
const NODE = 50;
const LABEL_W = 76;
const colX = (c: number) => 40 + c * 78;
const ROW_Y = [44, 144, 244, 344, 444];
const ROMAN = ['I', 'II', 'III'];


function nodePos(id: string, type: OrbType) {
  if (id === rootId(type)) return { x: colX(1.5), y: ROW_Y[0] };
  const n = NODE_BY_ID[id];
  return { x: colX(n.col), y: ROW_Y[n.row] };
}

type Tab = 'info' | 'tree';

export function BallModal({
  type,
  meta,
  onUpdate,
  onClose,
}: {
  type: OrbType;
  meta: MetaState;
  onUpdate: (fn: (m: MetaState) => MetaState) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>('info');
  const [toast, showToast] = useToast();
  const info = TYPE_INFO[type];
  const owned = ownsBall(meta, type);
  const prog = treeProgress(meta, type);
  const mods = modsFor(meta)[type];
  return (
    <div
      className="fixed inset-0 z-[55] flex items-center justify-center bg-[#04060d]/85 p-3 backdrop-blur-sm"
      onClick={onClose}
      style={{
        paddingTop: 'max(12px, env(safe-area-inset-top))',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
      }}
    >
      <div
        role="dialog"
        aria-label={info.name}
        className="flex max-h-full w-full max-w-md flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-900/95 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 p-4 pb-3">
          <img src={orbSpriteUrl(type)} alt={info.name} draggable={false} className="h-14 w-14 shrink-0 select-none" />
          <div className="min-w-0 flex-1">
            <div className="font-display truncate text-lg font-bold text-slate-100">{info.name}</div>
            <div className="text-[12px] text-slate-400">
              {owned
                ? `Открыт · узлов ${prog.open} из ${prog.total}`
                : 'Не открыт'}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mx-4 grid grid-cols-2 gap-1.5 rounded-xl border border-white/[0.07] bg-slate-950/60 p-1">
          <TabBtn active={tab === 'info'} onClick={() => setTab('info')} icon={<Info size={15} />} label="Описание" />
          <TabBtn active={tab === 'tree'} onClick={() => setTab('tree')} icon={<GitBranch size={15} />} label="Дерево" />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {tab === 'info' ? (
            <div className="space-y-4">
              <p className="text-[14px] leading-relaxed text-slate-300">{info.desc}</p>

              <Block title="Характеристики">
                <div className="space-y-1.5">
                  {typeStatRows(type, 1).map((r) => (
                    <div
                      key={r.label}
                      className="flex items-baseline justify-between gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2"
                    >
                      <span className="text-[13px] text-slate-300">{r.label}</span>
                      <span className="whitespace-nowrap text-[14px] font-extrabold tabular-nums text-slate-100">{r.cur}</span>
                    </div>
                  ))}
                </div>
              </Block>

              <Block title="Бонусы дерева навыков">
                {describeMods(mods).length > 0 ? (
                  <ul className="space-y-1 text-[13px] text-emerald-200">
                    {describeMods(mods).map((t) => (
                      <li key={t} className="flex items-start gap-2">
                        <Check size={14} className="mt-0.5 shrink-0" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[13px] text-slate-500">Пока пусто</p>
                )}
              </Block>

            </div>
          ) : (
            <SkillTree type={type} meta={meta} onUpdate={onUpdate} onToast={showToast} />
          )}
        </div>
        <Toast msg={toast} />
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg text-[13px] font-bold transition ${
        active ? 'bg-white/[0.1] text-slate-100' : 'text-slate-500 hover:text-slate-300'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">{title}</div>
      {children}
    </div>
  );
}

// Вкладка «Дерево»: предпросмотр с перетаскиванием вверх/вниз и карточка узла
function SkillTree({
  type,
  meta,
  onUpdate,
  onToast,
}: {
  type: OrbType;
  meta: MetaState;
  onUpdate: (fn: (m: MetaState) => MetaState) => void;
  onToast: (t: string) => void;
}) {
  const info = TYPE_INFO[type];
  const nodes = TREE_BY_TYPE[type];
  const [sel, setSel] = useState<string>(
    () => nodes.find((n) => nodeStatus(meta, n) === 'ready')?.id ?? rootId(type),
  );
  const [offset, setOffset] = useState(0);
  const [confirmReset, setConfirmReset] = useState(false);
  // ширина окна и масштаб схемы: на узком экране схема уменьшается, чтобы влезла по ширине
  const [fit, setFit] = useState({ w: CANVAS_W, scale: 1 });
  const viewRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startY: number; startOff: number; moved: boolean } | null>(null);
  const scale = fit.scale;
  // по вертикали схему можно тянуть, если она выше окна (с учётом масштаба)
  const minOff = Math.min(0, VIEW_H - CANVAS_H * scale);
  const clampOffset = (v: number) => Math.max(minOff, Math.min(0, v));

  useEffect(() => {
    const el = viewRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      setFit({ w, scale: Math.min(1, w / CANVAS_W) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Колесо мыши двигает предпросмотр (страница при этом не прокручивается)
  useEffect(() => {
    const el = viewRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setOffset((o) => Math.max(minOff, Math.min(0, o - e.deltaY)));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [minOff]);

  const onPointerDown = (e: ReactPointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const rec = { startY: e.clientY, startOff: offset, moved: false };
    drag.current = rec;
    const move = (ev: PointerEvent) => {
      const dy = ev.clientY - rec.startY;
      if (Math.abs(dy) > 6) rec.moved = true;
      setOffset(clampOffset(rec.startOff + dy));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  };

  const pick = (id: string) => {
    // после перетаскивания клик по узлу не считаем выбором
    if (drag.current?.moved) return;
    setSel(id);
    setConfirmReset(false);
  };

  const unlock = (id: string) => {
    const r = unlockNode(meta, id);
    if (r.error) return onToast(r.error);
    onUpdate(() => r.meta);
    sfx.upgrade();
  };

  const doReset = () => {
    const r = resetTree(meta, type);
    onUpdate(() => r.meta);
    setConfirmReset(false);
    setSel(rootId(type));
    onToast(`Дерево сброшено: ОП «${info.name}» +${r.refundPoints}, монеты +${r.refundCoins}`);
  };

  const node: SkillNode | null = sel === rootId(type) ? null : NODE_BY_ID[sel] ?? null;
  const prog = treeProgress(meta, type);
  const nextCost = nodePointsCost(meta, type);

  const doBuyAuto = () => {
    const r = buyAutoAbility(meta, type);
    if (r.error) return onToast(r.error);
    onUpdate(() => r.meta);
    sfx.upgrade();
    onToast(`«${info.name}»: автоатака куплена`);
  };
  const autoOwned = hasAutoAbility(meta, type);
  const autoWhy = autoAbilityBlocker(meta, type);

  return (
    <div className="space-y-3">
      <div
        ref={viewRef}
        onPointerDown={onPointerDown}
        className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-slate-950/60"
        style={{ height: VIEW_H, touchAction: 'none', cursor: 'grab' }}
      >
        <div
          className="absolute left-0 top-0"
          style={{
            width: CANVAS_W,
            height: CANVAS_H,
            transform: `translate(${Math.max(0, (fit.w - CANVAS_W * scale) / 2)}px, ${offset}px) scale(${scale})`,
            transformOrigin: '0 0',
          }}
        >
          <svg width={CANVAS_W} height={CANVAS_H} className="pointer-events-none absolute left-0 top-0">
            {nodes.map((n) => {
              const a = nodePos(n.parent, type);
              const b = nodePos(n.id, type);
              const st = nodeStatus(meta, n);
              const stroke = st === 'open' ? info.color : st === 'ready' ? info.color : '#334155';
              return (
                <line
                  key={`l-${n.id}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={stroke}
                  strokeWidth={st === 'open' ? 3 : 2}
                  strokeOpacity={st === 'ready' ? 0.7 : st === 'open' ? 1 : 0.55}
                  strokeDasharray={st === 'ready' ? '5 4' : undefined}
                />
              );
            })}
          </svg>

          {/* развилка: два пути на первом ряду, открыт только один */}
          <div
            className="pointer-events-none absolute text-center text-[10px] font-bold uppercase tracking-wider text-slate-500"
            style={{ left: colX(1.5) - 22, top: ROW_Y[1] - 7, width: 44 }}
          >
            или
          </div>

          {/* корень: открыт всегда */}
          <NodeDot
            x={colX(1.5)}
            y={ROW_Y[0]}
            selected={sel === rootId(type)}
            onClick={() => pick(rootId(type))}
            color={info.color}
            state="open"
            label={info.name}
          >
            <img src={orbSpriteUrl(type)} alt="" draggable={false} className="h-9 w-9 select-none" />
          </NodeDot>

          {nodes.map((n) => {
            const st = nodeStatus(meta, n);
            return (
              <NodeDot
                key={n.id}
                x={colX(n.col)}
                y={ROW_Y[n.row]}
                selected={sel === n.id}
                onClick={() => pick(n.id)}
                color={info.color}
                state={st}
                label={n.name}
                // прогресс: сколько ОП набрано на открытие выбранного узла
                bar={sel === n.id && (st === 'ready' || st === 'locked') ? { cur: meta.pts[type], need: nextCost } : undefined}
              >
                <span className="text-[13px] font-extrabold">{ROMAN[n.tier - 1]}</span>
              </NodeDot>
            );
          })}
        </div>
      </div>

      {node && (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
          <NodeCard node={node} meta={meta} onUnlock={() => unlock(node.id)} />
        </div>
      )}

      <div className="flex items-center justify-between gap-2 text-[12px] text-slate-400">
        <span>
          Открыто {prog.open} из {prog.total}
        </span>
        <span className="flex items-center gap-2 tabular-nums">
          <Sparkles size={13} className="text-fuchsia-300" />
          ОП {meta.pts[type]} · след. {nextCost}
          <Coins size={13} className="text-amber-300" />
          {meta.coins}
        </span>
      </div>

      {/* автоатака: показывается только когда выбран её узел (конец левой ветки) */}
      {node?.key === 'auto' && (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <div className="text-[13px] font-bold text-slate-100">Автоатака</div>
        <div className="mt-0.5 text-[12px] leading-snug text-slate-400">
          Авто-линия стреляет сама после перезарядки.
        </div>
        {autoOwned ? (
          <div className="mt-2 flex items-center gap-1.5 text-[13px] font-bold text-emerald-300">
            <Check size={15} /> Куплена
          </div>
        ) : (
          <button
            onClick={doBuyAuto}
            className={`mt-2 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border px-3 text-[13px] font-bold transition active:scale-[0.98] ${
              autoWhy === null
                ? 'border-amber-400/50 bg-amber-500/15 text-amber-200'
                : 'border-white/10 bg-white/[0.04] text-slate-500'
            }`}
          >
            <Coins size={15} />
            Купить за {AUTO_ABILITY.price}
          </button>
        )}
        {!autoOwned && autoWhy !== null && (
          <div className="mt-1.5 text-[11px] text-slate-500">{autoWhy}</div>
        )}
      </div>
      )}

      {prog.open > 0 &&
        (confirmReset ? (
          <button
            onClick={doReset}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-rose-400/50 bg-rose-500/15 px-3 text-[13px] font-bold text-rose-200 transition active:scale-[0.98]"
          >
            Точно сбросить: ОП вернутся, монеты наполовину
          </button>
        ) : (
          <button
            onClick={() => setConfirmReset(true)}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-[13px] font-bold text-slate-300 transition hover:border-white/25 active:scale-[0.98]"
          >
            <RotateCcw size={15} />
            Сбросить дерево
          </button>
        ))}
    </div>
  );
}

function NodeDot({
  x,
  y,
  selected,
  onClick,
  color,
  state,
  label,
  bar,
  children,
}: {
  x: number;
  y: number;
  selected: boolean;
  onClick: () => void;
  color: string;
  state: NodeStatus;
  label: string;
  bar?: { cur: number; need: number }; // полоска очков прокачки под выбранным узлом
  children: ReactNode;
}) {
  const style =
    state === 'open'
      ? { background: color, borderColor: '#ffffff', color: '#0b0e18' }
      : state === 'ready'
        ? { background: '#0f172a', borderColor: color, color }
        : { background: '#0f172a', borderColor: '#334155', color: '#64748b' };
  const labelColor =
    state === 'open' ? '#e2e8f0' : state === 'ready' ? '#cbd5e1' : state === 'blocked' ? '#475569' : '#64748b';
  return (
    <>
      <button
        onClick={onClick}
        aria-label={label}
        className={`absolute flex items-center justify-center rounded-full border-2 transition active:scale-95 ${
          selected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-950' : ''
        }`}
        style={{
          left: x - NODE / 2,
          top: y - NODE / 2,
          width: NODE,
          height: NODE,
          opacity: state === 'locked' ? 0.6 : 1,
          ...style,
        }}
      >
        {children}
      </button>
      {bar && (
        <div
          className="pointer-events-none absolute"
          style={{ left: x - 32, top: y + NODE / 2 + 5, width: 64 }}
        >
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.min(100, (bar.cur / Math.max(1, bar.need)) * 100)}%`, background: color }}
            />
          </div>
          <div className="mt-0.5 text-center text-[10px] font-bold tabular-nums text-slate-200">
            {bar.cur} / {bar.need}
          </div>
        </div>
      )}
      <div
        className="pointer-events-none absolute text-center text-[11px] font-semibold leading-tight"
        style={{
          left: x - LABEL_W / 2,
          top: y + NODE / 2 + 5 + (bar ? 26 : 0),
          width: LABEL_W,
          color: labelColor,
        }}
      >
        {label}
      </div>
    </>
  );
}

function NodeCard({ node, meta, onUnlock }: { node: SkillNode; meta: MetaState; onUnlock: () => void }) {
  const st = nodeStatus(meta, node);
  const why = unlockBlocker(meta, node);
  const effects = describeMods(node.effect).join(' · ');
  const cost = nodePointsCost(meta, node.type);
  const notEnoughPts = meta.pts[node.type] < cost;
  const notEnoughCoins = meta.coins < node.coins;
  return (
    <div className="space-y-2">
      <div className="text-[15px] font-extrabold text-slate-100">{node.name}</div>
      <p className="text-[13px] font-semibold text-emerald-200">{effects}</p>
      <div className="flex items-center gap-3 text-[13px] font-bold tabular-nums">
        <span className={`flex items-center gap-1 ${notEnoughPts && st !== 'open' ? 'text-rose-300' : 'text-fuchsia-200'}`}>
          <Sparkles size={14} />
          {cost} ОП
        </span>
        <span className={`flex items-center gap-1 ${notEnoughCoins && st !== 'open' ? 'text-rose-300' : 'text-amber-200'}`}>
          <Coins size={14} />
          {node.coins}
        </span>
      </div>
      {st === 'open' ? (
        <div className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/10 text-[14px] font-bold text-emerald-200">
          <Check size={16} />
          Открыто
        </div>
      ) : (
        <>
          <button
            onClick={onUnlock}
            disabled={!!why}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 px-3 text-[14px] font-extrabold text-slate-950 transition enabled:active:scale-[0.98] disabled:opacity-35"
          >
            {why && st === 'locked' ? <Lock size={15} /> : null}
            Открыть узел
          </button>
          {why && <p className="text-center text-[12px] text-slate-400">{why}</p>}
        </>
      )}
    </div>
  );
}
