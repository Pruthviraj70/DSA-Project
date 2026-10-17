// shared:list
class Node {
  constructor(value, next = null) {
    this.value = value;
    this.next = next;
  }
}
// shared:tree
class Tree {
  constructor(value) {
    this.value = value;
    this.left = null;
    this.right = null;
  }
}
// shared:circular
class CircularQueue {
  constructor() {
    this.data = Array(32).fill(0);
    this.head = 0;
    this.size = 0;
  }
}
// shared:graph
class Graph {
  constructor(n, directed = false) {
    if (!Number.isInteger(n) || n < 0 || n > 16)
      throw new RangeError("Use 0..16 vertices");
    this.n = n;
    this.directed = directed;
    this.has = Array.from({ length: 16 }, () => Array(16).fill(false));
    this.weight = Array.from({ length: 16 }, () => Array(16).fill(0));
  }
}
// example:countdown
function countdown(n) {
  if (n <= 0) return;
  countdown(n - 1);
}
// example:array-create
function arrayCreate(values) {
  if (values.length > 32) throw new RangeError("Use at most 32 values");
  const result = [];
  for (const value of values) result.push(value);
  return result;
}
// example:array-access
function arrayAccess(values, index) {
  if (!Number.isInteger(index) || index < 0 || index >= values.length)
    throw new RangeError("No element at this index");
  return values[index];
}
// example:array-update
function arrayUpdate(values, index, value) {
  if (!Number.isInteger(index) || index < 0 || index >= values.length)
    throw new RangeError("No element at this index");
  values[index] = value;
}
// example:array-traverse
function arrayTraverse(values) {
  for (const value of values) console.log(value);
}
// example:array-insert
function arrayInsert(values, index, value, capacity = 32) {
  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index > values.length ||
    values.length >= capacity
  )
    throw new RangeError("Invalid index or full sequence");
  values.push(value);
  for (let i = values.length - 1; i > index; i--) values[i] = values[i - 1];
  values[index] = value;
}
// example:array-insert-copy
function arrayInsertCopy(values, index, value) {
  if (!Number.isInteger(index) || index < 0 || index > values.length)
    throw new RangeError("Invalid insertion index");
  const result = [];
  for (let i = 0; i < index; i++) result.push(values[i]);
  result.push(value);
  for (let i = index; i < values.length; i++) result.push(values[i]);
  return result;
}
// example:array-delete
function arrayDelete(values, index) {
  if (!Number.isInteger(index) || index < 0 || index >= values.length)
    throw new RangeError("No element to remove");
  const removed = values[index];
  for (let i = index + 1; i < values.length; i++) values[i - 1] = values[i];
  values.pop();
  return removed;
}
// example:linear-search
function linearSearch(values, target) {
  for (let i = 0; i < values.length; i++) if (values[i] === target) return i;
  return -1;
}
// example:binary-search
function binarySearch(values, target) {
  let lo = 0,
    hi = values.length - 1;
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (values[mid] === target) return mid;
    if (values[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}
// example:binary-search-recursive
function binarySearchRecursive(values, target) {
  function search(lo, hi) {
    if (lo > hi) return -1;
    const mid = lo + Math.floor((hi - lo) / 2);
    if (values[mid] === target) return mid;
    return values[mid] < target ? search(mid + 1, hi) : search(lo, mid - 1);
  }
  return search(0, values.length - 1);
}
// example:binary-first
function binaryFirst(values, target) {
  let lo = 0,
    hi = values.length - 1,
    found = -1;
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (values[mid] >= target) {
      if (values[mid] === target) found = mid;
      hi = mid - 1;
    } else lo = mid + 1;
  }
  return found;
}
// example:insertion-sort
function insertionSort(values) {
  for (let i = 1; i < values.length; i++) {
    const key = values[i];
    let j = i - 1;
    while (j >= 0 && values[j] > key) {
      values[j + 1] = values[j];
      j--;
    }
    values[j + 1] = key;
  }
}
// example:merge-sort
function mergeSort(values) {
  const n = values.length,
    buffer = Array(n);
  for (let width = 1; width < n; width *= 2)
    for (let start = 0; start < n; start += 2 * width) {
      const mid = Math.min(start + width, n),
        end = Math.min(start + 2 * width, n);
      let left = start,
        right = mid,
        out = start;
      while (left < mid || right < end) {
        if (right === end || (left < mid && values[left] <= values[right]))
          buffer[out++] = values[left++];
        else buffer[out++] = values[right++];
      }
      for (let i = start; i < end; i++) values[i] = buffer[i];
    }
}
// example:merge-sort-recursive
function mergeSortRecursive(values) {
  const buffer = Array(values.length);
  function sortRange(lo, hi) {
    if (hi - lo < 2) return;
    const mid = lo + Math.floor((hi - lo) / 2);
    sortRange(lo, mid);
    sortRange(mid, hi);
    let left = lo,
      right = mid,
      out = lo;
    while (left < mid || right < hi) {
      if (right === hi || (left < mid && values[left] <= values[right]))
        buffer[out++] = values[left++];
      else buffer[out++] = values[right++];
    }
    for (let i = lo; i < hi; i++) values[i] = buffer[i];
  }
  sortRange(0, values.length);
}
// example:quick-sort
function quickSort(values) {
  function sortRange(lo, hi) {
    if (lo >= hi) return;
    const pivot = values[hi];
    let boundary = lo;
    for (let j = lo; j < hi; j++)
      if (values[j] <= pivot) {
        [values[boundary], values[j]] = [values[j], values[boundary]];
        boundary++;
      }
    [values[boundary], values[hi]] = [values[hi], values[boundary]];
    sortRange(lo, boundary - 1);
    sortRange(boundary + 1, hi);
  }
  sortRange(0, values.length - 1);
}
// example:list-insert
function listInsert(head, index, value) {
  if (!Number.isInteger(index) || index < 0)
    throw new RangeError("Invalid index");
  if (index === 0) return new Node(value, head);
  let previous = head;
  for (let i = 0; i < index - 1; i++) {
    if (previous === null) throw new RangeError("Invalid index");
    previous = previous.next;
  }
  if (previous === null) throw new RangeError("Invalid index");
  previous.next = new Node(value, previous.next);
  return head;
}
// example:list-delete
function listDelete(head, index) {
  if (!Number.isInteger(index) || index < 0 || head === null)
    throw new RangeError("No node to remove");
  if (index === 0) return head.next;
  let previous = head;
  for (let i = 0; i < index - 1; i++) {
    if (previous.next === null) throw new RangeError("No node to remove");
    previous = previous.next;
  }
  if (previous.next === null) throw new RangeError("No node to remove");
  previous.next = previous.next.next;
  return head;
}
// example:list-search
function listSearch(head, target) {
  for (let node = head; node !== null; node = node.next)
    if (node.value === target) return node;
  return null;
}
// example:list-traverse
function listTraverse(head) {
  for (let node = head; node !== null; node = node.next)
    console.log(node.value);
}
// example:stack-push
function stackPush(stack, value) {
  if (stack.length >= 32) throw new RangeError("Stack is full");
  stack.push(value);
}
// example:stack-pop
function stackPop(stack) {
  if (stack.length === 0) throw new RangeError("Stack is empty");
  return stack.pop();
}
// example:stack-peek
function stackPeek(stack) {
  if (stack.length === 0) throw new RangeError("Stack is empty");
  return stack[stack.length - 1];
}
// example:queue-enqueue
function queueEnqueue(queue, value) {
  if (queue.length >= 32) throw new RangeError("Queue is full");
  queue.push(value);
}
// example:queue-dequeue
function queueDequeue(queue) {
  if (queue.length === 0) throw new RangeError("Queue is empty");
  const removed = queue[0];
  for (let i = 1; i < queue.length; i++) queue[i - 1] = queue[i];
  queue.pop();
  return removed;
}
// example:queue-inspect
function queueInspect(queue) {
  if (queue.length === 0) throw new RangeError("Queue is empty");
  return queue[0];
}
// example:circular-queue
function circularEnqueue(queue, value) {
  if (queue.size === queue.data.length) throw new RangeError("Queue is full");
  const back = (queue.head + queue.size) % queue.data.length;
  queue.data[back] = value;
  queue.size++;
}
function circularDequeue(queue) {
  if (queue.size === 0) throw new RangeError("Queue is empty");
  const value = queue.data[queue.head];
  queue.head = (queue.head + 1) % queue.data.length;
  queue.size--;
  return value;
}
// example:bst-insert
function bstInsert(root, value) {
  if (root === null) return new Tree(value);
  if (value < root.value) root.left = bstInsert(root.left, value);
  else if (value > root.value) root.right = bstInsert(root.right, value);
  return root;
}
// example:bst-search
function bstSearch(root, value) {
  while (root !== null && root.value !== value)
    root = value < root.value ? root.left : root.right;
  return root;
}
// example:bst-delete
function bstDelete(root, value) {
  if (root === null) return null;
  if (value < root.value) root.left = bstDelete(root.left, value);
  else if (value > root.value) root.right = bstDelete(root.right, value);
  else {
    if (root.left === null) return root.right;
    if (root.right === null) return root.left;
    let successor = root.right;
    while (successor.left !== null) successor = successor.left;
    root.value = successor.value;
    root.right = bstDelete(root.right, successor.value);
  }
  return root;
}
// example:bst-inorder
function bstInorder(root) {
  if (root === null) return;
  bstInorder(root.left);
  console.log(root.value);
  bstInorder(root.right);
}
// example:bst-preorder
function bstPreorder(root) {
  if (root === null) return;
  console.log(root.value);
  bstPreorder(root.left);
  bstPreorder(root.right);
}
// example:bst-postorder
function bstPostorder(root) {
  if (root === null) return;
  bstPostorder(root.left);
  bstPostorder(root.right);
  console.log(root.value);
}
// example:graph-create
function graphCreate(n, directed = false) {
  return new Graph(n, directed);
}
function graphSetEdge(graph, from, to, weight) {
  if (
    !Number.isInteger(from) ||
    !Number.isInteger(to) ||
    !Number.isInteger(weight) ||
    from < 0 ||
    to < 0 ||
    from >= graph.n ||
    to >= graph.n ||
    Math.abs(weight) > 100000
  )
    throw new RangeError("Invalid edge");
  graph.has[from][to] = true;
  graph.weight[from][to] = weight;
  if (!graph.directed) {
    graph.has[to][from] = true;
    graph.weight[to][from] = weight;
  }
}
function graphRemoveEdge(graph, from, to) {
  if (from < 0 || to < 0 || from >= graph.n || to >= graph.n)
    throw new RangeError("Invalid endpoint");
  graph.has[from][to] = false;
  if (!graph.directed) graph.has[to][from] = false;
}
function graphAddVertex(graph) {
  if (graph.n === 16) throw new RangeError("Graph is full");
  return graph.n++;
}
function graphRemoveVertex(graph, index) {
  if (!Number.isInteger(index) || index < 0 || index >= graph.n)
    throw new RangeError("Invalid vertex");
  for (let i = index; i + 1 < graph.n; i++)
    for (let j = 0; j < graph.n; j++) {
      graph.has[i][j] = graph.has[i + 1][j];
      graph.weight[i][j] = graph.weight[i + 1][j];
    }
  for (let j = index; j + 1 < graph.n; j++)
    for (let i = 0; i + 1 < graph.n; i++) {
      graph.has[i][j] = graph.has[i][j + 1];
      graph.weight[i][j] = graph.weight[i][j + 1];
    }
  graph.n--;
  for (let i = 0; i < 16; i++) {
    graph.has[graph.n][i] = graph.has[i][graph.n] = false;
    graph.weight[graph.n][i] = graph.weight[i][graph.n] = 0;
  }
}
// example:bfs
function bfs(graph, source) {
  if (!Number.isInteger(source) || source < 0 || source >= graph.n)
    throw new RangeError("Invalid source");
  const seen = Array(graph.n).fill(false),
    queue = [source],
    order = [];
  seen[source] = true;
  for (let head = 0; head < queue.length; head++) {
    const from = queue[head];
    order.push(from);
    for (let to = 0; to < graph.n; to++)
      if (graph.has[from][to] && !seen[to]) {
        seen[to] = true;
        queue.push(to);
      }
  }
  return order;
}
// example:bfs-list
function bfsList(neighbors, source) {
  if (!Number.isInteger(source) || source < 0 || source >= neighbors.length)
    throw new RangeError("Invalid source");
  const seen = new Set([source]),
    queue = [source],
    order = [];
  for (let head = 0; head < queue.length; head++) {
    const from = queue[head];
    order.push(from);
    for (const to of neighbors[from])
      if (!seen.has(to)) {
        seen.add(to);
        queue.push(to);
      }
  }
  return order;
}
// example:dfs
function dfs(graph, source) {
  if (!Number.isInteger(source) || source < 0 || source >= graph.n)
    throw new RangeError("Invalid source");
  const seen = Array(graph.n).fill(false),
    path = [source],
    next = Array(graph.n).fill(0),
    order = [source];
  seen[source] = true;
  while (path.length) {
    const from = path[path.length - 1];
    while (
      next[from] < graph.n &&
      (!graph.has[from][next[from]] || seen[next[from]])
    )
      next[from]++;
    if (next[from] === graph.n) path.pop();
    else {
      const to = next[from]++;
      seen[to] = true;
      order.push(to);
      path.push(to);
    }
  }
  return order;
}
// example:dijkstra
function dijkstra(graph, source) {
  if (!Number.isInteger(source) || source < 0 || source >= graph.n)
    throw new RangeError("Invalid source");
  for (let i = 0; i < graph.n; i++)
    for (let j = 0; j < graph.n; j++)
      if (graph.has[i][j] && graph.weight[i][j] < 0)
        throw new RangeError("Negative weights are not allowed");
  const distance = Array(graph.n).fill(Infinity),
    settled = Array(graph.n).fill(false);
  distance[source] = 0;
  for (let step = 0; step < graph.n; step++) {
    let from = -1;
    for (let i = 0; i < graph.n; i++)
      if (
        !settled[i] &&
        distance[i] !== Infinity &&
        (from < 0 || distance[i] < distance[from])
      )
        from = i;
    if (from < 0) break;
    settled[from] = true;
    for (let to = 0; to < graph.n; to++)
      if (graph.has[from][to] && !settled[to]) {
        const candidate = distance[from] + graph.weight[from][to];
        if (candidate < distance[to]) distance[to] = candidate;
      }
  }
  return distance;
}
// end
