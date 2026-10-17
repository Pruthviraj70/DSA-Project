public class Example {
  static int uniquePrefix(int[] a) {
    if (a.length == 0)
      return 0;
    int write = 1;
    for (int read = 1; read < a.length; ++read)
      if (a[read] != a[write - 1])
        a[write++] = a[read];
    return write;
  }
}
