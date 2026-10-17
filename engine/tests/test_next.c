#include "../src/engine.c"
#include <assert.h>
#include <stdio.h>
#include <stdlib.h>
static unsigned seed = 97;
static int random_value(void) {
  seed = 1664525u * seed + 1013904223u;
  return (int)(seed % 201) - 100;
}
static int ints(const void *a, const void *b) {
  int x = *(const int *)a, y = *(const int *)b;
  return (x > y) - (x < y);
}
static void begin(int module, int op, int n, int arg, int index,
                  const int *values) {
  assert(engine_config(module, op, n, arg, index, 0));
  for (int i = 0; i < n; i++)
    assert(engine_value(i, values[i]));
  assert(engine_start());
}
static void finish(void) {
  int steps = 0;
  while (engine_next())
    assert(++steps < HISTORY_LIMIT);
  assert(!engine_error()[0]);
  assert(e.done);
}
int main(void) {
  int cases = 0;
  for (int n = 0; n <= 32; n++)
    for (int trial = 0; trial < 8; trial++)
      for (int op = 0; op <= 8; op++) {
        if ((!n && (op == 3 || op == 4 || op == 6 || op == 7)) ||
            (n == 32 && (op == 2 || op == 5)))
          continue;
        int values[33], sorted[33];
        for (int i = 0; i < n; i++)
          values[i] = sorted[i] = random_value();
        qsort(sorted, n, sizeof(int), ints);
        begin(HEAP, op, n, -103, 0, values);
        finish();
        if (op == 8) {
          for (int i = 0; i < n; i++)
            assert(e.data[i] == sorted[i]);
        } else {
          int maximum = op == 1 || op == 5 || op == 6 || op == 7;
          for (int i = 1; i < e.n; i++)
            assert(maximum ? e.data[(i - 1) / 2] >= e.data[i]
                           : e.data[(i - 1) / 2] <= e.data[i]);
          if (op == 2 || op == 5)
            assert(e.n == n + 1);
          if (op == 3 || op == 6) {
            assert(e.n == n - 1);
            assert(e.next.result == (maximum ? sorted[n - 1] : sorted[0]));
          }
          if (op == 4 || op == 7)
            assert(e.next.result == (maximum ? sorted[n - 1] : sorted[0]));
        }
        cases++;
        engine_free();
        assert(!e.next.depth && !e.n);
      }

  for (int n = 0; n <= 32; n++)
    for (int trial = 0; trial < 12; trial++) {
      int a[32], b[32];
      for (int i = 0; i < n; i++)
        a[i] = b[i] = random_value();
      qsort(b, n, sizeof(int), ints);
      begin(TWO_POINTERS, 1, n, 0, 0, a);
      finish();
      for (int i = 0; i < n; i++)
        assert(e.data[i] == a[n - i - 1]);
      cases++;
      begin(TWO_POINTERS, 2, n, 0, 0, b);
      finish();
      int u = 0;
      for (int i = 0; i < n; i++)
        if (!i || b[i] != b[i - 1])
          assert(e.data[u++] == b[i]);
      assert(e.next.logical == u);
      cases++;
      int target = random_value(), yes = 0;
      for (int i = 0; i < n; i++)
        for (int j = i + 1; j < n; j++)
          if ((long long)b[i] + b[j] == target)
            yes = 1;
      begin(TWO_POINTERS, 0, n, target, 0, b);
      finish();
      assert((e.found >= 0) == yes);
      if (yes)
        assert(e.next.sum == target);
      cases++;
      for (int k = 1; k <= n; k++) {
        long long best = LLONG_MIN;
        for (int i = 0; i + k <= n; i++) {
          long long sum = 0;
          for (int j = i; j < i + k; j++)
            sum += a[j];
          if (sum > best)
            best = sum;
        }
        begin(WINDOW, 0, n, 0, k, a);
        finish();
        assert(e.next.result == best);
        cases++;
      }
      for (int i = 0; i < n; i++)
        b[i] = abs(a[i]) % 10;
      int goal = 1 + abs(target) % 50, best = 0;
      for (int i = 0; i < n; i++) {
        int sum = 0;
        for (int j = i; j < n; j++) {
          sum += b[j];
          if (sum >= goal && (!best || j - i + 1 < best))
            best = j - i + 1;
        }
      }
      begin(WINDOW, 1, n, goal, 0, b);
      finish();
      assert(e.next.result == best);
      assert((e.next.best < 0) == (best == 0));
      cases++;
      long long sum = 0;
      for (int i = 0; i < n; i++)
        sum += a[i];
      begin(RECURSION, 1, n, 0, 0, a);
      finish();
      assert(e.next.result == sum);
      assert(!e.next.depth);
      for (int i = 0; i < e.next.calls; i++)
        assert(e.next.tree[i].phase == 9);
      cases++;
      qsort(a, n, sizeof(int), ints);
      int expected = -1;
      for (int i = 0; i < n; i++)
        if (a[i] == target)
          expected = i;
      begin(RECURSION, 2, n, target, 0, a);
      finish();
      assert((e.found >= 0) == (expected >= 0));
      if (e.found >= 0)
        assert(a[e.found] == target);
      cases++;
    }
  long long fact = 1;
  for (int n = 0; n <= 12; n++) {
    if (n)
      fact *= n;
    begin(RECURSION, 0, 0, n, 0, NULL);
    finish();
    assert(e.next.result == fact);
    cases++;
  }
  int f0 = 0, f1 = 1;
  for (int n = 0; n <= 10; n++) {
    begin(RECURSION, 3, 0, n, 0, NULL);
    finish();
    assert(e.next.result == f0);
    int v = f0 + f1;
    f0 = f1;
    f1 = v;
    cases++;
  }
  for (int m = HASH_CHAIN; m <= HASH_PROBE; m++)
    for (int n = 0; n <= 16; n++)
      for (int trial = 0; trial < 8; trial++) {
        int pairs[32], keys[16], values[16], unique = 0;
        for (int i = 0; i < n; i++) {
          int key = (random_value() % 8) * 8;
          int val = random_value();
          pairs[2 * i] = key;
          pairs[2 * i + 1] = val;
          int j = 0;
          while (j < unique && keys[j] != key)
            j++;
          if (j == unique)
            keys[unique++] = key;
          values[j] = val;
        }
        for (int op = 0; op <= 6; op++) {
          int key = unique ? keys[trial % unique] : -8,
              val = unique ? keys[(trial + 1) % unique] : 16;
          begin(m, op, n * 2, key, val, pairs);
          finish();
          int expected = unique - (op == 3 || op == 5 ? !!unique : 0) +
                         ((op == 2 || op == 6) && !unique ? 1 : 0);
          assert(e.next.size == expected);
          if (op == 1 && unique) {
            assert(e.found > 0);
            assert(e.next.result == values[trial % unique]);
          }
          if (op == 2) {
            int id = e.found;
            assert(id > 0);
            assert(e.next.values[id] == val);
          }
          if (op == 5) {
            int found = unique && val != key;
            assert((e.found > 0) == found);
          }
          int count = 0;
          for (int i = 1; i <= e.next.entries; i++)
            count += !!e.next.alive[i];
          assert(count == expected);
          for (int i = 0; i < e.next.capacity; i++)
            if (m == HASH_CHAIN) {
              int hops = 0;
              for (int id = e.next.buckets[i]; id; id = e.next.links[id]) {
                assert(e.next.alive[id]);
                assert(hash_index(e.next.keys[id], e.next.capacity) == i);
                assert(++hops <= 32);
              }
            }
          cases++;
        }
      }
  int invalid[3] = {3, 1, -1};
  assert(engine_config(HASH_CHAIN, 0, 3, 0, 0, 0));
  for (int i = 0; i < 3; i++)
    assert(engine_value(i, invalid[i]));
  assert(!engine_start());
  assert(engine_config(RECURSION, 0, 0, 13, 0, 0));
  assert(!engine_start());
  assert(engine_config(RECURSION, 3, 0, 11, 0, 0));
  assert(!engine_start());
  assert(engine_config(WINDOW, 0, 0, 0, 1, 0));
  assert(!engine_start());
  assert(engine_config(WINDOW, 1, 1, 1, 0, 0));
  assert(engine_value(0, -1));
  assert(!engine_start());
  assert(engine_config(TWO_POINTERS, 0, 3, 0, 0, 0));
  for (int i = 0; i < 3; i++)
    assert(engine_value(i, invalid[i]));
  assert(!engine_start());
  engine_free();
  assert(!e.next.calls && !e.next.size);
  printf("Next C: %d oracle/structure/recursion cases passed\n", cases);
}
