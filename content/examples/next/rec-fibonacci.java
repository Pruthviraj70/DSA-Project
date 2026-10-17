public class Example {
  static long fibonacci(int n) {
    if (n < 0 || n > 10)
      throw new IllegalArgumentException("n");
    if (n <= 1)
      return n;
    long first = fibonacci(n - 1);
    long second = fibonacci(n - 2);
    return first + second;
  }
}
