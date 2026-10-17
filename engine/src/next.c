/* Included inside engine.c: same C17 state machines in native and Wasm builds.
 */
static void next_snapshot(void) {
  NextState *x = &e.next;
  append(",\"extended\":{\"left\":%d,\"right\":%d,\"logical\":%d,\"extent\":%d,"
         "\"sum\":%lld,\"result\":%lld,\"best\":%d,\"capacity\":%d,\"size\":%d,"
         "\"bucket\":%d,\"probe\":%d,\"rehashing\":%s,\"slots\":[",
         x->left, x->right, x->logical, x->extent, x->sum, x->result, x->best,
         x->capacity, x->size, x->bucket, x->probe,
         x->rehash ? "true" : "false");
  for (int i = 0; i < x->capacity; i++)
    append("%s{\"id\":%d,\"state\":%d,\"entry\":%d}", i ? "," : "", i,
           x->states[i], e.module == HASH_CHAIN ? x->buckets[i] : x->slots[i]);
  append("],\"entries\":[");
  int comma = 0;
  for (int i = 1; i <= x->entries; i++)
    if (x->alive[i])
      append("%s{\"id\":%d,\"key\":%d,\"value\":%d,\"next\":%d}",
             comma++ ? "," : "", i, x->keys[i], x->values[i], x->links[i]);
  append("],\"frames\":[");
  for (int i = 0; i < x->depth; i++) {
    CallFrame *f = &x->frames[i];
    append("%s{\"id\":%d,\"parent\":%d,\"argument\":%d,\"lo\":%d,\"hi\":%d,"
           "\"phase\":%d,\"saved\":%lld}",
           i ? "," : "", f->id, f->parent, f->argument, f->lo, f->hi, f->phase,
           f->saved);
  }
  append("],\"calls\":[");
  for (int i = 0; i < x->calls; i++) {
    CallFrame *f = &x->tree[i];
    append("%s{\"id\":%d,\"parent\":%d,\"argument\":%d,\"returned\":%s,"
           "\"result\":%lld}",
           i ? "," : "", f->id, f->parent, f->argument,
           f->phase == 9 ? "true" : "false", f->result);
  }
  append("],\"operation\":%d,\"oldCapacity\":%d,\"oldEntries\":[", e.op,x->old_capacity);
  comma = 0;
  for (int i = 1; i <= x->entries; i++)
    if (x->old_slots[i])
      append("%s{\"entry\":%d,\"bucket\":%d}", comma++ ? "," : "", i,
             x->old_slots[i] - 1);
  append("]}");
}
static int next_start(void) {
  NextState *x = &e.next;
  x->logical = e.n;
  x->right = e.n - 1;
  x->best = -1;
  if (e.module == HEAP) {
    if (e.op < 0 || e.op > 8)
      return fail("Choose a heap operation");
    if ((e.op == 2 || e.op == 5) && e.n == LIMIT)
      return fail("Heap capacity is 32 values");
    if ((e.op == 3 || e.op == 4 || e.op == 6 || e.op == 7) && !e.n)
      return fail("Cannot extract or peek at an empty heap");
    x->maximum = e.op == 1 || e.op == 5 || e.op == 6 || e.op == 7 || e.op == 8;
    x->extent = e.n;
    x->build = e.n / 2 - 1;
    x->heap_pos = -1;
  } else if (e.module == HASH_CHAIN || e.module == HASH_PROBE) {
    if (e.n % 2 || e.op < 0 || e.op > 5 || e.index < -100000 ||
        e.index > 100000)
      return fail("Use key,value pairs and a valid table operation");
    x->capacity = 8;
    x->phase = 0;
  } else if (e.module == RECURSION) {
    if (e.op < 0 || e.op > 3)
      return fail("Choose a recursive example");
    if ((e.op == 0 && (e.arg < 0 || e.arg > 12)) ||
        (e.op == 3 && (e.arg < 0 || e.arg > 10)))
      return fail("Factorial accepts 0..12; Fibonacci accepts 0..10");
    if (e.op == 2)
      for (int i = 1; i < e.n; i++)
        if (e.data[i] < e.data[i - 1])
          return fail(
              "Recursive binary search requires sorted ascending input");
  } else if (e.module == TWO_POINTERS) {
    if (e.op < 0 || e.op > 2)
      return fail("Choose a two-pointer operation");
    if (e.op != 1)
      for (int i = 1; i < e.n; i++)
        if (e.data[i] < e.data[i - 1])
          return fail("This operation requires sorted ascending input");
    x->left = 0;
    x->right = e.op == 2 ? 1 : e.n - 1;
    x->logical = e.op == 2 ? (e.n ? 1 : 0) : e.n;
  } else if (e.module == WINDOW) {
    if (e.op < 0 || e.op > 1)
      return fail("Choose a window operation");
    if (e.op == 0 && (e.index < 1 || e.index > e.n))
      return fail("Window size k must be between 1 and input length; empty "
                  "input has no fixed window");
    if (e.op == 1) {
      if (e.arg <= 0)
        return fail("Variable window target must be positive");
      for (int i = 0; i < e.n; i++)
        if (e.data[i] < 0)
          return fail("Variable windows require nonnegative values");
    }
    x->left = x->right = 0;
    x->result = 0;
  } else
    return fail("Unknown module");
  return 1;
}
static int heap_better(int a, int b) {
  return e.next.maximum ? e.data[a] > e.data[b] : e.data[a] < e.data[b];
}
static const char *heap_step(void) {
  NextState *x = &e.next;
  for (;;) {
    /* Sift-down emits each child comparison separately before any swap. */
    if (x->phase == 0) {
      if (x->heap_pos < 0) {
        if (x->build < 0) {
          x->phase = 4;
          continue;
        }
        x->heap_pos = x->build--;
        x->child = 2 * x->heap_pos + 1;
      }
      if (x->child >= x->extent) {
        x->heap_pos = -1;
        continue;
      }
      x->phase = 1;
      if (x->child + 1 < x->extent) {
        int a = x->child, b = a + 1;
        if (heap_better(b, a))
          x->child = b;
        return emit("compare", "heap.children", a, b,
                    e.data[x->child]); /* @loc:heap.children */
      }
    }
    if (x->phase == 1) {
      x->phase = heap_better(x->child, x->heap_pos) ? 2 : 3;
      return emit("compare", "heap.order", x->heap_pos, x->child,
                  0); /* @loc:heap.order */
    }
    if (x->phase == 2) {
      int a = x->heap_pos, b = x->child;
      swap_at(a, b);
      x->heap_pos = b;
      x->child = 2 * b + 1;
      x->phase = 0;
      return emit("swap", "heap.down", a, b, e.data[b]); /* @loc:heap.down */
    }
    if (x->phase == 3) {
      x->heap_pos = -1;
      x->phase = 0;
      continue;
    }
    if (x->phase == 4) {
      if (e.op == -1 || e.op == 0 || e.op == 1)
        return complete();
      if (e.op == 4 || e.op == 7) {
        x->result = e.data[0];
        e.found = 0;
        return complete();
      }
      if (e.op == 2 || e.op == 5) {
        x->heap_pos = e.n;
        e.data[e.n++] = e.arg;
        x->extent = e.n;
        x->phase = 5;
        return emit("insert", "heap.insert", x->heap_pos, -1,
                    e.arg); /* @loc:heap.insert */
      }
      if (e.op == 8) {
        if (x->extent <= 1)
          return complete();
        int b = --x->extent;
        swap_at(0, b);
        x->phase = 0;
        x->build = 0;
        x->heap_pos = -1;
        return emit("swap", "heap.sort-root", 0, b,
                    e.data[b]); /* @loc:heap.sort-root */
      }
      x->result = e.data[0];
      e.data[0] = e.data[e.n - 1];
      e.n--;
      x->extent = e.n;
      x->phase = 0;
      x->build = 0;
      x->heap_pos = -1;
      e.op = -1;
      return emit("delete", "heap.extract", 0, -1,
                  (int)x->result); /* @loc:heap.extract */
    }
    if (x->phase == 5) {
      if (!x->heap_pos)
        return complete();
      int p = (x->heap_pos - 1) / 2;
      x->phase = heap_better(x->heap_pos, p) ? 6 : 7;
      return emit("compare", "heap.up-order", x->heap_pos, p,
                  0); /* @loc:heap.up-order */
    }
    if (x->phase == 6) {
      int a = x->heap_pos, b = (a - 1) / 2;
      swap_at(a, b);
      x->heap_pos = b;
      x->phase = 5;
      return emit("swap", "heap.up", a, b, e.data[b]);
    } /* @loc:heap.up */
    if (x->phase == 7)
      return complete();
  }
}

