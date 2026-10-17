class HashTable:
    TOMBSTONE = object()

    def __init__(self):
        self.slots = [None] * 8
        self.size = 0

    def get(self, key):
        home = key % len(self.slots)
        for probe in range(len(self.slots)):
            entry = self.slots[(home + probe) % len(self.slots)]
            if entry is None:
                return None
            if entry is not self.TOMBSTONE and entry[0] == key:
                return entry[1]
        return None

    def rehash(self):
        if len(self.slots) >= 64:
            raise ValueError("capacity")
        old = self.slots
        self.slots = [None] * (2 * len(old))
        self.size = 0
        for entry in old:
            if entry is not None and entry is not self.TOMBSTONE:
                self.put(*entry)

    def put(self, key, value):
        home, available = key % len(self.slots), -1
        for probe in range(len(self.slots)):
            at = (home + probe) % len(self.slots)
            entry = self.slots[at]
            if entry is not None and entry is not self.TOMBSTONE and entry[0] == key:
                entry[1] = value
                return
            if (entry is None or entry is self.TOMBSTONE) and available < 0:
                available = at
            if entry is None:
                break
        if self.size >= 32:
            raise ValueError("entries")
        if (self.size + 1) * 4 > len(self.slots) * 3:
            self.rehash()
            self.put(key, value)
            return
        if available < 0:
            raise ValueError("full")
        self.slots[available] = [key, value]
        self.size += 1

    def delete(self, key):
        home = key % len(self.slots)
        for probe in range(len(self.slots)):
            at = (home + probe) % len(self.slots)
            entry = self.slots[at]
            if entry is None:
                return False
            if entry is not self.TOMBSTONE and entry[0] == key:
                self.slots[at] = self.TOMBSTONE
                self.size -= 1
                return True
        return False
