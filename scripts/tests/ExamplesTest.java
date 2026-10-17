import java.util.*;

public class ExamplesTest extends Examples {
  public static void main(String[] args) {
    int[] a = {3, 1, 3, -2};
    int[] created = arrayCreate(a);
    created[0] = 99;
    assert a[0] == 3;
    assert arrayAccess(a, 0) == 3;
    arrayUpdate(a, 1, 7);
    ArrayList<Integer> sequence = new ArrayList<>(List.of(3, 1));
    arrayInsert(sequence, 0, 9, 32);
    assert arrayDelete(sequence, 0) == 9;
    for (int mode = 0; mode < 4; mode++) {
      int[] b = {3, 1, 3, -2};
      switch (mode) {
        case 0:
          insertionSort(b);
          break;
        case 1:
          mergeSort(b);
          break;
        case 2:
          mergeSortRecursive(b);
          break;
        default:
          quickSort(b);
      }
      assert Arrays.equals(b, new int[] {-2, 1, 3, 3});
      assert binarySearch(b, 1) == 1
          && binarySearchRecursive(b, 1) == 1
          && binaryFirst(b, 3) == 2
          && linearSearch(b, 8) == -1;
    }
    assert binarySearch(new int[0], 1) == -1;
    mergeSort(new int[0]);
    quickSort(new int[0]);
    Node head = null;
    head = listInsert(head, 0, 4);
    head = listInsert(head, 1, 9);
    assert listSearch(head, 9) != null;
    head = listDelete(head, 0);
    assert head.value == 9;
    ArrayList<Integer> stack = new ArrayList<>(), queue = new ArrayList<>();
    stackPush(stack, 2);
    stackPush(stack, 3);
    assert stackPeek(stack) == 3 && stackPop(stack) == 3;
    queueEnqueue(queue, 2);
    queueEnqueue(queue, 3);
    assert queueInspect(queue) == 2 && queueDequeue(queue) == 2;
    boolean underflow = false;
    try {
      stackPop(new ArrayList<>());
    } catch (IllegalStateException e) {
      underflow = true;
    }
    assert underflow;
    CircularQueue ring = new CircularQueue();
    for (int i = 0; i < 70; i++) {
      circularEnqueue(ring, i);
      assert circularDequeue(ring) == i;
    }
    Tree root = null;
    for (int v : new int[] {10, 5, 20, 15, 17, 10}) root = bstInsert(root, v);
    root = bstDelete(root, 10);
    assert bstSearch(root, 10) == null && bstSearch(root, 17) != null;
    root = bstDelete(root, 20);
    root = bstDelete(root, 5);
    Graph g = graphCreate(4, false);
    graphSetEdge(g, 0, 1, 0);
    graphSetEdge(g, 1, 2, 3);
    assert bfs(g, 0).equals(List.of(0, 1, 2));
    assert dfs(g, 0).size() == 3;
    int[] d = dijkstra(g, 0);
    assert d[2] == 3 && d[3] == Integer.MAX_VALUE;
    graphSetEdge(g, 2, 3, -1);
    boolean rejected = false;
    try {
      dijkstra(g, 0);
    } catch (IllegalArgumentException e) {
      rejected = true;
    }
    assert rejected;
    graphRemoveVertex(g, 1);
    assert graphAddVertex(g) == 3 && !g.has[3][2];
    countdown(5);
    System.out.println("Java example behavior passed");
  }
}
