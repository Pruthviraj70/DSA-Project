"use strict";
function reverseValues(a) {
  let l = 0,
    r = a.length - 1;
  while (l < r) {
    [a[l], a[r]] = [a[r], a[l]];
    ++l;
    --r;
  }
}
