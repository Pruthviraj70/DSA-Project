#include <limits.h>
#include <stdbool.h>
#include <stdlib.h>
int recursive_search(const int a[], int lo, int hi, int target) {
  if (lo > hi)
    return -1;
  int mid = lo + (hi - lo) / 2;
  if (a[mid] == target)
    return mid;
  return a[mid] < target ? recursive_search(a, mid + 1, hi, target)
                         : recursive_search(a, lo, mid - 1, target);
}
