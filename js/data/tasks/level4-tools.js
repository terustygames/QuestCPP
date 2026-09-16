/* Уровень 4 — Инструменты: структуры, STL-контейнеры, алгоритмы, лямбды. */

TaskDB.add([
    {
        id: 'vector_second_max',
        title: 'Серебряный призёр',
        level: 4, xp: 50,
        requires: ['vector', 'vector_methods', 'range_for', 'if'],
        story: 'Первое место видно всем, а второго приходится искать аккуратно: значения могут повторяться.',
        spec: 'Дан вектор из n чисел. Выведите второе по величине различное значение. Если все числа одинаковые, выведите <code>none</code>. Сортировать нельзя — один проход.',
        input: 'n, затем n чисел (1 ≤ n ≤ 10⁵).',
        output: 'Число или none.',
        tests: [
            { in: '5\n3 9 9 4 1', out: '4' },
            { in: '3\n7 7 7', out: 'none' },
            { in: '2\n-5 -10', out: '-10' },
            { in: '1\n0', out: 'none' }
        ],
        hints: [
            'Храните first и second; при x > first сдвигайте first в second.',
            'Числа, равные first, не должны попадать в second.'
        ],
        starter: STARTER_BASIC,
        solution: `#include <iostream>
#include <vector>
#include <climits>
using namespace std;
int main(){int n;cin>>n;vector<long long> v(n);for(auto& x:v)cin>>x;long long f=LLONG_MIN,s=LLONG_MIN;bool has=false;for(long long x:v){if(x>f){s=f;if(f!=LLONG_MIN)has=true;f=x;}else if(x<f&&x>s){s=x;has=true;}}if(has)cout<<s;else cout<<"none";return 0;}`
    },
    {
        id: 'struct_students',
        title: 'Журнал успеваемости',
        level: 4, xp: 55,
        requires: ['struct', 'dot', 'vector', 'sort', 'lambda', 'iomanip'],
        story: 'Деканат хочет список студентов по убыванию среднего балла, а при равенстве — по алфавиту.',
        spec: 'Опишите <code>struct Student { string name; int a, b, c; }</code>. Считайте n студентов и выведите их, отсортировав по убыванию среднего балла, при равенстве — по имени по возрастанию. Формат строки: <code>имя средний</code>, средний с одним знаком после точки.',
        input: 'n, затем n строк: имя и три оценки.',
        output: 'n строк.',
        tests: [
            { in: '3\nBob 5 4 5\nAnn 5 5 4\nZed 3 3 3', out: 'Ann 4.7\nBob 4.7\nZed 3.0' },
            { in: '1\nSolo 1 2 3', out: 'Solo 2.0' },
            { in: '2\nb 5 5 5\na 5 5 5', out: 'a 5.0\nb 5.0' }
        ],
        hints: [
            'Компаратор для sort: лямбда, которая возвращает true, если первый должен стоять раньше.',
            'Сравнивайте суммы (a+b+c) как целые, чтобы не ловить ошибки округления.'
        ],
        starter: `#include <iostream>
#include <iomanip>
#include <string>
#include <vector>
#include <algorithm>
using namespace std;

struct Student {
    string name;
    int a, b, c;
};

int main() {
    int n;
    cin >> n;
    vector<Student> v(n);
    // ...
    return 0;
}
`,
        solution: `#include <iostream>
#include <iomanip>
#include <string>
#include <vector>
#include <algorithm>
using namespace std;
struct Student{string name;int a,b,c;int sum()const{return a+b+c;}};
int main(){int n;cin>>n;vector<Student> v(n);for(auto& s:v)cin>>s.name>>s.a>>s.b>>s.c;sort(v.begin(),v.end(),[](const Student& x,const Student& y){if(x.sum()!=y.sum())return x.sum()>y.sum();return x.name<y.name;});cout<<fixed<<setprecision(1);for(auto& s:v)cout<<s.name<<" "<<s.sum()/3.0<<"\\n";return 0;}`
    },
    {
        id: 'word_frequency',
        title: 'Облако слов',
        level: 4, xp: 55,
        requires: ['map', 'string', 'while', 'range_for', 'structured_bindings'],
        story: 'Из текста нужно вытащить, какие слова встречаются чаще всего, а какие только раз.',
        spec: 'Читайте слова до конца ввода. Выведите каждое уникальное слово с частотой в алфавитном порядке, затем строку <code>unique: k</code>, где k — число слов, встретившихся ровно один раз.',
        input: 'Произвольный набор слов через пробелы и переносы.',
        output: 'Строки «слово частота», затем итоговая строка.',
        tests: [
            { in: 'to be or not to be', out: 'be 2\nnot 1\nor 1\nto 2\nunique: 2' },
            { in: 'a', out: 'a 1\nunique: 1' },
            { in: 'x x x', out: 'x 3\nunique: 0' }
        ],
        hints: [
            'map<string, int> сам держит ключи отсортированными.',
            'for (auto& [word, cnt] : freq) — структурная привязка.'
        ],
        starter: STARTER_BASIC,
        solution: `#include <iostream>
#include <map>
#include <string>
using namespace std;
int main(){map<string,int> f;string w;while(cin>>w)f[w]++;int u=0;for(auto& [k,v]:f){cout<<k<<" "<<v<<"\\n";if(v==1)u++;}cout<<"unique: "<<u;return 0;}`
    },
    {
        id: 'bracket_balance',
        title: 'Скобочный инспектор',
        level: 4, xp: 55,
        requires: ['stack', 'string', 'for', 'switch', 'bool'],
        story: 'Линтер проверяет исходник: каждая открытая скобка должна закрыться правильной парой.',
        spec: 'Дана строка из символов <code>()[]{}</code> и прочих. Выведите <code>ok</code>, если скобки сбалансированы, иначе — позицию (с 1) первой ошибочной скобки. Если строка закончилась, а стек не пуст, выведите позицию самой первой незакрытой скобки, оставшейся в стеке.',
        input: 'Одна строка (до 10⁵ символов).',
        output: 'ok или число.',
        tests: [
            { in: '{[()]}', out: 'ok' },
            { in: '(]', out: '2' },
            { in: '((()', out: '1' },
            { in: 'a(b)c', out: 'ok' },
            { in: '())', out: '3' }
        ],
        hints: [
            'В стек кладите пары (символ, позиция).',
            'Самая первая незакрытая — на дне стека; чтобы её достать, извлеките всё.'
        ],
        starter: STARTER_BASIC,
        solution: `#include <iostream>
#include <stack>
#include <string>
using namespace std;
int main(){string s;getline(cin,s);stack<pair<char,int>> st;for(int i=0;i<(int)s.size();i++){char c=s[i];if(c=='('||c=='['||c=='{')st.push({c,i+1});else if(c==')'||c==']'||c=='}'){char need=c==')'?'(':c==']'?'[':'{';if(st.empty()||st.top().first!=need){cout<<i+1;return 0;}st.pop();}}if(st.empty()){cout<<"ok";return 0;}int first=0;while(!st.empty()){first=st.top().second;st.pop();}cout<<first;return 0;}`
    },
    {
        id: 'set_intersection_lists',
        title: 'Общие друзья',
        level: 4, xp: 50,
        requires: ['set', 'vector', 'range_for', 'string'],
        story: 'Соцсеть предлагает знакомиться через общих друзей — если они есть.',
        spec: 'Даны два списка имён. Выведите имена, встречающиеся в обоих списках, в алфавитном порядке, затем число имён, которые есть только в первом списке. Дубликаты внутри одного списка не учитываются.',
        input: 'n, затем n имён; m, затем m имён.',
        output: 'Общие имена по одному на строку (или <code>none</code>), затем число.',
        tests: [
            { in: '4\nann bob cid ann\n3\ncid dan bob', out: 'bob\ncid\n1' },
            { in: '2\nx y\n2\nz w', out: 'none\n2' },
            { in: '1\na\n1\na', out: 'a\n0' }
        ],
        hints: [
            'set сам убирает дубликаты и сортирует.',
            's2.count(name) — есть ли имя во втором множестве.'
        ],
        starter: STARTER_BASIC,
        solution: `#include <iostream>
#include <set>
#include <string>
using namespace std;
int main(){int n;cin>>n;set<string> a;for(int i=0;i<n;i++){string s;cin>>s;a.insert(s);}int m;cin>>m;set<string> b;for(int i=0;i<m;i++){string s;cin>>s;b.insert(s);}bool any=false;int only=0;for(auto& s:a){if(b.count(s)){cout<<s<<"\\n";any=true;}else only++;}if(!any)cout<<"none\\n";cout<<only;return 0;}`
    },
    {
        id: 'queue_printer',
        title: 'Очередь на принтер',
        level: 4, xp: 55,
        requires: ['queue', 'pair', 'while', 'vector'],
        story: 'Офисный принтер печатает по одной странице за такт и ставит недопечатанный документ в конец очереди.',
        spec: 'В очереди n документов с количеством страниц. Каждый такт принтер берёт первый документ, печатает одну страницу; если страницы остались — документ возвращается в конец. Выведите порядок завершения документов (номера с 1) и такт, на котором завершился документ с номером k.',
        input: 'n k, затем n чисел.',
        output: 'Порядок через пробел, затем такт на новой строке.',
        tests: [
            { in: '3 1\n3 1 2', out: '2 3 1\n6' },
            { in: '1 1\n5', out: '1\n5' },
            { in: '4 3\n1 1 1 1', out: '1 2 3 4\n3' }
        ],
        hints: [
            'queue<pair<int,int>> — номер и оставшиеся страницы.',
            'Такт увеличивается при каждой напечатанной странице.'
        ],
        starter: STARTER_BASIC,
        solution: `#include <iostream>
#include <queue>
#include <vector>
using namespace std;
int main(){int n,k;cin>>n>>k;queue<pair<int,int>> q;for(int i=1;i<=n;i++){int p;cin>>p;q.push({i,p});}int tick=0,ans=0;vector<int> order;while(!q.empty()){auto [id,p]=q.front();q.pop();tick++;p--;if(p==0){order.push_back(id);if(id==k)ans=tick;}else q.push({id,p});}for(size_t i=0;i<order.size();i++){if(i)cout<<" ";cout<<order[i];}cout<<"\\n"<<ans;return 0;}`
    },
    {
        id: 'top_k_heap',
        title: 'Тройка лидеров на потоке',
        level: 4, xp: 60,
        requires: ['priority_queue', 'vector', 'while', 'sort'],
        story: 'Данные приходят потоком, весь массив не помещается в память, а k лучших знать нужно.',
        spec: 'Дано k и поток чисел до конца ввода. Поддерживайте k наибольших значений с помощью кучи размера не более k (минимум сверху). В конце выведите их по убыванию. Если чисел меньше k — все.',
        input: 'k, затем числа.',
        output: 'До k чисел через пробел.',
        compare: 'tokens',
        tests: [
            { in: '3\n5 1 9 3 7 9 2', out: '9 9 7' },
            { in: '2\n1', out: '1' },
            { in: '1\n-3 -1 -2', out: '-1' }
        ],
        hints: [
            'priority_queue<int, vector<int>, greater<int>> — минимум сверху.',
            'Если размер стал больше k — pop(): улетает наименьший.'
        ],
        starter: STARTER_BASIC,
        solution: `#include <iostream>
#include <queue>
#include <vector>
#include <algorithm>
#include <functional>
using namespace std;
int main(){int k;cin>>k;priority_queue<int,vector<int>,greater<int>> pq;int x;while(cin>>x){pq.push(x);if((int)pq.size()>k)pq.pop();}vector<int> r;while(!pq.empty()){r.push_back(pq.top());pq.pop();}sort(r.rbegin(),r.rend());for(size_t i=0;i<r.size();i++){if(i)cout<<" ";cout<<r[i];}return 0;}`
    },
    {
        id: 'two_sum_hash',
        title: 'Пара под сумму',
        level: 4, xp: 55,
        requires: ['unordered_map', 'vector', 'for', 'if'],
        story: 'В кассе нужно найти два товара, которые в сумме дают ровно подарочный сертификат.',
        spec: 'Даны n цен и целевая сумма s. Найдите индексы (с 0) двух разных товаров с суммой s, такие что второй индекс минимален, а при равенстве второго — первый минимален. Выведите <code>i j</code> (i < j) или <code>none</code>. Решение должно быть за O(n).',
        input: 'n s, затем n чисел (1 ≤ n ≤ 10⁵).',
        output: 'Два индекса или none.',
        tests: [
            { in: '5 9\n2 7 11 15 2', out: '0 1' },
            { in: '4 6\n3 3 3 3', out: '0 1' },
            { in: '3 100\n1 2 3', out: 'none' },
            { in: '4 8\n5 1 3 7', out: '0 2' }
        ],
        hints: [
            'Идите слева направо, храня в хеш-таблице значение -> первый индекс.',
            'Для x проверяйте, есть ли s - x уже в таблице; первое найденное j — минимальное.'
        ],
        starter: STARTER_BASIC,
        solution: `#include <iostream>
#include <unordered_map>
#include <vector>
using namespace std;
int main(){int n;long long s;cin>>n>>s;unordered_map<long long,int> seen;for(int j=0;j<n;j++){long long x;cin>>x;auto it=seen.find(s-x);if(it!=seen.end()){cout<<it->second<<" "<<j;return 0;}if(!seen.count(x))seen[x]=j;}cout<<"none";return 0;}`
    },
    {
        id: 'sort_custom_words',
        title: 'Сортировка по длине',
        level: 4, xp: 50,
        requires: ['sort', 'lambda', 'vector', 'string'],
        story: 'Составитель словаря хочет сначала короткие слова, а среди равных — алфавит.',
        spec: 'Читайте слова до конца ввода. Отсортируйте по длине по возрастанию, при равной длине — по алфавиту. Выведите по одному слову в строке. Используйте <code>sort</code> с лямбдой.',
        input: 'Слова.',
        output: 'Отсортированный список.',
        tests: [
            { in: 'pear fig apple kiwi date', out: 'fig\ndate\nkiwi\npear\napple' },
            { in: 'b a', out: 'a\nb' },
            { in: 'zz z zzz', out: 'z\nzz\nzzz' }
        ],
        hints: [
            'Компаратор: if (a.size() != b.size()) return a.size() < b.size(); return a < b;'
        ],
        starter: STARTER_BASIC,
        solution: `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
using namespace std;
int main(){vector<string> v;string w;while(cin>>w)v.push_back(w);sort(v.begin(),v.end(),[](const string& a,const string& b){if(a.size()!=b.size())return a.size()<b.size();return a<b;});for(auto& s:v)cout<<s<<"\\n";return 0;}`
    },
    {
        id: 'lower_bound_ranks',
        title: 'Ранги в турнирной таблице',
        level: 4, xp: 60,
        requires: ['binary_search', 'sort', 'vector', 'for'],
        story: 'Сервер рейтинга должен за миллисекунды отвечать, сколько игроков слабее данного.',
        spec: 'Даны n рейтингов и q запросов. Для каждого запроса x выведите два числа: сколько рейтингов строго меньше x и сколько равны x. Решение за O((n + q) log n).',
        input: 'n q, затем n чисел, затем q чисел.',
        output: 'q строк.',
        tests: [
            { in: '5 3\n10 20 20 30 40\n20 25 5', out: '1 2\n3 0\n0 0' },
            { in: '1 1\n7\n7', out: '0 1' },
            { in: '3 2\n1 1 1\n1 2', out: '0 3\n3 0' }
        ],
        hints: [
            'lower_bound — первый элемент >= x, upper_bound — первый > x.',
            'Меньше x: lower_bound - begin. Равны x: upper_bound - lower_bound.'
        ],
        starter: STARTER_BASIC,
        solution: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int main(){int n,q;cin>>n>>q;vector<int> a(n);for(auto& x:a)cin>>x;sort(a.begin(),a.end());while(q--){int x;cin>>x;auto lo=lower_bound(a.begin(),a.end(),x);auto hi=upper_bound(a.begin(),a.end(),x);cout<<(lo-a.begin())<<" "<<(hi-lo)<<"\\n";}return 0;}`
    },
    {
        id: 'accumulate_stats',
        title: 'Статистика без циклов',
        level: 4, xp: 50,
        requires: ['accumulate', 'min_max', 'count_algo', 'vector', 'lambda'],
        story: 'Задание со звёздочкой: ни одного явного for после чтения ввода.',
        spec: 'Дан вектор из n чисел. Выведите сумму (может быть большой), минимум, максимум и количество чётных. После чтения ввода запрещены явные циклы — только алгоритмы из <code>&lt;algorithm&gt;</code> и <code>&lt;numeric&gt;</code>.',
        input: 'n, затем n чисел (до 10⁹ по модулю).',
        output: 'Четыре числа.',
        tests: [
            { in: '5\n3 8 -2 7 8', out: '24 -2 8 3' },
            { in: '3\n1000000000 1000000000 1000000000', out: '3000000000 1000000000 1000000000 3' },
            { in: '1\n1', out: '1 1 1 0' }
        ],
        hints: [
            'accumulate(v.begin(), v.end(), 0LL) — начальное значение задаёт тип суммы.',
            'minmax_element возвращает пару итераторов.'
        ],
        starter: STARTER_BASIC,
        solution: `#include <iostream>
#include <vector>
#include <numeric>
#include <algorithm>
using namespace std;
int main(){int n;cin>>n;vector<long long> v(n);for(auto& x:v)cin>>x;long long s=accumulate(v.begin(),v.end(),0LL);auto [mn,mx]=minmax_element(v.begin(),v.end());long long ev=count_if(v.begin(),v.end(),[](long long x){return x%2==0;});cout<<s<<" "<<*mn<<" "<<*mx<<" "<<ev;return 0;}`
    },
    {
        id: 'enum_class_directions',
        title: 'Черепашка на сетке',
        level: 4, xp: 55,
        requires: ['enum_class', 'switch', 'string', 'range_for', 'struct'],
        story: 'Робот понимает четыре команды: вперёд, назад, налево, направо. И честно их выполняет.',
        spec: 'Опишите <code>enum class Dir { N, E, S, W }</code>. Робот стоит в (0, 0) лицом на север. Команды: <code>F</code> — шаг вперёд, <code>L</code> — поворот налево, <code>R</code> — направо, <code>B</code> — шаг назад без поворота. Выведите итоговые координаты и направление буквой. Ось y растёт на север, x — на восток.',
        input: 'Строка команд.',
        output: 'x y D.',
        tests: [
            { in: 'FFRFF', out: '2 2 E' },
            { in: 'LLB', out: '0 1 S' },
            { in: 'RRRR', out: '0 0 N' },
            { in: 'FLFLFLF', out: '0 0 E' }
        ],
        hints: [
            'Поворот направо: (int(d) + 1) % 4; налево: (int(d) + 3) % 4.',
            'Шаг назад — шаг вперёд с обратным знаком.'
        ],
        starter: `#include <iostream>
#include <string>
using namespace std;

enum class Dir { N, E, S, W };

int main() {
    string cmds;
    cin >> cmds;
    int x = 0, y = 0;
    Dir d = Dir::N;
    // ...
    return 0;
}
`,
        solution: `#include <iostream>
#include <string>
using namespace std;
enum class Dir{N,E,S,W};
int main(){string c;cin>>c;int x=0,y=0;Dir d=Dir::N;int dx[]={0,1,0,-1},dy[]={1,0,-1,0};for(char ch:c){int i=(int)d;switch(ch){case 'F':x+=dx[i];y+=dy[i];break;case 'B':x-=dx[i];y-=dy[i];break;case 'L':d=(Dir)((i+3)%4);break;case 'R':d=(Dir)((i+1)%4);break;}}cout<<x<<" "<<y<<" "<<"NESW"[(int)d];return 0;}`
    },
    {
        id: 'sliding_window_max_sum',
        title: 'Лучшая неделя',
        level: 4, xp: 55,
        requires: ['vector', 'for', 'long_long', 'min_max'],
        story: 'Магазин ищет k подряд идущих дней с максимальной выручкой.',
        spec: 'Даны n дневных выручек и k. Найдите отрезок из k подряд идущих дней с максимальной суммой. Выведите сумму и индекс начала (с 0, при равенстве — минимальный). Решение за O(n): скользящее окно.',
        input: 'n k, затем n чисел (1 ≤ k ≤ n ≤ 10⁵).',
        output: 'Два числа.',
        tests: [
            { in: '6 3\n1 4 2 10 2 3', out: '16 1' },
            { in: '4 4\n-1 -2 -3 -4', out: '-10 0' },
            { in: '5 1\n3 9 9 1 2', out: '9 1' }
        ],
        hints: [
            'Сумма следующего окна = текущая + a[i] - a[i-k].',
            'Обновляйте лучший результат строго при >.'
        ],
        starter: STARTER_BASIC,
        solution: `#include <iostream>
#include <vector>
using namespace std;
int main(){int n,k;cin>>n>>k;vector<long long> a(n);for(auto& x:a)cin>>x;long long s=0;for(int i=0;i<k;i++)s+=a[i];long long best=s;int bi=0;for(int i=k;i<n;i++){s+=a[i]-a[i-k];if(s>best){best=s;bi=i-k+1;}}cout<<best<<" "<<bi;return 0;}`
    },
    {
        id: 'unique_sorted_merge',
        title: 'Слияние прайс-листов',
        level: 4, xp: 50,
        requires: ['unique', 'sort', 'vector', 'range_for'],
        story: 'Два поставщика прислали списки артикулов, местами пересекающиеся.',
        spec: 'Даны два списка чисел. Объедините их, уберите дубликаты и выведите отсортированный результат, а затем — сколько дубликатов было удалено.',
        input: 'n, n чисел, m, m чисел.',
        output: 'Числа через пробел, затем количество удалённых на новой строке.',
        compare: 'tokens',
        tests: [
            { in: '3\n5 1 5\n2\n1 9', out: '1 5 9\n2' },
            { in: '1\n1\n1\n1', out: '1\n1' },
            { in: '2\n2 1\n0', out: '1 2\n0' }
        ],
        hints: [
            'sort, затем erase(unique(...), end()).',
            'Удалено = исходный размер - новый размер.'
        ],
        starter: STARTER_BASIC,
        solution: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int main(){int n;cin>>n;vector<int> v(n);for(auto& x:v)cin>>x;int m;cin>>m;for(int i=0;i<m;i++){int x;cin>>x;v.push_back(x);}int before=v.size();sort(v.begin(),v.end());v.erase(unique(v.begin(),v.end()),v.end());for(size_t i=0;i<v.size();i++){if(i)cout<<" ";cout<<v[i];}cout<<"\\n"<<before-(int)v.size();return 0;}`
    },
    {
        id: 'stringstream_csv',
        title: 'Разбор CSV-строки',
        level: 4, xp: 55,
        requires: ['stringstream', 'getline', 'string', 'string_conv', 'vector'],
        story: 'Экспорт из таблицы приходит строками через запятую, и числа надо сложить.',
        spec: 'Даны строки вида <code>имя,число,число,...</code> (значений может быть ноль). Для каждой строки выведите имя, количество значений и их сумму. Пустые значения (две запятые подряд) считаются нулями и учитываются в количестве.',
        input: 'Строки до конца ввода.',
        output: 'По строке «имя count sum».',
        tests: [
            { in: 'ann,1,2,3\nbob\ncid,,5', out: 'ann 3 6\nbob 0 0\ncid 2 5' },
            { in: 'x,10', out: 'x 1 10' },
            { in: 'a,-1,-2', out: 'a 2 -3' }
        ],
        hints: [
            'getline(ss, field, \',\') читает до запятой.',
            'stoi пустой строки бросает исключение — проверяйте empty().'
        ],
        starter: STARTER_BASIC,
        solution: `#include <iostream>
#include <sstream>
#include <string>
using namespace std;
int main(){string line;while(getline(cin,line)){if(line.empty())continue;stringstream ss(line);string name,f;getline(ss,name,',');int cnt=0;long long sum=0;while(getline(ss,f,',')){cnt++;if(!f.empty())sum+=stoll(f);}cout<<name<<" "<<cnt<<" "<<sum<<"\\n";}return 0;}`
    }
]);
