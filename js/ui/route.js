/* ==========================================================================
   Route — карта маршрута: линии и станции (ключевые слова).
   Клик по станции = «я это знаю». Показывает, сколько задач откроет станция.
   ========================================================================== */

var Route = {
    filter: 'all',
    query: '',
    pendingFocus: null,

    init() {
        Router.register('route', { onEnter: () => this.render() });
        document.getElementById('route-search').addEventListener('input', e => {
            this.query = e.target.value.trim().toLowerCase();
            this.renderLines();
        });
    },

    render() {
        this.renderFilters();
        this.renderLines();
        this.renderSummary();
        if (this.pendingFocus) {
            const id = this.pendingFocus; this.pendingFocus = null;
            setTimeout(() => {
                const el = document.querySelector(`.station[data-id="${id}"]`);
                if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.add('is-highlight'); setTimeout(() => el.classList.remove('is-highlight'), 2200); }
            }, 350);
        }
    },

    focusStation(id) {
        this.filter = 'all'; this.query = '';
        document.getElementById('route-search').value = '';
        this.pendingFocus = id;
        Router.go('route');
    },

    renderFilters() {
        const box = document.getElementById('route-filters');
        box.innerHTML = `<button class="chip ${this.filter === 'all' ? 'is-on' : ''}" onclick="Route.setFilter('all')">Все линии</button>` +
            ROUTE.map(l => `<button class="chip ${this.filter === l.id ? 'is-on' : ''}" style="--c:${l.color}" onclick="Route.setFilter('${l.id}')"><i class="dot"></i>${esc(l.name)}</button>`).join('');
    },

    setFilter(id) { this.filter = id; this.renderFilters(); this.renderLines(); },

    renderLines() {
        this.computeAlmost();
        const box = document.getElementById('route-lines');
        const lines = ROUTE.filter(l => this.filter === 'all' || l.id === this.filter);
        box.innerHTML = lines.map(line => {
            const stations = line.stations.filter(s => !this.query || (s.name + ' ' + s.title + ' ' + s.desc).toLowerCase().includes(this.query));
            if (!stations.length) return '';
            const known = line.stations.filter(s => Store.knows(s.id)).length;
            return `
            <section class="line" style="--c:${line.color}">
                <header class="line-head">
                    <div class="line-badge">${line.stations.length}</div>
                    <div class="line-title">
                        <h3>${esc(line.name)}</h3>
                        <p>${esc(line.blurb)}</p>
                    </div>
                    <div class="line-progress">
                        <span>${known}/${line.stations.length}</span>
                        <div class="bar"><i style="width:${known / line.stations.length * 100}%"></i></div>
                    </div>
                    <div class="line-actions">
                        <button class="btn btn-ghost btn-sm" onclick="Route.setLine('${line.id}', true)">Знаю всё</button>
                        <button class="btn btn-ghost btn-sm" onclick="Route.setLine('${line.id}', false)">Сбросить</button>
                    </div>
                </header>
                <div class="stations">
                    <div class="rail"></div>
                    ${stations.map(s => this.stationHTML(s)).join('')}
                </div>
            </section>`;
        }).join('');
        box.querySelectorAll('.stations').forEach(st => FX.stagger(st, '.station', 12));
    },

    computeAlmost() {
        const m = {};
        Store.almostTasks(2).forEach(x => { if (x.missing.length === 2) x.missing.forEach(id => m[id] = (m[id] || 0) + 1); });
        this._almost = m;
    },

    stationHTML(s) {
        const known = Store.knows(s.id);
        const unlock = Store.unlockCountFor(s.id);
        const almost = known ? 0 : (this._almost[s.id] || 0);
        const total = TaskDB.list.filter(t => t.requires.includes(s.id)).length;
        return `
        <button class="station ${known ? 'is-known' : ''}" data-id="${s.id}" onclick="Route.toggle('${s.id}', event)" title="${esc(s.desc)}">
            <span class="station-node">${Icon('check')}</span>
            <span class="station-body">
                <code class="station-name">${esc(s.name)}</code>
                <span class="station-title">${esc(s.title)}</span>
            </span>
            <span class="station-meta">
                ${!known && unlock ? `<span class="unlock-pill" title="Откроет задач сразу">+${unlock}</span>` : ''}
                ${!known && !unlock && almost ? `<span class="almost-pill" title="Задач, где не хватает этой и ещё одной станции">~${almost}</span>` : ''}
                ${total ? `<span class="task-count" title="Задач с этой станцией">${total}</span>` : ''}
                <span class="info-btn" onclick="Route.showInfo('${s.id}', event)">${Icon('info')}</span>
            </span>
        </button>`;
    },

    toggle(id, ev) {
        const value = !Store.knows(id);
        this._lastAvail = Store.availableTasks().length;
        Store.setKnown(id, value);
        value ? Sounds.check() : Sounds.uncheck();
        this.refreshStations();
        this.renderSummary();
        if (value && ev) {
            const c = STATIONS[id].color;
            FX.sparks(ev.clientX, ev.clientY, 16, [c, '#fff', '#ffd166']);
            const unlockNow = Store.availableTasks().length;
            if (this._lastAvail !== undefined && unlockNow > this._lastAvail) {
                FX.floatText(ev.clientX, ev.clientY - 30, `+${unlockNow - this._lastAvail} ${plural(unlockNow - this._lastAvail, 'задача', 'задачи', 'задач')}`, 'good');
            }
        }
        this._lastAvail = Store.availableTasks().length;
    },

    /* Обновляем станции без полной перерисовки, чтобы не дёргать анимации */
    refreshStations() {
        this.computeAlmost();
        document.querySelectorAll('.station').forEach(el => {
            const s = STATIONS[el.dataset.id];
            const html = this.stationHTML(s);
            const tmp = document.createElement('div'); tmp.innerHTML = html;
            const fresh = tmp.firstElementChild;
            el.className = fresh.className;
            el.querySelector('.station-meta').innerHTML = fresh.querySelector('.station-meta').innerHTML;
        });
        // прогресс линий
        ROUTE.forEach(line => {
            const sec = document.querySelector(`.line[style*="${line.color}"]`);
            if (!sec) return;
            const known = line.stations.filter(s => Store.knows(s.id)).length;
            sec.querySelector('.line-progress span').textContent = `${known}/${line.stations.length}`;
            sec.querySelector('.line-progress i').style.width = (known / line.stations.length * 100) + '%';
        });
    },

    setLine(lineId, value) {
        const line = ROUTE.find(l => l.id === lineId);
        Store.setKnownMany(line.stations.map(s => s.id), value);
        value ? Sounds.submit() : Sounds.uncheck();
        this.refreshStations(); this.renderSummary();
        this._lastAvail = Store.availableTasks().length;
    },

    /* Отметить всё до станции включительно (по порядку маршрута) */
    knowUpTo(id) {
        const idx = STATION_ORDER.indexOf(id);
        Store.setKnownMany(STATION_ORDER.slice(0, idx + 1), true);
        Sounds.submit();
        this.refreshStations(); this.renderSummary();
        Modal.close();
    },

    selectAll(value) {
        Store.setKnownMany(STATION_ORDER, value);
        value ? Sounds.levelUp() : Sounds.uncheck();
        this.refreshStations(); this.renderSummary();
    },

    renderSummary() {
        const known = Store.state.known.length;
        const avail = Store.availableTasks();
        const unsolved = avail.filter(t => !Store.isSolved(t.id)).length;
        document.getElementById('route-known').textContent = known;
        document.getElementById('route-total').textContent = STATION_ORDER.length;
        document.getElementById('route-avail').textContent = avail.length;
        document.getElementById('route-unsolved').textContent = unsolved;
        document.getElementById('route-ring').style.setProperty('--p', known / STATION_ORDER.length);
    },

    showInfo(id, ev) {
        ev.stopPropagation();
        const s = STATIONS[id];
        const tasks = TaskDB.list.filter(t => t.requires.includes(id));
        Modal.open(`
            <div class="modal-head" style="--c:${s.color}">
                <span class="modal-kicker">${esc(s.lineName)}</span>
                <h3><code>${esc(s.name)}</code></h3>
                <p>${esc(s.title)}</p>
            </div>
            <p class="modal-text">${esc(s.desc)}</p>
            <pre class="code-block"><code>${esc(s.example)}</code><button class="copy-btn btn btn-ghost btn-sm" onclick="copyText(this)">${Icon('copy')} Копировать</button></pre>
            ${tasks.length ? `<p class="modal-sub">Задачи с этой станцией: ${tasks.map(t => `<span class="mini-tag ${Store.isSolved(t.id) ? 'is-done' : ''}">${esc(t.title)}</span>`).join('')}</p>` : ''}
            <div class="modal-actions">
                <button class="btn btn-ghost" onclick="Route.knowUpTo('${id}')">${Icon('train')} Знаю всё до этой станции</button>
                <button class="btn btn-primary" onclick="Store.setKnown('${id}', ${!Store.knows(id)}); Route.refreshStations(); Route.renderSummary(); Modal.close(); Sounds.check()">
                    ${Store.knows(id) ? 'Снять отметку' : 'Знаю это'}
                </button>
            </div>`);
    }
};

function copyText(btn) {
    const code = btn.parentElement.querySelector('code').textContent;
    navigator.clipboard?.writeText(code);
    const old = btn.innerHTML;
    btn.innerHTML = Icon('check') + ' Скопировано';
    Sounds.check();
    setTimeout(() => btn.innerHTML = old, 1400);
}
