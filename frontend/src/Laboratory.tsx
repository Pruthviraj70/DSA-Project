import { useState, useEffect } from "react";
import type { Input } from "./protocol";
import { type Module, initialInput, validate } from "./registry";
import { usePlayback } from "./usePlayback";
import { Visualization } from "./Visualization";
import { SourceView } from "./SourceView";
import { GraphEditor } from "./GraphEditor";
import { Assessment } from "./Assessment";
const kinds = [
  "compare",
  "swap",
  "read",
  "write",
  "insert",
  "delete",
  "visit",
  "enqueue",
  "dequeue",
  "pointer-update",
  "relax",
  "complete",
];
export function parseValues(raw: string): number[] {
  if (!raw.trim()) return [];
  const parts = raw.split(",");
  if (parts.some((x) => !x.trim()))
    throw Error("Separate integers with commas; empty entries are not values.");
  return parts.map((x) => Number(x.trim()));
}
export function Laboratory({
  module,
  loaded,
  loadedSpeed,
  authenticated,
  onCheckpoint,
  onSave,
}: {
  module: Module;
  loaded?: Input;
  loadedSpeed?: number;
  authenticated: boolean;
  onCheckpoint: (completion: number) => void;
  onSave: (input: Input, title: string, speed: number) => Promise<void>;
}) {
  const seed = loaded ?? initialInput(module);
  const [input, setInput] = useState(seed),
    [raw, setRaw] = useState(seed.values.join(", ")),
    [lastRun, setLastRun] = useState(seed),
    [error, setError] = useState(""),
    [predictionChoice, setPredictionChoice] = useState("compare"),
    [title, setTitle] = useState(`${module.title} experiment`),
    [saving, setSaving] = useState(false),
    [saveMessage, setSaveMessage] = useState("");
  const playback = usePlayback(() => onCheckpoint(50));
  useEffect(() => {
    playback.setSpeed(loadedSpeed ?? 350);
    void playback.run(seed);
  }, []);
  const event = playback.event;
  async function initialize() {
    try {
      const next = { ...input, values: parseValues(raw) };
      const problem = validate(next);
      if (problem) throw Error(problem);
      setInput(next);
      setLastRun(next);
      setError("");
      await playback.run(next);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  function useResult() {
    if (!event) return;
    let values = event.data;
    if (module.id === "bst") {
      const nodes = new Map(event.nodes.map((n) => [n.id, n]));
      values = [];
      function preorder(id: number) {
        const n = nodes.get(id);
        if (n) {
          values.push(n.value);
          preorder(n.left);
          preorder(n.right);
        }
      }
      preorder(event.root);
    }
    const next = {
      ...input,
      values,
      edges:
        module.engineId >= 11
          ? event.edges.map((e) => ({
              from: values.indexOf(e.from),
              to: values.indexOf(e.to),
              weight: e.weight,
            }))
          : [],
    };
    setInput(next);
    setRaw(values.join(", "));
  }
  function curated(kind: string) {
    const values =
      kind === "empty"
        ? []
        : kind === "duplicates"
          ? module.engineId >= 11
            ? [1, 2, 3]
            : [2, 2, 2, 2]
          : kind === "ordered"
            ? module.engineId >= 11
              ? [1, 2, 3, 4]
              : [1, 2, 3, 4, 5]
            : kind === "reverse"
              ? [5, 4, 3, 2, 1]
              : module.defaultInput.values;
    setRaw(values.join(", "));
    setInput({
      ...input,
      values,
      edges:
        module.engineId >= 11
          ? kind === "example"
            ? module.defaultInput.edges
            : []
          : [],
    });
  }
  return (
    <>
      <header className="module-heading">
        <div>
          <span className="eyebrow">
            {module.category.toUpperCase()} / MODULE{" "}
            {String(module.engineId).padStart(2, "0")}
          </span>
          <h1>{module.title}</h1>
          <p>{module.objectives[0]}</p>
        </div>
        <span className="version">C ENGINE · v{module.version}</span>
      </header>
      <div className="lab-grid">
        <section className="panel input-panel">
          <h2>Your experiment</h2>
          <p className="muted">
            {module.engineId >= 11
              ? "Up to 16 unique node IDs (1–31)."
              : "Up to 32 integers (−100000 to 100000)."}{" "}
            Changes apply on initialization.
          </p>
          <label>
            {module.engineId >= 11 ? "Node IDs" : "Input values"}
            <textarea
              aria-label="Input values"
              value={raw}
              rows={3}
              onChange={(e) => setRaw(e.target.value)}
              spellCheck={false}
            />
          </label>
          <div className="examples" aria-label="Curated edge cases">
            {[
              "example",
              "empty",
              "duplicates",
              "ordered",
              ...(module.engineId < 11 ? ["reverse"] : []),
            ].map((kind) => (
              <button className="chip" key={kind} onClick={() => curated(kind)}>
                {kind === "duplicates" && module.engineId >= 11
                  ? "disconnected"
                  : kind}
              </button>
            ))}
          </div>
          <label>
            Operation
            <select
              aria-label="Operation"
              value={input.op}
              onChange={(e) => setInput({ ...input, op: +e.target.value })}
            >
              {module.operations.map((op, i) => (
                <option value={i} key={op}>
                  {op}
                </option>
              ))}
            </select>
          </label>
          <div className="inline">
            <label>
              {module.engineId >= 12
                ? "Start node ID"
                : module.engineId === 11
                  ? "Node / to ID"
                  : "Value / target"}
              <input
                aria-label="Value or target"
                type="number"
                min="-100000"
                max="100000"
                value={input.arg}
                onChange={(e) => setInput({ ...input, arg: +e.target.value })}
              />
            </label>
            {[1, 7, 11].includes(module.engineId) && (
              <label>
                {module.engineId === 11 ? "From node ID" : "Index (zero-based)"}
                <input
                  aria-label="Index"
                  type="number"
                  value={input.index}
                  onChange={(e) =>
                    setInput({ ...input, index: +e.target.value })
                  }
                />
              </label>
            )}
          </div>
          {module.engineId === 11 && (
            <label>
              New edge weight
              <input
                type="number"
                value={input.weight}
                onChange={(e) =>
                  setInput({ ...input, weight: +e.target.value })
                }
              />
            </label>
          )}
          <button
            className="primary wide"
            disabled={playback.busy}
            onClick={() => void initialize()}
          >
            Initialize experiment
          </button>
          <p className="error" role="alert">
            {error || playback.error}
          </p>
          {module.engineId >= 11 && (
            <GraphEditor
              input={input}
              onChange={(next) => {
                setInput(next);
                setRaw(next.values.join(", "));
                const run = {
                  ...next,
                  op: module.engineId === 11 ? 0 : next.op,
                };
                setLastRun(run);
                void playback.run(run);
              }}
            />
          )}
        </section>
        <section className="panel stage">
          <div className="section-heading">
            <h2>Execution workspace</h2>
            <span
              className={`status ${event?.done ? "complete" : ""}`}
              role="status"
            >
              {playback.busy
                ? "Computing…"
                : event?.done
                  ? "Complete"
                  : playback.playing
                    ? "Playing"
                    : "Paused"}
            </span>
          </div>
          <div className="visualization">
            <Visualization
              module={module}
              event={event}
              directed={lastRun.directed}
            />
          </div>
          <div className="timeline">
            <label>
              Playback position{" "}
              <span>
                {playback.cursor} / {Math.max(0, playback.history.length - 1)}{" "}
                recorded events
              </span>
              <input
                aria-label="Playback position"
                type="range"
                min="0"
                max={Math.max(0, playback.history.length - 1)}
                value={playback.cursor}
                onChange={(e) => playback.seek(+e.target.value)}
                disabled={!!playback.prediction}
              />
            </label>
          </div>
          <div className="playback-controls" aria-label="Playback controls">
            <button
              aria-label="Step backward"
              disabled={
                playback.busy || playback.cursor === 0 || !!playback.prediction
              }
              onClick={() => playback.seek(playback.cursor - 1)}
            >
              ← Back
            </button>
            <button
              className="primary"
              disabled={
                !event ||
                !!playback.error ||
                !!playback.prediction ||
                (playback.done &&
                  playback.cursor === playback.history.length - 1)
              }
              onClick={() => playback.setPlaying(!playback.playing)}
            >
              {playback.playing ? "Pause" : "Play"}
            </button>
            <button
              aria-label="Step forward"
              disabled={
                playback.busy ||
                !event ||
                playback.done ||
                !!playback.prediction
              }
              onClick={() => void playback.step()}
            >
              Step →
            </button>
            <button
              disabled={playback.busy}
              onClick={() => void playback.run(lastRun)}
            >
              Reset
            </button>
            <label className="speed">
              Pace: {playback.speed} ms / event
              <input
                aria-label="Playback speed"
                type="range"
                min="30"
                max="1000"
                step="10"
                value={playback.speed}
                onChange={(e) => playback.setSpeed(+e.target.value)}
              />
            </label>
          </div>
          <p className="event-line" aria-live="polite">
            <strong>{event?.kind ?? "Loading engine"}</strong>{" "}
            <code>{event?.loc}</code>
            {event && event.a >= 0 && (
              <span>
                {" "}
                · a={event.a}, b={event.b}, value={event.value}
              </span>
            )}
          </p>
          <dl className="counters" aria-label="Operation counters">
            {Object.entries(event?.counters ?? {}).map(([name, value]) => (
              <div key={name}>
                <dt>{name}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <p className="muted">
            Counters measure emitted C operations, not animation duration.
            Initial structure construction is excluded.
          </p>
          <details>
            <summary>Relevant variables and state</summary>
            <pre data-testid="engine-state">
              {JSON.stringify(
                {
                  seq: event?.seq,
                  variables: event?.variables,
                  found: event?.found,
                  root: event?.root,
                  head: event?.head,
                  frontier: event?.frontier,
                  dist: event?.dist,
                  data: event?.data,
                  nodes: event?.nodes,
                },
                null,
                2,
              )}
            </pre>
            <p className="muted">
              A found value of −1 means no match yet or no match. List/BST
              results use conceptual node IDs; sequence search uses zero-based
              indices. Frontier IDs are conceptual vertices.
            </p>
          </details>
          <div className="inline">
            <button disabled={!event?.done} onClick={useResult}>
              Use result as next input
            </button>
            <button
              disabled={
                !event || event.done || playback.busy || !!playback.prediction
              }
              onClick={() => void playback.predict()}
            >
              Predict next operation
            </button>
          </div>
          {playback.prediction && (
            <form
              className="prediction"
              onSubmit={(e) => {
                e.preventDefault();
                playback.answer(predictionChoice);
              }}
            >
              <h3>Prediction checkpoint · after event {event?.seq}</h3>
              <p>
                Read the highlighted C and current state. Which event will
                execute next?
              </p>
              <label>
                Your prediction
                <select
                  value={predictionChoice}
                  onChange={(e) => setPredictionChoice(e.target.value)}
                >
                  {kinds.map((kind) => (
                    <option key={kind}>{kind}</option>
                  ))}
                </select>
              </label>
              <button className="primary">Reveal next event</button>
            </form>
          )}
          <p role="status">{playback.feedback}</p>
        </section>
      </div>
      <div className="learn-grid">
        <section className="panel">
          <span className="eyebrow">UNDERSTAND THE ALGORITHM</span>
          <h2>From state to understanding</h2>
          <p>{module.explanation}</p>
          <h3>Learning objectives</h3>
          <ul>
            {module.objectives.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          <h3>Prerequisites</h3>
          <p>{module.prerequisites.join(", ") || "None — start here."}</p>
          <h3>Invariant</h3>
          <p>{module.invariant}</p>
          <h3>Complexity</h3>
          <p>{module.complexity}</p>
          <h3>Worked example</h3>
          <p>{module.example}</p>
        </section>
        <SourceView loc={event?.loc} />
      </div>
      <div className="learn-grid">
        <Assessment
          module={module}
          authenticated={authenticated}
          onPass={() => onCheckpoint(authenticated ? 100 : 75)}
        />
        <section className="panel">
          <span className="eyebrow">SAVE A CHECKPOINT</span>
          <h3>Return to this experiment</h3>
          <p>
            Save the initialized input and pace to this device
            {authenticated ? " and your account" : ""}. Completing a run records
            50% exploration progress; guest practice records 75%, and a correct
            official assessment records 100%.
          </p>
          <label>
            Experiment title
            <input
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <button
            disabled={!event || saving || !title.trim()}
            onClick={async () => {
              setSaving(true);
              try {
                await onSave(lastRun, title, playback.speed);
                setSaveMessage("Experiment saved. Find it in your library.");
              } catch (e) {
                setSaveMessage((e as Error).message);
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? "Saving…" : "Save experiment"}
          </button>
          <p role="status">{saveMessage}</p>
          <p className="muted">
            Guest checkpoints merge after login using the maximum completion per
            lesson. Local experiments upload only when you choose Upload copy in
            the library.
          </p>
        </section>
      </div>
    </>
  );
}
