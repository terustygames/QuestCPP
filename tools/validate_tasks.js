#!/usr/bin/env node
/* ==========================================================================
   Валидатор задач: компилирует solution каждой задачи через g++
   и сравнивает вывод с tests[].out.

   Запуск:  node tools/validate_tasks.js [id-фильтр]
   ========================================================================== */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');
const vm = require('vm');

const root = path.join(__dirname, '..');
const dataDir = path.join(root, 'js', 'data');

/* Подгружаем браузерные файлы данных в песочницу. */
const ctx = { console };
vm.createContext(ctx);
const files = [
    path.join(dataDir, 'keywords.js'),
    path.join(dataDir, 'tasks', '_index.js'),
    ...fs.readdirSync(path.join(dataDir, 'tasks'))
        .filter(f => f.startsWith('level'))
        .sort()
        .map(f => path.join(dataDir, 'tasks', f))
];
files.forEach(f => vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }));

const tasks = ctx.TaskDB.list;
const stations = ctx.STATIONS;
const filter = process.argv[2];

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'questcpp-'));
let failed = 0;

function normalizeLines(s) {
    return s.replace(/\r/g, '').split('\n').map(l => l.replace(/\s+$/, '')).join('\n').replace(/\n+$/, '');
}
function normalizeTokens(s) {
    return s.split(/\s+/).filter(Boolean).join(' ');
}

for (const t of tasks) {
    if (filter && !t.id.includes(filter)) continue;

    const problems = [];
    (t.requires || []).forEach(r => { if (!stations[r]) problems.push(`неизвестная станция "${r}"`); });
    if (!t.solution) problems.push('нет solution');
    if (!t.tests || t.tests.length < 1) problems.push('нет тестов');

    if (problems.length === 0) {
        const src = path.join(tmp, t.id + '.cpp');
        const bin = path.join(tmp, t.id + '.out');
        fs.writeFileSync(src, t.solution);
        try {
            execFileSync('g++', ['-std=c++20', '-O2', '-o', bin, src], { stdio: ['ignore', 'pipe', 'pipe'] });
        } catch (e) {
            problems.push('ошибка компиляции:\n' + e.stderr.toString().split('\n').slice(0, 8).join('\n'));
        }
        if (problems.length === 0) {
            t.tests.forEach((tc, i) => {
                const r = spawnSync(bin, [], { input: tc.in, timeout: 3000, encoding: 'utf8' });
                const cmp = t.compare === 'tokens' ? normalizeTokens : normalizeLines;
                const got = cmp(r.stdout || '');
                const exp = cmp(tc.out);
                if (r.status !== 0) problems.push(`тест ${i + 1}: код возврата ${r.status}`);
                else if (got !== exp) problems.push(`тест ${i + 1}: ожидалось\n${exp}\n   получено\n${got}`);
            });
        }
    }

    if (problems.length) {
        failed++;
        console.log(`\x1b[31mFAIL\x1b[0m ${t.id}`);
        problems.forEach(p => console.log('   ' + p.replace(/\n/g, '\n   ')));
    } else {
        console.log(`\x1b[32m ok \x1b[0m ${t.id}`);
    }
}

fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\nЗадач: ${tasks.length}, провалено: ${failed}`);
process.exit(failed ? 1 : 0);
