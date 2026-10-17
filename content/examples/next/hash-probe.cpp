#include <optional>
#include <stdexcept>
#include <vector>
class HashTable {
  struct Slot {
    int key = 0, value = 0, state = 0;
  };
  std::vector<Slot> slots = std::vector<Slot>(8);
  int count = 0;
  int bucket(int key) const {
    int c = static_cast<int>(slots.size());
    int r = key % c;
    return r < 0 ? r + c : r;
  }

public:
  int size() const { return count; }
  std::optional<int> get(int key) const {
    int b = bucket(key), c = static_cast<int>(slots.size());
    for (int p = 0; p < c; p++) {
      const auto &s = slots[(b + p) % c];
      if (!s.state)
        return std::nullopt;
      if (s.state == 1 && s.key == key)
        return s.value;
    }
    return std::nullopt;
  }
  void rehash() {
    if (slots.size() >= 64)
      throw std::length_error("capacity");
    auto old = slots;
    slots = std::vector<Slot>(old.size() * 2);
    count = 0;
    for (auto &s : old)
      if (s.state == 1)
        put(s.key, s.value);
  }
  void put(int key, int value) {
    int b = bucket(key), c = static_cast<int>(slots.size()), available = -1;
    for (int p = 0; p < c; p++) {
      int at = (b + p) % c;
      auto &s = slots[at];
      if (s.state == 1 && s.key == key) {
        s.value = value;
        return;
      }
      if (s.state != 1 && available < 0)
        available = at;
      if (!s.state)
        break;
    }
    if (count >= 32)
      throw std::length_error("entries");
    if ((count + 1) * 4 > c * 3) {
      rehash();
      put(key, value);
      return;
    }
    if (available < 0)
      throw std::length_error("full");
    slots[available] = {key, value, 1};
    ++count;
  }
  bool erase(int key) {
    int b = bucket(key), c = static_cast<int>(slots.size());
    for (int p = 0; p < c; p++) {
      auto &s = slots[(b + p) % c];
      if (!s.state)
        return false;
      if (s.state == 1 && s.key == key) {
        s.state = 2;
        --count;
        return true;
      }
    }
    return false;
  }
};
