import type { EngineEvent } from "./protocol";
function CallTree({
  calls,
  parent = 0,
}: {
  calls: NonNullable<EngineEvent["extended"]>["calls"];
  parent?: number;
}) {
  const children = calls.filter((call) => call.parent === parent);
  return (
    <ul>
      {children.map((call) => (
        <li key={call.id}>
          <span>
            Call {call.id} ({call.argument})
            {call.returned ? ` → ${call.result}` : " — waiting"}
          </span>
          {calls.some((child) => child.parent === call.id) && (
            <CallTree calls={calls} parent={call.id} />
          )}
        </li>
      ))}
    </ul>
  );
}
export function NextVisualization({
  event,
  module,
}: {
  event: EngineEvent;
  module: number;
}) {
  const x = event.extended!;
  const active = (i: number) => event.a === i || event.b === i;
  const fill = (i: number) =>
    active(i) ? "var(--viz-active)" : "var(--viz-node)";
  const diagramWidth = Math.max(620, event.data.length * 58);
  const size = (diagramWidth - 60) / Math.max(event.data.length, 1);
  if (module === 15 || module === 16) {
    const entries = new Map(x.entries.map((v) => [v.id, v]));
    const chain = (id: number) => {
      const result = [];
      for (let k = 0; id && k < 32; k++) {
        const v = entries.get(id);
        if (!v) break;
        result.push(`${v.key}:${v.value}`);
        id = v.next;
      }
      return result.join(" → ") || "Empty";
    };
    return (
      <div className="next-visual" aria-label="Hash table state">
        <p>
          {event.kind === "hash"
            ? `Normalize (${event.value} mod ${x.capacity}) into 0..${x.capacity - 1}: bucket ${x.bucket}.`
            : `Current bucket: ${x.bucket}. Probe offset / chain entry: ${x.probe}.`}
        </p>
        <p>
          {x.size} entries / {x.capacity} buckets; load factor{" "}
          {(x.size / Math.max(x.capacity, 1)).toFixed(2)}.{" "}
          {x.rehashing ? "Moving entries into the larger table…" : ""}
        </p>
        <div
          className="hash-buckets"
          role="img"
          aria-label={
            module === 15
              ? "Separate chaining buckets and links"
              : "Linear probing slots and tombstones"
          }
        >
          {x.slots.map((slot, i) => {
            const value = entries.get(slot.entry);
            return (
              <div
                key={slot.id}
                className={`hash-bucket ${i === x.bucket ? "bucket-active" : ""}`}
              >
                <strong>Bucket {i}</strong>
                <span>
                  {module === 15
                    ? chain(slot.entry)
                    : slot.state === 2
                      ? "Tombstone — continue probing"
                      : slot.state === 1 && value
                        ? `${value.key}: ${value.value}`
                        : "Empty — stop lookup"}
                </span>
              </div>
            );
          })}
        </div>
        {x.rehashing && (
          <p>
            Old bucket placements ({x.oldCapacity} buckets):{" "}
            {x.oldEntries
              .map((v) => `entry ${v.entry} @ ${v.bucket}`)
              .join(", ")}
            . Stable entry IDs are kept as their buckets change.
          </p>
        )}
        <p>
          {event.found >= 0
            ? `Found entry ${event.found}; value ${x.result}.`
            : event.done
              ? "No matching key was found (or no lookup was requested)."
              : "A collision does not imply equal keys: compare the actual keys."}
        </p>
      </div>
    );
  }
  if (module === 18)
    return (
      <div className="next-visual" aria-label="Recursive call state">
        <h3>Call stack — active frame at the bottom</h3>
        <ol className="call-frames">
          {x.frames.map((f, i) => (
            <li
              key={f.id}
              className={i === x.frames.length - 1 ? "active-frame" : ""}
            >
              Call {f.id}: argument {f.argument};{" "}
              {x.operation === 2 && (
                <>
                  bounds [{f.lo}, {f.hi}];{" "}
                </>
              )}
              {f.phase === 0 ? "evaluating" : "unfinished work"}
              {x.operation === 3 && f.phase === 2 && (
                <>; saved first answer {f.saved}</>
              )}
            </li>
          ))}
        </ol>
        {!x.frames.length && (
          <p>
            {event.done
              ? `All calls returned. Result: ${x.result}.`
              : "The stack is empty. Step to enter the first call."}
          </p>
        )}
        <p>
          Active depth: {x.frames.length}. Total calls so far: {x.calls.length}.
          Latest returned value: {x.result}.
        </p>
        <details open>
          <summary>Call tree (parent → child)</summary>
          <div className="call-tree" aria-label="Recursion tree">
            <CallTree calls={x.calls} />
          </div>
        </details>
      </div>
    );
  if (module === 19 || module === 20)
    return (
      <div
        className="next-visual sequence-scroll"
        aria-label={
          module === 19 ? "Two pointer state" : "Sliding window state"
        }
      >
        <svg
          role="img"
          aria-label={
            module === 19
              ? "Pointer positions and valid output prefix"
              : "Window boundaries and values"
          }
          viewBox={`0 0 ${diagramWidth} 170`}
          style={{ minWidth: diagramWidth }}
        >
          {event.data.map((v, i) => {
            const inside = module === 20 && i >= x.left && i < x.right;
            const valid = module === 19 && i < x.logical;
            return (
              <g
                key={i}
                opacity={
                  module === 19 && x.logical < event.data.length && !valid
                    ? 0.55
                    : 1
                }
              >
                <rect
                  x={30 + i * size}
                  y={55}
                  width={size - 2}
                  height={40}
                  fill={
                    inside || i === x.left || i === x.right
                      ? "var(--viz-active)"
                      : "var(--viz-node)"
                  }
                  stroke="var(--viz-edge)"
                />
                <text
                  x={30 + (i + 0.5) * size}
                  y={80}
                  textAnchor="middle"
                  fontSize={12}
                  fill="var(--viz-label)"
                >
                  {v}
                </text>
                <text
                  x={30 + (i + 0.5) * size}
                  y={116}
                  textAnchor="middle"
                  fill="var(--text-muted)"
                  fontSize={11}
                >
                  {i}
                </text>
              </g>
            );
          })}
          <text
            x={30 + Math.min(x.left, event.data.length) * size}
            y={30}
            fill="var(--text)"
          >
            L={x.left}
          </text>
          <text
            x={Math.min(555, 30 + Math.max(0, x.right) * size)}
            y={150}
            fill="var(--text)"
          >
            R={x.right}
            {module === 20 ? " (exclusive)" : ""}
          </text>
        </svg>
        <p>
          {module === 20
            ? `Window [${x.left}, ${x.right}), running sum ${x.sum}; best ${x.best < 0 ? "no solution yet" : `${x.result} starting at ${x.best}`}.`
            : `Left ${x.left}, right/read ${x.right}; pair sum ${x.sum}; valid prefix length ${x.logical}.`}
        </p>
        <p>
          {module === 20
            ? "Everything outside the current contiguous window is excluded from its sum."
            : "Pair sum: discard only indices proved unable to complete a pair. Reversal: values outside the pointers are in final positions. Deduplication: only the marked prefix is output."}
        </p>
      </div>
    );
  return (
    <div className="next-visual sequence-scroll" aria-label="Heap state">
      <svg
        role="img"
        aria-label="Heap array and complete binary tree"
        viewBox={`0 0 ${diagramWidth} 470`}
        style={{ minWidth: diagramWidth }}
      >
        {event.data.map((v, i) => (
          <g key={i}>
            <rect
              x={30 + i * size}
              y={12}
              width={size - 2}
              height={35}
              fill={fill(i)}
              stroke="var(--viz-edge)"
            />
            <text
              x={30 + (i + 0.5) * size}
              y={35}
              textAnchor="middle"
              fill="var(--viz-label)"
              fontSize={13}
            >
              {v}
            </text>
            <text
              x={30 + (i + 0.5) * size}
              y={64}
              textAnchor="middle"
              fill="var(--text-muted)"
              fontSize={11}
            >
              {i}
            </text>
          </g>
        ))}
        {event.data.slice(0, x.extent).map((v, i) => {
          const level = Math.floor(Math.log2(i + 1));
          const start = 2 ** level - 1;
          const px =
            ((i - start + 0.5) * (diagramWidth - 20)) / 2 ** level + 10;
          const py = 110 + level * 63;
          const p = Math.floor((i - 1) / 2);
          const pl = level - 1;
          const ppx =
            ((p - (2 ** pl - 1) + 0.5) * (diagramWidth - 20)) / 2 ** pl + 10;
          return (
            <g key={i}>
              {i > 0 && (
                <line
                  x1={ppx}
                  y1={py - 63}
                  x2={px}
                  y2={py}
                  stroke="var(--viz-edge)"
                />
              )}
              <circle
                cx={px}
                cy={py}
                r={17}
                fill={fill(i)}
                stroke="var(--viz-edge)"
              />
              <text
                x={px}
                y={py + 4}
                textAnchor="middle"
                fontSize={12}
                fill="var(--viz-label)"
              >
                {v}
              </text>
            </g>
          );
        })}
      </svg>
      <p>
        Heap extent: {x.extent}. Sorted suffix is outside the tree. Result:{" "}
        {x.result}.
      </p>
    </div>
  );
}
