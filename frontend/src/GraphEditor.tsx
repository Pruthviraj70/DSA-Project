import { useState } from "react";
import type { Input } from "./protocol";
import { learnerMessage } from "./learner-messages";
import { EngineClient } from "./engine-client";
export function GraphEditor({
  input,
  onChange,
}: {
  input: Input;
  onChange: (x: Input) => void;
}) {
  const [node, setNode] = useState(5),
    [from, setFrom] = useState(1),
    [to, setTo] = useState(2),
    [weight, setWeight] = useState(1),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function edit(op: number) {
    if (
      [node, from, to, weight].some((x) => !Number.isInteger(x)) ||
      Math.abs(weight) > 100000
    ) {
      setMessage("Node IDs and weights must be integers in range.");
      return;
    }
    setBusy(true);
    setMessage("");
    const client = new EngineClient();
    try {
      let event = await client.init({
        ...input,
        module: 11,
        op,
        arg: op < 3 ? node : to,
        index: from,
        weight,
      });
      while (!event.done) {
        const r = await client.advance(32);
        event = r.events.at(-1) ?? event;
      }
      onChange({
        ...input,
        values: event.data,
        edges: event.edges.map((e) => ({
          from: event.data.indexOf(e.from),
          to: event.data.indexOf(e.to),
          weight: e.weight,
        })),
      });
      setMessage("Graph updated.");
    } catch (e) {
      setMessage(learnerMessage(e));
    } finally {
      client.close();
      setBusy(false);
    }
  }
  return (
    <fieldset disabled={busy} className="graph-editor">
      <legend>Edit the graph</legend>
      <label className="check">
        <input
          type="checkbox"
          checked={input.directed}
          onChange={(e) => onChange({ ...input, directed: e.target.checked })}
        />{" "}
        Directed graph
      </label>
      <div className="inline">
        <label>
          Node ID
          <input
            type="number"
            min="1"
            max="31"
            value={node}
            onChange={(e) => setNode(+e.target.value)}
          />
        </label>
        <button onClick={() => void edit(1)}>Add node</button>
        <button onClick={() => void edit(2)}>Remove node</button>
      </div>
      <div className="inline">
        <label>
          From node
          <input
            type="number"
            value={from}
            onChange={(e) => setFrom(+e.target.value)}
          />
        </label>
        <label>
          To node
          <input
            type="number"
            value={to}
            onChange={(e) => setTo(+e.target.value)}
          />
        </label>
        <label>
          Weight
          <input
            type="number"
            min="-100000"
            max="100000"
            value={weight}
            onChange={(e) => setWeight(+e.target.value)}
          />
        </label>
      </div>
      <div className="inline">
        <button onClick={() => void edit(3)}>Set edge</button>
        <button onClick={() => void edit(4)}>Remove edge</button>
      </div>
      <p className="muted">
        Nodes: {input.values.join(", ") || "none"} · Edges:{" "}
        {input.edges
          .map(
            (e) =>
              `${input.values[e.from]}${input.directed ? "→" : "—"}${input.values[e.to]} (${e.weight})`,
          )
          .join(", ") || "none"}
      </p>
      <p role="status">{busy ? "Updating the graph…" : message}</p>
    </fieldset>
  );
}
