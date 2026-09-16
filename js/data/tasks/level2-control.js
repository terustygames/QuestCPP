/* Уровень 2 — Ветвления: if/else, циклы, switch. */

TaskDB.add([
    {
        id: 'triangle_kind',
        title: 'Паспорт треугольника',
        level: 2, xp: 35,
        requires: ['cin', 'cout', 'int', 'if', 'else_if', 'logical'],
        story: 'Мастерская режет треугольные витражи и бракует то, что не собирается.',
        spec: 'Даны три целых числа — длины сторон. Выведите <code>impossible</code>, если треугольник с такими сторонами не существует (сумма любых двух не больше третьей). Иначе выведите <code>equilateral</code> (все равны), <code>isosceles</code> (ровно две равны) или <code>scalene</code>.',
        input: 'Три целых числа (1 ≤ a, b, c ≤ 10⁴).',
        output: 'Одно слово.',
        tests: [
            { in: '3 4 5', out: 'scalene' },
            { in: '1 2 3', out: 'impossible' },
            { in: '5 5 5', out: 'equilateral' },
            { in: '2 2 3', out: 'isosceles' },
            { in: '10 1 1', out: 'impossible' }
        ],
        hints: [
            'Сначала проверьте существование: a + b > c && a + c > b && b + c > a.',
            'Порядок веток важен: сначала «все равны», потом «две равны».'
        ],
        starter: STARTER_BASIC,
        solution: `#include <iostream>
using namespace std;
int main(){int a,b,c;cin>>a>>b>>c;if(a+b<=c||a+c<=b||b+c<=a)cout<<"impossible";else if(a==b&&b==c)cout<<"equilateral";else if(a==b||b==c||a==c)cout<<"isosceles";else cout<<"scalene";return 0;}`
    },
    {
        id: 'fizz_custom',
        title: 'Барабанщик и тарелки',
        level: 2, xp: 30,
        requires: ['cin', 'cout', 'for', 'if', 'else_if', 'arithmetic'],
        story: 'Барабанщик бьёт в бочку на каждом такте, кратном a, и в тарелку — кратном b.',
        spec: 'Даны <code>n</code>, <code>a</code> и <code>b</code>. Для тактов от 1 до n выведите <code>Boom</code>, если такт кратен a, <code>Tss</code>, если кратен b, <code>BoomTss</code>, если кратен обоим, и сам номер такта иначе. Каждое значение — на новой строке.',
        input: 'Три целых числа <code>n a b</code> (1 ≤ n ≤ 100, 2 ≤ a, b ≤ 20).',
        output: 'n строк.',
        tests: [
            { in: '6 2 3', out: '1\nBoom\nTss\nBoom\n5\nBoomTss' },
            { in: '4 4 4', out: '1\n2\n3\nBoomTss' },
            { in: '3 5 7', out: '1\n2\n3' }
        ],
        hints: [
            'Проверку «кратен обоим» ставьте первой.',
            'i % a == 0 && i % b == 0'
        ],
        starter: STARTER_BASIC,
        solution: `#include <iostream>
using namespace std;
int main(){int n,a,b;cin>>n>>a>>b;for(int i=1;i<=n;i++){if(i%a==0&&i%b==0)cout<<"BoomTss";else if(i%a==0)cout<<"Boom";else if(i%b==0)cout<<"Tss";else cout<<i;cout<<"\\n";}return 0;}`
    },
    {
        id: 'digit_stats',
        title: 'Досье на число',
        level: 2, xp: 35,
        requires: ['cin', 'cout', 'while', 'arithmetic', 'long_long', 'if'],
        story: 'Аналитик изучает число как подозреваемого: сколько цифр, какая самая большая, есть ли нули.',
        spec: 'Дано целое неотрицательное число (может не влезать в int). Выведите количество цифр, максимальную цифру и количество нулей в записи. Число нельзя считывать как строку.',
        input: 'Одно число <code>n</code> (0 ≤ n ≤ 10¹⁸).',
        output: 'Три числа через пробел.',
        tests: [
            { in: '1020304', out: '7 4 3' },
            { in: '0', out: '1 0 1' },
            { in: '999999999999999999', out: '18 9 0' },
            { in: '5', out: '1 5 0' }
        ],
        hints: [
            'Ноль — особый случай: цикл while (n > 0) для него не выполнится ни разу. Используйте do-while или проверку.',
            'Каждый шаг: цифра = n % 10, n /= 10.'
        ],
        starter: STARTER_BASIC,
        solution: `#include <iostream>
using namespace std;
int main(){long long n;cin>>n;int cnt=0,mx=0,z=0;do{int d=n%10;cnt++;if(d>mx)mx=d;if(d==0)z++;n/=10;}while(n>0);cout<<cnt<<" "<<mx<<" "<<z;return 0;}`
    },
    {
        id: 'collatz_steps',
        title: 'Град из чисел',
        level: 2, xp: 35,
        requires: ['cin', 'cout', 'while', 'if', 'else', 'long_long'],
        story: 'Гипотеза Коллатца: любое число, если долго с ним возиться, скатывается к единице.',
        spec: 'Дано <code>n</code>. Пока n не станет 1, применяйте правило: чётное — делите на 2, нечётное — умножайте на 3 и прибавляйте 1. Выведите число шагов и максимальное значение, встретившееся по пути (включая само n).',
        input: 'Целое число <code>n</code> (1 ≤ n ≤ 10⁶).',
        output: 'Два числа через пробел.',
        tests: [
            { in: '6', out: '8 16' },
            { in: '1', out: '0 1' },
            { in: '27', out: '111 9232' },
            { in: '7', out: '16 52' }
        ],
        hints: [
            'Промежуточные значения могут превысить int — берите long long.',
            'Максимум обновляйте после каждого шага.'
        ],
        starter: STARTER_BASIC,
        solution: `#include <iostream>
using namespace std;
int main(){long long n;cin>>n;long long mx=n;int steps=0;while(n!=1){if(n%2==0)n/=2;else n=3*n+1;steps++;if(n>mx)mx=n;}cout<<steps<<" "<<mx;return 0;}`
    },
    {
        id: 'hollow_square',
        title: 'Рамка со звёздами',
        level: 2, xp: 35,
        requires: ['cin', 'cout', 'for', 'nested_loops', 'if', 'else', 'logical'],
        story: 'Печатаем поздравительную открытку: пустая рамка и одна звезда точно в центре, если центр есть.',
        spec: 'Дано нечётное или чётное <code>n</code> (3 ≤ n ≤ 30). Выведите квадрат n×n из символов <code>*</code>, у которого заполнены только граница и центральная клетка (если n нечётное). Остальные клетки — точки.',
        input: 'Одно целое число.',
        output: 'n строк по n символов.',
        tests: [
            { in: '5', out: '*****\n*...*\n*.*.*\n*...*\n*****' },
            { in: '4', out: '****\n*..*\n*..*\n****' },
            { in: '3', out: '***\n***\n***' }
        ],
        hints: [
            'Клетка (i, j) на границе, если i == 0 || i == n-1 || j == 0 || j == n-1.',
            'Центр: n нечётно и i == n/2 и j == n/2.'
        ],
        starter: STARTER_BASIC,
        solution: `#include <iostream>
using namespace std;
int main(){int n;cin>>n;for(int i=0;i<n;i++){for(int j=0;j<n;j++){bool b=i==0||i==n-1||j==0||j==n-1;bool c=(n%2==1)&&i==n/2&&j==n/2;cout<<(b||c?'*':'.');}cout<<"\\n";}return 0;}`
    },
    {
        id: 'prime_check',
        title: 'Пропуск в простые',
        level: 2, xp: 40,
        requires: ['cin', 'cout', 'for', 'if', 'bool', 'break', 'long_long'],
        story: 'Клуб простых чисел пускает только тех, у кого ровно два делителя.',
        spec: 'Дано число <code>n</code>. Выведите <code>prime</code>, если оно простое, иначе — его наименьший делитель, больший единицы. Числа 0 и 1 не простые: для них выведите <code>none</code>. Решение должно работать за корень из n: n может быть до 10¹².',
        input: 'Одно целое число (0 ≤ n ≤ 10¹²).',
        output: 'Слово или число.',
        tests: [
            { in: '97', out: 'prime' },
            { in: '91', out: '7' },
            { in: '1', out: 'none' },
            { in: '1000000007', out: 'prime' },
            { in: '999999999989', out: 'prime' },
            { in: '1000000000000', out: '2' }
        ],
        hints: [
            'Перебирайте делители d, пока d * d <= n.',
            'Первый найденный делитель и есть наименьший — сразу break.'
        ],
        starter: STARTER_BASIC,
        solution: `#include <iostream>
using namespace std;
int main(){long long n;cin>>n;if(n<2){cout<<"none";return 0;}for(long long d=2;d*d<=n;d++){if(n%d==0){cout<<d;return 0;}}cout<<"prime";return 0;}`
    },
    {
        id: 'sum_until_zero',
        title: 'Кассовая лента',
        level: 2, xp: 35,
        requires: ['cin', 'cout', 'while', 'if', 'continue', 'int'],
        story: 'Кассир пробивает суммы, отрицательные — возвраты, ноль — конец смены.',
        spec: 'Читайте целые числа до нуля (ноль не учитывается). Положительные — продажи, отрицательные — возвраты. Выведите итоговую выручку (продажи минус возвраты по модулю), количество продаж и количество возвратов. Если продаж больше нуля, дополнительно выведите средний чек продажи (целочисленное деление).',
        input: 'Последовательность целых чисел, завершающаяся нулём.',
        output: 'Три числа через пробел, при наличии продаж — ещё одно число на новой строке.',
        tests: [
            { in: '100 -20 50 0', out: '130 2 1\n75' },
            { in: '-5 -5 0', out: '-10 0 2' },
            { in: '0', out: '0 0 0' },
            { in: '10 10 10 -30 0 99', out: '0 3 1\n10' }
        ],
        hints: [
            'while (cin >> x && x != 0)',
            'Не забудьте: после нуля числа не читаются вообще.'
        ],
        starter: STARTER_BASIC,
        solution: `#include <iostream>
using namespace std;
int main(){int x,total=0,sales=0,refunds=0,sum=0;while(cin>>x&&x!=0){if(x>0){sales++;sum+=x;}else refunds++;total+=x;}cout<<total<<" "<<sales<<" "<<refunds;if(sales>0)cout<<"\\n"<<sum/sales;return 0;}`
    },
    {
        id: 'calculator_switch',
        title: 'Калькулятор в две руки',
        level: 2, xp: 35,
        requires: ['cin', 'cout', 'switch', 'char', 'if', 'long_long'],
        story: 'Минимальный калькулятор для терминала: одно действие за раз, но без делений на ноль.',
        spec: 'Дано выражение вида <code>a op b</code>, где op — один из <code>+ - * / %</code>. Выведите результат. При делении на ноль выведите <code>division by zero</code>. При неизвестном операторе — <code>unknown operator</code>. Обязательно используйте <code>switch</code>.',
        input: 'Число, символ, число через пробелы.',
        output: 'Число или сообщение.',
        tests: [
            { in: '7 + 5', out: '12' },
            { in: '7 / 0', out: 'division by zero' },
            { in: '7 ^ 2', out: 'unknown operator' },
            { in: '-9 % 4', out: '-1' },
            { in: '100000 * 100000', out: '10000000000' }
        ],
        hints: [
            "case '/': проверьте b == 0 внутри case.",
            'Не забывайте break после каждого case.',
            'Произведение может не влезть в int.'
        ],
        starter: STARTER_BASIC,
        solution: `#include <iostream>
using namespace std;
int main(){long long a,b;char op;cin>>a>>op>>b;switch(op){case '+':cout<<a+b;break;case '-':cout<<a-b;break;case '*':cout<<a*b;break;case '/':if(b==0)cout<<"division by zero";else cout<<a/b;break;case '%':if(b==0)cout<<"division by zero";else cout<<a%b;break;default:cout<<"unknown operator";}return 0;}`
    },
    {
        id: 'longest_run',
        title: 'Серия побед',
        level: 2, xp: 40,
        requires: ['cin', 'cout', 'for', 'if', 'else', 'int'],
        story: 'Тренер смотрит на результаты сезона и ищет самую длинную серию побед подряд.',
        spec: 'Дано <code>n</code> и затем n чисел — 1 (победа) или 0 (поражение). Выведите длину самой длинной серии единиц подряд и номер матча (с 1), с которого она началась. При нескольких сериях одинаковой длины — самую первую. Если побед не было, выведите <code>0 0</code>.',
        input: 'n, затем n чисел.',
        output: 'Два числа.',
        tests: [
            { in: '8\n1 1 0 1 1 1 0 1', out: '3 4' },
            { in: '3\n0 0 0', out: '0 0' },
            { in: '5\n1 1 0 1 1', out: '2 1' },
            { in: '1\n1', out: '1 1' }
        ],
        hints: [
            'Храните текущую длину серии и её начало; при 0 — сбрасывайте.',
            'Обновляйте лучший результат строго при cur > best.'
        ],
        starter: STARTER_BASIC,
        solution: `#include <iostream>
using namespace std;
int main(){int n;cin>>n;int best=0,bestStart=0,cur=0,curStart=0;for(int i=1;i<=n;i++){int x;cin>>x;if(x==1){if(cur==0)curStart=i;cur++;if(cur>best){best=cur;bestStart=curStart;}}else cur=0;}cout<<best<<" "<<bestStart;return 0;}`
    },
    {
        id: 'multiplication_table_slice',
        title: 'Кусок таблицы умножения',
        level: 2, xp: 30,
        requires: ['cin', 'cout', 'for', 'nested_loops'],
        story: 'На обороте тетради таблица умножения, но нужен только прямоугольный фрагмент.',
        spec: 'Даны границы <code>r1 r2 c1 c2</code>. Выведите таблицу произведений для строк от r1 до r2 и столбцов от c1 до c2. Числа в строке разделяются одним пробелом.',
        input: 'Четыре целых (1 ≤ r1 ≤ r2 ≤ 20, 1 ≤ c1 ≤ c2 ≤ 20).',
        output: 'Прямоугольник чисел.',
        compare: 'tokens',
        tests: [
            { in: '2 3 4 6', out: '8 10 12\n12 15 18' },
            { in: '1 1 1 1', out: '1' },
            { in: '9 10 9 10', out: '81 90\n90 100' }
        ],
        hints: [
            'Внешний цикл — строки, внутренний — столбцы.',
            'Пробел перед числом, если оно не первое в строке.'
        ],
        starter: STARTER_BASIC,
        solution: `#include <iostream>
using namespace std;
int main(){int r1,r2,c1,c2;cin>>r1>>r2>>c1>>c2;for(int i=r1;i<=r2;i++){for(int j=c1;j<=c2;j++){if(j>c1)cout<<" ";cout<<i*j;}cout<<"\\n";}return 0;}`
    },
    {
        id: 'gcd_lcm',
        title: 'Шестерёнки',
        level: 2, xp: 40,
        requires: ['cin', 'cout', 'while', 'long_long', 'arithmetic'],
        story: 'Две шестерёнки с разным числом зубьев: через сколько оборотов метки снова совпадут?',
        spec: 'Даны два натуральных числа. Выведите их наибольший общий делитель и наименьшее общее кратное. Используйте алгоритм Евклида: пока b не ноль, заменяйте пару (a, b) на (b, a % b).',
        input: 'Два числа (1 ≤ a, b ≤ 10⁹).',
        output: 'НОД и НОК через пробел.',
        tests: [
            { in: '12 18', out: '6 36' },
            { in: '7 13', out: '1 91' },
            { in: '1000000000 999999999', out: '1 999999999000000000' },
            { in: '5 5', out: '5 5' }
        ],
        hints: [
            'НОК = a / НОД * b — сначала делите, чтобы не переполнить.',
            'while (b) { long long t = a % b; a = b; b = t; }'
        ],
        starter: STARTER_BASIC,
        solution: `#include <iostream>
using namespace std;
int main(){long long a,b;cin>>a>>b;long long x=a,y=b;while(y){long long t=x%y;x=y;y=t;}cout<<x<<" "<<a/x*b;return 0;}`
    },
    {
        id: 'number_pyramid',
        title: 'Пирамида из цифр',
        level: 2, xp: 40,
        requires: ['cin', 'cout', 'for', 'nested_loops', 'arithmetic'],
        story: 'Древние строили пирамиды из камня, мы — из цифр, и наши симметричнее.',
        spec: 'Дано <code>n</code> (1 ≤ n ≤ 9). Выведите пирамиду из n строк: строка i (с 1) содержит пробелы для выравнивания по центру, затем цифры от 1 до i и обратно до 1. Пробелов слева в строке i ровно n - i.',
        input: 'Одно число.',
        output: 'n строк.',
        tests: [
            { in: '3', out: '  1\n 121\n12321' },
            { in: '1', out: '1' },
            { in: '4', out: '   1\n  121\n 12321\n1234321' }
        ],
        hints: [
            'Три цикла внутри внешнего: пробелы, восходящие цифры, нисходящие цифры.',
            'Нисходящая часть: от i - 1 до 1.'
        ],
        starter: STARTER_BASIC,
        solution: `#include <iostream>
using namespace std;
int main(){int n;cin>>n;for(int i=1;i<=n;i++){for(int s=0;s<n-i;s++)cout<<' ';for(int k=1;k<=i;k++)cout<<k;for(int k=i-1;k>=1;k--)cout<<k;cout<<"\\n";}return 0;}`
    },
    {
        id: 'ternary_grades',
        title: 'Светофор оценок',
        level: 2, xp: 30,
        requires: ['cin', 'cout', 'for', 'ternary', 'int'],
        story: 'Электронный дневник красит баллы в цвета одной строкой кода.',
        spec: 'Дано <code>n</code> и n баллов (0–100). Для каждого выведите <code>green</code> при 80 и выше, <code>yellow</code> при 50–79, <code>red</code> иначе. Каждое слово с новой строки. Постарайтесь обойтись вложенным тернарным оператором без if.',
        input: 'n, затем n чисел.',
        output: 'n строк.',
        tests: [
            { in: '4\n95 50 49 80', out: 'green\nyellow\nred\ngreen' },
            { in: '1\n0', out: 'red' },
            { in: '2\n79 100', out: 'yellow\ngreen' }
        ],
        hints: [
            'x >= 80 ? "green" : (x >= 50 ? "yellow" : "red")'
        ],
        starter: STARTER_BASIC,
        solution: `#include <iostream>
using namespace std;
int main(){int n;cin>>n;for(int i=0;i<n;i++){int x;cin>>x;cout<<(x>=80?"green":x>=50?"yellow":"red")<<"\\n";}return 0;}`
    },
    {
        id: 'perfect_numbers',
        title: 'Совершенство в диапазоне',
        level: 2, xp: 40,
        requires: ['cin', 'cout', 'for', 'nested_loops', 'if', 'bool'],
        story: 'Число совершенно, если равно сумме своих делителей, кроме себя самого. Таких мало, и это красиво.',
        spec: 'Даны <code>l</code> и <code>r</code>. Выведите все совершенные числа из отрезка [l, r] по одному в строке. Если таких нет, выведите <code>none</code>.',
        input: 'Два числа (1 ≤ l ≤ r ≤ 10000).',
        output: 'Числа или слово none.',
        tests: [
            { in: '1 500', out: '6\n28\n496' },
            { in: '7 27', out: 'none' },
            { in: '8128 8128', out: '8128' },
            { in: '1 6', out: '6' }
        ],
        hints: [
            'Делители ищите до корня: если d делит n, то и n/d делит.',
            'Единица — не совершенное число.'
        ],
        starter: STARTER_BASIC,
        solution: `#include <iostream>
using namespace std;
int main(){int l,r;cin>>l>>r;bool any=false;for(int n=max(l,2);n<=r;n++){int s=1;for(int d=2;d*d<=n;d++){if(n%d==0){s+=d;if(d!=n/d)s+=n/d;}}if(s==n){cout<<n<<"\\n";any=true;}}if(!any)cout<<"none";return 0;}`
    }
]);
