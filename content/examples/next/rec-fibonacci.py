def fibonacci(n):
    if not 0 <= n <= 10:
        raise ValueError("n")
    if n <= 1:
        return n
    first = fibonacci(n - 1)
    second = fibonacci(n - 2)
    return first + second
