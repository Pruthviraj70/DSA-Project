public class Example {
  record Pair(int left, int right) {}
  static Pair pairSum(int[] a, int target) {
    int l = 0, r = a.length - 1;
    while (l < r) {
      long sum = (long)a[l] + a[r];
      if (sum == target)
        return new Pair(l, r);
      if (sum < target)
        ++l;
      else
        --r;
    }
    return new Pair(-1, -1);
  }
}
