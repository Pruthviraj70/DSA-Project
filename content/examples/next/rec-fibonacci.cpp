#include <algorithm>
#include <stdexcept>
#include <utility>
#include <vector>
long long fibonacci(int n) {
  if (n < 0 || n > 10)
    throw std::out_of_range("n");
  if (n <= 1)
    return n;
  auto first = fibonacci(n - 1);
  auto second = fibonacci(n - 2);
  return first + second;
}
