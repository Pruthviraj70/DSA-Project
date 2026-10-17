public class Example {
  static long factorial(int n) {
    if (n < 0 || n > 12)
      throw new IllegalArgumentException("n");
    if (n <= 1)
      return 1;
    return n * factorial(n - 1);
  }
}
