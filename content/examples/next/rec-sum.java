public class Example {
  static long prefixSum(int[] a, int n) {
    if (n < 0 || n > 32 || n > a.length)
      throw new IllegalArgumentException("n");
    return n == 0 ? 0 : prefixSum(a, n - 1) + a[n - 1];
  }
}
