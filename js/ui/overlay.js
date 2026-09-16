/* ==========================================================================
   Modal и Toast — модальные окна и всплывающие уведомления.
   ========================================================================== */

var Modal = {
    el: null, box: null,

    init() {
        this.el = document.getElementById('modal');
        this.box = document.getElementById('modal-box');
        this.el.addEventListener('click', e => { if (e.target === this.el) this.close(); });
        addEventListener('keydown', e => { if (e.key === 'Escape') this.close(); });
    },

    open(html, { celebrate = false } = {}) {
        this.box.innerHTML = `<button class="modal-x btn btn-ghost" onclick="Modal.close()" aria-label="Закрыть">${Icon('cross')}</button>` + html;
        this.el.classList.add('is-open');
        this.box.classList.toggle('is-celebrate', celebrate);
        Sounds.whoosh();
    },

    close() {
        if (!this.el.classList.contains('is-open')) return;
        this.el.classList.remove('is-open');
    },

    confirm(text, onYes) {
        this.open(`<p class="modal-text modal-confirm">${esc(text)}</p>
            <div class="modal-actions">
                <button class="btn btn-ghost" onclick="Modal.close()">Отмена</button>
                <button class="btn btn-danger" id="modal-yes">Да, продолжить</button>
            </div>`);
        document.getElementById('modal-yes').onclick = () => { this.close(); onYes(); };
    }
};

var Toast = {
    show(text, kind = 'info', ms = 3600) {
        const box = document.getElementById('toasts');
        const d = document.createElement('div');
        d.className = 'toast is-' + kind;
        const icon = { ok: 'check', error: 'cross', info: 'info' }[kind] || 'info';
        d.innerHTML = `${Icon(icon)}<span>${esc(text)}</span>`;
        box.appendChild(d);
        setTimeout(() => d.classList.add('is-out'), ms - 350);
        setTimeout(() => d.remove(), ms);
    }
};
