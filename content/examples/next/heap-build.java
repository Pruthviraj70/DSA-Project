public class Example {

  static boolean better(int a, int b, boolean maximum) {
    return maximum ? a > b : a < b;
  }
  static void siftDown(int[] a, int n, int root, boolean maximum) {
    while (2 * root + 1 < n) {
      int child = 2 * root + 1;
      if (child + 1 < n && better(a[child + 1], a[child], maximum))
        ++child;
      if (!better(a[child], a[root], maximum))
        break;
      int tmp = a[root];
      a[root] = a[child];
      a[child] = tmp;
      root = child;
    }
  }
  static void heapBuild(int[] a, int n, boolean maximum) {
    if (n < 0 || n > a.length)
      throw new IllegalArgumentException("length");
    for (int i = n / 2 - 1; i >= 0; --i)
      siftDown(a, n, i, maximum);
  }
}
