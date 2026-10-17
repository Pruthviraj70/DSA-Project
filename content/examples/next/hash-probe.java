public class Example {
  static class HashTable {
    static class Slot {
      int key, value, state;
      Slot(int k, int v, int s) {
        key = k;
        value = v;
        state = s;
      }
    }
    Slot[] slots = new Slot[8];
    int size = 0;
    int bucket(int key) { return Math.floorMod(key, slots.length); }
    Integer get(int key) {
      int b = bucket(key);
      for (int p = 0; p < slots.length; p++) {
        Slot s = slots[(b + p) % slots.length];
        if (s == null)
          return null;
        if (s.state == 1 && s.key == key)
          return s.value;
      }
      return null;
    }
    void rehash() {
      if (slots.length >= 64)
        throw new IllegalStateException("capacity");
      Slot[] old = slots;
      slots = new Slot[old.length * 2];
      size = 0;
      for (Slot s : old)
        if (s != null && s.state == 1)
          put(s.key, s.value);
    }
    void put(int key, int value) {
      int b = bucket(key), available = -1;
      for (int p = 0; p < slots.length; p++) {
        int at = (b + p) % slots.length;
        Slot s = slots[at];
        if (s != null && s.state == 1 && s.key == key) {
          s.value = value;
          return;
        }
        if ((s == null || s.state == 2) && available < 0)
          available = at;
        if (s == null)
          break;
      }
      if (size >= 32)
        throw new IllegalStateException("entries");
      if ((size + 1) * 4 > slots.length * 3) {
        rehash();
        put(key, value);
        return;
      }
      if (available < 0)
        throw new IllegalStateException("full");
      slots[available] = new Slot(key, value, 1);
      size++;
    }
    boolean delete(int key) {
      int b = bucket(key);
      for (int p = 0; p < slots.length; p++) {
        Slot s = slots[(b + p) % slots.length];
        if (s == null)
          return false;
        if (s.state == 1 && s.key == key) {
          s.state = 2;
          size--;
          return true;
        }
      }
      return false;
    }
  }
}
