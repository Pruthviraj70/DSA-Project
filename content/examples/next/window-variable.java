public class Example {
  record Shortest(int length, int start) {}
  static Shortest minimumWindow(int[] a, int target) {
    if (a.length > 32 || target <= 0)
      throw new IllegalArgumentException("input");
    for (int v : a)
      if (v < 0 || v > 100000)
        throw new IllegalArgumentException("value");
    int left = 0, best = 0, start = -1;
    long sum = 0;
    for (int right = 0; right < a.length; ++right) {
      sum += a[right];
      while (sum >= target) {
        int length = right - left + 1;
        if (best == 0 || length < best) {
          best = length;
          start = left;
        }
        sum -= a[left++];
      }
    }
    return new Shortest(best, start);
  }
}
