JavaScript 中的数字（`Number`），属于基本类型，既能表示整数，又能表示常规小数，还能带指数的小数，和其它许多编程语言一样，它也有自己的精度限制。

## 特征

在 JavaScript 中，其实任何数字都是双精度浮点型数值，遵循 IEEE 754 规范，类似于 Java 或 C# 语言中的 `double` 类型。这意味着它具备一些特性。

首先，整数实际也是小数，所以即便我们用三个等号的相等比较运算（`===`）也能得出两种不同表示法是相等的，包括整数形态、其它进制形态、指数形态。

```javascript
console.info(100 === 100.0); // -> true
console.info(100 === 0x64);  // -> true
console.info(100 === 0b01100100); // -> true
console.info(100 === 1e2);   // -> true
console.info(100 === 0.1e3); // -> true
console.info(Number("100") === 100.0); // -> true
console.info(Number("100.0") === 100); // -> true
```

当然，JavaScript 在 `Number` 中提供了一个成员方法，用于帮助我们判断一个数字其本质是不是整数（即小数位均为0），即 `isInteger()`。

```javascript
console.info((100).isInteger());  // -> true
console.info((3.14).isInteger()); // -> false
```

其次，由于是浮点，也就是说，受 64 位二进制长度限制，为了尽可能表示更大范围的数值，其小数位的位数会随着要表示数值的大小而左右移动，从而产生精度问题。JavaScript 也将相关的阈值等信息，通过制度静态属性的方式，挂载在 `Number` 类型下。

- `Number.EPSILON`

  精度，具体为比 1 大的能表示的最小数字，减去 1 后的差值，为 2⁻⁵²，约合 2.220×10⁻¹⁶。由于浮点的特点，导致数值越大精度会越底，因此比1小的两个能表示的相邻正数的差值可能会更小，事实上，JavaScript 中最小的正数是 `Number.MIN_VALUE`。

  ```javascript
  console.info(Number.EPSILON * 0.8 + 1 - 1 === Number.EPSILON); // -> true
  console.info(Number.EPSILON * 0.2 + 1 - 1 === 0); // -> true
  console.info(Number.EPSILON * 0.8 + 2 - 2 === 0); // -> true
  console.info(Number.EPSILON * 0.8 < Number.EPSILON); // -> true
  console.info(Number.EPSILON * 0.2 > 0); // -> true
  ```

- `Number.MIN_VALUE`

  能表示的最小正数，也就是大小最接近 0 的整数，通常为 2⁻¹⁰⁷⁴，亦即 5×10³²⁴，具体根据浏览器和系统平台不同而有可能不一样。比这个小的值，基于精度限制，要么依旧与之相等，要么是 0，而更小的则为负数。

  ```javascript
  console.info(Number.MIN_VALUE * 0.8 === Number.MIN_VALUE); // -> true
  console.info(Number.MIN_VALUE * 0.2 === 0); // -> true
  ```

- `Number.MAX_VALUE`

  能表示的最大正数，通常为 2¹⁰²⁴-1，约合 1.798×10³⁰⁸。大于这个值的，基于精度限制，要么与此值相等，要么被视为正无穷；小于这个值的负值的，基于精度限制，要么与此值相等，要么被视为负无穷。

  ```javascript
  console.info(Number.MAX_VALUE + 100 === Number.MAX_VALUE); // -> true
  console.info(!Number.isFinite(Number.MAX_VALUE * 1.1)); // -> true
  ```

- `Number.MIN_SAFE_INTEGER`

  表示精确整数中的最小值，此值为 -2×10⁵³+1，即 -9,007,199,254,740,991。如果某需要表示的整数小于此值，则会因浮点精确度问题而不准。

  ```javascript
  console.info(Number.MIN_SAFE_INTEGER - 1 === Number.MIN_SAFE_INTEGER - 2); // -> true
  ```

- `Number.MAX_SAFE_INTEGER`

  表示精确整数中的最大值，此值为 2×10⁵³-1，即 9,007,199,254,740,991。如果某需要表示的整数大于此值，则会因浮点精确度问题而不准。

  ```javascript
  console.info(Number.MAX_SAFE_INTEGER + 1 === Number.MAX_SAFE_INTEGER + 2); // -> true
  ```

