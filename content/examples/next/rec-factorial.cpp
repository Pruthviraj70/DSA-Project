#include <algorithm>
#include <stdexcept>
#include <utility>
#include <vector>
long long factorial(int n) {
  if (n < 0 || n > 12)
    throw std::out_of_range("n");
  if (n <= 1)
    return 1;
  return n * factorial(n - 1);
}
