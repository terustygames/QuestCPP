/* ============================================
   KEYWORDS DATABASE — C++ Quest
   Полный список синтаксических элементов C++
   в порядке изучения среднестатистического человека
   ============================================ */

const KEYWORDS_DB = {
    categories: [
        // ===== УРОВЕНЬ 1: АБСОЛЮТНЫЕ ОСНОВЫ =====
        {
            id: 'basics',
            name: '🟢 Основы программы',
            icon: '🏠',
            level: 1,
            description: 'Фундамент любой C++ программы',
            keywords: [
                {
                    id: 'include',
                    name: '#include',
                    description: 'Подключение заголовочных файлов',
                    example: '#include <iostream>',
                    difficulty: 1
                },
                {
                    id: 'main',
                    name: 'main()',
                    description: 'Главная функция — точка входа программы',
                    example: 'int main() {\n    return 0;\n}',
                    difficulty: 1
                },
                {
                    id: 'cout',
                    name: 'std::cout',
                    description: 'Вывод данных в консоль',
                    example: 'std::cout << "Hello!" << std::endl;',
                    difficulty: 1
                },
                {
                    id: 'cin',
                    name: 'std::cin',
                    description: 'Ввод данных с клавиатуры',
                    example: 'int x;\nstd::cin >> x;',
                    difficulty: 1
                },
                {
                    id: 'endl',
                    name: 'std::endl / "\\n"',
                    description: 'Перенос строки',
                    example: 'std::cout << "Line 1" << std::endl;',
                    difficulty: 1
                },
                {
                    id: 'using_namespace',
                    name: 'using namespace std',
                    description: 'Использование пространства имён std',
                    example: 'using namespace std;\ncout << "Hello!";',
                    difficulty: 1
                },
                {
                    id: 'return',
                    name: 'return',
                    description: 'Возврат значения из функции',
                    example: 'return 0;',
                    difficulty: 1
                },
                {
                    id: 'comments',
                    name: '// и /* */',
                    description: 'Комментарии в коде',
                    example: '// однострочный\n/* многострочный */',
                    difficulty: 1
                }
            ]
        },

        // ===== УРОВЕНЬ 2: ТИПЫ ДАННЫХ =====
        {
            id: 'types',
            name: '🔵 Типы данных',
            icon: '📦',
            level: 2,
            description: 'Базовые типы для хранения данных',
            keywords: [
                {
                    id: 'int',
                    name: 'int',
                    description: 'Целое число (обычно 32 бита)',
                    example: 'int age = 25;',
                    difficulty: 1
                },
                {
                    id: 'double',
                    name: 'double',
                    description: 'Число с плавающей точкой (64 бита)',
                    example: 'double pi = 3.14159;',
                    difficulty: 1
                },
                {
                    id: 'float',
                    name: 'float',
                    description: 'Число с плавающей точкой (32 бита)',
                    example: 'float temp = 36.6f;',
                    difficulty: 1
                },
                {
                    id: 'char',
                    name: 'char',
                    description: 'Один символ',
                    example: "char letter = 'A';",
                    difficulty: 1
                },
                {
                    id: 'bool',
                    name: 'bool',
                    description: 'Логический тип (true/false)',
                    example: 'bool isReady = true;',
                    difficulty: 1
                },
                {
                    id: 'string',
                    name: 'std::string',
                    description: 'Строка текста',
                    example: 'std::string name = "Alice";',
                    difficulty: 1
                },
                {
                    id: 'void',
                    name: 'void',
                    description: 'Пустой тип (функция ничего не возвращает)',
                    example: 'void sayHello() { ... }',
                    difficulty: 2
                },
                {
                    id: 'auto',
                    name: 'auto',
                    description: 'Автоматическое определение типа (C++11)',
                    example: 'auto x = 42; // int',
                    difficulty: 2
                },
                {
                    id: 'long_long',
                    name: 'long long',
                    description: 'Большое целое число (64 бита)',
                    example: 'long long bigNum = 9999999999LL;',
                    difficulty: 2
                },
                {
                    id: 'unsigned',
                    name: 'unsigned',
                    description: 'Беззнаковый тип (только положительные)',
                    example: 'unsigned int count = 100;',
                    difficulty: 2
                },
                {
                    id: 'short',
                    name: 'short',
                    description: 'Короткое целое (16 бит)',
                    example: 'short s = 32000;',
                    difficulty: 2
                },
                {
                    id: 'size_t',
                    name: 'size_t',
                    description: 'Тип для размеров и индексов',
                    example: 'size_t len = str.size();',
                    difficulty: 3
                },
                {
                    id: 'const',
                    name: 'const',
                    description: 'Константа — неизменяемое значение',
                    example: 'const int MAX = 100;',
                    difficulty: 2
                },
                {
                    id: 'constexpr',
                    name: 'constexpr',
                    description: 'Константа времени компиляции (C++11)',
                    example: 'constexpr int SIZE = 10;',
                    difficulty: 3
                }
            ]
        },

        // ===== УРОВЕНЬ 3: ОПЕРАТОРЫ =====
        {
            id: 'operators',
            name: '🟡 Операторы',
            icon: '⚙️',
            level: 3,
            description: 'Арифметические, логические и другие операторы',
            keywords: [
                {
                    id: 'arithmetic',
                    name: '+ - * / %',
                    description: 'Арифметические операторы',
                    example: 'int sum = a + b;\nint mod = a % b;',
                    difficulty: 1
                },
                {
                    id: 'assignment',
                    name: '= += -= *= /=',
                    description: 'Операторы присваивания',
                    example: 'x += 5; // x = x + 5',
                    difficulty: 1
                },
                {
                    id: 'comparison',
                    name: '== != < > <= >=',
                    description: 'Операторы сравнения',
                    example: 'if (a == b) ...\nif (a >= 10) ...',
                    difficulty: 1
                },
                {
                    id: 'logical',
                    name: '&& || !',
                    description: 'Логические операторы (И, ИЛИ, НЕ)',
                    example: 'if (a > 0 && b > 0) ...',
                    difficulty: 1
                },
                {
                    id: 'increment',
                    name: '++ --',
                    description: 'Инкремент и декремент',
                    example: 'i++; // i = i + 1\n--j; // j = j - 1',
                    difficulty: 1
                },
                {
                    id: 'bitwise',
                    name: '& | ^ ~ << >>',
                    description: 'Побитовые операторы',
                    example: 'int mask = a & 0xFF;\nint shift = x << 2;',
                    difficulty: 3
                },
                {
                    id: 'xor',
                    name: 'xor (^)',
                    description: 'Исключающее ИЛИ',
                    example: 'int result = a ^ b;',
                    difficulty: 3
                },
                {
                    id: 'ternary',
                    name: '? :',
                    description: 'Тернарный оператор (условие)',
                    example: 'int max = (a > b) ? a : b;',
                    difficulty: 2
                },
                {
                    id: 'sizeof',
                    name: 'sizeof',
                    description: 'Размер типа/объекта в байтах',
                    example: 'int size = sizeof(int); // 4',
                    difficulty: 2
                }
            ]
        },

        // ===== УРОВЕНЬ 4: УПРАВЛЕНИЕ ПОТОКОМ =====
        {
            id: 'control',
            name: '🟠 Управление потоком',
            icon: '🔀',
            level: 4,
            description: 'Условия и циклы',
            keywords: [
                {
                    id: 'if',
                    name: 'if',
                    description: 'Условное выполнение кода',
                    example: 'if (x > 0) {\n    cout << "positive";\n}',
                    difficulty: 1
                },
                {
                    id: 'else',
                    name: 'else',
                    description: 'Альтернативная ветка условия',
                    example: 'if (x > 0) {\n    ...\n} else {\n    ...\n}',
                    difficulty: 1
                },
                {
                    id: 'else_if',
                    name: 'else if',
                    description: 'Дополнительное условие',
                    example: 'if (x > 0) {\n    ...\n} else if (x == 0) {\n    ...\n}',
                    difficulty: 1
                },
                {
                    id: 'for',
                    name: 'for',
                    description: 'Цикл с счётчиком',
                    example: 'for (int i = 0; i < 10; i++) {\n    cout << i;\n}',
                    difficulty: 1
                },
                {
                    id: 'while',
                    name: 'while',
                    description: 'Цикл с предусловием',
                    example: 'while (x > 0) {\n    x--;\n}',
                    difficulty: 1
                },
                {
                    id: 'do_while',
                    name: 'do...while',
                    description: 'Цикл с постусловием',
                    example: 'do {\n    ...\n} while (cond);',
                    difficulty: 2
                },
                {
                    id: 'switch',
                    name: 'switch / case',
                    description: 'Множественное ветвление',
                    example: 'switch (x) {\n    case 1: ... break;\n    default: ...\n}',
                    difficulty: 2
                },
                {
                    id: 'break',
                    name: 'break',
                    description: 'Прерывание цикла / switch',
                    example: 'for (...) {\n    if (found) break;\n}',
                    difficulty: 1
                },
                {
                    id: 'continue',
                    name: 'continue',
                    description: 'Переход к следующей итерации',
                    example: 'for (...) {\n    if (skip) continue;\n}',
                    difficulty: 2
                },
                {
                    id: 'range_for',
                    name: 'for (auto x : arr)',
                    description: 'Цикл по диапазону (C++11)',
                    example: 'for (auto x : vec) {\n    cout << x;\n}',
                    difficulty: 2
                },
                {
                    id: 'goto',
                    name: 'goto',
                    description: 'Безусловный переход (не рекомендуется)',
                    example: 'goto label;\n...\nlabel:',
                    difficulty: 3
                }
            ]
        },

        // ===== УРОВЕНЬ 5: ФУНКЦИИ =====
        {
            id: 'functions',
            name: '🟣 Функции',
            icon: '🔧',
            level: 5,
            description: 'Создание и использование функций',
            keywords: [
                {
                    id: 'func_decl',
                    name: 'Объявление функции',
                    description: 'Создание собственной функции',
                    example: 'int add(int a, int b) {\n    return a + b;\n}',
                    difficulty: 2
                },
                {
                    id: 'func_params',
                    name: 'Параметры функции',
                    description: 'Передача значений в функцию',
                    example: 'void greet(string name) { ... }',
                    difficulty: 2
                },
                {
                    id: 'func_overload',
                    name: 'Перегрузка функций',
                    description: 'Несколько функций с одним именем',
                    example: 'int add(int a, int b);\ndouble add(double a, double b);',
                    difficulty: 3
                },
                {
                    id: 'default_args',
                    name: 'Аргументы по умолчанию',
                    description: 'Значения параметров по умолчанию',
                    example: 'void log(string msg, int level = 0);',
                    difficulty: 2
                },
                {
                    id: 'recursion',
                    name: 'Рекурсия',
                    description: 'Функция вызывает саму себя',
                    example: 'int fact(int n) {\n    if (n <= 1) return 1;\n    return n * fact(n-1);\n}',
                    difficulty: 3
                },
                {
                    id: 'inline',
                    name: 'inline',
                    description: 'Встраиваемая функция',
                    example: 'inline int square(int x) {\n    return x * x;\n}',
                    difficulty: 3
                },
                {
                    id: 'lambda',
                    name: 'Лямбда []()',
                    description: 'Анонимная функция (C++11)',
                    example: 'auto add = [](int a, int b) {\n    return a + b;\n};',
                    difficulty: 4
                }
            ]
        },

        // ===== УРОВЕНЬ 6: МАССИВЫ И СТРОКИ =====
        {
            id: 'arrays',
            name: '🔴 Массивы и строки',
            icon: '📊',
            level: 6,
            description: 'Работа с коллекциями данных',
            keywords: [
                {
                    id: 'c_array',
                    name: 'int arr[N]',
                    description: 'Массив фиксированного размера',
                    example: 'int arr[5] = {1, 2, 3, 4, 5};',
                    difficulty: 2
                },
                {
                    id: 'array_index',
                    name: 'arr[i]',
                    description: 'Доступ к элементу по индексу',
                    example: 'int first = arr[0];\narr[2] = 10;',
                    difficulty: 2
                },
                {
                    id: 'multidim_array',
                    name: 'int arr[N][M]',
                    description: 'Многомерный массив',
                    example: 'int matrix[3][3] = {{1,2,3},{4,5,6},{7,8,9}};',
                    difficulty: 3
                },
                {
                    id: 'c_string',
                    name: 'char str[]',
                    description: 'C-строка (массив символов)',
                    example: 'char str[] = "Hello";',
                    difficulty: 2
                },
                {
                    id: 'string_methods',
                    name: 'string методы',
                    description: '.length(), .substr(), .find(), .append()',
                    example: 'string s = "Hello";\nint len = s.length();\nstring sub = s.substr(0, 3);',
                    difficulty: 2
                },
                {
                    id: 'string_concat',
                    name: 'string + string',
                    description: 'Конкатенация строк',
                    example: 'string full = first + " " + last;',
                    difficulty: 1
                },
                {
                    id: 'getline',
                    name: 'getline()',
                    description: 'Чтение строки с пробелами',
                    example: 'string line;\ngetline(cin, line);',
                    difficulty: 2
                }
            ]
        },

        // ===== УРОВЕНЬ 7: УКАЗАТЕЛИ И ССЫЛКИ =====
        {
            id: 'pointers',
            name: '⚫ Указатели и ссылки',
            icon: '🎯',
            level: 7,
            description: 'Работа с памятью напрямую',
            keywords: [
                {
                    id: 'pointer_decl',
                    name: 'int* ptr',
                    description: 'Объявление указателя',
                    example: 'int x = 10;\nint* ptr = &x;',
                    difficulty: 3
                },
                {
                    id: 'address_of',
                    name: '&x (адрес)',
                    description: 'Получение адреса переменной',
                    example: 'int x = 42;\ncout << &x; // адрес x',
                    difficulty: 3
                },
                {
                    id: 'dereference',
                    name: '*ptr (разыменование)',
                    description: 'Получение значения по указателю',
                    example: 'int* ptr = &x;\ncout << *ptr; // значение x',
                    difficulty: 3
                },
                {
                    id: 'reference',
                    name: 'int& ref',
                    description: 'Ссылка — псевдоним переменной',
                    example: 'int x = 10;\nint& ref = x;\nref = 20; // x теперь 20',
                    difficulty: 3
                },
                {
                    id: 'nullptr',
                    name: 'nullptr',
                    description: 'Нулевой указатель (C++11)',
                    example: 'int* ptr = nullptr;',
                    difficulty: 3
                },
                {
                    id: 'new_delete',
                    name: 'new / delete',
                    description: 'Динамическое выделение памяти',
                    example: 'int* arr = new int[10];\ndelete[] arr;',
                    difficulty: 3
                },
                {
                    id: 'pass_by_ref',
                    name: 'Передача по ссылке',
                    description: 'Функция изменяет оригинал',
                    example: 'void swap(int& a, int& b) {\n    int t = a; a = b; b = t;\n}',
                    difficulty: 3
                },
                {
                    id: 'pass_by_ptr',
                    name: 'Передача по указателю',
                    description: 'Функция получает адрес',
                    example: 'void inc(int* p) {\n    (*p)++;\n}',
                    difficulty: 3
                },
                {
                    id: 'smart_ptr',
                    name: 'unique_ptr / shared_ptr',
                    description: 'Умные указатели (C++11)',
                    example: 'auto p = make_unique<int>(42);',
                    difficulty: 4
                }
            ]
        },

        // ===== УРОВЕНЬ 8: СТРУКТУРЫ И ПЕРЕЧИСЛЕНИЯ =====
        {
            id: 'structs',
            name: '🟤 Структуры',
            icon: '🏗️',
            level: 8,
            description: 'Пользовательские типы данных',
            keywords: [
                {
                    id: 'struct',
                    name: 'struct',
                    description: 'Структура — набор полей',
                    example: 'struct Point {\n    int x, y;\n};',
                    difficulty: 2
                },
                {
                    id: 'enum',
                    name: 'enum',
                    description: 'Перечисление',
                    example: 'enum Color { RED, GREEN, BLUE };',
                    difficulty: 2
                },
                {
                    id: 'enum_class',
                    name: 'enum class',
                    description: 'Строго типизированное перечисление (C++11)',
                    example: 'enum class Direction { UP, DOWN, LEFT, RIGHT };',
                    difficulty: 3
                },
                {
                    id: 'typedef',
                    name: 'typedef / using',
                    description: 'Псевдоним типа',
                    example: 'using Vec = vector<int>;\ntypedef long long ll;',
                    difficulty: 3
                },
                {
                    id: 'union',
                    name: 'union',
                    description: 'Объединение — общая память',
                    example: 'union Data {\n    int i;\n    float f;\n};',
                    difficulty: 4
                }
            ]
        },

        // ===== УРОВЕНЬ 9: ООП =====
        {
            id: 'oop',
            name: '💎 ООП (Классы)',
            icon: '🏰',
            level: 9,
            description: 'Объектно-ориентированное программирование',
            keywords: [
                {
                    id: 'class',
                    name: 'class',
                    description: 'Объявление класса',
                    example: 'class Dog {\npublic:\n    string name;\n    void bark() { cout << "Woof!"; }\n};',
                    difficulty: 3
                },
                {
                    id: 'public_private',
                    name: 'public / private / protected',
                    description: 'Модификаторы доступа',
                    example: 'class Cat {\nprivate:\n    int lives;\npublic:\n    int getLives() { return lives; }\n};',
                    difficulty: 3
                },
                {
                    id: 'constructor',
                    name: 'Конструктор',
                    description: 'Инициализация объекта',
                    example: 'class Dog {\npublic:\n    Dog(string n) : name(n) {}\n};',
                    difficulty: 3
                },
                {
                    id: 'destructor',
                    name: '~Деструктор',
                    description: 'Очистка при уничтожении объекта',
                    example: 'class File {\npublic:\n    ~File() { close(); }\n};',
                    difficulty: 3
                },
                {
                    id: 'this',
                    name: 'this',
                    description: 'Указатель на текущий объект',
                    example: 'void setX(int x) {\n    this->x = x;\n}',
                    difficulty: 3
                },
                {
                    id: 'inheritance',
                    name: 'Наследование (:)',
                    description: 'Класс наследует от другого',
                    example: 'class Puppy : public Dog {\n    ...\n};',
                    difficulty: 3
                },
                {
                    id: 'virtual',
                    name: 'virtual',
                    description: 'Виртуальный метод (полиморфизм)',
                    example: 'virtual void speak() { ... }',
                    difficulty: 4
                },
                {
                    id: 'override',
                    name: 'override',
                    description: 'Переопределение виртуального метода',
                    example: 'void speak() override { ... }',
                    difficulty: 4
                },
                {
                    id: 'abstract',
                    name: 'Абстрактный класс (= 0)',
                    description: 'Чисто виртуальный метод',
                    example: 'virtual void draw() = 0;',
                    difficulty: 4
                },
                {
                    id: 'static_member',
                    name: 'static (член класса)',
                    description: 'Общий для всех объектов',
                    example: 'static int count;',
                    difficulty: 3
                },
                {
                    id: 'friend',
                    name: 'friend',
                    description: 'Дружественная функция/класс',
                    example: 'friend void show(MyClass& obj);',
                    difficulty: 4
                },
                {
                    id: 'operator_overload',
                    name: 'Перегрузка операторов',
                    description: 'Определение операторов для класса',
                    example: 'Point operator+(const Point& other) {\n    return {x + other.x, y + other.y};\n}',
                    difficulty: 4
                }
            ]
        },

        // ===== УРОВЕНЬ 10: STL КОНТЕЙНЕРЫ =====
        {
            id: 'stl',
            name: '🌟 STL Контейнеры',
            icon: '📚',
            level: 10,
            description: 'Стандартная библиотека шаблонов',
            keywords: [
                {
                    id: 'vector',
                    name: 'std::vector',
                    description: 'Динамический массив',
                    example: 'vector<int> v = {1, 2, 3};\nv.push_back(4);',
                    difficulty: 2
                },
                {
                    id: 'vector_methods',
                    name: 'vector методы',
                    description: '.push_back(), .pop_back(), .size(), .at()',
                    example: 'v.push_back(x);\nint s = v.size();\nv.pop_back();',
                    difficulty: 2
                },
                {
                    id: 'pair',
                    name: 'std::pair',
                    description: 'Пара значений',
                    example: 'pair<int, string> p = {1, "one"};\ncout << p.first;',
                    difficulty: 2
                },
                {
                    id: 'map',
                    name: 'std::map',
                    description: 'Словарь (ключ-значение, отсортированный)',
                    example: 'map<string, int> m;\nm["apple"] = 5;',
                    difficulty: 3
                },
                {
                    id: 'unordered_map',
                    name: 'std::unordered_map',
                    description: 'Хеш-таблица (быстрый словарь)',
                    example: 'unordered_map<string, int> m;',
                    difficulty: 3
                },
                {
                    id: 'set',
                    name: 'std::set',
                    description: 'Множество уникальных элементов',
                    example: 'set<int> s;\ns.insert(5);\ns.count(5); // 1',
                    difficulty: 3
                },
                {
                    id: 'stack',
                    name: 'std::stack',
                    description: 'Стек (LIFO)',
                    example: 'stack<int> st;\nst.push(1);\nst.top(); st.pop();',
                    difficulty: 3
                },
                {
                    id: 'queue',
                    name: 'std::queue',
                    description: 'Очередь (FIFO)',
                    example: 'queue<int> q;\nq.push(1);\nq.front(); q.pop();',
                    difficulty: 3
                },
                {
                    id: 'deque',
                    name: 'std::deque',
                    description: 'Двусторонняя очередь',
                    example: 'deque<int> d;\nd.push_front(1);\nd.push_back(2);',
                    difficulty: 3
                },
                {
                    id: 'priority_queue',
                    name: 'std::priority_queue',
                    description: 'Приоритетная очередь (куча)',
                    example: 'priority_queue<int> pq;\npq.push(5);',
                    difficulty: 4
                },
                {
                    id: 'array_std',
                    name: 'std::array',
                    description: 'Массив фиксированного размера из STL',
                    example: 'array<int, 5> a = {1,2,3,4,5};',
                    difficulty: 2
                },
                {
                    id: 'list',
                    name: 'std::list',
                    description: 'Двусвязный список',
                    example: 'list<int> lst;\nlst.push_back(1);',
                    difficulty: 3
                }
            ]
        },

        // ===== УРОВЕНЬ 11: АЛГОРИТМЫ STL =====
        {
            id: 'algorithms',
            name: '⚡ Алгоритмы STL',
            icon: '🧮',
            level: 11,
            description: 'Стандартные алгоритмы',
            keywords: [
                {
                    id: 'sort',
                    name: 'std::sort',
                    description: 'Сортировка контейнера',
                    example: 'sort(v.begin(), v.end());',
                    difficulty: 2
                },
                {
                    id: 'reverse',
                    name: 'std::reverse',
                    description: 'Переворот контейнера',
                    example: 'reverse(v.begin(), v.end());',
                    difficulty: 2
                },
                {
                    id: 'find_algo',
                    name: 'std::find',
                    description: 'Поиск элемента',
                    example: 'auto it = find(v.begin(), v.end(), 42);',
                    difficulty: 2
                },
                {
                    id: 'min_max',
                    name: 'std::min / std::max',
                    description: 'Минимум и максимум',
                    example: 'int m = min(a, b);\nint M = max(a, b);',
                    difficulty: 1
                },
                {
                    id: 'swap_func',
                    name: 'std::swap',
                    description: 'Обмен значений',
                    example: 'swap(a, b);',
                    difficulty: 1
                },
                {
                    id: 'count_algo',
                    name: 'std::count',
                    description: 'Подсчёт вхождений',
                    example: 'int c = count(v.begin(), v.end(), 5);',
                    difficulty: 2
                },
                {
                    id: 'accumulate',
                    name: 'std::accumulate',
                    description: 'Сумма элементов',
                    example: 'int sum = accumulate(v.begin(), v.end(), 0);',
                    difficulty: 3
                },
                {
                    id: 'binary_search',
                    name: 'std::binary_search / lower_bound',
                    description: 'Бинарный поиск',
                    example: 'bool found = binary_search(v.begin(), v.end(), x);',
                    difficulty: 3
                },
                {
                    id: 'iterators',
                    name: 'Итераторы (begin/end)',
                    description: 'Обход контейнеров',
                    example: 'for (auto it = v.begin(); it != v.end(); ++it) {\n    cout << *it;\n}',
                    difficulty: 3
                }
            ]
        },

        // ===== УРОВЕНЬ 12: СИМВОЛЫ И СПЕЦСИНТАКСИС =====
        {
            id: 'symbols',
            name: '🔣 Символы и синтаксис',
            icon: '🔤',
            level: 12,
            description: 'Специальные символы и элементы синтаксиса C++',
            keywords: [
                {
                    id: 'scope',
                    name: ':: (scope resolution)',
                    description: 'Оператор разрешения области видимости',
                    example: 'std::cout\nMyClass::method()',
                    difficulty: 1
                },
                {
                    id: 'arrow',
                    name: '-> (arrow)',
                    description: 'Доступ к полю через указатель',
                    example: 'ptr->name  // (*ptr).name',
                    difficulty: 3
                },
                {
                    id: 'dot',
                    name: '. (dot)',
                    description: 'Доступ к полю/методу объекта',
                    example: 'obj.method()\nstr.length()',
                    difficulty: 1
                },
                {
                    id: 'braces',
                    name: '{ } (фигурные скобки)',
                    description: 'Блок кода, инициализация',
                    example: 'int x{42};\nvector<int> v{1,2,3};',
                    difficulty: 1
                },
                {
                    id: 'brackets',
                    name: '[ ] (квадратные скобки)',
                    description: 'Индексация массива, лямбды',
                    example: 'arr[0]\n[](int x) { return x*2; }',
                    difficulty: 2
                },
                {
                    id: 'angle_brackets',
                    name: '< > (угловые скобки)',
                    description: 'Шаблонные параметры',
                    example: 'vector<int>\nmap<string, int>',
                    difficulty: 2
                },
                {
                    id: 'semicolon',
                    name: '; (точка с запятой)',
                    description: 'Конец инструкции',
                    example: 'int x = 5;',
                    difficulty: 1
                },
                {
                    id: 'hash',
                    name: '# (препроцессор)',
                    description: 'Директива препроцессора',
                    example: '#include <iostream>\n#define PI 3.14\n#ifdef ...',
                    difficulty: 2
                },
                {
                    id: 'stream_ops',
                    name: '<< >> (потоковые)',
                    description: 'Операторы ввода/вывода потоков',
                    example: 'cout << "text";\ncin >> variable;',
                    difficulty: 1
                },
                {
                    id: 'backslash',
                    name: '\\ (escape-символы)',
                    description: 'Специальные символы в строках',
                    example: '"\\n" — перенос\n"\\t" — табуляция\n"\\\\" — обратный слеш',
                    difficulty: 2
                },
                {
                    id: 'ellipsis',
                    name: '... (variadic)',
                    description: 'Вариативное число аргументов',
                    example: 'template<typename... Args>\nvoid func(Args... args);',
                    difficulty: 4
                }
            ]
        },

        // ===== УРОВЕНЬ 13: ПРОДВИНУТОЕ =====
        {
            id: 'advanced',
            name: '🌈 Продвинутое',
            icon: '🚀',
            level: 13,
            description: 'Продвинутые возможности C++',
            keywords: [
                {
                    id: 'template',
                    name: 'template',
                    description: 'Шаблоны (обобщённое программирование)',
                    example: 'template<typename T>\nT add(T a, T b) {\n    return a + b;\n}',
                    difficulty: 4
                },
                {
                    id: 'namespace',
                    name: 'namespace',
                    description: 'Пространство имён',
                    example: 'namespace Math {\n    int add(int a, int b);\n}',
                    difficulty: 3
                },
                {
                    id: 'try_catch',
                    name: 'try / catch / throw',
                    description: 'Обработка исключений',
                    example: 'try {\n    throw runtime_error("err");\n} catch (exception& e) {\n    cout << e.what();\n}',
                    difficulty: 3
                },
                {
                    id: 'static',
                    name: 'static',
                    description: 'Статическая переменная/функция',
                    example: 'static int count = 0;\ncount++;',
                    difficulty: 3
                },
                {
                    id: 'cast',
                    name: 'static_cast / dynamic_cast',
                    description: 'Приведение типов',
                    example: 'double d = 3.14;\nint i = static_cast<int>(d);',
                    difficulty: 4
                },
                {
                    id: 'file_io',
                    name: 'fstream (файлы)',
                    description: 'Чтение/запись файлов',
                    example: 'ofstream fout("data.txt");\nfout << "Hello";',
                    difficulty: 3
                },
                {
                    id: 'stringstream',
                    name: 'stringstream',
                    description: 'Потоковая обработка строк',
                    example: 'stringstream ss("123");\nint x;\nss >> x;',
                    difficulty: 3
                },
                {
                    id: 'move_semantics',
                    name: 'std::move / &&',
                    description: 'Семантика перемещения (C++11)',
                    example: 'string s2 = std::move(s1);',
                    difficulty: 4
                },
                {
                    id: 'structured_bindings',
                    name: 'auto [a, b] = ...',
                    description: 'Структурные привязки (C++17)',
                    example: 'auto [x, y] = make_pair(1, 2);',
                    difficulty: 4
                },
                {
                    id: 'optional',
                    name: 'std::optional',
                    description: 'Опциональное значение (C++17)',
                    example: 'optional<int> result = findItem();\nif (result) cout << *result;',
                    difficulty: 4
                },
                {
                    id: 'any_variant',
                    name: 'std::variant / std::any',
                    description: 'Тип-сумма / произвольный тип (C++17)',
                    example: 'variant<int, string> v = 42;',
                    difficulty: 4
                }
            ]
        }
    ],

    // Получить все ключевые слова одним списком
    getAllKeywords() {
        const all = [];
        for (const cat of this.categories) {
            for (const kw of cat.keywords) {
                all.push({
                    ...kw,
                    category: cat.id,
                    categoryName: cat.name,
                    categoryLevel: cat.level
                });
            }
        }
        return all;
    },

    // Получить ключевые слова по категории
    getByCategory(categoryId) {
        const cat = this.categories.find(c => c.id === categoryId);
        return cat ? cat.keywords : [];
    },

    // Получить по ID
    getById(keywordId) {
        for (const cat of this.categories) {
            const kw = cat.keywords.find(k => k.id === keywordId);
            if (kw) return { ...kw, category: cat.id };
        }
        return null;
    },

    // Общее количество
    getTotalCount() {
        return this.categories.reduce((sum, cat) => sum + cat.keywords.length, 0);
    }
};