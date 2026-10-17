import { useState, useEffect, useRef } from "react";
import { api, type User } from "./api";
import {
  storage,
  lessonStorage,
  type SlideCheckpoint,
  type LessonPosition,
} from "./storage";
import { lessons, lessonById } from "./curriculum";
export function useLearning(user: User) {
  const [completed, setCompleted] = useState<Record<string, string[]>>({}),
    [positions, setPositions] = useState<Record<string, string>>({}),
    [message, setMessage] = useState(""),
    [ready, setReady] = useState(false),
    [readyOwner, setReadyOwner] = useState("");
  const chain = useRef(Promise.resolve());
  const owner = user.authenticated ? String(user.id) : "guest";
  const activeOwner = useRef(owner);
  activeOwner.current = owner;
  function valid(m: string, s: string) {
    return !!lessonById(m)?.slides.some((slide) => slide.id === s);
  }
  async function refresh(who = owner) {
    const slides = (await lessonStorage.slides()).filter(
      (x) => x.owner === who && x.completed && valid(x.moduleId, x.slideId),
    );
    const places = (await lessonStorage.positions()).filter(
      (x) => x.owner === who && valid(x.moduleId, x.slideId),
    );
    if (activeOwner.current !== who) return;
    const next: Record<string, string[]> = {};
    for (const row of slides) (next[row.moduleId] ??= []).push(row.slideId);
    setCompleted(next);
    setPositions(
      Object.fromEntries(places.map((p) => [p.moduleId, p.slideId])),
    );
  }
  async function sync() {
    const who = owner;
    if (activeOwner.current !== who) return;
    if (!user.authenticated) {
      await refresh(who);
      return;
    }
    // Preserve legacy activity without translating percentages to new slide completions.
    for (const legacy of (await storage.checkpoints()).filter(
      (x) => x.owner === "guest" || x.owner === who,
    )) {
      if (activeOwner.current !== who) return;
      const confirmed = await api<{ completion: number }>(
        "/progress/checkpoints",
        "POST",
        { moduleId: legacy.moduleId, completion: legacy.completion },
      );
      await storage.acknowledge(legacy.key, confirmed.completion);
    }
    if (activeOwner.current !== who) return;
    await lessonStorage.moveGuestToAccount(who);
    for (const row of (await lessonStorage.slides()).filter(
      (x) => x.owner === who && x.pending && valid(x.moduleId, x.slideId),
    )) {
      if (activeOwner.current !== who) return;
      await api("/learning/checkpoints", "POST", {
        moduleId: row.moduleId,
        slideId: row.slideId,
        completed: row.completed,
        position: false,
        seedPosition: false,
      });
      await lessonStorage.acknowledge("slides", row.key, row.stamp);
    }
    // Guest resume locations only seed accounts that have no location for that lesson.
    const localPositions = await lessonStorage.positions();
    for (const row of localPositions.filter(
      (x) =>
        x.owner === "guest" &&
        valid(x.moduleId, x.slideId) &&
        !localPositions.some(
          (p) => p.owner === who && p.moduleId === x.moduleId,
        ),
    )) {
      if (activeOwner.current !== who) return;
      await api("/learning/checkpoints", "POST", {
        moduleId: row.moduleId,
        slideId: row.slideId,
        completed: false,
        position: true,
        seedPosition: true,
      });
      await lessonStorage.acknowledge("positions", row.key, row.stamp);
    }
    for (const row of (await lessonStorage.positions()).filter(
      (x) => x.owner === who && x.pending && valid(x.moduleId, x.slideId),
    )) {
      if (activeOwner.current !== who) return;
      await api("/learning/checkpoints", "POST", {
        moduleId: row.moduleId,
        slideId: row.slideId,
        completed: false,
        position: true,
        seedPosition: false,
      });
      await lessonStorage.acknowledge("positions", row.key, row.stamp);
    }
    for (let page = 0; ; page++) {
      if (activeOwner.current !== who) return;
      const result = await api<{
        items: { moduleId: string; slideId: string; completed: boolean }[];
        total: number;
      }>(`/learning/progress?page=${page}&size=100`);
      for (const row of result.items)
        if (valid(row.moduleId, row.slideId))
          await lessonStorage.checkpoint(
            who,
            row.moduleId,
            row.slideId,
            row.completed,
            false,
            false,
          );
      if ((page + 1) * 100 >= result.total) break;
    }
    if (activeOwner.current !== who) return;
    const places = await api<{
      items: { moduleId: string; slideId: string }[];
    }>("/learning/positions");
    for (const row of places.items)
      if (valid(row.moduleId, row.slideId))
        await lessonStorage.checkpoint(
          who,
          row.moduleId,
          row.slideId,
          false,
          true,
          false,
        );
    await refresh(who);
  }
  useEffect(() => {
    setReady(false);
    setCompleted({});
    setPositions({});
    let cancelled = false;
    chain.current = chain.current
      .catch(() => {})
      .then(() => refresh(owner))
      .then(() => sync())
      .catch((e) => {
        if (!cancelled)
          setMessage(
            `Progress synchronization is pending. You can keep exploring. ${(e as Error).message}`,
          );
      })
      .finally(() => {
        if (!cancelled) {
          setReady(true);
          setReadyOwner(owner);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [owner]);
  function checkpoint(moduleId: string, slideId: string, complete = false) {
    if (complete)
      setCompleted((old) => ({
        ...old,
        [moduleId]: Array.from(new Set([...(old[moduleId] ?? []), slideId])),
      }));
    setPositions((old) => ({ ...old, [moduleId]: slideId }));
    const who = owner;
    // Persist immediately, even while an earlier network synchronization is still pending.
    const saved = lessonStorage.checkpoint(
      who,
      moduleId,
      slideId,
      complete,
      true,
      true,
    );
    void saved.catch(() => {}); // The queued handler below reports failures.
    chain.current = chain.current
      .catch(() => {})
      .then(() => saved)
      .then(async () => {
        if (user.authenticated && activeOwner.current === who) await sync();
      })
      .catch((e) =>
        setMessage(
          `Progress could not synchronize yet. Try Sync checkpoints from your account. ${(e as Error).message}`,
        ),
      );
  }
  return {
    completed,
    positions,
    checkpoint,
    sync,
    ready: ready && readyOwner === owner,
    message,
    setMessage,
    owner,
    isComplete: (id: string) =>
      (completed[id]?.length ?? 0) === (lessonById(id)?.slides.length ?? -1),
  };
}
