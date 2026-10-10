// ============================================================
// РУЛЕТКА БОССА. Перед каждой босс-волной (каждая 5-я) лента
// из двух боссов в случайном порядке прокручивается и
// останавливается под стрелкой по центру. Босс под стрелкой
// приходит в этой волне, у игрока есть время подготовиться.
// Движок уже выбрал босса (pendingBossId) — компонент лишь
// красиво показывает результат.
// ============================================================
import { useEffect, useRef, useState } from 'react';
import { BOSS_DEFS, BOSS_IDS, type BossId } from '../game/config';
import { sfx } from '../game/audio';

const SLOT_W = 104; // ширина слота (px)
const SLOT_GAP = 12; // зазор между слотами (px)
const SEQ_LEN = 26; // сколько слотов на ленте
const TARGET_INDEX = 20; // индекс слота, который встанет под стрелкой
const SPIN_MS = 2800; // длительность вращения (мс)

function BossSlot({ id, dim }: { id: BossId; dim?: boolean }) {
  const def = BOSS_DEFS[id];
  return (
    <div className="flex shrink-0 flex-col items-center justify-center gap-1.5" style={{ width: SLOT_W }}>
      <div
        className="rounded-full border-2"
        style={{
          width: 74,
          height: 74,
          borderColor: dim ? 'rgba(255,255,255,0.15)' : def.color,
          background: `radial-gradient(circle at 35% 30%, #ffffff 0%, ${def.color} 45%, ${def.dark} 100%)`,
          boxShadow: dim ? 'none' : `0 0 24px ${def.glow}0.55)`,
          opacity: dim ? 0.45 : 1,
          transition: 'opacity 0.4s, box-shadow 0.4s',
        }}
      />
      <div className="whitespace-nowrap text-[13px] font-bold text-slate-200">{def.name}</div>
    </div>
  );
}

export function BossRoulette({
  bossId,
  onDone,
  onWaveNow,
}: {
  bossId: BossId;
  onDone: () => void;
  onWaveNow: () => void;
}) {
  const [phase, setPhase] = useState<'spin' | 'result'>('spin');
  const stripRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  // случайный порядок боссов на ленте; под стрелкой — выбранный движком
  const seqRef = useRef<BossId[]>([]);
  if (seqRef.current.length === 0) {
    const s: BossId[] = [];
    for (let i = 0; i < SEQ_LEN; i++) {
      s.push(i === TARGET_INDEX ? bossId : BOSS_IDS[Math.floor(Math.random() * BOSS_IDS.length)]);
    }
    seqRef.current = s;
  }
  const def = BOSS_DEFS[bossId];

  useEffect(() => {
    const strip = stripRef.current;
    const view = viewRef.current;
    if (!strip || !view) return;
    const center = view.clientWidth / 2;
    // старт: первый слот по центру; финиш: целевой слот по центру
    strip.style.transform = `translateX(${center - SLOT_W / 2}px)`;
    sfx.reelTick();
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        strip.style.transition = `transform ${SPIN_MS}ms cubic-bezier(0.12, 0.8, 0.22, 1)`;
        strip.style.transform = `translateX(${center - (TARGET_INDEX * (SLOT_W + SLOT_GAP) + SLOT_W / 2)}px)`;
      });
    });
    let ended = false;
    const onEnd = () => {
      if (ended) return;
      ended = true;
      sfx.bossReveal();
      try {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate([60, 40, 60]);
      } catch {
        // нет вибромотора — не страшно
      }
      setPhase('result');
    };
    strip.addEventListener('transitionend', onEnd);
    const fallback = window.setTimeout(onEnd, SPIN_MS + 700);
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      strip.removeEventListener('transitionend', onEnd);
      window.clearTimeout(fallback);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#04060d]/85 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/95 to-slate-950/95 p-5 shadow-2xl sm:p-6">
        <div className="font-display text-center text-xl font-black text-slate-100">Рулетка босса</div>
        <div className="mt-1 text-center text-[13px] text-slate-400">
          Лента остановится на боссе этой волны. У тебя будет время подготовиться.
        </div>

        <div
          ref={viewRef}
          className="relative mt-4 h-[132px] overflow-hidden rounded-2xl border border-white/10 bg-[#070b16]"
        >
          {/* центральная зона подсветки */}
          <div
            className="pointer-events-none absolute inset-y-0 z-10"
            style={{
              left: '50%',
              width: SLOT_W,
              transform: 'translateX(-50%)',
              background:
                'linear-gradient(90deg, rgba(251,191,36,0) 0%, rgba(251,191,36,0.10) 50%, rgba(251,191,36,0) 100%)',
            }}
          />
          {/* стрелка по центру */}
          <div
            className="pointer-events-none absolute z-20"
            style={{
              left: '50%',
              top: -2,
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '9px solid transparent',
              borderRight: '9px solid transparent',
              borderTop: '12px solid #fbbf24',
            }}
          />
          <div ref={stripRef} className="flex h-full items-center will-change-transform" style={{ gap: SLOT_GAP }}>
            {seqRef.current.map((id, i) => (
              <BossSlot key={i} id={id} dim={phase === 'result' && i !== TARGET_INDEX} />
            ))}
          </div>
        </div>

        {phase === 'result' ? (
          <div className="mt-4">
            <div className="flex items-center justify-center gap-3">
              <div
                className="h-14 w-14 shrink-0 rounded-full border-2"
                style={{
                  borderColor: def.color,
                  background: `radial-gradient(circle at 35% 30%, #ffffff 0%, ${def.color} 45%, ${def.dark} 100%)`,
                  boxShadow: `0 0 30px ${def.glow}0.6)`,
                }}
              />
              <div className="min-w-0">
                <div className="text-lg font-extrabold" style={{ color: def.color }}>
                  Босс: {def.name}
                </div>
                <div className="text-[12px] leading-snug text-slate-400">{def.desc}</div>
              </div>
            </div>
            <div className="mt-3 text-center text-[12px] text-slate-500">
              Усиль поле: улучши шарики, собери заряженные в накопление
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={onDone}
                className="min-h-[48px] flex-1 rounded-2xl border border-white/15 bg-white/[0.06] font-bold text-slate-200 transition-all hover:border-white/30 active:scale-[0.97]"
              >
                Подготовиться
              </button>
              <button
                onClick={onWaveNow}
                className="min-h-[48px] flex-1 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 font-bold text-slate-950 shadow-lg shadow-cyan-500/25 transition-all active:scale-[0.97]"
              >
                Волна сейчас
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 animate-pulse text-center text-[13px] font-bold text-amber-300">Лента крутится</div>
        )}
      </div>
    </div>
  );
}
