/* ==========================================================================
   Hall — зал достижений и статистика по линиям маршрута.
   ========================================================================== */

var Hall = {
    init() { Router.register('hall', { onEnter: () => this.render() }); },

    render() {
        const s = Store.state;
        const grid = document.getElementById('ach-grid');
        grid.innerHTML = ACHIEVEMENTS.map(a => {
            const got = s.achievements.includes(a.id);
            return `<div class="ach ${got ? 'is-got' : ''}">
                <div class="ach-icon">${Icon(got ? 'medal' : 'lock')}</div>
                <div class="ach-body"><b>${esc(a.title)}</b><span>${esc(a.desc)}</span></div>
            </div>`;
        }).join('');
        FX.stagger(grid, '.ach', 35);

        const lines = document.getElementById('hall-lines');
        lines.innerHTML = ROUTE.map(line => {
            const tasks = TaskDB.list.filter(t => t.requires.some(r => STATIONS[r].line === line.id));
            const done = tasks.filter(t => s.solved.includes(t.id)).length;
            const known = line.stations.filter(st => s.known.includes(st.id)).length;
            return `<div class="hall-line" style="--c:${line.color}">
                <div class="hall-line-name">${esc(line.name)}</div>
                <div class="hall-bars">
                    <div class="hall-bar"><span>станции ${known}/${line.stations.length}</span><div class="bar"><i style="width:${known / line.stations.length * 100}%"></i></div></div>
                    <div class="hall-bar"><span>задачи ${done}/${tasks.length}</span><div class="bar"><i style="width:${tasks.length ? done / tasks.length * 100 : 0}%"></i></div></div>
                </div>
            </div>`;
        }).join('');

        const lv = Store.level();
        document.getElementById('hall-summary').innerHTML = `
            <div class="sum"><b>${s.xp}</b><span>XP</span></div>
            <div class="sum"><b>${lv.n}</b><span>${esc(lv.title)}</span></div>
            <div class="sum"><b>${s.solved.length}</b><span>${plural(s.solved.length, 'задача', 'задачи', 'задач')}</span></div>
            <div class="sum"><b>${s.solvedClean}</b><span>без подсказок</span></div>
            <div class="sum"><b>${s.firstTry}</b><span>с первой попытки</span></div>
            <div class="sum"><b>${s.streak}</b><span>${plural(s.streak, 'день', 'дня', 'дней')} подряд</span></div>`;
    },

    exportProgress() {
        const blob = new Blob([Store.exportJSON()], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = 'questcpp-progress.json'; a.click();
        Sounds.check();
    },

    importProgress(input) {
        const f = input.files[0]; if (!f) return;
        f.text().then(txt => {
            try { Store.importJSON(txt); Toast.show('Прогресс загружен.', 'ok'); Sounds.achieve(); this.render(); }
            catch (e) { Toast.show('Не удалось прочитать файл: ' + e.message, 'error'); Sounds.error(); }
        });
        input.value = '';
    },

    resetProgress() {
        Modal.confirm('Стереть весь прогресс? Это действие нельзя отменить.', () => Store.reset());
    }
};
