#include <limits.h>
#include <stdbool.h>
#include <stdlib.h>
long long prefix_sum(const int a[], int n) {
  if (n < 0 || n > 32)
    return LLONG_MIN;
  if (!n)
    return 0;
  return prefix_sum(a, n - 1) + a[n - 1];
}
