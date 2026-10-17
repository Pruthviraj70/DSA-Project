import { useState, useMemo } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-java";
import "prismjs/components/prism-python";
import examples from "../../content/examples.json";
const languages = ["C", "C++", "Java", "Python", "JavaScript"] as const;
type Language = (typeof languages)[number];
const grammar: Record<Language, string> = {
  C: "c",
  "C++": "cpp",
  Java: "java",
  Python: "python",
  JavaScript: "javascript",
};
export function CodeExample({ id }: { id: string }) {
  const bank = examples as Record<string, (typeof examples)["array-insert"]>;
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const value = localStorage.getItem("dsalab.exampleLanguage");
      return languages.includes(value as Language) ? (value as Language) : "C";
    } catch {
      return "C";
    }
  });
  const [variant, setVariant] = useState(id),
    [message, setMessage] = useState("");
  const example = bank[variant] ?? bank[id];
  const code = example.codes[language];
  const highlighted = useMemo(
    () =>
      Prism.highlight(
        code,
        Prism.languages[grammar[language]],
        grammar[language],
      ),
    [code, language],
  );
  const hints: Record<Language, string> = {
    C: "Pointers name storage. *p reads what p points to; a double pointer permits changing a caller’s head. NULL marks no node. Release owned allocations using the included cleanup function.",
    "C++":
      "References (&) allow changing a caller’s collection. nullptr means no node. Raw-node examples transfer ownership to the caller; use the included cleanup function.",
    Java: "Methods are in class Example. Use int[] for fixed sequences and ArrayList<Integer> for growable ones. null means no node; assign roots/heads returned by mutations.",
    Python:
      "Indentation groups statements. None means no node. Lists are growable collections; assign a returned head or root after changing a linked structure.",
    JavaScript:
      "const fixes a variable binding, not the contents of its array. null means no node. Arrays are growable collections; these examples explicitly show the algorithm’s movements.",
  };
  return (
    <section className="example-panel" aria-label="Example implementations">
      <div className="section-heading">
        <h3>Example code</h3>
        <button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(code);
              setMessage("Example copied.");
            } catch {
              setMessage(
                "Copy is unavailable here. Select the code text to copy it.",
              );
            }
          }}
        >
          Copy code
        </button>
      </div>
      <p className="muted">
        Example implementations. Changing the language changes this example
        only.
      </p>
      <div className="inline">
        <label>
          Programming language
          <select
            aria-label="Programming language"
            value={language}
            onChange={(e) => {
              const value = e.target.value as Language;
              setLanguage(value);
              setMessage("");
              try {
                localStorage.setItem("dsalab.exampleLanguage", value);
              } catch {
                setMessage(
                  "Language preference could not be saved on this device.",
                );
              }
            }}
          >
            {languages.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        {bank[id].alternatives.length > 0 && (
          <label>
            Implementation
            <select
              aria-label="Example implementation"
              value={variant}
              onChange={(e) => setVariant(e.target.value)}
            >
              {[id, ...bank[id].alternatives].map((x) => (
                <option key={x} value={x}>
                  {bank[x].title}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <h4>{example.title}</h4>
      <p className="language-hint">{hints[language]}</p>
      <pre tabIndex={0} aria-label={`${language} example code`}>
        <code
          className={`language-${grammar[language]}`}
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      </pre>
      <p role="status">{message}</p>
      <details>
        <summary>Preconditions, edge cases and cost</summary>
        <ul>
          {example.preconditions.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
        <p>
          <strong>Time:</strong> {example.time}
          <br />
          <strong>Space:</strong> {example.space}
        </p>
        {example.notes.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </details>
    </section>
  );
}
