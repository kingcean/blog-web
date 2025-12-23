Numbers in JavaScript (`Number`) are all over the corners of your front-end scripts. It belongs to the basic type, which can represent both integers, regular decimals, and exponential decimals. Support for a wide range of operators for numbers, and include a large number of helper functions and constant properties in the built-in objects `Math`. Like many other programming languages, it has its own limitations in terms of precision and scope.

## Characteristics

In JavaScript, any number is actually a double-precision floating-point value, following the IEEE 754 specification, similar to the type `double` in Java or C#. This means that it has some characteristics.

First of all, integers are actually decimals, so even if we use the equality comparison operation of three equal signs (`===`), we can conclude that two different notations are equal, including integer forms, other base forms, and exponential forms.

```javascript
console.info(100 === 100.0); // -> true
console.info(100 === 0x64);  // -> true
console.info(100 === 0b01100100); // -> true
console.info(100 === 1e2);   // -> true
console.info(100 === 0.1e3); // -> true
console.info(Number("100") === 100.0); // -> true
console.info(Number("100.0") === 100); // -> true
```

Of course, JavaScript provides a member method `isInteger()` in `Number` to help us determine whether a number is an integer.

```javascript
console.info((100).isInteger());  // -> true
console.info((3.14).isInteger()); // -> false
```

Second, because it is a floating point, that is, limited by the length of 64 bits, in order to represent a wider range of values as much as possible, the number of decimal places will move left and right with the size of the value to be represented, resulting in accuracy problems. JavaScript also mounts relevant thresholds and other information under types `Number` through static read-only properties.

- `Number.EPSILON`

  Precision, specifically the smallest number that can be represented greater than 1, subtracts the difference after 1, which is 2⁻⁵², which is about 2.220×10⁻¹⁶. Due to the characteristics of floating-point, the higher the value, the lower the precision, so the difference between two adjacent positive numbers that can be represented less than 1 may be smaller, in fact, the smallest positive number in JavaScript is `Number.MIN_VALUE`.

  ```javascript
  console.info(Number.EPSILON * 0.8 + 1 - 1 === Number.EPSILON); // -> true
  console.info(Number.EPSILON * 0.2 + 1 - 1 === 0); // -> true
  console.info(Number.EPSILON * 0.8 + 2 - 2 === 0); // -> true
  console.info(Number.EPSILON * 0.8 < Number.EPSILON); // -> true
  console.info(Number.EPSILON * 0.2 > 0); // -> true
  ```

- `Number.MIN_VALUE`

  The smallest positive number that can be represented, that is, the integer with the nearest size to 0, is usually 2⁻¹⁰⁷⁴, or 5×10³²⁴, which may vary depending on the browser and system platform. Values smaller than this, based on precision limits, are either equal to it or 0, while smaller values are negative.

  ```javascript
  console.info(Number.MIN_VALUE * 0.8 === Number.MIN_VALUE); // -> true
  console.info(Number.MIN_VALUE * 0.2 === 0); // -> true
  ```

- `Number.MAX_VALUE`

  The maximum positive number that can be expressed is usually 2¹⁰²⁴-1, which is about 1.798×10³⁰⁸. Anything greater than this value is either equal to this value or regarded as positive infinity based on the precision limit; Negative values less than this value, based on precision limits, are either equal to this value or considered negative infinity.

  ```javascript
  console.info(Number.MAX_VALUE + 100 === Number.MAX_VALUE); // -> true
  console.info(!Number.isFinite(Number.MAX_VALUE * 1.1)); // -> true
  ```

- `Number.MIN_SAFE_INTEGER`

  Represents the smallest value in an exact integer, which is -2×10⁵³+1, which is -9,007,199,254,740,991. If an integer to be represented is less than this value, it will be inaccurate due to floating-point accuracy issues.

  ```javascript
  console.info(Number.MIN_SAFE_INTEGER - 1 === Number.MIN_SAFE_INTEGER - 2); // -> true
  ```

- `Number.MAX_SAFE_INTEGER`

  Represents the maximum value in an exact integer, which is 2×10⁵³-1, or 9,007,199,254,740,991. If an integer that needs to be represented is greater than this value, it will be inaccurate due to floating-point accuracy issues.

  ```javascript
  console.info(Number.MAX_SAFE_INTEGER + 1 === Number.MAX_SAFE_INTEGER + 2); // -> true
  ```
