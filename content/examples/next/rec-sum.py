def prefix_sum(a, n):
    if not 0 <= n <= min(32, len(a)):
        raise ValueError("n")
    return 0 if n == 0 else prefix_sum(a, n - 1) + a[n - 1]
