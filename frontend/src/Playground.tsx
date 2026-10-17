import { useState, useEffect } from "react";
import type { Input } from "./protocol";
import { runtimeById, inputForSlide, type Slide } from "./curriculum";
import { modules, validate } from "./registry";
import { Visualization } from "./Visualization";
import { GraphEditor } from "./GraphEditor";
import { usePlayback } from "./usePlayback";
import { actionLabels, learnerMessage } from "./learner-messages";
export function parseValues(raw: string): number[] {
  if (!raw.trim()) return [];
  const parts = raw.split(",");
  if (parts.some((s) => !s.trim()))
    throw Error("Separate integers with commas; empty entries are not values.");
  return parts.map((s) => Number(s.trim()));
}
export function Playground({
  slide,
  loaded,
  speed = 350,
  onSave,
}: {
  slide: Slide;
  loaded?: Input;
  speed?: number;
  onSave: (input: Input, title: string, speed: number) => Promise<void>;
}) {
  const seed = loaded ?? inputForSlide(slide)!;
  const module = modules.find((m) => m.engineId === seed.module)!;
  const [input, setInput] = useState(seed),
    [raw, setRaw] = useState(seed.values.join(", ")),
    [lastRun, setLastRun] = useState(seed),
    [error, setError] = useState(""),
    [choice, setChoice] = useState("compare"),
    [title, setTitle] = useState(`${module.title} experiment`),
    [saved, setSaved] = useState("");
  const player = usePlayback();
  useEffect(() => {
    player.setSpeed(speed);
    void player.run(seed);
  }, []);
  async function run() {
    try {
      const next = { ...input, values: parseValues(raw) };
      const problem = validate(next);
      if (problem) throw Error(problem);
      setInput(next);
      setLastRun(next);
      setError("");
      await player.run(next);
    } catch (e) {
      setError(learnerMessage(e));
    }
  }
  const event = player.event;
  const m = input.module;
  const needsIndex =
    (m === 1 && [1, 2, 3, 4].includes(input.op)) ||
    (m === 7 && [0, 1].includes(input.op));
  const needsValue =
    (m === 1 && [2, 3].includes(input.op)) ||
    [2, 3, 12, 13, 14].includes(m) ||
    (m === 7 && [0, 2].includes(input.op)) ||
    ([8, 9].includes(m) && input.op === 0) ||
    (m === 10 && input.op < 3) ||
    (m === 17 && [2, 5].includes(input.op));
  return (
    <section className="playground" aria-label="Visualization">
      <div className="section-heading">
        <h2>Visualization</h2>
        <span role="status">
          {player.busy
            ? "Preparing…"
            : event?.done
              ? "Complete"
              : player.playing
                ? "Playing"
                : "Paused"}
        </span>
      </div>
      {loaded && (
        <p className="saved-notice">Loaded your saved values and operation.</p>
      )}
      <div className="visualization">
        <Visualization
          module={module}
          event={event}
          directed={lastRun.directed}
        />
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void run();
        }}
        className="input-controls"
      >
        <label>
          {m >= 11 && m <= 14 ? "Vertex labels" : "Input values"}
          <input
            aria-label="Input values"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
          />
        </label>
        <div className="inline">
          {needsIndex && (
            <label>
              Index
              <input
                aria-label="Index"
                type="number"
                value={input.index}
                onChange={(e) => setInput({ ...input, index: +e.target.value })}
              />
            </label>
          )}
          {needsValue && (
            <label>
              {m >= 12 && m <= 14 ? "Start vertex" : "Value / target"}
              <input
                aria-label="Value or target"
                type="number"
                value={input.arg}
                onChange={(e) => setInput({ ...input, arg: +e.target.value })}
              />
            </label>
          )}
          <button className="primary" disabled={player.busy}>
            Run
          </button>
        </div>
      </form>
      <div className="examples">
        <button
          onClick={() => {
            setRaw("");
            setInput({ ...input, values: [], edges: [] });
          }}
        >
          Empty input
        </button>
        <button
          onClick={() => {
            const values = m >= 11 && m <= 14 ? [1, 2, 3, 4] : [2, 2, 2, 2];
            setRaw(values.join(", "));
            setInput({ ...input, values, edges: [] });
          }}
        >
          {m >= 11 && m <= 14 ? "Disconnected graph" : "Duplicate values"}
        </button>
        <button
          onClick={() => {
            setInput(seed);
            setRaw(seed.values.join(", "));
          }}
        >
          Lesson example
        </button>
      </div>
      {m >= 11 && m <= 14 && (
        <details>
          <summary>Edit vertices and edges</summary>
          <GraphEditor
            input={input}
            onChange={(next) => {
              setInput(next);
              setRaw(next.values.join(", "));
              setLastRun(next);
              void player.run(next);
            }}
          />
        </details>
      )}
      <p className="error" role="alert">
        {error || player.error}
      </p>
      <label className="timeline">
        Step {player.cursor} of {Math.max(0, player.history.length - 1)}{" "}
        recorded
        <input
          aria-label="Playback position"
          type="range"
          min={0}
          max={Math.max(0, player.history.length - 1)}
          value={player.cursor}
          disabled={!!player.prediction}
          onChange={(e) => player.seek(+e.target.value)}
        />
      </label>
      <div className="playback-controls">
        <button
          aria-label="Step backward"
          disabled={player.cursor === 0 || player.busy || !!player.prediction}
          onClick={() => player.seek(player.cursor - 1)}
        >
          ← Back
        </button>
        <button
          className="primary"
          disabled={
            !event || player.done || !!player.prediction || !!player.error
          }
          onClick={() => player.setPlaying(!player.playing)}
        >
          {player.playing ? "Pause" : "Play"}
        </button>
        <button
          aria-label="Step forward"
          disabled={!event || player.done || player.busy || !!player.prediction}
          onClick={() => void player.step()}
        >
          Step →
        </button>
        <button disabled={player.busy} onClick={() => void player.run(lastRun)}>
          Reset
        </button>
      </div>
      <label>
        Pace: {player.speed} ms per step
        <input
          aria-label="Playback speed"
          type="range"
          min={30}
          max={1000}
          step={10}
          value={player.speed}
          onChange={(e) => player.setSpeed(+e.target.value)}
        />
      </label>
      <p className="action-summary" aria-live="polite">
        {event ? actionLabels[event.kind] : "Preparing visualization…"}
        {event && [2, 3].includes(m) && event.found >= 0
          ? ` — match at index ${event.found}`
          : ""}
      </p>
      {m >= 12 && m <= 14 && event?.frontier.length ? (
        <p>Frontier: {event.frontier.join(" → ")}</p>
      ) : null}
      {m === 3 && event && (
        <p>
          Remaining search range: [{event.variables.lo}, {event.variables.hi}]
        </p>
      )}
      <dl className="counters">
        {Object.entries(event?.counters ?? {}).map(([name, count]) => (
          <div key={name}>
            <dt>{name === "mutation" ? "changes" : name}</dt>
            <dd>{count}</dd>
          </div>
        ))}
      </dl>
      <p className="muted">
        Counts describe the displayed actions; pace changes animation time, not
        algorithmic growth.
      </p>
      <button
        disabled={!event || player.done || player.busy || !!player.prediction}
        onClick={() => void player.predict()}
      >
        Predict the next action
      </button>
      {player.prediction && (
        <form
          className="prediction"
          onSubmit={(e) => {
            e.preventDefault();
            player.answer(choice);
          }}
        >
          <label>
            Your prediction
            <select
              aria-label="Your prediction"
              value={choice}
              onChange={(e) => setChoice(e.target.value)}
            >
              {Object.entries(actionLabels)
                .filter(([key]) => key !== "ready")
                .map(([key, label]) => (
                  <option value={key} key={key}>
                    {label}
                  </option>
                ))}
            </select>
          </label>
          <button>Reveal next action</button>
        </form>
      )}
      <p role="status">{player.feedback}</p>
      <details>
        <summary>Save or reuse this input</summary>
        <button
          disabled={!event?.done}
          onClick={() => {
            if (!event) return;
            let values = event.data;
            if (m === 10) {
              values = [];
              const nodes = new Map(event.nodes.map((n) => [n.id, n]));
              function walk(id: number) {
                const node = nodes.get(id);
                if (node) {
                  values.push(node.value);
                  walk(node.left);
                  walk(node.right);
                }
              }
              walk(event.root);
            }
            setInput({
              ...input,
              values,
              ...(m >= 11 && m <= 14
                ? {
                    edges: event.edges.map((e) => ({
                      from: values.indexOf(e.from),
                      to: values.indexOf(e.to),
                      weight: e.weight,
                    })),
                  }
                : {}),
            });
            setRaw(values.join(", "));
          }}
        >
          Use result as input
        </button>
        <label>
          Experiment title
          <input
            value={title}
            maxLength={120}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <button
          disabled={!event || !title.trim()}
          onClick={async () => {
            try {
              await onSave(lastRun, title, player.speed);
              setSaved("Experiment saved. Find it in Saved experiments.");
            } catch (e) {
              setSaved(learnerMessage(e));
            }
          }}
        >
          Save experiment
        </button>
        <p role="status">{saved}</p>
      </details>
    </section>
  );
}
