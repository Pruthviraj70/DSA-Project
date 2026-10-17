#include <algorithm>
#include <stdexcept>
#include <utility>
#include <vector>
int recursiveSearch(const std::vector<int> &a, int lo, int hi, int target) {
  if (lo > hi)
    return -1;
  int mid = lo + (hi - lo) / 2;
  if (a[mid] == target)
    return mid;
  return a[mid] < target ? recursiveSearch(a, mid + 1, hi, target)
                         : recursiveSearch(a, lo, mid - 1, target);
}
