import type { Input, EngineEvent, Reply, Request } from "./protocol";
export class EngineClient {
  private worker: Worker;
  private serial = 0;
  private closed = false;
  private pending = new Map<
    number,
    { resolve: (reply: Reply) => void; reject: (error: Error) => void }
  >();
  constructor() {
    this.worker = new Worker(new URL("./engine.worker.ts", import.meta.url), {
      type: "module",
    });
    this.worker.onmessage = ({ data }: { data: Reply }) => {
      const p = this.pending.get(data.id);
      if (p) {
        this.pending.delete(data.id);
        data.error ? p.reject(Error(data.error)) : p.resolve(data);
      }
    };
    this.worker.onerror = () =>
      this.close("Engine worker failed to load; build WebAssembly first.");
  }
  private request(
    request:
      | Omit<Extract<Request, { type: "init" }>, "id">
      | Omit<Extract<Request, { type: "advance" }>, "id">,
  ): Promise<Reply> {
    if (this.closed) return Promise.reject(Error("Worker cancelled"));
    const id = ++this.serial;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.worker.postMessage({ ...request, id });
    });
  }
  async init(input: Input): Promise<EngineEvent> {
    return (await this.request({ type: "init", input })).events[0];
  }
  async advance(limit = 1) {
    return this.request({ type: "advance", limit });
  }
  close(reason = "Worker cancelled") {
    if (this.closed) return;
    this.closed = true;
    this.worker.terminate();
    for (const p of this.pending.values()) p.reject(Error(reason));
    this.pending.clear();
  }
}
