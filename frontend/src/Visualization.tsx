import { actionLabels } from "./learner-messages";
import type { EngineEvent } from "./protocol";
import type { Module } from "./registry";
export function Visualization({
  module,
  event,
  directed = false,
}: {
  module: Module;
  event?: EngineEvent;
  directed?: boolean;
}) {
  if (!event)
    return (
      <div className="empty">
        Choose values and Run to explore this visualization.
      </div>
    );
  const active = (id: number) => event.a === id || event.b === id;
  const color = (id: number) => (active(id) ? "#b94e2b" : "#087f75");
  const arrow = (
    <defs>
      <marker
        id={`arrow-${module.id}`}
        viewBox="0 0 10 10"
        refX="9"
        refY="5"
        markerWidth="7"
        markerHeight="7"
        orient="auto-start-reverse"
      >
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#607883" />
      </marker>
    </defs>
  );
  if (module.adapter === "graph") {
    const positions = event.data.map((_, i) => ({
      x:
        310 +
        235 * Math.cos((2 * Math.PI * i) / event.data.length - Math.PI / 2),
      y:
        240 +
        175 * Math.sin((2 * Math.PI * i) / event.data.length - Math.PI / 2),
    }));
    return (
      <svg
        role="img"
        className="graph-visual"
        aria-label={`${module.title} state, ${actionLabels[event.kind] ?? "step"}`}
        viewBox="0 0 620 490"
      >
        {arrow}
        {event.edges.map((edge) => {
          const i = event.data.indexOf(edge.from),
            j = event.data.indexOf(edge.to),
            p = positions[i],
            q = positions[j];
          if (!p || !q) return null;
          const d = Math.hypot(p.x - q.x, p.y - q.y) || 1;
          const x = q.x - ((q.x - p.x) * 26) / d,
            y = q.y - ((q.y - p.y) * 26) / d;
          return (
            <g key={edge.id}>
              {i === j ? (
                <path
                  d={`M ${p.x - 15} ${p.y - 18} C ${p.x - 65} ${p.y - 85},${p.x + 65} ${p.y - 85},${p.x + 15} ${p.y - 18}`}
                  className="edge"
                  markerEnd={directed ? `url(#arrow-${module.id})` : undefined}
                />
              ) : (
                <line
                  x1={p.x}
                  y1={p.y}
                  x2={x}
                  y2={y}
                  className={
                    active(edge.from) && active(edge.to) ? "edge hot" : "edge"
                  }
                  markerEnd={directed ? `url(#arrow-${module.id})` : undefined}
                />
              )}
              <text
                className="weight"
                x={i === j ? p.x : (p.x + q.x) / 2}
                y={i === j ? p.y - 63 : (p.y + q.y) / 2 - 5}
              >
                {edge.weight}
              </text>
            </g>
          );
        })}
        {event.data.map((id, i) => (
          <g
            key={id}
            transform={`translate(${positions[i].x},${positions[i].y})`}
          >
            <circle r="24" fill={color(id)} />
            <text className="node-value" textAnchor="middle" y="6">
              {id}
            </text>
            {module.id === "dijkstra" && (
              <text className="distance" textAnchor="middle" y="46">
                d = {event.dist[i] ?? "∞"}
              </text>
            )}
          </g>
        ))}
      </svg>
    );
  }
  if (module.adapter === "tree") {
    const nodes = new Map(event.nodes.map((n) => [n.id, n]));
    const positions = new Map<number, { x: number; y: number }>();
    let order = 0,
      maxDepth = 0;
    function layout(id: number, depth: number) {
      const n = nodes.get(id);
      if (!n) return;
      layout(n.left, depth + 1);
      positions.set(id, { x: 45 + order++ * 65, y: 40 + depth * 85 });
      maxDepth = Math.max(maxDepth, depth);
      layout(n.right, depth + 1);
    }
    layout(event.root, 0);
    return (
      <svg
        role="img"
        aria-label="BST state"
        viewBox={`0 0 ${Math.max(420, order * 65 + 30)} ${Math.max(220, maxDepth * 85 + 100)}`}
      >
        {arrow}
        {event.nodes.flatMap((n) =>
          [n.left, n.right].filter(Boolean).map((child) => {
            const p = positions.get(n.id),
              q = positions.get(child);
            return p && q ? (
              <line
                key={`${n.id}-${child}`}
                x1={p.x}
                y1={p.y}
                x2={q.x}
                y2={q.y}
                className="edge"
              />
            ) : null;
          }),
        )}
        {event.nodes.map((n) => {
          const p = positions.get(n.id);
          return (
            p && (
              <g key={n.id} transform={`translate(${p.x},${p.y})`}>
                <circle r="25" fill={color(n.id)} />
                <text className="node-value" textAnchor="middle" y="5">
                  {n.value}
                </text>
                <text className="node-id" textAnchor="middle" y="43"></text>
              </g>
            )
          );
        })}
      </svg>
    );
  }
  if (module.adapter === "list") {
    const ordered = [];
    let id = event.head;
    while (id) {
      const n = event.nodes.find((x) => x.id === id);
      if (!n || ordered.length >= 32) break;
      ordered.push(n);
      id = n.next;
    }
    return (
      <svg
        role="img"
        aria-label="Linked list state"
        viewBox={`0 0 ${Math.max(500, ordered.length * 115 + 70)} 170`}
      >
        {arrow}
        {ordered.map((n, i) => (
          <g key={n.id} transform={`translate(${20 + i * 115},45)`}>
            <rect width="75" height="55" rx="10" fill={color(n.id)} />
            <text className="node-value" x="37" y="33" textAnchor="middle">
              {n.value}
            </text>
            <text className="node-id" x="37" y="80" textAnchor="middle"></text>
            {n.next ? (
              <line
                x1="78"
                y1="27"
                x2="110"
                y2="27"
                className="edge"
                markerEnd={`url(#arrow-${module.id})`}
              />
            ) : (
              <text x="84" y="33">
                ∅
              </text>
            )}
          </g>
        ))}
      </svg>
    );
  }
  const max = Math.max(1, ...event.data.map(Math.abs));
  return (
    <svg
      role="img"
      aria-label={`${module.title} state: ${event.data.join(", ") || "empty"}`}
      viewBox={`0 0 ${Math.max(500, event.data.length * 65 + 30)} 270`}
    >
      {event.data.map((v, i) => {
        const h =
          module.adapter === "bars" ? 40 + (Math.abs(v) / max) * 140 : 65;
        return (
          <g key={i} transform={`translate(${20 + i * 65},${210 - h})`}>
            <rect width="54" height={h} rx="6" fill={color(i)} />
            <text className="node-value" x="27" y={h - 20} textAnchor="middle">
              {v}
            </text>
            <text className="node-id" x="27" y={h + 25} textAnchor="middle">
              {i}
            </text>
          </g>
        );
      })}
      {!event.data.length && (
        <text x="30" y="120">
          Empty structure
        </text>
      )}
    </svg>
  );
}
