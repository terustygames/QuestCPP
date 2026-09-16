#!/usr/bin/env node
/* ==========================================================================
   Локальный сервер C++ Quest.
     - раздаёт статику из корня репозитория
     - POST /api/run { code, stdin } -> компилирует g++ и запускает с лимитами
     - GET  /api/health

   Запуск:  node server/judge.js [port]
   Требуется установленный g++. Без сервера сайт работает через
   публичные компиляторы (Wandbox / Godbolt) — просто откройте index.html.
   ========================================================================== */

const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawn, execFile } = require('child_process');

const PORT = Number(process.argv[2] || process.env.PORT || 8080);
const ROOT = path.join(__dirname, '..');
const LIMITS = { codeBytes: 64 * 1024, stdinBytes: 64 * 1024, compileMs: 15000, runMs: 3000, outputBytes: 256 * 1024 };

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
               '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.md': 'text/plain; charset=utf-8',
               '.woff2': 'font/woff2', '.ico': 'image/x-icon' };

function json(res, status, body) {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify(body));
}

function readBody(req, limit) {
    return new Promise((resolve, reject) => {
        let size = 0; const chunks = [];
        req.on('data', c => { size += c.length; if (size > limit) { reject(new Error('too large')); req.destroy(); } else chunks.push(c); });
        req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        req.on('error', reject);
    });
}

function compileAndRun(code, stdin) {
    return new Promise(resolve => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'qcpp-'));
        const src = path.join(dir, 'main.cpp');
        const bin = path.join(dir, 'main');
        fs.writeFileSync(src, code);
        const cleanup = () => fs.rm(dir, { recursive: true, force: true }, () => {});

        execFile('g++', ['-std=c++20', '-O2', '-Wall', '-o', bin, src], { timeout: LIMITS.compileMs, maxBuffer: 1 << 20 }, (err, _out, cerr) => {
            const warnings = String(cerr || '');
            if (err) {
                cleanup();
                return resolve({ ok: false, stdout: '', stderr: '', compileError: warnings || String(err.message), exitCode: null });
            }
            const t0 = Date.now();
            const child = spawn(bin, [], { cwd: dir, stdio: ['pipe', 'pipe', 'pipe'] });
            let out = '', errOut = '', truncated = false, killed = false;
            const timer = setTimeout(() => { killed = true; child.kill('SIGKILL'); }, LIMITS.runMs);
            child.stdout.on('data', d => { if (out.length < LIMITS.outputBytes) out += d; else truncated = true; });
            child.stderr.on('data', d => { if (errOut.length < 8192) errOut += d; });
            child.on('close', (code, signal) => {
                clearTimeout(timer); cleanup();
                resolve({
                    ok: code === 0 && !killed,
                    stdout: out + (truncated ? '\n[вывод обрезан]' : ''),
                    stderr: (killed ? 'Превышен лимит времени (' + LIMITS.runMs / 1000 + ' с)\n' : '') + errOut + (warnings ? '\n' + warnings : ''),
                    compileError: '',
                    exitCode: code, signal: killed ? 'TIMEOUT' : (signal || ''),
                    time: Date.now() - t0
                });
            });
            child.on('error', e => { clearTimeout(timer); cleanup(); resolve({ ok: false, stdout: '', stderr: String(e), compileError: '', exitCode: null }); });
            child.stdin.on('error', () => {});
            child.stdin.end(stdin || '');
        });
    });
}

/* Простейшая очередь: не больше N компиляций одновременно */
const MAX_PARALLEL = Math.max(1, Math.min(4, os.cpus().length));
let running = 0; const queue = [];
function enqueue(fn) {
    return new Promise(resolve => {
        queue.push({ fn, resolve });
        pump();
    });
}
function pump() {
    while (running < MAX_PARALLEL && queue.length) {
        const { fn, resolve } = queue.shift();
        running++;
        fn().then(r => { running--; resolve(r); pump(); });
    }
}

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');

    if (req.method === 'OPTIONS') {
        res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST, GET' });
        return res.end();
    }
    if (url.pathname === '/api/health') return json(res, 200, { ok: true, gpp: true });

    if (url.pathname === '/api/run' && req.method === 'POST') {
        try {
            const body = JSON.parse(await readBody(req, LIMITS.codeBytes + LIMITS.stdinBytes + 1024));
            if (typeof body.code !== 'string') return json(res, 400, { error: 'code required' });
            const result = await enqueue(() => compileAndRun(body.code, String(body.stdin || '').slice(0, LIMITS.stdinBytes)));
            return json(res, 200, result);
        } catch (e) {
            return json(res, 400, { error: String(e.message) });
        }
    }

    /* статика */
    let p = decodeURIComponent(url.pathname);
    if (p === '/') p = '/index.html';
    const file = path.normalize(path.join(ROOT, p));
    if (!file.startsWith(ROOT) || file.includes(path.sep + '.git')) { res.writeHead(403); return res.end(); }
    fs.readFile(file, (err, data) => {
        if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('404'); }
        res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
        res.end(data);
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`C++ Quest: http://localhost:${PORT}  (g++ судья, до ${MAX_PARALLEL} параллельных запусков)`);
});
