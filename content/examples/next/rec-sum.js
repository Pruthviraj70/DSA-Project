"use strict";
function prefixSum(a, n) {
  if (!Number.isInteger(n) || n < 0 || n > 32 || n > a.length)
    throw new RangeError("n");
  return n === 0 ? 0 : prefixSum(a, n - 1) + a[n - 1];
}
