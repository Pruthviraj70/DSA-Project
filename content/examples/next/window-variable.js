"use strict";
function minimumWindow(a, target) {
  if (a.length > 32 || target <= 0 || a.some((v) => v < 0 || v > 100000))
    throw new RangeError("input");
  let left = 0,
    sum = 0,
    best = 0,
    start = -1;
  for (let right = 0; right < a.length; ++right) {
    sum += a[right];
    while (sum >= target) {
      const length = right - left + 1;
      if (!best || length < best) {
        best = length;
        start = left;
      }
      sum -= a[left++];
    }
  }
  return [best, start];
}
