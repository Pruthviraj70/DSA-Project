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
    const request = indexedDB.open("dsa-learning-lab", 3);
    request.onupgradeneeded = () => {
      for (const [name, keyPath] of [
        ["checkpoints", "key"],
        ["experiments", "id"],
        ["slides", "key"],
        ["positions", "key"],
        ["practice", "key"],
        ["modules", "key"],
        ["merges", "key"],
      ])
        if (!request.result.objectStoreNames.contains(name))
          request.result.createObjectStore(name, { keyPath });
    };
    request.onblocked = () =>
      reject(
        Error(
          "Close other Learning Lab tabs and refresh to update local progress.",
        ),
      );
    request.onsuccess = () => {
      request.result.onversionchange = () => request.result.close();
      resolve(request.result);
    };
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

export interface ModuleProgress {
  key: string;
  owner: string;
  moduleId: string;
  generation: number;
  manualCompleted: boolean;
  stamp: string;
  pending: boolean;
  action?: { completed: boolean; generation: number; actionId: string };
}
export interface SlideCheckpoint {
  key: string;
  owner: string;
  moduleId: string;
  slideId: string;
  completed: boolean;
  generation?: number;
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
  modules: () =>
    transact<ModuleProgress[]>("modules", "readonly", (s) => s.getAll()),
  async putModule(row: ModuleProgress, remote = false) {
    const database = await db();
    return new Promise<void>((resolve, reject) => {
      const tx = database.transaction("modules", "readwrite"),
        store = tx.objectStore("modules"),
        r = store.get(row.key);
      r.onsuccess = () => {
        if (!remote || !r.result?.pending) store.put(row);
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
  async acknowledgeModule(
    row: ModuleProgress,
    result: { generation: number; manualCompleted: boolean },
  ) {
    const database = await db();
    return new Promise<void>((resolve, reject) => {
      const tx = database.transaction("modules", "readwrite"),
        store = tx.objectStore("modules"),
        r = store.get(row.key);
      r.onsuccess = () => {
        if (r.result?.stamp === row.stamp)
          store.put({ ...row, ...result, pending: false, action: undefined });
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

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
    generation = 0,
  ) {
    const database = await db();
    const stamp = crypto.randomUUID();
    return new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(
        ["slides", "positions"],
        "readwrite",
      );
      const store = transaction.objectStore("slides");
      const key = generation
        ? `${owner}:${moduleId}:${slideId}:${generation}`
        : `${owner}:${moduleId}:${slideId}`;
      const request = store.get(key);
      request.onsuccess = () =>
        store.put({
          key,
          owner,
          moduleId,
          slideId,
          completed: completed || !!request.result?.completed,
          generation,
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
    const states = await this.modules();
    const guestState = states.find(
      (x) => x.owner === "guest" && x.moduleId === "foundations",
    );
    const accountState = states.find(
      (x) => x.owner === owner && x.moduleId === "foundations",
    );
    // Import each guest update once per account. A reset does not resurrect acknowledged guest activity.
    const imports = await transact<{ key: string; stamp: string }[]>(
      "merges",
      "readonly",
      (s) => s.getAll(),
    );
    const seen = new Map(imports.map((x) => [x.key, x.stamp]));
    for (const row of (await this.slides()).filter(
      (x) => x.owner === "guest",
    )) {
      if (
        (row.generation ?? 0) !==
        (row.moduleId === "foundations" ? (guestState?.generation ?? 0) : 0)
      )
        continue;
      const key = `${owner}:${row.key}`;
      if (seen.get(key) === row.stamp) continue;
      await this.checkpoint(
        owner,
        row.moduleId,
        row.slideId,
        row.completed,
        false,
        true,
        row.moduleId === "foundations" ? (accountState?.generation ?? 0) : 0,
      );
      await transact("merges", "readwrite", (s) =>
        s.put({ key, stamp: row.stamp }),
      );
    }
    if (
      guestState?.manualCompleted &&
      seen.get(`${owner}:manual-foundations`) !== guestState.stamp
    ) {
      const generation = accountState?.generation ?? 0;
      const stamp = crypto.randomUUID();
      await this.putModule({
        key: `${owner}:foundations`,
        owner,
        moduleId: "foundations",
        generation,
        manualCompleted: true,
        pending: true,
        stamp,
        action: { completed: true, generation, actionId: stamp },
      });
      await transact("merges", "readwrite", (s) =>
        s.put({ key: `${owner}:manual-foundations`, stamp: guestState.stamp }),
      );
    }
  },
  loadPractice: (owner: string, moduleId: string) =>
    transact<
      | { answers: Record<string, string>; result: unknown; retrying?: boolean }
      | undefined
    >("practice", "readonly", (s) => s.get(`${owner}:${moduleId}`)),
  async beginPracticeRetry(owner: string, moduleId: string) {
    const database = await db();
    return new Promise<void>((resolve, reject) => {
      const tx = database.transaction("practice", "readwrite"),
        store = tx.objectStore("practice"),
        key = `${owner}:${moduleId}`,
        request = store.get(key);
      request.onsuccess = () =>
        store.put({ ...request.result, key, retrying: true });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
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
