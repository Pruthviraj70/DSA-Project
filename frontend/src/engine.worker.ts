/// <reference lib="webworker" />
import type { Request, Reply, Wasm, EngineEvent } from "./protocol";
const scope = self as unknown as DedicatedWorkerGlobalScope;
let engine: Wasm | undefined;
let queue = Promise.resolve();
let family = "";
scope.onmessage = ({ data }: { data: Request }) => {
  queue = queue.then(async () => {
    const reply: Reply = { id: data.id, events: [], done: false };
    try {
      const wanted =
        data.type === "init"
          ? data.input.module >= 15
            ? "next"
            : "engine"
          : family;
      if (engine && wanted !== family) {
        engine.ccall("engine_free", "number", [], []);
        engine = undefined;
      }
      if (!engine) {
        family = wanted;
        const url = new URL(`/engine/${family}.js`, scope.location.origin).href;
        const { default: create } = await import(/* @vite-ignore */ url);
        engine = (await create({
          locateFile: (name: string) => `/engine/${name}`,
        })) as Wasm;
      }
      const call = (name: string, args: number[] = []) =>
        engine!.ccall(
          name,
          "number",
          args.map(() => "number"),
          args,
        ) as number;
      const error = () => engine!.UTF8ToString(call("engine_error"));
      if (data.type === "init") {
        const x = data.input;
        if (
          !call("engine_config", [
            x.module,
            x.op,
            x.values.length,
            x.arg,
            x.index,
            +x.directed,
          ])
        )
          throw Error(error());
        for (const [i, v] of x.values.entries())
          if (!call("engine_value", [i, v])) throw Error(error());
        if (!call("engine_graph_weight", [x.weight ?? 1])) throw Error(error());
        for (const edge of x.edges)
          if (!call("engine_edge", [edge.from, edge.to, edge.weight]))
            throw Error(error());
        if (!call("engine_start")) throw Error(error());
        reply.events.push(
          JSON.parse(engine!.UTF8ToString(call("engine_state"))) as EngineEvent,
        );
      } else {
        const limit = Math.max(1, Math.min(32, Math.trunc(data.limit) || 1));
        for (let i = 0; i < limit; i++) {
          const pointer = call("engine_next");
          if (!pointer) {
            reply.done = true;
            if (error()) throw Error(error());
            break;
          }
          const event = JSON.parse(
            engine!.UTF8ToString(pointer),
          ) as EngineEvent;
          reply.events.push(event);
          if (event.done) {
            reply.done = true;
            break;
          }
        }
      }
    } catch (error) {
      reply.error = error instanceof Error ? error.message : String(error);
      reply.done = true;
    }
    scope.postMessage(reply);
  });
};
