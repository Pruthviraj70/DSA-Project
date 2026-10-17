#include <algorithm>
#include <stdexcept>
#include <utility>
#include <vector>

bool better(int a, int b, bool maximum) { return maximum ? a > b : a < b; }
void siftDown(std::vector<int> &a, int n, int root, bool maximum) {
  while (2 * root + 1 < n) {
    int child = 2 * root + 1;
    if (child + 1 < n && better(a[child + 1], a[child], maximum))
      ++child;
    if (!better(a[child], a[root], maximum))
      break;
    std::swap(a[root], a[child]);
    root = child;
  }
}
void heapBuild(std::vector<int> &a, bool maximum) {
  for (int i = static_cast<int>(a.size()) / 2 - 1; i >= 0; --i)
    siftDown(a, static_cast<int>(a.size()), i, maximum);
}
void heapInsert(std::vector<int> &a, int value, bool maximum = false) {
  if (a.size() >= 32)
    throw std::length_error("capacity");
  a.push_back(value);
  int i = static_cast<int>(a.size()) - 1;
  while (i > 0) {
    int p = (i - 1) / 2;
    if (!better(a[i], a[p], maximum))
      break;
    std::swap(a[i], a[p]);
    i = p;
  }
}
