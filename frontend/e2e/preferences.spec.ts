import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
const curriculum = JSON.parse(
  readFileSync("../content/curriculum.json", "utf8"),
);
const foundation = curriculum.modules.find((m: any) => m.id === "foundations");
const intro = (page: Page) =>
  page.getByRole("region", { name: "Foundations", exact: true });
async function home(page: Page) {
  await page
    .getByRole("link", { name: "DSA Learning Lab home", exact: true })
    .click();
}

test("manual Foundations completion is persistent, reversible and never fabricates pages or attempts", async ({
  page,
}) => {
  await page.goto("/");
  await expect(intro(page)).toBeVisible();
  await intro(page)
    .getByRole("button", { name: "Mark completed", exact: true })
    .click();
  await expect(intro(page)).toHaveCount(0);
  await page.reload();
  await expect(intro(page)).toHaveCount(0);
  await page.getByRole("link", { name: "Open Arrays", exact: true }).click();
  await expect(
    page.getByRole("complementary", { name: "Recommended prerequisites" }),
  ).toHaveCount(0);
  await home(page);
  await page.getByRole("link", { name: "Foundations →", exact: true }).click();
  await expect(
    page.getByText("0 / 13 pages complete", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Foundations completed.", { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Mark incomplete", exact: true })
    .click();
  await home(page);
  await expect(intro(page)).toBeVisible();
  await page.reload();
  await expect(intro(page)).toBeVisible();
  await page.getByRole("link", { name: "Foundations →", exact: true }).click();
  await page.getByRole("button", { name: "Next →", exact: true }).click();
  await home(page);
  await expect(intro(page)).toBeVisible();
});

test("normal Foundations completion requires every page and quiz participation; reset starts a new pass", async ({
  page,
}) => {
  await page.goto("/#/lesson/foundations/ideas");
  for (let i = 0; i < foundation.slides.length - 1; i++) {
    await expect(page.getByLabel("Lesson pages")).toHaveValue(
      foundation.slides[i].id,
    );
    await page.getByRole("button", { name: "Next →", exact: true }).click();
  }
  await expect(page.locator(".quiz fieldset")).toHaveCount(2);
  for (const field of await page.locator(".quiz fieldset").all())
    await field.getByRole("radio").first().check();
  await page.getByRole("button", { name: "Submit quiz" }).click();
  await expect(
    page.getByRole("region", { name: "Quiz results" }),
  ).toBeVisible();
  await expect(
    page.getByText("13 / 13 pages complete", { exact: true }),
  ).toBeVisible();
  await home(page);
  await expect(intro(page)).toHaveCount(0);
  await page.reload();
  await page.getByRole("link", { name: "Foundations →", exact: true }).click();
  await page
    .getByRole("button", { name: "Mark incomplete", exact: true })
    .click();
  await expect(
    page.getByText("0 / 13 pages complete", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Quiz results" }),
  ).toBeVisible();
  await page.getByLabel("Lesson pages").selectOption("ideas");
  await page.getByRole("button", { name: "Next →", exact: true }).click();
  await home(page);
  await expect(intro(page)).toBeVisible();
});

test("registration validates confirmation and minimum, sending only the original password", async ({
  page,
}) => {
  const requests: any[] = [];
  await page.route("**/api/auth/register", async (route) => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({
      status: 200,
      json: {
        authenticated: true,
        id: 987654,
        displayName: "Example",
        email: "new@example.test",
      },
    });
  });
  await page.goto("/#/account");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(
    page.getByLabel("Confirm password", { exact: true }),
  ).toHaveAttribute("autocomplete", "new-password");
  await page.getByLabel("Display name").fill("Example");
  await page.getByLabel("Email", { exact: true }).fill("new@example.test");
  await page.getByLabel("Password", { exact: true }).fill("abcd");
  await page.getByLabel("Confirm password", { exact: true }).fill("abcde");
  await page.getByRole("button", { name: "Register and sign in" }).click();
  await expect(
    page.getByText("Password must be at least 5 characters.", { exact: true }),
  ).toBeVisible();
  expect(requests).toHaveLength(0);
  await page.getByLabel("Password", { exact: true }).fill("abcde");
  await page.getByLabel("Confirm password", { exact: true }).fill("wrong");
  await page.getByRole("button", { name: "Register and sign in" }).click();
  await expect(
    page.getByText("Passwords do not match.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Confirm password", { exact: true }),
  ).toHaveAttribute("aria-describedby", "confirmation-error");
  expect(requests).toHaveLength(0);
  await expect(page.locator(".account")).not.toContainText(
    /uppercase|lowercase|special character|12–72|Use 5/i,
  );
  await page.getByLabel("Confirm password", { exact: true }).fill("abcde");
  await page.getByRole("button", { name: "Register and sign in" }).click();
  await expect.poll(() => requests.length).toBe(1);
  expect(Object.keys(requests[0]).sort()).toEqual([
    "displayName",
    "email",
    "password",
  ]);
  expect(requests[0].password).toBe("abcde");
});

