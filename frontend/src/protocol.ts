export interface Input {
  module: number;
  op: number;
  values: number[];
  arg: number;
  index: number;
  directed: boolean;
  weight?: number;
  edges: { from: number; to: number; weight: number }[];
}
export type EventKind =
  | "ready"
  | "compare"
  | "swap"
  | "read"
  | "write"
  | "insert"
  | "delete"
  | "visit"
  | "enqueue"
  | "dequeue"
  | "pointer-update"
  | "relax"
  | "complete";
export interface EngineEvent {
  protocol: 1;
  seq: number;
  kind: EventKind;
  loc: string;
  a: number;
  b: number;
  value: number;
  done: boolean;
  found: number;
  data: number[];
  nodes: {
    id: number;
    value: number;
    next: number;
    left: number;
    right: number;
  }[];
  root: number;
  head: number;
  edges: { id: number; from: number; to: number; weight: number }[];
  dist: (number | null)[];
  frontier: number[];
  variables: Record<string, number>;
  counters: Record<string, number>;
  extended?: {
    left: number;
    right: number;
    logical: number;
    extent: number;
    sum: number;
    result: number;
    best: number;
    capacity: number;
    size: number;
    bucket: number;
    probe: number;
    rehashing: boolean;
    slots: { id: number; state: number; entry: number }[];
    entries: { id: number; key: number; value: number; next: number }[];
    frames: {
      id: number;
      parent: number;
      argument: number;
      lo: number;
      hi: number;
      phase: number;
      saved: number;
    }[];
    calls: {
      id: number;
      parent: number;
      argument: number;
      returned: boolean;
      result: number;
    }[];
  };
}
export type Request =
  | { id: number; type: "init"; input: Input }
  | { id: number; type: "advance"; limit: number };
export interface Reply {
  id: number;
  events: EngineEvent[];
  done: boolean;
  error?: string;
}
export interface Wasm {
  ccall: (
    name: string,
    returnType: string | null,
    argTypes: string[],
    args: number[],
  ) => number | string;
  UTF8ToString: (pointer: number) => string;
}
