"use strict";
function fixedWindow(a, k) {
  if (!Number.isInteger(k) || k < 1 || k > a.length || a.length > 32)
    throw new RangeError("k");
  let sum = 0;
  for (let i = 0; i < k; ++i) sum += a[i];
  let best = sum,
    start = 0;
  for (let r = k; r < a.length; ++r) {
    sum += a[r] - a[r - k];
    if (sum > best) {
      best = sum;
      start = r - k + 1;
    }
  }
  return [best, start];
}
