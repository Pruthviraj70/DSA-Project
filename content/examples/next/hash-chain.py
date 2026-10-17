class HashTable:
    def __init__(self):
        self.buckets = [[] for _ in range(8)]
        self.size = 0

    def get(self, key):
        for entry in self.buckets[key % len(self.buckets)]:
            if entry[0] == key:
                return entry[1]
        return None  # zero remains a valid stored value

    def rehash(self):
        if len(self.buckets) >= 64:
            raise ValueError("capacity")
        old = self.buckets
        self.buckets = [[] for _ in range(2 * len(old))]
        for chain in old:
            for entry in chain:
                self.buckets[entry[0] % len(self.buckets)].append(entry)

    def put(self, key, value):
        for entry in self.buckets[key % len(self.buckets)]:
            if entry[0] == key:
                entry[1] = value
                return
        if self.size >= 32:
            raise ValueError("entries")
        if (self.size + 1) * 4 > len(self.buckets) * 3:
            self.rehash()
        self.buckets[key % len(self.buckets)].append([key, value])
        self.size += 1

    def delete(self, key):
        chain = self.buckets[key % len(self.buckets)]
        for i, entry in enumerate(chain):
            if entry[0] == key:
                del chain[i]
                self.size -= 1
                return True
        return False