At the same time, because it is a binary notation, there will be an expected inconsistency with the effect seen in decimal notation on some decimal numbers. This phenomenon exists in many programming languages, and of course, some programming languages also have built-in decimal structures suitable for decimal systems, such as `decimal` in C#.

```javascript
console.info(0.1 + 0.2 === 0.3); // -> false
console.info(0.1 + 0.2); // -> 0.30000000000000004
console.info((0.1 + 0.2 - 0.3) < Number.EPSILON); // -> true
```

## Special values

In addition, there are following 3 special values of `Number` type.

- `NaN`

  Not a number. This value is usually derived from the following situations.
  
  - The result is not a real number of mathematical operations, such as `Math.sqrt(-2)`.
  - Number coercion failure from other types.
  - Indefinitive format.
  - Perform common arithmetic operations with `NaN`.
  - Turn some object invalidity into a number, such as getting a the tick from an illegal date (`new Date("Good morning").getTime()`).

  This value has a special case, that is, it is not equal to any value or object, including or equal to itself. It can only be judged by calling function `isNaN`. and its size comparison with any number, all return `false`.

- `Number.POSITIVE_INFINITY`

  Positive infinity (+∞), that is `Infinity`. This is the only `Number` value in JavaScript that is greater than `Number.MAX_VALUE`.

- `Number.NEGATIVE_INFINITY`

  Negative infinity (-∞), that is `-Infinity`. This is the only `Number` value in JavaScript that is less than `-Number.MAX_VALUE`.

```javascript
// imaginary number
console.info(Math.sqrt(-2)); // -> NaN

// Indefinitive format
console.info(0 * INFINITY); // -> NaN
console.info(1 ** INFINITY); // -> NaN
console.info(INFINITY / INFINITY); // -> NaN
console.info(INFINITY - INFINITY); // -> NaN

// Compare or equals to NaN
console.info(NaN === NaN); // -> false
console.info(NaN !== NaN); // -> true
console.info(NaN > 1); // -> false
console.info(NaN < 1); // -> false
console.info(NaN === 1); // -> false
console.info(NaN !== 1); // -> true
console.info(NaN < Number.POSITIVE_INFINITY); // -> false
console.info(NaN > Number.POSITIVE_INFINITY); // -> false
console.info(NaN === Number.POSITIVE_INFINITY); // -> false
console.info(NaN !== Number.POSITIVE_INFINITY); // -> true

// Infinity related
console.info(100 / 0); // -> Infinity
console.info(-100 / 0); // -> -Infinity
console.info(INFINITY > Number.MAX_VALUE); // -> true
console.info(Number.POSITIVE_INFINITY); // -> Infinity
console.info(-Number.POSITIVE_INFINITY); // -> -Infinity
console.info(-Number.POSITIVE_INFINITY === Number.NEGATIVE_INFINITY); // -> true
console.info(Number.POSITIVE_INFINITY + 100); // -> Infinity
console.info(Number.POSITIVE_INFINITY * 100); // -> Infinity
```

## Internal structure

Why do these characteristics occur, and where do these thresholds come from? This is related to its coding at the bottom of the computer.

In terms of `Number` coding structure, it is represented by 64-bit binary, which is composed of 3 parts from left to right.

1. The first sign is 0 and 1 is negative.
2. The next 11 bits (the 2nd to 12th bits) represent exponents, and the number of these bits can be represented in the range of -1022 to 1023 closed intervals after the binary conversion to decimal.
3. The last 52 bits (the 13th to 64th bits) are used to represent the mantissa (mantissa), which is the binary power form of the number that was originally intended to be represented, taking the decimal part of it, and removing the first 1 and subsequent decimal points (because the integer bit of the decimal part of the binary exponential form will always be a fixed value of 1).

So, the actual value of this number is actually composed of the above 3 parts with the following mathematical formula.

Number = (-1)<sup>sign</sup> × (1 + mantissa) × 2<sup>exponent</sup>

This pattern is actually to "move" the decimal point position through the exponential part to construct the whole number.

So

