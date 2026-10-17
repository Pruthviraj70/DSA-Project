#include <stdbool.h>
#include <stdlib.h>
typedef struct Entry {
  int key, value;
  struct Entry *next;
} Entry;
typedef struct {
  Entry **buckets;
  int capacity, size;
} HashTable;
int bucket(int key, int capacity) {
  int r = key % capacity;
  return r < 0 ? r + capacity : r;
}
bool map_init(HashTable *t) {
  t->capacity = 8;
  t->size = 0;
  t->buckets = calloc(8, sizeof(Entry *));
  return t->buckets != NULL;
}
bool map_get(const HashTable *t, int key, int *value) {
  for (Entry *e = t->buckets[bucket(key, t->capacity)]; e; e = e->next)
    if (e->key == key) {
      *value = e->value;
      return true;
    }
  return false;
}
bool map_rehash(HashTable *t) {
  if (t->capacity >= 64)
    return false;
  int capacity = 2 * t->capacity;
  Entry **buckets = calloc((size_t)capacity, sizeof(Entry *));
  if (!buckets)
    return false;
  for (int i = 0; i < t->capacity; i++) {
    Entry *e = t->buckets[i];
    while (e) {
      Entry *next = e->next;
      int b = bucket(e->key, capacity);
      e->next = buckets[b];
      buckets[b] = e;
      e = next;
    }
  }
  free(t->buckets);
  t->buckets = buckets;
  t->capacity = capacity;
  return true;
}
bool map_put(HashTable *t, int key, int value) {
  int b = bucket(key, t->capacity);
  for (Entry *e = t->buckets[b]; e; e = e->next)
    if (e->key == key) {
      e->value = value;
      return true;
    }
  if (t->size >= 32)
    return false;
  if ((t->size + 1) * 4 > t->capacity * 3) {
    if (!map_rehash(t))
      return false;
    b = bucket(key, t->capacity);
  }
  Entry *e = malloc(sizeof *e);
  if (!e)
    return false;
  *e = (Entry){key, value, t->buckets[b]};
  t->buckets[b] = e;
  t->size++;
  return true;
}
bool map_delete(HashTable *t, int key) {
  Entry **link = &t->buckets[bucket(key, t->capacity)];
  while (*link) {
    Entry *e = *link;
    if (e->key == key) {
      *link = e->next;
      free(e);
      t->size--;
      return true;
    }
    link = &e->next;
  }
  return false;
}
void map_free(HashTable *t) {
  for (int i = 0; i < t->capacity; i++) {
    Entry *e = t->buckets[i];
    while (e) {
      Entry *next = e->next;
      free(e);
      e = next;
    }
  }
  free(t->buckets);
  *t = (HashTable){0};
}
/* Setup: HashTable t={0}; if(map_init(&t)) { ... map_free(&t); } */
