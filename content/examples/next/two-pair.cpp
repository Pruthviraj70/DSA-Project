#include <algorithm>
#include <stdexcept>
#include <utility>
#include <vector>
std::pair<int, int> pairSum(const std::vector<int> &a, int target) {
  int l = 0, r = static_cast<int>(a.size()) - 1;
  while (l < r) {
    long long sum = static_cast<long long>(a[l]) + a[r];
    if (sum == target)
      return {l, r};
    if (sum < target)
      ++l;
    else
      --r;
  }
  return {-1, -1};
}