- Since the mantissa is a binary power refers to the shape decimal value part of the fixed integer bit in front. If the mantissa part is filled with all 0s (51 zeros) and the last digit is filled in 1, that is, 2⁻⁵², this is the precision of the mantissa. That is the origin of `Number.EPSILON`. The corresponding decimal number is about 15 to 17 decimal places, beyond this precision will be rounded.
- Also affected by the number of mantissa digits, plus the first digit of the removed 1, a total of 53 digits can actually be represented, and after converting to decimal, the actual -2⁵³+1 to 2⁵³-1 closed interval range, corresponding to `Number.MIN_SAFE_INTEGER` and `Number.MAX_SAFE_INTEGER` respectively. When outside this range, the decimal point is actually "shifted to the right" outside the mantissa representation range, so its accuracy follows this exponent and is inaccurate. Static functions `Number.isSafeInteger()` can be used to quickly determine whether an object is an integer and the value ranges within the above safe value closure interval.
- Affected by the exponential bit length, the maximum value it represents is 1023, which means that the maximum value is n × 2¹⁰²³, and when n is maximum, all bits of the mantissa are filled with 1 (i.e., 52 1s plus the fixed value 1 in front), so the maximum number that JavaScript can represent is 2¹⁰²⁴-1, which is the value of `Number.MAX_VALUE`.
- Similarly, if the minimum value that can be represented by the mantissa is the aforementioned `Number.EPSILON`, that is, 2⁻⁵², and the density is the minimum value -1022, that is, 2⁻¹⁰²², then the two are multiplied to get 2⁻⁵²⁻¹⁰²² = 2⁻¹⁰⁷⁴ is actually the smallest positive number that can be represented, that is, the value of `Number.MIN_VALUE`.

## Number coercion

| Original value | After converting to numerical values |
| -------- | -------- |
| `Number` type | Ittself |
| `undefined` | `NaN` |
| `null` | 0 |
| `true` | 1 |
| `false` | 0 |
| `BigInt` type | Throw exception `TypeError` |
| `Symbol` type | Throw exception `TypeError` |

The conversion of string is as follows.

- Leading and trailing spaces and line breaks are ignored. The following is the situation after ignoring.
- An empty string is converted to 0.
- `"Infinity"` and `"+Infinity"` transform into positive infinity (`Number.POSITIVE_INFINITY`). `"-Infinity"` transform into negative infinity (`Number.NEGATIVE_INFINITY`).
- The default is decimal, and binary (with `0b` prefix), octal (with `0o` prefix), and hexadecimal (with `0x` prefix) are also supported.
- Returns `NaN` when a conversion fails.

The conversion of array is as follows.

- Empty array is converted to 0.
- Array with only one number, is converted to that number.
- Array with only one string, is converted to the number converted from that string.
- Array with only `null` 或 `undefined`, is converted to 0.
- Array with only one `BigInt`, is converted to that number in the form of integer or exponential.
- Otherwise, is converted to `NaN`.

The remaining values or objects are called `[Symbol.toPrimitive]("number")` and `valueOf()` sequentially when converted to numbers, and the member functions (if any) are called separately, e.g. the instance of `Date` is converted to its tick.

In addition, `parseInt` and `parseFloat` static functions are used to convert strings to integers and decimals. And returns `NaN` if fail.

## String format

Numbers can also be converted into strings that represent content in different forms through their member methods.

- `toString(radix = 10)`

  It is transformed into the basic representation of a string. Where the parameter `radix` represents the base system. It is within the closed interval of 2 to 36. The exception `RangeError` will be thrown if out of range.

  ```javascript
  console.info((100).toString());   // -> 100
  console.info((100).toString(8));  // -> 144
  console.info((100).toString(16)); // -> 64
  console.info((100).toString(32)); // -> 2s
  ```

- `toPrecision(precision)`

  Returns a decimal representation with the number of numbers specified by the parameter `precision` (without signs and decimal points). When the number is more than the actual accuracy representation range, the decimal place is filled to zero, and when it is less than the actual accuracy representation range, the last digit displayed is rounded; When less, it is expressed in the form of an exponential; If there is no parameter, it returns the original decimal value in the form of a string, like to call `toString(10)`. If there is a value, it must be a positive integer not greater than 100, otherwise it will throw an exception `RangeError`.

  ```javascript
  console.info((123.456).toPrecision()); // -> 123.456
  console.info((123.456).toPrecision(2)); // -> 1.2e+2
  console.info((123.456).toPrecision(4)); // -> 123.5
  console.info((123.456).toPrecision(10)); // -> 123.45600
  ```

