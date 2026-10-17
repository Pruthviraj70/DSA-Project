public class Example {
  record Window(long sum, int start) {}
  static Window fixedWindow(int[] a, int k) {
    if (k < 1 || k > a.length || a.length > 32)
      throw new IllegalArgumentException("k");
    long sum = 0;
    for (int i = 0; i < k; ++i)
      sum += a[i];
    Window best = new Window(sum, 0);
    for (int r = k; r < a.length; ++r) {
      sum += (long)a[r] - a[r - k];
      if (sum > best.sum())
        best = new Window(sum, r - k + 1);
    }
    return best;
  }
}
