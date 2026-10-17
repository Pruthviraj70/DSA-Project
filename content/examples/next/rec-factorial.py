def factorial(n):
    if not 0 <= n <= 12:
        raise ValueError("n")
    return 1 if n <= 1 else n * factorial(n - 1)
