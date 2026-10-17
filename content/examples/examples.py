# shared:list
class Node:
    def __init__(self, value, next_node=None):
        self.value = value
        self.next = next_node
# shared:tree
class Tree:
    def __init__(self, value):
        self.value = value
        self.left = None
        self.right = None
# shared:circular
class CircularQueue:
    def __init__(self):
        self.data = [0] * 32
        self.head = 0
        self.size = 0
# shared:graph
class Graph:
    def __init__(self, n, directed=False):
        if not 0 <= n <= 16:
            raise ValueError('Use 0..16 vertices')
        self.n = n
        self.directed = directed
        self.has = [[False] * 16 for _ in range(16)]
        self.weight = [[0] * 16 for _ in range(16)]
# example:countdown
def countdown(n):
    if n <= 0:
        return
    countdown(n - 1)
# example:array-create
def array_create(values):
    if len(values) > 32:
        raise ValueError('Use at most 32 values')
    result = []
    for value in values:
        result.append(value)
    return result
# example:array-access
def array_access(values, index):
    if not 0 <= index < len(values):
        raise IndexError('No element at this index')
    return values[index]
# example:array-update
def array_update(values, index, value):
    if not 0 <= index < len(values):
        raise IndexError('No element at this index')
    values[index] = value
# example:array-traverse
def array_traverse(values):
    for value in values:
        print(value, end=' ')
# example:array-insert
def array_insert(values, index, value, capacity=32):
    if not 0 <= index <= len(values) or len(values) >= capacity:
        raise IndexError('Invalid index or full sequence')
    values.append(value)
    for i in range(len(values) - 1, index, -1):
        values[i] = values[i - 1]
    values[index] = value
# example:array-insert-copy
def array_insert_copy(values, index, value):
    if not 0 <= index <= len(values):
        raise IndexError('Invalid insertion index')
    result = []
    for i in range(index):
        result.append(values[i])
    result.append(value)
    for i in range(index, len(values)):
        result.append(values[i])
    return result
# example:array-delete
def array_delete(values, index):
    if not 0 <= index < len(values):
        raise IndexError('No element to remove')
    removed = values[index]
    for i in range(index + 1, len(values)):
        values[i - 1] = values[i]
    values.pop()  # Remove the now-unused final slot.
    return removed
# example:linear-search
def linear_search(values, target):
    for i, value in enumerate(values):
        if value == target:
            return i
    return -1
