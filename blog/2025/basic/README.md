# 前端基础知识

> 本文介绍最基础的核心，包括浏览器处理、JS、Type Script 和 React 的基本概念。

## 浏览器处理

Web 前端是通过浏览器，按一套现行标准，下载、加载、执行对应的标记文件、脚本文件、资源文件，来实现界面的呈现和用户交互的，并将数据与后端进行交换处理。

### 核心资源类型

前端资源通常部署于服务器端，经由浏览器进行下载，随后按照资源类型进行解析，为了更为规范，有一套业界标准来定义这些类型及其内部结构，不过这套标准事实上是由多个机构分别制定的。

| 类型 | 作用 | MIME | 制定标准者 |
| ---- | -------------------- | ---------- | ------ |
| [HTML](https://www.w3.org/html/) | 最终用户界面呈现，偏结构。此亦为 web 前端的载体，即其为最先加载的部分，并指引后续需要加载的资源。 | `text/html` | W3C |
| [CSS](https://www.w3.org/Style/CSS/Overview.en.html) | 样式文件，作为 HTML 的补充。 | `text/css` | W3C |
| [JS](https://262.ecma-international.org/) | 脚本，可在前端（浏览器端上层）解释执行业务逻辑，一般用于增强前端响应能力。 | `text/javascript` | ECMA |

### 加载

浏览器根据用户输入或跳转，访问某个域名的具体地址，服务器端返回一个 HTML 文件，其内包含页面的初始结构和内容，这些结构和内容是通过一种叫做 DOM 的元素构成，不同类型的 DOM 具有不同作用和含义，主要表示了呈现内容、引用资源和元数据。

其中，HTML 里可能会引用许多资源，例如 CSS 和 JS。这些资源可以通过内联（inline）的方式进行引用；也可以通过外部引用的方式，由浏览器发起新的请求（对于符合多路复用场景的则会在一个连接内包含执行请求）进行下载、解析、加载和合并执行。

浏览器对 JS 是采用解释执行的方式运行其中脚本内容，但实际上浏览器会在加载完即进行预解释，即加载完便立刻创建语法树并生成优化方案，随后转化为内存中的可执行程序。因此，在 JS 的实际执行过程中，通常是没有解释这一步骤的，因为已经前置完成了，当下的执行就是类似于机器码的执行了，以此保证运行时计算机的工作效率。

### 进程和线程

从进程角度来看，一个 HTML 页面对应这一个主线程，亦即渲染线程，位于一个进程或进程域中。这个线程同时也用于执行该页面中的 JS，且无论该页面引用了多少个 JS 文件或片段，都只会这一个线程中执行。这意味着 web JS 中不存在线程安全问题，也不存在代码执行的并行能力，底层仅为单线程。不过，由于 JS 具备分段承载和基于事件加载来触发执行的设计机制，因此每一个 JS 块的执行实际都在这个线程中对应的分片中，按需按次序分散执行，执行间可能存在间隔，也可能一个分片执行完刚好有时下一个分片的执行，这些分片称为 fiber。虽然 JS 不支持并行，但可以通过注入 `setInterval` 和 `setTimeout` 等方式，预约下一个 fiber 的执行；更进一步的，浏览器内置的一些函数，例如对网络资源请求的 `fetch` 接口，网络请求本身的执行是浏览器独立的模块负责，前端发起请求后即不再等待便继续执行后续逻辑，而前端注册的结束回调便也是排队在后续 fiber 中执行的，也就是待后续该线程执行出现空闲时即切换至该回调来执行。因此，JS 是支持异步的。但请注意，JS 的异步是基于 fiber 实现的，它仍旧在同一线程，通过调度来进行切换，是不存在并行脚本执行能力的。

由于 JS 和渲染是在同线程上，因此要特别留意 JS 的执行效率问题，以防止阻塞 UI。

为了解决 JS 不支持多线程运行导致的不支持后台高计算负载情况，因此设计有 service worker 机制，该模式等同于开了另一个不具备界面的浏览器后台 tab，以独立进程或进程域的方式，执行该 service worker 所指向的 JS 文件。该 JS 不能与网页本身的 JS 进行直接交互，尤其是不能互访内存资源；它们只能通过浏览器开放的额外的消息机制进行通信。

不同 HTML 之间相互隔离，不过根据浏览器策略，他们能共享一些资源，例如，同域名的网页，允许访问相同的 cookie 池和 storage 池。浏览器做了许多限定和共享机制，实现这些资源的隔离和共享。但本质上，不同页面都是相互隔离的，并且是以进程的方式进行隔离。以及，虽然会存在一些诸如 GPU 加速和网络请求池等浏览器辅助进程来服务全局，但它们本质上是以进程或进程域进行独立运行，且渲染与 JS 执行都在该进程的主线程上。

### 大前端

为了让前端界面具有更丰富的用户交互特性，以及简化后端对于前端复杂逻辑的处理及时间损耗，现代的前端技术通常是重 JS、轻 HTML 和 CSS。具体来说，就是由 JS 驱动来修改 HTML，实现更复杂的动态渲染效果。此即所谓的大前端。

在这种模式下，HTML 通常只包含最基础的加载屏（又名骨架屏），或仅含首屏数据的简单页面，其最重要的目标是加载对应的主程序入口 JS，由 JS 来执行 HTML 内 DOM 的更新，从而在后续过程中影响页面的呈现。一些较复杂的前端页面，会将多个页面的内容整合在一起，执行时会根据当前页面地址动态决定如何刷新 DOM，此即前端页面路由，而此类由单一前端包驱动的复杂多场景页面集又称 SPA（单页面应用）。

为了实现 SPA，通常需要有复杂的前端框架作为支撑，该框架包括便于 JS 驱动 UI 的渲染库和页面路由。
而随着页面能力越来越复杂，以致出现开发上的拆分负责情况，以及可能出现的外部页面内容引入问题，于是又引入了微前端概念，目的在于将相互独立开发并可能存在兼容影响的多个前端模块，能进行一个基本的整合。

### HTML & CSS

作为标记语言和附加的样式语言，其用于表达界面内容。但为了让浏览器和搜索引擎更好地理解内容本身，HTML 中的内容又会被推荐采用语义化的形式来书写。从 HTML 5 起，其元素标签的定义，即开始向方便语义化的方式进行设计；而样式则被交个了 CSS 来完成。

### 编程语言

前端脚本 JS 属于弱类型语言，其基础能力最初也较为薄弱，这些语法特性原本使得上手可以更为简单，但在随后出现的更大更复杂的前端需求面前，这反而成为了劣势，因此，以 JS 为基础，融入 C# 语法特性的新型语言——[Type Script](https://www.typescriptlang.org/zh/) 即应运而生。该语言由微软设计，开源，具有强类型，支持额外的语法约束，通过语法糖增加了一些使用便捷，兼容几乎所有 JS 使用场景。Type Script 是 JS 的超集。另外，现实中，Type Script 与 JS 在发展上相辅相成，其又反过来推动 ECMA 对 JS 编程语言设计的迭代，因此当今的 JS 又出现了许多当年没有的语法功能。

基于以上原因，我们都是用 Type Script 进行开发。

编译器 tsc（按微软一贯的自编译作风其也是用 Type Script 写的）会将其 build 为 JS，供浏览器解释执行。除此之外，前端还有 bundle 和引用包的概念，以解决模块化编程后的片段合并、包引用、模块加载等工作，此属于前端工程范畴，通常大部分由项目脚手架完成。

### 浏览器兼容

由于 W3C 在过往相当长的一段时间内，其制定的标准既描述不严谨，又不跟随时代而继续向前发展，由此导致微软为了扩充 web 前端能力，而在其当时浏览器 IE 中大幅度增加私有格式，以此完成相较于当时更为复杂的能力和更为酷炫的效果。而当 W3C 重新审视、完善和发展其旗下标准后，新标准又与 IE 彼时实现不一致乃至有冲突，从而导致后来的浏览器兼容问题明显，且尤以 IE 为之最。

现如今，随着业内主流 Chromium 的发展，以及 W3C 和 ECMA 也在不断更新其标准，因此现在的主流浏览器中所存在的浏览器兼容问题，则更多的是关于某个新标准是否支持的问题。

为了解决这些问题，通常会有 polyfill 库来尝试抹平差异，但显然不可能完全消除。因此，通常会设定特定的浏览器兼容策略，在此范围内探究解决浏览器兼容问题。当遇到具体问题时，最直接和最基础的做法还是翻找出该旧版浏览器进行调试和修复。

## 对象

JS（及其超集 Type Script）是面向对象的语言。

### 基本类型

| 类型名 | `typeof()` 返回值 - 均为字符串 | 备注 |
| ------ | ------ | ---------------------------- |
| 字符串 | string | 一般用单引号或双引号包裹起来。 |
| 数字 | number | 包含整数、小数、NaN、正负无穷。 |
| 大整数（`BigInt`） | bigint | 表示任意精度格式的整数。 |
| 布尔值 | boolean | 仅 true 和 false。 |
| 符号（`Symbol`） | symbol | 一般用 Symbol 方法传入字符串或数字创建。 |
| `undefined` | undefined | 表示未声明、不存在。 |
| `null` | object | 表示空。 |
| 对象（Object） | object | 一般用大括号（花括号）包裹起来。 |
| 数组（Array） | object | 一般用中括号（方括号）包裹起来。 |

`typeof` 是一个获取该对象属于何许类型的关键词函数，其返回值是一个字符串，具体值均位于上表。但请注意，无法用此方法来判断一个对象（实例）是否创建于某个类，如要做此类判断，需要用到 instanceof 关键词。

```typescript
console.info(typeof 1); // -> 'number'
console.info(typeof 'abc'); // -> 'string'
console.info(typeof null); // -> 'object'
```

其中，上表所列 9 种类型中，前 7 种为原始值（又名原始数据类型）。其中字符串和布尔值很好理解，以下为其余种类的特别说明。

- 数字和大整数
  - 数字（`Number`）既可以表示整数也可以表示小数，可调用 `Number.isInteger` 函数判断指定数字是否为整数，其遵循 IEEE 754 规范，并由这些范围和精度限制：当表示整数时，有安全边界（-9,007,199,254,740,991 到 9,007,199,254,740,991 之间），超出此范围即变成类似指数的形式；当表示小数时，有精度限制，具体精度会根据当前表示的大小呈一定动态变化；数字能表示的最大值为 2⁻¹⁰⁷⁴（约 1.798×10³⁰⁸），再大则被标记为正无穷（+∞ 或 Infinity），若小于该值的赋值则被标记为负无穷（-∞ 或 -Infinity）；能表示的最小正数，亦即最接近 0 的数为2⁻¹⁰⁷⁴（即 5×10⁻³²⁴）。
  - 而大整数（`BigInt`）则仅用于表示整数，但几乎没有大小限制（即没有上述安全边界）。
- 空
  - `null` 表示空，与大多数编程语言的 `null` 或 `nil` 相同或类似。
另请注意，`typeof null` 返回的是字符串 `object`。
  - `undefined` 表示未定义，其与 `null` 类似，但不完全相等，因为含义不同。当我们去获取某个不存在的成员属性，或者通过超出范围的下表访问数组元素，又或者仅获取某个不存在的成员属性（但不执行调用），都会返回 `undefined`（不会抛出异常），因为它们不存在，亦即未曾被定义。
  - `""`（中间没内容的两个双引号）或 `''`（中间没内容的两个单引号）表示空字符串，是个字符串但没具体文本内容，但本身不是空；
`[]` 表示空数组，其内没有元素，但本身不是空。
- 符号
  - 符号（`Symbol`）通常用于在对象中定义一些特殊的属性或方法，存在目的非常有限。通过调用 `Symbol` 函数来实现创建（不能使用 new 关键词），可不传入参，或传入一个字符串或数字。由此创建的每个值都是唯一的，即即便入参一致其值也不同。

### 等号

- 一个等号（`=`）表示赋值。
  如：`a = 2` 表示设置 `a` 的值为数字 2。
- 两个等号（`==`）表示相等判断，但该判断不严谨，某些相似含义相等的也会视为相等，因此通常不推荐使用。
  如：`1 == 1`、`1 == '1'`、`undefined == null`、`0 == false`、`[] == ''` 都为 `true`。
- 三个等号（===）表示相等判断，且会严格遵循类型相同原则。
  如：`1 === 1` 和 `false === false` 为 `true`；但 `undefined === null` 则为 `false`；不过请注意，`NaN === NaN` 也为 `false`。
- 前缀感叹号（`!`）表示非操作。
  如：`!false`、`!null`、`!undefined`、`!0`、`!''`、`!NaN` 都为 `true`。
  如果作为判断（如 `if` 语句内），所有不为 `false` 的场景（`false`、`null`、`undefined`、`0`、`0n`、`''`、`NaN`），皆为 `true`。
- 不等于，即 `!=` 和 `!==`，与相等判断类似，前者在某些情况采用含义相等判断，而后者比前者更严，包含类型一致性校验。
- 没有4个或更多等号的运算符，也没有感叹号加3个或更多等号的运算符。
- 对于对象（Object）和数组（Array），`==` 和 `===` 即对应的不等判断都比较的是引用本身，不进行值本身的表意比较，即两个独立对象即便包含的属性等信息完全一致，但仍旧不相等。
- `NaN` 表示一个“不是数字”的数字，例如除以 `0` 后的商。由于语义设计的原因，表达式 `NaN == NaN` 和 N`aN === NaN` 都是 `false`。

### 变量和常量

Type Script 的变量声明方式和 Java 编程语言更为接近。先是限定范围，即常量 `const` 或变量 `let`，随后是变量名，紧随其后是冒号及类型，最后是等号及初始值，可以不赋值，但请注意在不赋值时其值无论为何类型皆初始为 `undefined` 直到后续被重新赋值。Type Script 支持类型推断，如果进行了初始赋值，其类型可以根据值类型进行基本推断，若符合预期则可不写类型。

```typescript
const a = 2;    // a 是常量，值为数字 2，根据类型推断，类型为 number 数字型。
let b: string; // b 是变量，类型是字符串，初始值没写即为 undefined。
```

请注意，常量是不可更改的，即初始化之后不可再次赋值，而变量是可以在后续被再次赋值的。有时候，常量会是一个复杂对象，对象中可能会由属性，也有可能这个常量是个数组，数组里有多个元素，虽然这个常量本身不能被赋值，但其属性和数组元素却是有可能可以被修改的，这是因为 JS 世界中，变量、常量、属性等的值，通常都是以引用的形式赋予的。

### 引用

除了数字等值类型，JS 世界与大多数高级语言类似，对象（包括数组）都是引用类型，因此，在执行赋值时，仅修改该变量所指向的结果。例如，声明了一个变量 `a` 并向其赋值某对象，再声明 `b` 并赋值为 `a`，此时 `a` 和 `b` 都指向该对象；当将 `b` 赋值零一对象时，`a` 依然还指向前对象，因此与 `b` 从此分道扬镳互无关系。

```typescript
let a = {};
let b = a;
console.info(a === b); // -> true
b = {}; // 此时 b 有被赋值了一个新对象。
console.info(a === b); // -> false
```

对对象属性的变更，将仅影响该属性的引用，这也就意味着，如果有其它变量引用该属性，那么该变量指向的依然是该属性原来的值，而不会更新为新值，同理，对新属性值进行内部进行调整（例如再对其内属性进行赋值），将仅影响新属性值。

对对象属性的变更，将仅影响该属性的引用，这也就意味着，如果有其它变量引用该属性，那么该变量指向的依然是该属性原来的值，而不会更新为新值，同理，对新属性值进行内部进行调整（例如再对其内属性进行赋值），将仅影响新属性值。

```typescript
// a 对象里有一个属性 b，且值为一个对象。
let a = { b: {} };
let c = { b: a.b }; // c 对象里也有一个 b，且就是 a 里的 b。
console.info(a.b === c.b); // -> true
a.b = {}; // 给属性 b 赋值新值。
console.info(a.b === c.b); // -> false
c.b = a.b; // 重新将属性 b 赋予 c。
console.info(a.b === c.b); // -> true
a.b.d = {}; // 给属性 b 也设置一个属性。
console.info(a.b.d === c.b.d); // -> true
c.e = {}; // 数 c 设置属性 e 为一个对象。
console.info(a.b.e === c.b.e); // -> true
```

### 对象

对象用大括号（花括号）包裹表示。

- 对象的定义，可通过赋值一堆大括号（花括号）来完成。Type Script 支持语法推断，也可以显示声明，并包含具体子元素的约束类型。
- 对象在初始化时，可以在大括号（花括号）内，通过属性名、冒号、值的方式，批量初始化属性。
- 对象的属性名可以是字符串，也可以是 `Symbol` 类型的值。
- 可通过类似于索引，即中括号（方括号）内传入字符串或 `Symbol` 的方式，访问属性，包括读写。
- 可通过点加属性名的方式，访问属性，包括读写，但此时属性名需符合一定格式规范，不符合的只能通过上一条所介绍的索引方式访问。
- 读取不存在的属性时，会返回 `undefined`，而不会抛异常。写入不存在属性时，会动态创建该属性，除非该类禁止写该属性。
- 如果使用 `delete`，会移除该属性。

```typescript
const obj = { // 初始化了一个对象。
  a: 123, // 同时初始化了两个属性。
  b: true,
};
obj.a = obj.c; // 修改属性 a；以及读取属性 c，因为不存在，所以返回的是 undefined。
obj['a'] = 456; // 以索引方式访问属性 a，此处是写操作实例。
delete obj['a']; // 删除了属性 a。
```

可以封装为类的形态，并通过 `new` 关键词来创建实例。此时，可以通过 `instanceof` 后加该封装类的方式，来判断指定对象是否是该类或其继承类的实例。

```typescript
let a = new Promise((resolver, reject) => {
  resolve({});
});
console.info(a instanceof Promise); // -> true
```

支持使用 `for-in` 循环对对象属性进行遍历。

```typescript
const obj = {
  a: 123,
  b: true,
};
for (const key in obj) {
  // 其中 key 是属性名，
  // 需要像如下这样，通过下标访问形式才能返回属性的值。
  const ele = obj[key]; // ele 是属性的值。
}
```

可以通过以下 `Object` 中的静态方法，传入指定对象，来读取其信息。

| 方法名 | 作用 |
| ---------- | ------------------------------ |
| `keys` | 获取所有的属性名。返回值为以子元素为字符串的数组。 |
| `hasOwn` | 判断是否有特定属性。属性名传入第二个参数。 |
| `values` | 获取所有属性的值。返回值是数组类型。 |
| `defineProperty` | 定义新属性，可以设置 getter、setter、修饰等。属于高级用法。 |

除此之外，对象在复制和取值方面，有特别语法加持。

```typescript
const obj = {
  a: 123,
  b: true,
};
const copied = [...obj]; // 相当于将 obj 浅层拷贝了一份给 copied。对 copied 进行属性添加、替换和删除，不会对 obj 有影响。
const merged = {
  a: 0,
  ...obj,
  a: 456,
  c: 'hello'
}; // 初始化 merged 对象，先设置属性 a 为 0；然后用 obj 里的属性分别按键值对赋值到 merged 里，其中 a 重复，那么会执行覆盖；接着再用 a 为 456 覆盖前面从 obj 浅拷贝进来的 123，以及新增属性 c 为 'hello'。最终结果为 { a: 456, b: true, c: 'hello' }。
const { a, b: d } = obj; // 等效于 const a = obj.a; const d = obj.b; 两次声明和赋值。
```

### 数组

数组用中括号（方括号）包裹表示，其内为各元素。

- 数组的定义，可通过赋值一对中括号（方括号）来完成。Type Script 支持语法推断，也可以显示声明，并包含具体子元素的约束类型。
- 可通过 `length` 属性获取其长度。
- 可通过数组索引（下标）来读写访问。索引从 0 开始。当读取时索引小于 0，或大于等于数组长度时，即发生了越界，此种情形会返回 `undefined`，而不会抛出异常。
- 如果使用 `delete`，仅会将指定子元素的值设为 `undefined`，而不会真的移除该索引。

```typescript
const arr1 = ['abc', 1.414]; // 定义了一个数组，并初始了两个值。
const arr2: number[] = []; // 定义了另一个数组，无初始值，且该数组的子元素必须为数字型。

const item1 = arr1[0]; // 读取 arr1 下标为 0 的子元素，即其起始元素。
const item2 = arr1[3]; // 读取 arr1 下标为 3 的子元素。越界，会返回 undefined，而非抛出异常。
arr1[1] = 3.14; // 修改了 arr1 下标为 1 的值。

delete arr1[1]; // arr1 = [undefined, 3.14];
```

数组也是一种对象，可通过 instanceof Array 的方式，来判断一个对象是否为数组。

```typescript
console.info(arr1 instanceof Array); // -> true
console.info([] instanceof Array); // -> true
console.info(100 instanceof Array); // -> false
console.info(null instanceof Array); // -> false
```

使用 for-in 循环对数组进行遍历时，其返回的项为索引的字符串形式，而通常我们希望读取该元素的值，因此需要以下标形式再读取一遍。

```typescript
for (const i in arr1) {
  // 其中 i 是字符串，值是 '0' 和 '1' 一类，
  // 需要像如下这样，通过下标访问形式才能返回子元素本身。
  const ele = arr1[i]; // ele 才是数组中具体子元素的值。
}

// 也可以用普通的 for 循环来遍历。
for (let i = 0; i < arr1.length; i++) {
  const ele = arr1[i]; // 此时 i 是自增整数，通过下标访问形式可以获取子元素的值。
}
```

数组内置一些函数，以下较为常见。

| 方法名 | 作用 |
| ---------- | ------------------------------ |
| `push` | 在末尾添加一个或多个元素，并返回数组新的长度（length）。 |
| `pop` | 移除最后一个元素并返回该元素。 |
| `reverse` | 就地反转数组中元素的顺序。即前面变成后面，后面变成前面。 |
| `splice` | 从数组中添加和/或删除元素。 |
| `forEach` | 遍历。即对调用数组中的每个元素调用给定的函数。 |
| `map` | 返回一个新数组，其中包含对调用数组中的每个元素调用函数的结果。 |
| `filter` | 返回一个新数组，其中包含调用所提供的筛选函数返回为 true 的所有数组元素。 |
| `includes` | 确定调用数组是否包含一个值，根据情况返回 true 或 false。 |
| `indexOf` | 返回在调用数组中可以找到给定元素的第一个（最小）索引，如果找不到则返回 -1。 |
| `lastIndexOf` | 返回在调用数组中可以找到给定元素的最后一个（最大）索引，如果找不到则返回 -1。 |

除此之外，数组在复制和取值方面，有特别语法加持。

```typescript
const arr = [1, 2, 3, 4];
const copied = [...arr]; // 相当于将 arr 浅层拷贝了一份给 copied。对 copied 进行子元素添加、替换、删除和排序，不会对 arr 有影响。
const merged = [0, ...arr, 5, 6]; // 处理浅层拷贝，还在前后分别追加了别的子元素。相当于 const merged = [0, 1, 2, 3, 4, 5, 6];
const [a, b] = arr; // 等效于 const a = arr[0]; const b = arr[1]; 两次声明和赋值。
```

### `Map` 和 `Set`

较新的 JS 中提供了以下常用的基于集合或哈希表的功能更定向丰富的对象可供直接使用，都可以使用 `new` 关键词创建实例。

| 类型 | 作用 |
| ---------- | ------------------------------ |
| `Set` | 类似于数组，但是成员的值都是唯一的，没有重复的值，可通过 add 成员方法添加、delete 成员方法删除、has 成员方法检查，支持遍历，支持 size 成员属性获取长度。 |
| `WeakSet` | 与 Set 类似；但作为 Weak 系列类型：只能添加对象类型或数组类型的元素，且这些元素在此类中不会作为 GC 的引用计数（即外部没引用了那么此处也一并没了），也不支持遍历、size 属性。 |
| `Map` | 键值对集合，键可以是几乎任意类型而不现定于字符串类型，可通过 get 成员方法读值、set 成员方法写值、delete 成员方法删属性、has 成员方法检查键名，支持遍历，支持 size 成员属性获取长度。 |
| `WeakMap` | 与 Set 类似，但具有类似 WeakSet 的 Weak 系列类型一致的弱引用特征。 |
| `ArrayBuffer` | 储存二进制数据的一段内存。不能直接读写，需通过按指定格式解读后的类型视图（如 TypedArray 和 DataView）来进行读写。除此之外，还有一个可供跨 service worker 共享访问用的 SharedArrayBuffer 类型版本。 |

## 封装
通过将模块封装为函数和类，并进一步组成模块，以实现可扩展和可复用，并尝试进行逻辑分离设计。

### 函数

函数的写法与变量类似：先是 `function` 作为前缀，再是函数名，随后为括号，括号后面是冒号和返回值类型，无返回值的函数则类型处填 `void`；括号内包含可选的参数，参数数量不限，均为参数名、冒号、类型的格式，参数可以有初始值，但如果一个参数有初始值，那么其后面的各参数均需要有初始值；函数体位于函数声明之后，用大括号（花括号）包裹；返回值类型和参数类型均支持类型推断。

```typescript
// 函数名为 c；
// 包含两个参数，分别是字符串型 d，和基于类型推断的数字型且默认值为 2 的 e；
// 基于类型推断，返回值为布尔值。
function c(d: string, e = 2) {
  // 下方两行为函数体。
  console.log(d + e);
  return e > 0;
}
```

函数支持匿名函数，又名箭头函数，可当作变量一样进行传递，通常传递给需要回调的地方（如作为其它函数的参数或某个结构体的属性）。

```typescript
const f = () => { // 无参数
  console.log("这是个箭头函数。"); // 函数体
};
const h = (i: number) => { // 有参数
  console.log(i);
  return i > 0; // 有返回值
};
```

函数本身也是对象，可通过 instanceof Function 的方式，来判断一个对象是否为函数。

```typescript
(() => {}) instanceof Function
```

### 类

在 Type Script 中声明类，需要先添加 `class` 关键词，紧随其后为类名，之后是用大括号（花括号）包裹起的类结构体，其中可以包含以下内容。

- 字段。先写字段名，通常以双下划线开头以示私有，随后为冒号和类型，后面可以根据需要加上初始赋值即等号与值。
- 构造函数。格式为 `constructor` 后跟小括号，里面为可选不定数量的参数，参数均为参数名、冒号、类型的格式，参数可以有默认值，但某个参数有默认值后后面的参数都必须有默认值。构造函数无返回值。如果构造函数被设计为无任何传参，也没有任何初始化操作，那么可以不写。
- 方法，形同函数，但不需要加 `function` 前缀。
- 属性，可以分开设置其读写行为，可以只读、只写、读写共 3 种模式。其中，读行为的定义为 `get` 前缀，后为属性名，随后为一对小括号，无参，返回类型即为属性类型，在后面是 `getter` 的方法提；写行为与都行为类似，只不过前缀为 `set`，有一个参数，参数类型为属性类型，无返回值。

```typescript
class A {
  __field1: string; // 私有字段。
  __field2: number;
  constructor(s: string, num = 0) { // 构造函数。
    this.__field1 = s;
    this.__field2 = num;
  }
  increase() { // 方法。该方法无入参，无返回值。
    this.__field2++;
  }
  add(value: number) { // 另一个方法，有入参也有返回值。
    this.__field2 += value;
    return this.__field2;
  }
  get str() { // 属性 getter。属性名为 str，返回类型根据类型推断为字符串。
    return this.__field1;
  }
  set str(value: string) { // 属性 setter。属性名也是 str。
    this.__field1 = value;
  }
}
```

类支持继承，在类名后增加 `extends` 关键词及基类名即可。继承类的构造函数和方法体内，通过 `super` 关键词，可以访问到基类的方法。

- 在继承类中构造函数体内，第一行应当调用基类的构造函数，方式为 `super(…)`。
- 在继承类的方法中，如果需要调用基类同名方法，则可以调用 `super` 对象中对应的方法，具体调用位置根据业务需要决定，也可以不用调用。例如，基类中如果存在方法 `a()`，则可通过调用 `super.a()` 来达成。

```typescript
class B extends A {
  constructor(s: string) {
    super(s, 1); // super 函数是基类的构造函数，需要在继承类的构造函数体内第一行写。
  }
  add(value: number, neg: boolean) { // 重载基类方法。
    return super.add(neg ? value : -value); // 调用基类方法。
  }
  decrease() { // 新增方法。
    this.add(-1);
  }
}
```

### `this`

在类中，如需访问其它成员，可以使用 `this` 关键词。

```typescript
class A {
  func1() {
    return "Greetings";
  }
  func2() {
    return this.func1() + " guest!";
  }
}
```

不过，在 JS 世界中，需要特别留意的是 `this` 反映的是当前上下文，而不是代码书写时所在的位置。

```typescript
class A {
  returnThis() {
    return this;
  }
}

const a = new A();
a.returnThis(); // 返回的是 a。
const b = a.returnThis; // 此时 b 是一个独立的函数，不再属于 a。
b(); // 返回的是 undefined，因为这是 Line 3 中找寻的 this，是基于独立的 b 在寻找，没找到。
const c = { b }; // 为了方便理解，我们把 b 赋予 c 中，即 c.b 和 a.returnThis 的函数体一样。
c.b(); // 返回的是 c，因为这里的函数 b 属于 c。
b(); // 返回的是 undefined，因为这个 b 依然是无主的，和 c.b 并不是一回事。
```

可以通过函数的 `bind` 方法，强行绑定一个现成的 `this`。也可以通过 `apply` 函数或 `call` 函数，在此轮执行时绑定。

```typescript
// 继续上例
b.apply(100); // 此次返回的是 100。
b(); // 返回的又恢复为 undefined。
b.bind(a);
b(); // 返回的是 a，因为通过 bind 强行绑定了。
```

另外，Type Script 对箭头函数有进行特别处理，使其 `this` 指代的是再上一层对应的执行对象。

```typescript
class A {
  getThisHandler() {
    return () => { return this };
  }
}

const a = new A();
a.getThisHandler();  // 返回的依然是 a，而不是箭头函数本省。
const b = a.returnThis; // 此时 b 是一个独立的函数，不再属于 a。
b(); // 同理，返回的也是 undefined。
```

接口
Type Script 支持声明接口，实现该接口的类，或声明为该接口的对象，需要符合接口定义中的约束。声明接口，需要先标明 `interface` 关键词，随后为接口名，再后为大括号（花括号）包裹起的接口声明体，其内为属性和方法。

```typescript
interface INameValue {
  name: string;
  value: string;
  toLine(): string;
}
```

请注意，与大多数强类型语言不同，Type Script 中的接口概念，只是编译前的语法约束，其在编译后实际是不存在的，因此其作用主要是编程书写规范，而无法通过反射或类似技术来进行识别或判断。
接口命名一般遵循以下规则之一。

- `I` 开头。
- `Contract` 结尾。
- 如果该接口为 React 组件的 props 声明，则名称一般为组件名加 `Props` 后缀，如组件名若为 `NameInfo`，则对应 props 声明之接口名为 `NameInfoProps`。

### 装饰器

即 Decorator，用于装饰类或函数的函数，目的在于提供一个机制，能够在类和删除被正式使用前，先经过这个函数进行一番处理。

### 模块

如果采用 node.js 风格的模块输出模式，那么 `.ts` 文件中所有声明的变量、常量、函数、类和其它内容，默认都只能在本文件内使用，如果需要供外部使用，需要在最前面加上 `export` 标记。

```typescript
function getFirstChar(s: string) {
  return s ? undefined : s[0];
} // 这个函数没有 export 声明，因此仅可内部使用（如 Line 10）。

export const settings = {
  count: 100,
  name: 'Test',
}; // 外部可读取本文件暴露的 settings 常量，也可修改其中的字段。
export function getFirstLetter(s: string) {
  return getFirstChar(s);
} // 此函数也是能被外部调用的。
```

当其它地方使用这里通过 `export` 声明封装的内容时，需要先通过 `import` 来引用，该关键词后面接一对大括号（花括号），内为需要引用的变量名、常量名、函数名、类名和/或其它内容的名称，此括号后面接 `from` 关键词，在后面是一个字符串，为需要引用文件的相对路径，不需要扩展名，如果文件名为 `index.ts` 或 `index.tsx` 那么文件名也可以省略。

```typescript
import { settings, getFirstLetter } from './moduleA';

// 使用方式
const letter = getFirstLetter(settings.name);
```

大括号（花括号）内的内容，即为本文件中可以直接使用的内容。但有时，为了防止重名，我们可能需要对引用的内容的名称进行修改，可以在其后使用 `as` 关键词并加上新名字即可。

```typescript
import { settings as settingsInA, getFirstLetter } from './moduleA';

// 这里也有一个名叫 settings 的变量。
// 但是没关系，我们在 Line 1 中将 moduleA 里的 settings 更名为了 modulesInA，
// 这个更名仅在本文件中有效，其它地方依然还叫 settings，或其内同样通过 as 之后的名字。
const settings = {
  name: 'Another'
};

// settingsInA.name 即为 'Test'；
// 作为对比，settings.name 为 'Another'。
const letter = getFirstLetter(settingsInA.name);
实际上，import-from 还能引用外部库，这些库需要实现在项目顶层目录中 package.json 文件的 dependencies 中注册，随后即可引入。与引用项目内的唯一不同是，原本路径中的相对目录地址，需要改为该外部库的名字，或是外部库名字加上其内部地址。
// 引用外部库 React 中的 useEffect 函数和 useState 函数。
import { useEffect, useState } from 'react';
```

## 更多前端基础

获取更多有关前端的基本知识，以了解完整的开发和运作方式。

### `Promise`

如前文所述，虽然 JS 世界并不支持真正的多线程，但支持基于 fiber（线程片段）的异步编程模式。异步编程通常意味着需要通过回调或事件，来注入实现指定下一个代码块的执行，能于特定时机点触发。为了方便前端开发过程中，能够以一种顺序的方式来将多个具有前后异步接续的代码块的书写，引入了一个简单的异步状态机 `Promise` 来作为承载。`Promise` 是个类，可以通过 `new` 关键词来创建，构造函数中需要传入一个回调，回调中包括成功 `resolve` 和失败 `reject` 两个参数，这两个参数都是函数，前者接收结果，后者接受失败原因。大多数情况下，并不需要前端研发自行创建这个类的实例，而是通过传递或衍生的方式来使用。例如，当通过现代浏览器内置的 `fetch` 函数来请求网络资源，则会返回一个 Promise 对象，使用者可以用这个对象中包含的 `then` 成员方法，来注册 `onFulfill` 成功和失败 `onReject` 的回调。

```typescript
const resp = fetch('https://kingcean.org/blog/config.json?promp=这里应该是某个请求地址');
resp.then(r => { // 第一个回调是成功后会触发的
  console.info(r); // 返回的结果
}, error => { // 第二个回调（可选）是失败后会触发的
  console.info(error); // 出错原因
});
```

如果在 `then` 里面的回调直接 `return` 结果或 `throw` 异常，则会自动创建一个新的 `Promise` 对象，其成功链路的值即来源于原 `Promise` 对象 `onFulfill` 里返回的值，其失败链路的错误信息即来源于原 `Promise` 对象 `onFulfill` 里抛的异常或 `onReject` 里返回的值。

```typescript
function getData()
  return fetch('https://kingcean.org/blog/zh-Hans.json?promp=这里应该是某个请求地址').then(r => {
    if (r == null) {
      throw new Error('没内容'); // 会触发 Line 16，其中 error 即为 new Error('没内容')。
    }
    return r; // 会触发 Line 13，其中 r 即为此处的 r。
  }, error => {
    return { msg: '错误' }; // 会触发 Line 16，其中 error 即为 { msg: '错误' }。
  });
}
getData().then(r => {
  // 来源于 Line 6，r 的值为该行的 r。
  console.info(r);
}, error => {
  // 来源于 Line 4 和 Line 8，其值为上述 Error 或对象。
  console.error(error);
});
```

为了简化这种回调的写法，Type Script（及较新的 JS）引入了 C# 的语法 async 和 await 关键词。返回 Promise 对象的函数，需要在函数名前用 async 关键词进行修饰，而原先调用 Promise 对象 then 成员方法的地方，该用 await 关键词进行修饰，从而直接获取结果，而失败链路可以通过 try-catch 来捕获。

```typescript
function async getData()
  let resp = await fetch('https://kingcean.org/blog/zh-Hans.json?promp=这里应该是某个请求地址'); // 若 fetch 抛异常，会自动触发 Line 13，其中 ex 即为 Error 异常信息。
  if (r == null) {
    throw new Error('没内容'); // 会触发 Line 13，其中 ex 即为 new Error('没内容')。
  }
  return r; // 会触发 Line 11，其中 data 即为 r。
}
function async process() {
  try {
    var data = await getData();
    console.info(data); // 来源于 Line 6，其值即为 r。
  } catch (ex) {
    console.error(ex); // 来源于 Line 4，其值即为该处 Error；或来源于 Line 2 抛异常时情景，其值即为该 Error 异常。
  }
}
```

除此之外，`Promise` 还包含一些静态函数，用于处理多个 `Promise` 对象的等待关系，以下较为常用。

| 函数名 | 作用 |
| ---------- | ------------------------------ |
| `all` | 传入一组 `Promise` 对象，并等待全部结束。 |
| `any` | 传入一组 `Promise` 对象，其中任意一个结束本函数即算结束，其它对象依旧会在按期预定方式完成，但不会阻塞本函数的回调执行。 |

### 继续探索 Type Script

有了以上基本了解后，请参考 Type Script 官网中的手册，了解更深入的知识。

> https://www.tslang.com.cn/zh/docs/handbook/intro.html

### npm

如果当前写的库，是供第三方使用的，即作为组件库、工具库或其它形式的可分发库，供其它库或最终工程进行引用，那么可以打成 npm 包，并部署在 npm 分发平台，供外部引用。npm 包括以下内容：

- 前端包封装标准；
- CLI，即用于管理依赖和负责打包的工具，依托 Node.js；
- 分发平台，即 npm registry，包括官方公网版、GitHub Packages（常用于开源项目测试包）、二级分发平台（包含公网版转发和自有 scopes）、自建、本地模拟等形式。

npm 包使用一个放置于工程根目录的 package.json 进行描述，包括其中依赖关系。即便不是作为分发包进行打包，也会创建一个该文件，用于管理其中依赖。请参考以下文档，以了解更多信息。

> https://docs.npmjs.com/creating-a-package-json-file

npm 是微软旗下 GitHub 的一部分，其曾经是 Google 发起后交给 OpenJS 基金会运营的 Node.js 的一部分。

### 前端框架

从以下角度可以看出，前端开发过程会遇到以下困境。

- JS 提供的核心库能力，与 C#、Java、C++ 等主流高级语言相比，非常薄弱；
- JS 对 DOM 操作的编程书写方式不是那么简洁。

现实中社区前后提出了众多解决方案来实现更便利的前端开发体验，包含了完整的业务驱动界面交互的开发模式，而这些方案由于影响涉及面较广，体系也较复杂，因此通常都是以前端框架为形态出现。这些框架，有的对现有 JS 使用习惯做了更严格的限制，有的则扩充了现有语法（相当于打了个私有补丁）并提供编译能力，以确保开发者能基于现有体系模式下能够顺利完成预期的开发任务。

目前市面上尚有众多前端框架，各有利弊特色，但没有必要在初期每个都学习一遍，而应当以业务既定方案为优先。以下是当下几款常见的前端框架。

| 框架名 | 厂商 | 特点 |
| ------ | ------ | ------------------ |
| [React](https://zh-hans.react.dev/) | Meta | 单向数据流、Virtual DOM、`jsx`/`tsx`、函数式编程。 |
| [Angular](https://angular.cn/) | Google | MVVM、依赖注入。 |
| [Vue.js](https://cn.vuejs.org/) | 尤雨溪 等人 | MVVM、Virtual DOM。 |
| [Lit](https://lit.dev/) | Google | Web components。 |

## React

我们以其中一款业内主流框架 React 为例，来进一步介绍其基本用法。

这是 Meta 公司（以前名为 Facebook）开发的一个开源前端框架，包括了完整的 UI 渲染和交互的托管机制，以及配套的基础设施。其也引入了一套名为 `jsx`/`tsx` 的语法，在 JS 和 Type Script 之上增加了更简便的 UI 编写方式。React 采用单向数据流设计，因此在代码逻辑的书写上会具有一定特色。

### 描述 UI

UI 在 React 中都是基于组件来实现的，组件是 UI 层组装中的原子模块，因此在实现 UI 时，本质上实现 React 组件。
React 组件是基于函数来描述的，该函数的入参成为 props，用于由更上层的组件来初始化和变更该组件的状态。函数体中最终需要通过 `return` 来返回一组标签元素或其它被嵌套的子组件。因此，书写一个 React 组件，首先需要以接口形式定义一个 props，这是外界与其内进行通信的主要途径，包含所有所需的参数和所能提供的回调；然后实现一个函数，接受这个 props 参数，并在函数体内实现对应的逻辑，以最后返回需要呈现的元素。

```tsx
interface NameValueComponentProps {
  name: string;
  value: string;
}
function NameValueComponent({ name, value }: KeyValuePairComponentProps) {
  // 返回元素，其中可以用大括号（花括号）包含变量。
  return <div>
    <span>{name}</span>
    <span>{value}</span>
  </div>;
}
```

组件可以嵌套；返回的元素体本身可以是包含可执行动态逻辑的，动态逻辑需要包含在大括号（花括号）内，该逻辑中如果又涉及到元素则要包含在小括号内。

```tsx
// 继续实现一个包含一组 NameValueComponent 的更大型一点的组件。
interface MyComponentProps {
  name: string;
  items: NameValueComponentProps[];
}
export function MyComponent({ name, items }: MyComponentProps) {
  if (!name && !items) { // 函数体内通常还会有一些行为逻辑。
    return <div>Empty</div>;
  }
  return <section>
    <h2>{name}</h2>
    <div>
      {items.map(ele => // 这是一个循环的代码逻辑，其内又返回了子组件。
        (<NameValueComponent name={ele.name} value={ele.value} />)
      )}
    </div>
  </section>;
}
```

请继续参考以下文档了解更多。

> https://zh-hans.react.dev/learn/describing-the-ui

### 交互与状态

显然，UI 不仅是单纯的展示，还有互动。例如用户通过点击，可以触发一些行为。可以在 React 组件函数体内声明一些函数，并通过事件进行绑定。

```tsx
interface MyComponentProps {
  name: string;
  items: NameValueComponentProps[];
}
export function MyComponent({ name, items }: MyComponentProps) {
  function add() { // 我们在此增加了一个函数，并在 Line 21 中用到了。
    items.push({
      name: 'new one - ' + items.length,
      value: new Date().toString(),
    });
  }
  if (!name && !items) {
    return <div>Empty</div>;
  }
  return <section>
    <h2>{name}</h2>
    <div>
      {items.map(ele => <NameValueComponent name={ele.name} value={ele.value} />)}
    </div>
    <div>
      <button onClick={add} >Add</button>
    </div>
  </section>;
}
```

有时候，我们需要保存一些中间变量，这些变量会在下次被触发执行更新渲染时用到。这些变量成为 state，即状态，因为它代表的是该组件当下的内部状态。在数据驱动的 UI 模型中，UI 最终呈现成什么，是基于数据来指引的，这就引入了这个状态概念：我们将当前状态进行保存、修改和其它操作管理，并基于当下最新的状态进行 UI 内容上的渲染，也就是说，我们实现的这个 React 组件函数，其本质是基于状态来套用固有逻辑和模板，来进行界面生成的。

状态的初始化、读取和更新，是使用 `useState` 函数，该函数接受一个初始值，也可以无参数（即初始值为 `undefined`），并返回一个数组，数组共两个元素，第一个是当下值，第二个是个用于更新该值的函数，该函数没返回值，但有一个参数即预期新值。这些函数通常都需要写在 React 组件函数体内的最前面，并且不能是 `if-else`、`switch-case` 或其它具有条件分支链路的代码块里。

```tsx
export function TextComponent() {
  // 初始化了一个 state。当然，也可以通过多次调用 useState() 来初始多个 state。
  // 返回值中，value 为当前该 state 的值，而 setValue 为一个函数，用于更新。
  // value 和 setValue 这两个词是可以随便命名的，一般表达的是你希望用于干什么。
  // 其中 value 在 Line 11 中用到，setValue 在 Line 8 中用到。
  const [ value, setValue ] = useState();
  return <div>
    <input type='text' onChange={ev => setValue(e.target.value)} />
    <br />
    <span>当前输入值为 </span>
    <span>{value}</span>
  </div>;
}
```

现实中，我们可能会在一个组件中用到多个 state。除此之外，实际上还有许多更高阶的其它函数，支持更复杂的功能，他们通常都以 `use` 开头，他们大多也都必须放置于 React 组件函数体内的最前面，且不能处于各类条件分支语句中。因此，我们会实现更多更为复杂的状态管理。
请继续参考以下文档了解更多。

1. 添加交互
  https://zh-hans.react.dev/learn/adding-interactivity
2. 状态管理
  https://zh-hans.react.dev/learn/managing-state
3. 脱围管理
  https://zh-hans.react.dev/learn/escape-hatches

React 内置了许多此类函数，我们称这些函数为 React Hook，以下介绍其中一些较为常用的。

### `use`

有两种用法。

- 读取父组件传入的 `Promise` 对象；
- 从父层（或非常父层）`Provider` 中获取 context 信息。

```typescript
function use<T>(resource: Context<T> | Promise<T>): T; 
```

先看第一种用法：Promise。这种场景往往是外层组件会进行一些异步操作，例如请求某个网络资源（如通过 fetch 或更高阶的接口封装去请求某个 web API），而在内层组件便可以直接使用，且仅异步操作完成后才会执行渲染。

```tsx
import { use } from 'react';
function getDataFromApi() {
  return fetch('https://kingcean.org/blog/zh-Hans.json?promp=这里应该是某个请求地址');
}
export function ContainerComponent() {
  const promise = getDataFromApi(); // 父组件中获取了一个 Promise 对象但并没 await。
  return <ViewerComponenent data={promise} />;
}
export interface ViewerComponentProps {
  data: Promise<{ // 接受一个 Promise 对象。
    name: string;
    list: {
      name: string;
      [property: string]: unknown;
    }[]
  }>;
}
export function ViewerComponent({ data }: ViewerComponentProps) {
  const { name, list } = use(dataPromise); // 经此 use 后，返回的就是结果。
  return <section>
    <div>{name}</div>
    <ul>
      {list.map(ele => (
        <li>{ele.name}</li>
      ))}
    </ul>
  </section>;
}
```

然后再看第二种用法：context。它的工作方式类似于 `useContext`。当为了解决多层级深度的信息传递，或其它形式的跨组件的信息传递时，有时会使用 context 来执行，即事先创建一个 context，然后在某层父组件中对其进行赋值，便可以在子组件中获取使用。

```tsx
import { createContext, use } from 'react';
const TextContext = createContext('default value');
export function aComponent() {
  return <TextContext.Provider value="new value">
    <bComponent />
  </TextContext.Provider>;
}
export function bComponent() {
  return <cComponent />;
}
export function cComponent() {
  const text = use(TextContext); // 跨越层级传递，返回的是 Line 4 里设置的 'new value'。
  return <div>{text}</div>;
}
```

请继续参考以下文档了解更多。

> https://zh-hans.react.dev/reference/react/use

另，其实 `use` 并不属于 React Hook，但是是 React 的一个内置 API；但下方介绍的几种的确是 React Hook。

### `useReducer`

注入一个函数，该函数用于按照自定义行为更新 state。一般情况下我们可以使用 `useState` 来获取和设置 state，但有的时候，我们设置 state 并不希望是通过类似于 set 这样简单的赋值来完成，而是按照一个规则，封装成一个自定义函数，该函数会根据传入的额外参数，连同当前 state 值，来决定新的值。

```typescript
function useReducer<TState, TAction>(
  reducer: (state: TState, action: TAction) => TState,
  initialArg: TState): [TState, (action: TAction) => void]; 
function useReducer<TState, TAction, TInitArg>(
  reducer: (state: TState, action: TAction) => TState,
  initialArg: TInitArg,
  init: (arg: TInitArg) => T): [TState, (action: TAction) => void];
```

例如，我们有个计数器，这个计数器接受传入自增或 delta（变化值），那么我们可以用这个 Hook 来实现。具体来说，我们先实现一个函数，这个函数接受两个参数，一个是 state 的旧值，另一个是对象类型的动作说明，动作说明里包含字段说明其自增或自减具体多少，然后我们在函数体内完成计算并返回新值。之后，React 函数组件里面可以通过此 Hook，传入该函数和初始 state 值，便可以拿到当下值和触发函数。触发函数仅接受一个参数，即动作描述。

```TSX
import { useReducer } from 'react';
function increase(state, action) {
  if (action.num === undefined) return state.value++;
  return state.value += action.num;
}
export function increaseComponent() {
  const [i, dispatchI] = useReducer(increase, { value: 0 });
  return <section>
    <div>{i}</div>
    <div><button onClick={ev => dispatchI({ num: 1 })} >Add</button></div>
  </section>;
}
```

请继续参考以下文档了解更多。

> https://zh-hans.react.dev/reference/react/useReducer

### `useEffect`

初始化或依赖变更时触发。

```typescript
function useEffect(
  setup: () => void | () => (() => void),
  dependencies: any[]): void; 
```

通常，在一个组件首次加载时，如果我们需要执行一段初始化函数，那么就可以利用此 Hook 达成。

```tsx
import { useEffect, useReducer } from 'react';
export function onceComponent() {
  const [i, dispatchI] = useReducer(increase, { value: 0 });
  useEffect(() => {
    console.info('组件被加载啦！');
    dispatchI({ num: 100 }); // 会在初始化时执行一次。
  }, []);
  return <section>
    <div>{i}</div>
    <div><button onClick={ev => dispatchI({ num: 1 })} >Add</button></div>
  </section>;
}
```

该 Hook 接受一个回调，该回调会在组件初始化时触发执行；还接受一个数组，里面是依赖项，如果任意一个依赖项的值发生了变化，那么也会重新触发前面的回调。回调可以是不返回值（即 void）的函数，也可以返回一个无入参无返回值的函数，这个返回的函数会当作 dispose 使用，即组件销毁时触发。

```tsx
import { useEffect } from 'react';
export function onceComponent() {
  useEffect(() => {
    console.info('组件被加载啦！');
    return () => {
      console.info('组件被销毁啦！');
    };
  }, []);
  return <div>示例组件</div>;
}
```

请继续参考以下文档了解更多。

> https://zh-hans.react.dev/reference/react/useEffect

### `useMemo`

初始一个需要通过特定函数计算而来的值，该函数会在 React 函数组件初始化，以及指定的依赖项发生变更时，才会触发，触发完成后会将返回的结果值进行自动缓存，后续使用时均是读取该缓存值。

此 Hook 其实与 `useEffect` 类似，只不过区别在于其注入的函数是需要有个返回值的，该值会被返回以便被使用。

此 Hook 接受两个参数，第一个是一个纯函数，无入参但需要有一个返回值；第二个参数是一个数组，里面是指定的依赖项。其会返回一个对象，即前述纯函数返回值，不过是来自缓存。

```typescript
function useMemo<T>(
  calculateValue: () => T,
  dependencies: any[]): T; 
```

```tsx
import { useMemo } from 'react';
export function onceComponent() {
  const date = useMemo(() => {
    console.info('组件被加载啦！');
    return new Date();
  }, []);
  return <div>{date.toString()}</div>;
}
```

请继续参考以下文档了解更多。

> https://zh-hans.react.dev/reference/react/useMemo

### 其它常见 Hooks

| React Hook | 说明 |
| ---------- | ------------------------------ |
| `useTransition` | 当组件内存在加载过程竞争问题时，可以使用此 Hook 进行解决排队问题。 |
| `useCallback` | 缓存函数本身，避免反复构建。 |
| `useDeferredValue` | 延迟 UI 渲染，当需要响应用户频繁交互请求时（如搜索建议）较为有用。 |
| `useOptimistic` | 执行提交操作时，支持对界面进行附有加载状态的假写。 |

### 自定义 Hook

除此之外，我们也可以自行封装这些 hook 函数，其函数内可以调用其它 React Hook，但需要在函数体内的最前面，且通常不能在各类条件分支语句中。

```tsx
import { useState } from 'react';
import { getFirstLetter } from './moduleA';

export function useFirstLetter(s: string = '') { // 这是我们封装的 React Hook。
  const [ value, setValue ] = useState(s);
  return [ getFirstLetter(s), setValue ]; // 此例中我们也返回了一个数组，但并一定需要如此。
}
import { useFirstLetter } from './moduleC';
export function firstLetterComponent() {
  // 这里调用了我们自己实现的 React Hook。
  // 返回数组中的 firstLetter 和 setString
  // 分别对应 moduleC.tsc 中返回的 getFirstLetter(s) 和 setValue，
  // 此前说过，命名随意，因为对应关系是按顺序来的。
  // 其中 firstLetter 在 Line 14 中被用到，
  // 而 setString 在 Line 11 中被用到。
  const [ firstLetter, setString ] = useFirstLetter();
  return <div>
    <input type='text' onChange={ev => setString(e.target.value)} />
    <br />
    <span>当前输入值的首字母为 </span>
    <span>{firstLetter}</span>
  </div>;
}
```
