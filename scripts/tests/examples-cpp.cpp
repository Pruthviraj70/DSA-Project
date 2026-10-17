#include "../../content/examples/Examples.cpp"
#include <cassert>
using namespace std;
int main() {
    vector<int> a = {3, 1, 3, -2};
    auto created = arrayCreate(a);
    created[0] = 99;
    assert(a[0] == 3);
    assert(arrayAccess(a, 0) == 3);
    arrayUpdate(a, 1, 7);
    arrayInsert(a, 0, 9);
    assert(arrayDelete(a, 0) == 9);
    assert(arrayInsertCopy(a, 4, 10).size() == 5 && a.size() == 4);
    for (auto sort : {insertionSort, mergeSort, mergeSortRecursive, quickSort}) {
        vector<int> b = {3, 1, 3, -2};
        sort(b);
        assert((b == vector<int>{-2, 1, 3, 3}));
        assert(binarySearch(b, 1) == 1 && binarySearchRecursive(b, 1) == 1 &&
               binaryFirst(b, 3) == 2 && linearSearch(b, 8) == -1);
        vector<int> empty;
        sort(empty);
    }
    Node *head = nullptr;
    int removed;
    assert(!listDelete(head, 0, removed));
    assert(listInsert(head, 0, 4) && listInsert(head, 1, 9));
    assert(listSearch(head, 9));
    assert(listDelete(head, 0, removed) && removed == 4 && head->value == 9);
    listFree(head);
    vector<int> stack, queue;
    stackPush(stack, 2);
    stackPush(stack, 3);
    assert(stackPeek(stack) == 3 && stackPop(stack) == 3);
    queueEnqueue(queue, 2);
    queueEnqueue(queue, 3);
    assert(queueInspect(queue) == 2 && queueDequeue(queue) == 2);
    bool underflow = false;
    try {
        vector<int> empty;
        stackPop(empty);
    } catch (const exception &) {
        underflow = true;
    }
    assert(underflow);
    CircularQueue ring;
    for (int i = 0; i < 70; i++) {
        circularEnqueue(ring, i);
        assert(circularDequeue(ring) == i);
    }
    Tree *root = nullptr;
    for (int v : {10, 5, 20, 15, 17, 10})
        root = bstInsert(root, v);
    root = bstDelete(root, 10);
    assert(!bstSearch(root, 10) && bstSearch(root, 17));
    root = bstDelete(root, 20);
    root = bstDelete(root, 5);
    treeFree(root);
    Graph g = graphCreate(4);
    graphSetEdge(g, 0, 1, 0);
    graphSetEdge(g, 1, 2, 3);
    assert((bfs(g, 0) == vector<int>{0, 1, 2}));
    assert(dfs(g, 0).size() == 3);
    auto d = dijkstra(g, 0);
    assert(d[2] == 3 && d[3] == numeric_limits<int>::max());
    graphSetEdge(g, 2, 3, -1);
    bool rejected = false;
    try {
        dijkstra(g, 0);
    } catch (const exception &) {
        rejected = true;
    }
    assert(rejected);
    graphRemoveVertex(g, 1);
    assert(graphAddVertex(g) == 3 && !g.has[3][2]);
    countdown(5);
    cout << "C++ example behavior passed\n";
}
