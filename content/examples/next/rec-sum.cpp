#include <algorithm>
#include <stdexcept>
#include <utility>
#include <vector>
long long prefixSum(const std::vector<int> &a, int n) {
  if (n < 0 || n > 32 || n > static_cast<int>(a.size()))
    throw std::out_of_range("n");
  return n ? prefixSum(a, n - 1) + a[n - 1] : 0;
}
