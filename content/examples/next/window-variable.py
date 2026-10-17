def minimum_window(a, target):
    if len(a) > 32 or target <= 0 or any(v < 0 or v > 100000 for v in a):
        raise ValueError("nonnegative values and positive target required")
    left, total, best, start = 0, 0, 0, -1
    for right, value in enumerate(a):
        total += value
        while total >= target:
            length = right - left + 1
            if best == 0 or length < best:
                best, start = length, left
            total -= a[left]
            left += 1
    return best, start
