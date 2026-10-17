#include <limits.h>
#include <stdbool.h>
#include <stdlib.h>
long long fibonacci(int n) {
  if (n < 0 || n > 10)
    return -1;
  if (n <= 1)
    return n;
  long long first = fibonacci(n - 1);
  long long second = fibonacci(n - 2);
  return first + second;
}
