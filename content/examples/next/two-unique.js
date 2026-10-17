"use strict";
function uniquePrefix(a) {
  if (!a.length) return 0;
  let write = 1;
  for (let read = 1; read < a.length; ++read)
    if (a[read] !== a[write - 1]) a[write++] = a[read];
  return write;
}
