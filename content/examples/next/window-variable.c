#include <limits.h>
#include <stdbool.h>
#include <stdlib.h>
typedef struct {
  int length, start;
} Shortest;
Shortest minimum_window(const int a[], int n, int target) {
  if (n < 0 || n > 32 || target <= 0)
    return (Shortest){-1, -1};
  for (int i = 0; i < n; ++i)
    if (a[i] < 0 || a[i] > 100000)
      return (Shortest){-1, -1};
  Shortest best = {0, -1};
  long long sum = 0;
  int left = 0;
  for (int right = 0; right < n; ++right) {
    sum += a[right];
    while (sum >= target) {
      int length = right - left + 1;
      if (!best.length || length < best.length)
        best = (Shortest){length, left};
      sum -= a[left++];
    }
  }
  return best;
}
