# C++ Quest

Сайт-тренажёр по C++: отмечаете на «маршруте» ключевые слова, которые уже знаете,
и Арена подбирает задачи, в которых нужны только они. Решения проверяются настоящим
компилятором на скрытых тестах.

## Запуск

Вариант 1 — с локальным судьёй (нужны Node.js и g++):

```bash
node server/judge.js 8080
# открыть http://localhost:8080
```

Вариант 2 — просто открыть `index.html` в браузере. Компиляция пойдёт через
публичные API (Wandbox, затем Compiler Explorer), сайт сам переключится.

## Структура

```
index.html              один экран-контейнер, роутер переключает секции
css/                    base, layout, components, editor, animations
js/data/keywords.js     станции маршрута (ключевые слова) в порядке изучения
js/data/tasks/          задачи по уровням, каждая с тестами и эталоном
js/data/achievements.js
js/core/                store (состояние), sounds, fx, router, judge
js/ui/                  home, route, practice, reference, hall, overlay, icons
server/judge.js         статика + POST /api/run (g++ с лимитами времени и вывода)
tools/validate_tasks.js прогоняет эталоны всех задач через g++
```

## Добавить задачу

1. Откройте нужный `js/data/tasks/levelN-*.js` и добавьте объект в `TaskDB.add([...])`.
2. В `requires` укажите id станций из `js/data/keywords.js`.
3. Напишите `solution` и тесты.
4. Запустите `node tools/validate_tasks.js` — задача должна быть зелёной.

## Горячие клавиши

- `1`–`5` — экраны; `Ctrl+Enter` — запуск; `Ctrl+Shift+Enter` — проверка; `Tab` — отступ в редакторе.
