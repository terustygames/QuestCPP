/* ==========================================================================
   Router — переключение экранов (#home, #route, #arena, #reference, #hall)
   с анимацией ухода/прихода. Каждый экран регистрирует onEnter.
   ========================================================================== */

var Router = {
    current: null,
    screens: {},
    busy: false,

    register(name, { onEnter, onLeave } = {}) {
        this.screens[name] = { onEnter, onLeave, el: document.getElementById('screen-' + name) };
    },

    start() {
        addEventListener('hashchange', () => this.go(location.hash.slice(1) || 'home', { fromHash: true }));
        this.go(location.hash.slice(1) || 'home', { fromHash: true, instant: true });
    },

    async go(name, { fromHash = false, instant = false, params = {} } = {}) {
        if (!this.screens[name]) name = 'home';
        if (this.busy || name === this.current) {
            if (name === this.current && params.task) this.screens[name].onEnter?.(params);
            return;
        }
        this.busy = true;
        if (!fromHash) history.pushState(null, '', '#' + name);

        const prev = this.current ? this.screens[this.current] : null;
        const next = this.screens[name];

        if (prev) {
            prev.onLeave?.();
            if (!instant) {
                prev.el.classList.add('screen-leave');
                await new Promise(r => setTimeout(r, 180));
            }
            prev.el.classList.remove('is-active', 'screen-leave');
        }

        this.current = name;
        next.el.classList.add('is-active');
        if (!instant) {
            next.el.classList.add('screen-enter');
            setTimeout(() => next.el.classList.remove('screen-enter'), 450);
        }
        document.body.dataset.screen = name;
        next.onEnter?.(params);
        window.scrollTo(0, 0);
        this.busy = false;
    }
};
