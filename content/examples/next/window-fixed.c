#include <limits.h>
#include <stdbool.h>
#include <stdlib.h>
typedef struct {
  long long sum;
  int start;
} Window;
Window fixed_window(const int a[], int n, int k) {
  if (k < 1 || k > n || n > 32)
    return (Window){0, -1};
  long long sum = 0;
  for (int i = 0; i < k; ++i)
    sum += a[i];
  Window best = {sum, 0};
  for (int r = k; r < n; ++r) {
    sum += (long long)a[r] - a[r - k];
    if (sum > best.sum)
      best = (Window){sum, r - k + 1};
  }
  return best;
}