static int hash_index(int key, int capacity) {
  int r = key % capacity;
  return r < 0 ? r + capacity : r;
}
static const char *hash_grow(void) {
  NextState *x = &e.next;
  if (x->capacity >= 64) {
    fail("Table capacity limit reached");
    return NULL;
  }
  x->old_capacity = x->capacity;
  memset(x->old_slots, 0, sizeof x->old_slots);
  if (e.module == HASH_CHAIN) {
    for (int i = 1; i <= x->entries; i++)
      if (x->alive[i])
        x->old_slots[i] = hash_index(x->keys[i], x->capacity) + 1;
  } else
    for (int i = 0; i < x->capacity; i++)
      if (x->states[i] == 1)
        x->old_slots[x->slots[i]] = i + 1;
  x->capacity *= 2;
  memset(x->buckets, 0, sizeof x->buckets);
  memset(x->slots, 0, sizeof x->slots);
  memset(x->states, 0, sizeof x->states);
  x->rehash = 1;
  x->moving = 1;
  x->phase = 10;
  return emit("rehash", "hash.resize", x->old_capacity, x->capacity,
              0); /* @loc:hash.resize */
}
static const char *hash_insert_at(int slot) {
  NextState *x = &e.next;
  if ((x->size + 1) * 4 > x->capacity * 3)
    return hash_grow();
  if (x->entries >= 31) {
    fail("Table entry limit reached");
    return NULL;
  }
  int id = ++x->entries;
  x->keys[id] = x->key;
  x->values[id] = x->val;
  x->alive[id] = 1;
  x->size++;
  if (e.module == HASH_CHAIN) {
    x->links[id] = x->buckets[x->bucket];
    x->buckets[x->bucket] = id;
    x->states[x->bucket] = 1;
  } else {
    x->slots[slot] = id;
    x->states[slot] = 1;
  }
  x->phase = 0;
  e.found = id;
  x->result = x->val;
  return emit("insert", "hash.insert", x->bucket, id,
              x->val); /* @loc:hash.insert */
}
static const char *hash_step(void) {
  NextState *x = &e.next;
  for (;;) {
    if (x->phase == 10) {
      while (x->moving <= x->entries && !x->alive[x->moving])
        x->moving++;
      if (x->moving > x->entries) {
        x->rehash = 0;
        x->phase = x->action == 4 ? 0 : 1;
        continue;
      }
      x->bucket = hash_index(x->keys[x->moving], x->capacity);
      x->probe = 0;
      x->phase = 11;
      return emit("hash", "hash.rehash-index", x->bucket, x->moving,
                  x->keys[x->moving]); /* @loc:hash.rehash-index */
    }
    if (x->phase == 11) {
      int id = x->moving, slot = (x->bucket + x->probe) % x->capacity;
      if (e.module == HASH_CHAIN) {
        x->links[id] = x->buckets[x->bucket];
        x->buckets[x->bucket] = id;
        x->states[x->bucket] = 1;
      } else if (x->states[slot] == 1) {
        x->probe++;
        return emit("probe", "hash.rehash-probe", slot, id, 0);
      } /* @loc:hash.rehash-probe */
      else {
        x->slots[slot] = id;
        x->states[slot] = 1;
      }
      x->moving++;
      x->phase = 10;
      return emit("write", "hash.rehash-move", x->bucket, id,
                  x->keys[id]); /* @loc:hash.rehash-move */
    }
    if (x->phase == 0) {
      if (x->cursor < e.n) {
        x->key = e.data[x->cursor++];
        x->val = e.data[x->cursor++];
        x->action = 2;
      } else if (!x->source) {
        x->source = 1;
        x->action = e.op;
        x->key = e.arg;
        x->val = e.index;
        if (e.op == 0)
          return complete();
        if (e.op == 4)
          return hash_grow();
        if (e.op == 5)
          x->action = 3;
      } else if (e.op == 5 && x->source == 1) {
        x->source = 2;
        x->action = 1;
        x->key = e.index;
      } else
        return complete();
      e.found = -1;
      x->result = 0;
      x->phase = 1;
    }
    if (x->phase == 1) {
      x->bucket = hash_index(x->key, x->capacity);
      x->probe = e.module == HASH_CHAIN ? x->buckets[x->bucket] : 0;
      x->previous = 0;
      x->first_deleted = -1;
      x->phase = 2;
      return emit("hash", "hash.bucket", x->bucket, -1,
                  x->key); /* @loc:hash.bucket */
    }
    if (x->phase == 2) {
      int slot = (x->bucket + x->probe) % x->capacity;
      int id =
          e.module == HASH_CHAIN
              ? x->probe
              : (x->probe < x->capacity && x->states[slot] == 1 ? x->slots[slot]
                                                                : 0);
      if (e.module == HASH_PROBE && x->probe < x->capacity &&
          x->states[slot] == 2) {
        if (x->first_deleted < 0)
          x->first_deleted = slot;
        x->probe++;
        return emit("probe", "hash.tombstone", slot, -1, 0);
      } /* @loc:hash.tombstone */
      if (!id) {
        if (x->action == 2)
          return hash_insert_at(x->first_deleted >= 0 ? x->first_deleted
                                                      : slot);
        x->phase = 0;
        e.found = -1;
        return emit("read", "hash.missing", x->bucket, -1,
                    0); /* @loc:hash.missing */
      }
      x->moving = id;
      x->phase = 3;
      return emit("compare", "hash.compare",
                  e.module == HASH_CHAIN ? x->bucket : slot, id,
                  x->key); /* @loc:hash.compare */
    }
    if (x->phase == 3) {
      int id = x->moving;
      if (x->keys[id] == x->key) {
        x->phase = 0;
        e.found = id;
        x->result = x->values[id];
        if (x->action == 2) {
          x->values[id] = x->val;
          x->result = x->val;
          return emit("write", "hash.update", x->bucket, id, x->val);
        } /* @loc:hash.update */
        if (x->action == 3) {
          x->alive[id] = 0;
          x->size--;
          if (e.module == HASH_CHAIN) {
            if (x->previous)
              x->links[x->previous] = x->links[id];
            else
              x->buckets[x->bucket] = x->links[id];
            x->states[x->bucket] = x->buckets[x->bucket] ? 1 : 0;
          } else
            x->states[(x->bucket + x->probe) % x->capacity] = 2;
          return emit("delete", "hash.delete", x->bucket, id,
                      (int)x->result); /* @loc:hash.delete */
        }
        return emit("read", "hash.found", x->bucket, id,
                    (int)x->result); /* @loc:hash.found */
      }
      x->previous = id;
      x->probe = e.module == HASH_CHAIN ? x->links[id] : x->probe + 1;
      x->phase = 2;
    }
  }
}
static const char *frame_push(int argument, int lo, int hi) {
  NextState *x = &e.next;
  if (x->depth >= 34 || x->calls >= 512) {
    fail("Recursion limit reached");
    return NULL;
  }
  CallFrame f = {0};
  f.id = ++x->calls;
  f.parent = x->depth ? x->frames[x->depth - 1].id : 0;
  f.argument = argument;
  f.lo = lo;
  f.hi = hi;
  x->frames[x->depth++] = f;
  x->tree[f.id - 1] = f;
  return emit("call", "recursion.call", f.id, f.parent,
              argument); /* @loc:recursion.call */
}
static const char *frame_return(long long result) {
  NextState *x = &e.next;
  CallFrame *f = &x->frames[--x->depth];
  x->result = result;
  x->tree[f->id - 1].phase = 9;
  x->tree[f->id - 1].result = result;
  return emit("return", "recursion.return", f->id, f->parent,
              (int)result); /* @loc:recursion.return */
}
static const char *recursion_step(void) {
  NextState *x = &e.next;
  if (!x->rec_started) {
    x->rec_started = 1;
    return frame_push(e.op == 1 ? e.n : e.arg, 0, e.n - 1);
  }
  if (!x->depth) {
    e.found = e.op == 2 ? (int)x->result : -1;
    return complete();
  }
  CallFrame *f = &x->frames[x->depth - 1];
  if (e.op == 0) {
    if (f->argument <= 1)
      return frame_return(1);
    if (!f->phase) {
      f->phase = 1;
      return frame_push(f->argument - 1, 0, 0);
    }
    return frame_return(f->argument * x->result);
  }
  if (e.op == 1) {
    if (!f->argument)
      return frame_return(0);
    if (!f->phase) {
      f->phase = 1;
      return frame_push(f->argument - 1, 0, 0);
    }
    return frame_return(x->result + e.data[f->argument - 1]);
  }
  if (e.op == 2) {
    if (f->lo > f->hi)
      return frame_return(-1);
    int mid = f->lo + (f->hi - f->lo) / 2;
    if (!f->phase) {
      f->phase = 1;
      return emit("compare", "recursion.search", mid, -1, e.arg);
    } /* @loc:recursion.search */
    if (f->phase == 1) {
      if (e.data[mid] == e.arg)
        return frame_return(mid);
      f->phase = 2;
      return frame_push(e.arg, e.data[mid] < e.arg ? mid + 1 : f->lo,
                        e.data[mid] < e.arg ? f->hi : mid - 1);
    }
    return frame_return(x->result);
  }
  if (f->argument <= 1)
    return frame_return(f->argument);
  if (!f->phase) {
    f->phase = 1;
    return frame_push(f->argument - 1, 0, 0);
  }
  if (f->phase == 1) {
    f->saved = x->result;
    f->phase = 2;
    return frame_push(f->argument - 2, 0, 0);
  }
  return frame_return(f->saved + x->result);
}
static const char *pointers_step(void) {
  NextState *x = &e.next;
  if (e.op == 0) {
    if (x->left >= x->right)
      return complete();
    if (!x->phase) {
      x->sum = (long long)e.data[x->left] + e.data[x->right];
      x->phase = 1;
      return emit("compare", "pointers.pair", x->left, x->right, 0);
    } /* @loc:pointers.pair */
    if (x->sum == e.arg) {
      e.found = x->left;
      x->best = x->right;
      return complete();
    }
    if (x->sum < e.arg)
      x->left++;
    else
      x->right--;
    x->phase = 0;
    return emit("pointer-update", "pointers.move", x->left, x->right,
                0); /* @loc:pointers.move */
  }
  if (e.op == 1) {
    if (x->left >= x->right)
      return complete();
    if (!x->phase) {
      swap_at(x->left, x->right);
      x->phase = 1;
      return emit("swap", "pointers.reverse", x->left, x->right, 0);
    } /* @loc:pointers.reverse */
    x->left++;
    x->right--;
    x->phase = 0;
    return emit("pointer-update", "pointers.reverse-move", x->left, x->right,
                0); /* @loc:pointers.reverse-move */
  }
  if (x->right >= e.n) {
    x->logical = e.n ? x->logical : 0;
    return complete();
  }
  if (!x->phase) {
    x->phase = e.data[x->right] != e.data[x->logical - 1] ? 1 : 2;
    return emit("compare", "pointers.unique", x->right, x->logical - 1, 0);
  } /* @loc:pointers.unique */
  if (x->phase == 1) {
    int a = x->logical++;
    e.data[a] = e.data[x->right];
    x->phase = 2;
    return emit("write", "pointers.prefix", a, x->right, e.data[a]);
  } /* @loc:pointers.prefix */
  x->right++;
  x->left = x->logical;
  x->phase = 0;
  return emit("pointer-update", "pointers.scan", x->left, x->right,
              0); /* @loc:pointers.scan */
}
static const char *window_step(void) {
  NextState *x = &e.next;
  if (e.op == 0) {
    if (x->phase == 0) {
      if (x->right >= e.n)
        return complete();
      int i = x->right++;
      x->sum += e.data[i];
      x->phase = 1;
      return emit("window-expand", "window.fixed-enter", x->left, x->right - 1,
                  e.data[i]);
    } /* @loc:window.fixed-enter */
    if (x->phase == 1) {
      if (x->right - x->left > e.index) {
        int i = x->left++;
        x->sum -= e.data[i];
        return emit("window-shrink", "window.fixed-leave", i, x->right - 1,
                    e.data[i]); /* @loc:window.fixed-leave */
      }
      x->phase = 2;
    }
    if (x->right - x->left == e.index && (x->best < 0 || x->sum > x->result)) {
      x->result = x->sum;
      x->best = x->left;
      x->phase = 0;
      return emit("write", "window.fixed-best", x->left, x->right - 1, 0);
    } /* @loc:window.fixed-best */
    x->phase = 0;
    return emit("compare", "window.fixed-check", x->left, x->right - 1,
                0); /* @loc:window.fixed-check */
  }
  if (x->phase == 0) {
    if (x->right >= e.n)
      return complete();
    int i = x->right++;
    x->sum += e.data[i];
    x->phase = 1;
    return emit("window-expand", "window.variable-enter", x->left, x->right - 1,
                e.data[i]); /* @loc:window.variable-enter */
  }
  if (x->phase == 1) {
    if (x->sum < e.arg) {
      x->phase = 0;
      return emit("compare", "window.below-target", x->left, x->right - 1, 0);
    } /* @loc:window.below-target */
    int len = x->right - x->left;
    if (x->best < 0 || len < x->result) {
      x->best = x->left;
      x->result = len;
    }
    x->phase = 2;
    return emit("write", "window.variable-best", x->left, x->right - 1,
                0); /* @loc:window.variable-best */
  }
  int i = x->left++;
  x->sum -= e.data[i];
  x->phase = 1;
  return emit("window-shrink", "window.variable-leave", i, x->right - 1,
              e.data[i]); /* @loc:window.variable-leave */
}
static const char *next_step(void) {
  if (e.module == HEAP)
    return heap_step();
  if (e.module == HASH_CHAIN || e.module == HASH_PROBE)
    return hash_step();
  if (e.module == RECURSION)
    return recursion_step();
  if (e.module == TWO_POINTERS)
    return pointers_step();
  return window_step();
}
