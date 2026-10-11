// ============================================================
// ДЕРЕВЬЯ НАВЫКОВ ШАРИКОВ (мета-прокачка между забегами).
// У каждого из одиннадцати шариков — своё дерево:
//   корень (открыт всегда) и три ветки по три узла.
// Узел открывается только после предыдущего узла своей ветки
// и стоит очки прокачки И монеты. Эффекты узлов суммируются и
// действуют на тип шарика, пока он стоит в колоде забега.
// Все цифры дерева — здесь. Движок читает их через TypeMods.
// ============================================================

import type { OrbType } from './config';

// Ключи эффектов, которые понимает движок (см. Engine.m()).
//  dmg      — плоский урон основного попадания (+N)
//  dmgPct   — процент урона основного попадания (0.15 = +15%)
//  shots    — снарядов в залпе (+N)
//  cd       — перезарядка, секунды (−0.1 = быстрее)
//  combo    — бонус цепи: урон каждому снаряду за шарик в линии (+N)
//  radius   — радиус эффекта, px (осколки огня, цепь молнии, взрыв сверхновой)
//  chain    — целей цепи молнии (+N)
//  pierce   — врагов, которых пробивает пробой (+N)
//  dur      — длительность эффекта, секунды (лёд, яд, паралич)
//  slow     — замедление врага: отрицательное значение = сильнее (−0.05)
//  dps      — урон яда в секунду (+N)
//  stacks   — максимум стаков яда (+N)
//  needles  — игл при лопании шипастого (+N)
//  splash   — урон осколков огня соседним врагам (+N)
//  ess      — эссенция: за каждый залп / за каждый лопнувший шипастый (+N)
//  amp      — множитель усиления соседей усилителя (+N к ×2)
export type ModKey =
  | 'dmg'
  | 'dmgPct'
  | 'shots'
  | 'cd'
  | 'combo'
  | 'radius'
  | 'chain'
  | 'pierce'
  | 'dur'
  | 'slow'
  | 'dps'
  | 'stacks'
  | 'needles'
  | 'splash'
  | 'ess'
  | 'amp';

export type TypeMods = Partial<Record<ModKey, number>>;

// Стоимость узла по уровню (1 — у корня ветки, 3 — капстоун ветки)
export const TIER_COST: Record<1 | 2 | 3, { points: number; coins: number }> = {
  1: { points: 1, coins: 40 },
  2: { points: 2, coins: 80 },
  3: { points: 3, coins: 150 },
};

export interface SkillNode {
  id: string;
  type: OrbType;
  branch: 0 | 1 | 2;
  branchName: string; // название ветки («Жар», «Осколки»…)
  tier: 1 | 2 | 3;
  name: string;
  desc: string;
  effect: TypeMods;
  parent: string; // id родителя: корень шарика или предыдущий узел ветки
  col: number; // колонка на схеме: 0 — левая ветка, 1 — центр, 2 — правая
  row: number; // строка на схеме: 0 — корень, 1..3 — узлы ветки
  points: number; // очки прокачки
  coins: number; // монеты
}

export const ROOT_SUFFIX = 'root';
export const rootId = (t: OrbType) => `${t}:${ROOT_SUFFIX}`;

interface NodeSpec {
  name: string;
  desc: string;
  effect: TypeMods;
}
interface BranchSpec {
  name: string;
  nodes: [NodeSpec, NodeSpec, NodeSpec];
}

