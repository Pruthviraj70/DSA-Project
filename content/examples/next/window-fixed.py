def fixed_window(a, k):
    if not 1 <= k <= len(a) <= 32:
        raise ValueError("k")
    total = 0
    for i in range(k):
        total += a[i]
    best, start = total, 0
    for right in range(k, len(a)):
        total += a[right] - a[right - k]
        if total > best:
            best, start = total, right - k + 1
    return best, start
