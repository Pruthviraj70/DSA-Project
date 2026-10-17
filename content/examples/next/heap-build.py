def better(a, b, maximum):
    return a > b if maximum else a < b

def sift_down(a, n, root, maximum):
    while 2 * root + 1 < n:
        child = 2 * root + 1
        if child + 1 < n and better(a[child + 1], a[child], maximum):
            child += 1
        if not better(a[child], a[root], maximum):
            break
        a[root], a[child] = a[child], a[root]
        root = child

def heap_build(a, maximum=False):
    for i in range(len(a) // 2 - 1, -1, -1):
        sift_down(a, len(a), i, maximum)
