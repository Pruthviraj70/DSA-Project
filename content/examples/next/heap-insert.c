#include <limits.h>
#include <stdbool.h>
#include <stdlib.h>

bool better(int a, int b, bool maximum) { return maximum ? a > b : a < b; }
void sift_down(int a[], int n, int root, bool maximum) {
  while (2 * root + 1 < n) {
    int child = 2 * root + 1;
    if (child + 1 < n && better(a[child + 1], a[child], maximum))
      ++child;
    if (!better(a[child], a[root], maximum))
      break;
    int tmp = a[root];
    a[root] = a[child];
    a[child] = tmp;
    root = child;
  }
}
void heap_build(int a[], int n, bool maximum) {
  for (int i = n / 2 - 1; i >= 0; --i)
    sift_down(a, n, i, maximum);
}
bool heap_insert(int a[], int *n, int capacity, int value, bool maximum) {
  if (*n < 0 || *n >= capacity || *n >= 32)
    return false;
  int i = (*n)++;
  a[i] = value;
  while (i > 0) {
    int p = (i - 1) / 2;
    if (!better(a[i], a[p], maximum))
      break;
    int t = a[i];
    a[i] = a[p];
    a[p] = t;
    i = p;
  }
  return true;
}
