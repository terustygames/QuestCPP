/* ==========================================================================
   Practice (Арена) — выбор задачи, редактор кода, запуск и проверка.
   ========================================================================== */

var Practice = {
    task: null,
    hintsShown: 0,
    running: false,
    listOpen: false,
    filterLevel: 'all',
    filterStatus: 'unsolved',
    editor: null,
    gutter: null,
    hl: null,

    init() {
        Router.register('arena', { onEnter: p => this.enter(p) });
        this.editor = document.getElementById('editor');
        this.gutter = document.getElementById('gutter');
        this.hl = document.getElementById('editor-hl');
        this.bindEditor();
        this.setFontSize(Store.state.settings.fontSize, true);
        document.getElementById('list-level').addEventListener('change', e => { this.filterLevel = e.target.value; this.renderList(); });
        document.getElementById('list-status').addEventListener('change', e => { this.filterStatus = e.target.value; this.renderList(); });
    },

    enter(params = {}) {
        this.renderMiniStats();
        if (params.task && TaskDB.byId[params.task]) this.load(TaskDB.byId[params.task]);
        else if (!this.task) this.newTask(true);
        else this.renderList();
        Judge.probeLocal().then(() => this.renderBackend());
    },

    renderBackend() {
        const el = document.getElementById('backend-badge');
        const b = Judge.activeBackend || (Judge.localAvailable ? 'local' : 'wandbox');
        const names = { local: 'Локальный g++', wandbox: 'Wandbox (GCC)', godbolt: 'Compiler Explorer' };
        el.textContent = names[b];
        el.className = 'backend-badge ' + (b === 'local' ? 'is-local' : 'is-remote');
    },

    renderMiniStats() {
        FX.countTo(document.getElementById('arena-xp'), Store.state.xp, 500);
        document.getElementById('arena-solved').textContent = Store.state.solved.length;
        const lv = Store.level();
        document.getElementById('arena-level-fill').style.width = (lv.current / lv.need * 100) + '%';
    },

    /* ---- выбор задачи ---- */
    pool() {
        return Store.availableTasks();
    },

    newTask(silent = false) {
        const avail = this.pool();
        const unsolved = avail.filter(t => !Store.isSolved(t.id) && (!this.task || t.id !== this.task.id));
        const source = unsolved.length ? unsolved : avail.filter(t => !this.task || t.id !== this.task.id);
        if (!source.length) {
            if (!avail.length) { this.renderEmpty(); return; }
            if (this.task) { Toast.show('Больше нерешённых задач нет. Откройте новые станции на маршруте.', 'info'); return; }
        }
        // Предпочитаем задачи ближе к «границе знаний»: с самым высоким уровнем из доступных
        const maxLevel = Math.max(...source.map(t => t.level));
        const weighted = source.flatMap(t => Array(t.level === maxLevel ? 3 : t.level === maxLevel - 1 ? 2 : 1).fill(t));
        const t = weighted[Math.floor(Math.random() * weighted.length)];
        if (!silent) Sounds.newTask();
        this.load(t);
    },

    renderEmpty() {
        this.task = null;
        document.getElementById('task-card').innerHTML = `
            <div class="task-empty">
                ${Icon('map')}
                <h3>Маршрут пока пуст</h3>
                <p>Отметьте на карте станции, которые вы знаете — Арена подберёт задачи, в которых нужны только они.</p>
                <button class="btn btn-primary" data-fx="big" onclick="Router.go('route')">${Icon('map')} Открыть маршрут</button>
            </div>`;
        document.getElementById('task-list-count').textContent = 0;
        this.renderList();
    },

    load(t) {
        if (this.task && this.task.id !== t.id) Store.saveDraft(this.task.id, this.editor.value);
        this.task = t;
        this.hintsShown = 0;
        location.hash = 'arena';
        this.renderTask();
        const draft = Store.state.drafts[t.id];
        this.setCode(draft !== undefined ? draft : t.starter);
        this.showTab('code');
        this.resetOutput();
        this.renderList();
        document.getElementById('task-card').scrollTop = 0;
    },

    renderTask() {
        const t = this.task;
        const lv = TASK_LEVELS[t.level];
        const solved = Store.isSolved(t.id);
        const attempts = Store.state.attempts[t.id] || 0;
        const card = document.getElementById('task-card');
        card.innerHTML = `
            <div class="task-top">
                <span class="level-pill" style="--c:${lv.color}">${t.level} · ${lv.name}</span>
                <span class="xp-pill">${Icon('bolt')} ${t.xp} XP</span>
                ${solved ? `<span class="solved-pill">${Icon('check')} решено</span>` : ''}
                ${attempts ? `<span class="attempt-pill" title="Попыток">${Icon('clock')} ${attempts}</span>` : ''}
            </div>
            <h2 class="task-title">${esc(t.title)}</h2>
            ${t.goal ? `<div class="task-goal"><span>Что сделать</span><p>${esc(t.goal)}</p></div>` : ''}
            <p class="task-story">${esc(t.story)}</p>
            <div class="task-tags">${t.requires.map(r => `<button class="tag" style="--c:${STATIONS[r].color}" onclick="Route.showInfo('${r}', event)"><code>${esc(STATIONS[r].name)}</code></button>`).join('')}</div>
            <h4 class="task-h">Условие</h4>
            <div class="task-spec">${t.spec}</div>
            <div class="task-io">
                <div><h4>Ввод</h4><p>${t.input}</p></div>
                <div><h4>Вывод</h4><p>${t.output}</p></div>
            </div>
            <div class="task-examples">
                ${t.tests.slice(0, 2).map((tc, i) => `
                <div class="example">
                    <div class="example-col"><span>Пример ${i + 1} — ввод</span><pre>${esc(tc.in) || '<i>пусто</i>'}</pre></div>
                    <div class="example-col"><span>вывод</span><pre>${esc(tc.out)}</pre></div>
                </div>`).join('')}
                <p class="tests-note">${Icon('eye')} Скрытых тестов: ${t.tests.length - Math.min(2, t.tests.length)}. Всего проверок: ${t.tests.length}.</p>
            </div>
            <div class="task-hints" id="task-hints">
                <button class="btn btn-ghost btn-sm" onclick="Practice.showHint()">${Icon('bulb')} Подсказка <span class="hint-count">0/${t.hints.length}</span></button>
                <div class="hints-list"></div>
            </div>`;
        FX.stagger(card, ':scope > *', 45);
    },

    showHint() {
        const t = this.task; if (!t) return;
        if (this.hintsShown >= t.hints.length) { Toast.show('Подсказки закончились — дальше только вы и компилятор.', 'info'); return; }
        const hint = t.hints[this.hintsShown++];
        if (!Store.isSolved(t.id)) Store.useHint(t.id);
        Sounds.hint();
        const list = document.querySelector('#task-hints .hints-list');
        const d = document.createElement('div');
        d.className = 'hint anim-rise';
        d.innerHTML = `<span class="hint-n">${this.hintsShown}</span><span>${esc(hint)}</span>`;
        list.appendChild(d);
        document.querySelector('#task-hints .hint-count').textContent = `${this.hintsShown}/${t.hints.length}`;
        if (this.hintsShown === 1 && !Store.isSolved(t.id)) Toast.show('Подсказка открыта: бонус за чистое решение сгорел, базовый XP остаётся.', 'info');
    },

    /* ---- список задач ---- */
    toggleList() {
        this.listOpen = !this.listOpen;
        document.getElementById('task-list-wrap').classList.toggle('is-open', this.listOpen);
        document.getElementById('list-toggle').classList.toggle('is-on', this.listOpen);
        Sounds.tab();
        if (this.listOpen) this.renderList();
    },

    renderList() {
        const avail = this.pool();
        document.getElementById('task-list-count').textContent = avail.length;
        const box = document.getElementById('task-list');
        let list = avail.filter(t => this.filterLevel === 'all' || t.level === Number(this.filterLevel));
        if (this.filterStatus === 'unsolved') list = list.filter(t => !Store.isSolved(t.id));
        if (this.filterStatus === 'solved') list = list.filter(t => Store.isSolved(t.id));
        list.sort((a, b) => a.level - b.level || a.xp - b.xp);
        if (!list.length) { box.innerHTML = `<p class="list-empty">Ничего не нашлось. Смените фильтр или откройте новые станции.</p>`; return; }
        box.innerHTML = list.map(t => `
            <button class="task-row ${Store.isSolved(t.id) ? 'is-solved' : ''} ${this.task && this.task.id === t.id ? 'is-current' : ''}" onclick="Practice.load(TaskDB.byId['${t.id}']); Sounds.newTask()">
                <span class="row-level" style="--c:${TASK_LEVELS[t.level].color}">${t.level}</span>
                <span class="row-title">${esc(t.title)}</span>
                <span class="row-xp">${t.xp} XP</span>
                <span class="row-check">${Icon('check')}</span>
            </button>`).join('');
    },

    /* ---- редактор ---- */
    bindEditor() {
        const ed = this.editor;
        ed.addEventListener('input', () => this.onEdit());
        ed.addEventListener('scroll', () => {
            if (this._scrollRaf) return;
            this._scrollRaf = requestAnimationFrame(() => { this._scrollRaf = null; this.gutter.scrollTop = ed.scrollTop; this.hl.scrollTop = ed.scrollTop; this.hl.scrollLeft = ed.scrollLeft; });
        }, { passive: true });
        ed.addEventListener('keydown', e => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const s = ed.selectionStart, en = ed.selectionEnd;
                if (e.shiftKey) {
                    const lineStart = ed.value.lastIndexOf('\n', s - 1) + 1;
                    if (ed.value.substr(lineStart, 4) === '    ') {
                        ed.value = ed.value.slice(0, lineStart) + ed.value.slice(lineStart + 4);
                        ed.selectionStart = ed.selectionEnd = Math.max(lineStart, s - 4);
                    }
                } else {
                    ed.value = ed.value.slice(0, s) + '    ' + ed.value.slice(en);
                    ed.selectionStart = ed.selectionEnd = s + 4;
                }
                this.onEdit();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const s = ed.selectionStart;
                const lineStart = ed.value.lastIndexOf('\n', s - 1) + 1;
                const indent = (ed.value.slice(lineStart, s).match(/^\s*/) || [''])[0];
                const prev = ed.value[s - 1];
                const next = ed.value[s];
                let ins = '\n' + indent;
                if (prev === '{') {
                    ins += '    ';
                    if (next === '}') ins += '\n' + indent;
                }
                ed.value = ed.value.slice(0, s) + ins + ed.value.slice(s);
                const pos = s + 1 + indent.length + (prev === '{' ? 4 : 0);
                ed.selectionStart = ed.selectionEnd = pos;
                this.onEdit();
            } else if (e.key === '{' || e.key === '(' || e.key === '[' || e.key === '"') {
                const pairs = { '{': '}', '(': ')', '[': ']', '"': '"' };
                const s = ed.selectionStart, en = ed.selectionEnd;
                if (s !== en) return;
                e.preventDefault();
                ed.value = ed.value.slice(0, s) + e.key + pairs[e.key] + ed.value.slice(s);
                ed.selectionStart = ed.selectionEnd = s + 1;
                this.onEdit();
            } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                e.shiftKey ? this.submit() : this.run();
            }
        });
    },

    onEdit() {
        /* Подсветка и сохранение — не чаще раза в кадр / раз в 400 мс */
        if (!this._hlRaf) this._hlRaf = requestAnimationFrame(() => { this._hlRaf = null; this.renderGutter(); this.highlight(); });
        clearTimeout(this._saveT);
        this._saveT = setTimeout(() => { if (this.task) Store.saveDraft(this.task.id, this.editor.value); }, 400);
    },

    setCode(code) { this.editor.value = code; this.renderGutter(); this.highlight(); },
    getCode() { return this.editor.value; },

    renderGutter() {
        const n = this.editor.value.split('\n').length;
        if (n === this._gutterN) return;
        this._gutterN = n;
        this.gutter.innerHTML = Array.from({ length: n }, (_, i) => `<span>${i + 1}</span>`).join('');
    },

    /* Простая подсветка: ключевые слова, типы, строки, числа, комментарии, препроцессор */
    highlight() {
        const KW = /\b(if|else|for|while|do|switch|case|default|break|continue|return|goto|new|delete|this|class|struct|enum|union|public|private|protected|virtual|override|template|typename|namespace|using|try|catch|throw|const|constexpr|static|inline|friend|operator|sizeof|nullptr|true|false|auto|typedef)\b/g;
        const TY = /\b(int|double|float|char|bool|void|long|short|unsigned|signed|size_t|string|vector|map|set|pair|stack|queue|deque|priority_queue|unordered_map|optional|unique_ptr|shared_ptr|ostream|istream|stringstream)\b/g;
        let src = esc(this.editor.value);
        const tokens = [];
        const stash = (cls, m) => { tokens.push(`<span class="tk-${cls}">${m}</span>`); return `\u0000${tokens.length - 1}\u0000`; };
        src = src.replace(/\/\/.*$/gm, m => stash('cm', m))
                 .replace(/\/\*[\s\S]*?\*\//g, m => stash('cm', m))
                 .replace(/^\s*#.*$/gm, m => stash('pp', m))
                 .replace(/&quot;(?:[^&\\]|\\.|&(?!quot;))*?&quot;/g, m => stash('str', m))
                 .replace(/'(?:\\.|[^'\\])'/g, m => stash('str', m))
                 .replace(KW, m => stash('kw', m))
                 .replace(TY, m => stash('ty', m))
                 .replace(/\b\d+(\.\d+)?(LL|L|f|u|U)?\b/g, m => stash('num', m))
                 .replace(/\b([A-Za-z_]\w*)(?=\()/g, m => stash('fn', m));
        src = src.replace(/\u0000(\d+)\u0000/g, (_, i) => tokens[i]);
        this.hl.innerHTML = src + '\n';
    },

    setFontSize(px, silent) {
        px = Number(px);
        document.documentElement.style.setProperty('--editor-size', px + 'px');
        document.getElementById('font-size').value = px;
        if (!silent) { Store.state.settings.fontSize = px; Store.save(); }
    },

    resetCode() {
        if (!this.task) return;
        Modal.confirm('Сбросить код к заготовке? Текущий текст будет потерян.', () => {
            this.setCode(this.task.starter);
            Store.saveDraft(this.task.id, this.task.starter);
            Sounds.back();
        });
    },

    copyCode() {
        navigator.clipboard?.writeText(this.getCode());
        Sounds.check(); Toast.show('Код скопирован в буфер обмена.', 'ok');
    },

    /* ---- вкладки ---- */
    showTab(name) {
        document.querySelectorAll('.editor-tabs .tab').forEach(t => t.classList.toggle('is-on', t.dataset.tab === name));
        document.getElementById('pane-code').classList.toggle('is-hidden', name !== 'code');
        document.getElementById('pane-output').classList.toggle('is-hidden', name !== 'output');
    },
    switchTab(name) { this.showTab(name); Sounds.tab(); },

    resetOutput() {
        document.getElementById('out-status').innerHTML = '';
        document.getElementById('out-status').className = 'out-status';
        document.getElementById('out-tests').innerHTML = '';
        document.getElementById('out-console').textContent = '';
        document.getElementById('out-console').classList.remove('is-error');
        if (this.task) document.getElementById('stdin').value = this.task.tests[0].in;
    },

    setStatus(kind, html) {
        const el = document.getElementById('out-status');
        el.className = 'out-status is-' + kind;
        el.innerHTML = html;
    },

    lock(on) {
        this.running = on;
        ['run-btn', 'submit-btn'].forEach(id => document.getElementById(id).classList.toggle('is-loading', on));
    },

    /* ---- запуск ---- */
    async run() {
        if (this.running) return;
        this.lock(true);
        Sounds.run();
        this.showTab('output');
        document.getElementById('out-tests').innerHTML = '';
        this.setStatus('running', `<span class="spinner"></span> Компиляция и запуск...`);
        const con = document.getElementById('out-console');
        con.textContent = ''; con.classList.remove('is-error');

        const r = await Judge.compile(this.getCode(), document.getElementById('stdin').value);
        this.renderBackend();
        if (r.networkError) {
            this.setStatus('error', `${Icon('cross')} Нет связи с компилятором`);
            con.textContent = r.networkError; con.classList.add('is-error'); Sounds.error();
        } else if (r.compileError) {
            this.setStatus('error', `${Icon('cross')} Ошибка компиляции`);
            con.innerHTML = this.prettyErrors(r.compileError); con.classList.add('is-error');
            Sounds.error(); FX.shake(document.getElementById('editor-panel'));
        } else {
            const ok = r.ok || r.exitCode === 0;
            this.setStatus(ok ? 'ok' : 'warn', ok ? `${Icon('check')} Выполнено${r.time ? ' за ' + r.time + ' мс' : ''}` : `${Icon('info')} Завершено с кодом ${r.exitCode}${r.signal ? ' (' + r.signal + ')' : ''}`);
            con.textContent = (r.stdout || '(пустой вывод)') + (r.stderr && r.stderr.trim() ? '\n\n--- stderr ---\n' + r.stderr.trim() : '');
            if (ok) Sounds.check(); else Sounds.fail();
        }
        this.lock(false);
    },

    /* Подсвечиваем строки с ошибками и делаем их кликабельными */
    prettyErrors(text) {
        return esc(text).replace(/(?:^|\n)([^\n:]*):(\d+):(\d+): (error|warning|note): /g, (m, f, line, col, kind) => {
            return `\n<a class="err-loc is-${kind}" onclick="Practice.gotoLine(${line}, ${col})">строка ${line}:${col}</a> <b class="err-kind is-${kind}">${kind}</b>: `;
        }).trim();
    },

    gotoLine(line, col) {
        const lines = this.editor.value.split('\n');
        let pos = 0;
        for (let i = 0; i < line - 1 && i < lines.length; i++) pos += lines[i].length + 1;
        pos += Math.max(0, col - 1);
        this.showTab('code');
        this.editor.focus();
        this.editor.selectionStart = this.editor.selectionEnd = pos;
        const lh = parseFloat(getComputedStyle(this.editor).lineHeight);
        this.editor.scrollTop = Math.max(0, (line - 4) * lh);
        Sounds.tab();
    },

    /* ---- проверка ---- */
    async submit() {
        if (this.running || !this.task) return;
        const t = this.task;
        this.lock(true);
        Sounds.submit();
        this.showTab('output');
        if (!Store.isSolved(t.id)) Store.registerAttempt(t.id);

        const testsBox = document.getElementById('out-tests');
        const con = document.getElementById('out-console');
        con.textContent = ''; con.classList.remove('is-error');
        testsBox.innerHTML = t.tests.map((_, i) => `<div class="test is-wait" id="test-${i}"><span class="test-n">${i + 1}</span><span class="test-label">ожидание</span></div>`).join('');
        this.setStatus('running', `<span class="spinner"></span> Проверка ${t.tests.length} тестов...`);

        const verdict = await Judge.check(t, this.getCode(), (i, r) => {
            const el = document.getElementById('test-' + i);
            el.className = 'test is-' + r.status;
            const labels = { pass: 'пройден', fail: 'неверный ответ', compile: 'ошибка компиляции', runtime: 'ошибка выполнения', network: 'нет связи' };
            el.querySelector('.test-label').textContent = labels[r.status];
            FX.pop(el);
            r.status === 'pass' ? Sounds.testPass() : Sounds.testFail();
            if (r.status !== 'pass' && i < 2 || r.status === 'compile') el.onclick = () => this.showTestDetails(r);
            if (r.status !== 'pass') el.classList.add('is-clickable');
            document.getElementById('test-' + i).onclick = () => this.showTestDetails(r, i);
        });
        this.renderBackend();

        if (verdict.compileFail) {
            this.setStatus('error', `${Icon('cross')} Не компилируется`);
            con.innerHTML = this.prettyErrors(verdict.compileFail.message); con.classList.add('is-error');
            Sounds.error(); FX.shake(document.getElementById('editor-panel'), 'hard');
        } else if (verdict.results.some(r => r.status === 'network')) {
            this.setStatus('error', `${Icon('cross')} Компилятор недоступен`);
            con.textContent = verdict.results.find(r => r.status === 'network').message;
        } else if (verdict.passed === verdict.total) {
            this.setStatus('ok', `${Icon('checkBig')} Все ${verdict.total} тестов пройдены`);
            con.textContent = 'Отличная работа. Нажмите на тест, чтобы посмотреть ввод и вывод.';
            this.celebrate(t);
        } else {
            this.setStatus('fail', `${Icon('cross')} Пройдено ${verdict.passed} из ${verdict.total}`);
            const first = verdict.results.find(r => r.status !== 'pass');
            this.showTestDetails(first, first.i);
            Sounds.fail(); FX.shake(document.getElementById('submit-btn'));
        }
        this.lock(false);
    },

    showTestDetails(r, i) {
        const con = document.getElementById('out-console');
        con.classList.remove('is-error');
        const hidden = i >= 2;
        if (r.status === 'compile') { con.innerHTML = this.prettyErrors(r.message); con.classList.add('is-error'); return; }
        if (r.status === 'runtime') {
            con.textContent = `Тест ${i + 1}: ошибка выполнения\n\n${r.message}\n\nВывод до падения:\n${r.got || '(пусто)'}`; con.classList.add('is-error'); return;
        }
        if (hidden && r.status !== 'pass') {
            con.textContent = `Тест ${i + 1} — скрытый.\n\nВаш вывод:\n${r.got || '(пусто)'}\n\nПодумайте о граничных случаях: пустой ввод, нули, отрицательные числа, большие значения, одинаковые элементы.`;
            return;
        }
        con.innerHTML = `<div class="diff">
            <div><span>Ввод</span><pre>${esc(r.input) || '<i>пусто</i>'}</pre></div>
            <div><span>Ожидалось</span><pre>${esc(r.expected)}</pre></div>
            <div class="${r.status === 'pass' ? '' : 'is-bad'}"><span>Ваш вывод</span><pre>${this.diffLines(r.got, r.expected)}</pre></div>
        </div>${r.stderr && r.stderr.trim() ? `<pre class="stderr">${esc(r.stderr.trim())}</pre>` : ''}`;
    },

    diffLines(got, exp) {
        const g = (got || '').replace(/\r/g, '').replace(/\n+$/, '').split('\n');
        const e = (exp || '').replace(/\n+$/, '').split('\n');
        return g.map((l, i) => (l.replace(/\s+$/, '') === (e[i] || '').replace(/\s+$/, '') ? esc(l) : `<mark>${esc(l) || ' '}</mark>`)).join('\n') || '<i>пусто</i>';
    },

    /* ---- победа ---- */
    celebrate(t) {
        const already = Store.isSolved(t.id);
        const res = Store.markSolved(t);
        Sounds.success();
        FX.flash();
        const btn = document.getElementById('submit-btn').getBoundingClientRect();
        FX.burst(btn.left + btn.width / 2, btn.top + btn.height / 2, 90);
        FX.ribbons(already ? 40 : 140);

        if (!res) { Toast.show('Задача уже была решена — XP повторно не начисляется, но приятно.', 'info'); return; }

        FX.floatText(btn.left + btn.width / 2, btn.top - 10, `+${res.xpGained} XP`, 'xp');
        this.renderMiniStats();
        this.renderTask();
        this.renderList();

        const bonuses = [];
        if (res.bonusClean) bonuses.push('без подсказок');
        if (res.bonusFirst) bonuses.push('с первой попытки');

        setTimeout(() => {
            Modal.open(`
                <div class="win">
                    <div class="win-badge">${Icon('checkBig')}</div>
                    <h3>Решено</h3>
                    <p class="win-title">${esc(t.title)}</p>
                    <div class="win-xp"><b>+${res.xpGained}</b> XP${bonuses.length ? `<span class="win-bonus">бонус: ${bonuses.join(', ')}</span>` : ''}</div>
                    ${res.levelAfter > res.levelBefore ? `<div class="win-level">${Icon('sparkle')} Новый уровень ${res.levelAfter} — ${esc(Store.level().title)}</div>` : ''}
                    ${res.newAchievements.length ? `<div class="win-ach">${res.newAchievements.map(a => `<span>${Icon('medal')} ${esc(a.title)}</span>`).join('')}</div>` : ''}
                    <div class="modal-actions">
                        <button class="btn btn-ghost" onclick="Modal.close()">Остаться</button>
                        <button class="btn btn-primary" data-fx="big" onclick="Modal.close(); Practice.newTask()">${Icon('next')} Следующая задача</button>
                    </div>
                </div>`, { celebrate: true });
            if (res.levelAfter > res.levelBefore) setTimeout(() => Sounds.levelUp(), 300);
            if (res.newAchievements.length) setTimeout(() => Sounds.achieve(), 700);
        }, 700);
    }
};
