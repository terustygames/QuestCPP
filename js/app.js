/* ==========================================================================
   App — точка входа. Порядок важен: сначала данные и ядро, потом UI.
   ========================================================================== */

var App = {
    init() {
        Store.load();
        this.injectIcons();
        FX.init();
        Modal.init();

        Home.init();
        Route.init();
        Practice.init();
        Reference.init();
        Hall.init();

        this.bindGlobal();
        this.applyTheme(Store.state.settings.theme, true);
        this.applyMotion(Store.state.settings.motion || 'on', true);
        this.renderSoundButton();

        Router.start();
        const markNav = () => document.querySelectorAll('.btn-nav').forEach(a => a.classList.toggle('is-on', a.dataset.nav === Router.current));
        markNav();
        addEventListener('hashchange', () => setTimeout(markNav, 0));
        document.querySelectorAll('.btn-nav').forEach(a => a.addEventListener('click', () => setTimeout(markNav, 250)));

        /* Первый визит: отмечаем стартовую линию, чтобы Арена не была пустой */
        if (!localStorage.getItem('questcpp.visited')) {
            localStorage.setItem('questcpp.visited', '1');
            const first = ROUTE[0].stations.map(s => s.id);
            Store.setKnownMany(first, true);
            setTimeout(() => Toast.show('Мы отметили линию «Старт» как известную. Уточните маршрут, когда будет время.', 'info', 6000), 800);
        }
    },

    /* Любой элемент с data-icon получает SVG в начало */
    injectIcons() {
        document.querySelectorAll('[data-icon]').forEach(el => el.insertAdjacentHTML('afterbegin', Icon(el.dataset.icon)));
    },

    bindGlobal() {
        /* Горячие клавиши */
        addEventListener('keydown', e => {
            if (e.target.matches('textarea, input')) return;
            if (e.key === '1') Router.go('home');
            if (e.key === '2') Router.go('route');
            if (e.key === '3') Router.go('arena');
            if (e.key === '4') Router.go('reference');
            if (e.key === '5') Router.go('hall');
        });
        /* Разблокировка аудио первым жестом */
        const unlock = () => { Sounds.ensure(); removeEventListener('pointerdown', unlock); };
        addEventListener('pointerdown', unlock);
    },

    toggleSound() {
        Store.state.settings.sound = !Store.state.settings.sound;
        Store.save();
        this.renderSoundButton();
        if (Store.state.settings.sound) Sounds.check();
    },

    renderSoundButton() {
        const on = Store.state.settings.sound;
        document.querySelectorAll('.sound-btn').forEach(b => {
            b.innerHTML = Icon(on ? 'sound' : 'mute');
            b.title = on ? 'Звук включён' : 'Звук выключен';
        });
    },

    applyTheme(theme, silent) {
        document.documentElement.dataset.theme = theme;
        document.querySelectorAll('.theme-btn').forEach(b => b.innerHTML = Icon(theme === 'night' ? 'sun' : 'moon'));
        if (!silent) { Store.state.settings.theme = theme; Store.save(); Sounds.tab(); }
    },
    toggleTheme() { this.applyTheme(Store.state.settings.theme === 'night' ? 'day' : 'night'); },

    /* Тумблер эффектов: off — без анимаций и частиц (слабые машины) */
    applyMotion(mode, silent) {
        document.documentElement.dataset.motion = mode;
        FX.reduced = mode === 'off' || matchMedia('(prefers-reduced-motion: reduce)').matches;
        document.querySelectorAll('.motion-btn').forEach(b => { b.innerHTML = Icon('sparkle'); b.classList.toggle('is-off', mode === 'off'); b.title = mode === 'off' ? 'Эффекты выключены' : 'Эффекты включены'; });
        if (!silent) { Store.state.settings.motion = mode; Store.save(); Sounds.tab(); }
    },
    toggleMotion() { this.applyMotion(Store.state.settings.motion === 'off' ? 'on' : 'off'); }
};

document.addEventListener('DOMContentLoaded', () => App.init());
