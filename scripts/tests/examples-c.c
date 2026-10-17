#include "../../content/examples/examples.c"
#include <assert.h>
#include <string.h>
int main(void) {
    int a[32] = {3, 1, 3, -2}, n = 4, x = 0;
    Sequence created = {0};
    assert(array_create(&created, a, n) && created.size == n && created.data[0] == 3);
    created.data[0] = 99;
    assert(a[0] == 3);
    assert(!array_create(&created, a, 33));
    assert(array_access(a, n, 0, &x) && x == 3);
    assert(!array_access(a, n, n, &x));
    assert(array_update(a, n, 1, 7));
    assert(array_insert(a, &n, 32, 0, 9));
    assert(array_delete(a, &n, 0, &x) && x == 9 && n == 4);
    assert(!array_delete(a, &n, 8, &x));
    int *copy = array_insert_copy(a, n, n, 10);
    assert(copy && copy[n] == 10 && n == 4);
    free(copy);
    for (int mode = 0; mode < 4; mode++) {
        int b[] = {3, 1, 3, -2};
        if (mode == 0)
            insertion_sort(b, 4);
        if (mode == 1)
            assert(merge_sort(b, 4));
        if (mode == 2)
            assert(merge_sort_recursive(b, 4));
        if (mode == 3)
            quick_sort(b, 4);
        int expected[] = {-2, 1, 3, 3};
        assert(!memcmp(b, expected, sizeof b));
        assert(binary_search(b, 4, 1) == 1 && binary_search_recursive(b, 4, 1) == 1);
        assert(binary_first(b, 4, 3) == 2 && linear_search(b, 4, 8) == -1);
    }
    assert(binary_search(a, 0, 1) == -1);
    assert(merge_sort(a, 0));
    quick_sort(a, 0);
    Node *head = NULL;
    assert(!list_delete(&head, 0, &x));
    assert(list_insert(&head, 0, 4));
    assert(list_insert(&head, 1, 9));
    assert(list_search(head, 9)->value == 9);
    assert(list_delete(&head, 0, &x) && x == 4 && head->value == 9);
    list_free(head);
    Sequence stack = {0}, queue = {0};
    assert(!stack_pop(&stack, &x) && !queue_dequeue(&queue, &x));
    assert(stack_push(&stack, 2) && stack_push(&stack, 3) && stack_peek(&stack, &x) && x == 3 &&
           stack_pop(&stack, &x) && x == 3);
    assert(queue_enqueue(&queue, 2) && queue_enqueue(&queue, 3) && queue_inspect(&queue, &x) &&
           x == 2 && queue_dequeue(&queue, &x) && x == 2);
    CircularQueue ring = {0};
    for (int i = 0; i < 70; i++) {
        assert(circular_enqueue(&ring, i));
        assert(circular_dequeue(&ring, &x) && x == i);
    }
    Tree *root = NULL;
    int keys[] = {10, 5, 20, 15, 17, 10};
    for (int i = 0; i < 6; i++)
        root = bst_insert(root, keys[i]);
    root = bst_delete(root, 10);
    assert(!bst_search(root, 10) && bst_search(root, 17));
    root = bst_delete(root, 20);
    root = bst_delete(root, 5);
    tree_free(root);
    Graph g;
    int order[16], dist[16];
    assert(graph_create(&g, 4, false));
    assert(graph_set_edge(&g, 0, 1, 0) && graph_set_edge(&g, 1, 2, 3));
    assert(bfs(&g, 0, order) == 3 && order[0] == 0 && order[2] == 2);
    assert(dfs(&g, 0, order) == 3);
    assert(dijkstra(&g, 0, dist) && dist[2] == 3 && dist[3] == INT_MAX);
    assert(graph_set_edge(&g, 2, 3, -1) && !dijkstra(&g, 0, dist));
    assert(graph_remove_vertex(&g, 1) && g.n == 3);
    assert(graph_add_vertex(&g) == 3 && !g.has[3][2]);
    countdown(5);
    puts("C example behavior passed");
}
