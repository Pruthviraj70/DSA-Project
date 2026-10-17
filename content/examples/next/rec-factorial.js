"use strict";
function factorial(n) {
  if (!Number.isInteger(n) || n < 0 || n > 12) throw new RangeError("n");
  return n <= 1 ? 1 : n * factorial(n - 1);
}
