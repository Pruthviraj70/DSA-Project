"use strict";
function pairSum(a, target) {
  let left = 0,
    right = a.length - 1;
  while (left < right) {
    const total = a[left] + a[right];
    if (total === target) return [left, right];
    if (total < target) ++left;
    else --right;
  }
  return null;
}
