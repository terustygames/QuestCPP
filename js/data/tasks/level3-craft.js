/* Уровень 3 — Ремесло: функции, массивы, строки, указатели и ссылки. */

TaskDB.add([
    {
        id: 'func_digits_sum_root',
        goal: 'Написать функцию суммы цифр и с её помощью найти цифровой корень.',
        title: 'Цифровой корень',
        level: 3, xp: 45,
        requires: ['func_decl', 'while', 'recursion', 'long_long', 'modulo'],
        story: 'Нумерологи складывают цифры, пока не останется одна. Мы делаем это функцией.',
        spec: 'Напишите функцию <code>int digitSum(long long n)</code> и функцию <code>int digitalRoot(long long n)</code>, которая рекурсивно применяет digitSum, пока результат не станет однозначным. Для <code>t</code> чисел выведите цифровой корень и число шагов, за которое он достигнут.',
        input: 't, затем t чисел (0 ≤ n ≤ 10¹⁸).',
        output: 't строк: корень и число шагов.',
        tests: [
            { in: '3\n493193\n9\n999999999999999999', out: '2 3\n9 0\n9 2' },
            { in: '1\n0', out: '0 0' },
            { in: '2\n10\n19', out: '1 1\n1 2' }
        ],
        hints: [
            'Шаги: сколько раз пришлось применить digitSum, пока n >= 10.',
            'Рекурсия: если n < 10 — вернуть n, иначе digitalRoot(digitSum(n)).'
        ],
        starter: `#include <iostream>
using namespace std;

int digitSum(long long n) {
    // сумма цифр
    return 0;
}

int main() {
    int t;
    cin >> t;
    // ...
    return 0;
}
`,
        solution: `#include <iostream>
using namespace std;
int digitSum(long long n){int s=0;while(n>0){s+=n%10;n/=10;}return s;}
int main(){int t;cin>>t;while(t--){long long n;cin>>n;int steps=0;while(n>=10){n=digitSum(n);steps++;}cout<<n<<" "<<steps<<"\\n";}return 0;}`
    },
    {
        id: 'swap_by_ref_stats',
        goal: 'Вернуть из функции минимум, максимум и их индексы через ссылочные параметры.',
        title: 'Минимум и максимум по ссылке',
        level: 3, xp: 45,
        requires: ['func_decl', 'pass_by_ref', 'for', 'c_array', 'array_to_func', 'array_index'],
        story: 'Функция не может вернуть два значения через return, но ей это и не нужно.',
        spec: 'Реализуйте <code>void minMax(int a[], int n, int& mn, int& mx, int& mnIdx, int& mxIdx)</code>, которая находит минимум и максимум массива и их индексы (первое вхождение). В main считайте n и массив, вызовите функцию и выведите четыре значения.',
        input: 'n (1 ≤ n ≤ 1000), затем n целых.',
        output: 'min minIdx max maxIdx через пробел.',
        tests: [
            { in: '5\n3 -1 7 -1 7', out: '-1 1 7 2' },
            { in: '1\n42', out: '42 0 42 0' },
            { in: '4\n5 5 5 5', out: '5 0 5 0' }
        ],
        hints: [
            'Ссылочные параметры int& меняют переменные вызывающего кода.',
            'Для первого вхождения используйте строгие сравнения < и >.'
        ],
        starter: `#include <iostream>
using namespace std;

void minMax(int a[], int n, int& mn, int& mx, int& mnIdx, int& mxIdx) {
    // ...
}

int main() {
    int n;
    cin >> n;
    int a[1000];
    for (int i = 0; i < n; i++) cin >> a[i];
    int mn, mx, mnIdx, mxIdx;
    minMax(a, n, mn, mx, mnIdx, mxIdx);
    cout << mn << " " << mnIdx << " " << mx << " " << mxIdx;
    return 0;
}
`,
        solution: `#include <iostream>
using namespace std;
void minMax(int a[],int n,int& mn,int& mx,int& mnIdx,int& mxIdx){mn=mx=a[0];mnIdx=mxIdx=0;for(int i=1;i<n;i++){if(a[i]<mn){mn=a[i];mnIdx=i;}if(a[i]>mx){mx=a[i];mxIdx=i;}}}
int main(){int n;cin>>n;int a[1000];for(int i=0;i<n;i++)cin>>a[i];int mn,mx,mi,xi;minMax(a,n,mn,mx,mi,xi);cout<<mn<<" "<<mi<<" "<<mx<<" "<<xi;return 0;}`
    },
    {
        id: 'rotate_array',
        goal: 'Циклически сдвинуть массив на k позиций (k любое).',
        title: 'Карусель',
        level: 3, xp: 45,
        requires: ['c_array', 'for', 'arithmetic', 'array_bounds', 'modulo', 'array_index'],
        story: 'Карусель крутится на k мест, и каждая лошадка оказывается на новом месте.',
        spec: 'Дан массив из n чисел и число k (может быть больше n и отрицательным). Выведите массив, циклически сдвинутый вправо на k позиций. Отрицательный k — сдвиг влево. Сделайте это без вложенных циклов: вычислите новый индекс каждого элемента арифметически.',
        input: 'n k, затем n чисел (1 ≤ n ≤ 1000, |k| ≤ 10⁹).',
        output: 'n чисел через пробел.',
        compare: 'tokens',
        tests: [
            { in: '5 2\n1 2 3 4 5', out: '4 5 1 2 3' },
            { in: '5 -1\n1 2 3 4 5', out: '2 3 4 5 1' },
            { in: '3 1000000000\n7 8 9', out: '9 7 8' },
            { in: '1 5\n1', out: '1' }
        ],
        hints: [
            'Нормализуйте k: k = ((k % n) + n) % n.',
            'Элемент с индекса i едет на (i + k) % n.'
        ],
        starter: STARTER_BASIC,
        solution: `#include <iostream>
using namespace std;
int main(){int n;long long k;cin>>n>>k;int a[1000],b[1000];for(int i=0;i<n;i++)cin>>a[i];int s=((k%n)+n)%n;for(int i=0;i<n;i++)b[(i+s)%n]=a[i];for(int i=0;i<n;i++){if(i)cout<<" ";cout<<b[i];}return 0;}`
    },
    {
        id: 'matrix_spiral_sum',
        goal: 'Посчитать суммы двух диагоналей и рамки квадратной матрицы.',
        title: 'Диагонали и рамка',
        level: 3, xp: 50,
        requires: ['multidim_array', 'nested_loops', 'if', 'logical', 'array_index'],
        story: 'Аналитик смотрит на квадратную таблицу и хочет знать, где сосредоточены значения.',
        spec: 'Дана матрица n×n. Выведите три числа: сумму главной диагонали, сумму побочной диагонали (центральный элемент при нечётном n считается один раз в каждой) и сумму элементов, лежащих на границе матрицы.',
        input: 'n, затем n строк по n чисел (1 ≤ n ≤ 50).',
        output: 'Три числа через пробел.',
        tests: [
            { in: '3\n1 2 3\n4 5 6\n7 8 9', out: '15 15 40' },
            { in: '1\n7', out: '7 7 7' },
            { in: '2\n1 2\n3 4', out: '5 5 10' }
        ],
        hints: [
            'Главная диагональ: i == j. Побочная: i + j == n - 1.',
            'Граница: i == 0 || j == 0 || i == n-1 || j == n-1.'
        ],
        starter: STARTER_BASIC,
        solution: `#include <iostream>
using namespace std;
int main(){int n;cin>>n;int m[50][50];for(int i=0;i<n;i++)for(int j=0;j<n;j++)cin>>m[i][j];long long d1=0,d2=0,b=0;for(int i=0;i<n;i++)for(int j=0;j<n;j++){if(i==j)d1+=m[i][j];if(i+j==n-1)d2+=m[i][j];if(i==0||j==0||i==n-1||j==n-1)b+=m[i][j];}cout<<d1<<" "<<d2<<" "<<b;return 0;}`
    },
    {
        id: 'palindrome_clean',
        goal: 'Проверить палиндром, игнорируя всё, кроме букв и цифр, двумя индексами.',
        title: 'Палиндром с помехами',
        level: 3, xp: 50,
        requires: ['string', 'getline', 'string_size', 'string_index', 'cctype', 'while', 'bool', 'two_pointers'],
        story: 'Фраза «А роза упала на лапу Азора» — палиндром, если не обращать внимания на пробелы и регистр.',
        spec: 'Дана строка (латиница, цифры, пробелы, знаки препинания). Выведите <code>yes</code>, если она читается одинаково в обе стороны с учётом только букв и цифр без учёта регистра, и <code>no</code> иначе. Не создавайте очищенную копию: используйте два индекса, идущих навстречу.',
        input: 'Одна строка (до 1000 символов).',
        output: 'yes или no.',
        tests: [
            { in: 'A man, a plan, a canal: Panama', out: 'yes' },
            { in: 'race a car', out: 'no' },
            { in: '.,!', out: 'yes' },
            { in: 'No lemon, no melon', out: 'yes' },
            { in: 'ab', out: 'no' }
        ],
        hints: [
            'isalnum(c) из <cctype> проверяет букву или цифру.',
            'Пропускайте «мусор» с обеих сторон, затем сравнивайте tolower(s[i]) и tolower(s[j]).'
        ],
        starter: STARTER_BASIC,
        solution: `#include <iostream>
#include <string>
#include <cctype>
using namespace std;
int main(){string s;getline(cin,s);int i=0,j=(int)s.size()-1;bool ok=true;while(i<j){while(i<j&&!isalnum(s[i]))i++;while(i<j&&!isalnum(s[j]))j--;if(tolower(s[i])!=tolower(s[j])){ok=false;break;}i++;j--;}cout<<(ok?"yes":"no");return 0;}`
    },
    {
        id: 'word_stats_line',
        goal: 'Посчитать слова, найти самое длинное и число заглавных букв.',
        title: 'Инспектор предложений',
        level: 3, xp: 50,
        requires: ['string', 'getline', 'string_size', 'string_index', 'for', 'if', 'cctype', 'string_modify'],
        story: 'Редактор проверяет предложение: количество слов, самое длинное и сколько букв в верхнем регистре.',
        spec: 'Дана строка со словами, разделёнными одним или несколькими пробелами (могут быть ведущие и хвостовые). Выведите количество слов, самое длинное слово (первое при равенстве) и число заглавных букв. Если слов нет, выведите <code>0</code>.',
        input: 'Одна строка.',
        output: 'Три значения через пробел или 0.',
        tests: [
            { in: '  The quick  brown Fox   ', out: '4 quick 2' },
            { in: 'a', out: '1 a 0' },
            { in: '      ', out: '0' },
            { in: 'HELLO world WORLDS', out: '3 WORLDS 11' }
        ],
        hints: [
            'Идите по символам, собирая текущее слово; пробел завершает слово.',
            'Не забудьте обработать последнее слово после цикла.'
        ],
        starter: STARTER_BASIC,
        solution: `#include <iostream>
#include <string>
#include <cctype>
using namespace std;
int main(){string s;getline(cin,s);string cur,best;int words=0,up=0;for(size_t i=0;i<=s.size();i++){char c=i<s.size()?s[i]:' ';if(c==' '){if(!cur.empty()){words++;if(cur.size()>best.size())best=cur;cur.clear();}}else{cur+=c;if(isupper(c))up++;}}if(words==0)cout<<0;else cout<<words<<" "<<best<<" "<<up;return 0;}`
    },
    {
        id: 'run_length',
        goal: 'Сжать строку: серии одинаковых букв заменить на букву и число.',
        title: 'Сжатие вывески',
        level: 3, xp: 50,
        requires: ['string', 'string_size', 'string_index', 'for', 'string_conv', 'if', 'substr'],
        story: 'Неоновая вывеска «aaabbc» стоит дороже, чем «a3b2c1», а светит так же.',
        spec: 'Дана строка из латинских букв. Сожмите её: каждую серию одинаковых подряд идущих символов замените на символ и длину серии. Если сжатая строка длиннее исходной, выведите исходную.',
        input: 'Строка (1–1000 символов).',
        output: 'Одна строка.',
        tests: [
            { in: 'aaabbc', out: 'a3b2c1' },
            { in: 'abc', out: 'abc' },
            { in: 'aabb', out: 'a2b2' },
            { in: 'zzzzzzzzzzzz', out: 'z12' }
        ],
        hints: [
            'to_string(count) превращает число в строку.',
            'Серия завершается, когда следующий символ другой или строка кончилась.'
        ],
        starter: STARTER_BASIC,
        solution: `#include <iostream>
#include <string>
using namespace std;
int main(){string s;cin>>s;string r;for(size_t i=0;i<s.size();){size_t j=i;while(j<s.size()&&s[j]==s[i])j++;r+=s[i];r+=to_string(j-i);i=j;}cout<<(r.size()>s.size()?s:r);return 0;}`
    },
    {
        id: 'pointer_walk',
        goal: 'Пройти массив только указателями: сумма, середина, индекс максимума.',
        title: 'Прогулка по адресам',
        level: 3, xp: 50,
        requires: ['pointer_decl', 'dereference', 'pointer_arith', 'c_array', 'while', 'array_index'],
        story: 'Указатель — это турист с картой памяти. Пройдём массив, не используя ни одного индекса.',
        spec: 'Дан массив из n чисел. Не используйте запись <code>a[i]</code> — только указатели: <code>*p</code>, <code>p++</code>, <code>a + k</code>.<br>Выведите три числа:<br>1. сумму всех элементов;<br>2. значение среднего элемента — <code>*(a + n/2)</code>;<br>3. индекс первого максимума, вычисленный как разность указателей <code>pmax - a</code>.',
        input: 'n, затем n чисел (1 ≤ n ≤ 1000).',
        output: 'Три числа.',
        tests: [
            { in: '5\n4 9 2 9 1', out: '25 2 1' },
            { in: '1\n5', out: '5 5 0' },
            { in: '4\n-1 -2 -3 -4', out: '-10 -3 0' }
        ],
        hints: [
            'int* p = a; int* end = a + n; while (p != end) { sum += *p; p++; }',
            'Индекс через указатели: best - a.'
        ],
        starter: `#include <iostream>
using namespace std;

int main() {
    int n;
    cin >> n;
    int a[1000];
    for (int* p = a; p != a + n; p++) cin >> *p;

    // Дальше — только указатели

    return 0;
}
`,
        solution: `#include <iostream>
using namespace std;
int main(){int n;cin>>n;int a[1000];for(int* p=a;p!=a+n;p++)cin>>*p;long long sum=0;int* best=a;for(int* p=a;p!=a+n;p++){sum+=*p;if(*p>*best)best=p;}cout<<sum<<" "<<*(a+n/2)<<" "<<(best-a);return 0;}`
    },
    {
        id: 'reference_alias',
        goal: 'Проделать четыре шага со ссылкой и указателем и вывести результат.',
        title: 'Псевдонимы и адреса',
        level: 3, xp: 45,
        requires: ['reference', 'pointer_decl', 'address_of', 'dereference', 'bool'],
        story: 'Ссылка — второе имя, указатель — адрес. Проверим, кто на что указывает.',
        spec: 'Считайте два целых <code>x</code> и <code>y</code>. Выполните по порядку:<br>1. <code>int& r = x;</code> и <code>int* p = &y;</code><br>2. <code>r += y;</code><br>3. <code>*p = x * 2;</code><br>4. <code>p = &x;</code><br>Выведите через пробел: <code>x</code>, <code>y</code>, <code>*p</code> и <code>(&r == p)</code> (напечатается 1 или 0).',
        input: 'Два целых числа.',
        output: 'Четыре числа.',
        tests: [
            { in: '3 4', out: '7 14 7 1' },
            { in: '0 0', out: '0 0 0 1' },
            { in: '-2 5', out: '3 6 3 1' }
        ],
        hints: [
            'После r += y переменная x изменилась — r и есть x.',
            '&r даёт адрес x, потому что ссылка не имеет собственного адреса.'
        ],
        starter: STARTER_BASIC,
        solution: `#include <iostream>
using namespace std;
int main(){int x,y;cin>>x>>y;int& r=x;int* p=&y;r+=y;*p=x*2;p=&x;cout<<x<<" "<<y<<" "<<*p<<" "<<(&r==p);return 0;}`
    },
    {
        id: 'dynamic_histogram',
        goal: 'Выделить массив через new, посчитать частоты, нарисовать гистограмму, освободить память.',
        title: 'Гистограмма на куче',
        level: 3, xp: 55,
        requires: ['new_delete', 'pointer_decl', 'for', 'nested_loops', 'array_index'],
        story: 'Размер данных известен только на входе, поэтому массив живёт в динамической памяти.',
        spec: 'Дано m — число корзин, и n чисел от 0 до m-1. Выделите массив счётчиков через <code>new int[m]</code>, посчитайте попадания и нарисуйте гистограмму: для каждой корзины строка вида <code>i: ####</code> с числом решёток, равным количеству. Освободите память через <code>delete[]</code>.',
        input: 'm n, затем n чисел (1 ≤ m ≤ 20, 0 ≤ n ≤ 1000).',
        output: 'm строк.',
        tests: [
            { in: '3 5\n0 2 2 1 2', out: '0: #\n1: #\n2: ###' },
            { in: '2 0', out: '0: \n1: ' },
            { in: '1 3\n0 0 0', out: '0: ###' }
        ],
        hints: [
            'new int[m]() — с круглыми скобками массив обнулится.',
            'После двоеточия всегда пробел, даже если корзина пуста.'
        ],
        starter: STARTER_BASIC,
        solution: `#include <iostream>
using namespace std;
int main(){int m,n;cin>>m>>n;int* c=new int[m]();for(int i=0;i<n;i++){int x;cin>>x;c[x]++;}for(int i=0;i<m;i++){cout<<i<<": ";for(int k=0;k<c[i];k++)cout<<'#';cout<<"\\n";}delete[] c;return 0;}`
    },
    {
        id: 'overload_area',
        goal: 'Написать три перегрузки area() для круга, прямоугольника и треугольника.',
        title: 'Три площади, одно имя',
        level: 3, xp: 45,
        requires: ['func_overload', 'double', 'iomanip', 'switch', 'char', 'cmath', 'cin_loop'],
        story: 'Геодезист измеряет участки разной формы, но команда одна: area.',
        spec: 'Реализуйте три перегрузки: <code>area(double r)</code> — круг (π = 3.14159265), <code>area(double a, double b)</code> — прямоугольник, <code>area(double a, double b, double c)</code> — треугольник по формуле Герона. Читайте запросы вида <code>C r</code>, <code>R a b</code>, <code>T a b c</code> до конца ввода и выводите площади с двумя знаками.',
        input: 'Строки запросов.',
        output: 'По одному числу на строку.',
        tests: [
            { in: 'C 1\nR 2 3\nT 3 4 5', out: '3.14\n6.00\n6.00' },
            { in: 'T 1 1 1', out: '0.43' },
            { in: 'R 0.5 0.5\nC 0', out: '0.25\n0.00' }
        ],
        hints: [
            'Формула Герона: p = (a+b+c)/2, S = sqrt(p(p-a)(p-b)(p-c)).',
            'while (cin >> type) — читает до конца ввода.'
        ],
        starter: `#include <iostream>
#include <iomanip>
#include <cmath>
using namespace std;

double area(double r) { return 0; }
double area(double a, double b) { return 0; }
double area(double a, double b, double c) { return 0; }

int main() {
    cout << fixed << setprecision(2);
    char t;
    while (cin >> t) {
        // ...
    }
    return 0;
}
`,
        solution: `#include <iostream>
#include <iomanip>
#include <cmath>
using namespace std;
double area(double r){return 3.14159265*r*r;}
double area(double a,double b){return a*b;}
double area(double a,double b,double c){double p=(a+b+c)/2;return sqrt(p*(p-a)*(p-b)*(p-c));}
int main(){cout<<fixed<<setprecision(2);char t;while(cin>>t){double a,b,c;switch(t){case 'C':cin>>a;cout<<area(a)<<"\\n";break;case 'R':cin>>a>>b;cout<<area(a,b)<<"\\n";break;case 'T':cin>>a>>b>>c;cout<<area(a,b,c)<<"\\n";break;}}return 0;}`
    },
    {
        id: 'hanoi_moves',
        goal: 'Рекурсивно вывести все ходы Ханойской башни.',
        title: 'Ханойская башня',
        level: 3, xp: 55,
        requires: ['recursion', 'func_decl', 'void', 'cout'],
        story: 'Монахи перекладывают 64 диска и, по легенде, после этого наступит конец света. У нас дисков поменьше.',
        spec: 'Дано n (1 ≤ n ≤ 10). Выведите последовательность ходов, переносящую n дисков со стержня A на стержень C через B. Ход записывается как <code>A->C</code>. В конце выведите общее число ходов.',
        input: 'Одно число.',
        output: 'Ходы по одному в строке и итоговое число.',
        tests: [
            { in: '2', out: 'A->B\nA->C\nB->C\n3' },
            { in: '1', out: 'A->C\n1' },
            { in: '3', out: 'A->C\nA->B\nC->B\nA->C\nB->A\nB->C\nA->C\n7' }
        ],
        hints: [
            'hanoi(n, from, to, via): перенеси n-1 на via, один на to, n-1 с via на to.',
            'Число ходов всегда 2^n - 1.'
        ],
        starter: `#include <iostream>
using namespace std;

void hanoi(int n, char from, char to, char via) {
    // ...
}

int main() {
    int n;
    cin >> n;
    hanoi(n, 'A', 'C', 'B');
    return 0;
}
`,
        solution: `#include <iostream>
using namespace std;
int moves=0;
void hanoi(int n,char f,char t,char v){if(n==0)return;hanoi(n-1,f,v,t);cout<<f<<"->"<<t<<"\\n";moves++;hanoi(n-1,v,t,f);}
int main(){int n;cin>>n;hanoi(n,'A','C','B');cout<<moves;return 0;}`
    },
    {
        id: 'caesar_words',
        goal: 'Зашифровать строку сдвигом букв, сохраняя регистр и не трогая остальные символы.',
        title: 'Шифровка донесения',
        level: 3, xp: 50,
        requires: ['string', 'getline', 'cctype', 'for', 'char', 'if', 'else', 'cin_ignore', 'char_codes', 'modulo', 'range_for'],
        story: 'Донесение шифруется сдвигом, но цифры и знаки препинания остаются как есть.',
        spec: 'Дан сдвиг k (может быть отрицательным и большим по модулю) и строка. Сдвиньте каждую латинскую букву на k позиций с сохранением регистра и зацикливанием; остальные символы не трогайте.',
        input: 'Число k, затем строка на следующей строке.',
        output: 'Зашифрованная строка.',
        tests: [
            { in: '3\nHello, World!', out: 'Khoor, Zruog!' },
            { in: '-3\nKhoor, Zruog!', out: 'Hello, World!' },
            { in: '52\nabc XYZ 123', out: 'abc XYZ 123' },
            { in: '-27\nb', out: 'a' }
        ],
        hints: [
            'Нормализуйте k: ((k % 26) + 26) % 26.',
            'После cin >> k в буфере остаётся перенос строки — уберите его через cin.ignore() перед getline.'
        ],
        starter: STARTER_BASIC,
        solution: `#include <iostream>
#include <string>
#include <cctype>
using namespace std;
int main(){long long k;cin>>k;cin.ignore();string s;getline(cin,s);int sh=((k%26)+26)%26;for(char& c:s){if(isupper(c))c=(c-'A'+sh)%26+'A';else if(islower(c))c=(c-'a'+sh)%26+'a';}cout<<s;return 0;}`
    },
    {
        id: 'default_args_progress',
        goal: 'Написать функцию bar() с аргументами по умолчанию, рисующую полосу прогресса.',
        title: 'Полоска прогресса',
        level: 3, xp: 40,
        requires: ['default_args', 'func_decl', 'string', 'for', 'string_ctor', 'string_conv', 'cin_loop'],
        story: 'Консольные утилиты рисуют прогресс из символов, и у всех разный вкус к оформлению.',
        spec: 'Напишите функцию <code>string bar(int percent, int width = 10, char fill = \'#\', char empty = \'.\')</code>. Она возвращает строку вида <code>[####......] 40%</code>: всего <code>width</code> клеток, из них заполнено <code>percent * width / 100</code>.<br>Каждая строка ввода начинается с числа <code>k</code> (от 1 до 4) — сколько аргументов передать в bar, дальше идут сами аргументы по порядку. Недостающие берутся по умолчанию.',
        input: 'Строки вида <code>k v1 ... vk</code> до конца ввода.',
        output: 'По одной полоске на строку.',
        tests: [
            { in: '1 40\n2 50 4\n4 100 5 = -', out: '[####......] 40%\n[##..] 50%\n[=====] 100%' },
            { in: '1 0', out: '[..........] 0%' },
            { in: '3 33 3 *', out: '[...] 33%' },
            { in: '3 34 3 *', out: '[*..] 34%' }
        ],
        hints: [
            'Аргументы по умолчанию указываются только в объявлении, справа налево.',
            'Строка из n символов: string(n, c).'
        ],
        starter: `#include <iostream>
#include <string>
using namespace std;

string bar(int percent, int width = 10, char fill = '#', char empty = '.') {
    return "";
}

int main() {
    int k;
    while (cin >> k) {
        // ...
    }
    return 0;
}
`,
        solution: `#include <iostream>
#include <string>
using namespace std;
string bar(int percent,int width=10,char fill='#',char empty='.'){int f=percent*width/100;return "["+string(f,fill)+string(width-f,empty)+"] "+to_string(percent)+"%";}
int main(){int k;while(cin>>k){int p,w;char f,e;cin>>p;if(k==1){cout<<bar(p)<<"\\n";continue;}cin>>w;if(k==2){cout<<bar(p,w)<<"\\n";continue;}cin>>f;if(k==3){cout<<bar(p,w,f)<<"\\n";continue;}cin>>e;cout<<bar(p,w,f,e)<<"\\n";}return 0;}`
    }
]);
