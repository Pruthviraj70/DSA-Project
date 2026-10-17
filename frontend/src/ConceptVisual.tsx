import { useState } from "react";
export function MemoryVisual() {
  const [length, setLength] = useState(3),
    [selected, setSelected] = useState(1),
    [size, setSize] = useState(4);
  const values = [8, 3, 8, 5, 2, 9],
    base = 1000;
  return (
    <section className="concept-visual">
      <span className="eyebrow">A CONCEPTUAL MEMORY MODEL</span>
      <h2>One slot, one index</h2>
      <p>
        Fixed-size, contiguous slots. Addresses below are illustrative, not
        actual browser addresses.
      </p>
      <div
        className="memory-slots"
        role="group"
        aria-label={`Array length ${length}, capacity 6, ${size} bytes per element`}
      >
        {values.map((v, i) => (
          <button
            key={i}
            aria-label={`Index ${i}, ${i < length ? `value ${v}` : "unused capacity"}, illustrative address ${base + i * size}`}
            aria-pressed={selected === i}
            onClick={() => setSelected(i)}
          >
            <small>index {i}</small>
            <strong>{i < length ? v : "—"}</strong>
            <small>{base + i * size}</small>
          </button>
        ))}
      </div>
      <div className="inline">
        <label>
          Logical length: {length}
          <input
            aria-label="Illustrative logical length"
            type="range"
            min={0}
            max={6}
            value={length}
            onChange={(e) => setLength(+e.target.value)}
          />
        </label>
        <label>
          Element size
          <select
            aria-label="Illustrative element size"
            value={size}
            onChange={(e) => setSize(+e.target.value)}
          >
            {[2, 4, 8].map((n) => (
              <option key={n} value={n}>
                {n} bytes
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="formula">
        address(i) = base_address + i × element_size
        <br />
        <strong>
          address({selected}) = {base} + {selected} × {size} ={" "}
          {base + selected * size}
        </strong>
      </div>
      <p>
        {selected < length
          ? `Index ${selected} contains value ${values[selected]}.`
          : `Index ${selected} is spare capacity, not a readable element.`}{" "}
        Capacity remains 6.
      </p>
      <p className="muted">
        This is a fixed contiguous-array model. Language-level lists and
        growable arrays can use different storage and resizing rules.
      </p>
    </section>
  );
}
export function CountsVisual() {
  const [n, setN] = useState(4);
  return (
    <section className="concept-visual">
      <h2>Count repetitions</h2>
      <label>
        Input size n = {n}
        <input
          aria-label="Operation-count input size"
          type="range"
          min={1}
          max={12}
          value={n}
          onChange={(e) => setN(+e.target.value)}
        />
      </label>
      <div className="count-cards">
        <article>
          <strong>{n}</strong>
          <p>one scan: n visits</p>
        </article>
        <article>
          <strong>{2 * n}</strong>
          <p>two scans: 2n visits</p>
        </article>
        <article>
          <strong>{n * n}</strong>
          <p>n-by-n nesting: n² visits</p>
        </article>
      </div>
      <svg
        viewBox="0 0 320 240"
        role="img"
        aria-label={`${n} rows of ${n} visits: ${n * n} nested-loop visits`}
      >
        {Array.from({ length: n * n }, (_, i) => (
          <rect
            key={i}
            x={15 + (i % n) * Math.min(23, 280 / n)}
            y={12 + Math.floor(i / n) * Math.min(18, 215 / n)}
            width={Math.min(18, 240 / n)}
            height={Math.min(13, 170 / n)}
            rx="2"
            fill="#087f75"
          />
        ))}
      </svg>
      <p>
        Each row is one outer repetition; each square is an inner visit. These
        are work counts, not seconds.
      </p>
    </section>
  );
}
export function GrowthVisual() {
  const [n, setN] = useState(4);
  let factorial = 1;
  for (let i = 2; i <= n; i++) factorial *= i;
  const rows = [
    ["1 (constant)", 1],
    ["log₂ n (halving)", Math.log2(n)],
    ["n (linear)", n],
    ["n log₂ n", n * Math.log2(n)],
    ["n² (quadratic)", n * n],
    ["2ⁿ (two choices)", 2 ** n],
    ["n! (orderings)", factorial],
  ] as const;
  return (
    <section className="concept-visual">
      <h2>Compare growth</h2>
      <label>
        Input size n = {n}
        <input
          aria-label="Growth comparison input size"
          type="range"
          min={2}
          max={8}
          value={n}
          onChange={(e) => setN(+e.target.value)}
        />
      </label>
      <table>
        <caption>Illustrative cost functions at the same input size</caption>
        <thead>
          <tr>
            <th>Cost function</th>
            <th>Value at n={n}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([name, count]) => (
            <tr key={name}>
              <th scope="row">{name}</th>
              <td>{Number.isInteger(count) ? count : count.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        These are exact functions or rounded logarithms, not the measured cost
        of a particular program. Constant factors and cases still need
        explanation.
      </p>
    </section>
  );
}
export function CallStackVisual() {
  const [depth, setDepth] = useState(4),
    [stage, setStage] = useState(4);
  const n = Math.min(stage, depth);
  return (
    <section className="concept-visual">
      <h2>Unfinished calls need space</h2>
      <label>
        Starting countdown: {depth}
        <input
          aria-label="Countdown input"
          type="range"
          min={1}
          max={6}
          value={depth}
          onChange={(e) => {
            setDepth(+e.target.value);
            setStage(+e.target.value);
          }}
        />
      </label>
      <label>
        Calls descended: {n}
        <input
          aria-label="Call-stack depth"
          type="range"
          min={0}
          max={depth}
          value={n}
          onChange={(e) => setStage(+e.target.value)}
        />
      </label>
      <ol className="call-frames" reversed>
        {Array.from({ length: n + 1 }, (_, i) => (
          <li key={i}>
            countdown({depth - i}){" "}
            <span>
              {depth - i === 0
                ? "base case: return"
                : "waiting for the smaller call"}
            </span>
          </li>
        ))}
      </ol>
      <p>
        {n + 1} active frames. At maximum depth there are n+1 frames, which
        grows linearly with the input.
      </p>
    </section>
  );
}
export function ConceptVisual({ type }: { type: string }) {
  return type === "memory" ? (
    <MemoryVisual />
  ) : type === "counts" ? (
    <CountsVisual />
  ) : type === "growth" ? (
    <GrowthVisual />
  ) : (
    <CallStackVisual />
  );
}
