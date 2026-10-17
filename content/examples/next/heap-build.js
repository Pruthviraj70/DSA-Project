"use strict";

function better(a, b, maximum) {
  return maximum ? a > b : a < b;
}
function siftDown(a, n, root, maximum) {
  while (2 * root + 1 < n) {
    let child = 2 * root + 1;
    if (child + 1 < n && better(a[child + 1], a[child], maximum)) ++child;
    if (!better(a[child], a[root], maximum)) break;
    [a[root], a[child]] = [a[child], a[root]];
    root = child;
  }
}
function heapBuild(a, maximum = false) {
  for (let i = Math.floor(a.length / 2) - 1; i >= 0; --i)
    siftDown(a, a.length, i, maximum);
}
