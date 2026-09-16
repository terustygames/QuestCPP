/* ==========================================================================
   БАЗА ЗАДАЧ — общий реестр.
   Каждый файл tasks-*.js вызывает TaskDB.add([...]).

   Формат задачи:
     id        — уникальный идентификатор
     title     — название
     level     — 1..5 (Разминка, Ветвления, Ремесло, Инструменты, Мастерство)
     xp        — награда
     requires  — станции маршрута, без которых задачу не решить
     story     — одна фраза-контекст (тёплая, без сюсюканья)
     spec      — постановка (HTML)
     input     — формат ввода (HTML)
     output    — формат вывода (HTML)
     tests     — [{ in, out }], первые два показываются как примеры
     hints     — подсказки по возрастанию «спойлерности»
     starter   — код, который окажется в редакторе
     solution  — эталон; tools/validate_tasks.js прогоняет его через g++
     compare   — 'lines' (по умолчанию) или 'tokens'
   ========================================================================== */

var TaskDB = {
    list: [],
    byId: {},
    add(tasks) {
        tasks.forEach(t => {
            if (this.byId[t.id]) console.warn('Дубликат задачи', t.id);
            t.compare = t.compare || 'lines';
            this.list.push(t);
            this.byId[t.id] = t;
        });
    }
};

var TASK_LEVELS = {
    1: { name: 'Разминка',    color: '#2ec4b6' },
    2: { name: 'Ветвления',   color: '#4d96ff' },
    3: { name: 'Ремесло',     color: '#ffb400' },
    4: { name: 'Инструменты', color: '#ff922b' },
    5: { name: 'Мастерство',  color: '#ff6b6b' }
};

var STARTER_BASIC = `#include <iostream>
using namespace std;

int main() {
    // Ваш код

    return 0;
}
`;
