import type { EngineEvent } from "./protocol";
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
  const size = 560 / Math.max(event.data.length, 1);
  return (
    <div className="next-visual" aria-label="Algorithm state">
      <svg
        role="img"
        aria-label="Heap array and complete binary tree"
        viewBox="0 0 620 440"
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
          const px = ((i - start + 0.5) * 600) / 2 ** level + 10;
          const py = 110 + level * 63;
          const p = Math.floor((i - 1) / 2);
          const pl = level - 1;
          const ppx = ((p - (2 ** pl - 1) + 0.5) * 600) / 2 ** pl + 10;
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
