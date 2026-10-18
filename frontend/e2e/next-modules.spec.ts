import { test, expect } from "@playwright/test";
test("heap vertical slice executes and restores real priority state", async ({
  page,
}) => {
  await page.goto("/#/lesson/heaps/basics");
  await expect(
    page.getByRole("img", { name: "Heap array and complete binary tree" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Step forward", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Step backward", exact: true }),
  ).toBeEnabled();
  await page.getByLabel("Playback speed").press("Home");
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Complete" }).first(),
  ).toBeVisible();
});

for (const module of [
  {
    id: "hash-tables",
    slide: "tombstones",
    visual: "Linear probing slots and tombstones",
    result: "Tombstone",
  },
  {
    id: "recursion",
    slide: "branching",
    visual: "Recursive call state",
    result: "Total calls so far",
  },
  {
    id: "two-pointers",
    slide: "unique",
    visual: "Pointer positions and valid output prefix",
    result: "valid prefix length 3",
  },
  {
    id: "sliding-window",
    slide: "fixed-edges",
    visual: "Window boundaries and values",
    result: "best -7",
  },
])
  test(`${module.id} uses real execution, replay and local restoration`, async ({
    page,
  }) => {
    const api: string[] = [];
    await page.goto(`/#/lesson/${module.id}/${module.slide}`);
    await expect(page.getByLabel("Lesson pages")).toHaveValue(module.slide);
    await expect(page.getByLabel(module.visual, { exact: true })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Step forward", exact: true }),
    ).toBeEnabled();
    page.on("request", (req) => {
      if (req.url().includes("/api/")) api.push(req.url());
    });
    await page.getByLabel("Playback speed").press("Home");
    await page.getByRole("button", { name: "Play", exact: true }).click();
    await expect(
      page.getByRole("status").filter({ hasText: "Complete" }).first(),
    ).toBeVisible();
    await expect(page.locator(".next-visual")).toContainText(module.result);
    const completed = await page.locator(".next-visual").innerText();
    await page
      .getByRole("button", { name: "Step backward", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Step forward", exact: true })
      .click();
    await expect(page.locator(".next-visual")).toHaveText(completed, {
      useInnerText: true,
    });
    expect(api).toEqual([]);
    await page
      .getByRole("button", { name: "Mark page complete", exact: true })
      .click();
    await expect(
      page.getByRole("status", { name: "Page progress" }),
    ).toHaveText("✓ Page complete");
    await page.reload();
    await expect(page.getByLabel("Lesson pages")).toHaveValue(module.slide);
    await expect(
      page.getByRole("status", { name: "Page progress" }),
    ).toHaveText("✓ Page complete");
  });

test("new catalog tiles, lazy loading, validation, examples and quizzes", async ({
  page,
}) => {
  const loaded: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/engine/")) loaded.push(r.url());
  });
  await page.goto("/");
  for (const name of [
    "Hash Tables",
    "Heaps and Priority Queues",
    "Recursion",
    "Two Pointers",
    "Sliding Window",
  ])
    await expect(
      page.getByRole("link", { name: `Open ${name}`, exact: true }),
    ).toBeVisible();
  expect(loaded).toEqual([]);
  await page
    .getByRole("link", { name: "Open Two Pointers", exact: true })
    .click();
  await page.getByLabel("Lesson pages").selectOption("pair");
  await expect(
    page.getByRole("button", { name: "Step forward", exact: true }),
  ).toBeEnabled();
  expect(loaded.some((v) => v.endsWith("/next.wasm"))).toBe(true);
  expect(loaded.some((v) => v.endsWith("/engine.wasm"))).toBe(false);
  await page.getByLabel("Input values", { exact: true }).fill("3,1,2");
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("sorted");
  for (const language of ["C", "C++", "Java", "Python", "JavaScript"]) {
    await page.getByLabel("Programming language").selectOption(language);
    await expect(page.locator(".example-panel pre")).toContainText(
      language === "C" ? "pair_sum" : "pair",
    );
  }
  await page.getByLabel("Lesson pages").selectOption("quiz");
  await expect(page.locator(".quiz fieldset")).toHaveCount(3);
  for (const field of await page.locator(".quiz fieldset").all())
    await field.getByRole("radio").first().check();
  await page.getByRole("button", { name: "Submit quiz" }).click();
  await expect(
    page.getByRole("region", { name: "Quiz results" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Review:/ }).first(),
  ).toBeVisible();
  await page.goto("/#/lesson/sorting/heap-sort");
  await page
    .getByRole("link", {
      name: "Learn heaps and priority queues →",
      exact: true,
    })
    .click();
  await expect(page.getByLabel("Lesson pages")).toHaveValue("basics");
  await page.goto("/#/lesson/hash-tables/probe-update");
  await expect(
    page.getByRole("button", { name: "Step forward", exact: true }),
  ).toBeEnabled();
  await page.getByLabel("New value", { exact: true }).fill("4294967297");
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("range");
});

