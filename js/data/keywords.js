/* ==========================================================================
   МАРШРУТ — синтаксис C++ в порядке, в котором его обычно осваивают.
   «Линия» — тема, «станция» — ключевое слово, оператор, символ или приём.
   Скелет программы (#include, main, return) не входит: это подразумевается.

   Поля станции: id, name (как в коде), title, desc, example.
   Задачи ссылаются на id в поле requires.
   ========================================================================== */

var ROUTE = [
    {
        id: 'io',
        name: 'Ввод и вывод',
        color: '#ff6b6b',
        blurb: 'Общение программы с пользователем.',
        stations: [
            { id: 'cout', name: 'cout <<', title: 'Вывод в консоль', desc: 'Оператор << отправляет данные в поток вывода. Можно цеплять несколько подряд.', example: 'cout << "Сумма: " << 2 + 3 << "\\n";' },
            { id: 'endl', name: 'endl / "\\n"', title: 'Перенос строки', desc: 'endl переводит строку и сбрасывает буфер; "\\n" только переводит (быстрее).', example: 'cout << "первая" << endl;\ncout << "вторая\\n";' },
            { id: 'cin', name: 'cin >>', title: 'Чтение из консоли', desc: 'Читает значения, разделённые пробелами и переносами строк.', example: 'int a, b;\ncin >> a >> b;' },
            { id: 'cin_loop', name: 'while (cin >> x)', title: 'Чтение до конца ввода', desc: 'cin >> x возвращает false, когда данные кончились или не подошли по типу.', example: 'int x;\nwhile (cin >> x) sum += x;' },
            { id: 'getline', name: 'getline(cin, s)', title: 'Чтение строки целиком', desc: 'Читает всю строку с пробелами. После cin >> в буфере остаётся "\\n" — уберите его cin.ignore().', example: 'string line;\ngetline(cin, line);' },
            { id: 'cin_ignore', name: 'cin.ignore()', title: 'Пропуск символов', desc: 'Пропускает один символ (или n символов до разделителя). Нужен между cin >> и getline.', example: 'cin >> n;\ncin.ignore();\ngetline(cin, s);' },
            { id: 'cin_get', name: 'cin.get()', title: 'Чтение одного символа', desc: 'Читает следующий символ, включая пробелы и переносы строк.', example: 'char c = cin.get();' },
            { id: 'iomanip', name: 'fixed, setprecision', title: 'Знаки после точки', desc: 'Из <iomanip>. fixed + setprecision(2) — ровно два знака после точки.', example: '#include <iomanip>\ncout << fixed << setprecision(2) << 3.14159;  // 3.14' },
            { id: 'setw', name: 'setw, setfill', title: 'Ширина поля', desc: 'setw(5) выравнивает следующее значение по ширине 5; setfill меняет символ-заполнитель.', example: 'cout << setw(5) << setfill(\'0\') << 42;  // 00042' },
            { id: 'boolalpha', name: 'boolalpha', title: 'Вывод true/false', desc: 'По умолчанию bool печатается как 1 или 0. boolalpha печатает слова.', example: 'cout << boolalpha << (2 > 1);  // true' },
            { id: 'cerr', name: 'cerr', title: 'Поток ошибок', desc: 'Отдельный поток для сообщений об ошибках; не смешивается с обычным выводом.', example: 'cerr << "bad input\\n";' },
            { id: 'fast_io', name: 'ios::sync_with_stdio(false)', title: 'Ускорение ввода', desc: 'Отключает синхронизацию с C-потоками. Полезно при больших объёмах ввода.', example: 'ios::sync_with_stdio(false);\ncin.tie(nullptr);' },
            { id: 'printf', name: 'printf / scanf', title: 'Форматный ввод-вывод из C', desc: 'Форматная строка с %d, %f, %s. Быстро, но без проверки типов.', example: 'printf("%d %.2f\\n", n, x);' }
        ]
    },
    {
        id: 'types',
        name: 'Типы данных',
        color: '#4d96ff',
        blurb: 'Чем int отличается от double и когда нужен long long.',
        stations: [
            { id: 'int', name: 'int', title: 'Целое число', desc: '32 бита: примерно от -2.1 до +2.1 миллиарда.', example: 'int year = 2026;' },
            { id: 'double', name: 'double', title: 'Дробное число', desc: '64-битное число с плавающей точкой. 1 / 2 == 0, а 1.0 / 2 == 0.5.', example: 'double price = 19.99;' },
            { id: 'char', name: 'char', title: 'Символ', desc: 'Один байт с кодом символа. С ним можно считать: \'a\' + 1 == \'b\'.', example: "char c = 'a';\nint code = c;  // 97" },
            { id: 'bool', name: 'bool', title: 'Логический тип', desc: 'true или false. Результат сравнений.', example: 'bool ok = 5 > 3;' },
            { id: 'string', name: 'string', title: 'Строка', desc: 'Текст произвольной длины из <string>. Умеет складываться и сравниваться.', example: 'string name = "Ada";\nname += " Lovelace";' },
            { id: 'float', name: 'float', title: 'Дробное одинарной точности', desc: '32 бита, около 7 значащих цифр. Литерал: 1.5f.', example: 'float t = 36.6f;' },
            { id: 'long_long', name: 'long long', title: 'Большое целое', desc: '64 бита: до 9.2 · 10¹⁸. Нужен, когда int переполнится.', example: 'long long big = 3000000000LL;' },
            { id: 'unsigned', name: 'unsigned', title: 'Беззнаковое целое', desc: 'Только неотрицательные. Осторожно: 0u - 1 — огромное число.', example: 'unsigned int count = 4000000000u;' },
            { id: 'short_byte', name: 'short, int8_t, uint64_t', title: 'Типы фиксированного размера', desc: 'Из <cstdint>: int8_t, int16_t, int32_t, int64_t и беззнаковые пары.', example: '#include <cstdint>\nuint8_t byte = 255;\nint64_t big = 1LL << 40;' },
            { id: 'size_t', name: 'size_t', title: 'Тип размера', desc: 'Беззнаковый тип для размеров и индексов. Его возвращает .size().', example: 'for (size_t i = 0; i < v.size(); i++)' },
            { id: 'literals', name: '1LL, 2.5f, 0x1F, 0b101', title: 'Литералы', desc: 'Суффиксы задают тип, префиксы — систему счисления. 1\'000\'000 — разделитель для читаемости.', example: 'long long n = 1\'000\'000LL;\nint mask = 0b1010;\nint hex = 0xFF;' },
            { id: 'char_codes', name: '\'A\' == 65', title: 'Коды символов', desc: 'Цифры \'0\'..\'9\' идут подряд, буквы тоже. c - \'0\' превращает символ цифры в число.', example: "int d = '7' - '0';  // 7\nchar up = 'c' - 'a' + 'A';  // 'C'" },
            { id: 'auto', name: 'auto', title: 'Вывод типа', desc: 'Компилятор сам определит тип по правой части.', example: 'auto x = 3.5;  // double\nauto it = v.begin();' },
            { id: 'const', name: 'const', title: 'Константа', desc: 'Значение нельзя изменить после инициализации.', example: 'const int MAX_USERS = 100;' },
            { id: 'constexpr', name: 'constexpr', title: 'Константа времени компиляции', desc: 'Вычисляется компилятором. Можно использовать как размер массива.', example: 'constexpr int N = 1 << 10;\nint a[N];' },
            { id: 'cast', name: 'static_cast<int>(x)', title: 'Явное преобразование', desc: 'static_cast<int>(3.9) == 3 — дробная часть отбрасывается, не округляется.', example: 'double d = 3.9;\nint n = static_cast<int>(d);  // 3' },
            { id: 'c_cast', name: '(int)x', title: 'Приведение в стиле C', desc: 'Короткая запись. Работает, но static_cast яснее и безопаснее.', example: 'int n = (int)d;' },
            { id: 'implicit_conv', name: 'int → double', title: 'Неявные преобразования', desc: 'В выражении int + double результат double. При присваивании double в int дробь теряется.', example: 'double r = 7 / 2;    // 3.0 — деление целое!\ndouble r2 = 7 / 2.0; // 3.5' },
            { id: 'sizeof', name: 'sizeof', title: 'Размер в байтах', desc: 'Размер типа или переменной. sizeof(int) обычно 4.', example: 'cout << sizeof(long long);  // 8' },
            { id: 'limits', name: 'INT_MAX, numeric_limits', title: 'Границы типов', desc: 'INT_MAX, LLONG_MIN из <climits>; numeric_limits<T>::max() из <limits>.', example: '#include <climits>\nint best = INT_MIN;' },
            { id: 'typedef', name: 'using / typedef', title: 'Псевдоним типа', desc: 'Короткое имя для длинного типа.', example: 'using ll = long long;\ntypedef vector<int> vi;' },
            { id: 'decltype', name: 'decltype', title: 'Тип выражения', desc: 'Возвращает тип выражения, не вычисляя его.', example: 'decltype(a + b) sum = a + b;' }
        ]
    },
    {
        id: 'operators',
        name: 'Операторы',
        color: '#ffb400',
        blurb: 'Арифметика, сравнения, логика, биты.',
        stations: [
            { id: 'arithmetic', name: '+ - * /', title: 'Арифметика', desc: 'Для int деление отбрасывает дробную часть: 7 / 2 == 3.', example: 'int half = total / 2;' },
            { id: 'modulo', name: '%', title: 'Остаток от деления', desc: '7 % 3 == 1. Для отрицательных знак у результата как у делимого: -7 % 3 == -1.', example: 'bool even = n % 2 == 0;\nint last = n % 10;' },
            { id: 'int_division', name: 'целочисленное деление', title: 'Округление вниз и вверх', desc: 'a / b округляет к нулю. Округление вверх: (a + b - 1) / b.', example: 'int boxes = (items + 9) / 10;' },
            { id: 'assignment', name: '=', title: 'Присваивание', desc: 'Не путать с ==. Присваивание тоже выражение: a = b = 0.', example: 'x = y = 0;' },
            { id: 'compound', name: '+= -= *= /= %=', title: 'Составное присваивание', desc: 'x += 3 — то же, что x = x + 3.', example: 'total += price;' },
            { id: 'increment', name: '++ --', title: 'Инкремент и декремент', desc: 'x++ возвращает старое значение, ++x — новое.', example: 'int a = i++;  // a = старое i\nint b = ++i;  // b = новое i' },
            { id: 'comparison', name: '== != < > <= >=', title: 'Сравнение', desc: 'Результат — bool.', example: 'bool adult = age >= 18;' },
            { id: 'logical', name: '&& || !', title: 'И, ИЛИ, НЕ', desc: 'Ленивые: в a && b второе не вычисляется, если a ложно.', example: 'bool ok = age >= 18 && hasLicense;' },
            { id: 'ternary', name: 'a ? b : c', title: 'Тернарный оператор', desc: 'Условие в виде выражения: если a, то b, иначе c.', example: 'int mx = a > b ? a : b;' },
            { id: 'precedence', name: 'приоритет операций', title: 'Порядок вычисления', desc: '* / % выше, чем + -; сравнения ниже арифметики; && выше ||. Скобки решают всё.', example: 'a + b * c    // сначала умножение\n(a + b) * c' },
            { id: 'bitwise', name: '& | ~', title: 'Битовые И, ИЛИ, НЕ', desc: 'Работают с отдельными битами числа. x & 1 — проверка нечётности.', example: 'int flags = 0b0101;\nbool first = flags & 1;' },
            { id: 'xor', name: '^', title: 'Исключающее ИЛИ', desc: 'Бит равен 1, если биты различаются. a ^ a == 0 — отсюда трюки.', example: 'int c = 6 ^ 3;  // 5' },
            { id: 'shifts', name: '<< >>', title: 'Битовые сдвиги', desc: '1 << k — 2 в степени k. x >> 1 — деление на 2.', example: 'int mask = 1 << 3;  // 8\nbool bitK = (x >> k) & 1;' },
            { id: 'bit_tricks', name: 'x & (x - 1)', title: 'Битовые трюки', desc: 'x & (x-1) гасит младший бит; x & -x выделяет его; __builtin_popcount(x) считает единицы.', example: 'bool pow2 = x && !(x & (x - 1));\nint ones = __builtin_popcount(x);' },
            { id: 'comma_op', name: ', (запятая)', title: 'Оператор запятая', desc: 'Вычисляет слева направо, результат — правое. Встречается в for.', example: 'for (int i = 0, j = n - 1; i < j; i++, j--)' },
            { id: 'spaceship', name: '<=>', title: 'Трёхстороннее сравнение', desc: 'C++20. Возвращает меньше/равно/больше одним вызовом.', example: 'auto r = a <=> b;\nif (r < 0) ...' }
        ]
    },
    {
        id: 'control',
        name: 'Ветвления и циклы',
        color: '#2ec4b6',
        blurb: 'Программа начинает принимать решения.',
        stations: [
            { id: 'if', name: 'if', title: 'Условие', desc: 'Выполняет блок, если выражение истинно.', example: 'if (x > 0) {\n    cout << "positive";\n}' },
            { id: 'else', name: 'else', title: 'Иначе', desc: 'Ветка на случай, если условие ложно.', example: 'if (x % 2 == 0) cout << "even";\nelse cout << "odd";' },
            { id: 'else_if', name: 'else if', title: 'Цепочка условий', desc: 'Выполняется только первая истинная ветка.', example: 'if (t < 0) s = "cold";\nelse if (t < 20) s = "cool";\nelse s = "warm";' },
            { id: 'if_init', name: 'if (auto x = f(); x > 0)', title: 'if с инициализацией', desc: 'C++17: переменная живёт только внутри if/else.', example: 'if (auto it = m.find(k); it != m.end())\n    cout << it->second;' },
            { id: 'while', name: 'while', title: 'Цикл с предусловием', desc: 'Повторяет, пока условие истинно. Может не выполниться ни разу.', example: 'while (n > 0) {\n    digits++;\n    n /= 10;\n}' },
            { id: 'for', name: 'for', title: 'Цикл со счётчиком', desc: 'Инициализация; условие; шаг.', example: 'for (int i = 0; i < n; i++)\n    cout << i << " ";' },
            { id: 'for_reverse', name: 'for (i = n-1; i >= 0; i--)', title: 'Цикл в обратную сторону', desc: 'Осторожно с size_t: i >= 0 всегда истинно для беззнаковых.', example: 'for (int i = n - 1; i >= 0; i--)' },
            { id: 'for_step', name: 'for (...; i += 2)', title: 'Цикл с шагом', desc: 'Шаг может быть любым выражением: i += 2, i *= 2, i -= 3.', example: 'for (int p = 1; p <= n; p *= 2)' },
            { id: 'nested_loops', name: 'for { for }', title: 'Вложенные циклы', desc: 'Таблицы, матрицы, пары элементов.', example: 'for (int i = 0; i < n; i++)\n    for (int j = 0; j < m; j++)' },
            { id: 'do_while', name: 'do { } while', title: 'Цикл с постусловием', desc: 'Тело выполняется хотя бы один раз.', example: 'do {\n    cin >> x;\n} while (x != 0);' },
            { id: 'break', name: 'break', title: 'Прервать цикл', desc: 'Выход из ближайшего цикла или switch.', example: 'if (a[i] == target) { pos = i; break; }' },
            { id: 'continue', name: 'continue', title: 'Пропустить итерацию', desc: 'Сразу переходит к следующему шагу цикла.', example: 'if (a[i] < 0) continue;' },
            { id: 'switch', name: 'switch / case', title: 'Выбор по значению', desc: 'Для int, char, enum. Без break выполнение «проваливается» в следующий case.', example: "switch (op) {\n    case '+': r = a + b; break;\n    case '-': r = a - b; break;\n    default:  ok = false;\n}" },
            { id: 'fallthrough', name: 'case без break', title: 'Проваливание в switch', desc: 'Несколько case подряд — «любой из». [[fallthrough]] помечает намеренное.', example: "case 'a': case 'e': case 'o':\n    vowels++; break;" },
            { id: 'range_for', name: 'for (auto x : v)', title: 'Цикл по коллекции', desc: 'Перебирает все элементы. auto& — чтобы менять, const auto& — чтобы не копировать.', example: 'for (const auto& s : words)\n    cout << s << "\\n";' },
            { id: 'infinite_loop', name: 'while (true)', title: 'Бесконечный цикл', desc: 'Выход через break или return. Удобно для меню и «читать, пока не команда».', example: 'while (true) {\n    cin >> cmd;\n    if (cmd == "quit") break;\n}' },
            { id: 'flag_var', name: 'bool found = false;', title: 'Флаг', desc: 'Переменная-признак: выставляется в цикле, проверяется после.', example: 'bool found = false;\nfor (...) if (a[i] == x) found = true;' },
            { id: 'loop_counters', name: 'sum, count, max', title: 'Накопители', desc: 'Сумма, счётчик, максимум — обновляются в цикле. Максимум инициализируют первым элементом или INT_MIN.', example: 'int mx = a[0];\nfor (int i = 1; i < n; i++)\n    if (a[i] > mx) mx = a[i];' },
            { id: 'goto', name: 'goto', title: 'Безусловный переход', desc: 'Существует. Почти всегда есть решение лучше.', example: 'goto done;\n// ...\ndone:;' }
        ]
    },
    {
        id: 'functions',
        name: 'Функции',
        color: '#845ef7',
        blurb: 'Разбиваем программу на части.',
        stations: [
            { id: 'func_decl', name: 'int f(int x) { }', title: 'Своя функция', desc: 'Тип результата, имя, параметры, тело. Объявляется до использования.', example: 'int square(int x) {\n    return x * x;\n}' },
            { id: 'void', name: 'void', title: 'Функция без результата', desc: 'Делает работу, ничего не возвращает.', example: 'void greet(string name) {\n    cout << "Hi, " << name;\n}' },
            { id: 'return_early', name: 'return в середине', title: 'Ранний выход', desc: 'return завершает функцию сразу; удобно для проверок и поиска.', example: 'for (...) if (a[i] == x) return i;\nreturn -1;' },
            { id: 'func_params', name: 'параметры по значению', title: 'Копирование аргументов', desc: 'Функция получает копию. Изменения внутри не видны снаружи.', example: 'void tryChange(int x) { x = 100; }  // снаружи x прежний' },
            { id: 'pass_by_ref', name: 'void f(int& x)', title: 'Параметр по ссылке', desc: 'Функция работает с самой переменной. Так возвращают несколько значений.', example: 'void swap2(int& a, int& b) {\n    int t = a; a = b; b = t;\n}' },
            { id: 'const_ref', name: 'const string& s', title: 'Константная ссылка', desc: 'Без копирования и без права менять. Стандарт для строк и контейнеров.', example: 'int countA(const string& s);' },
            { id: 'prototype', name: 'int f(int);', title: 'Прототип', desc: 'Объявление без тела — чтобы вызывать функцию раньше, чем она определена.', example: 'int gcd(int, int);\nint main() { gcd(4, 6); }\nint gcd(int a, int b) { ... }' },
            { id: 'func_overload', name: 'перегрузка', title: 'Одно имя, разные параметры', desc: 'Компилятор выбирает версию по типам и числу аргументов.', example: 'double area(double r);\ndouble area(double w, double h);' },
            { id: 'default_args', name: 'int f(int x, int y = 1)', title: 'Аргументы по умолчанию', desc: 'Параметр можно не передавать.', example: 'void repeat(string s, int n = 2);' },
            { id: 'recursion', name: 'рекурсия', title: 'Функция вызывает себя', desc: 'Обязателен базовый случай.', example: 'int fact(int n) {\n    return n <= 1 ? 1 : n * fact(n - 1);\n}' },
            { id: 'recursion_memo', name: 'мемоизация', title: 'Запоминание результатов', desc: 'Массив или map с уже вычисленными ответами — рекурсия перестаёт быть экспоненциальной.', example: 'long long memo[100];\nlong long fib(int n) {\n    if (memo[n]) return memo[n];\n    return memo[n] = fib(n-1) + fib(n-2);\n}' },
            { id: 'global_vars', name: 'глобальные переменные', title: 'Переменные вне функций', desc: 'Видны везде, обнуляются автоматически. Удобно для больших массивов; в остальном — осторожно.', example: 'int a[100000];\nint n;\nint main() { ... }' },
            { id: 'static_local', name: 'static в функции', title: 'Статическая переменная', desc: 'Живёт между вызовами, инициализируется один раз.', example: 'int nextId() {\n    static int id = 0;\n    return ++id;\n}' },
            { id: 'lambda', name: '[](int a) { }', title: 'Лямбда', desc: 'Безымянная функция прямо на месте. Часто идёт в sort.', example: 'auto isEven = [](int x) { return x % 2 == 0; };' },
            { id: 'lambda_capture', name: '[x], [&], [=]', title: 'Захват в лямбде', desc: 'В скобках — какие внешние переменные видит лямбда: по значению [x] или по ссылке [&x].', example: 'int k = 3;\nauto addK = [k](int x) { return x + k; };\nauto inc = [&k]() { k++; };' },
            { id: 'std_function', name: 'function<int(int)>', title: 'Функция как значение', desc: 'Из <functional>. Хранит лямбду или указатель на функцию, можно передавать и класть в контейнер.', example: '#include <functional>\nfunction<int(int)> f = [](int x) { return x * 2; };' },
            { id: 'func_ptr', name: 'int (*f)(int)', title: 'Указатель на функцию', desc: 'Адрес функции. Синтаксис страшный, но using спасает.', example: 'using Op = int(*)(int, int);\nOp op = add;\nop(2, 3);' },
            { id: 'inline', name: 'inline', title: 'Встраивание', desc: 'Подсказка компилятору; в современном C++ важнее для определений в заголовках.', example: 'inline int sq(int x) { return x * x; }' },
            { id: 'variadic_template', name: 'template <typename... Args>', title: 'Переменное число аргументов', desc: 'Пакет параметров и fold-выражения (C++17).', example: 'template <typename... T>\nauto sum(T... xs) { return (xs + ...); }' }
        ]
    },
    {
        id: 'arrays',
        name: 'Массивы',
        color: '#f06595',
        blurb: 'Много значений под одним именем.',
        stations: [
            { id: 'c_array', name: 'int a[10];', title: 'Массив', desc: 'Фиксированное число элементов подряд. Индексы от 0 до n-1.', example: 'int a[5] = {3, 1, 4, 1, 5};' },
            { id: 'array_index', name: 'a[i]', title: 'Обращение по индексу', desc: 'Первый элемент a[0], последний a[n-1].', example: 'a[0] = 9;\ncout << a[n - 1];' },
            { id: 'array_bounds', name: 'выход за границы', title: 'Границы массива', desc: 'C++ не проверяет индексы. a[n] — неопределённое поведение.', example: 'for (int i = 0; i < n; i++)  // строго < n' },
            { id: 'array_init', name: 'int a[100] = {};', title: 'Инициализация', desc: '{} обнуляет; без инициализации в локальном массиве мусор.', example: 'int cnt[26] = {};' },
            { id: 'array_fill', name: 'fill, memset', title: 'Заполнение', desc: 'fill(a, a + n, x) — любым значением; memset — только 0 или -1 по байтам.', example: 'fill(a, a + n, -1);\nmemset(a, 0, sizeof a);' },
            { id: 'multidim_array', name: 'int m[3][4];', title: 'Двумерный массив', desc: 'Строки и столбцы. m[i][j] — строка i, столбец j.', example: 'int grid[3][3];\ngrid[1][2] = 7;' },
            { id: 'array_to_func', name: 'void f(int a[], int n)', title: 'Массив в функцию', desc: 'Передаётся адрес, размер надо передавать отдельно. Изменения видны снаружи.', example: 'int sum(int a[], int n) { ... }' },
            { id: 'array_count', name: 'массив счётчиков', title: 'Подсчёт частот', desc: 'cnt[x]++ для каждого элемента — быстрее любого поиска.', example: "int cnt[26] = {};\nfor (char c : s) cnt[c - 'a']++;" },
            { id: 'prefix_sums', name: 'префиксные суммы', title: 'Сумма отрезка за O(1)', desc: 'pre[i] = сумма первых i элементов; сумма [l, r] = pre[r+1] - pre[l].', example: 'pre[0] = 0;\nfor (int i = 0; i < n; i++) pre[i + 1] = pre[i] + a[i];' },
            { id: 'two_pointers', name: 'два указателя', title: 'Два индекса навстречу', desc: 'i слева, j справа — разворот, палиндром, пара под сумму в отсортированном.', example: 'int i = 0, j = n - 1;\nwhile (i < j) { swap(a[i++], a[j--]); }' },
            { id: 'sliding_window', name: 'скользящее окно', title: 'Окно фиксированной длины', desc: 'Сумма окна: прибавить новый элемент, вычесть выбывший.', example: 's += a[i] - a[i - k];' },
            { id: 'std_array', name: 'array<int, N>', title: 'std::array', desc: 'Массив, который знает свой размер и дружит с алгоритмами.', example: 'array<int, 3> a = {1, 2, 3};\na.size();' }
        ]
    },
    {
        id: 'strings',
        name: 'Строки',
        color: '#e64980',
        blurb: 'Текст: длина, символы, поиск, разбор.',
        stations: [
            { id: 'string_size', name: 's.size()', title: 'Длина строки', desc: 'size() и length() — одно и то же. Тип результата — size_t.', example: 'int n = s.size();' },
            { id: 'string_index', name: 's[i]', title: 'Символ по индексу', desc: 'Даёт char; его можно и читать, и менять.', example: "s[0] = toupper(s[0]);" },
            { id: 'string_concat', name: 's1 + s2', title: 'Склейка', desc: '+ создаёт новую строку, += дописывает.', example: 'string full = first + " " + last;' },
            { id: 'string_compare', name: 's1 == s2, s1 < s2', title: 'Сравнение строк', desc: 'Сравниваются лексикографически, как в словаре (с учётом регистра).', example: 'if (a < b) cout << a;' },
            { id: 'substr', name: 's.substr(pos, len)', title: 'Подстрока', desc: 'len можно опустить — до конца.', example: 's.substr(1, 3);\ns.substr(5);' },
            { id: 'string_find', name: 's.find("x")', title: 'Поиск', desc: 'Возвращает индекс или string::npos, если не нашлось.', example: 'if (s.find("cat") != string::npos)' },
            { id: 'string_modify', name: 'push_back, insert, erase', title: 'Изменение строки', desc: 'push_back добавляет символ; insert(pos, str); erase(pos, len); pop_back.', example: 's.erase(0, 2);\ns.insert(1, "--");' },
            { id: 'string_ctor', name: 'string(n, \'x\')', title: 'Строка из повторов', desc: 'Конструктор: n копий символа.', example: 'string bar(10, \'#\');' },
            { id: 'cctype', name: 'isdigit, isalpha, toupper', title: 'Функции символов', desc: 'Из <cctype>: isdigit, isalpha, isalnum, isupper, islower, isspace, toupper, tolower.', example: 'if (isdigit(c)) digits++;\nc = toupper(c);' },
            { id: 'string_conv', name: 'stoi, to_string', title: 'Строка и число', desc: 'stoi/stoll/stod парсят число; to_string делает строку из числа.', example: 'int n = stoi("42");\nstring s = to_string(3.5);' },
            { id: 'string_reverse', name: 'reverse(s.begin(), s.end())', title: 'Разворот строки', desc: 'Меняет строку на месте.', example: 'reverse(s.begin(), s.end());' },
            { id: 'stringstream', name: 'stringstream', title: 'Поток из строки', desc: 'Из <sstream>. Разбор строки как cin или сборка как cout.', example: 'stringstream ss(line);\nstring word;\nwhile (ss >> word) count++;' },
            { id: 'split_by_delim', name: 'getline(ss, part, \',\')', title: 'Разбиение по разделителю', desc: 'getline с третьим аргументом читает до нужного символа.', example: 'while (getline(ss, part, \',\'))\n    parts.push_back(part);' },
            { id: 'c_string', name: 'char s[100]', title: 'C-строка', desc: 'Массив char с нулём в конце. strlen, strcmp, strcpy из <cstring>.', example: 'char w[100];\ncin >> w;\nint n = strlen(w);' },
            { id: 'string_view', name: 'string_view', title: 'Взгляд на строку', desc: 'C++17. Ссылка на кусок строки без копирования.', example: 'string_view sv = s;\nsv.remove_prefix(2);' },
            { id: 'raw_string', name: 'R"(...)"', title: 'Сырая строка', desc: 'Внутри не работают экранирования — удобно для путей и регулярок.', example: 'string path = R"(C:\\dir\\file)";' },
            { id: 'escapes', name: '\\n \\t \\" \\\\', title: 'Экранированные символы', desc: 'Перенос строки, табуляция, кавычка, обратный слеш внутри строк.', example: 'cout << "He said \\"hi\\"\\n";' }
        ]
    },
    {
        id: 'pointers',
        name: 'Указатели и ссылки',
        color: '#ff922b',
        blurb: 'Звёздочки и амперсанды без страха.',
        stations: [
            { id: 'address_of', name: '&x', title: 'Адрес переменной', desc: 'Оператор & перед переменной даёт её адрес в памяти.', example: 'int x = 10;\ncout << &x;' },
            { id: 'pointer_decl', name: 'int* p', title: 'Указатель', desc: 'Переменная, хранящая адрес.', example: 'int* p = &x;' },
            { id: 'dereference', name: '*p', title: 'Разыменование', desc: 'Значение по адресу.', example: '*p = 20;  // x == 20' },
            { id: 'reference', name: 'int& r = x;', title: 'Ссылка', desc: 'Второе имя переменной. Инициализируется один раз, перенацелить нельзя.', example: 'int& r = x;\nr++;  // x == 6' },
            { id: 'ampersand_roles', name: '& — три роли', title: 'Амперсанд', desc: 'int& r — ссылка; &x — адрес; a & b — битовое И.', example: 'int& ref = x;\nint* p = &x;\nint m = a & b;' },
            { id: 'asterisk_roles', name: '* — три роли', title: 'Звёздочка', desc: 'int* p — указатель; *p — значение; a * b — умножение.', example: 'int* p = &x;\nint v = *p * 2;' },
            { id: 'nullptr', name: 'nullptr', title: 'Пустой указатель', desc: 'Указатель «в никуда». Проверяйте перед разыменованием.', example: 'if (p != nullptr) cout << *p;' },
            { id: 'pointer_arith', name: 'p + 1, p[i]', title: 'Арифметика указателей', desc: 'p + 1 — адрес следующего элемента. Имя массива — указатель на первый.', example: 'int* p = a;\ncout << *(p + 2);  // a[2]' },
            { id: 'pass_by_ptr', name: 'void f(int* p)', title: 'Параметр-указатель', desc: 'Функция меняет оригинал через адрес. В отличие от ссылки, может быть nullptr.', example: 'void inc(int* p) { (*p)++; }\ninc(&x);' },
            { id: 'const_ptr', name: 'const int* / int* const', title: 'const и указатели', desc: 'const int* — нельзя менять значение; int* const — нельзя менять указатель.', example: 'const int* p = &x;  // *p = 1 — ошибка' },
            { id: 'new_delete', name: 'new / delete', title: 'Динамическая память', desc: 'Каждому new — свой delete; массиву — delete[].', example: 'int* a = new int[n];\ndelete[] a;' },
            { id: 'dangling', name: 'висячий указатель', title: 'Указатель на удалённое', desc: 'После delete указатель хранит старый адрес. Обнуляйте его.', example: 'delete p;\np = nullptr;' },
            { id: 'pointer_to_pointer', name: 'int** pp', title: 'Указатель на указатель', desc: 'Динамическая матрица, изменение указателя в функции.', example: 'int** m = new int*[rows];\nfor (int i = 0; i < rows; i++) m[i] = new int[cols];' },
            { id: 'linked_node', name: 'struct Node { Node* next; }', title: 'Связный узел', desc: 'Структура ссылается на такую же. Основа списков и деревьев.', example: 'struct Node { int val; Node* next; };' },
            { id: 'unique_ptr', name: 'unique_ptr', title: 'Единственный владелец', desc: 'Из <memory>. Сам удаляет объект. Копировать нельзя, перемещать — можно.', example: 'auto p = make_unique<int>(42);' },
            { id: 'shared_ptr', name: 'shared_ptr', title: 'Общий владелец', desc: 'Считает ссылки; объект удаляется, когда владельцев не останется.', example: 'auto a = make_shared<Node>();\nauto b = a;  // use_count() == 2' },
            { id: 'rvalue_ref', name: 'T&&', title: 'Rvalue-ссылка', desc: 'Ссылка на временный объект. Основа перемещения.', example: 'void take(vector<int>&& v);' }
        ]
    },
    {
        id: 'structs',
        name: 'Структуры и перечисления',
        color: '#20c997',
        blurb: 'Свои типы из нескольких полей.',
        stations: [
            { id: 'struct', name: 'struct', title: 'Структура', desc: 'Тип из нескольких полей. Всё публично по умолчанию.', example: 'struct Point {\n    int x, y;\n};' },
            { id: 'dot', name: 'p.x', title: 'Доступ к полю', desc: 'Точка — поле или метод объекта.', example: 'cout << p.x << " " << p.y;' },
            { id: 'aggregate_init', name: 'Point p{3, 4};', title: 'Инициализация списком', desc: 'Поля заполняются по порядку. Пропущенные обнуляются.', example: 'Point p{3, 4};\nPoint q = {1, 2};' },
            { id: 'designated_init', name: 'Point{.x = 1, .y = 2}', title: 'Именованная инициализация', desc: 'C++20: явно указываем, какое поле заполняем.', example: 'Config c{.width = 80, .height = 24};' },
            { id: 'struct_array', name: 'vector<Point>', title: 'Массив структур', desc: 'Таблица записей: сортировка по полю, поиск по имени.', example: 'vector<Student> v(n);\ncin >> v[i].name >> v[i].grade;' },
            { id: 'struct_method', name: 'метод в struct', title: 'Функция внутри структуры', desc: 'Метод видит поля напрямую.', example: 'struct Rect {\n    int w, h;\n    int area() const { return w * h; }\n};' },
            { id: 'arrow', name: 'p->x', title: 'Поле через указатель', desc: 'p->x — то же, что (*p).x.', example: 'Point* ptr = &p;\nptr->x = 10;' },
            { id: 'nested_struct', name: 'struct внутри struct', title: 'Вложенные структуры', desc: 'Поле само является структурой: order.customer.name.', example: 'struct Line { Point a, b; };' },
            { id: 'enum', name: 'enum', title: 'Перечисление', desc: 'Набор именованных целых констант, начиная с 0.', example: 'enum Color { RED, GREEN, BLUE };' },
            { id: 'enum_class', name: 'enum class', title: 'Строгое перечисление', desc: 'Не превращается в int неявно, имена не засоряют область видимости.', example: 'enum class Dir { Up, Down };\nDir d = Dir::Up;' },
            { id: 'enum_to_int', name: 'static_cast<int>(e)', title: 'enum и число', desc: 'enum class требует явного приведения в обе стороны.', example: 'int i = static_cast<int>(d);\nDir d2 = static_cast<Dir>((i + 1) % 4);' },
            { id: 'union', name: 'union', title: 'Объединение', desc: 'Все поля делят одну память.', example: 'union Data { int i; float f; };' },
            { id: 'pair', name: 'pair<int, int>', title: 'Пара', desc: 'Два значения: first и second. Сравниваются лексикографически.', example: 'pair<string, int> p{"Ada", 36};\ncout << p.first;' },
            { id: 'tuple', name: 'tuple<int, string, double>', title: 'Кортеж', desc: 'Несколько значений разных типов. get<0>(t) или структурные привязки.', example: 'tuple<int, string> t{1, "a"};\ncout << get<1>(t);' },
            { id: 'structured_bindings', name: 'auto [a, b] = p;', title: 'Структурные привязки', desc: 'C++17. Распаковка pair, tuple, struct в отдельные имена.', example: 'for (auto& [key, val] : m)\n    cout << key << " " << val;' }
        ]
    },
    {
        id: 'oop',
        name: 'Классы и ООП',
        color: '#5c7cfa',
        blurb: 'Инкапсуляция, наследование, полиморфизм.',
        stations: [
            { id: 'class', name: 'class', title: 'Класс', desc: 'Как struct, но всё приватное по умолчанию.', example: 'class Counter {\n    int value = 0;\npublic:\n    void inc() { value++; }\n};' },
            { id: 'public_private', name: 'public / private / protected', title: 'Доступ', desc: 'public — всем; private — только методам класса; protected — ещё наследникам.', example: 'class A {\nprivate:\n    int secret;\npublic:\n    int open;\n};' },
            { id: 'getter_setter', name: 'get / set', title: 'Геттеры и сеттеры', desc: 'Поле закрыто, доступ через методы — можно проверять значения.', example: 'int balance() const { return b; }\nvoid setB(int x) { if (x >= 0) b = x; }' },
            { id: 'constructor', name: 'Name(...) { }', title: 'Конструктор', desc: 'Вызывается при создании объекта.', example: 'Account(int start) { balance = start; }' },
            { id: 'init_list', name: ': field(value)', title: 'Список инициализации', desc: 'Инициализирует поля до тела конструктора. Обязателен для const и ссылок.', example: 'Account(int s) : balance(s), id(++count) {}' },
            { id: 'default_ctor', name: 'Name() = default;', title: 'Конструктор по умолчанию', desc: 'Без параметров. Если написан любой другой — этот надо объявить явно.', example: 'Point() = default;\nPoint(int x, int y) : x(x), y(y) {}' },
            { id: 'member_init', name: 'int count = 0;', title: 'Инициализация поля в классе', desc: 'Значение по умолчанию прямо при объявлении поля.', example: 'class C {\n    int n = 0;\n    string name = "none";\n};' },
            { id: 'destructor', name: '~Name()', title: 'Деструктор', desc: 'Вызывается при уничтожении. Объекты уничтожаются в обратном порядке.', example: '~File() { close(); }' },
            { id: 'this', name: 'this', title: 'Указатель на себя', desc: 'Адрес текущего объекта. Спасает, когда параметр перекрывает поле.', example: 'void setX(int x) { this->x = x; }' },
            { id: 'const_method', name: 'int get() const', title: 'Константный метод', desc: 'Обещает не менять объект. Только такие можно звать у const-объектов.', example: 'int size() const { return n; }' },
            { id: 'static_member', name: 'static в классе', title: 'Общие для всех объектов', desc: 'Одно поле на класс, не на объект. Определяется вне класса.', example: 'class User {\npublic:\n    static int count;\n};\nint User::count = 0;' },
            { id: 'copy_ctor', name: 'Name(const Name&)', title: 'Копирующий конструктор', desc: 'Вызывается при копировании. Нужен свой, если класс владеет ресурсом.', example: 'Buffer(const Buffer& o) : n(o.n), d(new int[o.n]) { copy(...); }' },
            { id: 'copy_assign', name: 'operator=', title: 'Оператор присваивания', desc: 'a = b для существующего объекта. Правило трёх: вместе с копирующим конструктором и деструктором.', example: 'Buffer& operator=(const Buffer& o);' },
            { id: 'delete_default', name: '= delete / = default', title: 'Запрет и генерация', desc: '= delete запрещает операцию (например, копирование); = default просит компилятор сгенерировать.', example: 'Lock(const Lock&) = delete;\nLock() = default;' },
            { id: 'inheritance', name: 'class B : public A', title: 'Наследование', desc: 'Наследник получает поля и методы базового класса.', example: 'class Dog : public Animal { };' },
            { id: 'base_ctor', name: 'B() : A(args)', title: 'Вызов конструктора базы', desc: 'Наследник передаёт аргументы базовому классу в списке инициализации.', example: 'Square(double a) : Rect(a, a) {}' },
            { id: 'virtual', name: 'virtual', title: 'Виртуальный метод', desc: 'Вызов через указатель на базу идёт к реальному типу объекта.', example: 'virtual double area() const { return 0; }' },
            { id: 'override', name: 'override', title: 'Переопределение', desc: 'Помечает метод как переопределяющий; компилятор проверит сигнатуру.', example: 'double area() const override { return w * h; }' },
            { id: 'abstract', name: '= 0', title: 'Абстрактный класс', desc: 'Чисто виртуальный метод. Такой класс нельзя создать, только наследовать.', example: 'virtual double area() const = 0;' },
            { id: 'virtual_dtor', name: 'virtual ~Base()', title: 'Виртуальный деструктор', desc: 'Обязателен, если удаляете наследника через указатель на базу.', example: 'virtual ~Shape() {}' },
            { id: 'polymorphism', name: 'vector<unique_ptr<Base>>', title: 'Полиморфный контейнер', desc: 'Разные наследники в одном списке; вызов виртуального метода для каждого.', example: 'for (auto& s : shapes) total += s->area();' },
            { id: 'dynamic_cast', name: 'dynamic_cast', title: 'Проверка типа в иерархии', desc: 'Вернёт nullptr, если объект не того типа.', example: 'if (auto* c = dynamic_cast<Circle*>(s.get()))' },
            { id: 'operator_overload', name: 'operator+', title: 'Перегрузка операторов', desc: 'Свои типы складываются и сравниваются «как числа».', example: 'Vec operator+(const Vec& o) const {\n    return {x + o.x, y + o.y};\n}' },
            { id: 'operator_stream', name: 'operator<<', title: 'Вывод своего типа', desc: 'Свободная или friend-функция, принимающая ostream&.', example: 'ostream& operator<<(ostream& os, const Vec& v) {\n    return os << v.x << " " << v.y;\n}' },
            { id: 'operator_compare', name: 'operator< / ==', title: 'Сравнение своих типов', desc: 'Нужны для sort, set, map.', example: 'bool operator<(const P& o) const { return x < o.x; }' },
            { id: 'operator_index', name: 'operator[]', title: 'Индексация своего типа', desc: 'obj[i] для своих контейнеров.', example: 'int& operator[](int i) { return data[i]; }' },
            { id: 'friend', name: 'friend', title: 'Дружественная функция', desc: 'Получает доступ к приватным членам.', example: 'friend ostream& operator<<(ostream&, const Vec&);' },
            { id: 'explicit', name: 'explicit', title: 'Запрет неявного создания', desc: 'Конструктор с одним аргументом не будет срабатывать сам по себе.', example: 'explicit Meters(double v);' },
            { id: 'raii', name: 'RAII', title: 'Ресурс живёт с объектом', desc: 'Захват в конструкторе, освобождение в деструкторе. Файлы, блокировки, память.', example: 'struct Timer {\n    Timer() { start(); }\n    ~Timer() { report(); }\n};' }
        ]
    },
    {
        id: 'stl',
        name: 'Контейнеры',
        color: '#7950f2',
        blurb: 'Готовые структуры данных.',
        stations: [
            { id: 'vector', name: 'vector<int>', title: 'Динамический массив', desc: 'Растёт сам. Главный контейнер C++.', example: 'vector<int> v = {1, 2, 3};\nv.push_back(4);' },
            { id: 'vector_size_init', name: 'vector<int> v(n, 0)', title: 'Вектор заданного размера', desc: 'n элементов со значением 0. Затем можно читать в цикле.', example: 'vector<int> v(n);\nfor (auto& x : v) cin >> x;' },
            { id: 'vector_methods', name: 'push_back, pop_back, back', title: 'Методы вектора', desc: 'size, empty, push_back, pop_back, back, front, clear.', example: 'v.push_back(7);\nint last = v.back();\nv.pop_back();' },
            { id: 'vector_insert_erase', name: 'insert, erase', title: 'Вставка и удаление в середине', desc: 'По итератору. O(n) — сдвигаются элементы.', example: 'v.erase(v.begin() + i);\nv.insert(v.begin(), 0);' },
            { id: 'vector_2d', name: 'vector<vector<int>>', title: 'Двумерный вектор', desc: 'Матрица переменного размера.', example: 'vector<vector<int>> g(n, vector<int>(m, 0));' },
            { id: 'vector_resize', name: 'resize, reserve', title: 'Управление размером', desc: 'resize меняет число элементов; reserve только выделяет память заранее.', example: 'v.reserve(1000000);\nv.resize(n);' },
            { id: 'iterators', name: 'begin(), end()', title: 'Итераторы', desc: 'Обобщённые указатели на элементы. Полуинтервал [begin, end).', example: 'for (auto it = v.begin(); it != v.end(); ++it)\n    cout << *it;' },
            { id: 'map', name: 'map<K, V>', title: 'Словарь (упорядоченный)', desc: 'Ключи отсортированы. m[key] создаёт элемент, если его нет.', example: 'map<string, int> freq;\nfreq["apple"]++;' },
            { id: 'map_find', name: 'm.find, m.count', title: 'Проверка ключа', desc: 'count(k) — есть ли; find(k) — итератор или end(). Не создают элемент.', example: 'if (m.count(k)) cout << m[k];' },
            { id: 'map_iterate', name: 'for (auto& [k, v] : m)', title: 'Обход словаря', desc: 'Элементы идут по возрастанию ключа.', example: 'for (auto& [word, cnt] : freq)\n    cout << word << " " << cnt;' },
            { id: 'unordered_map', name: 'unordered_map', title: 'Хеш-таблица', desc: 'Как map, но без порядка и в среднем за O(1).', example: 'unordered_map<int, int> pos;' },
            { id: 'set', name: 'set<int>', title: 'Множество', desc: 'Уникальные отсортированные элементы.', example: 'set<int> s;\ns.insert(5);\nbool has = s.count(5);' },
            { id: 'multiset', name: 'multiset', title: 'Множество с повторами', desc: 'Как set, но элементы могут повторяться. erase(s.find(x)) удаляет один.', example: 'multiset<int> ms;\nms.erase(ms.find(x));' },
            { id: 'unordered_set', name: 'unordered_set', title: 'Хеш-множество', desc: 'Проверка «видели ли уже» за O(1).', example: 'unordered_set<string> seen;' },
            { id: 'stack', name: 'stack', title: 'Стек', desc: 'LIFO: push, pop, top. Скобки, откаты.', example: 'stack<char> st;\nst.push(\'(\');\nst.pop();' },
            { id: 'queue', name: 'queue', title: 'Очередь', desc: 'FIFO: push, pop, front. Обход в ширину, симуляции.', example: 'queue<int> q;\nq.push(1);\nq.pop();' },
            { id: 'deque', name: 'deque', title: 'Двусторонняя очередь', desc: 'push_front и push_back за O(1).', example: 'deque<int> d;\nd.push_front(1);' },
            { id: 'priority_queue', name: 'priority_queue', title: 'Куча', desc: 'Всегда отдаёт максимум. Для минимума — greater<int>.', example: 'priority_queue<int, vector<int>, greater<int>> pq;' },
            { id: 'list', name: 'list', title: 'Двусвязный список', desc: 'Вставка и удаление где угодно за O(1), но без индексов.', example: 'list<int> l;\nl.push_front(1);' },
            { id: 'bitset', name: 'bitset<N>', title: 'Набор битов', desc: 'Фиксированное число бит с удобными операциями и выводом.', example: 'bitset<8> b(5);\ncout << b;  // 00000101' },
            { id: 'optional', name: 'optional<T>', title: 'Значение или ничего', desc: 'C++17. Честный «результата может не быть» без магических -1.', example: 'optional<int> r = find(5);\nif (r) cout << *r;' },
            { id: 'variant', name: 'variant<int, string>', title: 'Одно из нескольких', desc: 'Типобезопасный union; помнит, что хранит.', example: 'variant<int, string> v = "hi";\nif (holds_alternative<string>(v)) ...' },
            { id: 'emplace', name: 'emplace_back', title: 'Создание на месте', desc: 'Конструирует элемент прямо в контейнере без лишней копии.', example: 'v.emplace_back(1, 2);  // vector<pair<int,int>>' }
        ]
    },
    {
        id: 'algorithms',
        name: 'Алгоритмы',
        color: '#0ca678',
        blurb: 'Не пишите циклы, которые уже написаны за вас.',
        stations: [
            { id: 'sort', name: 'sort', title: 'Сортировка', desc: 'O(n log n). По возрастанию.', example: 'sort(v.begin(), v.end());' },
            { id: 'sort_comparator', name: 'sort(..., cmp)', title: 'Сортировка со своим правилом', desc: 'Третий аргумент — функция или лямбда «a должен стоять раньше b».', example: 'sort(v.begin(), v.end(), [](int a, int b) { return a > b; });' },
            { id: 'sort_greater', name: 'greater<int>()', title: 'Сортировка по убыванию', desc: 'Готовый компаратор или rbegin/rend.', example: 'sort(v.rbegin(), v.rend());' },
            { id: 'stable_sort', name: 'stable_sort', title: 'Устойчивая сортировка', desc: 'Сохраняет порядок равных элементов.', example: 'stable_sort(v.begin(), v.end(), byGrade);' },
            { id: 'reverse', name: 'reverse', title: 'Разворот', desc: 'На месте.', example: 'reverse(v.begin(), v.end());' },
            { id: 'min_max', name: 'min, max', title: 'Минимум и максимум двух', desc: 'min({a, b, c}) — для нескольких.', example: 'int m = max(a, b);\nint t = min({a, b, c});' },
            { id: 'min_max_element', name: 'min_element, max_element', title: 'Экстремум в диапазоне', desc: 'Возвращает итератор; индекс — it - v.begin().', example: 'auto it = max_element(v.begin(), v.end());\nint idx = it - v.begin();' },
            { id: 'swap_func', name: 'swap', title: 'Обмен', desc: 'Меняет местами два значения.', example: 'swap(a[i], a[j]);' },
            { id: 'find_algo', name: 'find', title: 'Поиск элемента', desc: 'Итератор на первый найденный или end().', example: 'auto it = find(v.begin(), v.end(), 7);' },
            { id: 'find_if', name: 'find_if', title: 'Поиск по условию', desc: 'Первый элемент, для которого лямбда вернула true.', example: 'find_if(v.begin(), v.end(), [](int x) { return x < 0; });' },
            { id: 'count_algo', name: 'count, count_if', title: 'Подсчёт', desc: 'Сколько равны значению или подходят под условие.', example: 'int evens = count_if(v.begin(), v.end(), [](int x) { return x % 2 == 0; });' },
            { id: 'accumulate', name: 'accumulate', title: 'Сумма диапазона', desc: 'Из <numeric>. Начальное значение задаёт тип: 0LL для long long.', example: 'long long s = accumulate(v.begin(), v.end(), 0LL);' },
            { id: 'binary_search', name: 'lower_bound, upper_bound', title: 'Бинарный поиск', desc: 'На отсортированном. lower_bound — первый >= x; upper_bound — первый > x.', example: 'auto it = lower_bound(v.begin(), v.end(), x);' },
            { id: 'binary_search_bool', name: 'binary_search', title: 'Есть ли элемент', desc: 'true/false за O(log n) на отсортированном.', example: 'if (binary_search(v.begin(), v.end(), x))' },
            { id: 'unique', name: 'unique', title: 'Удаление соседних дубликатов', desc: 'После sort и вместе с erase.', example: 'v.erase(unique(v.begin(), v.end()), v.end());' },
            { id: 'fill_iota', name: 'fill, iota', title: 'Заполнение', desc: 'fill — одним значением; iota — 0, 1, 2, ...', example: 'iota(v.begin(), v.end(), 1);  // 1..n' },
            { id: 'copy_transform', name: 'copy, transform', title: 'Копирование и преобразование', desc: 'transform применяет функцию к каждому элементу.', example: 'transform(s.begin(), s.end(), s.begin(), ::toupper);' },
            { id: 'copy_if_remove_if', name: 'copy_if, remove_if', title: 'Фильтрация', desc: 'copy_if — в новый контейнер; remove_if + erase — на месте.', example: 'v.erase(remove_if(v.begin(), v.end(), isNeg), v.end());' },
            { id: 'all_any_none', name: 'all_of, any_of, none_of', title: 'Проверки на всех', desc: 'Все / хоть один / никто не удовлетворяет условию.', example: 'bool ok = all_of(v.begin(), v.end(), [](int x) { return x > 0; });' },
            { id: 'next_permutation', name: 'next_permutation', title: 'Следующая перестановка', desc: 'Перебор всех перестановок в лексикографическом порядке.', example: 'do { ... } while (next_permutation(v.begin(), v.end()));' },
            { id: 'partial_sum', name: 'partial_sum', title: 'Префиксные суммы алгоритмом', desc: 'Из <numeric>.', example: 'partial_sum(v.begin(), v.end(), pre.begin());' },
            { id: 'gcd_lcm_std', name: 'gcd, lcm', title: 'НОД и НОК', desc: 'C++17, из <numeric>.', example: 'int g = gcd(12, 18);  // 6' },
            { id: 'cmath', name: 'sqrt, pow, abs, floor', title: 'Математические функции', desc: 'Из <cmath>: sqrt, pow, abs, fabs, floor, ceil, round, log, sin.', example: 'double d = sqrt(a * a + b * b);\nint r = round(x);' },
            { id: 'random', name: 'mt19937, uniform_int_distribution', title: 'Случайные числа', desc: 'Из <random>. rand() устарел.', example: 'mt19937 rng(42);\nuniform_int_distribution<int> d(1, 6);\nint roll = d(rng);' },
            { id: 'ranges', name: 'ranges::sort(v)', title: 'Ranges', desc: 'C++20: алгоритмы принимают контейнер целиком, а не пару итераторов.', example: 'ranges::sort(v);\nauto it = ranges::find(v, 7);' }
        ]
    },
    {
        id: 'advanced',
        name: 'Шаблоны, исключения, файлы',
        color: '#868e96',
        blurb: 'Инструменты для больших программ.',
        stations: [
            { id: 'template', name: 'template <typename T>', title: 'Шаблон функции', desc: 'Одна функция для разных типов. Код генерируется при подстановке.', example: 'template <typename T>\nT maxOf(T a, T b) { return a > b ? a : b; }' },
            { id: 'template_class', name: 'template class', title: 'Шаблон класса', desc: 'Свой контейнер для любого типа: Stack<int>, Stack<string>.', example: 'template <typename T>\nclass Stack { vector<T> d; ... };' },
            { id: 'template_params', name: 'template <int N>', title: 'Числовой параметр шаблона', desc: 'Константа как параметр: array<int, N>, bitset<N>.', example: 'template <int N>\nstruct Buf { int d[N]; };' },
            { id: 'concepts', name: 'concept, requires', title: 'Концепты', desc: 'C++20: ограничения на типы шаблона с понятными ошибками.', example: 'template <typename T>\nrequires integral<T>\nT twice(T x) { return x * 2; }' },
            { id: 'constexpr_if', name: 'if constexpr', title: 'Условие времени компиляции', desc: 'Ветка выбирается при компиляции по типу.', example: 'if constexpr (is_integral_v<T>) ...' },
            { id: 'namespace', name: 'namespace', title: 'Пространство имён', desc: 'Группирует имена и предотвращает конфликты.', example: 'namespace geo {\n    double dist(...);\n}\ngeo::dist(3, 4);' },
            { id: 'scope', name: '::', title: 'Оператор области видимости', desc: 'std::cout — из пространства std; Class::method; ::x — глобальная.', example: 'std::string s;\nint User::count = 0;' },
            { id: 'using_namespace', name: 'using namespace std;', title: 'Подключение пространства', desc: 'Позволяет писать cout вместо std::cout. Нежелательно в заголовках.', example: 'using namespace std;' },
            { id: 'try_catch', name: 'try / catch', title: 'Перехват исключения', desc: 'Ошибка, выброшенная внутри try, ловится в catch.', example: 'try {\n    int n = stoi(s);\n} catch (const exception& e) {\n    cout << "bad";\n}' },
            { id: 'throw', name: 'throw', title: 'Выброс исключения', desc: 'Прерывает выполнение и ищет подходящий catch выше по стеку.', example: 'if (b == 0) throw runtime_error("div by zero");' },
            { id: 'exception_types', name: 'invalid_argument, out_of_range', title: 'Стандартные исключения', desc: 'Из <stdexcept>: runtime_error, logic_error, invalid_argument, out_of_range. e.what() — сообщение.', example: 'catch (const out_of_range& e) { cout << e.what(); }' },
            { id: 'file_read', name: 'ifstream', title: 'Чтение файла', desc: 'Работает как cin. Проверяйте, открылся ли.', example: 'ifstream in("data.txt");\nwhile (in >> x) ...' },
            { id: 'file_write', name: 'ofstream', title: 'Запись в файл', desc: 'Работает как cout.', example: 'ofstream out("out.txt");\nout << 42;' },
            { id: 'move', name: 'std::move', title: 'Перемещение', desc: 'Забирает ресурсы у объекта вместо копирования; источник пустеет.', example: 'vector<int> b = move(a);' },
            { id: 'move_ctor', name: 'Name(Name&&)', title: 'Перемещающий конструктор', desc: 'Забирает указатель и обнуляет источник. Правило пяти.', example: 'Buffer(Buffer&& o) : d(o.d), n(o.n) { o.d = nullptr; }' },
            { id: 'define', name: '#define', title: 'Макрос', desc: 'Текстовая замена до компиляции. Для констант лучше constexpr.', example: '#define MAXN 100005' },
            { id: 'ifdef', name: '#ifdef / #endif', title: 'Условная компиляция', desc: 'Код включается только при определённом макросе. Отладочный вывод.', example: '#ifdef DEBUG\n    cerr << x;\n#endif' },
            { id: 'assert', name: 'assert', title: 'Проверка предположения', desc: 'Из <cassert>. Падает с сообщением, если условие ложно.', example: 'assert(n > 0);' },
            { id: 'chrono', name: 'chrono', title: 'Измерение времени', desc: 'steady_clock::now() до и после.', example: 'auto t0 = chrono::steady_clock::now();' },
            { id: 'multithreading', name: 'thread, mutex', title: 'Потоки', desc: 'std::thread запускает функцию параллельно; mutex защищает общие данные.', example: 'thread t(work);\nt.join();' }
        ]
    },
    {
        id: 'symbols',
        name: 'Знаки препинания',
        color: '#ff8787',
        blurb: 'Закорючки, которые пугают в первый месяц.',
        stations: [
            { id: 'semicolon', name: ';', title: 'Точка с запятой', desc: 'Завершает инструкцию. После } функции или if не нужна; после struct/class — нужна.', example: 'int x = 5;\nstruct P { int a; };' },
            { id: 'braces', name: '{ }', title: 'Фигурные скобки', desc: 'Блок кода, тело функции, список значений.', example: 'if (ok) {\n    // блок\n}\nint a[] = {1, 2, 3};' },
            { id: 'block_scope', name: 'область видимости', title: 'Где живёт переменная', desc: 'Переменная видна от объявления до конца своего блока {}.', example: 'for (int i = 0; ...) { }\n// здесь i уже нет' },
            { id: 'parens', name: '( )', title: 'Круглые скобки', desc: 'Вызов функции, условие, группировка.', example: 'int r = (a + b) * c;' },
            { id: 'brackets', name: '[ ]', title: 'Квадратные скобки', desc: 'Индекс, объявление массива, захват лямбды.', example: 'a[0] = 1;\nauto f = [x](int y) { return x + y; };' },
            { id: 'angle_brackets', name: '< >', title: 'Угловые скобки', desc: 'Параметры шаблона: vector<int>. А ещё сравнения и #include.', example: 'vector<pair<int, int>> edges;' },
            { id: 'quotes', name: '"..." и \'x\'', title: 'Кавычки', desc: 'Двойные — строка; одинарные — один символ char.', example: 'string s = "a";\nchar c = \'a\';' },
            { id: 'hash', name: '#', title: 'Директива препроцессора', desc: '#include, #define, #ifdef обрабатываются до компиляции.', example: '#include <vector>' },
            { id: 'bits_header', name: '<bits/stdc++.h>', title: 'Все заголовки разом', desc: 'Нестандартный заголовок GCC; удобен на олимпиадах, плох в проектах.', example: '#include <bits/stdc++.h>' },
            { id: 'comments', name: '// и /* */', title: 'Комментарии', desc: 'Игнорируются компилятором.', example: '// однострочный\n/* многострочный */' },
            { id: 'ellipsis', name: '...', title: 'Многоточие', desc: 'Пакет параметров в шаблонах.', example: 'template <typename... Args>' },
            { id: 'attributes', name: '[[nodiscard]], [[maybe_unused]]', title: 'Атрибуты', desc: 'Подсказки компилятору о намерениях.', example: '[[nodiscard]] int compute();' }
        ]
    }
];

/* Плоский индекс: id -> станция с цветом и линией */
var STATIONS = {};
var STATION_ORDER = [];
ROUTE.forEach((line, li) => {
    line.stations.forEach((st, si) => {
        STATIONS[st.id] = { ...st, line: line.id, lineName: line.name, color: line.color, order: li * 100 + si };
        STATION_ORDER.push(st.id);
    });
});
