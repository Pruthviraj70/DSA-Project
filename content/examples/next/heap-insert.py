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

def heap_insert(a, value, maximum=False):
    if len(a) >= 32:
        raise ValueError("capacity")
    a.append(value)
    i = len(a) - 1
    while i > 0:
        parent = (i - 1) // 2
        if not better(a[i], a[parent], maximum):
            break
        a[i], a[parent] = a[parent], a[i]
        i = parent
