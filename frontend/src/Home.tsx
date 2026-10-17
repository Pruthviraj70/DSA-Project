import { useState } from "react";
import { lessons } from "./curriculum";
export function ModuleIcon({ kind }: { kind: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className="module-icon">
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {kind === "compass" ? (
          <>
            <circle cx="32" cy="32" r="23" />
            <path d="m41 23-5 13-13 5 5-13Z" />
            <circle cx="32" cy="32" r="2" fill="currentColor" />
          </>
        ) : kind === "search" ? (
          <>
            <circle cx="27" cy="27" r="15" />
            <path d="m39 39 15 15M20 27h14M27 20v14" />
          </>
        ) : kind === "tree" || kind === "graph" ? (
          <>
            <path
              d={
                kind === "tree"
                  ? "M32 15 15 42M32 15l17 27"
                  : "M13 16 50 21 35 50 13 16M13 16l22 34"
              }
            />
            {(kind === "tree"
              ? [
                  [32, 12],
                  [13, 46],
                  [51, 46],
                ]
              : [
                  [11, 13],
                  [53, 21],
                  [35, 53],
                ]
            ).map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="7" fill="var(--icon-bg)" />
            ))}
          </>
        ) : kind === "links" ? (
          <>
            <rect x="4" y="25" width="16" height="18" rx="4" />
            <rect x="42" y="25" width="16" height="18" rx="4" />
            <path d="M21 34h18m-5-5 5 5-5 5" />
          </>
        ) : kind === "sort" ? (
          <>
            <path d="M12 50V32h10v18M27 50V21h10v29M42 50V9h10v41" />
          </>
        ) : kind === "stack" ? (
          <>
            <path d="M13 12v41h38V12M17 43h30M17 33h30M17 23h30M32 3v12m-5-5 5 5 5-5" />
          </>
        ) : kind === "queue" ? (
          <>
            <path d="M5 22h54M5 44h54M19 26v14M32 26v14M45 26v14M2 33h10m-5-5 5 5-5 5M52 33h10m-5-5 5 5-5 5" />
          </>
        ) : (
          <>
            <rect x="5" y="21" width="54" height="24" rx="4" />
            <path d="M18 22v22M32 22v22M46 22v22" />
          </>
        )}
      </g>
    </svg>
  );
}
export function Home({
  completed,
  positions,
  ready,
  foundationComplete,
  onComplete,
  completionPending,
}: {
  completed: Record<string, string[]>;
  positions: Record<string, string>;
  completionPending: boolean;
  ready: boolean;
  foundationComplete: boolean;
  onComplete: () => void;
}) {
  const [query, setQuery] = useState("");
  const shown = lessons.filter((m) =>
    `${m.title} ${m.description} ${m.slides.map((s) => s.title).join(" ")}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const foundation = lessons[0];
  function tile(id: string) {
    const m = lessons.find((x) => x.id === id)!;
    const count = completed[id]?.length ?? 0;
    return (
      <a
        className={`module-tile tile-${m.icon}`}
        href={`#/lesson/${id}`}
        aria-label={`Open ${m.title}`}
        key={id}
      >
        <ModuleIcon kind={m.icon} />
        <h3>{m.title}</h3>
        <p>{m.description}</p>
        <span className="tile-progress">
          {count
            ? `${count} / ${m.slides.length} pages complete`
            : positions[id]
              ? "Continue learning"
              : "Explore lesson"}{" "}
          <span aria-hidden="true">→</span>
        </span>
      </a>
    );
  }
  return (
    <>
      <section className="home-heading">
        <span className="eyebrow">A PLACE TO MAKE IDEAS CLICK</span>
        <h1>
          Understand it.
          <br />
          <span>One step at a time.</span>
        </h1>
        <p>
          Explore a structure. Trace an algorithm. Explain what happens next.
        </p>
        <a className="foundations-link" href="#/lesson/foundations">
          Foundations →
        </a>
        <label className="catalog-search">
          Find your next topic
          <input
            aria-label="Search topics"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Try arrays, binary search or shortest paths…"
          />
        </label>
      </section>
      {ready && !foundationComplete && (
        <section
          className="foundation-section"
          aria-labelledby="foundations-title"
        >
          <div>
            <span className="eyebrow">START HERE</span>
            <h2 id="foundations-title">Foundations</h2>
            <p>
              Learn the language of data structures: values, correctness,
              operation counts, complexity and call stacks. No advanced
              mathematics required.
            </p>
            <a className="text-link" href="#/lesson/foundations">
              {positions.foundations
                ? "Continue Foundations"
                : "Begin with the basics"}{" "}
              →
            </a>
            <button
              className="foundation-complete"
              disabled={completionPending}
              onClick={onComplete}
            >
              Mark completed
            </button>
          </div>
          {tile(foundation.id)}
        </section>
      )}
      <div className="catalog-columns">
        {["Data Structures", "Algorithms"].map((category) => (
          <section key={category} aria-label={category}>
            <div className="catalog-section-heading">
              <h2>{category}</h2>
              <p>
                {category === "Data Structures"
                  ? "Ways to organize information."
                  : "Steps to solve a problem."}
              </p>
            </div>
            <div className="tile-grid">
              {shown
                .filter((m) => m.category === category)
                .map((m) => tile(m.id))}
            </div>
            {!shown.some((m) => m.category === category) && (
              <p className="empty">No matching topics in this section.</p>
            )}
          </section>
        ))}
      </div>
    </>
  );
}
