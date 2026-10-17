#include <limits.h>
#include <stdbool.h>
#include <stdlib.h>
typedef struct {
  int left, right;
} Pair;
Pair pair_sum(const int a[], int n, int target) {
  int l = 0, r = n - 1;
  while (l < r) {
    long long sum = (long long)a[l] + a[r];
    if (sum == target)
      return (Pair){l, r};
    if (sum < target)
      ++l;
    else
      --r;
  }
  return (Pair){-1, -1};
}
