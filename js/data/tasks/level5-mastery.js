/* Уровень 5 — Мастерство: ООП, шаблоны, исключения, умные указатели. */

TaskDB.add([
    {
        id: 'class_bank_account',
        title: 'Банковский счёт',
        level: 5, xp: 70,
        requires: ['class', 'public_private', 'constructor', 'this', 'bool', 'while'],
        story: 'Банк доверяет классу больше, чем кассиру: баланс нельзя тронуть напрямую.',
        spec: 'Реализуйте класс <code>Account</code> с приватным балансом и публичными методами <code>deposit(x)</code>, <code>bool withdraw(x)</code> (отклоняет, если средств не хватает или x ≤ 0) и <code>balance()</code>. Обрабатывайте команды <code>D x</code>, <code>W x</code>, <code>B</code>. На команду W выводите <code>ok</code> или <code>denied</code>, на B — баланс. В конце выведите количество отклонённых операций.',
        input: 'Начальный баланс, затем команды до конца ввода.',
        output: 'Ответы на команды и итоговое число отклонений.',
        tests: [
            { in: '100\nW 30\nW 80\nB\nD 10\nW 80\nB', out: 'ok\ndenied\n70\nok\n0\n1' },
            { in: '0\nW 0\nB', out: 'denied\n0\n1' },
            { in: '5\nD 5\nW 10\nB', out: 'ok\n0\n0' }
        ],
        hints: [
            'Счётчик отказов — тоже поле класса.',
            'withdraw возвращает bool: так вызывающий код узнает результат.'
        ],
        starter: `#include <iostream>
using namespace std;

class Account {
private:
    long long balance_;
    int denied_ = 0;
public:
    Account(long long start) : balance_(start) {}
    // deposit, withdraw, balance, denied
};

int main() {
    long long start;
    cin >> start;
    Account acc(start);
    char cmd;
    while (cin >> cmd) {
        // ...
    }
    return 0;
}
`,
        solution: `#include <iostream>
using namespace std;
class Account{long long b;int d=0;public:Account(long long s):b(s){}void deposit(long long x){if(x>0)b+=x;}bool withdraw(long long x){if(x<=0||x>b){d++;return false;}b-=x;return true;}long long balance()const{return b;}int denied()const{return d;}};
int main(){long long s;cin>>s;Account a(s);char c;while(cin>>c){if(c=='D'){long long x;cin>>x;a.deposit(x);}else if(c=='W'){long long x;cin>>x;cout<<(a.withdraw(x)?"ok":"denied")<<"\\n";}else if(c=='B')cout<<a.balance()<<"\\n";}cout<<a.denied();return 0;}`
    },
    {
        id: 'virtual_shapes',
        title: 'Галерея фигур',
        level: 5, xp: 75,
        requires: ['inheritance', 'virtual', 'override', 'abstract', 'smart_ptr', 'vector', 'iomanip'],
        story: 'Графический редактор хранит фигуры в одном списке и не хочет знать, кто из них кто.',
        spec: 'Опишите абстрактный класс <code>Shape</code> с чисто виртуальными <code>area()</code> и <code>name()</code>, наследников <code>Circle(r)</code>, <code>Rect(w, h)</code>, <code>Square(a)</code> (наследник Rect). Считайте фигуры в <code>vector&lt;unique_ptr&lt;Shape&gt;&gt;</code>, выведите каждую как <code>name area</code> (два знака) и в конце имя фигуры с наибольшей площадью. π = 3.14159265.',
        input: 'n, затем n строк: <code>C r</code>, <code>R w h</code> или <code>S a</code>.',
        output: 'n строк и имя лидера.',
        tests: [
            { in: '3\nC 1\nR 2 3\nS 2', out: 'circle 3.14\nrect 6.00\nsquare 4.00\nrect' },
            { in: '1\nS 1', out: 'square 1.00\nsquare' },
            { in: '2\nC 2\nR 3 4', out: 'circle 12.57\nrect 12.00\ncircle' }
        ],
        hints: [
            'Square наследует Rect и вызывает Rect(a, a) в списке инициализации.',
            'Виртуальный деструктор в Shape обязателен при удалении через указатель на базу.'
        ],
        starter: `#include <iostream>
#include <iomanip>
#include <memory>
#include <vector>
#include <string>
using namespace std;

class Shape {
public:
    virtual double area() const = 0;
    virtual string name() const = 0;
    virtual ~Shape() {}
};

// Circle, Rect, Square

int main() {
    int n;
    cin >> n;
    vector<unique_ptr<Shape>> shapes;
    // ...
    return 0;
}
`,
        solution: `#include <iostream>
#include <iomanip>
#include <memory>
#include <vector>
#include <string>
using namespace std;
class Shape{public:virtual double area()const=0;virtual string name()const=0;virtual ~Shape(){}};
class Circle:public Shape{double r;public:Circle(double r):r(r){}double area()const override{return 3.14159265*r*r;}string name()const override{return "circle";}};
class Rect:public Shape{protected:double w,h;public:Rect(double w,double h):w(w),h(h){}double area()const override{return w*h;}string name()const override{return "rect";}};
class Square:public Rect{public:Square(double a):Rect(a,a){}string name()const override{return "square";}};
int main(){int n;cin>>n;vector<unique_ptr<Shape>> v;for(int i=0;i<n;i++){char t;cin>>t;if(t=='C'){double r;cin>>r;v.push_back(make_unique<Circle>(r));}else if(t=='R'){double w,h;cin>>w>>h;v.push_back(make_unique<Rect>(w,h));}else{double a;cin>>a;v.push_back(make_unique<Square>(a));}}cout<<fixed<<setprecision(2);const Shape* best=nullptr;for(auto& s:v){cout<<s->name()<<" "<<s->area()<<"\\n";if(!best||s->area()>best->area())best=s.get();}cout<<best->name();return 0;}`
    },
    {
        id: 'operator_overload_vec2',
        title: 'Векторная арифметика',
        level: 5, xp: 70,
        requires: ['operator_overload', 'struct', 'friend', 'const', 'iomanip'],
        story: 'Физический движок складывает силы, и код должен читаться как формулы.',
        spec: 'Опишите <code>struct Vec2 { double x, y; }</code> с операторами <code>+</code>, <code>-</code>, умножение на число <code>*</code> (в обе стороны), сравнение <code>==</code> и вывод через <code>&lt;&lt;</code> в формате <code>(x, y)</code> с одним знаком. Считайте два вектора и число k; выведите a + b, a - b, a * k, k * b и результат a == b.',
        input: 'Шесть чисел (a.x a.y b.x b.y) и k.',
        output: 'Пять строк.',
        tests: [
            { in: '1 2 3 4 2', out: '(4.0, 6.0)\n(-2.0, -2.0)\n(2.0, 4.0)\n(6.0, 8.0)\n0' },
            { in: '1 1 1 1 0', out: '(2.0, 2.0)\n(0.0, 0.0)\n(0.0, 0.0)\n(0.0, 0.0)\n1' }
        ],
        hints: [
            'k * v требует свободной функции: Vec2 operator*(double k, const Vec2& v).',
            'operator<< — friend или свободная функция, принимающая ostream&.'
        ],
        starter: `#include <iostream>
#include <iomanip>
using namespace std;

struct Vec2 {
    double x, y;
    // операторы
};

int main() {
    cout << fixed << setprecision(1);
    Vec2 a, b;
    double k;
    cin >> a.x >> a.y >> b.x >> b.y >> k;
    // ...
    return 0;
}
`,
        solution: `#include <iostream>
#include <iomanip>
using namespace std;
struct Vec2{double x,y;Vec2 operator+(const Vec2& o)const{return {x+o.x,y+o.y};}Vec2 operator-(const Vec2& o)const{return {x-o.x,y-o.y};}Vec2 operator*(double k)const{return {x*k,y*k};}bool operator==(const Vec2& o)const{return x==o.x&&y==o.y;}friend ostream& operator<<(ostream& os,const Vec2& v){return os<<"("<<v.x<<", "<<v.y<<")";}};
Vec2 operator*(double k,const Vec2& v){return v*k;}
int main(){cout<<fixed<<setprecision(1);Vec2 a,b;double k;cin>>a.x>>a.y>>b.x>>b.y>>k;cout<<a+b<<"\\n"<<a-b<<"\\n"<<a*k<<"\\n"<<k*b<<"\\n"<<(a==b);return 0;}`
    },
    {
        id: 'template_stack',
        title: 'Шаблонный стек с минимумом',
        level: 5, xp: 75,
        requires: ['template', 'class', 'vector', 'string', 'while'],
        story: 'Одна структура данных для чисел и слов, и min за O(1).',
        spec: 'Реализуйте <code>template &lt;typename T&gt; class MinStack</code> с методами <code>push</code>, <code>pop</code>, <code>top</code>, <code>min</code> (все за O(1)) и <code>empty</code>. Первая строка ввода — тип: <code>int</code> или <code>string</code>. Далее команды <code>push x</code>, <code>pop</code>, <code>top</code>, <code>min</code>. На top и min выводите значение или <code>empty</code>.',
        input: 'Тип, затем команды до конца ввода.',
        output: 'Ответы на top и min.',
        tests: [
            { in: 'int\npush 5\npush 3\nmin\npush 7\nmin\npop\npop\nmin\ntop', out: '3\n3\n5\n5' },
            { in: 'string\npush pear\npush apple\nmin\npop\nmin\npop\nmin', out: 'apple\npear\nempty' },
            { in: 'int\ntop\npop\nmin', out: 'empty\nempty' }
        ],
        hints: [
            'Храните второй вектор с текущими минимумами: при push кладите min(x, mins.back()).',
            'Шаблон целиком должен быть в одном файле — здесь это и так так.'
        ],
        starter: `#include <iostream>
#include <vector>
#include <string>
using namespace std;

template <typename T>
class MinStack {
    vector<T> data, mins;
public:
    void push(const T& x) { }
    void pop() { }
    bool empty() const { return data.empty(); }
    const T& top() const { return data.back(); }
    const T& min() const { return mins.back(); }
};

template <typename T>
void run() {
    MinStack<T> st;
    string cmd;
    while (cin >> cmd) {
        // ...
    }
}

int main() {
    string type;
    cin >> type;
    if (type == "int") run<int>();
    else run<string>();
    return 0;
}
`,
        solution: `#include <iostream>
#include <vector>
#include <string>
using namespace std;
template<typename T>class MinStack{vector<T> d,m;public:void push(const T& x){d.push_back(x);m.push_back(m.empty()||x<m.back()?x:m.back());}void pop(){if(!d.empty()){d.pop_back();m.pop_back();}}bool empty()const{return d.empty();}const T& top()const{return d.back();}const T& min()const{return m.back();}};
template<typename T>void run(){MinStack<T> st;string c;while(cin>>c){if(c=="push"){T x;cin>>x;st.push(x);}else if(c=="pop")st.pop();else if(c=="top"){if(st.empty())cout<<"empty\\n";else cout<<st.top()<<"\\n";}else if(c=="min"){if(st.empty())cout<<"empty\\n";else cout<<st.min()<<"\\n";}}}
int main(){string t;cin>>t;if(t=="int")run<int>();else run<string>();return 0;}`
    },
    {
        id: 'exceptions_parser',
        title: 'Строгий парсер',
        level: 5, xp: 70,
        requires: ['try_catch', 'string_conv', 'string', 'while', 'long_long'],
        story: 'Ввод от пользователей — минное поле. Парсер должен взрываться аккуратно.',
        spec: 'Читайте токены до конца ввода и пытайтесь превратить каждый в целое через <code>stoll</code>. Токен считается валидным, только если преобразовалась вся строка целиком (используйте параметр <code>pos</code>). Выведите сумму валидных чисел, количество невалидных и количество переполнений (<code>out_of_range</code>).',
        input: 'Токены.',
        output: 'Три числа.',
        tests: [
            { in: '10 abc 20 99999999999999999999 5x', out: '30 2 1' },
            { in: '-5 +5', out: '0 0 0' },
            { in: 'x', out: '0 1 0' }
        ],
        hints: [
            'size_t pos; long long v = stoll(s, &pos); if (pos != s.size()) — мусор в хвосте.',
            'Ловите invalid_argument и out_of_range отдельными catch.'
        ],
        starter: STARTER_BASIC,
        solution: `#include <iostream>
#include <string>
#include <stdexcept>
using namespace std;
int main(){string s;long long sum=0;int bad=0,ovf=0;while(cin>>s){try{size_t p;long long v=stoll(s,&p);if(p!=s.size()){bad++;continue;}sum+=v;}catch(const out_of_range&){ovf++;}catch(const invalid_argument&){bad++;}}cout<<sum<<" "<<bad<<" "<<ovf;return 0;}`
    },
    {
        id: 'destructor_order',
        title: 'Порядок разрушения',
        level: 5, xp: 65,
        requires: ['destructor', 'constructor', 'class', 'braces', 'string'],
        story: 'RAII — главный трюк C++: ресурс освобождается сам, когда объект уходит со сцены.',
        spec: 'Опишите класс <code>Logger</code>, печатающий <code>+имя</code> в конструкторе и <code>-имя</code> в деструкторе. В main создайте объект <code>a</code>, затем вложенный блок с объектами <code>b</code> и <code>c</code>, затем объект <code>d</code> после блока. Ничего не выводите вручную — только конструкторы и деструкторы. Программа не читает ввод.',
        input: 'Нет.',
        output: 'Восемь строк в правильном порядке.',
        tests: [
            { in: '', out: '+a\n+b\n+c\n-c\n-b\n+d\n-d\n-a' }
        ],
        hints: [
            'Объекты уничтожаются в порядке, обратном созданию, при выходе из своего блока.',
            'Имя передавайте в конструктор строкой.'
        ],
        starter: `#include <iostream>
#include <string>
using namespace std;

class Logger {
    string name;
public:
    // конструктор и деструктор
};

int main() {
    // a, { b, c }, d
    return 0;
}
`,
        solution: `#include <iostream>
#include <string>
using namespace std;
class Logger{string n;public:Logger(string s):n(s){cout<<"+"<<n<<"\\n";}~Logger(){cout<<"-"<<n<<"\\n";}};
int main(){Logger a("a");{Logger b("b");Logger c("c");}Logger d("d");return 0;}`
    },
    {
        id: 'static_counter_ids',
        title: 'Фабрика идентификаторов',
        level: 5, xp: 60,
        requires: ['static_member', 'class', 'constructor', 'vector', 'string'],
        story: 'Каждый новый объект получает уникальный номер, а класс знает, сколько их живо.',
        spec: 'Класс <code>Ticket</code> выдаёт каждому объекту id по порядку с 1 и ведёт статический счётчик живых объектов. Команды: <code>new</code> — создать билет (в вектор), <code>drop</code> — уничтожить последний, <code>stat</code> — вывести «следующий id, живых». Используйте статические члены, а не глобальные переменные.',
        input: 'Команды до конца ввода.',
        output: 'Ответы на stat.',
        tests: [
            { in: 'new new stat drop stat new stat', out: '3 2\n3 1\n4 2' },
            { in: 'stat', out: '1 0' },
            { in: 'new drop drop stat', out: '2 0' }
        ],
        hints: [
            'Статические поля определяются вне класса: int Ticket::alive = 0;',
            'Хранить объекты удобно в vector<unique_ptr<Ticket>> — pop_back вызовет деструктор.'
        ],
        starter: `#include <iostream>
#include <vector>
#include <memory>
#include <string>
using namespace std;

class Ticket {
public:
    static int nextId;
    static int alive;
    int id;
    // конструктор, деструктор
};

int main() {
    vector<unique_ptr<Ticket>> pool;
    string cmd;
    while (cin >> cmd) {
        // ...
    }
    return 0;
}
`,
        solution: `#include <iostream>
#include <vector>
#include <memory>
#include <string>
using namespace std;
class Ticket{public:static int nextId;static int alive;int id;Ticket():id(nextId++){alive++;}~Ticket(){alive--;}};
int Ticket::nextId=1;int Ticket::alive=0;
int main(){vector<unique_ptr<Ticket>> p;string c;while(cin>>c){if(c=="new")p.push_back(make_unique<Ticket>());else if(c=="drop"){if(!p.empty())p.pop_back();}else cout<<Ticket::nextId<<" "<<Ticket::alive<<"\\n";}return 0;}`
    },
    {
        id: 'optional_lookup',
        title: 'Поиск без магических чисел',
        level: 5, xp: 60,
        requires: ['optional', 'map', 'string', 'func_decl', 'while'],
        story: 'Функция «найти цену» либо находит, либо честно говорит «нет», не притворяясь нулём.',
        spec: 'Напишите <code>optional&lt;int&gt; findPrice(const map&lt;string,int&gt;&amp;, const string&amp;)</code>. Считайте n пар товар-цена, затем запросы. Для каждого запроса выведите цену или <code>not found</code>. В конце выведите сумму найденных цен.',
        input: 'n, n пар, затем запросы до конца ввода.',
        output: 'Ответы и сумма.',
        tests: [
            { in: '2\napple 3\npear 5\napple kiwi pear', out: '3\nnot found\n5\n8' },
            { in: '0\nx', out: 'not found\n0' }
        ],
        hints: [
            'return nullopt; когда ключа нет.',
            'if (auto p = findPrice(m, q)) { ... *p ... }'
        ],
        starter: `#include <iostream>
#include <optional>
#include <map>
#include <string>
using namespace std;

optional<int> findPrice(const map<string, int>& prices, const string& key) {
    return nullopt;
}

int main() {
    // ...
    return 0;
}
`,
        solution: `#include <iostream>
#include <optional>
#include <map>
#include <string>
using namespace std;
optional<int> findPrice(const map<string,int>& m,const string& k){auto it=m.find(k);if(it==m.end())return nullopt;return it->second;}
int main(){int n;cin>>n;map<string,int> m;for(int i=0;i<n;i++){string s;int p;cin>>s>>p;m[s]=p;}string q;long long sum=0;while(cin>>q){if(auto p=findPrice(m,q)){cout<<*p<<"\\n";sum+=*p;}else cout<<"not found\\n";}cout<<sum;return 0;}`
    },
    {
        id: 'template_pair_max',
        title: 'Обобщённый максимум',
        level: 5, xp: 65,
        requires: ['template', 'func_decl', 'string', 'double', 'iomanip'],
        story: 'Одна функция для чисел, дробей и слов — компилятор сам сгенерирует нужные версии.',
        spec: 'Напишите шаблон <code>template &lt;typename T&gt; T maxOf3(T a, T b, T c)</code>. Считайте три строки: в первой три int, во второй три double, в третьей три слова. Выведите три максимума (double — с одним знаком).',
        input: 'Три строки.',
        output: 'Три строки.',
        tests: [
            { in: '3 9 4\n1.5 0.2 1.25\npear apple zebra', out: '9\n1.5\nzebra' },
            { in: '-1 -1 -1\n0 0 0\na a a', out: '-1\n0.0\na' }
        ],
        hints: [
            'Внутри шаблона используйте только операторы, которые есть у всех типов: здесь достаточно <.'
        ],
        starter: `#include <iostream>
#include <iomanip>
#include <string>
using namespace std;

template <typename T>
T maxOf3(T a, T b, T c) {
    return a;
}

int main() {
    // ...
    return 0;
}
`,
        solution: `#include <iostream>
#include <iomanip>
#include <string>
using namespace std;
template<typename T>T maxOf3(T a,T b,T c){T m=a;if(m<b)m=b;if(m<c)m=c;return m;}
int main(){int a,b,c;cin>>a>>b>>c;double x,y,z;cin>>x>>y>>z;string p,q,r;cin>>p>>q>>r;cout<<maxOf3(a,b,c)<<"\\n"<<fixed<<setprecision(1)<<maxOf3(x,y,z)<<"\\n"<<maxOf3(p,q,r);return 0;}`
    },
    {
        id: 'move_semantics_buffer',
        title: 'Перемещение вместо копии',
        level: 5, xp: 70,
        requires: ['move', 'class', 'constructor', 'destructor', 'new_delete', 'pointer_decl'],
        story: 'Большой буфер дорого копировать. Правило пяти позволяет его просто передать.',
        spec: 'Класс <code>Buffer</code> владеет массивом <code>int*</code> размера n. Реализуйте конструктор, деструктор, копирующий конструктор (печатает <code>copy</code>) и перемещающий конструктор (печатает <code>move</code>, забирает указатель и обнуляет источник). В main: считайте n, создайте <code>Buffer a(n)</code>, затем <code>Buffer b = a;</code>, затем <code>Buffer c = std::move(a);</code>. Выведите размеры a, b, c.',
        input: 'Одно число n.',
        output: 'copy, move, затем три размера через пробел.',
        tests: [
            { in: '5', out: 'copy\nmove\n0 5 5' },
            { in: '0', out: 'copy\nmove\n0 0 0' }
        ],
        hints: [
            'Перемещающий конструктор: Buffer(Buffer&& o) : data(o.data), n(o.n) { o.data = nullptr; o.n = 0; }',
            'delete[] nullptr — безопасно, деструктор можно не усложнять.'
        ],
        starter: `#include <iostream>
#include <utility>
using namespace std;

class Buffer {
    int* data;
    int n;
public:
    Buffer(int n) : data(new int[n]), n(n) {}
    ~Buffer() { delete[] data; }
    // copy ctor, move ctor, size()
};

int main() {
    int n;
    cin >> n;
    Buffer a(n);
    // ...
    return 0;
}
`,
        solution: `#include <iostream>
#include <utility>
using namespace std;
class Buffer{int* d;int n;public:Buffer(int n):d(new int[n]),n(n){}~Buffer(){delete[] d;}Buffer(const Buffer& o):d(new int[o.n]),n(o.n){for(int i=0;i<n;i++)d[i]=o.d[i];cout<<"copy\\n";}Buffer(Buffer&& o):d(o.d),n(o.n){o.d=nullptr;o.n=0;cout<<"move\\n";}int size()const{return n;}};
int main(){int n;cin>>n;Buffer a(n);Buffer b=a;Buffer c=std::move(a);cout<<a.size()<<" "<<b.size()<<" "<<c.size();return 0;}`
    },
    {
        id: 'namespace_geometry',
        title: 'Два модуля, одно имя',
        level: 5, xp: 55,
        requires: ['namespace', 'scope', 'func_decl', 'double', 'iomanip'],
        story: 'Две команды написали функцию dist, и обе правы: одна считает по прямой, другая по кварталам.',
        spec: 'Опишите <code>namespace euclid</code> с функцией <code>dist(x1, y1, x2, y2)</code> (обычное расстояние) и <code>namespace manhattan</code> с одноимённой функцией (сумма модулей разностей). Считайте две точки и выведите оба расстояния с двумя знаками.',
        input: 'Четыре числа.',
        output: 'Две строки.',
        tests: [
            { in: '0 0 3 4', out: '5.00\n7.00' },
            { in: '1 1 1 1', out: '0.00\n0.00' },
            { in: '-1 -1 1 1', out: '2.83\n4.00' }
        ],
        hints: [
            'Вызов: euclid::dist(...) и manhattan::dist(...).',
            'fabs из <cmath> для модуля double.'
        ],
        starter: `#include <iostream>
#include <iomanip>
#include <cmath>
using namespace std;

namespace euclid {
    // dist
}

namespace manhattan {
    // dist
}

int main() {
    // ...
    return 0;
}
`,
        solution: `#include <iostream>
#include <iomanip>
#include <cmath>
using namespace std;
namespace euclid{double dist(double a,double b,double c,double d){return sqrt((a-c)*(a-c)+(b-d)*(b-d));}}
namespace manhattan{double dist(double a,double b,double c,double d){return fabs(a-c)+fabs(b-d);}}
int main(){double a,b,c,d;cin>>a>>b>>c>>d;cout<<fixed<<setprecision(2)<<euclid::dist(a,b,c,d)<<"\\n"<<manhattan::dist(a,b,c,d);return 0;}`
    },
    {
        id: 'lambda_pipeline',
        title: 'Конвейер из лямбд',
        level: 5, xp: 65,
        requires: ['lambda', 'vector', 'auto', 'count_algo', 'accumulate'],
        story: 'Функциональный стиль в C++: данные проходят через цепочку маленьких функций.',
        spec: 'Даны n чисел и порог t. Постройте конвейер из трёх лямбд: <code>keep</code> (оставляет x > t), <code>transform</code> (x → x * x), <code>reduce</code> (сумма). Лямбда <code>keep</code> должна захватывать t по значению. Выведите количество прошедших фильтр и сумму их квадратов.',
        input: 'n t, затем n чисел.',
        output: 'Два числа.',
        tests: [
            { in: '5 2\n1 2 3 4 5', out: '3 50' },
            { in: '3 100\n1 2 3', out: '0 0' },
            { in: '2 -10\n-3 3', out: '2 18' }
        ],
        hints: [
            'auto keep = [t](long long x) { return x > t; };',
            'copy_if в новый вектор, transform на месте, accumulate для суммы.'
        ],
        starter: STARTER_BASIC,
        solution: `#include <iostream>
#include <vector>
#include <algorithm>
#include <numeric>
using namespace std;
int main(){int n;long long t;cin>>n>>t;vector<long long> v(n);for(auto& x:v)cin>>x;auto keep=[t](long long x){return x>t;};auto sq=[](long long x){return x*x;};vector<long long> f;copy_if(v.begin(),v.end(),back_inserter(f),keep);transform(f.begin(),f.end(),f.begin(),sq);long long s=accumulate(f.begin(),f.end(),0LL);cout<<f.size()<<" "<<s;return 0;}`
    }
]);
