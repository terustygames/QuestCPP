/* ==========================================================================
   Home — главный экран: приветствие, статистика, «следующая станция».
   ========================================================================== */

var Home = {
    PHRASES: [
        'Каждая станция — одно ключевое слово. Отметь, что знаешь, и получишь задачи по силам.',
        'Хорошая задача — та, над которой хочется подумать. Плохих здесь нет.',
        'Ошибки компиляции — это подсказки, просто написанные капслоком.',
        'Указатели перестают пугать примерно на третьей задаче. Проверено.',
        'Секрет: подсказки не отнимают XP навсегда, только бонус за чистое решение.'
    ],

    init() {
        Router.register('home', { onEnter: () => this.render() });
        Store.subscribe(() => { if (Router.current === 'home') this.renderStats(); });
    },

    render() {
        this.renderStats();
        const phrase = this.PHRASES[Math.floor(Math.random() * this.PHRASES.length)];
        FX.typewriter(document.getElementById('home-phrase'), phrase, 18);
        this.renderNext();
        FX.stagger(document.getElementById('home-menu'), '> *', 70);
    },

    renderStats() {
        const s = Store.state;
        const lv = Store.level();
        FX.countTo(document.getElementById('stat-xp'), s.xp);
        FX.countTo(document.getElementById('stat-solved'), s.solved.length);
        FX.countTo(document.getElementById('stat-known'), s.known.length);
        document.getElementById('stat-streak').textContent = s.streak;
        document.getElementById('home-level-n').textContent = lv.n;
        document.getElementById('home-level-title').textContent = lv.title;
        document.getElementById('home-level-text').textContent = `${lv.current} / ${lv.need} XP`;
        document.getElementById('home-level-fill').style.width = (lv.current / lv.need * 100) + '%';

        const avail = Store.availableTasks();
        const unsolved = avail.filter(t => !Store.isSolved(t.id)).length;
        document.getElementById('home-arena-desc').textContent =
            avail.length === 0 ? 'Сначала отметьте станции на маршруте' :
            unsolved === 0 ? `Все ${avail.length} доступных решены — откройте новые станции` :
            `${unsolved} ${plural(unsolved, 'задача ждёт', 'задачи ждут', 'задач ждут')} решения`;
        document.getElementById('home-route-desc').textContent =
            `${s.known.length} из ${STATION_ORDER.length} станций отмечено`;
        document.getElementById('home-hall-desc').textContent =
            `${s.achievements.length} из ${ACHIEVEMENTS.length} достижений`;
    },

    /* Следующая станция: та, что быстрее всего откроет новые задачи */
    renderNext() {
        const box = document.getElementById('home-next');
        const next = Store.nextStation();
        if (!next) {
            box.innerHTML = `<div class="next-card done">${Icon('flag')}<div><b>Маршрут пройден целиком.</b><span>Все станции отмечены — впереди только практика.</span></div></div>`;
            return;
        }
        const st = STATIONS[next.id];
        const note = next.unlocks > 0
            ? `откроет ${next.unlocks} ${plural(next.unlocks, 'задачу', 'задачи', 'задач')} сразу`
            : next.almost > 0
                ? `приблизит ${next.almost} ${plural(next.almost, 'задачу', 'задачи', 'задач')}`
                : 'следующая по маршруту';
        box.innerHTML = `
            <button class="next-card btn" data-fx="big" onclick="Route.focusStation('${st.id}')" style="--c:${st.color}">
                <span class="next-label">Следующая станция · ${esc(st.lineName)}</span>
                <span class="next-name"><code>${esc(st.name)}</code></span>
                <span class="next-title">${esc(st.title)}</span>
                <span class="next-unlock">${note} ${Icon('arrowR')}</span>
            </button>`;
    }
};

function plural(n, one, few, many) {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
    return many;
}
function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
