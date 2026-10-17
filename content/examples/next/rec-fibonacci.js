"use strict";
function fibonacci(n) {
  if (!Number.isInteger(n) || n < 0 || n > 10) throw new RangeError("n");
  if (n <= 1) return n;
  const first = fibonacci(n - 1),
    second = fibonacci(n - 2);
  return first + second;
}
