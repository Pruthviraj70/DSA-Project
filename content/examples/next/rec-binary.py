def recursive_search(a, lo, hi, target):
    if lo > hi:
        return -1
    mid = lo + (hi - lo) // 2
    if a[mid] == target:
        return mid
    if a[mid] < target:
        return recursive_search(a, mid + 1, hi, target)
    return recursive_search(a, lo, mid - 1, target)
