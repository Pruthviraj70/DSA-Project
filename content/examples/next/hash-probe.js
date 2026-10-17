class HashTable {
  constructor() {
    this.slots = Array(8).fill(null);
    this.tombstone = Symbol("deleted");
    this.size = 0;
  }
  bucket(key) {
    const c = this.slots.length;
    return ((key % c) + c) % c;
  }
  get(key) {
    const b = this.bucket(key),
      c = this.slots.length;
    for (let p = 0; p < c; p++) {
      const e = this.slots[(b + p) % c];
      if (e === null) return null;
      if (e !== this.tombstone && e.key === key) return e.value;
    }
    return null;
  }
  rehash() {
    if (this.slots.length >= 64) throw new RangeError("capacity");
    const old = this.slots;
    this.slots = Array(old.length * 2).fill(null);
    this.size = 0;
    for (const e of old)
      if (e !== null && e !== this.tombstone) this.put(e.key, e.value);
  }
  put(key, value) {
    const b = this.bucket(key),
      c = this.slots.length;
    let available = -1;
    for (let p = 0; p < c; p++) {
      const at = (b + p) % c,
        e = this.slots[at];
      if (e !== null && e !== this.tombstone && e.key === key) {
        e.value = value;
        return;
      }
      if ((e === null || e === this.tombstone) && available < 0) available = at;
      if (e === null) break;
    }
    if (this.size >= 32) throw new RangeError("entries");
    if ((this.size + 1) * 4 > c * 3) {
      this.rehash();
      this.put(key, value);
      return;
    }
    if (available < 0) throw new RangeError("full");
    this.slots[available] = { key, value };
    this.size++;
  }
  delete(key) {
    const b = this.bucket(key),
      c = this.slots.length;
    for (let p = 0; p < c; p++) {
      const at = (b + p) % c,
        e = this.slots[at];
      if (e === null) return false;
      if (e !== this.tombstone && e.key === key) {
        this.slots[at] = this.tombstone;
        this.size--;
        return true;
      }
    }
    return false;
  }
}
