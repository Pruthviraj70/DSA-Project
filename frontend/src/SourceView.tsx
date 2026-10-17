import { useState, useEffect } from "react";
export function SourceView({ loc }: { loc?: string }) {
  const [source, setSource] = useState<{
    source: string;
    locations: Record<string, number>;
  }>();
  const [error, setError] = useState("");
  const [full, setFull] = useState(false);
  useEffect(() => {
    fetch("/engine/source.json")
      .then((r) => {
        if (!r.ok) throw Error("Build the C engine to load executed source.");
        return r.json();
      })
      .then(setSource)
      .catch((e) => setError(e.message));
  }, []);
  const line = source?.locations[loc ?? "engine.ready"] ?? 1;
  const lines = source?.source.split("\n") ?? [];
  const start = full ? 0 : Math.max(0, line - 6),
    end = full ? lines.length : line + 5;
  return (
    <section className="panel source">
      <div className="section-heading">
        <h3>Executed C17 source</h3>
        <button className="text-button" onClick={() => setFull(!full)}>
          {full ? "Show checkpoint" : "Show full source"}
        </button>
      </div>
      <p className="muted">
        {loc ?? "engine.ready"} · line {line} · generated from compiled source
      </p>
      {error ? (
        <p role="alert">{error}</p>
      ) : (
        <pre aria-label="Executed C source">
          {lines.slice(start, end).map((text, i) => (
            <span
              key={start + i}
              className={
                start + i + 1 === line ? "code-line active" : "code-line"
              }
            >
              <span className="line-number">{start + i + 1}</span>
              {text || " "}
              {"\n"}
            </span>
          ))}
        </pre>
      )}
    </section>
  );
}
