import { useState, useEffect, useRef } from "react";
import { modules, registry } from "./registry";
import {
  lessons,
  lessonById,
  parseLocation,
  lessonHref,
  slideForExperiment,
  type Location,
} from "./curriculum";
import { Home, ModuleIcon } from "./Home";
import { Lesson } from "./Lesson";
import { Account } from "./Account";
import { Library, type SavedExperiment } from "./Library";
import { api, type User } from "./api";
import { storage } from "./storage";
import { useLearning } from "./useLearning";
import type { Input } from "./protocol";
import "./styles.css";
export default function App() {
  const [location, setLocation] = useState<Location>(() =>
      parseLocation(window.location.hash),
    ),
    [user, setUser] = useState<User>(),
    [notice, setNotice] = useState(""),
    [loaded, setLoaded] = useState<{
      owner: string;
      moduleId: string;
      slideId: string;
      input: Input;
      speed: number;
    }>();
  const learning = useLearning(user ?? { authenticated: false });
  const checkpoint = useRef(learning.checkpoint);
  checkpoint.current = learning.checkpoint;
  useEffect(() => {
    const changed = () => setLocation(parseLocation(window.location.hash));
    window.addEventListener("hashchange", changed);
    return () => window.removeEventListener("hashchange", changed);
  }, []);
  useEffect(() => {
    let active = true;
    api<User>("/auth/me")
      .then((u) => {
        if (active) setUser(u);
      })
      .catch(() => {
        if (active) setUser({ authenticated: false });
      });
    return () => {
      active = false;
    };
  }, []);
  const module = lessonById(location.moduleId ?? "");
  const slide = module?.slides.find((s) => s.id === location.slideId);
  useEffect(() => {
    if (!user || !learning.ready || location.page !== "lesson" || !module)
      return;
    if (!slide) {
      const resume = learning.positions[module.id];
      const target = module.slides.some((s) => s.id === resume)
        ? resume
        : module.slides[0].id;
      window.history.replaceState(null, "", lessonHref(module.id, target));
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    }
  }, [
    location.page,
    location.moduleId,
    location.slideId,
    learning.ready,
    user?.id,
    user?.authenticated,
  ]);
  useEffect(() => {
    if (user && learning.ready && module && slide)
      checkpoint.current(module.id, slide.id, false);
  }, [module?.id, slide?.id, learning.ready, user?.id, user?.authenticated]);
  async function save(input: Input, title: string, speed: number) {
    const runtime = modules.find((m) => m.engineId === input.module)!;
    const owner = user?.authenticated ? String(user.id) : "guest";
    const value = {
      id: crypto.randomUUID(),
      owner,
      title,
      moduleId: runtime.id,
      input,
      configuration: { speed },
      engineVersion: registry.engineVersion,
      createdAt: new Date().toISOString(),
    };
    await storage.saveExperiment(value);
    if (user?.authenticated) {
      try {
        await api("/experiments", "POST", {
          moduleId: value.moduleId,
          title,
          input,
          configuration: value.configuration,
          engineVersion: value.engineVersion,
        });
      } catch (e) {
        throw Error(
          `Saved on this device. Upload pending: ${(e as Error).message}`,
        );
      }
    }
  }
  function load(saved: SavedExperiment) {
    if (!["1.0.0", "1.1.0"].includes(saved.engineVersion)) {
      setNotice(
        "This saved experiment needs a newer application. Your saved copy is unchanged.",
      );
      return;
    }
    const target = slideForExperiment(saved.input);
    if (!target) {
      setNotice(
        "This saved topic is not available in the current lessons. Your saved copy is unchanged.",
      );
      return;
    }
    setLoaded({
      owner: learning.owner,
      ...target,
      input: saved.input,
      speed: saved.configuration.speed,
    });
    window.location.hash = lessonHref(target.moduleId, target.slideId).slice(1);
  }
  return (
    <div className="app-shell">
      <a
        className="skip-link"
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main")?.focus();
        }}
      >
        Skip to content
      </a>
      <header className="site-header">
        <a className="brand" href="#/" aria-label="DSA Learning Lab home">
          <span className="brand-mark" aria-hidden="true">
            dsa<span>→</span>
          </span>
          <span>
            DSA <strong>Learning Lab</strong>
          </span>
        </a>
        <nav aria-label="Main navigation">
          <a
            href="#/"
            aria-current={location.page === "home" ? "page" : undefined}
          >
            Topics
          </a>
          <a
            href="#/progress"
            aria-current={location.page === "progress" ? "page" : undefined}
          >
            Progress
          </a>
          <a
            href="#/library"
            aria-current={location.page === "library" ? "page" : undefined}
          >
            Saved experiments
          </a>
          <a
            className="account-link"
            href="#/account"
            aria-current={location.page === "account" ? "page" : undefined}
          >
            <span className="avatar" aria-hidden="true">
              {user?.displayName?.[0]?.toUpperCase() ?? "G"}
            </span>
            {user?.authenticated ? user.displayName : "Sign in"}
          </a>
        </nav>
      </header>
      <main id="main" tabIndex={-1}>
        {(notice || learning.message) && (
          <div className="notice" role="status">
            {notice || learning.message}
            <button
              aria-label="Dismiss notification"
              onClick={() => {
                setNotice("");
                learning.setMessage("");
              }}
            >
              ×
            </button>
          </div>
        )}
        {location.page === "home" ? (
          <Home completed={learning.completed} positions={learning.positions} />
        ) : location.page === "account" ? (
          <Account
            user={user ?? { authenticated: false }}
            onUser={async (u) => {
              setUser(u);
            }}
            onSync={learning.sync}
          />
        ) : location.page === "library" ? (
          <Library
            key={learning.owner}
            user={user ?? { authenticated: false }}
            onLoad={load}
          />
        ) : location.page === "progress" ? (
          <section className="progress-page">
            <span className="eyebrow">KEEP GOING, AT YOUR PACE</span>
            <h1>Your learning</h1>
            <p>
              Complete a page as you read, or use Next to mark it complete. Quiz
              completion records participation; the result shows understanding.
              Earlier activity is preserved, while newly authored pages start
              unread.
            </p>
            <div className="progress-grid">
              {lessons.map((m) => (
                <article className="panel" key={m.id}>
                  <ModuleIcon kind={m.icon} />
                  <h2>{m.title}</h2>
                  <p>
                    {learning.completed[m.id]?.length ?? 0} / {m.slides.length}{" "}
                    pages complete
                  </p>
                  <progress
                    aria-label={`${m.title} page completion`}
                    max={m.slides.length}
                    value={learning.completed[m.id]?.length ?? 0}
                  />
                  <a href={`#/lesson/${m.id}`}>Continue lesson →</a>
                </article>
              ))}
            </div>
          </section>
        ) : module && slide && user && learning.ready ? (
          <Lesson
            key={`${module.id}/${slide.id}`}
            module={module}
            slide={slide}
            completed={learning.completed[module.id] ?? []}
            isComplete={learning.isComplete}
            onCheckpoint={learning.checkpoint}
            authenticated={user.authenticated}
            owner={learning.owner}
            loaded={
              loaded?.owner === learning.owner &&
              loaded.moduleId === module.id &&
              loaded.slideId === slide.id
                ? loaded
                : undefined
            }
            onSave={save}
          />
        ) : (
          <p role="status" className="loading">
            Opening your lesson…
          </p>
        )}
      </main>
      <footer className="page-footer">
        <a href="#/">DSA Learning Lab</a>
        <span>Explore. Predict. Understand.</span>
      </footer>
    </div>
  );
}
