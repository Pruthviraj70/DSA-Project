public class Example {
  static void reverseValues(int[] a) {
    int l = 0, r = a.length - 1;
    while (l < r) {
      int t = a[l];
      a[l++] = a[r];
      a[r--] = t;
    }
  }
}