for (const theme of ["light", "dark"] as const)
  for (const width of [1440, 390])
    test(`new visuals fit ${theme} at ${width}px`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.setViewportSize({ width, height: 950 });
      for (const route of [
        "hash-tables/tombstones",
        "heaps/heap-sort",
        "recursion/branching",
        "two-pointers/unique",
        "sliding-window/variable",
      ]) {
        await page.goto(`/#/lesson/${route}`);
        await expect(page.locator(".next-visual")).toBeVisible();
        await expect(
          page.getByRole("button", { name: "Step forward", exact: true }),
        ).toBeEnabled();
        await page
          .getByRole("button", { name: "Step forward", exact: true })
          .click();
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
        ).toBe(true);
        expect(
          await page.locator(".next-visual").evaluate((el) => {
            const content = el.getBoundingClientRect(),
              viewport = el.closest(".visualization")!.getBoundingClientRect();
            return content.top >= viewport.top && content.left >= viewport.left;
          }),
        ).toBe(true);
        const colors = await page.locator(".next-visual").evaluate((el) => {
          const s = getComputedStyle(el);
          return [s.color, s.backgroundColor];
        });
        expect(colors[0]).not.toBe("rgba(0, 0, 0, 0)");
      }
    });

test("guest experiment restores new inputs, operation and language after refresh", async ({
  page,
}) => {
  await page.goto("/#/lesson/hash-tables/probe-update");
  await expect(
    page.getByRole("button", { name: "Step forward", exact: true }),
  ).toBeEnabled();
  await page.getByLabel("Input values", { exact: true }).fill("-1,90,7,80");
  await page.getByLabel("Key", { exact: true }).fill("7");
  await page.getByLabel("New value", { exact: true }).fill("99");
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Step forward", exact: true }),
  ).toBeEnabled();
  await page.getByLabel("Programming language").selectOption("Python");
  await page.getByText("Save or reuse this input", { exact: true }).click();
  await page.getByLabel("Experiment title").fill("Collision experiment");
  await page
    .getByRole("button", { name: "Save experiment", exact: true })
    .click();
  await expect(
    page.getByText("Experiment saved. Find it in Saved experiments.", {
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Saved experiments", exact: true })
    .click();
  await page.reload();
  await page
    .locator("article")
    .filter({
      has: page.getByRole("heading", {
        name: "Collision experiment",
        exact: true,
      }),
    })
    .getByRole("button", { name: "Load", exact: true })
    .click();
  await expect(page.getByLabel("Input values", { exact: true })).toHaveValue(
    "-1, 90, 7, 80",
  );
  await expect(page.getByLabel("New value", { exact: true })).toHaveValue("99");
  await expect(page.getByLabel("Programming language")).toHaveValue("Python");
});

test("accounts synchronize all new lessons and restore server experiments and graded review", async ({
  page,
  browser,
}) => {
  test.skip(process.env.INTEGRATED !== "1", "Requires actual backend/MySQL");
  await page.goto("/#/lesson/hash-tables/hashing");
  await page
    .getByRole("button", { name: "Mark page complete", exact: true })
    .click();
  await page.getByRole("link", { name: "Sign in", exact: true }).click();
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  const email = `next-${Date.now()}-${Math.random().toString(16).slice(2)}@example.test`;
  await page.getByLabel("Display name").fill("Next Learner");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill("abcde");
  await page.getByLabel("Confirm password", { exact: true }).fill("abcde");
  await page
    .getByRole("button", { name: "Register and sign in", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Welcome, Next Learner" }),
  ).toBeVisible();
  const routes = [
    "hash-tables/chaining",
    "heaps/insert",
    "recursion/factorial",
    "two-pointers/pair",
    "sliding-window/fixed",
  ];
  for (const route of routes) {
    await page.goto(`/#/lesson/${route}`);
    await expect(
      page.getByRole("button", { name: "Step forward", exact: true }),
    ).toBeEnabled();
    await page
      .getByRole("button", { name: "Mark page complete", exact: true })
      .click();
    await page.getByText("Save or reuse this input", { exact: true }).click();
    await page.getByLabel("Experiment title").fill(route);
    await page
      .getByRole("button", { name: "Save experiment", exact: true })
      .click();
    await expect(
      page.getByText("Experiment saved. Find it in Saved experiments.", {
        exact: true,
      }),
    ).toBeVisible();
    await page.getByLabel("Lesson pages").selectOption("quiz");
    await expect(page.locator(".quiz fieldset")).toHaveCount(5);
    for (const field of await page.locator(".quiz fieldset").all())
      await field.getByRole("radio").first().check();
    await page
      .getByRole("button", { name: "Submit quiz", exact: true })
      .click();
    await expect(
      page.getByRole("region", { name: "Quiz results" }),
    ).toContainText("Recorded result:");
    await expect(
      page.getByRole("link", { name: /Review:/ }).first(),
    ).toBeVisible();
  }
  await expect
    .poll(
      async () =>
        (await (await page.request.get("/api/attempts")).json()).total,
    )
    .toBe(5);
  const progress = await (
    await page.request.get("/api/learning/progress")
  ).json();
  for (const route of routes) {
    const [moduleId, slideId] = route.split("/");
    expect(
      progress.items.some(
        (r: any) =>
          r.moduleId === moduleId && r.slideId === slideId && r.completed,
      ),
    ).toBe(true);
  }
  const saved = await (await page.request.get("/api/experiments")).json();
  expect(saved.total).toBe(5);
  const context = await browser.newContext({
    storageState: await page.context().storageState(),
  });
  const fresh = await context.newPage();
  await fresh.goto("/#/library");
  await fresh
    .locator("article")
    .filter({
      has: fresh.getByRole("heading", { name: "heaps/insert", exact: true }),
    })
    .getByRole("button", { name: "Load", exact: true })
    .click();
  await expect(fresh.getByLabel("Lesson pages")).toHaveValue("insert");
  await expect(
    fresh.getByRole("img", { name: "Heap array and complete binary tree" }),
  ).toBeVisible();
  await context.close();
});

test("theme changes every new visualization palette without resetting the displayed step", async ({
  page,
}) => {
  for (const [route, selector] of [
    ["hash-tables/tombstones", ".hash-bucket"],
    ["heaps/insert", ".next-visual rect"],
    ["recursion/branching", ".call-frames li"],
    ["two-pointers/unique", ".next-visual rect"],
    ["sliding-window/variable", ".next-visual rect"],
  ]) {
    await page.goto(`/#/lesson/${route}`);
    await expect(
      page.getByRole("button", { name: "Step forward", exact: true }),
    ).toBeEnabled();
    await page
      .getByRole("button", { name: "Step forward", exact: true })
      .click();
    await expect(page.locator(selector).first()).toBeVisible();
    const surface = page.locator(selector).first();
    const color = () =>
      surface.evaluate((node) =>
        node instanceof SVGElement
          ? getComputedStyle(node).fill
          : getComputedStyle(node).backgroundColor,
      );
    const before = await color(),
      state = await page.locator(".next-visual").innerText();
    await page.getByRole("button", { name: "Dark mode", exact: true }).click();
    await expect.poll(color).not.toBe(before);
    await expect(page.locator(".next-visual")).toHaveText(state, {
      useInnerText: true,
    });
  }
});

test("recursive stack order and valid-prefix marking stay explicit", async ({
  page,
}) => {
  await page.goto("/#/lesson/recursion/factorial");
  for (let i = 0; i < 3; i++)
    await page
      .getByRole("button", { name: "Step forward", exact: true })
      .click();
  const frames = page.locator(".call-frames li");
  await expect(frames).toHaveCount(3);
  expect(
    await frames.nth(0).evaluate((el) => el.getBoundingClientRect().top),
  ).toBeLessThan(
    await frames.nth(2).evaluate((el) => el.getBoundingClientRect().top),
  );
  await expect(frames.nth(2)).toHaveClass("active-frame");
  await page.goto("/#/lesson/two-pointers/unique");
  await page.getByLabel("Playback speed").press("Home");
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Complete" }).first(),
  ).toBeVisible();
  await expect(page.locator('[data-result-prefix="true"]')).toHaveCount(3);
  await expect(page.locator('[data-result-prefix="false"] rect')).toHaveCount(
    2,
  );
  for (const rect of await page
    .locator('[data-result-prefix="false"] rect')
    .all())
    await expect(rect).toHaveAttribute("stroke-dasharray", "4 3");
});

// Hold the real transaction open, rather than relying on machine speed to expose
// the interval between a click, a successful put and a durable commit.
for (const action of ["Mark page complete", "Next →"]) {
  test(`${action} waits for the slide transaction and retains only explicit progress`, async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const gate = { hold: true, started: false, abort: false, armed: false };
      (window as any).slideWrite = gate;
      const put = IDBObjectStore.prototype.put;
      IDBObjectStore.prototype.put = function (value, ...args) {
        const request = put.call(this, value, ...args);
        if (
          gate.armed &&
          this.name === "slides" &&
          value.moduleId === "recursion" &&
          value.slideId === "branching" &&
          value.completed
        ) {
          gate.started = true;
          gate.armed = false;
          const store = this;
          function keepOpen() {
            if (gate.hold)
              store.get("__slide_transaction_gate__").onsuccess = keepOpen;
            else if (gate.abort) store.transaction.abort();
          }
          keepOpen();
        }
        return request;
      };
    });
    await page.goto("/#/lesson/recursion/branching");
    const mark = page.getByRole("button", {
      name: "Mark page complete",
      exact: true,
    });
    const next = page.getByRole("button", { name: "Next →", exact: true });
    await expect(mark).toBeEnabled();
    await page.evaluate(() => {
      (window as any).slideWrite.armed = true;
    });
    await page.getByRole("button", { name: action, exact: true }).click();
    await page.waitForFunction(() => (window as any).slideWrite.started);
    await expect(
      page.getByText("✓ Page complete", { exact: true }),
    ).toHaveCount(0);
    await expect(mark).toBeDisabled();
    await expect(next).toBeDisabled();
    await expect(page.getByLabel("Lesson pages")).toHaveValue("branching");
    // Aborted storage must not acknowledge completion or move to another page.
    await page.evaluate(() => {
      Object.assign((window as any).slideWrite, { hold: false, abort: true });
    });
    await expect(
      page.getByRole("status").filter({ hasText: "Progress could not" }),
    ).toBeVisible();
    await expect(mark).toBeEnabled();
    await expect(
      page.getByText("✓ Page complete", { exact: true }),
    ).toHaveCount(0);
    await expect(page.getByLabel("Lesson pages")).toHaveValue("branching");
    // Retry, release the gate, and immediately reload after the durable signal.
    await page.evaluate(() => {
      Object.assign((window as any).slideWrite, {
        hold: true,
        abort: false,
        started: false,
        armed: true,
      });
    });
    await page.getByRole("button", { name: action, exact: true }).click();
    await page.waitForFunction(() => (window as any).slideWrite.started);
    await expect(mark).toBeDisabled();
    await page.evaluate(() => {
      (window as any).slideWrite.hold = false;
    });
    if (action === "Next →") {
      await expect(page.getByLabel("Lesson pages")).not.toHaveValue(
        "branching",
      );
      await page.goBack();
    }
    await expect(
      page.getByText("✓ Page complete", { exact: true }),
    ).toBeVisible();
    await page.reload();
    await expect(page.getByLabel("Lesson pages")).toHaveValue("branching");
    await expect(
      page.getByText("✓ Page complete", { exact: true }),
    ).toBeVisible();
    await expectExplicitPageOnly(page, "recursion", "branching");
    await page
      .getByRole("button", { name: "Step forward", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Step backward", exact: true })
      .click();
    await page.getByRole("button", { name: "Reset", exact: true }).click();
    await page.reload();
    await expect(
      page.getByText("✓ Page complete", { exact: true }),
    ).toBeVisible();
    await expectExplicitPageOnly(page, "recursion", "branching");
  });
}

async function expectExplicitPageOnly(
  page: import("@playwright/test").Page,
  moduleId: string,
  slideId: string,
) {
  const saved = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("dsa-learning-lab", 3);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      const names = ["slides", "practice", "checkpoints", "modules"];
      return Object.fromEntries(
        await Promise.all(
          names.map(async (name) => [
            name,
            await new Promise<any[]>((resolve, reject) => {
              const request = db.transaction(name).objectStore(name).getAll();
              request.onsuccess = () => resolve(request.result);
              request.onerror = () => reject(request.error);
            }),
          ]),
        ),
      );
    } finally {
      db.close();
    }
  });
  expect(saved.slides.filter((row: any) => row.completed)).toEqual([
    expect.objectContaining({
      owner: "guest",
      moduleId,
      slideId,
      completed: true,
    }),
  ]);
  expect(saved.practice).toEqual([]);
  expect(saved.checkpoints).toEqual([]);
  expect(saved.modules).toEqual([]);
}

