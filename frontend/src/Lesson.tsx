import { useEffect, useRef, lazy, Suspense } from "react";
import {
  type LessonModule,
  type Slide,
  lessonById,
  lessonHref,
  prerequisites,
} from "./curriculum";
import { ConceptVisual } from "./ConceptVisual";
const CodeExample = lazy(() =>
  import("./CodeExample").then((m) => ({ default: m.CodeExample })),
);
import { Playground } from "./Playground";
import { Comparison } from "./Comparison";
import { Assessment } from "./Assessment";
import type { Input } from "./protocol";
export function Lesson({
  module,
  slide,
  completed,
  isComplete,
  onCheckpoint,
  onFoundationCompletion,
  completionPending,
  authenticated,
  owner,
  loaded,
  onSave,
}: {
  module: LessonModule;
  slide: Slide;
  completed: string[];
  isComplete: (id: string) => boolean;
  onCheckpoint: (moduleId: string, slideId: string, complete: boolean) => void;
  completionPending: boolean;
  onFoundationCompletion: (completed: boolean) => Promise<void>;
  authenticated: boolean;
  owner: string;
  loaded?: { input: Input; speed: number };
  onSave: (input: Input, title: string, speed: number) => Promise<void>;
}) {
  const index = module.slides.findIndex((s) => s.id === slide.id);
  const heading = useRef<HTMLHeadingElement>(null);
  const unmet = prerequisites(module.id).filter((m) => !isComplete(m.id));
  function go(next: number) {
    if (next < 0 || next >= module.slides.length) return;
    if (next > index) onCheckpoint(module.id, slide.id, true);
    window.location.hash = lessonHref(module.id, module.slides[next].id).slice(
      1,
    );
  }
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    function key(e: KeyboardEvent) {
      if (
        e.altKey ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey ||
        (e.target as HTMLElement)?.closest(
          "input,select,textarea,button,a,summary,pre,[contenteditable=true]",
        )
      )
        return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(index - 1);
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        go(index + 1);
      }
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [module.id, slide.id]);
  return (
    <article className="lesson-page">
      <div className="lesson-breadcrumb">
        <a href="#/">All topics</a>
        <span aria-hidden="true">/</span>
        <span>{module.title}</span>
      </div>
      <div className="lesson-top">
        <div>
          <span className="eyebrow">{module.title}</span>
          <h1 ref={heading} tabIndex={-1}>
            {slide.title}
          </h1>
        </div>
        <div className="lesson-position">
          <span>
            Page {index + 1} of {module.slides.length}
          </span>
          <label className="sr-only" htmlFor="lesson-pages">
            Lesson pages
          </label>
          <select
            id="lesson-pages"
            aria-label="Lesson pages"
            value={slide.id}
            onChange={(e) =>
              (window.location.hash = lessonHref(
                module.id,
                e.target.value,
              ).slice(1))
            }
          >
            {module.slides.map((s, i) => (
              <option key={s.id} value={s.id}>
                {i + 1}. {s.title}
                {completed.includes(s.id) ? " ✓" : ""}
              </option>
            ))}
          </select>
          <span className="muted">
            {completed.length} / {module.slides.length} pages complete
          </span>
        </div>
      </div>
      {module.id === "foundations" && (
        <section
          className="module-completion-controls"
          aria-label="Foundations completion"
        >
          <p>
            {isComplete("foundations")
              ? "Foundations completed."
              : "Foundations is in progress."}{" "}
            Marking incomplete starts a new pass through the pages. Your quiz
            history is kept.{" "}
            {completionPending
              ? "Your completion change is being saved or waiting to synchronize."
              : ""}
          </p>
          <button
            disabled={completionPending}
            onClick={() =>
              void onFoundationCompletion(!isComplete("foundations"))
            }
          >
            {isComplete("foundations") ? "Mark incomplete" : "Mark completed"}
          </button>
        </section>
      )}
      {unmet.length > 0 && (
        <aside className="prerequisites" aria-label="Recommended prerequisites">
          <strong>
            {slide.kind === "quiz"
              ? "Knowledge assumed by this quiz"
              : "Recommended preparation"}
          </strong>
          <p>
            {slide.kind === "quiz"
              ? "This quiz assumes the concepts in these prerequisite lessons. You can still explore freely."
              : "Build on these ideas when you are ready; exploration is always open."}
          </p>
          <div>
            {unmet.map((m) => (
              <a key={m.id} href={`#/lesson/${m.id}`}>
                {m.title} →
              </a>
            ))}
          </div>
        </aside>
      )}
      {slide.kind === "quiz" ? (
        <Assessment
          key={`${module.id}-${authenticated}`}
          module={module}
          authenticated={authenticated}
          owner={owner}
          onComplete={() => onCheckpoint(module.id, slide.id, true)}
        />
      ) : slide.kind === "faq" ? (
        <section className="panel faq">
          <span className="eyebrow">CLEAR UP THE COMMON MIX-UPS</span>
          {slide.faqs?.map((f) => (
            <details key={f.question} open>
              <summary>{f.question}</summary>
              <p>{f.answer}</p>
            </details>
          ))}
        </section>
      ) : slide.kind === "comparison" ? (
        <>
          <section className="panel lesson-explanation">
            {slide.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </section>
          <Comparison />
        </>
      ) : (
        <div
          className={`lesson-split ${!slide.visual && !slide.runtime ? "text-lesson" : ""}`}
        >
          <section className="panel lesson-explanation">
            <span className="eyebrow">THE IDEA</span>
            {slide.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
            {slide.related?.map((link) => (
              <p key={link.moduleId}>
                <a href={`#/lesson/${link.moduleId}`}>{link.label} →</a>
              </p>
            ))}
            {slide.bullets && (
              <ul>
                {slide.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            )}
            {slide.exampleId && (
              <Suspense fallback={<p role="status">Opening example code…</p>}>
                <CodeExample key={slide.exampleId} id={slide.exampleId} />
              </Suspense>
            )}
          </section>
          {slide.visual ? (
            <ConceptVisual type={slide.visual} />
          ) : slide.runtime ? (
            <div className="panel">
              <Playground
                key={`${module.id}/${slide.id}`}
                slide={slide}
                loaded={loaded?.input}
                speed={loaded?.speed}
                onSave={onSave}
              />
            </div>
          ) : null}
        </div>
      )}
      <nav className="lesson-navigation" aria-label="Lesson page navigation">
        <button disabled={index === 0} onClick={() => go(index - 1)}>
          ← Previous
        </button>
        <div>
          <span>
            {completed.includes(slide.id)
              ? "✓ Page complete"
              : "Reading in progress"}
          </span>
          {!completed.includes(slide.id) && slide.kind !== "quiz" && (
            <button
              className="text-button"
              onClick={() => onCheckpoint(module.id, slide.id, true)}
            >
              Mark page complete
            </button>
          )}
        </div>
        {index < module.slides.length - 1 ? (
          <button className="primary" onClick={() => go(index + 1)}>
            Next →
          </button>
        ) : (
          <a className="button-link" href="#/">
            Back to topics
          </a>
        )}
      </nav>
    </article>
  );
}
