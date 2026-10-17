#include <stdbool.h>
typedef struct {
  int key, value, state;
} Slot; /* 0=never used, 1=live, 2=tombstone */
typedef struct {
  Slot slots[64];
  int capacity, size;
} HashTable;
void map_init(HashTable *t) { *t = (HashTable){.capacity = 8}; }
int bucket(int key, int c) {
  int r = key % c;
  return r < 0 ? r + c : r;
}
bool map_get(const HashTable *t, int key, int *value) {
  int b = bucket(key, t->capacity);
  for (int p = 0; p < t->capacity; p++) {
    Slot s = t->slots[(b + p) % t->capacity];
    if (!s.state)
      return false;
    if (s.state == 1 && s.key == key) {
      *value = s.value;
      return true;
    }
  }
  return false;
}
bool map_rehash(HashTable *t) {
  if (t->capacity >= 64)
    return false;
  HashTable old = *t;
  *t = (HashTable){.capacity = old.capacity * 2, .size = old.size};
  for (int i = 0; i < old.capacity; i++)
    if (old.slots[i].state == 1) {
      Slot s = old.slots[i];
      int b = bucket(s.key, t->capacity);
      for (int p = 0; p < t->capacity; p++) {
        int at = (b + p) % t->capacity;
        if (!t->slots[at].state) {
          t->slots[at] = s;
          break;
        }
      }
    }
  return true;
}
bool map_put(HashTable *t, int key, int value) {
  int b = bucket(key, t->capacity), available = -1;
  for (int p = 0; p < t->capacity; p++) {
    int at = (b + p) % t->capacity;
    Slot *s = &t->slots[at];
    if (s->state == 1 && s->key == key) {
      s->value = value;
      return true;
    }
    if (s->state != 1 && available < 0)
      available = at;
    if (s->state == 0)
      break;
  }
  if (t->size >= 32)
    return false;
  if ((t->size + 1) * 4 > t->capacity * 3) {
    if (!map_rehash(t))
      return false;
    return map_put(t, key, value);
  }
  if (available < 0)
    return false;
  t->slots[available] = (Slot){key, value, 1};
  t->size++;
  return true;
}
bool map_delete(HashTable *t, int key) {
  int b = bucket(key, t->capacity);
  for (int p = 0; p < t->capacity; p++) {
    Slot *s = &t->slots[(b + p) % t->capacity];
    if (!s->state)
      return false;
    if (s->state == 1 && s->key == key) {
      s->state = 2;
      t->size--;
      return true;
    }
  }
  return false;
}
/* Setup: HashTable t; map_init(&t); fixed storage needs no allocation/cleanup.
 */
