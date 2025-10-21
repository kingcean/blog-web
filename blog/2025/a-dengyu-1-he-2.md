如果让我们创建一个对象 `a`，使得 `a == 1 && a == 2 && a != 2 && a != 1` 等式成立，这听起来很诡异，但仔细一想，其实还是很容易实现的。

## 实现

先不说那么多，直接上代码！

```javascript
const a = {
  value: 1,
  valueOf() {
    return this.value++;
  }
};

// 测试
if (a == 1 && a == 2 && a != 2 && a != 1) {
  console.info("居然是真的~~~");
} else {
  console.info("你骗人，根本不可行！");
}
```

好了，让我们打开浏览器 DevTools，切到 控制台 里把以上代码贴上去运行一下看看结果。

![控制台截图验证 JS 代码](./images/screenshot-2025-10-17-124700.jpg)

完美！输出的内容正是 `if (a == 1 && a == 2 && a != 2 && a != 1)` 判断语句为 `true` 的代码分支场景。

> 居然是真的~~~

## 弱类型

其实许多对 JavaScript 熟知的盆友们一眼就明白了，这个 `valueOf()` 是这个“诡异效果”的功臣。它是 `Object` 的原型方法，也就是说，所有对象都继承了这个成员方法。当然，我们可以按需重写这个方法，以返回更合适的内容。这个方法的作用在于返回对象的原始值，JavaScript 在诸如一元运算和等号运算等一些需要对象转换成基本类型值的场景，会在内部隐式地自动调用该函数。

众所周知，JavaScript 是一门弱类型语言，其有双等号（`==` 及对应不等于 `!=`）和三等号（`===` 及对应不等于 `!==`）之分，其中前者支持弱类型的相等比较，这意味着我们可以经常使用与预期类型不同的类型的值，例如以下几个示例。

```javascript
console.info(1 == "1");   // -> true
console.info(true == 1);  // -> true
```

实际这个弱语言特性，还在其它一些场景中广泛存在，例如下面的加法。

```javascript
console.info(1 + "1");    // -> "11"
console.info(true + 1);   // -> 2
console.info(false + 1);  // -> 1
```

之所以 JavaScript 能够将这些不同类型的值，通过一些策略和规则，最终友好地得出一些不符合直观上强类型的结果，那是因为，在具体执行前，JavaScript 语言将其中一些值转换为更适合的类型了。例如，

- 上例第1行的 `1 + "1"`，其中 `1` 被转隐式成了字符串 `"1"`；
- 上例第2行的 `true + 1`，其中 `true` 被隐式转换成了数字 `1`；同理，第3行的 `false` 被转成了数字 `0`。

## `Symbol.toPrimitive`

JavaScript 如何执行这类转化呢？首先，它会根据当前语句，包括已有变量类型，推断应该用什么类型更为合适，其会大致按照如下顺序依次调用对象中的方法（如果有且适用）。

1. `[Symbol.toPrimitive](hint)`：尝试获取转化为特定类型的值。默认情况下没有这个方法；如果有，则必须返回一个基本类型的值。其中，参数 `hint` 为字符串，会传入如下值。
   - `"default"`：通常都是此值，除了以下情况。
   - `"number"`：数字强制转换时，包括一元数字运算和 `Number()`。
   - `"string"`：字符串强制转换时，包括模板字符串和 `String()`。
2. `valueOf()`：尝试获取该对象原本的内置值。默认返回自身。当返回值是非复杂类型时，会被忽略。
3. `toString()`：输出格式化后的字符串内容。仅部分场景适用。

让我们来再做几个试验。先定义一个对象，里面包含了上述各方法。

```javascript
const a = {
  valueOf() { return 1; },
  toString() { return "b"; },
  [Symbol.toPrimitive](hint) {
    if (hint === "number") return 2;
    if (hint === "string") return "c";
    if (hint === "default") return 3;
    return 4;
  }
};
```

然后可以看看在不同场合下，JavaScript 会进行何种处理。先看双等号的等于比较（`==`），可以看出，优先执行到了 `[Symbol.toPrimitive]("default")` 语句。

```javascript
console.info(a == 1);   // -> false
console.info(a == "b"); // -> false
console.info(a == 2);   // -> false
console.info(a == 3);   // -> true
console.info(a == 4);   // -> false
```

