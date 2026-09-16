/* ==========================================================================
   Reference — справочник по станциям: карточки с примерами кода.
   ========================================================================== */

var Reference = {
    query: '',

    init() {
        Router.register('reference', { onEnter: () => this.render() });
        document.getElementById('ref-search').addEventListener('input', e => { this.query = e.target.value.trim().toLowerCase(); this.render(); });
    },

    render() {
        const box = document.getElementById('ref-content');
        const q = this.query;
        box.innerHTML = ROUTE.map(line => {
            const items = line.stations.filter(s => !q || (s.name + ' ' + s.title + ' ' + s.desc + ' ' + s.example).toLowerCase().includes(q));
            if (!items.length) return '';
            return `
            <section class="ref-line" style="--c:${line.color}">
                <h3 class="ref-line-title"><i></i>${esc(line.name)}</h3>
                <div class="ref-grid">
                    ${items.map(s => `
                    <article class="ref-card ${Store.knows(s.id) ? 'is-known' : ''}">
                        <header>
                            <code>${esc(s.name)}</code>
                            <span>${esc(s.title)}</span>
                        </header>
                        <p>${esc(s.desc)}</p>
                        <pre class="code-block"><code>${esc(s.example)}</code><button class="copy-btn btn btn-ghost btn-sm" onclick="copyText(this)">${Icon('copy')}</button></pre>
                        <footer>
                            <label class="switch"><input type="checkbox" ${Store.knows(s.id) ? 'checked' : ''} onchange="Store.setKnown('${s.id}', this.checked); this.closest('.ref-card').classList.toggle('is-known', this.checked); this.checked ? Sounds.check() : Sounds.uncheck()"><i></i> Знаю</label>
                            <button class="btn btn-ghost btn-sm" onclick="Reference.tasksFor('${s.id}')">${Icon('swords')} Задачи</button>
                        </footer>
                    </article>`).join('')}
                </div>
            </section>`;
        }).join('') || `<p class="list-empty">Ничего не найдено.</p>`;
    },

    tasksFor(id) {
        const s = STATIONS[id];
        const tasks = TaskDB.list.filter(t => t.requires.includes(id));
        Modal.open(`
            <div class="modal-head" style="--c:${s.color}"><span class="modal-kicker">Задачи со станцией</span><h3><code>${esc(s.name)}</code></h3></div>
            ${tasks.length ? `<div class="task-mini-list">${tasks.map(t => {
                const can = Store.canSolve(t);
                return `<button class="task-row ${Store.isSolved(t.id) ? 'is-solved' : ''} ${can ? '' : 'is-locked'}" onclick="${can ? `Modal.close(); Router.go('arena', { params: { task: '${t.id}' } })` : `Toast.show('Не хватает станций: ${t.requires.filter(r => !Store.knows(r)).map(r => STATIONS[r].name.replace(/'/g, '')).join(', ')}', 'info')`}">
                    <span class="row-level" style="--c:${TASK_LEVELS[t.level].color}">${t.level}</span>
                    <span class="row-title">${esc(t.title)}</span>
                    <span class="row-xp">${t.xp} XP</span>
                    <span class="row-check">${Icon(can ? 'check' : 'lock')}</span>
                </button>`; }).join('')}</div>` : '<p class="modal-text">Пока нет задач, где эта станция обязательна.</p>'}
        `);
    }
};
