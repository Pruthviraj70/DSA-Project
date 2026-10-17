import { useEffect, useState } from "react";
declare global {
  interface Window {
    dsaSetTheme: (value: "light" | "dark" | "system") => void;
  }
}
export function ThemeToggle() {
  const [theme, setTheme] = useState(
    document.documentElement.dataset.theme ?? "light",
  );
  const [system, setSystem] = useState(() => {
    try {
      return !["light", "dark"].includes(
        localStorage.getItem("dsalab.theme") ?? "",
      );
    } catch {
      return true;
    }
  });
  useEffect(() => {
    const changed = () => {
      setTheme(document.documentElement.dataset.theme ?? "light");
      try {
        setSystem(
          !["light", "dark"].includes(
            localStorage.getItem("dsalab.theme") ?? "",
          ),
        );
      } catch {}
    };
    window.addEventListener("dsalab-theme-applied", changed);
    return () => window.removeEventListener("dsalab-theme-applied", changed);
  }, []);
  return (
    <div className="theme-controls" role="group" aria-label="Color theme">
      <button
        aria-label="Dark mode"
        aria-pressed={theme === "dark"}
        onClick={() => window.dsaSetTheme(theme === "dark" ? "light" : "dark")}
      >
        {theme === "dark" ? "☾ Dark" : "☀ Light"}
      </button>
      {!system && (
        <button
          className="system-theme"
          onClick={() => window.dsaSetTheme("system")}
          aria-label="Use system theme"
        >
          Auto
        </button>
      )}
    </div>
  );
}
