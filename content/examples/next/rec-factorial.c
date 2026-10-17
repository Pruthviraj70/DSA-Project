#include <limits.h>
#include <stdbool.h>
#include <stdlib.h>
long long factorial(int n) {
  if (n < 0 || n > 12)
    return -1;
  if (n <= 1)
    return 1;
  return n * factorial(n - 1);
}
