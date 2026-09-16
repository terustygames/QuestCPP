/* ============================================
   TASKS DATABASE — C++ Quest
   Задачи привязаны к ключевым словам
   ============================================ */

const TASKS_DB = [
    // ========== УРОВЕНЬ 1: ОСНОВЫ ==========
    {
        id: 'hello_world',
        title: 'Привет, мир!',
        difficulty: 1,
        xp: 10,
        requires: ['cout', 'main'],
        description: 'Напишите программу, которая выводит на экран строку <code>Hello, World!</code>',
        examples: [
            { input: '', output: 'Hello, World!' }
        ],
        testCases: [
            { input: '', expectedOutput: 'Hello, World!' }
        ],
        hints: [
            'Используйте cout и строку в кавычках',
            'cout << "Hello, World!";'
        ],
        starterCode: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Выведите "Hello, World!"\n    \n    return 0;\n}'
    },
    {
        id: 'output_number',
        title: 'Вывод числа',
        difficulty: 1,
        xp: 10,
        requires: ['cout', 'int'],
        description: 'Создайте переменную <code>x</code> типа <code>int</code> со значением <code>42</code> и выведите её.',
        examples: [
            { input: '', output: '42' }
        ],
        testCases: [
            { input: '', expectedOutput: '42' }
        ],
        hints: [
            'int x = 42;',
            'cout << x;'
        ],
        starterCode: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Создайте переменную x = 42 и выведите её\n    \n    return 0;\n}'
    },
    {
        id: 'input_output',
        title: 'Эхо',
        difficulty: 1,
        xp: 15,
        requires: ['cin', 'cout', 'int'],
        description: 'Считайте целое число и выведите его обратно.',
        examples: [
            { input: '7', output: '7' },
            { input: '123', output: '123' }
        ],
        testCases: [
            { input: '7', expectedOutput: '7' },
            { input: '123', expectedOutput: '123' },
            { input: '0', expectedOutput: '0' },
            { input: '-5', expectedOutput: '-5' }
        ],
        hints: [
            'int x; cin >> x;',
            'cout << x;'
        ],
        starterCode: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Считайте число и выведите его\n    \n    return 0;\n}'
    },
    {
        id: 'sum_two',
        title: 'Сумма двух чисел',
        difficulty: 1,
        xp: 15,
        requires: ['cin', 'cout', 'int', 'arithmetic'],
        description: 'Считайте два целых числа и выведите их сумму.',
        examples: [
            { input: '3 5', output: '8' },
            { input: '10 20', output: '30' }
        ],
        testCases: [
            { input: '3 5', expectedOutput: '8' },
            { input: '10 20', expectedOutput: '30' },
            { input: '0 0', expectedOutput: '0' },
            { input: '-3 7', expectedOutput: '4' }
        ],
        hints: [
            'int a, b; cin >> a >> b;',
            'cout << a + b;'
        ],
        starterCode: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Считайте два числа и выведите их сумму\n    \n    return 0;\n}'
    },
    {
        id: 'product_three',
        title: 'Произведение трёх',
        difficulty: 1,
        xp: 15,
        requires: ['cin', 'cout', 'int', 'arithmetic'],
        description: 'Считайте три целых числа и выведите их произведение.',
        examples: [
            { input: '2 3 4', output: '24' },
            { input: '1 5 10', output: '50' }
        ],
        testCases: [
            { input: '2 3 4', expectedOutput: '24' },
            { input: '1 5 10', expectedOutput: '50' },
            { input: '0 100 200', expectedOutput: '0' },
            { input: '-2 3 5', expectedOutput: '-30' }
        ],
        hints: [
            'int a, b, c; cin >> a >> b >> c;',
            'cout << a * b * c;'
        ],
        starterCode: '#include <iostream>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}'
    },

    // ========== УСЛОВИЯ ==========
    {
        id: 'positive_negative',
        title: 'Положительное или отрицательное?',
        difficulty: 1,
        xp: 20,
        requires: ['if', 'else', 'cin', 'cout', 'int', 'comparison'],
        description: 'Считайте число. Выведите <code>positive</code> если оно > 0, <code>negative</code> если < 0, и <code>zero</code> если равно нулю.',
        examples: [
            { input: '5', output: 'positive' },
            { input: '-3', output: 'negative' },
            { input: '0', output: 'zero' }
        ],
        testCases: [
            { input: '5', expectedOutput: 'positive' },
            { input: '-3', expectedOutput: 'negative' },
            { input: '0', expectedOutput: 'zero' },
            { input: '100', expectedOutput: 'positive' },
            { input: '-1', expectedOutput: 'negative' }
        ],
        hints: [
            'Используйте if, else if, else',
            'if (x > 0) cout << "positive";'
        ],
        starterCode: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int x;\n    cin >> x;\n    \n    // Определите знак числа\n    \n    return 0;\n}'
    },
    {
        id: 'max_of_two',
        title: 'Максимум из двух',
        difficulty: 1,
        xp: 20,
        requires: ['if', 'else', 'cin', 'cout', 'int', 'comparison'],
        description: 'Считайте два целых числа и выведите наибольшее.',
        examples: [
            { input: '3 7', output: '7' },
            { input: '10 4', output: '10' },
            { input: '5 5', output: '5' }
        ],
        testCases: [
            { input: '3 7', expectedOutput: '7' },
            { input: '10 4', expectedOutput: '10' },
            { input: '5 5', expectedOutput: '5' },
            { input: '-1 -5', expectedOutput: '-1' }
        ],
        hints: [
            'Сравните a и b',
            'if (a > b) cout << a; else cout << b;'
        ],
        starterCode: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int a, b;\n    cin >> a >> b;\n    \n    return 0;\n}'
    },
    {
        id: 'even_odd',
        title: 'Чётное или нечётное?',
        difficulty: 1,
        xp: 20,
        requires: ['if', 'else', 'cin', 'cout', 'int', 'arithmetic'],
        description: 'Считайте число и выведите <code>even</code> если чётное, <code>odd</code> если нечётное.',
        examples: [
            { input: '4', output: 'even' },
            { input: '7', output: 'odd' }
        ],
        testCases: [
            { input: '4', expectedOutput: 'even' },
            { input: '7', expectedOutput: 'odd' },
            { input: '0', expectedOutput: 'even' },
            { input: '-3', expectedOutput: 'odd' },
            { input: '100', expectedOutput: 'even' }
        ],
        hints: [
            'Используйте оператор % (остаток от деления)',
            'if (x % 2 == 0) ...'
        ],
        starterCode: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int x;\n    cin >> x;\n    \n    return 0;\n}'
    },
    {
        id: 'absolute_value',
        title: 'Модуль числа',
        difficulty: 1,
        xp: 15,
        requires: ['if', 'else', 'cin', 'cout', 'int'],
        description: 'Считайте целое число и выведите его абсолютное значение (модуль).',
        examples: [
            { input: '-5', output: '5' },
            { input: '3', output: '3' },
            { input: '0', output: '0' }
        ],
        testCases: [
            { input: '-5', expectedOutput: '5' },
            { input: '3', expectedOutput: '3' },
            { input: '0', expectedOutput: '0' },
            { input: '-100', expectedOutput: '100' }
        ],
        hints: [
            'Если число отрицательное, умножьте на -1',
            'if (x < 0) x = -x;'
        ],
        starterCode: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int x;\n    cin >> x;\n    \n    return 0;\n}'
    },

    // ========== ЦИКЛЫ ==========
    {
        id: 'count_to_n',
        title: 'Считаем до N',
        difficulty: 1,
        xp: 20,
        requires: ['for', 'cin', 'cout', 'int'],
        description: 'Считайте число N и выведите все числа от 1 до N через пробел.',
        examples: [
            { input: '5', output: '1 2 3 4 5' },
            { input: '3', output: '1 2 3' }
        ],
        testCases: [
            { input: '5', expectedOutput: '1 2 3 4 5' },
            { input: '3', expectedOutput: '1 2 3' },
            { input: '1', expectedOutput: '1' },
            { input: '10', expectedOutput: '1 2 3 4 5 6 7 8 9 10' }
        ],
        hints: [
            'Используйте цикл for от 1 до n',
            'for (int i = 1; i <= n; i++) cout << i << " ";'
        ],
        starterCode: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    \n    return 0;\n}'
    },
    {
        id: 'sum_1_to_n',
        title: 'Сумма от 1 до N',
        difficulty: 1,
        xp: 25,
        requires: ['for', 'cin', 'cout', 'int'],
        description: 'Считайте число N и выведите сумму всех чисел от 1 до N.',
        examples: [
            { input: '5', output: '15' },
            { input: '10', output: '55' }
        ],
        testCases: [
            { input: '5', expectedOutput: '15' },
            { input: '10', expectedOutput: '55' },
            { input: '1', expectedOutput: '1' },
            { input: '100', expectedOutput: '5050' }
        ],
        hints: [
            'Заведите переменную sum = 0',
            'В цикле прибавляйте i к sum'
        ],
        starterCode: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    \n    return 0;\n}'
    },
    {
        id: 'factorial',
        title: 'Факториал',
        difficulty: 2,
        xp: 30,
        requires: ['for', 'cin', 'cout', 'int'],
        description: 'Считайте число N (0 ≤ N ≤ 12) и выведите N! (факториал N).',
        examples: [
            { input: '5', output: '120' },
            { input: '0', output: '1' },
            { input: '3', output: '6' }
        ],
        testCases: [
            { input: '5', expectedOutput: '120' },
            { input: '0', expectedOutput: '1' },
            { input: '1', expectedOutput: '1' },
            { input: '3', expectedOutput: '6' },
            { input: '10', expectedOutput: '3628800' }
        ],
        hints: [
            'Факториал: n! = 1 * 2 * 3 * ... * n',
            '0! = 1 по определению',
            'int result = 1; for (int i = 1; i <= n; i++) result *= i;'
        ],
        starterCode: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    \n    return 0;\n}'
    },
    {
        id: 'reverse_number',
        title: 'Переворот числа',
        difficulty: 2,
        xp: 35,
        requires: ['while', 'cin', 'cout', 'int', 'arithmetic'],
        description: 'Считайте положительное целое число и выведите его цифры в обратном порядке.',
        examples: [
            { input: '123', output: '321' },
            { input: '1000', output: '0001' },
            { input: '5', output: '5' }
        ],
        testCases: [
            { input: '123', expectedOutput: '321' },
            { input: '1000', expectedOutput: '0001' },
            { input: '5', expectedOutput: '5' },
            { input: '12345', expectedOutput: '54321' }
        ],
        hints: [
            'Используйте % 10 чтобы получить последнюю цифру',
            'Используйте / 10 чтобы убрать последнюю цифру',
            'while (n > 0) { cout << n%10; n /= 10; }'
        ],
        starterCode: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    \n    return 0;\n}'
    },
    {
        id: 'multiplication_table',
        title: 'Таблица умножения',
        difficulty: 2,
        xp: 30,
        requires: ['for', 'cin', 'cout', 'int'],
        description: 'Считайте число N и выведите таблицу умножения для N (от N*1 до N*10), каждое произведение на новой строке в формате <code>N*i=result</code>.',
        examples: [
            { input: '3', output: '3*1=3\n3*2=6\n3*3=9\n3*4=12\n3*5=15\n3*6=18\n3*7=21\n3*8=24\n3*9=27\n3*10=30' }
        ],
        testCases: [
            { input: '3', expectedOutput: '3*1=3\n3*2=6\n3*3=9\n3*4=12\n3*5=15\n3*6=18\n3*7=21\n3*8=24\n3*9=27\n3*10=30' },
            { input: '5', expectedOutput: '5*1=5\n5*2=10\n5*3=15\n5*4=20\n5*5=25\n5*6=30\n5*7=35\n5*8=40\n5*9=45\n5*10=50' }
        ],
        hints: [
            'for (int i = 1; i <= 10; i++)',
            'cout << n << "*" << i << "=" << n*i << endl;'
        ],
        starterCode: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    \n    return 0;\n}'
    },
    {
        id: 'fibonacci',
        title: 'Фибоначчи',
        difficulty: 2,
        xp: 40,
        requires: ['for', 'cin', 'cout', 'int'],
        description: 'Считайте число N и выведите первые N чисел Фибоначчи через пробел. F(1)=1, F(2)=1, F(n)=F(n-1)+F(n-2).',
        examples: [
            { input: '7', output: '1 1 2 3 5 8 13' },
            { input: '1', output: '1' }
        ],
        testCases: [
            { input: '7', expectedOutput: '1 1 2 3 5 8 13' },
            { input: '1', expectedOutput: '1' },
            { input: '2', expectedOutput: '1 1' },
            { input: '10', expectedOutput: '1 1 2 3 5 8 13 21 34 55' }
        ],
        hints: [
            'Храните два предыдущих числа',
            'int a = 1, b = 1; ... int c = a + b; a = b; b = c;'
        ],
        starterCode: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    \n    return 0;\n}'
    },

    // ========== МАССИВЫ И СТРОКИ ==========
    {
        id: 'array_sum',
        title: 'Сумма массива',
        difficulty: 2,
        xp: 25,
        requires: ['for', 'c_array', 'cin', 'cout', 'int'],
        description: 'Считайте N, затем N целых чисел. Выведите их сумму.',
        examples: [
            { input: '4\n1 2 3 4', output: '10' },
            { input: '3\n10 20 30', output: '60' }
        ],
        testCases: [
            { input: '4\n1 2 3 4', expectedOutput: '10' },
            { input: '3\n10 20 30', expectedOutput: '60' },
            { input: '1\n5', expectedOutput: '5' },
            { input: '5\n-1 -2 -3 -4 -5', expectedOutput: '-15' }
        ],
        hints: [
            'Считайте числа в цикле и накапливайте сумму',
            'int sum = 0; for (...) { cin >> x; sum += x; }'
        ],
        starterCode: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    \n    return 0;\n}'
    },
    {
        id: 'find_max',
        title: 'Максимум в массиве',
        difficulty: 2,
        xp: 30,
        requires: ['for', 'if', 'c_array', 'cin', 'cout', 'int'],
        description: 'Считайте N, затем N целых чисел. Выведите наибольшее из них.',
        examples: [
            { input: '5\n3 1 4 1 5', output: '5' },
            { input: '3\n-1 -5 -2', output: '-1' }
        ],
        testCases: [
            { input: '5\n3 1 4 1 5', expectedOutput: '5' },
            { input: '3\n-1 -5 -2', expectedOutput: '-1' },
            { input: '1\n42', expectedOutput: '42' },
            { input: '4\n10 10 10 10', expectedOutput: '10' }
        ],
        hints: [
            'Инициализируйте максимум первым элементом',
            'Сравнивайте каждый следующий с текущим максимумом'
        ],
        starterCode: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    \n    return 0;\n}'
    },
    {
        id: 'reverse_array',
        title: 'Переворот массива',
        difficulty: 2,
        xp: 30,
        requires: ['for', 'c_array', 'cin', 'cout', 'int'],
        description: 'Считайте N чисел и выведите их в обратном порядке через пробел.',
        examples: [
            { input: '5\n1 2 3 4 5', output: '5 4 3 2 1' }
        ],
        testCases: [
            { input: '5\n1 2 3 4 5', expectedOutput: '5 4 3 2 1' },
            { input: '3\n10 20 30', expectedOutput: '30 20 10' },
            { input: '1\n7', expectedOutput: '7' }
        ],
        hints: [
            'Считайте все числа в массив',
            'Выведите массив с конца до начала'
        ],
        starterCode: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    \n    return 0;\n}'
    },
    {
        id: 'string_length',
        title: 'Длина строки',
        difficulty: 1,
        xp: 15,
        requires: ['string', 'cin', 'cout', 'string_methods'],
        description: 'Считайте строку (одно слово) и выведите её длину.',
        examples: [
            { input: 'hello', output: '5' },
            { input: 'cpp', output: '3' }
        ],
        testCases: [
            { input: 'hello', expectedOutput: '5' },
            { input: 'cpp', expectedOutput: '3' },
            { input: 'a', expectedOutput: '1' },
            { input: 'programming', expectedOutput: '11' }
        ],
        hints: [
            'Используйте .length() или .size()',
            'string s; cin >> s; cout << s.length();'
        ],
        starterCode: '#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string s;\n    cin >> s;\n    \n    return 0;\n}'
    },
    {
        id: 'count_vowels',
        title: 'Подсчёт гласных',
        difficulty: 2,
        xp: 35,
        requires: ['string', 'for', 'if', 'cin', 'cout', 'logical'],
        description: 'Считайте строку (одно слово, маленькие буквы) и выведите количество гласных (a, e, i, o, u).',
        examples: [
            { input: 'hello', output: '2' },
            { input: 'aeiou', output: '5' },
            { input: 'xyz', output: '0' }
        ],
        testCases: [
            { input: 'hello', expectedOutput: '2' },
            { input: 'aeiou', expectedOutput: '5' },
            { input: 'xyz', expectedOutput: '0' },
            { input: 'programming', expectedOutput: '3' }
        ],
        hints: [
            'Пройдите по каждому символу строки',
            'Проверяйте: c == \'a\' || c == \'e\' || ...'
        ],
        starterCode: '#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string s;\n    cin >> s;\n    \n    return 0;\n}'
    },

    // ========== ФУНКЦИИ ==========
    {
        id: 'power_function',
        title: 'Степень числа (функция)',
        difficulty: 2,
        xp: 35,
        requires: ['func_decl', 'for', 'cin', 'cout', 'int'],
        description: 'Напишите функцию <code>power(int base, int exp)</code>, которая возвращает base в степени exp. Считайте два числа и выведите результат.',
        examples: [
            { input: '2 10', output: '1024' },
            { input: '3 4', output: '81' }
        ],
        testCases: [
            { input: '2 10', expectedOutput: '1024' },
            { input: '3 4', expectedOutput: '81' },
            { input: '5 0', expectedOutput: '1' },
            { input: '7 1', expectedOutput: '7' }
        ],
        hints: [
            'Создайте функцию с циклом for',
            'int result = 1; for (int i = 0; i < exp; i++) result *= base;'
        ],
        starterCode: '#include <iostream>\nusing namespace std;\n\n// Напишите функцию power здесь\n\nint main() {\n    int base, exp;\n    cin >> base >> exp;\n    cout << power(base, exp);\n    return 0;\n}'
    },
    {
        id: 'is_prime',
        title: 'Простое число?',
        difficulty: 2,
        xp: 40,
        requires: ['func_decl', 'for', 'if', 'cin', 'cout', 'bool'],
        description: 'Напишите функцию <code>isPrime(int n)</code>. Считайте число и выведите <code>yes</code> если простое, <code>no</code> если нет.',
        examples: [
            { input: '7', output: 'yes' },
            { input: '4', output: 'no' },
            { input: '1', output: 'no' }
        ],
        testCases: [
            { input: '7', expectedOutput: 'yes' },
            { input: '4', expectedOutput: 'no' },
            { input: '1', expectedOutput: 'no' },
            { input: '2', expectedOutput: 'yes' },
            { input: '13', expectedOutput: 'yes' },
            { input: '15', expectedOutput: 'no' }
        ],
        hints: [
            'Число простое, если делится только на 1 и на себя',
            'Проверяйте делители от 2 до sqrt(n)'
        ],
        starterCode: '#include <iostream>\nusing namespace std;\n\nbool isPrime(int n) {\n    // Ваш код\n}\n\nint main() {\n    int n;\n    cin >> n;\n    cout << (isPrime(n) ? "yes" : "no");\n    return 0;\n}'
    },

    // ========== SWITCH ==========
    {
        id: 'day_of_week',
        title: 'День недели',
        difficulty: 1,
        xp: 20,
        requires: ['switch', 'cin', 'cout', 'int'],
        description: 'Считайте число от 1 до 7 и выведите название дня недели (1=Monday, 2=Tuesday, ..., 7=Sunday).',
        examples: [
            { input: '1', output: 'Monday' },
            { input: '5', output: 'Friday' },
            { input: '7', output: 'Sunday' }
        ],
        testCases: [
            { input: '1', expectedOutput: 'Monday' },
            { input: '2', expectedOutput: 'Tuesday' },
            { input: '3', expectedOutput: 'Wednesday' },
            { input: '4', expectedOutput: 'Thursday' },
            { input: '5', expectedOutput: 'Friday' },
            { input: '6', expectedOutput: 'Saturday' },
            { input: '7', expectedOutput: 'Sunday' }
        ],
        hints: [
            'Используйте switch с case 1, case 2, ...',
            'Не забудьте break после каждого case'
        ],
        starterCode: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int day;\n    cin >> day;\n    \n    return 0;\n}'
    },

    // ========== VECTOR ==========
    {
        id: 'vector_sort',
        title: 'Сортировка вектора',
        difficulty: 2,
        xp: 30,
        requires: ['vector', 'sort', 'cin', 'cout', 'for'],
        description: 'Считайте N чисел, отсортируйте их по возрастанию и выведите через пробел.',
        examples: [
            { input: '5\n3 1 4 1 5', output: '1 1 3 4 5' }
        ],
        testCases: [
            { input: '5\n3 1 4 1 5', expectedOutput: '1 1 3 4 5' },
            { input: '3\n3 2 1', expectedOutput: '1 2 3' },
            { input: '1\n42', expectedOutput: '42' },
            { input: '4\n-3 1 -1 3', expectedOutput: '-3 -1 1 3' }
        ],
        hints: [
            'Используйте vector<int> и sort()',
            'sort(v.begin(), v.end());'
        ],
        starterCode: '#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    \n    return 0;\n}'
    },

    // ========== MAP ==========
    {
        id: 'word_count',
        title: 'Частота слов',
        difficulty: 3,
        xp: 50,
        requires: ['map', 'string', 'for', 'cin', 'cout'],
        description: 'Считайте N, затем N слов. Выведите каждое уникальное слово и его количество в алфавитном порядке в формате <code>word count</code> (каждая пара на новой строке).',
        examples: [
            { input: '5\napple banana apple cherry banana', output: 'apple 2\nbanana 2\ncherry 1' }
        ],
        testCases: [
            { input: '5\napple banana apple cherry banana', expectedOutput: 'apple 2\nbanana 2\ncherry 1' },
            { input: '3\nhello hello hello', expectedOutput: 'hello 3' },
            { input: '1\nworld', expectedOutput: 'world 1' }
        ],
        hints: [
            'Используйте map<string, int>',
            'map автоматически сортирует по ключу',
            'for (auto& [word, cnt] : m) cout << word << " " << cnt << endl;'
        ],
        starterCode: '#include <iostream>\n#include <map>\n#include <string>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    \n    return 0;\n}'
    },

    // ========== УКАЗАТЕЛИ ==========
    {
        id: 'swap_pointers',
        title: 'Обмен через указатели',
        difficulty: 3,
        xp: 40,
        requires: ['pointer_decl', 'dereference', 'pass_by_ptr', 'cin', 'cout'],
        description: 'Напишите функцию <code>mySwap(int* a, int* b)</code>, которая меняет значения местами. Считайте два числа, поменяйте их и выведите.',
        examples: [
            { input: '3 7', output: '7 3' },
            { input: '10 20', output: '20 10' }
        ],
        testCases: [
            { input: '3 7', expectedOutput: '7 3' },
            { input: '10 20', expectedOutput: '20 10' },
            { input: '5 5', expectedOutput: '5 5' }
        ],
        hints: [
            'void mySwap(int* a, int* b)',
            'int temp = *a; *a = *b; *b = temp;',
            'Вызов: mySwap(&x, &y);'
        ],
        starterCode: '#include <iostream>\nusing namespace std;\n\nvoid mySwap(int* a, int* b) {\n    // Ваш код\n}\n\nint main() {\n    int a, b;\n    cin >> a >> b;\n    mySwap(&a, &b);\n    cout << a << " " << b;\n    return 0;\n}'
    },

    // ========== СТРУКТУРЫ ==========
    {
        id: 'struct_point',
        title: 'Расстояние между точками',
        difficulty: 3,
        xp: 45,
        requires: ['struct', 'cin', 'cout', 'double'],
        description: 'Создайте структуру <code>Point</code> с полями x, y (double). Считайте координаты двух точек и выведите расстояние между ними с точностью до 2 знаков.',
        examples: [
            { input: '0 0 3 4', output: '5.00' },
            { input: '1 1 4 5', output: '5.00' }
        ],
        testCases: [
            { input: '0 0 3 4', expectedOutput: '5.00' },
            { input: '1 1 4 5', expectedOutput: '5.00' },
            { input: '0 0 0 0', expectedOutput: '0.00' }
        ],
        hints: [
            'Расстояние = sqrt((x2-x1)² + (y2-y1)²)',
            '#include <cmath> и используйте sqrt()',
            'cout << fixed << setprecision(2) << dist;'
        ],
        starterCode: '#include <iostream>\n#include <cmath>\n#include <iomanip>\nusing namespace std;\n\nstruct Point {\n    double x, y;\n};\n\nint main() {\n    Point p1, p2;\n    cin >> p1.x >> p1.y >> p2.x >> p2.y;\n    \n    return 0;\n}'
    },

    // ========== БИТОВЫЕ ОПЕРАЦИИ ==========
    {
        id: 'xor_swap',
        title: 'XOR Обмен',
        difficulty: 3,
        xp: 40,
        requires: ['xor', 'bitwise', 'cin', 'cout'],
        description: 'Поменяйте два числа местами используя ТОЛЬКО XOR (^), без временной переменной. Считайте два числа, поменяйте и выведите.',
        examples: [
            { input: '5 10', output: '10 5' }
        ],
        testCases: [
            { input: '5 10', expectedOutput: '10 5' },
            { input: '0 7', expectedOutput: '7 0' },
            { input: '100 200', expectedOutput: '200 100' }
        ],
        hints: [
            'a ^= b; b ^= a; a ^= b;',
            'XOR: a ^ a = 0, a ^ 0 = a'
        ],
        starterCode: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int a, b;\n    cin >> a >> b;\n    \n    // Обменяйте используя только XOR\n    \n    cout << a << " " << b;\n    return 0;\n}'
    },

    // ========== РЕКУРСИЯ ==========
    {
        id: 'recursive_sum',
        title: 'Рекурсивная сумма цифр',
        difficulty: 3,
        xp: 45,
        requires: ['recursion', 'func_decl', 'cin', 'cout', 'int'],
        description: 'Напишите рекурсивную функцию <code>digitSum(int n)</code>, возвращающую сумму цифр числа. Считайте число и выведите результат.',
        examples: [
            { input: '123', output: '6' },
            { input: '9999', output: '36' }
        ],
        testCases: [
            { input: '123', expectedOutput: '6' },
            { input: '9999', expectedOutput: '36' },
            { input: '0', expectedOutput: '0' },
            { input: '5', expectedOutput: '5' },
            { input: '100', expectedOutput: '1' }
        ],
        hints: [
            'Базовый случай: если n == 0, вернуть 0',
            'digitSum(n) = n%10 + digitSum(n/10)'
        ],
        starterCode: '#include <iostream>\nusing namespace std;\n\nint digitSum(int n) {\n    // Ваш рекурсивный код\n}\n\nint main() {\n    int n;\n    cin >> n;\n    cout << digitSum(n);\n    return 0;\n}'
    },

    // ========== ООП ==========
    {
        id: 'class_rectangle',
        title: 'Класс Прямоугольник',
        difficulty: 3,
        xp: 50,
        requires: ['class', 'public_private', 'constructor', 'cin', 'cout'],
        description: 'Создайте класс <code>Rectangle</code> с приватными полями width, height и публичными методами <code>area()</code> и <code>perimeter()</code>. Считайте ширину и высоту, выведите площадь и периметр через пробел.',
        examples: [
            { input: '3 4', output: '12 14' },
            { input: '5 5', output: '25 20' }
        ],
        testCases: [
            { input: '3 4', expectedOutput: '12 14' },
            { input: '5 5', expectedOutput: '25 20' },
            { input: '1 1', expectedOutput: '1 4' },
            { input: '10 2', expectedOutput: '20 24' }
        ],
        hints: [
            'private: int width, height;',
            'public: Rectangle(int w, int h) : width(w), height(h) {}',
            'int area() { return width * height; }'
        ],
        starterCode: '#include <iostream>\nusing namespace std;\n\nclass Rectangle {\n    // Ваш код\n};\n\nint main() {\n    int w, h;\n    cin >> w >> h;\n    Rectangle r(w, h);\n    cout << r.area() << " " << r.perimeter();\n    return 0;\n}'
    },

    // ========== ЛЯМБДЫ ==========
    {
        id: 'lambda_sort',
        title: 'Сортировка лямбдой',
        difficulty: 3,
        xp: 45,
        requires: ['lambda', 'vector', 'sort', 'cin', 'cout'],
        description: 'Считайте N чисел. Отсортируйте по убыванию используя лямбду в sort(). Выведите через пробел.',
        examples: [
            { input: '5\n3 1 4 1 5', output: '5 4 3 1 1' }
        ],
        testCases: [
            { input: '5\n3 1 4 1 5', expectedOutput: '5 4 3 1 1' },
            { input: '3\n1 2 3', expectedOutput: '3 2 1' },
            { input: '1\n42', expectedOutput: '42' }
        ],
        hints: [
            'sort(v.begin(), v.end(), [](int a, int b) { return a > b; });'
        ],
        starterCode: '#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    vector<int> v(n);\n    for (auto& x : v) cin >> x;\n    \n    // Сортировка лямбдой по убыванию\n    \n    for (int i = 0; i < n; i++) {\n        if (i) cout << " ";\n        cout << v[i];\n    }\n    return 0;\n}'
    },

    // ========== DOUBLE/FLOAT ==========
    {
        id: 'average',
        title: 'Среднее арифметическое',
        difficulty: 1,
        xp: 20,
        requires: ['double', 'for', 'cin', 'cout'],
        description: 'Считайте N, затем N вещественных чисел. Выведите их среднее арифметическое с точностью 2 знака.',
        examples: [
            { input: '3\n1.0 2.0 3.0', output: '2.00' },
            { input: '4\n10.5 20.5 30.5 40.5', output: '25.50' }
        ],
        testCases: [
            { input: '3\n1.0 2.0 3.0', expectedOutput: '2.00' },
            { input: '4\n10.5 20.5 30.5 40.5', expectedOutput: '25.50' },
            { input: '1\n7.77', expectedOutput: '7.77' }
        ],
        hints: [
            'double sum = 0; ... sum /= n;',
            'cout << fixed << setprecision(2) << result;'
        ],
        starterCode: '#include <iostream>\n#include <iomanip>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    \n    return 0;\n}'
    },

    // ========== GCD ==========
    {
        id: 'gcd',
        title: 'НОД (Евклид)',
        difficulty: 2,
        xp: 35,
        requires: ['while', 'cin', 'cout', 'int', 'arithmetic'],
        description: 'Считайте два положительных числа и выведите их наибольший общий делитель (алгоритм Евклида).',
        examples: [
            { input: '12 8', output: '4' },
            { input: '7 13', output: '1' }
        ],
        testCases: [
            { input: '12 8', expectedOutput: '4' },
            { input: '7 13', expectedOutput: '1' },
            { input: '100 75', expectedOutput: '25' },
            { input: '6 6', expectedOutput: '6' }
        ],
        hints: [
            'Алгоритм Евклида: while (b != 0) { int t = b; b = a % b; a = t; }',
            'Ответ — значение a после цикла'
        ],
        starterCode: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int a, b;\n    cin >> a >> b;\n    \n    return 0;\n}'
    },

    // ========== ПАЛИНДРОМ ==========
    {
        id: 'palindrome',
        title: 'Палиндром?',
        difficulty: 2,
        xp: 35,
        requires: ['string', 'for', 'if', 'cin', 'cout', 'bool'],
        description: 'Считайте строку (одно слово, маленькие буквы). Выведите <code>yes</code> если это палиндром, <code>no</code> иначе.',
        examples: [
            { input: 'racecar', output: 'yes' },
            { input: 'hello', output: 'no' },
            { input: 'abba', output: 'yes' }
        ],
        testCases: [
            { input: 'racecar', expectedOutput: 'yes' },
            { input: 'hello', expectedOutput: 'no' },
            { input: 'abba', expectedOutput: 'yes' },
            { input: 'a', expectedOutput: 'yes' },
            { input: 'ab', expectedOutput: 'no' }
        ],
        hints: [
            'Сравнивайте s[i] и s[len-1-i]',
            'Можно использовать reverse и сравнить'
        ],
        starterCode: '#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string s;\n    cin >> s;\n    \n    return 0;\n}'
    },

    // ========== DO-WHILE ==========
    {
        id: 'guess_number',
        title: 'Угадай число',
        difficulty: 2,
        xp: 30,
        requires: ['do_while', 'if', 'cin', 'cout', 'int'],
        description: 'Задано число X (первый ввод). Далее пользователь вводит догадки. Выводите <code>higher</code>, <code>lower</code> или <code>correct</code>. Программа завершается при угадывании.',
        examples: [
            { input: '5\n3\n7\n5', output: 'higher\nlower\ncorrect' }
        ],
        testCases: [
            { input: '5\n3\n7\n5', expectedOutput: 'higher\nlower\ncorrect' },
            { input: '10\n10', expectedOutput: 'correct' },
            { input: '1\n5\n3\n1', expectedOutput: 'lower\nlower\ncorrect' }
        ],
        hints: [
            'Используйте do { cin >> guess; ... } while (guess != x);',
            'higher = нужно больше, lower = нужно меньше'
        ],
        starterCode: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int x;\n    cin >> x;\n    \n    return 0;\n}'
    },

    // ========== ТЕРНАРНЫЙ ОПЕРАТОР ==========
    {
        id: 'ternary_minmax',
        title: 'Мин и Макс (тернарный)',
        difficulty: 2,
        xp: 25,
        requires: ['ternary', 'cin', 'cout', 'int'],
        description: 'Считайте три числа. Выведите минимальное и максимальное через пробел. Используйте тернарный оператор.',
        examples: [
            { input: '3 1 2', output: '1 3' },
            { input: '5 5 5', output: '5 5' }
        ],
        testCases: [
            { input: '3 1 2', expectedOutput: '1 3' },
            { input: '5 5 5', expectedOutput: '5 5' },
            { input: '-1 0 1', expectedOutput: '-1 1' },
            { input: '10 5 7', expectedOutput: '5 10' }
        ],
        hints: [
            'int mn = (a < b) ? a : b; mn = (mn < c) ? mn : c;',
            'Аналогично для максимума'
        ],
        starterCode: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int a, b, c;\n    cin >> a >> b >> c;\n    \n    return 0;\n}'
    },

    // ========== BUBBLE SORT ==========
    {
        id: 'bubble_sort',
        title: 'Пузырьковая сортировка',
        difficulty: 3,
        xp: 50,
        requires: ['for', 'if', 'c_array', 'cin', 'cout', 'int'],
        description: 'Реализуйте пузырьковую сортировку. Считайте N чисел, отсортируйте и выведите через пробел. Не используйте sort().',
        examples: [
            { input: '5\n5 3 1 4 2', output: '1 2 3 4 5' }
        ],
        testCases: [
            { input: '5\n5 3 1 4 2', expectedOutput: '1 2 3 4 5' },
            { input: '3\n3 2 1', expectedOutput: '1 2 3' },
            { input: '4\n1 1 1 1', expectedOutput: '1 1 1 1' },
            { input: '1\n42', expectedOutput: '42' }
        ],
        hints: [
            'Два вложенных цикла',
            'Если arr[j] > arr[j+1], меняйте их местами',
            'Внешний цикл: n-1 проходов'
        ],
        starterCode: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    int arr[1000];\n    for (int i = 0; i < n; i++) cin >> arr[i];\n    \n    // Пузырьковая сортировка\n    \n    for (int i = 0; i < n; i++) {\n        if (i) cout << " ";\n        cout << arr[i];\n    }\n    return 0;\n}'
    }
];

