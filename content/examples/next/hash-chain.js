class HashTable {
  constructor() {
    this.buckets = Array.from({ length: 8 }, () => []);
    this.size = 0;
  }
  bucket(key) {
    const c = this.buckets.length;
    return ((key % c) + c) % c;
  }
  get(key) {
    for (const e of this.buckets[this.bucket(key)])
      if (e.key === key) return e.value;
    return null;
  }
  rehash() {
    if (this.buckets.length >= 64) throw new RangeError("capacity");
    const old = this.buckets;
    this.buckets = Array.from({ length: old.length * 2 }, () => []);
    for (const chain of old)
      for (const e of chain) this.buckets[this.bucket(e.key)].push(e);
  }
  put(key, value) {
    for (const e of this.buckets[this.bucket(key)])
      if (e.key === key) {
        e.value = value;
        return;
      }
    if (this.size >= 32) throw new RangeError("entries");
    if ((this.size + 1) * 4 > this.buckets.length * 3) this.rehash();
    this.buckets[this.bucket(key)].push({ key, value });
    this.size++;
  }
  delete(key) {
    const chain = this.buckets[this.bucket(key)];
    for (let i = 0; i < chain.length; i++)
      if (chain[i].key === key) {
        chain.splice(i, 1);
        this.size--;
        return true;
      }
    return false;
  }
}
