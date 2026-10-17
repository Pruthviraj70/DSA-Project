import type { Input } from "./protocol";
export interface Checkpoint {
  key: string;
  owner: string;
  moduleId: string;
  completion: number;
}
export interface LocalExperiment {
  id: string;
  owner: string;
  title: string;
  moduleId: string;
  input: Input;
  configuration: { speed: number };
  engineVersion: string;
  createdAt: string;
}
let database: Promise<IDBDatabase> | undefined;
function db() {
  return (database ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("dsa-learning-lab", 2);
    request.onupgradeneeded = () => {
      for (const [name, keyPath] of [
        ["checkpoints", "key"],
        ["experiments", "id"],
        ["slides", "key"],
        ["positions", "key"],
        ["practice", "key"],
      ])
        if (!request.result.objectStoreNames.contains(name))
          request.result.createObjectStore(name, { keyPath });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  }));
}
async function transact<T>(
  store: string,
  mode: IDBTransactionMode,
  operation: (s: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const database = await db();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(store, mode);
    const r = operation(transaction.objectStore(store));
    let result: T;
    r.onsuccess = () => {
      result = r.result;
    };
    transaction.oncomplete = () => resolve(result);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () =>
      reject(transaction.error ?? Error("Local storage transaction aborted"));
  });
}
export const storage = {
  checkpoints: () =>
    transact<Checkpoint[]>("checkpoints", "readonly", (s) => s.getAll()),
  async checkpoint(owner: string, moduleId: string, completion: number) {
    const database = await db();
    const key = `${owner}:${moduleId}`;
    return new Promise<void>((resolve, reject) => {
      const transaction = database.transaction("checkpoints", "readwrite");
      const store = transaction.objectStore("checkpoints");
      const request = store.get(key);
      request.onsuccess = () =>
        store.put({
          key,
          owner,
          moduleId,
          completion: Math.max(request.result?.completion ?? 0, completion),
        });
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () =>
        reject(transaction.error ?? Error("Checkpoint save aborted"));
    });
  },
  async acknowledge(key: string, completion: number) {
    const database = await db();
    return new Promise<void>((resolve, reject) => {
      const transaction = database.transaction("checkpoints", "readwrite");
      const store = transaction.objectStore("checkpoints");
      const request = store.get(key);
      request.onsuccess = () => {
        if (request.result && request.result.completion <= completion)
          store.delete(key);
      };
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  },
  experiments: () =>
    transact<LocalExperiment[]>("experiments", "readonly", (s) => s.getAll()),
  saveExperiment: (x: LocalExperiment) =>
    transact("experiments", "readwrite", (s) => s.put(x)),
  removeExperiment: (id: string) =>
    transact("experiments", "readwrite", (s) => s.delete(id)),
};

export interface SlideCheckpoint {
  key: string;
  owner: string;
  moduleId: string;
  slideId: string;
  completed: boolean;
  pending: boolean;
  stamp: string;
}
export interface LessonPosition {
  key: string;
  owner: string;
  moduleId: string;
  slideId: string;
  pending: boolean;
  stamp: string;
}
export const lessonStorage = {
  slides: () =>
    transact<SlideCheckpoint[]>("slides", "readonly", (s) => s.getAll()),
  positions: () =>
    transact<LessonPosition[]>("positions", "readonly", (s) => s.getAll()),
  async checkpoint(
    owner: string,
    moduleId: string,
    slideId: string,
    completed: boolean,
    position = true,
    pending = true,
  ) {
    const database = await db();
    const stamp = crypto.randomUUID();
    return new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(
        ["slides", "positions"],
        "readwrite",
      );
      const store = transaction.objectStore("slides");
      const key = `${owner}:${moduleId}:${slideId}`;
      const request = store.get(key);
      request.onsuccess = () =>
        store.put({
          key,
          owner,
          moduleId,
          slideId,
          completed: completed || !!request.result?.completed,
          pending: pending || !!request.result?.pending,
          stamp,
        });
      if (position) {
        const positions = transaction.objectStore("positions");
        const positionKey = `${owner}:${moduleId}`;
        const previous = positions.get(positionKey);
        previous.onsuccess = () => {
          // A response from an earlier sync must never replace a newer local navigation.
          if (!pending && previous.result?.pending) return;
          positions.put({
            key: positionKey,
            owner,
            moduleId,
            slideId,
            pending,
            stamp,
          });
        };
      }
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () =>
        reject(transaction.error ?? Error("Could not save your place"));
    });
  },
  async acknowledge(
    storeName: "slides" | "positions",
    key: string,
    stamp: string,
  ) {
    const database = await db();
    return new Promise<void>((resolve, reject) => {
      const tx = database.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      const request = store.get(key);
      request.onsuccess = () => {
        if (request.result?.stamp === stamp)
          store.put({ ...request.result, pending: false });
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
  async moveGuestToAccount(owner: string) {
    const existing = new Map(
      (await this.slides())
        .filter((x) => x.owner === owner)
        .map((x) => [`${x.moduleId}:${x.slideId}`, x]),
    );
    for (const row of (await this.slides()).filter(
      (x) => x.owner === "guest",
    )) {
      const old = existing.get(`${row.moduleId}:${row.slideId}`);
      if (!old || (row.completed && !old.completed))
        await this.checkpoint(
          owner,
          row.moduleId,
          row.slideId,
          row.completed,
          false,
          true,
        );
    }
  },
  loadPractice: (owner: string, moduleId: string) =>
    transact<{ answers: Record<string, string>; result: unknown } | undefined>(
      "practice",
      "readonly",
      (s) => s.get(`${owner}:${moduleId}`),
    ),
  savePractice: (
    owner: string,
    moduleId: string,
    answers: unknown,
    result: unknown,
  ) =>
    transact("practice", "readwrite", (s) =>
      s.put({ key: `${owner}:${moduleId}`, answers, result }),
    ),
};
