import { actionLabels } from "./learner-messages";
import { useState, useEffect } from "react";
import { modules, validate } from "./registry";
import { usePlayback } from "./usePlayback";
import { Visualization } from "./Visualization";
export function Comparison() {
  const insertion = usePlayback(),
    merge = usePlayback(),
    quick = usePlayback();
  const players = [insertion, merge, quick];
  const [values, setValues] = useState("5, 2, 4, 2, 1"),
    [running, setRunning] = useState(false),
    [error, setError] = useState("");
  async function reset() {
    setRunning(false);
    try {
      const data = values.trim()
        ? values.split(",").map((x) => Number(x.trim()))
        : [];
      const problem = validate({
        module: 4,
        op: 0,
        values: data,
        arg: 0,
        index: 0,
        directed: false,
        edges: [],
      });
      if (problem) throw Error(problem);
      setError("");
      await Promise.all(
        players.map((p, i) =>
          p.run({
            module: 4 + i,
            op: 0,
            values: data,
            arg: 0,
            index: 0,
            directed: false,
            edges: [],
          }),
        ),
      );
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    if (!running) return;
    const timer = setTimeout(async () => {
      await Promise.all(players.filter((p) => !p.done).map((p) => p.step()));
      if (players.every((p) => p.done)) setRunning(false);
    }, 100);
    return () => clearTimeout(timer);
  });
  return (
    <section>
      <span className="eyebrow">SAME INPUT · DIFFERENT STRATEGIES</span>
      <h2>Sorting comparison</h2>
      <p>
        One round advances each unfinished algorithm by one action. Compare the
        same values and count comparisons, reads, writes and swaps separately.
        Playback pace changes presentation time.
      </p>
      <div className="panel inline">
        <label>
          Comparison values
          <input
            aria-label="Comparison values"
            value={values}
            onChange={(e) => setValues(e.target.value)}
          />
        </label>
        <button className="primary" onClick={() => void reset()}>
          Run comparison
        </button>
        <button
          disabled={!insertion.event}
          onClick={() => setRunning(!running)}
        >
          {running ? "Pause comparison" : "Play comparison"}
        </button>
        <button
          disabled={running || !insertion.event}
          onClick={() => void Promise.all(players.map((p) => p.step()))}
        >
          Step comparison
        </button>
      </div>
      <p role="alert">{error}</p>
      <div className="compare-grid">
        {players.map((p, i) => (
          <section className="panel" key={i}>
            <h3>{modules[i + 3].title}</h3>
            <Visualization module={modules[i + 3]} event={p.event} />
            <p>
              {p.event?.done
                ? "Complete"
                : (actionLabels[p.event?.kind ?? ""] ?? "Waiting")}
            </p>
            <dl className="counters">
              {Object.entries(p.event?.counters ?? {}).map(([name, value]) => (
                <div key={name}>
                  <dt>{name}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            {p.error && <p role="alert">{p.error}</p>}
          </section>
        ))}
      </div>
    </section>
  );
}