同时，由于是二进制表示法，因此在一些小数上，会与十进制表示法看到的效果出现预期不一致的现象。该现象在许多编程语言中都是存在的，当然，有些编程语言也额外内置提供了适合十进制的小数结构，例如 C# 中的 `decimal`。

```javascript
console.info(0.1 + 0.2 === 0.3); // -> false
console.info(0.1 + 0.2); // -> 0.30000000000000004
console.info((0.1 + 0.2 - 0.3) < Number.EPSILON); // -> true
```

## 特殊值

除此之外，还有3个比较特殊的 `Number` 类型的值，其中一些在上文中已经出现过。

- `NaN`：不是一个数字（Not a number）。该值通常由不合法算数（例如除以 0 所得的商）或其它类型强转数字时失败而来。该值有一处比较特殊的抢矿，即其不等于任何值或对象，包括也不等于自己，只能使用 `isNaN` 判断；以及其与任何数字的大小比较，均返回 `false`。
- `Number.POSITIVE_INFINITY`：正无穷。这是 JavaScript 中唯一大于 `Number.MAX_VALUE` 的值。
- `Number.NEGATIVE_INFINITY`：负无穷。这是 JavaScript 中唯一小于 `-Number.MAX_VALUE` 的值。
- 以上关于大小比较，有个矛盾之处，即 `NaN` 分别与 `Number.POSITIVE_INFINITY` 和 `Number.NEGATIVE_INFINITY`，究竟竖大熟小：此时遵循 `NaN` 的规则，即均返回 `false`。

为什么会出现这些特征，以及这些阈值是怎么来的呢？这就和其在计算机底层的编码有关了。

## 编码结构

数字在编码结构上，是由 64 位二进制表示，其从左到右内由3部分构成。

1. 其中首位表示符号（sign），0 为正、1 为负。
2. 随后11位（即第2位-第12位）表示指数（exponent），这些位数的二进制转换为十进制后，可表示的数字范围为 -1022 至 1023 闭区间。
3. 最后 52 位（即第13为-第64位）用于表示尾数（mantissa），也就是这个原本要表示的数字的二进制幂指形态，取其中小数数值部分，并去除首位 1 和随后小数点（因为二进制指数形式的小数数值部分的整数位始终会是固定值1）。

那么，实际这个数字的值其实是由上述 3 部分以以下数学公式构成。

Number = (-1)<sup>sign</sup> × (1 + mantissa) × 2<sup>exponent</sup>

这种模式，实际上就是通过指数部分，来“移动”小数点位置，来构造整个数字。

所以，

- 尾数由于是二进制幂指形态小数数值部分去除前面固定的整数位，故如果尾数部分前面全填 0（即 51 个 0）而最后一位填 1，即 2⁻⁵²，这便是尾数的精度，也就是 `Number.EPSILON` 的由来，对应十进制数为小数点后大约 15 到 17 位，超过这个精度便会执行舍入操作。
- 同样受尾数位数影响，加上去除的首位1，实际共可表示 53 位数字，转化为十进制后，实际 -2⁵³+1 到 2⁵³-1 闭区间范围内，对应的就是 `Number.MIN_SAFE_INTEGER` 和 `Number.MAX_SAFE_INTEGER` 分别的值。当在该区间以外，实际就是小数点“右移”至尾数表示范围以外，因此其精度也就跟随此指数而不准。静态函数 `Number.isSafeInteger()` 可用于快速判断一个对象是否为整数且值的范围在上述安全值闭区间内。
- 受指数位长影响，其表示的最大值为 1023，表示最大值为 n × 2¹⁰²³，而 n 最大时即尾数所有位均填 1（即52个1加上前面的固定值1），于是 JavaScript 能表示的最大数字便是 2¹⁰²⁴-1，此即 `Number.MAX_VALUE` 的值。
- 同样，尾数能表示的最小值，即前述 `Number.EPSILON`，亦即 2⁻⁵²，而密为最小值 -1022，也就是 2⁻¹⁰²²，那么两者相乘，所得 2⁻⁵²⁻¹⁰²² = 2⁻¹⁰⁷⁴ 实际上就是能表示的最小正数了，也就是 `Number.MIN_VALUE` 的值。

## 强制转化

| 原值 | 转化为数值后 |
| -------- | -------- |
| 数字（`Number`） | 本身 |
| `undefined` | `NaN` |
| `null` | 0 |
| `true` | 1 |
| `false` | 0 |
| 字符串（`String`） | 尝试转化为数字（失败时为 `NaN`） |
| `BigInt` 类型 | 抛异常 `TypeError` |
| `Symbol` 类型 | 抛异常 `TypeError` |

