/* ==========================================================================
   Judge — компиляция и проверка.
   Бэкенды по очереди:
     1. локальный сервер (server/judge.js) — POST /api/run
     2. Wandbox (публичный API)
     3. Godbolt / Compiler Explorer

   compile(code, stdin) -> { ok, stdout, stderr, compileError, time, backend }
   check(task, code, onTest) -> { passed, total, results[] }
   ========================================================================== */

var Judge = {
    backends: ['local', 'wandbox', 'godbolt'],
    activeBackend: null,
    localAvailable: null,

    async probeLocal() {
        if (this.localAvailable !== null) return this.localAvailable;
        try {
            const r = await fetch('/api/health', { cache: 'no-store' });
            this.localAvailable = r.ok;
        } catch (e) { this.localAvailable = false; }
        return this.localAvailable;
    },

    async compile(code, stdin = '') {
        const order = (await this.probeLocal()) ? this.backends : this.backends.slice(1);
        let lastErr = null;
        for (const b of order) {
            try {
                const res = await this[b](code, stdin);
                this.activeBackend = b;
                return { ...res, backend: b };
            } catch (e) { lastErr = e; }
        }
        return { ok: false, stdout: '', stderr: '', compileError: '',
                 networkError: 'Ни один компилятор недоступен. ' + (lastErr ? lastErr.message : ''), backend: null };
    },

    /* ---- бэкенды ---- */
    async local(code, stdin) {
        const r = await fetch('/api/run', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, stdin })
        });
        if (!r.ok) throw new Error('local ' + r.status);
        return r.json();
    },

    async wandbox(code, stdin) {
        const r = await fetch('https://wandbox.org/api/compile.json', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code, stdin, compiler: 'gcc-head',
                options: 'warning', 'compiler-option-raw': '-std=c++20\n-O2'
            })
        });
        if (!r.ok) throw new Error('wandbox ' + r.status);
        const d = await r.json();
        const compileError = (d.compiler_error || '').trim();
        const hasErrors = /error:|undefined reference/.test(compileError) || (d.status === undefined && compileError);
        return {
            ok: !hasErrors && String(d.status) === '0',
            stdout: d.program_output || '',
            stderr: (d.program_error || '') + (hasErrors ? '' : compileError ? '\n' + compileError : ''),
            compileError: hasErrors ? compileError : '',
            exitCode: d.status !== undefined ? Number(d.status) : null,
            signal: d.signal || ''
        };
    },

    async godbolt(code, stdin) {
        const r = await fetch('https://godbolt.org/api/compiler/g142/compile', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({
                source: code, lang: 'c++',
                options: {
                    userArguments: '-std=c++20 -O2',
                    executeParameters: { args: [], stdin },
                    compilerOptions: { executorRequest: true, skipAsm: true },
                    filters: { execute: true }
                }
            })
        });
        if (!r.ok) throw new Error('godbolt ' + r.status);
        const d = await r.json();
        const join = a => (a || []).map(x => x.text).join('\n');
        const build = d.buildResult || {};
        if (build.code !== undefined && build.code !== 0) {
            return { ok: false, stdout: '', stderr: '', compileError: join(build.stderr), exitCode: null };
        }
        return { ok: d.code === 0 && !d.didExecute === false, stdout: join(d.stdout), stderr: join(d.stderr), compileError: '', exitCode: d.code };
    },

    /* ---- сравнение ---- */
    normalize(s, mode) {
        s = (s || '').replace(/\r/g, '');
        if (mode === 'tokens') return s.split(/\s+/).filter(Boolean).join(' ');
        return s.split('\n').map(l => l.replace(/\s+$/, '')).join('\n').replace(/\n+$/, '');
    },

    /* Проверка по всем тестам. onTest(i, result) вызывается после каждого. */
    async check(task, code, onTest) {
        const results = [];
        let compileFail = null;
        for (let i = 0; i < task.tests.length; i++) {
            const tc = task.tests[i];
            const r = await this.compile(code, tc.in);
            let res;
            if (r.networkError) {
                res = { i, status: 'network', message: r.networkError };
            } else if (r.compileError) {
                res = { i, status: 'compile', message: r.compileError };
                compileFail = res;
            } else if (!r.ok && r.exitCode !== 0 && r.exitCode !== null) {
                res = { i, status: 'runtime', message: r.stderr || ('Программа завершилась с кодом ' + r.exitCode + (r.signal ? ' (' + r.signal + ')' : '')), got: r.stdout };
            } else {
                const got = this.normalize(r.stdout, task.compare);
                const exp = this.normalize(tc.out, task.compare);
                res = { i, status: got === exp ? 'pass' : 'fail', got: r.stdout, expected: tc.out, input: tc.in, stderr: r.stderr };
            }
            results.push(res);
            onTest?.(i, res);
            if (res.status === 'compile' || res.status === 'network') break;
        }
        const passed = results.filter(r => r.status === 'pass').length;
        return { passed, total: task.tests.length, results, compileFail };
    }
};
