#include <algorithm>
#include <stdexcept>
#include <utility>
#include <vector>
std::pair<long long, int> fixedWindow(const std::vector<int> &a, int k) {
  int n = static_cast<int>(a.size());
  if (k < 1 || k > n || n > 32)
    throw std::out_of_range("k");
  long long sum = 0;
  for (int i = 0; i < k; ++i)
    sum += a[i];
  std::pair<long long, int> best{sum, 0};
  for (int r = k; r < n; ++r) {
    sum += static_cast<long long>(a[r]) - a[r - k];
    if (sum > best.first)
      best = {sum, r - k + 1};
  }
  return best;
}
