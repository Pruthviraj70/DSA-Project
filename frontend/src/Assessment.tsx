import { useState, useEffect } from "react";
import bank from "../../content/practice.json";
import type { LessonModule } from "./curriculum";
import { reviewFor, lessonHref } from "./curriculum";
import { api } from "./api";
import { lessonStorage } from "./storage";
interface Question {
  key: string;
  prompt: string;
  concepts: string[];
  revisionId?: number;
  options: { key: string; text: string }[];
}
interface Feedback {
  revisionId?: number;
  questionKey?: string;
  correct: boolean;
  correctAnswer: string;
  explanation: string;
  review: { moduleId: string; slideId: string; title: string }[];
}
interface Result {
  score: number;
  total: number;
  feedback: Feedback[];
  practiceRevision?: string;
}
export function Assessment({
  module,
  authenticated,
  owner,
  onComplete,
}: {
  module: LessonModule;
  authenticated: boolean;
  owner: string;
  onComplete: () => void;
}) {
  const [questions, setQuestions] = useState<Question[]>([]),
    [answers, setAnswers] = useState<Record<string, string>>({}),
    [result, setResult] = useState<Result>(),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [retry, setRetry] = useState(0);
  const practice = (bank as Record<string, typeof bank.arrays>)[module.id];
  const practiceRevision = practice
    .map((p) => `${p.id}:${p.revision}`)
    .join("|");
  useEffect(() => {
    let active = true;
    setQuestions([]);
    setAnswers({});
    setResult(undefined);
    setError("");
    if (authenticated)
      api<
        {
          revisionId: number;
          prompt: string;
          concepts: string[];
          options: { id: number; text: string }[];
        }[]
      >(`/modules/${module.id}/questions`)
        .then((rows) => {
          if (active)
            setQuestions(
              rows.map((q) => ({
                key: String(q.revisionId),
                revisionId: q.revisionId,
                prompt: q.prompt,
                concepts: q.concepts ?? [],
                options: q.options.map((o) => ({
                  key: String(o.id),
                  text: o.text,
                })),
              })),
            );
        })
        .catch((e) => {
          if (active) setError(e.message);
        });
    else {
      setQuestions(
        practice.map((q) => ({
          key: q.id,
          prompt: q.prompt,
          concepts: q.concepts,
          options: q.options.map((text, i) => ({ key: String(i), text })),
        })),
      );
      if (retry === 0)
        lessonStorage
          .loadPractice(owner, module.id)
          .then((saved) => {
            const r = saved?.result as Result | undefined;
            if (
              active &&
              !saved?.retrying &&
              r?.practiceRevision === practiceRevision
            ) {
              setAnswers(saved!.answers);
              setResult(r);
            }
          })
          .catch(() => {});
    }
    return () => {
      active = false;
    };
  }, [module.id, authenticated, retry, owner]);
  async function submit() {
    setBusy(true);
    setError("");
    try {
      let value: Result;
      if (authenticated)
        value = await api<Result>("/attempts", "POST", {
          moduleId: module.id,
          answers: questions.map((q) => ({
            revisionId: q.revisionId,
            optionId: Number(answers[q.key]),
          })),
        });
      else {
        const feedback = practice.map((q) => ({
          questionKey: q.id,
          correct: Number(answers[q.id]) === q.correctIndex,
          correctAnswer: q.options[q.correctIndex],
          explanation: q.explanation,
          review: reviewFor(q.concepts),
        }));
        value = {
          score: feedback.filter((f) => f.correct).length,
          total: feedback.length,
          feedback,
          practiceRevision,
        };
        await lessonStorage.savePractice(owner, module.id, answers, value);
      }
      setResult(value);
      onComplete();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="quiz panel">
      <span className="eyebrow">PUT THE IDEAS TO WORK</span>
      <h2>{authenticated ? "Module quiz" : "Practice quiz"}</h2>
      <p>
        {authenticated
          ? "Your submitted answers are graded and recorded for your account."
          : "Practice feedback stays on this device. Sign in to take a separate recorded quiz."}{" "}
        You may retry as often as you need. Each recorded submission creates a
        new attempt; earlier results stay unchanged.
      </p>
      {!questions.length && !error && <p role="status">Loading questions…</p>}
      {questions.map((q, i) => {
        const feedback = result?.feedback.find((f) =>
          q.revisionId
            ? f.revisionId === q.revisionId
            : f.questionKey === q.key,
        );
        return (
          <fieldset key={q.key}>
            <legend>
              {i + 1}. {q.prompt}
            </legend>
            {q.options.map((o) => (
              <label
                key={o.key}
                className={`answer-option ${feedback && answers[q.key] === o.key ? (feedback.correct ? "selected-correct" : "selected-incorrect") : ""}`}
              >
                <input
                  type="radio"
                  name={`quiz-${q.key}`}
                  value={o.key}
                  checked={answers[q.key] === o.key}
                  disabled={!!result || busy}
                  onChange={() =>
                    setAnswers((old) => ({ ...old, [q.key]: o.key }))
                  }
                />
                <span>{o.text}</span>
                {feedback && answers[q.key] === o.key && (
                  <strong className="answer-indicator">
                    {feedback.correct ? "Correct" : "Incorrect"}
                  </strong>
                )}
              </label>
            ))}
            {result && answers[q.key] === undefined && (
              <p className="unanswered">Unanswered</p>
            )}
          </fieldset>
        );
      })}
      {!result && (
        <button
          className="primary"
          disabled={
            busy ||
            questions.length === 0 ||
            questions.some((q) => answers[q.key] === undefined)
          }
          onClick={() => void submit()}
        >
          {busy ? "Checking answers…" : "Submit quiz"}
        </button>
      )}
      {result && (
        <div className="quiz-result" role="region" aria-label="Quiz results">
          <h3>
            {authenticated ? "Recorded result" : "Practice result"}:{" "}
            {result.score} / {result.total}
          </h3>
          {result.feedback.map((feedback, i) => (
            <article
              className="feedback-card"
              key={feedback.revisionId ?? feedback.questionKey ?? i}
            >
              <h4>
                Question {i + 1}:{" "}
                {feedback.correct ? "Correct" : "Review this idea"}
              </h4>
              <p>
                <strong>Answer:</strong> {feedback.correctAnswer}
              </p>
              <p>{feedback.explanation}</p>
              <div className="review-links">
                {feedback.review.map((link) => (
                  <a
                    key={`${link.moduleId}/${link.slideId}`}
                    href={lessonHref(link.moduleId, link.slideId)}
                  >
                    Review: {link.title}
                  </a>
                ))}
              </div>
            </article>
          ))}
          <button
            onClick={async () => {
              if (!authenticated) {
                try {
                  await lessonStorage.beginPracticeRetry(owner, module.id);
                } catch (error) {
                  setError((error as Error).message);
                  return;
                }
              }
              setResult(undefined);
              setAnswers({});
              setQuestions([]);
              setRetry((x) => x + 1);
            }}
          >
            Retry quiz
          </button>
          <p>
            Your previous submission is kept; a retry starts with unanswered
            questions.
          </p>
        </div>
      )}
      <p className="error" role="alert">
        {error}
      </p>
    </section>
  );
}