再看看数字和字符串强制转化时的各场景。

```javascript
// [Symbol.toPrimitive]("number")
console.info(Number(a)); // -> 3
console.info(+a); // -> 3
console.info(-a); // -> -3

// [Symbol.toPrimitive]("string")
console.info(String(a)); // -> "c"
console.info(`${a}`);    // -> "c"

// .toString()
console.info(a.toString()); // -> "b"
```

对于其它需要转化为简单类型的场景，也都执行到了 `[Symbol.toPrimitive]("default")` 语句。

```javascript
console.info(a + 7);   // -> 10
console.info(a + "!"); // -> "3!"
```

由此可见，`[Symbol.toPrimitive](hint)` 拥有非常高的优先级，且其在不同场景下传入的参数会根据实际情况而不同。而当它不存在时，则 `valueOf()` 便成为对应的方法了。

## `valueOf`

如前面所述，`valueOf()` 是各类型都有的方法，除了 `null` 和 `undefined` 外，你在各对象中都能找到它。默认情况下，它返回的是对象自身（`this`），但也有一些类型重写了此方法，例如 `Date`，如下。

```javascript
const today = new Date("2025-10-17T00:00:00Z");
console.info(today.valueOf()); // -> 1760659200000
```

我们也可以在自己的对象或类实现中，重写此方法。

```javascript
const a = {
  valueOf() { return 1; }
};
```

然后我们再来做试验进行验证，情况如下。

```javascript
console.info(a == 1);    // -> true
console.info(a == true); // -> 1 == true -> true
console.info(a + 1);     // -> 2
console.info(a + "!");   // -> "1!"
console.info(Number(a)); // -> 1
console.info(String(a)); // -> "[object Object]"
console.info(`${a}`);    // -> "[object Object]"
```

这里要特别说明一下最后两行 `String(a)` 和字符串模板 `${a}`，其返回的是基于 `a.toString()` 的值，而不是 `String(a.valueOf())`，即便 `valueOf()` 实现里返回的是一个字符串，也依旧如此，即此处仍会是 `"[object Object]"`。但是，如果实现了 `toString()` 方法，那么将会是方法调用后返回的值，且无论 `valueOf()` 的实现为何皆如此。

```javascript
a.toString = function () { return "Hi!"; };

// 测试
console.info(String(a)); // -> "Hi!"
```

然后我们再来测试一下 `valueOf()` 返回的是复杂类型时的场景，会发现相当于效果如同并无此重写一样，即强制转化时，并为采纳该方法返回的结果，而仍旧当作普通对象进行处理。

```javascript
const b = {
  valueOf() { return a; }  
};

// 测试
console.info(b.valueOf().valueOf()); // -> 1
console.info(b == a); // -> false
console.info(b == 1); // -> false
console.info(b == b); // -> true
console.info(`${b}`); // -> "[object Object]"
```

## 另一种实现

所以，实现 `a == 1 && a == 2 && a != 2 && a != 1` 时，除了最前面采用 `valueOf()` 的示例外，还可以用 `[Symbol.toPrimitive](hint)` 实现，效果一致。

```javascript
const a = {
  num: 1,
  [Symbol.toPrimitive](hint) {
    return this.num++;
  }
};
```

当然，以上两种实现（基于 `valueOf()` 和基于 `[Symbol.toPrimitive](hint)`）都是存在副作用的，仅仅一些引用就导致其内置内容发生变更，所以平时不会这么使用，只是，为了产生这一“奇幻”效果，我们这么进行了实现，从而一窥其中奥秘。

那么，我们继续顺着这个来进一步衍生看看其中更多精彩吧！

有了以上知识，我们来尝试着实现 `Date` 对象相关的能力吧，因为前面提到其重写了 `valueOf()` 方法，实际上，它也实现了 `[Symbol.toPrimitive](hint)` 方法。

```javascript
class Date {
  valueOf() {
    return this.getTime();
  }

  [Symbol.toPrimitive](hint) {
    if (hint === "number") return this.valueOf();
    return this.toString();
  }

  // … 其它成员属性和方法，此处略。
}
```

在这里，