for (const theme of ["light", "dark"] as const)
  test(`guest grading highlights only the selected wrong answer in ${theme} mode`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.goto("/#/lesson/arrays/quiz");
    const fields = page.locator(".quiz fieldset");
    await expect(fields).toHaveCount(2);
    await fields.nth(0).getByRole("radio").nth(0).check();
    await fields.nth(1).getByRole("radio").nth(0).check();
    await expect(page.locator(".selected-incorrect")).toHaveCount(0);
    await page.getByRole("button", { name: "Submit quiz" }).click();
    await expect(page.locator(".selected-incorrect")).toHaveCount(1);
    await expect(page.locator(".selected-incorrect")).toContainText(
      "Incorrect",
    );
    await expect(page.locator(".selected-incorrect input")).toBeChecked();
    await expect(page.locator(".selected-correct")).toHaveCount(1);
    await expect(
      page.getByRole("link", { name: /Review:/ }).first(),
    ).toBeVisible();
    const colors = await page.locator(".selected-incorrect").evaluate((el) => {
      const s = getComputedStyle(el);
      return { background: s.backgroundColor, border: s.borderColor };
    });
    expect(colors.background).not.toBe(colors.border);
    await page.getByRole("button", { name: "Retry quiz" }).click();
    await expect(
      page.locator(".selected-incorrect,.selected-correct"),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Submit quiz" }),
    ).toBeDisabled();
  });

test("theme initializes from the OS, tracks system changes, and persists explicit choices", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.addInitScript(() =>
    document.addEventListener("DOMContentLoaded", () => {
      (window as any).initialTheme = document.documentElement.dataset.theme;
    }),
  );
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  expect(await page.evaluate(() => (window as any).initialTheme)).toBe("dark");
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByRole("button", { name: "Dark mode", exact: true }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page
    .getByRole("button", { name: "Use system theme", exact: true })
    .click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.goto("/#/lesson/graph/bfs");
  await expect(
    page.getByRole("button", { name: "Step forward" }),
  ).toBeEnabled();
  const dark = await page
    .locator(".graph-visual circle")
    .first()
    .evaluate((el) => getComputedStyle(el).fill);
  await page.getByRole("button", { name: "Dark mode", exact: true }).click();
  const light = await page
    .locator(".graph-visual circle")
    .first()
    .evaluate((el) => getComputedStyle(el).fill);
  expect(light).not.toBe(dark);
  await expect(
    page.getByRole("button", { name: "Step forward" }),
  ).toBeEnabled();
});

