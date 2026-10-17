#include <algorithm>
#include <stdexcept>
#include <utility>
#include <vector>
void reverseValues(std::vector<int> &a) {
  int l = 0, r = static_cast<int>(a.size()) - 1;
  while (l < r)
    std::swap(a[l++], a[r--]);
}