- 我们在 `[Symbol.toPrimitive]("number")` 场景中调用了 `valueOf()` 成员方法；
- 与此同时，`valueOf()` 中，则调用了 `Date` 中的 `getTime()` 成员方法，以返回基于毫秒的 Tick。
- 而 `[Symbol.toPrimitive]("string")` 和 `[Symbol.toPrimitive]("default")` 中调用了 `toString()` 成员方法，该方法返回了日期时间的字符串表现方式。

由此，我们在以下场景，就会看到其同时支持了字符串和数字的强制转化能力，并且它的 `default` 和字符串强制转化保持一致。

```javascript
const today = new Date("2025-10-17T00:00:00Z");

// [Symbol.toPrimitive]("number")
console.info(Number(today)); // -> 1760659200000

// [Symbol.toPrimitive]("string")
console.info(String(today)); // -> "Fri Oct 17 2025 08:00:00 GMT+0800 (中国标准时间)"

// [Symbol.toPrimitive]("default")
console.info("现在是 " + today); // -> "现在是 Fri Oct 17 2025 08:00:00 GMT+0800 (中国标准时间)"
```

## `JSON.stringify`

但，细心的你还会发现，我们在序列化一个 `Date` 对象时，其也会被转成一个自定义的形式，具体说来，是个表示特定日期时间的 ISO 8601 标准格式字符串。

```javascript
console.info(JSON.stringify(today)); // -> "2025-10-17T00:00:00.000Z"
```

那么，这是怎么回事呢？

原来，对于对象，我们还可以实现其 `toJSON()` 成员方法，当该对象自身或其作为其它对象的属性，被执行 `JSON.stringif()` 执行序列化时，如果存在，便会自动隐式先调用该方法。该方法需要返回一个值，可以是简单类型（如字符串、布尔值和数字）的值，也可以是对象或数组。最终，序列化会基于该值执行，并最终返回一个字符串。

| 类型 | 返回值字符串中内容 | 返回值示例 |
| ------- | -------------------- | ---------- |
| `null` | `null` | `"null"` |
| `NaN` | `null` | `"null"` |
| `Symbol` | `null` | `"null"` |
| `undefined` | 无（直接返回 `undefined`） | `undefined` |
| `true` | `true` | `"true"` |
| `false` | `false` | `"false"` |
| 数字 | 该数字（十进制） | `"123"` |
| 字符串 | 转义后的该字符串 | `"\"Hello!\""` |
| 对象 | 序列化后的该对象 | `"{\"value\":100}"` |
| 数组 | 序列化后的该数组 | `"[\"a\"]"` |
| 函数 | 无（直接返回 `undefined`） | `undefined` |

以下是个示例，其 `toJSON()` 成员方法返回了一个 JSON 对象。

```javascript
const a = {
  value: "序列化时不会出现本属性。",
  toJSON() { // 序列化时会以此方法返回值来执行。
    return { info: "序列化后仍是一个对象，且会包含本属性。" }
  }
};

// 测试
console.info(JSON.stringify(a)); // -> "{\"info\":\"序列化后仍是一个对象，且会包含本属性。\"}"
```

但这里请注意，如果 `toJSON()` 返回的对象中，也包含了 `toJSON()` 成员方法，那么这个序列化内部调用是不会传递的，也就是说，不会触发 `toJSON()` 返回对象里的 `toJSON()`，而是直接对其进行序列化了。

```javascript
a.toJSON = function () {
  return {
    data: "第一层",
    toJSON() {
      return { data: "第二层" };
    }
  }
};

// 测试
console.info(JSON.stringify(a)); // -> "{\"data\":\"第一层\"}"
```

所以，对 `Date` 实现该方法，返回一个能表示该日期时间的 ISO 8601 标准格式的字符串，即可实现现实中的效果。

```javascript
function numberToStringInternal(value, length) {
  return value.toString(10).padStart(length, "0");
}

class Date {
  toJSON() {
    // {yyyy}-{MM}-{dd}T{HH}-{mm}-{ss}.{sss}Z
    return `${numberToStringInternal(this.getUTCFullYear())}-${numberToStringInternal(this.getUTCMonth() + 1)}-${numberToStringInternal(this.getUTCDay())}T${numberToStringInternal(this.getUTCHours())}:${numberToStringInternal(this.getUTCMinutes())}:${numberToStringInternal(this.getUTCSeconds())}.${numberToStringInternal(this.getUTCMilliseconds())}Z`;
  }
  
  // … 其它成员属性和方法，此处略。
}
```