test("authenticated Foundations completion merges once, resets safely and survives fresh browser storage", async ({
  page,
  browser,
}) => {
  test.skip(process.env.INTEGRATED !== "1", "Requires actual backend/MySQL");
  await page.goto("/");
  await intro(page)
    .getByRole("button", { name: "Mark completed", exact: true })
    .click();
  await page.getByRole("link", { name: "Sign in", exact: true }).click();
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  const email = `foundation-${Date.now()}-${Math.random().toString(16).slice(2)}@example.test`;
  await page.getByLabel("Display name").fill("Foundations Learner");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill("abcde");
  await page.getByLabel("Confirm password", { exact: true }).fill("abcde");
  await page.getByRole("button", { name: "Register and sign in" }).click();
  await expect(
    page.getByRole("heading", { name: "Welcome, Foundations Learner" }),
  ).toBeVisible();
  await expect
    .poll(async () => {
      const data = await (
        await page.request.get("/api/learning/modules")
      ).json();
      return data.items?.find((x: any) => x.moduleId === "foundations")
        ?.manualCompleted;
    })
    .toBe(true);
  const attempts = await (await page.request.get("/api/attempts")).json();
  expect(attempts.total).toBe(0);
  await home(page);
  await expect(intro(page)).toHaveCount(0);
  await page.reload();
  await expect(intro(page)).toHaveCount(0);
  // A new browser storage area restores the authenticated server flag, with no introductory flash while delayed.
  const context = await browser.newContext({
    storageState: await page.context().storageState(),
  });
  const fresh = await context.newPage();
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  await fresh.route("**/api/learning/modules", async (route) => {
    await gate;
    await route.continue();
  });
  await fresh.goto("/");
  await expect(fresh.getByLabel("Search topics")).toBeVisible();
  expect(await intro(fresh).count()).toBe(0);
  release();
  await fresh.getByRole("link", { name: "Foundations →", exact: true }).click();
  await expect(
    fresh.getByRole("button", { name: "Mark incomplete", exact: true }),
  ).toBeEnabled();
  await context.close();
  await page.getByRole("link", { name: "Foundations →", exact: true }).click();
  await page
    .getByRole("button", { name: "Mark incomplete", exact: true })
    .click();
  await expect
    .poll(async () => {
      const data = await (
        await page.request.get("/api/learning/modules")
      ).json();
      return data.items.find((x: any) => x.moduleId === "foundations")
        ?.generation;
    })
    .toBe(1);
  await home(page);
  await expect(intro(page)).toBeVisible();
  await page.reload();
  await expect(intro(page)).toBeVisible();
  await page.getByRole("link", { name: "Foundations →", exact: true }).click();
  await page.getByRole("button", { name: "Next →", exact: true }).click();
  await home(page);
  await expect(intro(page)).toBeVisible();
  expect((await (await page.request.get("/api/attempts")).json()).total).toBe(
    0,
  );
  await page.getByRole("link", { name: "Foundations →", exact: true }).click();
  for (let i = 1; i < foundation.slides.length - 1; i++) {
    await expect(page.getByLabel("Lesson pages")).toHaveValue(
      foundation.slides[i].id,
    );
    await page.getByRole("button", { name: "Next →", exact: true }).click();
  }
  await expect(page.locator(".quiz fieldset")).toHaveCount(6);
  for (const field of await page.locator(".quiz fieldset").all())
    await field.getByRole("radio").first().check();
  await page.getByRole("button", { name: "Submit quiz" }).click();
  await expect(
    page.getByRole("region", { name: "Quiz results" }),
  ).toBeVisible();
  await expect
    .poll(async () => {
      const data = await (
        await page.request.get("/api/learning/progress")
      ).json();
      return data.items.filter(
        (x: any) => x.moduleId === "foundations" && x.completed,
      ).length;
    })
    .toBe(13);
  await home(page);
  await expect(intro(page)).toHaveCount(0);
  await page.reload();
  await expect(intro(page)).toHaveCount(0);
  await page.getByRole("link", { name: "Foundations →", exact: true }).click();
  await page
    .getByRole("button", { name: "Mark incomplete", exact: true })
    .click();
  await expect
    .poll(async () => {
      const data = await (
        await page.request.get("/api/learning/modules")
      ).json();
      return data.items.find((x: any) => x.moduleId === "foundations")
        ?.generation;
    })
    .toBe(2);
  const history = await (await page.request.get("/api/attempts")).json();
  expect(history.total).toBe(1);
  const savedAttempt = await (
    await page.request.get(`/api/attempts/${history.items[0].id}`)
  ).json();
  expect(savedAttempt.answers).toHaveLength(6);
  await home(page);
  await expect(intro(page)).toBeVisible();
});

for (const theme of ["light", "dark"] as const)
  for (const width of [1440, 390])
    test(`readable responsive ${theme} surfaces at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme: theme });
      const contrast = (a: string, b: string) => {
        const luminance = (color: string) => {
          const rgb = color
            .match(/[\d.]+/g)!
            .slice(0, 3)
            .map(Number)
            .map((x) => {
              x /= 255;
              return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
            });
          return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
        };
        const x = luminance(a),
          y = luminance(b);
        return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
      };
      for (const route of [
        "",
        "lesson/arrays/basics",
        "lesson/arrays/insert",
        "lesson/graph/bfs",
        "lesson/bst/insert",
        "lesson/foundations/recursion",
        "account",
      ]) {
        await page.goto(`/#/${route}`);
        await expect(page.locator("main h1,main h2").first()).toBeVisible();
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
        ).toBe(true);
        const colors = await page.evaluate(() => {
          const s = getComputedStyle(document.documentElement),
            pairs = [
              ["text", "page"],
              ["text", "surface"],
              ["text-muted", "surface"],
              ["text-muted", "surface-green"],
              ["link", "surface"],
              ["error", "incorrect-bg"],
              ["on-accent", "accent"],
              ["viz-label", "viz-node"],
              ["viz-label", "viz-active"],
              ["code-comment", "code-bg"],
              ["code-keyword", "code-bg"],
            ];
          const node = document.createElement("span");
          document.body.append(node);
          const value = (name: string) => {
            node.style.color = s.getPropertyValue(`--${name}`);
            return getComputedStyle(node).color;
          };
          const result = pairs.map(([fg, bg]) => ({
            fg,
            bg,
            a: value(fg),
            b: value(bg),
          }));
          node.remove();
          return result;
        });
        for (const row of colors)
          expect(
            contrast(row.a, row.b),
            `${theme} ${row.fg}/${row.bg}`,
          ).toBeGreaterThanOrEqual(4.5);
      }
    });