- `toFixed(digits = 0)`

  Returns the decimal number of decimal places with length by `digits`. When the number is less than the actual length, the last digit shown is rounded; If it is larger, the decimal place will be filled with zero. If there is a value, it must be a natural number that is not greater than 100, otherwise it will throw an abnormal number.

  ```javascript
  console.info((123.456).toFixed()); // -> 123.456
  console.info((123.456).toFixed(2)); // -> 123.46
  console.info((123.456).toPrecision(4)); // -> 123.4560
  ```

- `toExponential(fractionDigits)`

  It is presented in the form of an index. `fractionDigits` refers to the decimal part decimal length, which is the shortest complete representation when it is empty.

  ```javascript
  console.info((123.456).toExponential()); // -> 1.23456e+2
  console.info((123.456).toFixed(1)); // -> 1.2e+2
  console.info((123.456).toPrecision(7)); // -> 1.2345600e+2
  ```

- `toLocaleString()`

  A string of numbers that represents the number in a specific locale, accepting optional `locales` and `options` parameters.

## Impact or not

Considering that many other types of range ranges in JavaScript are affected by numeric representations, they also seem to be limited by the extremes of precision integers. So is this really the case?

- The maximum length of the string

  The length of the string (`string`) seems to be limited by the maximum exact integer (`Number.MAX_SAFE_INTEGER`), which is theoretically limited to a maximum of 2⁵³-1 elements. However, a string of this length requires 16,384 TB of storage, which is far more than the actual operating memory usage of many devices today.

  Therefore, the maximum string length is usually significantly smaller than this limit, and the value is not necessarily the same for different JavaScript runtime implementations, and is generally defined based on the 32-bit integer (e.g., `int` in C++) of the language used by the engine to implement it.

- The range of the date

  Date and time (`Date`) is a structure of a specific time point represented by a timestamp based on the origin of the zero point of January 1, 1970 in Coordinated Universal Time (UTC) and with milliseconds (ms) as the precision, regardless of leap seconds. In other words, it essentially relies on numbers to store specific dates and times, and is escaped by encapsulation. Since the underlying layer is based on numbers, it seems that the oldest and most future times it represents should be determined by the maximum and minimum values of the exact integer.

  However, this is not the case. The range of the date is defined by the range of plus or minus 100 million days (i.e. 864 trillion milliseconds) of the origin, that is, the range from 0:00 on April 20, 271821 BC to 0:00 on September 13, 275760 AD. This range is less than and within the scope of exact integers in JavaScript.

  ```javascript
  function logDate(num) {
    console.info(new Date(num).toUTCString());
  }

  logDate(0); // -> Thu, 01 Jan 1970 00:00:00 GMT
  logDate(8640000000000000);  // -> Sat, 13 Sep 275760 00:00:00 GMT
  logDate(8640000000000001);  // -> Invalid Date
  logDate(-8640000000000000); // -> Tue, 20 Apr -271821 00:00:00 GMT
  logDate(-8640000000000001); // -> Invalid Date
  logDate(Number.MAX_SAFE_INTEGER); // -> Invalid Date
  logDate(Number.MIN_SAFE_INTEGER); // -> Invalid Date
  ```

## `BigInt`

Like many other programming languages, JavaScript introduces additional types in order to provide a limit that is not large enough beyond the range of `Number` exact integers of the type. It is `BigIntNumber`. It has many similarities in use with `Number`.

Its constructor (likewise `Number` without keywords `new`) accepts a number or a string representing a number, and can be replaced by a shorthand that append a suffix `n` after the number.

```javascript
console.info(1n === BigInt(1)); // -> true
console.info(1n + 1n); // -> 2n
```

Its `typeof` returns a string `bigint`. When performing static function `JSON.stringify` to serialize, it will be converted into a string form, and the content returned will be the corresponding decimal numeric representation.

The structure of `BigInt` at the bottom of the computer is implemented in the form of a variable-length byte array, which mainly includes positive and negative symbol bits, actual occupied length, and number ontology.
