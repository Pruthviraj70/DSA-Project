#include <algorithm>
#include <stdexcept>
#include <utility>
#include <vector>
int uniquePrefix(std::vector<int> &a) {
  if (a.empty())
    return 0;
  int write = 1;
  for (int read = 1; read < static_cast<int>(a.size()); ++read)
    if (a[read] != a[write - 1])
      a[write++] = a[read];
  return write;
}