// Тематика деревьев следует роли шарика:
// огонь — урон и осколки, лёд — контроль, молния — цепь, яд — длительный урон,
// шипастый — иглы, усилитель — поддержка соседей, сверхновая — радиус,
// паралич — контроль, пробой — пробитие, вампир — эссенция, шквал — количество.
const SPEC: Record<OrbType, [BranchSpec, BranchSpec, BranchSpec]> = {
  fire: [
    {
      name: 'Жар',
      nodes: [
        { name: 'Угли', desc: 'Основной урон снаряда растёт', effect: { dmg: 1 } },
        { name: 'Раскалённый', desc: 'Основной урон вырастает на 15%', effect: { dmgPct: 0.15 } },
        { name: 'Пожарище', desc: 'Ещё +2 к основному урону', effect: { dmg: 2 } },
      ],
    },
    {
      name: 'Осколки',
      nodes: [
        { name: 'Искры', desc: 'Соседние враги получают больше урона от осколков', effect: { splash: 1 } },
        { name: 'Разлёт', desc: 'Радиус осколков шире', effect: { radius: 14 } },
        { name: 'Лавина', desc: 'Осколки бьют сильнее и дальше', effect: { splash: 2, radius: 10 } },
      ],
    },
    {
      name: 'Очаг',
      nodes: [
        { name: 'Быстрый ход', desc: 'Шарик быстрее перезаряжается', effect: { cd: -0.1 } },
        { name: 'Частый огонь', desc: 'Перезарядка ещё короче', effect: { cd: -0.15 } },
        { name: 'Очаг', desc: 'Залп получает ещё один снаряд', effect: { shots: 1 } },
      ],
    },
  ],
  ice: [
    {
      name: 'Холод',
      nodes: [
        { name: 'Иней', desc: 'Замедление врага сильнее', effect: { slow: -0.05 } },
        { name: 'Мороз', desc: 'Замедление сильнее ещё', effect: { slow: -0.05 } },
        { name: 'Абсолютный ноль', desc: 'Сильное замедление и дольше держится', effect: { slow: -0.1, dur: 0.5 } },
      ],
    },
    {
      name: 'Стужа',
      nodes: [
        { name: 'Долгий холод', desc: 'Замедление держится дольше', effect: { dur: 0.6 } },
        { name: 'Глубокий холод', desc: 'Замедление держится ещё дольше', effect: { dur: 0.8 } },
        { name: 'Вечная мерзлота', desc: 'Очень долгое замедление и урон', effect: { dur: 1.2, dmg: 1 } },
      ],
    },
    {
      name: 'Метель',
      nodes: [
        { name: 'Осколки льда', desc: 'Основной урон растёт', effect: { dmg: 1 } },
        { name: 'Частые шипы', desc: 'Перезарядка короче', effect: { cd: -0.1 } },
        { name: 'Метель', desc: 'Залп получает ещё один снаряд', effect: { shots: 1 } },
      ],
    },
  ],
  bolt: [
    {
      name: 'Разряд',
      nodes: [
        { name: 'Перескок', desc: 'Разряд перескакивает на одну цель больше', effect: { chain: 1 } },
        { name: 'Дуга', desc: 'Разряд ищет цели дальше', effect: { radius: 30 } },
        { name: 'Гроза', desc: 'Ещё одна цель и +1 урона', effect: { chain: 1, dmg: 1 } },
      ],
    },
    {
      name: 'Мощь',
      nodes: [
        { name: 'Заряд', desc: 'Основной урон растёт', effect: { dmg: 1 } },
        { name: 'Перегрузка', desc: 'Основной урон вырастает на 20%', effect: { dmgPct: 0.2 } },
        { name: 'Высокое напряжение', desc: 'Ещё +2 к основному урону', effect: { dmg: 2 } },
      ],
    },
    {
      name: 'Частота',
      nodes: [
        { name: 'Быстрый разряд', desc: 'Перезарядка короче', effect: { cd: -0.1 } },
        { name: 'Импульс', desc: 'Каждый шарик линии добавляет ещё +1 урона', effect: { combo: 1 } },
        { name: 'Шторм', desc: 'Залп получает ещё один снаряд', effect: { shots: 1 } },
      ],
    },
  ],
  poison: [
    {
      name: 'Токсин',
      nodes: [
        { name: 'Слабый яд', desc: 'Яд наносит больше урона в секунду', effect: { dps: 0.4 } },
        { name: 'Едкий яд', desc: 'Яд наносит ещё больше урона в секунду', effect: { dps: 0.6 } },
        { name: 'Разложение', desc: 'Сильный яд', effect: { dps: 1 } },
      ],
    },
    {
      name: 'Стойкость',
      nodes: [
        { name: 'Долгое действие', desc: 'Яд длится дольше', effect: { dur: 1 } },
        { name: 'Заражение', desc: 'Можно накопить ещё один стак яда', effect: { stacks: 1 } },
        { name: 'Эпидемия', desc: 'Яд длится дольше и накапливается сильнее', effect: { dur: 2, stacks: 1 } },
      ],
    },
    {
      name: 'Укус',
      nodes: [
        { name: 'Укус', desc: 'Основной урон растёт', effect: { dmg: 1 } },
        { name: 'Яд в крови', desc: 'Основной урон вырастает на 15%', effect: { dmgPct: 0.15 } },
        { name: 'Смертельный укус', desc: 'Ещё +2 к основному урону', effect: { dmg: 2 } },
      ],
    },
  ],
  spiky: [
    {
      name: 'Иглы',
      nodes: [
        { name: 'Лишние иглы', desc: 'Шипастый выпускает ещё одну иглу', effect: { needles: 1 } },
        { name: 'Ещё иглы', desc: 'Шипастый выпускает ещё одну иглу', effect: { needles: 1 } },
        { name: 'Ёж', desc: 'Шипастый выпускает ещё две иглы', effect: { needles: 2 } },
      ],
    },
    {
      name: 'Острота',
      nodes: [
        { name: 'Заточка', desc: 'Иглы наносят +1 урона', effect: { dmg: 1 } },
        { name: 'Закалка', desc: 'Урон игл вырастает на 25%', effect: { dmgPct: 0.25 } },
        { name: 'Бритва', desc: 'Иглы наносят ещё +2 урона', effect: { dmg: 2 } },
      ],
    },
    {
      name: 'Жатва',
      nodes: [
        { name: 'Сбор', desc: '+1 эссенции за каждый лопнувший шипастый', effect: { ess: 1 } },
        { name: 'Пожатие', desc: '+1 эссенции за каждый лопнувший шипастый', effect: { ess: 1 } },
        { name: 'Урожай', desc: '+2 эссенции за каждый лопнувший шипастый', effect: { ess: 2 } },
      ],
    },
  ],
  amp: [
    {
      name: 'Резонанс',
      nodes: [
        { name: 'Резонанс', desc: 'Усиление соседей ×2.25 вместо ×2', effect: { amp: 0.25 } },
        { name: 'Гул', desc: 'Усиление соседей ×2.5', effect: { amp: 0.25 } },
        { name: 'Оркестр', desc: 'Усиление соседей ×3', effect: { amp: 0.5 } },
      ],
    },
    {
      name: 'Эхо',
      nodes: [
        { name: 'Эхо', desc: 'Эхо-снаряд наносит +1 урона', effect: { dmg: 1 } },
        { name: 'Отзвук', desc: 'Урон эха вырастает на 20%', effect: { dmgPct: 0.2 } },
        { name: 'Эхо-удар', desc: 'Эхо-снаряд наносит ещё +2 урона', effect: { dmg: 2 } },
      ],
    },
    {
      name: 'Такт',
      nodes: [
        { name: 'Такт', desc: 'Перезарядка короче', effect: { cd: -0.1 } },
        { name: 'Синхрон', desc: 'Каждый шарик линии добавляет ещё +1 урона', effect: { combo: 1 } },
        { name: 'Волна', desc: 'Собственный залп получает ещё один снаряд', effect: { shots: 1 } },
      ],
    },
  ],
  nova: [
    {
      name: 'Волна',
      nodes: [
        { name: 'Ударная волна', desc: 'Радиус взрыва шире', effect: { radius: 15 } },
        { name: 'Раскат', desc: 'Радиус взрыва ещё шире', effect: { radius: 15 } },
        { name: 'Катаклизм', desc: 'Большой радиус и +1 урона', effect: { radius: 20, dmg: 1 } },
      ],
    },
    {
      name: 'Жар',
      nodes: [
        { name: 'Жар взрыва', desc: 'Урон взрыва +1', effect: { dmg: 1 } },
        { name: 'Накал', desc: 'Урон взрыва вырастает на 15%', effect: { dmgPct: 0.15 } },
        { name: 'Ядро', desc: 'Урон взрыва +2', effect: { dmg: 2 } },
      ],
    },
    {
      name: 'Ритм',
      nodes: [
        { name: 'Скорый взрыв', desc: 'Перезарядка короче', effect: { cd: -0.15 } },
        { name: 'Частый взрыв', desc: 'Перезарядка короче', effect: { cd: -0.15 } },
        { name: 'Выброс', desc: '+2 эссенции за каждый залп', effect: { ess: 2 } },
      ],
    },
  ],
  stun: [
    {
      name: 'Заморозка',
      nodes: [
        { name: 'Долгий паралич', desc: 'Паралич длится дольше', effect: { dur: 0.4 } },
        { name: 'Глубокий паралич', desc: 'Паралич длится ещё дольше', effect: { dur: 0.4 } },
        { name: 'Окаменение', desc: 'Сильно удлиняет паралич', effect: { dur: 0.8 } },
      ],
    },
    {
      name: 'Разряд',
      nodes: [
        { name: 'Удар тока', desc: 'Основной урон растёт', effect: { dmg: 1 } },
        { name: 'Сильный ток', desc: 'Основной урон растёт ещё', effect: { dmg: 1 } },
        { name: 'Перегруз', desc: 'Основной урон вырастает на 25%', effect: { dmgPct: 0.25 } },
      ],
    },
    {
      name: 'Контроль',
      nodes: [
        { name: 'Быстрая сеть', desc: 'Перезарядка короче', effect: { cd: -0.1 } },
        { name: 'Двойной удар', desc: 'Каждый шарик линии добавляет ещё +1 урона', effect: { combo: 1 } },
        { name: 'Шок', desc: 'Залп получает ещё один снаряд', effect: { shots: 1 } },
      ],
    },
  ],
  pierce: [
    {
      name: 'Игла',
      nodes: [
        { name: 'Острие', desc: 'Снаряд пробивает ещё одного врага', effect: { pierce: 1 } },
        { name: 'Заострение', desc: 'Снаряд пробивает ещё одного врага', effect: { pierce: 1 } },
        { name: 'Копьё', desc: 'Пробивает ещё одного врага и +1 урона', effect: { pierce: 1, dmg: 1 } },
      ],
    },
    {
      name: 'Мощь',
      nodes: [
        { name: 'Закалённый', desc: 'Основной урон растёт', effect: { dmg: 1 } },
        { name: 'Пробивная мощь', desc: 'Основной урон вырастает на 20%', effect: { dmgPct: 0.2 } },
        { name: 'Тяжёлый снаряд', desc: 'Ещё +2 к основному урону', effect: { dmg: 2 } },
      ],
    },
    {
      name: 'Залп',
      nodes: [
        { name: 'Быстрый выстрел', desc: 'Перезарядка короче', effect: { cd: -0.1 } },
        { name: 'Частый выстрел', desc: 'Перезарядка короче', effect: { cd: -0.1 } },
        { name: 'Двойной залп', desc: 'Залп получает ещё один снаряд', effect: { shots: 1 } },
      ],
    },
  ],
  vampire: [
    {
      name: 'Жажда',
      nodes: [
        { name: 'Жажда', desc: '+1 эссенции за каждый залп', effect: { ess: 1 } },
        { name: 'Глоток', desc: '+1 эссенции за каждый залп', effect: { ess: 1 } },
        { name: 'Пир', desc: '+2 эссенции за каждый залп', effect: { ess: 2 } },
      ],
    },
    {
      name: 'Укус',
      nodes: [
        { name: 'Клыки', desc: 'Основной урон растёт', effect: { dmg: 1 } },
        { name: 'Острые клыки', desc: 'Основной урон вырастает на 15%', effect: { dmgPct: 0.15 } },
        { name: 'Кровь', desc: 'Основной урон растёт ещё', effect: { dmg: 1 } },
      ],
    },
    {
      name: 'Голод',
      nodes: [
        { name: 'Голод', desc: 'Перезарядка короче', effect: { cd: -0.1 } },
        { name: 'Охота', desc: 'Каждый шарик линии добавляет ещё +1 урона', effect: { combo: 1 } },
        { name: 'Рой', desc: 'Залп получает ещё один снаряд', effect: { shots: 1 } },
      ],
    },
  ],
  barrage: [
    {
      name: 'Залп',
      nodes: [
        { name: 'Пятый снаряд', desc: 'Залп получает ещё один снаряд', effect: { shots: 1 } },
        { name: 'Шестой снаряд', desc: 'Залп получает ещё один снаряд', effect: { shots: 1 } },
        { name: 'Шквал', desc: 'Залп получает ещё один снаряд', effect: { shots: 1 } },
      ],
    },
    {
      name: 'Точность',
      nodes: [
        { name: 'Прицел', desc: 'Урон снарядов вырастает на 15%', effect: { dmgPct: 0.15 } },
        { name: 'Точный залп', desc: 'Урон снарядов вырастает ещё на 15%', effect: { dmgPct: 0.15 } },
        { name: 'Бронебой', desc: 'Урон снарядов вырастает на 25%', effect: { dmgPct: 0.25 } },
      ],
    },
    {
      name: 'Частота',
      nodes: [
        { name: 'Быстрая очередь', desc: 'Перезарядка короче', effect: { cd: -0.1 } },
        { name: 'Частая очередь', desc: 'Перезарядка короче', effect: { cd: -0.1 } },
        { name: 'Пулемёт', desc: 'Перезарядка заметно короче', effect: { cd: -0.15 } },
      ],
    },
  ],
};

