#include <algorithm>
#include <stdexcept>
#include <utility>
#include <vector>
std::pair<int, int> minimumWindow(const std::vector<int> &a, int target) {
  if (a.size() > 32 || target <= 0)
    throw std::out_of_range("input");
  for (int v : a)
    if (v < 0 || v > 100000)
      throw std::out_of_range("value");
  int left = 0, best = 0, start = -1;
  long long sum = 0;
  for (int right = 0; right < static_cast<int>(a.size()); ++right) {
    sum += a[right];
    while (sum >= target) {
      int length = right - left + 1;
      if (!best || length < best) {
        best = length;
        start = left;
      }
      sum -= a[left++];
    }
  }
  return {best, start};
}
