#!/usr/bin/env node
/* Smoke-тест интерфейса в jsdom: прогоняет все экраны и основные сценарии.
   Требуется jsdom:  npm i -g jsdom  (или NODE_PATH на каталог с ним)
   Запуск: node tools/smoke.js */
const { JSDOM } = require('jsdom');
const fs = require('fs'); const path = require('path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const errors = [];
const dom = new JSDOM(html, { url: 'http://localhost/', runScripts: 'outside-only', pretendToBeVisual: true,
  beforeParse(w) {
    w.HTMLCanvasElement.prototype.getContext = () => ({ clearRect(){}, save(){}, restore(){}, translate(){}, rotate(){}, beginPath(){}, arc(){}, fill(){}, fillRect(){} });
    w.requestAnimationFrame = cb => setTimeout(() => cb(performance.now()), 16);
    w.matchMedia = () => ({ matches: false });
    w.scrollTo = () => {}; w.Element.prototype.scrollIntoView = () => {};
    w.fetch = async () => { throw new Error('offline'); };
    w.console.error = (...a) => errors.push(a.join(' '));
  } });
const w = dom.window;
w.addEventListener('error', e => errors.push('window: ' + e.message));
[...w.document.querySelectorAll('script[src]')].forEach(s => { const src = s.getAttribute('src'); try { w.eval(fs.readFileSync(path.join(root, src), 'utf8')); } catch (e) { errors.push(src + ': ' + e.stack); } });
(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  try {
    w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
    await sleep(100);
    console.log('screen:', w.Router.current, 'known:', w.Store.state.known.length, 'avail:', w.Store.availableTasks().length);
    for (const s of ['route', 'arena', 'reference', 'hall', 'home']) { await w.Router.go(s); await sleep(250); if (!w.document.getElementById('screen-'+s).classList.contains('is-active')) errors.push('screen not active: '+s); }
    await w.Router.go('route'); await sleep(250);
    w.document.querySelector('.station[data-id="if"]').click(); await sleep(50);
    console.log('if known:', w.Store.knows('if'), 'unlock(long_long):', w.Store.unlockCountFor('long_long'));
    w.Route.showInfo('vector', { stopPropagation(){} }); w.Modal.close();
    w.Route.setFilter('control'); w.Route.selectAll(true);
    await w.Router.go('arena'); await sleep(300);
    console.log('task:', w.Practice.task && w.Practice.task.id);
    w.Practice.showHint(); w.Practice.toggleList();
    w.Practice.load(w.TaskDB.byId['hanoi_moves']);
    w.Practice.editor.value += '\n// edit'; w.Practice.editor.dispatchEvent(new w.Event('input')); await sleep(500);
    console.log('draft saved:', (w.Store.state.drafts['hanoi_moves'] || '').includes('// edit'));
    w.Judge.compile = async (code, stdin) => { const t = w.TaskDB.byId['hanoi_moves']; const tc = t.tests.find(x => x.in === stdin); return { ok: true, stdout: tc.out, stderr: '', compileError: '', exitCode: 0 }; };
    await w.Practice.submit(); await sleep(900);
    console.log('solved:', w.Store.isSolved('hanoi_moves'), 'xp:', w.Store.state.xp);
    w.Modal.close();
    w.Judge.compile = async () => ({ ok: true, stdout: 'wrong', stderr: '', compileError: '', exitCode: 0 });
    w.Practice.load(w.TaskDB.byId['gcd_lcm']); await w.Practice.submit(); console.log('fail:', w.document.getElementById('out-status').textContent.trim());
    w.Judge.compile = async () => ({ ok: false, stdout: '', stderr: '', compileError: 'main.cpp:3:5: error: boom', exitCode: null });
    await w.Practice.run(); console.log('compile err shown:', w.document.getElementById('out-console').textContent.includes('boom'));
    await w.Router.go('reference'); await sleep(250); w.Reference.tasksFor('vector'); w.Modal.close();
    await w.Router.go('hall'); await sleep(250);
    await w.Router.go('home'); await sleep(300); console.log('next:', w.document.getElementById('home-next').textContent.trim().slice(0, 60));
    w.App.toggleTheme(); w.App.toggleSound(); w.App.toggleMotion(); console.log('motion:', w.document.documentElement.dataset.motion);
  } catch (e) { errors.push('flow: ' + e.stack); }
  console.log('\nERRORS:', errors.length); errors.forEach(e => console.log(e));
  process.exit(errors.length ? 1 : 0);
})();
