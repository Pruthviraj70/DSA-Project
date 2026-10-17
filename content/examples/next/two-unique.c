#include <limits.h>
#include <stdbool.h>
#include <stdlib.h>
int unique_prefix(int a[], int n) {
  if (!n)
    return 0;
  int write = 1;
  for (int read = 1; read < n; ++read)
    if (a[read] != a[write - 1])
      a[write++] = a[read];
  return write;
}
