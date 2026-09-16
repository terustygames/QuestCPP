/* ==========================================================================
   Store — единое состояние приложения + localStorage.
   Подписчики получают уведомление после каждого изменения.
   ========================================================================== */

var Store = {
    KEY: 'questcpp.v2',

    state: {
        known: [],            // id станций, которые пользователь знает
        solved: [],           // id решённых задач
        attempts: {},         // id -> число попыток
        hintsUsed: {},        // id -> сколько подсказок открыто
        drafts: {},           // id -> код в редакторе
        xp: 0,
        streak: 0,
        lastSolveDay: null,
        solvedClean: 0,       // решено без подсказок
        firstTry: 0,          // решено с первой попытки
        achievements: [],
        flags: {},
        settings: { sound: true, fontSize: 15, theme: 'day' }
    },

    listeners: [],

    load() {
        try {
            const raw = localStorage.getItem(this.KEY);
            if (raw) {
                const saved = JSON.parse(raw);
                this.state = { ...this.state, ...saved, settings: { ...this.state.settings, ...(saved.settings || {}) } };
            }
        } catch (e) { /* повреждённые данные — начинаем заново */ }
        return this.state;
    },

    save() {
        localStorage.setItem(this.KEY, JSON.stringify(this.state));
        this.listeners.forEach(fn => fn(this.state));
    },

    subscribe(fn) { this.listeners.push(fn); },

    /* ---- станции ---- */
    knows(id) { return this.state.known.includes(id); },
    setKnown(id, value) {
        const k = this.state.known;
        const i = k.indexOf(id);
        if (value && i < 0) k.push(id);
        if (!value && i >= 0) k.splice(i, 1);
        this.save();
    },
    setKnownMany(ids, value) {
        const set = new Set(this.state.known);
        ids.forEach(id => value ? set.add(id) : set.delete(id));
        this.state.known = [...set];
        this.save();
    },

    /* ---- задачи ---- */
    isSolved(id) { return this.state.solved.includes(id); },
    canSolve(task) { return task.requires.every(r => this.knows(r)); },
    availableTasks() { return TaskDB.list.filter(t => this.canSolve(t)); },

    /* Сколько задач откроется, если выучить станцию id */
    unlockCountFor(id) {
        if (this.knows(id)) return 0;
        return TaskDB.list.filter(t =>
            t.requires.includes(id) &&
            t.requires.every(r => r === id || this.knows(r))
        ).length;
    },

    /* Задачи, до которых не хватает 1–2 станций: [{task, missing:[ids]}] */
    almostTasks(maxMissing = 2) {
        return TaskDB.list
            .filter(t => !this.isSolved(t.id))
            .map(t => ({ task: t, missing: t.requires.filter(r => !this.knows(r)) }))
            .filter(x => x.missing.length > 0 && x.missing.length <= maxMissing);
    },

    /* Станция, которую выгоднее всего выучить следующей.
       Считаем вклад в «почти открытые» задачи: 1 за единственную недостающую, 0.5 за одну из двух.
       При равенстве — более ранняя по маршруту. */
    nextStation() {
        const score = {};
        this.almostTasks(2).forEach(({ missing }) => {
            missing.forEach(id => { score[id] = (score[id] || 0) + (missing.length === 1 ? 1 : 0.5); });
        });
        let best = null, bestScore = 0;
        STATION_ORDER.forEach(id => {
            if (this.knows(id)) return;
            const sc = score[id] || 0;
            if (sc > bestScore) { best = id; bestScore = sc; }
        });
        if (!best) best = STATION_ORDER.find(id => !this.knows(id)) || null;
        const unlocks = best ? this.unlockCountFor(best) : 0;
        const almost = best ? this.almostTasks(2).filter(x => x.missing.includes(best)).length : 0;
        return best ? { id: best, unlocks, almost } : null;
    },

    registerAttempt(id) {
        this.state.attempts[id] = (this.state.attempts[id] || 0) + 1;
        this.save();
    },
    useHint(id) {
        this.state.hintsUsed[id] = (this.state.hintsUsed[id] || 0) + 1;
        this.save();
    },
    saveDraft(id, code) {
        this.state.drafts[id] = code;
        localStorage.setItem(this.KEY, JSON.stringify(this.state));
    },

    /* Возвращает { xpGained, levelBefore, levelAfter, newAchievements } */
    markSolved(task) {
        const s = this.state;
        if (s.solved.includes(task.id)) return null;

        const levelBefore = this.level().n;
        s.solved.push(task.id);

        let xp = task.xp;
        const hints = s.hintsUsed[task.id] || 0;
        const attempts = s.attempts[task.id] || 1;
        if (hints === 0) { s.solvedClean++; xp += Math.round(task.xp * 0.25); }
        if (attempts === 1) { s.firstTry++; xp += Math.round(task.xp * 0.25); }
        s.xp += xp;

        const today = new Date().toDateString();
        if (s.lastSolveDay !== today) {
            const yesterday = new Date(Date.now() - 864e5).toDateString();
            s.streak = s.lastSolveDay === yesterday ? s.streak + 1 : 1;
            s.lastSolveDay = today;
        }
        const h = new Date().getHours();
        if (h >= 0 && h < 5) s.flags.nightSolve = true;

        const newAchievements = this.checkAchievements();
        this.save();
        return { xpGained: xp, bonusClean: hints === 0, bonusFirst: attempts === 1,
                 levelBefore, levelAfter: this.level().n, newAchievements };
    },

    checkAchievements() {
        const fresh = [];
        ACHIEVEMENTS.forEach(a => {
            if (!this.state.achievements.includes(a.id) && a.check(this.state)) {
                this.state.achievements.push(a.id);
                fresh.push(a);
            }
        });
        return fresh;
    },

    /* ---- уровни ---- */
    LEVEL_TITLES: ['Пассажир', 'Стажёр', 'Машинист', 'Диспетчер', 'Инженер', 'Архитектор', 'Легенда линии'],
    level() {
        // Порог растёт: 100, 250, 450, 700, 1000, ...
        let n = 1, need = 100, acc = 0, xp = this.state.xp;
        while (xp >= acc + need) { acc += need; n++; need += 150; }
        return { n, current: xp - acc, need, title: this.LEVEL_TITLES[Math.min(n - 1, this.LEVEL_TITLES.length - 1)] };
    },

    reset() {
        localStorage.removeItem(this.KEY);
        location.reload();
    },

    exportJSON() { return JSON.stringify(this.state, null, 2); },
    importJSON(text) {
        const data = JSON.parse(text);
        if (!Array.isArray(data.known) || !Array.isArray(data.solved)) throw new Error('Неверный формат');
        this.state = { ...this.state, ...data };
        this.save();
    }
};