字符串的转换情况如下。

- 前导和尾随的空格和换行符会被忽略。以下为忽略后的情形。
- 空字符串会被转化为 0。
- `"Infinity"`、`"+Infinity"` 转变为正无穷（`Number.POSITIVE_INFINITY`），`"-Infinity"` 转变为负无穷（`Number.NEGATIVE_INFINITY`）。
- 默认为十进制，也支持二进制（`0b` 先导）、八进制（`0o` 先导）、十六进制（`0x` 先导）。
- 转化失败时会返回 `NaN`。

其余值或对象在转化为数字时，会按顺序分别调用 `[Symbol.toPrimitive]("number")` 和 `valueOf()` 成员函数（如果有）。

除此之外，`parseInt` 和 `parseFloat` 静态函数分别用于将字符串转化为整数和小数，失败时均为 `NaN`。

## 格式化

而数字也能通过其成员方法，转化为不同形式表示内容的字符串。

- `toString(radix = 10)`

  转化为字符串的基础表现形式，其中 `radix` 参数表示进制，数值位 2 到 36 闭区间内，超出会抛异常 `RangeError`。

  ```javascript
  console.info((100).toString());   // -> 100
  console.info((100).toString(8));  // -> 144
  console.info((100).toString(16)); // -> 64
  console.info((100).toString(32)); // -> 2s
  ```

- `toPrecision(precision)`

  返回具有 `precision` 参数所指定数量数字（不含符号和小数点）的十进制表示。当数量多余实际精度表示范围时，小数末尾补零，少于实际精度表示范围时，所显示的最后一位四舍五入；当过小时，使用指数形式表示；无参数时，即等同于 `toString(10)`，返回原始十进制值的字符串形式。`precision` 如有值，需为不大于 100 的正整数，否则抛异常 `RangeError`。

  ```javascript
  console.info((123.456).toPrecision()); // -> 123.456
  console.info((123.456).toPrecision(2)); // -> 1.2e+2
  console.info((123.456).toPrecision(4)); // -> 123.5
  console.info((123.456).toPrecision(10)); // -> 123.45600
  ```

- `toFixed(digits = 0)`

  返回指定 `digits` 指定小数位数的小数。偏小时，所显示的最后一位四舍五入；偏大时，小数末尾补零。`digits` 如有值，需为不大于 100 的自然数，否则抛异常 `RangeError`。

  ```javascript
  console.info((123.456).toFixed()); // -> 123.456
  console.info((123.456).toFixed(2)); // -> 123.46
  console.info((123.456).toPrecision(4)); // -> 123.4560
  ```

- `toExponential(fractionDigits)`

  以指数形式展现。`fractionDigits` 指代小数部分小数长度，为空时为最短完整表示。

  ```javascript
  console.info((123.456).toExponential()); // -> 1.23456e+2
  console.info((123.456).toFixed(1)); // -> 1.2e+2
  console.info((123.456).toPrecision(7)); // -> 1.2345600e+2
  ```

- `toLocaleString()`

  以特定语言环境表示该数字的字符串，接受可选的 `locales` 和 `options` 参数。

## 受影响

字符串的长度受最大精确整数（`Number.MAX_SAFE_INTEGER`）影响，理论最多只能有 2⁵³-1 个元素。不过此长度的字符串需要 16,384 TB 的存储空间，远超当下许多设备的内存限制，因此实际情况通常是字符串最大长度会更小。

## `BigInt`

与许多其它编程语言类似，JavaScript 为了提供超出 `Number` 类型精确整数范围不够大的限制，引入了额外的类型，此即 `BigInt`，并与 `Number` 在使用上有许多相同的地方。

其构造函数（同 `Number` 一样不要带有 `new` 关键词）接受一个数字或是表示数字的字符串，并可用数字后加 `n` 的简写代替。

```javascript
console.info(1n === BigInt(1)); // -> true
```

其 `typeof` 返回的是字符串 `bigint`。在执行 `JSON.stringify` 静态函数序列化时，会转成字符串形式，返回的内容为对应的十进制数字表示。

`BigInt` 在计算机底层的结构，是采用变长字节数组（Variable-Length Byte Array）的形式来实现的，主要包括正负符号位、实际占用长度、数字本体。
