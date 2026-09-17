/* Уровень 1 — Разминка: ввод/вывод, целые числа, арифметика, типы. */

TaskDB.add([
    {
        id: 'ticket_change',
        goal: 'Разменять сумму монетами 25, 10, 5, 1 — крупными в первую очередь.',
        title: 'Сдача автомата',
        level: 1, xp: 20,
        requires: ['cin', 'cout', 'int', 'arithmetic', 'modulo'],
        story: 'Автомат с газировкой выдаёт сдачу только монетами 25, 10, 5 и 1.',
        spec: 'Дана сумма сдачи в копейках (от 0 до 99). Выведите, сколько монет каждого номинала выдаст автомат, если он всегда берёт самую крупную возможную монету.',
        input: 'Одно целое число <code>n</code> (0 ≤ n ≤ 99).',
        output: 'Четыре числа через пробел: количество монет 25, 10, 5 и 1.',
        tests: [
            { in: '99', out: '3 2 0 4' },
            { in: '30', out: '1 0 1 0' },
            { in: '0', out: '0 0 0 0' },
            { in: '24', out: '0 2 0 4' },
            { in: '5', out: '0 0 1 0' }
        ],
        hints: [
            'Целочисленное деление n / 25 даст количество крупных монет.',
            'Остаток n % 25 — то, что осталось разменять более мелкими.',
            'int q = n / 25; n %= 25; int d = n / 10; n %= 10; ...'
        ],
        starter: STARTER_BASIC,
        solution: `#include <iostream>
using namespace std;
int main(){int n;cin>>n;int q=n/25;n%=25;int d=n/10;n%=10;int f=n/5;n%=5;cout<<q<<" "<<d<<" "<<f<<" "<<n;return 0;}`
    },
    {
        id: 'digital_clock',
        goal: 'Перевести секунды в часы, минуты и секунды.',
        title: 'Цифровые часы',
        level: 1, xp: 20,
        requires: ['cin', 'cout', 'int', 'arithmetic', 'modulo'],
        story: 'Секундомер сломался и показывает только общее число секунд с полуночи.',
        spec: 'По числу секунд, прошедших с начала суток, выведите время в формате <code>Ч:М:С</code> без ведущих нулей.',
        input: 'Целое число <code>s</code> (0 ≤ s < 86400).',
        output: 'Часы, минуты и секунды через двоеточие.',
        tests: [
            { in: '3661', out: '1:1:1' },
            { in: '86399', out: '23:59:59' },
            { in: '0', out: '0:0:0' },
            { in: '45296', out: '12:34:56' }
        ],
        hints: [
            'В часе 3600 секунд, в минуте 60.',
            'Минуты: (s % 3600) / 60.',
            'cout << h << ":" << m << ":" << sec;'
        ],
        starter: STARTER_BASIC,
        solution: `#include <iostream>
using namespace std;
int main(){int s;cin>>s;cout<<s/3600<<":"<<s%3600/60<<":"<<s%60;return 0;}`
    },
    {
        id: 'three_digit_mirror',
        goal: 'Записать трёхзначное число задом наперёд и посчитать сумму его цифр.',
        title: 'Зеркало трёхзначного',
        level: 1, xp: 25,
        requires: ['cin', 'cout', 'int', 'arithmetic', 'modulo'],
        story: 'Число отразилось в витрине, и цифры поменялись местами.',
        spec: 'Дано трёхзначное число. Выведите число, записанное теми же цифрами в обратном порядке, и сумму цифр исходного. Ведущие нули у результата отбрасываются: 120 превращается в 21.',
        input: 'Целое число <code>n</code> (100 ≤ n ≤ 999).',
        output: 'Два числа через пробел: перевёрнутое число и сумма цифр.',
        tests: [
            { in: '123', out: '321 6' },
            { in: '120', out: '21 3' },
            { in: '905', out: '509 14' },
            { in: '999', out: '999 27' }
        ],
        hints: [
            'Цифры: n / 100, n / 10 % 10, n % 10.',
            'Перевёрнутое число = c*100 + b*10 + a — арифметика сама отбросит ведущий ноль.'
        ],
        starter: STARTER_BASIC,
        solution: `#include <iostream>
using namespace std;
int main(){int n;cin>>n;int a=n/100,b=n/10%10,c=n%10;cout<<c*100+b*10+a<<" "<<a+b+c;return 0;}`
    },
    {
        id: 'paint_walls',
        goal: 'Посчитать, сколько упаковок краски нужно на все стены.',
        title: 'Банки с краской',
        level: 1, xp: 25,
        requires: ['cin', 'cout', 'int', 'arithmetic', 'int_division'],
        story: 'Красим комнату: банка краски покрывает ровно 4 квадратных метра, а бракованных стен не бывает.',
        spec: 'Даны ширина <code>w</code> и высота <code>h</code> одной стены, число стен <code>k</code> и число банок в упаковке <code>p</code>. Одна банка красит 4 м².<br>1. Посчитайте общую площадь всех стен.<br>2. Посчитайте, сколько банок нужно (округляя вверх).<br>3. Посчитайте, сколько упаковок нужно (тоже вверх).<br>Выведите число упаковок.',
        input: 'Четыре целых числа: <code>w h k p</code> (1 ≤ все ≤ 1000).',
        output: 'Одно число — количество упаковок.',
        tests: [
            { in: '3 3 4 5', out: '2' },
            { in: '4 2 1 10', out: '1' },
            { in: '5 5 4 3', out: '9' },
            { in: '1 1 1 1', out: '1' }
        ],
        hints: [
            'Округление вверх для целых: (a + b - 1) / b.',
            'Сначала посчитайте общую площадь, затем банки, затем упаковки.'
        ],
        starter: STARTER_BASIC,
        solution: `#include <iostream>
using namespace std;
int main(){int w,h,k,p;cin>>w>>h>>k>>p;int area=w*h*k;int cans=(area+3)/4;int packs=(cans+p-1)/p;cout<<packs;return 0;}`
    },
    {
        id: 'char_shift',
        goal: 'Сдвинуть букву по алфавиту на k позиций по кругу.',
        title: 'Соседи по алфавиту',
        level: 1, xp: 25,
        requires: ['cin', 'cout', 'char', 'arithmetic', 'modulo', 'char_codes'],
        story: 'В шифре Цезаря каждая буква прячется за соседкой.',
        spec: 'Дана строчная латинская буква и целое число <code>k</code> (0 ≤ k ≤ 25). Выведите букву, которая стоит на <code>k</code> позиций дальше по алфавиту, с зацикливанием: после <code>z</code> снова идёт <code>a</code>. Затем через пробел выведите код полученной буквы в ASCII.',
        input: 'Символ и число через пробел.',
        output: 'Буква и её код.',
        tests: [
            { in: 'a 3', out: 'd 100' },
            { in: 'x 5', out: 'c 99' },
            { in: 'z 0', out: 'z 122' },
            { in: 'm 25', out: 'l 108' }
        ],
        hints: [
            "char — это число. 'a' + 1 — это 'b'.",
            "Сдвиг с зацикливанием: (c - 'a' + k) % 26 + 'a'.",
            'Чтобы напечатать код, приведите к int: (int)c или static_cast<int>(c).'
        ],
        starter: STARTER_BASIC,
        solution: `#include <iostream>
using namespace std;
int main(){char c;int k;cin>>c>>k;char r=(c-'a'+k)%26+'a';cout<<r<<" "<<(int)r;return 0;}`
    },
    {
        id: 'average_precise',
        goal: 'Найти среднее трёх чисел с двумя знаками после точки.',
        title: 'Средний балл',
        level: 1, xp: 25,
        requires: ['cin', 'cout', 'double', 'arithmetic', 'iomanip'],
        story: 'В зачётке три оценки, а стипендия зависит от сотых.',
        spec: 'Даны три целые оценки. Выведите их среднее арифметическое ровно с двумя знаками после точки.',
        input: 'Три целых числа.',
        output: 'Среднее с двумя знаками после точки.',
        tests: [
            { in: '5 4 5', out: '4.67' },
            { in: '3 3 3', out: '3.00' },
            { in: '2 5 4', out: '3.67' },
            { in: '0 0 1', out: '0.33' }
        ],
        hints: [
            'Сумма трёх int, делённая на 3, — снова int. Делите на 3.0.',
            'cout << fixed << setprecision(2) << x; (нужен <iomanip>).'
        ],
        starter: STARTER_BASIC,
        solution: `#include <iostream>
#include <iomanip>
using namespace std;
int main(){int a,b,c;cin>>a>>b>>c;cout<<fixed<<setprecision(2)<<(a+b+c)/3.0;return 0;}`
    },
    {
        id: 'overflow_guard',
        goal: 'Перемножить два больших числа, не переполнив int.',
        title: 'Космический тираж',
        level: 1, xp: 30,
        requires: ['cin', 'cout', 'long_long', 'arithmetic'],
        story: 'Типография печатает тиражи книг для колонии на Марсе, и числа там большие.',
        spec: 'Даны число страниц в книге и тираж. Выведите общее число страниц и сколько это полных пачек по 500 листов, если на листе две страницы. Ответ может превышать 2·10⁹.',
        input: 'Два целых числа <code>p</code> и <code>t</code> (1 ≤ p, t ≤ 10⁹).',
        output: 'Два числа через пробел: страницы и полные пачки.',
        tests: [
            { in: '300 10', out: '3000 3' },
            { in: '1000000 1000000', out: '1000000000000 1000000000' },
            { in: '999 1', out: '999 0' },
            { in: '2000000000 1', out: '2000000000 2000000' }
        ],
        hints: [
            'int вмещает примерно 2.1 миллиарда. Здесь мало.',
            'long long вмещает 9.2 · 10¹⁸ — этого хватит.',
            'Пачки: страницы / 1000.'
        ],
        starter: STARTER_BASIC,
        solution: `#include <iostream>
using namespace std;
int main(){long long p,t;cin>>p>>t;long long pages=p*t;cout<<pages<<" "<<pages/1000;return 0;}`
    },
    {
        id: 'string_frame',
        goal: 'Нарисовать рамку из # вокруг слова.',
        title: 'Табличка на двери',
        level: 1, xp: 25,
        requires: ['cin', 'cout', 'string', 'string_size', 'string_index', 'for', 'string_ctor'],
        story: 'Гравёр делает рамку вокруг любого имени, а мы делаем гравёра.',
        spec: 'Дано слово без пробелов. Выведите его в рамке из символов <code>#</code>: верхняя и нижняя строки состоят из решёток, длина которых равна длине слова плюс 4; средняя строка — <code># слово #</code>.',
        input: 'Одно слово (1–50 символов).',
        output: 'Три строки.',
        tests: [
            { in: 'Ada', out: '#######\n# Ada #\n#######' },
            { in: 'x', out: '#####\n# x #\n#####' },
            { in: 'Quest', out: '#########\n# Quest #\n#########' }
        ],
        hints: [
            's.size() — длина строки.',
            'string(n, \'#\') создаёт строку из n решёток — можно без цикла.'
        ],
        starter: STARTER_BASIC,
        solution: `#include <iostream>
#include <string>
using namespace std;
int main(){string s;cin>>s;string bar(s.size()+4,'#');cout<<bar<<"\\n# "<<s<<" #\\n"<<bar;return 0;}`
    },
    {
        id: 'bool_output',
        goal: 'Определить, високосный ли год, одним логическим выражением.',
        title: 'Детектор високосного',
        level: 1, xp: 30,
        requires: ['cin', 'cout', 'bool', 'logical', 'arithmetic', 'modulo'],
        story: 'Календарь для планировщика отпусков: один лишний день раз в четыре года, но не всегда.',
        spec: 'Дан год. Выведите <code>1</code>, если он високосный, иначе <code>0</code>. Год високосный, если делится на 4, но не делится на 100, либо делится на 400. Решите без <code>if</code>: результат логического выражения уже является ответом.',
        input: 'Целое число <code>y</code> (1 ≤ y ≤ 9999).',
        output: '1 или 0.',
        tests: [
            { in: '2024', out: '1' },
            { in: '1900', out: '0' },
            { in: '2000', out: '1' },
            { in: '2023', out: '0' }
        ],
        hints: [
            'bool при выводе печатается как 1 или 0.',
            '(y % 4 == 0 && y % 100 != 0) || y % 400 == 0'
        ],
        starter: STARTER_BASIC,
        solution: `#include <iostream>
using namespace std;
int main(){int y;cin>>y;bool leap=(y%4==0&&y%100!=0)||y%400==0;cout<<leap;return 0;}`
    },
    {
        id: 'hypotenuse',
        goal: 'Найти гипотенузу по двум катетам.',
        title: 'Лестница к окну',
        level: 1, xp: 25,
        requires: ['cin', 'cout', 'double', 'cmath', 'iomanip'],
        story: 'Пожарный расчёт: лестница ставится на расстоянии от стены и должна дотянуться до окна.',
        spec: 'Даны расстояние от стены до основания лестницы и высота окна (вещественные). Выведите минимальную длину лестницы с точностью до трёх знаков.',
        input: 'Два вещественных числа <code>a</code> и <code>h</code>.',
        output: 'Длина с тремя знаками после точки.',
        tests: [
            { in: '3 4', out: '5.000' },
            { in: '1.5 2', out: '2.500' },
            { in: '2 7', out: '7.280' },
            { in: '0 9.5', out: '9.500' }
        ],
        hints: [
            'Теорема Пифагора: sqrt(a*a + h*h) из <cmath>.',
            'fixed << setprecision(3).'
        ],
        starter: STARTER_BASIC,
        solution: `#include <iostream>
#include <iomanip>
#include <cmath>
using namespace std;
int main(){double a,h;cin>>a>>h;cout<<fixed<<setprecision(3)<<sqrt(a*a+h*h);return 0;}`
    },
    {
        id: 'bit_flags',
        goal: 'Включить, выключить и переключить k-й бит числа.',
        title: 'Панель тумблеров',
        level: 1, xp: 35,
        requires: ['cin', 'cout', 'int', 'bitwise', 'xor', 'shifts'],
        story: 'Состояние восьми тумблеров хранится в одном числе, по биту на тумблер.',
        spec: 'Дано число <code>s</code> (0–255) и номер бита <code>k</code> (0 — самый младший). Выведите три числа:<br>1. <code>s</code> с установленным битом k (бит стал 1);<br>2. <code>s</code> со сброшенным битом k (бит стал 0);<br>3. <code>s</code> с инвертированным битом k.<br>Остальные биты не меняются.',
        input: 'Два целых числа <code>s k</code>.',
        output: 'Три числа через пробел.',
        tests: [
            { in: '5 1', out: '7 5 7' },
            { in: '5 0', out: '5 4 4' },
            { in: '0 7', out: '128 0 128' },
            { in: '255 3', out: '255 247 247' }
        ],
        hints: [
            'Маска бита k: 1 << k.',
            'Включить: s | m. Выключить: s & ~m. Переключить: s ^ m.'
        ],
        starter: STARTER_BASIC,
        solution: `#include <iostream>
using namespace std;
int main(){int s,k;cin>>s>>k;int m=1<<k;cout<<(s|m)<<" "<<(s&~m)<<" "<<(s^m);return 0;}`
    },
    {
        id: 'swap_no_temp',
        goal: 'Поменять два числа местами через ^= без третьей переменной.',
        title: 'Обмен без третьего',
        level: 1, xp: 30,
        requires: ['cin', 'cout', 'int', 'xor', 'compound'],
        story: 'В старых микроконтроллерах регистров мало, а поменять два значения местами нужно.',
        spec: 'Считайте два целых числа и поменяйте их местами, не объявляя третьей переменной. Используйте трюк с исключающим ИЛИ (<code>^=</code>) — три операции подряд. Выведите результат.',
        input: 'Два целых числа.',
        output: 'Те же числа в обратном порядке.',
        tests: [
            { in: '3 8', out: '8 3' },
            { in: '-5 12', out: '12 -5' },
            { in: '7 7', out: '7 7' },
            { in: '0 1', out: '1 0' }
        ],
        hints: [
            'a ^= b; b ^= a; a ^= b;',
            'Почему работает: a ^ b ^ b == a.'
        ],
        starter: STARTER_BASIC,
        solution: `#include <iostream>
using namespace std;
int main(){int a,b;cin>>a>>b;a^=b;b^=a;a^=b;cout<<a<<" "<<b;return 0;}`
    },
    {
        id: 'truncation_trap',
        goal: 'Показать разницу между (int)x, floor(x) и round(x).',
        title: 'Ловушка округления',
        level: 1, xp: 30,
        requires: ['cin', 'cout', 'double', 'cast', 'cmath'],
        story: 'Бухгалтер округляет в свою пользу, математик — честно, а компилятор — отбрасывает.',
        spec: 'Дано вещественное число <code>x</code>. Выведите через пробел три целых числа:<br>1. <code>(int)x</code> — дробная часть просто отбрасывается;<br>2. <code>floor(x)</code> — округление вниз;<br>3. <code>round(x)</code> — до ближайшего целого.<br>Для отрицательных чисел первые два отличаются: (int)(-3.7) = -3, а floor(-3.7) = -4.',
        input: 'Одно вещественное число.',
        output: 'Три целых через пробел.',
        tests: [
            { in: '3.7', out: '3 3 4' },
            { in: '-3.7', out: '-3 -4 -4' },
            { in: '-2.2', out: '-2 -3 -2' },
            { in: '5', out: '5 5 5' }
        ],
        hints: [
            'static_cast<int>(x) обрезает к нулю.',
            'floor и round из <cmath> возвращают double — приведите к int перед выводом.'
        ],
        starter: STARTER_BASIC,
        solution: `#include <iostream>
#include <cmath>
using namespace std;
int main(){double x;cin>>x;cout<<static_cast<int>(x)<<" "<<(int)floor(x)<<" "<<(int)round(x);return 0;}`
    }
]);

