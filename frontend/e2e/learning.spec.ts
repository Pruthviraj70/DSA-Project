import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
const curriculum = JSON.parse(
  readFileSync("../content/curriculum.json", "utf8"),
);

test("home uses accessible tiles with Foundations and two distinct catalog sections", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Foundations", exact: true, level: 2 }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Data Structures", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Algorithms", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".module-tile")).toHaveCount(14);
  await expect(page.locator("aside:not(.prerequisites)")).toHaveCount(0);
  const tile = page.getByRole("link", { name: "Open Arrays", exact: true });
  const box = await tile.boundingBox();
  expect(Math.abs(box!.height - box!.width)).toBeLessThan(2);
  await page.getByLabel("Search topics").fill("binary");
  await expect(
    page.getByRole("link", { name: "Open Searching" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Open Arrays", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("link", { name: "Open Searching" }).click();
  await expect(page).toHaveURL(/lesson\/searching\/basics/);
});

test("slide navigation, URL history, refresh and guest resume retain stable page IDs", async ({
  page,
}) => {
  await page.goto("/#/lesson/arrays/basics");
  await expect(page.getByText("Page 1 of 12", { exact: true })).toBeVisible();
  await expect(
    page.getByText("address(i) = base_address + i × element_size", {
      exact: false,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next →", exact: true }).click();
  await expect(page).toHaveURL(/arrays\/representation/);
  await page.getByLabel("Lesson pages").selectOption("insert");
  await page.reload();
  await expect(page.getByLabel("Lesson pages")).toHaveValue("insert");
  await page.getByRole("button", { name: "Mark page complete" }).click();
  await expect(
    page.getByText("✓ Page complete", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next →", exact: true }).click();
  await expect(page).toHaveURL(/arrays\/delete/);
  await page.goBack();
  await expect(page.getByLabel("Lesson pages")).toHaveValue("insert");
  await page
    .getByRole("link", { name: "DSA Learning Lab home", exact: true })
    .click();
  await page.getByRole("link", { name: "Open Arrays", exact: true }).click();
  await expect(page.getByLabel("Lesson pages")).toHaveValue("insert");
  await page.locator("h1").focus();
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByLabel("Lesson pages")).toHaveValue("traversal");
});

test("all five languages highlight, copy, switch variants and persist preferences", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/#/lesson/searching/binary");
  for (const [language, name] of [
    ["C", "binary_search"],
    ["C++", "binarySearch"],
    ["Java", "binarySearch"],
    ["Python", "def binary_search"],
    ["JavaScript", "function binarySearch"],
  ]) {
    await page.getByLabel("Programming language").selectOption(language);
    await expect(
      page.getByLabel(`${language} example code`, { exact: true }),
    ).toContainText(name);
    await expect(page.locator("pre .token.keyword").first()).toBeVisible();
  }
  await page.getByLabel("Programming language").selectOption("Python");
  await page
    .getByLabel("Example implementation", { exact: true })
    .selectOption("binary-first");
  await expect(page.locator("pre")).toContainText("def binary_first");
  await page.getByRole("button", { name: "Copy code" }).click();
  await expect(page.getByText("Example copied.")).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
    "def binary_first",
  );
  await page.reload();
  await expect(page.getByLabel("Programming language")).toHaveValue("Python");
  await page.getByLabel("Lesson pages").selectOption("linear");
  await expect(page.locator("pre")).toContainText("def linear_search");
});

test("guest quiz has feedback, review links, persistence and explicit unlimited retry", async ({
  page,
}) => {
  await page.goto("/#/lesson/arrays/faq");
  await expect(
    page.getByText("Is index 3 the same as value 3?", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next →", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Practice quiz", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Knowledge assumed by this quiz")).toBeVisible();
  for (const field of await page.locator(".quiz fieldset").all())
    await field.getByRole("radio").first().check();
  await page.getByRole("button", { name: "Submit quiz" }).click();
  await expect(
    page.getByRole("region", { name: "Quiz results" }),
  ).toContainText("Practice result: 1 / 2");
  await expect(
    page.getByRole("link", { name: /Review:/ }).first(),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("region", { name: "Quiz results" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Retry quiz" }).click();
  await expect(
    page.getByRole("button", { name: "Submit quiz" }),
  ).toBeDisabled();
});

test("logo returns home from lessons, quiz, account, progress and saved experiments", async ({
  page,
}) => {
  for (const route of [
    "lesson/arrays/access",
    "lesson/graph/quiz",
    "account",
    "progress",
    "library",
  ]) {
    await page.goto(`/#/${route}`);
    await expect(page.locator("main")).toBeVisible();
    await page
      .getByRole("link", { name: "DSA Learning Lab home", exact: true })
      .click();
    await expect(page.getByLabel("Search topics")).toBeVisible();
    await expect(page).toHaveURL(/#\/$/);
  }
});

test("every lesson page renders without learner-visible infrastructure or release labels", async ({
  page,
}) => {
  test.setTimeout(120000);
  for (const module of curriculum.modules)
    for (const slide of module.slides) {
      await page.goto(`/#/lesson/${module.id}/${slide.id}`);
      await expect(
        page.getByRole("heading", { name: slide.title, exact: true }),
      ).toBeVisible();
      await expect(page.locator("body")).not.toContainText(
        /\bengine\b|webassembly|\bwasm\b|powered by C|C17|\bv\d+\.\d+|loc=/i,
      );
      const labels = await page
        .locator("[aria-label],[title]")
        .evaluateAll((nodes) =>
          nodes
            .map((n) => n.getAttribute("aria-label") ?? n.getAttribute("title"))
            .join(" "),
        );
      expect(labels).not.toMatch(
        /\bengine\b|webassembly|\bwasm\b|C17|v\d+\.\d+/i,
      );
      await expect(page.locator("aside:not(.prerequisites)")).toHaveCount(0);
    }
});

for (const viewport of [
  { width: 1440, height: 1000 },
  { width: 390, height: 844 },
])
  test(`responsive home and lesson views at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    for (const route of [
      "",
      "lesson/arrays/basics",
      "lesson/arrays/insert",
      "lesson/graph/bfs",
      "lesson/graph/faq",
      "lesson/graph/quiz",
    ]) {
      await page.goto(`/#/${route}`);
      await expect(page.locator("h1")).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth + 1,
        ),
      ).toBe(true);
    }
  });

test("IndexedDB upgrade keeps earlier experiments and activity without completing new pages", async ({
  page,
}) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem("legacy-seeded")) return;
    sessionStorage.setItem("legacy-seeded", "yes");
    const r = indexedDB.open("dsa-learning-lab", 1);
    r.onupgradeneeded = () => {
      r.result.createObjectStore("checkpoints", { keyPath: "key" });
      r.result.createObjectStore("experiments", { keyPath: "id" });
    };
    r.onsuccess = () => {
      const tx = r.result.transaction(
        ["checkpoints", "experiments"],
        "readwrite",
      );
      tx.objectStore("checkpoints").put({
        key: "guest:arrays",
        owner: "guest",
        moduleId: "arrays",
        completion: 100,
      });
      tx.objectStore("experiments").put({
        id: "legacy-array",
        owner: "guest",
        title: "Earlier array experiment",
        moduleId: "arrays",
        engineVersion: "1.0.0",
        input: {
          module: 1,
          op: 3,
          values: [8, 2],
          index: 1,
          arg: 5,
          directed: false,
          edges: [],
          weight: 1,
        },
        configuration: { speed: 100 },
        createdAt: new Date().toISOString(),
      });
      tx.oncomplete = () => r.result.close();
    };
  });
  await page.goto("/#/progress");
  await expect(
    page.getByText("0 / 12 pages complete", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Saved experiments", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Earlier array experiment",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Load", exact: true }).click();
  await expect(page.getByLabel("Lesson pages")).toHaveValue("insert");
  await expect(page.getByLabel("Input values")).toHaveValue("8, 2");
  await expect(
    page.getByRole("button", { name: "Step forward" }),
  ).toBeEnabled();
  for (let i = 0; i < 2; i++)
    await page.getByRole("button", { name: "Step forward" }).click();
  await expect(
    page.getByRole("img", { name: "Arrays state: 8, 5, 2" }),
  ).toBeVisible();
});

test("graph editing validates restrictions and comparison runs three actual sorting visualizations", async ({
  page,
}) => {
  await page.goto("/#/lesson/graph/edit");
  await page.getByText("Edit vertices and edges", { exact: true }).click();
  await page.getByLabel("Node ID", { exact: true }).fill("8");
  await page.getByRole("button", { name: "Add node", exact: true }).click();
  await expect(page.getByText("Graph updated.")).toBeVisible();
  await expect(page.getByLabel("Input values")).toHaveValue(/8/);
  await page.getByLabel("Lesson pages").selectOption("dijkstra");
  await page.getByText("Edit vertices and edges", { exact: true }).click();
  await page.getByLabel("Weight", { exact: true }).fill("-1");
  await page.getByRole("button", { name: "Set edge", exact: true }).click();
  await expect(
    page.getByText(/Dijkstra requires nonnegative edge weights/),
  ).toBeVisible();
  await page.goto("/#/lesson/sorting/comparison");
  await page
    .getByRole("button", { name: "Run comparison", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Play comparison", exact: true })
    .click();
  await expect(
    page.getByRole("img", { name: "Insertion sort state: 1, 2, 2, 4, 5" }),
  ).toBeVisible({ timeout: 20000 });
  await expect(
    page.getByRole("img", { name: "Merge sort state: 1, 2, 2, 4, 5" }),
  ).toBeVisible({ timeout: 20000 });
  await expect(
    page.getByRole("img", { name: "Quicksort state: 1, 2, 2, 4, 5" }),
  ).toBeVisible({ timeout: 20000 });
});