# example:binary-search
def binary_search(values, target):
    lo, hi = 0, len(values) - 1
    while lo <= hi:
        mid = lo + (hi - lo) // 2
        if values[mid] == target:
            return mid
        if values[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1
# example:binary-search-recursive
def binary_search_recursive(values, target):
    def search(lo, hi):
        if lo > hi:
            return -1
        mid = lo + (hi - lo) // 2
        if values[mid] == target:
            return mid
        if values[mid] < target:
            return search(mid + 1, hi)
        return search(lo, mid - 1)
    return search(0, len(values) - 1)
# example:binary-first
def binary_first(values, target):
    lo, hi, found = 0, len(values) - 1, -1
    while lo <= hi:
        mid = lo + (hi - lo) // 2
        if values[mid] >= target:
            if values[mid] == target:
                found = mid
            hi = mid - 1
        else:
            lo = mid + 1
    return found
# example:insertion-sort
def insertion_sort(values):
    for i in range(1, len(values)):
        key, j = values[i], i - 1
        while j >= 0 and values[j] > key:
            values[j + 1] = values[j]
            j -= 1
        values[j + 1] = key
# example:merge-sort
def merge_sort(values):
    n, width = len(values), 1
    buffer = [0] * n
    while width < n:
        for start in range(0, n, 2 * width):
            mid, end = min(start + width, n), min(start + 2 * width, n)
            left, right, out = start, mid, start
            while left < mid or right < end:
                if right == end or (left < mid and values[left] <= values[right]):
                    buffer[out] = values[left]
                    left += 1
                else:
                    buffer[out] = values[right]
                    right += 1
                out += 1
            for i in range(start, end):
                values[i] = buffer[i]
        width *= 2
# example:merge-sort-recursive
def merge_sort_recursive(values):
    buffer = [0] * len(values)
    def merge_range(lo, hi):
        if hi - lo < 2:
            return
        mid = lo + (hi - lo) // 2
        merge_range(lo, mid)
        merge_range(mid, hi)
        left, right, out = lo, mid, lo
        while left < mid or right < hi:
            if right == hi or (left < mid and values[left] <= values[right]):
                buffer[out] = values[left]
                left += 1
            else:
                buffer[out] = values[right]
                right += 1
            out += 1
        for i in range(lo, hi):
            values[i] = buffer[i]
    merge_range(0, len(values))
# example:quick-sort
def quick_sort(values):
    def sort_range(lo, hi):
        if lo >= hi:
            return
        pivot, boundary = values[hi], lo
        for j in range(lo, hi):
            if values[j] <= pivot:
                values[boundary], values[j] = values[j], values[boundary]
                boundary += 1
        values[boundary], values[hi] = values[hi], values[boundary]
        sort_range(lo, boundary - 1)
        sort_range(boundary + 1, hi)
    sort_range(0, len(values) - 1)
# example:list-insert
def list_insert(head, index, value):
    if index < 0:
        raise IndexError('Invalid index')
    if index == 0:
        return Node(value, head)
    previous = head
    for _ in range(index - 1):
        if previous is None:
            raise IndexError('Invalid index')
        previous = previous.next
    if previous is None:
        raise IndexError('Invalid index')
    previous.next = Node(value, previous.next)
    return head
# example:list-delete
def list_delete(head, index):
    if index < 0 or head is None:
        raise IndexError('No node to remove')
    if index == 0:
        return head.next
    previous = head
    for _ in range(index - 1):
        if previous.next is None:
            raise IndexError('No node to remove')
        previous = previous.next
    if previous.next is None:
        raise IndexError('No node to remove')
    previous.next = previous.next.next
    return head
# example:list-search
def list_search(head, target):
    node = head
    while node is not None:
        if node.value == target:
            return node
        node = node.next
    return None
# example:list-traverse
def list_traverse(head):
    node = head
    while node is not None:
        print(node.value, end=' ')
        node = node.next
# example:stack-push
def stack_push(stack, value):
    if len(stack) >= 32:
        raise OverflowError('Stack is full')
    stack.append(value)
# example:stack-pop
def stack_pop(stack):
    if not stack:
        raise IndexError('Stack is empty')
    return stack.pop()
# example:stack-peek
def stack_peek(stack):
    if not stack:
        raise IndexError('Stack is empty')
    return stack[-1]
# example:queue-enqueue
def queue_enqueue(queue, value):
    if len(queue) >= 32:
        raise OverflowError('Queue is full')
    queue.append(value)
# example:queue-dequeue
def queue_dequeue(queue):
    if not queue:
        raise IndexError('Queue is empty')
    removed = queue[0]
    for i in range(1, len(queue)):
        queue[i - 1] = queue[i]
    queue.pop()
    return removed
# example:queue-inspect
def queue_inspect(queue):
    if not queue:
        raise IndexError('Queue is empty')
    return queue[0]
# example:circular-queue
def circular_enqueue(queue, value):
    if queue.size == len(queue.data):
        raise OverflowError('Queue is full')
    back = (queue.head + queue.size) % len(queue.data)
    queue.data[back] = value
    queue.size += 1

def circular_dequeue(queue):
    if queue.size == 0:
        raise IndexError('Queue is empty')
    value = queue.data[queue.head]
    queue.head = (queue.head + 1) % len(queue.data)
    queue.size -= 1
    return value
# example:bst-insert
def bst_insert(root, value):
    if root is None:
        return Tree(value)
    if value < root.value:
        root.left = bst_insert(root.left, value)
    elif value > root.value:
        root.right = bst_insert(root.right, value)
    return root
# example:bst-search
def bst_search(root, value):
    while root is not None and root.value != value:
        root = root.left if value < root.value else root.right
    return root
# example:bst-delete
def bst_delete(root, value):
    if root is None:
        return None
    if value < root.value:
        root.left = bst_delete(root.left, value)
    elif value > root.value:
        root.right = bst_delete(root.right, value)
    else:
        if root.left is None:
            return root.right
        if root.right is None:
            return root.left
        successor = root.right
        while successor.left is not None:
            successor = successor.left
        root.value = successor.value
        root.right = bst_delete(root.right, successor.value)
    return root
# example:bst-inorder
def bst_inorder(root):
    if root is None:
        return
    bst_inorder(root.left)
    print(root.value, end=' ')
    bst_inorder(root.right)
# example:bst-preorder
def bst_preorder(root):
    if root is None:
        return
    print(root.value, end=' ')
    bst_preorder(root.left)
    bst_preorder(root.right)
# example:bst-postorder
def bst_postorder(root):
    if root is None:
        return
    bst_postorder(root.left)
    bst_postorder(root.right)
    print(root.value, end=' ')
# example:graph-create
def graph_create(n, directed=False):
    return Graph(n, directed)

def graph_set_edge(graph, source, target, weight):
    if not (0 <= source < graph.n and 0 <= target < graph.n and -100000 <= weight <= 100000):
        raise ValueError('Invalid edge')
    graph.has[source][target], graph.weight[source][target] = True, weight
    if not graph.directed:
        graph.has[target][source], graph.weight[target][source] = True, weight

def graph_remove_edge(graph, source, target):
    if not (0 <= source < graph.n and 0 <= target < graph.n):
        raise ValueError('Invalid endpoint')
    graph.has[source][target] = False
    if not graph.directed:
        graph.has[target][source] = False

def graph_add_vertex(graph):
    if graph.n == 16:
        raise OverflowError('Graph is full')
    graph.n += 1
    return graph.n - 1

def graph_remove_vertex(graph, index):
    if not 0 <= index < graph.n:
        raise IndexError('Invalid vertex')
    keep = [i for i in range(graph.n) if i != index]
    old_has, old_weight = graph.has, graph.weight
    graph.has = [[False] * 16 for _ in range(16)]
    graph.weight = [[0] * 16 for _ in range(16)]
    for i, source in enumerate(keep):
        for j, target in enumerate(keep):
            graph.has[i][j] = old_has[source][target]
            graph.weight[i][j] = old_weight[source][target]
    graph.n -= 1
# example:bfs
def bfs(graph, source):
    if not 0 <= source < graph.n:
        raise IndexError('Invalid source')
    seen, queue, order = [False] * graph.n, [source], []
    seen[source] = True
    head = 0
    while head < len(queue):
        current = queue[head]
        head += 1
        order.append(current)
        for neighbor in range(graph.n):
            if graph.has[current][neighbor] and not seen[neighbor]:
                seen[neighbor] = True
                queue.append(neighbor)
    return order
# example:bfs-list
def bfs_list(neighbors, source):
    if not 0 <= source < len(neighbors):
        raise IndexError('Invalid source')
    seen, queue, order = {source}, [source], []
    head = 0
    while head < len(queue):
        current = queue[head]
        head += 1
        order.append(current)
        for neighbor in neighbors[current]:
            if neighbor not in seen:
                seen.add(neighbor)
                queue.append(neighbor)
    return order
# example:dfs
def dfs(graph, source):
    if not 0 <= source < graph.n:
        raise IndexError('Invalid source')
    seen, path, next_neighbor, order = [False] * graph.n, [source], [0] * graph.n, [source]
    seen[source] = True
    while path:
        current = path[-1]
        neighbor = next_neighbor[current]
        while neighbor < graph.n and (not graph.has[current][neighbor] or seen[neighbor]):
            neighbor += 1
        next_neighbor[current] = neighbor
        if neighbor == graph.n:
            path.pop()
        else:
            next_neighbor[current] += 1
            seen[neighbor] = True
            order.append(neighbor)
            path.append(neighbor)
    return order
# example:dijkstra
def dijkstra(graph, source):
    if not 0 <= source < graph.n:
        raise IndexError('Invalid source')
    if any(graph.has[i][j] and graph.weight[i][j] < 0 for i in range(graph.n) for j in range(graph.n)):
        raise ValueError('Negative weights are not allowed')
    distance, settled = [float('inf')] * graph.n, [False] * graph.n
    distance[source] = 0
    for _ in range(graph.n):
        current = -1
        for i in range(graph.n):
            if not settled[i] and distance[i] != float('inf') and (current < 0 or distance[i] < distance[current]):
                current = i
        if current < 0:
            break
        settled[current] = True
        for neighbor in range(graph.n):
            if graph.has[current][neighbor] and not settled[neighbor]:
                candidate = distance[current] + graph.weight[current][neighbor]
                if candidate < distance[neighbor]:
                    distance[neighbor] = candidate
    return distance
# end
