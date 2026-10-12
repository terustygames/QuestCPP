/* ============================================
   COMPILER — C++ Quest
   Использует Wandbox API для компиляции C++
   ============================================ */

const Compiler = {
    currentTab: 'code',
    isRunning: false,
    fontSize: 14,

    init() {
        const editor = document.getElementById('code-editor');
        if (editor) {
            editor.addEventListener('input', () => this.updateLineNumbers());
            editor.addEventListener('scroll', () => this.syncScroll());
            editor.addEventListener('keydown', (e) => this.handleTab(e));
            this.updateLineNumbers();
        }
    },

    // Номера строк
    updateLineNumbers() {
        const editor = document.getElementById('code-editor');
        const lineNumbers = document.getElementById('line-numbers');
        if (!editor || !lineNumbers) return;

        const lines = editor.value.split('\n').length;
        let html = '';
        for (let i = 1; i <= lines; i++) {
            html += i + '\n';
        }
        lineNumbers.textContent = html;
    },

    // Синхронизация скролла
    syncScroll() {
        const editor = document.getElementById('code-editor');
        const lineNumbers = document.getElementById('line-numbers');
        if (editor && lineNumbers) {
            lineNumbers.scrollTop = editor.scrollTop;
        }
    },

    // Tab в редакторе
    handleTab(e) {
        if (e.key === 'Tab') {
            e.preventDefault();
            const editor = e.target;
            const start = editor.selectionStart;
            const end = editor.selectionEnd;
            editor.value = editor.value.substring(0, start) + '    ' + editor.value.substring(end);
            editor.selectionStart = editor.selectionEnd = start + 4;
            this.updateLineNumbers();
        }
    },

    // Переключение вкладок
    switchTab(tab) {
        this.currentTab = tab;

        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.editor-container, .output-container').forEach(el => el.classList.add('hidden'));

        const tabEl = document.getElementById(`editor-tab-${tab}`);
        if (tabEl) {
            tabEl.classList.remove('hidden');
        }

        event.target.classList.add('active');
    },

    // Получить код
    getCode() {
        const editor = document.getElementById('code-editor');
        return editor ? editor.value : '';
    },

    // Установить код
    setCode(code) {
        const editor = document.getElementById('code-editor');
        if (editor) {
            editor.value = code;
            this.updateLineNumbers();
        }
    },

    // Размер шрифта
    setFontSize(size) {
        this.fontSize = parseInt(size);
        const editor = document.getElementById('code-editor');
        const lineNumbers = document.getElementById('line-numbers');
        if (editor) editor.style.fontSize = size + 'px';
        if (lineNumbers) lineNumbers.style.fontSize = size + 'px';
    },

    // Форматирование (базовое)
    formatCode() {
        let code = this.getCode();
        // Простое авто-форматирование
        let indent = 0;
        const lines = code.split('\n');
        const formatted = lines.map(line => {
            line = line.trim();
            if (line.startsWith('}') || line.startsWith(');')) indent = Math.max(0, indent - 1);
            const result = '    '.repeat(indent) + line;
            if (line.endsWith('{')) indent++;
            return result;
        });
        this.setCode(formatted.join('\n'));
        App.notify('🎨 Код отформатирован!', 'info');
        Sounds.click();
    },

    // Сброс кода
    resetCode() {
        const task = Practice.currentTask;
        if (task && task.starterCode) {
            this.setCode(task.starterCode);
        } else {
            this.setCode('#include <iostream>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}');
        }
        App.notify('🔄 Код сброшен', 'info');
        Sounds.click();
    },

    // Копировать код
    copyCode() {
        navigator.clipboard.writeText(this.getCode()).then(() => {
            App.notify('📋 Код скопирован!', 'success');
            Sounds.click();
        });
    },

    // ============ ЗАПУСК КОДА ============
    async run() {
        if (this.isRunning) return;
        this.isRunning = true;

        const runBtn = document.getElementById('run-btn');
        runBtn.classList.add('loading');
        runBtn.querySelector('.run-text').textContent = 'Компиляция...';

        Sounds.run();

        // Переключаемся на вкладку вывода
        this.switchTabDirect('output');

        const statusEl = document.getElementById('output-status');
        const outputEl = document.getElementById('output-text');

        statusEl.textContent = '⏳ Компиляция...';
        statusEl.className = 'output-status running';
        outputEl.textContent = 'Компилируем и запускаем...';
        outputEl.className = 'output-text';

        const code = this.getCode();
        const stdin = document.getElementById('stdin-input').value;

        try {
            const result = await this.compileAndRun(code, stdin);

            if (result.error) {
                statusEl.textContent = '❌ Ошибка компиляции';
                statusEl.className = 'output-status error';
                outputEl.textContent = result.error;
                outputEl.className = 'output-text error-output';
                Sounds.error();
            } else {
                statusEl.textContent = '✅ Успешно';
                statusEl.className = 'output-status success';
                outputEl.textContent = result.output || '(нет вывода)';
                outputEl.className = 'output-text success-output';
                Sounds.click();
            }
        } catch (e) {
            statusEl.textContent = '❌ Ошибка';
            statusEl.className = 'output-status error';
            outputEl.textContent = 'Ошибка соединения: ' + e.message + '\n\nВозможно, сервер Wandbox временно недоступен. Попробуйте позже.';
            outputEl.className = 'output-text error-output';
            Sounds.error();
        }

        this.isRunning = false;
        runBtn.classList.remove('loading');
        runBtn.querySelector('.run-text').textContent = 'Запустить';
    },

    // ============ ПРОВЕРКА РЕШЕНИЯ ============
    async submit() {
        if (this.isRunning) return;

        const task = Practice.currentTask;
        if (!task) {
            App.notify('⚠️ Сначала выберите задачу!', 'warning');
            return;
        }

        this.isRunning = true;
        Sounds.submit();

        const submitBtn = document.getElementById('submit-btn');
        submitBtn.classList.add('loading');
        submitBtn.querySelector('.submit-text').textContent = 'Проверяем...';

        this.switchTabDirect('output');

        const statusEl = document.getElementById('output-status');
        const outputEl = document.getElementById('output-text');

        statusEl.textContent = '⏳ Проверка тестов...';
        statusEl.className = 'output-status running';

        const code = this.getCode();
        let allPassed = true;
        let results = [];

        for (let i = 0; i < task.testCases.length; i++) {
            const tc = task.testCases[i];

            try {
                const result = await this.compileAndRun(code, tc.input);

                if (result.error) {
                    results.push({
                        index: i + 1,
                        passed: false,
                        expected: tc.expectedOutput,
                        got: 'Ошибка компиляции: ' + result.error.substring(0, 200)
                    });
                    allPassed = false;
                    break;
                }

                const output = (result.output || '').trim();
                const expected = tc.expectedOutput.trim();
                const passed = output === expected;

                results.push({
                    index: i + 1,
                    passed,
                    expected,
                    got: output,
                    input: tc.input
                });

                if (!passed) allPassed = false;
            } catch (e) {
                results.push({
                    index: i + 1,
                    passed: false,
                    expected: tc.expectedOutput,
                    got: 'Ошибка соединения'
                });
                allPassed = false;
                break;
            }
        }

        // Отображение результатов
        let html = '';
        results.forEach(r => {
            html += `${r.passed ? '✅' : '❌'} Тест ${r.index}: ${r.passed ? 'ПРОЙДЕН' : 'ПРОВАЛЕН'}\n`;
            if (!r.passed) {
                if (r.input) html += `   Ввод: ${r.input}\n`;
                html += `   Ожидалось: ${r.expected}\n`;
                html += `   Получено:  ${r.got}\n`;
            }
            html += '\n';
        });

        if (allPassed) {
            statusEl.textContent = `🎉 Все тесты пройдены! (${results.length}/${task.testCases.length})`;
            statusEl.className = 'output-status success';
            outputEl.className = 'output-text success-output';
            outputEl.textContent = html + '\n🎉 Отлично! Задача решена!';

            // Засчитываем решение
            Practice.onTaskSolved(task);
        } else {
            const passedCount = results.filter(r => r.passed).length;
            statusEl.textContent = `❌ Тесты: ${passedCount}/${task.testCases.length}`;
            statusEl.className = 'output-status error';
            outputEl.className = 'output-text error-output';
            outputEl.textContent = html;

            Sounds.error();
            Animations.shake(submitBtn);
        }

        this.isRunning = false;
        submitBtn.classList.remove('loading');
        submitBtn.querySelector('.submit-text').textContent = 'Проверить решение';
    },

    // Прямое переключение вкладки
    switchTabDirect(tab) {
        this.currentTab = tab;

        document.querySelectorAll('.tab-btn').forEach((btn, i) => {
            btn.classList.toggle('active', (tab === 'code' && i === 0) || (tab === 'output' && i === 1));
        });

        const codeTab = document.getElementById('editor-tab-code');
        const outputTab = document.getElementById('editor-tab-output');

        if (tab === 'code') {
            codeTab.classList.remove('hidden');
            outputTab.classList.add('hidden');
        } else {
            codeTab.classList.add('hidden');
            outputTab.classList.remove('hidden');
        }
    },

    // ============ WANDBOX API ============
    async compileAndRun(code, stdin = '') {
        const payload = {
            code: code,
            compiler: 'gcc-head',
            options: 'warning,gnu++2b',
            stdin: stdin,
            'compiler-option-raw': '-std=c++20 -O2',
            'runtime-option-raw': ''
        };

        try {
            const response = await fetch('https://wandbox.org/api/compile.json', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            // Wandbox возвращает:
            // program_message - вывод программы
            // compiler_error - ошибки компиляции
            // compiler_message - сообщения компилятора
            // status - код возврата

            if (data.compiler_error && data.compiler_error.trim()) {
                // Проверяем, есть ли вывод программы несмотря на warnings
                if (data.program_message !== undefined && data.status === '0') {
                    return { output: data.program_message, warning: data.compiler_error };
                }
                return { error: data.compiler_error };
            }

            return { output: data.program_message || '' };
        } catch (e) {
            // Fallback: пробуем другой API
            return this.fallbackCompile(code, stdin);
        }
    },

    // Запасной компилятор
    async fallbackCompile(code, stdin = '') {
        try {
            // Godbolt API
            const response = await fetch('https://godbolt.org/api/compiler/g132/compile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    source: code,
                    compiler: 'g132',
                    options: {
                        userArguments: '-std=c++20 -O2',
                        executeParameters: {
                            args: [],
                            stdin: stdin
                        },
                        compilerOptions: {
                            executorRequest: true
                        }
                    },
                    lang: 'c++',
                    allowStoreCodeDebug: false
                })
            });

            if (!response.ok) throw new Error('Godbolt error');

            const data = await response.json();

            if (data.execResult) {
                if (data.execResult.buildResult && data.execResult.buildResult.code !== 0) {
                    const errors = data.execResult.buildResult.stderr
                        ? data.execResult.buildResult.stderr.map(s => s.text).join('\n')
                        : 'Ошибка компиляции';
                    return { error: errors };
                }

                const stdout = data.execResult.stdout
                    ? data.execResult.stdout.map(s => s.text).join('\n')
                    : '';
                return { output: stdout };
            }

            throw new Error('Unexpected response');
        } catch (e) {
            // Локальная симуляция для простых случаев
            return this.localSimulate(code, stdin);
        }
    },

// // Базовая локальная симуляция (для очень простых задач)
// localSimulate(code, stdin) {
//     return {
//         error: '⚠️ Онлайн-компилятор временно недоступен.\n\n' +
//             'Попробуйте:\n' +
//             '1. Обновить страницу и попробовать снова\n' +
//             '2. Скопировать код и проверить на cpp.sh или onlinegdb.com\n' 