// Утилиты для работы с задачами
const TasksUtil = {
    // Получить задачи, доступные для выбранных навыков
    getAvailableTasks(selectedKeywords) {
        return TASKS_DB.filter(task => {
            return task.requires.every(req => selectedKeywords.includes(req));
        });
    },

    // Получить задачу по ID
    getById(taskId) {
        return TASKS_DB.find(t => t.id === taskId);
    },

    // Получить случайную задачу из доступных
    getRandomTask(selectedKeywords, solvedIds = []) {
        const available = this.getAvailableTasks(selectedKeywords)
            .filter(t => !solvedIds.includes(t.id));

        if (available.length === 0) {
            // Если все решены, показываем любую доступную
            const all = this.getAvailableTasks(selectedKeywords);
            if (all.length === 0) return null;
            return all[Math.floor(Math.random() * all.length)];
        }

        return available[Math.floor(Math.random() * available.length)];
    },

    // Получить статистику сложности
    getDifficultyStats(selectedKeywords) {
        const tasks = this.getAvailableTasks(selectedKeywords);
        return {
            easy: tasks.filter(t => t.difficulty === 1).length,
            medium: tasks.filter(t => t.difficulty === 2).length,
            hard: tasks.filter(t => t.difficulty === 3).length,
            expert: tasks.filter(t => t.difficulty === 4).length,
            total: tasks.length
        };
    },

    // Текст сложности
    getDifficultyLabel(diff) {
        const labels = {
            1: { text: 'Легко', stars: '⭐', color: '#00b894' },
            2: { text: 'Средне', stars: '⭐⭐', color: '#fdcb6e' },
            3: { text: 'Сложно', stars: '⭐⭐⭐', color: '#e17055' },
            4: { text: 'Хардкор', stars: '⭐⭐⭐⭐', color: '#d63031' }
        };
        return labels[diff] || labels[1];
    }
};