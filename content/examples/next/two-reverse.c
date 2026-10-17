#include <limits.h>
#include <stdbool.h>
#include <stdlib.h>
void reverse_values(int a[], int n) {
  int l = 0, r = n - 1;
  while (l < r) {
    int t = a[l];
    a[l++] = a[r];
    a[r--] = t;
  }
}