// Схема дерева: корень в центре сверху, ветки — колонками 0, 1, 2.
// Узел ветки b, уровень t (1..3) — колонка b, строка t.

function buildTree(): SkillNode[] {
  const out: SkillNode[] = [];
  (Object.keys(SPEC) as OrbType[]).forEach((type) => {
    SPEC[type].forEach((branch, b) => {
      let parent = rootId(type);
      branch.nodes.forEach((spec, k) => {
        const tier = (k + 1) as 1 | 2 | 3;
        const id = `${type}:${b}${tier}`;
        out.push({
          id,
          type,
          branch: b as 0 | 1 | 2,
          branchName: branch.name,
          tier,
          name: spec.name,
          desc: spec.desc,
          effect: spec.effect,
          parent,
          col: b,
          row: tier,
          points: TIER_COST[tier].points,
          coins: TIER_COST[tier].coins,
        });
        parent = id;
      });
    });
  });
  return out;
}

export const SKILL_NODES: SkillNode[] = buildTree();
export const NODE_BY_ID: Record<string, SkillNode> = Object.fromEntries(SKILL_NODES.map((n) => [n.id, n]));
export const TREE_BY_TYPE: Record<OrbType, SkillNode[]> = (() => {
  const m = {} as Record<OrbType, SkillNode[]>;
  (Object.keys(SPEC) as OrbType[]).forEach((t) => {
    m[t] = SKILL_NODES.filter((n) => n.type === t);
  });
  return m;
})();
export const TREE_ROWS = 4; // корень + три уровня узлов
export const TREE_COLS = 3;

