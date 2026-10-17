"use strict";
function recursiveSearch(a, lo, hi, target) {
  if (lo > hi) return -1;
  const mid = lo + Math.floor((hi - lo) / 2);
  if (a[mid] === target) return mid;
  return a[mid] < target
    ? recursiveSearch(a, mid + 1, hi, target)
    : recursiveSearch(a, lo, mid - 1, target);
}
