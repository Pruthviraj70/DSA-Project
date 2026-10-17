import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class Examples {
  // shared:list
  static class Node {
    int value;
    Node next;

    Node(int value, Node next) {
      this.value = value;
      this.next = next;
    }
  }

  // shared:tree
  static class Tree {
    int value;
    Tree left, right;

    Tree(int value) {
      this.value = value;
    }
  }

  // shared:circular
  static class CircularQueue {
    int[] data = new int[32];
    int head = 0, size = 0;
  }

  // shared:graph
  static class Graph {
    int n;
    boolean directed;
    boolean[][] has = new boolean[16][16];
    int[][] weight = new int[16][16];

    Graph(int n, boolean directed) {
      if (n < 0 || n > 16) throw new IllegalArgumentException("Use 0..16 vertices");
      this.n = n;
      this.directed = directed;
    }
  }

  // example:countdown
  static void countdown(int n) {
    if (n <= 0) return;
    countdown(n - 1);
  }

  // example:array-create
  static int[] arrayCreate(int[] values) {
    if (values.length > 32) throw new IllegalArgumentException("Use at most 32 values");
    int[] result = new int[values.length];
    for (int i = 0; i < values.length; i++) result[i] = values[i];
    return result;
  }

  // example:array-access
  static int arrayAccess(int[] values, int index) {
    if (index < 0 || index >= values.length) throw new IndexOutOfBoundsException();
    return values[index];
  }

  // example:array-update
  static void arrayUpdate(int[] values, int index, int value) {
    if (index < 0 || index >= values.length) throw new IndexOutOfBoundsException();
    values[index] = value;
  }

  // example:array-traverse
  static void arrayTraverse(int[] values) {
    for (int value : values) System.out.print(value + " ");
  }

  // example:array-insert
  static void arrayInsert(ArrayList<Integer> values, int index, int value, int capacity) {
    if (index < 0 || index > values.size() || values.size() >= capacity)
      throw new IndexOutOfBoundsException("Invalid index or full sequence");
    int n = values.size();
    values.add(value);
    for (int i = n; i > index; i--) values.set(i, values.get(i - 1));
    values.set(index, value);
  }

  // example:array-insert-copy
  static int[] arrayInsertCopy(int[] values, int index, int value) {
    if (index < 0 || index > values.length) throw new IndexOutOfBoundsException();
    int[] result = new int[values.length + 1];
    for (int i = 0; i < index; i++) result[i] = values[i];
    result[index] = value;
    for (int i = index; i < values.length; i++) result[i + 1] = values[i];
    return result;
  }

  // example:array-delete
  static int arrayDelete(ArrayList<Integer> values, int index) {
    if (index < 0 || index >= values.size()) throw new IndexOutOfBoundsException();
    int removed = values.get(index);
    for (int i = index + 1; i < values.size(); i++) values.set(i - 1, values.get(i));
    values.remove(values.size() - 1);
    return removed;
  }

  // example:linear-search
  static int linearSearch(int[] values, int target) {
    for (int i = 0; i < values.length; i++) if (values[i] == target) return i;
    return -1;
  }

  // example:binary-search
  static int binarySearch(int[] values, int target) {
    int lo = 0, hi = values.length - 1;
    while (lo <= hi) {
      int mid = lo + (hi - lo) / 2;
      if (values[mid] == target) return mid;
      if (values[mid] < target) lo = mid + 1;
      else hi = mid - 1;
    }
    return -1;
  }

  // example:binary-search-recursive
  static int binarySearchRange(int[] values, int lo, int hi, int target) {
    if (lo > hi) return -1;
    int mid = lo + (hi - lo) / 2;
    if (values[mid] == target) return mid;
    return values[mid] < target
        ? binarySearchRange(values, mid + 1, hi, target)
        : binarySearchRange(values, lo, mid - 1, target);
  }

  static int binarySearchRecursive(int[] values, int target) {
    return binarySearchRange(values, 0, values.length - 1, target);
  }

  // example:binary-first
  static int binaryFirst(int[] values, int target) {
    int lo = 0, hi = values.length - 1, found = -1;
    while (lo <= hi) {
      int mid = lo + (hi - lo) / 2;
      if (values[mid] >= target) {
        if (values[mid] == target) found = mid;
        hi = mid - 1;
      } else lo = mid + 1;
    }
    return found;
  }

  // example:insertion-sort
  static void insertionSort(int[] values) {
    for (int i = 1; i < values.length; i++) {
      int key = values[i], j = i - 1;
      while (j >= 0 && values[j] > key) {
        values[j + 1] = values[j];
        j--;
      }
      values[j + 1] = key;
    }
  }

  // example:merge-sort
  static void mergeSort(int[] values) {
    int n = values.length;
    int[] buffer = new int[n];
    for (int width = 1; width < n; width *= 2)
      for (int start = 0; start < n; start += 2 * width) {
        int mid = Math.min(start + width, n),
            end = Math.min(start + 2 * width, n),
            left = start,
            right = mid,
            out = start;
        while (left < mid || right < end) {
          if (right == end || (left < mid && values[left] <= values[right]))
            buffer[out++] = values[left++];
          else buffer[out++] = values[right++];
        }
        for (int i = start; i < end; i++) values[i] = buffer[i];
      }
  }

  // example:merge-sort-recursive
  static void mergeRange(int[] values, int[] buffer, int lo, int hi) {
    if (hi - lo < 2) return;
    int mid = lo + (hi - lo) / 2;
    mergeRange(values, buffer, lo, mid);
    mergeRange(values, buffer, mid, hi);
    int left = lo, right = mid, out = lo;
    while (left < mid || right < hi) {
      if (right == hi || (left < mid && values[left] <= values[right]))
        buffer[out++] = values[left++];
      else buffer[out++] = values[right++];
    }
    for (int i = lo; i < hi; i++) values[i] = buffer[i];
  }

  static void mergeSortRecursive(int[] values) {
    mergeRange(values, new int[values.length], 0, values.length);
  }

  // example:quick-sort
  static void quickSortRange(int[] values, int lo, int hi) {
    if (lo >= hi) return;
    int pivot = values[hi], boundary = lo;
    for (int j = lo; j < hi; j++)
      if (values[j] <= pivot) {
        int value = values[boundary];
        values[boundary++] = values[j];
        values[j] = value;
      }
    int value = values[boundary];
    values[boundary] = values[hi];
    values[hi] = value;
    quickSortRange(values, lo, boundary - 1);
    quickSortRange(values, boundary + 1, hi);
  }

  static void quickSort(int[] values) {
    quickSortRange(values, 0, values.length - 1);
  }

  // example:list-insert
  static Node listInsert(Node head, int index, int value) {
    if (index < 0) throw new IndexOutOfBoundsException();
    if (index == 0) return new Node(value, head);
    Node previous = head;
    for (int i = 0; i < index - 1; i++) {
      if (previous == null) throw new IndexOutOfBoundsException();
      previous = previous.next;
    }
    if (previous == null) throw new IndexOutOfBoundsException();
    previous.next = new Node(value, previous.next);
    return head;
  }

  // example:list-delete
  static Node listDelete(Node head, int index) {
    if (index < 0 || head == null) throw new IndexOutOfBoundsException();
    if (index == 0) return head.next;
    Node previous = head;
    for (int i = 0; i < index - 1; i++) {
      if (previous.next == null) throw new IndexOutOfBoundsException();
      previous = previous.next;
    }
    if (previous.next == null) throw new IndexOutOfBoundsException();
    previous.next = previous.next.next;
    return head;
  }

  // example:list-search
  static Node listSearch(Node head, int target) {
    for (Node node = head; node != null; node = node.next) if (node.value == target) return node;
    return null;
  }

  // example:list-traverse
  static void listTraverse(Node head) {
    for (Node node = head; node != null; node = node.next) System.out.print(node.value + " ");
  }

  // example:stack-push
  static void stackPush(ArrayList<Integer> stack, int value) {
    if (stack.size() >= 32) throw new IllegalStateException("Stack is full");
    stack.add(value);
  }

  // example:stack-pop
  static int stackPop(ArrayList<Integer> stack) {
    if (stack.isEmpty()) throw new IllegalStateException("Stack is empty");
    return stack.remove(stack.size() - 1);
  }

  // example:stack-peek
  static int stackPeek(ArrayList<Integer> stack) {
    if (stack.isEmpty()) throw new IllegalStateException("Stack is empty");
    return stack.get(stack.size() - 1);
  }

  // example:queue-enqueue
  static void queueEnqueue(ArrayList<Integer> queue, int value) {
    if (queue.size() >= 32) throw new IllegalStateException("Queue is full");
    queue.add(value);
  }

  // example:queue-dequeue
  static int queueDequeue(ArrayList<Integer> queue) {
    if (queue.isEmpty()) throw new IllegalStateException("Queue is empty");
    int value = queue.get(0);
    for (int i = 1; i < queue.size(); i++) queue.set(i - 1, queue.get(i));
    queue.remove(queue.size() - 1);
    return value;
  }

  // example:queue-inspect
  static int queueInspect(ArrayList<Integer> queue) {
    if (queue.isEmpty()) throw new IllegalStateException("Queue is empty");
    return queue.get(0);
  }

  // example:circular-queue
  static void circularEnqueue(CircularQueue queue, int value) {
    if (queue.size == 32) throw new IllegalStateException("Queue is full");
    int back = (queue.head + queue.size) % 32;
    queue.data[back] = value;
    queue.size++;
  }

  static int circularDequeue(CircularQueue queue) {
    if (queue.size == 0) throw new IllegalStateException("Queue is empty");
    int value = queue.data[queue.head];
    queue.head = (queue.head + 1) % 32;
    queue.size--;
    return value;
  }

  // example:bst-insert
  static Tree bstInsert(Tree root, int value) {
    if (root == null) return new Tree(value);
    if (value < root.value) root.left = bstInsert(root.left, value);
    else if (value > root.value) root.right = bstInsert(root.right, value);
    return root;
  }

  // example:bst-search
  static Tree bstSearch(Tree root, int value) {
    while (root != null && root.value != value) root = value < root.value ? root.left : root.right;
    return root;
  }

  // example:bst-delete
  static Tree bstDelete(Tree root, int value) {
    if (root == null) return null;
    if (value < root.value) root.left = bstDelete(root.left, value);
    else if (value > root.value) root.right = bstDelete(root.right, value);
    else {
      if (root.left == null) return root.right;
      if (root.right == null) return root.left;
      Tree successor = root.right;
      while (successor.left != null) successor = successor.left;
      root.value = successor.value;
      root.right = bstDelete(root.right, successor.value);
    }
    return root;
  }

  // example:bst-inorder
  static void bstInorder(Tree root) {
    if (root == null) return;
    bstInorder(root.left);
    System.out.print(root.value + " ");
    bstInorder(root.right);
  }

  // example:bst-preorder
  static void bstPreorder(Tree root) {
    if (root == null) return;
    System.out.print(root.value + " ");
    bstPreorder(root.left);
    bstPreorder(root.right);
  }

  // example:bst-postorder
  static void bstPostorder(Tree root) {
    if (root == null) return;
    bstPostorder(root.left);
    bstPostorder(root.right);
    System.out.print(root.value + " ");
  }

  // example:graph-create
  static Graph graphCreate(int n, boolean directed) {
    return new Graph(n, directed);
  }

  static void graphSetEdge(Graph graph, int from, int to, int weight) {
    if (from < 0
        || to < 0
        || from >= graph.n
        || to >= graph.n
        || weight < -100000
        || weight > 100000) throw new IllegalArgumentException("Invalid edge");
    graph.has[from][to] = true;
    graph.weight[from][to] = weight;
    if (!graph.directed) {
      graph.has[to][from] = true;
      graph.weight[to][from] = weight;
    }
  }

  static void graphRemoveEdge(Graph graph, int from, int to) {
    if (from < 0 || to < 0 || from >= graph.n || to >= graph.n)
      throw new IndexOutOfBoundsException();
    graph.has[from][to] = false;
    if (!graph.directed) graph.has[to][from] = false;
  }

  static int graphAddVertex(Graph graph) {
    if (graph.n == 16) throw new IllegalStateException("Graph is full");
    return graph.n++;
  }

  static void graphRemoveVertex(Graph graph, int index) {
    if (index < 0 || index >= graph.n) throw new IndexOutOfBoundsException();
    for (int i = index; i + 1 < graph.n; i++)
      for (int j = 0; j < graph.n; j++) {
        graph.has[i][j] = graph.has[i + 1][j];
        graph.weight[i][j] = graph.weight[i + 1][j];
      }
    for (int j = index; j + 1 < graph.n; j++)
      for (int i = 0; i + 1 < graph.n; i++) {
        graph.has[i][j] = graph.has[i][j + 1];
        graph.weight[i][j] = graph.weight[i][j + 1];
      }
    graph.n--;
    for (int i = 0; i < 16; i++) {
      graph.has[graph.n][i] = graph.has[i][graph.n] = false;
      graph.weight[graph.n][i] = graph.weight[i][graph.n] = 0;
    }
  }

  // example:bfs
  static List<Integer> bfs(Graph graph, int source) {
    if (source < 0 || source >= graph.n) throw new IndexOutOfBoundsException();
    boolean[] seen = new boolean[graph.n];
    List<Integer> queue = new ArrayList<>(), order = new ArrayList<>();
    queue.add(source);
    seen[source] = true;
    for (int head = 0; head < queue.size(); head++) {
      int from = queue.get(head);
      order.add(from);
      for (int to = 0; to < graph.n; to++)
        if (graph.has[from][to] && !seen[to]) {
          seen[to] = true;
          queue.add(to);
        }
    }
    return order;
  }

  // example:bfs-list
  static List<Integer> bfsList(List<List<Integer>> neighbors, int source) {
    if (source < 0 || source >= neighbors.size()) throw new IndexOutOfBoundsException();
    boolean[] seen = new boolean[neighbors.size()];
    List<Integer> queue = new ArrayList<>(), order = new ArrayList<>();
    queue.add(source);
    seen[source] = true;
    for (int head = 0; head < queue.size(); head++) {
      int from = queue.get(head);
      order.add(from);
      for (int to : neighbors.get(from))
        if (!seen[to]) {
          seen[to] = true;
          queue.add(to);
        }
    }
    return order;
  }

  // example:dfs
  static List<Integer> dfs(Graph graph, int source) {
    if (source < 0 || source >= graph.n) throw new IndexOutOfBoundsException();
    boolean[] seen = new boolean[graph.n];
    int[] next = new int[graph.n];
    ArrayList<Integer> path = new ArrayList<>(), order = new ArrayList<>();
    path.add(source);
    order.add(source);
    seen[source] = true;
    while (!path.isEmpty()) {
      int from = path.get(path.size() - 1);
      while (next[from] < graph.n && (!graph.has[from][next[from]] || seen[next[from]]))
        next[from]++;
      if (next[from] == graph.n) path.remove(path.size() - 1);
      else {
        int to = next[from]++;
        seen[to] = true;
        order.add(to);
        path.add(to);
      }
    }
    return order;
  }

  // example:dijkstra
  static int[] dijkstra(Graph graph, int source) {
    if (source < 0 || source >= graph.n) throw new IndexOutOfBoundsException();
    for (int i = 0; i < graph.n; i++)
      for (int j = 0; j < graph.n; j++)
        if (graph.has[i][j] && graph.weight[i][j] < 0)
          throw new IllegalArgumentException("Negative weights are not allowed");
    int[] distance = new int[graph.n];
    Arrays.fill(distance, Integer.MAX_VALUE);
    boolean[] settled = new boolean[graph.n];
    distance[source] = 0;
    for (int step = 0; step < graph.n; step++) {
      int from = -1;
      for (int i = 0; i < graph.n; i++)
        if (!settled[i]
            && distance[i] != Integer.MAX_VALUE
            && (from < 0 || distance[i] < distance[from])) from = i;
      if (from < 0) break;
      settled[from] = true;
      for (int to = 0; to < graph.n; to++)
        if (graph.has[from][to] && !settled[to]) {
          int candidate = distance[from] + graph.weight[from][to];
          if (candidate < distance[to]) distance[to] = candidate;
        }
    }
    return distance;
  }
  // end
}
