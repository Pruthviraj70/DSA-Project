import { useEffect, useState } from "react";
import type { Module } from "./registry";
import { api } from "./api";
interface Question {
  revisionId: number;
  questionId: number;
  prompt: string;
  options: { id: number; text: string }[];
}
export function Assessment({
  module,
  authenticated,
  onPass,
}: {
  module: Module;
  authenticated: boolean;
  onPass: () => void;
}) {
  const [questions, setQuestions] = useState<Question[]>([]),
    [answers, setAnswers] = useState<Record<number, number>>({}),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    let cancelled = false;
    setAnswers({});
    setMessage("");
    setQuestions([]);
    if (authenticated)
      api<Question[]>(`/modules/${module.id}/questions`)
        .then((q) => {
          if (!cancelled) setQuestions(q);
        })
        .catch((e) => {
          if (!cancelled) setMessage(e.message);
        });
    else
      setQuestions([
        {
          revisionId: module.engineId,
          questionId: module.engineId,
          prompt: module.question.prompt,
          options: module.question.options.map((text, id) => ({ id, text })),
        },
      ]);
    return () => {
      cancelled = true;
    };
  }, [module, authenticated]);
  async function submit() {
    setBusy(true);
    try {
      if (authenticated) {
        const result = await api<{
          score: number;
          total: number;
          feedback: {
            correct: boolean;
            explanation: string;
            correctAnswer: string;
          }[];
        }>("/attempts", "POST", {
          moduleId: module.id,
          answers: questions.map((q) => ({
            revisionId: q.revisionId,
            optionId: answers[q.revisionId],
          })),
        });
        setMessage(
          `Official score: ${result.score}/${result.total}. ${result.feedback.map((f) => `${f.correct ? "Correct." : `Correct answer: ${f.correctAnswer}.`} ${f.explanation}`).join(" ")}`,
        );
        if (result.score === result.total) onPass();
      } else {
        const correct = answers[module.engineId] === module.question.correct;
        setMessage(
          `Practice result: ${correct ? "Correct" : "Try again"}. ${module.question.explanation} Sign in for a server-graded official attempt.`,
        );
        if (correct) onPass();
      }
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel assessment">
      <span className="eyebrow">CHECK YOUR UNDERSTANDING</span>
      <h3>{authenticated ? "Official assessment" : "Guest practice"}</h3>
      <p className="muted">
        {authenticated
          ? "Your answers are graded and saved by the server."
          : "Practice stays on this device. Official grading is available after sign-in."}
      </p>
      {questions.map((q) => (
        <fieldset key={q.revisionId}>
          <legend>{q.prompt}</legend>
          {q.options.map((option) => (
            <label className="answer-option" key={option.id}>
              <input
                type="radio"
                name={`q-${q.revisionId}`}
                value={option.id}
                checked={answers[q.revisionId] === option.id}
                onChange={() =>
                  setAnswers({ ...answers, [q.revisionId]: option.id })
                }
              />
              {option.text}
            </label>
          ))}
        </fieldset>
      ))}
      <button
        disabled={
          busy ||
          !questions.length ||
          questions.some((q) => answers[q.revisionId] === undefined)
        }
        onClick={() => void submit()}
      >
        {busy ? "Grading…" : "Check answer"}
      </button>
      <p role="status">{message}</p>
    </section>
  );
}