test("account page completion survives offline synchronization and delayed fresh restoration", async ({
  page,
  browser,
}) => {
  test.skip(process.env.INTEGRATED !== "1", "Requires Spring Boot and MySQL");
  await page.goto("/#/account");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await page.getByLabel("Display name").fill("Page Learner");
  await page
    .getByLabel("Email", { exact: true })
    .fill(
      `pages-${Date.now()}-${Math.random().toString(16).slice(2)}@example.test`,
    );
  await page.getByLabel("Password", { exact: true }).fill("page-passphrase");
  await page
    .getByLabel("Confirm password", { exact: true })
    .fill("page-passphrase");
  await page.getByRole("button", { name: "Register and sign in" }).click();
  await expect(
    page.getByRole("heading", { name: "Welcome, Page Learner" }),
  ).toBeVisible();
  await page.goto("/#/lesson/recursion/branching");
  const checkpointRoute = "**/api/learning/checkpoints";
  await page.route(checkpointRoute, (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        message: "Synchronization temporarily unavailable",
      }),
    }),
  );
  await page
    .getByRole("button", { name: "Mark page complete", exact: true })
    .click();
  await expect(page.getByRole("status", { name: "Page progress" })).toHaveText(
    "✓ Page complete",
  );
  await page.reload();
  await expect(page.getByLabel("Lesson pages")).toHaveValue("branching");
  await expect(page.getByRole("status", { name: "Page progress" })).toHaveText(
    "✓ Page complete",
  );
  await page.unroute(checkpointRoute);
  await page.getByRole("link", { name: "Page Learner", exact: true }).click();
  await page
    .getByRole("button", { name: "Sync checkpoints", exact: true })
    .click();
  await expect
    .poll(async () => {
      const progress = await (
        await page.request.get("/api/learning/progress")
      ).json();
      return progress.items
        .filter((row: any) => row.completed)
        .map((row: any) => `${row.moduleId}/${row.slideId}`);
    })
    .toEqual(["recursion/branching"]);
  expect((await (await page.request.get("/api/attempts")).json()).total).toBe(
    0,
  );
  // Only cookies transfer: a fresh IndexedDB must hydrate from the actual server.
  const fresh = await browser.newContext({
    storageState: await page.context().storageState(),
  });
  try {
    const restored = await fresh.newPage();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let started!: () => void;
    const waiting = new Promise<void>((resolve) => {
      started = resolve;
    });
    await restored.route("**/api/learning/progress?*", async (route) => {
      started();
      await gate;
      await route.continue();
    });
    await restored.goto("/#/lesson/recursion/branching");
    await waiting;
    try {
      await expect(
        restored.getByRole("status").filter({ hasText: "Opening your lesson" }),
      ).toBeVisible();
      await expect(
        restored.getByRole("button", {
          name: "Mark page complete",
          exact: true,
        }),
      ).toHaveCount(0);
    } finally {
      release();
    }
    await expect(restored.getByLabel("Lesson pages")).toHaveValue("branching");
    await expect(
      restored.getByRole("status", { name: "Page progress" }),
    ).toHaveText("✓ Page complete");
    await restored.reload();
    await expect(
      restored.getByRole("status", { name: "Page progress" }),
    ).toHaveText("✓ Page complete");
  } finally {
    await fresh.close();
  }
});
