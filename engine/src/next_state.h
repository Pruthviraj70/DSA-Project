/* Private resumable state; never serialize raw addresses. */
typedef struct {
  int id, parent, argument, lo, hi, phase;
  long long result, saved;
} CallFrame;
typedef struct {
  int phase, cursor, left, right, best, logical, extent, build, heap_pos, child,
      maximum;
  long long sum, result;
  int capacity, size, entries, buckets[64], slots[64], states[64];
  int keys[32], values[32], links[32], alive[32];
  int key, val, bucket, probe, previous, first_deleted, action, source, rehash,
      moving, old_capacity;
  int old_slots[64], old_states[64], old_buckets[64];
  int depth, calls, rec_started;
  CallFrame frames[34], tree[512];
} NextState;
