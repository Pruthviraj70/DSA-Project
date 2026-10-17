#include <optional>
#include <stdexcept>
#include <utility>
#include <vector>
class HashTable {
  using Entry = std::pair<int, int>;
  std::vector<std::vector<Entry>> buckets = std::vector<std::vector<Entry>>(8);
  int count = 0;
  int bucket(int key) const {
    int c = static_cast<int>(buckets.size());
    int r = key % c;
    return r < 0 ? r + c : r;
  }

public:
  int size() const { return count; }
  std::optional<int> get(int key) const {
    for (const auto &e : buckets[bucket(key)])
      if (e.first == key)
        return e.second;
    return std::nullopt;
  }
  void rehash() {
    if (buckets.size() >= 64)
      throw std::length_error("capacity");
    auto old = std::move(buckets);
    buckets = std::vector<std::vector<Entry>>(old.size() * 2);
    for (auto &chain : old)
      for (auto &e : chain)
        buckets[bucket(e.first)].push_back(e);
  }
  void put(int key, int value) {
    for (auto &e : buckets[bucket(key)])
      if (e.first == key) {
        e.second = value;
        return;
      }
    if (count >= 32)
      throw std::length_error("entries");
    if ((count + 1) * 4 > static_cast<int>(buckets.size()) * 3)
      rehash();
    buckets[bucket(key)].push_back({key, value});
    ++count;
  }
  bool erase(int key) {
    auto &chain = buckets[bucket(key)];
    for (auto i = chain.begin(); i != chain.end(); ++i)
      if (i->first == key) {
        chain.erase(i);
        --count;
        return true;
      }
    return false;
  }
};
