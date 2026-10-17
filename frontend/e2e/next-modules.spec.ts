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
    await page.reload();
    await expect(
      page.getByText("✓ Page complete", { exact: true }),
    ).toBeVisible();
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
