import java.util.ArrayList;
import java.util.List;
public class Example {
  static class HashTable {
    static class Entry {
      int key, value;
      Entry(int k, int v) {
        key = k;
        value = v;
      }
    }
    List<List<Entry>> buckets;
    int size = 0;
    HashTable() { buckets = empty(8); }
    static List<List<Entry>> empty(int n) {
      List<List<Entry>> b = new ArrayList<>();
      for (int i = 0; i < n; i++)
        b.add(new ArrayList<>());
      return b;
    }
    int bucket(int key) { return Math.floorMod(key, buckets.size()); }
    Integer get(int key) {
      for (Entry e : buckets.get(bucket(key)))
        if (e.key == key)
          return e.value;
      return null;
    }
    void rehash() {
      if (buckets.size() >= 64)
        throw new IllegalStateException("capacity");
      List<List<Entry>> old = buckets;
      buckets = empty(old.size() * 2);
      for (List<Entry> chain : old)
        for (Entry e : chain)
          buckets.get(bucket(e.key)).add(e);
    }
    void put(int key, int value) {
      for (Entry e : buckets.get(bucket(key)))
        if (e.key == key) {
          e.value = value;
          return;
        }
      if (size >= 32)
        throw new IllegalStateException("entries");
      if ((size + 1) * 4 > buckets.size() * 3)
        rehash();
      buckets.get(bucket(key)).add(new Entry(key, value));
      size++;
    }
    boolean delete(int key) {
      List<Entry> chain = buckets.get(bucket(key));
      for (int i = 0; i < chain.size(); i++)
        if (chain.get(i).key == key) {
          chain.remove(i);
          size--;
          return true;
        }
      return false;
    }
  }
}
