#include <limits.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#define CAPACITY 32
#define VERTICES 16
/* shared:list */
typedef struct Node {
    int value;
    struct Node *next;
} Node;
void list_free(Node *head) {
    while (head) {
        Node *next = head->next;
        free(head);
        head = next;
    }
}
/* shared:tree */
typedef struct Tree {
    int value;
    struct Tree *left, *right;
} Tree;
void tree_free(Tree *root) {
    if (root) {
        tree_free(root->left);
        tree_free(root->right);
        free(root);
    }
}
/* shared:sequence */
typedef struct {
    int data[CAPACITY];
    int size;
} Sequence;
/* shared:circular */
typedef struct {
    int data[CAPACITY];
    int head, size;
} CircularQueue;
/* shared:graph */
typedef struct {
    int n;
    bool directed;
    bool has[VERTICES][VERTICES];
    int weight[VERTICES][VERTICES];
} Graph;
/* example:countdown */
void countdown(int n) {
    if (n <= 0)
        return; /* Base case: no smaller task remains. */
    countdown(n - 1);
}
/* example:array-create */
bool array_create(Sequence *sequence, const int values[], int n) {
    if (n < 0 || n > CAPACITY)
        return false;
    sequence->size = n;
    for (int i = 0; i < n; i++)
        sequence->data[i] = values[i];
    return true;
}
/* example:array-access */
bool array_access(const int data[], int n, int index, int *result) {
    if (index < 0 || index >= n)
        return false;
    *result = data[index];
    return true;
}
/* example:array-update */
bool array_update(int data[], int n, int index, int value) {
    if (index < 0 || index >= n)
        return false;
    data[index] = value;
    return true;
}
/* example:array-traverse */
void array_traverse(const int data[], int n) {
    for (int i = 0; i < n; i++)
        printf("%d ", data[i]);
}
/* example:array-insert */
bool array_insert(int data[], int *length, int capacity, int index, int value) {
    if (index < 0 || index > *length || *length >= capacity)
        return false;
    for (int i = *length; i > index; i--)
        data[i] = data[i - 1];
    data[index] = value;
    (*length)++;
    return true;
}
/* example:array-insert-copy */
int *array_insert_copy(const int data[], int n, int index, int value) {
    if (n < 0 || index < 0 || index > n)
        return NULL;
    int *result = malloc((size_t)(n + 1) * sizeof *result);
    if (!result)
        return NULL;
    for (int i = 0; i < index; i++)
        result[i] = data[i];
    result[index] = value;
    for (int i = index; i < n; i++)
        result[i + 1] = data[i];
    return result; /* Caller owns n+1 elements and must free(result). */
}
/* example:array-delete */
bool array_delete(int data[], int *length, int index, int *removed) {
    if (index < 0 || index >= *length)
        return false;
    *removed = data[index];
    for (int i = index; i + 1 < *length; i++)
        data[i] = data[i + 1];
    (*length)--;
    return true;
}
/* example:linear-search */
int linear_search(const int data[], int n, int target) {
    for (int i = 0; i < n; i++)
        if (data[i] == target)
            return i;
    return -1;
}
/* example:binary-search */
int binary_search(const int data[], int n, int target) {
    int lo = 0, hi = n - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (data[mid] == target)
            return mid;
        if (data[mid] < target)
            lo = mid + 1;
        else
            hi = mid - 1;
    }
    return -1;
}
/* example:binary-search-recursive */
int binary_search_range(const int data[], int lo, int hi, int target) {
    if (lo > hi)
        return -1;
    int mid = lo + (hi - lo) / 2;
    if (data[mid] == target)
        return mid;
    if (data[mid] < target)
        return binary_search_range(data, mid + 1, hi, target);
    return binary_search_range(data, lo, mid - 1, target);
}
int binary_search_recursive(const int data[], int n, int target) {
    return binary_search_range(data, 0, n - 1, target);
}
/* example:binary-first */
int binary_first(const int data[], int n, int target) {
    int lo = 0, hi = n - 1, found = -1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (data[mid] >= target) {
            if (data[mid] == target)
                found = mid;
            hi = mid - 1;
        } else
            lo = mid + 1;
    }
    return found;
}
/* example:insertion-sort */
void insertion_sort(int data[], int n) {
    for (int i = 1; i < n; i++) {
        int key = data[i], j = i - 1;
        while (j >= 0 && data[j] > key) {
            data[j + 1] = data[j];
            j--;
        }
        data[j + 1] = key;
    }
}
/* example:merge-sort */
bool merge_sort(int data[], int n) {
    if (n < 2)
        return true;
    int *buffer = malloc((size_t)n * sizeof *buffer);
    if (!buffer)
        return false;
    for (int width = 1; width < n; width *= 2) {
        for (int start = 0; start < n; start += 2 * width) {
            int mid = start + width < n ? start + width : n;
            int end = start + 2 * width < n ? start + 2 * width : n;
            int left = start, right = mid, out = start;
            while (left < mid || right < end) {
                if (right == end || (left < mid && data[left] <= data[right]))
                    buffer[out++] = data[left++];
                else
                    buffer[out++] = data[right++];
            }
            for (int i = start; i < end; i++)
                data[i] = buffer[i];
        }
    }
    free(buffer);
    return true;
}
/* example:merge-sort-recursive */
void merge_range(int data[], int buffer[], int lo, int hi) {
    if (hi - lo < 2)
        return;
    int mid = lo + (hi - lo) / 2;
    merge_range(data, buffer, lo, mid);
    merge_range(data, buffer, mid, hi);
    int left = lo, right = mid, out = lo;
    while (left < mid || right < hi) {
        if (right == hi || (left < mid && data[left] <= data[right]))
            buffer[out++] = data[left++];
        else
            buffer[out++] = data[right++];
    }
    for (int i = lo; i < hi; i++)
        data[i] = buffer[i];
}
bool merge_sort_recursive(int data[], int n) {
    if (n < 2)
        return true;
    int *buffer = malloc((size_t)n * sizeof *buffer);
    if (!buffer)
        return false;
    merge_range(data, buffer, 0, n);
    free(buffer);
    return true;
}
/* example:quick-sort */
void quick_sort_range(int data[], int lo, int hi) {
    if (lo >= hi)
        return;
    int pivot = data[hi], boundary = lo;
    for (int j = lo; j < hi; j++)
        if (data[j] <= pivot) {
            int value = data[boundary];
            data[boundary++] = data[j];
            data[j] = value;
        }
    int value = data[boundary];
    data[boundary] = data[hi];
    data[hi] = value;
    quick_sort_range(data, lo, boundary - 1);
    quick_sort_range(data, boundary + 1, hi);
}
void quick_sort(int data[], int n) { quick_sort_range(data, 0, n - 1); }
/* example:list-insert */
bool list_insert(Node **head, int index, int value) {
    if (index < 0)
        return false;
    Node **link = head;
    for (int i = 0; i < index; i++) {
        if (!*link)
            return false;
        link = &(*link)->next;
    }
    Node *node = malloc(sizeof *node);
    if (!node)
        return false;
    node->value = value;
    node->next = *link;
    *link = node;
    return true;
}
/* example:list-delete */
bool list_delete(Node **head, int index, int *removed) {
    if (index < 0)
        return false;
    Node **link = head;
    for (int i = 0; i < index; i++) {
        if (!*link)
            return false;
        link = &(*link)->next;
    }
    if (!*link)
        return false;
    Node *old = *link;
    *removed = old->value;
    *link = old->next;
    free(old);
    return true;
}
/* example:list-search */
const Node *list_search(const Node *head, int target) {
    for (const Node *node = head; node; node = node->next)
        if (node->value == target)
            return node;
    return NULL;
}
/* example:list-traverse */
void list_traverse(const Node *head) {
    for (const Node *node = head; node; node = node->next)
        printf("%d ", node->value);
}
/* example:stack-push */
bool stack_push(Sequence *stack, int value) {
    if (stack->size == CAPACITY)
        return false;
    stack->data[stack->size++] = value;
    return true;
}
/* example:stack-pop */
bool stack_pop(Sequence *stack, int *value) {
    if (stack->size == 0)
        return false;
    *value = stack->data[--stack->size];
    return true;
}
/* example:stack-peek */
bool stack_peek(const Sequence *stack, int *value) {
    if (stack->size == 0)
        return false;
    *value = stack->data[stack->size - 1];
    return true;
}
/* example:queue-enqueue */
bool queue_enqueue(Sequence *queue, int value) {
    if (queue->size == CAPACITY)
        return false;
    queue->data[queue->size++] = value;
    return true;
}
/* example:queue-dequeue */
bool queue_dequeue(Sequence *queue, int *value) {
    if (queue->size == 0)
        return false;
    *value = queue->data[0];
    for (int i = 1; i < queue->size; i++)
        queue->data[i - 1] = queue->data[i];
    queue->size--;
    return true;
}
/* example:queue-inspect */
bool queue_inspect(const Sequence *queue, int *value) {
    if (queue->size == 0)
        return false;
    *value = queue->data[0];
    return true;
}
/* example:circular-queue */
bool circular_enqueue(CircularQueue *queue, int value) {
    if (queue->size == CAPACITY)
        return false;
    int back = (queue->head + queue->size) % CAPACITY;
    queue->data[back] = value;
    queue->size++;
    return true;
}
bool circular_dequeue(CircularQueue *queue, int *value) {
    if (queue->size == 0)
        return false;
    *value = queue->data[queue->head];
    queue->head = (queue->head + 1) % CAPACITY;
    queue->size--;
    return true;
}
/* example:bst-insert */
Tree *bst_insert(Tree *root, int value) {
    if (!root) {
        Tree *node = calloc(1, sizeof *node);
        if (node)
            node->value = value;
        return node;
    }
    if (value < root->value)
        root->left = bst_insert(root->left, value);
    else if (value > root->value)
        root->right = bst_insert(root->right, value);
    return root;
}
/* example:bst-search */
const Tree *bst_search(const Tree *root, int value) {
    while (root && root->value != value)
        root = value < root->value ? root->left : root->right;
    return root;
}
/* example:bst-delete */
Tree *bst_delete(Tree *root, int value) {
    if (!root)
        return NULL;
    if (value < root->value)
        root->left = bst_delete(root->left, value);
    else if (value > root->value)
        root->right = bst_delete(root->right, value);
    else {
        if (!root->left || !root->right) {
            Tree *child = root->left ? root->left : root->right;
            free(root);
            return child;
        }
        Tree *successor = root->right;
        while (successor->left)
            successor = successor->left;
        root->value = successor->value;
        root->right = bst_delete(root->right, successor->value);
    }
    return root;
}
/* example:bst-inorder */
void bst_inorder(const Tree *root) {
    if (!root)
        return;
    bst_inorder(root->left);
    printf("%d ", root->value);
    bst_inorder(root->right);
}
/* example:bst-preorder */
void bst_preorder(const Tree *root) {
    if (!root)
        return;
    printf("%d ", root->value);
    bst_preorder(root->left);
    bst_preorder(root->right);
}
/* example:bst-postorder */
void bst_postorder(const Tree *root) {
    if (!root)
        return;
    bst_postorder(root->left);
    bst_postorder(root->right);
    printf("%d ", root->value);
}
/* example:graph-create */
bool graph_create(Graph *graph, int n, bool directed) {
    if (n < 0 || n > VERTICES)
        return false;
    *graph = (Graph){.n = n, .directed = directed};
    return true;
}
bool graph_set_edge(Graph *graph, int from, int to, int weight) {
    if (from < 0 || to < 0 || from >= graph->n || to >= graph->n || weight < -100000 ||
        weight > 100000)
        return false;
    graph->has[from][to] = true;
    graph->weight[from][to] = weight;
    if (!graph->directed) {
        graph->has[to][from] = true;
        graph->weight[to][from] = weight;
    }
    return true;
}
bool graph_remove_edge(Graph *graph, int from, int to) {
    if (from < 0 || to < 0 || from >= graph->n || to >= graph->n)
        return false;
    graph->has[from][to] = false;
    if (!graph->directed)
        graph->has[to][from] = false;
    return true;
}
int graph_add_vertex(Graph *graph) {
    if (graph->n == VERTICES)
        return -1;
    return graph->n++; /* Newly exposed row/column was cleared by creation/removal. */
}
bool graph_remove_vertex(Graph *graph, int at) {
    if (at < 0 || at >= graph->n)
        return false;
    for (int i = at; i + 1 < graph->n; i++)
        for (int j = 0; j < graph->n; j++) {
            graph->has[i][j] = graph->has[i + 1][j];
            graph->weight[i][j] = graph->weight[i + 1][j];
        }
    for (int j = at; j + 1 < graph->n; j++)
        for (int i = 0; i + 1 < graph->n; i++) {
            graph->has[i][j] = graph->has[i][j + 1];
            graph->weight[i][j] = graph->weight[i][j + 1];
        }
    graph->n--;
    for (int i = 0; i < VERTICES; i++) {
        graph->has[graph->n][i] = graph->has[i][graph->n] = false;
        graph->weight[graph->n][i] = graph->weight[i][graph->n] = 0;
    }
    return true;
}
/* example:bfs */
int bfs(const Graph *graph, int source, int order[]) {
    if (source < 0 || source >= graph->n)
        return -1;
    bool seen[VERTICES] = {false};
    int queue[VERTICES], head = 0, tail = 0, count = 0;
    queue[tail++] = source;
    seen[source] = true;
    while (head < tail) {
        int from = queue[head++];
        order[count++] = from;
        for (int to = 0; to < graph->n; to++)
            if (graph->has[from][to] && !seen[to]) {
                seen[to] = true;
                queue[tail++] = to;
            }
    }
    return count;
}
/* example:bfs-list */
int bfs_list(const int neighbors[VERTICES][VERTICES], const int degrees[], int n, int source,
             int order[]) {
    if (n < 0 || n > VERTICES || source < 0 || source >= n)
        return -1;
    bool seen[VERTICES] = {false};
    int queue[VERTICES], head = 0, tail = 0, count = 0;
    queue[tail++] = source;
    seen[source] = true;
    while (head < tail) {
        int from = queue[head++];
        order[count++] = from;
        for (int j = 0; j < degrees[from]; j++) {
            int to = neighbors[from][j];
            if (!seen[to]) {
                seen[to] = true;
                queue[tail++] = to;
            }
        }
    }
    return count;
}
/* example:dfs */
int dfs(const Graph *graph, int source, int order[]) {
    if (source < 0 || source >= graph->n)
        return -1;
    bool seen[VERTICES] = {false};
    int path[VERTICES], next[VERTICES] = {0}, size = 0, count = 0;
    path[size++] = source;
    seen[source] = true;
    order[count++] = source;
    while (size) {
        int from = path[size - 1];
        while (next[from] < graph->n && (!graph->has[from][next[from]] || seen[next[from]]))
            next[from]++;
        if (next[from] == graph->n)
            size--;
        else {
            int to = next[from]++;
            seen[to] = true;
            order[count++] = to;
            path[size++] = to;
        }
    }
    return count;
}
/* example:dijkstra */
bool dijkstra(const Graph *graph, int source, int distance[]) {
    if (source < 0 || source >= graph->n)
        return false;
    for (int i = 0; i < graph->n; i++)
        for (int j = 0; j < graph->n; j++)
            if (graph->has[i][j] && graph->weight[i][j] < 0)
                return false;
    bool settled[VERTICES] = {false};
    for (int i = 0; i < graph->n; i++)
        distance[i] = INT_MAX;
    distance[source] = 0;
    for (int step = 0; step < graph->n; step++) {
        int from = -1;
        for (int i = 0; i < graph->n; i++)
            if (!settled[i] && distance[i] != INT_MAX &&
                (from < 0 || distance[i] < distance[from]))
                from = i;
        if (from < 0)
            break;
        settled[from] = true;
        for (int to = 0; to < graph->n; to++)
            if (graph->has[from][to] && !settled[to]) {
                int candidate = distance[from] + graph->weight[from][to];
                if (candidate < distance[to])
                    distance[to] = candidate;
            }
    }
    return true;
}
/* end */