// Текстовые описания эффектов (для панелей и подписей)
const fmt = (v: number) => String(Math.round(v * 100) / 100).replace('.', ',');
const signed = (v: number) => (v > 0 ? '+' : v < 0 ? '−' : '') + fmt(Math.abs(v));

export const MOD_TEXT: Record<ModKey, (v: number) => string> = {
  dmg: (v) => `урон ${signed(v)}`,
  dmgPct: (v) => `урон ${signed(v * 100)}%`,
  shots: (v) => `снарядов в залпе ${signed(v)}`,
  cd: (v) => `перезарядка ${signed(v)} с`,
  combo: (v) => `бонус цепи ${signed(v)} за шарик`,
  radius: (v) => `радиус ${signed(v)} px`,
  chain: (v) => `целей молнии ${signed(v)}`,
  pierce: (v) => `пробивает врагов ${signed(v)}`,
  dur: (v) => `длительность ${signed(v)} с`,
  slow: (v) => `замедление ${signed(-v * 100)}%`,
  dps: (v) => `яд ${signed(v)} в секунду`,
  stacks: (v) => `стаков яда ${signed(v)}`,
  needles: (v) => `игл ${signed(v)}`,
  splash: (v) => `урон осколков ${signed(v)}`,
  ess: (v) => `эссенции ${signed(v)}`,
  amp: (v) => `усиление соседей ${signed(v)}`,
};

// Список строк-описаний для набора эффектов (например, сумма дерева)
export function describeMods(mods: TypeMods | undefined): string[] {
  if (!mods) return [];
  const out: string[] = [];
  (Object.keys(mods) as ModKey[]).forEach((k) => {
    const v = mods[k];
    if (v !== undefined && Math.abs(v) > 1e-9) out.push(MOD_TEXT[k](v));
  });
  return out;
}
