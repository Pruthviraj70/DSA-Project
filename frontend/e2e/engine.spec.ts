import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
const fixtures = JSON.parse(
  readFileSync("../.build/engine-fixtures.json", "utf8"),
);
test("all released operations match native C traces through actual browser WebAssembly", async ({
  page,
}) => {
  await page.goto("/");
  const results = await page.evaluate(async (fixtures) => {
    // Runtime import uses the same public client class as the application.
    const { EngineClient } = await import(
      /* @vite-ignore */ "/src/engine-client.ts"
    );
    const results = [];
    for (const f of fixtures) {
      const c = new EngineClient();
      try {
        const events = [await c.init(f.input)];
        let done = false;
        while (!done) {
          const r = await c.advance(32);
          events.push(...r.events);
          done = r.done;
          if (events.length > 4096) throw Error("Unbounded events");
        }
        results.push(events);
      } finally {
        c.close();
      }
    }
    return results;
  }, fixtures);
  const source = JSON.parse(readFileSync("../.build/wasm/source.json", "utf8"));
  for (let i = 0; i < fixtures.length; i++) {
    expect(results[i], fixtures[i].id).toEqual(fixtures[i].trace);
    for (const event of results[i])
      expect(
        source.locations[event.loc],
        `source location ${event.loc}`,
      ).toBeGreaterThan(0);
  }
});
test("worker reset is deterministic, batches are bounded and cancellation rejects pending work", async ({
  page,
}) => {
  await page.goto("/");
  const result = await page.evaluate(
    async (input) => {
      const { EngineClient } = await import(
        /* @vite-ignore */ "/src/engine-client.ts"
      );
      const c = new EngineClient();
      const first = await c.init(input);
      const batch = await c.advance(99999);
      c.close();
      const second = new EngineClient();
      const reset = await second.init(input);
      second.close();
      const cancelled = new EngineClient();
      const pending = cancelled.init(input);
      cancelled.close();
      let rejected = false;
      try {
        await pending;
      } catch {
        rejected = true;
      }
      return { first, reset, length: batch.events.length, rejected };
    },
    fixtures.find((f: any) => f.id === "quick-sort").input,
  );
  expect(result.first).toEqual(result.reset);
  expect(result.length).toBeLessThanOrEqual(32);
  expect(result.rejected).toBe(true);
});
test("IndexedDB checkpoint updates and acknowledgement preserve newer progress", async ({
  page,
}) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { storage } = await import(/* @vite-ignore */ "/src/storage.ts");
    await Promise.all([
      storage.checkpoint("guest", "bst", 50),
      storage.checkpoint("guest", "bst", 75),
      storage.checkpoint("guest", "bst", 50),
    ]);
    const before = (await storage.checkpoints()).find(
      (x: any) => x.key === "guest:bst",
    );
    await storage.acknowledge("guest:bst", 50);
    const newerRetained = (await storage.checkpoints()).find(
      (x: any) => x.key === "guest:bst",
    );
    await storage.acknowledge("guest:bst", 75);
    const acknowledged = (await storage.checkpoints()).some(
      (x: any) => x.key === "guest:bst",
    );
    return {
      before: before?.completion,
      newerRetained: newerRetained?.completion,
      acknowledged,
    };
  });
  expect(result).toEqual({
    before: 75,
    newerRetained: 75,
    acknowledged: false,
  });
});

test("slide acknowledgements retain newer local updates and completion is monotonic", async ({
  page,
}) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { lessonStorage } = await import(
      /* @vite-ignore */ "/src/storage.ts"
    );
    await lessonStorage.checkpoint("guest", "arrays", "insert", false);
    const old = (await lessonStorage.slides()).find(
      (x: any) => x.key === "guest:arrays:insert",
    )!;
    await lessonStorage.checkpoint("guest", "arrays", "insert", true);
    await lessonStorage.acknowledge("slides", old.key, old.stamp);
    const pending = (await lessonStorage.slides()).find(
      (x: any) => x.key === old.key,
    )!;
    await lessonStorage.checkpoint("guest", "arrays", "insert", false);
    const final = (await lessonStorage.slides()).find(
      (x: any) => x.key === old.key,
    )!;
    return { pending: pending.pending, completed: final.completed };
  });
  expect(result).toEqual({ pending: true, completed: true });
});

test("a stale remote resume response cannot overwrite pending local navigation", async ({
  page,
}) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { lessonStorage } = await import(
      /* @vite-ignore */ "/src/storage.ts"
    );
    await lessonStorage.checkpoint("42", "arrays", "insert", true, true, true);
    await lessonStorage.checkpoint(
      "42",
      "arrays",
      "access",
      false,
      true,
      false,
    );
    const position = (await lessonStorage.positions()).find(
      (x: any) => x.key === "42:arrays",
    );
    return { slideId: position?.slideId, pending: position?.pending };
  });
  expect(result).toEqual({ slideId: "insert", pending: true });
});

test("revisiting old guest pages cannot undo an acknowledged account reset", async ({
  page,
}) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { lessonStorage } = await import(
      /* @vite-ignore */ "/src/storage.ts"
    );
    await lessonStorage.checkpoint("guest", "foundations", "ideas", true);
    await lessonStorage.moveGuestToAccount("receipt-test");
    await lessonStorage.putModule({
      key: "receipt-test:foundations",
      owner: "receipt-test",
      moduleId: "foundations",
      generation: 1,
      manualCompleted: false,
      pending: false,
      stamp: crypto.randomUUID(),
    });
    await lessonStorage.checkpoint("guest", "foundations", "ideas", false);
    await lessonStorage.moveGuestToAccount("receipt-test");
    const afterVisit = (await lessonStorage.slides()).filter(
      (x: any) =>
        x.owner === "receipt-test" && x.generation === 1 && x.completed,
    ).length;
    await lessonStorage.checkpoint("guest", "foundations", "ideas", true);
    await lessonStorage.moveGuestToAccount("receipt-test");
    const afterExplicitCompletion = (await lessonStorage.slides()).filter(
      (x: any) =>
        x.owner === "receipt-test" && x.generation === 1 && x.completed,
    ).length;
    return { afterVisit, afterExplicitCompletion };
  });
  expect(result).toEqual({ afterVisit: 0, afterExplicitCompletion: 1 });
});