TaskDB.add([
    {
        id: 'ascii_badge',
        goal: 'Напечатать рамку с кавычками и обратным слешем внутри.',
        title: 'Бейдж участника',
        level: 1, xp: 15,
        requires: ['cout', 'endl', 'escapes'],
        story: 'На конференции всем печатают одинаковые бейджи. Принтер — это вы.',
        spec: 'Выведите ровно четыре строки, как в примере. Обратите внимание: во второй и третьей строках есть кавычки и обратный слеш, их нужно экранировать.',
        input: 'Нет.',
        output: 'Четыре строки.',
        tests: [
            { in: '', out: '+----------------+\n| "C++ Quest"    |\n| level: 1 \\ go  |\n+----------------+' }
        ],
        hints: [
            'Кавычка внутри строки: \\" ; обратный слеш: \\\\',
            'Каждая строка — отдельный cout << "..." << endl; или один cout с \\n.'
        ],
        starter: STARTER_BASIC,
        solution: `#include <iostream>
using namespace std;
int main(){cout<<"+----------------+"<<endl;cout<<"| \\"C++ Quest\\"    |"<<endl;cout<<"| level: 1 \\\\ go  |"<<endl;cout<<"+----------------+"<<endl;return 0;}`
    },
    {
        id: 'expression_order',
        goal: 'Вычислить пять выражений и проверить приоритеты операций.',
        title: 'Порядок действий',
        level: 1, xp: 15,
        requires: ['cout', 'int', 'arithmetic', 'precedence', 'modulo'],
        story: 'Калькулятор в телефоне считает слева направо, компилятор — по приоритетам.',
        spec: 'Объявите переменные <code>a = 7</code>, <code>b = 3</code>, <code>c = 2</code> и выведите через пробел значения выражений: <code>a + b * c</code>, <code>(a + b) * c</code>, <code>a / b * c</code>, <code>a % b + c * c</code>, <code>a - b - c</code>. Считайте вручную, потом проверьте программой.',
        input: 'Нет.',
        output: 'Пять чисел через пробел.',
        tests: [
            { in: '', out: '13 20 4 5 2' }
        ],
        hints: [
            'Умножение и деление выше по приоритету, чем сложение и вычитание.',
            'a / b для int — целочисленное: 7 / 3 == 2.'
        ],
        starter: STARTER_BASIC,
        solution: `#include <iostream>
using namespace std;
int main(){int a=7,b=3,c=2;cout<<a+b*c<<" "<<(a+b)*c<<" "<<a/b*c<<" "<<a%b+c*c<<" "<<a-b-c;return 0;}`
    },
    {
        id: 'rectangle_stats',
        goal: 'Посчитать площадь, периметр и число столбов забора.',
        title: 'Забор вокруг участка',
        level: 1, xp: 20,
        requires: ['cin', 'cout', 'int', 'arithmetic', 'endl'],
        story: 'Строим забор вокруг прямоугольного участка: столб на каждом углу и через каждый метр.',
        spec: 'Даны целые длина и ширина участка в метрах. Выведите три строки: площадь, периметр и количество столбов, если столбы стоят по периметру через каждый метр (углы тоже столбы).',
        input: 'Два целых числа (1 ≤ a, b ≤ 10⁴).',
        output: 'Три числа, каждое на своей строке.',
        tests: [
            { in: '3 2', out: '6\n10\n10' },
            { in: '1 1', out: '1\n4\n4' },
            { in: '10000 10000', out: '100000000\n40000\n40000' }
        ],
        hints: [
            'Периметр = 2 * (a + b).',
            'Столбов ровно столько же, сколько метров в периметре.'
        ],
        starter: STARTER_BASIC,
        solution: `#include <iostream>
using namespace std;
int main(){int a,b;cin>>a>>b;cout<<a*b<<endl<<2*(a+b)<<endl<<2*(a+b)<<endl;return 0;}`
    },
    {
        id: 'time_add',
        goal: 'Прибавить минуты ко времени с переходом через сутки.',
        title: 'Будильник',
        level: 1, xp: 20,
        requires: ['cin', 'cout', 'int', 'arithmetic', 'modulo'],
        story: 'Будильник заведён на время, а поспать хочется ещё сколько-то минут.',
        spec: 'Даны часы, минуты и число минут, которое нужно прибавить (может быть большим, больше суток). Выведите новое время в формате <code>Ч М</code> (без ведущих нулей) и через пробел — сколько полных суток прошло.',
        input: 'Три целых числа: <code>h m add</code> (0 ≤ h < 24, 0 ≤ m < 60, 0 ≤ add ≤ 10⁶).',
        output: 'Три числа.',
        tests: [
            { in: '23 50 20', out: '0 10 1' },
            { in: '9 15 0', out: '9 15 0' },
            { in: '0 0 1440', out: '0 0 1' },
            { in: '12 30 100000', out: '23 10 69' }
        ],
        hints: [
            'Переведите всё в минуты с начала суток: h * 60 + m + add.',
            'Сутки — 1440 минут. Часы: (total % 1440) / 60.'
        ],
        starter: STARTER_BASIC,
        solution: `#include <iostream>
using namespace std;
int main(){int h,m,a;cin>>h>>m>>a;int t=h*60+m+a;cout<<(t%1440)/60<<" "<<t%60<<" "<<t/1440;return 0;}`
    },
    {
        id: 'last_digits',
        goal: 'Вывести две последние цифры числа, игнорируя знак.',
        title: 'Две последние цифры',
        level: 1, xp: 20,
        requires: ['cin', 'cout', 'int', 'arithmetic', 'modulo'],
        story: 'Лотерейный билет выигрывает, если две последние цифры номера совпадают с тиражом.',
        spec: 'Дано целое число (может быть отрицательным). Выведите его две последние цифры как отдельные числа через пробел: сначала десятки, потом единицы. Знак игнорируется. Для чисел меньше 10 по модулю десятки равны 0.',
        input: 'Одно целое число (|n| ≤ 10⁹).',
        output: 'Две цифры через пробел.',
        tests: [
            { in: '2026', out: '2 6' },
            { in: '-7', out: '0 7' },
            { in: '100', out: '0 0' },
            { in: '-19', out: '1 9' }
        ],
        hints: [
            'Остаток от деления отрицательного числа в C++ отрицательный: -7 % 10 == -7. Сначала уберите знак.',
            'Без abs: если n < 0, то n = -n — но это if. Можно арифметикой: n = n * ((n > 0) - (n < 0)).'
        ],
        starter: STARTER_BASIC,
        solution: `#include <iostream>
using namespace std;
int main(){int n;cin>>n;n=n*((n>0)-(n<0));cout<<n/10%10<<" "<<n%10;return 0;}`
    }
]);
