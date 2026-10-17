import { useState, useEffect, useRef } from "react";
import { api, type User } from "./api";
import { storage, lessonStorage, type ModuleProgress } from "./storage";
import { lessonById } from "./curriculum";
export function useLearning(user: User) {
  const [completed, setCompleted] = useState<Record<string, string[]>>({}),
    [positions, setPositions] = useState<Record<string, string>>({}),
    [message, setMessage] = useState(""),
    [ready, setReady] = useState(false),
    [readyOwner, setReadyOwner] = useState("");
  const [moduleProgress, setModuleProgress] = useState<
    Record<string, ModuleProgress>
  >({});
  const moduleRef = useRef(moduleProgress);
  moduleRef.current = moduleProgress;
  const chain = useRef(Promise.resolve());
  const owner = user.authenticated ? String(user.id) : "guest";
  const activeOwner = useRef(owner);
  activeOwner.current = owner;
  function valid(m: string, s: string) {
    return !!lessonById(m)?.slides.some((slide) => slide.id === s);
  }
  async function refresh(who = owner) {
    const states = Object.fromEntries(
      (await lessonStorage.modules())
        .filter((x) => x.owner === who)
        .map((x) => [x.moduleId, x]),
    );
    const slides = (await lessonStorage.slides()).filter(
      (x) =>
        x.owner === who &&
        x.completed &&
        valid(x.moduleId, x.slideId) &&
        (x.generation ?? 0) === (states[x.moduleId]?.generation ?? 0),
    );
    const places = (await lessonStorage.positions()).filter(
      (x) => x.owner === who && valid(x.moduleId, x.slideId),
    );
    if (activeOwner.current !== who) return;
    const next: Record<string, string[]> = {};
    for (const row of slides) (next[row.moduleId] ??= []).push(row.slideId);
    setModuleProgress(states);
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
    async function flushModules() {
      for (const row of (await lessonStorage.modules()).filter(
        (x) => x.owner === who && x.pending && x.action,
      )) {
        if (activeOwner.current !== who) return;
        try {
          const result = await api<{
            generation: number;
            manualCompleted: boolean;
          }>("/learning/modules/foundations/completion", "POST", row.action);
          await lessonStorage.acknowledgeModule(row, result);
        } catch (error) {
          if (
            (error as Error).message.includes(
              "Progress changed on another device",
            )
          ) {
            const current = await api<{
              items: {
                moduleId: string;
                generation: number;
                manualCompleted: boolean;
              }[];
            }>("/learning/modules");
            const server = current.items.find(
              (x) => x.moduleId === row.moduleId,
            );
            if (server) await lessonStorage.acknowledgeModule(row, server);
            await refresh(who);
          }
          throw error;
        }
      }
    }
    await flushModules();
    const modules = await api<{
      items: {
        moduleId: string;
        generation: number;
        manualCompleted: boolean;
      }[];
    }>("/learning/modules");
    for (const row of modules.items)
      await lessonStorage.putModule(
        {
          ...row,
          key: `${who}:${row.moduleId}`,
          owner: who,
          stamp: crypto.randomUUID(),
          pending: false,
        },
        true,
      );
    await lessonStorage.moveGuestToAccount(who);
    await flushModules();
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
        generation: row.generation ?? 0,
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
        generation:
          (await lessonStorage.modules()).find(
            (x) => x.owner === who && x.moduleId === row.moduleId,
          )?.generation ?? 0,
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
        generation:
          (await lessonStorage.modules()).find(
            (x) => x.owner === who && x.moduleId === row.moduleId,
          )?.generation ?? 0,
      });
      await lessonStorage.acknowledge("positions", row.key, row.stamp);
    }
    for (let page = 0; ; page++) {
      if (activeOwner.current !== who) return;
      const result = await api<{
        items: {
          moduleId: string;
          slideId: string;
          completed: boolean;
          generation: number;
        }[];
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
            row.generation,
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
          (await lessonStorage.modules()).find(
            (x) => x.owner === who && x.moduleId === row.moduleId,
          )?.generation ?? 0,
        );
    await refresh(who);
  }
  useEffect(() => {
    setReady(false);
    setCompleted({});
    setPositions({});
    setModuleProgress({});
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
      moduleRef.current[moduleId]?.generation ?? 0,
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
  async function setFoundationCompletion(complete: boolean) {
    const who = owner,
      old = moduleRef.current.foundations;
    const previousPages = completed.foundations ?? [];
    const generation = old?.generation ?? 0;
    const stamp = crypto.randomUUID();
    const row: ModuleProgress = {
      key: `${who}:foundations`,
      owner: who,
      moduleId: "foundations",
      generation: complete ? generation : generation + 1,
      manualCompleted: complete,
      stamp,
      pending: user.authenticated,
      action: user.authenticated
        ? { completed: complete, generation, actionId: stamp }
        : undefined,
    };
    moduleRef.current = { ...moduleRef.current, foundations: row };
    setModuleProgress(moduleRef.current);
    if (!complete) setCompleted((old) => ({ ...old, foundations: [] }));
    const saved = lessonStorage.putModule(row);
    void saved.catch(() => {});
    chain.current = chain.current
      .catch(() => {})
      .then(() => saved)
      .then(async () => {
        if (user.authenticated && activeOwner.current === who) await sync();
      })
      .catch((error) => {
        setMessage((error as Error).message);
      });
    try {
      await saved;
    } catch (error) {
      if (activeOwner.current === who) {
        setModuleProgress((current) => {
          const next = { ...current };
          if (old) next.foundations = old;
          else delete next.foundations;
          moduleRef.current = next;
          return next;
        });
        setCompleted((current) => ({ ...current, foundations: previousPages }));
        setMessage(
          `Completion could not be saved on this device. ${(error as Error).message}`,
        );
      }
    }
  }
  return {
    setFoundationCompletion,
    moduleProgress,
    completed,
    positions,
    checkpoint,
    sync,
    ready: ready && readyOwner === owner,
    message,
    setMessage,
    owner,
    isComplete: (id: string) =>
      !!moduleProgress[id]?.manualCompleted ||
      (completed[id]?.length ?? 0) === (lessonById(id)?.slides.length ?? -1),
  };
}
