#include <algorithm>
#include <iostream>
#include <limits>
#include <stdexcept>
#include <vector>
using std::vector;
// shared:list
struct Node {
    int value;
    Node *next = nullptr;
};
void listFree(Node *head) {
    while (head) {
        Node *next = head->next;
        delete head;
        head = next;
    }
}
// shared:tree
struct Tree {
    int value;
    Tree *left = nullptr, *right = nullptr;
};
void treeFree(Tree *root) {
    if (root) {
        treeFree(root->left);
        treeFree(root->right);
        delete root;
    }
}
// shared:circular
struct CircularQueue {
    vector<int> data = vector<int>(32);
    int head = 0, size = 0;
};
// shared:graph
struct Graph {
    int n;
    bool directed;
    vector<vector<bool>> has;
    vector<vector<int>> weight;
};
// example:countdown
void countdown(int n) {
    if (n <= 0)
        return;
    countdown(n - 1);
}
// example:array-create
vector<int> arrayCreate(const vector<int> &values) {
    if (values.size() > 32)
        throw std::length_error("Use at most 32 values");
    vector<int> result;
    result.reserve(32);
    for (int value : values)
        result.push_back(value);
    return result;
}
// example:array-access
int arrayAccess(const vector<int> &values, int index) {
    if (index < 0 || index >= static_cast<int>(values.size()))
        throw std::out_of_range("Invalid index");
    return values[index];
}
// example:array-update
void arrayUpdate(vector<int> &values, int index, int value) {
    if (index < 0 || index >= static_cast<int>(values.size()))
        throw std::out_of_range("Invalid index");
    values[index] = value;
}
// example:array-traverse
void arrayTraverse(const vector<int> &values) {
    for (int value : values)
        std::cout << value << ' ';
}
// example:array-insert
void arrayInsert(vector<int> &values, int index, int value, int capacity = 32) {
    int n = static_cast<int>(values.size());
    if (index < 0 || index > n || n >= capacity)
        throw std::out_of_range("Invalid index or full sequence");
    values.push_back(value);
    for (int i = n; i > index; i--)
        values[i] = values[i - 1];
    values[index] = value;
}
// example:array-insert-copy
vector<int> arrayInsertCopy(const vector<int> &values, int index, int value) {
    int n = static_cast<int>(values.size());
    if (index < 0 || index > n)
        throw std::out_of_range("Invalid insertion index");
    vector<int> result;
    result.reserve(n + 1);
    for (int i = 0; i < index; i++)
        result.push_back(values[i]);
    result.push_back(value);
    for (int i = index; i < n; i++)
        result.push_back(values[i]);
    return result;
}
// example:array-delete
int arrayDelete(vector<int> &values, int index) {
    int n = static_cast<int>(values.size());
    if (index < 0 || index >= n)
        throw std::out_of_range("No element to remove");
    int removed = values[index];
    for (int i = index + 1; i < n; i++)
        values[i - 1] = values[i];
    values.pop_back();
    return removed;
}
// example:linear-search
int linearSearch(const vector<int> &values, int target) {
    for (int i = 0; i < static_cast<int>(values.size()); i++)
        if (values[i] == target)
            return i;
    return -1;
}
// example:binary-search
int binarySearch(const vector<int> &values, int target) {
    int lo = 0, hi = static_cast<int>(values.size()) - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (values[mid] == target)
            return mid;
        if (values[mid] < target)
            lo = mid + 1;
        else
            hi = mid - 1;
    }
    return -1;
}
// example:binary-search-recursive
int binarySearchRange(const vector<int> &values, int lo, int hi, int target) {
    if (lo > hi)
        return -1;
    int mid = lo + (hi - lo) / 2;
    if (values[mid] == target)
        return mid;
    return values[mid] < target ? binarySearchRange(values, mid + 1, hi, target)
                                : binarySearchRange(values, lo, mid - 1, target);
}
int binarySearchRecursive(const vector<int> &values, int target) {
    return binarySearchRange(values, 0, static_cast<int>(values.size()) - 1, target);
}
// example:binary-first
int binaryFirst(const vector<int> &values, int target) {
    int lo = 0, hi = static_cast<int>(values.size()) - 1, found = -1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (values[mid] >= target) {
            if (values[mid] == target)
                found = mid;
            hi = mid - 1;
        } else
            lo = mid + 1;
    }
    return found;
}
// example:insertion-sort
void insertionSort(vector<int> &values) {
    for (int i = 1; i < static_cast<int>(values.size()); i++) {
        int key = values[i], j = i - 1;
        while (j >= 0 && values[j] > key) {
            values[j + 1] = values[j];
            j--;
        }
        values[j + 1] = key;
    }
}
// example:merge-sort
void mergeSort(vector<int> &values) {
    int n = static_cast<int>(values.size());
    vector<int> buffer(n);
    for (int width = 1; width < n; width *= 2)
        for (int start = 0; start < n; start += 2 * width) {
            int mid = std::min(start + width, n), end = std::min(start + 2 * width, n),
                left = start, right = mid, out = start;
            while (left < mid || right < end) {
                if (right == end || (left < mid && values[left] <= values[right]))
                    buffer[out++] = values[left++];
                else
                    buffer[out++] = values[right++];
            }
            for (int i = start; i < end; i++)
                values[i] = buffer[i];
        }
}
// example:merge-sort-recursive
void mergeRange(vector<int> &values, vector<int> &buffer, int lo, int hi) {
    if (hi - lo < 2)
        return;
    int mid = lo + (hi - lo) / 2;
    mergeRange(values, buffer, lo, mid);
    mergeRange(values, buffer, mid, hi);
    int left = lo, right = mid, out = lo;
    while (left < mid || right < hi) {
        if (right == hi || (left < mid && values[left] <= values[right]))
            buffer[out++] = values[left++];
        else
            buffer[out++] = values[right++];
    }
    for (int i = lo; i < hi; i++)
        values[i] = buffer[i];
}
void mergeSortRecursive(vector<int> &values) {
    vector<int> buffer(values.size());
    mergeRange(values, buffer, 0, static_cast<int>(values.size()));
}
// example:quick-sort
void quickSortRange(vector<int> &values, int lo, int hi) {
    if (lo >= hi)
        return;
    int pivot = values[hi], boundary = lo;
    for (int j = lo; j < hi; j++)
        if (values[j] <= pivot) {
            std::swap(values[boundary], values[j]);
            boundary++;
        }
    std::swap(values[boundary], values[hi]);
    quickSortRange(values, lo, boundary - 1);
    quickSortRange(values, boundary + 1, hi);
}
void quickSort(vector<int> &values) {
    quickSortRange(values, 0, static_cast<int>(values.size()) - 1);
}
// example:list-insert
bool listInsert(Node *&head, int index, int value) {
    if (index < 0)
        return false;
    Node **link = &head;
    for (int i = 0; i < index; i++) {
        if (!*link)
            return false;
        link = &(*link)->next;
    }
    *link = new Node{value, *link};
    return true;
}
// example:list-delete
bool listDelete(Node *&head, int index, int &removed) {
    if (index < 0)
        return false;
    Node **link = &head;
    for (int i = 0; i < index; i++) {
        if (!*link)
            return false;
        link = &(*link)->next;
    }
    if (!*link)
        return false;
    Node *old = *link;
    removed = old->value;
    *link = old->next;
    delete old;
    return true;
}
// example:list-search
const Node *listSearch(const Node *head, int target) {
    for (auto node = head; node; node = node->next)
        if (node->value == target)
            return node;
    return nullptr;
}
// example:list-traverse
void listTraverse(const Node *head) {
    for (auto node = head; node; node = node->next)
        std::cout << node->value << ' ';
}
// example:stack-push
void stackPush(vector<int> &stack, int value) {
    if (stack.size() >= 32)
        throw std::overflow_error("Stack is full");
    stack.push_back(value);
}
// example:stack-pop
int stackPop(vector<int> &stack) {
    if (stack.empty())
        throw std::underflow_error("Stack is empty");
    int value = stack.back();
    stack.pop_back();
    return value;
}
// example:stack-peek
int stackPeek(const vector<int> &stack) {
    if (stack.empty())
        throw std::underflow_error("Stack is empty");
    return stack.back();
}
// example:queue-enqueue
void queueEnqueue(vector<int> &queue, int value) {
    if (queue.size() >= 32)
        throw std::overflow_error("Queue is full");
    queue.push_back(value);
}
// example:queue-dequeue
int queueDequeue(vector<int> &queue) {
    if (queue.empty())
        throw std::underflow_error("Queue is empty");
    int value = queue[0];
    for (int i = 1; i < static_cast<int>(queue.size()); i++)
        queue[i - 1] = queue[i];
    queue.pop_back();
    return value;
}
// example:queue-inspect
int queueInspect(const vector<int> &queue) {
    if (queue.empty())
        throw std::underflow_error("Queue is empty");
    return queue[0];
}
// example:circular-queue
void circularEnqueue(CircularQueue &queue, int value) {
    if (queue.size == 32)
        throw std::overflow_error("Queue is full");
    int back = (queue.head + queue.size) % 32;
    queue.data[back] = value;
    queue.size++;
}
int circularDequeue(CircularQueue &queue) {
    if (queue.size == 0)
        throw std::underflow_error("Queue is empty");
    int value = queue.data[queue.head];
    queue.head = (queue.head + 1) % 32;
    queue.size--;
    return value;
}
// example:bst-insert
Tree *bstInsert(Tree *root, int value) {
    if (!root)
        return new Tree{value};
    if (value < root->value)
        root->left = bstInsert(root->left, value);
    else if (value > root->value)
        root->right = bstInsert(root->right, value);
    return root;
}
// example:bst-search
const Tree *bstSearch(const Tree *root, int value) {
    while (root && root->value != value)
        root = value < root->value ? root->left : root->right;
    return root;
}
// example:bst-delete
Tree *bstDelete(Tree *root, int value) {
    if (!root)
        return nullptr;
    if (value < root->value)
        root->left = bstDelete(root->left, value);
    else if (value > root->value)
        root->right = bstDelete(root->right, value);
    else {
        if (!root->left || !root->right) {
            Tree *child = root->left ? root->left : root->right;
            delete root;
            return child;
        }
        Tree *successor = root->right;
        while (successor->left)
            successor = successor->left;
        root->value = successor->value;
        root->right = bstDelete(root->right, successor->value);
    }
    return root;
}
// example:bst-inorder
void bstInorder(const Tree *root) {
    if (!root)
        return;
    bstInorder(root->left);
    std::cout << root->value << ' ';
    bstInorder(root->right);
}
// example:bst-preorder
void bstPreorder(const Tree *root) {
    if (!root)
        return;
    std::cout << root->value << ' ';
    bstPreorder(root->left);
    bstPreorder(root->right);
}
// example:bst-postorder
void bstPostorder(const Tree *root) {
    if (!root)
        return;
    bstPostorder(root->left);
    bstPostorder(root->right);
    std::cout << root->value << ' ';
}
// example:graph-create
Graph graphCreate(int n, bool directed = false) {
    if (n < 0 || n > 16)
        throw std::out_of_range("Use 0..16 vertices");
    return Graph{n, directed, vector<vector<bool>>(16, vector<bool>(16)),
                 vector<vector<int>>(16, vector<int>(16))};
}
void graphSetEdge(Graph &graph, int from, int to, int weight) {
    if (from < 0 || to < 0 || from >= graph.n || to >= graph.n || weight < -100000 ||
        weight > 100000)
        throw std::out_of_range("Invalid edge");
    graph.has[from][to] = true;
    graph.weight[from][to] = weight;
    if (!graph.directed) {
        graph.has[to][from] = true;
        graph.weight[to][from] = weight;
    }
}
void graphRemoveEdge(Graph &graph, int from, int to) {
    if (from < 0 || to < 0 || from >= graph.n || to >= graph.n)
        throw std::out_of_range("Invalid endpoint");
    graph.has[from][to] = false;
    if (!graph.directed)
        graph.has[to][from] = false;
}
int graphAddVertex(Graph &graph) {
    if (graph.n == 16)
        throw std::overflow_error("Graph is full");
    return graph.n++;
}
void graphRemoveVertex(Graph &graph, int index) {
    if (index < 0 || index >= graph.n)
        throw std::out_of_range("Invalid vertex");
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
vector<int> bfs(const Graph &graph, int source) {
    if (source < 0 || source >= graph.n)
        throw std::out_of_range("Invalid source");
    vector<bool> seen(graph.n);
    vector<int> queue{source}, order;
    seen[source] = true;
    for (size_t head = 0; head < queue.size(); head++) {
        int from = queue[head];
        order.push_back(from);
        for (int to = 0; to < graph.n; to++)
            if (graph.has[from][to] && !seen[to]) {
                seen[to] = true;
                queue.push_back(to);
            }
    }
    return order;
}
// example:bfs-list
vector<int> bfsList(const vector<vector<int>> &neighbors, int source) {
    if (source < 0 || source >= static_cast<int>(neighbors.size()))
        throw std::out_of_range("Invalid source");
    vector<bool> seen(neighbors.size());
    vector<int> queue{source}, order;
    seen[source] = true;
    for (size_t head = 0; head < queue.size(); head++) {
        int from = queue[head];
        order.push_back(from);
        for (int to : neighbors[from])
            if (!seen[to]) {
                seen[to] = true;
                queue.push_back(to);
            }
    }
    return order;
}
// example:dfs
vector<int> dfs(const Graph &graph, int source) {
    if (source < 0 || source >= graph.n)
        throw std::out_of_range("Invalid source");
    vector<bool> seen(graph.n);
    vector<int> path{source}, next(graph.n), order{source};
    seen[source] = true;
    while (!path.empty()) {
        int from = path.back();
        while (next[from] < graph.n && (!graph.has[from][next[from]] || seen[next[from]]))
            next[from]++;
        if (next[from] == graph.n)
            path.pop_back();
        else {
            int to = next[from]++;
            seen[to] = true;
            order.push_back(to);
            path.push_back(to);
        }
    }
    return order;
}
// example:dijkstra
vector<int> dijkstra(const Graph &graph, int source) {
    if (source < 0 || source >= graph.n)
        throw std::out_of_range("Invalid source");
    for (int i = 0; i < graph.n; i++)
        for (int j = 0; j < graph.n; j++)
            if (graph.has[i][j] && graph.weight[i][j] < 0)
                throw std::invalid_argument("Negative weights are not allowed");
    const int infinity = std::numeric_limits<int>::max();
    vector<int> distance(graph.n, infinity);
    vector<bool> settled(graph.n);
    distance[source] = 0;
    for (int step = 0; step < graph.n; step++) {
        int from = -1;
        for (int i = 0; i < graph.n; i++)
            if (!settled[i] && distance[i] != infinity &&
                (from < 0 || distance[i] < distance[from]))
                from = i;
        if (from < 0)
            break;
        settled[from] = true;
        for (int to = 0; to < graph.n; to++)
            if (graph.has[from][to] && !settled[to]) {
                int candidate = distance[from] + graph.weight[from][to];
                if (candidate < distance[to])
                    distance[to] = candidate;
            }
    }
    return distance;
}
// end
